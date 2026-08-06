"""add push subscriptions

Revision ID: d00000000001
Revises: c2f49f667928
Create Date: 2026-08-06 15:20:00.000000
"""

from collections.abc import Sequence
from alembic import op
import sqlalchemy as sa

revision: str = 'd00000000001'
down_revision: str | None = 'c2f49f667928'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

def upgrade() -> None:
    op.create_table('push_subscriptions',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.String(length=100), nullable=False),
    sa.Column('endpoint', sa.String(length=500), nullable=False),
    sa.Column('p256dh', sa.String(length=100), nullable=False),
    sa.Column('auth', sa.String(length=100), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('endpoint')
    )
    op.create_index(op.f('ix_push_subscriptions_user_id'), 'push_subscriptions', ['user_id'], unique=False)
    op.create_index(op.f('ix_push_subscriptions_id'), 'push_subscriptions', ['id'], unique=False)

def downgrade() -> None:
    op.drop_index(op.f('ix_push_subscriptions_id'), table_name='push_subscriptions')
    op.drop_index(op.f('ix_push_subscriptions_user_id'), table_name='push_subscriptions')
    op.drop_table('push_subscriptions')
