-- ============================================
-- Complete Supabase Database Migration
-- ============================================
-- This file contains the complete database schema for MockManch Backend Gateway
-- Run this entire script in your new Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. AUTH SCHEMA
-- ============================================
-- Extends Supabase Auth with additional user profile data
-- ============================================

-- Create auth schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS auth;

-- User Profiles Table
CREATE TABLE IF NOT EXISTS auth.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255),
    avatar_url TEXT,
    phone_number VARCHAR(20),
    bio TEXT,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Refresh Tokens Table
CREATE TABLE IF NOT EXISTS auth.refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for auth schema
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON auth.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON auth.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON auth.refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON auth.refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON auth.refresh_tokens(expires_at);

-- Row Level Security (RLS) Policies for auth schema
ALTER TABLE auth.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON auth.user_profiles;
CREATE POLICY "Users can view own profile"
    ON auth.user_profiles
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON auth.user_profiles;
CREATE POLICY "Users can update own profile"
    ON auth.user_profiles
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own profile
DROP POLICY IF EXISTS "Users can insert own profile" ON auth.user_profiles;
CREATE POLICY "Users can insert own profile"
    ON auth.user_profiles
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own refresh tokens
DROP POLICY IF EXISTS "Users can view own refresh tokens" ON auth.refresh_tokens;
CREATE POLICY "Users can view own refresh tokens"
    ON auth.refresh_tokens
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own refresh tokens
DROP POLICY IF EXISTS "Users can insert own refresh tokens" ON auth.refresh_tokens;
CREATE POLICY "Users can insert own refresh tokens"
    ON auth.refresh_tokens
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own refresh tokens
DROP POLICY IF EXISTS "Users can update own refresh tokens" ON auth.refresh_tokens;
CREATE POLICY "Users can update own refresh tokens"
    ON auth.refresh_tokens
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Functions and Triggers for auth schema
CREATE OR REPLACE FUNCTION auth.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on user_profiles
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON auth.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON auth.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION auth.update_updated_at_column();

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION auth.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO auth.user_profiles (user_id, email, email_verified)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.email_confirmed_at IS NOT NULL, false)
    )
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when new user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION auth.handle_new_user();

-- Function to sync email verification status
CREATE OR REPLACE FUNCTION auth.sync_email_verification()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE auth.user_profiles
    SET email_verified = (NEW.email_confirmed_at IS NOT NULL)
    WHERE user_id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to sync email verification when user email is confirmed
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_email_confirmed
    AFTER UPDATE OF email_confirmed_at ON auth.users
    FOR EACH ROW
    WHEN (OLD.email_confirmed_at IS DISTINCT FROM NEW.email_confirmed_at)
    EXECUTE FUNCTION auth.sync_email_verification();

-- Grant Permissions for auth schema
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT SELECT, INSERT, UPDATE ON auth.user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON auth.refresh_tokens TO authenticated;
GRANT ALL ON SCHEMA auth TO service_role;
GRANT ALL ON auth.user_profiles TO service_role;
GRANT ALL ON auth.refresh_tokens TO service_role;

-- ============================================
-- 2. DASHBOARD SCHEMA
-- ============================================
-- Stores interview sessions, user statistics, goals, achievements, and analytics
-- ============================================

-- Create dashboard schema
CREATE SCHEMA IF NOT EXISTS dashboard;

-- Interview Sessions Table
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

-- User Statistics Table
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

-- User Goals Table
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

-- Achievements Table
CREATE TABLE IF NOT EXISTS dashboard.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL,
  achievement_type VARCHAR NOT NULL,
  achievement_name VARCHAR NOT NULL,
  description TEXT,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Skill Assessments Table
CREATE TABLE IF NOT EXISTS dashboard.skill_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL,
  skill_name VARCHAR NOT NULL,
  score NUMERIC(5, 2) NOT NULL,
  last_assessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Weekly Practice Table
