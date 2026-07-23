from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class AttachmentBase(BaseModel):
    file_url: str
    file_type: str
    file_name: str
    size: int


class AttachmentCreate(AttachmentBase):
    pass


class AttachmentOut(AttachmentBase):
    id: int
    message_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MessageBase(BaseModel):
    content: Optional[str] = None


class MessageCreate(MessageBase):
    conversation_id: int
    attachments: Optional[List[AttachmentCreate]] = None


class PollVoteOut(BaseModel):
    id: int
    message_id: int
    user_id: int
    option_id: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class MessageOut(MessageBase):
    id: int
    conversation_id: int
    sender_id: int
    sender_name: Optional[str] = None
    created_at: datetime
    message_type: str = "text"
    metadata_json: Optional[dict] = None
    attachments: List[AttachmentOut] = Field(default_factory=list)
    poll_votes: List[PollVoteOut] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class ConversationParticipantBase(BaseModel):
    user_id: int


class ConversationParticipantCreate(ConversationParticipantBase):
    pass


class ConversationParticipantOut(ConversationParticipantBase):
    id: int
    conversation_id: int
    joined_at: datetime
    last_read_message_id: Optional[int] = None
    display_name: Optional[str] = None
    role: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ContactOut(BaseModel):
    id: int
    display_name: Optional[str] = None
    role: str
    avatar_url: Optional[str] = None


class ConversationBase(BaseModel):
    is_group: bool = False
    name: Optional[str] = None
    avatar_url: Optional[str] = None


class ConversationCreate(ConversationBase):
    participant_ids: List[int]


class ConversationAvatarUpdate(BaseModel):
    avatar_url: str


class ConversationOut(ConversationBase):
    id: int
    created_at: datetime
    participants: List[ConversationParticipantOut] = Field(default_factory=list)
    last_message: Optional[MessageOut] = None
    unread_count: int = 0

    model_config = ConfigDict(from_attributes=True)
