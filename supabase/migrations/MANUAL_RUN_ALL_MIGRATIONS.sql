-- ============================================================================
-- COMPREHENSIVE DATABASE MIGRATION FOR COURTSTER MOBILE
-- ============================================================================
-- Purpose: Complete database schema updates for mobile app
-- Date: 2025-11-01
-- Run this manually in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- MIGRATION 1: Event History Table
-- ============================================================================

-- Create event_history table for tracking all session events
CREATE TABLE IF NOT EXISTS public.event_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  description TEXT NOT NULL,
  player_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
  duration TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on session_id for faster queries
CREATE INDEX IF NOT EXISTS idx_event_history_session_id ON public.event_history(session_id);

-- Create index on created_at for chronological sorting
CREATE INDEX IF NOT EXISTS idx_event_history_created_at ON public.event_history(created_at DESC);

-- Create index on event_type for filtering
CREATE INDEX IF NOT EXISTS idx_event_history_event_type ON public.event_history(event_type);

-- Enable Row Level Security
ALTER TABLE public.event_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view events for their own sessions
DROP POLICY IF EXISTS "Users can view their own session events" ON public.event_history;
CREATE POLICY "Users can view their own session events"
  ON public.event_history
  FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM public.game_sessions WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can insert events for their own sessions
DROP POLICY IF EXISTS "Users can insert events for their own sessions" ON public.event_history;
CREATE POLICY "Users can insert events for their own sessions"
  ON public.event_history
  FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT id FROM public.game_sessions WHERE user_id = auth.uid()
    )
  );

-- Grant access to authenticated users
GRANT SELECT, INSERT ON public.event_history TO authenticated;

-- Add comment for documentation
COMMENT ON TABLE public.event_history IS 'Stores all events and actions that occur during game sessions for audit and debugging purposes';

-- ============================================================================
-- MIGRATION 2: Session Sharing
-- ============================================================================

-- Add session sharing columns to game_sessions table
ALTER TABLE public.game_sessions
ADD COLUMN IF NOT EXISTS share_token TEXT,
ADD COLUMN IF NOT EXISTS share_pin TEXT,
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS share_enabled_at TIMESTAMP WITH TIME ZONE;

-- Create unique index on share_token for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_game_sessions_share_token
ON public.game_sessions(share_token)
WHERE share_token IS NOT NULL;

-- Update RLS policies to allow public access with valid share token
-- Drop all existing policies first to ensure idempotency
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.game_sessions;
DROP POLICY IF EXISTS "Users can view their own sessions or public shared sessions" ON public.game_sessions;

CREATE POLICY "Users can view their own sessions or public shared sessions"
ON public.game_sessions
FOR SELECT
USING (
  user_id = auth.uid()
  OR
  (is_public = true AND share_token IS NOT NULL)
);

-- Update players table policy to allow access for public sessions
DROP POLICY IF EXISTS "Users can view players in their sessions" ON public.players;
DROP POLICY IF EXISTS "Users can view players in their sessions or public shared sessions" ON public.players;

CREATE POLICY "Users can view players in their sessions or public shared sessions"
ON public.players
FOR SELECT
USING (
  session_id IN (
    SELECT id FROM public.game_sessions
    WHERE user_id = auth.uid()
    OR (is_public = true AND share_token IS NOT NULL)
  )
);

-- Update players UPDATE policy for public sessions
DROP POLICY IF EXISTS "Users can update players in their sessions" ON public.players;
DROP POLICY IF EXISTS "Users can update players in their sessions or public shared sessions" ON public.players;

CREATE POLICY "Users can update players in their sessions or public shared sessions"
ON public.players
FOR UPDATE
USING (
  session_id IN (
    SELECT id FROM public.game_sessions
    WHERE user_id = auth.uid()
    OR (is_public = true AND share_token IS NOT NULL)
  )
);

-- Update game_sessions UPDATE policy for public sessions
DROP POLICY IF EXISTS "Users can update their own sessions" ON public.game_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions or public shared sessions" ON public.game_sessions;

CREATE POLICY "Users can update their own sessions or public shared sessions"
ON public.game_sessions
FOR UPDATE
USING (
  user_id = auth.uid()
  OR
  (is_public = true AND share_token IS NOT NULL)
);

