# Dashboard API Documentation

Complete API documentation for the MockManch Dashboard feature.

## Base URL
```
/api/v1/dashboard
```

## Overview

The Dashboard API provides comprehensive analytics and tracking for user interview practice sessions. It includes:

- **Summary Statistics**: Total interviews, average score, practice hours, achievements
- **Goals Tracking**: Weekly practice, interview mastery, communication skills
- **Recent Activity**: Last 10 completed interviews
- **Areas to Improve**: Skill assessments with scores

## Endpoints

### 1. Get Complete Dashboard Data

Get all dashboard data in a single request (optimized with parallel queries).

**Endpoint:** `GET /api/v1/dashboard`

**Query Parameters:**
- `user_id` (required): User identifier

**Response (200):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "interviewsDone": 24,
      "avgScore": 78.5,
      "practiceHours": 12.5,
      "achievements": 8
    },
    "goals": [
      {
        "goalType": "weekly_practice",
        "currentValue": 5,
        "targetValue": 7,
        "progress": 71
      },
      {
        "goalType": "interview_mastery",
        "currentValue": 18,
        "targetValue": 25,
        "progress": 72
      },
      {
        "goalType": "communication_skills",
        "currentValue": 3,
        "targetValue": 5,
        "progress": 60
      }
    ],
    "recentActivity": [
      {
        "id": "uuid",
        "interviewType": "Video Interview",
        "jobRole": "Senior Developer",
        "company": "Google",
        "score": 85,
        "completedAt": "2024-01-15T10:30:00Z",
        "dateLabel": "Today"
      },
      {
        "id": "uuid",
        "interviewType": "Text Interview",
        "jobRole": "Product Manager",
        "company": "Microsoft",
        "score": 72,
        "completedAt": "2024-01-14T15:20:00Z",
        "dateLabel": "Yesterday"
      }
    ],
    "areasToImprove": [
      {
        "skillName": "Technical Depth",
        "score": 58,
        "progressColor": "red"
      },
      {
        "skillName": "Behavioral Questions",
        "score": 65,
        "progressColor": "green"
      },
      {
        "skillName": "Communication Clarity",
        "score": 71,
        "progressColor": "green"
      }
    ]
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "user_id query parameter is required"
}
```

---

### 2. Get Dashboard Summary

Get only the summary statistics (faster for quick updates).

**Endpoint:** `GET /api/v1/dashboard/summary`

**Query Parameters:**
- `user_id` (required): User identifier

**Response (200):**
```json
{
  "success": true,
  "data": {
    "interviewsDone": 24,
    "avgScore": 78.5,
    "practiceHours": 12.5,
    "achievements": 8
  }
}
```

---

### 3. Get User Goals

Get user goals with progress tracking.

**Endpoint:** `GET /api/v1/dashboard/goals`

**Query Parameters:**
- `user_id` (required): User identifier

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "goalType": "weekly_practice",
      "currentValue": 5,
      "targetValue": 7,
      "progress": 71
    },
    {
      "goalType": "interview_mastery",
      "currentValue": 18,
      "targetValue": 25,
      "progress": 72
    },
    {
      "goalType": "communication_skills",
      "currentValue": 3,
      "targetValue": 5,
      "progress": 60
    }
  ]
}
```

**Goal Types:**
- `weekly_practice`: Days practiced this week (target: 7)
- `interview_mastery`: Total completed interviews (target: 25)
- `communication_skills`: Communication skill level (target: 5)

---

### 4. Get Recent Activity

Get the last 10 completed interview sessions.

**Endpoint:** `GET /api/v1/dashboard/recent-activity`

**Query Parameters:**
- `user_id` (required): User identifier

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "interviewType": "Video Interview",
      "jobRole": "Senior Developer",
      "company": "Google",
      "score": 85,
      "completedAt": "2024-01-15T10:30:00Z",
      "dateLabel": "Today"
    },
    {
      "id": "uuid",
      "interviewType": "Text Interview",
      "jobRole": "Product Manager",
      "score": 72,
      "completedAt": "2024-01-14T15:20:00Z",
      "dateLabel": "Yesterday"
    }
  ]
}
```

**Interview Types:**
- `"Video Interview"` (for voice interviews)
- `"Text Interview"` (for text interviews)

**Date Labels:**
- `"Today"` - Completed today
- `"Yesterday"` - Completed yesterday
- `"Jan 15"` - Date format for older entries

---

### 5. Get Areas to Improve

Get skill assessments sorted by score (lowest first).

**Endpoint:** `GET /api/v1/dashboard/areas-to-improve`

**Query Parameters:**
- `user_id` (required): User identifier

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "skillName": "Technical Depth",
      "score": 58,
      "progressColor": "red"
    },
    {
      "skillName": "Behavioral Questions",
      "score": 65,
      "progressColor": "green"
    },
    {
      "skillName": "Communication Clarity",
      "score": 71,
      "progressColor": "green"
    }
  ]
}
```

