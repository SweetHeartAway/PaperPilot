# hooks — 自定义 Hook 目录

封装组件中的状态逻辑和副作用，包括：

- 数据获取 Hook（usePapers、useTags）— 基于 React Query 封装 API 调用
- 业务逻辑 Hook（useAuth、usePagination）— 组合多个 API 或管理本地状态

Hook 是页面和 API 之间的桥梁，让页面保持简洁。
