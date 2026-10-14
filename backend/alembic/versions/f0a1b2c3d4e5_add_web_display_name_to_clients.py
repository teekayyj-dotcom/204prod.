"""add web_display_name to clients

Revision ID: f0a1b2c3d4e5
Revises: 9aec3867cd95
Create Date: 2026-10-14 23:55:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f0a1b2c3d4e5'
down_revision = '9aec3867cd95'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('clients', sa.Column('web_display_name', sa.String(180), nullable=True))


def downgrade() -> None:
    op.drop_column('clients', 'web_display_name')
