import requests
import jwt
from datetime import datetime, timedelta

# Create token for User 1
payload = {
    "sub": "1",
    "role": "admin",
    "exp": datetime.utcnow() + timedelta(days=1)
}
token = jwt.encode(payload, "secret", algorithm="HS256")

# Assuming JWT_SECRET is secret, let's just read it from backend/.env if possible.
# Actually I'll just print out the logic in the backend
