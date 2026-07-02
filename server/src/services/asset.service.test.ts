// ── Asset Service Tests ──
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import * as assetService from './asset.service.js';
import type { Asset, AssetCategory } from '../types/asset.js';
import { config } from '../config.js';

const ASSETS_FILE = path.join(config.metaDir, 'assets.json');

// Reset the asset store before each test:
// 1. Clear module-level in-memory cache
// 2. Write empty array to the real meta file so next ensureLoaded() sees clean state
beforeEach(async () => {
  assetService.resetCache();
  await fs.mkdir(config.metaDir, { recursive: true });
  await fs.writeFile(ASSETS_FILE, '[]', 'utf-8');
});

afterEach(async () => {
  // Clean up test data
  await fs.writeFile(ASSETS_FILE, '[]', 'utf-8').catch(() => {});
});

// Helper: create a test asset
function makeAsset(overrides: Partial<Asset> = {}): Asset {
  return {
    id: overrides.id ?? 'test-id-001',
    url: `/api/v1/storage/test-img.png`,
    thumbnailUrl: `/api/v1/storage/test-img-thumb.png`,
    filename: 'test-img.png',
    originalName: 'test-img.png',
    mimeType: 'image/png',
    size: 1024,
    width: 200,
    height: 200,
    category: 'upload' as AssetCategory,
    tags: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('Asset Service', () => {
  describe('createAsset', () => {
    it('should create and return the asset', async () => {
      const asset = makeAsset();
      const result = await assetService.createAsset(asset);
      expect(result.id).toBe(asset.id);
      expect(result.url).toBe(asset.url);
    });
  });

  describe('listAssets', () => {
    it('should return empty list when no assets', async () => {
      const result = await assetService.listAssets({ limit: 20 });
      expect(result.data).toEqual([]);
      expect(result.hasMore).toBe(false);
      expect(result.cursor).toBeNull();
    });

    it('should return created assets in reverse chronological order', async () => {
      const a1 = makeAsset({ id: 'asset-1', tags: ['tag1'] });
      const a2 = makeAsset({ id: 'asset-2', tags: ['tag2'] });
      await assetService.createAsset(a1);
      await assetService.createAsset(a2);

      const result = await assetService.listAssets({ limit: 20 });
      expect(result.data.length).toBe(2);
      // Most recent first
      expect(result.data[0].id).toBe('asset-2');
      expect(result.data[1].id).toBe('asset-1');
    });

    it('should filter by category', async () => {
      await assetService.createAsset(makeAsset({ id: 'a1', category: 'upload' }));
      await assetService.createAsset(makeAsset({ id: 'a2', category: 'clipart' }));

      const result = await assetService.listAssets({ category: 'clipart', limit: 20 });
      expect(result.data.length).toBe(1);
      expect(result.data[0].id).toBe('a2');
    });

    it('should filter by tags (match any)', async () => {
      await assetService.createAsset(makeAsset({ id: 'a1', tags: ['summer', 'beach'] }));
      await assetService.createAsset(makeAsset({ id: 'a2', tags: ['winter'] }));

      const result = await assetService.listAssets({ tags: ['summer'], limit: 20 });
      expect(result.data.length).toBe(1);
      expect(result.data[0].id).toBe('a1');
    });

    it('should search by filename or originalName', async () => {
      await assetService.createAsset(
        makeAsset({ id: 'a1', originalName: 'sunset-beach.png', filename: 'uuid-1.png' }),
      );
      await assetService.createAsset(
        makeAsset({ id: 'a2', originalName: 'mountain-view.png', filename: 'uuid-2.png' }),
      );

      const result = await assetService.listAssets({ search: 'sunset', limit: 20 });
      expect(result.data.length).toBe(1);
      expect(result.data[0].id).toBe('a1');
    });

    it('should support cursor pagination', async () => {
      for (let i = 0; i < 5; i++) {
        await assetService.createAsset(makeAsset({ id: `asset-${i}` }));
      }
      // Page 1: first 2 items (newest first: asset-4, asset-3)
      const page1 = await assetService.listAssets({ limit: 2 });
      expect(page1.data.length).toBe(2);
      expect(page1.hasMore).toBe(true);
      expect(page1.cursor).not.toBeNull();

      // Page 2: next 2 items
      const page2 = await assetService.listAssets({ limit: 2, cursor: page1.cursor! });
      expect(page2.data.length).toBe(2);
      expect(page2.hasMore).toBe(true);

      // Page 3: last item
      const page3 = await assetService.listAssets({ limit: 2, cursor: page2.cursor! });
      expect(page3.data.length).toBe(1);
      expect(page3.hasMore).toBe(false);
      expect(page3.cursor).toBeNull();
    });
  });

  describe('getAsset', () => {
    it('should return the asset by id', async () => {
      await assetService.createAsset(makeAsset({ id: 'find-me' }));
      const result = await assetService.getAsset('find-me');
      expect(result).toBeDefined();
      expect(result!.id).toBe('find-me');
    });

    it('should return undefined for missing id', async () => {
      const result = await assetService.getAsset('nonexistent');
      expect(result).toBeUndefined();
    });
  });
});
