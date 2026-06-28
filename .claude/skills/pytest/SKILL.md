---
name: pytest
description: Review test coverage, fixture structure, isolation, edge cases, and CI readiness
---

# Pytest Test Review

审核 `backend/tests/` 下的测试质量 — 覆盖度、隔离性、Fixture 设计、边界测试。

## 项目测试架构

```
tests/
├── conftest.py      # 全局 fixture（db_session, test_client）
├── test_auth.py     # 认证测试（11 tests）
├── test_users.py    # 用户信息测试（6 tests）
└── test_papers.py   # 论文 CRUD + 文件测试（18 tests）

总计：35 tests ✅ All passing
```

### Fixture 层级

```
pytest
 └── db_session (function scope)
      ├── create_all → 创建全部表
      ├── yield db
      └── drop_all → 清空全部表（独立数据隔离）
      │
      └── test_client (function scope)
           ├── 临时上传目录（隔离文件）
           ├── override_get_db → 注入 db_session
           ├── yield TestClient(app)
           └── 清理目录 + 恢复 override
           │
           └── 各 test 函数
```

## 检查项

### 1. Fixture 设计

- `db_session` — `scope="function"` + `create_all`/`drop_all`（独立数据库隔离）
- `test_client` — 依赖 `db_session`，覆盖 `get_db` 依赖注入，使用临时上传目录
- 文件隔离：`tempfile.mkdtemp()` + 恢复 `settings.UPLOAD_DIR`
- 清理：`app.dependency_overrides.clear()` + `shutil.rmtree(tmp_upload)`
- 测试数据库：独立文件 `tests/test_paperpilot.db`，启动前清理旧文件

### 2. 模型注册

```python
# conftest.py 顶部必须导入所有模型
from app.models import User, Paper, AIAnalysis  # noqa: F401
```

- 确保 `Base.metadata` 在 `create_all` 前已注册所有表
- 新加模型必须同时出现在这里

### 3. 测试组织结构

| 维度 | 规范 |
|------|------|
| 文件名 | `test_<模块名>.py`（如 `test_auth.py`） |
| 类名 | `Test<功能>`（如 `TestPaperUpload`） |
| 函数名 | `test_<场景>`（如 `test_register_duplicate_email`） |
| 辅助函数 | `_helper` 前缀（如 `_auth_header`, `_create_paper`） |
| 函数文档 | 中文 docstring 简要描述测试场景 |

### 4. 测试覆盖维度

每个功能应测试以下维度：

| 维度 | 说明 | 示例 |
|------|------|------|
| ✅ 正常路径 | 标准输入，预期成功 | `test_upload_pdf_success` |
| ❌ 无认证 | 不传 token → 401 | `test_upload_no_auth` |
| ❌ 无效 token | 传伪造 token → 401 | `test_get_current_user_invalid_token` |
| ❌ 不存在 | 操作不存在的资源 ID → 404 | `test_upload_nonexistent_paper` |
| ❌ 权限不足 | 操作他人资源 → 404 | `test_upload_other_users_paper` |
| ❌ 格式错误 | 非法输入 → 422（Pydantic 校验） | `test_register_invalid_email` |
| ❌ 业务冲突 | 重复/冲突 → 400/409 | `test_register_duplicate_email` |
| ⚠️ 边界值 | 空值、超长、最小值 | `test_register_short_password` |
| ✅ 幂等性 | 重复操作的结果 | `test_delete_file_twice` |
| ✅ 数据独立 | 多用户数据不应互相影响 | `test_multiple_users_independent` |

### 5. 辅助函数模式

```python
# 注册 + 登录 → 获取 auth header
def _auth_header(test_client: TestClient) -> dict:
    test_client.post("/api/v1/auth/register", json={...})
    resp = test_client.post("/api/v1/auth/login", data={...})
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

# 创建测试资源 → 获取资源 ID
def _create_paper(test_client: TestClient, headers: dict) -> int:
    resp = test_client.post("/api/v1/papers/", json={...}, headers=headers)
    return resp.json()["id"]
```

- 辅助函数放在测试文件内部，不跨文件共享（避免隐式依赖）
- 返回 header dict 而非 token 字符串（调用方直接传 `headers=headers`）

### 6. 断言语义

```python
# ✅ 推荐（明确检查状态码和数据字段）
assert resp.status_code == 200
data = resp.json()
assert data["email"] == "test@example.com"
assert "id" in data
assert "password" not in data  # 敏感字段不泄露

# ✅ 推荐（检查中文 detail 确保是项目内错误而非默认）
assert "文件过大" in resp.json()["detail"]
assert resp.status_code == 400

# ❌ 避免（仅检查状态码，缺少数据验证）
assert resp.status_code == 200
```

### 7. Mock 策略

- 使用 `monkeypatch`（pytest 内置），而非 `unittest.mock`
- 仅 mock 外部不可控因素（设置、环境变量、AI 服务）
- **不 mock 数据库** — 使用 `db_session` fixture 的真实 SQLite

```python
def test_upload_file_too_large(self, test_client, monkeypatch):
    import app.core.config
    monkeypatch.setattr(app.core.config.settings, 'MAX_UPLOAD_SIZE', 10)
    # ...
    assert resp.status_code == 400
```

### 8. 文件测试特殊处理

- 使用最小的有效 PDF 二进制（`MINI_PDF` 常量）
- PDF 文件上传使用 `io.BytesIO` 而非真实文件
- 上传目录测试隔离（临时目录 + 恢复）
- 文件大小测试使用 `monkeypatch` 修改 `MAX_UPLOAD_SIZE`

### 9. 常见测试问题

| 问题 | 影响 | 修复 |
|------|------|------|
| 测试间数据污染 | 测试顺序依赖 | 确保 `scope="function"` 和 `drop_all` |
| 未清理 override | 影响其他测试 | 在 `test_client` fixture 的 finally 中 `clear()` |
| 硬编码 ID | 测试依赖特定 ID 存在 | 从 response 获取动态 ID |
| 只测正常路径 | 遗漏边界情况 | 补充认证/权限/边界测试 |
| 断言不足 | 假阳性通过 | 验证状态码 + 关键数据字段 |
| 辅助函数中混入 fixture | 无法独立调用 | 辅助函数只接收普通参数 |

### 10. 测试命令

```bash
# 运行全部测试
PYTHONPATH=. python -m pytest tests/ -v

# 运行单个文件
PYTHONPATH=. python -m pytest tests/test_auth.py -v

# 运行单个函数
PYTHONPATH=. python -m pytest tests/test_auth.py::test_register_user -v

# 运行单个类
PYTHONPATH=. python -m pytest tests/test_papers.py::TestPaperUpload -v

# 带覆盖率报告
PYTHONPATH=. python -m pytest tests/ -v --cov=app

# 失败时立即停止（调试用）
PYTHONPATH=. python -m pytest tests/ -v -x
```

## 输出格式

```markdown
# Pytest Test Review Report

## 概况
- 测试文件数：N
- 测试总数：N
- 发现问题数：N

## 按文件

### tests/test_papers.py
| 检查项 | 行号 | 问题 | 建议 |
|--------|------|------|------|
| 覆盖度 | - | 缺少 PATCH 端点测试 | 新增 test_update_paper |
| 断言 | L55 | 未验证敏感字段不泄露 | 添加 assert "password" not in data |
| 隔离 | L80 | 依赖之前测试创建的数据 | 每个测试独立创建数据 |
| ...   | ... | ... | ... |

## 总结
- 突出问题：...
- 建议优先修复：...
```
