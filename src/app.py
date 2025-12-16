"""
Multi-Institution Activities Management System API

A FastAPI application that allows students to view and sign up
for extracurricular activities across multiple educational institutions.
"""

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
import os
from pathlib import Path

app = FastAPI(title="Multi-Institution Activities API",
              description="API for viewing and signing up for extracurricular activities across institutions")

# Mount the static files directory
current_dir = Path(__file__).parent
app.mount("/static", StaticFiles(directory=os.path.join(Path(__file__).parent,
          "static")), name="static")

# In-memory institutions database
institutions = {
    "mergington-hs": {
        "name": "Mergington High School",
        "type": "high_school",
        "location": "Springfield"
    },
    "riverside-university": {
        "name": "Riverside University",
        "type": "university",
        "location": "Riverside City"
    },
    "tech-academy": {
        "name": "Tech Academy",
        "type": "academy",
        "location": "Silicon Valley"
    }
}

# In-memory activity database (now with institution association)
activities = {
    "Chess Club": {
        "description": "Learn strategies and compete in chess tournaments",
        "schedule": "Fridays, 3:30 PM - 5:00 PM",
        "max_participants": 12,
        "participants": ["michael@mergington.edu", "daniel@mergington.edu"],
        "institution_id": "mergington-hs"
    },
    "Programming Class": {
        "description": "Learn programming fundamentals and build software projects",
        "schedule": "Tuesdays and Thursdays, 3:30 PM - 4:30 PM",
        "max_participants": 20,
        "participants": ["emma@mergington.edu", "sophia@mergington.edu"],
        "institution_id": "mergington-hs"
    },
    "Gym Class": {
        "description": "Physical education and sports activities",
        "schedule": "Mondays, Wednesdays, Fridays, 2:00 PM - 3:00 PM",
        "max_participants": 30,
        "participants": ["john@mergington.edu", "olivia@mergington.edu"],
        "institution_id": "mergington-hs"
    },
    "Soccer Team": {
        "description": "Join the school soccer team and compete in matches",
        "schedule": "Tuesdays and Thursdays, 4:00 PM - 5:30 PM",
        "max_participants": 22,
        "participants": ["liam@mergington.edu", "noah@mergington.edu"],
        "institution_id": "mergington-hs"
    },
    "Basketball Team": {
        "description": "Practice and play basketball with the school team",
        "schedule": "Wednesdays and Fridays, 3:30 PM - 5:00 PM",
        "max_participants": 15,
        "participants": ["ava@mergington.edu", "mia@mergington.edu"],
        "institution_id": "mergington-hs"
    },
    "Art Club": {
        "description": "Explore your creativity through painting and drawing",
        "schedule": "Thursdays, 3:30 PM - 5:00 PM",
        "max_participants": 15,
        "participants": ["amelia@mergington.edu", "harper@mergington.edu"],
        "institution_id": "mergington-hs"
    },
    "Drama Club": {
        "description": "Act, direct, and produce plays and performances",
        "schedule": "Mondays and Wednesdays, 4:00 PM - 5:30 PM",
        "max_participants": 20,
        "participants": ["ella@mergington.edu", "scarlett@mergington.edu"],
        "institution_id": "mergington-hs"
    },
    "Math Club": {
        "description": "Solve challenging problems and participate in math competitions",
        "schedule": "Tuesdays, 3:30 PM - 4:30 PM",
        "max_participants": 10,
        "participants": ["james@mergington.edu", "benjamin@mergington.edu"],
        "institution_id": "mergington-hs"
    },
    "Debate Team": {
        "description": "Develop public speaking and argumentation skills",
        "schedule": "Fridays, 4:00 PM - 5:30 PM",
        "max_participants": 12,
        "participants": ["charlotte@mergington.edu", "henry@mergington.edu"],
        "institution_id": "mergington-hs"
    },
    "Advanced AI Workshop": {
        "description": "Explore artificial intelligence and machine learning",
        "schedule": "Mondays, 6:00 PM - 8:00 PM",
        "max_participants": 25,
        "participants": ["alice@riverside.edu", "bob@riverside.edu"],
        "institution_id": "riverside-university"
    },
    "Robotics Lab": {
        "description": "Build and program robots for competitions",
        "schedule": "Wednesdays, 5:00 PM - 7:00 PM",
        "max_participants": 18,
        "participants": ["carol@riverside.edu"],
        "institution_id": "riverside-university"
    },
    "Coding Bootcamp": {
        "description": "Intensive web development and software engineering",
        "schedule": "Tuesdays and Thursdays, 6:00 PM - 9:00 PM",
        "max_participants": 30,
        "participants": ["david@techacademy.edu", "eve@techacademy.edu"],
        "institution_id": "tech-academy"
    },
    "Cybersecurity Club": {
        "description": "Learn ethical hacking and security practices",
        "schedule": "Fridays, 5:00 PM - 7:00 PM",
        "max_participants": 20,
        "participants": ["frank@techacademy.edu"],
        "institution_id": "tech-academy"
    }
}


@app.get("/")
def root():
    return RedirectResponse(url="/static/index.html")


@app.get("/institutions")
def get_institutions():
    """Get all institutions"""
    return institutions


@app.get("/activities")
def get_activities(institution_id: str = None):
    """Get all activities, optionally filtered by institution"""
    if institution_id:
        # Filter activities by institution
        filtered = {
            name: details for name, details in activities.items()
            if details.get("institution_id") == institution_id
        }
        return filtered
    return activities


@app.post("/activities/{activity_name}/signup")
def signup_for_activity(activity_name: str, email: str):
    """Sign up a student for an activity"""
    # Validate activity exists
    if activity_name not in activities:
        raise HTTPException(status_code=404, detail="Activity not found")

    # Get the specific activity
    activity = activities[activity_name]

    # Validate student is not already signed up
    if email in activity["participants"]:
        raise HTTPException(
            status_code=400,
            detail="Student is already signed up"
        )

    # Add student
    activity["participants"].append(email)
    return {"message": f"Signed up {email} for {activity_name}"}


@app.delete("/activities/{activity_name}/unregister")
def unregister_from_activity(activity_name: str, email: str):
    """Unregister a student from an activity"""
    # Validate activity exists
    if activity_name not in activities:
        raise HTTPException(status_code=404, detail="Activity not found")

    # Get the specific activity
    activity = activities[activity_name]

    # Validate student is signed up
    if email not in activity["participants"]:
        raise HTTPException(
            status_code=400,
            detail="Student is not signed up for this activity"
        )

    # Remove student
    activity["participants"].remove(email)
    return {"message": f"Unregistered {email} from {activity_name}"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
