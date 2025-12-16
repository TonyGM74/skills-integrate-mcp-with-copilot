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

app = FastAPI(title="Mergington High School API",
              description="API for viewing and signing up for extracurricular activities")

# Mount the static files directory
current_dir = Path(__file__).parent
app.mount("/static", StaticFiles(directory=os.path.join(Path(__file__).parent,
          "static")), name="static")

# Pydantic models for request/response validation
class MembershipRequest(BaseModel):
    email: str
    message: Optional[str] = None

class RoleAssignment(BaseModel):
    email: str
    role: str

# In-memory activity database
activities = {
    "Chess Club": {
        "description": "Learn strategies and compete in chess tournaments",
        "schedule": "Fridays, 3:30 PM - 5:00 PM",
        "max_participants": 12,
        "participants": ["michael@mergington.edu", "daniel@mergington.edu"],
        "roles": {
            "michael@mergington.edu": "president",
            "daniel@mergington.edu": "member"
        }
    },
    "Programming Class": {
        "description": "Learn programming fundamentals and build software projects",
        "schedule": "Tuesdays and Thursdays, 3:30 PM - 4:30 PM",
        "max_participants": 20,
        "participants": ["emma@mergington.edu", "sophia@mergington.edu"],
        "roles": {
            "emma@mergington.edu": "president",
            "sophia@mergington.edu": "secretary"
        }
    },
    "Gym Class": {
        "description": "Physical education and sports activities",
        "schedule": "Mondays, Wednesdays, Fridays, 2:00 PM - 3:00 PM",
        "max_participants": 30,
        "participants": ["john@mergington.edu", "olivia@mergington.edu"],
        "roles": {
            "john@mergington.edu": "member",
            "olivia@mergington.edu": "member"
        }
    },
    "Soccer Team": {
        "description": "Join the school soccer team and compete in matches",
        "schedule": "Tuesdays and Thursdays, 4:00 PM - 5:30 PM",
        "max_participants": 22,
        "participants": ["liam@mergington.edu", "noah@mergington.edu"],
        "roles": {
            "liam@mergington.edu": "captain",
            "noah@mergington.edu": "member"
        }
    },
    "Basketball Team": {
        "description": "Practice and play basketball with the school team",
        "schedule": "Wednesdays and Fridays, 3:30 PM - 5:00 PM",
        "max_participants": 15,
        "participants": ["ava@mergington.edu", "mia@mergington.edu"],
        "roles": {
            "ava@mergington.edu": "captain",
            "mia@mergington.edu": "member"
        }
    },
    "Art Club": {
        "description": "Explore your creativity through painting and drawing",
        "schedule": "Thursdays, 3:30 PM - 5:00 PM",
        "max_participants": 15,
        "participants": ["amelia@mergington.edu", "harper@mergington.edu"],
        "roles": {
            "amelia@mergington.edu": "president",
            "harper@mergington.edu": "member"
        }
    },
    "Drama Club": {
        "description": "Act, direct, and produce plays and performances",
        "schedule": "Mondays and Wednesdays, 4:00 PM - 5:30 PM",
        "max_participants": 20,
        "participants": ["ella@mergington.edu", "scarlett@mergington.edu"],
        "roles": {
            "ella@mergington.edu": "director",
            "scarlett@mergington.edu": "member"
        }
    },
    "Math Club": {
        "description": "Solve challenging problems and participate in math competitions",
        "schedule": "Tuesdays, 3:30 PM - 4:30 PM",
        "max_participants": 10,
        "participants": ["james@mergington.edu", "benjamin@mergington.edu"],
        "roles": {
            "james@mergington.edu": "president",
            "benjamin@mergington.edu": "member"
        }
    },
    "Debate Team": {
        "description": "Develop public speaking and argumentation skills",
        "schedule": "Fridays, 4:00 PM - 5:30 PM",
        "max_participants": 12,
        "participants": ["charlotte@mergington.edu", "henry@mergington.edu"],
        "roles": {
            "charlotte@mergington.edu": "captain",
            "henry@mergington.edu": "member"
        }
    }
}

# In-memory membership requests database
membership_requests = {
    # Format: activity_name: [{"email": str, "message": str, "status": "pending"}]
}


