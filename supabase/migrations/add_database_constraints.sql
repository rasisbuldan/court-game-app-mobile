-- Migration: Add Database Check Constraints
-- Purpose: Ensure data integrity for game sessions and players
-- Created: 2025-01-11

-- ============================================================================
-- GAME SESSIONS TABLE CONSTRAINTS
-- ============================================================================

-- 1. Scoring Mode Constraint
-- Ensures scoring_mode is one of the valid values
ALTER TABLE game_sessions
DROP CONSTRAINT IF EXISTS game_sessions_scoring_mode_check;

ALTER TABLE game_sessions
ADD CONSTRAINT game_sessions_scoring_mode_check
CHECK (scoring_mode IN ('points', 'first_to', 'total_games'));

-- 2. Sport Type Constraint
-- Ensures sport is either padel or tennis
ALTER TABLE game_sessions
DROP CONSTRAINT IF EXISTS game_sessions_sport_check;

ALTER TABLE game_sessions
ADD CONSTRAINT game_sessions_sport_check
CHECK (sport IN ('padel', 'tennis'));

-- 3. Game Type Constraint
-- Ensures type is a valid tournament format
ALTER TABLE game_sessions
DROP CONSTRAINT IF EXISTS game_sessions_type_check;

ALTER TABLE game_sessions
ADD CONSTRAINT game_sessions_type_check
CHECK (type IN ('mexicano', 'americano', 'fixed_partner', 'mixed_mexicano'));

-- 4. Play Mode Constraint
-- Ensures mode is either sequential or parallel
ALTER TABLE game_sessions
DROP CONSTRAINT IF EXISTS game_sessions_mode_check;

ALTER TABLE game_sessions
ADD CONSTRAINT game_sessions_mode_check
CHECK (mode IN ('sequential', 'parallel'));

-- 5. Matchup Preference Constraint
-- Ensures matchup_preference is a valid option
ALTER TABLE game_sessions
DROP CONSTRAINT IF EXISTS game_sessions_matchup_preference_check;

ALTER TABLE game_sessions
ADD CONSTRAINT game_sessions_matchup_preference_check
CHECK (matchup_preference IN ('any', 'mixed_only', 'randomized_modes'));

-- 6. Status Constraint
-- Ensures status is a valid state
ALTER TABLE game_sessions
DROP CONSTRAINT IF EXISTS game_sessions_status_check;

ALTER TABLE game_sessions
ADD CONSTRAINT game_sessions_status_check
CHECK (status IN ('setup', 'active', 'completed'));

-- 7. Courts Count Constraint
-- Ensures courts is between 1 and 10
ALTER TABLE game_sessions
DROP CONSTRAINT IF EXISTS game_sessions_courts_check;

ALTER TABLE game_sessions
ADD CONSTRAINT game_sessions_courts_check
CHECK (courts >= 1 AND courts <= 10);

-- 8. Points Per Match Constraint
-- Ensures points_per_match is a positive number
ALTER TABLE game_sessions
DROP CONSTRAINT IF EXISTS game_sessions_points_per_match_check;

ALTER TABLE game_sessions
ADD CONSTRAINT game_sessions_points_per_match_check
CHECK (points_per_match > 0 AND points_per_match <= 100);

-- 9. Current Round Constraint
-- Ensures current_round is non-negative
ALTER TABLE game_sessions
DROP CONSTRAINT IF EXISTS game_sessions_current_round_check;

ALTER TABLE game_sessions
ADD CONSTRAINT game_sessions_current_round_check
CHECK (current_round >= 0);

-- 10. Duration Hours Constraint
-- Ensures duration_hours is between 0.5 and 12 hours
ALTER TABLE game_sessions
DROP CONSTRAINT IF EXISTS game_sessions_duration_hours_check;

ALTER TABLE game_sessions
ADD CONSTRAINT game_sessions_duration_hours_check
CHECK (duration_hours >= 0.5 AND duration_hours <= 12);

-- 11. Parallel Mode Court Constraint
-- Ensures parallel mode has at least 2 courts
ALTER TABLE game_sessions
DROP CONSTRAINT IF EXISTS game_sessions_parallel_courts_check;

ALTER TABLE game_sessions
ADD CONSTRAINT game_sessions_parallel_courts_check
CHECK (
  mode = 'sequential' OR
  (mode = 'parallel' AND courts >= 2)
);

-- 12. Mixed Mexicano Matchup Constraint
-- Ensures mixed_mexicano always uses mixed_only matchup preference
ALTER TABLE game_sessions
DROP CONSTRAINT IF EXISTS game_sessions_mixed_matchup_check;

ALTER TABLE game_sessions
ADD CONSTRAINT game_sessions_mixed_matchup_check
CHECK (
  type != 'mixed_mexicano' OR
  (type = 'mixed_mexicano' AND matchup_preference = 'mixed_only')
);

-- ============================================================================
-- PLAYERS TABLE CONSTRAINTS
-- ============================================================================

