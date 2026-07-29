"""add_project_slug_to_conversation

Revision ID: 6ca00079f6cd
Revises: c244031c2a98
Create Date: 2026-07-29 12:44:14.690500
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = '6ca00079f6cd'
down_revision: str | None = 'c244031c2a98'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


from sqlalchemy.engine.reflection import Inspector

def upgrade() -> None:
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)
    columns = [c['name'] for c in inspector.get_columns('messaging_conversations')]
    if 'project_slug' not in columns:
        op.add_column('messaging_conversations', sa.Column('project_slug', sa.String(length=160), nullable=True))
        op.create_index(op.f('ix_messaging_conversations_project_slug'), 'messaging_conversations', ['project_slug'], unique=False)
        op.create_foreign_key('fk_messaging_conversations_project_slug', 'messaging_conversations', 'projects', ['project_slug'], ['slug'], ondelete='SET NULL')


def downgrade() -> None:
    op.drop_constraint('fk_messaging_conversations_project_slug', 'messaging_conversations', type_='foreignkey')
    op.drop_index(op.f('ix_messaging_conversations_project_slug'), table_name='messaging_conversations')
    op.drop_column('messaging_conversations', 'project_slug')
