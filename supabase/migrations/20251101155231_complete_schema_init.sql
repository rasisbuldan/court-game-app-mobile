-- ============================================================================
-- COMPLETE DATABASE SCHEMA INITIALIZATION
-- ============================================================================
-- Migration: Complete schema from scratch with all tables, constraints, indexes, triggers, functions, and policies
-- Purpose: Comprehensive idempotent database initialization
-- Created: 2025-11-01
-- ============================================================================

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for secure random generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- TABLE: profiles
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT,
  username TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add foreign key constraint to auth.users if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey
      FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add missing columns if table already exists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Indexes for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username) WHERE username IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_unique ON public.profiles(username) WHERE username IS NOT NULL;

-- Constraints for profiles
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_email_format_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_format_check
  CHECK (email LIKE '%@%');

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_username_format_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_format_check
  CHECK (username IS NULL OR (LENGTH(username) >= 3 AND username ~ '^[a-zA-Z0-9_]+$'));

-- Comments
COMMENT ON TABLE public.profiles IS 'User profile information linked to auth.users';
COMMENT ON COLUMN public.profiles.email IS 'User email address';
COMMENT ON COLUMN public.profiles.username IS 'Unique username (optional, alphanumeric + underscore, min 3 chars)';

-- ============================================================================
-- TABLE: clubs
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.clubs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  bio TEXT,
  logo_url TEXT,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for clubs
CREATE INDEX IF NOT EXISTS idx_clubs_owner_id ON public.clubs(owner_id);
CREATE INDEX IF NOT EXISTS idx_clubs_name ON public.clubs(name);

-- Constraints for clubs
ALTER TABLE public.clubs DROP CONSTRAINT IF EXISTS clubs_name_length_check;
ALTER TABLE public.clubs ADD CONSTRAINT clubs_name_length_check
  CHECK (LENGTH(name) >= 3);

-- Comments
COMMENT ON TABLE public.clubs IS 'Clubs/organizations that host tournament sessions';
COMMENT ON COLUMN public.clubs.owner_id IS 'User who created/owns the club';

-- ============================================================================
-- TABLE: club_memberships
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.club_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  status TEXT NOT NULL DEFAULT 'active',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(club_id, user_id)
);

-- Indexes for club_memberships
CREATE INDEX IF NOT EXISTS idx_club_memberships_club_id ON public.club_memberships(club_id);
CREATE INDEX IF NOT EXISTS idx_club_memberships_user_id ON public.club_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_club_memberships_status ON public.club_memberships(status);

-- Constraints for club_memberships
ALTER TABLE public.club_memberships DROP CONSTRAINT IF EXISTS club_memberships_role_check;
ALTER TABLE public.club_memberships ADD CONSTRAINT club_memberships_role_check
  CHECK (role IN ('owner', 'admin', 'member'));

ALTER TABLE public.club_memberships DROP CONSTRAINT IF EXISTS club_memberships_status_check;
ALTER TABLE public.club_memberships ADD CONSTRAINT club_memberships_status_check
  CHECK (status IN ('active', 'pending', 'removed'));

-- Comments
COMMENT ON TABLE public.club_memberships IS 'Club membership relationships';

-- ============================================================================
-- TABLE: club_invitations
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.club_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invited_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  invited_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '7 days')
);

-- Indexes for club_invitations
CREATE INDEX IF NOT EXISTS idx_club_invitations_club_id ON public.club_invitations(club_id);
CREATE INDEX IF NOT EXISTS idx_club_invitations_invited_user_id ON public.club_invitations(invited_user_id);
CREATE INDEX IF NOT EXISTS idx_club_invitations_invited_email ON public.club_invitations(invited_email);
CREATE INDEX IF NOT EXISTS idx_club_invitations_status ON public.club_invitations(status);

-- Constraints for club_invitations
ALTER TABLE public.club_invitations DROP CONSTRAINT IF EXISTS club_invitations_status_check;
ALTER TABLE public.club_invitations ADD CONSTRAINT club_invitations_status_check
  CHECK (status IN ('pending', 'accepted', 'declined', 'expired'));

