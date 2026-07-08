"""Add avatar_locked to crew_members

Revision ID: 095f62c4b59f
Revises: 43eab67fe4f6
Create Date: 2026-07-08 14:12:32.452223
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = '095f62c4b59f'
down_revision: str | None = '43eab67fe4f6'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column('crew_members', sa.Column('avatar_locked', sa.Boolean(), nullable=True, server_default=sa.text('0')))


def downgrade() -> None:
    op.drop_column('crew_members', 'avatar_locked')
