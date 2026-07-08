# PaperPilot 架构分析

> 生成日期：2026-07-08
> 基于项目 commit b416b0e（master 分支）

---

## 1. 项目架构

### 1.1 整体分层

PaperPilot 采用经典前后端分离架构，数据流严格单向：

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                             │
│  pages/ → components/                                       │
│     ↑                                                       │
│  hooks/ (React Query)                                       │
│     ↑                                                       │
│  services/ (数据转换层)                                      │
│     ↑                                                       │
│  api/ (axios HTTP 客户端)                                    │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP (JSON)
┌──────────────────────▼──────────────────────────────────────┐
│                        Backend                              │
│  api/v1/ (FastAPI 路由)                                      │
│     ↓                                                        │
│  services/ (业务逻辑)                                        │
│     ↓                                                        │
│  models/ (SQLAlchemy ORM)  ←→  Database                     │
│  utils/ (工具函数: AI 客户端, PDF 提取, 安全)                 │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 技术栈

| 层 | 技术 | 版本 |
|----|------|------|
| 后端框架 | FastAPI | (latest) |
| ORM | SQLAlchemy | (latest) |
| 数据库 | SQLite（开发）/ PostgreSQL（生产可配）| — |
| 认证 | JWT + bcrypt (passlib) | — |
| 前端框架 | React | 19 |
| 构建工具 | Vite | 8 |
| 语言 | TypeScript | 6 |
| CSS | Tailwind CSS | 4 |
| 服务端状态 | @tanstack/react-query | 5 |
| 客户端状态 | Zustand | 5 |
| 测试框架 | Vitest + @testing-library/react | ^3 / ^16 |
| HTTP | axios | 1 |
| 路由 | react-router-dom | 7 |

### 1.3 后端目录结构

```
backend/
├── app/
│   ├── api/v1/           # 6 个路由模块（auth, users, papers, tags, ai, prompts）
│   ├── core/             # 配置（config.py）、依赖（dependencies.py）
│   ├── models/           # 4 个 SQLAlchemy 模型（User, Paper, Tag, AIAnalysis, PromptTemplate）
│   ├── schemas/          # Pydantic v2 请求/响应模型
│   ├── services/         # 10 个业务逻辑模块
│   │   ├── paper_service.py
│   │   ├── ai_summary_service.py (与 AI 分析相关逻辑)
│   │   ├── ai_utils.py (文本提取/提示词格式化)
│   │   ├── file_service.py (文件上传/下载/删除)
│   │   ├── tag_service.py
│   │   ├── user_service.py
│   │   ├── prompt_service.py
│   │   ├── embedding_service.py
│   │   ├── indexing_service.py (向量索引管理)
│   │   └── export_service.py (BibTeX/RIS 引用导出)
│   ├── repositories/     # 向量存储仓库模式
│   │   ├── vector.py (ABC)
│   │   └── vector_chroma.py (Chroma 实现)
│   └── utils/            # 工具函数
│       ├── ai_client.py
│       ├── embedding_client.py
│       ├── security.py
│       ├── pdf_extractor.py
│       └── database.py
├── alembic/versions/     # 数据库迁移
├── tests/                # 142 个测试
└── main.py               # 应用入口
```

### 1.4 前端目录结构