ALTER TABLE public.club_invitations DROP CONSTRAINT IF EXISTS club_invitations_contact_check;
ALTER TABLE public.club_invitations ADD CONSTRAINT club_invitations_contact_check
  CHECK (invited_user_id IS NOT NULL OR invited_email IS NOT NULL);

-- Comments
COMMENT ON TABLE public.club_invitations IS 'Club invitations sent to users or emails';

-- ============================================================================
-- TABLE: game_sessions
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.game_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  name TEXT NOT NULL,
  club_name TEXT,
  club_id UUID REFERENCES public.clubs(id) ON DELETE SET NULL,
  sport TEXT NOT NULL DEFAULT 'padel',
  type TEXT NOT NULL DEFAULT 'mexicano',
  mode TEXT NOT NULL DEFAULT 'sequential',
  scoring_mode TEXT NOT NULL DEFAULT 'points',
  matchup_preference TEXT NOT NULL DEFAULT 'any',
  courts INTEGER NOT NULL DEFAULT 1,
  points_per_match INTEGER NOT NULL DEFAULT 24,
  duration_hours DECIMAL(3, 1) DEFAULT 2.0,
  game_date DATE,
  status TEXT NOT NULL DEFAULT 'setup',
  current_round INTEGER NOT NULL DEFAULT 0,
  round_data JSONB DEFAULT '[]'::JSONB,
  court_rounds JSONB DEFAULT '[]'::JSONB,
  can_edit_settings BOOLEAN NOT NULL DEFAULT true,
  share_token TEXT,
  share_pin TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  share_enabled_at TIMESTAMP WITH TIME ZONE,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add missing columns if table already exists
ALTER TABLE public.game_sessions ADD COLUMN IF NOT EXISTS share_token TEXT;
ALTER TABLE public.game_sessions ADD COLUMN IF NOT EXISTS share_pin TEXT;
ALTER TABLE public.game_sessions ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.game_sessions ADD COLUMN IF NOT EXISTS share_enabled_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.game_sessions ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE public.game_sessions ADD COLUMN IF NOT EXISTS game_date DATE;
ALTER TABLE public.game_sessions ADD COLUMN IF NOT EXISTS duration_hours DECIMAL(3, 1) DEFAULT 2.0;
ALTER TABLE public.game_sessions ADD COLUMN IF NOT EXISTS court_rounds JSONB DEFAULT '[]'::JSONB;

-- Indexes for game_sessions
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON public.game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_club_id ON public.game_sessions(club_id) WHERE club_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_game_sessions_status ON public.game_sessions(status);
CREATE INDEX IF NOT EXISTS idx_game_sessions_game_date ON public.game_sessions(game_date) WHERE game_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_game_sessions_share_token ON public.game_sessions(share_token) WHERE share_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_game_sessions_share_pin ON public.game_sessions(share_pin) WHERE share_pin IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_game_sessions_version ON public.game_sessions(id, version);
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_status ON public.game_sessions(user_id, status) WHERE status IN ('setup', 'active');
CREATE INDEX IF NOT EXISTS idx_game_sessions_is_public ON public.game_sessions(is_public) WHERE is_public = true;

-- Constraints for game_sessions
ALTER TABLE public.game_sessions DROP CONSTRAINT IF EXISTS game_sessions_scoring_mode_check;
ALTER TABLE public.game_sessions ADD CONSTRAINT game_sessions_scoring_mode_check
  CHECK (scoring_mode IN ('points', 'first_to', 'total_games'));

ALTER TABLE public.game_sessions DROP CONSTRAINT IF EXISTS game_sessions_sport_check;
ALTER TABLE public.game_sessions ADD CONSTRAINT game_sessions_sport_check
  CHECK (sport IN ('padel', 'tennis'));

ALTER TABLE public.game_sessions DROP CONSTRAINT IF EXISTS game_sessions_type_check;
ALTER TABLE public.game_sessions ADD CONSTRAINT game_sessions_type_check
  CHECK (type IN ('mexicano', 'americano', 'fixed_partner', 'mixed_mexicano'));

ALTER TABLE public.game_sessions DROP CONSTRAINT IF EXISTS game_sessions_mode_check;
ALTER TABLE public.game_sessions ADD CONSTRAINT game_sessions_mode_check
  CHECK (mode IN ('sequential', 'parallel'));

