import { useCanvasState } from '../../hooks/useCanvasState';

export default function PropertiesPanel() {
  const activeLayerId = useCanvasState((s) => s.activeLayerId);
  const activeSide = useCanvasState((s) => s.activeSide);
  const layers = useCanvasState((s) => (activeSide === 'nam' ? s.namLayers : s.nuLayers));
  const updateLayer = useCanvasState((s) => s.updateLayer);
  const deleteLayer = useCanvasState((s) => s.deleteLayer);

  const layer = layers.find((l) => l.id === activeLayerId);

  if (!layer) {
    return (
      <div className="properties-panel">
        <div className="properties-panel__header">Thuộc tính</div>
        <div className="properties-panel__empty">
          <div style={{ fontSize: 32, marginBottom: 8 }}>👆</div>
          <p style={{ fontSize: 13, color: '#9ca3af' }}>Chọn 1 layer trên áo để chỉnh sửa</p>
        </div>
      </div>
    );
  }

  return (
    <div className="properties-panel">
      <div className="properties-panel__header">
        {layer.type === 'text' ? '🔤 Chữ' : '🖼️ Ảnh'}
        <button onClick={() => deleteLayer(activeSide, layer.id)}
          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 18 }}>🗑️</button>
      </div>

      <div className="properties-panel__body">
        {/* Position */}
        <div className="prop-group">
          <label className="prop-label">Vị trí</label>
          <div className="prop-row">
            <span>X</span>
            <input type="number" value={Math.round(layer.x)} onChange={(e) => updateLayer(activeSide, layer.id, { x: +e.target.value })}
              className="prop-input" />
            <span>Y</span>
            <input type="number" value={Math.round(layer.y)} onChange={(e) => updateLayer(activeSide, layer.id, { y: +e.target.value })}
              className="prop-input" />
          </div>
        </div>

        {/* Size */}
        <div className="prop-group">
          <label className="prop-label">Kích thước</label>
          <div className="prop-row">
            <span>W</span>
            <input type="number" value={Math.round(layer.width)} onChange={(e) => updateLayer(activeSide, layer.id, { width: +e.target.value })}
              className="prop-input" />
            <span>H</span>
            <input type="number" value={Math.round(layer.height)} onChange={(e) => updateLayer(activeSide, layer.id, { height: +e.target.value })}
              className="prop-input" />
          </div>
        </div>

        {/* Rotation */}
        <div className="prop-group">
          <label className="prop-label">Xoay: {layer.rotation}°</label>
          <input type="range" min={0} max={360} value={layer.rotation}
            onChange={(e) => updateLayer(activeSide, layer.id, { rotation: +e.target.value })}
            style={{ width: '100%', marginTop: 4 }} />
        </div>

        {/* Text properties */}
        {layer.type === 'text' && (
          <>
            <div className="prop-group">
              <label className="prop-label">Nội dung</label>
              <input type="text" value={layer.text || ''} onChange={(e) => updateLayer(activeSide, layer.id, { text: e.target.value })}
                className="prop-input" style={{ width: '100%' }} />
            </div>
            <div className="prop-group">
              <label className="prop-label">Font size: {layer.fontSize}px</label>
              <input type="range" min={12} max={72} value={layer.fontSize || 24}
                onChange={(e) => updateLayer(activeSide, layer.id, { fontSize: +e.target.value })}
                style={{ width: '100%', marginTop: 4 }} />
            </div>
            <div className="prop-group">
              <label className="prop-label">Màu chữ</label>
              <input type="color" value={layer.fill || '#000'}
                onChange={(e) => updateLayer(activeSide, layer.id, { fill: e.target.value })}
                style={{ width: '100%', height: 32, borderRadius: 6, border: '1px solid #d1d5db', cursor: 'pointer' }} />
            </div>
          </>
        )}

        {/* Image properties */}
        {layer.type === 'image' && (
          <div className="prop-group">
            <label className="prop-label">URL ảnh</label>
            <input type="text" value={layer.imageUrl || ''} readOnly
              className="prop-input" style={{ width: '100%', fontSize: 11, color: '#9ca3af' }} />
          </div>
        )}
      </div>
    </div>
  );
}
