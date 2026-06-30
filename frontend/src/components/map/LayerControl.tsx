import { useState, useEffect } from 'react';
import { useUIStore } from '../../store/ui';
import { useAssetTypes } from '../../hooks/useAssetTypes';

export function LayerControl() {
  const [collapsed, setCollapsed] = useState(false);
  const { activeLayers, setLayerVisible } = useUIStore();
  const { data: assetTypes = [] } = useAssetTypes();

  // Initialize all layers as visible on first load
  useEffect(() => {
    if (assetTypes.length === 0) return;
    assetTypes.forEach((t) => {
      if (activeLayers[t.key] === undefined) {
        setLayerVisible(t.key, true);
      }
    });
  }, [assetTypes, activeLayers, setLayerVisible]);

  return (
    <div className="absolute top-4 right-4 z-20">
      <div className="bg-gray-900/95 border border-gray-700 rounded-lg shadow-xl backdrop-blur-sm overflow-hidden">
        {/* Header / toggle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex items-center gap-2 px-3 py-2 w-full text-left hover:bg-gray-800 transition-colors"
        >
          <span className="text-sm">🗂️</span>
          <span className="text-sm font-medium text-white flex-1">Layers</span>
          <span className="text-gray-400 text-xs">{collapsed ? '▼' : '▲'}</span>
        </button>

        {!collapsed && (
          <div className="border-t border-gray-700 px-3 py-2 space-y-1.5 min-w-[200px] max-h-80 overflow-y-auto">
            {assetTypes.map((type) => {
              const visible = activeLayers[type.key] !== false;
              return (
                <label
                  key={type.key}
                  className="flex items-center gap-2.5 cursor-pointer group py-0.5"
                >
                  {/* Color swatch */}
                  <div
                    className="w-3 h-3 rounded-full shrink-0 border border-white/20"
                    style={{ background: type.color }}
                  />
                  {/* Label */}
                  <span
                    className={`text-xs flex-1 transition-colors ${
                      visible ? 'text-gray-200' : 'text-gray-500'
                    }`}
                  >
                    {type.label}
                  </span>
                  {/* Toggle */}
                  <div
                    onClick={() => setLayerVisible(type.key, !visible)}
                    className={`relative w-8 h-4 rounded-full transition-colors shrink-0 ${
                      visible ? 'bg-blue-600' : 'bg-gray-700'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${
                        visible ? 'translate-x-4' : 'translate-x-0.5'
                      }`}
                    />
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