```
frontend/src/
├── api/              # HTTP 请求封装，零业务逻辑
│   ├── client.ts     # axios 实例 + 401 拦截器
│   ├── auth.ts
│   ├── papers.ts
│   ├── ai.ts
│   ├── tags.ts
│   └── prompts.ts
├── components/
│   ├── ui/           # 9 个纯 UI 基件（EmptyState, ErrorState, Pagination, Skeleton, Spinner, TabBar, UploadProgress, FileUploadArea, ToastContainer）
│   ├── paper/        # 7 个论文领域组件（PaperCard, PaperList, PaperCardSkeleton, PaperInfo, AISummaryPanel, PDFViewer, TagManager）
│   ├── auth/         # 1 个认证组件（ProtectedRoute）
│   └── user/         # 2 个用户组件（ProfileForm, ProfileSkeleton）
├── hooks/            # React Query 封装 + 自定义 hooks
│   ├── usePapers.ts
│   ├── useTags.ts
│   ├── useTagManagement.ts
│   ├── usePrompts.ts
│   ├── useCreatePaper.ts
│   ├── usePaperChat.ts
│   ├── useAuth.ts
│   ├── useUser.ts
│   └── useToast.ts
├── layout/           # 6 个纯 props 布局组件
│   ├── Header.tsx / Sidebar.tsx / Content.tsx / Footer.tsx
│   ├── MainLayout.tsx / AuthLayout.tsx
│   └── index.ts
├── pages/            # 10 个页面（PaperList, PaperCreate, PaperDetail, Login, Register, Tags, Prompts, Profile, ErrorPage, NotFoundPage）
├── services/         # 数据转换层
│   ├── paperService.ts
│   ├── tagService.ts
│   └── userService.ts
├── stores/           # Zustand 客户端状态
│   ├── authStore.ts
│   └── toastStore.ts
├── types/            # TypeScript 类型定义
│   ├── paper.ts / auth.ts / user.ts / tag.ts / ai.ts / prompt.ts
├── utils/
│   ├── format.ts
│   ├── token.ts
│   ├── error.ts
│   └── queryKeys.ts
└── assets/
```

---

## 2. Backend API

### 2.1 路由模块概览

| 模块 | 前缀 | 端点 | 认证 | 说明 |
|------|------|------|------|------|
| `auth.py` | `/api/v1/auth` | 2 | 无 | 注册、登录 |
| `users.py` | `/api/v1/users` | 7 | 全部 | 当前用户、用户查询、更新资料、修改密码、头像上传/删除/获取 |
| `papers.py` | `/api/v1/papers` | 16+ | 全部 | 论文 CRUD + PDF + 标签 + AI 分析 + 收藏 + Chat + 引用导出（含版本/批量）|
| `tags.py` | `/api/v1/tags` | 5 | 全部 | 标签 CRUD |
| `prompts.py` | `/api/v1/prompts` | 6 | 全部 | 自定义 Prompt 模板 |

### 2.2 核心数据模型关系

```
User 1───* Paper 1───* AIAnalysis
User 1───* AIPromptTemplate 1───* AIAnalysis (optional FK)
Paper *───* Tag (通过 paper_tags 关联表)
```

### 2.3 路由 → 服务 → 模型 映射

| 路由 | 服务层 | 模型 |
|------|--------|------|
| `POST /login` | `user_service.authenticate_user()` | User |
| `POST /register` | `user_service.create_user()` | User |
| `GET/POST /papers` | `paper_service.get_papers()/create_paper()` | Paper |
| `GET/POST /papers/{id}/ai-summary` | `ai_summary_service.get_ai_summary()/trigger_ai_summary()` | AIAnalysis |
| `POST /papers/{id}/tags` | `tag_service.add_tag_to_paper()` | Paper, Tag |
| `GET /tags` | `tag_service.get_tags()` | Tag |
| `GET /prompts/` | `prompt_service.get_templates()` | AIPromptTemplate |

### 2.4 认证流程

```
Login: POST /api/v1/auth/login (form-data: username + password)
  → user_service: 查用户 → verify_password → create_access_token
  → 返回 { access_token, token_type }

Guard: OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")
  → dependencies.get_current_user:
    → decode JWT → 查用户 → check is_active → 返回 User OR 401/403
```

### 2.5 错误处理模式

#### 后端

所有路由遵循统一模式：服务层抛 `ValueError`，路由层 catch 并映射 HTTP 状态码：

```python
try:
    return create_paper(db=db, paper=paper, user_id=current_user.id)
except ValueError as e:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
```

#### 前端

- **全局错误捕获**：`App.tsx` 使用 `<ErrorBoundary FallbackComponent={ErrorPage}>` 包裹 `<Routes>`，未捕获的渲染异常展示通用错误页面
- **404 路由**：路由末尾添加 `<Route path="*" element={<NotFoundPage />} />`，处理未知路径
- **API 错误统一处理**：使用 `getErrorMessage(err, fallback)` 工具函数，将 7 处重复的 `error instanceof Error` 逻辑统一为单点维护
- **Mutation onError**：`useAddPaperTag` / `useRemovePaperTag` 等 mutation 通过 `onError` 回调触发 toast 通知

