-- Apply only wallet schema migration
-- This script can be run even if other migrations have been applied

CREATE SCHEMA IF NOT EXISTS "wallet";

-- Create wallet tables (with IF NOT EXISTS to avoid errors)
CREATE TABLE IF NOT EXISTS "wallet"."wallets" (
	"wallet_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"balance_tokens" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "wallets_user_id_unique" UNIQUE("user_id")
);

CREATE TABLE IF NOT EXISTS "wallet"."wallet_transactions" (
	"transaction_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet_id" uuid NOT NULL,
	"change_amount" integer NOT NULL,
	"type" varchar NOT NULL,
	"reason" varchar NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "wallet"."subscription_plans" (
	"plan_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"tokens" integer NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"duration_days" integer NOT NULL,
	"is_recurring" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "wallet"."purchases" (
	"purchase_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"plan_id" uuid NOT NULL,
	"tokens_added" integer NOT NULL,
	"amount_paid" numeric(10, 2) NOT NULL,
	"payment_status" varchar NOT NULL,
	"payment_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "wallet"."services_token_costs" (
	"service_name" varchar PRIMARY KEY NOT NULL,
	"cost" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Add foreign key constraints (only if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'wallet_transactions_wallet_id_wallets_wallet_id_fk'
    ) THEN
        ALTER TABLE "wallet"."wallet_transactions" 
        ADD CONSTRAINT "wallet_transactions_wallet_id_wallets_wallet_id_fk" 
        FOREIGN KEY ("wallet_id") REFERENCES "wallet"."wallets"("wallet_id") 
        ON DELETE cascade ON UPDATE no action;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'purchases_plan_id_subscription_plans_plan_id_fk'
    ) THEN
        ALTER TABLE "wallet"."purchases" 
        ADD CONSTRAINT "purchases_plan_id_subscription_plans_plan_id_fk" 
        FOREIGN KEY ("plan_id") REFERENCES "wallet"."subscription_plans"("plan_id") 
        ON DELETE no action ON UPDATE no action;
    END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallet.wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_id ON wallet.wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON wallet.wallet_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON wallet.purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_payment_id ON wallet.purchases(payment_id);
CREATE INDEX IF NOT EXISTS idx_purchases_plan_id ON wallet.purchases(plan_id);

-- Insert default service costs
INSERT INTO wallet.services_token_costs (service_name, cost) VALUES
  ('ai_chat', 1),
  ('text_interview', 5),
  ('voice_interview', 10),
  ('video_interview', 15),
  ('group_practice', 3)
ON CONFLICT (service_name) DO UPDATE SET
  cost = EXCLUDED.cost,
  updated_at = NOW();

-- Insert default subscription plans
INSERT INTO wallet.subscription_plans (name, tokens, price, duration_days, is_recurring) VALUES
  ('Free Plan', 20, 0.00, 0, false),
  ('Starter', 200, 9.99, 0, false),
  ('Pro Monthly', 500, 19.99, 30, true),
  ('Ultra', 2000, 49.99, 0, false)
ON CONFLICT DO NOTHING;

-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION wallet.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
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

