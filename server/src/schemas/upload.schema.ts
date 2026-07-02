// ── Upload Metadata Schema ──
import { z } from 'zod/v4';

export const uploadMetadataSchema = z.object({
  category: z.string().optional().default('upload'),
  tags: z
    .string()
    .optional()
    .default('')
    .transform((val) =>
      val
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    ),
});

export type UploadMetadata = z.infer<typeof uploadMetadataSchema>;
