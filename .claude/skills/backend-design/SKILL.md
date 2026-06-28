---
name: backend-design
description: Review backend architecture — layer separation, DI, project structure, config patterns
---

# Backend Design Review

审核 `backend/` 下整体后端架构设计是否遵循项目约定和最佳实践。

## 项目分层架构

```
请求 → 路由层 (api/v1/*.py) → 服务层 (services/*.py) → 模型层 (models/*.py)
                                ↕
                            工具层 (utils/*.py)
```

### 各层职责

| 层级 | 路径 | 职责 | 禁止 |
|------|------|------|------|
| **路由层** | `app/api/v1/*.py` | HTTP 入参提取、`Depends` 注入依赖、`response_model` 声明、状态码控制 | ❌ 直接查询数据库 ❌ 调用 `db.query(...)` ❌ 手动序列化 |
| **服务层** | `app/services/*.py` | 业务逻辑编排、数据库 CRUD 调用、文件 IO、异常类型转换 | ❌ 依赖 `Request`/`Response` ❌ 抛出 `HTTPException`（抛 `ValueError`，由路由层转换） |
| **模型层** | `app/models/*.py` | SQLAlchemy ORM 定义、表关系、列约束 | ❌ 包含业务逻辑 ❌ `__init__.py` 必须 `import` 确保注册 |
| **工具层** | `app/utils/*.py` | 无状态工具函数（密码哈希、JWT、数据库引擎） | ❌ 依赖应用上下文 ❌ 引用 `settings` 以外的项目模块 |

### 数据流向

```
POST /api/v1/papers
  → papers.py: 从 request body 解析 PaperCreate
  → paper_service.create_paper(db, paper, user_id)    # 服务层处理
    → Paper(title=..., user_id=...)                     # 模型层创建
    → db.commit() / db.refresh()
  → papers.py: return paper                             # response_model 自动序列化
```

## 检查项

### 1. 目录结构合规
- `backend/app/` 下 6 个模块：`api/v1`、`core`、`models`、`schemas`、`services`、`utils`
- `api/v1/` 只包含路由文件，不包含业务逻辑
- `utils/` 只包含无状态工具，不引入 FastAPI 或 SQLAlchemy session
- 测试文件在 `tests/`，文件名 `test_*.py`

### 2. 依赖注入规范
- 数据库 session 统一通过 `Depends(get_db)` 注入，不在路由中手动创建
- 当前用户通过 `Depends(get_current_user)` 注入，返回 `User` ORM 对象
- `get_db` / `get_current_user` 统一在 `app/core/dependencies.py` 定义
- 服务层函数签名：`(db: Session, ...)` — 不接收 `Request` 或 `HTTPConnection`

### 3. 配置管理
- 所有配置集中在 `app/core/config.py` 的 `Settings` 类
- 敏感值（`SECRET_KEY`、数据库密码）通过 `.env` 加载（`SettingsConfigDict(env_file=".env")`），不硬编码
- `settings` 是模块级单例，各处 `from app.core.config import settings` 引用

### 4. Service 层模式
- 函数命名：`create_xxx`、`get_xxx`、`get_xxx_by_yyy`、`update_xxx`、`delete_xxx`
- 返回值：返回 ORM 对象或 `None`（未找到），不返回状态码
- 错误处理：业务异常抛 `ValueError`，不做 `rollback`（由上层统一处理）
- 事务管理：在 service 函数内 `commit()`，不在路由层 commit

### 5. 工具层设计
- 无状态：函数不依赖外部 mutable 状态
- 纯函数优先：相同的输入始终产生相同的输出
- 不导入 FastAPI 或 SQLAlchemy ORM 相关模块
- 示例：`security.py` 只做密码哈希和 JWT 编解码，不碰数据库

### 6. 循环依赖防范
- 禁止出现：`routers → services → models → schemas → routers`
- 工具层不应导入服务层或路由层
- 跨模块引用路径：`app.schemas.user` 而非 `app.schemas`
- `__init__.py` 中尽量少导入，避免间接循环依赖

### 7. 启动入口
- `main.py` 职责：创建 `FastAPI()` 实例、注册 `APIRouter`（`app.include_router`）、注册中间件/事件
- `main.py` 不包含路由定义、不包含业务逻辑
- 数据库初始化在 `app/utils/database.py` 完成，main.py 仅调用

### 8. 资源生命周期
- 文件上传：UUID 命名 → 存 uploads/ → 记录 `file_uuid`、`file_path`、`file_size`
- 文件删除：同时清理数据库记录和磁盘文件
- 级联删除：父资源删除时清理子资源（`relationship(cascade="all, delete-orphan")`）

## 常见架构问题

| 问题 | 影响 | 修复 |
|------|------|------|
| 路由中直接 `db.query(...)` | 业务逻辑泄漏到路由层 | 移至 service 层 |
| Service 抛出 `HTTPException` | Service 耦合了 HTTP | 改抛 `ValueError`，路由层 catch 转 `HTTPException` |
| 循环导入 | 启动时报错 | 检查 `__init__.py` 导入链 |
| `settings` 值硬编码 | 环境迁移困难 | 移至 `.env`，通过 `Settings` 加载 |
| Service 返回 dict/status | 破坏 REST 一致性 | 返回 ORM 对象，路由层通过 `response_model` 控制 |

## 输出格式

```markdown
# Backend Design Review Report

## 概况
- 检查模块数：N
- 发现问题数：N

## 按模块

### backend/app/api/v1/papers.py
| 检查项 | 行号 | 问题 | 建议 |
|--------|------|------|------|
| 层分离 | L42 | 路由中直接 query | 移至 paper_service |
| 错误处理 | L56 | Service 抛出 HTTPException | 改为 ValueError |
| ...   | ...  | ... | ... |

## 总结
- 突出问题：...
- 建议优先修复：...
```
