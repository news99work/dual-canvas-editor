import { create } from 'zustand';

export type LayerType = 'text' | 'image';
export type CanvasSide = 'nam' | 'nu';
export type ViewMode = 'front' | 'back';

export interface CanvasLayer {
  id: string;
  type: LayerType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  scaleX: number;
  scaleY: number;
  // text
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fill?: string;
  // image
  imageUrl?: string;
}

export interface CanvasState {
  namLayers: CanvasLayer[];
  nuLayers: CanvasLayer[];
  activeSide: CanvasSide;
  activeLayerId: string | null;
  viewMode: ViewMode;
  garmentColor: string;
  // Actions
  setActiveSide: (side: CanvasSide) => void;
  setActiveLayer: (id: string | null) => void;
  setViewMode: (mode: ViewMode) => void;
  setGarmentColor: (color: string) => void;
  addTextLayer: (side: CanvasSide, layer: CanvasLayer) => void;
  addImageLayer: (side: CanvasSide, layer: CanvasLayer) => void;
  updateLayer: (side: CanvasSide, id: string, patch: Partial<CanvasLayer>) => void;
  deleteLayer: (side: CanvasSide, id: string) => void;
  syncLayer: (side: CanvasSide, layer: CanvasLayer) => void;
}

let layerCounter = 0;
function nextId(): string {
  layerCounter++;
  return `layer-${Date.now()}-${layerCounter}`;
}

export function createTextLayer(overrides?: Partial<CanvasLayer>): CanvasLayer {
  return {
    id: nextId(),
    type: 'text',
    x: 100,
    y: 200,
    width: 200,
    height: 40,
    rotation: 0,
    zIndex: layerCounter,
    scaleX: 1,
    scaleY: 1,
    text: 'Nhập chữ...',
    fontSize: 24,
    fontFamily: 'Arial',
    fill: '#000000',
    ...overrides,
  };
}

export function createImageLayer(imageUrl: string, overrides?: Partial<CanvasLayer>): CanvasLayer {
  return {
    id: nextId(),
    type: 'image',
    x: 100,
    y: 150,
    width: 150,
    height: 150,
    rotation: 0,
    zIndex: layerCounter,
    scaleX: 1,
    scaleY: 1,
    imageUrl,
    ...overrides,
  };
}

export const useCanvasState = create<CanvasState>((set) => ({
  namLayers: [],
  nuLayers: [],
  activeSide: 'nam',
  activeLayerId: null,
  viewMode: 'front',
  garmentColor: '#FFFFFF',

  setActiveSide: (side) => set({ activeSide: side }),
  setActiveLayer: (id) => set({ activeLayerId: id }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setGarmentColor: (color) => set({ garmentColor: color }),

  addTextLayer: (side, layer) =>
    set((state) => ({
      [`${side}Layers`]: [...state[`${side}Layers`], layer],
    })),

  addImageLayer: (side, layer) =>
    set((state) => ({
      [`${side}Layers`]: [...state[`${side}Layers`], layer],
    })),

  updateLayer: (side, id, patch) =>
    set((state) => ({
      [`${side}Layers`]: state[`${side}Layers`].map((l) =>
        l.id === id ? { ...l, ...patch } : l
      ),
    })),

  deleteLayer: (side, id) =>
    set((state) => ({
      [`${side}Layers`]: state[`${side}Layers`].filter((l) => l.id !== id),
    })),

  syncLayer: (side, layer) =>
    set((state) => ({
      [`${side}Layers`]: state[`${side}Layers`].map((l) =>
        l.id === layer.id ? layer : l
      ),
    })),
}));
