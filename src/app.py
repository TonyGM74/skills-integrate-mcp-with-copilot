"""
High School Management System API

A super simple FastAPI application that allows students to view and sign up
for extracurricular activities at Mergington High School.
"""

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from datetime import datetime
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

# In-memory events database (events associated with clubs/activities)
events = {}

# In-memory notifications storage
notifications = []


class Event(BaseModel):
    title: str
    description: str
    date: str
    time: str
    location: str
    max_participants: int


class NotificationRequest(BaseModel):
    message: str


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


@app.get("/clubs")
def get_clubs():
    """Get all clubs/activities that can have events"""
    return {name: {"description": details["description"], "schedule": details["schedule"]} 
            for name, details in activities.items()}


@app.post("/clubs/{club_name}/events")
def create_event(club_name: str, event: Event):
    """Create a new event for a club"""
    # Validate club exists
    if club_name not in activities:
        raise HTTPException(status_code=404, detail="Club not found")
    
    # Initialize events list for this club if it doesn't exist
    if club_name not in events:
        events[club_name] = {}
    
    # Generate unique event ID
    event_id = str(uuid.uuid4())
    
    # Store the event
    events[club_name][event_id] = {
        "id": event_id,
        "title": event.title,
        "description": event.description,
        "date": event.date,
        "time": event.time,
        "location": event.location,
        "max_participants": event.max_participants,
        "participants": [],
        "created_at": datetime.now().isoformat()
    }
    
    return {"message": f"Event '{event.title}' created successfully", "event_id": event_id}


@app.get("/clubs/{club_name}/events")
def get_club_events(club_name: str):
    """Get all events for a specific club"""
    # Validate club exists
    if club_name not in activities:
        raise HTTPException(status_code=404, detail="Club not found")
    
    # Return events for this club
    return events.get(club_name, {})


@app.post("/clubs/{club_name}/events/{event_id}/register")
def register_for_event(club_name: str, event_id: str, email: str):
    """Register a participant for an event"""
    # Validate club exists
    if club_name not in activities:
        raise HTTPException(status_code=404, detail="Club not found")
    
    # Validate event exists
    if club_name not in events or event_id not in events[club_name]:
        raise HTTPException(status_code=404, detail="Event not found")
    
    event = events[club_name][event_id]
    
    # Check if already registered
    if email in event["participants"]:
        raise HTTPException(status_code=400, detail="Already registered for this event")
    
    # Check if event is full
    if len(event["participants"]) >= event["max_participants"]:
        raise HTTPException(status_code=400, detail="Event is full")
    
    # Register participant
    event["participants"].append(email)
    
    # Send automatic notification
    notification = {
        "id": str(uuid.uuid4()),
        "event_id": event_id,
        "club_name": club_name,
        "recipient": email,
        "message": f"You have successfully registered for '{event['title']}' on {event['date']} at {event['time']}",
        "timestamp": datetime.now().isoformat()
    }
    notifications.append(notification)
    
    return {"message": f"Registered {email} for event '{event['title']}'", "notification": notification}


@app.delete("/clubs/{club_name}/events/{event_id}/unregister")
def unregister_from_event(club_name: str, event_id: str, email: str):
    """Unregister a participant from an event"""
    # Validate club exists
    if club_name not in activities:
        raise HTTPException(status_code=404, detail="Club not found")
    
    # Validate event exists
    if club_name not in events or event_id not in events[club_name]:
        raise HTTPException(status_code=404, detail="Event not found")
    
    event = events[club_name][event_id]
    
    # Check if registered
    if email not in event["participants"]:
        raise HTTPException(status_code=400, detail="Not registered for this event")
    
    # Unregister participant
    event["participants"].remove(email)
    
    # Send automatic notification
    notification = {
        "id": str(uuid.uuid4()),
        "event_id": event_id,
        "club_name": club_name,
        "recipient": email,
        "message": f"You have been unregistered from '{event['title']}'",
        "timestamp": datetime.now().isoformat()
    }
    notifications.append(notification)
    
    return {"message": f"Unregistered {email} from event '{event['title']}'", "notification": notification}


@app.post("/clubs/{club_name}/events/{event_id}/notify")
def notify_participants(club_name: str, event_id: str, notification_request: NotificationRequest):
    """Send notifications to all participants of an event"""
    # Validate club exists
    if club_name not in activities:
        raise HTTPException(status_code=404, detail="Club not found")
    
    # Validate event exists
    if club_name not in events or event_id not in events[club_name]:
        raise HTTPException(status_code=404, detail="Event not found")
    
    event = events[club_name][event_id]
    
    # Send notification to all participants
    sent_notifications = []
    for participant_email in event["participants"]:
        notification = {
            "id": str(uuid.uuid4()),
            "event_id": event_id,
            "club_name": club_name,
            "recipient": participant_email,
            "message": notification_request.message,
            "timestamp": datetime.now().isoformat()
        }
        notifications.append(notification)
        sent_notifications.append(notification)
    
    return {
        "message": f"Sent notifications to {len(sent_notifications)} participants",
        "notifications": sent_notifications
    }


@app.get("/notifications")
def get_notifications(email: Optional[str] = None):
    """Get notifications, optionally filtered by email"""
    if email:
        return [n for n in notifications if n["recipient"] == email]
    return notifications

