---
name: security
description: Review security — JWT auth, password hashing, input validation, file upload, data isolation
---

# Security Review

审核 `backend/` 下的安全实践 — 认证、授权、输入校验、文件安全、配置安全。

## 项目安全架构总览

```
┌─────────────────────────────────────────────────┐
│                 路由层 (api/v1/)                  │
│  Depends(get_current_user) → 认证保护             │
│  UploadFile → 文件类型/大小校验                    │
│  Pydantic → 输入校验                             │
└──────────────────┬──────────────────────────────┘
                   │ HTTP 请求/响应
┌──────────────────▼──────────────────────────────┐
│             安全工具层 (utils/security.py)         │
│  bcrypt 密码哈希                                  │
│  HS256 JWT 令牌                                  │
│  passlib + python-jose                           │
└─────────────────────────────────────────────────┘
```

## 检查项

### 1. 密码安全

| 项目 | 当前状态 | 标准 |
|------|---------|------|
| 哈希算法 | ✅ bcrypt (passlib) | 行业标准 |
| 密码最小长度 | ✅ `Field(min_length=8)` | ≥ 8 位 |
| 存储字段 | ✅ `hashed_password`（非明文） | 永远不存明文 |
| 密码不返回 | ✅ User schema 不含 password | 响应不泄露 |

检查点：
- 密码使用 `passlib.context.CryptContext(schemes=["bcrypt"])` 哈希
- `verify_password` 使用常量时间比较（passlib 内置）
- 注册时只存哈希，登录时只验哈希，密码原文不在任何响应中出现
- 禁止：SHA-1/MD5 哈希、自实现加密算法、明文存储

### 2. JWT 令牌

```python
ALGORITHM = "HS256"
SECRET_KEY = settings.SECRET_KEY  # 从 settings 读取
ACCESS_TOKEN_EXPIRE_MINUTES = 30  # 30 分钟过期
```

| 检查项 | 当前状态 | 说明 |
|--------|---------|------|
| 签名算法 | ✅ HS256 | 非对称签名用 RS256/ES256 |
| Secret Key 来源 | ⚠️ 硬编码默认值 | 需通过 `.env` 配置强密钥 |
| 过期时间 | ✅ 30 分钟 | 合理范围 |
| Token 位置 | ✅ Bearer header | 标准 OAuth2 |
| sub 字段 | ✅ username | 用户标识 |
| exp 字段 | ✅ 是 | 过期校验 |
| 过期处理 | ✅ decode 失败 → 401 | 前端自动跳转登录 |

⚠️ **安全风险**：`config.py` 中 `SECRET_KEY = "your-secret-key-here"` 是硬编码默认值。生产中必须通过 `.env` 设置强随机密钥：

```bash
# 生成强密钥（Python）
python -c "import secrets; print(secrets.token_urlsafe(32))"

# .env 文件
SECRET_KEY="生成的64位随机字符串"
```

### 3. 认证流程

```
请求 → OAuth2PasswordBearer 提取 Bearer token
                     ↓
               decode_token(token)  ← settings.SECRET_KEY
                   ↙        ↘
              成功 → 提取 sub(username)
                         ↓
                  db.query(User).filter(username == ...)
                         ↓
                   用户存在? → 否 → 401
                         ↓ 是
                   is_active? → 否 → 403
                         ↓ 是
                   返回 User ORM 对象
```

状态码规则：

| 场景 | 状态码 | 响应内容 |
|------|--------|---------|
| 无 token | 401 | 未认证 |
| token 无效/过期 | 401 | 无效的认证令牌 |
| token 中 sub 为空 | 401 | 令牌中缺少用户标识 |
| token 对应用户被删 | 401 | 用户不存在 |
| 用户被禁用 | 403 | 用户已被禁用 |
| 用户不存在（资源） | 404 | 不区分"我的"还是"别人的" |
| 无权限操作 | 404 | 资源不存在（不暴露归属） |

### 4. 用户间数据隔离

```python
# ✅ 隔离：查询时加 user_id 过滤
db.query(Paper).filter(Paper.id == paper_id, Paper.user_id == user_id)

# ✅ 隔离：删除/更新时限制 owner
db.query(Paper).filter(Paper.id == paper_id, Paper.user_id == user_id).first()

# ❌ 不安全：不限制 user_id
db.query(Paper).filter(Paper.id == paper_id).first()  # 任何人可访问
```

- 创建资源自动绑定 `user_id`
- 查询/修改/删除全部按 `user_id` 过滤
- 资源不存在的场景（无论是真不存在还是属于他人）统一返回 404
- 不返回诸如"该论文不属于你"的信息（避免枚举攻击）

### 5. 文件上传安全

