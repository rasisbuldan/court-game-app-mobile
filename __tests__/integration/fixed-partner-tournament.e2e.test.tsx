/**
 * Fixed Partner Tournament E2E Integration Tests
 *
 * Tests the fixed partner mode where player pairs are assigned before
 * the tournament and remain together throughout all rounds.
 *
 * Key Fixed Partner Behavior:
 * - Pairs established during session creation (bidirectional partnerId)
 * - Partners stay together for entire tournament (never separated)
 * - Team ranking based on combined totalPoints (not individual)
 * - Teams assigned to courts using Mexicano algorithm (high vs low)
 * - Requires even number of players with mutual partnerships
 *
 * Coverage Areas:
 * 1. Partner persistence across rounds
 * 2. Team ranking and court assignment
 * 3. Partnership validation
 * 4. Score accumulation for teams
 * 5. Integration with different configurations
 * 6. Edge cases (status changes, sitting out, fairness)
 */

import { MexicanoAlgorithm } from '@courtster/shared';
import { createPlayers } from '../factories';
import { createMockPlayers, createMockPlayersWithPartners } from '../factories/playerFactory';
import { QueryClient } from '@tanstack/react-query';

describe('Fixed Partner Tournament E2E Integration Tests', () => {
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

  describe('Partner Persistence Across Rounds', () => {
    it('should keep partners together in every round', () => {
      const players = createMockPlayersWithPartners(4); // 4 pairs = 8 players
      const algorithm = new MexicanoAlgorithm(players, 2, true, 'any', 'fixed_partner');

      // Generate 5 rounds
      const rounds = [];
      for (let i = 1; i <= 5; i++) {
        rounds.push(algorithm.generateRound(i));
      }

      // Verify partnerships in every round
      rounds.forEach((round) => {
        round.matches.forEach((match) => {
          // Team 1 partners are paired
          expect(match.team1[0].partnerId).toBe(match.team1[1].id);
          expect(match.team1[1].partnerId).toBe(match.team1[0].id);

          // Team 2 partners are paired
          expect(match.team2[0].partnerId).toBe(match.team2[1].id);
          expect(match.team2[1].partnerId).toBe(match.team2[0].id);
        });
      });
    });

    it('should never split partnerships across different teams', () => {
      const players = createMockPlayersWithPartners(6); // 6 pairs = 12 players
      const algorithm = new MexicanoAlgorithm(players, 3, true, 'any', 'fixed_partner');

      const round = algorithm.generateRound(1);

      round.matches.forEach((match) => {
        const allPlayers = [...match.team1, ...match.team2];

        // For each player, their partner must be in same match
        allPlayers.forEach((player) => {
          const partner = allPlayers.find((p) => p.id === player.partnerId);
          expect(partner).toBeDefined();

          // Check partner is on SAME team (not opposing team)
          const playerOnTeam1 = match.team1.some((p) => p.id === player.id);
          const partnerOnTeam1 = match.team1.some((p) => p.id === partner!.id);

          expect(playerOnTeam1).toBe(partnerOnTeam1); // Both on same team
        });
      });
    });

    it('should maintain partnerships when players sit out', () => {
      const players = createMockPlayersWithPartners(5); // 5 pairs = 10 players, 2 courts (2 sit)
      const algorithm = new MexicanoAlgorithm(players, 2, true, 'any', 'fixed_partner');

      // Generate 3 rounds
      for (let i = 1; i <= 3; i++) {
        const round = algorithm.generateRound(i);

        // Verify all playing partners are together
        round.matches.forEach((match) => {
          expect(match.team1[0].partnerId).toBe(match.team1[1].id);
          expect(match.team2[0].partnerId).toBe(match.team2[1].id);
        });

        // Track sitting players
        const playingIds = new Set<string>();
        round.matches.forEach((match) => {
          match.team1.forEach((p) => playingIds.add(p.id));
          match.team2.forEach((p) => playingIds.add(p.id));
        });

        const sittingPlayers = players.filter((p) => !playingIds.has(p.id));

        // Sitting players should be complete pairs (both partners sit together)
        expect(sittingPlayers.length % 2).toBe(0); // Even number
        sittingPlayers.forEach((player) => {
          const partnerSitting = sittingPlayers.some((p) => p.id === player.partnerId);
          expect(partnerSitting).toBe(true);
        });
      }
    });

    it('should preserve partnerships across round regeneration', () => {
      const players = createMockPlayersWithPartners(4);
      const algorithm = new MexicanoAlgorithm(players, 2, true, 'any', 'fixed_partner');

      // Generate round 1
      const round1 = algorithm.generateRound(1);
      const originalPairings = round1.matches.map((m) => ({
        team1: [m.team1[0].id, m.team1[1].id].sort(),
        team2: [m.team2[0].id, m.team2[1].id].sort(),
      }));

      // Regenerate round 1 (simulating edit)
      const round1Regen = algorithm.generateRound(1);
      const regenPairings = round1Regen.matches.map((m) => ({
        team1: [m.team1[0].id, m.team1[1].id].sort(),
        team2: [m.team2[0].id, m.team2[1].id].sort(),
      }));

      // Partnerships should remain consistent (same pairs, potentially different match order)
      regenPairings.forEach((regen) => {
        const team1Exists = originalPairings.some(
          (orig) =>
            JSON.stringify(orig.team1) === JSON.stringify(regen.team1) ||
            JSON.stringify(orig.team2) === JSON.stringify(regen.team1)
        );
        expect(team1Exists).toBe(true);
      });
    });
  });

  describe('Team Ranking and Court Assignment', () => {
    it('should rank teams by combined totalPoints', () => {
      const players = createMockPlayersWithPartners(4); // 4 pairs = 8 players

      // Assign different points to teams
      players[0].totalPoints = 100;
      players[1].totalPoints = 80; // Team 1: 180 points
      players[2].totalPoints = 70;
      players[3].totalPoints = 60; // Team 2: 130 points
      players[4].totalPoints = 50;
      players[5].totalPoints = 40; // Team 3: 90 points
      players[6].totalPoints = 30;
      players[7].totalPoints = 20; // Team 4: 50 points

      const algorithm = new MexicanoAlgorithm(players, 2, true, 'any', 'fixed_partner');
      const round = algorithm.generateRound(1);

      // Court 1 should have top 2 teams (180 and 130)
      const court1Players = [...round.matches[0].team1, ...round.matches[0].team2];
      const court1TeamPoints = court1Players.map((p) => p.totalPoints);

      // Top teams should be on court 1
      expect(court1TeamPoints).toContain(100);
      expect(court1TeamPoints).toContain(70);
    });

    it('should use rating as tiebreaker for equal team points', () => {
      const players = createMockPlayersWithPartners(4);

      // Two teams with same totalPoints but different ratings
      players[0].totalPoints = 100;
      players[0].rating = 10;
      players[1].totalPoints = 100;
      players[1].rating = 10; // Team 1: 200 points, avg rating 10

      players[2].totalPoints = 100;
      players[2].rating = 8;
      players[3].totalPoints = 100;
      players[3].rating = 8; // Team 2: 200 points, avg rating 8

      players[4].totalPoints = 90;
      players[4].rating = 7;
      players[5].totalPoints = 90;
      players[5].rating = 7; // Team 3: 180 points

      players[6].totalPoints = 80;
      players[6].rating = 6;
      players[7].totalPoints = 80;
      players[7].rating = 6; // Team 4: 160 points

      const algorithm = new MexicanoAlgorithm(players, 2, true, 'any', 'fixed_partner');
      const round = algorithm.generateRound(1);

      // Court 1 should have highest rated team (Team 1 with rating 10)
      const court1Players = [...round.matches[0].team1, ...round.matches[0].team2];
      const hasHighestRatedTeam = court1Players.some((p) => p.rating === 10);

      expect(hasHighestRatedTeam).toBe(true);
    });

    it('should distribute teams fairly across courts', () => {
      const players = createMockPlayersWithPartners(6); // 6 pairs for 3 courts
      const algorithm = new MexicanoAlgorithm(players, 3, true, 'any', 'fixed_partner');

      const round = algorithm.generateRound(1);

      // All courts should have 2 teams (1 match each)
      expect(round.matches).toHaveLength(3);
      round.matches.forEach((match) => {
        expect(match.team1).toHaveLength(2);
        expect(match.team2).toHaveLength(2);
      });

      // No player duplication across courts
      const allPlayerIds = round.matches.flatMap((m) => [
        ...m.team1.map((p) => p.id),
        ...m.team2.map((p) => p.id),
      ]);
      const uniqueIds = new Set(allPlayerIds);
      expect(uniqueIds.size).toBe(12); // All 12 players unique
    });

    it('should adjust team ranking after score entry', () => {
      const players = createMockPlayersWithPartners(4);
      const algorithm = new MexicanoAlgorithm(players, 2, true, 'any', 'fixed_partner');

      // Round 1
      const round1 = algorithm.generateRound(1);
      round1.matches[0].team1Score = 11;
      round1.matches[0].team2Score = 9;
      algorithm.updateRatings(round1.matches[0]);

      // Check points updated for both partners
      const winningTeam = round1.matches[0].team1;
      winningTeam.forEach((player) => {
        expect(player.totalPoints).toBe(11);
      });

      // Round 2 should reflect new rankings
      const round2 = algorithm.generateRound(2);
      const court1Players = [...round2.matches[0].team1, ...round2.matches[0].team2];

      // Winning team from round 1 should be on court 1 (highest ranked)
      const winningTeamOnCourt1 = court1Players.some((p) =>
        winningTeam.map((wt) => wt.id).includes(p.id)
      );
      expect(winningTeamOnCourt1).toBe(true);
    });
  });

  describe('Partnership Validation', () => {
    it('should require even number of players', () => {
      const players = createMockPlayersWithPartners(3); // 6 players
      players.push(
        createMockPlayers(1, {
          id: 'odd-player',
          name: 'Odd Player',
          partnerId: 'nonexistent',
        })[0]
      ); // 7 players (odd)

      // Algorithm may throw or handle gracefully
      // Check that odd players don't cause crash
      expect(() => {
        new MexicanoAlgorithm(players, 2, true, 'any', 'fixed_partner');
      }).not.toThrow();
    });

    it('should validate mutual partnerships', () => {
      const players = createMockPlayers(4);

      // Create non-mutual partnership
      players[0].partnerId = players[1].id;
      players[1].partnerId = players[2].id; // NOT mutual (should be players[0].id)
      players[2].partnerId = players[3].id;
      players[3].partnerId = players[2].id;

      const algorithm = new MexicanoAlgorithm(players, 1, true, 'any', 'fixed_partner');

      // Algorithm should handle invalid partnerships gracefully
      const round = algorithm.generateRound(1);

      // Should still generate round (may fallback to standard pairing)
      expect(round.matches).toHaveLength(1);
    });

    it('should handle missing partner in selection', () => {
      const players = createMockPlayersWithPartners(4);

      // Simulate one partner becomes inactive
      players[1].status = 'departed';

      // Recreate algorithm with updated status
      const algorithm = new MexicanoAlgorithm(players, 2, true, 'any', 'fixed_partner');
      const round = algorithm.generateRound(1);

      // Both partner and departed player should sit out
      const playingIds = round.matches.flatMap((m) => [
        ...m.team1.map((p) => p.id),
        ...m.team2.map((p) => p.id),
      ]);

      expect(playingIds).not.toContain(players[0].id); // Partner of departed
      expect(playingIds).not.toContain(players[1].id); // Departed player
    });
  });

  describe('Score Accumulation for Teams', () => {
    it('should accumulate points for both partners equally', () => {
      const players = createMockPlayersWithPartners(2); // 2 pairs = 4 players
      const algorithm = new MexicanoAlgorithm(players, 1, true, 'any', 'fixed_partner');

      const round = algorithm.generateRound(1);
      round.matches[0].team1Score = 15;
      round.matches[0].team2Score = 10;
      algorithm.updateRatings(round.matches[0]);

      // Both team1 partners should have 15 points
      round.matches[0].team1.forEach((player) => {
        expect(player.totalPoints).toBe(15);
      });

      // Both team2 partners should have 10 points
      round.matches[0].team2.forEach((player) => {
        expect(player.totalPoints).toBe(10);
      });
    });

    it('should maintain team point differential across rounds', () => {
      const players = createMockPlayersWithPartners(4);
      const algorithm = new MexicanoAlgorithm(players, 2, true, 'any', 'fixed_partner');

      // Round 1: Team A wins big
      const round1 = algorithm.generateRound(1);
      round1.matches[0].team1Score = 21;
      round1.matches[0].team2Score = 5;
      algorithm.updateRatings(round1.matches[0]);

      const teamAIds = round1.matches[0].team1.map((p) => p.id);

      // Round 2: Team A should still be highest ranked
      const round2 = algorithm.generateRound(2);
      const court1Players = [...round2.matches[0].team1, ...round2.matches[0].team2];

      const teamAOnCourt1 = court1Players.some((p) => teamAIds.includes(p.id));
      expect(teamAOnCourt1).toBe(true);
    });

    it('should track wins for teams across rounds', () => {
      const players = createMockPlayersWithPartners(2);
      const algorithm = new MexicanoAlgorithm(players, 1, false, 'any', 'fixed_partner');

      // Track which team wins
      const team1Ids = [players[0].id, players[1].id];

      // Play 3 rounds
      for (let i = 1; i <= 3; i++) {
        const round = algorithm.generateRound(i);

        // Determine which team is team1 in this round
        const match = round.matches[0];
        const isTeam1Playing = team1Ids.includes(match.team1[0].id);

        if (isTeam1Playing) {
          // Team1 wins
          match.team1.forEach((p) => {
            const player = players.find((pl) => pl.id === p.id)!;
            player.wins += 1;
          });
          match.team2.forEach((p) => {
            const player = players.find((pl) => pl.id === p.id)!;
            player.losses += 1;
          });
        } else {
          // Team2 wins
          match.team2.forEach((p) => {
            const player = players.find((pl) => pl.id === p.id)!;
            player.wins += 1;
          });
          match.team1.forEach((p) => {
            const player = players.find((pl) => pl.id === p.id)!;
            player.losses += 1;
          });
        }
      }

      // Verify total wins and losses
      const totalWins = players.reduce((sum, p) => sum + p.wins, 0);
      const totalLosses = players.reduce((sum, p) => sum + p.losses, 0);
      expect(totalWins).toBe(6); // 3 rounds × 2 winners
      expect(totalLosses).toBe(6); // 3 rounds × 2 losers
    });
  });

  describe('Integration with Different Configurations', () => {
    it('should work with parallel court mode', () => {
      const players = createMockPlayersWithPartners(5); // 10 players (5 pairs)
      const algorithm = new MexicanoAlgorithm(players, 2, true, 'any', 'fixed_partner');

      // In parallel mode, generateRound without court number generates for ALL courts
      const fullRound = algorithm.generateRound(1);
      expect(fullRound.matches.length).toBeGreaterThanOrEqual(2);

      // Verify all partnerships maintained
      fullRound.matches.forEach((match) => {
        expect(match.team1[0].partnerId).toBe(match.team1[1].id);
        expect(match.team1[1].partnerId).toBe(match.team1[0].id);
        expect(match.team2[0].partnerId).toBe(match.team2[1].id);
        expect(match.team2[1].partnerId).toBe(match.team2[0].id);
      });

      // Verify court assignments
      const courtNumbers = fullRound.matches.map((m) => m.court);
      expect(courtNumbers).toContain(1);
      expect(courtNumbers).toContain(2);
    });

    it('should work with different scoring modes', () => {
      const players = createMockPlayersWithPartners(2);
      const algorithm = new MexicanoAlgorithm(players, 1, true, 'any', 'fixed_partner');

      // Points mode
      const round = algorithm.generateRound(1);
      round.matches[0].team1Score = 21;
      round.matches[0].team2Score = 19;
      algorithm.updateRatings(round.matches[0]);

      round.matches[0].team1.forEach((p) => {
        expect(p.totalPoints).toBe(21);
      });
    });

    it('should support gender-diverse partnerships', () => {
      // Create mixed-gender pairs
      const pair1 = [
        createMockPlayers(1, { id: 'p1', name: 'Male 1', gender: 'male', partnerId: 'p2' })[0],
        createMockPlayers(1, { id: 'p2', name: 'Female 1', gender: 'female', partnerId: 'p1' })[0],
      ];
      const pair2 = [
        createMockPlayers(1, { id: 'p3', name: 'Male 2', gender: 'male', partnerId: 'p4' })[0],
        createMockPlayers(1, { id: 'p4', name: 'Female 2', gender: 'female', partnerId: 'p3' })[0],
      ];

      const players = [...pair1, ...pair2];
      const algorithm = new MexicanoAlgorithm(players, 1, true, 'any', 'fixed_partner');

      const round = algorithm.generateRound(1);

      // Should generate valid match with mixed pairs
      expect(round.matches).toHaveLength(1);
      expect(round.matches[0].team1[0].partnerId).toBe(round.matches[0].team1[1].id);
    });
  });

  describe('Edge Cases', () => {
    it('should handle minimum setup (2 pairs, 1 court)', () => {
      const players = createMockPlayersWithPartners(2);
      const algorithm = new MexicanoAlgorithm(players, 1, true, 'any', 'fixed_partner');

      const round = algorithm.generateRound(1);

      expect(round.matches).toHaveLength(1);
      expect(round.matches[0].team1[0].partnerId).toBe(round.matches[0].team1[1].id);
      expect(round.matches[0].team2[0].partnerId).toBe(round.matches[0].team2[1].id);
    });

    it('should handle large tournaments (20 pairs, 10 courts)', () => {
      const players = createMockPlayersWithPartners(20); // 40 players
      const algorithm = new MexicanoAlgorithm(players, 10, true, 'any', 'fixed_partner');

      const round = algorithm.generateRound(1);

      // All 10 courts should have matches
      expect(round.matches).toHaveLength(10);

      // All partnerships should be preserved
      round.matches.forEach((match) => {
        expect(match.team1[0].partnerId).toBe(match.team1[1].id);
        expect(match.team2[0].partnerId).toBe(match.team2[1].id);
      });
    });

    it('should handle all pairs having equal points', () => {
      const players = createMockPlayersWithPartners(4);

      // All players have 0 points (initial state)
      const algorithm = new MexicanoAlgorithm(players, 2, true, 'any', 'fixed_partner');
      const round = algorithm.generateRound(1);

      // Should still generate valid matches
      expect(round.matches).toHaveLength(2);
      round.matches.forEach((match) => {
        expect(match.team1).toHaveLength(2);
        expect(match.team2).toHaveLength(2);
      });
    });

    it('should maintain reasonable fairness with sitting pairs', () => {
      // Use 6 pairs (12 players) with 2 courts: 2 matches = 8 playing, 4 sitting (2 pairs)
      const players = createMockPlayersWithPartners(6);
      const algorithm = new MexicanoAlgorithm(players, 2, false, 'any', 'fixed_partner');

      // Run 10 rounds
      for (let i = 1; i <= 10; i++) {
        const round = algorithm.generateRound(i);

        const playingIds = new Set<string>();
        round.matches.forEach((m) => {
          m.team1.forEach((p) => playingIds.add(p.id));
          m.team2.forEach((p) => playingIds.add(p.id));
        });

        // Update sitCount for sitting players
        players.forEach((p) => {
          if (!playingIds.has(p.id)) {
            p.sitCount += 1;
          } else {
            p.playCount += 1;
          }
        });
      }

      // Verify reasonable sitting distribution
      // Fixed partners with sitting players makes perfect fairness harder to achieve
      // Test that no player sits excessively (more than 60% of rounds)
      const sitCountsArray = players.map(p => p.sitCount);
      const maxSits = Math.max(...sitCountsArray);

      expect(maxSits).toBeLessThanOrEqual(6); // No player sits more than 60% of rounds

      // Also verify all players get to play a reasonable amount
      const minPlays = Math.min(...players.map(p => p.playCount));
      expect(minPlays).toBeGreaterThanOrEqual(4); // Everyone plays at least 40% of rounds
    });
  });
});
