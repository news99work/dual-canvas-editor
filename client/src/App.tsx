import DualCanvas from './components/Canvas/DualCanvas';
import ControlPanel from './components/Controls/ControlPanel';
import './App.css';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>🎨 Dual Canvas Editor — Thiết kế áo đôi</h1>
      </header>
      <main className="app-main">
        <div className="editor-layout">
          <DualCanvas />
          <ControlPanel />
        </div>
      </main>
    </div>
  );
}

export default App;
