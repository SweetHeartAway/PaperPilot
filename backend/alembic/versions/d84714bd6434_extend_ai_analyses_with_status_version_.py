"""extend ai_analyses with status, version, error tracking

Revision ID: d84714bd6434
Revises: 004223c29aea
Create Date: 2026-06-29 18:32:40.621575

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "d84714bd6434"
down_revision: str | None = "004223c29aea"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # SQLite 不支持 ALTER COLUMN，ADD COLUMN 可以逐列添加
    # 新列（NOT NULL 需要 server_default 以便现有行使用）
    op.add_column(
        "ai_analyses",
        sa.Column("status", sa.String(length=20), nullable=False, server_default="pending"),
    )
    op.add_column("ai_analyses", sa.Column("error_message", sa.Text(), nullable=True))
    op.add_column(
        "ai_analyses", sa.Column("version", sa.Integer(), nullable=False, server_default="1")
    )
    op.add_column("ai_analyses", sa.Column("model_name", sa.String(length=100), nullable=True))
    op.add_column("ai_analyses", sa.Column("tokens_used", sa.Integer(), nullable=True))
    op.add_column("ai_analyses", sa.Column("processing_time_ms", sa.Integer(), nullable=True))
    op.add_column("ai_analyses", sa.Column("completed_at", sa.DateTime(), nullable=True))
    op.add_column(
        "ai_analyses",
        sa.Column(
            "updated_at",
            sa.DateTime(),
            server_default=sa.text("(CURRENT_TIMESTAMP)"),
            nullable=True,
        ),
    )
    # result 从 NOT NULL 改为 NULLABLE，SQLite 需要 batch 模式
    with op.batch_alter_table("ai_analyses") as batch_op:
        batch_op.alter_column("result", existing_type=sa.TEXT(), nullable=True)


def downgrade() -> None:
    # 反向：先用 batch 改 result 为 NOT NULL
    with op.batch_alter_table("ai_analyses") as batch_op:
        batch_op.alter_column("result", existing_type=sa.TEXT(), nullable=False)
    op.drop_column("ai_analyses", "updated_at")
    op.drop_column("ai_analyses", "completed_at")
    op.drop_column("ai_analyses", "processing_time_ms")
    op.drop_column("ai_analyses", "tokens_used")
    op.drop_column("ai_analyses", "model_name")
    op.drop_column("ai_analyses", "version")
    op.drop_column("ai_analyses", "error_message")
    op.drop_column("ai_analyses", "status")
