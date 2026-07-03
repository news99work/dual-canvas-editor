import { useState } from 'react';

export default function SizeSelector() {
  const [namSize, setNamSize] = useState('L');
  const [nuSize, setNuSize] = useState('M');

  return (
    <div>
      <h4 style={{ margin: '0 0 8px', fontSize: 14 }}>Chọn size</h4>
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 12, color: '#6b7280', marginBottom: 4, display: 'block' }}>👕 Size Nam</label>
        <select value={namSize} onChange={(e) => setNamSize(e.target.value)}
          style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14 }}>
          {['S', 'M', 'L', 'XL', '2XL'].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <label style={{ fontSize: 12, color: '#6b7280', marginBottom: 4, display: 'block' }}>👚 Size Nữ</label>
        <select value={nuSize} onChange={(e) => setNuSize(e.target.value)}
          style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14 }}>
          {['S', 'M', 'L', 'XL'].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
    </div>
  );
}
