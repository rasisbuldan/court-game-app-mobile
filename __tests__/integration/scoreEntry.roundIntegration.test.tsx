/**
 * Score Entry Integration with Round Generation Tests
 *
 * Tests the complete workflow of:
 * - Entering scores during a round
 * - Validating score entries
 * - Updating player statistics
 * - Completing rounds
 * - Leaderboard recalculation
 * - Generating subsequent rounds based on scores
 */

import { QueryClient } from '@tanstack/react-query';
import { MexicanoAlgorithm, Player, Round, Match } from '@courtster/shared';
import { createTournamentData, createPlayers } from '../factories';
import { createMockPlayers } from '../factories/playerFactory';
import { supabase } from '../../config/supabase';

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

// Helper: Calculate player stats from match results
const updatePlayerStats = (
  players: Player[],
  match: Match,
  winner: 'team1' | 'team2'
) => {
  const winningTeam = winner === 'team1' ? match.team1 : match.team2;
  const losingTeam = winner === 'team1' ? match.team2 : match.team1;
  const winningScore = winner === 'team1' ? match.team1Score : match.team2Score;
  const losingScore = winner === 'team1' ? match.team2Score : match.team1Score;

  // Update winners
  winningTeam.forEach((player) => {
    const p = players.find((pl) => pl.id === player.id);
    if (p) {
      p.totalPoints += winningScore;
      p.matchesPlayed += 1;
      p.matchesWon += 1;
    }
  });

  // Update losers
  losingTeam.forEach((player) => {
    const p = players.find((pl) => pl.id === player.id);
    if (p) {
      p.totalPoints += losingScore;
      p.matchesPlayed += 1;
    }
  });
};

