#!/bin/sh
set -e

# Wait for MySQL to be ready
echo "Waiting for MySQL..."
python -c '
import socket
import time
for i in range(30):
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.connect(("mysql", 3306))
        s.close()
        print("MySQL is ready!")
        break
    except Exception:
        time.sleep(1)
'

# Run migrations
alembic upgrade head

# Start application
if [ $# -eq 0 ]; then
  exec uvicorn app.main:app --host 0.0.0.0 --port 8000
else
  exec "$@"
fi
