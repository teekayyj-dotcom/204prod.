"""add is_hidden to crew_members

Revision ID: 9aec3867cd95
Revises: d3c26dd9ef2f
Create Date: 2026-09-09 11:02:24.687531
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = '9aec3867cd95'
down_revision: str | None = 'd3c26dd9ef2f'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column('crew_members', sa.Column('is_hidden', sa.Boolean(), nullable=True, server_default='0'))


def downgrade() -> None:
    op.drop_column('crew_members', 'is_hidden')
