import { useState, useCallback } from 'react';

export type Sport = 'padel' | 'tennis';
export type GameType = 'mexicano' | 'americano' | 'fixed_partner' | 'mixed_mexicano';
export type PlayMode = 'sequential' | 'parallel';
// Database constraint: scoring_mode must be 'points' | 'first_to' | 'total_games'
export type ScoringMode = 'points' | 'first_to' | 'total_games';
export type MatchupPreference = 'any' | 'mixed_only' | 'randomized_modes';

export interface SessionFormData {
  name: string;
  club_name: string;
  club_id: string | null;
  sport: Sport;
  type: GameType;
  mode: PlayMode;
  scoring_mode: ScoringMode;
  courts: number;
  points_per_match: number;
  game_date: string;
  game_time: string;
  duration_hours: number;
  matchup_preference: MatchupPreference;
  // Extended scoring configuration
  games_to_win?: number;
  total_games?: number;
  points_per_game?: number;
  win_margin?: number;
  enable_tiebreak?: boolean;
  tiebreak_points?: number;
}

const SCORING_MODE_DEFAULTS: Record<ScoringMode, number> = {
  points: 21,        // Padel: first to 21 points
  first_to: 6,       // Tennis: first to 6 games (1 set)
  total_games: 6,    // Total games mode: play 6 games
};

export function useSessionForm() {
  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState<SessionFormData>({
    name: '',
    club_name: '',
    club_id: null,
    sport: 'padel',
    type: 'mexicano',
    mode: 'sequential',
    scoring_mode: 'points',
    courts: 1,
    points_per_match: 21,
    game_date: getTodayDate(),
    game_time: '19:00',
    duration_hours: 2,
    matchup_preference: 'any',
    // Extended scoring config defaults
    win_margin: 0,
    games_to_win: 6,
    total_games: 6,
    points_per_game: 11,
    enable_tiebreak: false,
    tiebreak_points: 7,
  });

  const updateField = useCallback(
    <K extends keyof SessionFormData>(field: K, value: SessionFormData[K]) => {
      setFormData((prev) => {
        const next = { ...prev, [field]: value };

        // Auto-adjustments based on field changes

        // Sport change: Reset scoring mode and points
        if (field === 'sport') {
          // Tennis uses 'first_to' mode by default (first to 6 games)
          if (value === 'tennis' && prev.scoring_mode === 'points') {
            next.scoring_mode = 'first_to';
            next.points_per_match = SCORING_MODE_DEFAULTS.first_to;
          }
          // Padel defaults to 'points' mode
          if (value === 'padel' && (prev.scoring_mode === 'first_to' || prev.scoring_mode === 'total_games')) {
            next.scoring_mode = 'points';
            next.points_per_match = SCORING_MODE_DEFAULTS.points;
          }
        }

        // Mode change: Validate court count
        if (field === 'mode') {
          if (value === 'parallel' && prev.courts < 2) {
            next.courts = 2;
          }
        }

        // Courts change: Auto-switch mode if constraints violated
        if (field === 'courts') {
          const courts = value as number;
          if (prev.mode === 'parallel' && courts < 2) {
            next.mode = 'sequential';
          }
          if (courts > 4 && prev.mode === 'parallel') {
            next.mode = 'sequential';
          }
        }

        // Game type change: Lock matchup preference for mixed_mexicano
        if (field === 'type') {
          if (value === 'mixed_mexicano') {
            next.matchup_preference = 'mixed_only';
          }
        }

        // Scoring mode change: Update default points and related config
        if (field === 'scoring_mode') {
          next.points_per_match = SCORING_MODE_DEFAULTS[value as ScoringMode];

          // Set mode-specific defaults
          if (value === 'points') {
            next.points_per_match = 21;
            next.win_margin = 0;
          } else if (value === 'first_to') {
            next.games_to_win = 6;
            next.points_per_game = 11;
            next.enable_tiebreak = false;
            next.tiebreak_points = 7;
          } else if (value === 'total_games') {
            next.total_games = 6;
            next.points_per_game = 11;
          }
        }

        return next;
      });
    },
    []
  );

  const updateMultipleFields = useCallback(
    (updates: Partial<SessionFormData>) => {
      setFormData((prev) => ({ ...prev, ...updates }));
    },
    []
  );

  return {
    formData,
    updateField,
    updateMultipleFields,
  };
}
