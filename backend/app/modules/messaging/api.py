from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, desc

from app.db.session import get_db_session
from app.modules.users.models import User
from app.shared.dependencies.auth import require_auth_token
from app.core.security import decode_access_token
from app.core.storage import upload_file_to_r2, upload_video_to_bunny
from io import BytesIO
from PIL import Image

from .models import Conversation, ConversationParticipant, Message, Attachment
from .schemas import (
    ConversationOut, 
    ConversationCreate, 
    MessageOut, 
    MessageCreate,
    AttachmentBase,
    AttachmentOut,
    ContactOut,
    ConversationAvatarUpdate,
    ConversationParticipantCreate
)
from .websockets import manager

router = APIRouter(prefix="/messaging", tags=["messaging"])


@router.get("/conversations", response_model=List[ConversationOut])
def get_conversations(
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_auth_token)
):
    # Get conversations where the user is a participant
    participants = db.query(ConversationParticipant).filter(
        ConversationParticipant.user_id == current_user.id
    ).all()
    conversation_ids = [p.conversation_id for p in participants]

    conversations = db.query(Conversation).options(
        joinedload(Conversation.participants).joinedload(ConversationParticipant.user)
    ).filter(
        Conversation.id.in_(conversation_ids)
    ).all()

    # Calculate unread counts and last messages
    results = []
    for conv in conversations:
        last_msg = db.query(Message).options(
            joinedload(Message.sender), 
            joinedload(Message.poll_votes)
        ).filter(Message.conversation_id == conv.id).order_by(desc(Message.created_at)).first()
        
        part = next((p for p in conv.participants if p.user_id == current_user.id), None)
        unread_count = 0
        if part:
            if part.last_read_message_id:
                unread_count = db.query(Message).filter(Message.conversation_id == conv.id, Message.id > part.last_read_message_id).count()
            else:
                unread_count = db.query(Message).filter(Message.conversation_id == conv.id).count()

        conv_out = ConversationOut.model_validate(conv)
        if last_msg:
            conv_out.last_message = MessageOut.model_validate(last_msg)
        conv_out.unread_count = unread_count
        results.append(conv_out)

    return results


@router.get("/conversations/{conversation_id}", response_model=ConversationOut)
def get_conversation(
    conversation_id: int,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_auth_token)
):
    part = db.query(ConversationParticipant).filter_by(
        conversation_id=conversation_id, user_id=current_user.id
    ).first()
    if not part:
        raise HTTPException(status_code=403, detail="Not a participant in this conversation.")

    conv = db.query(Conversation).options(
        joinedload(Conversation.participants).joinedload(ConversationParticipant.user)
    ).filter_by(id=conversation_id).first()
    
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    last_msg = db.query(Message).options(
        joinedload(Message.sender),
        joinedload(Message.poll_votes)
    ).filter(Message.conversation_id == conv.id).order_by(desc(Message.created_at)).first()
    
    unread_count = 0
    if part.last_read_message_id:
        unread_count = db.query(Message).filter(Message.conversation_id == conv.id, Message.id > part.last_read_message_id).count()
    else:
        unread_count = db.query(Message).filter(Message.conversation_id == conv.id).count()

    conv_out = ConversationOut.model_validate(conv)
    if last_msg:
        conv_out.last_message = MessageOut.model_validate(last_msg)
    conv_out.unread_count = unread_count
        
    return conv_out


@router.post("/conversations", response_model=ConversationOut)
def create_conversation(
    payload: ConversationCreate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_auth_token)
):
    # Ensure current user is in participants
    participant_ids = set(payload.participant_ids)
    participant_ids.add(current_user.id)

    # For 1-on-1, check if conversation already exists
    if not payload.is_group and len(participant_ids) == 2:
        user_list = list(participant_ids)
        existing = db.query(Conversation).join(ConversationParticipant).filter(
            Conversation.is_group == False
        ).filter(
            ConversationParticipant.user_id.in_(user_list)
        ).group_by(Conversation.id).having(db.func.count() == 2).first()
        if existing:
            return existing

    conv = Conversation(is_group=payload.is_group, name=payload.name)
    db.add(conv)
    db.commit()
    db.refresh(conv)

    for uid in participant_ids:
        part = ConversationParticipant(conversation_id=conv.id, user_id=uid)
        db.add(part)
    
    db.commit()
    
    # Reload with participants and users eager loaded
    conv_reloaded = db.query(Conversation).options(
        joinedload(Conversation.participants).joinedload(ConversationParticipant.user)
    ).filter(Conversation.id == conv.id).first()
    
    return conv_reloaded


