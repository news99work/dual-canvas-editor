// ── Assets API ──
import { apiRequest } from './client';
import type { AssetListResponse, AssetQuery } from './types';

/**
 * List assets with optional filtering and cursor pagination.
 * GET /api/v1/assets
 *
 * Backend returns AssetListResponse directly (NOT wrapped in { data: ... } envelope):
 * { data: UploadAsset[], cursor: string | null, hasMore: boolean }
 */
export async function listAssets(query?: AssetQuery): Promise<AssetListResponse> {
  const params = new URLSearchParams();

  if (query?.category) params.set('category', query.category);
  if (query?.tags && query.tags.length > 0) params.set('tags', query.tags.join(','));
  if (query?.search) params.set('search', query.search);
  if (query?.cursor) params.set('cursor', query.cursor);
  if (query?.limit) params.set('limit', String(query.limit));

  const qs = params.toString();
  const path = qs ? `/api/v1/assets?${qs}` : '/api/v1/assets';

  // Backend does NOT wrap in { data: ... } — response IS AssetListResponse shape
  const result = await apiRequest<AssetListResponse>(path);
  return result;
}
