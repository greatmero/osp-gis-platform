import { useLocation } from 'react-router-dom';

const pageTitles: Record<string, string> = {
  '/': 'Network Map',
  '/dashboard': 'Operations Dashboard',
  '/assets': 'Asset Inventory',
  '/asset-types': 'Asset Type Admin',
  '/incidents': 'Incidents',
};

export function TopBar() {
  const { pathname } = useLocation();
  const title = pageTitles[pathname] ?? 'OSP GIS Platform';

  return (
    <header className="h-14 bg-gray-900 border-b border-gray-800 flex items-center px-6 gap-4 shrink-0">
      <h1 className="text-white font-semibold text-base flex-1">{title}</h1>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span className="text-xs text-gray-400">Live</span>
      </div>
    </header>
  );
}
