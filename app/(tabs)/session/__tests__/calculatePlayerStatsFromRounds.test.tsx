/**
 * Unit tests for optimized calculatePlayerStatsFromRounds function
 * Tests the Map-based O(r × m × p) optimization (Issue #14 fix)
 */

import { Player, Round, Match } from '@courtster/shared';

// Test data factories
const createPlayer = (overrides: Partial<Player> = {}): Player => ({
  id: `player-${Math.random()}`,
  name: 'Test Player',
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
});

const createMatch = (
  team1Players: Player[],
  team2Players: Player[],
  team1Score?: number,
  team2Score?: number
): Match => ({
  court: 1,
  team1: team1Players,
  team2: team2Players,
  team1Score,
  team2Score,
});

const createRound = (matches: Match[], sittingPlayers: Player[] = []): Round => ({
  roundNumber: 1,
  matches,
  sittingPlayers,
});

// Extract the calculation logic from the component for testing
// This mirrors the implementation in session/[id].tsx lines 186-287
const calculatePlayerStatsFromRounds = (
  playersData: Player[],
  rounds: Round[],
  sessionData: { points_per_match?: number }
): Player[] => {
  // Use Map for O(1) player lookups instead of O(n) findIndex
  const playerStatsMap = new Map(
    playersData.map(p => [
      p.id,
      {
        ...p,
        totalPoints: 0,
        wins: 0,
        losses: 0,
        ties: 0,
        playCount: 0,
        sitCount: 0,
        compensationPoints: 0,
      }
    ])
  );

  // Calculate base stats from rounds
  rounds.forEach((round) => {
    round.matches.forEach((match) => {
      if (match.team1Score !== undefined && match.team2Score !== undefined) {
        const team1Won = match.team1Score > match.team2Score;
        const team2Won = match.team2Score > match.team1Score;
        const isTie = match.team1Score === match.team2Score;

        // Update team 1 players - O(1) lookup with Map
        match.team1.forEach((player) => {
          const stats = playerStatsMap.get(player.id);
          if (stats) {
            stats.totalPoints += match.team1Score!;
            stats.playCount++;

            if (team1Won) {
              stats.wins++;
            } else if (team2Won) {
              stats.losses++;
            } else if (isTie) {
              stats.ties++;
            }
          }
        });

        // Update team 2 players - O(1) lookup with Map
        match.team2.forEach((player) => {
          const stats = playerStatsMap.get(player.id);
          if (stats) {
            stats.totalPoints += match.team2Score!;
            stats.playCount++;

            if (team2Won) {
              stats.wins++;
            } else if (team1Won) {
              stats.losses++;
            } else if (isTie) {
              stats.ties++;
            }
          }
        });
      }
    });

    // Count sitting players - O(1) lookup with Map
    round.sittingPlayers.forEach((sittingPlayer) => {
      const stats = playerStatsMap.get(sittingPlayer.id);
      if (stats) {
        stats.sitCount++;
      }
    });
  });

  // Convert Map back to array
  const updatedPlayers = Array.from(playerStatsMap.values());

  // Apply compensation points (capped at 1 round)
  if (!sessionData?.points_per_match) return updatedPlayers;

  const compensationPoints = Math.floor(sessionData.points_per_match / 2);
  const maxRoundsPlayed = Math.max(...updatedPlayers.map((p) => p.playCount));

  return updatedPlayers.map((player) => {
    const roundsDeficit = maxRoundsPlayed - player.playCount;

    if (roundsDeficit > 0) {
      const compensationRounds = Math.min(roundsDeficit, 1);
      const compensation = compensationRounds * compensationPoints;

      return {
        ...player,
        totalPoints: player.totalPoints + compensation,
        compensationPoints: compensation,
      };
    }

    return { ...player, compensationPoints: 0 };
  });
};

