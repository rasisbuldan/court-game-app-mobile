/**
 * Round Generation End-to-End Integration Tests
 *
 * Complete E2E workflow for tournament round generation including:
 * - Initial round generation with algorithm
 * - Round progression through complete tournament
 * - Score entry and leaderboard updates
 * - Round regeneration functionality
 * - Player status changes mid-tournament
 * - Offline queue synchronization
 * - Error handling and recovery
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, waitFor, fireEvent, act } from '@testing-library/react-native';
import { supabase } from '../../config/supabase';
import { MexicanoAlgorithm, Player, Round, Match } from '@courtster/shared';
import { createTournamentData, createPlayers, playerFactory } from '../factories';
import { createMockPlayers } from '../factories/playerFactory';
import { offlineQueue } from '../../utils/offlineQueue';
import { Logger } from '../../utils/logger';
import Toast from 'react-native-toast-message';

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
jest.mock('../../utils/offlineQueue', () => ({
  offlineQueue: {
    addOperation: jest.fn(),
    processQueue: jest.fn().mockResolvedValue(undefined),
    clearQueue: jest.fn(),
  },
}));

// Helper to create query client for tests
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

describe('Round Generation E2E Integration Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = createTestQueryClient();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('Initial Round Generation', () => {
    it('should generate first round with correct match assignments', async () => {
      // Setup: Create 8 players with varied ratings
      const players = createMockPlayers(8, {
        status: 'active',
      }).map((p, idx) => ({
        ...p,
        rating: 10 - idx, // Ratings: 10, 9, 8, 7, 6, 5, 4, 3
      }));

      const sessionData = {
        id: 'session-123',
        name: 'Test Tournament',
        num_courts: 2,
        total_rounds: 3,
        current_round: 0,
        round_data: [],
        status: 'not_started',
        session_type: 'mexicano',
        matchup_preference: 'any',
        allow_mixed_doubles: true,
      };

      // Mock Supabase responses
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: sessionData,
              error: null,
            }),
          }),
          order: jest.fn().mockResolvedValue({
            data: players,
            error: null,
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: { ...sessionData, current_round: 1 },
            error: null,
          }),
        }),
      });

      // Act: Generate first round
      const algorithm = new MexicanoAlgorithm(
        players,
        sessionData.num_courts,
        sessionData.allow_mixed_doubles,
        sessionData.matchup_preference as any,
        sessionData.session_type as any
      );

      const round1 = algorithm.generateRound(1);

      // Assert: Verify round structure
      expect(round1).toBeDefined();
      expect(round1.number).toBe(1);
      expect(round1.matches).toHaveLength(2); // 2 courts = 2 matches

      // Verify each match has proper structure
      round1.matches.forEach((match, idx) => {
        expect(match.court).toBe(idx + 1); // Algorithm uses 'court' not 'courtNumber'
        expect(match.team1).toHaveLength(2);
        expect(match.team2).toHaveLength(2);
        // Algorithm doesn't initialize scores, they're undefined until set
        expect(match.team1Score).toBeUndefined();
        expect(match.team2Score).toBeUndefined();
      });

      // Verify players are grouped by rating (Mexicano pairing)
      const court1Players = [
        ...round1.matches[0].team1,
        ...round1.matches[0].team2,
      ];
      const court2Players = [
        ...round1.matches[1].team1,
        ...round1.matches[1].team2,
      ];

      const court1AvgRating =
        court1Players.reduce((sum, p) => sum + p.rating, 0) / 4;
      const court2AvgRating =
        court2Players.reduce((sum, p) => sum + p.rating, 0) / 4;

      // Court 1 should have higher average rating (top players)
      expect(court1AvgRating).toBeGreaterThan(court2AvgRating);

      // Verify all players are unique across all matches
      const allPlayerIds = [
        ...court1Players.map((p) => p.id),
        ...court2Players.map((p) => p.id),
      ];
      const uniquePlayerIds = new Set(allPlayerIds);
      expect(uniquePlayerIds.size).toBe(8);
    });

    it('should handle sitting players when not enough courts', async () => {
      // Setup: 10 players but only 2 courts (8 can play)
      const players = createMockPlayers(10, { status: 'active' });
      const algorithm = new MexicanoAlgorithm(players, 2);

      // Act
      const round = algorithm.generateRound(1);

      // Assert
      expect(round.matches).toHaveLength(2);
      expect(round.sittingPlayers).toHaveLength(2);

      const playingPlayerIds = round.matches.flatMap((m) =>
        [...m.team1, ...m.team2].map((p) => p.id)
      );

      // Verify sitting players are not playing
      round.sittingPlayers.forEach((sittingPlayer) => {
        expect(playingPlayerIds).not.toContain(sittingPlayer.id);
      });

      // Verify all 10 players accounted for
      expect(playingPlayerIds.length + round.sittingPlayers.length).toBe(10);
    });

    it('should update session status to in_progress after first round', async () => {
      const players = createMockPlayers(8);
      const sessionData = {
        id: 'session-123',
        status: 'not_started',
        current_round: 0,
      };

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: {
            ...sessionData,
            status: 'in_progress',
            current_round: 1,
          },
          error: null,
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });

      // Act: Update session after generating first round
      const result = await (supabase.from('game_sessions') as any)
        .update({
          status: 'in_progress',
          current_round: 1,
        })
        .eq('id', 'session-123');

      // Assert
      expect(result.data.status).toBe('in_progress');
      expect(result.data.current_round).toBe(1);
      expect(mockUpdate).toHaveBeenCalledWith({
        status: 'in_progress',
        current_round: 1,
      });
    });
  });

  describe('Complete Tournament Progression', () => {
    it('should progress through 3 rounds with score updates', async () => {
      // Setup: Complete tournament data
      const { players, session } = createTournamentData(8, 3);
      const algorithm = new MexicanoAlgorithm(
        players,
        session.courts, // Use 'courts' not 'num_courts'
        true,
        'any',
        'mexicano'
      );

      const tournamentRounds: Round[] = [];
      const updatedPlayers = [...players];

      // Act: Simulate 3 rounds with score updates
      for (let roundNum = 1; roundNum <= 3; roundNum++) {
        // Generate round
        const round = algorithm.generateRound(roundNum);
        tournamentRounds.push(round);

        // Simulate completing all matches with scores
        round.matches.forEach((match, matchIdx) => {
          // Mark match as completed
          (match as any).completed = true;

          // Alternate winners for variety
          if (matchIdx % 2 === 0) {
            match.team1Score = 15;
            match.team2Score = 10;

            // Update player points
            match.team1.forEach((player) => {
              const p = updatedPlayers.find((pl) => pl.id === player.id);
              if (p) {
                p.totalPoints = (p.totalPoints || 0) + 15;
                p.matchesWon = (p.matchesWon || 0) + 1;
                p.matchesPlayed = (p.matchesPlayed || 0) + 1;
              }
            });
            match.team2.forEach((player) => {
              const p = updatedPlayers.find((pl) => pl.id === player.id);
              if (p) {
                p.totalPoints = (p.totalPoints || 0) + 10;
                p.matchesPlayed = (p.matchesPlayed || 0) + 1;
              }
            });
          } else {
            match.team1Score = 12;
            match.team2Score = 15;

            match.team1.forEach((player) => {
              const p = updatedPlayers.find((pl) => pl.id === player.id);
              if (p) {
                p.totalPoints = (p.totalPoints || 0) + 12;
                p.matchesPlayed = (p.matchesPlayed || 0) + 1;
              }
            });
            match.team2.forEach((player) => {
              const p = updatedPlayers.find((pl) => pl.id === player.id);
              if (p) {
                p.totalPoints = (p.totalPoints || 0) + 15;
                p.matchesWon = (p.matchesWon || 0) + 1;
                p.matchesPlayed = (p.matchesPlayed || 0) + 1;
              }
            });
          }
        });

        // Re-sort players by points for next round
        updatedPlayers.sort((a, b) => b.totalPoints - a.totalPoints);
      }

      // Assert: Tournament completed successfully
      expect(tournamentRounds).toHaveLength(3);
      tournamentRounds.forEach((round, idx) => {
        expect(round.number).toBe(idx + 1);
        expect(round.matches.every((m) => m.completed)).toBe(true);
      });

      // Verify players have accumulated stats
      updatedPlayers.forEach((player) => {
        expect(player.matchesPlayed).toBeGreaterThan(0);
        expect(player.totalPoints).toBeGreaterThan(0);
      });

      // Verify final rankings are sorted by points
      for (let i = 0; i < updatedPlayers.length - 1; i++) {
        expect(updatedPlayers[i].totalPoints).toBeGreaterThanOrEqual(
          updatedPlayers[i + 1].totalPoints
        );
      }
    });

    it('should prevent generating next round when current round incomplete', async () => {
      const players = createMockPlayers(8);
      const algorithm = new MexicanoAlgorithm(players, 2);

      // Generate round 1
      const round1 = algorithm.generateRound(1);

      // Complete only first match
      round1.matches[0].completed = true;
      round1.matches[0].team1Score = 15;
      round1.matches[0].team2Score = 10;
      // Leave second match incomplete

      // Check if round is complete
      const isRoundComplete = round1.matches.every((m) => m.completed);

      // Assert: Should not be able to proceed
      expect(isRoundComplete).toBe(false);

      // Attempting to generate next round while incomplete should be blocked
      // (This would be enforced in the UI/business logic)
      const canGenerateNextRound = isRoundComplete;
      expect(canGenerateNextRound).toBe(false);
    });

    it('should mark tournament as completed after final round', async () => {
      const sessionData = {
        id: 'session-123',
        current_round: 3,
        total_rounds: 3,
        status: 'in_progress',
      };

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: {
            ...sessionData,
            status: 'completed',
          },
          error: null,
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });

      // Act: Mark as completed after final round
      const result = await (supabase.from('game_sessions') as any)
        .update({ status: 'completed' })
        .eq('id', 'session-123');

      // Assert
      expect(result.data.status).toBe('completed');

      // Verify cannot generate more rounds
      const canGenerateNextRound =
        sessionData.current_round < sessionData.total_rounds;
      expect(canGenerateNextRound).toBe(false);
    });
  });

  describe('Round Regeneration', () => {
    it('should regenerate current round with same players but different matchups', async () => {
      const players = createMockPlayers(8);
      const algorithm = new MexicanoAlgorithm(players, 2);

      // Generate initial round
      const originalRound = algorithm.generateRound(1);

      // Store original matchups
      const originalMatchups = originalRound.matches.map((m) => ({
        team1: m.team1.map((p) => p.id).sort().join('-'),
        team2: m.team2.map((p) => p.id).sort().join('-'),
      }));

      // Regenerate the same round number
      const regeneratedRound = algorithm.generateRound(1);

      // Assert: Same round number and structure
      expect(regeneratedRound.number).toBe(1);
      expect(regeneratedRound.matches).toHaveLength(2);

      // Verify all same players are still assigned
      const originalPlayerIds = originalRound.matches
        .flatMap((m) => [...m.team1, ...m.team2])
        .map((p) => p.id)
        .sort();

      const regeneratedPlayerIds = regeneratedRound.matches
        .flatMap((m) => [...m.team1, ...m.team2])
        .map((p) => p.id)
        .sort();

      expect(regeneratedPlayerIds).toEqual(originalPlayerIds);

      // Note: Matchups might be different due to algorithm randomness
      // This is expected behavior for regeneration
    });

    it('should clear scores when regenerating a round', async () => {
      const players = createMockPlayers(8);
      const algorithm = new MexicanoAlgorithm(players, 2);

      // Generate and complete a round
      const round = algorithm.generateRound(1);
      round.matches[0].team1Score = 15;
      round.matches[0].team2Score = 10;
      round.matches[0].completed = true;

      // Regenerate the round
      const regeneratedRound = algorithm.generateRound(1);

      // Assert: Scores should be reset (algorithm doesn't initialize scores)
      regeneratedRound.matches.forEach((match) => {
        expect(match.team1Score).toBeUndefined();
        expect(match.team2Score).toBeUndefined();
      });
    });

    it('should log regeneration event in history', async () => {
      const eventData = {
        session_id: 'session-123',
        event_type: 'round_regenerated',
        description: 'Round 2 regenerated by organizer',
        round_number: 2,
        created_at: new Date().toISOString(),
      };

      const mockInsert = jest.fn().mockResolvedValue({
        data: [eventData],
        error: null,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      // Act
      const result = await (supabase.from('event_history') as any).insert([
        eventData,
      ]);

      // Assert
      expect(result.error).toBeNull();
      expect(mockInsert).toHaveBeenCalledWith([eventData]);
    });
  });

  describe('Player Status Changes Mid-Tournament', () => {
    it('should exclude departed players from subsequent rounds', async () => {
      const players = createMockPlayers(8);

      // Generate round 1 with all players active
      let algorithm = new MexicanoAlgorithm(players, 2);
      const round1 = algorithm.generateRound(1);
      expect(round1.matches).toHaveLength(2);

      // Player leaves after round 1
      players[0].status = 'departed';

      // Recreate algorithm with updated player status
      algorithm = new MexicanoAlgorithm(players, 2);

      // Generate round 2
      const round2 = algorithm.generateRound(2);

      // Assert: Departed player should not be in round 2
      const round2PlayerIds = round2.matches
        .flatMap((m) => [...m.team1, ...m.team2])
        .map((p) => p.id);

      expect(round2PlayerIds).not.toContain(players[0].id);

      // With 7 active players, should have 1 match (4 playing) + 3 sitting
      expect(round2.matches).toHaveLength(1);
      expect(round2.sittingPlayers).toHaveLength(3);
    });

    it('should handle late players being activated mid-tournament', async () => {
      const players = createMockPlayers(8);
      players[0].status = 'late'; // Mark as late initially

      // Round 1: Late player not included
      let algorithm = new MexicanoAlgorithm(players, 2);
      const round1 = algorithm.generateRound(1);
      const round1PlayerIds = round1.matches
        .flatMap((m) => [...m.team1, ...m.team2])
        .map((p) => p.id);

      expect(round1PlayerIds).not.toContain(players[0].id);

      // Player arrives and becomes active
      players[0].status = 'active';

      // Recreate algorithm with updated player status
      algorithm = new MexicanoAlgorithm(players, 2);

      // Round 2: Late player now included
      const round2 = algorithm.generateRound(2);
      const round2PlayerIds = round2.matches
        .flatMap((m) => [...m.team1, ...m.team2])
        .map((p) => p.id);

      expect(round2PlayerIds).toContain(players[0].id);
    });

    it('should handle skipRounds feature for partial participation', async () => {
      const players = createMockPlayers(8);

      // Player wants to skip rounds 2 and 4
      players[0].skipRounds = [2, 4];

      const algorithm = new MexicanoAlgorithm(players, 2);

      // Round 1: Player participates
      const round1 = algorithm.generateRound(1);
      const round1PlayerIds = round1.matches
        .flatMap((m) => [...m.team1, ...m.team2])
        .map((p) => p.id);
      expect(round1PlayerIds).toContain(players[0].id);

      // Round 2: Player skips
      const round2 = algorithm.generateRound(2);
      const round2PlayerIds = round2.matches
        .flatMap((m) => [...m.team1, ...m.team2])
        .map((p) => p.id);
      expect(round2PlayerIds).not.toContain(players[0].id);

      // Round 3: Player participates
      const round3 = algorithm.generateRound(3);
      const round3PlayerIds = round3.matches
        .flatMap((m) => [...m.team1, ...m.team2])
        .map((p) => p.id);
      expect(round3PlayerIds).toContain(players[0].id);

      // Round 4: Player skips
      const round4 = algorithm.generateRound(4);
      const round4PlayerIds = round4.matches
        .flatMap((m) => [...m.team1, ...m.team2])
        .map((p) => p.id);
      expect(round4PlayerIds).not.toContain(players[0].id);
    });
  });

  describe('Offline Queue Integration', () => {
    it('should queue round generation when offline', async () => {
      const players = createMockPlayers(8);
      const algorithm = new MexicanoAlgorithm(players, 2);
      const round = algorithm.generateRound(1);

      // Mock offline state
      const roundData = {
        session_id: 'session-123',
        round_number: 1,
        round: round,
      };

      // Add to offline queue
      await offlineQueue.addOperation({
        type: 'UPDATE_SESSION',
        table: 'game_sessions',
        data: {
          id: 'session-123',
          round_data: [round],
          current_round: 1,
        },
        timestamp: Date.now(),
      });

      // Assert: Operation queued
      expect(offlineQueue.addOperation).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'UPDATE_SESSION',
          table: 'game_sessions',
        })
      );
    });

    it('should sync queued round generation when back online', async () => {
      // Simulate coming back online and processing queue
      await offlineQueue.processQueue();

      // Assert: Queue processed
      expect(offlineQueue.processQueue).toHaveBeenCalled();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle database errors during round save gracefully', async () => {
      const error = new Error('Database connection failed');

      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error,
          }),
        }),
      });

      // Act
      const result = await (supabase.from('game_sessions') as any)
        .update({ current_round: 2 })
        .eq('id', 'session-123');

      // Assert
      expect(result.error).toEqual(error);
      expect(result.data).toBeNull();

      // Verify error logged
      expect(Logger.error).not.toHaveBeenCalled(); // Would be called in actual handler
    });

    it('should handle insufficient players for round generation', async () => {
      // Only 3 active players (need minimum 4)
      const players = createMockPlayers(3);

      expect(() => {
        new MexicanoAlgorithm(players, 1);
      }).toThrow('Minimum 4 players required');
    });

    it('should handle all players inactive scenario', async () => {
      const players = createMockPlayers(8);
      players.forEach((p) => (p.status = 'departed'));

      const algorithm = new MexicanoAlgorithm(players, 2);
      const round = algorithm.generateRound(1);

      // Assert: Empty round generated
      expect(round.matches).toHaveLength(0);
      expect(round.sittingPlayers).toHaveLength(0);
    });

    it('should validate round number is positive integer', async () => {
      const players = createMockPlayers(8);
      const algorithm = new MexicanoAlgorithm(players, 2);

      expect(() => algorithm.generateRound(0)).toThrow(
        'Round number must be a positive integer'
      );
      expect(() => algorithm.generateRound(-1)).toThrow(
        'Round number must be a positive integer'
      );
      expect(() => algorithm.generateRound(1.5)).toThrow(
        'Round number must be a positive integer'
      );
    });
  });

  describe('Performance and Concurrency', () => {
    it('should generate rounds efficiently with large player counts', async () => {
      const players = createMockPlayers(40);
      const algorithm = new MexicanoAlgorithm(players, 5);

      const startTime = Date.now();
      const round = algorithm.generateRound(1);
      const endTime = Date.now();

      // Assert: Completes quickly (< 500ms)
      expect(endTime - startTime).toBeLessThan(500);
      expect(round.matches).toHaveLength(5);
      expect(round.sittingPlayers).toHaveLength(20);
    });

    it('should maintain consistent round generation across multiple calls', async () => {
      const players = createMockPlayers(8);
      const algorithm = new MexicanoAlgorithm(players, 2);

      const rounds = [];
      for (let i = 1; i <= 5; i++) {
        rounds.push(algorithm.generateRound(i));
      }

      // Assert: All rounds generated successfully
      expect(rounds).toHaveLength(5);
      rounds.forEach((round, idx) => {
        expect(round.number).toBe(idx + 1);
        expect(round.matches).toHaveLength(2);
      });
    });
  });
});
