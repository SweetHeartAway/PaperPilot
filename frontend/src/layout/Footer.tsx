import { type ReactNode } from "react";

export interface FooterProps {
  /** Left side content (copyright, etc.) */
  left?: ReactNode;
  /** Right side content */
  right?: ReactNode;
  /** Alternative content that replaces left+right layout when provided */
  children?: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

export default function Footer({ left, right, children, className = "" }: FooterProps) {
  return (
    <footer
      className={`border-t border-gray-200 bg-white py-3 px-6 ${className}`}
      role="contentinfo"
    >
      {children ? (
        children
      ) : (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-400">{left}</div>
          <div className="text-sm text-gray-400">{right}</div>
        </div>
      )}
    </footer>
  );
}
