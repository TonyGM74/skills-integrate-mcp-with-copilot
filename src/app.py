"""
High School Management System API

A super simple FastAPI application that allows students to view and sign up
for extracurricular activities at Mergington High School.

Note: This is a demonstration application. In a production environment:
- Admin endpoints should include authentication/authorization checks
- User input should be sanitized to prevent XSS attacks
- Data should be stored in a proper database with security measures
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
        if max_participants < 1:
            raise HTTPException(status_code=400, detail="Max participants must be at least 1")
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
