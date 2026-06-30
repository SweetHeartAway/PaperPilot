# services — 服务层目录

封装与后端的交互逻辑，包括：

- API 调用函数（调用 `api/` 目录的 axios 实例）
- 数据转换和格式化（将后端响应转为前端所需格式）
- 缓存和状态管理（React Query 的 queryKey 定义）

与 api/ 的区别：services 处理业务逻辑（调用多个 API、数据映射、错误聚合），api/ 只做 HTTP 请求。