ALTER TABLE public.game_sessions DROP CONSTRAINT IF EXISTS game_sessions_matchup_preference_check;
ALTER TABLE public.game_sessions ADD CONSTRAINT game_sessions_matchup_preference_check
  CHECK (matchup_preference IN ('any', 'mixed_only', 'randomized_modes'));

ALTER TABLE public.game_sessions DROP CONSTRAINT IF EXISTS game_sessions_status_check;
ALTER TABLE public.game_sessions ADD CONSTRAINT game_sessions_status_check
  CHECK (status IN ('setup', 'active', 'completed'));

ALTER TABLE public.game_sessions DROP CONSTRAINT IF EXISTS game_sessions_courts_check;
ALTER TABLE public.game_sessions ADD CONSTRAINT game_sessions_courts_check
  CHECK (courts >= 1 AND courts <= 10);

ALTER TABLE public.game_sessions DROP CONSTRAINT IF EXISTS game_sessions_points_per_match_check;
ALTER TABLE public.game_sessions ADD CONSTRAINT game_sessions_points_per_match_check
  CHECK (points_per_match > 0 AND points_per_match <= 100);

ALTER TABLE public.game_sessions DROP CONSTRAINT IF EXISTS game_sessions_current_round_check;
ALTER TABLE public.game_sessions ADD CONSTRAINT game_sessions_current_round_check
  CHECK (current_round >= 0);

ALTER TABLE public.game_sessions DROP CONSTRAINT IF EXISTS game_sessions_duration_hours_check;
ALTER TABLE public.game_sessions ADD CONSTRAINT game_sessions_duration_hours_check
  CHECK (duration_hours >= 0.5 AND duration_hours <= 12);

ALTER TABLE public.game_sessions DROP CONSTRAINT IF EXISTS game_sessions_parallel_courts_check;
ALTER TABLE public.game_sessions ADD CONSTRAINT game_sessions_parallel_courts_check
  CHECK (mode = 'sequential' OR (mode = 'parallel' AND courts >= 2));

ALTER TABLE public.game_sessions DROP CONSTRAINT IF EXISTS game_sessions_mixed_matchup_check;
ALTER TABLE public.game_sessions ADD CONSTRAINT game_sessions_mixed_matchup_check
  CHECK (type != 'mixed_mexicano' OR (type = 'mixed_mexicano' AND matchup_preference = 'mixed_only'));

-- Comments
COMMENT ON TABLE public.game_sessions IS 'Tournament game sessions (Mexicano, Americano, etc.)';
COMMENT ON COLUMN public.game_sessions.round_data IS 'Array of rounds with matches - MUST be a JSONB array';
COMMENT ON COLUMN public.game_sessions.version IS 'Optimistic locking version - increments on each update to detect concurrent modifications';
COMMENT ON CONSTRAINT game_sessions_mixed_matchup_check ON public.game_sessions IS 'Mixed Mexicano must use mixed_only matchup preference';
COMMENT ON CONSTRAINT game_sessions_parallel_courts_check ON public.game_sessions IS 'Parallel mode requires at least 2 courts';

-- ============================================================================
-- TABLE: players
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  rating DECIMAL(3, 1) NOT NULL DEFAULT 5.0,
  play_count INTEGER NOT NULL DEFAULT 0,
  sit_count INTEGER NOT NULL DEFAULT 0,
  consecutive_sits INTEGER NOT NULL DEFAULT 0,
  consecutive_plays INTEGER NOT NULL DEFAULT 0,
  gender TEXT NOT NULL DEFAULT 'unspecified',
  total_points INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  ties INTEGER NOT NULL DEFAULT 0,
  skip_rounds INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  skip_count INTEGER NOT NULL DEFAULT 0,
  compensation_points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for players
CREATE INDEX IF NOT EXISTS idx_players_session_id ON public.players(session_id);
CREATE INDEX IF NOT EXISTS idx_players_status ON public.players(status);
CREATE INDEX IF NOT EXISTS idx_players_session_status ON public.players(session_id, status);

