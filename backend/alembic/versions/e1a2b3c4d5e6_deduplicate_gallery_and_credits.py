"""deduplicate gallery and credits

Revision ID: e1a2b3c4d5e6
Revises: f0a1b2c3d4e5
Create Date: 2026-10-15 00:30:00.000000

"""
from collections.abc import Sequence
from alembic import op
import sqlalchemy as sa


revision: str = 'e1a2b3c4d5e6'
down_revision: str | None = 'f0a1b2c3d4e5'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "mysql":
        bind.execute(sa.text("""
            DELETE g1 FROM project_gallery_images g1
            INNER JOIN project_gallery_images g2
            WHERE g1.id > g2.id 
              AND g1.project_slug = g2.project_slug 
              AND g1.media_asset_id = g2.media_asset_id;
        """))
        bind.execute(sa.text("""
            DELETE c1 FROM project_credits c1
            INNER JOIN project_credits c2
            WHERE c1.id > c2.id
              AND c1.project_slug = c2.project_slug
              AND c1.role = c2.role
              AND c1.name = c2.name;
        """))
    else:
        bind.execute(sa.text("""
            DELETE FROM project_gallery_images 
            WHERE id IN (
                SELECT g1.id 
                FROM project_gallery_images g1 
                JOIN project_gallery_images g2 
                  ON g1.project_slug = g2.project_slug 
                 AND g1.media_asset_id = g2.media_asset_id 
                WHERE g1.id > g2.id
            );
        """))
        bind.execute(sa.text("""
            DELETE FROM project_credits 
            WHERE id IN (
                SELECT c1.id 
                FROM project_credits c1 
                JOIN project_credits c2 
                  ON c1.project_slug = c2.project_slug 
                 AND c1.role = c2.role 
                 AND c1.name = c2.name 
                WHERE c1.id > c2.id
            );
        """))


def downgrade() -> None:
    pass
