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
CREATE POLICY "Users can view their own session events"
  ON public.event_history
  FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM public.game_sessions WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can insert events for their own sessions
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
