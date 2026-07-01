import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import AuthLayout from "../layout/AuthLayout";
import { useRegister } from "../hooks/useAuth";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
  const navigate = useNavigate();
  const registerMutation = useRegister();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    // 前端校验
    if (!username.trim() || !email.trim() || !password) {
      setError("请填写所有必填字段");
      return;
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      setError("请输入有效的邮箱地址");
      return;
    }
    if (password !== confirmPassword) {
      setError("两次密码输入不一致");
      return;
    }
    if (password.length < 8) {
      setError("密码长度至少 8 位");
      return;
    }

    try {
      await registerMutation.mutateAsync({
        username: username.trim(),
        email: email.trim(),
        password,
      });

      // 跳转到登录页提示用户登录
      navigate("/login", {
        replace: true,
        state: { registered: true },
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("注册失败，请稍后重试");
      }
    }
  };

  return (
    <AuthLayout title="注册 PaperPilot" subtitle="创建你的账号">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Error */}
        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
            {error}
          </div>
        )}

        {/* Username */}
        <div>
          <label
            htmlFor="register-username"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            用户名 <span className="text-red-500">*</span>
          </label>
          <input
            id="register-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={registerMutation.isPending}
            autoComplete="username"
            placeholder="输入用户名"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="register-email" className="mb-1 block text-sm font-medium text-gray-700">
            邮箱 <span className="text-red-500">*</span>
          </label>
          <input
            id="register-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={registerMutation.isPending}
            autoComplete="email"
            placeholder="输入邮箱地址"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
          />
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="register-password"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            密码 <span className="text-red-500">*</span>
          </label>
          <input
            id="register-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={registerMutation.isPending}
            autoComplete="new-password"
            placeholder="至少 8 位密码"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
          />
        </div>

        {/* Confirm Password */}
        <div>
          <label
            htmlFor="register-confirm"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            确认密码 <span className="text-red-500">*</span>
          </label>
          <input
            id="register-confirm"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={registerMutation.isPending}
            autoComplete="new-password"
            placeholder="再次输入密码"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={registerMutation.isPending}
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {registerMutation.isPending ? (
            <span className="inline-flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              注册中...
            </span>
          ) : (
            "注册"
          )}
        </button>

        <p className="text-center text-sm text-gray-500">
          已有账号？
          <Link to="/login" className="ml-1 font-medium text-blue-600 hover:text-blue-700">
            立即登录
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
