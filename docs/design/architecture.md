# PaperPilot 架构分析

> 生成日期：2026-07-01
> 基于项目 commit 8534bb1（master 分支）

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
│   ├── services/         # 8 个业务逻辑模块
│   │   ├── paper_service.py
│   │   ├── ai_service.py (旧版)
│   │   ├── ai_summary_service.py (新版, 最复杂)
│   │   ├── tag_service.py
│   │   ├── user_service.py
│   │   ├── prompt_service.py
│   │   ├── embedding_service.py
│   │   └── vector_service.py
│   ├── repositories/     # 向量存储仓库模式
│   │   ├── vector.py (ABC)
│   │   └── vector_chroma.py (Chroma 实现)
│   └── utils/            # 工具函数
│       ├── ai_client.py
│       ├── embedding_client.py
│       ├── security.py
│       ├── pdf_extractor.py
│       ├── database.py
│       └── helpers.py
├── alembic/versions/     # 数据库迁移
├── tests/                # 59 个测试
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
│   └── users.ts
├── components/
│   ├── ui/           # 7 个纯 UI 基件（EmptyState, Pagination, Skeleton, TabBar, UploadProgress, FileUploadArea, ToastContainer）
│   ├── paper/        # 6 个论文领域组件（PaperCard, PaperList, PaperCardSkeleton, PaperInfo, AISummaryPanel, TagManager）
│   └── auth/         # 1 个认证组件（ProtectedRoute）
├── hooks/            # React Query 封装
│   ├── usePapers.ts
│   ├── useAuth.ts
│   └── useToast.ts
├── layout/           # 6 个纯 props 布局组件
│   ├── Header.tsx / Sidebar.tsx / Content.tsx / Footer.tsx
│   ├── MainLayout.tsx / AuthLayout.tsx
│   └── index.ts
├── pages/            # 5 个页面（PaperList, PaperCreate, PaperDetail, Login, Register）
├── services/         # 数据转换层
│   └── paperService.ts
├── stores/           # Zustand 客户端状态
│   ├── authStore.ts
│   └── toastStore.ts
├── types/            # TypeScript 类型定义
│   ├── paper.ts / auth.ts / user.ts / tag.ts / ai.ts
├── utils/
│   ├── format.ts
│   └── token.ts
└── assets/
```

---

## 2. Backend API

### 2.1 路由模块概览

| 模块 | 前缀 | 端点 | 认证 | 说明 |
|------|------|------|------|------|
| `auth.py` | `/api/v1/auth` | 2 | 无 | 注册、登录 |
| `users.py` | `/api/v1/users` | 2 | 全部 | 当前用户、用户查询 |
| `papers.py` | `/api/v1/papers` | 13 | 全部 | 论文 CRUD + PDF + 标签 + AI 分析 |
| `tags.py` | `/api/v1/tags` | 5 | 全部 | 标签 CRUD |
| `ai.py` | `/api/v1/ai` | 3 | 全部 | 旧版 AI 接口（遗留） |
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

所有路由遵循统一模式：服务层抛 `ValueError`，路由层 catch 并映射 HTTP 状态码：

```python
try:
    return create_paper(db=db, paper=paper, user_id=current_user.id)
except ValueError as e:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
```

---

## 3. Frontend

### 3.1 路由树

```
<App>
  <Routes>
    <Route path="/login"     element={<LoginPage />} />           ← 公开
    <Route path="/register"  element={<RegisterPage />} />        ← 公开
    <Route element={<ProtectedRoute />}>                          ← 检查 authStore
      <Route path="/" element={<MainLayout>}>
        <Route index         → Navigate /papers />
        <Route path="papers"           element={<PaperListPage />} />
        <Route path="papers/create"    element={<PaperCreatePage />} />
        <Route path="papers/:id"       element={<PaperDetailPage />} />
        <Route path="tags"             element={<PlaceholderPage />} />  ← 待实现
        <Route path="profile"          element={<PlaceholderPage />} />  ← 待实现
      </Route>
    </Route>
  </Routes>
  <ToastContainer />      ← 全局，在路由之上
