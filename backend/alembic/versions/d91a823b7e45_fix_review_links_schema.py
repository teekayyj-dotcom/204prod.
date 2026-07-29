"""fix review_links schema

Revision ID: d91a823b7e45
Revises: 080e6ee720b9
Create Date: 2026-07-29 16:15:50.027755
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector


revision: str = 'd91a823b7e45'
down_revision: str | None = '080e6ee720b9'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)
    tables = inspector.get_table_names()
    
    if 'review_links' in tables:
        # Check if it has 'id' column, if so, it's the wrong schema
        columns = [c['name'] for c in inspector.get_columns('review_links')]
        if 'id' in columns:
            op.drop_table('review_links')
            tables.remove('review_links')

    if 'review_links' not in tables:
        op.create_table('review_links',
            sa.Column('token', sa.String(length=50), nullable=False),
            sa.Column('project_slug', sa.String(length=160), nullable=False),
            sa.Column('video_url', sa.String(length=500), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.ForeignKeyConstraint(['project_slug'], ['projects.slug'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('token')
        )
        op.create_index(op.f('ix_review_links_project_slug'), 'review_links', ['project_slug'], unique=False)
        op.create_index(op.f('ix_review_links_video_url'), 'review_links', ['video_url'], unique=False)


def downgrade() -> None:
    pass