-- Constraints for players
ALTER TABLE public.players DROP CONSTRAINT IF EXISTS players_status_check;
ALTER TABLE public.players ADD CONSTRAINT players_status_check
  CHECK (status IN ('active', 'late', 'no_show', 'departed'));

ALTER TABLE public.players DROP CONSTRAINT IF EXISTS players_gender_check;
ALTER TABLE public.players ADD CONSTRAINT players_gender_check
  CHECK (gender IN ('male', 'female', 'unspecified'));

ALTER TABLE public.players DROP CONSTRAINT IF EXISTS players_rating_check;
ALTER TABLE public.players ADD CONSTRAINT players_rating_check
  CHECK (rating >= 1.0 AND rating <= 10.0);

ALTER TABLE public.players DROP CONSTRAINT IF EXISTS players_total_points_check;
ALTER TABLE public.players ADD CONSTRAINT players_total_points_check
  CHECK (total_points >= 0);

ALTER TABLE public.players DROP CONSTRAINT IF EXISTS players_wins_check;
ALTER TABLE public.players ADD CONSTRAINT players_wins_check
  CHECK (wins >= 0);

ALTER TABLE public.players DROP CONSTRAINT IF EXISTS players_losses_check;
ALTER TABLE public.players ADD CONSTRAINT players_losses_check
  CHECK (losses >= 0);

ALTER TABLE public.players DROP CONSTRAINT IF EXISTS players_ties_check;
ALTER TABLE public.players ADD CONSTRAINT players_ties_check
  CHECK (ties >= 0);

ALTER TABLE public.players DROP CONSTRAINT IF EXISTS players_play_count_check;
ALTER TABLE public.players ADD CONSTRAINT players_play_count_check
  CHECK (play_count >= 0);

ALTER TABLE public.players DROP CONSTRAINT IF EXISTS players_sit_count_check;
ALTER TABLE public.players ADD CONSTRAINT players_sit_count_check
  CHECK (sit_count >= 0);

ALTER TABLE public.players DROP CONSTRAINT IF EXISTS players_consecutive_sits_check;
ALTER TABLE public.players ADD CONSTRAINT players_consecutive_sits_check
  CHECK (consecutive_sits >= 0);

ALTER TABLE public.players DROP CONSTRAINT IF EXISTS players_consecutive_plays_check;
ALTER TABLE public.players ADD CONSTRAINT players_consecutive_plays_check
  CHECK (consecutive_plays >= 0);

ALTER TABLE public.players DROP CONSTRAINT IF EXISTS players_skip_count_check;
ALTER TABLE public.players ADD CONSTRAINT players_skip_count_check
  CHECK (skip_count >= 0);

ALTER TABLE public.players DROP CONSTRAINT IF EXISTS players_compensation_points_check;
ALTER TABLE public.players ADD CONSTRAINT players_compensation_points_check
  CHECK (compensation_points >= 0);

ALTER TABLE public.players DROP CONSTRAINT IF EXISTS players_match_count_check;
ALTER TABLE public.players ADD CONSTRAINT players_match_count_check
  CHECK (wins + losses + ties = play_count);

-- Comments
COMMENT ON TABLE public.players IS 'Players participating in a game session';
COMMENT ON CONSTRAINT players_match_count_check ON public.players IS 'Ensures wins + losses + ties equals total matches played';
COMMENT ON CONSTRAINT players_rating_check ON public.players IS 'Player rating must be between 1.0 (beginner) and 10.0 (professional)';

-- ============================================================================
-- TABLE: event_history
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.event_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  description TEXT NOT NULL,
  player_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for event_history
CREATE INDEX IF NOT EXISTS idx_event_history_session_id ON public.event_history(session_id);
CREATE INDEX IF NOT EXISTS idx_event_history_event_type ON public.event_history(event_type);
CREATE INDEX IF NOT EXISTS idx_event_history_player_id ON public.event_history(player_id) WHERE player_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_event_history_created_at ON public.event_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_history_session_created ON public.event_history(session_id, created_at DESC);

-- Constraints for event_history
ALTER TABLE public.event_history DROP CONSTRAINT IF EXISTS event_history_event_type_check;
ALTER TABLE public.event_history ADD CONSTRAINT event_history_event_type_check
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

-- Comments
COMMENT ON TABLE public.event_history IS 'Audit log of all session events';

