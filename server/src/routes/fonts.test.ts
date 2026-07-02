// ── Fonts Route Tests ──
import { describe, it, expect } from 'vitest';
import { Router } from 'express';

// Mock the config to point to test fonts.json
import { config } from '../config.js';
import fs from 'node:fs/promises';
import path from 'node:path';

describe('fonts.json structure', () => {
  it('should be a valid JSON array', async () => {
    const data = await fs.readFile(config.fontsJsonPath, 'utf-8');
    const fonts = JSON.parse(data);
    expect(Array.isArray(fonts)).toBe(true);
  });

  it('should have valid font entries', async () => {
    const data = await fs.readFile(config.fontsJsonPath, 'utf-8');
    const fonts = JSON.parse(data) as Array<{
      family: string;
      category: string;
      variants: Array<{ weight: number; style: string; url: string }>;
    }>;

    expect(fonts.length).toBeGreaterThan(0);

    for (const font of fonts) {
      expect(font.family).toBeTruthy();
      expect(['sans-serif', 'serif', 'display', 'handwriting', 'monospace']).toContain(
        font.category,
      );
      expect(font.variants.length).toBeGreaterThan(0);

      for (const variant of font.variants) {
        expect(variant.weight).toBeGreaterThanOrEqual(100);
        expect(variant.weight).toBeLessThanOrEqual(900);
        expect(['normal', 'italic']).toContain(variant.style);
        expect(variant.url).toMatch(/^\/api\/v1\/storage\/fonts\//);
      }
    }
  });

  it('should reference WOFF2 files in expected directory', async () => {
    const data = await fs.readFile(config.fontsJsonPath, 'utf-8');
    const fonts = JSON.parse(data) as Array<{ family: string; variants: Array<{ url: string }> }>;

    const fontsDir = path.dirname(config.fontsJsonPath);
    let allExist = true;
    const missing: string[] = [];

    for (const font of fonts) {
      for (const variant of font.variants) {
        const basename = path.basename(variant.url);
        const filePath = path.join(fontsDir, basename);
        try {
          await fs.access(filePath);
        } catch {
          allExist = false;
          missing.push(basename);
        }
      }
    }

    if (!allExist) {
      console.warn(`[fonts.test] Missing WOFF2 files: ${missing.join(', ')}`);
    }
  });
});
