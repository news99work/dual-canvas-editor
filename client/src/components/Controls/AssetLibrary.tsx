import { useState, useEffect } from 'react';
import { listAssets } from '../../api/assets';
import { useCanvasState, createImageLayer } from '../../hooks/useCanvasState';

type Category = 'all' | 'love' | 'chibi' | 'slogan' | 'tet';

interface Asset {
  id: string;
  url: string;
  category: string;
  name: string;
}

const CAT_TABS: { key: Category; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'love', label: '💕 Love' },
  { key: 'chibi', label: '🐣 Chibi' },
  { key: 'slogan', label: '💬 Slogan' },
  { key: 'tet', label: '🧧 Tết' },
];

export default function AssetLibrary() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [category, setCategory] = useState<Category>('all');
  const [loading, setLoading] = useState(true);
  const activeSide = useCanvasState((s) => s.activeSide);
  const addImageLayer = useCanvasState((s) => s.addImageLayer);

  useEffect(() => {
    setLoading(true);
    listAssets(category === 'all' ? undefined : { category })
      .then((res: any) => setAssets(res.assets || []))
      .catch(() => setAssets([]))
      .finally(() => setLoading(false));
  }, [category]);

  const handleAdd = (asset: Asset) => {
    addImageLayer(activeSide, createImageLayer(asset.url, { width: 120, height: 120 }));
  };

  return (
    <div>
      <h4 style={{ margin: '0 0 8px', fontSize: 14 }}>Kho hình in</h4>
      <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
        {CAT_TABS.map((t) => (
          <button key={t.key} onClick={() => setCategory(t.key)}
            style={{
              padding: '4px 10px', borderRadius: 20, border: category === t.key ? '2px solid #2563eb' : '1px solid #d1d5db',
              background: category === t.key ? '#eff6ff' : '#fff', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap',
            }}>
            {t.label}
          </button>
        ))}
      </div>
      {loading ? (
        <p style={{ color: '#9ca3af', fontSize: 13 }}>Đang tải...</p>
      ) : assets.length === 0 ? (
        <p style={{ color: '#9ca3af', fontSize: 13 }}>Chưa có hình. Tải ảnh từ tab bên cạnh.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
          {assets.map((a) => (
            <div key={a.id} onClick={() => handleAdd(a)}
              style={{ cursor: 'pointer', borderRadius: 8, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
              <img src={a.url} alt={a.name} style={{ width: '100%', height: 80, objectFit: 'cover' }} />
              <div style={{ padding: 4, fontSize: 10, textAlign: 'center', color: '#6b7280' }}>{a.name}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
