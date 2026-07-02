// ── Dual Canvas Editor — Export Request Zod Schema ──
import { z } from 'zod/v4';

export const exportRequestSchema = z.object({
  canvasState: z.unknown(), // validated separately by canvasStateSchema
  format: z.enum(['png', 'pdf', 'both']),
  quality: z.enum(['draft', 'standard', 'high']),
});

export type ExportRequestParsed = z.infer<typeof exportRequestSchema>;
