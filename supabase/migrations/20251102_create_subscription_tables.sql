-- Migration: Create subscription tables for iOS in-app purchases
-- Date: 2025-11-02
-- Description: Implements subscription system with Free/Personal/Club tiers in IDR

-- ============================================================================
-- 1. Subscription Products (Product Catalog)
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscription_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL UNIQUE, -- App Store product ID (e.g., "courtster_personal_monthly")
  tier TEXT NOT NULL CHECK (tier IN ('free', 'personal', 'club')),
  interval TEXT NOT NULL CHECK (interval IN ('monthly', 'yearly')),
  price_idr INTEGER NOT NULL, -- Price in Indonesian Rupiah
  features JSONB, -- Feature flags for this tier
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 2. User Subscriptions
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES subscription_products(id),
  tier TEXT NOT NULL CHECK (tier IN ('free', 'personal', 'club')),
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'expired', 'past_due', 'trial')),

  -- App Store transaction info
  transaction_id TEXT, -- Original App Store transaction ID
  receipt_data TEXT, -- Latest receipt from App Store

  -- Subscription period
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,

  -- Trial period (2 weeks for free tier)
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One active subscription per user
  CONSTRAINT one_active_subscription_per_user UNIQUE (user_id)
);

-- ============================================================================
-- 3. Subscription Transactions (Payment History)
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscription_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Transaction details
  transaction_id TEXT NOT NULL UNIQUE, -- App Store transaction ID
  product_id TEXT NOT NULL,
  amount_idr INTEGER NOT NULL,

  -- Status
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),

  -- App Store data
  receipt_data TEXT,
  environment TEXT CHECK (environment IN ('production', 'sandbox')),

  -- Timestamps
  purchased_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 4. Club Subscriptions (Group Subscriptions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS club_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,

  -- Club leader (pays for subscription)
  leader_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Member limits
  max_members INTEGER NOT NULL DEFAULT 5,
  additional_members INTEGER DEFAULT 0, -- Beyond base 5
  additional_member_price_monthly_idr INTEGER DEFAULT 20000,
  additional_member_price_yearly_idr INTEGER DEFAULT 100000,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One subscription per club
  CONSTRAINT one_subscription_per_club UNIQUE (club_id)
);

-- ============================================================================
-- 5. Update profiles table with subscription fields
-- ============================================================================
DO $$
BEGIN
  -- Add current_tier column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'profiles' AND column_name = 'current_tier') THEN
    ALTER TABLE profiles ADD COLUMN current_tier TEXT DEFAULT 'free' CHECK (current_tier IN ('free', 'personal', 'club'));
  END IF;

  -- Add trial_end_date column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'profiles' AND column_name = 'trial_end_date') THEN
    ALTER TABLE profiles ADD COLUMN trial_end_date TIMESTAMPTZ;
  END IF;

  -- Add session_count_monthly for free tier limit tracking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'profiles' AND column_name = 'session_count_monthly') THEN
    ALTER TABLE profiles ADD COLUMN session_count_monthly INTEGER DEFAULT 0;
  END IF;

  -- Add last_session_count_reset for monthly counter reset
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'profiles' AND column_name = 'last_session_count_reset') THEN
    ALTER TABLE profiles ADD COLUMN last_session_count_reset TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- ============================================================================
-- Indexes for Performance
-- ============================================================================
CREATE INDEX idx_subscriptions_user_status ON subscriptions(user_id, status);
CREATE INDEX idx_subscriptions_period_end ON subscriptions(current_period_end) WHERE status = 'active';
CREATE INDEX idx_subscription_transactions_user ON subscription_transactions(user_id);
CREATE INDEX idx_subscription_transactions_subscription ON subscription_transactions(subscription_id);
CREATE INDEX idx_club_subscriptions_club ON club_subscriptions(club_id);
CREATE INDEX idx_club_subscriptions_leader ON club_subscriptions(leader_user_id);

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================
ALTER TABLE subscription_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_subscriptions ENABLE ROW LEVEL SECURITY;

-- Products are public (read-only)
CREATE POLICY "Products are publicly readable"
  ON subscription_products
  FOR SELECT
  USING (is_active = true);

-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions"
  ON subscription_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Club leaders can manage club subscriptions
CREATE POLICY "Club leaders can view club subscriptions"
  ON club_subscriptions
  FOR SELECT
  USING (auth.uid() = leader_user_id);

-- ============================================================================
-- Functions
-- ============================================================================

-- Function to update subscription updated_at
CREATE OR REPLACE FUNCTION update_subscription_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for subscriptions
CREATE TRIGGER trigger_update_subscription_timestamp
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_timestamp();

-- Trigger for subscription_products
CREATE TRIGGER trigger_update_product_timestamp
  BEFORE UPDATE ON subscription_products
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_timestamp();

-- Trigger for club_subscriptions
CREATE TRIGGER trigger_update_club_subscription_timestamp
  BEFORE UPDATE ON club_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_timestamp();

-- Function to set trial period for new users (2 weeks)
CREATE OR REPLACE FUNCTION set_trial_period_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.trial_end_date IS NULL THEN
    NEW.trial_end_date = NOW() + INTERVAL '14 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set trial on user creation
CREATE TRIGGER trigger_set_trial_period
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_trial_period_for_new_user();

-- Function to reset monthly session counter
CREATE OR REPLACE FUNCTION reset_monthly_session_counter()
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET session_count_monthly = 0,
      last_session_count_reset = NOW()
  WHERE last_session_count_reset < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Seed Data: Product Catalog
-- ============================================================================
INSERT INTO subscription_products (product_id, tier, interval, price_idr, features) VALUES
  -- Free tier (no product ID, default)
  ('courtster_free', 'free', 'monthly', 0, '{"max_sessions_monthly": 4, "max_courts": 1, "max_clubs": 1, "reclub_import": false}'),

  -- Personal tier
  ('courtster_personal_monthly', 'personal', 'monthly', 49000, '{"max_sessions_monthly": -1, "max_courts": -1, "max_clubs": -1, "reclub_import": true}'),
  ('courtster_personal_yearly', 'personal', 'yearly', 299000, '{"max_sessions_monthly": -1, "max_courts": -1, "max_clubs": -1, "reclub_import": true}'),

  -- Club tier
  ('courtster_club_monthly', 'club', 'monthly', 139000, '{"max_sessions_monthly": -1, "max_courts": -1, "max_clubs": -1, "reclub_import": true, "max_club_members": 5}'),
  ('courtster_club_yearly', 'club', 'yearly', 699000, '{"max_sessions_monthly": -1, "max_courts": -1, "max_clubs": -1, "reclub_import": true, "max_club_members": 5}')
ON CONFLICT (product_id) DO NOTHING;

-- ============================================================================
-- Comments
-- ============================================================================
COMMENT ON TABLE subscription_products IS 'Product catalog for in-app purchases (Free/Personal/Club tiers)';
COMMENT ON TABLE subscriptions IS 'User subscription records with status and billing period';
COMMENT ON TABLE subscription_transactions IS 'Payment history from App Store';
COMMENT ON TABLE club_subscriptions IS 'Group subscriptions where club leader pays for members';
COMMENT ON COLUMN profiles.current_tier IS 'Current subscription tier: free, personal, or club';
COMMENT ON COLUMN profiles.trial_end_date IS 'End date of 2-week trial period (no restrictions during trial)';
COMMENT ON COLUMN profiles.session_count_monthly IS 'Number of sessions created this month (for free tier 4-session limit)';
COMMENT ON COLUMN profiles.last_session_count_reset IS 'Last time monthly session counter was reset';
