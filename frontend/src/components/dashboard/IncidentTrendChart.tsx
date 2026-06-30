import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

interface Props {
  data: { week: string; count: number }[];
  loading?: boolean;
}

function shortDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function IncidentTrendChart({ data, loading }: Props) {
  const chartData = data.map((d) => ({ ...d, label: shortDate(d.week) }));

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col gap-4">
      <p className="text-sm font-semibold text-white">Incident Trend <span className="text-gray-500 font-normal">(12 weeks)</span></p>

      {loading ? (
        <div className="h-40 bg-gray-800 rounded animate-pulse" />
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="incidentGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: '#6B7280', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: '#6B7280', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
              cursor={{ stroke: '#374151' }}
              formatter={(value: number) => [value, 'Incidents']}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#EF4444"
              strokeWidth={2}
              fill="url(#incidentGrad)"
              dot={false}
              activeDot={{ r: 4, fill: '#EF4444', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
