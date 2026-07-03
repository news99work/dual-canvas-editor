import DualCanvas from './components/Canvas/DualCanvas';
import ControlPanel from './components/Controls/ControlPanel';
import PropertiesPanel from './components/Controls/PropertiesPanel';
import './App.css';

function App() {
  return (
    <div className="app">
      {/* Icon sidebar — 72px */}
      <nav className="icon-sidebar">
        <div className="icon-sidebar__logo">DC</div>
        <div className="icon-sidebar__item icon-sidebar__item--active" title="Thiết kế">🎨</div>
        <div className="icon-sidebar__item" title="Sản phẩm">👕</div>
        <div className="icon-sidebar__item" title="Đơn hàng">📦</div>
        <div className="icon-sidebar__item" title="Cài đặt">⚙️</div>
      </nav>

      {/* Left panel — Tools */}
      <aside className="left-panel">
        <ControlPanel />
      </aside>

      {/* Center — Canvas */}
      <section className="canvas-area">
        <DualCanvas />
        <div className="zoom-controls">
          <button className="zoom-btn">−</button>
          <span>100%</span>
          <button className="zoom-btn">+</button>
        </div>
      </section>

      {/* Right panel — Properties */}
      <aside className="right-panel">
        <PropertiesPanel />
      </aside>
    </div>
  );
}

export default App;
