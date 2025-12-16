# Student Enrollment Feature

## Overview

This document describes the student enrollment feature for extracurricular activities at Mergington High School.

## Features

The enrollment system provides the following functionality:

### 1. View Available Activities
- Endpoint: `GET /activities`
- Returns a list of all available extracurricular activities
- Each activity includes:
  - Description
  - Schedule
  - Maximum participants
  - Current participants list

### 2. Enroll in an Activity
- Endpoint: `POST /activities/{activity_name}/signup?email={student_email}`
- Allows students to enroll in extracurricular activities
- **Validations:**
  - ✅ Validates that the activity exists
  - ✅ Validates that the student is not already enrolled
  - Returns appropriate error messages for validation failures

### 3. Unregister from an Activity
- Endpoint: `DELETE /activities/{activity_name}/unregister?email={student_email}`
- Allows students to withdraw from activities
- **Validations:**
  - ✅ Validates that the activity exists
  - ✅ Validates that the student is currently enrolled
  - Returns appropriate error messages for validation failures

## API Examples

### Successful Enrollment
```bash
curl -X POST "http://localhost:8000/activities/Chess%20Club/signup?email=student@mergington.edu"
```

Response:
```json
{
  "message": "Signed up student@mergington.edu for Chess Club"
}
```

### Already Enrolled Error
```bash
curl -X POST "http://localhost:8000/activities/Chess%20Club/signup?email=michael@mergington.edu"
```

Response (400 Bad Request):
```json
{
  "detail": "Student is already signed up"
}
```

### Activity Not Found Error
```bash
curl -X POST "http://localhost:8000/activities/NonExistent/signup?email=student@mergington.edu"
```

Response (404 Not Found):
```json
{
  "detail": "Activity not found"
}
```

## Testing

The enrollment feature includes comprehensive tests covering:

1. **Successful enrollment** - Verifies students can enroll in activities
2. **Duplicate enrollment prevention** - Ensures students cannot enroll twice
3. **Activity validation** - Confirms non-existent activities are rejected
4. **Unregistration** - Tests successful withdrawal from activities
5. **Unregistration validation** - Ensures only enrolled students can unregister

### Running Tests

```bash
# Install test dependencies
pip install pytest httpx

# Run all tests
pytest test_app.py -v

# Run specific test
pytest test_app.py::test_signup_for_activity_success -v
```

### Test Results

All 7 tests pass successfully:
- ✅ test_signup_for_activity_success
- ✅ test_signup_for_nonexistent_activity
- ✅ test_signup_for_already_enrolled_student
- ✅ test_get_activities
- ✅ test_unregister_from_activity_success
- ✅ test_unregister_from_nonexistent_activity
- ✅ test_unregister_student_not_enrolled

## Security

The feature has been scanned for security vulnerabilities using CodeQL:
- ✅ No security vulnerabilities detected
- ✅ All inputs are properly validated
- ✅ HTTP status codes are correctly used

## Implementation Details

The enrollment feature is implemented in `/src/app.py` with the following key functions:

- `signup_for_activity()` - Handles student enrollment
- `unregister_from_activity()` - Handles student withdrawal
- `get_activities()` - Returns available activities

All enrollment data is stored in-memory in the `activities` dictionary.

## Frontend Integration

The web interface (`/src/static/app.js`) provides:
- Display of all available activities
- Sign-up form for students
- Real-time updates after enrollment
- Visual participant list with delete functionality

## Compliance

The implementation meets all requirements specified in the problem statement:
- ✅ Permitir que los estudiantes se inscriban a una actividad extracurricular
- ✅ Validar que no estén ya inscritos
- ✅ Validar que la actividad exista
