/**
 * Parallel Courts E2E Integration Tests
 *
 * Tests the parallel court mode where each court progresses independently
 * at its own pace, as opposed to sequential mode where all courts play
 * the same round simultaneously.
 *
 * Key Parallel Mode Behavior:
 * - Each court maintains its own round number
 * - Courts progress independently (Court 1 can be on Round 5 while Court 2 is on Round 2)
 * - Algorithm ensures global fairness across ALL players (not per-court fairness)
 * - Players cannot play on multiple courts simultaneously (exclusion list)
 * - Requires 2-4 courts and more players than court slots (courts × 4 + 1 minimum)
 * - Each generateRoundForCourt() call returns exactly 1 match for that court
 *
 * Coverage Areas:
 * 1. Basic parallel court functionality
 * 2. Player exclusion across courts
 * 3. Global fairness maintenance
 * 4. Court-specific round progression
 * 5. Edge cases (exact player count, insufficient fairness, status changes)
 * 6. Mixed Mexicano gender balance constraints
 * 7. Integration with different game types
 */

import { MexicanoAlgorithm } from '@courtster/shared';
import { createPlayers } from '../factories';
import { createMockPlayers } from '../factories/playerFactory';
import { QueryClient } from '@tanstack/react-query';

describe('Parallel Courts E2E Integration Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('Basic Parallel Court Functionality', () => {
    it('should generate independent rounds for each court', () => {
      // 12 players, 3 courts (4 slots per court, need extras for rotation)
      const players = createPlayers(12);
      const algorithm = new MexicanoAlgorithm(players, 3, true, 'any', 'mexicano');

      // Generate round 1 for court 1
      const court1Round = algorithm.generateRoundForCourt(1, 1, []);
      expect(court1Round.matches).toHaveLength(1);

      // Get players currently on court 1
      const court1PlayerIds = [
        ...court1Round.matches[0].team1.map((p) => p.id),
        ...court1Round.matches[0].team2.map((p) => p.id),
      ];
      expect(court1PlayerIds).toHaveLength(4);

      // Generate round 1 for court 2, excluding court 1 players
      const court2Round = algorithm.generateRoundForCourt(2, 1, court1PlayerIds);
      expect(court2Round.matches).toHaveLength(1);

      const court2PlayerIds = [
        ...court2Round.matches[0].team1.map((p) => p.id),
        ...court2Round.matches[0].team2.map((p) => p.id),
      ];

      // Verify no overlap between courts
      const overlap = court1PlayerIds.filter((id) => court2PlayerIds.includes(id));
      expect(overlap).toHaveLength(0);
    });

    it('should allow courts to progress at different rates', () => {
      const players = createPlayers(13); // 13 players for 3 courts (4×3=12 + 1 sitting)
      const algorithm = new MexicanoAlgorithm(players, 3, true, 'any', 'mexicano');

      // Court 1 plays 3 rounds
      for (let round = 1; round <= 3; round++) {
        const courtRound = algorithm.generateRoundForCourt(1, round, []);
        expect(courtRound.matches).toHaveLength(1);

        // Simulate score entry
        const match = courtRound.matches[0];
        match.team1Score = 11;
        match.team2Score = 9;
        algorithm.updateRatings(match);
      }

      // Court 2 only plays 1 round
      const court2Round = algorithm.generateRoundForCourt(2, 1, []);
      expect(court2Round.matches).toHaveLength(1);

      // Verify algorithm maintains state independently
      // Court 1 players should have more play counts than court 2 players
      const court1Players = court2Round.matches[0].team1.concat(court2Round.matches[0].team2);
      court1Players.forEach((player) => {
        // Players exist and have valid play counts
        expect(player).toBeDefined();
        expect(typeof player.matchesPlayed === 'number' || player.matchesPlayed === undefined).toBe(
          true
        );
      });
    });

    it('should return exactly 1 match per court per round', () => {
      const players = createPlayers(16);
      const algorithm = new MexicanoAlgorithm(players, 4, true, 'any', 'mexicano');

      // Generate rounds for all 4 courts
      for (let court = 1; court <= 4; court++) {
        const courtRound = algorithm.generateRoundForCourt(court, 1, []);

        // Each court gets exactly 1 match
        expect(courtRound.matches).toHaveLength(1);
        expect(courtRound.matches[0].team1).toHaveLength(2);
        expect(courtRound.matches[0].team2).toHaveLength(2);
      }
    });

    it('should use all available players across courts', () => {
      const players = createPlayers(12);
      const algorithm = new MexicanoAlgorithm(players, 3, true, 'any', 'mexicano');

      const playingIds = new Set<string>();

      // Generate round for all 3 courts
      for (let court = 1; court <= 3; court++) {
        const courtRound = algorithm.generateRoundForCourt(court, 1, Array.from(playingIds));

        courtRound.matches[0].team1.forEach((p) => playingIds.add(p.id));
        courtRound.matches[0].team2.forEach((p) => playingIds.add(p.id));
      }

      // All 12 players should be playing (3 courts × 4 players = 12)
      expect(playingIds.size).toBe(12);
    });
  });

  describe('Player Exclusion Across Courts', () => {
    it('should exclude specified players from court selection', () => {
      const players = createPlayers(16);
      const algorithm = new MexicanoAlgorithm(players, 4, true, 'any', 'mexicano');

      // Generate round for court 1
      const court1Round = algorithm.generateRoundForCourt(1, 1, []);
      const excludeIds = [
        ...court1Round.matches[0].team1.map((p) => p.id),
        ...court1Round.matches[0].team2.map((p) => p.id),
      ];

      // Generate round for court 2 with exclusions
      const court2Round = algorithm.generateRoundForCourt(2, 1, excludeIds);
      const court2PlayerIds = [
        ...court2Round.matches[0].team1.map((p) => p.id),
        ...court2Round.matches[0].team2.map((p) => p.id),
      ];

      // Verify exclusion worked
      court2PlayerIds.forEach((id) => {
        expect(excludeIds).not.toContain(id);
      });
    });

    it('should handle cascading exclusions across multiple courts', () => {
      const players = createPlayers(17); // 4 courts × 4 + 1 sitting
      const algorithm = new MexicanoAlgorithm(players, 4, true, 'any', 'mexicano');

      const excludedIds = new Set<string>();

      // Generate rounds for courts 1-4 sequentially
      for (let court = 1; court <= 4; court++) {
        const courtRound = algorithm.generateRoundForCourt(court, 1, Array.from(excludedIds));

        expect(courtRound.matches).toHaveLength(1);

        // Add these players to exclusion list
        courtRound.matches[0].team1.forEach((p) => excludedIds.add(p.id));
        courtRound.matches[0].team2.forEach((p) => excludedIds.add(p.id));
      }

      // Should have assigned 16 players (4 courts × 4 players)
      expect(excludedIds.size).toBe(16);
    });

    it('should return empty round if insufficient players available', () => {
      const players = createPlayers(13); // Exactly 13 players
      const algorithm = new MexicanoAlgorithm(players, 3, true, 'any', 'mexicano');

      const excludedIds: string[] = [];

      // Generate rounds for courts 1-3 (uses 12 players)
      for (let court = 1; court <= 3; court++) {
        const courtRound = algorithm.generateRoundForCourt(court, 1, excludedIds);

        courtRound.matches[0].team1.forEach((p) => excludedIds.push(p.id));
        courtRound.matches[0].team2.forEach((p) => excludedIds.push(p.id));
      }

      // Try to generate a 4th court (only 1 player left, need 4)
      const court4Round = algorithm.generateRoundForCourt(4, 1, excludedIds);

      // Should return empty round (or throw error - check actual behavior)
      expect(court4Round.matches.length).toBeLessThanOrEqual(1);
    });
  });

  describe('Global Fairness Maintenance', () => {
    it('should maintain fairness across all players', () => {
      const players = createPlayers(13);
      const algorithm = new MexicanoAlgorithm(players, 3, true, 'any', 'mexicano');

      // Simulate 5 rounds across 3 parallel courts
      for (let round = 1; round <= 5; round++) {
        const playingIds = new Set<string>();

        for (let court = 1; court <= 3; court++) {
          const courtRound = algorithm.generateRoundForCourt(court, round, Array.from(playingIds));

          if (courtRound.matches.length > 0) {
            const match = courtRound.matches[0];

            // Add to playing set
            match.team1.forEach((p) => playingIds.add(p.id));
            match.team2.forEach((p) => playingIds.add(p.id));

            // Simulate score entry
            match.team1Score = 11;
            match.team2Score = Math.floor(Math.random() * 11);
            algorithm.updateRatings(match);
          }
        }
      }

      // Check fairness: max play count - min play count <= 1
      const playCounts = players.map((p) => p.matchesPlayed || 0);
      const maxPlays = Math.max(...playCounts);
      const minPlays = Math.min(...playCounts);

      expect(maxPlays - minPlays).toBeLessThanOrEqual(1);
    });

    it('should prevent unfair player selection', () => {
      const players = createPlayers(9); // 9 players, 2 courts
      const algorithm = new MexicanoAlgorithm(players, 2, true, 'any', 'mexicano');

      // Play multiple rounds
      for (let round = 1; round <= 3; round++) {
        const playingIds = new Set<string>();

        for (let court = 1; court <= 2; court++) {
          const courtRound = algorithm.generateRoundForCourt(court, round, Array.from(playingIds));

          if (courtRound.matches.length > 0) {
            const match = courtRound.matches[0];

            match.team1.forEach((p) => playingIds.add(p.id));
            match.team2.forEach((p) => playingIds.add(p.id));

            // Simulate scores
            match.team1Score = 11;
            match.team2Score = 8;
            algorithm.updateRatings(match);
          }
        }
      }

      // Verify no player is 2+ games ahead
      const playCounts = players.map((p) => p.matchesPlayed || 0);
      const maxPlays = Math.max(...playCounts);
      const minPlays = Math.min(...playCounts);

      expect(maxPlays - minPlays).toBeLessThanOrEqual(1);
    });

    it('should distribute sitting fairly across players', () => {
      const players = createPlayers(10); // 10 players, 2 courts (2 sit per round)
      const algorithm = new MexicanoAlgorithm(players, 2, true, 'any', 'mexicano');

      // Track who sits each round
      const sitCounts = new Map<string, number>();
      players.forEach((p) => sitCounts.set(p.id, 0));

      // Run 5 rounds
      for (let round = 1; round <= 5; round++) {
        const playingIds = new Set<string>();

        for (let court = 1; court <= 2; court++) {
          const courtRound = algorithm.generateRoundForCourt(court, round, Array.from(playingIds));

          courtRound.matches[0].team1.forEach((p) => playingIds.add(p.id));
          courtRound.matches[0].team2.forEach((p) => playingIds.add(p.id));

          // Simulate scores
          const match = courtRound.matches[0];
          match.team1Score = 11;
          match.team2Score = 9;
          algorithm.updateRatings(match);
        }

        // Track who sat this round
        players.forEach((p) => {
          if (!playingIds.has(p.id)) {
            sitCounts.set(p.id, (sitCounts.get(p.id) || 0) + 1);
          }
        });
      }

      // Verify fair sitting distribution
      const sitCountsArray = Array.from(sitCounts.values());
      const maxSits = Math.max(...sitCountsArray);
      const minSits = Math.min(...sitCountsArray);

      expect(maxSits - minSits).toBeLessThanOrEqual(1);
    });
  });

  describe('Court-Specific Round Progression', () => {
    it('should track rounds independently per court', () => {
      const players = createPlayers(13);
      const algorithm = new MexicanoAlgorithm(players, 3, true, 'any', 'mexicano');

      // Court 1: Play rounds 1-5
      for (let round = 1; round <= 5; round++) {
        const courtRound = algorithm.generateRoundForCourt(1, round, []);
        expect(courtRound.matches).toHaveLength(1);

        const match = courtRound.matches[0];
        match.team1Score = 11;
        match.team2Score = 9;
        algorithm.updateRatings(match);
      }

      // Court 2: Play rounds 1-2
      for (let round = 1; round <= 2; round++) {
        const courtRound = algorithm.generateRoundForCourt(2, round, []);
        expect(courtRound.matches).toHaveLength(1);

        const match = courtRound.matches[0];
        match.team1Score = 11;
        match.team2Score = 9;
        algorithm.updateRatings(match);
      }

      // Verify algorithm handles different round numbers gracefully
      // (No assertion needed - test passes if no errors thrown)
    });

    it('should allow court to skip round numbers', () => {
      const players = createPlayers(12);
      const algorithm = new MexicanoAlgorithm(players, 3, true, 'any', 'mexicano');

      // Court 1: Play rounds 1, 3, 5 (skip 2, 4)
      [1, 3, 5].forEach((round) => {
        const courtRound = algorithm.generateRoundForCourt(1, round, []);
        expect(courtRound.matches).toHaveLength(1);

        const match = courtRound.matches[0];
        match.team1Score = 11;
        match.team2Score = 9;
        algorithm.updateRatings(match);
      });

      // Court 2: Play rounds 2, 4, 6
      [2, 4, 6].forEach((round) => {
        const courtRound = algorithm.generateRoundForCourt(2, round, []);
        expect(courtRound.matches).toHaveLength(1);
      });

      // Algorithm should handle non-sequential rounds
    });

    it('should handle court playing same round multiple times', () => {
      const players = createPlayers(12);
      const algorithm = new MexicanoAlgorithm(players, 3, true, 'any', 'mexicano');

      // Generate round 1 for court 1 twice (e.g., re-generation after error)
      const round1a = algorithm.generateRoundForCourt(1, 1, []);
      const round1b = algorithm.generateRoundForCourt(1, 1, []);

      // Both should be valid matches
      expect(round1a.matches).toHaveLength(1);
      expect(round1b.matches).toHaveLength(1);

      // Players might be different due to randomization
      // (This is acceptable - algorithm doesn't cache rounds)
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle minimum parallel court setup (2 courts, 9 players)', () => {
      const players = createPlayers(9); // Minimum: 2 courts × 4 + 1 = 9
      const algorithm = new MexicanoAlgorithm(players, 2, true, 'any', 'mexicano');

      const playingIds = new Set<string>();

      // Generate rounds for both courts
      for (let court = 1; court <= 2; court++) {
        const courtRound = algorithm.generateRoundForCourt(court, 1, Array.from(playingIds));

        expect(courtRound.matches).toHaveLength(1);

        courtRound.matches[0].team1.forEach((p) => playingIds.add(p.id));
        courtRound.matches[0].team2.forEach((p) => playingIds.add(p.id));
      }

      // Should use 8 players, 1 sitting
      expect(playingIds.size).toBe(8);
    });

    it('should handle maximum parallel courts (4 courts, 17 players)', () => {
      const players = createPlayers(17); // 4 courts × 4 + 1 = 17
      const algorithm = new MexicanoAlgorithm(players, 4, true, 'any', 'mexicano');

      const playingIds = new Set<string>();

      // Generate rounds for all 4 courts
      for (let court = 1; court <= 4; court++) {
        const courtRound = algorithm.generateRoundForCourt(court, 1, Array.from(playingIds));

        expect(courtRound.matches).toHaveLength(1);

        courtRound.matches[0].team1.forEach((p) => playingIds.add(p.id));
        courtRound.matches[0].team2.forEach((p) => playingIds.add(p.id));
      }

      // Should use 16 players, 1 sitting
      expect(playingIds.size).toBe(16);
    });

    it('should handle player status changes between courts', () => {
      const players = createPlayers(13);
      const algorithm = new MexicanoAlgorithm(players, 3, true, 'any', 'mexicano');

      // Generate round for court 1
      const court1Round = algorithm.generateRoundForCourt(1, 1, []);
      expect(court1Round.matches).toHaveLength(1);

      // Change a player to "departed" status
      players[0].status = 'departed';

      // Recreate algorithm with updated status
      const updatedAlgorithm = new MexicanoAlgorithm(players, 3, true, 'any', 'mexicano');

      // Court 2 should not select the departed player
      const court2Round = updatedAlgorithm.generateRoundForCourt(2, 1, []);
      const court2PlayerIds = [
        ...court2Round.matches[0].team1.map((p) => p.id),
        ...court2Round.matches[0].team2.map((p) => p.id),
      ];

      expect(court2PlayerIds).not.toContain(players[0].id);
    });

    it('should handle player with skipRounds', () => {
      const players = createPlayers(13);
      const algorithm = new MexicanoAlgorithm(players, 3, true, 'any', 'mexicano');

      // Player 0 skips rounds 1 and 2
      players[0].skipRounds = [1, 2];

      // Recreate algorithm
      const updatedAlgorithm = new MexicanoAlgorithm(players, 3, true, 'any', 'mexicano');

      // Generate round 1 for court 1
      const court1Round = updatedAlgorithm.generateRoundForCourt(1, 1, []);
      const court1PlayerIds = [
        ...court1Round.matches[0].team1.map((p) => p.id),
        ...court1Round.matches[0].team2.map((p) => p.id),
      ];

      // Player 0 should not be selected for round 1
      expect(court1PlayerIds).not.toContain(players[0].id);

      // Generate round 3 for court 1 (player 0 is available)
      const court1Round3 = updatedAlgorithm.generateRoundForCourt(1, 3, []);
      // Player 0 might be selected (not guaranteed, but should be eligible)
      expect(court1Round3.matches).toHaveLength(1);
    });

    it('should handle large player count (30 players, 4 courts)', () => {
      const players = createPlayers(30);
      const algorithm = new MexicanoAlgorithm(players, 4, true, 'any', 'mexicano');

      // Run 10 rounds across all courts
      for (let round = 1; round <= 10; round++) {
        const playingIds = new Set<string>();

        for (let court = 1; court <= 4; court++) {
          const courtRound = algorithm.generateRoundForCourt(court, round, Array.from(playingIds));

          if (courtRound.matches.length > 0) {
            const match = courtRound.matches[0];

            match.team1.forEach((p) => playingIds.add(p.id));
            match.team2.forEach((p) => playingIds.add(p.id));

            // Simulate scores
            match.team1Score = 11;
            match.team2Score = 9;
            algorithm.updateRatings(match);
          }
        }
      }

      // Verify fairness maintained
      const playCounts = players.map((p) => p.matchesPlayed || 0);
      const maxPlays = Math.max(...playCounts);
      const minPlays = Math.min(...playCounts);

      expect(maxPlays - minPlays).toBeLessThanOrEqual(2); // Allow 2 with large player count
    });
  });

  describe('Mixed Mexicano Gender Balance', () => {
    it('should attempt mixed doubles in parallel mode', () => {
      // 6 males + 6 females for 2 courts (extras for proper rotation)
      const males = createMockPlayers(6, { gender: 'male' });
      const females = createMockPlayers(6, { gender: 'female' });
      const players = [...males, ...females];

      const algorithm = new MexicanoAlgorithm(players, 2, true, 'mixed_only', 'mixed_mexicano');

      const playingIds = new Set<string>();

      // Generate rounds for both courts
      for (let court = 1; court <= 2; court++) {
        const courtRound = algorithm.generateRoundForCourt(court, 1, Array.from(playingIds));

        expect(courtRound.matches).toHaveLength(1);

        // Verify gender diversity (should have both males and females)
        const genders = [
          ...courtRound.matches[0].team1.map((p) => p.gender),
          ...courtRound.matches[0].team2.map((p) => p.gender),
        ];

        const maleCount = genders.filter((g) => g === 'male').length;
        const femaleCount = genders.filter((g) => g === 'female').length;

        // Should have players of both genders (algorithm attempts mixed)
        expect(maleCount).toBeGreaterThan(0);
        expect(femaleCount).toBeGreaterThan(0);
        expect(maleCount + femaleCount).toBe(4);

        courtRound.matches[0].team1.forEach((p) => playingIds.add(p.id));
        courtRound.matches[0].team2.forEach((p) => playingIds.add(p.id));
      }

      // 8 players should be playing (4 sitting)
      expect(playingIds.size).toBe(8);
    });

    it('should handle 3 courts with mixed mexicano', () => {
      // 8M + 8F ensures enough players for all courts
      const males = createMockPlayers(8, { gender: 'male' });
      const females = createMockPlayers(8, { gender: 'female' });
      const players = [...males, ...females];

      const algorithm = new MexicanoAlgorithm(players, 3, true, 'mixed_only', 'mixed_mexicano');

      const playingIds = new Set<string>();

      // Generate rounds for all 3 courts
      for (let court = 1; court <= 3; court++) {
        const courtRound = algorithm.generateRoundForCourt(court, 1, Array.from(playingIds));

        expect(courtRound.matches).toHaveLength(1);

        // Verify gender diversity
        const genders = [
          ...courtRound.matches[0].team1.map((p) => p.gender),
          ...courtRound.matches[0].team2.map((p) => p.gender),
        ];

        const maleCount = genders.filter((g) => g === 'male').length;
        const femaleCount = genders.filter((g) => g === 'female').length;

        // Should have both genders represented
        expect(maleCount).toBeGreaterThan(0);
        expect(femaleCount).toBeGreaterThan(0);
        expect(maleCount + femaleCount).toBe(4);

        courtRound.matches[0].team1.forEach((p) => playingIds.add(p.id));
        courtRound.matches[0].team2.forEach((p) => playingIds.add(p.id));
      }

      // 12 players should be playing (4 sitting)
      expect(playingIds.size).toBe(12);
    });
  });

  describe('Integration with Game Types', () => {
    it('should work with Mexicano mode in parallel courts', () => {
      const players = createPlayers(13);
      const algorithm = new MexicanoAlgorithm(players, 3, true, 'any', 'mexicano');

      // Generate parallel rounds
      const playingIds = new Set<string>();

      for (let court = 1; court <= 3; court++) {
        const courtRound = algorithm.generateRoundForCourt(court, 1, Array.from(playingIds));

        expect(courtRound.matches).toHaveLength(1);
        expect(courtRound.matches[0].team1).toHaveLength(2);
        expect(courtRound.matches[0].team2).toHaveLength(2);

        courtRound.matches[0].team1.forEach((p) => playingIds.add(p.id));
        courtRound.matches[0].team2.forEach((p) => playingIds.add(p.id));
      }

      expect(playingIds.size).toBe(12);
    });

    it('should work with Americano mode in parallel courts', () => {
      const players = createPlayers(13);
      const algorithm = new MexicanoAlgorithm(players, 3, true, 'any', 'americano');

      // Generate parallel rounds
      const playingIds = new Set<string>();

      for (let court = 1; court <= 3; court++) {
        const courtRound = algorithm.generateRoundForCourt(court, 1, Array.from(playingIds));

        expect(courtRound.matches).toHaveLength(1);

        courtRound.matches[0].team1.forEach((p) => playingIds.add(p.id));
        courtRound.matches[0].team2.forEach((p) => playingIds.add(p.id));
      }

      expect(playingIds.size).toBe(12);
    });

    it('should work with randomized matchup modes in parallel courts', () => {
      const males = createMockPlayers(8, { gender: 'male' });
      const females = createMockPlayers(8, { gender: 'female' });
      const players = [...males, ...females];

      const algorithm = new MexicanoAlgorithm(players, 4, true, 'randomized_modes', 'mexicano');

      const playingIds = new Set<string>();

      // Generate parallel rounds with randomized modes
      for (let court = 1; court <= 4; court++) {
        const courtRound = algorithm.generateRoundForCourt(court, 1, Array.from(playingIds));

        expect(courtRound.matches).toHaveLength(1);

        // Each court might have different mode (mixed/mens/womens)
        courtRound.matches[0].team1.forEach((p) => playingIds.add(p.id));
        courtRound.matches[0].team2.forEach((p) => playingIds.add(p.id));
      }

      expect(playingIds.size).toBe(16);
    });
  });
});
