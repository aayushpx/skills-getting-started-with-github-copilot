from fastapi.testclient import TestClient

from src import app as app_module


client = TestClient(app_module.app)


def setup_function():
    app_module.activities["Chess Club"]["participants"] = [
        "michael@mergington.edu",
        "daniel@mergington.edu",
    ]


def test_activities_endpoint_is_not_cached():
    response = client.get("/activities")

    assert response.status_code == 200
    assert "no-store" in response.headers.get("Cache-Control", "")


def test_unregister_participant_removes_email_from_activity():
    response = client.delete(
        "/activities/Chess Club/participants/michael@mergington.edu"
    )

    assert response.status_code == 200
    assert response.json()["message"] == "Removed michael@mergington.edu from Chess Club"

    activities_response = client.get("/activities")
    chess_club = activities_response.json()["Chess Club"]
    assert "michael@mergington.edu" not in chess_club["participants"]
