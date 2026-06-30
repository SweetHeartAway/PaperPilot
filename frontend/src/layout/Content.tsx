import { type ReactNode } from "react";

export interface ContentProps {
  /** Page content */
  children: ReactNode;
  /** Optional max-width constraint (default: max-w-7xl) */
  maxWidth?: string;
  /** Padding override (default: p-6) */
  padding?: string;
  /** Additional CSS classes */
  className?: string;
}

export default function Content({
  children,
  maxWidth = "max-w-7xl",
  padding = "p-6",
  className = "",
}: ContentProps) {
  return (
    <main className={`flex-1 overflow-auto ${padding} ${className}`}>
      <div className={`mx-auto ${maxWidth}`}>{children}</div>
    </main>
  );
}
