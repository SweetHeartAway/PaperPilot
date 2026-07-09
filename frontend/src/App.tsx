import { lazy, Suspense } from "react";
import { Routes, Route, Navigate, Link } from "react-router-dom";
import { ErrorBoundary } from "react-error-boundary";
import MainLayout from "./layout/MainLayout";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import ToastContainer from "./components/ui/ToastContainer";
import Spinner from "./components/ui/Spinner";
import type { NavItem } from "./layout/Sidebar";

// 首屏页面 — 静态导入
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import PaperListPage from "./pages/PaperListPage";

// 非首屏页面 — 懒加载
const PaperCreatePage = lazy(() => import("./pages/PaperCreatePage"));
const PaperDetailPage = lazy(() => import("./pages/PaperDetailPage"));
const StatsPage = lazy(() => import("./pages/StatsPage"));
const TagsPage = lazy(() => import("./pages/TagsPage"));
const PromptsPage = lazy(() => import("./pages/PromptsPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const CollectionsPage = lazy(() => import("./pages/CollectionsPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const ErrorPage = lazy(() => import("./pages/ErrorPage"));

const NAV_ITEMS: NavItem[] = [
  { to: "/papers", label: "论文" },
  { to: "/tags", label: "标签" },
  { to: "/collections", label: "列表" },
  { to: "/prompts", label: "Prompt 模板" },
  { to: "/stats", label: "统计" },
  { to: "/profile", label: "个人中心" },
];

export default function App() {
  return (
    <>
      <ErrorBoundary FallbackComponent={ErrorPage}>
        <Suspense
          fallback={
            <div className="flex min-h-screen items-center justify-center">
              <Spinner size="lg" variant="blue" />
            </div>
          }
        >
          <Routes>
            {/* 公开路由 — 无需登录 */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* 受保护路由 — 需要登录 */}
            <Route element={<ProtectedRoute />}>
              <Route
                path="/"
                element={
                  <MainLayout
                    header={{
                      logo: (
                        <Link to="/" className="text-xl font-bold text-blue-600">
                          PaperPilot
                        </Link>
                      ),
                    }}
                    sidebar={{
                      items: NAV_ITEMS,
                      footerText: "PaperPilot v1.0",
                    }}
                    footer={{
                      left: "© 2026 PaperPilot",
                    }}
                  />
                }
              >
                <Route index element={<Navigate to="/papers" replace />} />
                <Route path="papers" element={<PaperListPage />} />
                <Route path="papers/create" element={<PaperCreatePage />} />
                <Route path="papers/:id" element={<PaperDetailPage />} />
                <Route path="tags" element={<TagsPage />} />
                <Route path="collections" element={<CollectionsPage />} />
                <Route path="prompts" element={<PromptsPage />} />
                <Route path="stats" element={<StatsPage />} />
                <Route path="profile" element={<ProfilePage />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
      <ToastContainer />
    </>
  );
}
