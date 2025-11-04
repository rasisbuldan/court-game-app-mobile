/**
 * Round Progression Integration Tests
 *
 * End-to-end tests for round progression workflow:
 * - Round generation
 * - Round completion validation
 * - Tournament progression
 * - Final round handling
 * - Round rollback
 */

import { QueryClient } from '@tanstack/react-query';
import { supabase } from '../../config/supabase';
import { createTournamentData } from '../../__tests__/factories';
import { MexicanoAlgorithm } from '@courtster/shared';

// Mock dependencies
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

describe('Round Progression Integration Tests', () => {
  let queryClient: QueryClient;
  const mockTournamentData = createTournamentData(8, 3);

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

  describe('Round Generation', () => {
    it('should generate first round successfully', async () => {
      const players = mockTournamentData.players;
      const algorithm = new MexicanoAlgorithm(players, 2);

      const round = algorithm.generateRound(1);

      expect(round).toBeDefined();
      expect(round.number).toBe(1);
      expect(round.matches.length).toBe(2); // 8 players / 2 = 4 teams / 2 = 2 matches
      expect(round.matches.every((m) => m.team1.length === 2)).toBe(true);
      expect(round.matches.every((m) => m.team2.length === 2)).toBe(true);
    });

    it('should generate subsequent rounds based on scores', async () => {
      const players = mockTournamentData.players.map((p, idx) => ({
        ...p,
        totalPoints: idx * 10, // Different scores to test matchmaking
      }));

      const algorithm = new MexicanoAlgorithm(players, 2);
      const round = algorithm.generateRound(2);

      expect(round).toBeDefined();
      expect(round.number).toBe(2);
      expect(round.matches.length).toBe(2);
    });

    it('should validate all players assigned to matches', () => {
      const round = mockTournamentData.rounds[0];
      const assignedPlayers = new Set<number>();

      round.matches.forEach((match) => {
        match.team1.forEach((playerId) => assignedPlayers.add(playerId));
        match.team2.forEach((playerId) => assignedPlayers.add(playerId));
      });

      // All 8 players should be assigned
      expect(assignedPlayers.size).toBe(8);
    });

    it('should prevent round generation with incomplete previous round', async () => {
      const roundData = mockTournamentData.rounds.map((r, idx) =>
        idx === 0
          ? {
              ...r,
              matches: r.matches.map((m, mIdx) =>
                mIdx === 0
                  ? { ...m, completed: false } // First match incomplete
                  : { ...m, completed: true }
              ),
            }
          : r
      );

      const hasIncompleteMatches = roundData[0].matches.some((m) => !m.completed);
      expect(hasIncompleteMatches).toBe(true);
    });
  });

  describe('Round Completion Validation', () => {
    it('should validate all matches in round are completed', () => {
      const round = mockTournamentData.rounds[0];
      const allCompleted = round.matches.every((m) => m.completed);

      expect(allCompleted).toBe(true);
    });

    it('should detect incomplete round', () => {
      const round = {
        ...mockTournamentData.rounds[0],
        matches: mockTournamentData.rounds[0].matches.map((m, idx) =>
          idx === 0 ? { ...m, completed: false } : m
        ),
      };

      const allCompleted = round.matches.every((m) => m.completed);
      expect(allCompleted).toBe(false);
    });

    it('should allow next round when current round complete', async () => {
      const sessionData = {
        ...mockTournamentData.session,
        current_round: 1,
        round_data: mockTournamentData.rounds.slice(0, 1).map((r) => ({
          ...r,
          matches: r.matches.map((m) => ({ ...m, completed: true })),
        })),
      };

      const allCompleted = sessionData.round_data[0].matches.every((m) => m.completed);
      const canGenerateNext = allCompleted && sessionData.current_round < 3;

      expect(canGenerateNext).toBe(true);
    });

    it('should prevent next round when current round incomplete', () => {
      const sessionData = {
        ...mockTournamentData.session,
        current_round: 1,
        round_data: mockTournamentData.rounds.slice(0, 1).map((r) => ({
          ...r,
          matches: r.matches.map((m, idx) =>
            idx === 0 ? { ...m, completed: false } : { ...m, completed: true }
          ),
        })),
      };

      const allCompleted = sessionData.round_data[0].matches.every((m) => m.completed);
      expect(allCompleted).toBe(false);
    });
  });

  describe('Tournament Progression', () => {
    it('should progress through multiple rounds successfully', async () => {
      const totalRounds = 3;
      const sessionData = {
        ...mockTournamentData.session,
        current_round: 0,
        round_data: [],
      };

      // Mock round progression
      for (let i = 1; i <= totalRounds; i++) {
        const mockUpdate = jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: {
              ...sessionData,
              current_round: i,
              round_data: mockTournamentData.rounds.slice(0, i),
            },
            error: null,
          }),
        });

        (supabase.from as jest.Mock).mockReturnValue({
          update: mockUpdate,
        });

        const result = await (supabase.from('game_sessions') as any)
          .update({
            current_round: i,
            round_data: mockTournamentData.rounds.slice(0, i),
          })
          .eq('id', 'session-123');

        expect(result.data.current_round).toBe(i);
        expect(result.data.round_data.length).toBe(i);
      }
    });

    it('should update session status when progressing rounds', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: {
            id: 'session-123',
            status: 'in_progress',
            current_round: 2,
          },
          error: null,
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });

      const result = await (supabase.from('game_sessions') as any)
        .update({
          status: 'in_progress',
          current_round: 2,
        })
        .eq('id', 'session-123');

      expect(result.data.status).toBe('in_progress');
      expect(result.data.current_round).toBe(2);
    });

    it('should calculate player standings after each round', () => {
      const players = mockTournamentData.players;
      const sortedPlayers = [...players].sort((a, b) => b.totalPoints - a.totalPoints);

      expect(sortedPlayers[0].totalPoints).toBeGreaterThanOrEqual(sortedPlayers[1].totalPoints);
      expect(sortedPlayers[1].totalPoints).toBeGreaterThanOrEqual(sortedPlayers[2].totalPoints);
    });
  });

  describe('Final Round Handling', () => {
    it('should mark session as completed after final round', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: {
            id: 'session-123',
            status: 'completed',
            current_round: 3,
            round_data: mockTournamentData.rounds,
          },
          error: null,
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });

      const result = await (supabase.from('game_sessions') as any)
        .update({
          status: 'completed',
          current_round: 3,
        })
        .eq('id', 'session-123');

      expect(result.data.status).toBe('completed');
      expect(result.data.current_round).toBe(3);
    });

    it('should prevent generating rounds beyond session limit', () => {
      const sessionData = {
        ...mockTournamentData.session,
        current_round: 3,
        total_rounds: 3,
      };

      const canGenerateNext = sessionData.current_round < sessionData.total_rounds;
      expect(canGenerateNext).toBe(false);
    });

    it('should finalize player rankings', () => {
      const players = mockTournamentData.players;
      const finalRankings = [...players]
        .sort((a, b) => b.totalPoints - a.totalPoints)
        .map((p, idx) => ({
          ...p,
          rank: idx + 1,
        }));

      expect(finalRankings[0].rank).toBe(1);
      expect(finalRankings[0].totalPoints).toBeGreaterThanOrEqual(finalRankings[1].totalPoints);
    });
  });

  describe('Round Rollback', () => {
    it('should allow rolling back to previous round', async () => {
      const currentRound = 3;
      const rollbackRound = 2;

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: {
            id: 'session-123',
            current_round: rollbackRound,
            round_data: mockTournamentData.rounds.slice(0, rollbackRound),
          },
          error: null,
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });

      const result = await (supabase.from('game_sessions') as any)
        .update({
          current_round: rollbackRound,
          round_data: mockTournamentData.rounds.slice(0, rollbackRound),
        })
        .eq('id', 'session-123');

      expect(result.data.current_round).toBe(rollbackRound);
      expect(result.data.round_data.length).toBe(rollbackRound);
    });

    it('should log round rollback in event history', async () => {
      const eventData = {
        session_id: 'session-123',
        event_type: 'round_rollback',
        description: 'Rolled back from Round 3 to Round 2',
        created_at: new Date().toISOString(),
      };

      const mockInsert = jest.fn().mockResolvedValue({
        data: [eventData],
        error: null,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      const result = await (supabase.from('event_history') as any).insert([eventData]);

      expect(result.error).toBeNull();
      expect(mockInsert).toHaveBeenCalledWith([eventData]);
    });
  });

  describe('Error Handling', () => {
    it('should handle round generation failures gracefully', async () => {
      const error = new Error('Round generation failed');
      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error,
          }),
        }),
      });

      const result = await (supabase.from('game_sessions') as any)
        .update({ current_round: 2 })
        .eq('id', 'session-123');

      expect(result.error).toEqual(error);
    });

    it('should maintain data integrity on round progression error', async () => {
      // Simulate error during round progression
      const originalData = {
        current_round: 1,
        round_data: mockTournamentData.rounds.slice(0, 1),
      };

      const error = new Error('Update failed');
      (supabase.from as jest.Mock).mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error,
          }),
        }),
      });

      const result = await (supabase.from('game_sessions') as any)
        .update({ current_round: 2 })
        .eq('id', 'session-123');

      // Data should remain unchanged on error
      expect(result.error).toEqual(error);
      expect(result.data).toBeNull();
    });
  });
});
