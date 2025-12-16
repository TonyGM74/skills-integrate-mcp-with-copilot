# Multi-Institution Activities API

A FastAPI application that allows students to view and sign up for extracurricular activities across multiple educational institutions.

## Features

- Support for multiple institutions (universities, schools, academies)
- View all available extracurricular activities
- Filter activities by institution
- Sign up for activities
- View institutions list

## Getting Started

1. Install the dependencies:

   ```
   pip install fastapi uvicorn
   ```

2. Run the application:

   ```
   python app.py
   ```

3. Open your browser and go to:
   - Web interface: http://localhost:8000
   - API documentation: http://localhost:8000/docs
   - Alternative documentation: http://localhost:8000/redoc

## API Endpoints

| Method | Endpoint                                                          | Description                                                         |
| ------ | ----------------------------------------------------------------- | ------------------------------------------------------------------- |
| GET    | `/institutions`                                                   | Get all institutions with their details                             |
| GET    | `/activities`                                                     | Get all activities with their details and current participant count |
| GET    | `/activities?institution_id={id}`                                 | Get activities filtered by institution                              |
| POST   | `/activities/{activity_name}/signup?email=student@example.edu`   | Sign up for an activity                                             |
| DELETE | `/activities/{activity_name}/unregister?email=student@example.edu` | Unregister from an activity                                       |

## Data Model

The application uses a simple data model with meaningful identifiers:

1. **Institutions** - Uses institution ID as identifier:
   - Name
   - Type (university, high_school, academy, etc.)
   - Location

2. **Activities** - Uses activity name as identifier:
   - Description
   - Schedule
   - Maximum number of participants allowed
   - List of student emails who are signed up
   - Institution ID (links activity to an institution)

3. **Students** - Uses email as identifier:
   - Name
   - Grade level

All data is stored in memory, which means data will be reset when the server restarts.

## Multi-Institution Support

The platform now supports managing clubs and events from different educational institutions:

- Each activity is associated with a specific institution
- Users can filter activities by institution using the dropdown selector
- The API supports querying activities for specific institutions
- New institutions can be added to the `institutions` dictionary in `app.py`
