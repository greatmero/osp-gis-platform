import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const STATUS_COLORS: Record<string, string> = {
  operational: '#22C55E',
  degraded: '#EAB308',
  down: '#EF4444',
  under_maintenance: '#6B7280',
};

const STATUS_LABELS: Record<string, string> = {
  operational: 'Operational',
  degraded: 'Degraded',
  down: 'Down',
  under_maintenance: 'Maintenance',
};

interface Props {
  data: { status: string; count: number }[];
  loading?: boolean;
}

export function StatusDonut({ data, loading }: Props) {
  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col gap-4">
      <p className="text-sm font-semibold text-white">Asset Status</p>

      {loading ? (
        <div className="h-48 bg-gray-800 rounded animate-pulse" />
      ) : (
        <>
          <div className="relative">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="count"
                  nameKey="status"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {data.map((entry) => (
                    <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? '#374151'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#9CA3AF' }}
                  formatter={(value: number, name: string) => [value, STATUS_LABELS[name] ?? name]}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-white">{total}</span>
              <span className="text-xs text-gray-500">assets</span>
            </div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {data.map((d) => (
              <div key={d.status} className="flex items-center gap-1.5 text-xs">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: STATUS_COLORS[d.status] ?? '#374151' }} />
                <span className="text-gray-400 truncate">{STATUS_LABELS[d.status] ?? d.status}</span>
                <span className="ml-auto text-gray-300 font-medium">{d.count}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
