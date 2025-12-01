# Dashboard API - Quick Reference Cheat Sheet

## 🚀 All Endpoints

### Base URL
```
/api/v1/dashboard
```

---

## 📋 Endpoint Summary

### 1. **GET** `/dashboard?user_id={userId}`
**Get complete dashboard data**
```javascript
fetch(`/api/v1/dashboard?user_id=${userId}`)
```

### 2. **GET** `/dashboard/summary?user_id={userId}`
**Get summary statistics only**
```javascript
fetch(`/api/v1/dashboard/summary?user_id=${userId}`)
```

### 3. **GET** `/dashboard/goals?user_id={userId}`
**Get user goals**
```javascript
fetch(`/api/v1/dashboard/goals?user_id=${userId}`)
```

### 4. **GET** `/dashboard/recent-activity?user_id={userId}`
**Get recent activity (last 10 interviews)**
```javascript
fetch(`/api/v1/dashboard/recent-activity?user_id=${userId}`)
```

### 5. **GET** `/dashboard/areas-to-improve?user_id={userId}`
**Get skill assessments**
```javascript
fetch(`/api/v1/dashboard/areas-to-improve?user_id=${userId}`)
```

### 6. **POST** `/dashboard/record-session`
**Record completed interview**
```javascript
fetch('/api/v1/dashboard/record-session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: userId,
    session_id: sessionId,
    interview_type: 'voice', // or 'text' or 'video'
    job_role: 'Senior Developer',
    company: 'Google',
    duration_minutes: 30
  })
})
```

---

## 📦 Response Structures

### Complete Dashboard Response
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
      }
    ],
    "recentActivity": [...],
    "areasToImprove": [...]
  }
}
```

### Summary Only
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

### Goals
```json
{
  "success": true,
  "data": [
    {
      "goalType": "weekly_practice",
      "currentValue": 5,
      "targetValue": 7,
      "progress": 71
    }
  ]
}
```

### Recent Activity
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
    }
  ]
}
```

### Areas to Improve
```json
{
  "success": true,
  "data": [
    {
      "skillName": "Technical Depth",
      "score": 58,
      "progressColor": "red"
    }
  ]
}
```

---

## 🎯 Quick Integration

### React Hook Example
```typescript
const useDashboard = (userId: string) => {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetch(`/api/v1/dashboard?user_id=${userId}`)
      .then(res => res.json())
      .then(result => {
        if (result.success) setData(result.data);
      });
  }, [userId]);
  
  return data;
};
```

### Record Session After Interview
```typescript
const recordSession = async (userId, sessionId, type) => {
  await fetch('/api/v1/dashboard/record-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      session_id: sessionId,
      interview_type: type
    })
  });
};
```

---

## ⚡ When to Use Each Endpoint

| Use Case | Endpoint |
|----------|----------|
| Initial dashboard load | `GET /dashboard` |
| Quick stats update | `GET /dashboard/summary` |
| Show goals section | `GET /dashboard/goals` |
| Show activity feed | `GET /dashboard/recent-activity` |
| Show skills section | `GET /dashboard/areas-to-improve` |
| After interview completes | `POST /dashboard/record-session` |

---

## 🔑 Key Points

- ✅ All GET requests require `user_id` query parameter
- ✅ All responses have `success` boolean and `data` or `error`
- ✅ Progress is pre-calculated (0-100%) in goals
- ✅ Date labels: "Today", "Yesterday", or formatted date
- ✅ Progress colors: "green" (≥70), "yellow" (50-69), "red" (<50)
- ✅ Always call `record-session` after interview completion

---

**Full Documentation:** See `DASHBOARD_API_FRONTEND_REFERENCE.md`

