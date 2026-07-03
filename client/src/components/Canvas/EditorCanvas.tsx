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

export default function EditorCanvas({ side, width, height, printArea }: EditorCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fcRef = useRef<Canvas | null>(null);
  const garmentRef = useRef<any>(null);
  const layers = useCanvasState((s) => (side === 'nam' ? s.namLayers : s.nuLayers));
  const garmentColor = useCanvasState((s) => s.garmentColor);
  const activeSide = useCanvasState((s) => s.activeSide);
  const setActiveSide = useCanvasState((s) => s.setActiveSide);
  const setActiveLayer = useCanvasState((s) => s.setActiveLayer);
  const syncLayer = useCanvasState((s) => s.syncLayer);
  const colorHex = GARMENT_COLORS[garmentColor] || garmentColor;

  // Init canvas + load SVG garment
  useEffect(() => {
    if (!canvasRef.current || fcRef.current) return;
    const fc = new Canvas(canvasRef.current, {
      width, height,
      backgroundColor: 'white',
      selection: true,
      preserveObjectStacking: true,
    });

    // Load SVG garment mockup
    (fabric as any).loadSVGFromURL('/assets/shirt-front.svg').then((objects: any[]) => {
      const group = new (fabric as any).Group(objects, {
        left: width / 2,
        top: height / 2,
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: false,
        excludeFromExport: true,
      });
      // Scale to fit canvas
      const scale = Math.min((width - 40) / (group.width || 300), (height - 40) / (group.height || 400));
      group.set({ scaleX: scale, scaleY: scale });
      garmentRef.current = group;
      fc.add(group);
      fc.sendObjectToBack(group);
      fc.requestRenderAll();
    });

    // Print area guide
    const guide = new Rect({
      left: printArea.x, top: printArea.y, width: printArea.w, height: printArea.h,
      fill: 'transparent', stroke: 'rgba(109,94,248,.4)', strokeWidth: 2, strokeDashArray: [8, 4],
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
    return () => {
      fc.dispose();
      fcRef.current = null;
      if (canvasRef.current) {
        // Replace canvas element to allow re-initialization
        const parent = canvasRef.current.parentNode;
        if (parent) {
          const clone = canvasRef.current.cloneNode(true) as HTMLCanvasElement;
          parent.replaceChild(clone, canvasRef.current);
        }
      }
    };
  }, []);

  // Sync layers from store
  const layerMapRef = useRef<Map<string, any>>(new Map());

  useEffect(() => {
    const fc = fcRef.current;
    if (!fc) return;
    const currentIds = new Set(layers.map((l) => l.id));
    const em = layerMapRef.current;

    for (const [id, obj] of em) {
      if (!currentIds.has(id)) { fc.remove(obj); em.delete(id); }
    }

    layers.forEach((layer) => {
      const ex = em.get(layer.id);
      if (ex) {
        ex.set({ left: layer.x, top: layer.y, width: layer.width, height: layer.height, angle: layer.rotation, scaleX: 1, scaleY: 1 });
        if (layer.type === 'text') ex.set({ text: layer.text, fontSize: layer.fontSize, fontFamily: layer.fontFamily, fill: layer.fill });
        ex.setCoords();
      } else if (layer.type === 'image' && layer.imageUrl) {
        FabricImage.fromURL(layer.imageUrl, { crossOrigin: 'anonymous' }).then((img) => {
          img.set({ left: layer.x, top: layer.y, scaleX: layer.width / (img.width || 150), scaleY: layer.height / (img.height || 150), angle: layer.rotation });
          (img as any).__layerId = layer.id; (img as any).__layerType = 'image'; (img as any).__imageUrl = layer.imageUrl;
          img.setControlsVisibility({ mtr: true });
          fc.add(img); em.set(layer.id, img); fc.requestRenderAll();
        });
      } else {
        const txt = new (fabric as any).Text(layer.text || '', { left: layer.x, top: layer.y, fontSize: layer.fontSize || 24, fontFamily: layer.fontFamily || 'Inter', fill: layer.fill || '#000', angle: layer.rotation });
        (txt as any).__layerId = layer.id; (txt as any).__layerType = 'text';
        txt.setControlsVisibility({ mtr: true });
        fc.add(txt); em.set(layer.id, txt);
      }
    });
    fc.requestRenderAll();
  }, [layers]);

  return (
    <div className="editor-canvas" onClick={() => setActiveSide(side)} style={{ borderRadius: 12, overflow: 'hidden' }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
