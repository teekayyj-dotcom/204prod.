from app.main import app
from fastapi.testclient import TestClient


client = TestClient(app)


def test_list_projects():
    response = client.get("/api/v1/projects")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
