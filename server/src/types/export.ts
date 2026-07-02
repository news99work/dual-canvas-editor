// ── Dual Canvas Editor — Export Job Types ──

/** Export job status */
export const ExportJobStatus = {
  Pending: 'pending',
  Processing: 'processing',
  Done: 'done',
  Failed: 'failed',
} as const;
export type ExportJobStatus = (typeof ExportJobStatus)[keyof typeof ExportJobStatus];

/** Export format */
export const ExportFormat = {
  PNG: 'png',
  PDF: 'pdf',
  Both: 'both',
} as const;
export type ExportFormat = (typeof ExportFormat)[keyof typeof ExportFormat];

/** Export quality tier */
export const ExportQuality = {
  Draft: 'draft',
  Standard: 'standard',
  High: 'high',
} as const;
export type ExportQuality = (typeof ExportQuality)[keyof typeof ExportQuality];

/** Export output file descriptor */
export interface ExportOutput {
  format: 'png' | 'pdf';
  url: string;
  size: number;
  width: number;
  height: number;
}

/** Export job record */
export interface ExportJob {
  id: string;
  hash: string; // SHA-256 of canvas state
  status: ExportJobStatus;
  progress: number; // 0–100
  format: ExportFormat;
  quality: ExportQuality;
  createdAt: string; // ISO 8601
  completedAt: string | null;
  expiresAt: string; // ISO 8601 — retention deadline
  outputs: ExportOutput[];
  error: string | null;
}

/** Export request body */
export interface ExportRequest {
  canvasState: unknown; // validated by Zod
  format: ExportFormat;
  quality: ExportQuality;
}
