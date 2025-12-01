# Analytics API Documentation

This document describes the Analytics API endpoints for the MockManch platform. The analytics feature provides comprehensive insights into user performance, skills, weak areas, and achievements.

## Base URL

All analytics endpoints are prefixed with `/api/v1/analytics`

## Authentication

All endpoints require a `user_id` query parameter. For authenticated routes, include the Bearer token in the Authorization header.

## Endpoints

### 1. Get Analytics Overview

**Endpoint:** `GET /api/v1/analytics/overview`

**Description:** Returns comprehensive analytics overview including overall score, interviews count, study time, achievements, score progression, and performance by category.

**Query Parameters:**
- `user_id` (required): The user ID to fetch analytics for

**Response:**
```json
{
  "success": true,
  "data": {
    "overallScore": {
      "value": 82,
      "change": 7,
      "changeType": "increase"
    },
    "interviews": {
      "count": 24,
      "period": "This month"
    },
    "studyTime": {
      "hours": 12.5,
      "period": "This week"
    },
    "achievements": {
      "unlocked": 8,
      "total": 12
    },
    "scoreProgression": [
      {
        "week": "Week 1",
        "score": 65
      },
      {
        "week": "Week 2",
        "score": 68
      },
      {
        "week": "Week 3",
        "score": 72
      },
      {
        "week": "Week 4",
        "score": 76
      },
      {
        "week": "Week 5",
        "score": 80
      },
      {
        "week": "Week 6",
        "score": 82
      }
    ],
    "performanceByCategory": [
      {
        "category": "Technical",
        "currentScore": 85,
        "targetScore": 95
      },
      {
        "category": "Behavioral",
        "currentScore": 70,
        "targetScore": 85
      },
      {
        "category": "Problem Solving",
        "currentScore": 78,
        "targetScore": 95
      }
    ]
  }
}
```

**Response Fields:**
- `overallScore.value`: Current average score (0-100)
- `overallScore.change`: Change from last week (positive or negative)
- `overallScore.changeType`: "increase", "decrease", or "neutral"
- `interviews.count`: Number of interviews in the specified period
- `interviews.period`: "This month", "This week", or "All time"
- `studyTime.hours`: Total study time in hours
- `studyTime.period`: "This week", "This month", or "All time"
- `achievements.unlocked`: Number of unlocked achievements
- `achievements.total`: Total number of available achievements
- `scoreProgression`: Array of weekly score data (last 6 weeks)
- `performanceByCategory`: Array of category performance data

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/v1/analytics/overview?user_id=user123"
```

---

### 2. Get Skills Breakdown

**Endpoint:** `GET /api/v1/analytics/skills-breakdown`

**Description:** Returns skills breakdown data for radar chart visualization and detailed skill scores.

**Query Parameters:**
- `user_id` (required): The user ID to fetch skills breakdown for

**Response:**
```json
{
  "success": true,
  "data": {
    "radarData": [
      {
        "skill": "Technical",
        "score": 85
      },
      {
        "skill": "Behavioral",
        "score": 72
      },
      {
        "skill": "Communication",
        "score": 80
      },
      {
        "skill": "Leadership",
        "score": 68
      },
      {
        "skill": "Problem Solving",
        "score": 78
      },
      {
        "skill": "System Design",
        "score": 75
      }
    ],
    "skillDetails": [
      {
        "skillName": "Technical",
        "score": 85,
        "maxScore": 100
      },
      {
        "skillName": "Behavioral",
        "score": 72,
        "maxScore": 100
      },
      {
        "skillName": "Communication",
        "score": 80,
        "maxScore": 100
      },
      {
        "skillName": "Leadership",
        "score": 68,
        "maxScore": 100
      },
      {
        "skillName": "Problem Solving",
        "score": 78,
        "maxScore": 100
      },
      {
        "skillName": "System Design",
        "score": 75,
        "maxScore": 100
      }
    ]
  }
}
```

**Response Fields:**
- `radarData`: Array of skills with scores for radar chart visualization
- `skillDetails`: Array of detailed skill information with scores out of 100

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/v1/analytics/skills-breakdown?user_id=user123"
```

---

### 3. Get Weak Areas

**Endpoint:** `GET /api/v1/analytics/weak-areas`

**Description:** Returns areas that need attention, including practice sessions, recommended sessions, and progress.

**Query Parameters:**
- `user_id` (required): The user ID to fetch weak areas for

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "topic": "Handling Conflict",
      "practiceSessions": 3,
      "recommendedSessions": 5,
      "progressPercentage": 58,
      "score": 58,
      "improvementPercentage": 12
    },
    {
      "topic": "System Design Scale",
      "practiceSessions": 5,
      "recommendedSessions": 5,
      "progressPercentage": 62,
      "score": 62,
      "improvementPercentage": 8
    },
    {
      "topic": "Salary Negotiation",
      "practiceSessions": 2,
      "recommendedSessions": 5,
      "progressPercentage": 55,
      "score": 55,
      "improvementPercentage": 5
    }
  ]
}
```

**Response Fields:**
- `topic`: Name of the topic/area
- `practiceSessions`: Number of practice sessions completed for this topic
- `recommendedSessions`: Recommended number of additional sessions
- `progressPercentage`: Progress percentage (0-100)
- `score`: Current score for this topic (0-100)
- `improvementPercentage`: Improvement percentage from previous period

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/v1/analytics/weak-areas?user_id=user123"
```

