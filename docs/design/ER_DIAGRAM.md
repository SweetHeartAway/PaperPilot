# PaperPilot 数据库 ER 图

> 生成日期：2026-07-09

## ER 图

```mermaid
erDiagram
    User ||--o{ Paper : "publishes"
    User ||--o{ AIPromptTemplate : "creates"
    User ||--o{ Collection : "organizes"
    Paper ||--o{ AIAnalysis : "has"
    Paper }o--o{ Tag : "tagged_with"
    Paper }o--o{ Collection : "included_in"
    AIPromptTemplate ||--o{ AIAnalysis : "optional_template"

    User {
        int id PK "auto-increment"
        varchar email UK "not null, length 255"
        varchar username UK "not null, length 50"
        varchar hashed_password "not null, length 255"
        bool is_active "default true"
        datetime created_at "server_default now()"
        datetime updated_at "server_default now(), onupdate now()"
    }

    Paper {
        int id PK "auto-increment"
        varchar title "not null, length 500"
        text abstract "nullable"
        varchar authors "nullable, length 500"
        datetime publication_date "nullable"
        varchar doi UK "nullable, length 100"
        varchar file_path "nullable, length 500"
        varchar file_uuid UK "nullable, length 36"
        varchar original_filename "nullable, length 255"
        int file_size "nullable"
        int user_id FK "not null"
        datetime created_at "server_default now()"
        datetime updated_at "server_default now(), onupdate now()"
        bool is_favorite "default false"
    }

    Tag {
        int id PK "auto-increment"
        varchar name UK "not null, length 50"
        datetime created_at "server_default now()"
    }

    AIAnalysis {
        int id PK "auto-increment"
        int paper_id FK "not null"
        varchar analysis_type "not null, length 50"
        varchar status "not null, default pending, length 20"

        text result "nullable, JSON string"
        text error_message "nullable"
        int version "not null, default 1"
        varchar model_name "nullable, length 100"
        int tokens_used "nullable"
        int processing_time_ms "nullable"
        int prompt_template_id FK "nullable"
        datetime created_at "server_default now()"
        datetime completed_at "nullable"
        datetime updated_at "server_default now(), onupdate now()"
    }

    AIPromptTemplate {
        int id PK "auto-increment"
        int user_id FK "not null"
        varchar name "not null, length 100"
        text description "nullable"
        varchar analysis_type "not null, length 50"
        text system_prompt "not null"
        text user_prompt_template "nullable"
        bool is_default "not null, default false"
        datetime created_at "server_default now()"
        datetime updated_at "server_default now(), onupdate now()"
    }

    Collection {
        int id PK "auto-increment"
        varchar name "not null, length 100"
        text description "nullable"
        int user_id FK "not null"
        datetime created_at "server_default now()"
        datetime updated_at "server_default now(), onupdate now()"
    }

    paper_collections {
        int paper_id FK PK "ondelete CASCADE"
        int collection_id FK PK "ondelete CASCADE"
    }
```

## 模型说明

### User（用户）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | int | PK | 用户唯一标识 |
| email | varchar(255) | UK, NOT NULL | 邮箱，登录凭证之一 |
| username | varchar(50) | UK, NOT NULL | 用户名，登录凭证之一 |
| hashed_password | varchar(255) | NOT NULL | bcrypt 哈希密码 |
| is_active | bool | default true | 是否启用 |
| created_at | datetime | server_default | 注册时间 |
| updated_at | datetime | server_default + onupdate | 最后更新时间 |

### Paper（论文）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | int | PK | 论文唯一标识 |
| title | varchar(500) | NOT NULL | 论文标题 |
| abstract | text | nullable | 论文摘要 |
| authors | varchar(500) | nullable | 作者列表 |
| publication_date | datetime | nullable | 发表日期 |
| doi | varchar(100) | UK, nullable | DOI 唯一标识 |
| file_path | varchar(500) | nullable | PDF 文件存储路径 |
| file_uuid | varchar(36) | UK, nullable | 文件 UUID（防猜测） |
| original_filename | varchar(255) | nullable | 原始文件名 |
| file_size | int | nullable | 文件大小（字节） |
| user_id | int | FK -> users.id | 所属用户 |
| created_at | datetime | server_default | 创建时间 |
| updated_at | datetime | server_default + onupdate | 最后更新时间 |
| is_favorite | bool | default false | 是否收藏 |

### Tag（标签）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | int | PK | 标签唯一标识 |
| name | varchar(50) | UK, NOT NULL | 标签名称 |
| created_at | datetime | server_default | 创建时间 |