| 检查项 | 措施 |
|--------|------|
| 文件类型限制 | `.lower().endswith('.pdf')` 校验 |
| 文件大小限制 | `MAX_UPLOAD_SIZE = 50MB`，超限拒绝 |
| 文件名安全 | 磁盘用 UUID 命名，不信任用户文件名 |
| 路径遍历防护 | UUID 不包含 `/`/`..`，不存在路径穿越 |
| 存储隔离 | 统一目录 `settings.UPLOAD_DIR` |
| 类型混淆 | 服务端校验后缀 + 响应 content-type |

```python
# ✅ 安全文件名策略
file_uuid = str(uuid.uuid4())  # 纯 UUID，无用户输入
ext = os.path.splitext(file.filename)[1] or '.pdf'  # 仅取扩展名
file_path = os.path.join(upload_dir, f"{file_uuid}{ext}")
```

### 6. 输入验证（Pydantic）

```python
# 字符串边界
username: str = Field(..., min_length=3, max_length=50)
password: str = Field(..., min_length=8)
title: str = Field(..., min_length=1, max_length=500)

# 邮箱格式
email: EmailStr  # Pydantic 内置校验

# 可选字段
publication_date: Optional[datetime] = None
abstract: Optional[str] = None
```

- 所有用户输入使用 Pydantic model 校验（非散装 `Form()` 或 `Body()`）
- 邮箱使用 `EmailStr`（非 `str` + 手动正则）
- 验证失败自动返回 422，detail 含具体错误字段

### 7. 数据库安全

- SQLAlchemy ORM 参数化查询（天然防 SQL 注入）
- 禁止：原始 SQL 拼接、`text()` 直接执行用户输入
- `ForeignKey` 确保引用完整性
- 独立测试数据库（不污染开发数据）

### 8. 配置安全

```python
class Settings(BaseSettings):
    SECRET_KEY: str = "your-secret-key-here"        # ⚠️ 默认值不安全
    DATABASE_URL: str = "sqlite:///./paperpilot.db"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    model_config = SettingsConfigDict(
        env_file=".env",        # ✅ 支持 .env 覆盖
        extra="ignore"          # ✅ 忽略未知字段
    )
```

| 检查项 | 状态 | 建议 |
|--------|------|------|
| `.env` 在 `.gitignore` | ⚠️ 未检查 | 添加 `.env` 到 `.gitignore` |
| Secret Key 默认值 | ⚠️ 弱默认值 | 通过 `.env` 设置强密钥 |
| 数据库 URL 编码 | ✅ 无敏感信息 | SQLite 本地文件，无密码 |
| CORS 配置 | ❌ 未配置 | 生产需配置 `CORSMiddleware` |

### 9. 依赖安全（已知风险库）

| 依赖 | 版本 | 安全建议 |
|------|------|---------|
| `python-jose[cryptography]` | - | 确保 `cryptography` 已安装（非 `python-jose` 纯实现） |
| `passlib[bcrypt]` | - | 保持 bcrypt ≥ 4.0，旧版本有已知问题 |
| `cryptography` | - | 定期更新到最新 LTS 版本 |

## 常见安全问题对照表

| 问题 | 严重度 | 风险 | 修复方法 |
|------|--------|------|---------|
| Secret Key 硬编码 | 🔴 高危 | JWT 可伪造 | 设置 `.env` + `secrets.token_urlsafe(32)` |
| 缺少文件类型校验 | 🔴 高危 | 任意文件上传 | 添加后缀白名单校验 |
| 资源未隔离 | 🟠 中危 | 越权访问他人数据 | query 加 `.filter(user_id == ...)` |
| 错误信息泄露归属 | 🟠 中危 | 用户枚举 | 统一返回 404 |
| 缺少 CORS | 🟡 低危 | 浏览器限制 | 生产环境添加 `CORSMiddleware` |
| 默认密钥 | 🟡 低危 | 已知攻击向量 | 覆盖默认值 |
| 密码无长度限制 | 🟡 低危 | 暴力破解 | 已有 `min_length=8` |
| `.env` 未 gitignore | 🟡 低危 | 密钥泄露 | 添加到 `.gitignore` |

## 输出格式

```markdown
# Security Review Report

## 概况
- 检查文件数：N
- 发现问题数：N
- 🔴 高危：N / 🟠 中危：N / 🟡 低危：N

## 按风险等级

### 🔴 高危
| 问题 | 文件 | 行号 | 描述 | 建议 |
|------|------|------|------|------|
| Secret Key 硬编码 | config.py | L15 | 默认密钥可被猜测 | 设置 .env + 强密钥 |
| ... | ... | ... | ... | ... |

### 🟠 中危
| ... | ... | ... | ... | ... |

## 总结
- 严重问题：...
- 建议优先修复：...
```