@router.get("/conversations/{conversation_id}/messages", response_model=List[MessageOut])
def get_messages(
    conversation_id: int,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_auth_token)
):
    # Verify participant
    part = db.query(ConversationParticipant).filter_by(
        conversation_id=conversation_id, user_id=current_user.id
    ).first()
    if not part:
        raise HTTPException(status_code=403, detail="Not a participant in this conversation.")

    messages = db.query(Message).options(
        joinedload(Message.sender),
        joinedload(Message.poll_votes)
    ).filter_by(
        conversation_id=conversation_id
    ).order_by(Message.created_at.desc()).offset(offset).limit(limit).all()
    
    # Return chronologically
    return messages[::-1]


@router.get("/conversations/{conversation_id}/media", response_model=List[AttachmentOut])
def get_conversation_media(
    conversation_id: int,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_auth_token)
):
    # Verify participant
    part = db.query(ConversationParticipant).filter_by(
        conversation_id=conversation_id, user_id=current_user.id
    ).first()
    if not part:
        raise HTTPException(status_code=403, detail="Not a participant in this conversation.")

    # Get all attachments for the conversation
    attachments = db.query(Attachment).join(Message).filter(
        Message.conversation_id == conversation_id
    ).order_by(desc(Attachment.created_at)).all()
    
    return attachments


class ConversationNameUpdate(BaseModel):
    name: str

@router.patch("/conversations/{conversation_id}/name", response_model=ConversationOut)
def update_conversation_name(
    conversation_id: int,
    payload: ConversationNameUpdate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_auth_token)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can rename groups")
        
    part = db.query(ConversationParticipant).filter_by(
        conversation_id=conversation_id, user_id=current_user.id
    ).first()
    if not part:
        raise HTTPException(status_code=403, detail="Not a participant in this conversation.")
        
    conv = db.query(Conversation).filter_by(id=conversation_id).first()
    if not conv or not conv.is_group:
        raise HTTPException(status_code=404, detail="Group conversation not found")
        
    conv.name = payload.name
    db.commit()
    db.refresh(conv)
    
    # Reload with participants
    conv_reloaded = db.query(Conversation).options(
        joinedload(Conversation.participants).joinedload(ConversationParticipant.user)
    ).filter(Conversation.id == conv.id).first()
    
    last_msg = db.query(Message).options(
        joinedload(Message.sender),
        joinedload(Message.poll_votes)
    ).filter(Message.conversation_id == conv.id).order_by(desc(Message.created_at)).first()
    
    unread_count = 0
    if part.last_read_message_id:
        unread_count = db.query(Message).filter(Message.conversation_id == conv.id, Message.id > part.last_read_message_id).count()
    else:
        unread_count = db.query(Message).filter(Message.conversation_id == conv.id).count()

    conv_out = ConversationOut.model_validate(conv_reloaded)
    if last_msg:
        conv_out.last_message = MessageOut.model_validate(last_msg)
    conv_out.unread_count = unread_count
    
    return conv_out


class ParticipantsAdd(BaseModel):
    participant_ids: List[int]

@router.post("/conversations/{conversation_id}/participants", response_model=ConversationOut)
def add_participants(
    conversation_id: int,
    payload: ParticipantsAdd,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_auth_token)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can add participants")
        
    part = db.query(ConversationParticipant).filter_by(
        conversation_id=conversation_id, user_id=current_user.id
    ).first()
    if not part:
        raise HTTPException(status_code=403, detail="Not a participant in this conversation.")
        
    conv = db.query(Conversation).filter_by(id=conversation_id).first()
    if not conv or not conv.is_group:
        raise HTTPException(status_code=404, detail="Group conversation not found")
        
    existing = db.query(ConversationParticipant).filter_by(conversation_id=conv.id).all()
    existing_ids = {p.user_id for p in existing}
    
    for uid in payload.participant_ids:
        if uid not in existing_ids:
            new_part = ConversationParticipant(conversation_id=conv.id, user_id=uid)
            db.add(new_part)
            
    db.commit()
    
    # Reload with participants
    conv_reloaded = db.query(Conversation).options(
        joinedload(Conversation.participants).joinedload(ConversationParticipant.user)
    ).filter(Conversation.id == conv.id).first()
    
    last_msg = db.query(Message).options(
        joinedload(Message.sender),
        joinedload(Message.poll_votes)
    ).filter(Message.conversation_id == conv.id).order_by(desc(Message.created_at)).first()
    
    unread_count = 0
    if part.last_read_message_id:
        unread_count = db.query(Message).filter(Message.conversation_id == conv.id, Message.id > part.last_read_message_id).count()
    else:
        unread_count = db.query(Message).filter(Message.conversation_id == conv.id).count()

    conv_out = ConversationOut.model_validate(conv_reloaded)
    if last_msg:
        conv_out.last_message = MessageOut.model_validate(last_msg)
    conv_out.unread_count = unread_count
    
    return conv_out

