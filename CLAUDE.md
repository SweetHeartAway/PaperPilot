# PaperPilot — CLAUDE.md

## 项目概述
PaperPilot AI论文管理平台。后端 FastAPI + SQLAlchemy 2 + SQLite。

## 目录规范
```
backend/
├── app/
│   ├── api/v1/     # 路由层：auth, users, papers, ai
│   ├── core/       # 配置(config.py)、依赖(dependencies.py)
│   ├── models/     # SQLAlchemy ORM 模型 (__init__.py 统一导出)
│   ├── schemas/    # Pydantic v2 请求/响应模型
│   ├── services/   # 业务逻辑层
│   └── utils/      # 工具函数：database, security, helpers
├── tests/          # pytest 测试，文件名 test_*.py
└── main.py         # 应用入口
```

## Python 规范
- Python 3.12+，使用类型注解（`from __future__ import annotations` 可选）
- 每行 ≤ 100 字符，4 空格缩进
- 使用 `snake_case`（变量/函数/文件）和 `PascalCase`（类）
- 函数/类必须写 docstring（中文或英文，项目内保持一致）
- 模块头注释：`"""模块用途"""`，函数头注释：`"""功能描述"""`

## FastAPI 规范
- 使用 `APIRouter()` 模块化路由，不要直接 `@app.get()` 写在 main.py
- 路由路径统一小写、复数：`/api/v1/papers`, `/api/v1/auth/register`
- 依赖注入优先：`Depends(get_db)`, `Depends(get_current_user)`
- services 层不直接依赖 request/response，不直接操作路由
- response_model 统一在装饰器上声明，不手动序列化
- 敏感端点（CRUD）必须加 `get_current_user` 保护

## SQLAlchemy 规范
- 所有模型在 `app/models/__init__.py` 统一导入，确保 `Base.metadata` 完整
- 使用 `from sqlalchemy.orm import relationship` + `back_populates` 双向关系
- 多对多关系用 `association_table`；外键统一用 `Integer + ForeignKey`
- 避免 `lazy="select"`（默认）之外的 eager loading，除非性能要求
- 查询统一写在 service 层，不在路由中直接 query

## Pydantic v2 规范
- 使用 `model_config = {"from_attributes": True}` 而不是 `class Config`
- 序列化用 `.model_dump()` 而不是 `.dict()`
- 校验用 `Field(..., min_length=N)`，邮箱用 `EmailStr`
- response_model 返回 schema，不要返回 ORM 对象

## JWT / 认证规范
- Token 通过 `OAuth2PasswordBearer(tokenUrl="...")` 获取
- `get_current_user` 统一在 `app/core/dependencies.py` 中实现
- decode 失败 → 401，用户不存在 → 401，用户被禁用 → 403
- 密码用 bcrypt (passlib)，secret_key 从 settings 读取

## 测试规范
- 文件命名 `test_<module>.py`，用 `test_client` 和 `db_session` fixture
- 每个测试函数独立数据库：`scope="function"` + `create_all/drop_all`
- conftest.py 顶部必须 `from app.models import User, Paper, AIAnalysis` 注册表
- 测试覆盖正常路径 + 边界（重复、无效、不存在、权限不足）

## Commit 规范
```
<type>: <简短中文或英文描述>

类型：feat / fix / refactor / test / docs / chore / style
示例：
  feat: 添加论文 CRUD 接口
  fix: 修复 JWT token 过期未校验问题
  test: 增加用户注册边界测试
```

## 启动命令
```bash
cd backend
PYTHONPATH=. python -m uvicorn main:app --reload
PYTHONPATH=. python -m pytest tests/ -v
```
