# API 文档

## 概述

PaperPilot 后端基于 FastAPI，所有 API 通过 `/api/v1/` 前缀访问。
运行开发服务器后自动生成 OpenAPI 文档：

- Swagger UI：`http://localhost:8000/docs`
- ReDoc：`http://localhost:8000/redoc`
- OpenAPI JSON：`http://localhost:8000/openapi.json`

## 认证

所有受保护端点使用 JWT Bearer Token：

```
Authorization: Bearer <token>
```

- 登录后获取 token：`POST /api/v1/auth/login`
- Token 过期自动 401，前端拦截器跳转到 /login

## 路由模块

| 模块 | 路径 | 说明 |
|------|------|------|
| Auth | `/api/v1/auth/` | 注册、登录 |
| Papers | `/api/v1/papers/` | 论文 CRUD、PDF 上传/下载、标签管理、AI 分析 |
| Tags | `/api/v1/tags/` | 标签 CRUD |
| Users | `/api/v1/users/` | 用户信息 |
| AI | `/api/v1/ai/` | 通用 AI 分析（遗留接口） |
| Prompts | `/api/v1/prompts/` | 自定义 Prompt 模板 CRUD |

## 端点列表

完整端点列表请查阅 OpenAPI schema（`/docs` 或 `/openapi.json`）。

## 数据模型

主要实体关系：

- **User** → has many **Paper**
- **Paper** → many to many **Tag**（通过关联表）
- **Paper** → has many **AIAnalysis**（不同版本和类型）
- **PromptTemplate** → 独立实体，可关联 AIAnalysis
