-- Migration: Add function to increment monthly session count
-- Date: 2025-11-02
-- Description: Safely increment session count with automatic monthly reset

-- Function to increment session count for free tier tracking
CREATE OR REPLACE FUNCTION increment_session_count(user_id UUID)
RETURNS void AS $$
DECLARE
  last_reset TIMESTAMPTZ;
  current_count INTEGER;
BEGIN
  -- Get current session count and last reset date
  SELECT session_count_monthly, last_session_count_reset
  INTO current_count, last_reset
  FROM profiles
  WHERE id = user_id;

  -- Reset counter if more than 30 days have passed
  IF last_reset IS NULL OR last_reset < NOW() - INTERVAL '30 days' THEN
    UPDATE profiles
    SET session_count_monthly = 1,
        last_session_count_reset = NOW()
    WHERE id = user_id;
  ELSE
    -- Increment counter
    UPDATE profiles
    SET session_count_monthly = session_count_monthly + 1
    WHERE id = user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_session_count(UUID) TO authenticated;

COMMENT ON FUNCTION increment_session_count IS 'Increments monthly session count for a user, with automatic reset after 30 days';
