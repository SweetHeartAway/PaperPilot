# PaperPilot — 项目协作规则

## 项目目标

- 本项目用于：AI 论文管理平台（PaperPilot），帮助研究人员管理和分析学术论文
- 主要用户和场景：研究人员、学生、学术用户，需要管理论文库、上传 PDF、自动生成摘要和关键词
- 当前阶段：后端全部完成（33 个 API 端点、59 个测试通过），前端 7 个核心页面已实现（Paper List、Paper Create、Paper Detail、Login/Register、Tags、Profile）
- 暂时不做：全文搜索、团队协作/多用户共享、Celery 异步任务、移动端适配、第三方登录（OAuth）

## 工作方式

- 修改前先阅读相关文件和已有约定，不凭空猜测结构
- 涉及多个文件时，先给简短计划再开始执行
- 不确定时先说明风险、假设和备选方案，不要装作确定
- 不要为了让代码跑通而注释掉错误或关闭类型检查
- 不要做与任务无关的重构，修改范围尽量小
- 删除或覆盖文件前先确认内容是否真的需要替换。替换前需阅读目标文件，不要覆盖用户写过的内容
- 命令失败时不要硬推，先读错误信息

## 目录约定

```
paper-manager-project/
├── backend/                  # Python 后端
│   ├── app/
│   │   ├── api/v1/           # FastAPI 路由（auth, users, papers, tags, ai, prompts）
│   │   ├── core/             # 配置（config.py）、依赖（dependencies.py）
│   │   ├── models/           # SQLAlchemy ORM 模型（__init__.py 统一导出）
│   │   ├── schemas/          # Pydantic v2 请求/响应模型
│   │   ├── services/         # 业务逻辑层（不直接操作 request/response）
│   │   └── utils/            # 工具函数（database, security, pdf_extractor, ai_client）
│   ├── alembic/versions/     # 数据库迁移文件
│   ├── tests/                # pytest 测试
│   └── main.py               # 应用入口
├── frontend/                 # React 前端（Vite + TypeScript + Tailwind）
│   └── src/
│       ├── api/              # HTTP 请求封装（axios），零业务逻辑
│       ├── components/       # 可复用 UI 组件
│       │   ├── ui/           # 纯 UI 基件（EmptyState, Pagination, Skeleton, TabBar 等）
│       │   ├── paper/        # 论文领域组件（PaperCard, TagManager, AISummaryPanel 等）
│       │   └── auth/         # 认证相关组件（ProtectedRoute）
│       ├── hooks/            # React Query + 自定义 hooks
│       ├── layout/           # 纯 props 驱动的布局系统（Header/Sidebar/Content/Footer）
│       ├── pages/            # 页面编排层（组合 hooks + 组件）
│       ├── services/         # 业务数据转换层
│       ├── stores/           # Zustand 客户端状态（auth, toast）
│       ├── types/            # TypeScript 类型定义
│       ├── utils/            # 工具函数（format, token）
│       └── assets/           # 静态资源（logo 等）
├── docs/                     # 项目文档
│   ├── api/                  # API 规范
│   ├── deployment/           # 部署文档
│   └── design/               # 设计文档
└── .claude/                  # Claude Code 配置
```
- 后端 6 个目录各司其职，新增代码按功能归属到对应目录，不要随意新建顶层包
- 前端在 `frontend/src/` 内组织组件和页面

## 开发命令

```bash
# ─── 后端 ───
cd backend

pip install -r requirements.txt              # 安装/更新依赖
PYTHONPATH=. python -m uvicorn main:app --reload          # 启动开发服务器
PYTHONPATH=. python -m pytest tests/ -v                   # 运行全部测试
PYTHONPATH=. python -m pytest tests/ -x --tb=short -v     # 快速测试（失败即停）
PYTHONPATH=. python -m pytest tests/test_papers.py -v     # 单文件测试
PYTHONPATH=. python -m pytest tests/ --cov=app -v         # 带覆盖率

PYTHONPATH=. python -m alembic upgrade head               # 应用迁移
PYTHONPATH=. python -m alembic revision --autogenerate -m "xxx"  # 生成迁移

rm -f paperpilot.db tests/test_paperpilot.db              # 清除测试库（迁移冲突时）

# ─── 前端 ───
cd frontend

npm install                          # 安装依赖
npm run dev                          # 启动开发服务器
npm run build                        # 构建
npm run lint                         # oxlint 检查
npm run format                       # prettier 格式化
npx tsc --noEmit                     # TypeScript 类型检查（无输出=通过）

# 【待补充】
npm run test              # Vitest
npm run test:coverage
npm run preview
```

## 代码规范

### Python
- Python 3.12+，使用类型注解（`from __future__ import annotations` 可选）
- 每行 ≤ 100 字符，4 空格缩进
- `snake_case`（变量/函数/文件）、`PascalCase`（类）
- 函数/类必须写 docstring（中文或英文，项目内保持一致）
- 模块头注释 `"""模块用途"""`，函数头注释 `"""功能描述"""`

