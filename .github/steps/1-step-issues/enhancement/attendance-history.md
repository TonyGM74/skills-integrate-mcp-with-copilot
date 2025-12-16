# Attendance History Tracking

## Problem

Currently, the system only tracks which students are registered for activities, but there's no way to record or view actual attendance at each activity session. Teachers need to know which students actually showed up to activities to properly evaluate participation and engagement.

## Recommended Solution

Add an attendance tracking feature that allows:

- Teachers to mark students as present/absent for each activity session
- View attendance history for individual students across all their activities
- View attendance records for a specific activity over time
- Generate attendance reports showing patterns (e.g., students with low attendance rates)

## Implementation Ideas

Since there is no database yet, consider:

- Adding an `attendance_records` field to each activity that stores date/time and list of students who attended
- Creating a new endpoint `POST /activities/{activity_name}/attendance` to record attendance for a session
- Creating an endpoint `GET /activities/{activity_name}/attendance` to retrieve attendance history
- Creating an endpoint `GET /students/{email}/attendance` to view a student's attendance across all activities

## Context

This feature would help teachers:
- Track student engagement more accurately
- Identify students who need additional support or encouragement
- Meet school requirements for activity participation records
- Make informed decisions about activity continuation or cancellation

## Expected Outcome

Teachers can easily record and view attendance data for all extracurricular activities, making it simple to identify trends and support student success.

----- COMMENTS -----
This is exactly what we need! Taking attendance on paper is so outdated.
+1 Would love to see this integrated with the reporting feature too!
