// ── Asset Service (in-memory + JSON persistence) ──
import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config.js';
import type { Asset, AssetCategory, AssetListResponse } from '../types/asset.js';

const ASSETS_FILE = path.join(config.metaDir, 'assets.json');

let assets: Asset[] = [];
let loaded = false;

async function ensureLoaded(): Promise<void> {
  if (loaded) return;
  try {
    const data = await fs.readFile(ASSETS_FILE, 'utf-8');
    assets = JSON.parse(data);
  } catch {
    assets = [];
  }
  loaded = true;
}

async function persist(): Promise<void> {
  await fs.writeFile(ASSETS_FILE, JSON.stringify(assets, null, 2), 'utf-8');
}

/** Save a new asset */
export async function createAsset(asset: Asset): Promise<Asset> {
  await ensureLoaded();
  assets.unshift(asset);
  await persist();
  return asset;
}

/** List assets with optional filters and cursor pagination */
export async function listAssets(params: {
  category?: AssetCategory;
  tags?: string[];
  search?: string;
  cursor?: string;
  limit: number;
}): Promise<AssetListResponse> {
  await ensureLoaded();

  let filtered = [...assets];

  // Filter by category
  if (params.category) {
    filtered = filtered.filter((a) => a.category === params.category);
  }

  // Filter by tags (match any)
  if (params.tags && params.tags.length > 0) {
    filtered = filtered.filter((a) => params.tags!.some((t) => a.tags.includes(t)));
  }

  // Search by filename or originalName
  if (params.search) {
    const q = params.search.toLowerCase();
    filtered = filtered.filter(
      (a) => a.filename.toLowerCase().includes(q) || a.originalName.toLowerCase().includes(q),
    );
  }

  // Cursor: find index of cursor item
  let startIndex = 0;
  if (params.cursor) {
    const idx = filtered.findIndex((a) => a.id === params.cursor);
    if (idx !== -1) startIndex = idx + 1;
  }

  const page = filtered.slice(startIndex, startIndex + params.limit);
  const hasMore = startIndex + params.limit < filtered.length;
  const nextCursor = hasMore ? (page[page.length - 1]?.id ?? null) : null;

  return {
    data: page,
    cursor: nextCursor,
    hasMore,
  };
}

/** Get a single asset by ID */
export async function getAsset(id: string): Promise<Asset | undefined> {
  await ensureLoaded();
  return assets.find((a) => a.id === id);
}
