import { useState } from 'react';

const NAM_SIZES = ['S', 'M', 'L', 'XL', '2XL'];
const NU_SIZES = ['S', 'M', 'L', 'XL'];
const BASE_PRICE = 150000;

export default function SizeSelector() {
  const [namSize, setNamSize] = useState('M');
  const [nuSize, setNuSize] = useState('M');
  const [quantity, setQuantity] = useState(1);

  const sizeExtra = (s: string) => (s === '2XL' ? 30000 : s === 'XL' ? 20000 : 0);
  const total = (BASE_PRICE + sizeExtra(namSize) + sizeExtra(nuSize)) * quantity;

  return (
    <div>
      {/* Segmented control: Nam/Nữ */}
      <div className="segment-group" style={{ marginBottom: 16 }}>
        <button className="segment-btn segment-btn--active">👕 Nam</button>
        <button className="segment-btn">👚 Nữ</button>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Size Nam</div>
        <div className="size-grid">
          {NAM_SIZES.map((s) => (
            <button key={s} onClick={() => setNamSize(s)}
              className={`size-btn ${namSize === s ? 'size-btn--active' : ''}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Size Nữ</div>
        <div className="size-grid">
          {NU_SIZES.map((s) => (
            <button key={s} onClick={() => setNuSize(s)}
              className={`size-btn ${nuSize === s ? 'size-btn--active' : ''}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="pricing-box">
        <div className="pricing-row"><span>Giá gốc / cặp</span><span>{BASE_PRICE.toLocaleString('vi-VN')}₫</span></div>
        <div className="pricing-row"><span>Số lượng</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className="zoom-btn" onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
            <strong>{quantity}</strong>
            <button className="zoom-btn" onClick={() => setQuantity(quantity + 1)}>+</button>
          </span>
        </div>
        <div className="pricing-total">
          <span>Tạm tính</span>
          <strong>{total.toLocaleString('vi-VN')}₫</strong>
        </div>
        {quantity > 1 && <span className="badge">−{Math.round((1 - quantity/(quantity+1)) * 100)}%</span>}
      </div>
    </div>
  );
}
