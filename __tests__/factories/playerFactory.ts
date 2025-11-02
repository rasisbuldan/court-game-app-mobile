import { Player } from '@courtster/shared';

/**
 * Creates a mock player with default values
 */
export const createMockPlayer = (overrides: Partial<Player> = {}): Player => ({
  id: `player-${Math.random().toString(36).substr(2, 9)}`,
  name: 'Test Player',
  rating: 5.0,
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
  gender: 'unspecified',
  ...overrides,
});

/**
 * Creates multiple mock players with sequential naming
 */
export const createMockPlayers = (count: number, overrides?: Partial<Player>): Player[] => {
  return Array.from({ length: count }, (_, i) =>
    createMockPlayer({
      name: `Player ${i + 1}`,
      ...overrides,
    })
  );
};

/**
 * Creates players with varied ratings for realistic testing
 */
export const createMockPlayersWithRatings = (count: number): Player[] => {
  return Array.from({ length: count }, (_, i) =>
    createMockPlayer({
      name: `Player ${i + 1}`,
      rating: Math.round((1 + (i % 10)) * 10) / 10, // Ratings from 1.0 to 10.0
    })
  );
};

/**
 * Creates players with specific gender distribution
 */
export const createMockPlayersWithGender = (
  maleCount: number,
  femaleCount: number
): Player[] => {
  const males = Array.from({ length: maleCount }, (_, i) =>
    createMockPlayer({
      name: `Male Player ${i + 1}`,
      gender: 'male',
    })
  );

  const females = Array.from({ length: femaleCount }, (_, i) =>
    createMockPlayer({
      name: `Female Player ${i + 1}`,
      gender: 'female',
    })
  );

  return [...males, ...females];
};

/**
 * Creates players with fixed partner relationships
 */
export const createMockPlayersWithPartners = (pairCount: number): Player[] => {
  const players: Player[] = [];

  for (let i = 0; i < pairCount; i++) {
    const player1Id = `partner-${i * 2}`;
    const player2Id = `partner-${i * 2 + 1}`;

    players.push(
      createMockPlayer({
        id: player1Id,
        name: `Partner ${i * 2 + 1}A`,
        partnerId: player2Id,
      }),
      createMockPlayer({
        id: player2Id,
        name: `Partner ${i * 2 + 1}B`,
        partnerId: player1Id,
      })
    );
  }

  return players;
};

/**
 * Creates players with varied point totals for leaderboard testing
 */
export const createMockPlayersWithPoints = (count: number): Player[] => {
  return Array.from({ length: count }, (_, i) =>
    createMockPlayer({
      name: `Player ${i + 1}`,
      totalPoints: (count - i) * 10, // Descending points
      wins: count - i,
      losses: i,
      ties: 0,
    })
  );
};

/**
 * Creates players with different statuses for testing
 */
export const createMockPlayersWithStatuses = (): Player[] => {
  return [
    createMockPlayer({ name: 'Active Player', status: 'active' }),
    createMockPlayer({ name: 'Late Player', status: 'late' }),
    createMockPlayer({ name: 'No Show Player', status: 'no_show' }),
    createMockPlayer({ name: 'Departed Player', status: 'departed' }),
  ];
};

/**
 * Creates a realistic player for specific scenarios
 */
export const createRealisticPlayer = (scenario: 'beginner' | 'intermediate' | 'advanced'): Player => {
  const basePlayer = createMockPlayer();

  switch (scenario) {
    case 'beginner':
      return {
        ...basePlayer,
        rating: 2.5,
        totalPoints: 10,
        wins: 1,
        losses: 3,
        ties: 0,
      };

    case 'intermediate':
      return {
        ...basePlayer,
        rating: 5.5,
        totalPoints: 50,
        wins: 5,
        losses: 5,
        ties: 1,
      };

    case 'advanced':
      return {
        ...basePlayer,
        rating: 8.5,
        totalPoints: 120,
        wins: 12,
        losses: 2,
        ties: 0,
      };

    default:
      return basePlayer;
  }
};
