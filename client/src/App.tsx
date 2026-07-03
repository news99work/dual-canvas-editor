import DualCanvas from './components/Canvas/DualCanvas';
import ControlPanel from './components/Controls/ControlPanel';
import PropertiesPanel from './components/Controls/PropertiesPanel';
import './App.css';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>🎨 Dual Canvas Editor — Thiết kế áo đôi</h1>
      </header>
      <main className="app-main">
        <div className="editor-layout">
          <aside className="sidebar sidebar--left">
            <ControlPanel />
          </aside>
          <section className="canvas-area">
            <DualCanvas />
          </section>
          <aside className="sidebar sidebar--right">
            <PropertiesPanel />
          </aside>
        </div>
      </main>
    </div>
  );
}

export default App;
