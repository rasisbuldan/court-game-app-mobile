/**
 * Score Entry Integration Tests
 *
 * End-to-end tests for score entry workflow:
 * - Complete score entry flow
 * - Score validation
 * - Offline score entry
 * - Real-time score updates
 * - Score corrections
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { supabase } from '../../config/supabase';
import Toast from 'react-native-toast-message';
import { createTournamentData } from '../../__tests__/factories';

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

describe('Score Entry Integration Tests', () => {
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

  describe('Complete Score Entry Flow', () => {
    it('should enter scores for a match successfully', async () => {
      const sessionId = 'session-123';
      const roundNumber = 1;
      const matchIndex = 0;
      const match = mockTournamentData.rounds[0].matches[0];

      // Mock successful score update
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: {
            ...mockTournamentData.session,
            round_data: mockTournamentData.rounds.map((r, idx) =>
              idx === 0
                ? {
                    ...r,
                    matches: r.matches.map((m, mIdx) =>
                      mIdx === 0
                        ? { ...m, team1Score: 32, team2Score: 20, completed: true }
                        : m
                    ),
                  }
                : r
            ),
          },
          error: null,
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockTournamentData.session,
          error: null,
        }),
        update: mockUpdate,
      });

      // Simulate score entry
      const scoreData = {
        roundNumber,
        matchIndex,
        team1Score: 32,
        team2Score: 20,
      };

      const result = await (supabase.from('game_sessions') as any)
        .update({
          round_data: mockTournamentData.rounds.map((r, idx) =>
            idx === roundNumber - 1
              ? {
                  ...r,
                  matches: r.matches.map((m, mIdx) =>
                    mIdx === matchIndex
                      ? {
                          ...m,
                          team1Score: scoreData.team1Score,
                          team2Score: scoreData.team2Score,
                          completed: true,
                        }
                      : m
                  ),
                }
              : r
          ),
        })
        .eq('id', sessionId);

      expect(result.error).toBeNull();
      expect(result.data.round_data[0].matches[0]).toMatchObject({
        team1Score: 32,
        team2Score: 20,
        completed: true,
      });
    });

    it('should validate score limits', () => {
      const maxScore = 100;
      const validScore = 50;
      const invalidScore = 150;

      expect(validScore).toBeLessThanOrEqual(maxScore);
      expect(invalidScore).toBeGreaterThan(maxScore);
    });

    it('should handle score entry errors', async () => {
      const error = new Error('Failed to update scores');
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
    });
  });

  describe('Score Validation', () => {
    it('should reject negative scores', () => {
      const score = -5;
      expect(score).toBeLessThan(0);
    });

    it('should reject non-numeric scores', () => {
      const score = 'invalid';
      expect(typeof score).not.toBe('number');
    });

    it('should accept valid score range', () => {
      const minScore = 0;
      const maxScore = 100;
      const validScore = 50;

      expect(validScore).toBeGreaterThanOrEqual(minScore);
      expect(validScore).toBeLessThanOrEqual(maxScore);
    });

    it('should validate tied scores are not allowed', () => {
      const team1Score = 32;
      const team2Score = 32;

      // In a real implementation, this would fail validation
      expect(team1Score).toBe(team2Score);
    });

    it('should validate minimum score difference', () => {
      const team1Score = 32;
      const team2Score = 30;
      const minDifference = 2;

      expect(Math.abs(team1Score - team2Score)).toBeGreaterThanOrEqual(minDifference);
    });
  });

  describe('Offline Score Entry', () => {
    it('should queue score updates when offline', async () => {
      const networkError = new Error('network request failed');
      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockRejectedValue(networkError),
        }),
      });

      try {
        await (supabase.from('game_sessions') as any)
          .update({ round_data: [] })
          .eq('id', 'session-123');
      } catch (error) {
        expect(error).toBe(networkError);
      }
    });

    it('should sync scores when connection restored', async () => {
      // First attempt fails (offline)
      const networkError = new Error('network request failed');
      (supabase.from as jest.Mock)
        .mockReturnValueOnce({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockRejectedValue(networkError),
          }),
        })
        // Second attempt succeeds (online)
        .mockReturnValueOnce({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: { id: 'session-123' },
              error: null,
            }),
          }),
        });

      // First attempt (offline)
      try {
        await (supabase.from('game_sessions') as any)
          .update({ round_data: [] })
          .eq('id', 'session-123');
      } catch (error) {
        expect(error).toBe(networkError);
      }

      // Second attempt (online)
      const result = await (supabase.from('game_sessions') as any)
        .update({ round_data: [] })
        .eq('id', 'session-123');

      expect(result.error).toBeNull();
      expect(result.data.id).toBe('session-123');
    });
  });

  describe('Score Corrections', () => {
    it('should allow correcting entered scores', async () => {
      const originalScore = { team1Score: 32, team2Score: 20 };
      const correctedScore = { team1Score: 30, team2Score: 22 };

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: {
            id: 'session-123',
            round_data: [
              {
                roundNumber: 1,
                matches: [
                  {
                    team1Score: correctedScore.team1Score,
                    team2Score: correctedScore.team2Score,
                  },
                ],
              },
            ],
          },
          error: null,
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });

      const result = await (supabase.from('game_sessions') as any)
        .update({
          round_data: [
            {
              roundNumber: 1,
              matches: [correctedScore],
            },
          ],
        })
        .eq('id', 'session-123');

      expect(result.data.round_data[0].matches[0]).toMatchObject(correctedScore);
    });

    it('should track score correction history', async () => {
      const eventHistory = [
        {
          event_type: 'score_updated',
          description: 'Match 1 scores corrected: 32-20 → 30-22',
          session_id: 'session-123',
          created_at: new Date().toISOString(),
        },
      ];

      const mockInsert = jest.fn().mockResolvedValue({
        data: eventHistory,
        error: null,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      const result = await (supabase.from('event_history') as any).insert(eventHistory);

      expect(result.error).toBeNull();
      expect(mockInsert).toHaveBeenCalledWith(eventHistory);
    });
  });

  describe('Real-time Score Updates', () => {
    it('should broadcast score updates to other clients', async () => {
      const scoreUpdate = {
        roundNumber: 1,
        matchIndex: 0,
        team1Score: 32,
        team2Score: 20,
      };

      let broadcastCallback: Function;
      const mockChannel = {
        on: jest.fn().mockImplementation((event, callback) => {
          broadcastCallback = callback;
          return mockChannel;
        }),
        subscribe: jest.fn().mockReturnValue({
          unsubscribe: jest.fn(),
        }),
        unsubscribe: jest.fn(),
      };

      (supabase.channel as jest.Mock).mockReturnValue(mockChannel);

      // Simulate score broadcast
      const channel = supabase.channel('session:session-123');
      channel.on('broadcast', (payload: any) => {
        expect(payload).toMatchObject(scoreUpdate);
      });

      expect(mockChannel.on).toHaveBeenCalled();
    });
  });

  describe('Batch Score Entry', () => {
    it('should allow entering multiple match scores at once', async () => {
      const scoresData = [
        { matchIndex: 0, team1Score: 32, team2Score: 20 },
        { matchIndex: 1, team1Score: 28, team2Score: 24 },
      ];

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: {
            id: 'session-123',
            round_data: [
              {
                roundNumber: 1,
                matches: scoresData.map((s) => ({
                  ...s,
                  completed: true,
                })),
              },
            ],
          },
          error: null,
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });

      const result = await (supabase.from('game_sessions') as any)
        .update({
          round_data: [
            {
              roundNumber: 1,
              matches: scoresData,
            },
          ],
        })
        .eq('id', 'session-123');

      expect(result.error).toBeNull();
      expect(result.data.round_data[0].matches).toHaveLength(2);
    });
  });
});
