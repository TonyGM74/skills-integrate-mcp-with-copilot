"""
Tests for the High School Management System API
Testing the unsubscription functionality
"""

from fastapi.testclient import TestClient
from src.app import app, activities
import pytest


@pytest.fixture(autouse=True)
def reset_activities():
    """Reset activities data before each test"""
    # Store original state
    original = {
        "Chess Club": {
            "description": "Learn strategies and compete in chess tournaments",
            "schedule": "Fridays, 3:30 PM - 5:00 PM",
            "max_participants": 12,
            "participants": ["michael@mergington.edu", "daniel@mergington.edu"]
        },
        "Programming Class": {
            "description": "Learn programming fundamentals and build software projects",
            "schedule": "Tuesdays and Thursdays, 3:30 PM - 4:30 PM",
            "max_participants": 20,
            "participants": ["emma@mergington.edu", "sophia@mergington.edu"]
        },
    }
    
    # Reset to original state
    for activity_name, activity_data in original.items():
        if activity_name in activities:
            activities[activity_name]["participants"] = activity_data["participants"].copy()
    
    yield
    
    # Cleanup after test
    for activity_name, activity_data in original.items():
        if activity_name in activities:
            activities[activity_name]["participants"] = activity_data["participants"].copy()


client = TestClient(app)


def test_unregister_student_success():
    """Test successful unsubscription of a student from an activity"""
    # Ensure student is enrolled first
    activity_name = "Chess Club"
    email = "michael@mergington.edu"
    
    # Verify student is enrolled
    response = client.get("/activities")
    assert response.status_code == 200
    assert email in response.json()[activity_name]["participants"]
    
    # Unregister the student
    response = client.delete(
        f"/activities/{activity_name}/unregister",
        params={"email": email}
    )
    
    assert response.status_code == 200
    assert response.json() == {"message": f"Unregistered {email} from {activity_name}"}
    
    # Verify student is no longer enrolled
    response = client.get("/activities")
    assert response.status_code == 200
    assert email not in response.json()[activity_name]["participants"]


def test_unregister_student_not_enrolled():
    """Test unsubscription fails when student is not enrolled"""
    activity_name = "Chess Club"
    email = "notregistered@mergington.edu"
    
    response = client.delete(
        f"/activities/{activity_name}/unregister",
        params={"email": email}
    )
    
    assert response.status_code == 400
    assert response.json()["detail"] == "Student is not signed up for this activity"


def test_unregister_from_nonexistent_activity():
    """Test unsubscription fails when activity doesn't exist"""
    activity_name = "Nonexistent Activity"
    email = "student@mergington.edu"
    
    response = client.delete(
        f"/activities/{activity_name}/unregister",
        params={"email": email}
    )
    
    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"


def test_signup_and_unregister_flow():
    """Test complete flow: signup then unregister"""
    activity_name = "Programming Class"
    email = "newstudent@mergington.edu"
    
    # Sign up the student
    response = client.post(
        f"/activities/{activity_name}/signup",
        params={"email": email}
    )
    assert response.status_code == 200
    
    # Verify student is enrolled
    response = client.get("/activities")
    assert email in response.json()[activity_name]["participants"]
    
    # Unregister the student
    response = client.delete(
        f"/activities/{activity_name}/unregister",
        params={"email": email}
    )
    assert response.status_code == 200
    
    # Verify student is no longer enrolled
    response = client.get("/activities")
    assert email not in response.json()[activity_name]["participants"]


def test_get_activities():
    """Test that we can retrieve all activities"""
    response = client.get("/activities")
    assert response.status_code == 200
    data = response.json()
    assert "Chess Club" in data
    assert "Programming Class" in data
    assert isinstance(data["Chess Club"]["participants"], list)


def test_signup_for_activity():
    """Test that signup functionality works"""
    activity_name = "Math Club"
    email = "newmath@mergington.edu"
    
    response = client.post(
        f"/activities/{activity_name}/signup",
        params={"email": email}
    )
    assert response.status_code == 200
    assert response.json()["message"] == f"Signed up {email} for {activity_name}"
    
    # Verify enrollment
    response = client.get("/activities")
    assert email in response.json()[activity_name]["participants"]
