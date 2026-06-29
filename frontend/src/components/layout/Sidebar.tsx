import { NavLink } from 'react-router-dom';

interface NavItem {
  to: string;
  label: string;
}

const navItems: NavItem[] = [
  { to: '/papers', label: '论文' },
  { to: '/tags', label: '标签' },
  { to: '/profile', label: '个人中心' },
];

export default function Sidebar() {
  return (
    <aside className="flex h-full w-56 flex-col border-r border-gray-200 bg-white">
      <div className="flex items-center px-6 py-5">
        <h1 className="text-xl font-bold text-blue-600">PaperPilot</h1>
      </div>
      <nav className="flex-1 px-3 py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `mb-1 flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-gray-200 px-4 py-3">
        <p className="text-xs text-gray-400">PaperPilot v1.0</p>
      </div>
    </aside>
  );
}
