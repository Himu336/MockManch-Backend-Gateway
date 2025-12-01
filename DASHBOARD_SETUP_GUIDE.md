# Dashboard API Setup Guide

## Database Connection Issue

If you're getting a connection timeout error, follow these steps:

### 1. Check Database Connection

Verify your `DATABASE_URL` in `.env` file:
```env
DATABASE_URL=postgresql://username:password@host:port/database
```

**Common Issues:**
- If using IPv6 address, try using IPv4 or hostname
- Check if database server is running
- Verify firewall/network settings
- Ensure SSL settings are correct (if required)

### 2. Generate Migration (Without Applying)

First, generate the migration to see if schema is detected:

```bash
npx drizzle-kit generate
```

This will create the migration SQL file without trying to connect to the database.

### 3. Apply Migration Manually (If Connection Works)

If your database connection works, you can apply the migration:

```bash
npx drizzle-kit migrate
```

### 4. Manual Schema Creation (If Migration Fails)

If migration fails, you can create the schema manually:

```sql
-- Create dashboard schema
CREATE SCHEMA IF NOT EXISTS dashboard;

-- Create interview_sessions table
CREATE TABLE dashboard.interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR NOT NULL UNIQUE,
  user_id VARCHAR NOT NULL,
  interview_type VARCHAR NOT NULL,
  job_role VARCHAR,
  company VARCHAR,
  experience_level VARCHAR,
  overall_score NUMERIC(5, 2),
  total_questions INTEGER DEFAULT 0,
  answered_questions INTEGER DEFAULT 0,
  duration_minutes NUMERIC(10, 2),
  analysis_data JSONB,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create user_statistics table
CREATE TABLE dashboard.user_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL UNIQUE,
  interviews_done INTEGER DEFAULT 0,
  avg_score NUMERIC(5, 2) DEFAULT 0,
  practice_hours NUMERIC(10, 2) DEFAULT 0,
  achievements_count INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create user_goals table
CREATE TABLE dashboard.user_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL,
  goal_type VARCHAR NOT NULL,
  target_value INTEGER NOT NULL,
  current_value INTEGER DEFAULT 0,
  start_date TIMESTAMP DEFAULT NOW(),
  end_date TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create achievements table
CREATE TABLE dashboard.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL,
  achievement_type VARCHAR NOT NULL,
  achievement_name VARCHAR NOT NULL,
  description TEXT,
  unlocked_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create skill_assessments table
CREATE TABLE dashboard.skill_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL,
  skill_name VARCHAR NOT NULL,
  score NUMERIC(5, 2) NOT NULL,
  last_assessed_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create weekly_practice table
CREATE TABLE dashboard.weekly_practice (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL,
  week_start_date TIMESTAMP NOT NULL,
  practice_days INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_interview_sessions_user_id ON dashboard.interview_sessions(user_id);
CREATE INDEX idx_interview_sessions_completed_at ON dashboard.interview_sessions(completed_at);
CREATE INDEX idx_user_goals_user_id ON dashboard.user_goals(user_id);
CREATE INDEX idx_achievements_user_id ON dashboard.achievements(user_id);
CREATE INDEX idx_skill_assessments_user_id ON dashboard.skill_assessments(user_id);
CREATE INDEX idx_weekly_practice_user_id ON dashboard.weekly_practice(user_id);
```

## Testing the API

Once the database is set up, test the endpoints:

### 1. Get Dashboard Data
```bash
curl "http://localhost:YOUR_PORT/api/v1/dashboard?user_id=test_user"
```

### 2. Record a Session
```bash
curl -X POST "http://localhost:YOUR_PORT/api/v1/dashboard/record-session" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user",
    "session_id": "test_session",
    "interview_type": "text",
    "job_role": "Developer",
    "duration_minutes": 30
  }'
```

## Troubleshooting

### Issue: Connection Timeout
- Check if database server is accessible
- Verify DATABASE_URL format
- Try using hostname instead of IP address
- Check firewall/network settings

### Issue: Schema Not Detected
- Make sure `drizzle.config.ts` has correct schema path
- Verify schema files are in `src/db/schema/` directory
- Run `npx drizzle-kit generate` to check if schemas are detected

### Issue: Migration Fails
- Check database permissions
- Verify schema name doesn't conflict
- Try creating schema manually (see above)

