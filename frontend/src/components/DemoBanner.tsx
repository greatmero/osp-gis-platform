const DEMO = import.meta.env.VITE_DEMO_MODE === 'true';

export function DemoBanner() {
  if (!DEMO) return null;
  return (
    <div className="fixed top-0 left-0 right-0 z-[200] flex items-center justify-center gap-2 bg-amber-500 text-amber-950 text-xs font-semibold py-1 px-4 select-none">
      <span>⚠</span>
      <span>Demo Mode — read-only snapshot. Create, edit and delete are disabled.</span>
    </div>
  );
}
