# PaperPilot — AI 论文管理平台

PaperPilot 帮助研究人员和学生管理学术论文库，支持 PDF 上传、自动生成 AI 摘要和分析、标签分类、自定义 Prompt 模板等功能。

## 技术栈

| 层 | 技术 |
|----|------|
| 后端框架 | FastAPI (Python 3.12+) |
| ORM | SQLAlchemy |
| 数据库 | SQLite（开发）/ PostgreSQL（生产可配） |
| 认证 | JWT + bcrypt (passlib) |
| 前端框架 | React 19 + TypeScript 6 |
| 构建工具 | Vite 8 |
| CSS | Tailwind CSS 4 |
| 服务端状态 | @tanstack/react-query 5 |
| 客户端状态 | Zustand 5 |
| HTTP 客户端 | axios |
| 路由 | react-router-dom 7 |

## 项目结构

```
paper-manager-project/
├── backend/                  # Python 后端
│   ├── app/
│   │   ├── api/v1/           # 6 个路由模块（auth, users, papers, tags, ai, prompts）
│   │   ├── core/             # 配置（config.py）、依赖（dependencies.py）
│   │   ├── models/           # SQLAlchemy ORM 模型
│   │   ├── schemas/          # Pydantic v2 请求/响应模型
│   │   ├── services/         # 9 个业务逻辑模块
│   │   └── utils/            # 工具函数（AI 客户端、PDF 提取、安全等）
│   ├── alembic/versions/     # 数据库迁移
│   ├── tests/                # 59 个 pytest 测试
│   └── main.py               # 应用入口
├── frontend/                 # React 前端
│   └── src/
│       ├── api/              # axios HTTP 客户端
│       ├── components/       # 可复用 UI 组件
│       │   ├── ui/           # 8 个纯 UI 基件
│       │   ├── paper/        # 6 个论文领域组件
│       │   ├── user/         # 用户相关组件
│       │   └── auth/         # 认证组件（路由守卫）
│       ├── hooks/            # 5 个 React Query + 自定义 hooks
│       ├── layout/           # 7 个纯 props 驱动的布局组件
│       ├── pages/            # 7 个页面编排层
│       ├── services/         # 3 个业务数据转换层
│       ├── stores/           # 2 个 Zustand 客户端状态
│       ├── types/            # TypeScript 类型定义
│       └── utils/            # 工具函数（format, token）
├── docs/
│   ├── api/                  # API 文档
│   ├── deployment/           # 部署文档
│   └── design/               # 设计文档
```

## 快速开始

### 环境要求

- Python 3.12+
- Node.js 20+
- npm 10+

### 后端

```bash
cd backend
pip install -r requirements.txt
python -m alembic upgrade head
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

API 文档：`http://localhost:8000/docs`

### 前端

```bash
cd frontend
npm install
npm run dev
```

访问 `http://localhost:5173`。

### 环境变量

后端 `.env` 文件（位于 `backend/.env`）：

```bash
DATABASE_URL=sqlite:///./paperpilot.db
SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=30
AI_API_BASE_URL=https://api.deepseek.com/v1
AI_MODEL=deepseek-chat
AI_API_KEY=sk-your-key-here
```

AI 客户端为选配，不配则自动降级为桩实现。

## 主要功能

- **论文管理** — 论文 CRUD、DOI 唯一性校验、分页搜索
- **PDF 管理** — 上传、下载、删除
- **AI 分析** — 自动生成摘要 / Method / Result / Conclusion 四种分析类型，支持版本管理、缓存、对比
- **批量 AI 分析** — 一键分析多篇论文
- **标签系统** — 多对多标签管理、自动创建
- **自定义 Prompt 模板** — 可配置默认模板、多模板切换
- **多模型切换** — 支持 DeepSeek / GLM / OpenAI / Ollama 等兼容 OpenAI API 的模型
- **用户系统** — 注册、登录、JWT 认证

## 开发命令

详见 [CLAUDE.md](./CLAUDE.md) 中的开发命令章节。

## 测试

```bash
cd backend
PYTHONPATH=. python -m pytest tests/ -v           # 全部 59 个测试
PYTHONPATH=. python -m pytest tests/ -x --tb=short # 失败即停
PYTHONPATH=. python -m pytest tests/ --cov=app -v  # 带覆盖率
```

## 文档

- [API 文档](docs/api/README.md)
- [部署文档](docs/deployment/README.md)
- [架构分析](docs/design/README.md)
