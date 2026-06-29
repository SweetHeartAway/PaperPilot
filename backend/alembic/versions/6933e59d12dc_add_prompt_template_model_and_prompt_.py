"""add prompt template model and prompt_template_id to ai analyses

Revision ID: 6933e59d12dc
Revises: dc920b656ec7
Create Date: 2026-06-29 19:37:13.377905

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "6933e59d12dc"
down_revision: str | None = "dc920b656ec7"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # 新建提示词模板表
    op.create_table(
        "ai_prompt_templates",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("analysis_type", sa.String(length=50), nullable=False),
        sa.Column("system_prompt", sa.Text(), nullable=False),
        sa.Column("user_prompt_template", sa.Text(), nullable=True),
        sa.Column("is_default", sa.Boolean(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(),
            server_default=sa.text("(CURRENT_TIMESTAMP)"),
            nullable=True,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            server_default=sa.text("(CURRENT_TIMESTAMP)"),
            nullable=True,
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_ai_prompt_templates_id"), "ai_prompt_templates", ["id"], unique=False)

    # ai_analyses 新增 prompt_template_id 外键
    with op.batch_alter_table("ai_analyses") as batch_op:
        batch_op.add_column(
            sa.Column(
                "prompt_template_id",
                sa.Integer(),
                nullable=True,
                comment="使用的自定义提示词模板（空 = 默认提示词）",
            )
        )
        batch_op.create_foreign_key(
            "fk_ai_analyses_prompt_template_id",
            "ai_prompt_templates",
            ["prompt_template_id"],
            ["id"],
        )


def downgrade() -> None:
    with op.batch_alter_table("ai_analyses") as batch_op:
        batch_op.drop_constraint("fk_ai_analyses_prompt_template_id", type_="foreignkey")
        batch_op.drop_column("prompt_template_id")

    op.drop_index(op.f("ix_ai_prompt_templates_id"), table_name="ai_prompt_templates")
    op.drop_table("ai_prompt_templates")
