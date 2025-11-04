import { Round, Match, Player } from '@courtster/shared';
import { matchFactory, createMatches } from './matchFactory';
import { playerFactory, createPlayers } from './index';

/**
 * Create a test Round with default values
 */
export function roundFactory(overrides: Partial<Round> = {}): Round {
  return {
    number: 1,
    matches: [matchFactory()],
    sittingPlayers: [],
    ...overrides,
  };
}

/**
 * Create a round with specific number of matches
 */
export function createRoundWithMatches(
  roundNumber: number,
  matchCount: number,
  withScores: boolean = false
): Round {
  return {
    number: roundNumber,
    matches: createMatches(matchCount, withScores),
    sittingPlayers: [],
  };
}

/**
 * Create a round with sitting players
 */
export function createRoundWithSittingPlayers(
  roundNumber: number,
  matchCount: number,
  sittingPlayerCount: number
): Round {
  return {
    number: roundNumber,
    matches: createMatches(matchCount, false),
    sittingPlayers: createPlayers(sittingPlayerCount),
  };
}

/**
 * Real-world scenario: First round (no scores yet)
 */
export function createFirstRound(courts: number = 2): Round {
  return {
    number: 1,
    matches: createMatches(courts, false),
    sittingPlayers: [],
  };
}

/**
 * Real-world scenario: Completed round (all scores entered)
 */
export function createCompletedRound(roundNumber: number, courts: number = 2): Round {
  return {
    number: roundNumber,
    matches: createMatches(courts, true),
    sittingPlayers: [],
  };
}

/**
 * Real-world scenario: Round in progress (some matches completed)
 */
export function createInProgressRound(roundNumber: number): Round {
  const match1 = matchFactory({ court: 1, team1Score: 15, team2Score: 9 });
  const match2 = matchFactory({ court: 2, team1Score: undefined, team2Score: undefined });

  return {
    number: roundNumber,
    matches: [match1, match2],
    sittingPlayers: [],
  };
}

/**
 * Real-world scenario: Round with player rotation
 */
export function createRoundWithRotation(roundNumber: number): Round {
  const playingPlayers = createPlayers(8);
  const sittingPlayers = createPlayers(2);

  const matches: Match[] = [
    matchFactory({
      court: 1,
      team1: [playingPlayers[0], playingPlayers[1]],
      team2: [playingPlayers[2], playingPlayers[3]],
    }),
    matchFactory({
      court: 2,
      team1: [playingPlayers[4], playingPlayers[5]],
      team2: [playingPlayers[6], playingPlayers[7]],
    }),
  ];

  return {
    number: roundNumber,
    matches,
    sittingPlayers,
  };
}

/**
 * Create multiple rounds for testing tournaments
 */
export function createRounds(count: number, matchesPerRound: number = 2): Round[] {
  return Array.from({ length: count }, (_, i) =>
    createRoundWithMatches(i + 1, matchesPerRound, i > 0) // First round no scores
  );
}

/**
 * Real-world scenario: Tournament progression (3 completed rounds)
 */
export function createTournamentRounds(): Round[] {
  return [
    createCompletedRound(1, 2),
    createCompletedRound(2, 2),
    createInProgressRound(3),
  ];
}

/**
 * Real-world scenario: Large tournament round (5 courts)
 */
export function createLargeRound(roundNumber: number): Round {
  return createRoundWithMatches(roundNumber, 5, false);
}

/**
 * Real-world scenario: Mixed gender round
 */
export function createMixedRound(roundNumber: number): Round {
  const males = createPlayers(4, { gender: 'male' });
  const females = createPlayers(4, { gender: 'female' });

  const matches: Match[] = [
    matchFactory({
      court: 1,
      team1: [males[0], females[0]],
      team2: [males[1], females[1]],
    }),
    matchFactory({
      court: 2,
      team1: [males[2], females[2]],
      team2: [males[3], females[3]],
    }),
  ];

  return {
    number: roundNumber,
    matches,
    sittingPlayers: [],
  };
}
