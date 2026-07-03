import { useState } from 'react';
import { requestExport, getExportStatus } from '../../api/export';
import { useCanvasState, type CanvasLayer } from '../../hooks/useCanvasState';

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
        namCanvas: serializeLayers(namLayers),
        nuCanvas: serializeLayers(nuLayers),
        garmentColor,
        format: 'png' as const,
        quality: 'high' as const,
      };
      const job = await requestExport(canvasState);
      const jobId = job.id || job.jobId;
      if (!jobId) throw new Error('No job ID');

      let attempts = 0;
      while (attempts < 30) {
        await new Promise((r) => setTimeout(r, 1000));
        const result = await getExportStatus(jobId);
        if (result.status === 'done' || result.status === 'completed') {
          setDownloadUrl(result.downloadUrl || result.url || '');
          setStatus('done');
          return;
        }
        if (result.status === 'failed') throw new Error('Export failed');
        attempts++;
      }
      throw new Error('Export timeout');
    } catch (err: any) {
      setError(err?.message || 'Export error');
      setStatus('error');
    }
  };

  return (
    <div>
      <h4 style={{ margin: '0 0 8px', fontSize: 14 }}>Xuất file thiết kế</h4>
      <button onClick={handleExport} disabled={status === 'processing'}
        style={{ width: '100%', padding: 12, borderRadius: 8, border: 'none', fontWeight: 600, cursor: status === 'processing' ? 'not-allowed' : 'pointer', fontSize: 14, background: status === 'done' ? '#16a34a' : status === 'error' ? '#ef4444' : '#2563eb', color: '#fff', opacity: status === 'processing' ? 0.7 : 1 }}>
        {status === 'idle' && '📥 Xuất file PNG'}
        {status === 'processing' && '⏳ Đang xử lý...'}
        {status === 'done' && '✅ Tải xuống'}
        {status === 'error' && '🔄 Thử lại'}
      </button>
      {status === 'done' && downloadUrl && (
        <a href={downloadUrl} download style={{ display: 'block', marginTop: 8, textAlign: 'center', color: '#2563eb', fontSize: 13 }}>
          Nhấn vào đây nếu không tự tải
        </a>
      )}
      {error && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{error}</p>}
    </div>
  );
}

function serializeLayers(layers: CanvasLayer[]) {
  return layers.map((l) => ({
    id: l.id,
    type: l.type,
    x: l.x, y: l.y,
    width: l.width, height: l.height,
    rotation: l.rotation,
    text: l.text,
    fontSize: l.fontSize,
    fontFamily: l.fontFamily,
    fill: l.fill,
    imageUrl: l.imageUrl,
  }));
}
