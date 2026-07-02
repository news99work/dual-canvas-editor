// ── Dual Canvas Editor — Asset & Font Types ──

/** Asset category enum */
export const AssetCategory = {
  Upload: 'upload',
  Clipart: 'clipart',
  Template: 'template',
  Garment: 'garment',
} as const;
export type AssetCategory = (typeof AssetCategory)[keyof typeof AssetCategory];

/** An uploaded or built-in asset */
export interface Asset {
  id: string;
  url: string;
  thumbnailUrl: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  width: number;
  height: number;
  category: AssetCategory;
  tags: string[];
  createdAt: string; // ISO 8601
}

/** Asset listing response */
export interface AssetListResponse {
  data: Asset[];
  cursor: string | null;
  hasMore: boolean;
}

/** Font variant */
export interface FontVariant {
  weight: number;
  style: 'normal' | 'italic';
  url: string;
}

/** Font metadata */
export interface Font {
  family: string;
  category: 'sans-serif' | 'serif' | 'display' | 'handwriting' | 'monospace';
  variants: FontVariant[];
}

/** Font listing response */
export interface FontListResponse {
  data: Font[];
}
