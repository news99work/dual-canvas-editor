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

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'color', label: 'Màu áo', icon: '🎨' },
    { key: 'text', label: 'Chữ', icon: '🔤' },
    { key: 'asset', label: 'Kho hình', icon: '🖼️' },
    { key: 'size', label: 'Size', icon: '📏' },
    { key: 'export', label: 'Xuất file', icon: '📥' },
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
            <span>{t.icon}</span>
            <span className="control-tab__label">{t.label}</span>
          </button>
        ))}
      </div>
      <div className="control-panel__content">
        {tab === 'color' && <ColorPicker />}
        {tab === 'text' && <TextTool />}
        {tab === 'asset' && <AssetLibrary />}
        {tab === 'size' && <SizeSelector />}
        {tab === 'export' && <ExportButton />}
      </div>
    </div>
  );
}