-- 1. Player Status Constraint
-- Ensures status is a valid player state
ALTER TABLE players
DROP CONSTRAINT IF EXISTS players_status_check;

ALTER TABLE players
ADD CONSTRAINT players_status_check
CHECK (status IN ('active', 'late', 'no_show', 'departed'));

-- 2. Gender Constraint
-- Ensures gender is male or female (required for mixed tournaments)
ALTER TABLE players
DROP CONSTRAINT IF EXISTS players_gender_check;

ALTER TABLE players
ADD CONSTRAINT players_gender_check
CHECK (gender IN ('male', 'female'));

-- 3. Rating Constraint
-- Ensures rating is between 1.0 and 10.0
ALTER TABLE players
DROP CONSTRAINT IF EXISTS players_rating_check;

ALTER TABLE players
ADD CONSTRAINT players_rating_check
CHECK (rating >= 1.0 AND rating <= 10.0);

-- 4. Total Points Constraint
-- Ensures total_points is non-negative
ALTER TABLE players
DROP CONSTRAINT IF EXISTS players_total_points_check;

ALTER TABLE players
ADD CONSTRAINT players_total_points_check
CHECK (total_points >= 0);

-- 5. Wins Constraint
-- Ensures wins is non-negative
ALTER TABLE players
DROP CONSTRAINT IF EXISTS players_wins_check;

ALTER TABLE players
ADD CONSTRAINT players_wins_check
CHECK (wins >= 0);

-- 6. Losses Constraint
-- Ensures losses is non-negative
ALTER TABLE players
DROP CONSTRAINT IF EXISTS players_losses_check;

ALTER TABLE players
ADD CONSTRAINT players_losses_check
CHECK (losses >= 0);

-- 7. Ties Constraint
-- Ensures ties is non-negative
ALTER TABLE players
DROP CONSTRAINT IF EXISTS players_ties_check;

ALTER TABLE players
ADD CONSTRAINT players_ties_check
CHECK (ties >= 0);

-- 8. Play Count Constraint
-- Ensures play_count is non-negative
ALTER TABLE players
DROP CONSTRAINT IF EXISTS players_play_count_check;

ALTER TABLE players
ADD CONSTRAINT players_play_count_check
CHECK (play_count >= 0);

-- 9. Sit Count Constraint
-- Ensures sit_count is non-negative
ALTER TABLE players
DROP CONSTRAINT IF EXISTS players_sit_count_check;

ALTER TABLE players
ADD CONSTRAINT players_sit_count_check
CHECK (sit_count >= 0);

-- 10. Consecutive Sits Constraint
-- Ensures consecutive_sits is non-negative
ALTER TABLE players
DROP CONSTRAINT IF EXISTS players_consecutive_sits_check;

ALTER TABLE players
ADD CONSTRAINT players_consecutive_sits_check
CHECK (consecutive_sits >= 0);

-- 11. Consecutive Plays Constraint
-- Ensures consecutive_plays is non-negative
ALTER TABLE players
DROP CONSTRAINT IF EXISTS players_consecutive_plays_check;

ALTER TABLE players
ADD CONSTRAINT players_consecutive_plays_check
CHECK (consecutive_plays >= 0);

-- 12. Skip Count Constraint
-- Ensures skip_count is non-negative
ALTER TABLE players
DROP CONSTRAINT IF EXISTS players_skip_count_check;

ALTER TABLE players
ADD CONSTRAINT players_skip_count_check
CHECK (skip_count >= 0);

-- 13. Compensation Points Constraint
-- Ensures compensation_points is non-negative
ALTER TABLE players
DROP CONSTRAINT IF EXISTS players_compensation_points_check;

ALTER TABLE players
ADD CONSTRAINT players_compensation_points_check
CHECK (compensation_points >= 0);

-- 14. Win-Loss-Tie Consistency Constraint
-- Ensures total matches played equals play_count
ALTER TABLE players
DROP CONSTRAINT IF EXISTS players_match_count_check;

ALTER TABLE players
ADD CONSTRAINT players_match_count_check
CHECK (wins + losses + ties = play_count);

-- ============================================================================
-- EVENT HISTORY TABLE CONSTRAINTS
-- ============================================================================

-- 1. Event Type Constraint
-- Ensures event_type is a valid event
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

-- ============================================================================
-- PROFILES TABLE CONSTRAINTS
-- ============================================================================

-- 1. Email Format Constraint (basic validation)
-- Ensures email contains @ symbol
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_email_format_check;

ALTER TABLE profiles
ADD CONSTRAINT profiles_email_format_check
CHECK (email LIKE '%@%');

-- 2. Username Format Constraint
-- Ensures username is alphanumeric and at least 3 characters
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_username_format_check;

ALTER TABLE profiles
ADD CONSTRAINT profiles_username_format_check
CHECK (
  username IS NULL OR
  (LENGTH(username) >= 3 AND username ~ '^[a-zA-Z0-9_]+$')
);

