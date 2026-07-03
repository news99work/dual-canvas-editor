// ── Export Service — any render pipeline ──
import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs/promises';
import sharp, { type OverlayOptions } from 'sharp';
import { config } from '../config.js';
import { canvasStateSchema } from '../schemas/canvas-state.schema.js';
import type { ExportJob, ExportFormat, ExportQuality } from '../types/export.js';
import { ExportJobStatus } from '../types/export.js';

// ── In-memory job store ──
const jobs = new Map<string, ExportJob>();
const hashIndex = new Map<string, string>(); // sha256 → jobId

// ── Concurrency control ──
let activeExports = 0;
const MAX_CONCURRENT = 2;

/** Look up a job by its SHA-256 hash (idempotency) */
export function findJobByHash(hash: string): ExportJob | undefined {
  const jobId = hashIndex.get(hash);
  if (!jobId) return undefined;
  return jobs.get(jobId);
}

/** Get a job by ID */
export function getJob(id: string): ExportJob | undefined {
  return jobs.get(id);
}

/** Remove expired jobs from the store */
export function purgeExpiredJobs(): number {
  const now = Date.now();
  let count = 0;
  for (const [id, job] of jobs) {
    if (new Date(job.expiresAt).getTime() < now) {
      jobs.delete(id);
      hashIndex.delete(job.hash);
      count++;
    }
  }
  return count;
}

/** Clear all jobs — used in tests */
export function clearAllJobs(): void {
  jobs.clear();
  hashIndex.clear();
}

/**
 * Start an export job.
 * Computes SHA-256 hash, checks idempotency, then queues for processing.
 */
export async function startExport(
  rawCanvasState: unknown,
  format: ExportFormat,
  quality: ExportQuality,
): Promise<{ job: ExportJob; isNew: boolean }> {
  // Validate canvas state
  const parsed = canvasStateSchema.safeParse(rawCanvasState);
  if (!parsed.success) {
    const messages = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
    throw Object.assign(new Error('Invalid canvas state'), {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      details: messages,
    });
  }

  const hash = crypto
    .createHash('sha256')
    .update(JSON.stringify(parsed.data))
    .update(format)
    .update(quality)
    .digest('hex');

  // Check idempotency
  const existing = findJobByHash(hash);
  if (existing && existing.status !== ExportJobStatus.Failed) {
    return { job: existing, isNew: false };
  }

  // Create job
  const now = new Date();
  const expiresAt = new Date(now.getTime() + config.exportRetentionMs);
  const job: ExportJob = {
    id: crypto.randomUUID(),
    hash,
    status: ExportJobStatus.Pending,
    progress: 0,
    format,
    quality,
    createdAt: now.toISOString(),
    completedAt: null,
    expiresAt: expiresAt.toISOString(),
    outputs: [],
    error: null,
  };

  jobs.set(job.id, job);
  hashIndex.set(hash, job.id);

  // Defer processing to next microtask so status is 'pending' when returned
  setTimeout(() => {
    processJob(job.id, parsed.data, format, quality).catch((err) => {
      console.error(`[export] Job ${job.id} failed:`, err.message);
    });
  }, 0);

  return { job, isNew: true };
}

