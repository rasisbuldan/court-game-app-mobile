-- Migration: Add pessimistic locking for score updates
-- Purpose: Prevent concurrent score modifications using database row locks
-- Date: 2025-10-31
-- Related: Issue #3 - Score Input Race Condition

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

  -- Extract rounds array
  IF v_current_round_data IS NULL OR jsonb_array_length(v_current_round_data) = 0 THEN
    RAISE EXCEPTION 'No rounds found in session';
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

  -- Initialize if null
  IF v_current_round_data IS NULL THEN
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
