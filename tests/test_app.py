from fastapi.testclient import TestClient
import pytest

from src import app as app_module


@pytest.fixture
def client():
    return TestClient(app_module.app)


def test_get_activities(client):
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    # Expect some known activities from the in-memory data
    assert "Chess Club" in data
    assert isinstance(data["Chess Club"]["participants"], list)


def test_signup_and_unregister_flow(client):
    activity = "Chess Club"
    email = "test.student@mergington.edu"

    # Ensure email not already registered
    r = client.get("/activities")
    assert r.status_code == 200
    participants = r.json()[activity]["participants"]
    if email in participants:
        # Remove if present to start fresh
        client.delete(f"/activities/{activity}/signup", params={"email": email})

    # Sign up
    resp = client.post(f"/activities/{activity}/signup", params={"email": email})
    assert resp.status_code == 200
    assert "Signed up" in resp.json().get("message", "")

    # Confirm participant now present
    r = client.get("/activities")
    assert email in r.json()[activity]["participants"]

    # Unregister
    resp = client.delete(f"/activities/{activity}/signup", params={"email": email})
    assert resp.status_code == 200
    assert "Unregistered" in resp.json().get("message", "")

    # Confirm removed
    r = client.get("/activities")
    assert email not in r.json()[activity]["participants"]
