"""create admin database schema

Revision ID: 0001_create_admin_schema
Revises:
Create Date: 2026-05-18 00:00:00
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "0001_create_admin_schema"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("username", sa.String(length=80), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=50), nullable=False),
        sa.Column("active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)
    op.create_index(op.f("ix_users_id"), "users", ["id"], unique=False)
    op.create_index(op.f("ix_users_username"), "users", ["username"], unique=True)

    op.create_table(
        "media_assets",
        sa.Column("id", sa.String(length=160), nullable=False),
        sa.Column("kind", sa.String(length=50), nullable=False),
        sa.Column("url", sa.String(length=500), nullable=False),
        sa.Column("alt", sa.String(length=255), nullable=True),
        sa.Column("caption", sa.String(length=255), nullable=True),
        sa.Column("width", sa.Integer(), nullable=True),
        sa.Column("height", sa.Integer(), nullable=True),
        sa.Column("mime_type", sa.String(length=120), nullable=True),
        sa.Column("file_size", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("url"),
    )
    op.create_index(op.f("ix_media_assets_kind"), "media_assets", ["kind"], unique=False)

    op.create_table(
        "categories",
        sa.Column("slug", sa.String(length=120), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("type", sa.String(length=80), nullable=False),
        sa.PrimaryKeyConstraint("slug"),
    )

    op.create_table(
        "contact_requests",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("phone", sa.String(length=50), nullable=True),
        sa.Column("company", sa.String(length=160), nullable=True),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_contact_requests_email"), "contact_requests", ["email"], unique=False)
    op.create_index(op.f("ix_contact_requests_status"), "contact_requests", ["status"], unique=False)

    op.create_table(
        "clients",
        sa.Column("slug", sa.String(length=120), nullable=False),
        sa.Column("name", sa.String(length=180), nullable=False),
        sa.Column("logo_media_id", sa.String(length=160), nullable=True),
        sa.Column("website", sa.String(length=500), nullable=True),
        sa.ForeignKeyConstraint(["logo_media_id"], ["media_assets.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("slug"),
    )
    op.create_index(op.f("ix_clients_name"), "clients", ["name"], unique=False)

    op.create_table(
        "projects",
        sa.Column("slug", sa.String(length=160), nullable=False),
        sa.Column("title", sa.String(length=220), nullable=False),
        sa.Column("client_slug", sa.String(length=120), nullable=False),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("format_slug", sa.String(length=120), nullable=False),
        sa.Column("featured", sa.Boolean(), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("cover_media_id", sa.String(length=160), nullable=True),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("seo_title", sa.String(length=255), nullable=True),
        sa.Column("seo_description", sa.String(length=500), nullable=True),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["client_slug"], ["clients.slug"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["cover_media_id"], ["media_assets.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["format_slug"], ["categories.slug"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("slug"),
    )
    op.create_index(op.f("ix_projects_client_slug"), "projects", ["client_slug"], unique=False)
    op.create_index(op.f("ix_projects_featured"), "projects", ["featured"], unique=False)
    op.create_index(op.f("ix_projects_format_slug"), "projects", ["format_slug"], unique=False)
    op.create_index(op.f("ix_projects_status"), "projects", ["status"], unique=False)
    op.create_index(op.f("ix_projects_title"), "projects", ["title"], unique=False)
    op.create_index(op.f("ix_projects_year"), "projects", ["year"], unique=False)

    op.create_table(
        "project_credits",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("project_slug", sa.String(length=160), nullable=False),
        sa.Column("role", sa.String(length=120), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["project_slug"], ["projects.slug"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_project_credits_project_slug"), "project_credits", ["project_slug"], unique=False)

    op.create_table(
        "project_gallery_images",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("project_slug", sa.String(length=160), nullable=False),
        sa.Column("media_asset_id", sa.String(length=160), nullable=False),
        sa.Column("caption", sa.String(length=255), nullable=True),
        sa.Column("alt", sa.String(length=255), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column("is_featured", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["media_asset_id"], ["media_assets.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["project_slug"], ["projects.slug"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_project_gallery_images_media_asset_id"),
        "project_gallery_images",
        ["media_asset_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_project_gallery_images_project_slug"),
        "project_gallery_images",
        ["project_slug"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_project_gallery_images_project_slug"), table_name="project_gallery_images")
    op.drop_index(op.f("ix_project_gallery_images_media_asset_id"), table_name="project_gallery_images")
    op.drop_table("project_gallery_images")
    op.drop_index(op.f("ix_project_credits_project_slug"), table_name="project_credits")
    op.drop_table("project_credits")
    op.drop_index(op.f("ix_projects_year"), table_name="projects")
    op.drop_index(op.f("ix_projects_title"), table_name="projects")
    op.drop_index(op.f("ix_projects_status"), table_name="projects")
    op.drop_index(op.f("ix_projects_format_slug"), table_name="projects")
    op.drop_index(op.f("ix_projects_featured"), table_name="projects")
    op.drop_index(op.f("ix_projects_client_slug"), table_name="projects")
    op.drop_table("projects")
    op.drop_index(op.f("ix_clients_name"), table_name="clients")
    op.drop_table("clients")
    op.drop_index(op.f("ix_contact_requests_status"), table_name="contact_requests")
    op.drop_index(op.f("ix_contact_requests_email"), table_name="contact_requests")
    op.drop_table("contact_requests")
    op.drop_table("categories")
    op.drop_index(op.f("ix_media_assets_kind"), table_name="media_assets")
    op.drop_table("media_assets")
    op.drop_index(op.f("ix_users_username"), table_name="users")
    op.drop_index(op.f("ix_users_id"), table_name="users")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")
