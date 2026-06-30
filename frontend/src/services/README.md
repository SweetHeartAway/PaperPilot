# services — 数据转换层目录

在 api/ 层和 hooks/ 层之间的薄转换层：

- **数据格式转换**（如 skip/limit ↔ page/pageSize 的转换）
- **响应重组**（将后端原始响应转为前端业务模型）
- **不直接调用 API** — 通过 api/ 层函数间接使用

与 api/ 的区别：services 处理数据格式转换，api/ 只做 HTTP 请求。
