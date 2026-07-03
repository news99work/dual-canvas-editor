import { z } from 'zod';

const textLayerSchema = z.object({
  type: z.literal('text'),
  id: z.string(),
  content: z.string().max(10000),
  fontFamily: z.string().max(100),
  fontSize: z.number().positive(),
  fontWeight: z.number().int().min(100).max(900).optional(),
  fontStyle: z.enum(['normal', 'italic']).optional(),
  fill: z.string().max(50),
  stroke: z.string().max(50).optional(),
  strokeWidth: z.number().nonnegative().optional(),
  textAlign: z.enum(['left', 'center', 'right']).optional(),
  opacity: z.number().min(0).max(1),
  visible: z.boolean(),
  x: z.number(),
  y: z.number(),
  width: z.number().nonnegative().optional(),
  height: z.number().nonnegative().optional(),
  rotation: z.number(),
  scaleX: z.number(),
  scaleY: z.number(),
  zIndex: z.number().int(),
  locked: z.boolean().optional(),
});

const imageLayerSchema = z.object({
  type: z.literal('image'),
  id: z.string(),
  url: z.string().max(2000),
  width: z.number().positive(),
  height: z.number().positive(),
  opacity: z.number().min(0).max(1),
  visible: z.boolean(),
  x: z.number(),
  y: z.number(),
  rotation: z.number(),
  scaleX: z.number(),
  scaleY: z.number(),
  zIndex: z.number().int(),
  locked: z.boolean().optional(),
});

const layerSchema = z.discriminatedUnion('type', [textLayerSchema, imageLayerSchema]);

const canvasDescriptorSchema = z.object({
  layers: z.array(layerSchema).max(50),
  width: z.number().positive().max(5000),
  height: z.number().positive().max(5000),
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