-- Update event_history policies for public sessions
DROP POLICY IF EXISTS "Users can view their own session events" ON public.event_history;
DROP POLICY IF EXISTS "Users can view their own session events or public shared session events" ON public.event_history;

CREATE POLICY "Users can view their own session events or public shared session events"
ON public.event_history
FOR SELECT
USING (
  session_id IN (
    SELECT id FROM public.game_sessions
    WHERE user_id = auth.uid()
    OR (is_public = true AND share_token IS NOT NULL)
  )
);

DROP POLICY IF EXISTS "Users can insert events for their own sessions" ON public.event_history;
DROP POLICY IF EXISTS "Users can insert events for their own sessions or public shared sessions" ON public.event_history;

CREATE POLICY "Users can insert events for their own sessions or public shared sessions"
ON public.event_history
FOR INSERT
WITH CHECK (
  session_id IN (
    SELECT id FROM public.game_sessions
    WHERE user_id = auth.uid()
    OR (is_public = true AND share_token IS NOT NULL)
  )
);

-- Add comment for documentation
COMMENT ON COLUMN public.game_sessions.share_token IS 'Unique token for shareable session URL';
COMMENT ON COLUMN public.game_sessions.share_pin IS 'Hashed 4-digit PIN for session access verification';
COMMENT ON COLUMN public.game_sessions.is_public IS 'Whether the session is publicly accessible via share link';
COMMENT ON COLUMN public.game_sessions.share_enabled_at IS 'Timestamp when sharing was enabled';

-- ============================================================================
-- MIGRATION 3: Mixed Mexicano Game Type
-- ============================================================================

-- Drop the existing constraint
ALTER TABLE public.game_sessions
DROP CONSTRAINT IF EXISTS game_sessions_type_check;

-- Add the new constraint with 'mixed_mexicano' included
ALTER TABLE public.game_sessions
ADD CONSTRAINT game_sessions_type_check
CHECK (type IN ('mexicano', 'americano', 'fixed_partner', 'mixed_mexicano'));

-- Add comment for documentation
COMMENT ON CONSTRAINT game_sessions_type_check ON public.game_sessions IS
'Ensures game session type is one of: mexicano, americano, fixed_partner, or mixed_mexicano';

-- ============================================================================
-- MIGRATION 4: Profile Fields
-- ============================================================================

-- Add email column if it doesn't exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS email TEXT;

-- Add new columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS username TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add created_at and updated_at if they don't exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS profiles_username_idx ON profiles(username);

-- Set default username from email for existing users (extract part before @)
UPDATE profiles
SET username = split_part(email, '@', 1)
WHERE username IS NULL AND email IS NOT NULL;

-- ============================================================================
-- MIGRATION 5: Optimistic Locking (Version Field)
-- ============================================================================

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

-- ============================================================================
-- MIGRATION 6: Pessimistic Locking (Stored Procedures)
-- ============================================================================

