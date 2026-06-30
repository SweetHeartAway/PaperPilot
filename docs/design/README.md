# 设计文档

## 前端架构

### 分层设计

```
api/ (HTTP only)
  → services/ (数据转换)
    → hooks/ (React Query 封装)
      → pages/ (状态编排 + 组件组合)
```

- **api/** — 基于 axios 的 HTTP 客户端，只做请求和响应映射
- **services/** — 数据格式转换（如 skip/limit → page/pageSize）
- **hooks/** — React Query 的 useQuery/useMutation 封装
- **pages/** — 页面级编排，调用 hooks 获取数据后传入展示组件

### 组件分类

| 分类 | 目录 | 说明 |
|------|------|------|
| UI 基件 | `components/ui/` | 纯 props 驱动，零业务逻辑，可跨项目复用 |
| 领域组件 | `components/paper/` | 论文相关业务展示，通过 props 注入回调解耦 |
| 认证组件 | `components/auth/` | 路由守卫 |
| Layout | `layout/` | 布局系统，纯 props 驱动 |

### 路由结构

```
/login                  → LoginPage（公开）
/register               → RegisterPage（公开）
/                       → ProtectedRoute → MainLayout
  /papers               → PaperListPage
  /papers/create        → PaperCreatePage
  /papers/:id           → PaperDetailPage
  /tags                 → 标签管理（待实现）
  /profile              → 个人中心（待实现）
```

### 状态管理

- **服务端状态** → React Query（缓存、轮询、乐观更新）
- **客户端状态** → Zustand
  - `authStore` — token 持久化（localStorage）
  - `toastStore` — Toast 通知队列

### 关键设计决策

1. **PaperCard 泛型化** — 定义 `PaperCardData` 最小接口，不依赖业务 `Paper` 类型
2. **领域组件解耦** — TagManager、AISummaryPanel 通过 props 接收回调，不直接 import hooks
3. **Layout 纯 props 驱动** — 零业务逻辑，Header/Sidebar/Content/Footer 均通过外部传入配置
4. **Tailwind v4** — 使用 `@import "tailwindcss"` + `@utility`，无 tailwind.config.js

## 后端架构

### 分层

```
routes（api/v1/）
  → services（业务逻辑层）
    → models（SQLAlchemy ORM） / utils（工具函数）
```

- **routes** — FastAPI 路由，校验参数/权限，调用 service
- **services** — 业务逻辑，不直接操作 request/response
- **models** — SQLAlchemy ORM 模型，定义数据库结构
- **utils** — 工具函数（安全、AI 客户端、PDF 提取）

### 数据库 ER 概览

- `users` — 用户表
- `papers` — 论文表（外键 user_id）
- `tags` — 标签表
- `paper_tags` — 论文-标签多对多关联表
- `ai_analyses` — AI 分析结果表（外键 paper_id）
- `prompt_templates` — 自定义提示词模板表