---

## 3. Frontend

### 3.1 路由树

```
<App>
  <ErrorBoundary FallbackComponent={ErrorPage}>                     ← 全局错误捕获
    <Routes>
      <Route path="/login"     element={<LoginPage />} />           ← 公开
      <Route path="/register"  element={<RegisterPage />} />        ← 公开
      <Route element={<ProtectedRoute />}>                          ← 检查 authStore
        <Route path="/" element={<MainLayout>}>
          <Route index         → Navigate /papers />
          <Route path="papers"           element={<PaperListPage />} />
          <Route path="papers/create"    element={<PaperCreatePage />} />
          <Route path="papers/:id"       element={<PaperDetailPage />} />
          <Route path="tags"             element={<TagsPage />} />
          <Route path="prompts"          element={<PromptsPage />} />
          <Route path="profile"          element={<ProfilePage />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />                ← 404
    </Routes>
  </ErrorBoundary>
  <ToastContainer />      ← 全局，在路由之上
</App>
```

### 3.2 数据流示例（PaperListPage）

```
PaperListPage
  ├── useState: searchQuery, debouncedSearch, page, sortBy, favoriteOnly, selectedTagIds, batchMode
  ├── useAllTags()                         ← 获取所有标签用于筛选
  ├── usePaperList({ page, pageSize, search, favoriteOnly, sortBy, tagIds })
  │     └── useQuery(["papers", "list", params])
  │           └── paperService.getPaperList(query)
  │                 └── fetchPaperList({ skip, limit, search, favorite_only, sort_by, tag_ids })
  │                       └── axios.get("/api/v1/papers/")
  │
  ├── useToggleFavorite()                 ← 收藏切换
  ├── useDeletePaper()                    ← 删除
  ├── useBatchAIAnalysis()               ← 批量 AI
  ├── PaperList(papers)                    ← 纯渲染
  ├── PaperCardSkeleton(count)             ← Loading 态
  ├── EmptyState(title, message, action?)  ← Empty 态
  └── Pagination(currentPage, totalPages)  ← 分页
```

### 3.3 组件分类

| 分类 | 数量 | 特点 |
|------|------|------|
| UI 基件 | 12 | 纯 props 驱动，零业务逻辑，可跨项目复用 |
| 领域组件 | 7 | 通过 props 注入回调，不直接 import hooks |
| Layout | 6 | 纯 props 驱动，零业务逻辑 |
| 认证组件 | 1 | ProtectedRoute（路由守卫） |
| 页面 | 10 | 编排层：调用 hooks → 传入组件 |

### 3.4 状态管理双层架构

| 状态类型 | 工具 | 数据 |
|----------|------|------|
| 服务端状态 | React Query | 论文列表、详情、AI 分析、标签 |
| 客户端状态 | Zustand | auth token、toast 通知 |

Zustand store 职责分离：

```
authStore: token, isAuthenticated, setAuth(), clearAuth()
  → 同步初始化: 创建时立即读取 localStorage
  → setAuth/clearAuth 自动同步 localStorage

toastStore: toasts[], add(), remove(), clear()
  → 支持 duration=0 持久 toast
  → 通过 useToast hook 暴露 success/error/loading/info 方法
```

---

## 4. React Query 模式

### 4.1 查询键规范

```typescript
// 列表（分页+搜索）
["papers", "list", params]

// 详情
["papers", "detail", id]

// AI 分析（带类型和可选版本号）
["papers", "ai-summary", paperId, analysisType]
["papers", "ai-summary", paperId, analysisType, version]  // 指定版本

// 标签
["tags"]

// 当前用户
["user", "me"]
```

### 4.2 关键模式

| 模式 | 位置 | 说明 |
|------|------|------|
| **轮询替代 WebSocket** | `usePaperAISummary` | `refetchInterval` 每 5s 当 status=pending/processing，完成后停止 |
| **占位数据** | `usePaperList` | `placeholderData: (prev) => prev` 保持翻页平滑 |
| **enabled 守卫** | `usePaper(id)` | `enabled: id > 0` 防止无效请求 |
| **enabled 守卫** | `useCurrentUser` | `enabled: !!token` 仅登录后请求用户信息 |
| **onSuccess 失效** | mutations | 成功后 `invalidateQueries` 对应查询键 |

