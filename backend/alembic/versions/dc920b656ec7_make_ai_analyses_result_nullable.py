"""make ai_analyses.result nullable

Revision ID: dc920b656ec7
Revises: d84714bd6434
Create Date: 2026-06-29 18:33:23.388595

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "dc920b656ec7"
down_revision: str | None = "d84714bd6434"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # SQLite 需要 batch 模式来修改列
    with op.batch_alter_table("ai_analyses") as batch_op:
        batch_op.alter_column("result", existing_type=sa.TEXT(), nullable=True)


def downgrade() -> None:
    with op.batch_alter_table("ai_analyses") as batch_op:
        batch_op.alter_column("result", existing_type=sa.TEXT(), nullable=False)