---

### 4. Get Achievements

**Endpoint:** `GET /api/v1/analytics/achievements`

**Description:** Returns all achievements (both unlocked and locked) for the user. Automatically checks and updates achievements before returning.

**Query Parameters:**
- `user_id` (required): The user ID to fetch achievements for

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-here",
      "achievementType": "7_day_streak",
      "achievementName": "7-Day Streak",
      "description": "Practiced 7 days in a row.",
      "unlocked": true,
      "unlockedAt": "2024-01-15T10:30:00Z"
    },
    {
      "id": "uuid-here",
      "achievementType": "interview_master",
      "achievementName": "Interview Master",
      "description": "Completed 25 mock interviews.",
      "unlocked": true,
      "unlockedAt": "2024-01-20T14:20:00Z"
    },
    {
      "id": "",
      "achievementType": "team_player",
      "achievementName": "Team Player",
      "description": "Joined 5 group sessions.",
      "unlocked": false
    },
    {
      "id": "",
      "achievementType": "perfect_score",
      "achievementName": "Perfect Score",
      "description": "Scored 95+ on an interview.",
      "unlocked": false
    },
    {
      "id": "",
      "achievementType": "consistency_king",
      "achievementName": "Consistency King",
      "description": "30-day practice streak.",
      "unlocked": false
    }
  ]
}
```

**Response Fields:**
- `id`: Achievement ID (empty string if not unlocked)
- `achievementType`: Unique identifier for the achievement type
- `achievementName`: Display name of the achievement
- `description`: Description of what the achievement represents
- `unlocked`: Boolean indicating if the achievement is unlocked
- `unlockedAt`: ISO timestamp when achievement was unlocked (only if unlocked)

**Available Achievement Types:**
- `7_day_streak`: Practiced 7 days in a row
- `interview_master`: Completed 25 mock interviews
- `quick_learner`: Improved score by 20 points
- `team_player`: Joined 5 group sessions
- `perfect_score`: Scored 95+ on an interview
- `consistency_king`: 30-day practice streak

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/v1/analytics/achievements?user_id=user123"
```

---

### 5. Check and Update Achievements

**Endpoint:** `POST /api/v1/analytics/check-achievements`

**Description:** Manually triggers achievement checking and updating for a user. This is useful after completing interviews or other activities.

**Request Body:**
```json
{
  "user_id": "user123"
}
```

**Or Query Parameter:**
- `user_id` (required): The user ID to check achievements for

**Response:**
```json
{
  "success": true,
  "message": "Achievements checked and updated"
}
```

**Example Request:**
```bash
curl -X POST "http://localhost:3000/api/v1/analytics/check-achievements" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "user123"}'
```

---

## Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

**Common Error Codes:**
- `400`: Bad Request - Missing or invalid parameters
- `500`: Internal Server Error - Server-side error

**Example Error Response:**
```json
{
  "success": false,
  "error": "user_id query parameter is required"
}
```

---

## Frontend Integration Guide

### Overview Tab

Use the `/overview` endpoint to populate:
- Overall Score card with change indicator
- Interviews count card
- Study Time card
- Achievements card
- Score Progression line chart
- Performance by Category bar chart

### Skills Breakdown Tab

Use the `/skills-breakdown` endpoint to populate:
- Skills Radar chart (hexagonal radar visualization)
- Skill Details list with progress bars

### Weak Areas Tab

Use the `/weak-areas` endpoint to populate:
- Areas Needing Attention list with:
  - Practice sessions count
  - Recommended sessions
  - Progress bars
  - Score and improvement percentage

### Achievements Tab

Use the `/achievements` endpoint to populate:
- Achievement cards grid
- Show unlocked achievements with "Unlocked" badge
- Show locked achievements with greyed-out styling

---

## Data Flow

1. When an interview session is completed, it's recorded via `/api/v1/dashboard/record-session`
2. The system automatically:
   - Updates user statistics
   - Updates skill assessments
   - Checks and awards achievements
3. Analytics endpoints read from these updated tables to provide real-time insights

---

## Performance Considerations

- Analytics data is calculated in real-time from interview sessions
- Consider caching for frequently accessed data
- Weekly progressions are calculated from the last 6 weeks of data
- Skill scores are based on the latest assessment for each skill

---

## Notes

- All scores are on a 0-100 scale
- Time periods (week, month) are calculated based on the current date
- Achievement checking happens automatically when fetching achievements, but can be manually triggered
- Weak areas are sorted by score (lowest first) and limited to top 3

