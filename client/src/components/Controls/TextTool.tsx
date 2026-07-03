import { useState } from 'react';
import { useCanvasState, createTextLayer } from '../../hooks/useCanvasState';

const FONTS = ['Inter', 'Arial', 'Roboto', 'Playfair Display', 'Courier New'];

export default function TextTool() {
  const [text, setText] = useState('');
  const [fontSize, setFontSize] = useState(24);
  const [fontFamily, setFontFamily] = useState('Inter');
  const [color, setColor] = useState('#FFFFFF');
  const activeSide = useCanvasState((s) => s.activeSide);
  const addTextLayer = useCanvasState((s) => s.addTextLayer);

  const handleAdd = () => {
    if (!text.trim()) return;
    addTextLayer(activeSide, createTextLayer({ text, fontSize, fontFamily, fill: color }));
    setText('');
  };

  return (
    <div className="text-input-group">
      <input
        className="input-field"
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Nhập nội dung chữ..."
        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
      />
      <select className="select-field" value={fontFamily} onChange={(e) => setFontFamily(e.target.value)}>
        {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
      </select>
      <div className="slider-row">
        <span>{fontSize}px</span>
        <input type="range" min={12} max={72} value={fontSize} onChange={(e) => setFontSize(+e.target.value)} />
      </div>
      <div className="slider-row">
        <span>Màu</span>
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
          style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--border-strong)', cursor: 'pointer', background: 'none' }} />
      </div>
      <button className="btn-primary" onClick={handleAdd}>✚ Thêm chữ</button>
    </div>
  );
}
