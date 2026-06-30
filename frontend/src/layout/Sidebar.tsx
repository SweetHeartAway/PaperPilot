import { type ReactNode } from "react";
import { NavLink } from "react-router-dom";

export interface NavItem {
  /** Route path */
  to: string;
  /** Display label */
  label: string;
  /** Optional icon (emoji, SVG component, or icon element) */
  icon?: ReactNode;
  /** Optional badge count shown as a small number pill */
  badge?: number;
}

export interface SidebarProps {
  /** Navigation items */
  items: NavItem[];
  /** Optional logo/brand shown at the top */
  logo?: ReactNode;
  /** Optional footer text shown at the bottom */
  footerText?: string;
  /** Width override (default: w-60) */
  width?: string;
  /** Whether sidebar is collapsed (mobile toggle) */
  collapsed?: boolean;
  /** Additional CSS classes */
  className?: string;
}

function navLinkClass({ isActive }: { isActive: boolean }): string {
  const base = "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors";
  if (isActive) {
    return `${base} bg-blue-50 text-blue-700 font-medium`;
  }
  return `${base} text-gray-600 hover:bg-gray-50 hover:text-gray-900`;
}

export default function Sidebar({
  items,
  logo,
  footerText,
  width = "w-60",
  collapsed = false,
  className = "",
}: SidebarProps) {
  return (
    <aside
      className={`fixed left-0 top-0 flex h-screen flex-col border-r border-gray-200 bg-white transition-all ${width} ${collapsed ? "-translate-x-full" : "translate-x-0"} ${className}`}
      role="navigation"
      aria-label="Sidebar navigation"
    >
      {/* Logo area */}
      {logo && <div className="flex h-16 items-center border-b border-gray-200 px-6">{logo}</div>}

      {/* Navigation items */}
      <nav className="flex-1 overflow-y-auto p-4" role="list">
        <ul className="flex flex-col gap-1" role="list">
          {items.map((item) => (
            <li key={item.to} role="listitem">
              <NavLink to={item.to} end className={navLinkClass} aria-current={undefined}>
                {item.icon && (
                  <span className="flex-shrink-0" aria-hidden="true">
                    {item.icon}
                  </span>
                )}
                {!collapsed && (
                  <>
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge !== undefined && (
                      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-100 px-1.5 text-xs font-medium text-blue-700">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer area */}
      {footerText && (
        <div className="border-t border-gray-200 p-4">
          <p className="text-sm text-gray-400">{footerText}</p>
        </div>
      )}
    </aside>
  );
}
