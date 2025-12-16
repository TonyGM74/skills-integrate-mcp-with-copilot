"""
Test cases for the student enrollment feature
"""
from fastapi.testclient import TestClient
from src.app import app, activities
import pytest

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_activities():
    """Reset activities to initial state before each test"""
    # Save initial state
    initial_state = {
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
        "Gym Class": {
            "description": "Physical education and sports activities",
            "schedule": "Mondays, Wednesdays, Fridays, 2:00 PM - 3:00 PM",
            "max_participants": 30,
            "participants": ["john@mergington.edu", "olivia@mergington.edu"]
        }
    }
    
    # Reset to initial state before each test
    activities.clear()
    activities.update(initial_state)
    
    yield


def test_signup_for_activity_success():
    """Test successful signup for an activity"""
    response = client.post(
        "/activities/Chess Club/signup?email=newstudent@mergington.edu"
    )
    
    assert response.status_code == 200
    assert response.json() == {
        "message": "Signed up newstudent@mergington.edu for Chess Club"
    }
    assert "newstudent@mergington.edu" in activities["Chess Club"]["participants"]


def test_signup_for_nonexistent_activity():
    """Test signup for an activity that doesn't exist"""
    response = client.post(
        "/activities/NonExistentActivity/signup?email=student@mergington.edu"
    )
    
    assert response.status_code == 404
    assert response.json() == {"detail": "Activity not found"}


def test_signup_for_already_enrolled_student():
    """Test signup for a student who is already enrolled"""
    response = client.post(
        "/activities/Chess Club/signup?email=michael@mergington.edu"
    )
    
    assert response.status_code == 400
    assert response.json() == {"detail": "Student is already signed up"}


def test_get_activities():
    """Test getting all activities"""
    response = client.get("/activities")
    
    assert response.status_code == 200
    data = response.json()
    assert "Chess Club" in data
    assert "Programming Class" in data
    assert "description" in data["Chess Club"]
    assert "schedule" in data["Chess Club"]
    assert "max_participants" in data["Chess Club"]
    assert "participants" in data["Chess Club"]


def test_unregister_from_activity_success():
    """Test successful unregistration from an activity"""
    # Add a test student first
    activities["Chess Club"]["participants"].append("test@mergington.edu")
    
    response = client.delete(
        "/activities/Chess Club/unregister?email=test@mergington.edu"
    )
    
    assert response.status_code == 200
    assert response.json() == {
        "message": "Unregistered test@mergington.edu from Chess Club"
    }
    assert "test@mergington.edu" not in activities["Chess Club"]["participants"]


def test_unregister_from_nonexistent_activity():
    """Test unregistration from an activity that doesn't exist"""
    response = client.delete(
        "/activities/NonExistentActivity/unregister?email=student@mergington.edu"
    )
    
    assert response.status_code == 404
    assert response.json() == {"detail": "Activity not found"}


def test_unregister_student_not_enrolled():
    """Test unregistration for a student who is not enrolled"""
    response = client.delete(
        "/activities/Chess Club/unregister?email=notinclub@mergington.edu"
    )
    
    assert response.status_code == 400
    assert response.json() == {"detail": "Student is not signed up for this activity"}