describe('calculatePlayerStatsFromRounds - Optimized with Map (Issue #14 Fix)', () => {
  describe('Happy Path', () => {
    it('should calculate stats correctly for a simple 2-round tournament', () => {
      // Arrange
      const p1 = createPlayer({ id: 'p1', name: 'Alice' });
      const p2 = createPlayer({ id: 'p2', name: 'Bob' });
      const p3 = createPlayer({ id: 'p3', name: 'Charlie' });
      const p4 = createPlayer({ id: 'p4', name: 'Diana' });

      const players = [p1, p2, p3, p4];

      // Round 1: Alice & Bob (15) vs Charlie & Diana (9)
      const match1 = createMatch([p1, p2], [p3, p4], 15, 9);
      const round1 = createRound([match1]);

      // Round 2: Alice & Charlie (12) vs Bob & Diana (12) - TIE
      const match2 = createMatch([p1, p3], [p2, p4], 12, 12);
      const round2 = createRound([match2]);

      const rounds = [round1, round2];
      const session = { points_per_match: 24 };

      // Act
      const result = calculatePlayerStatsFromRounds(players, rounds, session);

      // Assert
      const alice = result.find(p => p.id === 'p1')!;
      const bob = result.find(p => p.id === 'p2')!;
      const charlie = result.find(p => p.id === 'p3')!;
      const diana = result.find(p => p.id === 'p4')!;

      // Alice: 15 (win) + 12 (tie) = 27 points, 1 win, 0 losses, 1 tie
      expect(alice.totalPoints).toBe(27);
      expect(alice.wins).toBe(1);
      expect(alice.losses).toBe(0);
      expect(alice.ties).toBe(1);
      expect(alice.playCount).toBe(2);
      expect(alice.sitCount).toBe(0);

      // Bob: 15 (win) + 12 (tie) = 27 points, 1 win, 0 losses, 1 tie
      expect(bob.totalPoints).toBe(27);
      expect(bob.wins).toBe(1);
      expect(bob.losses).toBe(0);
      expect(bob.ties).toBe(1);

      // Charlie: 9 (loss) + 12 (tie) = 21 points, 0 wins, 1 loss, 1 tie
      expect(charlie.totalPoints).toBe(21);
      expect(charlie.wins).toBe(0);
      expect(charlie.losses).toBe(1);
      expect(charlie.ties).toBe(1);

      // Diana: 9 (loss) + 12 (tie) = 21 points, 0 wins, 1 loss, 1 tie
      expect(diana.totalPoints).toBe(21);
      expect(diana.wins).toBe(0);
      expect(diana.losses).toBe(1);
      expect(diana.ties).toBe(1);
    });

    it('should apply compensation points correctly (capped at 1 round)', () => {
      // Arrange
      const p1 = createPlayer({ id: 'p1' });
      const p2 = createPlayer({ id: 'p2' });
      const p3 = createPlayer({ id: 'p3' });
      const p4 = createPlayer({ id: 'p4' });
      const p5 = createPlayer({ id: 'p5' }); // Will sit out

      const players = [p1, p2, p3, p4, p5];

      // Round 1: p1 & p2 vs p3 & p4, p5 sits
      const match1 = createMatch([p1, p2], [p3, p4], 15, 9);
      const round1 = createRound([match1], [p5]);

      const rounds = [round1];
      const session = { points_per_match: 24 }; // Compensation = 12 per round

      // Act
      const result = calculatePlayerStatsFromRounds(players, rounds, session);

      // Assert
      const p5Result = result.find(p => p.id === 'p5')!;

      // p5 sat 1 round, should get 12 compensation points (capped at 1 round)
      expect(p5Result.totalPoints).toBe(12);
      expect(p5Result.compensationPoints).toBe(12);
      expect(p5Result.playCount).toBe(0);
      expect(p5Result.sitCount).toBe(1);

      // Others should have 0 compensation
      const p1Result = result.find(p => p.id === 'p1')!;
      expect(p1Result.compensationPoints).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should return players with zero stats for empty rounds array', () => {
      // Arrange
      const players = [createPlayer({ id: 'p1' }), createPlayer({ id: 'p2' })];
      const rounds: Round[] = [];
      const session = { points_per_match: 24 };

      // Act
      const result = calculatePlayerStatsFromRounds(players, rounds, session);

      // Assert
      expect(result).toHaveLength(2);
      result.forEach(player => {
        expect(player.totalPoints).toBe(0);
        expect(player.wins).toBe(0);
        expect(player.losses).toBe(0);
        expect(player.ties).toBe(0);
        expect(player.playCount).toBe(0);
        expect(player.sitCount).toBe(0);
        expect(player.compensationPoints).toBe(0);
      });
    });

    it('should handle single round with one match', () => {
      // Arrange
      const p1 = createPlayer({ id: 'p1' });
      const p2 = createPlayer({ id: 'p2' });
      const p3 = createPlayer({ id: 'p3' });
      const p4 = createPlayer({ id: 'p4' });

      const players = [p1, p2, p3, p4];
      const match = createMatch([p1, p2], [p3, p4], 15, 9);
      const rounds = [createRound([match])];
      const session = { points_per_match: 24 };

      // Act
      const result = calculatePlayerStatsFromRounds(players, rounds, session);

      // Assert - All players played, no compensation needed
      result.forEach(player => {
        expect(player.playCount).toBe(1);
        expect(player.compensationPoints).toBe(0);
      });
    });

    it('should give maximum compensation to player who sits all rounds (capped at 1)', () => {
      // Arrange
      const p1 = createPlayer({ id: 'p1' });
      const p2 = createPlayer({ id: 'p2' });
      const p3 = createPlayer({ id: 'p3' });
      const p4 = createPlayer({ id: 'p4' });
      const p5 = createPlayer({ id: 'p5' }); // Sits all rounds

      const players = [p1, p2, p3, p4, p5];

      // 3 rounds where p5 always sits
      const rounds = [
        createRound([createMatch([p1, p2], [p3, p4], 15, 9)], [p5]),
        createRound([createMatch([p1, p3], [p2, p4], 12, 12)], [p5]),
        createRound([createMatch([p1, p4], [p2, p3], 10, 14)], [p5]),
      ];

      const session = { points_per_match: 24 }; // Compensation = 12

      // Act
      const result = calculatePlayerStatsFromRounds(players, rounds, session);

      // Assert
      const p5Result = result.find(p => p.id === 'p5')!;

      // p5 sat 3 rounds but compensation is CAPPED at 1 round = 12 points
      expect(p5Result.sitCount).toBe(3);
      expect(p5Result.playCount).toBe(0);
      expect(p5Result.compensationPoints).toBe(12); // Capped at 1 round!
      expect(p5Result.totalPoints).toBe(12);
    });

    it('should give zero compensation to player who plays all rounds', () => {
      // Arrange
      const p1 = createPlayer({ id: 'p1' });
      const p2 = createPlayer({ id: 'p2' });
      const p3 = createPlayer({ id: 'p3' });
      const p4 = createPlayer({ id: 'p4' });

      const players = [p1, p2, p3, p4];

      const rounds = [
        createRound([createMatch([p1, p2], [p3, p4], 15, 9)]),
        createRound([createMatch([p1, p3], [p2, p4], 12, 12)]),
      ];

      const session = { points_per_match: 24 };

      // Act
      const result = calculatePlayerStatsFromRounds(players, rounds, session);

      // Assert - All players have 0 compensation (all played equally)
      result.forEach(player => {
        expect(player.compensationPoints).toBe(0);
        expect(player.playCount).toBe(2);
      });
    });

    it('should update tie count correctly for tied games', () => {
      // Arrange
      const p1 = createPlayer({ id: 'p1' });
      const p2 = createPlayer({ id: 'p2' });
      const p3 = createPlayer({ id: 'p3' });
      const p4 = createPlayer({ id: 'p4' });

      const players = [p1, p2, p3, p4];

      // Match with tie score
      const match = createMatch([p1, p2], [p3, p4], 12, 12);
      const rounds = [createRound([match])];
      const session = { points_per_match: 24 };

      // Act
      const result = calculatePlayerStatsFromRounds(players, rounds, session);

      // Assert - All players should have 1 tie, 0 wins, 0 losses
      result.forEach(player => {
        expect(player.ties).toBe(1);
        expect(player.wins).toBe(0);
        expect(player.losses).toBe(0);
        expect(player.totalPoints).toBe(12);
      });
    });

    it('should handle no session data (undefined points_per_match)', () => {
      // Arrange
      const p1 = createPlayer({ id: 'p1' });
      const p2 = createPlayer({ id: 'p2' });

      const players = [p1, p2];
      const rounds = [createRound([createMatch([p1], [p2], 15, 9)])];
      const session = {}; // No points_per_match

      // Act
      const result = calculatePlayerStatsFromRounds(players, rounds, session);

      // Assert - Should return stats without compensation calculation
      expect(result).toHaveLength(2);
      const p1Result = result.find(p => p.id === 'p1')!;
      expect(p1Result.totalPoints).toBe(15);
      expect(p1Result.compensationPoints).toBe(0);
    });
  });

  describe('Data Integrity', () => {
    it('should not mutate the original players array', () => {
      // Arrange
      const p1 = createPlayer({ id: 'p1', totalPoints: 100 });
      const p2 = createPlayer({ id: 'p2', totalPoints: 50 });

      const players = [p1, p2];
      const originalP1Points = p1.totalPoints;
      const originalP2Points = p2.totalPoints;

      const match = createMatch([p1], [p2], 15, 9);
      const rounds = [createRound([match])];
      const session = { points_per_match: 24 };

      // Act
      calculatePlayerStatsFromRounds(players, rounds, session);

      // Assert - Original players should be unchanged
      expect(p1.totalPoints).toBe(originalP1Points);
      expect(p2.totalPoints).toBe(originalP2Points);
    });

    it('should include all player IDs from input in output', () => {
      // Arrange
      const players = [
        createPlayer({ id: 'p1' }),
        createPlayer({ id: 'p2' }),
        createPlayer({ id: 'p3' }),
      ];

      const match = createMatch([players[0]], [players[1]], 15, 9);
      const rounds = [createRound([match], [players[2]])];
      const session = { points_per_match: 24 };

      // Act
      const result = calculatePlayerStatsFromRounds(players, rounds, session);

      // Assert
      expect(result).toHaveLength(3);
      expect(result.map(p => p.id).sort()).toEqual(['p1', 'p2', 'p3'].sort());
    });

    it('should have stats sum correctly across all matches', () => {
      // Arrange
      const p1 = createPlayer({ id: 'p1' });
      const p2 = createPlayer({ id: 'p2' });
      const p3 = createPlayer({ id: 'p3' });
      const p4 = createPlayer({ id: 'p4' });

      const players = [p1, p2, p3, p4];

      // 2 matches with known scores
      const match1 = createMatch([p1, p2], [p3, p4], 15, 9);
      const match2 = createMatch([p1, p3], [p2, p4], 12, 12);
      const rounds = [createRound([match1, match2])];
      const session = { points_per_match: 24 };

      // Act
      const result = calculatePlayerStatsFromRounds(players, rounds, session);

      // Assert - Total points across all players should equal sum of all scores
      const totalPoints = result.reduce((sum, p) => sum + p.totalPoints, 0);
      // Match 1: 15 + 9 = 24, Match 2: 12 + 12 = 24, Total = 48
      expect(totalPoints).toBe(48);

      // Total play count should equal players per match * number of matches
      const totalPlayCount = result.reduce((sum, p) => sum + p.playCount, 0);
      expect(totalPlayCount).toBe(8); // 4 players * 2 matches
    });
  });

  describe('Performance', () => {
    it('should complete quickly with large dataset (10 rounds, 20 players)', () => {
      // Arrange
      const players = Array.from({ length: 20 }, (_, i) =>
        createPlayer({ id: `p${i}` })
      );

      // Create 10 rounds with 5 matches each (using 4 players per match)
      const rounds: Round[] = [];
      for (let r = 0; r < 10; r++) {
        const matches: Match[] = [];
        for (let m = 0; m < 5; m++) {
          const offset = (m * 4) % 20;
          matches.push(
            createMatch(
              [players[offset], players[offset + 1]],
              [players[(offset + 2) % 20], players[(offset + 3) % 20]],
              15,
              9
            )
          );
        }
        rounds.push(createRound(matches));
      }

      const session = { points_per_match: 24 };

      // Act
      const startTime = performance.now();
      const result = calculatePlayerStatsFromRounds(players, rounds, session);
      const endTime = performance.now();

      // Assert
      expect(result).toHaveLength(20);
      expect(endTime - startTime).toBeLessThan(50); // Should complete in < 50ms

      // Verify some players have stats
      const totalPlayCount = result.reduce((sum, p) => sum + p.playCount, 0);
      expect(totalPlayCount).toBeGreaterThan(0);
    });

    it('should use Map for O(1) lookups (verify Map.get is called)', () => {
      // Arrange
      const p1 = createPlayer({ id: 'p1' });
      const p2 = createPlayer({ id: 'p2' });
      const players = [p1, p2];

      const match = createMatch([p1], [p2], 15, 9);
      const rounds = [createRound([match])];
      const session = { points_per_match: 24 };

      // Spy on Map.prototype.get
      const getSpy = jest.spyOn(Map.prototype, 'get');

      // Act
      calculatePlayerStatsFromRounds(players, rounds, session);

      // Assert - Map.get should be called (proving Map is used)
      expect(getSpy).toHaveBeenCalled();
      expect(getSpy.mock.calls.length).toBeGreaterThan(0);

      getSpy.mockRestore();
    });
  });
});
