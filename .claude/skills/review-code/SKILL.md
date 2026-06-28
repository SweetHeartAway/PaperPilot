---
name: review-code
description: Review all Python code — PEP8, duplicates, exceptions, types, docstrings
---

# Review Code

扫描 `backend/` 下所有 Python 文件（`*.py`），对每个文件执行以下检查，输出汇总报告。

## 检查项

### 1. PEP8 合规
- 缩进：4 空格（非 Tab）
- 行长度：不超过 100 字符
- 命名：`snake_case`（变量/函数）、`PascalCase`（类）、`UPPER_CASE`（常量）
- 空行：函数间 2 空行，类方法间 1 空行
- import 顺序：标准库 → 第三方 → 本地模块，每组间空行分隔

### 2. 重复代码
- 识别 5 行以上结构重复的代码块
- 识别重复的字符串字面量（可提取为常量的）
- 识别重复的异常处理模式

### 3. 异常处理
- 未捕获的潜在异常（文件 IO、网络请求、JSON 解析、数据库操作）
- `except Exception` 是否过宽，有无日志记录
- 缺少 `finally` 的资源清理（文件句柄、数据库连接）

### 4. 类型注解
- 函数参数是否有类型注解
- 返回值是否有类型注解（无返回值用 `-> None`）
- 变量注解是否遗漏（特别是容器类型 `list[str]` 而非 `list`）

### 5. Docstring
- 模块级 docstring 是否缺失
- 公开函数/方法是否缺失 docstring
- docstring 是否与实际实现不符

## 输出格式

检查完成后，输出以下格式的 **Review Report**：

```markdown
# Python Code Review Report

## 概况
- 扫描文件数：N
- 发现问题数：N

## 按文件

### backend/path/to/file.py
| 检查项 | 行号 | 问题描述 | 建议 |
|--------|------|----------|------|
| PEP8  | L42  | 行过长（112 > 100） | 换行或拆分表达式 |
| 重复  | L88  | 与 L15-L22 结构重复 | 提取为函数 |
| ...   | ...  | ... | ... |

## 总结
- 突出问题：...
- 建议优先修复：...
```
