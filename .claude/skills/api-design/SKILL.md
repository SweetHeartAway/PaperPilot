---
name: api-design
description: Review API design — routes, schemas, status codes, auth, error handling, REST consistency
---

# API Design Review

审核 `backend/app/api/v1/` 下所有 API 路由的设计质量，检查一致性、安全性、RESTful 规范。

## 端点总览

| 模块 | 端点 | 方法 | 状态码 | 认证 | 描述 |
|------|------|------|--------|------|------|
| **auth** | `/api/v1/auth/register` | POST | 201 | ❌ | 用户注册 |
| | `/api/v1/auth/login` | POST | 200 | ❌ | 用户登录（form-data） |
| **users** | `/api/v1/users/me` | GET | 200 | ✅ | 当前用户信息 |
| | `/api/v1/users/{user_id}` | GET | 200 | ❌ | 公开用户信息 |
| **papers** | `/api/v1/papers/` | POST | 200* | ✅ | 创建论文（标准：201） |
| | `/api/v1/papers/` | GET | 200 | ✅ | 论文列表 |
| | `/api/v1/papers/{id}` | GET | 200 | ✅ | 论文详情 |
| | `/api/v1/papers/{id}` | PUT | 200 | ✅ | 更新论文 |
| | `/api/v1/papers/{id}` | DELETE | 204 | ✅ | 删除论文 |
| | `/api/v1/papers/{id}/upload` | POST | 200 | ✅ | 上传 PDF |
| | `/api/v1/papers/{id}/download` | GET | 200 | ✅ | 下载 PDF |
| | `/api/v1/papers/{id}/file` | DELETE | 200 | ✅ | 删除文件 |
| **ai** | `/api/v1/ai/analyze` | POST | 200 | ✅ | AI 分析论文 |
| | `/api/v1/ai/summarize` | POST | 501 | ✅ | 摘要（待实现） |
| | `/api/v1/ai/recommend` | POST | 501 | ✅ | 推荐（待实现） |

> `*` — 不应偏离 REST 标准，`POST /` 创建资源应返回 201。

## 检查项

### 1. RESTful 路由规范

| 操作 | HTTP 方法 | 标准状态码 | 当前项目状态 |
|------|-----------|-----------|-------------|
| 创建资源 | POST | **201** Created | ⚠️ `POST /papers` 返回 200 |
| 列表查询 | GET | 200 OK | ✅ |
| 获取详情 | GET /{id} | 200 OK | ✅ |
| 全量更新 | PUT /{id} | 200 OK | ✅ |
| 部分更新 | PATCH /{id} | 200 OK | ❌ 未实现 |
| 删除 | DELETE /{id} | **204** No Content | ✅ |
| 子资源上传 | POST /{id}/upload | 200 OK | ✅（上传属于动作非资源创建） |
| 子资源下载 | GET /{id}/download | 200 OK | ✅ |

- URL 路径：小写 + 复数名词（`/papers` 非 `/paper/getPaper`）
- 嵌套路由不超过 2 层：`/resources/{id}/sub-resources`
- 版本前缀统一 `/api/v1/`

### 2. 请求 Schema 验证

- POST/PUT body 使用 Pydantic model（非 `Form`/`Body` 散装参数）
- 边界校验：`Field(..., min_length=1)` / `Field(..., ge=0)`
- 邮箱字段用 `pydantic.EmailStr`
- 可选字段用 `Optional[str] = None`，必填用 `str = Field(...)`
- 分页参数统一：`skip: int = 0, limit: int = 100`（非 `page`/`page_size`）
- 文件上传用 `UploadFile = File(...)`，并在路由层做格式校验

### 3. 响应 Schema

- `response_model` 在装饰器声明，不手动 `return {...dict...}`
- ALWAYS 使用 `model_config = {"from_attributes": True}`（非旧式 `class Config`）
- 响应中不泄露敏感字段（`hashed_password` 等）— 用 `UserInDB` 区分
- datetime 字段用 `Optional[datetime]` 而非 `Optional[str]`
- 列表直接返回 `list[Model]` 而非包装 `{"data": [...]}`

### 4. 认证与授权

| 检查点 | 正确做法 |
|--------|---------|
| 创建/修改/删除端点 | `Depends(get_current_user)` |
| 列表/详情端点 | `Depends(get_current_user)`（当前项目全部要求认证） |
| 注册/登录 | ❌ 无需认证 |
| 未认证请求 | → 401 Unauthorized |
| 被禁用用户 | → 403 Forbidden |
| 资源不存在 | → 404，不区分"我的"还是"别人" |
| 用户间隔离 | `Paper.user_id == current_user.id` 过滤 |

### 5. 错误处理

- `HTTPException` 使用语义状态码：400 / 401 / 403 / 404 / 409 / 422 / 500
- Service 层抛 `ValueError` → 路由层 catch 转 `HTTPException`
- 状态码映射规则：
  - `ValueError("文件过大...")` → 400
  - `ValueError("不存在或无权限")` → 404
  - 未知异常 → 500
- 验证错误由 FastAPI 自动返回 422，无需手动处理
- `detail` 使用中文，与项目现有风格一致

### 6. 待实现端点（501）

- 不返回占位消息，应 `raise HTTPException(status_code=501, detail="...")`
- 装饰器标注 `status_code=status.HTTP_501_NOT_IMPLEMENTED`

### 7. 一致的响应格式

- 成功创建：`status_code=201` + `response_model` 序列化
- 成功返回：`status_code=200` + `response_model` 序列化
- 成功删除：`status_code=204` + `return None`
- 文件下载：`FileResponse(path=..., filename=..., media_type=...)`
- 时间格式：ISO 8601（如 `2026-06-29T14:33:31`）

## 常见问题对照表

| 问题 | 示例 | 影响 | 修复 |
|------|------|------|------|
| POST 返回 200 非 201 | `POST /papers` → 200 | 违反 REST 标准 | 加 `status_code=201` |
| 删除返回 body 非 204 | `DELETE /{id}/file` → 200 + Paper | 不一致 | 改为 204 或保留（子资源删除） |
| 敏感字段泄露 | Response 含 `hashed_password` | 安全风险 | 用 `UserInDB` vs `User` 区分 |
| 状态码不区分 | 所有错误返回 400 | 调试困难 | 语义化：400/401/403/404/409 |
| 分页参数不统一 | `page=1&size=20` vs `skip=0&limit=100` | 混乱 | 统一 `skip`/`limit` |

## 输出格式

```markdown
# API Design Review Report

## 概况
- 路由文件数：N
- 端点总数：N
- 问题数：N

## 按路由

### POST /api/v1/papers
| 检查项 | 结果 | 说明 | 建议 |
|--------|------|------|------|
| 状态码 | ⚠️ | 返回 200，应返回 201 | 添加 status_code=201 |
| 认证 | ✅ | Depends(get_current_user) | - |
| Schema | ✅ | Pydantic model | - |
| ... | ... | ... | ... |

## 总结
- 严重问题：...
- 建议优先修复：...
```