@app.get("/")
def root():
    return RedirectResponse(url="/static/index.html")


@app.get("/activities")
def get_activities():
    return activities


@app.post("/activities/{activity_name}/signup")
def signup_for_activity(activity_name: str, email: str):
    """Submit a membership request for an activity"""
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

    # Initialize requests list for this activity if it doesn't exist
    if activity_name not in membership_requests:
        membership_requests[activity_name] = []

    # Check if there's already a pending request
    for request in membership_requests[activity_name]:
        if request["email"] == email and request["status"] == "pending":
            raise HTTPException(
                status_code=400,
                detail="You already have a pending membership request"
            )

    # Create membership request
    membership_requests[activity_name].append({
        "email": email,
        "message": "",
        "status": "pending"
    })
    return {"message": f"Membership request submitted for {activity_name}"}


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
    
    # Remove role if exists
    if email in activity.get("roles", {}):
        del activity["roles"][email]
    
    return {"message": f"Unregistered {email} from {activity_name}"}


@app.get("/activities/{activity_name}/requests")
def get_membership_requests(activity_name: str):
    """Get all membership requests for an activity"""
    # Validate activity exists
    if activity_name not in activities:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    # Return requests for this activity (or empty list if none)
    return membership_requests.get(activity_name, [])


@app.post("/activities/{activity_name}/requests/{email}/approve")
def approve_membership_request(activity_name: str, email: str):
    """Approve a membership request"""
    # Validate activity exists
    if activity_name not in activities:
        raise HTTPException(status_code=404, detail="Activity not found")

    # Get the specific activity
    activity = activities[activity_name]

    # Find the pending request
    if activity_name not in membership_requests:
        raise HTTPException(status_code=404, detail="No membership requests found")

    request_found = None
    for request in membership_requests[activity_name]:
        if request["email"] == email and request["status"] == "pending":
            request_found = request
            break

    if not request_found:
        raise HTTPException(status_code=404, detail="Pending request not found")

    # Check if student is already a member
    if email in activity["participants"]:
        raise HTTPException(status_code=400, detail="Student is already a member")

    # Approve request: add to participants and mark as approved
    activity["participants"].append(email)
    
    # Initialize roles dict if it doesn't exist
    if "roles" not in activity:
        activity["roles"] = {}
    
    # Assign default role
    activity["roles"][email] = "member"
    request_found["status"] = "approved"

    return {"message": f"Approved membership for {email} in {activity_name}"}


@app.post("/activities/{activity_name}/requests/{email}/reject")
def reject_membership_request(activity_name: str, email: str):
    """Reject a membership request"""
    # Validate activity exists
    if activity_name not in activities:
        raise HTTPException(status_code=404, detail="Activity not found")

    # Find the pending request
    if activity_name not in membership_requests:
        raise HTTPException(status_code=404, detail="No membership requests found")

    request_found = None
    for request in membership_requests[activity_name]:
        if request["email"] == email and request["status"] == "pending":
            request_found = request
            break

    if not request_found:
        raise HTTPException(status_code=404, detail="Pending request not found")

    # Reject request
    request_found["status"] = "rejected"

    return {"message": f"Rejected membership request from {email} for {activity_name}"}


@app.post("/activities/{activity_name}/members/{email}/role")
def assign_role(activity_name: str, email: str, role: str):
    """Assign a role to a member"""
    # Validate activity exists
    if activity_name not in activities:
        raise HTTPException(status_code=404, detail="Activity not found")

    # Get the specific activity
    activity = activities[activity_name]

    # Validate member exists
    if email not in activity["participants"]:
        raise HTTPException(
            status_code=404,
            detail="Member not found in this activity"
        )

    # Validate role
    valid_roles = ["president", "vice-president", "secretary", "treasurer", 
                   "captain", "vice-captain", "director", "member"]
    if role not in valid_roles:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid role. Valid roles: {', '.join(valid_roles)}"
        )

    # Initialize roles dict if it doesn't exist
    if "roles" not in activity:
        activity["roles"] = {}

    # Assign role
    activity["roles"][email] = role

    return {"message": f"Assigned role '{role}' to {email} in {activity_name}"}