async function processJob(
  jobId: string,
  _canvasState: unknown,
  format: ExportFormat,
  quality: ExportQuality,
): Promise<void> {
  const job = jobs.get(jobId);
  if (!job) return;

  if (activeExports >= MAX_CONCURRENT) {
    job.status = ExportJobStatus.Failed;
    job.error = 'Export queue full, please try again later';
    job.completedAt = new Date().toISOString();
    return;
  }

  activeExports++;
  job.status = ExportJobStatus.Processing;

  try {
    const dimensions = getExportDimensions(quality);
    const state = _canvasState as {
      version: number;
      canvases: { nam: CanvasDescriptorData; nu: CanvasDescriptorData };
    };
    const canvases = state.canvases;
    const outputs: ExportJob['outputs'] = [];

    const processCanvas = async (
      side: 'nam' | 'nu',
      canvas: CanvasDescriptorData,
    ): Promise<void> => {
      const composites: Array<Record<string, any>> = [];

      // Background color
      if (canvas.backgroundColor) {
        composites.push({
          input: Buffer.from(
            `<svg width="${dimensions.width}" height="${dimensions.height}"><rect width="100%" height="100%" fill="${canvas.backgroundColor}"/></svg>`,
          ),
          top: 0,
          left: 0,
        });
      }

      // Render layers sorted by zIndex
      const sortedLayers = [...canvas.layers].sort((a, b) => a.zIndex - b.zIndex);
      for (const layer of sortedLayers) {
        if (!layer.visible) continue;
        const l = layer;
        const scaleX = l.scaleX ?? 1;
        const scaleY = l.scaleY ?? 1;
        const left = Math.round(l.x);
        const top = Math.round(l.y);

        if (l.type === 'image') {
          const storagePath = path.join(config.uploadsDir, path.basename(l.url ?? ''));
          let imgBuffer: Buffer;
          try {
            imgBuffer = await fs.readFile(storagePath);
          } catch {
            continue;
          }
          const imgW = Math.round((l.width ?? 100) * scaleX);
          const imgH = Math.round((l.height ?? 100) * scaleY);
          const imgOpacity = l.opacity ?? 1;
          let input: Buffer;
          if (imgOpacity < 1) {
            const rgba = await sharp(imgBuffer)
              .resize(imgW, imgH, { fit: 'fill' })
              .ensureAlpha()
              .raw()
              .toBuffer();
            for (let i = 3; i < rgba.length; i += 4) {
              rgba[i] = Math.round(rgba[i] * imgOpacity);
            }
            input = await sharp(rgba, { raw: { width: imgW, height: imgH, channels: 4 } })
              .png()
              .toBuffer();
          } else {
            input = await sharp(imgBuffer).resize(imgW, imgH, { fit: 'fill' }).png().toBuffer();
          }
          composites.push({ input, top, left });
        } else if (l.type === 'text') {
          const fontSize = Math.round((l.fontSize ?? 24) * scaleY);
          const fill = l.fill ?? '#000';
          const stroke = l.stroke
            ? `stroke="${l.stroke}" stroke-width="${l.strokeWidth ?? 0}"`
            : '';
          const safeText = (l.content ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
          const fillOpacity =
            l.opacity !== undefined && l.opacity < 1 ? `fill-opacity="${l.opacity}"` : '';
          const textSvg = `<svg width="${l.width ?? 800}" height="${l.height ?? 200}">
            <text x="0" y="${(l.height ?? 40) / 2}" font-family="${l.fontFamily ?? 'sans-serif'}"
                  font-size="${fontSize}" font-weight="${l.fontWeight ?? 400}"
                  font-style="${l.fontStyle ?? 'normal'}" fill="${fill}"
                  dominant-baseline="central" ${stroke} ${fillOpacity}>${safeText}</text>
          </svg>`;
          composites.push({ input: Buffer.from(textSvg), top, left });
        }
      }

      const compositedBuf = await sharp({
        create: {
          width: dimensions.width,
          height: dimensions.height,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        },
      })
        .composite(composites)
        .png()
        .toBuffer();

      const fn = `${jobId}-${side}.png`;
      await fs.writeFile(path.join(config.exportsDir, fn), compositedBuf);
      outputs.push({
        format: 'png',
        url: `/api/v1/storage/exports/${fn}`,
        size: compositedBuf.length,
        width: dimensions.width,
        height: dimensions.height,
      });
    };

    await processCanvas('nam', canvases.nam);
    job.progress = 50;
    await processCanvas('nu', canvases.nu);
    job.progress = 70;

    // PDF generation (MVP: sharp PDF output)
    if (format === 'pdf' || format === 'both') {
      try {
        const pdfFn = `${jobId}.pdf`;
        const pdfSvg = outputs
          .map(
            (o, i) =>
              `<image x="0" y="${i * 792}" width="612" height="792" href="/api/v1/storage/exports/${path.basename(o.url)}"/>`,
          )
          .join('');
        const pdfBuf = await sharp(
          Buffer.from(`<svg width="612" height="${792 * outputs.length}">${pdfSvg}</svg>`),
        )
          .png()
          .toBuffer();
        await fs.writeFile(path.join(config.exportsDir, pdfFn), pdfBuf);
        outputs.push({
          format: 'pdf',
          url: `/api/v1/storage/exports/${pdfFn}`,
          size: pdfBuf.length,
          width: 612,
          height: 792 * outputs.length,
        });
      } catch {
        /* sharp pdf() may not be available */
      }
    }

    job.outputs = outputs;
    job.status = ExportJobStatus.Done;
    job.progress = 100;
    job.completedAt = new Date().toISOString();
  } catch (err) {
    job.status = ExportJobStatus.Failed;
    job.error = err instanceof Error ? err.message : 'Unknown export error';
    job.completedAt = new Date().toISOString();
  } finally {
    activeExports--;
  }
}

interface CanvasDescriptorData {
  layers: Array<{
    type: 'text' | 'image';
    id: string;
    content?: string;
    url?: string;
    x: number;
    y: number;
    width?: number;
    height?: number;
    rotation: number;
    scaleX: number;
    scaleY: number;
    opacity: number;
    visible: boolean;
    zIndex: number;
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: number;
    fontStyle?: string;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    textAlign?: string;
    locked?: boolean;
  }>;
  garment?: { imageUrl: string; color?: string; tint?: { hue: number; saturation: number } };
  width: number;
  height: number;
  backgroundColor?: string;
}

function getExportDimensions(quality: ExportQuality): { width: number; height: number } {
  switch (quality) {
    case 'draft':
      return { width: 800, height: 1200 };
    case 'standard':
      return { width: config.exportWidth, height: config.exportHeight };
    case 'high':
      return { width: config.exportWidth * 2, height: config.exportHeight * 2 };
  }
}
