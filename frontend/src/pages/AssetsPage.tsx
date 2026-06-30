import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAssets } from '../hooks/useAssets';
import { useAssetTypes } from '../hooks/useAssetTypes';
import { useUIStore } from '../store/ui';

const LIMIT = 20;

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'operational', label: 'Operational' },
  { value: 'degraded', label: 'Degraded' },
  { value: 'down', label: 'Down' },
  { value: 'under_maintenance', label: 'Under Maintenance' },
];

const STATUS_STYLES: Record<string, string> = {
  operational: 'bg-green-500/15 text-green-400',
  degraded: 'bg-yellow-500/15 text-yellow-400',
  down: 'bg-red-500/15 text-red-400',
  under_maintenance: 'bg-gray-500/15 text-gray-400',
};

const STATUS_LABELS: Record<string, string> = {
  operational: 'Operational',
  degraded: 'Degraded',
  down: 'Down',
  under_maintenance: 'Maintenance',
};

const GEOMETRY_STYLES: Record<string, string> = {
  point: 'bg-blue-500/15 text-blue-400',
  line: 'bg-green-500/15 text-green-400',
  polygon: 'bg-purple-500/15 text-purple-400',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

const selectClass =
  'bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-blue-500 transition-colors';

export function AssetsPage() {
  const navigate = useNavigate();
  const setSelectedAssetId = useUIStore((s) => s.setSelectedAssetId);

  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading, isFetching } = useAssets({ page, limit: LIMIT, type: typeFilter, status: statusFilter });
  const { data: assetTypes = [] } = useAssetTypes();

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  // Client-side search filter on current page results
  const filtered = useMemo(() => {
    const assets = data?.assets ?? [];
    if (!search.trim()) return assets;
    const q = search.trim().toLowerCase();
    return assets.filter(
      (a) => a.name.toLowerCase().includes(q) || a.code.toLowerCase().includes(q)
    );
  }, [data?.assets, search]);

  function handleTypeChange(val: string) {
    setTypeFilter(val);
    setPage(1);
  }

  function handleStatusChange(val: string) {
    setStatusFilter(val);
    setPage(1);
  }

  function resetFilters() {
    setTypeFilter('');
    setStatusFilter('');
    setSearch('');
    setPage(1);
  }

  function viewOnMap(id: number) {
    setSelectedAssetId(id);
    navigate('/');
  }

  const showingFrom = total === 0 ? 0 : (page - 1) * LIMIT + 1;
  const showingTo = Math.min(page * LIMIT, total);

  return (
    <div className="h-full overflow-y-auto bg-gray-950 px-6 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Asset Inventory</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {isLoading ? 'Loading…' : `${total} assets total`}
          </p>
        </div>
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name or code…"
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors w-52"
        />
        <select value={typeFilter} onChange={(e) => handleTypeChange(e.target.value)} className={selectClass}>
          <option value="">All Types</option>
          {assetTypes.map((t) => (
            <option key={t.key} value={t.key}>{t.label}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => handleStatusChange(e.target.value)} className={selectClass}>
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {(typeFilter || statusFilter || search) && (
          <button onClick={resetFilters} className="text-xs text-gray-500 hover:text-gray-300 underline transition-colors">
            Clear filters
          </button>
        )}
        {isFetching && !isLoading && (
          <span className="text-xs text-gray-600 animate-pulse">Refreshing…</span>
        )}
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] gap-4 px-4 py-2.5 border-b border-gray-800 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <span>Type</span>
          <span>Name</span>
          <span>Code</span>
          <span>Status</span>
          <span>Geometry</span>
          <span>Updated</span>
          <span></span>
        </div>

        {/* Skeleton rows */}
        {isLoading && (
          <div className="divide-y divide-gray-800">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] gap-4 px-4 py-3 items-center">
                <div className="w-3 h-3 rounded-full bg-gray-800 animate-pulse" />
                <div className="h-4 bg-gray-800 rounded animate-pulse" />
                <div className="w-20 h-4 bg-gray-800 rounded animate-pulse" />
                <div className="w-24 h-5 bg-gray-800 rounded animate-pulse" />
                <div className="w-14 h-5 bg-gray-800 rounded animate-pulse" />
                <div className="w-24 h-4 bg-gray-800 rounded animate-pulse" />
                <div className="w-16 h-6 bg-gray-800 rounded animate-pulse" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && filtered.length === 0 && (
          <div className="px-4 py-12 text-center">
            <p className="text-gray-500 text-sm">No assets match your filters.</p>
            <button onClick={resetFilters} className="mt-2 text-xs text-blue-400 hover:text-blue-300 underline">
              Clear filters
            </button>
          </div>
        )}

        {/* Rows */}
        {!isLoading && filtered.length > 0 && (
          <div className="divide-y divide-gray-800">
            {filtered.map((asset) => (
              <div
                key={asset.id}
                className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] gap-4 px-4 py-3 items-center hover:bg-gray-800/40 transition-colors"
              >
                {/* Type color dot */}
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ background: asset.assetType?.color ?? '#6B7280' }}
                />

                {/* Name + type label */}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{asset.name}</p>
                  <p className="text-xs text-gray-500">{asset.assetType?.label}</p>
                </div>

                {/* Code */}
                <span className="text-xs font-mono text-gray-400 whitespace-nowrap">{asset.code}</span>

                {/* Status badge */}
                <span className={`text-xs px-2 py-0.5 rounded font-medium whitespace-nowrap ${STATUS_STYLES[asset.status] ?? 'bg-gray-700 text-gray-400'}`}>
                  {STATUS_LABELS[asset.status] ?? asset.status}
                </span>

                {/* Geometry badge */}
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${GEOMETRY_STYLES[asset.assetType?.geometryKind ?? ''] ?? 'bg-gray-700 text-gray-400'}`}>
                  {asset.assetType?.geometryKind ?? '—'}
                </span>

                {/* Updated date */}
                <span className="text-xs text-gray-600 whitespace-nowrap">{formatDate(asset.updatedAt)}</span>

                {/* View on map */}
                <button
                  onClick={() => viewOnMap(asset.id)}
                  className="text-xs px-2.5 py-1 bg-gray-800 hover:bg-blue-900/40 text-gray-400 hover:text-blue-400 rounded border border-gray-700 hover:border-blue-800 transition-colors whitespace-nowrap"
                >
                  → Map
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {!isLoading && total > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-xs text-gray-500">
            Showing {showingFrom}–{showingTo} of {total}
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-300 rounded-lg border border-gray-700 transition-colors"
            >
              ← Prev
            </button>
            <span className="text-xs text-gray-400">
              Page <span className="text-white font-medium">{page}</span> of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-300 rounded-lg border border-gray-700 transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
