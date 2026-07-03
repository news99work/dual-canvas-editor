import { useCanvasState } from '../../hooks/useCanvasState';

const PALETTE = [
  { label: 'Trắng', hex: '#FFFFFF' },
  { label: 'Đen', hex: '#000000' },
  { label: 'Đỏ', hex: '#FF0000' },
  { label: 'Xanh dương', hex: '#0000FF' },
  { label: 'Hồng', hex: '#FFC0CB' },
  { label: 'Vàng', hex: '#FFD700' },
  { label: 'Xám', hex: '#808080' },
  { label: 'Navy', hex: '#000080' },
  { label: 'Xanh lá', hex: '#008000' },
];

export default function ColorPicker() {
  const garmentColor = useCanvasState((s) => s.garmentColor);
  const setGarmentColor = useCanvasState((s) => s.setGarmentColor);

  return (
    <div>
      <h4 style={{ margin: '0 0 8px', fontSize: 14 }}>Chọn màu áo</h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {PALETTE.map((c) => (
          <button
            key={c.hex}
            onClick={() => setGarmentColor(c.hex)}
            style={{
              height: 40,
              borderRadius: 6,
              border: garmentColor === c.hex ? '3px solid #2563eb' : '1px solid #d1d5db',
              background: c.hex,
              cursor: 'pointer',
              boxShadow: garmentColor === c.hex ? '0 0 0 2px rgba(37,99,235,0.3)' : 'none',
            }}
            title={c.label}
          />
        ))}
      </div>
    </div>
  );
}
