-- Add 'mixed_mexicano' to game_sessions type check constraint

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
