"""
High School Management System API

A super simple FastAPI application that allows students to view and sign up
for extracurricular activities at Mergington High School.
"""

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
import os
from pathlib import Path

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


# Admin endpoints
@app.get("/admin/statistics")
def get_statistics():
    """Get overall system statistics"""
    total_activities = len(activities)
    total_participants = sum(len(activity["participants"]) for activity in activities.values())
    total_capacity = sum(activity["max_participants"] for activity in activities.values())
    
    # Calculate activity utilization
    activity_stats = []
    for name, details in activities.items():
        utilization = (len(details["participants"]) / details["max_participants"]) * 100
        activity_stats.append({
            "name": name,
            "participants": len(details["participants"]),
            "capacity": details["max_participants"],
            "utilization": round(utilization, 2)
        })
    
    return {
        "total_activities": total_activities,
        "total_participants": total_participants,
        "total_capacity": total_capacity,
        "overall_utilization": round((total_participants / total_capacity) * 100, 2) if total_capacity > 0 else 0,
        "activity_details": activity_stats
    }


@app.post("/admin/activities")
def create_activity(name: str, description: str, schedule: str, max_participants: int):
    """Create a new activity"""
    if name in activities:
        raise HTTPException(status_code=400, detail="Activity already exists")
    
    if max_participants < 1:
        raise HTTPException(status_code=400, detail="Max participants must be at least 1")
    
    activities[name] = {
        "description": description,
        "schedule": schedule,
        "max_participants": max_participants,
        "participants": []
    }
    
    return {"message": f"Activity '{name}' created successfully"}


@app.put("/admin/activities/{activity_name}")
def update_activity(activity_name: str, description: str = None, schedule: str = None, max_participants: int = None):
    """Update an existing activity"""
    if activity_name not in activities:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    activity = activities[activity_name]
    
    if description is not None:
        activity["description"] = description
    
    if schedule is not None:
        activity["schedule"] = schedule
    
    if max_participants is not None:
        if max_participants < len(activity["participants"]):
            raise HTTPException(
                status_code=400, 
                detail=f"Cannot reduce capacity below current participants. Minimum allowed: {len(activity['participants'])}"
            )
        activity["max_participants"] = max_participants
    
    return {"message": f"Activity '{activity_name}' updated successfully"}


@app.delete("/admin/activities/{activity_name}")
def delete_activity(activity_name: str):
    """Delete an activity"""
    if activity_name not in activities:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    del activities[activity_name]
    return {"message": f"Activity '{activity_name}' deleted successfully"}


@app.get("/admin/reports")
def generate_reports():
    """Generate comprehensive reports"""
    reports = {
        "summary": {
            "total_activities": len(activities),
            "total_participants": sum(len(activity["participants"]) for activity in activities.values()),
            "average_participants_per_activity": round(
                sum(len(activity["participants"]) for activity in activities.values()) / len(activities), 2
            ) if len(activities) > 0 else 0
        },
        "activities": []
    }
    
    for name, details in activities.items():
        utilization = (len(details["participants"]) / details["max_participants"]) * 100
        reports["activities"].append({
            "name": name,
            "description": details["description"],
            "schedule": details["schedule"],
            "participants_count": len(details["participants"]),
            "max_participants": details["max_participants"],
            "utilization_percentage": round(utilization, 2),
            "participants": details["participants"]
        })
    
    # Sort by utilization
    reports["activities"].sort(key=lambda x: x["utilization_percentage"], reverse=True)
    
    return reports
