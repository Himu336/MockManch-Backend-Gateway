# Dashboard API - Frontend Reference

Complete API reference for the MockManch Dashboard feature.

## Base URL
```
http://your-backend-url/api/v1/dashboard
```

---

## 📊 API Endpoints

### 1. Get Complete Dashboard Data
**Get all dashboard information in one request (recommended for initial load)**

**Endpoint:** `GET /api/v1/dashboard`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `user_id` | string | ✅ Yes | User identifier |

**Example Request:**
```javascript
const response = await fetch('/api/v1/dashboard?user_id=user123');
const data = await response.json();
```

**Success Response (200):**
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
        "id": "uuid-here",
        "interviewType": "Video Interview",
        "jobRole": "Senior Developer",
        "company": "Google",
        "score": 85,
        "completedAt": "2024-01-15T10:30:00Z",
        "dateLabel": "Today"
      },
      {
        "id": "uuid-here",
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

### 2. Get Dashboard Summary Only
**Get only summary statistics (faster for quick updates)**

**Endpoint:** `GET /api/v1/dashboard/summary`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `user_id` | string | ✅ Yes | User identifier |

**Example Request:**
```javascript
const response = await fetch('/api/v1/dashboard/summary?user_id=user123');
const { data } = await response.json();
```

**Success Response (200):**
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
**Get user goals with progress tracking**

**Endpoint:** `GET /api/v1/dashboard/goals`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `user_id` | string | ✅ Yes | User identifier |

**Example Request:**
```javascript
const response = await fetch('/api/v1/dashboard/goals?user_id=user123');
const { data } = await response.json();
```

**Success Response (200):**
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
- `weekly_practice`: Days practiced this week (target: 7 days)
- `interview_mastery`: Total completed interviews (target: 25)
- `communication_skills`: Communication skill level (target: 5 levels)

**Progress Calculation:**
```javascript
const progress = (currentValue / targetValue) * 100; // Already calculated in response
```

---

### 4. Get Recent Activity
**Get last 10 completed interview sessions**

**Endpoint:** `GET /api/v1/dashboard/recent-activity`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `user_id` | string | ✅ Yes | User identifier |

**Example Request:**
```javascript
const response = await fetch('/api/v1/dashboard/recent-activity?user_id=user123');
const { data } = await response.json();
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-here",
      "interviewType": "Video Interview",
      "jobRole": "Senior Developer",
      "company": "Google",
      "score": 85,
      "completedAt": "2024-01-15T10:30:00Z",
      "dateLabel": "Today"
    },
    {
      "id": "uuid-here",
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
- `"Video Interview"` - Voice/Video interviews
- `"Text Interview"` - Text-based interviews

**Date Labels:**
- `"Today"` - Completed today
- `"Yesterday"` - Completed yesterday
- `"Jan 15"` - Date format for older entries

---

### 5. Get Areas to Improve
**Get skill assessments sorted by score (lowest first)**

**Endpoint:** `GET /api/v1/dashboard/areas-to-improve`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `user_id` | string | ✅ Yes | User identifier |

**Example Request:**
```javascript
const response = await fetch('/api/v1/dashboard/areas-to-improve?user_id=user123');
const { data } = await response.json();
```

**Success Response (200):**
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
- `"green"`: Score >= 70 (Good)
- `"yellow"`: Score >= 50 and < 70 (Needs Improvement)
- `"red"`: Score < 50 (Needs Significant Improvement)

**Skill Names:**
- `"Behavioral Questions"`
- `"Technical Depth"`
- `"Communication Clarity"`

---

### 6. Record Interview Session
**Record a completed interview session (call this after interview completion)**

**Endpoint:** `POST /api/v1/dashboard/record-session`

**Request Body:**
```json
{
  "user_id": "user123",
  "session_id": "session-uuid-from-interview-api",
  "interview_type": "voice",
  "job_role": "Senior Developer",
  "company": "Google",
  "experience_level": "Senior Level",
  "duration_minutes": 30
}
```

**Request Body Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `user_id` | string | ✅ Yes | User identifier |
| `session_id` | string | ✅ Yes | Session ID from interview/voice-interview API |
| `interview_type` | string | ✅ Yes | `"text"`, `"voice"`, or `"video"` |
| `job_role` | string | ❌ No | Job role for the interview |
| `company` | string | ❌ No | Company name |
| `experience_level` | string | ❌ No | Experience level |
| `duration_minutes` | number | ❌ No | Interview duration in minutes |

**Example Request:**
```javascript
const response = await fetch('/api/v1/dashboard/record-session', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    user_id: 'user123',
    session_id: 'session-uuid-here',
    interview_type: 'voice',
    job_role: 'Senior Developer',
    company: 'Google',
    duration_minutes: 30
  })
});

