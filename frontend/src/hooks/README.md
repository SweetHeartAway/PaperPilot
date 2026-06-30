# hooks — 自定义 Hook 目录

封装组件中的状态逻辑和副作用，包括：

- **数据获取 Hook**（usePapers、useTags）— 基于 React Query 封装 services/ 层调用
- **业务逻辑 Hook**（useTagManagement、useUser）— 组合多个 API 或管理本地状态
- **UI 状态 Hook**（useToast）— 封装 Toast 通知

Hook 是页面和 API 之间的桥梁，让页面保持简洁。服务端状态通过 React Query 管理，客户端状态通过 Zustand store 管理。
