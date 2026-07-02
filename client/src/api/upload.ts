// ── Upload API ──
import { apiUpload } from './client';
import type { UploadAsset, ApiResponse } from './types';

export interface UploadOptions {
  file: File;
  category?: string;
  tags?: string[];
  signal?: AbortSignal;
  onProgress?: (pct: number) => void;
}

/**
 * Upload an image file.
 * POST /api/v1/upload (multipart/form-data)
 */
export async function uploadAsset(options: UploadOptions): Promise<UploadAsset> {
  const { file, category = 'upload', tags, signal } = options;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', category);
  if (tags && tags.length > 0) {
    formData.append('tags', tags.join(','));
  }

  const result = await apiUpload<ApiResponse<UploadAsset>>('/api/v1/upload', formData, {
    signal,
    timeout: 30000,
  });

  return result.data;
}
