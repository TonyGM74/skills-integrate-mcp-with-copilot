"""
High School Management System API

A super simple FastAPI application that allows students to view and sign up
for extracurricular activities at Mergington High School.
"""

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
import os
from pathlib import Path

app = FastAPI(title="Mergington High School API",
              description="API for viewing and signing up for extracurricular activities")

# Mount the static files directory
current_dir = Path(__file__).parent
app.mount("/static", StaticFiles(directory=os.path.join(Path(__file__).parent,
          "static")), name="static")


# Pydantic models for request validation
class ActivityCreate(BaseModel):
    """Model for creating a new activity"""
    name: str = Field(..., min_length=1, max_length=100, description="Name of the activity")
    description: str = Field(..., min_length=1, max_length=500, description="Description of the activity")
    schedule: str = Field(..., min_length=1, max_length=200, description="Schedule of the activity")
    max_participants: int = Field(..., gt=0, le=100, description="Maximum number of participants")
    
    @field_validator('name', 'description', 'schedule')
    @classmethod
    def validate_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError('Field cannot be empty or whitespace only')
        return v.strip()


class ActivityUpdate(BaseModel):
    """Model for updating an existing activity"""
    description: Optional[str] = Field(None, min_length=1, max_length=500, description="Description of the activity")
    schedule: Optional[str] = Field(None, min_length=1, max_length=200, description="Schedule of the activity")
    max_participants: Optional[int] = Field(None, gt=0, le=100, description="Maximum number of participants")
    
    @field_validator('description', 'schedule')
    @classmethod
    def validate_not_empty(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and (not v or not v.strip()):
            raise ValueError('Field cannot be empty or whitespace only')
        return v.strip() if v else v

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


# Admin endpoints for managing activities
@app.post("/admin/activities")
def create_activity(activity: ActivityCreate):
    """Create a new activity (admin only)"""
    # Validate activity doesn't already exist
    if activity.name in activities:
        raise HTTPException(
            status_code=400,
            detail=f"Activity '{activity.name}' already exists"
        )
    
    # Create the new activity
    activities[activity.name] = {
        "description": activity.description,
        "schedule": activity.schedule,
        "max_participants": activity.max_participants,
        "participants": []
    }
    
    return {
        "message": f"Activity '{activity.name}' created successfully",
        "activity": activities[activity.name]
    }


@app.put("/admin/activities/{activity_name}")
def update_activity(activity_name: str, activity: ActivityUpdate):
    """Update an existing activity (admin only)"""
    # Validate activity exists
    if activity_name not in activities:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    # Update only provided fields
    current_activity = activities[activity_name]
    if activity.description is not None:
        current_activity["description"] = activity.description
    if activity.schedule is not None:
        current_activity["schedule"] = activity.schedule
    if activity.max_participants is not None:
        # Validate new max doesn't conflict with current participants
        if activity.max_participants < len(current_activity["participants"]):
            raise HTTPException(
                status_code=400,
                detail=f"Cannot set max_participants to {activity.max_participants}. "
                       f"There are already {len(current_activity['participants'])} participants."
            )
        current_activity["max_participants"] = activity.max_participants
    
    return {
        "message": f"Activity '{activity_name}' updated successfully",
        "activity": current_activity
    }


@app.delete("/admin/activities/{activity_name}")
def delete_activity(activity_name: str):
    """Delete an activity (admin only)"""
    # Validate activity exists
    if activity_name not in activities:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    # Remove the activity
    deleted_activity = activities.pop(activity_name)
    
    return {
        "message": f"Activity '{activity_name}' deleted successfully",
        "deleted_activity": deleted_activity
    }
