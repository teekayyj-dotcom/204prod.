"""add_thumbnail_url_to_media_asset

Revision ID: 81252a9f3f9e
Revises: cf9401f8212b
Create Date: 2026-06-30 21:50:49.271431
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = '81252a9f3f9e'
down_revision: str | None = 'cf9401f8212b'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column('media_assets', sa.Column('thumbnail_url', sa.String(length=500), nullable=True))


def downgrade() -> None:
    op.drop_column('media_assets', 'thumbnail_url')
