import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Map', icon: '🗺️' },
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/assets', label: 'Assets', icon: '📋' },
  { to: '/asset-types', label: 'Asset Types', icon: '⚙️' },
  { to: '/incidents', label: 'Incidents', icon: '⚠️' },
];

export function Sidebar() {
  return (
    <aside className="w-60 min-h-screen bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
      <div className="px-4 py-5 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-blue-400 text-xl font-bold">⬡</span>
          <span className="text-white font-semibold text-sm leading-tight">
            OSP GIS<br />
            <span className="text-gray-400 font-normal text-xs">Managed Service</span>
          </span>
        </div>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <span>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-3 border-t border-gray-800">
        <p className="text-xs text-gray-600">OSP GIS Platform v1.0</p>
      </div>
    </aside>
  );
}
