// ── Dual Canvas Editor — Canvas State Types ──

/** Text effect type */
export const TextEffectType = {
  Outline: 'outline',
  Shadow: 'shadow',
  Curve: 'curve',
} as const;
export type TextEffectType = (typeof TextEffectType)[keyof typeof TextEffectType];

/** A single text effect */
export interface TextEffect {
  type: TextEffectType;
  params: Record<string, unknown>;
}

/** Image filter type */
export interface ImageFilter {
  type: string;
  value: number;
}

/** Text layer properties */
export interface TextLayer {
  type: 'text';
  id: string;
  name?: string;
  content: string;
  fontFamily: string;
  fontSize: number;
  fontWeight?: number;
  fontStyle?: 'normal' | 'italic';
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  textAlign?: 'left' | 'center' | 'right';
  letterSpacing?: number;
  lineHeight?: number;
  opacity: number;
  visible: boolean;
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  zIndex: number;
  effects?: TextEffect[];
  locked?: boolean;
}

/** Image layer properties */
export interface ImageLayer {
  type: 'image';
  id: string;
  name?: string;
  url: string;
  originalUrl?: string;
  width: number;
  height: number;
  opacity: number;
  visible: boolean;
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  zIndex: number;
  cropX?: number;
  cropY?: number;
  cropWidth?: number;
  cropHeight?: number;
  filters?: ImageFilter[];
  locked?: boolean;
}

/** A layer on the canvas (text or image) */
export type Layer = TextLayer | ImageLayer;

/** Garment base info */
export interface GarmentInfo {
  imageUrl: string;
  color?: string;
  tint?: { hue: number; saturation: number };
}

/** Single canvas descriptor (Nam or Nữ) */
export interface CanvasDescriptor {
  layers: Layer[];
  garment?: GarmentInfo;
  width: number;
  height: number;
  backgroundColor?: string;
}

/** Full canvas state sent from client */
export interface CanvasState {
  version: number;
  canvases: {
    nam: CanvasDescriptor;
    nu: CanvasDescriptor;
  };
}
