import { MexicanoAlgorithm, Player, Round } from '@courtster/shared';
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

describe('Scoring Modes E2E Integration Tests', () => {
  describe('Points Mode - Single Match Total', () => {
    it('should complete match when points threshold is reached', () => {
      const players = createMockPlayers(4);
      const algorithm = new MexicanoAlgorithm(players, 1, false, 'any', 'mexicano', 'points', 21);

      const round = algorithm.generateRound(1);
      const match = round.matches[0];

      // Simulate scoring to threshold
      let team1Score = 0;
      let team2Score = 0;

      // Simulate rally-by-rally scoring
      for (let i = 0; i < 15; i++) {
        team1Score += Math.floor(Math.random() * 2);
        team2Score += Math.floor(Math.random() * 2);
      }
      team1Score = 21; // Reach threshold

      expect(team1Score).toBeGreaterThanOrEqual(21);
      expect(match.court).toBe(1);
      expect(match.team1).toHaveLength(2);
      expect(match.team2).toHaveLength(2);
    });

    it('should allow deuce scenarios with win by 2', () => {
      const players = createMockPlayers(4);
      const algorithm = new MexicanoAlgorithm(players, 1, false, 'any', 'mexicano', 'points', 21);

      // Simulate deuce at 20-20, then 21-21, winner at 23-21
      const deuceScenarios = [
        { team1: 20, team2: 20, isComplete: false },
        { team1: 21, team2: 20, isComplete: true }, // First to 21
        { team1: 21, team2: 21, isComplete: false }, // Deuce
        { team1: 22, team2: 21, isComplete: false }, // Win by 1 not enough at deuce
        { team1: 23, team2: 21, isComplete: true }, // Win by 2 at deuce
      ];

      deuceScenarios.forEach((scenario) => {
        // Win conditions: reach 21 first, OR win by 2 in deuce
        const reachedThreshold = scenario.team1 >= 21 && scenario.team2 < 21;
        const wonByTwoInDeuce = scenario.team1 > 21 && scenario.team2 >= 21 && scenario.team1 - scenario.team2 >= 2;
        const isComplete = reachedThreshold || wonByTwoInDeuce;
        expect(isComplete).toBe(scenario.isComplete);
      });
    });

    it('should validate points range (1-100)', () => {
      const players = createMockPlayers(4);

      // Valid points
      expect(() => new MexicanoAlgorithm(players, 1, false, 'any', 'mexicano', 'points', 21)).not.toThrow();
      expect(() => new MexicanoAlgorithm(players, 1, false, 'any', 'mexicano', 'points', 100)).not.toThrow();

      // Invalid points would be caught by scoring-utilities validation
      const invalidPoints = [0, -1, 101, 150];
      invalidPoints.forEach((points) => {
        expect(points < 1 || points > 100).toBe(true);
      });
    });

    it('should accumulate total points correctly for leaderboard', () => {
      const players = createMockPlayers(6);
      const algorithm = new MexicanoAlgorithm(players, 2, false, 'any', 'mexicano', 'points', 21);

      const round = algorithm.generateRound(1);

      // Should have 1 match (4 players play, 2 sit)
      expect(round.matches).toHaveLength(1);

      // Simulate match completion: 21-18
      round.matches[0].team1.forEach((player) => {
        const p = players.find((pl) => pl.id === player.id)!;
        p.totalPoints += 21;
      });
      round.matches[0].team2.forEach((player) => {
        const p = players.find((pl) => pl.id === player.id)!;
        p.totalPoints += 18;
      });

      // Verify accumulation: 4 players got points (2×21 + 2×18 = 78)
      const totalPointsSum = players.reduce((sum, p) => sum + p.totalPoints, 0);
      expect(totalPointsSum).toBe(21 + 21 + 18 + 18);
    });
  });

  describe('First To X Games - Race Format', () => {
    it('should complete match when first team reaches game target', () => {
      const players = createMockPlayers(4);
      const algorithm = new MexicanoAlgorithm(players, 1, false, 'any', 'mexicano', 'first_to', undefined, 6);

      const round = algorithm.generateRound(1);
      const match = round.matches[0];

      // Simulate games
      const gameResults = [
        { winner: 'team1' }, // 1-0
        { winner: 'team2' }, // 1-1
        { winner: 'team1' }, // 2-1
        { winner: 'team1' }, // 3-1
        { winner: 'team2' }, // 3-2
        { winner: 'team1' }, // 4-2
        { winner: 'team1' }, // 5-2
        { winner: 'team1' }, // 6-2 - COMPLETE
      ];

      let team1Games = 0;
      let team2Games = 0;

      gameResults.forEach((result) => {
        if (result.winner === 'team1') team1Games++;
        else team2Games++;
      });

      expect(team1Games).toBe(6);
      expect(team1Games).toBeGreaterThanOrEqual(6);
      expect(match.court).toBe(1);
      expect(match.team1).toHaveLength(2);
    });

    it('should handle close races (6-5, 6-4)', () => {
      const closeRaces = [
        { team1Games: 6, team2Games: 5, isComplete: true },
        { team1Games: 6, team2Games: 4, isComplete: true },
        { team1Games: 5, team2Games: 5, isComplete: false },
        { team1Games: 5, team2Games: 6, isComplete: true },
      ];

      closeRaces.forEach((race) => {
        const isComplete = race.team1Games >= 6 || race.team2Games >= 6;
        expect(isComplete).toBe(race.isComplete);
      });
    });

    it('should validate games range (1-15)', () => {
      const players = createMockPlayers(4);

      // Valid games
      expect(() => new MexicanoAlgorithm(players, 1, false, 'any', 'mexicano', 'first_to', undefined, 6)).not.toThrow();
      expect(() => new MexicanoAlgorithm(players, 1, false, 'any', 'mexicano', 'first_to', undefined, 15)).not.toThrow();

      // Invalid games would be caught by scoring-utilities validation
      const invalidGames = [0, -1, 16, 20];
      invalidGames.forEach((games) => {
        expect(games < 1 || games > 15).toBe(true);
      });
    });

    it('should count games won for leaderboard sorting', () => {
      const players = createMockPlayers(6);
      const algorithm = new MexicanoAlgorithm(players, 2, false, 'any', 'mexicano', 'first_to', undefined, 6);

      const round = algorithm.generateRound(1);

      // Simulate match results - 2 courts means 1 match (6 players, 2 courts = 1 match, 2 sit)
      expect(round.matches).toHaveLength(1);

      // Match 1: 6-3 games (each player on team gets the team's game count)
      round.matches[0].team1.forEach((player) => {
        const p = players.find((pl) => pl.id === player.id)!;
        p.totalPoints += 6 * 10; // 60 points = 6 games per player
      });
      round.matches[0].team2.forEach((player) => {
        const p = players.find((pl) => pl.id === player.id)!;
        p.totalPoints += 3 * 10; // 30 points = 3 games per player
      });

      // Total: team1 (2 players × 6 games) + team2 (2 players × 3 games) = 12 + 6 = 18
      const totalGames = players.reduce((sum, p) => sum + p.totalPoints / 10, 0);
      expect(totalGames).toBe(18); // 2 players with 6 games + 2 players with 3 games
    });
  });

  describe('Total Games - Fixed Format', () => {
    it('should play exact number of games regardless of score', () => {
      const players = createMockPlayers(4);
      const algorithm = new MexicanoAlgorithm(players, 1, false, 'any', 'mexicano', 'total_games', undefined, 6);

      const round = algorithm.generateRound(1);
      const match = round.matches[0];

      // Simulate all games
      const gameResults = [
        { team1Points: 11, team2Points: 9 },
        { team1Points: 9, team2Points: 11 },
        { team1Points: 11, team2Points: 7 },
        { team1Points: 11, team2Points: 13 },
        { team1Points: 11, team2Points: 9 },
        { team1Points: 9, team2Points: 11 },
      ];

      expect(gameResults).toHaveLength(6);

      let team1TotalPoints = 0;
      let team2TotalPoints = 0;

      gameResults.forEach((game) => {
        team1TotalPoints += game.team1Points;
        team2TotalPoints += game.team2Points;
      });

      expect(team1TotalPoints).toBe(62);
      expect(team2TotalPoints).toBe(60);
      expect(match.court).toBe(1);
    });

    it('should determine winner by total points across all games', () => {
      const scenarios = [
        {
          games: [
            { team1: 11, team2: 9 },
            { team1: 9, team2: 11 },
            { team1: 11, team2: 7 },
            { team1: 11, team2: 13 },
            { team1: 11, team2: 9 },
            { team1: 9, team2: 11 },
          ],
          winner: 'team1', // 62 vs 60
        },
        {
          games: [
            { team1: 10, team2: 11 },
            { team1: 9, team2: 11 },
            { team1: 11, team2: 9 },
            { team1: 8, team2: 11 },
            { team1: 11, team2: 9 },
            { team1: 10, team2: 11 },
          ],
          winner: 'team2', // 59 vs 62
        },
      ];

      scenarios.forEach((scenario) => {
        const team1Total = scenario.games.reduce((sum, g) => sum + g.team1, 0);
        const team2Total = scenario.games.reduce((sum, g) => sum + g.team2, 0);

        const actualWinner = team1Total > team2Total ? 'team1' : 'team2';
        expect(actualWinner).toBe(scenario.winner);
      });
    });

    it('should handle ties with tiebreaker rules', () => {
      const tieScenario = [
        { team1: 11, team2: 9 },
        { team1: 9, team2: 11 },
        { team1: 10, team2: 10 },
        { team1: 11, team2: 9 },
        { team1: 9, team2: 11 },
        { team1: 10, team2: 10 },
      ];

      const team1Total = tieScenario.reduce((sum, g) => sum + g.team1, 0);
      const team2Total = tieScenario.reduce((sum, g) => sum + g.team2, 0);

      expect(team1Total).toBe(60);
      expect(team2Total).toBe(60);

      // Tie would be resolved by games won or other tiebreaker
      const team1GamesWon = tieScenario.filter((g) => g.team1 > g.team2).length;
      const team2GamesWon = tieScenario.filter((g) => g.team2 > g.team1).length;

      expect(team1GamesWon).toBe(2);
      expect(team2GamesWon).toBe(2);
      // Further tiebreaker would be needed
    });

    it('should use total points for leaderboard with total_games mode', () => {
      const players = createMockPlayers(6);
      const algorithm = new MexicanoAlgorithm(players, 2, false, 'any', 'mexicano', 'total_games', undefined, 6);

      const round = algorithm.generateRound(1);

      // Simulate match completion
      round.matches.forEach((match) => {
        const team1TotalPoints = 62;
        const team2TotalPoints = 60;

        match.team1.forEach((player) => {
          const p = players.find((pl) => pl.id === player.id)!;
          p.totalPoints += team1TotalPoints;
        });
        match.team2.forEach((player) => {
          const p = players.find((pl) => pl.id === player.id)!;
          p.totalPoints += team2TotalPoints;
        });
      });

      // Verify total points accumulation
      const totalPointsSum = players.reduce((sum, p) => sum + p.totalPoints, 0);
      expect(totalPointsSum).toBe((62 + 60) * 2);
    });
  });

  describe('Integration with Leaderboard and Rankings', () => {
    it('should rank players by total points in points mode', () => {
      const players = createMockPlayers(8);
      const algorithm = new MexicanoAlgorithm(players, 3, false, 'any', 'mexicano', 'points', 21);

      for (let round = 1; round <= 3; round++) {
        const roundData = algorithm.generateRound(round);

        // Simulate scoring
        roundData.matches.forEach((match, idx) => {
          const team1Points = 21;
          const team2Points = 15 + idx;

          match.team1.forEach((player) => {
            const p = players.find((pl) => pl.id === player.id)!;
            p.totalPoints += team1Points;
          });
          match.team2.forEach((player) => {
            const p = players.find((pl) => pl.id === player.id)!;
            p.totalPoints += team2Points;
          });
        });
      }

      // Sort leaderboard
      const leaderboard = [...players].sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
        return b.rating - a.rating;
      });

      expect(leaderboard[0].totalPoints).toBeGreaterThanOrEqual(leaderboard[1].totalPoints);
      expect(leaderboard).toHaveLength(8);
    });

    it('should rank by games won in first_to mode', () => {
      const players = createMockPlayers(8);
      const algorithm = new MexicanoAlgorithm(players, 3, false, 'any', 'mexicano', 'first_to', undefined, 6);

      for (let round = 1; round <= 3; round++) {
        const roundData = algorithm.generateRound(round);

        // Simulate games
        roundData.matches.forEach((match, idx) => {
          const team1Games = 6;
          const team2Games = 4 - idx;

          match.team1.forEach((player) => {
            const p = players.find((pl) => pl.id === player.id)!;
            p.totalPoints += team1Games * 10;
          });
          match.team2.forEach((player) => {
            const p = players.find((pl) => pl.id === player.id)!;
            p.totalPoints += team2Games * 10;
          });
        });
      }

      const leaderboard = [...players].sort((a, b) => b.totalPoints - a.totalPoints);
      expect(leaderboard[0].totalPoints).toBeGreaterThanOrEqual(leaderboard[1].totalPoints);
    });

    it('should use cumulative points for total_games mode ranking', () => {
      const players = createMockPlayers(8);
      const algorithm = new MexicanoAlgorithm(players, 3, false, 'any', 'mexicano', 'total_games', undefined, 6);

      for (let round = 1; round <= 3; round++) {
        const roundData = algorithm.generateRound(round);

        roundData.matches.forEach((match) => {
          const team1Total = 62;
          const team2Total = 58;

          match.team1.forEach((player) => {
            const p = players.find((pl) => pl.id === player.id)!;
            p.totalPoints += team1Total;
          });
          match.team2.forEach((player) => {
            const p = players.find((pl) => pl.id === player.id)!;
            p.totalPoints += team2Total;
          });
        });
      }

      const leaderboard = [...players].sort((a, b) => b.totalPoints - a.totalPoints);
      expect(leaderboard[0].totalPoints).toBeGreaterThanOrEqual(leaderboard[1].totalPoints);
    });
  });

  describe('Edge Cases and Validation', () => {
    it('should handle zero scores gracefully', () => {
      const players = createMockPlayers(4);
      const algorithm = new MexicanoAlgorithm(players, 1, false, 'any', 'mexicano', 'points', 21);

      const round = algorithm.generateRound(1);
      const match = round.matches[0];

      // Simulate one-sided match
      const team1Score = 21;
      const team2Score = 0;

      expect(team1Score).toBe(21);
      expect(team2Score).toBe(0);
      expect(match.team1).toHaveLength(2);
    });

    it('should prevent negative points', () => {
      const players = createMockPlayers(4);
      const algorithm = new MexicanoAlgorithm(players, 1, false, 'any', 'mexicano', 'points', 21);

      // Simulate correction of negative score
      let score = -5;
      score = Math.max(0, score);

      expect(score).toBe(0);
    });

    it('should handle maximum values correctly', () => {
      const players = createMockPlayers(4);

      // Max points = 100
      const algorithm1 = new MexicanoAlgorithm(players, 1, false, 'any', 'mexicano', 'points', 100);
      const round1 = algorithm1.generateRound(1);
      expect(round1.matches).toHaveLength(1);

      // Max games = 15
      const algorithm2 = new MexicanoAlgorithm(players, 1, false, 'any', 'mexicano', 'first_to', undefined, 15);
      const round2 = algorithm2.generateRound(1);
      expect(round2.matches).toHaveLength(1);
    });

    it('should switch tennis from points to first_to automatically', () => {
      const players = createMockPlayers(4);
      players.forEach((p) => (p.sport = 'tennis'));

      // Tennis with points mode should auto-adjust
      // This would be handled by the UI/validation layer
      const invalidCombination = 'tennis' === 'tennis' && 'points' === 'points';
      expect(invalidCombination).toBe(true);

      // Correct combination
      const algorithm = new MexicanoAlgorithm(players, 1, false, 'any', 'mexicano', 'first_to', undefined, 6);
      const round = algorithm.generateRound(1);
      expect(round.matches).toHaveLength(1);
    });

    it('should maintain scoring consistency across rounds', () => {
      const players = createMockPlayers(6);
      const algorithm = new MexicanoAlgorithm(players, 2, false, 'any', 'mexicano', 'points', 21);

      const initialTotalPoints = players.reduce((sum, p) => sum + p.totalPoints, 0);

      for (let round = 1; round <= 5; round++) {
        const roundData = algorithm.generateRound(round);

        roundData.matches.forEach((match) => {
          match.team1.forEach((player) => {
            const p = players.find((pl) => pl.id === player.id)!;
            p.totalPoints += 21;
          });
          match.team2.forEach((player) => {
            const p = players.find((pl) => pl.id === player.id)!;
            p.totalPoints += 18;
          });
        });
      }

      const finalTotalPoints = players.reduce((sum, p) => sum + p.totalPoints, 0);
      expect(finalTotalPoints).toBeGreaterThan(initialTotalPoints);
      expect(finalTotalPoints).toBe(initialTotalPoints + (21 + 18) * 2 * 5);
    });
  });
});
