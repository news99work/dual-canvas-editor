// ── Upload Service Tests ──
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'node:path';
import fs from 'node:fs/promises';
import { config } from '../config.js';
import { processUpload } from './upload.service.js';

const TEST_IMG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
); // 1×1 PNG

let tempFile: string;

beforeAll(async () => {
  await fs.mkdir(config.tempDir, { recursive: true });
  await fs.mkdir(config.uploadsDir, { recursive: true });
});

afterAll(async () => {
  // Clean up any test uploads
  const files = await fs.readdir(config.uploadsDir).catch(() => []);
  for (const f of files) {
    if (f.startsWith('test-')) {
      await fs.unlink(path.join(config.uploadsDir, f)).catch(() => {});
    }
  }
});

describe('processUpload', () => {
  it('should reject SVG disguised as PNG', async () => {
    const svgContent = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
    const svgPath = path.join(config.tempDir, 'test-fake-png.png');
    await fs.writeFile(svgPath, svgContent);

    await expect(processUpload(svgPath, 'fake.png', 'image/png', 'upload', [])).rejects.toThrow(
      'SVG files are not accepted',
    );
  });

  it('should reject corrupted files', async () => {
    const badPath = path.join(config.tempDir, 'test-corrupted');
    await fs.writeFile(badPath, Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00]));

    await expect(processUpload(badPath, 'bad.bin', 'image/png', 'upload', [])).rejects.toThrow(
      'not a valid image',
    );
  });

  it('should process a valid PNG and return asset record', async () => {
    const pngPath = path.join(config.tempDir, 'test-valid.png');
    await fs.writeFile(pngPath, TEST_IMG);

    const asset = await processUpload(pngPath, 'test-image.png', 'image/png', 'upload', ['test']);

    expect(asset.id).toBeTruthy();
    expect(asset.mimeType).toBe('image/png');
    expect(asset.width).toBe(1);
    expect(asset.height).toBe(1);
    expect(asset.url).toMatch(/^\/api\/v1\/storage\//);
    expect(asset.thumbnailUrl).toMatch(/^\/api\/v1\/storage\//);
    expect(asset.category).toBe('upload');
    expect(asset.tags).toEqual(['test']);
    expect(asset.originalName).toBe('test-image.png');

    // Verify files were written
    await expect(fs.access(path.join(config.uploadsDir, asset.filename))).resolves.toBeUndefined();
    await expect(
      fs.access(path.join(config.uploadsDir, path.basename(asset.thumbnailUrl))),
    ).resolves.toBeUndefined();

    // Clean up
    await fs.unlink(path.join(config.uploadsDir, asset.filename)).catch(() => {});
    await fs
      .unlink(path.join(config.uploadsDir, path.basename(asset.thumbnailUrl)))
      .catch(() => {});
  });

  it('should strip temp file after processing', async () => {
    const pngPath = path.join(config.tempDir, 'test-strip-temp.png');
    await fs.writeFile(pngPath, TEST_IMG);

    const asset = await processUpload(pngPath, 'strip-test.png', 'image/png', 'upload', []);
    // Temp file should be gone
    await expect(fs.access(pngPath)).rejects.toThrow();

    // Clean up
    await fs.unlink(path.join(config.uploadsDir, asset.filename)).catch(() => {});
    await fs
      .unlink(path.join(config.uploadsDir, path.basename(asset.thumbnailUrl)))
      .catch(() => {});
  });
});