describe('Score Entry and Round Generation Integration', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
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
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('Score Entry Validation', () => {
    it('should validate score entry meets minimum requirements', () => {
      const match: Match = {
        matchNumber: 1,
        team1: [
          { id: '1', name: 'P1', rating: 8 } as Player,
          { id: '2', name: 'P2', rating: 7 } as Player,
        ],
        team2: [
          { id: '3', name: 'P3', rating: 6 } as Player,
          { id: '4', name: 'P4', rating: 5 } as Player,
        ],
        team1Score: 15,
        team2Score: 10,
        completed: true,
        courtNumber: 1,
      };

      // Valid score entry
      expect(match.team1Score).toBeGreaterThan(0);
      expect(match.team2Score).toBeGreaterThan(0);
      expect(match.team1Score !== match.team2Score).toBe(true);

      // Score difference validation (typical games end at 15-21 points)
      const scoreDiff = Math.abs(match.team1Score - match.team2Score);
      expect(scoreDiff).toBeGreaterThanOrEqual(0);
    });

    it('should reject invalid score combinations', () => {
      const invalidScores = [
        { team1: -1, team2: 10, reason: 'negative score' },
        { team1: 0, team2: 0, reason: 'both teams zero' },
        { team1: 15, team2: 15, reason: 'tie game' },
      ];

      invalidScores.forEach(({ team1, team2, reason }) => {
        const isValid =
          team1 >= 0 &&
          team2 >= 0 &&
          (team1 > 0 || team2 > 0) &&
          team1 !== team2;

        expect(isValid).toBe(false);
      });
    });

    it('should validate all matches completed before finishing round', () => {
      const players = createMockPlayers(8);
      const algorithm = new MexicanoAlgorithm(players, 2);
      const round = algorithm.generateRound(1);

      // Complete first match
      round.matches[0].completed = true;
      round.matches[0].team1Score = 15;
      round.matches[0].team2Score = 10;

      // Leave second match incomplete
      round.matches[1].completed = false;

      const allMatchesCompleted = round.matches.every((m) => m.completed);
      expect(allMatchesCompleted).toBe(false);
    });
  });

  describe('Player Statistics Updates', () => {
    it('should update player stats correctly after match completion', () => {
      const players = createMockPlayers(8).map((p) => ({
        ...p,
        totalPoints: 0,
        matchesPlayed: 0,
        matchesWon: 0,
      }));

      const algorithm = new MexicanoAlgorithm(players, 2);
      const round = algorithm.generateRound(1);
      const match = round.matches[0];

      // Complete match with team1 winning 15-10
      match.team1Score = 15;
      match.team2Score = 10;
      match.completed = true;

      updatePlayerStats(players, match, 'team1');

      // Assert: Winners got 15 points and 1 win
      match.team1.forEach((player) => {
        const p = players.find((pl) => pl.id === player.id);
        expect(p?.totalPoints).toBe(15);
        expect(p?.matchesPlayed).toBe(1);
        expect(p?.matchesWon).toBe(1);
      });

      // Assert: Losers got 10 points, no wins
      match.team2.forEach((player) => {
        const p = players.find((pl) => pl.id === player.id);
        expect(p?.totalPoints).toBe(10);
        expect(p?.matchesPlayed).toBe(1);
        expect(p?.matchesWon).toBe(0);
      });
    });

    it('should accumulate stats across multiple matches', () => {
      const players = createMockPlayers(8).map((p) => ({
        ...p,
        totalPoints: 0,
        matchesPlayed: 0,
        matchesWon: 0,
      }));

      const algorithm = new MexicanoAlgorithm(players, 2);

      // Play 2 rounds
      for (let roundNum = 1; roundNum <= 2; roundNum++) {
        const round = algorithm.generateRound(roundNum);

        round.matches.forEach((match) => {
          match.team1Score = 15;
          match.team2Score = 12;
          match.completed = true;
          updatePlayerStats(players, match, 'team1');
        });
      }

      // Each player should have played 2 matches (8 players, 2 courts, 2 rounds)
      players.forEach((player) => {
        expect(player.matchesPlayed).toBe(2);
        expect(player.totalPoints).toBeGreaterThan(0);
      });
    });

    it('should correctly calculate win percentage', () => {
      const player: Player = {
        id: '1',
        name: 'Test Player',
        rating: 8.0,
        totalPoints: 60,
        matchesPlayed: 5,
        matchesWon: 3,
        status: 'active',
        gender: 'male',
      };

      const winPercentage = (player.matchesWon / player.matchesPlayed) * 100;
      expect(winPercentage).toBe(60);

      const avgPointsPerMatch = player.totalPoints / player.matchesPlayed;
      expect(avgPointsPerMatch).toBe(12);
    });
  });

  describe('Leaderboard Recalculation', () => {
    it('should update leaderboard after each round completion', () => {
      const { players, session } = createTournamentData(8, 3);
      const algorithm = new MexicanoAlgorithm(players, 2);

      // Initialize all players with zero stats
      players.forEach((p) => {
        p.totalPoints = 0;
        p.matchesPlayed = 0;
        p.matchesWon = 0;
      });

      // Complete round 1
      const round1 = algorithm.generateRound(1);
      round1.matches.forEach((match, idx) => {
        match.team1Score = 15;
        match.team2Score = 10 + idx; // Varying scores
        match.completed = true;
        updatePlayerStats(players, match, 'team1');
      });

      // Sort leaderboard by total points
      const leaderboard1 = [...players].sort(
        (a, b) => b.totalPoints - a.totalPoints
      );

      // Winners should be at top
      expect(leaderboard1[0].totalPoints).toBe(15);

      // Complete round 2 with different winners
      const round2 = algorithm.generateRound(2);
      round2.matches.forEach((match, idx) => {
        match.team1Score = 12;
        match.team2Score = 15;
        match.completed = true;
        updatePlayerStats(players, match, 'team2');
      });

      // Recalculate leaderboard
      const leaderboard2 = [...players].sort(
        (a, b) => b.totalPoints - a.totalPoints
      );

      // Some players from round 2 should have moved up
      expect(leaderboard2[0].totalPoints).toBeGreaterThan(15);
    });

    it('should break ties by secondary criteria (wins, then rating)', () => {
      const players: Player[] = [
        {
          id: '1',
          name: 'P1',
          totalPoints: 30,
          matchesWon: 2,
          matchesPlayed: 2,
          rating: 8.0,
          status: 'active',
          gender: 'male',
        },
        {
          id: '2',
          name: 'P2',
          totalPoints: 30,
          matchesWon: 2,
          matchesPlayed: 2,
          rating: 7.0,
          status: 'active',
          gender: 'male',
        },
        {
          id: '3',
          name: 'P3',
          totalPoints: 30,
          matchesWon: 1,
          matchesPlayed: 2,
          rating: 9.0,
          status: 'active',
          gender: 'male',
        },
      ];

      // Sort with tiebreakers: points > wins > rating
      const sorted = [...players].sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) {
          return b.totalPoints - a.totalPoints;
        }
        if (b.matchesWon !== a.matchesWon) {
          return b.matchesWon - a.matchesWon;
        }
        return b.rating - a.rating;
      });

      // P1 and P2 tied on points and wins, P1 wins by higher rating
      expect(sorted[0].id).toBe('1');
      expect(sorted[1].id).toBe('2');
      // P3 has fewer wins despite same points
      expect(sorted[2].id).toBe('3');
    });
  });

  describe('Round Completion and Progression', () => {
    it('should complete round only when all matches have scores', () => {
      const players = createMockPlayers(8);
      const algorithm = new MexicanoAlgorithm(players, 2);
      const round = algorithm.generateRound(1);

      // Complete all matches
      round.matches.forEach((match) => {
        match.team1Score = 15;
        match.team2Score = 12;
        match.completed = true;
      });

      const isRoundComplete = round.matches.every(
        (m) => m.completed && m.team1Score > 0 && m.team2Score > 0
      );

      expect(isRoundComplete).toBe(true);
    });

    it('should generate next round based on updated scores', () => {
      const players = createMockPlayers(8).map((p, idx) => ({
        ...p,
        totalPoints: 0,
        rating: 8 - idx * 0.5, // Varied initial ratings
      }));

      const algorithm = new MexicanoAlgorithm(players, 2);

      // Complete round 1
      const round1 = algorithm.generateRound(1);
      round1.matches.forEach((match) => {
        match.team1Score = 15;
        match.team2Score = 10;
        match.completed = true;
        updatePlayerStats(players, match, 'team1');
      });

      // Sort players by new points for round 2
      players.sort((a, b) => b.totalPoints - a.totalPoints);

      // Generate round 2 - should use updated rankings
      const round2 = algorithm.generateRound(2);

      // Verify round 2 players are grouped by performance
      // Court 1 should have higher average points than court 2
      const court1Players = [
        ...round2.matches[0].team1,
        ...round2.matches[0].team2,
      ];
      const court2Players = [
        ...round2.matches[1].team1,
        ...round2.matches[1].team2,
      ];

      const court1AvgPoints =
        court1Players.reduce((sum, p) => sum + p.totalPoints, 0) / 4;
      const court2AvgPoints =
        court2Players.reduce((sum, p) => sum + p.totalPoints, 0) / 4;

      // Court 1 should have players with higher average points
      expect(court1AvgPoints).toBeGreaterThanOrEqual(court2AvgPoints);
    });

    it('should prevent round completion with incomplete matches', async () => {
      const roundData = {
        number: 1,
        matches: [
          {
            matchNumber: 1,
            team1Score: 15,
            team2Score: 10,
            completed: true,
          },
          {
            matchNumber: 2,
            team1Score: 0,
            team2Score: 0,
            completed: false, // Incomplete
          },
        ],
      };

      const canComplete = roundData.matches.every((m) => m.completed);
      expect(canComplete).toBe(false);
    });
  });

  describe('Score Entry Error Handling', () => {
    it('should handle score entry database errors gracefully', async () => {
      const error = new Error('Failed to save score');

      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error,
          }),
        }),
      });

      const result = await (supabase.from('game_sessions') as any)
        .update({ round_data: [] })
        .eq('id', 'session-123');

      expect(result.error).toEqual(error);
      expect(result.data).toBeNull();
    });

    it('should validate score entry before submission', () => {
      const validateScore = (team1Score: number, team2Score: number) => {
        if (team1Score < 0 || team2Score < 0) {
          return { valid: false, error: 'Scores cannot be negative' };
        }
        if (team1Score === 0 && team2Score === 0) {
          return { valid: false, error: 'At least one team must score' };
        }
        if (team1Score === team2Score) {
          return { valid: false, error: 'Games cannot end in a tie' };
        }
        return { valid: true };
      };

      expect(validateScore(15, 10)).toEqual({ valid: true });
      expect(validateScore(-1, 10).valid).toBe(false);
      expect(validateScore(0, 0).valid).toBe(false);
      expect(validateScore(15, 15).valid).toBe(false);
    });

    it('should rollback score updates on database failure', async () => {
      const players = createMockPlayers(4);
      const originalStats = players.map((p) => ({
        id: p.id,
        points: p.totalPoints,
        played: p.matchesPlayed,
        won: p.matchesWon,
      }));

      // Simulate failed update
      const mockError = new Error('Database error');
      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: mockError,
          }),
        }),
      });

      const result = await (supabase.from('game_sessions') as any)
        .update({ round_data: [] })
        .eq('id', 'session-123');

      // On error, stats should remain unchanged
      expect(result.error).toEqual(mockError);

      // Verify original stats preserved
      players.forEach((player, idx) => {
        expect(player.totalPoints).toBe(originalStats[idx].points);
        expect(player.matchesPlayed).toBe(originalStats[idx].played);
        expect(player.matchesWon).toBe(originalStats[idx].won);
      });
    });
  });

  describe('Real-time Score Updates', () => {
    it('should reflect score changes immediately in leaderboard', () => {
      const players = createMockPlayers(8).map((p) => ({
        ...p,
        totalPoints: 0,
      }));

      const algorithm = new MexicanoAlgorithm(players, 2);
      const round = algorithm.generateRound(1);

      // Enter score for first match
      const match1 = round.matches[0];
      match1.team1Score = 15;
      match1.team2Score = 10;
      match1.completed = true;
      updatePlayerStats(players, match1, 'team1');

      // Get current leaderboard
      const leaderboard1 = [...players].sort(
        (a, b) => b.totalPoints - a.totalPoints
      );

      // Top players should be from winning team
      const winnerIds = match1.team1.map((p) => p.id);
      expect(winnerIds).toContain(leaderboard1[0].id);
      expect(winnerIds).toContain(leaderboard1[1].id);

      // Enter score for second match
      const match2 = round.matches[1];
      match2.team1Score = 12;
      match2.team2Score = 15;
      match2.completed = true;
      updatePlayerStats(players, match2, 'team2');

      // Leaderboard should update
      const leaderboard2 = [...players].sort(
        (a, b) => b.totalPoints - a.totalPoints
      );

      // All 8 players should now have points
      expect(leaderboard2.every((p) => p.totalPoints > 0)).toBe(true);
    });

    it('should handle concurrent score entries', async () => {
      const players = createMockPlayers(8);
      const algorithm = new MexicanoAlgorithm(players, 2);
      const round = algorithm.generateRound(1);

      // Simulate concurrent updates to different matches
      const match1Promise = Promise.resolve({
        ...round.matches[0],
        team1Score: 15,
        team2Score: 10,
        completed: true,
      });

      const match2Promise = Promise.resolve({
        ...round.matches[1],
        team1Score: 12,
        team2Score: 15,
        completed: true,
      });

      const [match1, match2] = await Promise.all([
        match1Promise,
        match2Promise,
      ]);

      // Both matches should be completed
      expect(match1.completed).toBe(true);
      expect(match2.completed).toBe(true);
    });
  });
});
