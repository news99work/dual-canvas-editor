// ── Dual Canvas Editor — Shared API Types ──
// Mirror of server/src/types/* — consolidated for client consumption
// Keep in sync with server-side interfaces

// ── Common ──

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: unknown[];
}

export interface ApiResponse<T> {
  data: T;
}

export interface ApiErrorResponse {
  error: ApiErrorBody;
}

// ── Upload ──

export interface UploadAsset {
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
  createdAt: string;
}

export type AssetCategory = 'upload' | 'clipart' | 'template' | 'garment';

// ── Assets ──

export interface AssetListResponse {
  data: UploadAsset[];
  cursor: string | null;
  hasMore: boolean;
}

export interface AssetQuery {
  category?: AssetCategory;
  tags?: string[];
  search?: string;
  cursor?: string;
  limit?: number;
}

// ── Canvas State ──

export interface CanvasLayer {
  id: string;
  type: 'text' | 'image';
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
}

export interface CanvasDescriptor {
  layers: CanvasLayer[];
  garment?: {
    imageUrl: string;
    color?: string;
    tint?: { hue: number; saturation: number };
  };
  width: number;
  height: number;
  backgroundColor?: string;
}

export interface CanvasState {
  version: 2;
  canvases: {
    nam: CanvasDescriptor;
    nu: CanvasDescriptor;
  };
  metadata?: {
    name?: string;
    createdBy?: string;
    template?: string;
  };
}

// ── Export ──

export type ExportFormat = 'png' | 'pdf' | 'both';
export type ExportQuality = 'draft' | 'standard' | 'high';

export interface ExportOutput {
  format: string;
  url: string;
  size: number;
  width: number;
  height: number;
}

export interface ExportJob {
  id: string;
  hash: string;
  status: ExportJobStatus;
  progress: number;
  format: ExportFormat;
  quality: ExportQuality;
  createdAt: string;
  completedAt: string | null;
  expiresAt: string;
  outputs: ExportOutput[];
  error: string | null;
}

export type ExportJobStatus = 'pending' | 'processing' | 'done' | 'failed';

export interface ExportRequest {
  canvasState: CanvasState;
  format: ExportFormat;
  quality: ExportQuality;
}

// ── Fonts ──

export interface FontVariant {
  weight: number;
  style: 'normal' | 'italic';
  url: string;
}

export interface Font {
  family: string;
  category: 'sans-serif' | 'serif' | 'display' | 'handwriting' | 'monospace';
  variants: FontVariant[];
}

export interface FontListResponse {
  data: Font[];
}
