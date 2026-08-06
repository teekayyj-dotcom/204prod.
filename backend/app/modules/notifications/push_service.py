import os
import json
from pywebpush import webpush, WebPushException
from sqlalchemy.orm import Session
from app.modules.notifications.crud import get_user_push_subscriptions

def send_web_push(db: Session, user_id: str, title: str, message: str, link: str = None):
    # Try getting from env, or fallback to local private_key.pem
    vapid_private_key = os.getenv("VAPID_PRIVATE_KEY", "private_key.pem")
    vapid_claims = {
        "sub": "mailto:admin@204prod.vn"
    }
    
    if not os.path.exists(vapid_private_key) and not vapid_private_key.startswith("-----BEGIN"):
        print("VAPID_PRIVATE_KEY not set or invalid. Cannot send web push.")
        return
        
    subs = get_user_push_subscriptions(db, user_id)
    if not subs:
        return
        
    payload = json.dumps({
        "title": title,
        "body": message,
        "url": link or "/"
    })
    
    for sub in subs:
        try:
            webpush(
                subscription_info={
                    "endpoint": sub.endpoint,
                    "keys": {
                        "p256dh": sub.p256dh,
                        "auth": sub.auth
                    }
                },
                data=payload,
                vapid_private_key=vapid_private_key,
                vapid_claims=vapid_claims
            )
        except WebPushException as ex:
            # If subscription is expired or invalid, delete it from DB
            if ex.response is not None and ex.response.status_code in [404, 410]:
                db.delete(sub)
                db.commit()
            print(f"Web Push failed for user {user_id}: {repr(ex)}")
        except Exception as e:
            print(f"Web Push unknown error: {e}")
