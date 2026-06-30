# PaperPilot 前端

PaperPilot 的前端基于 React 19 + TypeScript + Vite 8 + Tailwind CSS 4。

## 目录结构

```
src/
├── api/              # axios HTTP 客户端，零业务逻辑
├── components/       # 可复用 UI 组件
│   ├── auth/         # 认证组件（ProtectedRoute 路由守卫）
│   ├── paper/        # 论文领域组件（PaperCard, TagManager 等）
│   ├── ui/           # 纯 UI 基件（EmptyState, Pagination, Skeleton 等）
│   └── user/         # 用户组件（ProfileForm）
├── hooks/            # React Query + 自定义 hooks
├── layout/           # 纯 props 驱动的布局系统
├── pages/            # 7 个页面编排层
├── services/         # 业务数据转换层
├── stores/           # Zustand 客户端状态（auth, toast）
├── types/            # TypeScript 类型定义
└── utils/            # 工具函数（format, token）
```

## 分层数据流

```
api/ (HTTP only) → services/ (transform) → hooks/ (React Query) → pages/ (orchestration)
```

- **api/** — 只做 HTTP 请求，不处理业务逻辑
- **services/** — 数据转换（如 skip/limit → page/pageSize）
- **hooks/** — React Query 的 useQuery/useMutation 封装
- **pages/** — 编排 hooks + 组件

## 开发命令

```bash
npm install       # 安装依赖
npm run dev       # 启动开发服务器（localhost:5173）
npm run build     # 生产构建 → dist/
npm run lint      # oxlint 检查
npm run format    # prettier 格式化
npx tsc --noEmit  # TypeScript 类型检查
```
