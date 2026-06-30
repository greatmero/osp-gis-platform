import { useState, useRef, useEffect } from 'react';
import { useUIStore } from '../../store/ui';
import { useAssetTypes } from '../../hooks/useAssetTypes';

export function AddAssetToolbar() {
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const { drawMode, connectionMode, setDrawMode, clearDraw, setConnectionMode, clearConnection } =
    useUIStore();
  const { data: assetTypes = [] } = useAssetTypes();

  // Close picker on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Drawing status bar
  if (drawMode) {
    const hint =
      drawMode.geometryKind === 'point'
        ? 'Click on the map to place'
        : drawMode.geometryKind === 'line'
        ? 'Click to add points — double-click to finish'
        : 'Click to add vertices — double-click to close';

    return (
      <div className="absolute top-0 left-0 right-0 z-30 flex justify-center pointer-events-none">
        <div className="mt-3 bg-gray-900/95 border border-blue-500/50 rounded-lg px-4 py-2 flex items-center gap-3 shadow-xl pointer-events-auto backdrop-blur-sm">
          <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: drawMode.color }} />
          <span className="text-sm text-white font-medium">Drawing {drawMode.label}</span>
          <span className="text-xs text-gray-400">— {hint}</span>
          <button
            onClick={() => clearDraw()}
            className="ml-2 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-2.5 py-1 rounded-md transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Connection mode status bar
  if (connectionMode) {
    return (
      <div className="absolute top-0 left-0 right-0 z-30 flex justify-center pointer-events-none">
        <div className="mt-3 bg-gray-900/95 border border-purple-500/50 rounded-lg px-4 py-2 flex items-center gap-3 shadow-xl pointer-events-auto backdrop-blur-sm">
          <span className="text-purple-400">⟷</span>
          <span className="text-sm text-white font-medium">Connection Mode</span>
          <span className="text-xs text-gray-400">— Click first asset, then second asset</span>
          <button
            onClick={() => clearConnection()}
            className="ml-2 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-2.5 py-1 rounded-md transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Idle toolbar
  return (
    <div ref={pickerRef} className="absolute top-4 z-20" style={{ left: '17rem' }}>
      <div className="flex gap-1.5">
        {/* Add Asset button */}
        <div className="relative">
          <button
            onClick={() => setPickerOpen((o) => !o)}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-lg transition-colors"
          >
            <span>+</span>
            <span>Add Asset</span>
            <span className="text-blue-300 text-xs">{pickerOpen ? '▲' : '▼'}</span>
          </button>

          {pickerOpen && (
            <div className="absolute top-full mt-1 left-0 bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden w-52">
              {assetTypes.map((type) => (
                <button
                  key={type.key}
                  onClick={() => {
                    setDrawMode({
                      assetTypeId: type.id,
                      assetTypeKey: type.key,
                      geometryKind: type.geometryKind as 'point' | 'line' | 'polygon',
                      label: type.label,
                      color: type.color,
                    });
                    setPickerOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-gray-800 transition-colors border-b border-gray-800 last:border-0"
                >
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: type.color }} />
                  <span className="text-gray-200">{type.label}</span>
                  <span className="ml-auto text-xs text-gray-500">{type.geometryKind}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Connect button */}
        <button
          onClick={() => { setConnectionMode(true); setPickerOpen(false); }}
          className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-sm font-medium rounded-lg shadow-lg transition-colors border border-gray-700"
        >
          <span>⟷</span>
          <span>Connect</span>
        </button>
      </div>
    </div>
  );
}