-- Create stored procedure for atomic score updates with row-level locking
CREATE OR REPLACE FUNCTION update_score_with_lock(
  p_session_id UUID,
  p_round_index INTEGER,
  p_match_index INTEGER,
  p_team1_score INTEGER,
  p_team2_score INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_current_round_data JSONB;
  v_updated_round_data JSONB;
  v_match JSONB;
  v_result JSONB;
BEGIN
  -- Acquire row-level lock on the session (prevents concurrent updates)
  -- FOR UPDATE: Locks the row until transaction commits
  SELECT round_data INTO v_current_round_data
  FROM game_sessions
  WHERE id = p_session_id
  FOR UPDATE;

  -- Verify session exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found: %', p_session_id;
  END IF;

  -- Validate round_data is an array (not scalar or object)
  IF v_current_round_data IS NULL THEN
    RAISE EXCEPTION 'No rounds found in session - round_data is NULL';
  END IF;

  IF jsonb_typeof(v_current_round_data) != 'array' THEN
    RAISE EXCEPTION 'Invalid round_data format - expected array but got %', jsonb_typeof(v_current_round_data);
  END IF;

  -- Extract rounds array
  IF jsonb_array_length(v_current_round_data) = 0 THEN
    RAISE EXCEPTION 'No rounds found in session - round_data is empty array';
  END IF;

  -- Verify round index is valid
  IF p_round_index < 0 OR p_round_index >= jsonb_array_length(v_current_round_data) THEN
    RAISE EXCEPTION 'Invalid round index: %', p_round_index;
  END IF;

  -- Get the specific round
  v_updated_round_data := v_current_round_data;

  -- Extract the match and update scores
  v_match := v_current_round_data->p_round_index->'matches'->p_match_index;

  IF v_match IS NULL THEN
    RAISE EXCEPTION 'Match not found at index: %', p_match_index;
  END IF;

  -- Update match scores
  v_match := jsonb_set(v_match, '{team1Score}', to_jsonb(p_team1_score));
  v_match := jsonb_set(v_match, '{team2Score}', to_jsonb(p_team2_score));

  -- Update the match in the round
  v_updated_round_data := jsonb_set(
    v_updated_round_data,
    array[p_round_index::text, 'matches', p_match_index::text],
    v_match
  );

  -- Update the session with new round data
  UPDATE game_sessions
  SET
    round_data = v_updated_round_data,
    updated_at = NOW()
  WHERE id = p_session_id;

  -- Return success result with updated match data
  v_result := jsonb_build_object(
    'success', true,
    'match', v_match,
    'timestamp', NOW()
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Add comment explaining the function
COMMENT ON FUNCTION update_score_with_lock IS
'Atomically updates match scores using pessimistic row-level locking to prevent race conditions.
Uses FOR UPDATE to lock the session row during the transaction.';

-- Create stored procedure for generating rounds with locking
CREATE OR REPLACE FUNCTION generate_round_with_lock(
  p_session_id UUID,
  p_new_round JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_current_round_data JSONB;
  v_updated_round_data JSONB;
  v_new_round_index INTEGER;
  v_result JSONB;
BEGIN
  -- Acquire row-level lock on the session
  SELECT round_data INTO v_current_round_data
  FROM game_sessions
  WHERE id = p_session_id
  FOR UPDATE;

  -- Verify session exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found: %', p_session_id;
  END IF;

  -- Initialize if null or fix if not an array
  IF v_current_round_data IS NULL OR jsonb_typeof(v_current_round_data) != 'array' THEN
    v_current_round_data := '[]'::JSONB;
  END IF;

  -- Append new round
  v_updated_round_data := v_current_round_data || jsonb_build_array(p_new_round);
  v_new_round_index := jsonb_array_length(v_updated_round_data) - 1;

  -- Update the session
  UPDATE game_sessions
  SET
    round_data = v_updated_round_data,
    current_round = v_new_round_index,
    updated_at = NOW()
  WHERE id = p_session_id;

  -- Return result
  v_result := jsonb_build_object(
    'success', true,
    'round_index', v_new_round_index,
    'timestamp', NOW()
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_round_with_lock IS
'Atomically generates a new round using pessimistic locking to prevent concurrent round generation.';

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION update_score_with_lock TO authenticated;
GRANT EXECUTE ON FUNCTION generate_round_with_lock TO authenticated;

-- ============================================================================
-- MIGRATION 7: Database Constraints (Data Integrity)
-- ============================================================================

-- ============================================================================
-- DATA CLEANUP: Fix existing invalid data before applying constraints
-- ============================================================================

-- Fix game_sessions invalid values
UPDATE game_sessions SET scoring_mode = 'points' WHERE scoring_mode NOT IN ('points', 'first_to', 'total_games');
UPDATE game_sessions SET sport = 'padel' WHERE sport NOT IN ('padel', 'tennis');
UPDATE game_sessions SET mode = 'sequential' WHERE mode NOT IN ('sequential', 'parallel');
UPDATE game_sessions SET matchup_preference = 'any' WHERE matchup_preference NOT IN ('any', 'mixed_only', 'randomized_modes');
UPDATE game_sessions SET status = 'setup' WHERE status NOT IN ('setup', 'active', 'completed');
UPDATE game_sessions SET courts = 1 WHERE courts < 1 OR courts > 10;
UPDATE game_sessions SET points_per_match = 21 WHERE points_per_match <= 0 OR points_per_match > 100;
UPDATE game_sessions SET current_round = 0 WHERE current_round < 0;
UPDATE game_sessions SET duration_hours = 2 WHERE duration_hours < 0.5 OR duration_hours > 12;

-- CRITICAL: Fix round_data that is not an array (scalar or object instead of array)
-- This is the root cause of "cannot get array length of a scalar" error
UPDATE game_sessions
SET round_data = '[]'::JSONB
WHERE round_data IS NOT NULL
  AND jsonb_typeof(round_data) != 'array';

-- Fix players invalid values
UPDATE players SET status = 'active' WHERE status NOT IN ('active', 'late', 'no_show', 'departed');
UPDATE players SET gender = 'male' WHERE gender NOT IN ('male', 'female');
UPDATE players SET rating = 5.0 WHERE rating < 1.0 OR rating > 10.0;
UPDATE players SET total_points = 0 WHERE total_points < 0;
UPDATE players SET wins = 0 WHERE wins < 0;
UPDATE players SET losses = 0 WHERE losses < 0;
UPDATE players SET ties = 0 WHERE ties < 0;
UPDATE players SET play_count = wins + losses + ties WHERE play_count < 0;
UPDATE players SET sit_count = 0 WHERE sit_count < 0;
UPDATE players SET consecutive_sits = 0 WHERE consecutive_sits < 0;
UPDATE players SET consecutive_plays = 0 WHERE consecutive_plays < 0;
UPDATE players SET skip_count = 0 WHERE skip_count < 0;
UPDATE players SET compensation_points = 0 WHERE compensation_points < 0;

-- GAME SESSIONS TABLE CONSTRAINTS
-- ============================================================================

-- 1. Scoring Mode Constraint
ALTER TABLE game_sessions
DROP CONSTRAINT IF EXISTS game_sessions_scoring_mode_check;

ALTER TABLE game_sessions
ADD CONSTRAINT game_sessions_scoring_mode_check
CHECK (scoring_mode IN ('points', 'first_to', 'total_games'));

-- 2. Sport Type Constraint
ALTER TABLE game_sessions
DROP CONSTRAINT IF EXISTS game_sessions_sport_check;

ALTER TABLE game_sessions
ADD CONSTRAINT game_sessions_sport_check
CHECK (sport IN ('padel', 'tennis'));

-- 3. Play Mode Constraint
ALTER TABLE game_sessions
DROP CONSTRAINT IF EXISTS game_sessions_mode_check;

ALTER TABLE game_sessions
ADD CONSTRAINT game_sessions_mode_check
CHECK (mode IN ('sequential', 'parallel'));

-- 4. Matchup Preference Constraint
ALTER TABLE game_sessions
DROP CONSTRAINT IF EXISTS game_sessions_matchup_preference_check;

ALTER TABLE game_sessions
ADD CONSTRAINT game_sessions_matchup_preference_check
CHECK (matchup_preference IN ('any', 'mixed_only', 'randomized_modes'));

-- 5. Status Constraint
ALTER TABLE game_sessions
DROP CONSTRAINT IF EXISTS game_sessions_status_check;

ALTER TABLE game_sessions
ADD CONSTRAINT game_sessions_status_check
CHECK (status IN ('setup', 'active', 'completed'));

-- 6. Courts Count Constraint
ALTER TABLE game_sessions
DROP CONSTRAINT IF EXISTS game_sessions_courts_check;

ALTER TABLE game_sessions
ADD CONSTRAINT game_sessions_courts_check
CHECK (courts >= 1 AND courts <= 10);

-- 7. Points Per Match Constraint
ALTER TABLE game_sessions
DROP CONSTRAINT IF EXISTS game_sessions_points_per_match_check;

ALTER TABLE game_sessions
ADD CONSTRAINT game_sessions_points_per_match_check
CHECK (points_per_match > 0 AND points_per_match <= 100);

-- 8. Current Round Constraint
ALTER TABLE game_sessions
DROP CONSTRAINT IF EXISTS game_sessions_current_round_check;

ALTER TABLE game_sessions
ADD CONSTRAINT game_sessions_current_round_check
CHECK (current_round >= 0);

-- 9. Duration Hours Constraint
ALTER TABLE game_sessions
DROP CONSTRAINT IF EXISTS game_sessions_duration_hours_check;

ALTER TABLE game_sessions
ADD CONSTRAINT game_sessions_duration_hours_check
CHECK (duration_hours >= 0.5 AND duration_hours <= 12);

-- 10. Parallel Mode Court Constraint
ALTER TABLE game_sessions
DROP CONSTRAINT IF EXISTS game_sessions_parallel_courts_check;

ALTER TABLE game_sessions
ADD CONSTRAINT game_sessions_parallel_courts_check
CHECK (
  mode = 'sequential' OR
  (mode = 'parallel' AND courts >= 2)
);

-- 11. Mixed Mexicano Matchup Constraint
ALTER TABLE game_sessions
DROP CONSTRAINT IF EXISTS game_sessions_mixed_matchup_check;

ALTER TABLE game_sessions
ADD CONSTRAINT game_sessions_mixed_matchup_check
CHECK (
  type != 'mixed_mexicano' OR
  (type = 'mixed_mexicano' AND matchup_preference = 'mixed_only')
);

-- PLAYERS TABLE CONSTRAINTS
-- ============================================================================

-- 1. Player Status Constraint
ALTER TABLE players
DROP CONSTRAINT IF EXISTS players_status_check;

ALTER TABLE players
ADD CONSTRAINT players_status_check
CHECK (status IN ('active', 'late', 'no_show', 'departed'));

-- 2. Gender Constraint
ALTER TABLE players
DROP CONSTRAINT IF EXISTS players_gender_check;

ALTER TABLE players
ADD CONSTRAINT players_gender_check
CHECK (gender IN ('male', 'female'));

-- 3. Rating Constraint
ALTER TABLE players
DROP CONSTRAINT IF EXISTS players_rating_check;

ALTER TABLE players
ADD CONSTRAINT players_rating_check
CHECK (rating >= 1.0 AND rating <= 10.0);

-- 4. Total Points Constraint
ALTER TABLE players
DROP CONSTRAINT IF EXISTS players_total_points_check;

ALTER TABLE players
ADD CONSTRAINT players_total_points_check
CHECK (total_points >= 0);

-- 5. Wins Constraint
ALTER TABLE players
DROP CONSTRAINT IF EXISTS players_wins_check;

ALTER TABLE players
ADD CONSTRAINT players_wins_check
CHECK (wins >= 0);

-- 6. Losses Constraint
ALTER TABLE players
DROP CONSTRAINT IF EXISTS players_losses_check;

ALTER TABLE players
ADD CONSTRAINT players_losses_check
CHECK (losses >= 0);

-- 7. Ties Constraint
ALTER TABLE players
DROP CONSTRAINT IF EXISTS players_ties_check;

ALTER TABLE players
ADD CONSTRAINT players_ties_check
CHECK (ties >= 0);

-- 8. Play Count Constraint
ALTER TABLE players
DROP CONSTRAINT IF EXISTS players_play_count_check;

ALTER TABLE players
ADD CONSTRAINT players_play_count_check
CHECK (play_count >= 0);

-- 9. Sit Count Constraint
ALTER TABLE players
DROP CONSTRAINT IF EXISTS players_sit_count_check;

ALTER TABLE players
ADD CONSTRAINT players_sit_count_check
CHECK (sit_count >= 0);

-- 10. Consecutive Sits Constraint
ALTER TABLE players
DROP CONSTRAINT IF EXISTS players_consecutive_sits_check;

ALTER TABLE players
ADD CONSTRAINT players_consecutive_sits_check
CHECK (consecutive_sits >= 0);

-- 11. Consecutive Plays Constraint
ALTER TABLE players
DROP CONSTRAINT IF EXISTS players_consecutive_plays_check;

ALTER TABLE players
ADD CONSTRAINT players_consecutive_plays_check
CHECK (consecutive_plays >= 0);

-- 12. Skip Count Constraint
ALTER TABLE players
DROP CONSTRAINT IF EXISTS players_skip_count_check;

ALTER TABLE players
ADD CONSTRAINT players_skip_count_check
CHECK (skip_count >= 0);

-- 13. Compensation Points Constraint
ALTER TABLE players
DROP CONSTRAINT IF EXISTS players_compensation_points_check;

ALTER TABLE players
ADD CONSTRAINT players_compensation_points_check
CHECK (compensation_points >= 0);

-- 14. Win-Loss-Tie Consistency Constraint
-- First, fix any inconsistent data by recalculating play_count
UPDATE players
SET play_count = wins + losses + ties
WHERE wins + losses + ties != play_count;

-- Then add the constraint
ALTER TABLE players
DROP CONSTRAINT IF EXISTS players_match_count_check;

ALTER TABLE players
ADD CONSTRAINT players_match_count_check
CHECK (wins + losses + ties = play_count);

-- EVENT HISTORY TABLE CONSTRAINTS
-- ============================================================================

-- 1. Event Type Constraint
ALTER TABLE event_history
DROP CONSTRAINT IF EXISTS event_history_event_type_check;

ALTER TABLE event_history
ADD CONSTRAINT event_history_event_type_check
CHECK (event_type IN (
  'session_created',
  'session_started',
  'session_completed',
  'round_generated',
  'round_completed',
  'score_updated',
  'player_added',
  'player_removed',
  'player_status_changed',
  'player_switched',
  'player_swapped',
  'player_reassigned',
  'settings_updated'
));

-- PROFILES TABLE CONSTRAINTS
-- ============================================================================

-- 1. Email Format Constraint (basic validation)
-- First, clean up existing invalid emails
UPDATE profiles
SET email = NULL
WHERE email IS NOT NULL
  AND email NOT LIKE '%@%';

-- Then add the constraint
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_email_format_check;

ALTER TABLE profiles
ADD CONSTRAINT profiles_email_format_check
CHECK (email LIKE '%@%');

-- 2. Username Format Constraint
-- First, clean up existing invalid usernames
UPDATE profiles
SET username = NULL
WHERE username IS NOT NULL
  AND (
    LENGTH(username) < 3
    OR username !~ '^[a-zA-Z0-9_]+$'
  );

-- Then add the constraint
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_username_format_check;

ALTER TABLE profiles
ADD CONSTRAINT profiles_username_format_check
CHECK (
  username IS NULL OR
  (LENGTH(username) >= 3 AND username ~ '^[a-zA-Z0-9_]+$')
);

-- CLUBS TABLE CONSTRAINTS (if table exists)
-- ============================================================================

-- 1. Club Name Length Constraint
-- Only add if clubs table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clubs') THEN
    ALTER TABLE clubs DROP CONSTRAINT IF EXISTS clubs_name_length_check;
    ALTER TABLE clubs ADD CONSTRAINT clubs_name_length_check CHECK (LENGTH(name) >= 3);
  END IF;
END $$;

-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index on game_sessions.user_id for faster user queries
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON game_sessions(user_id);

-- Index on game_sessions.club_id for faster club queries
CREATE INDEX IF NOT EXISTS idx_game_sessions_club_id ON game_sessions(club_id) WHERE club_id IS NOT NULL;

-- Index on game_sessions.status for filtering active/completed sessions
CREATE INDEX IF NOT EXISTS idx_game_sessions_status ON game_sessions(status);

-- Index on game_sessions.game_date for date-based queries
CREATE INDEX IF NOT EXISTS idx_game_sessions_game_date ON game_sessions(game_date);

-- Index on players.session_id for faster session player queries
CREATE INDEX IF NOT EXISTS idx_players_session_id ON players(session_id);

-- Index on players.status for filtering active players
CREATE INDEX IF NOT EXISTS idx_players_status ON players(status);

-- Composite index for user's active sessions
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_status
ON game_sessions(user_id, status)
WHERE status IN ('setup', 'active');

-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON CONSTRAINT game_sessions_scoring_mode_check ON game_sessions IS
'Validates scoring mode is one of: points, first_to, total_games';

COMMENT ON CONSTRAINT game_sessions_parallel_courts_check ON game_sessions IS
'Parallel mode requires at least 2 courts';

COMMENT ON CONSTRAINT game_sessions_mixed_matchup_check ON game_sessions IS
'Mixed Mexicano must use mixed_only matchup preference';

COMMENT ON CONSTRAINT players_match_count_check ON players IS
'Ensures wins + losses + ties equals total matches played';

COMMENT ON CONSTRAINT players_rating_check ON players IS
'Player rating must be between 1.0 (beginner) and 10.0 (professional)';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

-- Run this query to verify all constraints are in place:
-- SELECT conname, pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE conrelid IN ('game_sessions'::regclass, 'players'::regclass, 'event_history'::regclass, 'profiles'::regclass);