@router.patch("/conversations/{conversation_id}/avatar", response_model=ConversationOut)
def update_conversation_avatar(
    conversation_id: int,
    payload: ConversationAvatarUpdate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_auth_token)
):
    # Verify participant
    part = db.query(ConversationParticipant).filter_by(
        conversation_id=conversation_id, user_id=current_user.id
    ).first()
    if not part:
        raise HTTPException(status_code=403, detail="Not a participant in this conversation.")
        
    conv = db.query(Conversation).filter_by(id=conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    conv.avatar_url = payload.avatar_url
    db.commit()
    db.refresh(conv)
    
    # Reload with participants
    conv_reloaded = db.query(Conversation).options(
        joinedload(Conversation.participants).joinedload(ConversationParticipant.user)
    ).filter(Conversation.id == conv.id).first()
    
    last_msg = db.query(Message).options(joinedload(Message.sender)).filter(Message.conversation_id == conv.id).order_by(desc(Message.created_at)).first()
    unread_count = 0
    if part.last_read_message_id:
        unread_count = db.query(Message).filter(Message.conversation_id == conv.id, Message.id > part.last_read_message_id).count()
    else:
        unread_count = db.query(Message).filter(Message.conversation_id == conv.id).count()

    conv_out = ConversationOut.model_validate(conv_reloaded)
    if last_msg:
        conv_out.last_message = MessageOut.model_validate(last_msg)
    conv_out.unread_count = unread_count
    
    return conv_out


@router.post("/conversations/{conversation_id}/upload", response_model=AttachmentBase)
async def upload_file(
    conversation_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_auth_token)
):
    # Verify participant
    part = db.query(ConversationParticipant).filter_by(
        conversation_id=conversation_id, user_id=current_user.id
    ).first()
    if not part:
        raise HTTPException(status_code=403, detail="Not a participant in this conversation.")

    try:
        content_type = file.content_type or "application/octet-stream"
        url = ""
        file_name = file.filename or "uploaded_file"
        
        # 1. Video upload to Bunny
        if content_type.startswith("video/"):
            url = await upload_video_to_bunny(file)
            
        # 2. Image upload to R2 with WebP conversion
        elif content_type.startswith("image/") and "svg" not in content_type:
            img = Image.open(file.file)
            buffer = BytesIO()
            img.save(buffer, format="WEBP")
            buffer.seek(0)
            
            # Create a new UploadFile with the webp data
            class DummyFile:
                def __init__(self, buf):
                    self.buf = buf
                def seek(self, *args):
                    return self.buf.seek(*args)
                def read(self, *args):
                    return self.buf.read(*args)
                    
            webp_file = UploadFile(
                filename=file_name.rsplit(".", 1)[0] + ".webp",
                file=DummyFile(buffer),
                headers={"content-type": "image/webp"}
            )
            url = await upload_file_to_r2(webp_file, folder=f"messaging/chat_{conversation_id}/images")
            content_type = "image/webp"
            file_name = webp_file.filename
            file.file = buffer # for size calculation
            
        # 3. Normal file upload to R2
        else:
            url = await upload_file_to_r2(file, folder=f"messaging/chat_{conversation_id}/files")
            
        size = 0
        file.file.seek(0, 2)
        size = file.file.tell()
        
        return AttachmentBase(
            file_url=url,
            file_type=content_type,
            file_name=file_name,
            size=size
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/contacts", response_model=List[ContactOut])
def get_contacts(
    q: str = "",
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_auth_token)
):
    query = db.query(User).filter(
        User.active == True, 
        User.id != current_user.id,
        User.role.in_(["admin", "crew", "outsource"])
    )
    if q:
        query = query.filter(User.display_name.ilike(f"%{q}%"))
    users = query.all()
    return users


