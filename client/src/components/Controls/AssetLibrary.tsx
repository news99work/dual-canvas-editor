import { useState, useEffect } from 'react';
import { getAssets } from '../../api/assets';
import { useCanvasState, createImageLayer } from '../../hooks/useCanvasState';

export default function AssetLibrary() {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const activeSide = useCanvasState((s) => s.activeSide);
  const addImageLayer = useCanvasState((s) => s.addImageLayer);

  useEffect(() => {
    getAssets().then((data) => { setAssets(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const categories = ['all', ...new Set(assets.map((a: any) => a.category).filter(Boolean))];
  const filtered = category === 'all' ? assets : assets.filter((a: any) => a.category === category);

  const handleAdd = (asset: any) => {
    addImageLayer(activeSide, createImageLayer(asset.url || asset.imageUrl, { width: 120, height: 120 }));
  };

  return (
    <div>
      <h4 style={{ margin: '0 0 8px', fontSize: 14 }}>Kho hình in</h4>
      {categories.length > 1 && (
        <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
          {categories.map((c) => (
            <button key={c} onClick={() => setCategory(c)}
              style={{ padding: '4px 10px', borderRadius: 12, border: category === c ? '2px solid #2563eb' : '1px solid #d1d5db', background: category === c ? '#eff6ff' : '#fff', fontSize: 12, cursor: 'pointer' }}>
              {c === 'all' ? 'Tất cả' : c}
            </button>
          ))}
        </div>
      )}
      {loading ? <p style={{ color: '#9ca3af', fontSize: 13 }}>Đang tải...</p> : filtered.length === 0 ? (
        <UploadCTA />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          {filtered.map((a: any, i: number) => (
            <div key={a.id || i} onClick={() => handleAdd(a)}
              style={{ aspectRatio: '1', background: '#f3f4f6', borderRadius: 6, overflow: 'hidden', cursor: 'pointer', border: '1px solid #e5e7eb' }}>
              <img src={a.url || a.imageUrl} alt={a.name || 'asset'} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function UploadCTA() {
  return (
    <div style={{ textAlign: 'center', padding: 16, color: '#9ca3af', fontSize: 13 }}>
      <p>Chưa có hình in mẫu.</p>
      <p>Dùng tab "Tải ảnh lên" để thêm ảnh.</p>
    </div>
  );
}
