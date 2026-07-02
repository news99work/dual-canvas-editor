// ── Upload Service ──
import path from 'node:path';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import sharp from 'sharp';
import multer from 'multer';
import { config } from '../config.js';
import type { Asset, AssetCategory } from '../types/asset.js';

const ALLOWED_FORMATS = new Set(['png', 'jpeg', 'webp']);
const SVG_MAGIC = [0x3c]; // '<' byte — SVG files start with "<svg" or "<?xml"

/** Multer middleware instance — configured for disk storage */
export const uploadMiddleware = multer({
  dest: config.tempDir,
  limits: {
    fileSize: config.maxUploadSize,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    if (!config.allowedMimeTypes.includes(file.mimetype as never)) {
      cb(
        new Error(
          `Unsupported MIME type: ${file.mimetype}. Allowed: ${config.allowedMimeTypes.join(', ')}`,
        ),
      );
      return;
    }
    cb(null, true);
  },
});

/**
 * Validates an uploaded file:
 * 1. Reads magic bytes to reject SVG disguised as other types
 * 2. Uses Sharp to verify it's a genuine image and get metadata
 * 3. Generates a UUID filename
 * 4. Strips EXIF/metadata via Sharp
 * 5. Generates a 200px thumbnail
 * Returns asset record and saved buffer info.
 */
export async function processUpload(
  filePath: string,
  originalName: string,
  mimeType: string,
  category: AssetCategory,
  tags: string[],
): Promise<Asset> {
  const buffer = await fs.readFile(filePath);

  // ── SVG magic byte rejection ──
  if (buffer.length > 0 && buffer[0] === SVG_MAGIC[0]) {
    const firstBytes = buffer.subarray(0, 100).toString('utf-8').toLowerCase().trim();
    if (firstBytes.startsWith('<svg') || firstBytes.startsWith('<?xml')) {
      throw Object.assign(new Error('SVG files are not accepted'), {
        statusCode: 400,
        code: 'SVG_REJECTED',
      });
    }
  }

  // ── Sharp content validation & metadata ──
  let metadata: Record<string, any>;
  try {
    metadata = await sharp(buffer).metadata();
  } catch {
    throw Object.assign(new Error('File is not a valid image or is corrupted'), {
      statusCode: 400,
      code: 'INVALID_IMAGE',
    });
  }

  if (!metadata.format || !ALLOWED_FORMATS.has(metadata.format)) {
    throw Object.assign(
      new Error(
        `Unsupported image format: ${metadata.format}. Allowed: ${Array.from(ALLOWED_FORMATS).join(', ')}`,
      ),
      { statusCode: 400, code: 'UNSUPPORTED_FORMAT' },
    );
  }

  // ── Strip EXIF / metadata via re-encode ──
  const cleaned = await sharp(buffer).toBuffer();

  // ── Generate thumbnail ──
  const thumbnail = await sharp(cleaned)
    .resize(200, 200, { fit: 'inside', withoutEnlargement: true })
    .toBuffer();

  // ── UUID filename ──
  const ext = metadata.format === 'jpeg' ? 'jpg' : metadata.format;
  const uuid = crypto.randomUUID();
  const filename = `${uuid}.${ext}`;
  const thumbFilename = `${uuid}-thumb.${ext}`;

  // ── Write processed files ──
  await fs.writeFile(path.join(config.uploadsDir, filename), cleaned);
  await fs.writeFile(path.join(config.uploadsDir, thumbFilename), thumbnail);

  // ── Clean up temp file ──
  await fs.unlink(filePath).catch(() => {});

  // ── Build asset record ──
  // NOTE: URLs match express.static mount point in index.ts: /api/v1/storage → uploadsDir
  const now = new Date().toISOString();
  const asset: Asset = {
    id: uuid,
    url: `/api/v1/storage/${filename}`,
    thumbnailUrl: `/api/v1/storage/${thumbFilename}`,
    filename,
    originalName,
    mimeType: `image/${metadata.format}`,
    size: cleaned.length,
    width: metadata.width ?? 0,
    height: metadata.height ?? 0,
    category,
    tags,
    createdAt: now,
  };

  return asset;
}