### 4.3 缓存失效策略

```
论文创建 → queryKeys.papers.lists()（列表）
论文更新 → queryKeys.papers.detail(paperId) + lists()（详情+列表）
论文删除 → queryKeys.papers.lists()（列表）
标签变更 → queryKeys.papers.detail(paperId)（仅详情，不波及 AI 摘要）
AI 触发 → queryKeys.papers.aiSummary(paperId, type)（AI 分析，含所有版本）
批量 AI 触发 → queryKeys.papers.aiSummaries()（全部 AI 分析）
Prompt 变更 → promptKeys.lists()（模板列表）
```

QueryClient 全局配置：staleTime=30s, retry=1, refetchOnWindowFocus=false。

---

## 5. Service 层

### 5.1 后端 Service

| Service | 行数 | 职责 | 模式 |
|---------|------|------|------|
| `paper_service.py` | ~120 | 论文 CRUD + DOI 唯一性校验 | 顶层函数集合 |
| `file_service.py` | ~80 | PDF 文件上传/下载/删除 | 顶层函数 |
| `ai_summary_service.py` | ~456 | AI 分析完整编排 + 版本 + 缓存 + 批量 | 顶层函数，最复杂 |
| `ai_service.py` | ~150 | 旧版通用 AI 分析（遗留） | 顶层函数 |
| `ai_utils.py` | ~65 | 文本提取/提示词格式化/结果构建 | 顶层函数 |
| `tag_service.py` | ~60 | 标签 CRUD + 论文关联管理 | 顶层函数 |
| `user_service.py` | ~50 | 用户 CRUD + 查找 | 顶层函数 |
| `prompt_service.py` | ~80 | Prompt 模板 CRUD + 默认管理 | 顶层函数 |
| `embedding_service.py` | ~20 | 嵌入接口包装 | 类，委托给 client |

**值得注意的差异**：核心业务服务（paper, tag, user, prompt）使用顶层函数 + `db: Session` 参数；而 vector/embedding 服务使用类 + `__init__` 参数支持测试注入。

### 5.2 前端 Service

| Service | 导入者 | 职责 |
|---------|--------|------|
| `paperService.ts` | `usePapers` | 分页参数转换（skip/limit ↔ page/pageSize） |
| `tagService.ts` | `useTagManagement` | 标签 API 调用重导出（含 createTag） |
| `userService.ts` | `useUser` | 用户 API 调用重导出 |

前端的 api/ → services/ → hooks/ 分层原则：

