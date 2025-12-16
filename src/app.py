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
