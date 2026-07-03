import { useEffect, useRef } from 'react';
import { Canvas, Rect, Text, FabricImage } from 'fabric';
import { useCanvasState, type CanvasSide, type CanvasLayer } from '../../hooks/useCanvasState';

interface EditorCanvasProps {
  side: CanvasSide;
  width: number;
  height: number;
  printArea: { x: number; y: number; w: number; h: number };
}

const PRINT_COLORS: Record<string, string> = {
  '#FFFFFF': '#f0f0f0',
  '#000000': '#222',
  '#FF0000': '#d00',
  '#0000FF': '#25d',
  '#FFC0CB': '#f9c',
  '#FFD700': '#da0',
  '#808080': '#999',
  '#000080': '#123',
  '#008000': '#272',
};

export default function EditorCanvas({ side, width, height, printArea }: EditorCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fcRef = useRef<Canvas | null>(null);
  const layers = useCanvasState((s) => (side === 'nam' ? s.namLayers : s.nuLayers));
  const garmentColor = useCanvasState((s) => s.garmentColor);
  const activeSide = useCanvasState((s) => s.activeSide);
  const setActiveSide = useCanvasState((s) => s.setActiveSide);
  const setActiveLayer = useCanvasState((s) => s.setActiveLayer);
  const syncLayer = useCanvasState((s) => s.syncLayer);

  const colorHex = PRINT_COLORS[garmentColor] || garmentColor;

  useEffect(() => {
    if (!canvasRef.current || fcRef.current) return;
    const el = canvasRef.current;

    const fc = new Canvas(el, {
      width,
      height,
      backgroundColor: '#f5f5f5',
      selection: true,
      preserveObjectStacking: true,
    });

    const guide = new Rect({
      left: printArea.x,
      top: printArea.y,
      width: printArea.w,
      height: printArea.h,
      fill: colorHex,
      stroke: '#ccc',
      strokeWidth: 1,
      strokeDashArray: [6, 4],
      selectable: false,
      evented: false,
    });
    fc.add(guide);
    fc.sendObjectToBack(guide);
    (fc as any).__printGuide = guide;

    fc.on('mouse:down', () => setActiveSide(side));
    fc.on('selection:created', (e: any) => {
      if (e.selected?.[0]) setActiveLayer(e.selected[0].__layerId || null);
    });
    fc.on('selection:updated', (e: any) => {
      if (e.selected?.[0]) setActiveLayer(e.selected[0].__layerId || null);
    });
    fc.on('selection:cleared', () => setActiveLayer(null));

    fc.on('object:modified', (e: any) => {
      const obj = e.target;
      if (!obj?.__layerId) return;
      const layer: CanvasLayer = {
        id: obj.__layerId,
        type: obj.__layerType || 'text',
        x: obj.left ?? 0,
        y: obj.top ?? 0,
        width: (obj.width ?? 0) * (obj.scaleX ?? 1),
        height: (obj.height ?? 0) * (obj.scaleY ?? 1),
        rotation: obj.angle ?? 0,
        zIndex: fc.getObjects().indexOf(obj),
        scaleX: 1,
        scaleY: 1,
        text: obj.text,
        fontSize: obj.fontSize,
        fontFamily: obj.fontFamily,
        fill: obj.fill as string,
        imageUrl: obj.__imageUrl,
      };
      obj.set({ scaleX: 1, scaleY: 1 });
      obj.setCoords();
      syncLayer(side, layer);
    });

    fcRef.current = fc;
    return () => { fc.dispose(); fcRef.current = null; };
  }, []);

  useEffect(() => {
    const fc = fcRef.current;
    if (!fc) return;
    const guide = (fc as any).__printGuide as Rect;
    if (guide) guide.set('fill', colorHex);
    fc.requestRenderAll();
  }, [garmentColor, colorHex]);

  const layerMapRef = useRef<Map<string, any>>(new Map());

  useEffect(() => {
    const fc = fcRef.current;
    if (!fc) return;
    const currentIds = new Set(layers.map((l) => l.id));
    const existingMap = layerMapRef.current;

    for (const [id, obj] of existingMap) {
      if (!currentIds.has(id)) { fc.remove(obj); existingMap.delete(id); }
    }

    layers.forEach((layer) => {
      const existing = existingMap.get(layer.id);
      const isInside = layer.x >= printArea.x && layer.y >= printArea.y &&
        (layer.x + layer.width) <= (printArea.x + printArea.w) &&
        (layer.y + layer.height) <= (printArea.y + printArea.h);
      const lx = isInside ? layer.x : printArea.x + 20;
      const ly = isInside ? layer.y : printArea.y + 20;

      if (existing) {
        existing.set({ left: layer.x, top: layer.y, width: layer.width, height: layer.height, angle: layer.rotation, scaleX: layer.scaleX, scaleY: layer.scaleY });
        if (layer.type === 'text' && existing.type === 'text') {
          existing.set({ text: layer.text, fontSize: layer.fontSize, fontFamily: layer.fontFamily, fill: layer.fill });
        }
        existing.setCoords();
      } else if (layer.type === 'image' && layer.imageUrl) {
        FabricImage.fromURL(layer.imageUrl, { crossOrigin: 'anonymous' }).then((img) => {
          img.set({ left: lx, top: ly, scaleX: layer.width / (img.width || 150), scaleY: layer.height / (img.height || 150), angle: layer.rotation });
          (img as any).__layerId = layer.id;
          (img as any).__layerType = 'image';
          (img as any).__imageUrl = layer.imageUrl;
          img.setControlsVisibility({ mtr: true });
          fc.add(img);
          existingMap.set(layer.id, img);
          fc.requestRenderAll();
        });
      } else {
        const obj = new Text(layer.text || '', {
          left: lx, top: ly,
          fontSize: layer.fontSize || 24,
          fontFamily: layer.fontFamily || 'Arial',
          fill: layer.fill || '#000',
          angle: layer.rotation,
        });
        (obj as any).__layerId = layer.id;
        (obj as any).__layerType = layer.type;
        obj.setControlsVisibility({ mtr: true });
        fc.add(obj);
        existingMap.set(layer.id, obj);
      }
    });

    fc.requestRenderAll();
  }, [layers, printArea]);

  const isActive = activeSide === side;
  return (
    <div className={`editor-canvas ${isActive ? 'editor-canvas--active' : ''}`}
      onClick={() => setActiveSide(side)}
      style={{ border: isActive ? '3px solid #2563eb' : '3px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ padding: '4px 12px', background: isActive ? '#2563eb' : '#9ca3af', color: '#fff', fontSize: 14, fontWeight: 600, textAlign: 'center' }}>
        {side === 'nam' ? '👕 Áo Nam' : '👚 Áo Nữ'}
      </div>
      <canvas ref={canvasRef} />
    </div>
  );
}