</App>
```

### 3.2 数据流示例（PaperListPage）

```
PaperListPage
  ├── useState: searchQuery, debouncedSearch, page
  ├── usePaperList({ page, pageSize, search })
  │     └── useQuery(["papers", "list", page, pageSize, search])
  │           └── paperService.getPaperList(query)
  │                 └── fetchPaperList({ skip, limit, search })
  │                       └── axios.get("/api/v1/papers/")
  │
  ├── PaperList(papers)                    ← 纯渲染
  ├── PaperCardSkeleton(count)             ← Loading 态
  ├── EmptyState(title, message, action?)  ← Empty 态
  └── Pagination(currentPage, totalPages)  ← 分页
```

### 3.3 组件分类

| 分类 | 数量 | 特点 |
|------|------|------|
| UI 基件 | 7 | 纯 props 驱动，零业务逻辑，可跨项目复用 |
| 领域组件 | 6 | 通过 props 注入回调，不直接 import hooks |
| Layout | 6 | 纯 props 驱动，零业务逻辑 |
| 认证组件 | 1 | ProtectedRoute（路由守卫） |
| 页面 | 5 | 编排层：调用 hooks → 传入组件 |

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
["papers", "list", page, pageSize, search]

// 详情
["paper", paperId]

// AI 分析（带类型）
["paper", paperId, "ai-summary", analysisType]

// 标签
["tags"]
```

### 4.2 关键模式

| 模式 | 位置 | 说明 |
|------|------|------|
| **轮询替代 WebSocket** | `usePaperAISummary` | `refetchInterval` 每 2s 当 status=pending/processing，完成后停止 |
| **占位数据** | `usePaperList` | `placeholderData: (prev) => prev` 保持翻页平滑 |
| **enabled 守卫** | `usePaper(id)` | `enabled: id > 0` 防止无效请求 |
| **onSuccess 失效** | mutations | 成功后 `invalidateQueries` 对应查询键 |

### 4.3 缓存失效策略

```
论文创建 → ["papers"]（列表）
标签变更 → ["paper", paperId]（详情） 
AI 触发 → ["paper", paperId, "ai-summary"]（AI 分析）
```

没有自定义 `staleTime` 或 `gcTime` — 使用 React Query 默认值（staleTime: 0, gcTime: 5 分钟）。

---

## 5. Service 层

### 5.1 后端 Service

| Service | 行数 | 职责 | 模式 |
|---------|------|------|------|
| `paper_service.py` | ~120 | 论文 CRUD + 文件操作 + DOI 唯一性 | 顶层函数集合 |
| `ai_summary_service.py` | ~456 | AI 分析完整编排 + 版本 + 缓存 + 批量 | 顶层函数，最复杂 |
| `ai_service.py` | ~150 | 旧版通用 AI 分析（遗留） | 顶层函数 |
| `tag_service.py` | ~60 | 标签 CRUD + 论文关联管理 | 顶层函数 |
| `user_service.py` | ~50 | 用户 CRUD + 查找 | 顶层函数 |
| `prompt_service.py` | ~80 | Prompt 模板 CRUD + 默认管理 | 顶层函数 |
| `vector_service.py` | ~80 | 向量索引/搜索 | 类 + 延迟初始化单例 |
| `embedding_service.py` | ~20 | 嵌入接口包装 | 类，委托给 client |

**值得注意的差异**：核心业务服务（paper, tag, user, prompt）使用顶层函数 + `db: Session` 参数；而 vector/embedding 服务使用类 + `__init__` 参数支持测试注入。

### 5.2 前端 Service

只有一个 `paperService.ts`，做数据转换：

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

## 6. AI 模块分析

### 6.1 客户端抽象

`app/utils/ai_client.py`:

- 兼容 OpenAI API 格式 → 支持 DeepSeek / GLM / Qwen / Ollama
- 无 API Key 自动降级为 stub（截断前 200 字符）
- 单例模式：`ai_client = AIClient()`

