import os
import firebase_admin
from firebase_admin import credentials

_initialized = False


def init_firebase_admin():
    """Initialize Firebase Admin SDK. Call once at app startup."""
    global _initialized
    if _initialized:
        return

    # Try service account JSON file first
    service_account_path = os.getenv(
        "FIREBASE_SERVICE_ACCOUNT_PATH",
        os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "firebase-service-account.json"),
    )

    if os.path.exists(service_account_path):
        cred = credentials.Certificate(service_account_path)
        firebase_admin.initialize_app(cred)
    else:
        # Fallback: use Application Default Credentials or no-cred init
        # We MUST provide projectId for verify_id_token to work without credentials
        try:
            firebase_admin.initialize_app(options={"projectId": "system-204prod"})
        except Exception as e:
            # Minimal init — token verification won't work but app won't crash
            print(f"⚠️  Firebase Admin SDK: No credentials found. Token verification disabled. Error: {e}")
            print(f"   Expected service account at: {service_account_path}")
            return

    _initialized = True
    print("✅ Firebase Admin SDK initialized")
