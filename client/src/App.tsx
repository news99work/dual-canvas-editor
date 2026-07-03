import { useState, useCallback } from 'react';
import DualCanvas from './components/Canvas/DualCanvas';
import { useCanvasState } from './hooks/useCanvasState';
import './App.css';

function App() {
  const activeLayerId = useCanvasState((s) => s.activeLayerId);

  return (
    <div className="app">
      {/* ==== GLOBAL HEADER ==== */}
      <header className="app-header">
        <div className="header-left">
          <span className="logo">dualcanvas</span>
          <span className="header-breadcrumb">/ Thiết kế / Áo đôi</span>
        </div>
        <div className="header-right">
          <span className="header-price">179.000₫ <span className="badge">-28%</span></span>
          <button className="btn-order">Đặt hàng</button>
        </div>
      </header>

      <div className="app-body">
        {/* ==== ZONE 1: SIDEBAR (Navigation) ==== */}
        <nav className="zone-sidebar">
          <SidebarItem icon="👕" label="Sản phẩm" active />
          <SidebarItem icon="📚" label="Thư viện" />
          <SidebarItem icon="🤖" label="AI" />
          <SidebarItem icon="📑" label="Layers" />
          <div className="sidebar-spacer" />
          <SidebarItem icon="⚙️" label="Cài đặt" />
        </nav>

        {/* ==== ZONE 2: LEFT PANEL (Product Config) ==== */}
        <aside className="zone-left">
          <ProductConfigPanel />
        </aside>

        {/* ==== ZONE 3: CANVAS WORKSPACE ==== */}
        <section className="zone-canvas">
          <DualCanvas />
        </section>

        {/* ==== ZONE 4: RIGHT PANEL (Inspector) ==== */}
        <aside className="zone-right">
          {activeLayerId ? <ObjectInspector /> : <CanvasSettings />}
        </aside>
      </div>
    </div>
  );
}

function SidebarItem({ icon, label, active }: { icon: string; label: string; active?: boolean }) {
  return (
    <div className={`sidebar-item ${active ? 'sidebar-item--active' : ''}`} title={label}>
      <span className="sidebar-icon">{icon}</span>
      <span className="sidebar-label">{label}</span>
    </div>
  );
}