const data = await response.json();
```

**Success Response (200):**
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

**Error Response (400) - Invalid interview_type:**
```json
{
  "success": false,
  "error": "interview_type must be 'text', 'voice', or 'video'"
}
```

---

## 🚀 Frontend Integration Examples

### React/Next.js Example

```typescript
// hooks/useDashboard.ts
import { useState, useEffect } from 'react';

interface DashboardData {
  summary: {
    interviewsDone: number;
    avgScore: number;
    practiceHours: number;
    achievements: number;
  };
  goals: Array<{
    goalType: string;
    currentValue: number;
    targetValue: number;
    progress: number;
  }>;
  recentActivity: Array<{
    id: string;
    interviewType: string;
    jobRole: string;
    company?: string;
    score: number;
    completedAt: string;
    dateLabel: string;
  }>;
  areasToImprove: Array<{
    skillName: string;
    score: number;
    progressColor: string;
  }>;
}

export const useDashboard = (userId: string) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/v1/dashboard?user_id=${userId}`
        );
        const result = await response.json();
        
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchDashboard();
    }
  }, [userId]);

  return { data, loading, error };
};

// Usage in component
const Dashboard = () => {
  const { data, loading, error } = useDashboard('user123');

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return null;

  return (
    <div>
      <h1>Dashboard</h1>
      <div>
        <p>Interviews Done: {data.summary.interviewsDone}</p>
        <p>Avg Score: {data.summary.avgScore}%</p>
        <p>Practice Hours: {data.summary.practiceHours}</p>
        <p>Achievements: {data.summary.achievements}</p>
      </div>
      {/* Render goals, recent activity, areas to improve */}
    </div>
  );
};
```

### Recording Interview Session

```typescript
// utils/dashboard.ts
export const recordInterviewSession = async (
  userId: string,
  sessionId: string,
  interviewType: 'text' | 'voice' | 'video',
  options?: {
    jobRole?: string;
    company?: string;
    experienceLevel?: string;
    durationMinutes?: number;
  }
) => {
  try {
    const response = await fetch('/api/v1/dashboard/record-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        session_id: sessionId,
        interview_type: interviewType,
        ...options,
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Failed to record interview session:', error);
    throw error;
  }
};

// Usage after interview completion
await recordInterviewSession(
  'user123',
  interviewSessionId,
  'voice',
  {
    jobRole: 'Senior Developer',
    company: 'Google',
    durationMinutes: 30
  }
);
```

### Polling for Updates

```typescript
// hooks/useDashboardPolling.ts
import { useEffect, useRef } from 'react';

export const useDashboardPolling = (
  userId: string,
  onUpdate: (data: any) => void,
  interval: number = 30000 // 30 seconds
) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await fetch(
          `/api/v1/dashboard/summary?user_id=${userId}`
        );
        const result = await response.json();
        if (result.success) {
          onUpdate(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard summary:', error);
      }
    };

    // Fetch immediately
    fetchSummary();

    // Set up polling
    intervalRef.current = setInterval(fetchSummary, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [userId, interval, onUpdate]);
};
```

---

## 📝 Complete Integration Flow

### 1. On Dashboard Page Load
```javascript
// Fetch complete dashboard data
const response = await fetch(`/api/v1/dashboard?user_id=${userId}`);
const { data } = await response.json();

// Display:
// - data.summary (interviewsDone, avgScore, practiceHours, achievements)
// - data.goals (with progress bars)
// - data.recentActivity (list of recent interviews)
// - data.areasToImprove (skill assessments)
```

### 2. After Interview Completion
```javascript
// After text interview completes
await fetch('/api/v1/dashboard/record-session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: userId,
    session_id: textInterviewSessionId,
    interview_type: 'text',
    job_role: jobRole,
    company: company,
    duration_minutes: duration
  })
});

// After voice interview completes
await fetch('/api/v1/dashboard/record-session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: userId,
    session_id: voiceInterviewSessionId,
    interview_type: 'voice',
    job_role: jobRole,
    company: company,
    duration_minutes: duration
  })
});
```

