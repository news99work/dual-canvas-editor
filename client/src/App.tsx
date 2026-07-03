import { useState } from 'react';
import DualCanvas from './components/Canvas/DualCanvas';
import './App.css';

type RightTab = 'product' | 'text' | 'upload' | 'layer';

function App() {
  const [rightTab, setRightTab] = useState<RightTab>('product');

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <span className="logo">dualcanvas</span>
        </div>
        <div className="header-right">
          <button className="header-icon">🏠</button>
          <button className="header-icon">🌙</button>
          <button className="header-icon">📥</button>
          <button className="header-icon">🔗</button>
          <button className="header-icon">🗑️</button>
          <span className="header-price">
            179.000₫ <span className="badge">-28%</span>
          </span>
          <button className="btn-order">Đặt hàng</button>
        </div>
      </header>

      <div className="app-body">
        {/* Left Icon Sidebar */}
        <nav className="icon-sidebar">
          <div className={`icon-sidebar__item ${rightTab === 'product' ? 'icon-sidebar__item--active' : ''}`}
            onClick={() => setRightTab('product')}>
            <span>👕</span><span className="icon-label">Sản phẩm</span>
          </div>
          <div className="icon-sidebar__item">
            <span>📚</span><span className="icon-label">Thư viện</span>
          </div>
          <div className={`icon-sidebar__item ${rightTab === 'upload' ? 'icon-sidebar__item--active' : ''}`}
            onClick={() => setRightTab('upload')}>
            <span>📤</span><span className="icon-label">Upload</span>
          </div>
          <div className={`icon-sidebar__item ${rightTab === 'text' ? 'icon-sidebar__item--active' : ''}`}
            onClick={() => setRightTab('text')}>
            <span>🔤</span><span className="icon-label">Text</span>
          </div>
          <div className="icon-sidebar__item">
            <span>🤖</span><span className="icon-label">AI</span>
          </div>
          <div className="icon-sidebar__item">
            <span>⬛</span><span className="icon-label">Element</span>
          </div>
          <div className={`icon-sidebar__item ${rightTab === 'layer' ? 'icon-sidebar__item--active' : ''}`}
            onClick={() => setRightTab('layer')}>
            <span>📑</span><span className="icon-label">Layer</span>
          </div>
        </nav>

        {/* Center Canvas */}
        <section className="canvas-area">
          <DualCanvas />
          <div className="zoom-controls">
            <button className="zoom-btn">−</button><span>100%</span><button className="zoom-btn">+</button>
          </div>
        </section>

        {/* Right Panel — All controls */}
        <aside className="right-panel">
          {rightTab === 'product' && <ProductPanel />}
          {rightTab === 'text' && <TextPanel />}
          {rightTab === 'upload' && <UploadPanel />}
          {rightTab === 'layer' && <LayerPanel />}
        </aside>
      </div>
    </div>
  );
}

// ====== Right Panel Sections ======