### AIAnalysis（AI 分析）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | int | PK | 分析记录唯一标识 |
| paper_id | int | FK -> papers.id | 所属论文 |
| analysis_type | varchar(50) | NOT NULL | 分析类型（summary/method/result/conclusion）|
| status | varchar(20) | NOT NULL, default pending | 状态（pending/processing/completed/failed）|
| result | text | nullable | 分析结果（JSON 字符串）|
| error_message | text | nullable | 错误信息 |
| version | int | NOT NULL, default 1 | 版本号 |
| model_name | varchar(100) | nullable | AI 模型名称 |
| tokens_used | int | nullable | 消耗 token 数 |
| processing_time_ms | int | nullable | 处理耗时（毫秒）|
| prompt_template_id | int | FK, nullable | 使用的 Prompt 模板 |
| created_at | datetime | server_default | 创建时间 |
| completed_at | datetime | nullable | 完成时间 |
| updated_at | datetime | server_default + onupdate | 最后更新时间 |

### AIPromptTemplate（AI Prompt 模板）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | int | PK | 模板唯一标识 |
| user_id | int | FK -> users.id | 所属用户 |
| name | varchar(100) | NOT NULL | 模板名称 |
| description | text | nullable | 模板描述 |
| analysis_type | varchar(50) | NOT NULL | 适用的分析类型 |
| system_prompt | text | NOT NULL | 系统提示词 |
| user_prompt_template | text | nullable | 用户提示词模板 |
| is_default | bool | NOT NULL, default false | 是否为用户默认模板 |
| created_at | datetime | server_default | 创建时间 |
| updated_at | datetime | server_default + onupdate | 最后更新时间 |

### Collection（阅读列表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | int | PK | 列表唯一标识 |
| name | varchar(100) | NOT NULL | 列表名称 |
| description | text | nullable | 列表描述 |
| user_id | int | FK -> users.id | 所属用户 |
| created_at | datetime | server_default | 创建时间 |
| updated_at | datetime | server_default + onupdate | 最后更新时间 |

### paper_tags（论文-标签关联表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| paper_id | int | PK, FK -> papers.id ON DELETE CASCADE | 论文 ID |
| tag_id | int | PK, FK -> tags.id ON DELETE CASCADE | 标签 ID |

### paper_collections（论文-阅读列表关联表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| paper_id | int | PK, FK -> papers.id ON DELETE CASCADE | 论文 ID |
| collection_id | int | PK, FK -> collections.id ON DELETE CASCADE | 阅读列表 ID |

## 关键关系

1. **User -> Paper (1:N)** -- `Paper.user_id` -> `User.id`。一个用户可拥有多篇论文
2. **User -> Collection (1:N)** -- `Collection.user_id` -> `User.id`。一个用户可创建多个阅读列表
3. **User -> AIPromptTemplate (1:N)** -- `AIPromptTemplate.user_id` -> `User.id`。一个用户可创建多个自定义 Prompt 模板
4. **Paper -> AIAnalysis (1:N)** -- `AIAnalysis.paper_id` -> `Paper.id`。一篇论文可有多个版本的 AI 分析记录
5. **Paper <-> Tag (M:N)** -- 通过 `paper_tags` 关联表。一篇论文可有多个标签，一个标签可属于多篇论文
6. **Paper <-> Collection (M:N)** -- 通过 `paper_collections` 关联表。一篇论文可属于多个阅读列表，一个列表可包含多篇论文
7. **AIPromptTemplate -> AIAnalysis (1:N, 可选)** -- `AIAnalysis.prompt_template_id` -> `AIPromptTemplate.id`。可选关联，为空时使用默认提示词

## 级联行为

- **Paper 删除 -> AIAnalysis 级联删除**：`cascade="all, delete-orphan"`，删除论文时连带清除所有 AI 分析记录
- **Paper 删除 -> paper_tags 自动清除**：`ondelete="CASCADE"`，删除论文时自动解除标签关联
- **Tag 删除 -> paper_tags 自动清除**：`ondelete="CASCADE"`，删除标签时自动解除论文关联
- **Collection 删除 -> paper_collections 自动清除**：`ondelete="CASCADE"`，删除列表时自动解除论文关联
- **Paper 删除 -> paper_collections 自动清除**：`ondelete="CASCADE"`，删除论文时自动解除列表关联

## 数据库配置

| 环境 | 数据库 | 配置方式 |
|------|--------|---------|
| 开发 | SQLite | `DATABASE_URL=sqlite:///./paperpilot.db`（默认）|
| 生产 | PostgreSQL | 设置 `DATABASE_URL=postgresql://user:pass@host:5432/paperpilot` |
