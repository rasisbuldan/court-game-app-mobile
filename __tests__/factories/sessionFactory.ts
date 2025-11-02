import { Player, Round, Match } from '@courtster/shared';
import { createMockPlayers } from './playerFactory';

export interface MockSession {
  id: string;
  name: string;
  type: 'mexicano' | 'americano' | 'mixed_mexicano';
  sport: 'padel' | 'tennis';
  courts: number;
  points_per_match: number;
  status: string;
  current_round: number;
  player_count: number;
  game_date: string;
  game_time: string;
  duration_hours: number;
  created_at: string;
  club_id: string | null;
  club_name: string | null;
  scoring_mode?: 'fixed' | 'first_to' | 'first_to_games';
  matchup_preference?: 'any' | 'mixed_only' | 'randomized_modes';
}

/**
 * Creates a mock session with default values
 */
export const createMockSession = (overrides: Partial<MockSession> = {}): MockSession => ({
  id: `session-${Math.random().toString(36).substr(2, 9)}`,
  name: 'Test Session',
  type: 'mexicano',
  sport: 'padel',
  courts: 2,
  points_per_match: 24,
  status: 'active',
  current_round: 0,
  player_count: 8,
  game_date: new Date().toISOString().split('T')[0],
  game_time: '18:00',
  duration_hours: 2,
  created_at: new Date().toISOString(),
  club_id: null,
  club_name: null,
  scoring_mode: 'fixed',
  matchup_preference: 'any',
  ...overrides,
});

/**
 * Creates a mock match
 */
export const createMockMatch = (
  court: number,
  team1: [Player, Player],
  team2: [Player, Player],
  scores?: { team1Score?: number; team2Score?: number }
): Match => ({
  court,
  team1,
  team2,
  ...scores,
});

/**
 * Creates a mock round
 */
export const createMockRound = (
  roundNumber: number,
  matchCount: number = 2,
  includeScores: boolean = false
): Round => {
  const players = createMockPlayers(matchCount * 4);
  const matches: Match[] = [];

  for (let i = 0; i < matchCount; i++) {
    const team1: [Player, Player] = [players[i * 4], players[i * 4 + 1]];
    const team2: [Player, Player] = [players[i * 4 + 2], players[i * 4 + 3]];

    matches.push(
      createMockMatch(i + 1, team1, team2, includeScores ? {
        team1Score: Math.floor(Math.random() * 24),
        team2Score: Math.floor(Math.random() * 24),
      } : undefined)
    );
  }

  return {
    number: roundNumber,
    matches,
    sittingPlayers: [],
  };
};

/**
 * Creates multiple rounds for a session
 */
export const createMockRounds = (
  count: number,
  matchesPerRound: number = 2,
  withScores: boolean = false
): Round[] => {
  return Array.from({ length: count }, (_, i) =>
    createMockRound(i + 1, matchesPerRound, withScores)
  );
};

/**
 * Creates a session with specific game type
 */
export const createMexicanoSession = (playerCount: number = 8, courts: number = 2): MockSession => {
  return createMockSession({
    type: 'mexicano',
    player_count: playerCount,
    courts,
    matchup_preference: 'any',
  });
};

export const createAmericanoSession = (playerCount: number = 8, courts: number = 2): MockSession => {
  return createMockSession({
    type: 'americano',
    player_count: playerCount,
    courts,
    matchup_preference: 'any',
  });
};

export const createMixedMexicanoSession = (playerCount: number = 8, courts: number = 2): MockSession => {
  return createMockSession({
    type: 'mixed_mexicano',
    player_count: playerCount,
    courts,
    matchup_preference: 'mixed_only',
  });
};

/**
 * Creates a session with specific scoring mode
 */
export const createFixedScoreSession = (): MockSession => {
  return createMockSession({
    scoring_mode: 'fixed',
    points_per_match: 24,
  });
};

export const createFirstToSession = (): MockSession => {
  return createMockSession({
    scoring_mode: 'first_to',
    points_per_match: 21,
  });
};

export const createFirstToGamesSession = (): MockSession => {
  return createMockSession({
    scoring_mode: 'first_to_games',
    points_per_match: 3,
  });
};
