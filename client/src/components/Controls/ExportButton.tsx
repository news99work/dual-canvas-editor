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
    setStatus('processing'); setError('');
    try {
      const state = { version: 1, garmentColor, viewMode: 'front', canvasWidth: 400, canvasHeight: 500, designs: { nam: { layers: namLayers }, nu: { layers: nuLayers } } };
      const { jobId } = await triggerExport(state as any);
      const result = await waitForExport(jobId, 15, 2000);
      setDownloadUrl((result as any).downloadUrl || (result as any).url || '');
      setStatus('done');
    } catch (e: any) { setStatus('error'); setError(e?.message || 'Export failed'); }
  };

  if (status === 'processing') return (
    <div style={{ textAlign: 'center', padding: 20 }}><div style={{ fontSize: 40 }}>⏳</div><p style={{ color: 'var(--text-muted)', marginTop: 8 }}>Đang xuất file in...</p></div>
  );
  if (status === 'done') return (
    <div style={{ textAlign: 'center', padding: 20, background: 'rgba(34,197,94,.08)', borderRadius: 16 }}>
      <div style={{ fontSize: 40 }}>✅</div><p style={{ color: 'var(--success)', fontWeight: 600, margin: '8px 0' }}>Xuất file thành công!</p>
      {downloadUrl && <a href={downloadUrl} download className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none', width: 'auto', padding: '10px 24px', marginTop: 8 }}>📥 Tải file</a>}
      <button onClick={() => setStatus('idle')} style={{ display: 'block', margin: '8px auto 0', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: 13 }}>Xuất lại</button>
    </div>
  );
  return (
    <div>
      <div className="pricing-box" style={{ marginBottom: 16 }}>
        <div className="pricing-row"><span>Định dạng</span><span>PNG / PDF</span></div>
        <div className="pricing-row"><span>Độ phân giải</span><span>300 DPI</span></div>
        <div className="pricing-row"><span>Nền</span><span>Trong suốt</span></div>
      </div>
      <button className="btn-primary" onClick={handleExport}>📥 Xuất file in</button>
      {status === 'error' && <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 8, textAlign: 'center' }}>{error}</p>}
    </div>
  );
}
