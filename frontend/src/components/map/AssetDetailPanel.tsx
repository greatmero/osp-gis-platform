import { useUIStore } from '../../store/ui';
import { useAsset } from '../../hooks/useAsset';
import { useAssetTypes } from '../../hooks/useAssetTypes';

const STATUS_STYLES: Record<string, string> = {
  operational: 'bg-green-500/20 text-green-400 border border-green-500/30',
  degraded: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  down: 'bg-red-500/20 text-red-400 border border-red-500/30',
  under_maintenance: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
};

const STATUS_LABELS: Record<string, string> = {
  operational: 'Operational',
  degraded: 'Degraded',
  down: 'Down',
  under_maintenance: 'Under Maintenance',
};

const SEVERITY_STYLES: Record<string, string> = {
  critical: 'bg-red-600/20 text-red-400',
  high: 'bg-orange-500/20 text-orange-400',
  medium: 'bg-yellow-500/20 text-yellow-400',
  low: 'bg-blue-500/20 text-blue-400',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export function AssetDetailPanel() {
  const { selectedAssetId, setSelectedAssetId } = useUIStore();
  const { data: asset, isLoading } = useAsset(selectedAssetId);
  const { data: assetTypes = [] } = useAssetTypes();

  const open = selectedAssetId !== null;
  const assetType = assetTypes.find((t) => t.id === asset?.assetTypeId);

  return (
    <div
      className={`absolute top-0 right-0 h-full w-80 bg-gray-900 border-l border-gray-700 shadow-2xl z-30 flex flex-col transition-transform duration-300 ${
        open ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {/* Header */}
      <div className="flex items-start gap-2 px-4 py-3 border-b border-gray-700 shrink-0">
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="h-5 w-32 bg-gray-700 rounded animate-pulse" />
          ) : (
            <>
              <h2 className="font-semibold text-white text-sm leading-tight truncate">
                {asset?.name ?? '—'}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">{asset?.code}</p>
            </>
          )}
        </div>
        <button
          onClick={() => setSelectedAssetId(null)}
          className="text-gray-500 hover:text-white transition-colors text-lg leading-none shrink-0 mt-0.5"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      {/* Body — scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {isLoading && (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-800 rounded animate-pulse" style={{ width: `${60 + (i % 3) * 15}%` }} />
            ))}
          </div>
        )}

        {asset && (
          <>
            {/* Status + type */}
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-xs px-2 py-0.5 rounded font-medium ${
                  STATUS_STYLES[asset.status] ?? 'bg-gray-700 text-gray-300'
                }`}
              >
                {STATUS_LABELS[asset.status] ?? asset.status}
              </span>
              {assetType && (
                <span className="flex items-center gap-1.5 text-xs text-gray-400">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: assetType.color }}
                  />
                  {assetType.label}
                </span>
              )}
            </div>

            {/* Timestamps */}
            <div className="space-y-1 text-xs text-gray-500">
              <div className="flex justify-between">
                <span>Created</span>
                <span className="text-gray-400">{formatDate(asset.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span>Updated</span>
                <span className="text-gray-400">{formatDate(asset.updatedAt)}</span>
              </div>
            </div>

            {/* Dynamic attributes from fieldSchema */}
            {assetType && assetType.fieldSchema.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Attributes
                </h3>
                <div className="space-y-1.5">
                  {assetType.fieldSchema.map((field) => {
                    const val = (asset.attributes as Record<string, unknown>)[field.key];
                    if (val === undefined || val === null || val === '') return null;
                    return (
                      <div key={field.key} className="flex justify-between gap-2 text-xs">
                        <span className="text-gray-500 shrink-0">{field.label}</span>
                        <span className="text-gray-300 text-right">
                          {field.type === 'boolean' ? (val ? 'Yes' : 'No') : String(val)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Parent */}
            {asset.parentId && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Parent Asset
                </h3>
                <button
                  onClick={() => setSelectedAssetId(asset.parentId!)}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  View parent →
                </button>
              </div>
            )}

            {/* Connections */}
            {(asset as unknown as { connectionsFrom?: unknown[]; connectionsTo?: unknown[] })
              .connectionsFrom && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Connections
                </h3>
                <div className="space-y-1">
                  {[
                    ...((asset as unknown as { connectionsFrom: Array<{ id: number; toAsset: { name: string }; fiberCount: number }> }).connectionsFrom ?? []),
                  ].map((c) => (
                    <div key={c.id} className="text-xs text-gray-400 flex justify-between">
                      <span className="truncate">→ {c.toAsset?.name}</span>
                      <span className="text-gray-500 shrink-0 ml-2">{c.fiberCount}f</span>
                    </div>
                  ))}
                  {[
                    ...((asset as unknown as { connectionsTo: Array<{ id: number; fromAsset: { name: string }; fiberCount: number }> }).connectionsTo ?? []),
                  ].map((c) => (
                    <div key={c.id} className="text-xs text-gray-400 flex justify-between">
                      <span className="truncate">← {c.fromAsset?.name}</span>
                      <span className="text-gray-500 shrink-0 ml-2">{c.fiberCount}f</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Incidents */}
            {(asset as unknown as { incidents?: unknown[] }).incidents &&
              ((asset as unknown as { incidents: Array<{ id: number; description: string; severity: string; status: string; openedAt: string }> }).incidents ?? []).length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Recent Incidents
                </h3>
                <div className="space-y-2">
                  {(asset as unknown as { incidents: Array<{ id: number; description: string; severity: string; status: string; openedAt: string }> }).incidents.slice(0, 5).map((inc) => (
                    <div key={inc.id} className="text-xs border border-gray-700 rounded p-2">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`px-1 py-0.5 rounded text-xs ${SEVERITY_STYLES[inc.severity] ?? ''}`}>
                          {inc.severity}
                        </span>
                        <span className="text-gray-500">{inc.status}</span>
                      </div>
                      <p className="text-gray-400 leading-snug line-clamp-2">{inc.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Actions */}
      {asset && (
        <div className="px-4 py-3 border-t border-gray-700 flex gap-2 shrink-0">
          <button className="flex-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md py-2 font-medium transition-colors">
            Edit
          </button>
          <button className="flex-1 text-xs bg-gray-800 hover:bg-red-900/50 text-gray-300 hover:text-red-400 rounded-md py-2 font-medium transition-colors border border-gray-700 hover:border-red-800">
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
