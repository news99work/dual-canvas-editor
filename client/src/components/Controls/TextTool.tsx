import { useState } from 'react';
import { useCanvasState, createTextLayer } from '../../hooks/useCanvasState';

const FONTS = ['Arial', 'Roboto', 'Inter', 'Playfair Display', 'Courier New'];

export default function TextTool() {
  const [text, setText] = useState('');
  const [fontSize, setFontSize] = useState(24);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [color, setColor] = useState('#000000');
  const activeSide = useCanvasState((s) => s.activeSide);
  const addTextLayer = useCanvasState((s) => s.addTextLayer);

  const handleAdd = () => {
    if (!text.trim()) return;
    addTextLayer(activeSide, createTextLayer({ text, fontSize, fontFamily, fill: color }));
    setText('');
  };

  return (
    <div>
      <h4 style={{ margin: '0 0 8px', fontSize: 14 }}>Thêm chữ</h4>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Nhập nội dung..."
        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #d1d5db', marginBottom: 8, boxSizing: 'border-box' }}
      />
      <div style={{ marginBottom: 8 }}>
        <label style={{ fontSize: 12, color: '#6b7280' }}>Font chữ</label>
        <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)}
          style={{ width: '100%', padding: 6, borderRadius: 6, border: '1px solid #d1d5db', marginTop: 4 }}>
          {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
      </div>
      <div style={{ marginBottom: 8 }}>
        <label style={{ fontSize: 12, color: '#6b7280' }}>Cỡ chữ: {fontSize}px</label>
        <input type="range" min={12} max={72} value={fontSize} onChange={(e) => setFontSize(+e.target.value)}
          style={{ width: '100%', marginTop: 4 }} />
      </div>
      <div style={{ marginBottom: 8 }}>
        <label style={{ fontSize: 12, color: '#6b7280' }}>Màu chữ</label>
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
          style={{ width: '100%', height: 36, borderRadius: 6, border: '1px solid #d1d5db', marginTop: 4, cursor: 'pointer' }} />
      </div>
      <button onClick={handleAdd}
        style={{ width: '100%', padding: 10, borderRadius: 8, background: '#2563eb', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
        ✚ Thêm chữ
      </button>
    </div>
  );
}
