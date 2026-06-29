import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import PaperListPage from './pages/PaperListPage';

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-center py-20">
      <p className="text-base text-gray-400">{title}</p>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/papers" replace />} />
        <Route path="papers" element={<PaperListPage />} />
        <Route path="papers/create" element={<PlaceholderPage title="上传论文页面（待实现）" />} />
        <Route path="papers/:id" element={<PlaceholderPage title="论文详情页面（待实现）" />} />
        <Route path="tags" element={<PlaceholderPage title="标签管理页面（待实现）" />} />
        <Route path="profile" element={<PlaceholderPage title="个人中心页面（待实现）" />} />
      </Route>
      <Route path="/login" element={<PlaceholderPage title="登录页面（待实现）" />} />
      <Route path="/register" element={<PlaceholderPage title="注册页面（待实现）" />} />
    </Routes>
  );
}
