import { useState } from 'react';
import { useUIStore } from '../../store/ui';
import { useAllAssets } from '../../hooks/useAssetGeoJSON';
import { useCreateConnection } from '../../hooks/useAssetMutations';

export function ConnectionForm() {
  const { connectionAssetIds, clearConnection } = useUIStore();
  const { data: assetsData } = useAllAssets();
  const createConnection = useCreateConnection();

  const [fiberCount, setFiberCount] = useState('');
  const [notes, setNotes] = useState('');
  const [cableAssetId, setCableAssetId] = useState('');

  const assets = assetsData?.assets ?? [];

  // Only show when two assets are selected
  if (connectionAssetIds.length < 2) return null;

  const fromAsset = assets.find((a) => a.id === connectionAssetIds[0]);
  const toAsset = assets.find((a) => a.id === connectionAssetIds[1]);
  const cableAssets = assets.filter(
    (a) => (a as { assetType?: { key: string } }).assetType?.key === 'fiber_cable'
  );

  function handleSubmit() {
    const count = parseInt(fiberCount, 10);
    if (!count || count < 1) return;

    createConnection.mutate(
      {
        fromAssetId: connectionAssetIds[0],
        toAssetId: connectionAssetIds[1],
        cableAssetId: cableAssetId ? parseInt(cableAssetId, 10) : null,
        fiberCount: count,
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: () => {
          clearConnection();
          setFiberCount('');
          setNotes('');
          setCableAssetId('');
        },
      }
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/80 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-sm mx-4">
        {/* Header */}
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-700">
          <span className="text-purple-400 text-lg">⟷</span>
          <h2 className="font-semibold text-white flex-1">New Connection</h2>
          <button onClick={clearConnection} className="text-gray-500 hover:text-white text-xl">×</button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Connection endpoint summary */}
          <div className="bg-gray-800/60 border border-gray-700 rounded-lg p-3 space-y-1.5">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500 w-8 shrink-0">From</span>
              <span className="text-white font-medium">{fromAsset?.name ?? '—'}</span>
              <span className="text-gray-500 text-xs ml-auto">{fromAsset?.code}</span>
            </div>
            <div className="border-t border-gray-700" />
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500 w-8 shrink-0">To</span>
              <span className="text-white font-medium">{toAsset?.name ?? '—'}</span>
              <span className="text-gray-500 text-xs ml-auto">{toAsset?.code}</span>
            </div>
          </div>

          {/* Fiber count */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Fiber Count *</label>
            <input
              type="number"
              min={1}
              value={fiberCount}
              onChange={(e) => setFiberCount(e.target.value)}
              placeholder="e.g. 96"
              className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Cable asset (optional) */}
          {cableAssets.length > 0 && (
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Cable Asset (optional)</label>
              <select
                value={cableAssetId}
                onChange={(e) => setCableAssetId(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="">— None —</option>
                {cableAssets.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                ))}
              </select>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Splice type, route details, etc."
              className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
            />
          </div>

          {createConnection.error && (
            <p className="text-xs text-red-400 bg-red-900/20 border border-red-800 rounded p-2">
              {(createConnection.error as Error)?.message ?? 'Failed to create connection'}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 border-t border-gray-700">
          <button
            onClick={clearConnection}
            className="flex-1 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg py-2 font-medium transition-colors border border-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!fiberCount || parseInt(fiberCount, 10) < 1 || createConnection.isPending}
            className="flex-1 text-sm bg-purple-700 hover:bg-purple-600 disabled:opacity-50 text-white rounded-lg py-2 font-medium transition-colors"
          >
            {createConnection.isPending ? 'Saving…' : 'Save Connection'}
          </button>
        </div>
      </div>
    </div>
  );
}
