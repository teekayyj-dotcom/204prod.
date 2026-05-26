from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.modules.projects.models import Project


class Category(Base):
    __tablename__ = "categories"

    slug: Mapped[str] = mapped_column(String(120), primary_key=True)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    type: Mapped[str] = mapped_column(String(80), nullable=False, default="format")
    description: Mapped[str] = mapped_column(String(1000), nullable=True)

    projects: Mapped[list["Project"]] = relationship(back_populates="format_category")
