// ── Dual Canvas Editor — CanvasState Zod Schema ──
import { z } from 'zod';

const textEffectSchema = z.object({
  type: z.enum(['outline', 'shadow', 'curve']),
  params: z.record(z.string(), z.unknown()).optional(),
});

const imageFilterSchema = z.object({
  type: z.string().max(50),
  value: z.number().finite(),
});

const textLayerSchema = z.object({
  type: z.literal('text'),
  id: z.string().uuid(),
  name: z.string().max(200).optional(),
  content: z.string().max(10000),
  fontFamily: z.string().max(100),
  fontSize: z.number().positive().finite(),
  fontWeight: z.number().int().min(100).max(900).optional(),
  fontStyle: z.enum(['normal', 'italic']).optional(),
  fill: z.string().max(50),
  stroke: z.string().max(50).optional(),
  strokeWidth: z.number().nonnegative().finite().optional(),
  textAlign: z.enum(['left', 'center', 'right']).optional(),
  letterSpacing: z.number().finite().optional(),
  lineHeight: z.number().positive().finite().optional(),
  opacity: z.number().min(0).max(1),
  visible: z.boolean(),
  x: z.number().finite(),
  y: z.number().finite(),
  width: z.number().nonnegative().finite().optional(),
  height: z.number().nonnegative().finite().optional(),
  rotation: z.number().finite(),
  scaleX: z.number().finite(),
  scaleY: z.number().finite(),
  zIndex: z.number().int(),
  effects: z.array(textEffectSchema).max(10).optional(),
  locked: z.boolean().optional(),
});

const imageLayerSchema = z.object({
  type: z.literal('image'),
  id: z.string().uuid(),
  name: z.string().max(200).optional(),
  url: z.string().max(2000),
  originalUrl: z.string().max(2000).optional(),
  width: z.number().positive().finite(),
  height: z.number().positive().finite(),
  opacity: z.number().min(0).max(1),
  visible: z.boolean(),
  x: z.number().finite(),
  y: z.number().finite(),
  rotation: z.number().finite(),
  scaleX: z.number().finite(),
  scaleY: z.number().finite(),
  zIndex: z.number().int(),
  cropX: z.number().finite().optional(),
  cropY: z.number().finite().optional(),
  cropWidth: z.number().positive().finite().optional(),
  cropHeight: z.number().positive().finite().optional(),
  filters: z.array(imageFilterSchema).max(10).optional(),
  locked: z.boolean().optional(),
});

const layerSchema = z.discriminatedUnion('type', [textLayerSchema, imageLayerSchema]);

const garmentInfoSchema = z.object({
  imageUrl: z.string().max(500),
  color: z.string().max(50).optional(),
  tint: z
    .object({
      hue: z.number().int().min(0).max(360),
      saturation: z.number().min(0).max(100),
    })
    .optional(),
});

const canvasDescriptorSchema = z.object({
  layers: z.array(layerSchema).max(50),
  garment: garmentInfoSchema.optional(),
  width: z.number().positive().max(5000).finite(),
  height: z.number().positive().max(5000).finite(),
  backgroundColor: z.string().max(50).optional(),
});

export const canvasStateSchema = z.object({
  version: z.literal(2),
  canvases: z.object({
    nam: canvasDescriptorSchema,
    nu: canvasDescriptorSchema,
  }),
});

export type CanvasStateParsed = z.infer<typeof canvasStateSchema>;