### 6.2 AI 分析完整流程（`ai_summary_service.trigger_ai_summary`）

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

### 6.3 两个并行的 AI 系统

| | 旧版 (`/api/v1/ai/`) | 新版 (`/api/v1/papers/{id}/ai-summary`) |
|--|----------------------|----------------------------------------|
| 输入 | 纯文本 content | paper_id，自动提取文本 |
| 持久化 | ❌ | ✅ AIAnalysis 表 |
| 版本管理 | ❌ | ✅ |
| 缓存 | ❌ | ✅ |
| 批量 | ❌ | ✅ |
| 自定义 Prompt | ❌ | ✅ |
| 状态 | 遗留（硬编码占位符） | 当前使用 |

### 6.4 Embedding + 向量存储

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

vector_service.py (services)
  → 工厂 + 延迟单例 + 业务逻辑
```

四层抽象（utils → services → repositories → services）提供了清晰的关注点分离，但对于当前需求可能过度工程化。

---

## 7. 代码重复

### 7.1 前后端两份 AI 分析系统 🔴

旧版 `ai_service.py` + `ai.py` 路由与新版 `ai_summary_service.py` + papers 路由中的 AI 端点并存。两者都用同一个 `ai_client`，但旧版不持久化、不缓存、不管理版本。

系统提示词被复制：
- `_SUMMARY_SYSTEM_PROMPT` 在 `ai_service.py` 中定义
- `ai_summary_service.py` 在代码中嵌入类似的提示词

### 7.2 Stub 截断逻辑重复 🔴

| 位置 | 代码 |
|------|------|
| `ai_client.py:115-123` | `_stub_chat()`: `return user_prompt[:200] + "..."` |
| `ai_service.py:112-120` | `_stub_summary()`: `return content[:200] + "..."` |
| `embedding_client.py:186-189` | `_stub_embed()`: 返回零向量 |
| `embedding_client.py:284-288` | `embed()`: provider 为 None 时返回零向量 |

同一份截断逻辑实现了 2 遍，零向量逻辑实现了 2 遍。

### 7.3 DOI 唯一性校验重复 🟡

- `paper_service.py:21-23` — `create_paper()` 中检查
- `paper_service.py:82-86` — `update_paper()` 中检查
- 没有提取成 `_validate_doi_unique()` 辅助函数

### 7.4 前端错误状态 HTML 重复 🟡

类似的错误状态结构（SVG + 错误文本 + 重试按钮）在 `PaperListPage.tsx`、`PaperDetailPage.tsx`、`PaperInfo.tsx` 和 `AISummaryPanel.tsx` 中重复出现。可以提取一个 `<ErrorState>` 组件。

### 7.5 前端内联 SVG 图标 🟢

约 30 个内联 SVG 图标散落在 .tsx 文件中。关闭图标（X 形状）在 `FileUploadArea.tsx`、`PaperListPage.tsx`、`TagManager.tsx`、`ToastContainer.tsx` 中被复制。没有使用图标库。

---

## 8. 重构建议

### 8.1 高优先级

| # | 建议 | 涉及文件 | 原因 |
|---|------|----------|------|
| 1 | **弃用旧版 AI 路由** `(/api/v1/ai/)` | `ai.py`, `ai_service.py` | 两套 AI 共存造成混淆，新系统功能完备。建议移除或标记 deprecated。系统提示词应移至共享常量文件 `app/core/prompts.py` |
| 2 | **移除冗余 stub 逻辑** | `ai_service.py` | `ai_client` 已内置 stub 降级，`ai_service.py` 的 `_stub_summary()` 完全重复，应使用 `ai_client.chat()` 统一 |

### 8.2 中等优先级

| # | 建议 | 说明 |
|---|------|------|
| 3 | **抽取通用 ErrorState 组件** | 参考现有的 EmptyState 模式，做一个 `<ErrorState message onRetry />`，统一 4 个页面的错误 UI |
| 4 | **抽取 `_validate_doi_unique()`** | 消除 `paper_service.py` 中 create/update 的重复检查 |
| 5 | **拆分 `ai_summary_service.py`** | 约 456 行，可将文本提取/提示词格式化拆到 `app/services/ai_utils.py` |
| 6 | **抽取 `file_service.py`** | `paper_service.py` 中的文件路径/删除操作可独立出来，保持 paper 专注数据库 |
| 7 | **分离 `usePapers.ts`** | 标签相关 hooks (useAddPaperTag, useRemovePaperTag) 可移至 `useTags.ts` |

### 8.3 低优先级

| # | 建议 | 说明 |
|---|------|------|
| 8 | **引入图标库** | lucide-react 或集中 `<Icon>` 组件替代 30 个内联 SVG |
| 9 | **前端密码校验对齐** | 前端校验 `>=6` 位，后端要求 `min_length=8`，两端不一致 |
| 10 | **后端单例 → 依赖注入** | `ai_client`、`embedding_client` 等全局单例不利于单元测试 mock。VectorService 已支持构造注入，可推广 |
| 11 | **旧版 Layout 残余清理** | `components/layout/` 已删除，确认 `App.tsx` 没有遗留引用 |
| 12 | **登录页直接调用 `useAuthStore`** | 与 `useAuth` hook 的使用不一致，可统一 |

---

## 附录

### A. 后端 API 端点完整列表

```
POST   /api/v1/auth/register          # 注册
POST   /api/v1/auth/login             # 登录

