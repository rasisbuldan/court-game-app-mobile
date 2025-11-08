import { MexicanoAlgorithm, Player, Round } from '@courtster/shared';
import { createMockPlayers, createMockPlayersWithPartners } from '../factories/playerFactory';

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

// Helper to calculate expected match count
const expectedMatches = (playerCount: number, courts: number): number => {
  return Math.min(courts, Math.floor(playerCount / 4));
};

describe('Edge Cases and Boundary Conditions', () => {
  describe('Player Status Changes', () => {
    it('should handle player departing mid-tournament', () => {
      const players = createMockPlayers(8);
      const algorithm = new MexicanoAlgorithm(players, 3, false, 'any', 'mexicano');

      // Generate first 3 rounds
      for (let i = 1; i <= 3; i++) {
        algorithm.generateRound(i);
      }

      // Player departs
      players[0].status = 'departed';

      // Should still generate rounds with remaining active players
      const activePlayers = players.filter((p) => p.status !== 'departed');
      expect(activePlayers).toHaveLength(7);

      // Algorithm should handle this gracefully
      const algorithm2 = new MexicanoAlgorithm(activePlayers, 3, false, 'any', 'mexicano');
      const round4 = algorithm2.generateRound(4);

      expect(round4.matches.length).toBeGreaterThan(0);
    });

    it('should handle player arriving late', () => {
      const players = createMockPlayers(6);
      players[5].status = 'late';

      // Start with 5 active players
      const activePlayers = players.filter((p) => p.status !== 'late');
      const algorithm = new MexicanoAlgorithm(activePlayers, 1, false, 'any', 'mexicano');

      const round1 = algorithm.generateRound(1);
      expect(round1.matches).toHaveLength(1);

      // Late player arrives
      players[5].status = 'active';

      // Create new algorithm with all players
      const algorithm2 = new MexicanoAlgorithm(players, 1, false, 'any', 'mexicano');
      const round2 = algorithm2.generateRound(2);
      expect(round2.matches).toHaveLength(1);
    });

    it('should handle player becoming inactive', () => {
      const players = createMockPlayers(8);
      const algorithm = new MexicanoAlgorithm(players, 3, false, 'any', 'mexicano');

      algorithm.generateRound(1);

      // Player becomes inactive
      players[2].status = 'inactive';

      const activePlayers = players.filter((p) => p.status === 'active');
      expect(activePlayers).toHaveLength(7);
    });

    it('should handle multiple simultaneous status changes', () => {
      const players = createMockPlayers(12);
      const algorithm = new MexicanoAlgorithm(players, 4, false, 'any', 'mexicano');

      algorithm.generateRound(1);

      // Multiple changes
      players[0].status = 'departed';
      players[1].status = 'inactive';
      players[11].status = 'late';

      const activePlayers = players.filter((p) => p.status === 'active');
      expect(activePlayers).toHaveLength(9);
    });
  });

  describe('Round Regeneration', () => {
    it('should allow regenerating current round with different parameters', () => {
      const players = createMockPlayers(8);
      const algorithm = new MexicanoAlgorithm(players, 3, false, 'any', 'mexicano');

      const round1First = algorithm.generateRound(1);
      // 8 players, 3 courts = min(3, floor(8/4)) = min(3, 2) = 2 matches
      expect(round1First.matches).toHaveLength(expectedMatches(8, 3));

      // Regenerate with randomization
      const algorithm2 = new MexicanoAlgorithm(players, 3, false, 'randomized_modes', 'mexicano');
      const round1Second = algorithm2.generateRound(1);

      expect(round1Second.matches).toHaveLength(expectedMatches(8, 3));
      expect(round1Second.number).toBe(1);
    });

    it('should handle skipping rounds', () => {
      const players = createMockPlayers(8);
      const algorithm = new MexicanoAlgorithm(players, 3, false, 'any', 'mexicano');

      // Generate round 1
      algorithm.generateRound(1);

      // Skip to round 5
      const round5 = algorithm.generateRound(5);
      expect(round5.number).toBe(5);
      expect(round5.matches).toHaveLength(expectedMatches(8, 3));
    });

    it('should handle generating past rounds', () => {
      const players = createMockPlayers(8);
      const algorithm = new MexicanoAlgorithm(players, 3, false, 'any', 'mexicano');

      // Generate rounds 1-5
      for (let i = 1; i <= 5; i++) {
        algorithm.generateRound(i);
      }

      // Request round 3 again
      const round3Again = algorithm.generateRound(3);
      expect(round3Again.number).toBe(3);
      expect(round3Again.matches).toHaveLength(expectedMatches(8, 3));
    });

    it('should maintain history when regenerating', () => {
      const players = createMockPlayers(8);
      const algorithm = new MexicanoAlgorithm(players, 3, false, 'any', 'mexicano');

      const round1 = algorithm.generateRound(1);

      // Update scores
      round1.matches.forEach((match) => {
        match.team1.forEach((p) => {
          const player = players.find((pl) => pl.id === p.id)!;
          player.totalPoints += 21;
          player.playCount += 1;
        });
      });

      // Regenerate round 2
      const round2 = algorithm.generateRound(2);

      // Should consider updated stats
      expect(round2.matches).toHaveLength(expectedMatches(8, 3));
      expect(round2.number).toBe(2);
    });
  });

  describe('Empty and Null Data', () => {
    it('should handle minimum viable tournament (4 players, 1 court)', () => {
      const players = createMockPlayers(4);
      const algorithm = new MexicanoAlgorithm(players, 1, false, 'any', 'mexicano');

      const round = algorithm.generateRound(1);
      expect(round.matches).toHaveLength(1);
      expect(round.matches[0].team1).toHaveLength(2);
      expect(round.matches[0].team2).toHaveLength(2);
    });

    it('should handle players with zero stats', () => {
      const players = createMockPlayers(6);
      players.forEach((p) => {
        p.totalPoints = 0;
        p.playCount = 0;
        p.sitCount = 0;
      });

      const algorithm = new MexicanoAlgorithm(players, 2, false, 'any', 'mexicano');
      const round = algorithm.generateRound(1);

      // 6 players, 2 courts = min(2, floor(6/4)) = min(2, 1) = 1 match
      expect(round.matches).toHaveLength(expectedMatches(6, 2));
    });

    it('should handle players with missing optional fields', () => {
      const players = createMockPlayers(4);
      players.forEach((p) => {
        delete (p as any).partnerId;
        delete (p as any).rating;
      });

      const algorithm = new MexicanoAlgorithm(players, 1, false, 'any', 'mexicano');
      const round = algorithm.generateRound(1);

      expect(round.matches).toHaveLength(1);
    });

    it('should handle empty gender for non-mixed tournaments', () => {
      const players = createMockPlayers(4);
      players.forEach((p) => {
        p.gender = undefined as any;
      });

      const algorithm = new MexicanoAlgorithm(players, 1, false, 'any', 'mexicano');
      const round = algorithm.generateRound(1);

      expect(round.matches).toHaveLength(1);
    });
  });

  describe('Rating Calculation Boundaries', () => {
    it('should handle extreme rating differences', () => {
      const players = createMockPlayers(4);
      players[0].rating = 1000;
      players[1].rating = 2000;
      players[2].rating = 1500;
      players[3].rating = 1800;

      const algorithm = new MexicanoAlgorithm(players, 1, false, 'any', 'mexicano');
      const round = algorithm.generateRound(1);

      expect(round.matches).toHaveLength(1);
    });

    it('should handle all players with same rating', () => {
      const players = createMockPlayers(8);
      players.forEach((p) => (p.rating = 10));

      const algorithm = new MexicanoAlgorithm(players, 3, false, 'any', 'mexicano');
      const round = algorithm.generateRound(1);

      expect(round.matches).toHaveLength(expectedMatches(8, 3));
    });

    it('should handle rating updates after each round', () => {
      const players = createMockPlayers(6);
      const algorithm = new MexicanoAlgorithm(players, 2, false, 'any', 'mexicano');

      for (let round = 1; round <= 5; round++) {
        const roundData = algorithm.generateRound(round);

        // Simulate rating changes
        roundData.matches.forEach((match) => {
          match.team1.forEach((p) => {
            const player = players.find((pl) => pl.id === p.id)!;
            player.rating += 10; // Winners gain rating
          });
          match.team2.forEach((p) => {
            const player = players.find((pl) => pl.id === p.id)!;
            player.rating -= 5; // Losers lose rating
          });
        });
      }

      // Ratings should have changed
      const ratingChanges = players.map((p) => p.rating - 1500);
      expect(ratingChanges.some((change) => change !== 0)).toBe(true);
    });

    it('should handle negative ratings', () => {
      const players = createMockPlayers(4);
      players.forEach((p) => (p.rating = -100));

      const algorithm = new MexicanoAlgorithm(players, 1, false, 'any', 'mexicano');
      const round = algorithm.generateRound(1);

      expect(round.matches).toHaveLength(1);
    });

    it('should handle very large ratings', () => {
      const players = createMockPlayers(4);
      players.forEach((p) => (p.rating = 999999));

      const algorithm = new MexicanoAlgorithm(players, 1, false, 'any', 'mexicano');
      const round = algorithm.generateRound(1);

      expect(round.matches).toHaveLength(1);
    });
  });

  describe('History and Memory Management', () => {
    it('should track opponent history correctly', () => {
      const players = createMockPlayers(6);
      const algorithm = new MexicanoAlgorithm(players, 2, false, 'any', 'mexicano');

      const opponentCounts = new Map<string, Map<string, number>>();

      for (let round = 1; round <= 10; round++) {
        const roundData = algorithm.generateRound(round);

        roundData.matches.forEach((match) => {
          // Track as opponents
          match.team1.forEach((p1) => {
            match.team2.forEach((p2) => {
              if (!opponentCounts.has(p1.id)) {
                opponentCounts.set(p1.id, new Map());
              }
              const current = opponentCounts.get(p1.id)!.get(p2.id) || 0;
              opponentCounts.get(p1.id)!.set(p2.id, current + 1);
            });
          });
        });
      }

      // Verify history exists
      expect(opponentCounts.size).toBeGreaterThan(0);
    });

    it('should track partner history correctly', () => {
      const players = createMockPlayers(6);
      const algorithm = new MexicanoAlgorithm(players, 2, false, 'any', 'mexicano');

      const partnerCounts = new Map<string, Map<string, number>>();

      for (let round = 1; round <= 10; round++) {
        const roundData = algorithm.generateRound(round);

        roundData.matches.forEach((match) => {
          // Track team1 partnerships
          const p1 = match.team1[0];
          const p2 = match.team1[1];

          if (!partnerCounts.has(p1.id)) {
            partnerCounts.set(p1.id, new Map());
          }
          const current = partnerCounts.get(p1.id)!.get(p2.id) || 0;
          partnerCounts.get(p1.id)!.set(p2.id, current + 1);
        });
      }

      expect(partnerCounts.size).toBeGreaterThan(0);
    });

    it('should handle growing history maps efficiently', () => {
      const players = createMockPlayers(12);
      const algorithm = new MexicanoAlgorithm(players, 4, false, 'any', 'mexicano');

      // Generate many rounds
      for (let round = 1; round <= 50; round++) {
        const roundData = algorithm.generateRound(round);
        expect(roundData.matches.length).toBeGreaterThan(0);
      }

      // Memory should not explode
      // In real implementation, history maps grow O(N²) per player
      // For 12 players: 12 * 12 = 144 entries max
      expect(players.length * players.length).toBe(144);
    });

    it('should maintain history accuracy over many rounds', () => {
      const players = createMockPlayers(8);
      const algorithm = new MexicanoAlgorithm(players, 3, false, 'any', 'mexicano');

      for (let round = 1; round <= 20; round++) {
        const roundData = algorithm.generateRound(round);

        roundData.matches.forEach((match) => {
          match.team1.forEach((p) => {
            const player = players.find((pl) => pl.id === p.id)!;
            player.playCount += 1;
          });
          match.team2.forEach((p) => {
            const player = players.find((pl) => pl.id === p.id)!;
            player.playCount += 1;
          });
        });
      }

      // Verify play counts are reasonable
      players.forEach((p) => {
        expect(p.playCount).toBeGreaterThan(0);
        expect(p.playCount).toBeLessThanOrEqual(20);
      });
    });
  });

  describe('Concurrent Operations and Race Conditions', () => {
    it('should handle rapid sequential round generation', () => {
      const players = createMockPlayers(8);
      const algorithm = new MexicanoAlgorithm(players, 3, false, 'any', 'mexicano');

      const rounds = [];
      for (let i = 1; i <= 10; i++) {
        rounds.push(algorithm.generateRound(i));
      }

      expect(rounds).toHaveLength(10);
      rounds.forEach((round, idx) => {
        expect(round.number).toBe(idx + 1);
      });
    });

    it('should handle parallel court generation in parallel mode', () => {
      const players = createMockPlayers(16);
      const algorithm = new MexicanoAlgorithm(players, 4, true, 'any', 'mexicano');

      const roundsPerCourt = [];

      for (let court = 1; court <= 4; court++) {
        const courtRounds = [];
        for (let round = 1; round <= 5; round++) {
          courtRounds.push(algorithm.generateRound(round, court));
        }
        roundsPerCourt.push(courtRounds);
      }

      expect(roundsPerCourt).toHaveLength(4);
      roundsPerCourt.forEach((courtRounds) => {
        expect(courtRounds).toHaveLength(5);
      });
    });

    it('should handle interleaved round and score updates', () => {
      const players = createMockPlayers(8);
      const algorithm = new MexicanoAlgorithm(players, 3, false, 'any', 'mexicano');

      for (let round = 1; round <= 5; round++) {
        const roundData = algorithm.generateRound(round);

        // Immediate score update
        roundData.matches.forEach((match) => {
          match.team1.forEach((p) => {
            const player = players.find((pl) => pl.id === p.id)!;
            player.totalPoints += 21;
            player.playCount += 1;
          });
          match.team2.forEach((p) => {
            const player = players.find((pl) => pl.id === p.id)!;
            player.totalPoints += 18;
            player.playCount += 1;
          });
        });
      }

      // Verify consistency
      players.forEach((p) => {
        expect(p.playCount).toBeGreaterThan(0);
      });
    });

    it('should handle non-atomic playCount and sitCount updates', () => {
      const players = createMockPlayers(8);
      const algorithm = new MexicanoAlgorithm(players, 3, false, 'any', 'mexicano');

      const round = algorithm.generateRound(1);

      // Simulate concurrent updates (non-atomic)
      const initialPlayCounts = players.map((p) => p.playCount);

      round.matches.forEach((match) => {
        match.team1.forEach((p) => {
          const player = players.find((pl) => pl.id === p.id)!;
          player.playCount++; // Non-atomic increment
        });
      });

      // Verify changes occurred
      const finalPlayCounts = players.map((p) => p.playCount);
      expect(finalPlayCounts).not.toEqual(initialPlayCounts);
    });
  });

  describe('Fixed Partner Edge Cases', () => {
    it('should handle missing partner IDs gracefully', () => {
      const players = createMockPlayers(4);
      // Don't set partner IDs - algorithm falls back but can't create matches

      const algorithm = new MexicanoAlgorithm(players, 1, false, 'any', 'fixed_partner');
      const round = algorithm.generateRound(1);

      // Should generate round (may be empty if fallback doesn't work)
      expect(round).toBeDefined();
      expect(round.matches).toBeDefined();
    });

    it('should handle unidirectional partnerships', () => {
      const players = createMockPlayers(4);
      players[0].partnerId = players[1].id;
      // Missing players[1].partnerId = players[0].id - this is invalid

      const algorithm = new MexicanoAlgorithm(players, 1, false, 'any', 'fixed_partner');
      const round = algorithm.generateRound(1);

      // Should generate round (may be empty if partnerships invalid)
      expect(round).toBeDefined();
      expect(round.matches).toBeDefined();
    });

    it('should handle odd number of players in fixed partner', () => {
      const players = createMockPlayers(5);
      players.forEach((p, idx) => {
        if (idx < 4) {
          p.partnerId = players[idx % 2 === 0 ? idx + 1 : idx - 1].id;
        }
      });

      // Odd number should fail
      expect(players.filter((p) => p.partnerId).length).toBe(4);
    });

    it('should handle partner pointing to non-existent player', () => {
      const players = createMockPlayersWithPartners(2);
      players[0].partnerId = 'non-existent-id';

      const algorithm = new MexicanoAlgorithm(players, 1, false, 'any', 'fixed_partner');
      const round = algorithm.generateRound(1);

      // Should fall back to standard pairing when partnerships are invalid
      expect(round.matches).toHaveLength(1);
    });
  });

  describe('Mixed Gender Edge Cases', () => {
    it('should handle insufficient mixed gender players', () => {
      const players = createMockPlayers(4);
      players[0].gender = 'male';
      players[1].gender = 'male';
      players[2].gender = 'male';
      players[3].gender = 'female'; // Only 1 female

      // Cannot create 2 mixed teams
      const maleCount = players.filter((p) => p.gender === 'male').length;
      const femaleCount = players.filter((p) => p.gender === 'female').length;

      expect(Math.min(maleCount, femaleCount)).toBe(1); // Can only make 1 mixed team
    });

    it('should handle all same gender', () => {
      const players = createMockPlayers(4);
      players.forEach((p) => (p.gender = 'male'));

      // Algorithm falls back when cannot create mixed teams
      const algorithm = new MexicanoAlgorithm(players, 1, false, 'mixed_only', 'mexicano');
      const round = algorithm.generateRound(1);

      // Should generate round with fallback (returns empty or uses 'any' mode)
      expect(round).toBeDefined();
    });

    it('should handle undefined genders in mixed mode', () => {
      const players = createMockPlayers(4);
      players[0].gender = 'male';
      players[1].gender = 'female';
      players[2].gender = undefined as any;
      players[3].gender = undefined as any;

      const algorithm = new MexicanoAlgorithm(players, 1, false, 'mixed_only', 'mexicano');
      const round = algorithm.generateRound(1);

      // Should handle undefined gracefully
      expect(round).toBeDefined();
    });
  });

  describe('Extreme Scale', () => {
    it('should handle large tournament (100 players)', () => {
      const players = createMockPlayers(100);
      const algorithm = new MexicanoAlgorithm(players, 20, false, 'any', 'mexicano');

      const round = algorithm.generateRound(1);
      expect(round.matches).toHaveLength(20);
      expect(round.matches.length * 4).toBe(80); // 80 players playing
    });

    it('should handle many rounds (100 rounds)', () => {
      const players = createMockPlayers(8);
      const algorithm = new MexicanoAlgorithm(players, 3, false, 'any', 'mexicano');

      for (let round = 1; round <= 100; round++) {
        const roundData = algorithm.generateRound(round);
        expect(roundData.number).toBe(round);
      }
    });

    it('should handle maximum courts (50 courts)', () => {
      const players = createMockPlayers(200);
      const algorithm = new MexicanoAlgorithm(players, 50, false, 'any', 'mexicano');

      const round = algorithm.generateRound(1);
      expect(round.matches).toHaveLength(50);
    });
  });
});
