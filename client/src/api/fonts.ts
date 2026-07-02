// ── Fonts API ──
import { apiRequest } from './client';
import type { Font, ApiResponse } from './types';

/**
 * List available fonts.
 * GET /api/v1/fonts
 */
export async function listFonts(): Promise<Font[]> {
  const result = await apiRequest<ApiResponse<Font[]>>('/api/v1/fonts');
  return result.data;
}
