"""
Database module for High School Management System

Handles SQLite database operations for storing activities, clubs, members, and events.
"""

import sqlite3
import json
from pathlib import Path
from typing import Dict, List, Any, Optional


class Database:
    """Database handler for the High School Management System"""
    
    def __init__(self, db_path: str = "school.db"):
        """
        Initialize database connection
        
        Args:
            db_path: Path to SQLite database file
        """
        self.db_path = db_path
        self.connection = None
        self.initialize_database()
    
    def get_connection(self) -> sqlite3.Connection:
        """Get or create database connection"""
        if self.connection is None:
            self.connection = sqlite3.connect(self.db_path, check_same_thread=False)
            self.connection.row_factory = sqlite3.Row
        return self.connection
    
    def initialize_database(self):
        """Create database tables if they don't exist"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Create activities table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS activities (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                description TEXT NOT NULL,
                schedule TEXT NOT NULL,
                max_participants INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create participants table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS participants (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                activity_name TEXT NOT NULL,
                email TEXT NOT NULL,
                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (activity_name) REFERENCES activities(name),
                UNIQUE(activity_name, email)
            )
        """)
        
        conn.commit()
    
    def seed_data(self):
        """Seed database with initial data"""
        initial_activities = {
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
        
        # Check if database is already seeded
        if self.get_activities():
            return  # Database already has data
        
        # Add all activities and participants
        for activity_name, activity_data in initial_activities.items():
            self.add_activity(
                name=activity_name,
                description=activity_data["description"],
                schedule=activity_data["schedule"],
                max_participants=activity_data["max_participants"]
            )
            
            # Add participants for this activity
            for email in activity_data["participants"]:
                self.add_participant(activity_name, email)
    
    def add_activity(self, name: str, description: str, schedule: str, max_participants: int) -> bool:
        """
        Add a new activity to the database
        
        Args:
            name: Activity name
            description: Activity description
            schedule: Activity schedule
            max_participants: Maximum number of participants
            
        Returns:
            True if added successfully, False if activity already exists
        """
        conn = self.get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                INSERT INTO activities (name, description, schedule, max_participants)
                VALUES (?, ?, ?, ?)
            """, (name, description, schedule, max_participants))
            conn.commit()
            return True
        except sqlite3.IntegrityError:
            return False  # Activity already exists
    
    def get_activities(self) -> Dict[str, Dict[str, Any]]:
        """
        Get all activities with their participants
        
        Returns:
            Dictionary of activities with their details and participants
        """
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Get all activities
        cursor.execute("""
            SELECT name, description, schedule, max_participants
            FROM activities
            ORDER BY name
        """)
        
        activities = {}
        for row in cursor.fetchall():
            activity_name = row["name"]
            activities[activity_name] = {
                "description": row["description"],
                "schedule": row["schedule"],
                "max_participants": row["max_participants"],
                "participants": self.get_participants(activity_name)
            }
        
        return activities
    
    def get_activity(self, name: str) -> Optional[Dict[str, Any]]:
        """
        Get a specific activity by name
        
        Args:
            name: Activity name
            
        Returns:
            Activity details or None if not found
        """
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT name, description, schedule, max_participants
            FROM activities
            WHERE name = ?
        """, (name,))
        
        row = cursor.fetchone()
        if row:
            return {
                "description": row["description"],
                "schedule": row["schedule"],
                "max_participants": row["max_participants"],
                "participants": self.get_participants(name)
            }
        return None
    
    def get_participants(self, activity_name: str) -> List[str]:
        """
        Get all participants for a specific activity
        
        Args:
            activity_name: Name of the activity
            
        Returns:
            List of participant emails
        """
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT email
            FROM participants
            WHERE activity_name = ?
            ORDER BY joined_at
        """, (activity_name,))
        
        return [row["email"] for row in cursor.fetchall()]
    
    def add_participant(self, activity_name: str, email: str) -> bool:
        """
        Add a participant to an activity
        
        Args:
            activity_name: Name of the activity
            email: Participant email
            
        Returns:
            True if added successfully, False if already signed up
        """
        conn = self.get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                INSERT INTO participants (activity_name, email)
                VALUES (?, ?)
            """, (activity_name, email))
            conn.commit()
            return True
        except sqlite3.IntegrityError:
            return False  # Already signed up
    
    def remove_participant(self, activity_name: str, email: str) -> bool:
        """
        Remove a participant from an activity
        
        Args:
            activity_name: Name of the activity
            email: Participant email
            
        Returns:
            True if removed successfully, False if not found
        """
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            DELETE FROM participants
            WHERE activity_name = ? AND email = ?
        """, (activity_name, email))
        conn.commit()
        
        return cursor.rowcount > 0
    
    def close(self):
        """Close database connection"""
        if self.connection:
            self.connection.close()
            self.connection = None