### FastAPI
- 使用 `APIRouter()` 模块化路由，不直接 `@app.get()` 写在 main.py
- 路由路径统一小写复数：`/api/v1/papers`、`/api/v1/auth/register`
- 依赖注入优先：`Depends(get_db)`、`Depends(get_current_user)`
- services 层不直接依赖 request/response，不直接操作路由
- `response_model` 统一在装饰器上声明，不手动序列化
- 敏感端点（CRUD）必须加 `get_current_user` 保护

### SQLAlchemy
- 所有模型在 `app/models/__init__.py` 统一导入，确保 `Base.metadata` 完整
- 使用 `relationship` + `back_populates` 双向关系
- 多对多关系用 `association_table`；外键用 `Integer + ForeignKey`
- 查询统一写在 service 层，不在路由中直接 query

### Pydantic v2
- 使用 `model_config = {"from_attributes": True}` 而不是 `class Config`
- 序列化用 `.model_dump()` 不是 `.dict()`
- AIAnalysis 的 result 字段在数据库中是 JSON 字符串，schema 需加 `@field_validator("result", mode="before")` 解析

### React Query（待补充）
- queryKey 集中管理
- invalidateQueries 不允许字符串硬编码
- mutation 成功后统一刷新缓存
- optimistic update 统一写法
- staleTime/cacheTime 按页面统一配置

### JWT / 认证
- Token 通过 `OAuth2PasswordBearer(tokenUrl="...")` 获取
- `get_current_user` 统一在 `app/core/dependencies.py` 中实现
- decode 失败 → 401，用户不存在 → 401，用户被禁用 → 403
- 密码用 bcrypt（passlib），secret_key 从 settings 读取

### AI（待补充）

开发规范：

- 通过 `app/utils/ai_client.py` 统一调用 AI 模型，不直接创建 OpenAI 客户端
- 模型通过 `.env` 配置切换（AI_API_BASE_URL + AI_MODEL），代码不做 provider 判断
- 无 API Key 时自动降级为桩实现

【待补充】

- Prompt 全部模板化，禁止写死
- 保留原始 AI 响应
- Timeout 统一配置
- Retry 策略统一

### 测试
- 文件命名 `test_<module>.py`，用 `test_client` 和 `db_session` fixture
- 每个测试函数独立数据库：`scope="function"` + `create_all/drop_all`
- conftest.py 顶部必须 `from app.models import User, Paper, AIAnalysis` 注册表
- 测试覆盖正常路径 + 边界（重复、无效、不存在、权限不足）

### TypeScript / React（待补充）
- 使用 TypeScript strict 模式，避免 `any`
- `PascalCase`（组件/类型）、`camelCase`（变量/函数/文件）
- 组件 props 必须定义接口，使用 `interface` 不是 `type`
- 纯 UI 基件用 props 驱动，不直接 import hooks 或 store
- 领域组件通过 props 注入回调，不直接使用 hooks（解耦原则）
- 使用 `export default function ComponentName` 导出组件
- 所有 API Response 使用统一类型封装
- 禁止组件直接解析 Axios Response
- hooks 返回的数据必须经过 services 转换
- React Query queryKey 使用统一工厂函数
- 公共类型统一放入 types/

### 前端分层原则（数据流方向）
```
api/ (HTTP only) → services/ (transform) → hooks/ (React Query) → pages/ (orchestration)
```
- `api/` ：只做 HTTP 请求，不处理业务逻辑
- `services/` ：做数据转换（如 skip/limit → page/pageSize）
- `hooks/` ：封装 React Query 的 useQuery/useMutation
- `pages/` ：编排 hooks + 组件，不写直接 API 调用
- 组件不直接 import `api/` 或 `services/`，通过 hooks 间接使用

### 前端组件规范（待补充）

组件原则：

- 单一职责
- 页面组件建议控制在 300 行以内
- UI 组件不得依赖业务 hooks
- Modal 统一管理
- Dialog 统一封装

### Hooks（待补充）

规范：

- 一个 Hook 负责一种业务
- 不直接调用 Toast
- 不直接操作 Router
- 返回 loading / data / error
- Mutation 仅负责数据更新

### Services（待补充）

负责：

- DTO 转换
- API 数据转换
- 分页转换
- AI 返回数据转换

禁止：

- 使用 React Hook
- 使用 Store

### Frontend State 管理
- 服务端状态（论文、AI 分析、标签）→ React Query
- 客户端状态（auth token、toast）→ Zustand store
- 不要在 Zustand 中缓存 API 返回数据

### Error Handling（待补充）

前端：

- Axios 统一拦截
- Toast 统一错误提示
- 禁止 alert()

后端：

- HTTPException 统一处理
- ValidationError 统一处理
- DatabaseError 统一处理

### Logging（待补充）

后端：

- 使用 Python logging 模块

前端：

- 禁止提交 console.log
- 使用统一 logger

环境：

- 开发：DEBUG
- 生产：INFO

### 环境变量（待补充）

- 新配置同步更新 .env.example
- 不允许默认 API Key
- 所有敏感信息来自 .env

### CI（待补充）

PR 前需通过：

