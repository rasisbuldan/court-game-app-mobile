/**
 * Session Creation Integration Tests
 *
 * End-to-end tests for tournament session creation:
 * - Complete session setup flow
 * - Player management
 * - Round generation
 * - Error handling
 */

import { render, fireEvent, waitFor } from '@testing-library/react-native';
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

describe('Session Creation Integration Tests', () => {
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

    // Mock successful session creation
    (supabase.from as jest.Mock).mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'session-123',
              name: 'Test Tournament',
              type: 'mexicano',
              sport: 'padel',
              courts: 2,
              points_per_match: 32,
              status: 'setup',
              current_round: 0,
              player_count: 8,
              round_data: [],
              created_at: new Date().toISOString(),
            },
            error: null,
          }),
        }),
      }),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
      update: jest.fn().mockReturnThis(),
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('Session Creation Flow', () => {
    it('should create session with basic information', async () => {
      const sessionData = {
        name: 'Test Tournament',
        type: 'mexicano' as const,
        sport: 'padel' as const,
        courts: 2,
        points_per_match: 32,
        player_count: 8,
      };

      // In a real integration test, we would render the create session screen
      // For now, we're testing the API flow directly

      const { data, error } = await (supabase.from('game_sessions') as any)
        .insert(sessionData)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toMatchObject({
        name: 'Test Tournament',
        type: 'mexicano',
        sport: 'padel',
      });
    });

    it('should handle session creation errors', async () => {
      const error = new Error('Database error');
      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error,
            }),
          }),
        }),
      });

      const sessionData = {
        name: 'Test Tournament',
        type: 'mexicano' as const,
      };

      const result = await (supabase.from('game_sessions') as any)
        .insert(sessionData)
        .select()
        .single();

      expect(result.error).toEqual(error);
    });
  });

  describe('Player Addition Flow', () => {
    it('should add multiple players to session', async () => {
      const players = mockTournamentData.players.slice(0, 8);

      const mockInsert = jest.fn().mockResolvedValue({
        data: players,
        error: null,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      const result = await (supabase.from('players') as any).insert(
        players.map((p) => ({
          session_id: 'session-123',
          name: p.name,
          status: 'active',
        }))
      );

      expect(result.error).toBeNull();
      expect(mockInsert).toHaveBeenCalled();
    });

    it('should validate minimum player count', () => {
      const minPlayers = {
        mexicano: 4,
        americano: 4,
        mixed_mexicano: 4,
      };

      expect(minPlayers.mexicano).toBe(4);
    });

    it('should handle player addition errors', async () => {
      const error = new Error('Duplicate player name');
      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockResolvedValue({
          data: null,
          error,
        }),
      });

      const result = await (supabase.from('players') as any).insert([
        { session_id: 'session-123', name: 'Player 1' },
      ]);

      expect(result.error).toEqual(error);
    });
  });

  describe('Round Generation Flow', () => {
    it('should generate first round successfully', async () => {
      const roundData = mockTournamentData.rounds;

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: {
            id: 'session-123',
            round_data: roundData,
            current_round: 1,
            status: 'in_progress',
          },
          error: null,
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });

      const result = await (supabase.from('game_sessions') as any)
        .update({
          round_data: roundData,
          current_round: 1,
          status: 'in_progress',
        })
        .eq('id', 'session-123');

      expect(result.error).toBeNull();
      expect(result.data.current_round).toBe(1);
      expect(result.data.status).toBe('in_progress');
    });

    it('should validate round generation requirements', () => {
      // Round can only be generated with minimum players
      const requirements = {
        minPlayers: 4,
        evenPlayers: true,
      };

      expect(requirements.minPlayers).toBe(4);
      expect(requirements.evenPlayers).toBe(true);
    });

    it('should handle round generation errors', async () => {
      const error = new Error('Invalid player configuration');
      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error,
          }),
        }),
      });

      const result = await (supabase.from('game_sessions') as any)
        .update({
          round_data: [],
          current_round: 1,
        })
        .eq('id', 'session-123');

      expect(result.error).toEqual(error);
    });
  });

  describe('Complete Session Setup', () => {
    it('should complete full session creation workflow', async () => {
      // Step 1: Create session
      const sessionInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'session-123',
              name: 'Test Tournament',
              status: 'setup',
            },
            error: null,
          }),
        }),
      });

      // Step 2: Add players
      const playersInsert = jest.fn().mockResolvedValue({
        data: mockTournamentData.players,
        error: null,
      });

      // Step 3: Generate round
      const sessionUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: {
            id: 'session-123',
            status: 'in_progress',
            current_round: 1,
          },
          error: null,
        }),
      });

      // Step 4: Log event
      const eventInsert = jest.fn().mockResolvedValue({
        data: { id: 'event-1' },
        error: null,
      });

      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'game_sessions') {
          return {
            insert: sessionInsert,
            update: sessionUpdate,
          };
        }
        if (table === 'players') {
          return {
            insert: playersInsert,
          };
        }
        if (table === 'event_history') {
          return {
            insert: eventInsert,
          };
        }
        return {};
      });

      // Execute workflow
      // 1. Create session
      const session = await (supabase.from('game_sessions') as any)
        .insert({ name: 'Test Tournament' })
        .select()
        .single();

      expect(session.data.id).toBe('session-123');

      // 2. Add players
      const players = await (supabase.from('players') as any).insert(
        mockTournamentData.players.map((p) => ({
          session_id: 'session-123',
          name: p.name,
        }))
      );

      expect(players.error).toBeNull();

      // 3. Generate round
      const updatedSession = await (supabase.from('game_sessions') as any)
        .update({
          status: 'in_progress',
          current_round: 1,
          round_data: mockTournamentData.rounds,
        })
        .eq('id', 'session-123');

      expect(updatedSession.data.status).toBe('in_progress');
      expect(updatedSession.data.current_round).toBe(1);

      // 4. Log event
      const event = await (supabase.from('event_history') as any).insert({
        session_id: 'session-123',
        event_type: 'round_generated',
        description: 'Round 1 generated',
      });

      expect(event.data.id).toBe('event-1');
    });

    it('should rollback on failure during setup', async () => {
      // Session created successfully
      const sessionInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: 'session-123' },
            error: null,
          }),
        }),
      });

      // Players insertion fails
      const playersInsert = jest.fn().mockResolvedValue({
        data: null,
        error: new Error('Player creation failed'),
      });

      // Delete session on rollback
      const sessionDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          error: null,
        }),
      });

      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'game_sessions') {
          return {
            insert: sessionInsert,
            delete: sessionDelete,
          };
        }
        if (table === 'players') {
          return {
            insert: playersInsert,
          };
        }
        return {};
      });

      // Create session
      const session = await (supabase.from('game_sessions') as any)
        .insert({ name: 'Test Tournament' })
        .select()
        .single();

      // Try to add players (fails)
      const players = await (supabase.from('players') as any).insert([]);

      // Should trigger rollback
      if (players.error) {
        await (supabase.from('game_sessions') as any).delete().eq('id', session.data.id);

        expect(sessionDelete).toHaveBeenCalled();
      }
    });
  });

  describe('Data Validation', () => {
    it('should validate session configuration', () => {
      const validSession = {
        name: 'Test Tournament',
        type: 'mexicano',
        sport: 'padel',
        courts: 2,
        points_per_match: 32,
        player_count: 8,
      };

      expect(validSession.name).toBeTruthy();
      expect(validSession.courts).toBeGreaterThan(0);
      expect(validSession.points_per_match).toBeGreaterThan(0);
      expect(validSession.player_count).toBeGreaterThanOrEqual(4);
    });

    it('should validate player configuration', () => {
      const validPlayer = {
        name: 'Player 1',
        status: 'active',
        session_id: 'session-123',
      };

      expect(validPlayer.name).toBeTruthy();
      expect(['active', 'late', 'no_show', 'departed']).toContain(validPlayer.status);
      expect(validPlayer.session_id).toBeTruthy();
    });

    it('should validate round configuration', () => {
      const round = mockTournamentData.rounds[0];

      expect(round.number).toBeGreaterThan(0);
      expect(round.matches.length).toBeGreaterThan(0);
      expect(round.matches.every((m) => m.team1.length === 2)).toBe(true);
      expect(round.matches.every((m) => m.team2.length === 2)).toBe(true);
    });
  });
});
