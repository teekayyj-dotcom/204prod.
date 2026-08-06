"""add media folder

Revision ID: c2f49f667928
Revises: ca0ce66a295a
Create Date: 2026-08-06 16:16:28.038528
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = 'c2f49f667928'
down_revision: str | None = 'ca0ce66a295a'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Create media_folders table
    op.create_table(
        'media_folders',
        sa.Column('id', sa.String(length=160), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('client_slug', sa.String(length=120), nullable=True),
        sa.Column('project_slug', sa.String(length=160), nullable=True),
        sa.Column('parent_id', sa.String(length=160), nullable=True),
        sa.Column('is_published', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['client_slug'], ['clients.slug'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['parent_id'], ['media_folders.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['project_slug'], ['projects.slug'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Add folder_id and is_published to media_assets
    op.add_column('media_assets', sa.Column('folder_id', sa.String(length=160), nullable=True))
    op.add_column('media_assets', sa.Column('is_published', sa.Boolean(), nullable=False, server_default='0'))
    
    # Create foreign key for folder_id
    op.create_foreign_key(
        'fk_media_assets_folder_id',
        'media_assets', 'media_folders',
        ['folder_id'], ['id'],
        ondelete='SET NULL'
    )
    
    # Migrate string folders
    connection = op.get_bind()
    import uuid
    from sqlalchemy.sql import text
    
    # Fetch assets with legacy folders
    result = connection.execute(text("SELECT id, folder, client_slug, project_slug FROM media_assets WHERE folder IS NOT NULL AND folder != '' AND folder_id IS NULL"))
    
    created_folders = {}
    for row in result:
        asset_id, folder_path, client, project = row
        parts = folder_path.strip("/").split("/")
        parent_id = None
        current_path = ""
        
        for part in parts:
            current_path = current_path + "/" + part if current_path else part
            part_key = (client, project, current_path)
            
            if part_key not in created_folders:
                folder_id = str(uuid.uuid4())
                name = part.capitalize() if part in ["thumbnail", "demo", "final", "media"] else part
                
                connection.execute(text(
                    "INSERT INTO media_folders (id, name, client_slug, project_slug, parent_id, is_published) "
                    "VALUES (:id, :name, :client, :project, :parent, 0)"
                ), {"id": folder_id, "name": name, "client": client, "project": project, "parent": parent_id})
                
                created_folders[part_key] = folder_id
            
            parent_id = created_folders[part_key]
        
        connection.execute(text(
            "UPDATE media_assets SET folder_id = :folder_id WHERE id = :asset_id"
        ), {"folder_id": parent_id, "asset_id": asset_id})

def downgrade() -> None:
    op.drop_constraint('fk_media_assets_folder_id', 'media_assets', type_='foreignkey')
    op.drop_column('media_assets', 'is_published')
    op.drop_column('media_assets', 'folder_id')
    op.drop_table('media_folders')
