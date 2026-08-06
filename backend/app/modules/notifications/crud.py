from sqlalchemy.orm import Session
from app.modules.notifications.models import Notification
from app.modules.notifications.schemas import NotificationCreate, NotificationResponse
from app.modules.notifications.manager import manager

def create_notification(db: Session, notif: NotificationCreate):
    db_notif = Notification(
        user_id=notif.user_id,
        type=notif.type,
        title=notif.title,
        message=notif.message,
        link=notif.link,
        is_read=notif.is_read
    )
    db.add(db_notif)
    db.commit()
    db.refresh(db_notif)
    
    # Notify connected clients via websocket
    try:
        payload = NotificationResponse.model_validate(db_notif).model_dump(mode='json')
        manager.send_personal_message_sync(payload, notif.user_id)
    except Exception as e:
        print(f"WS notification failed: {e}")
        
    # Send Web Push
    try:
        from app.modules.notifications.push_service import send_web_push
        send_web_push(
            db=db,
            user_id=notif.user_id,
            title=notif.title,
            message=notif.message,
            link=notif.link
        )
    except Exception as e:
        print(f"Web Push invocation failed: {e}")
        
    return db_notif

def get_user_notifications(db: Session, user_id: str, limit: int = 50):
    return db.query(Notification).filter(Notification.user_id == user_id).order_by(Notification.created_at.desc()).limit(limit).all()

def get_unread_count(db: Session, user_id: str):
    return db.query(Notification).filter(Notification.user_id == user_id, Notification.is_read == False).count()

def mark_as_read(db: Session, notification_id: int, user_id: str):
    db_notif = db.query(Notification).filter(Notification.id == notification_id, Notification.user_id == user_id).first()
    if db_notif:
        db_notif.is_read = True
        db.commit()
        db.refresh(db_notif)
    return db_notif

def mark_all_as_read(db: Session, user_id: str):
    updated = db.query(Notification).filter(Notification.user_id == user_id, Notification.is_read == False).update({"is_read": True})
    db.commit()
    return updated

from app.modules.notifications.models import PushSubscription
from app.modules.notifications.schemas import PushSubscriptionCreate

def create_push_subscription(db: Session, sub: PushSubscriptionCreate):
    existing = db.query(PushSubscription).filter(PushSubscription.endpoint == sub.endpoint).first()
    if existing:
        existing.user_id = sub.user_id
        existing.p256dh = sub.keys.p256dh
        existing.auth = sub.keys.auth
        db.commit()
        db.refresh(existing)
        return existing
        
    db_sub = PushSubscription(
        user_id=sub.user_id,
        endpoint=sub.endpoint,
        p256dh=sub.keys.p256dh,
        auth=sub.keys.auth
    )
    db.add(db_sub)
    db.commit()
    db.refresh(db_sub)
    return db_sub

def get_user_push_subscriptions(db: Session, user_id: str):
    return db.query(PushSubscription).filter(PushSubscription.user_id == user_id).all()
