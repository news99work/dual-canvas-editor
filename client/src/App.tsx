import './App.css';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Dual Canvas Editor</h1>
        <p>Monorepo scaffold ready — choosing canvas library...</p>
      </header>
      <main className="app-main">
        <section className="canvas-placeholder">
          <div className="canvas-slot canvas-slot--active">
            <span>Canvas A</span>
          </div>
          <div className="canvas-slot">
            <span>Canvas B</span>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
