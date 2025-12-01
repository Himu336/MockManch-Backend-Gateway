-- ============================================
-- Wallet Schema for Token Wallet System
-- Paste this entire script into Supabase SQL Editor
-- ============================================

-- Create wallet schema
CREATE SCHEMA IF NOT EXISTS wallet;

-- ============================================
-- 1. Wallets Table
-- ============================================
CREATE TABLE IF NOT EXISTS wallet.wallets (
  wallet_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL UNIQUE,
  balance_tokens INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================
-- 2. Wallet Transactions Table
-- ============================================
CREATE TABLE IF NOT EXISTS wallet.wallet_transactions (
  transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES wallet.wallets(wallet_id) ON DELETE CASCADE,
  change_amount INTEGER NOT NULL,
  type VARCHAR NOT NULL CHECK (type IN ('credit', 'debit')),
  reason VARCHAR NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================
-- 3. Subscription Plans Table
-- ============================================
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

-- ============================================
-- 4. Purchases Table
-- ============================================
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

-- ============================================
-- 5. Services Token Costs Table
-- ============================================
CREATE TABLE IF NOT EXISTS wallet.services_token_costs (
  service_name VARCHAR PRIMARY KEY,
  cost INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================
-- Indexes for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallet.wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_id ON wallet.wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON wallet.wallet_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON wallet.purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_payment_id ON wallet.purchases(payment_id);
CREATE INDEX IF NOT EXISTS idx_purchases_plan_id ON wallet.purchases(plan_id);

-- ============================================
-- Initialize Default Service Costs
-- ============================================
INSERT INTO wallet.services_token_costs (service_name, cost) VALUES
  ('ai_chat', 1),
  ('text_interview', 5),
  ('voice_interview', 10),
  ('video_interview', 15),
  ('group_practice', 3)
ON CONFLICT (service_name) DO UPDATE SET
  cost = EXCLUDED.cost,
  updated_at = NOW();

-- ============================================
-- Initialize Default Subscription Plans
-- ============================================
INSERT INTO wallet.subscription_plans (name, tokens, price, duration_days, is_recurring) VALUES
  ('Free Plan', 20, 0.00, 0, false),
  ('Starter', 200, 9.99, 0, false),
  ('Pro Monthly', 500, 19.99, 30, true),
  ('Ultra', 2000, 49.99, 0, false)
ON CONFLICT DO NOTHING;

-- ============================================
-- Function to update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION wallet.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Triggers for updated_at
-- ============================================
CREATE TRIGGER update_wallets_updated_at
  BEFORE UPDATE ON wallet.wallets
  FOR EACH ROW
  EXECUTE FUNCTION wallet.update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON wallet.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION wallet.update_updated_at_column();

CREATE TRIGGER update_services_token_costs_updated_at
  BEFORE UPDATE ON wallet.services_token_costs
  FOR EACH ROW
  EXECUTE FUNCTION wallet.update_updated_at_column();

