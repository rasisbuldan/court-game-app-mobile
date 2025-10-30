import { useState, useCallback } from 'react';

export type Sport = 'padel' | 'tennis';
export type GameType = 'mexicano' | 'americano' | 'fixed_partner' | 'mixed_mexicano';
export type PlayMode = 'sequential' | 'parallel';
export type ScoringMode = 'points' | 'first_to' | 'first_to_games' | 'total_games';
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
}

const SCORING_MODE_DEFAULTS: Record<ScoringMode, number> = {
  points: 21,
  first_to: 11,
  first_to_games: 6,
  total_games: 6,
};

export function useSessionForm() {
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
    game_date: '',
    game_time: '19:00',
    duration_hours: 2,
    matchup_preference: 'any',
  });

  const updateField = useCallback(
    <K extends keyof SessionFormData>(field: K, value: SessionFormData[K]) => {
      setFormData((prev) => {
        const next = { ...prev, [field]: value };

        // Auto-adjustments based on field changes

        // Sport change: Reset scoring mode and points
        if (field === 'sport') {
          if (value === 'tennis' && prev.scoring_mode === 'points') {
            next.scoring_mode = 'first_to_games';
            next.points_per_match = SCORING_MODE_DEFAULTS.first_to_games;
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

        // Scoring mode change: Update default points
        if (field === 'scoring_mode') {
          next.points_per_match = SCORING_MODE_DEFAULTS[value as ScoringMode];
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
