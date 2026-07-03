import { useEffect, useRef, useCallback } from 'react';
import { fabric } from 'fabric';
import { useCanvasState, type CanvasSide, type CanvasLayer } from '../../hooks/useCanvasState';

interface EditorCanvasProps {
  side: CanvasSide;
  width: number;
  height: number;
  printArea: { x: number; y: number; w: number; h: number };
}

const PRINT_COLORS: Record<string, string> = {
  '#FFFFFF': '#fff',
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
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const layers = useCanvasState((s) => (side === 'nam' ? s.namLayers : s.nuLayers));
  const garmentColor = useCanvasState((s) => s.garmentColor);
  const activeSide = useCanvasState((s) => s.activeSide);
  const setActiveSide = useCanvasState((s) => s.setActiveSide);
  const setActiveLayer = useCanvasState((s) => s.setActiveLayer);
  const syncLayer = useCanvasState((s) => s.syncLayer);

  const colorHex = PRINT_COLORS[garmentColor] || garmentColor;

  // Init canvas
  useEffect(() => {
    if (!canvasRef.current || fabricRef.current) return;

    const fc = new fabric.Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor: '#f5f5f5',
      selection: true,
      preserveObjectStacking: true,
    });

    // Draw print area guide
    const guide = new fabric.Rect({
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
      excludeFromExport: true,
    });
    fc.add(guide);
    fc.sendToBack(guide);
    (fc as any).__printGuide = guide;

    fc.on('mouse:down', () => {
      setActiveSide(side);
    });

    fc.on('selection:created', (e: any) => {
      if (e.selected?.[0]) setActiveLayer((e.selected[0] as any).__layerId || null);
    });
    fc.on('selection:updated', (e: any) => {
      if (e.selected?.[0]) setActiveLayer((e.selected[0] as any).__layerId || null);
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

    fabricRef.current = fc;

    return () => {
      fc.dispose();
      fabricRef.current = null;
    };
  }, []);

  // Update garment color
  useEffect(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    const guide = (fc as any).__printGuide as fabric.Rect;
    if (guide) guide.set('fill', colorHex);
    fc.requestRenderAll();
  }, [garmentColor, colorHex]);

  // Sync layers from store to canvas
  const layerMapRef = useRef<Map<string, fabric.Object>>(new Map());

  useEffect(() => {
    const fc = fabricRef.current;
    if (!fc) return;

    const currentIds = new Set(layers.map((l) => l.id));
    const existingMap = layerMapRef.current;

    // Remove deleted layers
    for (const [id, obj] of existingMap) {
      if (!currentIds.has(id)) {
        fc.remove(obj);
        existingMap.delete(id);
      }
    }

    // Add/update layers
    layers.forEach((layer) => {
      const existing = existingMap.get(layer.id);
      if (existing) {
        existing.set({
          left: layer.x,
          top: layer.y,
          width: layer.width,
          height: layer.height,
          angle: layer.rotation,
          scaleX: layer.scaleX,
          scaleY: layer.scaleY,
        });
        if (layer.type === 'text' && existing.type === 'text') {
          (existing as fabric.Text).set({
            text: layer.text,
            fontSize: layer.fontSize,
            fontFamily: layer.fontFamily,
            fill: layer.fill,
          });
        }
        existing.setCoords();
      } else {
        const rect = new fabric.Rect({
          left: 0,
          top: 0,
          width: printArea.w,
          height: printArea.h,
          selectable: false,
          evented: false,
        });
        const isInside = layer.x >= printArea.x &&
          layer.y >= printArea.y &&
          (layer.x + layer.width) <= (printArea.x + printArea.w) &&
          (layer.y + layer.height) <= (printArea.y + printArea.h);

        let obj: fabric.Object;
        if (layer.type === 'image' && layer.imageUrl) {
          fabric.Image.fromURL(layer.imageUrl, (img) => {
            img.set({
              left: isInside ? layer.x : printArea.x + 20,
              top: isInside ? layer.y : printArea.y + 20,
              scaleX: layer.width / (img.width || 150),
              scaleY: layer.height / (img.height || 150),
              angle: layer.rotation,
            });
            (img as any).__layerId = layer.id;
            (img as any).__layerType = 'image';
            (img as any).__imageUrl = layer.imageUrl;
            img.setControlsVisibility({ mtr: true });
            fc.add(img);
            existingMap.set(layer.id, img);
            fc.requestRenderAll();
          }, { crossOrigin: 'anonymous' });
          return;
        } else {
          obj = new fabric.Text(layer.text || '', {
            left: isInside ? layer.x : printArea.x + 20,
            top: isInside ? layer.y : printArea.y + 20,
            fontSize: layer.fontSize || 24,
            fontFamily: layer.fontFamily || 'Arial',
            fill: layer.fill || '#000',
            angle: layer.rotation,
          });
        }

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
    <div
      className={`editor-canvas ${isActive ? 'editor-canvas--active' : ''}`}
      onClick={() => setActiveSide(side)}
      style={{ border: isActive ? '3px solid #2563eb' : '3px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}
    >
      <div style={{ padding: '4px 12px', background: isActive ? '#2563eb' : '#9ca3af', color: '#fff', fontSize: 14, fontWeight: 600, textAlign: 'center' }}>
        {side === 'nam' ? '👕 Áo Nam' : '👚 Áo Nữ'}
      </div>
      <canvas ref={canvasRef} />
    </div>
  );
}
