import { type ReactNode } from "react";

export interface HeaderProps {
  /** Logo / brand element, shown on the left */
  logo?: ReactNode;
  /** Main title displayed next to or after the logo */
  title?: string;
  /** Optional right-side actions (user menu, settings button, etc.) */
  actions?: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

export default function Header({ logo, title, actions, className = "" }: HeaderProps) {
  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 ${className}`}
      role="banner"
    >
      <div className="flex items-center gap-3">
        {logo && <div className="flex-shrink-0">{logo}</div>}
        {title && <h1 className="text-lg font-semibold text-gray-900">{title}</h1>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
