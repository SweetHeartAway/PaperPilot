# 部署文档

## 环境要求

- Python 3.12+
- Node.js 20+
- npm 10+

## 环境变量

复制 `.env.example` 为 `.env`（如果存在），或创建 `.env` 文件：

### 后端 (`backend/.env`)

```bash
# 数据库
DATABASE_URL=sqlite:///./paperpilot.db    # SQLite（开发）
# DATABASE_URL=postgresql://user:pass@host:5432/paperpilot  # PostgreSQL（生产）

# JWT
SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=30

# AI 客户端（选配，不配则使用桩实现）
AI_API_BASE_URL=https://api.deepseek.com/v1
AI_MODEL=deepseek-chat
AI_API_KEY=sk-your-key-here

# Embedding（选配）
EMBEDDING_API_BASE_URL=https://api.openai.com/v1
EMBEDDING_API_KEY=sk-your-key-here
EMBEDDING_MODEL=text-embedding-ada-002
```

### 前端 (`frontend/.env`)

```bash
VITE_API_BASE_URL=http://localhost:8000
```

## 本地启动

### 后端

```bash
cd backend
pip install -r requirements.txt
python -m alembic upgrade head
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 前端

```bash
cd frontend
npm install
npm run dev
```

访问 `http://localhost:5173`。

## 生产构建

### 前端

```bash
cd frontend
npm run build
# 输出到 frontend/dist/
```

将 `dist/` 目录部署到静态服务器（Nginx、Vercel、Netlify 等）。

### 后端

使用 Uvicorn + Gunicorn：

```bash
pip install gunicorn
python -m gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker
```

或使用 Docker（需自行编写 Dockerfile）。

## 数据库迁移

```bash
cd backend
python -m alembic upgrade head      # 应用迁移
python -m alembic revision --autogenerate -m "description"  # 生成新迁移
```
