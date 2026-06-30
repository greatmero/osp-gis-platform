import {
  BarChart, Bar, XAxis, YAxis, Cell, Tooltip, ResponsiveContainer,
} from 'recharts';

interface Props {
  data: { key: string; label: string; count: number; color: string }[];
  loading?: boolean;
}

export function AssetTypeChart({ data, loading }: Props) {
  const sorted = [...data].sort((a, b) => b.count - a.count);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col gap-4">
      <p className="text-sm font-semibold text-white">Assets by Type</p>

      {loading ? (
        <div className="h-48 bg-gray-800 rounded animate-pulse" />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart layout="vertical" data={sorted} margin={{ top: 0, right: 20, bottom: 0, left: 8 }}>
            <XAxis
              type="number"
              tick={{ fill: '#6B7280', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={80}
              tick={{ fill: '#9CA3AF', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              formatter={(value: number) => [value, 'Count']}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={16}>
              {sorted.map((entry) => (
                <Cell key={entry.key} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
