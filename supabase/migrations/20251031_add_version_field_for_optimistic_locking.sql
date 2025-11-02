-- Migration: Add version field for optimistic locking
-- Purpose: Enable concurrent session editing with conflict detection
-- Date: 2025-10-31
-- Related: Issue #3 - Score Input Race Condition

-- Add version column to game_sessions table
ALTER TABLE game_sessions
ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

-- Add comment explaining the column
COMMENT ON COLUMN game_sessions.version IS 'Optimistic locking version field - increments on each update to detect concurrent modifications';

-- Create index for faster version checks
CREATE INDEX IF NOT EXISTS idx_game_sessions_version ON game_sessions(id, version);

-- Create trigger function to auto-increment version on update
CREATE OR REPLACE FUNCTION increment_session_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Only increment version if round_data or current_round changed
  IF (NEW.round_data IS DISTINCT FROM OLD.round_data) OR
     (NEW.current_round IS DISTINCT FROM OLD.current_round) THEN
    NEW.version = OLD.version + 1;
  END IF;

  -- Always update updated_at timestamp
  NEW.updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function before update
DROP TRIGGER IF EXISTS trigger_increment_session_version ON game_sessions;
CREATE TRIGGER trigger_increment_session_version
  BEFORE UPDATE ON game_sessions
  FOR EACH ROW
  EXECUTE FUNCTION increment_session_version();

-- Add comment on trigger
COMMENT ON TRIGGER trigger_increment_session_version ON game_sessions IS
'Auto-increments version field when round_data or current_round changes - enables optimistic locking';