- **api/** 层传原始 HTTP 参数（`skip`, `limit`）
- **services/** 层转换为业务语义（`page`, `pageSize`）
- **hooks/** 层使用 services 层的函数，注入 React Query

示例（`paperService.ts`）：

```typescript
// api/ 层传原始参数（skip, limit）
// services/ 层转成业务语义（page, pageSize）
export async function getPaperList(query: PaperListQuery) {
  const skip = (query.page - 1) * query.pageSize;
  const res = await fetchPaperList({ skip, limit: query.pageSize, search: query.search });
  return {
    papers: res.items,
    total: res.total,
    totalPages: Math.ceil(res.total / query.pageSize) || 1,
  };
}
```

其他模块（tags, auth, users）没有 service 层，api/ 函数直接返回原始响应。

---

## 6. 测试覆盖

### 6.1 后端测试

- 测试框架：pytest + FastAPI TestClient
- 测试文件：7 个（`test_auth.py`, `test_papers.py`, `test_tags.py`, `test_users.py`, `test_ai_summary.py`, `test_prompts.py`, `test_chat.py`）
- 测试数量：142 个
- 策略：每个测试函数独立数据库（`scope="function"` + `create_all/drop_all`），覆盖正常路径 + 边界条件

### 6.2 前端测试

- 测试框架：Vitest + @testing-library/react + jsdom
- 配置文件：`vitest.config.ts`，使用 jsdom 环境
- 全局设置：`src/test/setup.ts`，扩展 `@testing-library/jest-dom` matchers
- 测试文件：10 个，共 67 个测试

| 测试文件 | 类型 | 说明 |
|---------|------|------|
| `utils/format.test.ts` | 纯函数 | 日期/数字格式化，零 DOM 依赖 |
| `utils/token.test.ts` | 纯函数 | Token 编解码，零 DOM 依赖 |
| `stores/toastStore.test.ts` | Store | 直接调用 `getState()`，不渲染组件 |
| `components/ui/EmptyState.test.tsx` | UI 组件 | `render()` + `screen.getByText` 查询 |
| `components/ui/ErrorState.test.tsx` | UI 组件 | `render()` + `screen.getByText` 查询 |
| `components/ui/Spinner.test.tsx` | UI 组件 | `render()` + `screen.getByText` 查询 |
| `components/ui/Pagination.test.tsx` | UI 组件 | `render()` + `screen.getByText` 查询 |
| `hooks/useAuth.test.tsx` | Hook | `renderHook` + mock API |
| `hooks/useUser.test.tsx` | Hook | `renderHook` + mock API + mock store |
| `hooks/useTags.test.tsx` | Hook | `renderHook` + mock API |

#### 测试策略

- 纯函数：直接测输入输出，零 DOM 依赖
- Zustand Store：用 `getState()` 直接调用，不渲染组件
- UI 组件：用 `@testing-library/react` 的 `render()` + `screen.getByText` 查询
- 使用 `className.toContain()` 断言 Tailwind 类名，不依赖 CSS 实际生效
- 避免 mock 外部依赖，优先测试纯 UI 基件

---

### 6.3 代码分割与性能优化

- **React.lazy 代码分割**：6 个非首屏页面（PaperDetailPage、PaperCreatePage、TagsPage、ProfilePage、ErrorPage、NotFoundPage）使用 `React.lazy()` 动态加载，主 chunk 从 373KB 降至 281KB（-25%）
- **pdfjs-dist worker**：PDF 内联查看器的 worker 文件通过 Vite `new URL(…, import.meta.url)` 自动提取为独立 chunk（~1.2MB），仅在访问论文详情页时按需加载
- **React.memo**：PaperCard 和 PaperList 包裹 `memo()`，避免不必要的重渲染
- **模块级常量**：AI_TABS 提取为 `PaperDetailPage.tsx` 的模块级常量，避免每次渲染重新创建数组

---

## 7. AI 模块分析

### 7.1 客户端抽象

`app/utils/ai_client.py`:

- 兼容 OpenAI API 格式 → 支持 DeepSeek / GLM / Qwen / Ollama
- 无 API Key 自动降级为 stub（截断前 200 字符）
- 单例模式：`ai_client = AIClient()`

### 7.2 AI 分析完整流程（`ai_summary_service.trigger_ai_summary`）

```
1. 验证论文存在且属于当前用户
2. 检查是否已有 pending/processing 记录 → 409 Conflict
3. 非强制时检查缓存 → 返回已完成的记录
4. 确定下一个版本号 (max + 1)
5. 加载自定义 Prompt 或用户默认模板
6. 创建 AIAnalysis 记录 (status: "pending")
7. 提取文本（优先 abstract → PDF 提取）
8. 调用 AI 模型（带重试逻辑）
9. 保存结果为 JSON 字符串 → status: "completed"
10. 记录 model_name, processing_time_ms, tokens_used
11. 失败 → status: "failed" + error_message
```

### 7.3 两个并行的 AI 系统

| | 旧版 (`/api/v1/ai/`) | 新版 (`/api/v1/papers/{id}/ai-summary`) |
|--|----------------------|----------------------------------------|
| 输入 | 纯文本 content | paper_id，自动提取文本 |
| 持久化 | ❌ | ✅ AIAnalysis 表 |
| 版本管理 | ❌ | ✅ |
| 缓存 | ❌ | ✅ |
| 批量 | ❌ | ✅ |
| 自定义 Prompt | ❌ | ✅ |
| 状态 | 遗留（硬编码占位符） | 当前使用 |

### 7.4 Embedding + 向量存储

```
embedding_client.py (utils)
  → EmbeddingProvider (ABC) + OpenAICompatibleProvider + BGEProvider
  → factory: _create_provider_from_settings()
  → EmbeddingClient 单例

embedding_service.py (services)
  → 薄包装，委托给 client

vector.py (repositories)
  → VectorRepository (ABC): IndexItem/SearchResult TypedDicts

vector_chroma.py (repositories)
  → ChromaVectorRepository + _ChromaEmbeddingFunction 适配器

```

三层抽象（utils → services → repositories）提供了清晰的关注点分离，但对于当前需求可能过度工程化。

---

## 8. 代码重复

### 8.1 前后端两份 AI 分析系统 🔴

旧版 `ai_service.py` + `ai.py` 路由与新版 `ai_summary_service.py` + papers 路由中的 AI 端点并存。两者都用同一个 `ai_client`，但旧版不持久化、不缓存、不管理版本。

系统提示词被复制：
- `_SUMMARY_SYSTEM_PROMPT` 在 `ai_service.py` 中定义
- `ai_summary_service.py` 在代码中嵌入类似的提示词

### 8.2 Stub 截断逻辑重复 🔴 (已修复 ✅)

| 位置 | 代码 |
|------|------|
| `ai_client.py` | `_stub_chat()`: 统一 stub 入口 |
| `embedding_client.py` | `_stub_embed()` + provider None 检查 |

旧版 `ai_service.py` 中的独立 stub 实现已移除，统一由 `ai_client` 处理。

### 8.3 DOI 唯一性校验重复 🟡 (已修复 ✅)

- `paper_service.py:21-23` — `create_paper()` 中检查
- `paper_service.py:82-86` — `update_paper()` 中检查
- 已提取为 `_validate_doi_unique()` 辅助函数

### 8.4 前端错误状态 HTML 重复 🟡 (已修复 ✅)

类似的错误状态结构（SVG + 错误文本 + 重试按钮）在 `PaperListPage.tsx`、`PaperDetailPage.tsx`、`PaperInfo.tsx` 和 `AISummaryPanel.tsx` 中重复出现。已提取为 `<ErrorState>` 组件。

### 8.5 前端内联 SVG 图标 (已修复 ✅)

约 18 个内联 SVG 图标散落在 .tsx 文件中。关闭图标（X 形状）和警告三角图标已抽取为 `components/ui/Icons.tsx`（XIcon、XCircleIcon、WarningIcon、UploadArrowIcon 4 个共享组件）。

---

## 9. 重构建议

### 9.1 高优先级（✅ 已完成）

| # | 建议 | 状态 |
|---|------|------|
| 1 | **弃用旧版 AI 路由** `(/api/v1/ai/)` — 标记为 deprecated + 共享 Prompt 常量移至 `app/core/prompts.py` | ✅ 已实现 |
| 2 | **移除冗余 stub 逻辑** — `ai_service.py` 不再重复 `ai_client` 的 stub 实现 | ✅ 已实现 |

### 9.2 中等优先级（✅ 已完成）

| # | 建议 | 状态 |
|---|------|------|
| 3 | **抽取通用 ErrorState 组件** — `components/ui/ErrorState.tsx` | ✅ 已实现 |
| 4 | **抽取 `_validate_doi_unique()`** — `paper_service.py` 消除重复校验 | ✅ 已实现 |
| 5 | **拆分 `ai_summary_service.py`** — 文本提取/提示词格式移到 `app/services/ai_utils.py` | ✅ 已实现 |
| 6 | **抽取 `file_service.py`** — 文件操作从 `paper_service.py` 独立 | ✅ 已实现 |
| 7 | **分离 `usePapers.ts` 标签 hooks** — 移至独立 `useTags.ts` | ✅ 已实现 |

### 9.3 低优先级（待处理）

| # | 建议 | 说明 | 状态 |
|---|------|------|------|
| 8 | **引入图标库** | lucide-react 或集中 `<Icon>` 组件替代 18 个内联 SVG | ✅ 已抽取共享 Icons.tsx（4 个组件） |
| 9 | **前端密码校验对齐** | 前端校验 `>=6` 位，后端要求 `min_length=8`，两端不一致 | ⏳ |
| 10 | **后端单例 → 依赖注入** | `ai_client`、`embedding_client` 等全局单例不利于单元测试 mock，可改为构造注入 | ⏳ |
| 11 | **登录页统一使用 `useAuthStore`** | 登录页与 `useAuth` hook 的使用不一致，可统一 | ⏳ |

---

## 附录

### A. 后端 API 端点完整列表

```
POST   /api/v1/auth/register          # 注册
POST   /api/v1/auth/login             # 登录

GET    /api/v1/papers/                # 论文列表（分页+搜索）
POST   /api/v1/papers/                # 创建论文
GET    /api/v1/papers/{paper_id}      # 论文详情
PUT    /api/v1/papers/{paper_id}      # 更新论文
DELETE /api/v1/papers/{paper_id}      # 删除论文
POST   /api/v1/papers/{paper_id}/upload            # 上传 PDF
GET    /api/v1/papers/{paper_id}/download          # 下载 PDF
DELETE /api/v1/papers/{paper_id}/file              # 删除文件
POST   /api/v1/papers/{paper_id}/tags              # 添加标签
DELETE /api/v1/papers/{paper_id}/tags/{tag_id}     # 移除标签
POST   /api/v1/papers/{paper_id}/favorite/toggle   # 切换收藏
GET    /api/v1/papers/{paper_id}/export            # 引用导出（?format=bibtex|ris）
POST   /api/v1/papers/{paper_id}/chat              # 论文对话（RAG）
POST   /api/v1/papers/batch/ai-summary             # 批量 AI 分析
GET    /api/v1/papers/{paper_id}/ai-summary        # 获取 AI 分析
POST   /api/v1/papers/{paper_id}/ai-summary        # 触发 AI 分析
GET    /api/v1/papers/{paper_id}/ai-summary/versions      # 版本列表
GET    /api/v1/papers/{paper_id}/ai-summary/versions/diff # 版本对比

GET    /api/v1/tags/                  # 标签列表
POST   /api/v1/tags/                  # 创建标签
GET    /api/v1/tags/{tag_id}          # 标签详情
PUT    /api/v1/tags/{tag_id}          # 更新标签
DELETE /api/v1/tags/{tag_id}          # 删除标签

GET    /api/v1/users/me               # 当前用户
PUT    /api/v1/users/me               # 更新用户资料
POST   /api/v1/users/me/change-password  # 修改密码
POST   /api/v1/users/me/avatar        # 上传头像
DELETE /api/v1/users/me/avatar        # 删除头像
GET    /api/v1/users/{user_id}/avatar # 获取头像文件
GET    /api/v1/users/{user_id}        # 用户查询

GET    /api/v1/prompts/               # Prompt 模板列表
POST   /api/v1/prompts/               # 创建模板
GET    /api/v1/prompts/{template_id}  # 模板详情
PUT    /api/v1/prompts/{template_id}  # 更新模板
DELETE /api/v1/prompts/{template_id}  # 删除模板
POST   /api/v1/prompts/{template_id}/set-default   # 设为默认
```

### B. 前端数据流示例（PaperCreatePage 状态机）

```
PageStatus: "form" → "creating" → "uploading" → "success" → navigate /papers
                            ↘        ↙
                          "error" → "form" (retry)
```

### C. 测试覆盖

- 后端：142 个测试，7 个测试文件（auth, papers, tags, users, ai_summary, prompts, chat）
- 前端：67 个测试，10 个测试文件（format, token, toastStore, EmptyState, ErrorState, Spinner, Pagination, useAuth, useUser, useTags）
- 后端测试框架：pytest + FastAPI TestClient + 独立数据库 per function
- 前端测试框架：Vitest + @testing-library/react + jsdom

### D. 相关文档

| 文档 | 路径 | 说明 |
|------|------|------|
| 数据库 ER 图 | [ER_DIAGRAM.md](ER_DIAGRAM.md) | 完整 ER 图（Mermaid）、6 模型字段说明、级联关系 |
| 组件关系图 | [COMPONENT_MAP.md](COMPONENT_MAP.md) | 路由树、页面/Hooks/API 调用链、基件依赖图 |
