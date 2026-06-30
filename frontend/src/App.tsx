import { Routes, Route, Navigate, Link } from "react-router-dom";
import MainLayout from "./layout/MainLayout";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import PaperListPage from "./pages/PaperListPage";
import PaperCreatePage from "./pages/PaperCreatePage";
import PaperDetailPage from "./pages/PaperDetailPage";
import TagsPage from "./pages/TagsPage";
import ProfilePage from "./pages/ProfilePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ToastContainer from "./components/ui/ToastContainer";
import type { NavItem } from "./layout/Sidebar";

const NAV_ITEMS: NavItem[] = [
  { to: "/papers", label: "论文" },
  { to: "/tags", label: "标签" },
  { to: "/profile", label: "个人中心" },
];

export default function App() {
  return (
    <>
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
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Route>
      </Routes>
      <ToastContainer />
    </>
  );
}