CREATE TABLE IF NOT EXISTS dashboard.weekly_practice (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL,
  week_start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  practice_days INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for dashboard schema
CREATE INDEX IF NOT EXISTS idx_interview_sessions_user_id 
  ON dashboard.interview_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_interview_sessions_completed_at 
  ON dashboard.interview_sessions(completed_at);

CREATE INDEX IF NOT EXISTS idx_interview_sessions_user_completed 
  ON dashboard.interview_sessions(user_id, completed_at);

CREATE INDEX IF NOT EXISTS idx_user_goals_user_id 
  ON dashboard.user_goals(user_id);

CREATE INDEX IF NOT EXISTS idx_user_goals_user_active 
  ON dashboard.user_goals(user_id, is_active) 
  WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_achievements_user_id 
  ON dashboard.achievements(user_id);

CREATE INDEX IF NOT EXISTS idx_skill_assessments_user_id 
  ON dashboard.skill_assessments(user_id);

CREATE INDEX IF NOT EXISTS idx_skill_assessments_user_skill 
  ON dashboard.skill_assessments(user_id, skill_name);

CREATE INDEX IF NOT EXISTS idx_weekly_practice_user_id 
  ON dashboard.weekly_practice(user_id);

CREATE INDEX IF NOT EXISTS idx_weekly_practice_user_week 
  ON dashboard.weekly_practice(user_id, week_start_date);

-- Function to update updated_at for dashboard schema
CREATE OR REPLACE FUNCTION dashboard.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at in dashboard schema
DROP TRIGGER IF EXISTS update_user_goals_updated_at ON dashboard.user_goals;
CREATE TRIGGER update_user_goals_updated_at
  BEFORE UPDATE ON dashboard.user_goals
  FOR EACH ROW
  EXECUTE FUNCTION dashboard.update_updated_at_column();

DROP TRIGGER IF EXISTS update_skill_assessments_updated_at ON dashboard.skill_assessments;
CREATE TRIGGER update_skill_assessments_updated_at
  BEFORE UPDATE ON dashboard.skill_assessments
  FOR EACH ROW
  EXECUTE FUNCTION dashboard.update_updated_at_column();

DROP TRIGGER IF EXISTS update_weekly_practice_updated_at ON dashboard.weekly_practice;
CREATE TRIGGER update_weekly_practice_updated_at
  BEFORE UPDATE ON dashboard.weekly_practice
  FOR EACH ROW
  EXECUTE FUNCTION dashboard.update_updated_at_column();

-- ============================================
-- 3. WALLET SCHEMA
-- ============================================
-- Token wallet system for managing user tokens, transactions, and subscriptions
-- ============================================

-- Create wallet schema
CREATE SCHEMA IF NOT EXISTS wallet;

-- Wallets Table
CREATE TABLE IF NOT EXISTS wallet.wallets (
  wallet_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL UNIQUE,
  balance_tokens INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Wallet Transactions Table
CREATE TABLE IF NOT EXISTS wallet.wallet_transactions (
  transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES wallet.wallets(wallet_id) ON DELETE CASCADE,
  change_amount INTEGER NOT NULL,
  type VARCHAR NOT NULL CHECK (type IN ('credit', 'debit')),
  reason VARCHAR NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Subscription Plans Table
CREATE TABLE IF NOT EXISTS wallet.subscription_plans (
  plan_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  tokens INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  duration_days INTEGER NOT NULL,
  is_recurring BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Purchases Table
CREATE TABLE IF NOT EXISTS wallet.purchases (
  purchase_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL,
  plan_id UUID NOT NULL REFERENCES wallet.subscription_plans(plan_id),
  tokens_added INTEGER NOT NULL,
  amount_paid DECIMAL(10, 2) NOT NULL,
  payment_status VARCHAR NOT NULL CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_id VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Services Token Costs Table
CREATE TABLE IF NOT EXISTS wallet.services_token_costs (
  service_name VARCHAR PRIMARY KEY,
  cost INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for wallet schema
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallet.wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_id ON wallet.wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON wallet.wallet_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON wallet.purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_payment_id ON wallet.purchases(payment_id);
CREATE INDEX IF NOT EXISTS idx_purchases_plan_id ON wallet.purchases(plan_id);

-- Initialize Default Service Costs
INSERT INTO wallet.services_token_costs (service_name, cost) VALUES
  ('ai_chat', 1),
  ('text_interview', 5),
  ('voice_interview', 10),
  ('video_interview', 15),
  ('group_practice', 3)
ON CONFLICT (service_name) DO UPDATE SET
  cost = EXCLUDED.cost,
  updated_at = NOW();

-- Initialize Default Subscription Plans
INSERT INTO wallet.subscription_plans (name, tokens, price, duration_days, is_recurring) VALUES
  ('Free Plan', 20, 0.00, 0, false),
  ('Starter', 200, 9.99, 0, false),
  ('Pro Monthly', 500, 19.99, 30, true),
  ('Ultra', 2000, 49.99, 0, false)
ON CONFLICT DO NOTHING;

-- Function to update updated_at for wallet schema
CREATE OR REPLACE FUNCTION wallet.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at in wallet schema
DROP TRIGGER IF EXISTS update_wallets_updated_at ON wallet.wallets;
CREATE TRIGGER update_wallets_updated_at
  BEFORE UPDATE ON wallet.wallets
  FOR EACH ROW
  EXECUTE FUNCTION wallet.update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscription_plans_updated_at ON wallet.subscription_plans;
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON wallet.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION wallet.update_updated_at_column();

DROP TRIGGER IF EXISTS update_services_token_costs_updated_at ON wallet.services_token_costs;
CREATE TRIGGER update_services_token_costs_updated_at
  BEFORE UPDATE ON wallet.services_token_costs
  FOR EACH ROW
  EXECUTE FUNCTION wallet.update_updated_at_column();

-- ============================================
-- 4. GROUP ROOM SCHEMA
-- ============================================
-- Manages group practice rooms and participants
-- ============================================

-- Create group_room schema
CREATE SCHEMA IF NOT EXISTS group_room;

-- Rooms Table
CREATE TABLE IF NOT EXISTS group_room.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  host_id VARCHAR NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Participants Table
CREATE TABLE IF NOT EXISTS group_room.participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  room_id UUID NOT NULL,
  user_id VARCHAR NOT NULL,
  joined_at TIMESTAMP DEFAULT NOW(),
  left_at TIMESTAMP
);

-- Add foreign key constraint for participants
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'participants_room_id_rooms_id_fk'
    ) THEN
        ALTER TABLE group_room.participants 
        ADD CONSTRAINT participants_room_id_rooms_id_fk
        FOREIGN KEY (room_id) REFERENCES group_room.rooms(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- Indexes for group_room schema
CREATE INDEX IF NOT EXISTS idx_rooms_host_id ON group_room.rooms(host_id);
CREATE INDEX IF NOT EXISTS idx_participants_room_id ON group_room.participants(room_id);
CREATE INDEX IF NOT EXISTS idx_participants_user_id ON group_room.participants(user_id);

-- ============================================
-- VERIFICATION QUERIES (Optional - Uncomment to verify)
-- ============================================
-- 
-- Check all schemas
-- SELECT schema_name FROM information_schema.schemata 
-- WHERE schema_name IN ('auth', 'dashboard', 'wallet', 'group_room');
--
-- Check all tables
-- SELECT table_schema, table_name 
-- FROM information_schema.tables 
-- WHERE table_schema IN ('auth', 'dashboard', 'wallet', 'group_room')
-- ORDER BY table_schema, table_name;
--
-- Check all indexes
-- SELECT schemaname, tablename, indexname 
-- FROM pg_indexes 
-- WHERE schemaname IN ('auth', 'dashboard', 'wallet', 'group_room')
-- ORDER BY schemaname, tablename, indexname;

-- ============================================
-- MIGRATION COMPLETE!
-- ============================================
-- All schemas, tables, indexes, functions, triggers, and default data have been created.
-- Your Supabase database is now ready to use.
-- ============================================