async def get_ws_user(token: str, db: Session) -> User:
    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if not user_id:
            return None
        return db.query(User).filter(User.id == user_id).first()
    except Exception:
        return None


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str, db: Session = Depends(get_db_session)):
    user = await get_ws_user(token, db)
    if not user:
        await websocket.close(code=1008)
        return

    await manager.connect(websocket, user.id)
    try:
        while True:
            data = await websocket.receive_json()
            
            # Example incoming data handling:
            # { "type": "send_message", "conversation_id": 1, "content": "Hello", "attachments": [...] }
            # { "type": "typing_start", "conversation_id": 1 }
            # { "type": "read_receipt", "conversation_id": 1, "message_id": 10 }
            
            msg_type = data.get("type")
            conv_id = data.get("conversation_id")
            
            if msg_type == "send_message" and conv_id:
                # Save message to DB
                new_msg = Message(
                    conversation_id=conv_id,
                    sender_id=user.id,
                    content=data.get("content"),
                    message_type=data.get("message_type", "text"),
                    metadata_json=data.get("metadata_json")
                )
                db.add(new_msg)
                db.commit()
                db.refresh(new_msg)
                
                atts = data.get("attachments", [])
                for att in atts:
                    db_att = Attachment(
                        message_id=new_msg.id,
                        file_url=att.get("file_url"),
                        file_type=att.get("file_type"),
                        file_name=att.get("file_name"),
                        size=att.get("size", 0)
                    )
                    db.add(db_att)
                if atts:
                    db.commit()
                    db.refresh(new_msg)

                # Broadcast to all participants
                participants = db.query(ConversationParticipant).filter_by(conversation_id=conv_id).all()
                p_ids = [p.user_id for p in participants]
                
                broadcast_data = {
                    "type": "new_message",
                    "conversation_id": conv_id,
                    "message": {
                        "id": new_msg.id,
                        "conversation_id": new_msg.conversation_id,
                        "sender_id": new_msg.sender_id,
                        "sender_name": user.display_name,
                        "content": new_msg.content,
                        "message_type": new_msg.message_type,
                        "metadata_json": new_msg.metadata_json,
                        "created_at": new_msg.created_at.isoformat(),
                        "attachments": [
                            {
                                "id": a.id,
                                "file_url": a.file_url,
                                "file_type": a.file_type,
                                "file_name": a.file_name,
                                "size": a.size
                            } for a in new_msg.attachments
                        ]
                    }
                }
                await manager.broadcast_to_users(broadcast_data, p_ids)

            elif msg_type in ["typing_start", "typing_stop"] and conv_id:
                participants = db.query(ConversationParticipant).filter_by(conversation_id=conv_id).all()
                p_ids = [p.user_id for p in participants if p.user_id != user.id]
                await manager.broadcast_to_users({
                    "type": msg_type,
                    "conversation_id": conv_id,
                    "user_id": user.id
                }, p_ids)
                
            elif msg_type == "read_receipt" and conv_id:
                msg_id = data.get("message_id")
                if msg_id:
                    part = db.query(ConversationParticipant).filter_by(
                        conversation_id=conv_id, user_id=user.id
                    ).first()
                    if part:
                        part.last_read_message_id = msg_id
                        db.commit()
                        
                    participants = db.query(ConversationParticipant).filter_by(conversation_id=conv_id).all()
                    p_ids = [p.user_id for p in participants if p.user_id != user.id]
                    await manager.broadcast_to_users({
                        "type": "read_receipt",
                        "conversation_id": conv_id,
                        "user_id": user.id,
                        "message_id": msg_id
                    }, p_ids)

            elif msg_type == "poll_vote" and conv_id:
                msg_id = data.get("message_id")
                option_id = data.get("option_id")
                if msg_id and option_id:
                    from .models import PollVote
                    # Check if already voted by this user on this message
                    existing_vote = db.query(PollVote).filter_by(message_id=msg_id, user_id=user.id).first()
                    if existing_vote:
                        existing_vote.option_id = option_id
                    else:
                        new_vote = PollVote(message_id=msg_id, user_id=user.id, option_id=option_id)
                        db.add(new_vote)
                    db.commit()
                    
                    participants = db.query(ConversationParticipant).filter_by(conversation_id=conv_id).all()
                    p_ids = [p.user_id for p in participants]
                    await manager.broadcast_to_users({
                        "type": "poll_vote",
                        "conversation_id": conv_id,
                        "message_id": msg_id,
                        "user_id": user.id,
                        "option_id": option_id
                    }, p_ids)

    except WebSocketDisconnect:
        manager.disconnect(websocket, user.id)
        # Check if no more connections for this user, then broadcast offline
        if user.id not in manager.active_connections:
            await manager.broadcast_offline(user.id)
