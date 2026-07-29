from datetime import datetime, date
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Date, ForeignKey, Integer, String, Text, Float, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.modules.categories.models import Category

from app.modules.media.models import MediaAsset

class Client(Base):
    __tablename__ = "clients"

    slug: Mapped[str] = mapped_column(String(120), primary_key=True)
    name: Mapped[str] = mapped_column(String(180), nullable=False, index=True)
    logo_media_id: Mapped[str | None] = mapped_column(
        String(160),
        ForeignKey("media_assets.id", ondelete="SET NULL"),
    )
    website: Mapped[str | None] = mapped_column(String(500))
    contact: Mapped[str | None] = mapped_column(String(255), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(100), nullable=True)
    industry: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="Active")
    since: Mapped[str | None] = mapped_column(String(10), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

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
    published: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, index=True)
    locked: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, index=True)
    cover_media_id: Mapped[str | None] = mapped_column(
        String(160),
        ForeignKey("media_assets.id", ondelete="SET NULL"),
    )
    video_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    summary: Mapped[str | None] = mapped_column(Text)
    seo_title: Mapped[str | None] = mapped_column(String(255))
    seo_description: Mapped[str | None] = mapped_column(String(500))
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    budget: Mapped[str | None] = mapped_column(String(100), nullable=True, default="TBD")
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
    crew_id: Mapped[int | None] = mapped_column(Integer, nullable=True)

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
    crew_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_featured: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    published: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    project: Mapped[Project] = relationship(back_populates="gallery_images")
    media_asset: Mapped["MediaAsset"] = relationship(back_populates="gallery_images")


class ReviewLink(Base):
    __tablename__ = "review_links"

    token: Mapped[str] = mapped_column(String(50), primary_key=True)
    project_slug: Mapped[str] = mapped_column(
        String(160),
        ForeignKey("projects.slug", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    video_url: Mapped[str] = mapped_column(String(500), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    project: Mapped[Project] = relationship()


class ProjectFeedback(Base):
    __tablename__ = "project_feedbacks"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_slug: Mapped[str] = mapped_column(
        String(160),
        ForeignKey("projects.slug", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    video_url: Mapped[str | None] = mapped_column(String(500), nullable=True, index=True)
    user_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    guest_name: Mapped[str | None] = mapped_column(String(180), nullable=True)
    timecode: Mapped[float] = mapped_column(Float, nullable=False)
    position_x: Mapped[float] = mapped_column(Float, nullable=False)
    position_y: Mapped[float] = mapped_column(Float, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="Open")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    reply_content: Mapped[str | None] = mapped_column(Text, nullable=True)
    reply_author: Mapped[str | None] = mapped_column(String(100), nullable=True)
    reply_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


    project: Mapped[Project] = relationship()


class ProjectTask(Base):
    __tablename__ = "project_tasks"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    project_slug: Mapped[str] = mapped_column(
        String(160),
        ForeignKey("projects.slug", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    assignee_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    assignee_initials: Mapped[str | None] = mapped_column(Text, nullable=True)
    tag: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_by: Mapped[str] = mapped_column(String(180), nullable=False)
    deadline: Mapped[str | None] = mapped_column(String(50), nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="todo")
    priority: Mapped[str] = mapped_column(String(50), nullable=False, default="medium")

    project: Mapped[Project] = relationship()

    @property
    def project_title(self) -> str:
        return self.project.title if self.project else self.project_slug


class ApprovalRequest(Base):
    __tablename__ = "approval_requests"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    project_slug: Mapped[str] = mapped_column(
        String(160),
        ForeignKey("projects.slug", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    task_id: Mapped[str] = mapped_column(
        String(100),
        ForeignKey("project_tasks.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    crew_name: Mapped[str] = mapped_column(String(180), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="pending")
    timestamp: Mapped[str] = mapped_column(String(100), nullable=False)

    project: Mapped[Project] = relationship()
    task: Mapped[ProjectTask] = relationship()


class ProjectActivity(Base):
    __tablename__ = "project_activities"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_slug: Mapped[str] = mapped_column(
        String(160),
        ForeignKey("projects.slug", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_name: Mapped[str] = mapped_column(String(180), nullable=False)
    action: Mapped[str] = mapped_column(String(255), nullable=False)
    avatar: Mapped[str | None] = mapped_column(String(10), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    project: Mapped[Project] = relationship()


class ProjectComment(Base):
    __tablename__ = "project_comments"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_slug: Mapped[str] = mapped_column(
        String(160),
        ForeignKey("projects.slug", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_name: Mapped[str] = mapped_column(String(180), nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    avatar: Mapped[str | None] = mapped_column(String(10), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    project: Mapped[Project] = relationship()

class PhotoAlbum(Base):
    __tablename__ = "photo_albums"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    project_slug: Mapped[str] = mapped_column(
        String(160),
        ForeignKey("projects.slug", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    gdrive_folder_id: Mapped[str] = mapped_column(String(100), nullable=False)
    background_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    short_token: Mapped[str] = mapped_column(String(50), nullable=False, unique=True, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    project: Mapped[Project] = relationship()
    photos: Mapped[list["AlbumPhoto"]] = relationship("AlbumPhoto", back_populates="album", cascade="all, delete-orphan")


class AlbumPhoto(Base):
    __tablename__ = "album_photos"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    album_id: Mapped[str] = mapped_column(
        String(100),
        ForeignKey("photo_albums.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    file_id: Mapped[str] = mapped_column(String(100), nullable=False)
    thumbnail_url: Mapped[str] = mapped_column(Text, nullable=False)
    web_content_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    album: Mapped[PhotoAlbum] = relationship(back_populates="photos")
    interactions: Mapped[list["AlbumInteraction"]] = relationship("AlbumInteraction", back_populates="photo", cascade="all, delete-orphan")


class AlbumInteraction(Base):
    __tablename__ = "album_interactions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    photo_id: Mapped[str] = mapped_column(
        String(100),
        ForeignKey("album_photos.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    client_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    interaction_type: Mapped[str] = mapped_column(String(50), nullable=False) # 'like', 'star', 'comment'
    comment_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    photo: Mapped[AlbumPhoto] = relationship(back_populates="interactions")
