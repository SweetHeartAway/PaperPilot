# api — HTTP 请求层目录

基于 axios 实例的 API 调用函数，每个后端资源对应一个文件（auth.ts、papers.ts、tags.ts、ai.ts）。

职责：

- 定义请求 URL、参数、请求体
- 设置请求/响应拦截器（token 注入、401 处理）
- **不处理业务逻辑**，只做 HTTP 序列化/反序列化

每个后端资源的 API 操作在同一文件中管理，services/ 层在此基础上做数据转换后提供给 hooks/ 使用。
