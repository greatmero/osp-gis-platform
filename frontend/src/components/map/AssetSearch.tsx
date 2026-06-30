import { useState, useRef, useEffect } from 'react';
import { useUIStore } from '../../store/ui';
import { useAllAssets } from '../../hooks/useAssetGeoJSON';
import { Asset } from '../../api/client';

export function AssetSearch() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { flyToAsset, setSelectedAssetId } = useUIStore();
  const { data } = useAllAssets();
  const assets: Asset[] = data?.assets ?? [];

  const results = query.trim().length >= 2
    ? assets
        .filter(
          (a) =>
            a.name.toLowerCase().includes(query.toLowerCase()) ||
            a.code.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 8)
    : [];

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleSelect(asset: Asset) {
    setQuery(asset.name);
    setOpen(false);
    setSelectedAssetId(asset.id);
    if (flyToAsset) flyToAsset(asset.id);
  }

  return (
    <div ref={wrapperRef} className="absolute top-4 left-4 z-20 w-64">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
          🔍
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search assets…"
          className="w-full pl-9 pr-3 py-2 text-sm bg-gray-900/95 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 backdrop-blur-sm shadow-xl"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setOpen(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-base"
          >
            ×
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
          {results.map((asset) => (
            <button
              key={asset.id}
              onClick={() => handleSelect(asset)}
              className="w-full text-left px-3 py-2 hover:bg-gray-800 transition-colors flex items-center gap-2 border-b border-gray-800 last:border-0"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white truncate">{asset.name}</div>
                <div className="text-xs text-gray-500">{asset.code}</div>
              </div>
              <span
                className={`text-xs shrink-0 ${
                  asset.status === 'operational'
                    ? 'text-green-400'
                    : asset.status === 'down'
                    ? 'text-red-400'
                    : 'text-yellow-400'
                }`}
              >
                ●
              </span>
            </button>
          ))}
        </div>
      )}

      {open && query.trim().length >= 2 && results.length === 0 && (
        <div className="mt-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-500">
          No assets found
        </div>
      )}
    </div>
  );
}
