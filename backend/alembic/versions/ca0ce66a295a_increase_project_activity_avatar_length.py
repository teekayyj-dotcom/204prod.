"""increase_project_activity_avatar_length

Revision ID: ca0ce66a295a
Revises: 34b19a0b6ec1
Create Date: 2026-08-04 12:33:22.176683
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = 'ca0ce66a295a'
down_revision: str | None = '34b19a0b6ec1'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.alter_column('project_activities', 'avatar',
               existing_type=sa.String(length=10),
               type_=sa.String(length=500),
               existing_nullable=True)


def downgrade() -> None:
    op.alter_column('project_activities', 'avatar',
               existing_type=sa.String(length=500),
               type_=sa.String(length=10),
               existing_nullable=True)
