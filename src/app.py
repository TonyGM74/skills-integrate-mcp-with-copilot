"""
High School Management System API

A super simple FastAPI application that allows students to view and sign up
for extracurricular activities at Mergington High School.
"""

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from typing import List, Optional
import os
from pathlib import Path
import uuid

app = FastAPI(title="Mergington High School API",
              description="API for viewing and signing up for extracurricular activities")

# Mount the static files directory
current_dir = Path(__file__).parent
app.mount("/static", StaticFiles(directory=os.path.join(Path(__file__).parent,
          "static")), name="static")

# In-memory activity database
activities = {
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
    },
    "Soccer Team": {
        "description": "Join the school soccer team and compete in matches",
        "schedule": "Tuesdays and Thursdays, 4:00 PM - 5:30 PM",
        "max_participants": 22,
        "participants": ["liam@mergington.edu", "noah@mergington.edu"]
    },
    "Basketball Team": {
        "description": "Practice and play basketball with the school team",
        "schedule": "Wednesdays and Fridays, 3:30 PM - 5:00 PM",
        "max_participants": 15,
        "participants": ["ava@mergington.edu", "mia@mergington.edu"]
    },
    "Art Club": {
        "description": "Explore your creativity through painting and drawing",
        "schedule": "Thursdays, 3:30 PM - 5:00 PM",
        "max_participants": 15,
        "participants": ["amelia@mergington.edu", "harper@mergington.edu"]
    },
    "Drama Club": {
        "description": "Act, direct, and produce plays and performances",
        "schedule": "Mondays and Wednesdays, 4:00 PM - 5:30 PM",
        "max_participants": 20,
        "participants": ["ella@mergington.edu", "scarlett@mergington.edu"]
    },
    "Math Club": {
        "description": "Solve challenging problems and participate in math competitions",
        "schedule": "Tuesdays, 3:30 PM - 4:30 PM",
        "max_participants": 10,
        "participants": ["james@mergington.edu", "benjamin@mergington.edu"]
    },
    "Debate Team": {
        "description": "Develop public speaking and argumentation skills",
        "schedule": "Fridays, 4:00 PM - 5:30 PM",
        "max_participants": 12,
        "participants": ["charlotte@mergington.edu", "henry@mergington.edu"]
    }
}


@app.get("/")
def root():
    return RedirectResponse(url="/static/index.html")


@app.get("/activities")
def get_activities():
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


# Pydantic models for clubs
class Event(BaseModel):
    id: str
    name: str
    description: str
    date: str
    location: str


class ClubCreate(BaseModel):
    name: str
    description: str


class ClubUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class EventCreate(BaseModel):
    name: str
    description: str
    date: str
    location: str


# In-memory clubs database
clubs = {}


@app.get("/clubs")
def get_clubs():
    """Get all clubs"""
    return clubs


@app.post("/clubs")
def create_club(club: ClubCreate):
    """Create a new club"""
    club_id = str(uuid.uuid4())
    clubs[club_id] = {
        "id": club_id,
        "name": club.name,
        "description": club.description,
        "members": [],
        "events": []
    }
    return clubs[club_id]


@app.get("/clubs/{club_id}")
def get_club(club_id: str):
    """Get a specific club by ID"""
    if club_id not in clubs:
        raise HTTPException(status_code=404, detail="Club not found")
    return clubs[club_id]


@app.put("/clubs/{club_id}")
def update_club(club_id: str, club_update: ClubUpdate):
    """Update a club"""
    if club_id not in clubs:
        raise HTTPException(status_code=404, detail="Club not found")
    
    if club_update.name is not None:
        clubs[club_id]["name"] = club_update.name
    if club_update.description is not None:
        clubs[club_id]["description"] = club_update.description
    
    return clubs[club_id]


@app.delete("/clubs/{club_id}")
def delete_club(club_id: str):
    """Delete a club"""
    if club_id not in clubs:
        raise HTTPException(status_code=404, detail="Club not found")
    
    del clubs[club_id]
    return {"message": "Club deleted successfully"}


@app.post("/clubs/{club_id}/members")
def add_member(club_id: str, email: str):
    """Add a member to a club"""
    if club_id not in clubs:
        raise HTTPException(status_code=404, detail="Club not found")
    
    club = clubs[club_id]
    if email in club["members"]:
        raise HTTPException(status_code=400, detail="Member already exists in club")
    
    club["members"].append(email)
    return {"message": f"Added {email} to club"}


@app.delete("/clubs/{club_id}/members")
def remove_member(club_id: str, email: str):
    """Remove a member from a club"""
    if club_id not in clubs:
        raise HTTPException(status_code=404, detail="Club not found")
    
    club = clubs[club_id]
    if email not in club["members"]:
        raise HTTPException(status_code=400, detail="Member not found in club")
    
    club["members"].remove(email)
    return {"message": f"Removed {email} from club"}


@app.post("/clubs/{club_id}/events")
def add_event(club_id: str, event: EventCreate):
    """Add an event to a club"""
    if club_id not in clubs:
        raise HTTPException(status_code=404, detail="Club not found")
    
    event_id = str(uuid.uuid4())
    new_event = {
        "id": event_id,
        "name": event.name,
        "description": event.description,
        "date": event.date,
        "location": event.location
    }
    
    clubs[club_id]["events"].append(new_event)
    return new_event


@app.delete("/clubs/{club_id}/events/{event_id}")
def remove_event(club_id: str, event_id: str):
    """Remove an event from a club"""
    if club_id not in clubs:
        raise HTTPException(status_code=404, detail="Club not found")
    
    club = clubs[club_id]
    event = next((e for e in club["events"] if e["id"] == event_id), None)
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    club["events"].remove(event)
    return {"message": "Event removed successfully"}
