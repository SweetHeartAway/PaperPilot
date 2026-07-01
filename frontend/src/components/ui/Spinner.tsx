export interface SpinnerProps {
  /** `sm`=12px, `md`=16px(default), `lg`=40px */
  size?: "sm" | "md" | "lg";
  /** `blue`(default) 用于独立区域, `white` 用于深色背景按钮 */
  variant?: "blue" | "white";
  className?: string;
}

const SIZE_STYLES: Record<string, string> = {
  sm: "h-3 w-3 border-2",
  md: "h-4 w-4 border-2",
  lg: "h-10 w-10 border-4",
};

const VARIANT_STYLES: Record<string, string> = {
  blue: "border-blue-200 border-t-blue-600",
  white: "border-white border-t-transparent",
};

export default function Spinner({ size = "md", variant = "blue", className = "" }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="加载中"
      className={`animate-spin rounded-full ${SIZE_STYLES[size]} ${VARIANT_STYLES[variant]} ${className}`}
    />
  );
}
