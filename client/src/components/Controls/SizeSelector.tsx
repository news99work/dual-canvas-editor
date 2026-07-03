import { useState } from 'react';

const SIZES = ['S', 'M', 'L', 'XL', '2XL'];
const SIZE_PRICES: Record<string, number> = { S: 0, M: 0, L: 10000, XL: 20000, '2XL': 30000 };
const LAYER_PRICE = 20000;

export default function SizeSelector() {
  const [namSize, setNamSize] = useState('M');
  const [nuSize, setNuSize] = useState('M');
  const [quantity, setQuantity] = useState(1);

  const basePrice = 150000;
  const namExtra = SIZE_PRICES[namSize];
  const nuExtra = SIZE_PRICES[nuSize];
  const layerCount = 0;
  const total = (basePrice + namExtra + nuExtra + layerCount * LAYER_PRICE) * quantity;

  return (
    <div>
      <h4 style={{ margin: '0 0 8px', fontSize: 14 }}>Chọn size</h4>

      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 }}>👕 Size áo Nam</label>
        <div style={{ display: 'flex', gap: 4 }}>
          {SIZES.map((s) => (
            <button key={s} onClick={() => setNamSize(s)}
              style={{
                flex: 1, padding: '6px 0', borderRadius: 6, border: namSize === s ? '2px solid #2563eb' : '1px solid #d1d5db',
                background: namSize === s ? '#eff6ff' : '#fff', fontWeight: namSize === s ? 700 : 400, cursor: 'pointer', fontSize: 13,
              }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 }}>👚 Size áo Nữ</label>
        <div style={{ display: 'flex', gap: 4 }}>
          {['S', 'M', 'L', 'XL'].map((s) => (
            <button key={s} onClick={() => setNuSize(s)}
              style={{
                flex: 1, padding: '6px 0', borderRadius: 6, border: nuSize === s ? '2px solid #2563eb' : '1px solid #d1d5db',
                background: nuSize === s ? '#eff6ff' : '#fff', fontWeight: nuSize === s ? 700 : 400, cursor: 'pointer', fontSize: 13,
              }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: '#6b7280' }}>Số lượng</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => setQuantity(Math.max(1, quantity - 1))}
            style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: 16 }}>−</button>
          <span style={{ fontWeight: 600, minWidth: 20, textAlign: 'center' }}>{quantity}</span>
          <button onClick={() => setQuantity(quantity + 1)}
            style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: 16 }}>+</button>
        </div>
      </div>

      <div style={{ padding: 12, background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
        <div style={{ fontSize: 12, color: '#6b7280' }}>Tạm tính ({quantity} cặp)</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: '#166534' }}>
          {total.toLocaleString('vi-VN')}₫
        </div>
        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
          {basePrice.toLocaleString()}₫/cặp + {namExtra ? `${namExtra.toLocaleString()}₫ size Nam` : ''}{nuExtra ? ` + ${nuExtra.toLocaleString()}₫ size Nữ` : ''}
        </div>
      </div>
    </div>
  );
}
