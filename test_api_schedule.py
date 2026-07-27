from fastapi.testclient import TestClient
import sys
sys.path.append('backend')
from app.main import app

client = TestClient(app)

payload = {
    "employee_id": 12,
    "employee_name": "Tuấn Kiệt",
    "avatar": "",
    "week_start_date": "2026-07-27",
    "schedule_data": {"2026-07-27": ["morning", "afternoon"]}
}

response = client.post("/api/v1/hr/work-schedules", json=payload)
print(response.status_code)
print(response.json())
