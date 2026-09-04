"""add onupdate cascade to project slug

Revision ID: d3c26dd9ef2e
Revises: 
Create Date: 2026-09-05 01:24:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector

# revision identifiers, used by Alembic.
revision: str = 'd3c26dd9ef2e'
down_revision: Union[str, None] = 'd3c26dd9ef2d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = Inspector.from_engine(bind)
    
    tables_to_update = [
        'project_credits',
        'project_gallery_images',
        'project_tasks',
        'review_links',
        'project_feedbacks',
        'approval_requests',
        'project_activities',
        'project_comments',
        'photo_albums'
    ]
    
    for table_name in tables_to_update:
        try:
            fks = inspector.get_foreign_keys(table_name)
            for fk in fks:
                if fk['referred_table'] == 'projects' and 'project_slug' in fk['constrained_columns']:
                    # Drop existing constraint
                    op.drop_constraint(fk['name'], table_name, type_='foreignkey')
                    # Recreate with onupdate='CASCADE'
                    op.create_foreign_key(
                        fk['name'], 
                        table_name, 
                        'projects', 
                        ['project_slug'], 
                        ['slug'], 
                        ondelete='CASCADE', 
                        onupdate='CASCADE'
                    )
        except Exception as e:
            print(f"Warning: Could not update foreign keys for {table_name}: {e}")

def downgrade() -> None:
    bind = op.get_bind()
    inspector = Inspector.from_engine(bind)
    
    tables_to_update = [
        'project_credits',
        'project_gallery_images',
        'project_tasks',
        'review_links',
        'project_feedbacks',
        'approval_requests',
        'project_activities',
        'project_comments',
        'photo_albums'
    ]
    
    for table_name in tables_to_update:
        try:
            fks = inspector.get_foreign_keys(table_name)
            for fk in fks:
                if fk['referred_table'] == 'projects' and 'project_slug' in fk['constrained_columns']:
                    op.drop_constraint(fk['name'], table_name, type_='foreignkey')
                    op.create_foreign_key(
                        fk['name'], 
                        table_name, 
                        'projects', 
                        ['project_slug'], 
                        ['slug'], 
                        ondelete='CASCADE'
                    )
        except Exception as e:
            pass