GET    /api/v1/papers/                # 论文列表（分页+搜索）
POST   /api/v1/papers/                # 创建论文
GET    /api/v1/papers/{id}            # 论文详情
PUT    /api/v1/papers/{id}            # 更新论文
DELETE /api/v1/papers/{id}            # 删除论文
POST   /api/v1/papers/{id}/upload     # 上传 PDF
GET    /api/v1/papers/{id}/download   # 下载 PDF
DELETE /api/v1/papers/{id}/file       # 删除文件
POST   /api/v1/papers/{id}/tags       # 添加标签
DELETE /api/v1/papers/{id}/tags/{tag_id}  # 移除标签
POST   /api/v1/papers/batch/ai-summary    # 批量 AI 分析
GET    /api/v1/papers/{id}/ai-summary     # 获取 AI 分析
POST   /api/v1/papers/{id}/ai-summary     # 触发 AI 分析
GET    /api/v1/papers/{id}/ai-summary/versions      # 版本列表
GET    /api/v1/papers/{id}/ai-summary/versions/diff # 版本对比

GET    /api/v1/tags/                  # 标签列表
POST   /api/v1/tags/                  # 创建标签
GET    /api/v1/tags/{id}              # 标签详情
PUT    /api/v1/tags/{id}              # 更新标签
DELETE /api/v1/tags/{id}              # 删除标签

GET    /api/v1/users/me               # 当前用户
GET    /api/v1/users/{id}             # 用户查询

POST   /api/v1/ai/analyze             # 旧版: AI 分析
POST   /api/v1/ai/summarize           # 旧版: AI 摘要
POST   /api/v1/ai/recommend           # 旧版: AI 推荐

GET    /api/v1/prompts/               # Prompt 模板列表
POST   /api/v1/prompts/               # 创建模板
GET    /api/v1/prompts/{id}           # 模板详情
PUT    /api/v1/prompts/{id}           # 更新模板
DELETE /api/v1/prompts/{id}           # 删除模板
POST   /api/v1/prompts/{id}/set-default   # 设为默认
```

### B. 前端数据流示例（PaperCreatePage 状态机）

```
PageStatus: "form" → "creating" → "uploading" → "success" → navigate /papers
                            ↘        ↙
                          "error" → "form" (retry)
```

### C. 测试覆盖

- 后端：59 个测试，4 个测试文件（auth, papers, tags, users）
- 前端：无测试
- 后端测试框架：pytest + FastAPI TestClient + 独立数据库 per function
