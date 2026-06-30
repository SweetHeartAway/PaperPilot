# components — 通用 UI 组件目录

存放可复用的展示型组件，按功能子目录组织：

- **ui/** — 纯 UI 基件（EmptyState、ErrorState、Pagination、Skeleton、TabBar、UploadProgress、FileUploadArea、ToastContainer），纯 props 驱动，零业务逻辑，可跨项目复用
- **auth/** — 认证组件（ProtectedRoute 路由守卫）
- **paper/** — 论文领域组件（PaperCard、PaperList、PaperCardSkeleton、PaperInfo、AISummaryPanel、TagManager），通过 props 注入回调
- **user/** — 用户组件（ProfileForm）

这些组件不直接调用 API，只通过 props 接收数据和回调。
