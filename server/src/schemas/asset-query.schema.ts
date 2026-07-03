import { z } from 'zod';

export const assetQuerySchema = z.object({
  category: z.enum(['upload', 'clipart', 'template', 'garment']).optional(),
  tags: z.string().transform((s) =>
    s.split(',').map((t) => t.trim()).filter(Boolean)
  ).optional(),
  search: z.string().max(200).optional(),
  cursor: z.string().max(100).optional(),
  limit: z.preprocess(
    (val) => {
      if (val === undefined || val === null) return 20;
      const n = parseInt(String(val), 10);
      return isNaN(n) ? 20 : Math.min(Math.max(n, 1), 50);
    },
    z.number().int().min(1).max(50)
  ).default(20),
});

export type AssetQueryParsed = z.infer<typeof assetQuerySchema>;
