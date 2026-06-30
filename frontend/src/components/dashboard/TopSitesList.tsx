interface Props {
  data: { id: number; name: string; assetCount: number }[];
  loading?: boolean;
}

export function TopSitesList({ data, loading }: Props) {
  const max = data.reduce((m, s) => Math.max(m, s.assetCount), 0);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col gap-4">
      <p className="text-sm font-semibold text-white">Top Sites by Assets</p>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-8 bg-gray-800 rounded animate-pulse" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <p className="text-xs text-gray-500">No site data</p>
      ) : (
        <div className="space-y-3">
          {data.map((site, i) => (
            <div key={site.id} className="flex items-center gap-3">
              {/* Rank */}
              <span className="w-5 text-xs text-gray-600 font-mono shrink-0 text-right">{i + 1}</span>
              {/* Name + bar */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-gray-300 truncate">{site.name}</span>
                  <span className="text-xs text-gray-500 shrink-0 ml-2">{site.assetCount}</span>
                </div>
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: max > 0 ? `${(site.assetCount / max) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