### 3. Real-time Updates (Optional)
```javascript
// Poll summary every 30 seconds for live updates
setInterval(async () => {
  const response = await fetch(`/api/v1/dashboard/summary?user_id=${userId}`);
  const { data } = await response.json();
  updateDashboardStats(data);
}, 30000);
```

---

## 🎨 UI Component Mapping

### Summary Cards
```typescript
// Use: data.summary
const SummaryCards = ({ summary }) => (
  <>
    <Card title="Interviews Done" value={summary.interviewsDone} icon="📄" />
    <Card title="Avg Score" value={`${summary.avgScore}%`} icon="📈" />
    <Card title="Practice Hours" value={summary.practiceHours} icon="⏰" />
    <Card title="Achievements" value={summary.achievements} icon="🏆" />
  </>
);
```

### Goals Progress Bars
```typescript
// Use: data.goals
const GoalsList = ({ goals }) => (
  <>
    {goals.map(goal => (
      <ProgressBar
        key={goal.goalType}
        label={getGoalLabel(goal.goalType)}
        current={goal.currentValue}
        target={goal.targetValue}
        progress={goal.progress}
      />
    ))}
  </>
);
```

### Recent Activity List
```typescript
// Use: data.recentActivity
const RecentActivity = ({ activities }) => (
  <ul>
    {activities.map(activity => (
      <li key={activity.id}>
        <span>{activity.interviewType}</span>
        <span>{activity.jobRole}</span>
        {activity.company && <span>• {activity.company}</span>}
        <span>{activity.dateLabel}</span>
        <Badge score={activity.score} />
      </li>
    ))}
  </ul>
);
```

### Areas to Improve
```typescript
// Use: data.areasToImprove
const SkillAreas = ({ areas }) => (
  <>
    {areas.map(area => (
      <SkillCard
        key={area.skillName}
        name={area.skillName}
        score={area.score}
        color={area.progressColor}
      />
    ))}
  </>
);
```

---

## ⚠️ Error Handling

All endpoints return consistent error format:

```typescript
interface ErrorResponse {
  success: false;
  error: string;
}
```

**HTTP Status Codes:**
- `200`: Success
- `400`: Bad Request (missing/invalid parameters)
- `500`: Internal Server Error

**Example Error Handling:**
```typescript
try {
  const response = await fetch(`/api/v1/dashboard?user_id=${userId}`);
  const result = await response.json();
  
  if (!result.success) {
    // Handle error
    console.error('API Error:', result.error);
    showErrorToast(result.error);
    return;
  }
  
  // Use result.data
  setDashboardData(result.data);
} catch (error) {
  // Handle network error
  console.error('Network Error:', error);
  showErrorToast('Failed to connect to server');
}
```

---

## 🔄 Data Refresh Strategy

1. **Initial Load**: Use `/api/v1/dashboard` for complete data
2. **Quick Updates**: Use `/api/v1/dashboard/summary` for faster polling
3. **After Actions**: Refresh after recording new sessions
4. **Optimistic Updates**: Update UI immediately, sync with server

---

## 📌 Important Notes

1. **Always call `/record-session`** after interview completion to update dashboard
2. **Use `user_id` consistently** across all requests
3. **Progress is pre-calculated** in goals response (0-100%)
4. **Date labels are formatted** ("Today", "Yesterday", or date)
5. **Progress colors** indicate skill level (green/yellow/red)
6. **Default goals** are created automatically for new users

---

## 🚨 Quick Reference

| Endpoint | Method | Purpose | When to Use |
|----------|--------|---------|-------------|
| `/dashboard` | GET | Complete dashboard data | Initial page load |
| `/dashboard/summary` | GET | Summary stats only | Quick updates, polling |
| `/dashboard/goals` | GET | User goals | Goals section |
| `/dashboard/recent-activity` | GET | Recent interviews | Activity feed |
| `/dashboard/areas-to-improve` | GET | Skill assessments | Improvement section |
| `/dashboard/record-session` | POST | Record interview | After interview completion |

---

**Need Help?** Check the full documentation in `DASHBOARD_API_DOCUMENTATION.md`

