import { useDashboardSummary } from '../hooks/useDashboardSummary';
import { KpiCard } from '../components/dashboard/KpiCard';
import { StatusDonut } from '../components/dashboard/StatusDonut';
import { AssetTypeChart } from '../components/dashboard/AssetTypeChart';
import { IncidentTrendChart } from '../components/dashboard/IncidentTrendChart';
import { TopSitesList } from '../components/dashboard/TopSitesList';

function availabilityAccent(pct: number | undefined) {
  if (pct === undefined) return undefined;
  if (pct >= 90) return '#22C55E';
  if (pct >= 70) return '#EAB308';
  return '#EF4444';
}

function formatTime(date: Date) {
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export function DashboardPage() {
  const { data, isLoading, dataUpdatedAt, refetch, isFetching } = useDashboardSummary();

  const lastUpdated = dataUpdatedAt ? formatTime(new Date(dataUpdatedAt)) : '—';
  const fiberPct = data
    ? Math.round((data.fiberCapacity.usedFibers / data.fiberCapacity.totalFibers) * 100)
    : 0;

  return (
    <div className="h-full overflow-y-auto bg-gray-950 px-6 py-6 space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Operations Dashboard</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Last updated {lastUpdated} · auto-refreshes every 60 s
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-300 rounded-lg border border-gray-700 transition-colors"
        >
          {isFetching ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* Row 1 — KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard
          label="Total Assets"
          value={isLoading ? undefined : data?.totalAssets}
        />
        <KpiCard
          label="Fiber Length"
          value={isLoading ? undefined : data?.totalFiberKm}
          sub="km"
          accent="#10B981"
        />
        <KpiCard
          label="Open Incidents"
          value={isLoading ? undefined : data?.openIncidents}
          accent={data?.openIncidents ? '#EF4444' : '#22C55E'}
        />
        <KpiCard
          label="Network Availability"
          value={isLoading ? undefined : `${data?.networkAvailabilityPct ?? 0}%`}
          accent={availabilityAccent(data?.networkAvailabilityPct)}
        />
        <KpiCard
          label="Avg MTTR"
          value={isLoading ? undefined : data?.mttrHours}
          sub="hours"
          accent="#6B7280"
        />
        <KpiCard
          label="Fiber Capacity"
          value={isLoading ? undefined : `${fiberPct}%`}
          sub={data ? `${data.fiberCapacity.usedFibers} / ${data.fiberCapacity.totalFibers} fibers` : undefined}
          accent="#8B5CF6"
        >
          {data && (
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-purple-500 rounded-full transition-all"
                style={{ width: `${fiberPct}%` }}
              />
            </div>
          )}
        </KpiCard>
      </div>

      {/* Row 2 — 3-column charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <StatusDonut data={data?.assetsByStatus ?? []} loading={isLoading} />
        <AssetTypeChart data={data?.assetsByType ?? []} loading={isLoading} />
        <TopSitesList data={data?.topSitesByAssets ?? []} loading={isLoading} />
      </div>

      {/* Row 3 — Full-width incident trend */}
      <IncidentTrendChart data={data?.incidentTrend ?? []} loading={isLoading} />

      <div className="h-2" />
    </div>
  );
}
