from sqlalchemy.orm import Session
from app.modules.notifications.models import Notification
from app.modules.notifications.schemas import NotificationCreate

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
