import { useNavigate } from "react-router-dom";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md text-center">
        <h1 className="text-7xl font-bold text-gray-200">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-gray-900">页面未找到</h2>
        <p className="mt-2 text-sm text-gray-500">你访问的页面不存在或已被移除</p>
        <button
          onClick={() => navigate("/papers")}
          className="mt-6 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          返回首页
        </button>
      </div>
    </div>
  );
}
