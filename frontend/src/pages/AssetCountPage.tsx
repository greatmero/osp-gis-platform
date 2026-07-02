import { useMemo } from 'react';
import { useAllAssets } from '../hooks/useAssetGeoJSON';
import { useAssetTypes } from '../hooks/useAssetTypes';
import { Asset } from '../api/client';

const STATUSES = [
  { key: 'operational',       label: 'Operational',  color: '#22C55E', bg: 'bg-green-500/15  text-green-400' },
  { key: 'degraded',          label: 'Degraded',     color: '#EAB308', bg: 'bg-yellow-500/15 text-yellow-400' },
  { key: 'down',              label: 'Down',         color: '#EF4444', bg: 'bg-red-500/15    text-red-400' },
  { key: 'under_maintenance', label: 'Maintenance',  color: '#6B7280', bg: 'bg-gray-500/15   text-gray-400' },
] as const;

function StatusBar({ counts, total }: { counts: Record<string, number>; total: number }) {
  if (total === 0) return <div className="h-2 bg-gray-800 rounded-full w-full" />;
  return (
    <div className="flex h-2 rounded-full overflow-hidden w-full bg-gray-800">
      {STATUSES.map(({ key, color }) => {
        const pct = ((counts[key] ?? 0) / total) * 100;
        if (pct === 0) return null;
        return <div key={key} style={{ width: `${pct}%`, background: color }} />;
      })}
    </div>
  );
}

function KpiCard({ label, value, color, loading }: {
  label: string; value: number; color: string; loading: boolean;
}) {
  return (
    <div
      className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col gap-2"
      style={{ borderLeftColor: color, borderLeftWidth: 3 }}
    >
      <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">{label}</p>
      {loading ? (
        <div className="h-8 w-20 bg-gray-800 rounded animate-pulse" />
      ) : (
        <span className="text-2xl font-bold text-white leading-none">{value}</span>
      )}
    </div>
  );
}

function computeCounts(assets: Asset[]) {
  const byStatus: Record<string, number> = {};
  const byType: Record<string, { count: number; statusCounts: Record<string, number> }> = {};

  assets.forEach((a) => {
    // status totals
    byStatus[a.status] = (byStatus[a.status] ?? 0) + 1;

    // per-type
    const key = a.assetType?.key ?? 'unknown';
    if (!byType[key]) byType[key] = { count: 0, statusCounts: {} };
    byType[key].count++;
    byType[key].statusCounts[a.status] = (byType[key].statusCounts[a.status] ?? 0) + 1;
  });

  return { byStatus, byType };
}

export function AssetCountPage() {
  const { data: assetsData, isLoading } = useAllAssets();
  const { data: assetTypes = [] } = useAssetTypes();

  const { byStatus, byType } = useMemo(
    () => computeCounts(assetsData?.assets ?? []),
    [assetsData?.assets],
  );

  const assets = assetsData?.assets ?? [];
  const total = assets.length;

  // Merge type metadata with computed counts, sorted by count desc
  const rows = useMemo(() => {
    return assetTypes
      .map((t) => ({
        ...t,
        count: byType[t.key]?.count ?? 0,
        statusCounts: byType[t.key]?.statusCounts ?? {},
      }))
      .sort((a, b) => b.count - a.count);
  }, [assetTypes, byType]);

  return (
    <div className="h-full overflow-y-auto bg-gray-950 px-6 py-6 space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-white">Asset Count</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          {isLoading ? 'Loading…' : `${total} assets across ${assetTypes.length} types`}
        </p>
      </div>

      {/* Top KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <KpiCard label="Total Assets"  value={total}                              color="#60A5FA" loading={isLoading} />
        {STATUSES.map(({ key, label, color }) => (
          <KpiCard key={key} label={label} value={byStatus[key] ?? 0} color={color} loading={isLoading} />
        ))}
      </div>

      {/* Type breakdown cards */}
      <div>
        <h2 className="text-sm font-semibold text-gray-300 mb-3">Count by Asset Type</h2>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3 animate-pulse">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-700" />
                  <div className="h-4 w-28 bg-gray-700 rounded" />
                </div>
                <div className="h-7 w-16 bg-gray-700 rounded" />
                <div className="h-2 bg-gray-700 rounded-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {rows.map((t) => (
              <div key={t.key} className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3 hover:border-gray-700 transition-colors">
                {/* Type header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: t.color }} />
                    <span className="text-sm font-medium text-white truncate">{t.label}</span>
                    <span className="text-xs text-gray-600 font-mono shrink-0">{t.key}</span>
                  </div>
                  <span className="text-2xl font-bold text-white ml-3 shrink-0">{t.count}</span>
                </div>

                {/* Status distribution bar */}
                <StatusBar counts={t.statusCounts} total={t.count} />

                {/* Status pill row */}
                <div className="flex flex-wrap gap-1.5">
                  {STATUSES.map(({ key, label, color }) => {
                    const n = t.statusCounts[key] ?? 0;
                    if (n === 0) return null;
                    return (
                      <span
                        key={key}
                        className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400"
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                        {label}: <span className="font-medium text-white">{n}</span>
                      </span>
                    );
                  })}
                  {t.count === 0 && (
                    <span className="text-xs text-gray-600">No assets</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status × Type matrix table */}
      <div>
        <h2 className="text-sm font-semibold text-gray-300 mb-3">Status Matrix</h2>
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-4 py-3 text-gray-500 font-semibold uppercase tracking-wider w-40">
                  Type
                </th>
                <th className="text-right px-4 py-3 text-gray-500 font-semibold uppercase tracking-wider">
                  Total
                </th>
                {STATUSES.map(({ key, label, color }) => (
                  <th key={key} className="text-right px-4 py-3 font-semibold uppercase tracking-wider whitespace-nowrap"
                    style={{ color }}>
                    {label}
                  </th>
                ))}
                <th className="text-left px-4 py-3 text-gray-500 font-semibold uppercase tracking-wider w-40">
                  Distribution
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(7)].map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-3 bg-gray-800 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                rows.map((t) => (
                  <tr key={t.key} className="hover:bg-gray-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: t.color }} />
                        <span className="text-gray-300 font-medium truncate">{t.label}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-white">{t.count}</td>
                    {STATUSES.map(({ key, color }) => {
                      const n = t.statusCounts[key] ?? 0;
                      return (
                        <td key={key} className="px-4 py-3 text-right">
                          <span style={n > 0 ? { color } : undefined}
                            className={n === 0 ? 'text-gray-700' : 'font-semibold'}>
                            {n}
                          </span>
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 w-40">
                      <StatusBar counts={t.statusCounts} total={t.count} />
                    </td>
                  </tr>
                ))
              )}

              {/* Totals row */}
              {!isLoading && (
                <tr className="border-t-2 border-gray-700 bg-gray-800/30">
                  <td className="px-4 py-3 text-gray-400 font-semibold">Total</td>
                  <td className="px-4 py-3 text-right font-bold text-white">{total}</td>
                  {STATUSES.map(({ key, color }) => {
                    const n = byStatus[key] ?? 0;
                    return (
                      <td key={key} className="px-4 py-3 text-right font-bold" style={{ color }}>
                        {n}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3">
                    <StatusBar counts={byStatus} total={total} />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
