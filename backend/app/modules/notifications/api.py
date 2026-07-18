from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db_session
from app.modules.notifications import crud, schemas
from typing import List
from fastapi import WebSocket, WebSocketDisconnect
from app.modules.notifications.manager import manager

router = APIRouter()

# In a real app you'd get user_id from auth token. 
# We'll pass it as query param or get it from context for this demo app.

@router.get("", response_model=List[schemas.NotificationResponse])
def get_notifications(user_id: str, db: Session = Depends(get_db_session)):
    """Fetch notifications for a user."""
    return crud.get_user_notifications(db, user_id=user_id)

@router.get("/unread-count")
def get_unread_notifications_count(user_id: str, db: Session = Depends(get_db_session)):
    """Get count of unread notifications."""
    count = crud.get_unread_count(db, user_id=user_id)
    return {"unread_count": count}

@router.put("/{notification_id}/read", response_model=schemas.NotificationResponse)
def mark_notification_read(notification_id: int, user_id: str, db: Session = Depends(get_db_session)):
    """Mark a specific notification as read."""
    return crud.mark_as_read(db, notification_id=notification_id, user_id=user_id)

@router.put("/read-all")
def mark_all_notifications_read(user_id: str, db: Session = Depends(get_db_session)):
    """Mark all notifications as read for a user."""
    updated = crud.mark_all_as_read(db, user_id=user_id)
    return {"updated": updated}

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(websocket, user_id)
    try:
        while True:
            # Keep connection open and listen for pings/messages if needed
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)

