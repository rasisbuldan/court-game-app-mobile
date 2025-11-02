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
-- Drop existing SELECT policy and recreate with public access
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.game_sessions;

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
