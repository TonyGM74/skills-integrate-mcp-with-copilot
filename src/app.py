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
from database import Database

app = FastAPI(title="Mergington High School API",
              description="API for viewing and signing up for extracurricular activities")

# Mount the static files directory
current_dir = Path(__file__).parent
app.mount("/static", StaticFiles(directory=os.path.join(Path(__file__).parent,
          "static")), name="static")

# Initialize database
db = Database(db_path=os.path.join(Path(__file__).parent, "school.db"))
db.seed_data()  # Seed with initial data if database is empty


@app.get("/")
def root():
    return RedirectResponse(url="/static/index.html")


@app.get("/activities")
def get_activities():
    return db.get_activities()


@app.post("/activities/{activity_name}/signup")
def signup_for_activity(activity_name: str, email: str):
    """Sign up a student for an activity"""
    # Get the specific activity
    activity = db.get_activity(activity_name)
    
    # Validate activity exists
    if activity is None:
        raise HTTPException(status_code=404, detail="Activity not found")

    # Add student (database handles duplicate check)
    success = db.add_participant(activity_name, email)
    if not success:
        raise HTTPException(
            status_code=400,
            detail="Student is already signed up"
        )
    
    return {"message": f"Signed up {email} for {activity_name}"}


@app.delete("/activities/{activity_name}/unregister")
def unregister_from_activity(activity_name: str, email: str):
    """Unregister a student from an activity"""
    # Get the specific activity
    activity = db.get_activity(activity_name)
    
    # Validate activity exists
    if activity is None:
        raise HTTPException(status_code=404, detail="Activity not found")

    # Remove student (database handles existence check)
    success = db.remove_participant(activity_name, email)
    if not success:
        raise HTTPException(
            status_code=400,
            detail="Student is not signed up for this activity"
        )
    
    return {"message": f"Unregistered {email} from {activity_name}"}


@app.get("/statistics")
def get_statistics():
    """Get participation statistics for all activities"""
    total_activities = len(activities)
    total_participants = sum(len(activity["participants"]) for activity in activities.values())
    total_capacity = sum(activity["max_participants"] for activity in activities.values())
    
    # Calculate per-activity statistics
    activity_stats = []
    for name, details in activities.items():
        participant_count = len(details["participants"])
        max_participants = details["max_participants"]
        occupancy_rate = (participant_count / max_participants * 100) if max_participants > 0 else 0
        
        activity_stats.append({
            "name": name,
            "participant_count": participant_count,
            "max_participants": max_participants,
            "available_spots": max_participants - participant_count,
            "occupancy_rate": round(occupancy_rate, 2),
            "schedule": details["schedule"]
        })
    
    # Sort by participant count (descending)
    activity_stats.sort(key=lambda x: x["participant_count"], reverse=True)
    
    return {
        "summary": {
            "total_activities": total_activities,
            "total_participants": total_participants,
            "total_capacity": total_capacity,
            "overall_occupancy_rate": round((total_participants / total_capacity * 100) if total_capacity > 0 else 0, 2)
        },
        "activities": activity_stats
    }


@app.get("/reports")
def get_reports():
    """Get detailed reports for activities"""
    reports = []
    
    for name, details in activities.items():
        participant_count = len(details["participants"])
        
        reports.append({
            "activity_name": name,
            "description": details["description"],
            "schedule": details["schedule"],
            "participants": details["participants"],
            "participant_count": participant_count,
            "max_participants": details["max_participants"],
            "available_spots": details["max_participants"] - participant_count
        })
    
    return reports