// ====== LEFT PANEL: Product Configuration ======
function ProductConfigPanel() {
  const garmentColor = useCanvasState((s) => s.garmentColor);
  const setGarmentColor = useCanvasState((s) => s.setGarmentColor);
  const viewMode = useCanvasState((s) => s.viewMode);
  const setViewMode = useCanvasState((s) => s.setViewMode);
  const [namSize, setNamSize] = useState('M');
  const [nuSize, setNuSize] = useState('M');
  const [qty, setQty] = useState(1);
  const [printTech, setPrintTech] = useState('dtf');

  const PALETTE = ['#FFFFFF','#1A1A1A','#E53935','#1A237E','#EC407A','#FFB300','#2E7D32','#6D5EF8','#EF6C00','#616161'];
  const SIZES = ['S','M','L','XL','2XL'];
  const NU_SIZES = ['S','M','L','XL'];

  return (
    <div className="left-panel-scroll">
      {/* Product info */}
      <Section title="SẢN PHẨM" collapsible>
        <div className="product-card">
          <div className="product-thumb">👕</div>
          <div className="product-meta">
            <div className="product-name">Áo thun Premium</div>
            <div className="product-desc">100% Cotton, 220gsm</div>
          </div>
          <button className="btn-text">Đổi</button>
        </div>
      </Section>

      {/* Print Position */}
      <Section title="VỊ TRÍ IN">
        <div className="segmented">
          <button className={`seg ${viewMode==='front'?'seg--active':''}`} onClick={()=>setViewMode('front')}>Mặt trước</button>
          <button className={`seg ${viewMode==='back'?'seg--active':''}`} onClick={()=>setViewMode('back')}>Mặt sau</button>
        </div>
      </Section>

      {/* Color */}
      <Section title="MÀU SẮC">
        <div className="color-palette">
          {PALETTE.map(c=>(
            <button key={c} className={`color-dot ${garmentColor===c?'color-dot--active':''}`}
              style={{background:c}} onClick={()=>setGarmentColor(c)} />
          ))}
        </div>
      </Section>

      {/* Size Nam */}
      <Section title="SIZE NAM 👕">
        <div className="size-row">
          {SIZES.map(s=>(
            <button key={s} className={`size-pill ${namSize===s?'size-pill--active':''}`}
              onClick={()=>setNamSize(s)}>{s}</button>
          ))}
        </div>
      </Section>

      {/* Size Nữ */}
      <Section title="SIZE NỮ 👚">
        <div className="size-row">
          {NU_SIZES.map(s=>(
            <button key={s} className={`size-pill ${nuSize===s?'size-pill--active':''}`}
              onClick={()=>setNuSize(s)}>{s}</button>
          ))}
        </div>
        <button className="btn-text" style={{marginTop:8}}>📐 Bảng size</button>
      </Section>

      {/* Quantity */}
      <Section title="SỐ LƯỢNG">
        <div className="qty-control">
          <button className="qty-btn" onClick={()=>setQty(Math.max(1,qty-1))}>−</button>
          <span className="qty-val">{qty}</span>
          <button className="qty-btn" onClick={()=>setQty(qty+1)}>+</button>
        </div>
      </Section>

      {/* Print Tech */}
      <Section title="CÔNG NGHỆ IN">
        <div className="segmented">
          <button className={`seg ${printTech==='dtf'?'seg--active':''}`} onClick={()=>setPrintTech('dtf')}>DTF</button>
          <button className={`seg ${printTech==='dtg'?'seg--active':''}`} onClick={()=>setPrintTech('dtg')}>DTG</button>
        </div>
      </Section>

      {/* Pricing */}
      <Section title="BẢNG GIÁ">
        <div className="price-box">
          <div className="price-line"><span>Áo ×{qty}</span><span>{(250000*qty).toLocaleString()}₫</span></div>
          <div className="price-line"><span>In {printTech.toUpperCase()}</span><span>{(80000*qty).toLocaleString()}₫</span></div>
          <div className="price-line"><span>Giảm giá</span><span className="badge">-28%</span></div>
          <div className="price-total"><span>Tổng</span><strong>179.000₫</strong></div>
        </div>
      </Section>

      {/* Actions */}
      <div className="left-actions">
        <button className="btn-primary">📥 Xuất file in</button>
        <button className="btn-secondary">💬 Cần hỗ trợ</button>
      </div>
    </div>
  );
}

