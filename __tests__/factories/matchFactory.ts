import { Match, Player } from '@courtster/shared';
import { playerFactory } from './index';

/**
 * Create a test Match with default or custom values
 */
export function matchFactory(overrides: Partial<Match> = {}): Match {
  const defaultPlayers = [
    playerFactory({ name: 'Player A' }),
    playerFactory({ name: 'Player B' }),
    playerFactory({ name: 'Player C' }),
    playerFactory({ name: 'Player D' }),
  ];

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
 * Create a match with completed scores
 */
export function createCompletedMatch(
  team1Score: number,
  team2Score: number,
  court: number = 1
): Match {
  return matchFactory({
    court,
    team1Score,
    team2Score,
  });
}

/**
 * Create a match with specific team compositions
 */
export function createMatchWithTeams(
  team1Players: [Player, Player],
  team2Players: [Player, Player],
  court: number = 1
): Match {
  return matchFactory({
    court,
    team1: team1Players,
    team2: team2Players,
  });
}

/**
 * Real-world scenario: Close match (score difference <= 2)
 */
export function createCloseMatch(): Match {
  return matchFactory({
    team1Score: 13,
    team2Score: 11,
  });
}

/**
 * Real-world scenario: Blowout match (one team dominates)
 */
export function createBlowoutMatch(): Match {
  return matchFactory({
    team1Score: 21,
    team2Score: 3,
  });
}

/**
 * Real-world scenario: Tied match
 */
export function createTiedMatch(): Match {
  return matchFactory({
    team1Score: 12,
    team2Score: 12,
  });
}

/**
 * Real-world scenario: Match in progress (partial scores)
 */
export function createInProgressMatch(): Match {
  return matchFactory({
    team1Score: 8,
    team2Score: 5,
  });
}

/**
 * Real-world scenario: Match not started (no scores)
 */
export function createUnstartedMatch(): Match {
  return matchFactory({
    team1Score: undefined,
    team2Score: undefined,
  });
}

/**
 * Create multiple matches for testing rounds
 */
export function createMatches(count: number, withScores: boolean = false): Match[] {
  return Array.from({ length: count }, (_, i) => {
    if (withScores) {
      const team1Score = Math.floor(Math.random() * 12) + 9; // 9-20
      const team2Score = 24 - team1Score; // Assuming 24-point total
      return matchFactory({
        court: i + 1,
        team1Score,
        team2Score,
      });
    }
    return matchFactory({ court: i + 1 });
  });
}

/**
 * Real-world scenario: Mixed gender match
 */
export function createMixedMatch(): Match {
  const male1 = playerFactory({ name: 'John', gender: 'male' });
  const female1 = playerFactory({ name: 'Sarah', gender: 'female' });
  const male2 = playerFactory({ name: 'Mike', gender: 'male' });
  const female2 = playerFactory({ name: 'Emma', gender: 'female' });

  return matchFactory({
    team1: [male1, female1],
    team2: [male2, female2],
  });
}

/**
 * Real-world scenario: Unbalanced skill match (rating difference > 3)
 */
export function createUnbalancedMatch(): Match {
  const pro1 = playerFactory({ name: 'Pro 1', rating: 10 });
  const pro2 = playerFactory({ name: 'Pro 2', rating: 10 });
  const beginner1 = playerFactory({ name: 'Beginner 1', rating: 3 });
  const beginner2 = playerFactory({ name: 'Beginner 2', rating: 3 });

  return matchFactory({
    team1: [pro1, pro2],
    team2: [beginner1, beginner2],
    team1Score: 24,
    team2Score: 4,
  });
}
