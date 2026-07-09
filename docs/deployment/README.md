# 部署文档

## 环境要求

- Docker + Docker Compose（推荐）
- 或 Python 3.12+ + Node.js 20+

---

## 方式一：Docker 部署（推荐）

一键启动所有服务：

```bash
# 构建并启动
docker compose build
docker compose up -d

# 查看日志
docker compose logs -f

# 停止
docker compose down
```

访问 `http://localhost`。

### 持久化数据

Docker 使用三个 named volume 持久化数据：

| Volume | 路径 | 内容 |
|--------|------|------|
| `paperpilot_data` | `/app/data/` | SQLite 数据库 |
| `paperpilot_uploads` | `/app/uploads/` | 用户上传的 PDF |
| `paperpilot_chroma` | `/app/chroma_db/` | Chroma 向量索引 |

### 配置

后端配置通过 `backend/.env` 加载。Docker 启动时自动读取该文件，无需额外操作。

### 切换 PostgreSQL

修改 `docker-compose.yml` 中 `DATABASE_URL` 环境变量：

```yaml
environment:
  - DATABASE_URL=postgresql://user:pass@host:5432/paperpilot
```

---

## 方式二：本地手动启动

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

---

## 生产构建

### 前端

```bash
cd frontend
npm run build
# 输出到 frontend/dist/
```

将 `dist/` 部署到 Nginx（SPA 路由需要 fallback 到 index.html）。

### 后端

使用 Gunicorn + Uvicorn Worker：

```bash
pip install gunicorn
python -m gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker
```

---

## 数据库迁移

```bash
cd backend
python -m alembic upgrade head                           # 应用迁移
python -m alembic revision --autogenerate -m "xxx"       # 生成新迁移
```
