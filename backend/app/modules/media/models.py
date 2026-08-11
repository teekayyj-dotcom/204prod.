from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Integer, String, Boolean, func, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.modules.projects.models import Client, Project, ProjectGalleryImage


class MediaFolder(Base):
    __tablename__ = "media_folders"
    
    id: Mapped[str] = mapped_column(String(160), primary_key=True)
    slug: Mapped[str | None] = mapped_column(String(255), unique=True, index=True, nullable=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    client_slug: Mapped[str | None] = mapped_column(
        String(120),
        ForeignKey("clients.slug", ondelete="CASCADE"),
        nullable=True,
    )
    project_slug: Mapped[str | None] = mapped_column(
        String(160),
        ForeignKey("projects.slug", ondelete="CASCADE"),
        nullable=True,
    )
    parent_id: Mapped[str | None] = mapped_column(
        String(160),
        ForeignKey("media_folders.id", ondelete="CASCADE"),
        nullable=True,
    )
    is_published: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )


class MediaAsset(Base):
    __tablename__ = "media_assets"

    id: Mapped[str] = mapped_column(String(160), primary_key=True)
    slug: Mapped[str | None] = mapped_column(String(255), unique=True, index=True, nullable=True)
    kind: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    url: Mapped[str] = mapped_column(String(500), nullable=False, unique=True)
    thumbnail_url: Mapped[str | None] = mapped_column(String(500))
    alt: Mapped[str | None] = mapped_column(String(255))
    caption: Mapped[str | None] = mapped_column(String(255))
    width: Mapped[int | None] = mapped_column(Integer)
    height: Mapped[int | None] = mapped_column(Integer)
    mime_type: Mapped[str | None] = mapped_column(String(120))
    file_size: Mapped[int | None] = mapped_column(Integer)
    bunny_video_id: Mapped[str | None] = mapped_column(String(255))
    client_slug: Mapped[str | None] = mapped_column(
        String(120),
        ForeignKey("clients.slug", ondelete="SET NULL"),
        nullable=True,
    )
    project_slug: Mapped[str | None] = mapped_column(
        String(160),
        ForeignKey("projects.slug", ondelete="SET NULL"),
        nullable=True,
    )
    folder: Mapped[str | None] = mapped_column(String(100), nullable=True) # Legacy string folder
    folder_id: Mapped[str | None] = mapped_column(
        String(160),
        ForeignKey("media_folders.id", ondelete="SET NULL"),
        nullable=True,
    )
    is_published: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    logo_clients: Mapped[list["Client"]] = relationship(
        back_populates="logo_media",
        foreign_keys="Client.logo_media_id",
    )
    cover_projects: Mapped[list["Project"]] = relationship(
        back_populates="cover_media",
        foreign_keys="Project.cover_media_id",
    )
    gallery_images: Mapped[list["ProjectGalleryImage"]] = relationship(
        back_populates="media_asset",
    )
