"""add onupdate cascade to more tables

Revision ID: d3c26dd9ef2f
Revises: 
Create Date: 2026-09-05 01:34:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector

# revision identifiers, used by Alembic.
revision: str = 'd3c26dd9ef2f'
down_revision: Union[str, None] = 'd3c26dd9ef2e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = Inspector.from_engine(bind)
    
    tables_to_update = [
        'messaging_conversations',
        'media_folders',
        'media_assets'
    ]
    
    for table_name in tables_to_update:
        try:
            fks = inspector.get_foreign_keys(table_name)
            for fk in fks:
                if fk['referred_table'] == 'projects' and 'project_slug' in fk['constrained_columns']:
                    op.drop_constraint(fk['name'], table_name, type_='foreignkey')
                    
                    # messaging_conversations and media_assets use SET NULL for ondelete
                    ondelete_val = 'SET NULL' if table_name in ['messaging_conversations', 'media_assets'] else 'CASCADE'
                    
                    op.create_foreign_key(
                        fk['name'], 
                        table_name, 
                        'projects', 
                        ['project_slug'], 
                        ['slug'], 
                        ondelete=ondelete_val, 
                        onupdate='CASCADE'
                    )
        except Exception as e:
            print(f"Warning: Could not update foreign keys for {table_name}: {e}")

def downgrade() -> None:
    bind = op.get_bind()
    inspector = Inspector.from_engine(bind)
    
    tables_to_update = [
        'messaging_conversations',
        'media_folders',
        'media_assets'
    ]
    
    for table_name in tables_to_update:
        try:
            fks = inspector.get_foreign_keys(table_name)
            for fk in fks:
                if fk['referred_table'] == 'projects' and 'project_slug' in fk['constrained_columns']:
                    op.drop_constraint(fk['name'], table_name, type_='foreignkey')
                    
                    ondelete_val = 'SET NULL' if table_name in ['messaging_conversations', 'media_assets'] else 'CASCADE'
                    
                    op.create_foreign_key(
                        fk['name'], 
                        table_name, 
                        'projects', 
                        ['project_slug'], 
                        ['slug'], 
                        ondelete=ondelete_val
                    )
        except Exception as e:
            pass
