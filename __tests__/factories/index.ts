/**
 * Test Data Factories
 *
 * Provides reusable factory functions for creating test data.
 * Use these in all test files for consistent, realistic test data.
 *
 * @example
 * import { playerFactory, matchFactory, roundFactory } from '../factories';
 *
 * const player = playerFactory({ name: 'Alice', rating: 8 });
 * const match = matchFactory({ team1Score: 15, team2Score: 9 });
 */

import { Player, Round, Match } from '@courtster/shared';

let playerIdCounter = 0;
let matchIdCounter = 0;
let roundIdCounter = 0;

/**
 * Reset all ID counters (useful in beforeEach)
 */
export function resetFactoryCounters() {
  playerIdCounter = 0;
  matchIdCounter = 0;
  roundIdCounter = 0;
}

/**
 * Create a test Player with default values
 */
export function playerFactory(overrides: Partial<Player> = {}): Player {
  const id = overrides.id || `player-${++playerIdCounter}`;

  return {
    id,
    name: `Player ${playerIdCounter}`,
    rating: 5,
    playCount: 0,
    sitCount: 0,
    consecutiveSits: 0,
    consecutivePlays: 0,
    status: 'active',
    totalPoints: 0,
    wins: 0,
    losses: 0,
    ties: 0,
    skipRounds: [],
    skipCount: 0,
    compensationPoints: 0,
    gender: 'male',
    ...overrides,
  };
}

/**
 * Create multiple test Players
 */
export function createPlayers(count: number, overrides: Partial<Player> = {}): Player[] {
  return Array.from({ length: count }, (_, i) =>
    playerFactory({ name: `Player ${i + 1}`, ...overrides })
  );
}

/**
 * Create a test Match with default values
 */
export function matchFactory(overrides: Partial<Match> = {}): Match {
  const defaultPlayers = createPlayers(4);

  return {
    court: 1,
    team1: [defaultPlayers[0], defaultPlayers[1]],
    team2: [defaultPlayers[2], defaultPlayers[3]],
    team1Score: undefined,
    team2Score: undefined,
    ...overrides,
  };
}

/**
 * Create a test Match with specific teams
 */
export function createMatch(
  team1Players: Player[],
  team2Players: Player[],
  team1Score?: number,
  team2Score?: number
): Match {
  return {
    court: ++matchIdCounter,
    team1: team1Players,
    team2: team2Players,
    team1Score,
    team2Score,
  };
}

/**
 * Create a test Round with default values
 */
export function roundFactory(overrides: Partial<Round> = {}): Round {
  const number = overrides.number || ++roundIdCounter;

  return {
    number,
    matches: [matchFactory()],
    sittingPlayers: [],
    ...overrides,
  };
}

/**
 * Create a complete Round with specific matches
 */
export function createRound(
  number: number,
  matches: Match[],
  sittingPlayers: Player[] = []
): Round {
  return {
    number,
    matches,
    sittingPlayers,
  };
}

/**
 * Create a test session object
 */
export function sessionFactory(overrides: any = {}): any {
  return {
    id: 'session-1',
    name: 'Test Session',
    sport: 'padel',
    type: 'mexicano',
    scoring_mode: 'total_points',
    points_per_match: 24,
    courts: 2,
    matchup_preference: 'balanced',
    current_round: 0,
    round_data: '[]',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create realistic tournament data with multiple rounds
 *
 * @param playerCount - Number of players (must be >= 4)
 * @param roundCount - Number of rounds to generate
 * @returns Object with players, rounds, and session
 */
export function createTournamentData(playerCount: number = 8, roundCount: number = 3) {
  if (playerCount < 4) {
    throw new Error('Tournament requires at least 4 players');
  }

  const players = createPlayers(playerCount);
  const courtsCount = Math.floor(playerCount / 4);
  const rounds: Round[] = [];

  for (let r = 0; r < roundCount; r++) {
    const matches: Match[] = [];
    const playingPlayers = [...players].slice(0, courtsCount * 4);
    const sittingPlayers = [...players].slice(courtsCount * 4);

    // Create matches for this round
    for (let m = 0; m < courtsCount; m++) {
      const team1 = [playingPlayers[m * 4], playingPlayers[m * 4 + 1]];
      const team2 = [playingPlayers[m * 4 + 2], playingPlayers[m * 4 + 3]];

      // Generate realistic scores
      const team1Score = Math.floor(Math.random() * 12) + 9; // 9-20
      const team2Score = 24 - team1Score;

      const match = createMatch(team1, team2, team1Score, team2Score);
      // Mark match as completed
      (match as any).completed = true;
      matches.push(match);
    }

    rounds.push(createRound(r + 1, matches, sittingPlayers));
  }

  const session = sessionFactory({
    current_round: roundCount - 1,
    round_data: JSON.stringify(rounds),
    courts: courtsCount,
  });

  return { players, rounds, session };
}

/**
 * Create a mock React Query client for testing
 */
export function createMockQueryClient() {
  const { QueryClient } = require('@tanstack/react-query');

  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/**
 * Create a test wrapper with all providers
 */
export function createTestWrapper() {
  const React = require('react');
  const { QueryClientProvider } = require('@tanstack/react-query');
  const queryClient = createMockQueryClient();

  return ({ children }: { children: React.ReactNode }) => {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    );
  };
}

/**
 * Mock Supabase response
 */
export function mockSupabaseResponse<T>(data: T, error: any = null) {
  return {
    data,
    error,
    count: Array.isArray(data) ? data.length : 1,
    status: error ? 400 : 200,
    statusText: error ? 'Bad Request' : 'OK',
  };
}

/**
 * Mock Supabase RPC response
 */
export function mockSupabaseRpcResponse<T>(data: T, error: any = null) {
  return mockSupabaseResponse(data, error);
}