- Backend Test
- Type Check
- Lint
- Build

### Commit 规范
```
<type>: <简短中文或英文描述>

类型：feat / fix / refactor / test / docs / chore / style
示例：
  feat: 添加论文 CRUD 接口
  fix: 修复 JWT token 过期未校验问题
  test: 增加用户注册边界测试
```

## 修改边界

- 不要修改 `.env` 中的密钥和敏感配置（SECRET_KEY 等）
- 不要删除迁移文件（`backend/alembic/versions/*.py`）
- 不要删除或篡改 git 历史记录
- 不要自动执行 `git push` 或部署命令
- 需要破坏性操作时（drop 表、删除用户数据、覆盖已有文件），先停止并询问用户
- 不要随意修改 `.claude/settings.local.json` 中的 hooks 配置

## 验收标准

- 修改后说明改了什么文件、什么内容
- 能跑测试就必须跑测试（`PYTHONPATH=. python -m pytest tests/ -x --tb=short`）
- 测试不能跑时说明原因（基础设施缺失、环境依赖、API Key 等）
- 标出仍然存在的风险和下一步建议
- 新 API 端点必须在 `app.openapi()` 的 paths 中可见
- 前端修改必须 TypeScript 类型检查通过（`npx tsc --noEmit`）

【待补充】

前端：

- [ ] Build
- [ ] Lint
- [ ] Type Check
- [ ] Vitest

后端：

- [ ] Pytest
- [ ] OpenAPI 检查

文档：

- [ ] README 更新
- [ ] CLAUDE.md 同步更新（若涉及规范）

## 当前功能状态

| 功能 | 状态 |
|------|------|
| **后端** | |
| 用户注册/登录（JWT、bcrypt） | ✅ |
| 论文 CRUD（含 DOI 唯一性校验） | ✅ |
| 标签（多对多，自动创建，CRUD） | ✅ |
| PDF 上传/下载/删除 | ✅ |
| AI 分析摘要（生成/缓存/重新生成） | ✅ |
| 批量 AI 分析 | ✅ |
| AI 分析版本对比 | ✅ |
| 自定义 Prompt 模板（CRUD、默认模板） | ✅ |
| 多模型切换（DeepSeek/GLM/OpenAI/Ollama） | ✅ |
| Embedding + Chroma 向量存储 | ✅ |
| PDF 文本提取 | ✅ |
| 后端测试覆盖率（59 个测试） | ✅ |
| **前端** | |
| Layout 系统（Header/Sidebar/Content/Footer） | ✅ |
| 路由守卫（ProtectedRoute） | ✅ |
| 论文列表页（分页/搜索/Skeleton 加载） | ✅ |
| 论文上传页（拖拽/进度/重试） | ✅ |
| 论文详情页（信息/AI 分析/Tag 三区布局） | ✅ |
| AI 分析 4 Tab（摘要/Method/Result/Conclusion） | ✅ |
| PaperCard 泛型化（可跨项目复用） | ✅ |
| TagManager / AISummaryPanel 解耦（props 注入） | ✅ |
| Toast 通知系统（成功/失败/Loading） | ✅ |
| 登录/注册页面（表单验证 + 路由守卫联动） | ✅ |
| 标签管理页面（行内编辑/删除确认/TagManagement hooks） | ✅ |
| 个人中心页面（ProfileForm/useUser hook） | ✅ |

| **工程质量** | |
| 前端组件测试（Vitest） | ⏳ 待补充 |
| React Query 缓存策略统一 | ⏳ 待补充 |
| Error Boundary | ⏳ 待补充 |
| 全局异常页面（404/500） | ⏳ 待补充 |
| Loading Skeleton 统一规范 | ⏳ 待补充 |
| API 错误码统一处理 | ⏳ 待补充 |
| 日志体系（前后端） | ⏳ 待补充 |
| E2E 自动化测试 | ⏳ 待补充 |

| **文档** | |
| API 文档 | ✅ 已更新 |
| 部署文档 | ✅ 已更新 |
| 设计文档 | ✅ 已更新 |
| 架构分析 | ✅ 已更新 |

## 需要按需阅读的文档

- API 文档：`docs/api/`
- 架构分析：`docs/design/README.md`
- 部署文档：`docs/deployment/`
- Pre-commit 配置：`.pre-commit-config.yaml`
- Claude Code hooks 配置：`.claude/settings.local.json`

## 后续待完善（Roadmap）

以下属于工程质量完善，不属于新增功能。

### 测试

- [ ] Frontend Vitest
- [ ] Playwright E2E
- [ ] API Contract Test

### 工程

- [ ] React Query Key Factory
- [ ] Error Boundary
- [ ] Loading 统一组件
- [ ] Axios Error Handler
- [ ] Logger
- [ ] 全局 404
- [ ] 全局 500

### 文档

- [ ] Architecture Diagram
- [ ] Database ER Diagram
- [ ] Component Dependency Diagram

### 开发体验

- [ ] Husky
- [ ] lint-staged
- [ ] Commitlint
- [ ] GitHub Actions CI
