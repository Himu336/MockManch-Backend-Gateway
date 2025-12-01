-- ============================================
-- Supabase Auth Schema Migration
-- ============================================
-- This schema extends Supabase Auth with additional user profile data
-- Supabase Auth handles the core authentication (users table in auth schema)
-- This schema stores additional profile information
-- ============================================

-- Create auth schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS auth;

-- ============================================
-- User Profiles Table
-- ============================================
-- Extends Supabase Auth users with additional profile data
-- The user_id references auth.users.id from Supabase Auth
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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON auth.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON auth.user_profiles(email);

-- ============================================
-- Refresh Tokens Table
-- ============================================
-- For managing refresh token rotation (optional)
-- Supabase handles access tokens, but we can track refresh tokens here if needed
CREATE TABLE IF NOT EXISTS auth.refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON auth.refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON auth.refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON auth.refresh_tokens(expires_at);

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================
-- Enable RLS on tables
ALTER TABLE auth.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
CREATE POLICY "Users can view own profile"
    ON auth.user_profiles
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON auth.user_profiles
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own profile (for initial creation)
CREATE POLICY "Users can insert own profile"
    ON auth.user_profiles
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own refresh tokens
CREATE POLICY "Users can view own refresh tokens"
    ON auth.refresh_tokens
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own refresh tokens
CREATE POLICY "Users can insert own refresh tokens"
    ON auth.refresh_tokens
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own refresh tokens (for revocation)
CREATE POLICY "Users can update own refresh tokens"
    ON auth.refresh_tokens
    FOR UPDATE
    USING (auth.uid() = user_id);

-- ============================================
-- Functions and Triggers
-- ============================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION auth.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on user_profiles
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON auth.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION auth.update_updated_at_column();

-- ============================================
-- Function to automatically create user profile on signup
-- ============================================
-- This function is called automatically when a new user signs up
-- It creates a corresponding profile record in auth.user_profiles
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
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION auth.handle_new_user();

-- ============================================
-- Function to sync email verification status
-- ============================================
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
CREATE TRIGGER on_auth_user_email_confirmed
    AFTER UPDATE OF email_confirmed_at ON auth.users
    FOR EACH ROW
    WHEN (OLD.email_confirmed_at IS DISTINCT FROM NEW.email_confirmed_at)
    EXECUTE FUNCTION auth.sync_email_verification();

-- ============================================
-- Grant Permissions
-- ============================================
-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT SELECT, INSERT, UPDATE ON auth.user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON auth.refresh_tokens TO authenticated;

-- Grant permissions to service role (for backend operations)
GRANT ALL ON SCHEMA auth TO service_role;
GRANT ALL ON auth.user_profiles TO service_role;
GRANT ALL ON auth.refresh_tokens TO service_role;

