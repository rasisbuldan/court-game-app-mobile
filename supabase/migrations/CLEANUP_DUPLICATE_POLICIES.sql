-- ============================================================================
-- CLEANUP DUPLICATE RLS POLICIES
-- ============================================================================
-- Purpose: Remove old/duplicate policies that are causing conflicts
-- Run this in Supabase SQL Editor BEFORE running FIX_RLS_POLICIES.sql
-- ============================================================================

-- ============================================================================
-- 1. REMOVE ALL OLD POLICIES FROM push_tokens
-- ============================================================================

DROP POLICY IF EXISTS "Users can manage their own push tokens" ON push_tokens;
DROP POLICY IF EXISTS "Users can view their own push tokens" ON push_tokens;
DROP POLICY IF EXISTS "Users can view own push tokens" ON push_tokens;
DROP POLICY IF EXISTS "Users can insert own push tokens" ON push_tokens;
DROP POLICY IF EXISTS "Users can update own push tokens" ON push_tokens;
DROP POLICY IF EXISTS "Users can delete own push tokens" ON push_tokens;

-- ============================================================================
-- 2. REMOVE ALL OLD POLICIES FROM user_settings
-- ============================================================================

DROP POLICY IF EXISTS "Users can read own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can delete own settings" ON user_settings;

-- ============================================================================
-- 3. REMOVE ALL OLD POLICIES FROM notification_preferences
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own notification preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Users can insert own notification preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Users can update own notification preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Users can delete own notification preferences" ON notification_preferences;

-- ============================================================================
-- 4. NOW CREATE CLEAN POLICIES FOR push_tokens
-- ============================================================================

CREATE POLICY "Users can view own push tokens"
  ON push_tokens
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own push tokens"
  ON push_tokens
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own push tokens"
  ON push_tokens
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own push tokens"
  ON push_tokens
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 5. CREATE CLEAN POLICIES FOR user_settings
-- ============================================================================

CREATE POLICY "Users can read own settings"
  ON user_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON user_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings"
  ON user_settings
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 6. CREATE CLEAN POLICIES FOR notification_preferences
-- ============================================================================

CREATE POLICY "Users can view own notification preferences"
  ON notification_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences"
  ON notification_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences"
  ON notification_preferences
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notification preferences"
  ON notification_preferences
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 7. VERIFICATION - Check policies are correct now
-- ============================================================================

SELECT
  tablename,
  policyname,
  cmd as operation
FROM pg_policies
WHERE tablename IN ('push_tokens', 'user_settings', 'notification_preferences')
ORDER BY tablename, cmd, policyname;
