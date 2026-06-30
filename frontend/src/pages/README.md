# pages — 页面组件目录

每个 `.tsx` 文件对应一个路由页面（如 PaperListPage、LoginPage）。页面组件负责组合布局、业务组件和通用组件，是路由的直接渲染目标。

**不包含业务逻辑**，业务逻辑委托给 hooks 和 services。