// ====== RIGHT PANEL: Object Inspector ======
function ObjectInspector() {
  const activeLayerId = useCanvasState((s) => s.activeLayerId);
  const activeSide = useCanvasState((s) => s.activeSide);
  const layers = useCanvasState((s) => (activeSide==='nam'?s.namLayers:s.nuLayers));
  const updateLayer = useCanvasState((s) => s.updateLayer);
  const deleteLayer = useCanvasState((s) => s.deleteLayer);

  const layer = layers.find(l=>l.id===activeLayerId);
  if (!layer) return <CanvasSettings />;

  const handlePosition = (key: string, val: number) => updateLayer(activeSide, layer.id, { [key]: val });
  const handleSize = (key: string, val: number) => updateLayer(activeSide, layer.id, { [key]: val });

  return (
    <div className="right-panel-scroll">
      <div className="inspector-header">
        <span>{layer.type==='text'?'🔤 Text':'🖼️ Image'}</span>
        <div className="inspector-actions">
          <button className="icon-btn" title="Lock">🔒</button>
          <button className="icon-btn" title="Duplicate">📋</button>
          <button className="icon-btn icon-btn--danger" title="Delete" onClick={()=>deleteLayer(activeSide,layer.id)}>🗑️</button>
        </div>
      </div>

      <Section title="VỊ TRÍ">
        <div className="prop-grid-2">
          <div><label>X</label><input className="prop-inp" type="number" value={Math.round(layer.x)} onChange={e=>handlePosition('x',+e.target.value)} /></div>
          <div><label>Y</label><input className="prop-inp" type="number" value={Math.round(layer.y)} onChange={e=>handlePosition('y',+e.target.value)} /></div>
        </div>
      </Section>

      <Section title="KÍCH THƯỚC">
        <div className="prop-grid-2">
          <div><label>W</label><input className="prop-inp" type="number" value={Math.round(layer.width)} onChange={e=>handleSize('width',+e.target.value)} /></div>
          <div><label>H</label><input className="prop-inp" type="number" value={Math.round(layer.height)} onChange={e=>handleSize('height',+e.target.value)} /></div>
        </div>
        <div style={{marginTop:8}}>
          <label style={{fontSize:11,color:'var(--text-muted)'}}>Xoay: {layer.rotation}°</label>
          <input type="range" min={0} max={360} value={layer.rotation} onChange={e=>updateLayer(activeSide,layer.id,{rotation:+e.target.value})} style={{width:'100%',accentColor:'var(--primary)'}} />
        </div>
      </Section>

      {layer.type==='text' && (
        <Section title="TYPOGRAPHY">
          <input className="prop-inp" style={{width:'100%'}} value={layer.text||''} onChange={e=>updateLayer(activeSide,layer.id,{text:e.target.value})} />
          <div style={{display:'flex',gap:8,marginTop:8}}>
            <input className="prop-inp" type="number" value={layer.fontSize||24} onChange={e=>updateLayer(activeSide,layer.id,{fontSize:+e.target.value})} style={{flex:1}} />
            <input className="prop-inp" type="color" value={layer.fill||'#000'} onChange={e=>updateLayer(activeSide,layer.id,{fill:e.target.value})} style={{width:40,height:36,padding:2}} />
          </div>
        </Section>
      )}

      {layer.type==='image' && (
        <Section title="HIỆU ỨNG">
          <div className="segmented" style={{marginBottom:8}}>
            <button className="seg seg--active">Normal</button>
            <button className="seg">B&W</button>
          </div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            {['📷 Crop','✨ Filter','🧹 Erase','🖼️ Frame'].map(t=>(
              <button key={t} className="btn-chip">{t}</button>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

// ====== RIGHT PANEL: Canvas Settings (when nothing selected) ======
function CanvasSettings() {
  const layers = useCanvasState((s)=>[...s.namLayers,...s.nuLayers]);
  const activeSide = useCanvasState((s)=>s.activeSide);
  const addTextLayer = useCanvasState((s)=>s.addTextLayer);
  const { createTextLayer } = useCanvasState; // will get from hook
  const [text, setText] = useState('');

  return (
    <div className="right-panel-scroll">
      <div className="inspector-header">
        <span>🎨 Canvas</span>
      </div>

      <Section title="THÊM CHỮ">
        <input className="prop-inp" style={{width:'100%'}} placeholder="Nhập nội dung..." value={text} onChange={e=>setText(e.target.value)}
          onKeyDown={e=>{if(e.key==='Enter'&&text.trim()){addTextLayer(activeSide,{id:'',type:'text',x:120,y:200,width:200,height:40,rotation:0,zIndex:0,scaleX:1,scaleY:1,text,fontSize:24,fontFamily:'Inter',fill:'#000'});setText('');}}} />
      </Section>

      <Section title="LAYERS ({layers.length})">
        {layers.length===0 ? (
          <div style={{padding:16,textAlign:'center',color:'var(--text-muted)',fontSize:13}}>
            Chưa có layer. Thêm chữ hoặc upload ảnh.
          </div>
        ) : (
          layers.map((l,i)=>(
            <div key={l.id||i} className="layer-row">
              <span>{l.type==='text'?'🔤':'🖼️'} {l.text||'Image'}</span>
            </div>
          ))
        )}
      </Section>

      <Section title="UPLOAD ẢNH">
        <label className="upload-zone">
          📁 Kéo thả hoặc click để upload
          <input type="file" accept="image/*" style={{display:'none'}} />
        </label>
      </Section>

      <Section title="HƯỚNG DẪN">
        <div className="help-links">
          <div className="help-item">🖱️ Kéo thả để di chuyển layer</div>
          <div className="help-item">🔄 Góc để xoay layer</div>
          <div className="help-item">🗑️ Delete để xóa layer đã chọn</div>
        </div>
      </Section>
    </div>
  );
}

// ====== Reusable Section ======
function Section({ title, children }: { title: string; children: React.ReactNode; collapsible?: boolean }) {
  return (
    <div className="config-section">
      <div className="config-section__title">{title}</div>
      {children}
    </div>
  );
}

export default App;
