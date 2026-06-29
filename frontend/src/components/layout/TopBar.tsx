export default function TopBar() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-6">
      <h2 className="text-base font-semibold text-gray-800">论文管理</h2>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-400">PaperPilot</span>
      </div>
    </header>
  );
}