**Progress Colors:**
- `"green"`: Score >= 70
- `"yellow"`: Score >= 50 and < 70
- `"red"`: Score < 50

**Skill Names:**
- `"Behavioral Questions"`
- `"Technical Depth"`
- `"Communication Clarity"`

---

### 6. Record Interview Session

Record a completed interview session. This should be called after an interview is completed to update dashboard statistics.

**Endpoint:** `POST /api/v1/dashboard/record-session`

**Request Body:**
```json
{
  "user_id": "user123",
  "session_id": "session-uuid-from-microservice",
  "interview_type": "voice",
  "job_role": "Senior Developer",
  "company": "Google",
  "experience_level": "Senior Level",
  "duration_minutes": 30
}
```

**Required Fields:**
- `user_id` (string): User identifier
- `session_id` (string): Session ID from interview microservice
- `interview_type` (string): `"text"`, `"voice"`, or `"video"`

**Optional Fields:**
- `job_role` (string): Job role for the interview
- `company` (string): Company name
- `experience_level` (string): Experience level
- `duration_minutes` (number): Interview duration in minutes

**Response (200):**
```json
{
  "success": true,
  "data": {
    "success": true
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "user_id, session_id, and interview_type are required"
}
```

**Note:** This endpoint will:
1. Fetch analysis from the microservice
2. Store the interview session
3. Update user statistics
4. Update goals progress
5. Update skill assessments
6. Check and award achievements

---

## Database Schema

The dashboard uses the following PostgreSQL schemas:

### `dashboard.interview_sessions`
Stores completed interview sessions with scores and analysis data.

### `dashboard.user_statistics`
Cached aggregated statistics for fast dashboard loading.

### `dashboard.user_goals`
Tracks user goals (weekly practice, interview mastery, communication skills).

### `dashboard.achievements`
User achievements and milestones.

### `dashboard.skill_assessments`
Skill scores for areas to improve.

### `dashboard.weekly_practice`
Weekly practice tracking for goals.

---

## Integration Guide

### Frontend Integration

1. **On Dashboard Load:**
   ```javascript
   const response = await fetch(`/api/v1/dashboard?user_id=${userId}`);
   const { data } = await response.json();
   ```

2. **After Interview Completion:**
   ```javascript
   await fetch('/api/v1/dashboard/record-session', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       user_id: userId,
       session_id: sessionId,
       interview_type: 'voice', // or 'text'
       job_role: jobRole,
       company: company,
       duration_minutes: duration
     })
   });
   ```

3. **Polling for Updates:**
   ```javascript
   // Poll summary every 30 seconds for real-time updates
   setInterval(async () => {
     const response = await fetch(`/api/v1/dashboard/summary?user_id=${userId}`);
     const { data } = await response.json();
     updateDashboard(data);
   }, 30000);
   ```

---

## Performance Optimizations

1. **Parallel Queries**: The main dashboard endpoint uses `Promise.all()` to fetch data in parallel
2. **Cached Statistics**: User statistics are cached and updated incrementally
3. **Indexed Queries**: Database queries use indexed columns (userId, sessionId)
4. **Selective Updates**: Only updates changed data when recording sessions

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message here"
}
```

Common HTTP status codes:
- `200`: Success
- `400`: Bad Request (missing/invalid parameters)
- `500`: Internal Server Error

---

## Migration

To set up the database schema, run:

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

Make sure `DATABASE_URL` is set in your `.env` file.

---

## Notes

- Statistics are automatically updated when recording sessions
- Goals are recalculated on each dashboard load
- Skill assessments are updated from interview analysis data
- Achievements are automatically awarded based on milestones
- Default goals are created automatically for new users

