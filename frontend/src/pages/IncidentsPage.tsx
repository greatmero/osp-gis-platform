import { useState } from 'react';
import { useIncidents } from '../hooks/useIncidents';

const SEVERITY_STYLES: Record<string, string> = {
  critical: 'bg-red-500/15 text-red-400 border border-red-500/30',
  high: 'bg-orange-500/15 text-orange-400 border border-orange-500/30',
  medium: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
  low: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
};

const INCIDENT_STATUS_STYLES: Record<string, string> = {
  open: 'bg-red-500/15 text-red-400',
  investigating: 'bg-yellow-500/15 text-yellow-400',
  resolved: 'bg-green-500/15 text-green-400',
};

const INCIDENT_STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  investigating: 'Investigating',
  resolved: 'Resolved',
};

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'open', label: 'Open' },
  { value: 'investigating', label: 'Investigating' },
  { value: 'resolved', label: 'Resolved' },
];

const SEVERITY_OPTIONS = [
  { value: '', label: 'All Severities' },
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

const selectClass =
  'bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-blue-500 transition-colors';

export function IncidentsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');

  const { data: incidents = [], isLoading } = useIncidents({
    status: statusFilter,
    severity: severityFilter,
  });

  const openCount = incidents.filter((i) => i.status === 'open').length;

  function resetFilters() {
    setStatusFilter('');
    setSeverityFilter('');
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-950 px-6 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Incidents</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {isLoading ? 'Loading…' : (
              <>
                {incidents.length} incident{incidents.length !== 1 ? 's' : ''}
                {openCount > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded text-xs font-medium">
                    {openCount} open
                  </span>
                )}
              </>
            )}
          </p>
        </div>
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap gap-3 items-center">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass}>
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} className={selectClass}>
          {SEVERITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {(statusFilter || severityFilter) && (
          <button onClick={resetFilters} className="text-xs text-gray-500 hover:text-gray-300 underline transition-colors">
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[auto_auto_auto_1fr_auto_auto_auto] gap-4 px-4 py-2.5 border-b border-gray-800 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <span>Severity</span>
          <span>Asset</span>
          <span>Category</span>
          <span>Description</span>
          <span>Opened</span>
          <span>Status</span>
          <span>Resolved</span>
        </div>

        {/* Skeletons */}
        {isLoading && (
          <div className="divide-y divide-gray-800">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="grid grid-cols-[auto_auto_auto_1fr_auto_auto_auto] gap-4 px-4 py-3 items-center">
                {[80, 100, 80, 200, 80, 90, 70].map((w, j) => (
                  <div key={j} className="h-4 bg-gray-800 rounded animate-pulse" style={{ width: w }} />
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && incidents.length === 0 && (
          <div className="px-4 py-12 text-center">
            <p className="text-gray-500 text-sm">No incidents match your filters.</p>
            {(statusFilter || severityFilter) && (
              <button onClick={resetFilters} className="mt-2 text-xs text-blue-400 hover:text-blue-300 underline">
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Rows */}
        {!isLoading && incidents.length > 0 && (
          <div className="divide-y divide-gray-800">
            {incidents.map((inc) => (
              <div
                key={inc.id}
                className="grid grid-cols-[auto_auto_auto_1fr_auto_auto_auto] gap-4 px-4 py-3 items-start hover:bg-gray-800/40 transition-colors"
              >
                {/* Severity badge */}
                <span className={`text-xs px-2 py-0.5 rounded font-medium capitalize whitespace-nowrap ${SEVERITY_STYLES[inc.severity] ?? 'bg-gray-700 text-gray-400'}`}>
                  {inc.severity}
                </span>

                {/* Asset */}
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-300 whitespace-nowrap">{inc.asset?.name ?? '—'}</p>
                  <p className="text-xs text-gray-600 font-mono">{inc.asset?.code}</p>
                </div>

                {/* Category */}
                <span className="text-xs text-gray-400 whitespace-nowrap">{inc.category}</span>

                {/* Description */}
                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{inc.description}</p>

                {/* Opened */}
                <span className="text-xs text-gray-600 whitespace-nowrap">{formatDate(inc.openedAt)}</span>

                {/* Status badge */}
                <span className={`text-xs px-2 py-0.5 rounded font-medium whitespace-nowrap ${INCIDENT_STATUS_STYLES[inc.status] ?? 'bg-gray-700 text-gray-400'}`}>
                  {INCIDENT_STATUS_LABELS[inc.status] ?? inc.status}
                </span>

                {/* Resolved date */}
                <span className="text-xs text-gray-600 whitespace-nowrap">
                  {inc.resolvedAt ? formatDate(inc.resolvedAt) : '—'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
