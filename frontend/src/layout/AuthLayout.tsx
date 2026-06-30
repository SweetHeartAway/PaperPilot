import { type ReactNode } from "react";

export interface AuthLayoutProps {
  /** Form content (login / register form) */
  children: ReactNode;
  /** Title shown above the form card */
  title?: string;
  /** Optional subtitle */
  subtitle?: string;
  /** Logo shown at the very top */
  logo?: ReactNode;
}

export default function AuthLayout({ children, title, subtitle, logo }: AuthLayoutProps) {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm">
        {/* Logo */}
        {logo && <div className="mb-6 flex justify-center">{logo}</div>}

        {/* Title */}
        {title && <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">{title}</h1>}

        {/* Subtitle */}
        {subtitle && <p className="mb-6 text-center text-sm text-gray-500">{subtitle}</p>}

        {/* Form content */}
        {children}
      </div>
    </div>
  );
}