-- ============================================================================
-- TABLE: push_tokens
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.push_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  device_type TEXT NOT NULL,
  device_name TEXT,
  app_version TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  last_used_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, token)
);

-- Add missing columns if table already exists
ALTER TABLE public.push_tokens ADD COLUMN IF NOT EXISTS device_type TEXT NOT NULL DEFAULT 'ios';
ALTER TABLE public.push_tokens ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.push_tokens ADD COLUMN IF NOT EXISTS device_name TEXT;
ALTER TABLE public.push_tokens ADD COLUMN IF NOT EXISTS app_version TEXT;
ALTER TABLE public.push_tokens ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP WITH TIME ZONE;

-- Indexes for push_tokens
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON public.push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_token ON public.push_tokens(token);
CREATE INDEX IF NOT EXISTS idx_push_tokens_is_active ON public.push_tokens(user_id, is_active) WHERE is_active = true;

-- Constraints for push_tokens
ALTER TABLE public.push_tokens DROP CONSTRAINT IF EXISTS push_tokens_device_type_check;
ALTER TABLE public.push_tokens ADD CONSTRAINT push_tokens_device_type_check
  CHECK (device_type IN ('ios', 'android', 'web'));

-- Comments
COMMENT ON TABLE public.push_tokens IS 'Push notification tokens for mobile devices';

-- ============================================================================
-- FUNCTIONS: Auto-update timestamps
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column IS 'Automatically updates updated_at timestamp on row modification';

-- ============================================================================
-- FUNCTIONS: Session version increment (optimistic locking)
-- ============================================================================

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

COMMENT ON FUNCTION increment_session_version IS 'Auto-increments version field when round_data or current_round changes - enables optimistic locking';

-- ============================================================================
-- FUNCTIONS: Score update with pessimistic locking
-- ============================================================================

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

COMMENT ON FUNCTION update_score_with_lock IS 'Atomically updates match scores using pessimistic row-level locking to prevent race conditions';

-- ============================================================================
-- FUNCTIONS: Generate round with pessimistic locking
-- ============================================================================

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

  -- Initialize if null or ensure it's an array
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

COMMENT ON FUNCTION generate_round_with_lock IS 'Atomically generates a new round using pessimistic locking to prevent concurrent round generation';

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Auto-update updated_at for profiles
DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Auto-update updated_at for clubs
DROP TRIGGER IF EXISTS trigger_clubs_updated_at ON public.clubs;
CREATE TRIGGER trigger_clubs_updated_at
  BEFORE UPDATE ON public.clubs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Auto-update updated_at for push_tokens
DROP TRIGGER IF EXISTS trigger_push_tokens_updated_at ON public.push_tokens;
CREATE TRIGGER trigger_push_tokens_updated_at
  BEFORE UPDATE ON public.push_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Auto-increment version for game_sessions
DROP TRIGGER IF EXISTS trigger_increment_session_version ON public.game_sessions;
CREATE TRIGGER trigger_increment_session_version
  BEFORE UPDATE ON public.game_sessions
  FOR EACH ROW
  EXECUTE FUNCTION increment_session_version();

COMMENT ON TRIGGER trigger_increment_session_version ON public.game_sessions IS
  'Auto-increments version field when round_data or current_round changes - enables optimistic locking';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: profiles
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- RLS POLICIES: clubs
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can view clubs" ON public.clubs;
DROP POLICY IF EXISTS "Users can create clubs" ON public.clubs;
DROP POLICY IF EXISTS "Club owners can update their clubs" ON public.clubs;
DROP POLICY IF EXISTS "Club owners can delete their clubs" ON public.clubs;

CREATE POLICY "Anyone can view clubs"
  ON public.clubs FOR SELECT
  USING (true);

CREATE POLICY "Users can create clubs"
  ON public.clubs FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Club owners can update their clubs"
  ON public.clubs FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Club owners can delete their clubs"
  ON public.clubs FOR DELETE
  USING (auth.uid() = owner_id);

-- ============================================================================
-- RLS POLICIES: club_memberships
-- ============================================================================

