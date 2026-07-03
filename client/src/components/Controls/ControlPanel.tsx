import { useState } from 'react';
import ColorPicker from './ColorPicker';
import TextTool from './TextTool';
import ImageUploader from './ImageUploader';
import AssetLibrary from './AssetLibrary';
import SizeSelector from './SizeSelector';
import ExportButton from './ExportButton';

type Tab = 'color' | 'text' | 'asset' | 'size' | 'export';

export default function ControlPanel() {
  const [tab, setTab] = useState<Tab>('color');

  const tabs: { key: Tab; icon: string }[] = [
    { key: 'color', icon: '🎨' },
    { key: 'text', icon: '🔤' },
    { key: 'asset', icon: '🖼️' },
    { key: 'size', icon: '📏' },
    { key: 'export', icon: '📥' },
  ];

  return (
    <div className="control-panel">
      <div className="control-panel__tabs">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`control-tab ${tab === t.key ? 'control-tab--active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.icon}
          </button>
        ))}
      </div>

      <div className="panel-section">
        {tab === 'color' && <><div className="panel-section__title">Màu áo</div><ColorPicker /></>}
        {tab === 'text' && <><div className="panel-section__title">Thêm chữ</div><TextTool /></>}
        {tab === 'asset' && <><div className="panel-section__title">Kho hình in</div><AssetLibrary /></>}
        {tab === 'size' && <><div className="panel-section__title">Chọn size & số lượng</div><SizeSelector /></>}
        {tab === 'export' && <><div className="panel-section__title">Xuất file in</div><ExportButton /></>}
      </div>
    </div>
  );
}
