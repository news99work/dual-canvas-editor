import { useCanvasState } from '../../hooks/useCanvasState';

const PALETTE = [
  { label: 'Trắng', hex: '#FFFFFF' },
  { label: 'Đen', hex: '#1A1A1A' },
  { label: 'Đỏ', hex: '#E53935' },
  { label: 'Xanh Navy', hex: '#1A237E' },
  { label: 'Hồng', hex: '#EC407A' },
  { label: 'Vàng Gold', hex: '#FFB300' },
  { label: 'Xanh lá', hex: '#2E7D32' },
  { label: 'Tím', hex: '#6D5EF8' },
  { label: 'Cam', hex: '#EF6C00' },
  { label: 'Xám', hex: '#616161' },
];

export default function ColorPicker() {
  const garmentColor = useCanvasState((s) => s.garmentColor);
  const setGarmentColor = useCanvasState((s) => s.setGarmentColor);

  return (
    <div className="color-grid">
      {PALETTE.map((c) => (
        <button
          key={c.hex}
          onClick={() => setGarmentColor(c.hex)}
          className={`color-swatch ${garmentColor === c.hex ? 'color-swatch--active' : ''}`}
          style={{ background: c.hex }}
          title={c.label}
        />
      ))}
    </div>
  );
}
