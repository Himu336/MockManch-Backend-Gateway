-- ============================================
-- Dashboard Schema for Supabase
-- Paste this entire script into Supabase SQL Editor
-- ============================================

-- Create dashboard schema
CREATE SCHEMA IF NOT EXISTS dashboard;

-- ============================================
-- 1. Interview Sessions Table
-- ============================================
CREATE TABLE IF NOT EXISTS dashboard.interview_sessions (
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
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. User Statistics Table
-- ============================================
CREATE TABLE IF NOT EXISTS dashboard.user_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL UNIQUE,
  interviews_done INTEGER DEFAULT 0,
  avg_score NUMERIC(5, 2) DEFAULT 0,
  practice_hours NUMERIC(10, 2) DEFAULT 0,
  achievements_count INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. User Goals Table
-- ============================================
CREATE TABLE IF NOT EXISTS dashboard.user_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL,
  goal_type VARCHAR NOT NULL,
  target_value INTEGER NOT NULL,
  current_value INTEGER DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. Achievements Table
-- ============================================
CREATE TABLE IF NOT EXISTS dashboard.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL,
  achievement_type VARCHAR NOT NULL,
  achievement_name VARCHAR NOT NULL,
  description TEXT,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. Skill Assessments Table
-- ============================================
CREATE TABLE IF NOT EXISTS dashboard.skill_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL,
  skill_name VARCHAR NOT NULL,
  score NUMERIC(5, 2) NOT NULL,
  last_assessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 6. Weekly Practice Table
-- ============================================
CREATE TABLE IF NOT EXISTS dashboard.weekly_practice (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL,
  week_start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  practice_days INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES for Performance
-- ============================================

-- Interview Sessions Indexes
CREATE INDEX IF NOT EXISTS idx_interview_sessions_user_id 
  ON dashboard.interview_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_interview_sessions_completed_at 
  ON dashboard.interview_sessions(completed_at);

CREATE INDEX IF NOT EXISTS idx_interview_sessions_user_completed 
  ON dashboard.interview_sessions(user_id, completed_at);

-- User Goals Indexes
CREATE INDEX IF NOT EXISTS idx_user_goals_user_id 
  ON dashboard.user_goals(user_id);

CREATE INDEX IF NOT EXISTS idx_user_goals_user_active 
  ON dashboard.user_goals(user_id, is_active) 
  WHERE is_active = TRUE;

-- Achievements Indexes
CREATE INDEX IF NOT EXISTS idx_achievements_user_id 
  ON dashboard.achievements(user_id);

-- Skill Assessments Indexes
CREATE INDEX IF NOT EXISTS idx_skill_assessments_user_id 
  ON dashboard.skill_assessments(user_id);

CREATE INDEX IF NOT EXISTS idx_skill_assessments_user_skill 
  ON dashboard.skill_assessments(user_id, skill_name);

-- Weekly Practice Indexes
CREATE INDEX IF NOT EXISTS idx_weekly_practice_user_id 
  ON dashboard.weekly_practice(user_id);

CREATE INDEX IF NOT EXISTS idx_weekly_practice_user_week 
  ON dashboard.weekly_practice(user_id, week_start_date);

-- ============================================
-- ROW LEVEL SECURITY (RLS) Policies
-- Optional: Enable if you want user-level security
-- ============================================

-- Enable RLS on all tables (uncomment if needed)
-- ALTER TABLE dashboard.interview_sessions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE dashboard.user_statistics ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE dashboard.user_goals ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE dashboard.achievements ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE dashboard.skill_assessments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE dashboard.weekly_practice ENABLE ROW LEVEL SECURITY;

-- Example RLS Policy (adjust based on your auth setup):
-- CREATE POLICY "Users can view their own data" 
--   ON dashboard.interview_sessions 
--   FOR SELECT 
--   USING (auth.uid()::text = user_id);

-- ============================================
-- VERIFICATION QUERIES
-- Run these to verify tables were created
-- ============================================

-- Check if schema exists
-- SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'dashboard';

-- Check all tables in dashboard schema
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'dashboard';

-- ============================================
-- DONE! Your dashboard schema is ready.
-- ============================================