function ProductPanel() {
  const { useCanvasState } = require('./hooks/useCanvasState');
  const garmentColor = useCanvasState((s: any) => s.garmentColor);
  const setGarmentColor = useCanvasState((s: any) => s.setGarmentColor);
  const [printPos, setPrintPos] = useState('front');
  const [namSize, setNamSize] = useState('M');

  const PALETTE = ['#FFFFFF','#1A1A1A','#E53935','#1A237E','#EC407A','#FFB300','#2E7D32','#6D5EF8','#EF6C00','#616161'];

  return (
    <div className="right-panel-scroll">
      <Section title="Sản phẩm">
        <div className="product-info">
          <div className="product-thumb">👕</div>
          <div>
            <div style={{fontWeight:600,fontSize:14}}>Áo thun Premium</div>
            <div style={{fontSize:12,color:'var(--text-muted)'}}>100% Cotton</div>
          </div>
          <button className="btn-change">Đổi</button>
        </div>
      </Section>

      <Section title="Vị trí in">
        <div className="segment-group">
          {['front','back','both'].map(p => (
            <button key={p} className={`segment-btn ${printPos===p?'segment-btn--active':''}`}
              onClick={() => setPrintPos(p)}>
              {p==='front'?'Mặt trước':p==='back'?'Mặt sau':'Cả 2 mặt'}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Màu sắc">
        <div className="color-grid" style={{gridTemplateColumns:'repeat(5,1fr)'}}>
          {PALETTE.map(c => (
            <button key={c} className={`color-swatch ${garmentColor===c?'color-swatch--active':''}`}
              style={{background:c}} onClick={()=>setGarmentColor(c)} />
          ))}
        </div>
      </Section>

      <Section title="Kích cỡ">
        <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:8}}>👕 Size Nam</div>
        <div className="size-grid">
          {['S','M','L','XL','2XL'].map(s => (
            <button key={s} className={`size-btn ${namSize===s?'size-btn--active':''}`}
              onClick={()=>setNamSize(s)}>{s}</button>
          ))}
        </div>
        <button className="btn-link" style={{marginTop:8}}>📐 Bảng size</button>
      </Section>

      <Section title="Công nghệ in">
        <div className="segment-group">
          <button className="segment-btn segment-btn--active">DTF</button>
          <button className="segment-btn">DTG</button>
        </div>
      </Section>

      <Section title="Bảng tính giá">
        <div className="pricing-box">
          <div className="pricing-row"><span>Áo thun Premium ×1</span><span>250.000₫</span></div>
          <div className="pricing-row"><span>In DTF mặt trước</span><span>80.000₫</span></div>
          <div className="pricing-row"><span>Giảm giá</span><span className="badge">-28%</span></div>
          <div className="pricing-total">
            <span>Tổng cộng</span>
            <strong>179.000₫</strong>
          </div>
        </div>
      </Section>

      <div style={{padding:'0 20px 20px'}}>
        <button className="btn-primary">📥 Xuất file in</button>
        <p className="support-link">Yêu cầu hỗ trợ</p>
      </div>
    </div>
  );
}

function TextPanel() {
  const [text, setText] = useState('');
  const { useCanvasState, createTextLayer } = require('./hooks/useCanvasState');
  const activeSide = useCanvasState((s: any) => s.activeSide);
  const addTextLayer = useCanvasState((s: any) => s.addTextLayer);

  return (
    <div className="right-panel-scroll">
      <Section title="Thêm chữ">
        <input className="input-field" placeholder="Nhập nội dung..." value={text}
          onChange={e=>setText(e.target.value)} />
        <div style={{display:'flex',gap:8,marginTop:8}}>
          <select className="select-field" style={{flex:2}}>
            <option>Inter</option><option>Arial</option><option>Roboto</option>
          </select>
          <input type="number" className="prop-input" defaultValue={24} style={{flex:1}} />
        </div>
        <button className="btn-primary" style={{marginTop:12}}
          onClick={()=>{if(text.trim()){addTextLayer(activeSide, createTextLayer({text}));setText('');}}}>
          ✚ Thêm chữ
        </button>
      </Section>
    </div>
  );
}

function UploadPanel() {
  return (
    <div className="right-panel-scroll">
      <Section title="Upload ảnh">
        <label className="upload-zone">
          📁 Nhấn để chọn ảnh
          <input type="file" accept="image/*" style={{display:'none'}} />
        </label>
      </Section>
    </div>
  );
}

function LayerPanel() {
  const { useCanvasState } = require('./hooks/useCanvasState');
  const layers = useCanvasState((s: any) => s.namLayers);
  const deleteLayer = useCanvasState((s: any) => s.deleteLayer);
  const activeSide = useCanvasState((s: any) => s.activeSide);

  return (
    <div className="right-panel-scroll">
      <Section title="Layers">
        {layers.length===0 ? (
          <p style={{fontSize:13,color:'var(--text-muted)'}}>Chưa có layer. Thêm chữ hoặc ảnh.</p>
        ) : layers.map((l: any) => (
          <div key={l.id} className="layer-item">
            <span>{l.type==='text'?'🔤':'🖼️'} {l.text||'Image'}</span>
            <button className="zoom-btn" onClick={()=>deleteLayer(activeSide,l.id)}>🗑️</button>
          </div>
        ))}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="panel-section">
      <div className="panel-section__title">{title}</div>
      {children}
    </div>
  );
}

export default App;
