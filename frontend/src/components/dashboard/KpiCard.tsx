interface Props {
  label: string;
  value: string | number | undefined;
  sub?: string;
  accent?: string;
  children?: React.ReactNode;
}

export function KpiCard({ label, value, sub, accent, children }: Props) {
  const isLoading = value === undefined;

  return (
    <div
      className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col gap-2 relative overflow-hidden"
      style={accent ? { borderLeftColor: accent, borderLeftWidth: 3 } : undefined}
    >
      <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">{label}</p>
      {isLoading ? (
        <div className="h-8 w-24 bg-gray-800 rounded animate-pulse" />
      ) : (
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-white leading-none">{value}</span>
          {sub && <span className="text-xs text-gray-500">{sub}</span>}
        </div>
      )}
      {children}
    </div>
  );
}
