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


def upgrade() -> None:
    # 1. Alter project_feedbacks table
    op.alter_column('project_feedbacks', 'user_id',
                    existing_type=sa.String(length=100),
                    nullable=True)
    op.add_column('project_feedbacks', sa.Column('guest_name', sa.String(length=180), nullable=True))

    # 2. Create review_links table
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
    op.drop_index(op.f('ix_review_links_video_url'), table_name='review_links')
    op.drop_index(op.f('ix_review_links_project_slug'), table_name='review_links')
    op.drop_table('review_links')
    op.drop_column('project_feedbacks', 'guest_name')
    op.alter_column('project_feedbacks', 'user_id',
                    existing_type=sa.String(length=100),
                    nullable=False)
