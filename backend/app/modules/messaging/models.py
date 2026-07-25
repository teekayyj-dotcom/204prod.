from datetime import datetime
from typing import List, Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Conversation(Base):
    __tablename__ = "messaging_conversations"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    is_group: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    participants = relationship("ConversationParticipant", back_populates="conversation")
    messages = relationship("Message", back_populates="conversation")


class ConversationParticipant(Base):
    __tablename__ = "messaging_participants"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    conversation_id: Mapped[int] = mapped_column(ForeignKey("messaging_conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    last_read_message_id: Mapped[Optional[int]] = mapped_column(ForeignKey("messaging_messages.id", ondelete="SET NULL"), nullable=True)

    conversation = relationship("Conversation", back_populates="participants")
    user = relationship("User")

    @property
    def display_name(self):
        return self.user.display_name if self.user else None

    @property
    def role(self):
        return self.user.role if self.user else None

    @property
    def avatar_url(self):
        return self.user.avatar_url if self.user else None


class Message(Base):
    __tablename__ = "messaging_messages"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    conversation_id: Mapped[int] = mapped_column(ForeignKey("messaging_conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    
    message_type: Mapped[str] = mapped_column(String(50), default="text", nullable=False)
    metadata_json: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    conversation = relationship("Conversation", back_populates="messages")
    sender = relationship("User")
    attachments = relationship("Attachment", back_populates="message", cascade="all, delete-orphan")
    poll_votes = relationship("PollVote", back_populates="message", cascade="all, delete-orphan")

    @property
    def sender_name(self):
        return self.sender.display_name if self.sender else None


class Attachment(Base):
    __tablename__ = "messaging_attachments"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    message_id: Mapped[int] = mapped_column(ForeignKey("messaging_messages.id", ondelete="CASCADE"), nullable=False, index=True)
    file_url: Mapped[str] = mapped_column(String(1000), nullable=False)
    file_type: Mapped[str] = mapped_column(String(100), nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    size: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    message = relationship("Message", back_populates="attachments")

class PollVote(Base):
    __tablename__ = "messaging_poll_votes"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    message_id: Mapped[int] = mapped_column(ForeignKey("messaging_messages.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    option_id: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    message = relationship("Message", back_populates="poll_votes")
    user = relationship("User")
