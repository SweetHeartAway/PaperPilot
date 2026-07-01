"""add user profile fields

Revision ID: 8de1a40e460d
Revises: 6933e59d12dc
Create Date: 2026-07-02 00:41:42.687563

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "8de1a40e460d"
down_revision: str | None = "6933e59d12dc"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # SQLite batch 模式无法处理环形依赖（users ↔ ai_prompt_templates），
    # 逐个添加列（不建 FK），应用层保证引用完整性。
    op.add_column(
        "users",
        sa.Column("avatar_uuid", sa.String(length=255), nullable=True, comment="头像文件 UUID"),
    )
    op.add_column(
        "users",
        sa.Column(
            "ai_api_key", sa.String(length=500), nullable=True, comment="用户自有的 AI API Key"
        ),
    )
    op.add_column(
        "users",
        sa.Column(
            "ai_base_url", sa.String(length=500), nullable=True, comment="用户偏好的 API 地址"
        ),
    )
    op.add_column(
        "users",
        sa.Column(
            "ai_model", sa.String(length=100), nullable=True, comment="用户偏好的 AI 模型名称"
        ),
    )
    op.add_column(
        "users",
        sa.Column(
            "default_prompt_template_id", sa.Integer(), nullable=True, comment="默认 Prompt 模板"
        ),
    )


def downgrade() -> None:
    op.drop_column("users", "default_prompt_template_id")
    op.drop_column("users", "ai_model")
    op.drop_column("users", "ai_base_url")
    op.drop_column("users", "ai_api_key")
    op.drop_column("users", "avatar_uuid")
