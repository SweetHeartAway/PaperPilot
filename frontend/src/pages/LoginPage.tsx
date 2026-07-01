import { useState, type FormEvent } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import AuthLayout from "../layout/AuthLayout";
import Spinner from "../components/ui/Spinner";
import { useLogin } from "../hooks/useAuth";
import { getErrorMessage } from "../utils/error";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const loginMutation = useLogin();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // 注册成功后跳转过来显示提示
  const registered = (location.state as { registered?: boolean })?.registered;

  // 登录成功后跳转到之前试图访问的页面，没有则回论文列表
  // 支持从 URL 参数（401 拦截器跳转）和 react-router state（ProtectedRoute）获取来源路径
  const redirectParam = new URLSearchParams(window.location.search).get("redirect");
  const from = redirectParam ?? (location.state as { from?: string })?.from ?? "/papers";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError("请输入用户名和密码");
      return;
    }

    setError("");

    try {
      await loginMutation.mutateAsync({ username: username.trim(), password });
      navigate(from, { replace: true });
    } catch (err: unknown) {
      setError(getErrorMessage(err, "登录失败，请检查用户名和密码"));
    }
  };

  return (
    <AuthLayout title="登录 PaperPilot" subtitle="AI 论文管理平台">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 注册成功提示 */}
        {registered && (
          <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700" role="status">
            注册成功！请使用你的账号登录
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
            {error}
          </div>
        )}

        {/* Username */}
        <div>
          <label htmlFor="login-username" className="mb-1 block text-sm font-medium text-gray-700">
            用户名
          </label>
          <input
            id="login-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loginMutation.isPending}
            autoComplete="username"
            placeholder="输入用户名"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
          />
        </div>

        {/* Password */}
        <div>
          <label htmlFor="login-password" className="mb-1 block text-sm font-medium text-gray-700">
            密码
          </label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loginMutation.isPending}
            autoComplete="current-password"
            placeholder="输入密码"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loginMutation.isPending}
          className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loginMutation.isPending ? (
            <span className="inline-flex items-center gap-2">
              <Spinner size="md" variant="white" />
              登录中...
            </span>
          ) : (
            "登录"
          )}
        </button>

        <p className="text-center text-sm text-gray-500">
          还没有账号？
          <Link to="/register" className="ml-1 font-medium text-blue-600 hover:text-blue-700">
            立即注册
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
