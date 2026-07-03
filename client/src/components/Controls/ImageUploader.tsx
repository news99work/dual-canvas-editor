import { useState } from 'react';
import { uploadImage } from '../../api/upload';
import { useCanvasState, createImageLayer } from '../../hooks/useCanvasState';

export default function ImageUploader() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const activeSide = useCanvasState((s) => s.activeSide);
  const addImageLayer = useCanvasState((s) => s.addImageLayer);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const result = await uploadImage(file);
      addImageLayer(activeSide, createImageLayer(result.url || URL.createObjectURL(file)));
    } catch (err: any) {
      setError(err?.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div>
      <h4 style={{ margin: '0 0 8px', fontSize: 14 }}>Tải ảnh lên</h4>
      <label style={{ display: 'block', padding: 20, border: '2px dashed #d1d5db', borderRadius: 8, textAlign: 'center', cursor: 'pointer', background: uploading ? '#f3f4f6' : '#fff' }}>
        {uploading ? '⏳ Đang tải lên...' : '📁 Nhấn để chọn ảnh'}
        <input type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} disabled={uploading} />
      </label>
      {error && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{error}</p>}
    </div>
  );
}
