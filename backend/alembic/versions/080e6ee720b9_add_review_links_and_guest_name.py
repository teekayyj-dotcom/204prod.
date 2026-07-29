"""add_review_links_and_guest_name

Revision ID: 080e6ee720b9
Revises: 6ca00079f6cd
Create Date: 2026-07-29 13:15:50.027755
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = '080e6ee720b9'
down_revision: str | None = '6ca00079f6cd'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


from sqlalchemy.engine.reflection import Inspector

def upgrade() -> None:
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)
    
    # 1. Alter project_feedbacks table
    op.alter_column('project_feedbacks', 'user_id',
                    existing_type=sa.String(length=100),
                    nullable=True)
    
    columns = [c['name'] for c in inspector.get_columns('project_feedbacks')]
    if 'guest_name' not in columns:
        op.add_column('project_feedbacks', sa.Column('guest_name', sa.String(length=100), nullable=True))

    # 2. Create review_links table
    tables = inspector.get_table_names()
    if 'review_links' not in tables:
        op.create_table('review_links',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('project_slug', sa.String(length=160), nullable=True),
        sa.Column('video_url', sa.String(length=1000), nullable=True),
        sa.Column('token', sa.String(length=64), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('created_by', sa.String(length=36), nullable=True),
        sa.ForeignKeyConstraint(['project_slug'], ['projects.slug'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_review_links_id'), 'review_links', ['id'], unique=False)
        op.create_index(op.f('ix_review_links_token'), 'review_links', ['token'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_review_links_token'), table_name='review_links')
    op.drop_index(op.f('ix_review_links_id'), table_name='review_links')
    op.drop_table('review_links')
    op.drop_column('project_feedbacks', 'guest_name')
    op.alter_column('project_feedbacks', 'user_id',
                    existing_type=sa.String(length=100),
                    nullable=False)
