# Analytics API Quick Reference

## Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/analytics/overview` | GET | Get analytics overview (score, interviews, study time, achievements, charts) |
| `/api/v1/analytics/skills-breakdown` | GET | Get skills breakdown (radar chart data + skill details) |
| `/api/v1/analytics/weak-areas` | GET | Get weak areas that need attention |
| `/api/v1/analytics/achievements` | GET | Get all achievements (unlocked + locked) |
| `/api/v1/analytics/check-achievements` | POST | Manually check and update achievements |

## Required Parameters

All endpoints require `user_id` as a query parameter:
```
?user_id=user123
```

## Response Structure

All successful responses follow this format:
```json
{
  "success": true,
  "data": { ... }
}
```

## Frontend Mapping

### Overview Tab
- **Endpoint:** `GET /api/v1/analytics/overview`
- **Cards:**
  - Overall Score: `data.overallScore.value` (+ `data.overallScore.change`)
  - Interviews: `data.interviews.count`
  - Study Time: `data.studyTime.hours`
  - Achievements: `data.achievements.unlocked` / `data.achievements.total`
- **Charts:**
  - Score Progression: `data.scoreProgression` (line chart)
  - Performance by Category: `data.performanceByCategory` (bar chart)

### Skills Breakdown Tab
- **Endpoint:** `GET /api/v1/analytics/skills-breakdown`
- **Radar Chart:** `data.radarData`
- **Skill Details:** `data.skillDetails`

### Weak Areas Tab
- **Endpoint:** `GET /api/v1/analytics/weak-areas`
- **Areas List:** `data` (array of weak areas)

### Achievements Tab
- **Endpoint:** `GET /api/v1/analytics/achievements`
- **Achievements Grid:** `data` (array of achievements)
- **Filter:** `achievement.unlocked === true/false`

## Example Usage

```javascript
// Overview
const overview = await fetch('/api/v1/analytics/overview?user_id=user123')
  .then(r => r.json());

// Skills Breakdown
const skills = await fetch('/api/v1/analytics/skills-breakdown?user_id=user123')
  .then(r => r.json());

// Weak Areas
const weakAreas = await fetch('/api/v1/analytics/weak-areas?user_id=user123')
  .then(r => r.json());

// Achievements
const achievements = await fetch('/api/v1/analytics/achievements?user_id=user123')
  .then(r => r.json());
```

## Achievement Types

- `7_day_streak` - Practiced 7 days in a row
- `interview_master` - Completed 25 mock interviews
- `quick_learner` - Improved score by 20 points
- `team_player` - Joined 5 group sessions
- `perfect_score` - Scored 95+ on an interview
- `consistency_king` - 30-day practice streak

