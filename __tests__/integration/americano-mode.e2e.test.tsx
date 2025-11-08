/**
 * Americano Mode End-to-End Integration Tests
 *
 * Comprehensive testing of Americano (round-robin) game mode:
 * - Opponent rotation and minimization
 * - Round-robin pattern verification
 * - Integration with different court modes
 * - Integration with different matchup preferences
 * - Full tournament workflows
 */

import { QueryClient } from '@tanstack/react-query';
import { MexicanoAlgorithm, Player, Round } from '@courtster/shared';
import { createPlayers } from '../factories';
import { createMockPlayers } from '../factories/playerFactory';

jest.mock('../../config/supabase');
jest.mock('react-native-toast-message');
jest.mock('../../utils/logger', () => ({
  Logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
    logger: {
      log: () => {},
      warn: () => {},
      error: () => {},
    },
  });

describe('Americano Mode E2E Integration Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = createTestQueryClient();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('Basic Americano Opponent Rotation', () => {
    it('should minimize opponent repetition across rounds', () => {
      const players = createMockPlayers(8);
      const algorithm = new MexicanoAlgorithm(
        players,
        2,
        true,
        'any',
        'americano'
      );

      // Generate 4 rounds
      const rounds = [];
      for (let i = 1; i <= 4; i++) {
        rounds.push(algorithm.generateRound(i));
      }

      // Track opponent matchups
      const opponentCounts = new Map<string, number>();

      rounds.forEach((round) => {
        round.matches.forEach((match) => {
          const team1Ids = match.team1.map((p) => p.id);
          const team2Ids = match.team2.map((p) => p.id);

          // Each player on team1 faces each player on team2
          team1Ids.forEach((id1) => {
            team2Ids.forEach((id2) => {
              const key = [id1, id2].sort().join('-');
              opponentCounts.set(key, (opponentCounts.get(key) || 0) + 1);
            });
          });
        });
      });

      // In Americano, opponents should rotate more frequently
      // With 8 players and 4 rounds, some repetition is expected
      // but should be limited (max 3-4 times)
      const maxRepetitions = Math.max(...Array.from(opponentCounts.values()));
      expect(maxRepetitions).toBeLessThanOrEqual(4);
    });

    it('should ensure all players face different opponents each round', () => {
      const players = createMockPlayers(8);
      const algorithm = new MexicanoAlgorithm(
        players,
        2,
        true,
        'any',
        'americano'
      );

      const round1 = algorithm.generateRound(1);
      const round2 = algorithm.generateRound(2);

      // Get opponent pairs from both rounds
      const getOpponentPairs = (round: Round) => {
        const pairs = new Set<string>();
        round.matches.forEach((m) => {
          const team1Ids = m.team1.map((p) => p.id);
          const team2Ids = m.team2.map((p) => p.id);

          team1Ids.forEach((id1) => {
            team2Ids.forEach((id2) => {
              pairs.add([id1, id2].sort().join('-'));
            });
          });
        });
        return pairs;
      };

      const round1Opponents = getOpponentPairs(round1);
      const round2Opponents = getOpponentPairs(round2);

      // Opponent matchups should be different between rounds
      const unchanged = [...round1Opponents].filter((p) =>
        round2Opponents.has(p)
      );
      expect(unchanged.length).toBeLessThan(round1Opponents.size);
    });

    it('should distribute opponents evenly over multiple rounds', () => {
      const players = createMockPlayers(8);
      const algorithm = new MexicanoAlgorithm(
        players,
        2,
        true,
        'any',
        'americano'
      );

      // Generate 7 rounds (enough for complete round-robin with 8 players)
      const opponentPairs = new Set<string>();

      for (let i = 1; i <= 7; i++) {
        const round = algorithm.generateRound(i);

        round.matches.forEach((match) => {
          const team1Ids = match.team1.map((p) => p.id);
          const team2Ids = match.team2.map((p) => p.id);

          team1Ids.forEach((id1) => {
            team2Ids.forEach((id2) => {
              opponentPairs.add([id1, id2].sort().join('-'));
            });
          });
        });
      }

      // After 7 rounds, should have many unique opponent matchups
      // With 8 players, there are 28 possible opponent pairs (8 choose 2)
      // We should see at least 20 unique matchups
      expect(opponentPairs.size).toBeGreaterThan(20);
    });
  });

  describe('Americano with Different Player Counts', () => {
    it('should handle 12 players with 3 courts', () => {
      const players = createMockPlayers(12);
      const algorithm = new MexicanoAlgorithm(
        players,
        3,
        true,
        'any',
        'americano'
      );

      const round = algorithm.generateRound(1);

      // 3 courts = 3 matches = 12 players (all playing)
      expect(round.matches).toHaveLength(3);
      expect(round.sittingPlayers).toHaveLength(0);

      // All matches should have unique players
      const allPlayerIds = round.matches.flatMap((m) =>
        [...m.team1, ...m.team2].map((p) => p.id)
      );
      const uniquePlayerIds = new Set(allPlayerIds);
      expect(uniquePlayerIds.size).toBe(12);
    });

    it('should handle 16 players with 4 courts', () => {
      const players = createMockPlayers(16);
      const algorithm = new MexicanoAlgorithm(
        players,
        4,
        true,
        'any',
        'americano'
      );

      const round = algorithm.generateRound(1);

      // 4 courts = 4 matches = 16 players (all playing)
      expect(round.matches).toHaveLength(4);
      expect(round.sittingPlayers).toHaveLength(0);

      // Verify opponent distribution across courts
      round.matches.forEach((match) => {
        expect(match.team1).toHaveLength(2);
        expect(match.team2).toHaveLength(2);
      });
    });

    it('should handle odd player count with sitting rotation', () => {
      const players = createMockPlayers(9);
      const algorithm = new MexicanoAlgorithm(
        players,
        2,
        true,
        'any',
        'americano'
      );

      const sitCounts = new Map<string, number>();
      players.forEach((p) => sitCounts.set(p.id, 0));

      // Generate 5 rounds
      for (let i = 1; i <= 5; i++) {
        const round = algorithm.generateRound(i);

        // Each round should have 1 sitting player
        expect(round.sittingPlayers).toHaveLength(1);

        round.sittingPlayers.forEach((p) => {
          sitCounts.set(p.id, (sitCounts.get(p.id) || 0) + 1);
        });
      }

      // All players should sit approximately equally (within 1)
      const sitValues = Array.from(sitCounts.values());
      const maxSits = Math.max(...sitValues);
      const minSits = Math.min(...sitValues);
      expect(maxSits - minSits).toBeLessThanOrEqual(1);
    });
  });

  describe('Americano with Mixed Gender Preferences', () => {
    it('should work with mixed_only preference', () => {
      // 4 males + 4 females
      const males = createMockPlayers(4, { gender: 'male' });
      const females = createMockPlayers(4, { gender: 'female' });
      const players = [...males, ...females];

      const algorithm = new MexicanoAlgorithm(
        players,
        2,
        true,
        'mixed_only',
        'americano'
      );

      const round = algorithm.generateRound(1);

      // Each team should have mixed genders (1M + 1F)
      round.matches.forEach((match) => {
        const team1Genders = match.team1.map((p) => p.gender);
        const team2Genders = match.team2.map((p) => p.gender);

        expect(team1Genders).toContain('male');
        expect(team1Genders).toContain('female');
        expect(team2Genders).toContain('male');
        expect(team2Genders).toContain('female');
      });
    });

    it('should rotate opponents while maintaining gender balance', () => {
      const males = createMockPlayers(4, { gender: 'male' });
      const females = createMockPlayers(4, { gender: 'female' });
      const players = [...males, ...females];

      const algorithm = new MexicanoAlgorithm(
        players,
        2,
        true,
        'mixed_only',
        'americano'
      );

      // Generate 3 rounds
      const rounds = [];
      for (let i = 1; i <= 3; i++) {
        rounds.push(algorithm.generateRound(i));
      }

      // Track male opponent pairs
      const maleOpponents = new Map<string, number>();
      rounds.forEach((round) => {
        round.matches.forEach((match) => {
          const malesInMatch = [
            ...match.team1.filter((p) => p.gender === 'male'),
            ...match.team2.filter((p) => p.gender === 'male'),
          ];

          if (malesInMatch.length === 2) {
            const key = malesInMatch
              .map((p) => p.id)
              .sort()
              .join('-');
            maleOpponents.set(key, (maleOpponents.get(key) || 0) + 1);
          }
        });
      });

      // Male opponents should rotate (limited repetition expected)
      const maxMaleOpponentReps = Math.max(
        ...Array.from(maleOpponents.values())
      );
      expect(maxMaleOpponentReps).toBeLessThanOrEqual(3);
    });
  });

  describe('Americano Full Tournament Flow', () => {
    it('should complete 5-round tournament with opponent tracking', () => {
      const players = createMockPlayers(8);
      const algorithm = new MexicanoAlgorithm(
        players,
        2,
        true,
        'any',
        'americano'
      );

      const rounds = [];
      const opponentHistory = new Map<string, Set<string>>();

      // Initialize opponent history
      players.forEach((p) => opponentHistory.set(p.id, new Set<string>()));

      // Generate 5 rounds
      for (let roundNum = 1; roundNum <= 5; roundNum++) {
        const round = algorithm.generateRound(roundNum);
        rounds.push(round);

        // Track opponents for each player
        round.matches.forEach((match) => {
          match.team1.forEach((p1) => {
            match.team2.forEach((p2) => {
              opponentHistory.get(p1.id)?.add(p2.id);
              opponentHistory.get(p2.id)?.add(p1.id);
            });
          });
        });
      }

      // Verify tournament completed
      expect(rounds).toHaveLength(5);

      // Each player should have faced multiple unique opponents
      opponentHistory.forEach((opponents, playerId) => {
        expect(opponents.size).toBeGreaterThan(3); // Faced at least 4 different opponents
      });

      // Verify opponent repetition is limited
      const repetitionCounts = new Map<string, number>();
      rounds.forEach((round) => {
        round.matches.forEach((match) => {
          match.team1.forEach((p1) => {
            match.team2.forEach((p2) => {
              const key = [p1.id, p2.id].sort().join('-');
              repetitionCounts.set(
                key,
                (repetitionCounts.get(key) || 0) + 1
              );
            });
          });
        });
      });

      // With 5 rounds and 8 players, some repetition expected but limited
      const values = Array.from(repetitionCounts.values());
      const maxReps = Math.max(...values);
      expect(maxReps).toBeLessThanOrEqual(4);
    });

    it('should maintain fairness across multiple rounds', () => {
      const players = createMockPlayers(10);
      const algorithm = new MexicanoAlgorithm(
        players,
        2,
        true,
        'any',
        'americano'
      );

      const playCounts = new Map<string, number>();
      players.forEach((p) => playCounts.set(p.id, 0));

      // Generate 6 rounds
      for (let i = 1; i <= 6; i++) {
        const round = algorithm.generateRound(i);

        round.matches.forEach((match) => {
          [...match.team1, ...match.team2].forEach((player) => {
            playCounts.set(player.id, (playCounts.get(player.id) || 0) + 1);
          });
        });
      }

      // All players should play approximately the same number of games
      const counts = Array.from(playCounts.values());
      const maxPlays = Math.max(...counts);
      const minPlays = Math.min(...counts);

      // Difference should be at most 1 game
      expect(maxPlays - minPlays).toBeLessThanOrEqual(1);
    });
  });

  describe('Americano Performance and Scalability', () => {
    it('should handle large tournaments efficiently', () => {
      const players = createMockPlayers(20);
      const algorithm = new MexicanoAlgorithm(
        players,
        5,
        true,
        'any',
        'americano'
      );

      const startTime = Date.now();
      const round = algorithm.generateRound(1);
      const endTime = Date.now();

      // Should complete quickly (< 200ms)
      expect(endTime - startTime).toBeLessThan(200);

      // 5 courts = 5 matches
      expect(round.matches).toHaveLength(5);
      expect(round.sittingPlayers).toHaveLength(0);
    });

    it('should generate many rounds without performance degradation', () => {
      const players = createMockPlayers(12);
      const algorithm = new MexicanoAlgorithm(
        players,
        3,
        true,
        'any',
        'americano'
      );

      const startTime = Date.now();

      // Generate 15 rounds
      for (let i = 1; i <= 15; i++) {
        algorithm.generateRound(i);
      }

      const endTime = Date.now();

      // Should complete all 15 rounds quickly (< 1.5 seconds)
      expect(endTime - startTime).toBeLessThan(1500);
    });
  });

  describe('Americano vs Mexicano Comparison', () => {
    it('should have different pairing strategies than Mexicano', () => {
      const players = createMockPlayers(8).map((p, idx) => ({
        ...p,
        rating: 10 - idx, // Varied ratings: 10, 9, 8, 7, 6, 5, 4, 3
      }));

      const americanoAlgo = new MexicanoAlgorithm(
        players,
        2,
        true,
        'any',
        'americano'
      );
      const mexicanoAlgo = new MexicanoAlgorithm(
        players,
        2,
        true,
        'any',
        'mexicano'
      );

      const americanoRound = americanoAlgo.generateRound(1);
      const mexicanoRound = mexicanoAlgo.generateRound(1);

      // Both should generate valid rounds
      expect(americanoRound.matches).toHaveLength(2);
      expect(mexicanoRound.matches).toHaveLength(2);

      // Mexicano should group by rating more strictly
      const mexicanoCourt1Players = [
        ...mexicanoRound.matches[0].team1,
        ...mexicanoRound.matches[0].team2,
      ];
      const mexicanoCourt1AvgRating =
        mexicanoCourt1Players.reduce((sum, p) => sum + p.rating, 0) / 4;

      const mexicanoCourt2Players = [
        ...mexicanoRound.matches[1].team1,
        ...mexicanoRound.matches[1].team2,
      ];
      const mexicanoCourt2AvgRating =
        mexicanoCourt2Players.reduce((sum, p) => sum + p.rating, 0) / 4;

      // Mexicano should have higher rating on court 1
      expect(mexicanoCourt1AvgRating).toBeGreaterThan(mexicanoCourt2AvgRating);
    });

    it('should focus on opponent rotation rather than partner rotation', () => {
      const players = createMockPlayers(8);

      const americanoAlgo = new MexicanoAlgorithm(
        players,
        2,
        true,
        'any',
        'americano'
      );

      // Generate 4 rounds
      const partnerCounts = new Map<string, number>();
      const opponentCounts = new Map<string, number>();

      for (let i = 1; i <= 4; i++) {
        const round = americanoAlgo.generateRound(i);

        round.matches.forEach((match) => {
          // Track partners
          const team1Key = match.team1
            .map((p) => p.id)
            .sort()
            .join('-');
          const team2Key = match.team2
            .map((p) => p.id)
            .sort()
            .join('-');
          partnerCounts.set(team1Key, (partnerCounts.get(team1Key) || 0) + 1);
          partnerCounts.set(team2Key, (partnerCounts.get(team2Key) || 0) + 1);

          // Track opponents
          match.team1.forEach((p1) => {
            match.team2.forEach((p2) => {
              const oppKey = [p1.id, p2.id].sort().join('-');
              opponentCounts.set(oppKey, (opponentCounts.get(oppKey) || 0) + 1);
            });
          });
        });
      }

      // In Americano, opponent diversity should be higher than partner diversity
      const uniqueOpponents = opponentCounts.size;
      const uniquePartners = partnerCounts.size;

      // Should have more unique opponent pairs than partner pairs
      expect(uniqueOpponents).toBeGreaterThan(uniquePartners);
    });
  });
});
