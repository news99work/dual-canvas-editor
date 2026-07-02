import { useState, useEffect } from 'react';
import { apiRequest, listFonts } from './api';
import { LoadingSpinner, ErrorDisplay } from './api/errors';
import './App.css';

type ConnStatus = 'connecting' | 'connected' | 'error';

interface HealthResponse {
  ok: boolean;
  service: string;
  version: string;
  timestamp: string;
}

function App() {
  const [connStatus, setConnStatus] = useState<ConnStatus>('connecting');
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [connError, setConnError] = useState<Error | null>(null);
  const [fontCount, setFontCount] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;

    async function checkConnection() {
      try {
        // Health check + round-trip font fetch to validate API layer
        const [healthData, fonts] = await Promise.all([
          apiRequest<HealthResponse>('/api/health'),
          listFonts(),
        ]);

        if (cancelled) return;

        setHealth(healthData);
        setFontCount(fonts.length);
        setConnStatus('connected');
      } catch (err) {
        if (cancelled) return;
        setConnStatus('error');
        setConnError(err instanceof Error ? err : new Error('Connection failed'));
      }
    }

    checkConnection();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Dual Canvas Editor</h1>
        <div className="app-header__status">
          <span className={`status-dot status-dot--${connStatus}`} />
          <span className="status-text">
            {connStatus === 'connecting' && 'Connecting to API...'}
            {connStatus === 'connected' && `API Connected — ${health?.service} v${health?.version}`}
            {connStatus === 'error' && 'API Disconnected'}
          </span>
        </div>
        {connStatus === 'connected' && (
          <div className="app-header__meta">
            <span>Fonts available: {fontCount}</span>
            <span>
              Server time:{' '}
              {health?.timestamp ? new Date(health.timestamp).toLocaleTimeString() : ''}
            </span>
          </div>
        )}
      </header>

      <main className="app-main">
        {connStatus === 'connecting' && (
          <div className="app-loading">
            <LoadingSpinner size="large" label="Connecting to backend..." />
          </div>
        )}

        {connStatus === 'error' && (
          <div className="app-loading">
            <ErrorDisplay
              error={connError}
              onRetry={() => {
                setConnStatus('connecting');
                setConnError(null);
                window.location.reload();
              }}
              title="Backend Connection Failed"
            />
          </div>
        )}

        {connStatus === 'connected' && (
          <>
            <section className="canvas-area">
              <div className="canvas-slot canvas-slot--active">
                <div className="canvas-slot__label">Canvas A (Nam)</div>
                <div className="canvas-slot__hint">Waiting for canvas library (T-062)...</div>
              </div>
              <div className="canvas-slot">
                <div className="canvas-slot__label">Canvas B (Nữ)</div>
                <div className="canvas-slot__hint">Waiting for canvas library (T-062)...</div>
              </div>
            </section>

            <section className="toolbar-placeholder">
              <div className="toolbar-group">
                <h3>API Layer Ready ✅</h3>
                <ul>
                  <li>Upload — POST /api/v1/upload</li>
                  <li>Assets — GET /api/v1/assets</li>
                  <li>Export — POST /api/v1/export</li>
                  <li>Fonts — GET /api/v1/fonts ({fontCount} available)</li>
                </ul>
              </div>
              <div className="toolbar-group">
                <h3>Contract Tests</h3>
                <p>{'client/src/__tests__/api-contracts.test.ts'}</p>
                <code>pnpm --filter client test</code>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