DROP POLICY IF EXISTS "Users can view memberships for their clubs or themselves" ON public.club_memberships;
DROP POLICY IF EXISTS "Club admins can manage memberships" ON public.club_memberships;

CREATE POLICY "Users can view memberships for their clubs or themselves"
  ON public.club_memberships FOR SELECT
  USING (
    auth.uid() = user_id OR
    club_id IN (
      SELECT club_id FROM public.club_memberships
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Club admins can manage memberships"
  ON public.club_memberships FOR ALL
  USING (
    club_id IN (
      SELECT club_id FROM public.club_memberships
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- RLS POLICIES: club_invitations
-- ============================================================================

DROP POLICY IF EXISTS "Users can view invitations for their clubs or themselves" ON public.club_invitations;
DROP POLICY IF EXISTS "Club admins can manage invitations" ON public.club_invitations;

CREATE POLICY "Users can view invitations for their clubs or themselves"
  ON public.club_invitations FOR SELECT
  USING (
    auth.uid() = invited_user_id OR
    club_id IN (
      SELECT club_id FROM public.club_memberships
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Club admins can manage invitations"
  ON public.club_invitations FOR ALL
  USING (
    club_id IN (
      SELECT club_id FROM public.club_memberships
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- RLS POLICIES: game_sessions
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own sessions" ON public.game_sessions;
DROP POLICY IF EXISTS "Users can view their own sessions or public shared sessions" ON public.game_sessions;
DROP POLICY IF EXISTS "Public sessions viewable by anyone" ON public.game_sessions;
DROP POLICY IF EXISTS "Users can create their own sessions" ON public.game_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON public.game_sessions;
DROP POLICY IF EXISTS "Users can delete their own sessions" ON public.game_sessions;

CREATE POLICY "Users can view their own sessions or public shared sessions"
  ON public.game_sessions FOR SELECT
  USING (
    auth.uid() = user_id OR
    (is_public = true AND share_token IS NOT NULL)
  );

CREATE POLICY "Users can create their own sessions"
  ON public.game_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON public.game_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
  ON public.game_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- RLS POLICIES: players
-- ============================================================================

DROP POLICY IF EXISTS "Users can view players from their sessions" ON public.players;
DROP POLICY IF EXISTS "Users can view players from their sessions or public sessions" ON public.players;
DROP POLICY IF EXISTS "Users can manage players in their sessions" ON public.players;

CREATE POLICY "Users can view players from their sessions or public sessions"
  ON public.players FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM public.game_sessions
      WHERE user_id = auth.uid() OR (is_public = true AND share_token IS NOT NULL)
    )
  );

CREATE POLICY "Users can manage players in their sessions"
  ON public.players FOR ALL
  USING (
    session_id IN (
      SELECT id FROM public.game_sessions
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS POLICIES: event_history
-- ============================================================================

DROP POLICY IF EXISTS "Users can view events from their sessions" ON public.event_history;
DROP POLICY IF EXISTS "Users can view events from their sessions or public sessions" ON public.event_history;
DROP POLICY IF EXISTS "Users can create events in their sessions" ON public.event_history;

CREATE POLICY "Users can view events from their sessions or public sessions"
  ON public.event_history FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM public.game_sessions
      WHERE user_id = auth.uid() OR (is_public = true AND share_token IS NOT NULL)
    )
  );

CREATE POLICY "Users can create events in their sessions"
  ON public.event_history FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT id FROM public.game_sessions
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS POLICIES: push_tokens
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own push tokens" ON public.push_tokens;
DROP POLICY IF EXISTS "Users can manage their own push tokens" ON public.push_tokens;

CREATE POLICY "Users can view their own push tokens"
  ON public.push_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own push tokens"
  ON public.push_tokens FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant table permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Grant sequence permissions
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant function execution permissions
GRANT EXECUTE ON FUNCTION update_score_with_lock TO authenticated;
GRANT EXECUTE ON FUNCTION generate_round_with_lock TO authenticated;
GRANT EXECUTE ON FUNCTION update_updated_at_column TO authenticated;
GRANT EXECUTE ON FUNCTION increment_session_version TO authenticated;

-- ============================================================================
-- DATA CLEANUP (for existing data to pass constraints)
-- ============================================================================

-- Fix game_sessions invalid values
UPDATE public.game_sessions SET scoring_mode = 'points'
WHERE scoring_mode NOT IN ('points', 'first_to', 'total_games');

UPDATE public.game_sessions SET sport = 'padel'
WHERE sport NOT IN ('padel', 'tennis');

UPDATE public.game_sessions SET type = 'mexicano'
WHERE type NOT IN ('mexicano', 'americano', 'fixed_partner', 'mixed_mexicano');

UPDATE public.game_sessions SET mode = 'sequential'
WHERE mode NOT IN ('sequential', 'parallel');

UPDATE public.game_sessions SET matchup_preference = 'any'
WHERE matchup_preference NOT IN ('any', 'mixed_only', 'randomized_modes');

UPDATE public.game_sessions SET status = 'setup'
WHERE status NOT IN ('setup', 'active', 'completed');

UPDATE public.game_sessions SET courts = 1
WHERE courts < 1 OR courts > 10;

UPDATE public.game_sessions SET points_per_match = 24
WHERE points_per_match <= 0 OR points_per_match > 100;

UPDATE public.game_sessions SET current_round = 0
WHERE current_round < 0;

UPDATE public.game_sessions SET duration_hours = 2.0
WHERE duration_hours < 0.5 OR duration_hours > 12;

-- CRITICAL: Fix round_data that is not an array
UPDATE public.game_sessions
SET round_data = '[]'::JSONB
WHERE round_data IS NOT NULL AND jsonb_typeof(round_data) != 'array';

-- Fix mixed_mexicano matchup preference
UPDATE public.game_sessions
SET matchup_preference = 'mixed_only'
WHERE type = 'mixed_mexicano' AND matchup_preference != 'mixed_only';

-- Fix players invalid values
UPDATE public.players SET status = 'active'
WHERE status NOT IN ('active', 'late', 'no_show', 'departed');

UPDATE public.players SET gender = 'unspecified'
WHERE gender NOT IN ('male', 'female', 'unspecified');

UPDATE public.players SET rating = 5.0
WHERE rating < 1.0 OR rating > 10.0;

UPDATE public.players SET total_points = 0
WHERE total_points < 0;

UPDATE public.players SET wins = 0
WHERE wins < 0;

UPDATE public.players SET losses = 0
WHERE losses < 0;

UPDATE public.players SET ties = 0
WHERE ties < 0;

UPDATE public.players SET play_count = wins + losses + ties
WHERE play_count < 0 OR play_count != (wins + losses + ties);

UPDATE public.players SET sit_count = 0
WHERE sit_count < 0;

UPDATE public.players SET consecutive_sits = 0
WHERE consecutive_sits < 0;

UPDATE public.players SET consecutive_plays = 0
WHERE consecutive_plays < 0;

UPDATE public.players SET skip_count = 0
WHERE skip_count < 0;

UPDATE public.players SET compensation_points = 0
WHERE compensation_points < 0;

-- Fix profiles invalid values
UPDATE public.profiles SET username = NULL
WHERE username IS NOT NULL AND (LENGTH(username) < 3 OR username !~ '^[a-zA-Z0-9_]+$');

UPDATE public.profiles SET email = NULL
WHERE email IS NOT NULL AND email NOT LIKE '%@%';

-- Fix clubs invalid values
UPDATE public.clubs SET name = 'Unnamed Club'
WHERE LENGTH(name) < 3;

-- Fix push_tokens invalid values
UPDATE public.push_tokens SET device_type = 'ios'
WHERE device_type NOT IN ('ios', 'android', 'web');

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- The following queries can be used to verify the migration:

-- Check all tables
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Check all constraints on game_sessions
-- SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'public.game_sessions'::regclass;

-- Check all indexes
-- SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = 'public';

-- Check all triggers
-- SELECT trigger_name, event_manipulation, event_object_table FROM information_schema.triggers WHERE trigger_schema = 'public';

-- Check all RLS policies
-- SELECT tablename, policyname, permissive, roles, cmd, qual FROM pg_policies WHERE schemaname = 'public';

-- ============================================================================
-- COMPLETE
-- ============================================================================

-- Migration complete! All tables, constraints, indexes, triggers, functions, and policies created.