-- ============================================================================
-- CLUBS TABLE CONSTRAINTS (if exists)
-- ============================================================================

-- 1. Club Name Length Constraint
-- Ensures club name is at least 3 characters
ALTER TABLE clubs
DROP CONSTRAINT IF EXISTS clubs_name_length_check;

ALTER TABLE clubs
ADD CONSTRAINT clubs_name_length_check
CHECK (LENGTH(name) >= 3);

-- ============================================================================
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

-- Index on event_history.session_id for faster event queries
CREATE INDEX IF NOT EXISTS idx_event_history_session_id ON event_history(session_id);

-- Index on event_history.created_at for chronological queries
CREATE INDEX IF NOT EXISTS idx_event_history_created_at ON event_history(created_at DESC);

-- Composite index for user's active sessions
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_status
ON game_sessions(user_id, status)
WHERE status IN ('setup', 'active');

-- ============================================================================
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
-- VERIFICATION QUERIES
-- ============================================================================

-- Run these queries to verify constraints are working:

-- 1. Check all constraints on game_sessions
-- SELECT conname, pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE conrelid = 'game_sessions'::regclass;

-- 2. Check all constraints on players
-- SELECT conname, pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE conrelid = 'players'::regclass;

-- 3. Test constraint violation (should fail)
-- INSERT INTO game_sessions (scoring_mode) VALUES ('invalid_mode');

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================

-- To remove all constraints added by this migration, uncomment and run:
/*
ALTER TABLE game_sessions DROP CONSTRAINT IF EXISTS game_sessions_scoring_mode_check;
ALTER TABLE game_sessions DROP CONSTRAINT IF EXISTS game_sessions_sport_check;
ALTER TABLE game_sessions DROP CONSTRAINT IF EXISTS game_sessions_type_check;
ALTER TABLE game_sessions DROP CONSTRAINT IF EXISTS game_sessions_mode_check;
ALTER TABLE game_sessions DROP CONSTRAINT IF EXISTS game_sessions_matchup_preference_check;
ALTER TABLE game_sessions DROP CONSTRAINT IF EXISTS game_sessions_status_check;
ALTER TABLE game_sessions DROP CONSTRAINT IF EXISTS game_sessions_courts_check;
ALTER TABLE game_sessions DROP CONSTRAINT IF EXISTS game_sessions_points_per_match_check;
ALTER TABLE game_sessions DROP CONSTRAINT IF EXISTS game_sessions_current_round_check;
ALTER TABLE game_sessions DROP CONSTRAINT IF EXISTS game_sessions_duration_hours_check;
ALTER TABLE game_sessions DROP CONSTRAINT IF EXISTS game_sessions_parallel_courts_check;
ALTER TABLE game_sessions DROP CONSTRAINT IF EXISTS game_sessions_mixed_matchup_check;

ALTER TABLE players DROP CONSTRAINT IF EXISTS players_status_check;
ALTER TABLE players DROP CONSTRAINT IF EXISTS players_gender_check;
ALTER TABLE players DROP CONSTRAINT IF EXISTS players_rating_check;
ALTER TABLE players DROP CONSTRAINT IF EXISTS players_total_points_check;
ALTER TABLE players DROP CONSTRAINT IF EXISTS players_wins_check;
ALTER TABLE players DROP CONSTRAINT IF EXISTS players_losses_check;
ALTER TABLE players DROP CONSTRAINT IF EXISTS players_ties_check;
ALTER TABLE players DROP CONSTRAINT IF EXISTS players_play_count_check;
ALTER TABLE players DROP CONSTRAINT IF EXISTS players_sit_count_check;
ALTER TABLE players DROP CONSTRAINT IF EXISTS players_consecutive_sits_check;
ALTER TABLE players DROP CONSTRAINT IF EXISTS players_consecutive_plays_check;
ALTER TABLE players DROP CONSTRAINT IF EXISTS players_skip_count_check;
ALTER TABLE players DROP CONSTRAINT IF EXISTS players_compensation_points_check;
ALTER TABLE players DROP CONSTRAINT IF EXISTS players_match_count_check;

ALTER TABLE event_history DROP CONSTRAINT IF EXISTS event_history_event_type_check;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_email_format_check;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_username_format_check;
ALTER TABLE clubs DROP CONSTRAINT IF EXISTS clubs_name_length_check;

DROP INDEX IF EXISTS idx_game_sessions_user_id;
DROP INDEX IF EXISTS idx_game_sessions_club_id;
DROP INDEX IF EXISTS idx_game_sessions_status;
DROP INDEX IF EXISTS idx_game_sessions_game_date;
DROP INDEX IF EXISTS idx_players_session_id;
DROP INDEX IF EXISTS idx_players_status;
DROP INDEX IF EXISTS idx_event_history_session_id;
DROP INDEX IF EXISTS idx_event_history_created_at;
DROP INDEX IF EXISTS idx_game_sessions_user_status;
*/
