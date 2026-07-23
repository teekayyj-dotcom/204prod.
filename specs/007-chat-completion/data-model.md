# Data Model: Chat Completion & Phase 2 Enhancements

## 1. Schema Changes

### `messaging_conversations` Table
(Already implemented in Phase 1)
```python
class Conversation(Base):
    __tablename__ = "messaging_conversations"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    is_group: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
```

### `messaging_messages` Table
We need to support new types of messages: standard text, polls, and deadlines.

```python
class Message(Base):
    __tablename__ = "messaging_messages"
    # Existing fields...
    id: Mapped[int] = mapped_column(...)
    content: Mapped[Optional[str]] = mapped_column(...)
    
    # NEW FIELDS for Phase 2
    message_type: Mapped[str] = mapped_column(String(50), default="text", nullable=False) # 'text', 'poll', 'deadline'
    metadata_json: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True) # stores poll options, deadline timestamp
```

### NEW: `messaging_poll_votes` Table
To track user votes on poll messages.
```python
class PollVote(Base):
    __tablename__ = "messaging_poll_votes"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    message_id: Mapped[int] = mapped_column(ForeignKey("messaging_messages.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    option_id: Mapped[str] = mapped_column(String(100), nullable=False) # Links to an option in metadata_json
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
```

## 2. API Response Models

### `MessageSchema` Updates
```python
class MessageOut(BaseModel):
    id: int
    content: Optional[str]
    message_type: str = "text"
    metadata_json: Optional[dict] = None
    # ... other fields
```

### `UploadMedia` Optimization
When calling the upload endpoint, the frontend needs to specify the `conversation_id` so the backend can route it correctly in R2.
```python
# API Endpoint: POST /api/messaging/{conversation_id}/upload
```
