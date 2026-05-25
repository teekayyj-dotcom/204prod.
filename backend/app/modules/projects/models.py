from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.modules.media.models import MediaAsset
    from app.modules.categories.models import Category

class Client(Base):
    __tablename__ = "clients"

    slug: Mapped[str] = mapped_column(String(120), primary_key=True)
    name: Mapped[str] = mapped_column(String(180), nullable=False, index=True)
    logo_media_id: Mapped[str | None] = mapped_column(
        String(160),
        ForeignKey("media_assets.id", ondelete="SET NULL"),
    )
    website: Mapped[str | None] = mapped_column(String(500))

    logo_media: Mapped["MediaAsset | None"] = relationship(
        back_populates="logo_clients",
        foreign_keys=[logo_media_id],
    )
    projects: Mapped[list["Project"]] = relationship(back_populates="client")


class Project(Base):
    __tablename__ = "projects"

    slug: Mapped[str] = mapped_column(String(160), primary_key=True)
    title: Mapped[str] = mapped_column(String(220), nullable=False, index=True)
    client_slug: Mapped[str] = mapped_column(
        String(120),
        ForeignKey("clients.slug", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    year: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    format_slug: Mapped[str] = mapped_column(
        String(120),
        ForeignKey("categories.slug", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    featured: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, index=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="draft", index=True)
    cover_media_id: Mapped[str | None] = mapped_column(
        String(160),
        ForeignKey("media_assets.id", ondelete="SET NULL"),
    )
    summary: Mapped[str | None] = mapped_column(Text)
    seo_title: Mapped[str | None] = mapped_column(String(255))
    seo_description: Mapped[str | None] = mapped_column(String(500))
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    client: Mapped[Client] = relationship(back_populates="projects")
    format_category: Mapped["Category"] = relationship(back_populates="projects")
    cover_media: Mapped["MediaAsset | None"] = relationship(
        back_populates="cover_projects",
        foreign_keys=[cover_media_id],
    )
    credits: Mapped[list["ProjectCredit"]] = relationship(
        back_populates="project",
        cascade="all, delete-orphan",
        order_by="ProjectCredit.sort_order",
    )
    gallery_images: Mapped[list["ProjectGalleryImage"]] = relationship(
        back_populates="project",
        cascade="all, delete-orphan",
        order_by="ProjectGalleryImage.sort_order",
    )


class ProjectCredit(Base):
    __tablename__ = "project_credits"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_slug: Mapped[str] = mapped_column(
        String(160),
        ForeignKey("projects.slug", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    role: Mapped[str] = mapped_column(String(120), nullable=False)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    project: Mapped[Project] = relationship(back_populates="credits")


class ProjectGalleryImage(Base):
    __tablename__ = "project_gallery_images"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_slug: Mapped[str] = mapped_column(
        String(160),
        ForeignKey("projects.slug", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    media_asset_id: Mapped[str] = mapped_column(
        String(160),
        ForeignKey("media_assets.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    caption: Mapped[str | None] = mapped_column(String(255))
    alt: Mapped[str | None] = mapped_column(String(255))
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_featured: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    project: Mapped[Project] = relationship(back_populates="gallery_images")
    media_asset: Mapped["MediaAsset"] = relationship(back_populates="gallery_images")
