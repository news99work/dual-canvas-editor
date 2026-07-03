import { useCanvasState } from '../../hooks/useCanvasState';
import EditorCanvas from './EditorCanvas';

const CANVAS_W = 360;
const CANVAS_H = 480;
const PRINT_AREA = { x: 50, y: 90, w: 260, h: 300 };

export default function DualCanvas() {
  const viewMode = useCanvasState((s) => s.viewMode);
  const setViewMode = useCanvasState((s) => s.setViewMode);

  return (
    <div className="dual-canvas">
      <div className="dual-canvas__toolbar">
        <button className={`view-toggle ${viewMode === 'front' ? 'view-toggle--active' : ''}`}
          onClick={() => setViewMode('front')}>Mặt trước</button>
        <button className={`view-toggle ${viewMode === 'back' ? 'view-toggle--active' : ''}`}
          onClick={() => setViewMode('back')}>Mặt sau</button>
      </div>
      <div className="dual-canvas__grid">
        <div className="canvas-wrapper">
          <div className="canvas-wrapper__label">👕 Nam</div>
          <EditorCanvas side="nam" width={CANVAS_W} height={CANVAS_H} printArea={PRINT_AREA} />
        </div>
        <div className="canvas-wrapper">
          <div className="canvas-wrapper__label">👚 Nữ</div>
          <EditorCanvas side="nu" width={CANVAS_W} height={CANVAS_H} printArea={PRINT_AREA} />
        </div>
      </div>
    </div>
  );
}
