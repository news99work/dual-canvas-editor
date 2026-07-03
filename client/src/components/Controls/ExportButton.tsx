import { useState } from 'react';
import { triggerExport, waitForExport } from '../../api/export';
import { useCanvasState } from '../../hooks/useCanvasState';

export default function ExportButton() {
  const [status, setStatus] = useState<'idle' | 'processing' | 'done' | 'error'>('idle');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [error, setError] = useState('');
  const namLayers = useCanvasState((s) => s.namLayers);
  const nuLayers = useCanvasState((s) => s.nuLayers);
  const garmentColor = useCanvasState((s) => s.garmentColor);

  const handleExport = async () => {
    setStatus('processing');
    setError('');
    try {
      const canvasState = {
        version: 1,
        garmentColor,
        viewMode: 'front',
        canvasWidth: 400,
        canvasHeight: 500,
        designs: {
          nam: { layers: namLayers },
          nu: { layers: nuLayers },
        },
      };
      const { jobId } = await triggerExport(canvasState as any);
      const result = await waitForExport(jobId, 15, 2000);
      setDownloadUrl(result.downloadUrl || result.url || '');
      setStatus('done');
    } catch (err: any) {
      setStatus('error');
      setError(err?.message || 'Export failed');
    }
  };

  return (
    <div>
      <h4 style={{ margin: '0 0 8px', fontSize: 14 }}>Xuất file in</h4>

      {status === 'idle' && (
        <button onClick={handleExport}
          style={{ width: '100%', padding: 14, borderRadius: 8, background: '#059669', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 16 }}>
          📥 Xuất file PNG
        </button>
      )}

      {status === 'processing' && (
        <div style={{ textAlign: 'center', padding: 20 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
          <p style={{ color: '#6b7280' }}>Đang xử lý file in...</p>
          <div style={{ height: 4, background: '#e5e7eb', borderRadius: 2, overflow: 'hidden', marginTop: 8 }}>
            <div style={{ width: '60%', height: '100%', background: '#2563eb', borderRadius: 2, animation: 'pulse 1.5s infinite' }} />
          </div>
        </div>
      )}

      {status === 'done' && (
        <div style={{ textAlign: 'center', padding: 16, background: '#f0fdf4', borderRadius: 8 }}>
          <div style={{ fontSize: 32 }}>✅</div>
          <p style={{ color: '#166534', fontWeight: 600, margin: '8px 0' }}>Xuất file thành công!</p>
          {downloadUrl && (
            <a href={downloadUrl} download
              style={{ display: 'inline-block', padding: '10px 24px', background: '#2563eb', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}>
              📥 Tải file PNG
            </a>
          )}
          <button onClick={() => setStatus('idle')}
            style={{ display: 'block', margin: '8px auto 0', background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: 13 }}>
            Xuất lại
          </button>
        </div>
      )}

      {status === 'error' && (
        <div style={{ textAlign: 'center', padding: 16, background: '#fef2f2', borderRadius: 8 }}>
          <p style={{ color: '#ef4444', margin: '0 0 8px' }}>❌ {error || 'Lỗi xuất file'}</p>
          <button onClick={() => setStatus('idle')}
            style={{ padding: '8px 20px', borderRadius: 6, background: '#2563eb', color: '#fff', border: 'none', cursor: 'pointer' }}>
            Thử lại
          </button>
        </div>
      )}
    </div>
  );
}
