export interface Tab<T extends string = string> {
  key: T;
  label: string;
}

export interface TabBarProps<T extends string = string> {
  tabs: Tab<T>[];
  active: T;
  onChange: (key: T) => void;
  className?: string;
}

export default function TabBar<T extends string = string>({
  tabs,
  active,
  onChange,
  className = "",
}: TabBarProps<T>) {
  return (
    <div className={`flex border-b border-gray-200 ${className}`} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          role="tab"
          aria-selected={active === tab.key}
          onClick={() => onChange(tab.key)}
          className={`-mb-px px-4 py-2.5 text-sm font-medium transition-colors ${
            active === tab.key
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
