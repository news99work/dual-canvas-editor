import { useEffect, useRef } from 'react';
import { Canvas, Rect, FabricImage } from 'fabric';
import { useCanvasState, type CanvasSide, type CanvasLayer } from '../../hooks/useCanvasState';

interface EditorCanvasProps {
  side: CanvasSide;
  width: number;
  height: number;
  printArea: { x: number; y: number; w: number; h: number };
}

const GARMENT_COLORS: Record<string, string> = {
  '#FFFFFF': '#F5F5F5', '#1A1A1A': '#1A1A1A', '#E53935': '#E53935',
  '#1A237E': '#1A237E', '#EC407A': '#EC407A', '#FFB300': '#FFB300',
  '#2E7D32': '#2E7D32', '#6D5EF8': '#6D5EF8', '#EF6C00': '#EF6C00', '#616161': '#616161',
};

function drawShirt(fc: Canvas, px: number, py: number, pw: number, ph: number, color: string) {
  const cx = px + pw / 2;
  const neckW = pw * 0.3;
  const sleeveH = ph * 0.25;
  const bodyTop = py + sleeveH * 0.7;

  const path = new (fabric as any).Path(
    `M ${cx - neckW/2} ${py + ph*0.06}
     L ${cx - neckW/2} ${py + ph*0.10}
     L ${cx - pw*0.35} ${py + ph*0.02}
     L ${px + 10} ${bodyTop}
     L ${px + 10} ${py + ph - 10}
     L ${px + pw - 10} ${py + ph - 10}
     L ${px + pw - 10} ${bodyTop}
     L ${cx + pw*0.35} ${py + ph*0.02}
     L ${cx + neckW/2} ${py + ph*0.10}
     L ${cx + neckW/2} ${py + ph*0.06}
     Z`,
    {
      fill: color,
      stroke: 'rgba(0,0,0,0.15)',
      strokeWidth: 1,
      selectable: false,
      evented: false,
      excludeFromExport: true,
    }
  );
  fc.add(path);
  fc.sendObjectToBack(path);
  return path;
}

export default function EditorCanvas({ side, width, height, printArea }: EditorCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fcRef = useRef<Canvas | null>(null);
  const shirtRef = useRef<any>(null);
  const layers = useCanvasState((s) => (side === 'nam' ? s.namLayers : s.nuLayers));
  const garmentColor = useCanvasState((s) => s.garmentColor);
  const activeSide = useCanvasState((s) => s.activeSide);
  const setActiveSide = useCanvasState((s) => s.setActiveSide);
  const setActiveLayer = useCanvasState((s) => s.setActiveLayer);
  const syncLayer = useCanvasState((s) => s.syncLayer);
  const colorHex = GARMENT_COLORS[garmentColor] || garmentColor;

  useEffect(() => {
    if (!canvasRef.current || fcRef.current) return;
    const fc = new Canvas(canvasRef.current, {
      width, height,
      backgroundColor: 'transparent',
      selection: true,
      preserveObjectStacking: true,
    });

    // Draw garment mockup
    const shirt = drawShirt(fc, 10, 10, width - 20, height - 20, colorHex);
    shirtRef.current = shirt;

    // Print area indicator
    const guide = new Rect({
      left: printArea.x, top: printArea.y, width: printArea.w, height: printArea.h,
      fill: 'transparent',
      stroke: 'rgba(255,255,255,0.15)',
      strokeWidth: 1,
      strokeDashArray: [6, 4],
      selectable: false, evented: false,
    });
    fc.add(guide);

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
        id: obj.__layerId, type: obj.__layerType || 'text',
        x: obj.left ?? 0, y: obj.top ?? 0,
        width: (obj.width ?? 0) * (obj.scaleX ?? 1),
        height: (obj.height ?? 0) * (obj.scaleY ?? 1),
        rotation: obj.angle ?? 0,
        zIndex: fc.getObjects().indexOf(obj),
        scaleX: 1, scaleY: 1,
        text: obj.text, fontSize: obj.fontSize, fontFamily: obj.fontFamily,
        fill: obj.fill as string, imageUrl: obj.__imageUrl,
      };
      obj.set({ scaleX: 1, scaleY: 1 });
      obj.setCoords();
      syncLayer(side, layer);
    });

    fcRef.current = fc;
    return () => { fc.dispose(); fcRef.current = null; };
  }, []);

  // Update garment color
  useEffect(() => {
    const fc = fcRef.current;
    if (!fc) return;
    if (shirtRef.current) fc.remove(shirtRef.current);
    const shirt = drawShirt(fc, 10, 10, width - 20, height - 20, colorHex);
    shirtRef.current = shirt;
    fc.requestRenderAll();
  }, [garmentColor, colorHex]);

  // Sync layers
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
      const lx = layer.x, ly = layer.y;

      if (existing) {
        existing.set({ left: lx, top: ly, width: layer.width, height: layer.height, angle: layer.rotation, scaleX: layer.scaleX, scaleY: layer.scaleY });
        if (layer.type === 'text') existing.set({ text: layer.text, fontSize: layer.fontSize, fontFamily: layer.fontFamily, fill: layer.fill });
        existing.setCoords();
      } else if (layer.type === 'image' && layer.imageUrl) {
        FabricImage.fromURL(layer.imageUrl, { crossOrigin: 'anonymous' }).then((img) => {
          img.set({ left: lx, top: ly, scaleX: layer.width / (img.width || 150), scaleY: layer.height / (img.height || 150), angle: layer.rotation });
          (img as any).__layerId = layer.id; (img as any).__layerType = 'image'; (img as any).__imageUrl = layer.imageUrl;
          img.setControlsVisibility({ mtr: true });
          fc.add(img); existingMap.set(layer.id, img); fc.requestRenderAll();
        });
      } else {
        const txt = new (fabric as any).Text(layer.text || '', { left: lx, top: ly, fontSize: layer.fontSize || 24, fontFamily: layer.fontFamily || 'Inter', fill: layer.fill || '#fff', angle: layer.rotation });
        (txt as any).__layerId = layer.id; (txt as any).__layerType = 'text';
        txt.setControlsVisibility({ mtr: true });
        fc.add(txt); existingMap.set(layer.id, txt);
      }
    });
    fc.requestRenderAll();
  }, [layers, printArea]);

  const isActive = activeSide === side;
  return (
    <div className="editor-canvas" onClick={() => setActiveSide(side)} style={{ borderRadius: 12, overflow: 'hidden' }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
