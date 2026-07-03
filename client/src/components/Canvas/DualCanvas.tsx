import { useCanvasState } from '../../hooks/useCanvasState';
import EditorCanvas from './EditorCanvas';

const CANVAS_W = 400;
const CANVAS_H = 500;
const PRINT_AREA = { x: 60, y: 100, w: 280, h: 320 };

export default function DualCanvas() {
  const viewMode = useCanvasState((s) => s.viewMode);
  const setViewMode = useCanvasState((s) => s.setViewMode);

  return (
    <div className="dual-canvas">
      <div className="dual-canvas__toolbar">
        <button
          className={`view-toggle ${viewMode === 'front' ? 'view-toggle--active' : ''}`}
          onClick={() => setViewMode('front')}
        >
          🧥 Mặt trước
        </button>
        <button
          className={`view-toggle ${viewMode === 'back' ? 'view-toggle--active' : ''}`}
          onClick={() => setViewMode('back')}
        >
          👕 Mặt sau
        </button>
      </div>
      <div className="dual-canvas__grid">
        <EditorCanvas side="nam" width={CANVAS_W} height={CANVAS_H} printArea={PRINT_AREA} />
        <EditorCanvas side="nu" width={CANVAS_W} height={CANVAS_H} printArea={PRINT_AREA} />
      </div>
    </div>
  );
}
