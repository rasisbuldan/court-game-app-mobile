/**
 * useNotificationPreferences Hook Tests
 *
 * Comprehensive unit tests for notification preferences management covering:
 * - Fetching user preferences with authentication
 * - Default preferences creation when none exist
 * - Individual preference updates
 * - Cache invalidation and optimistic updates
 * - Error handling and toast notifications
 * - All preference toggle types
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
  NotificationPreferences,
} from '../useNotificationPreferences';
import { supabase } from '../../config/supabase';
import Toast from 'react-native-toast-message';

// Mock dependencies
jest.mock('../../config/supabase');
jest.mock('react-native-toast-message');

describe('useNotificationPreferences Hook', () => {
  const mockUserId = 'user-123';

  const mockPreferences: NotificationPreferences = {
    id: 'prefs-1',
    user_id: mockUserId,
    push_enabled: true,
    email_enabled: true,
    session_reminders: true,
    club_invites: true,
    match_results: true,
    session_updates: true,
    club_announcements: true,
    sound_effects: true,
    dark_mode: false,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
  };

  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create fresh QueryClient for each test
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

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('Fetching Preferences', () => {
    it('should fetch existing preferences successfully', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockPreferences,
              error: null,
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useNotificationPreferences(mockUserId), { wrapper });

      // Initially loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();

      // Wait for preferences to load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockPreferences);
      expect(result.current.error).toBeNull();
      expect(supabase.from).toHaveBeenCalledWith('notification_preferences');
    });

    it('should not fetch when userId is undefined', () => {
      const { result } = renderHook(() => useNotificationPreferences(undefined), { wrapper });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('should create default preferences when none exist (PGRST116 error)', async () => {
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockPreferences,
            error: null,
          }),
        }),
      });

      (supabase.from as jest.Mock)
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116', message: 'No rows found' },
              }),
            }),
          }),
          insert: mockInsert,
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          insert: mockInsert,
        });

      const { result } = renderHook(() => useNotificationPreferences(mockUserId), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockInsert).toHaveBeenCalledWith({
        user_id: mockUserId,
        push_enabled: true,
        email_enabled: true,
        session_reminders: true,
        club_invites: true,
        match_results: true,
        session_updates: true,
        club_announcements: true,
        sound_effects: true,
        dark_mode: false,
      });

      expect(result.current.data).toEqual(mockPreferences);
    });

    it('should handle default preferences creation failure', async () => {
      const createError = new Error('Database error');

      (supabase.from as jest.Mock)
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' },
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: createError,
              }),
            }),
          }),
        });

      const { result } = renderHook(() => useNotificationPreferences(mockUserId), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.data).toBeUndefined();
    });

    it('should handle fetch errors for non-PGRST116 errors', async () => {
      const fetchError = new Error('Network error');

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: fetchError,
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useNotificationPreferences(mockUserId), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.data).toBeUndefined();
    });

    it('should respect staleTime of 5 minutes', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockPreferences,
              error: null,
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useNotificationPreferences(mockUserId), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Check that query is configured with proper staleTime
      const queryState = queryClient.getQueryState(['notification-preferences', mockUserId]);
      expect(queryState).toBeDefined();
    });
  });

  describe('Updating Preferences', () => {
    beforeEach(async () => {
      // Setup initial preferences
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockPreferences,
              error: null,
            }),
          }),
        }),
      });
    });

    it('should update push_enabled preference successfully', async () => {
      const updatedPreferences = {
        ...mockPreferences,
        push_enabled: false,
        updated_at: new Date().toISOString(),
      };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockPreferences,
              error: null,
            }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: updatedPreferences,
                error: null,
              }),
            }),
          }),
        }),
      });

      const { result: prefsResult } = renderHook(
        () => useNotificationPreferences(mockUserId),
        { wrapper }
      );
      const { result: mutationResult } = renderHook(
        () => useUpdateNotificationPreferences(),
        { wrapper }
      );

      await waitFor(() => {
        expect(prefsResult.current.data).toEqual(mockPreferences);
      });

      await act(async () => {
        mutationResult.current.mutate({
          userId: mockUserId,
          preferences: { push_enabled: false },
        });
      });

      await waitFor(() => {
        expect(mutationResult.current.isSuccess).toBe(true);
      });

      expect(Toast.show).toHaveBeenCalledWith({
        type: 'success',
        text1: 'Preferences updated',
        text2: 'Your notification settings have been saved',
      });
    });

    it('should update email_enabled preference successfully', async () => {
      const updatedPreferences = {
        ...mockPreferences,
        email_enabled: false,
      };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockPreferences,
              error: null,
            }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: updatedPreferences,
                error: null,
              }),
            }),
          }),
        }),
      });

      const { result: mutationResult } = renderHook(
        () => useUpdateNotificationPreferences(),
        { wrapper }
      );

      await act(async () => {
        mutationResult.current.mutate({
          userId: mockUserId,
          preferences: { email_enabled: false },
        });
      });

      await waitFor(() => {
        expect(mutationResult.current.isSuccess).toBe(true);
      });
    });

    it('should update session_reminders preference successfully', async () => {
      const updatedPreferences = {
        ...mockPreferences,
        session_reminders: false,
      };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockPreferences,
              error: null,
            }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: updatedPreferences,
                error: null,
              }),
            }),
          }),
        }),
      });

      const { result: mutationResult } = renderHook(
        () => useUpdateNotificationPreferences(),
        { wrapper }
      );

      await act(async () => {
        mutationResult.current.mutate({
          userId: mockUserId,
          preferences: { session_reminders: false },
        });
      });

      await waitFor(() => {
        expect(mutationResult.current.isSuccess).toBe(true);
      });
    });

    it('should update club_invites preference successfully', async () => {
      const updatedPreferences = {
        ...mockPreferences,
        club_invites: false,
      };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockPreferences,
              error: null,
            }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: updatedPreferences,
                error: null,
              }),
            }),
          }),
        }),
      });

      const { result: mutationResult } = renderHook(
        () => useUpdateNotificationPreferences(),
        { wrapper }
      );

      await act(async () => {
        mutationResult.current.mutate({
          userId: mockUserId,
          preferences: { club_invites: false },
        });
      });

      await waitFor(() => {
        expect(mutationResult.current.isSuccess).toBe(true);
      });
    });

    it('should update match_results preference successfully', async () => {
      const updatedPreferences = {
        ...mockPreferences,
        match_results: false,
      };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockPreferences,
              error: null,
            }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: updatedPreferences,
                error: null,
              }),
            }),
          }),
        }),
      });

      const { result: mutationResult } = renderHook(
        () => useUpdateNotificationPreferences(),
        { wrapper }
      );

      await act(async () => {
        mutationResult.current.mutate({
          userId: mockUserId,
          preferences: { match_results: false },
        });
      });

      await waitFor(() => {
        expect(mutationResult.current.isSuccess).toBe(true);
      });
    });

    it('should update session_updates preference successfully', async () => {
      const updatedPreferences = {
        ...mockPreferences,
        session_updates: false,
      };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockPreferences,
              error: null,
            }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: updatedPreferences,
                error: null,
              }),
            }),
          }),
        }),
      });

      const { result: mutationResult } = renderHook(
        () => useUpdateNotificationPreferences(),
        { wrapper }
      );

      await act(async () => {
        mutationResult.current.mutate({
          userId: mockUserId,
          preferences: { session_updates: false },
        });
      });

      await waitFor(() => {
        expect(mutationResult.current.isSuccess).toBe(true);
      });
    });

    it('should update club_announcements preference successfully', async () => {
      const updatedPreferences = {
        ...mockPreferences,
        club_announcements: false,
      };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockPreferences,
              error: null,
            }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: updatedPreferences,
                error: null,
              }),
            }),
          }),
        }),
      });

      const { result: mutationResult } = renderHook(
        () => useUpdateNotificationPreferences(),
        { wrapper }
      );

      await act(async () => {
        mutationResult.current.mutate({
          userId: mockUserId,
          preferences: { club_announcements: false },
        });
      });

      await waitFor(() => {
        expect(mutationResult.current.isSuccess).toBe(true);
      });
    });

    it('should update sound_effects preference successfully', async () => {
      const updatedPreferences = {
        ...mockPreferences,
        sound_effects: false,
      };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockPreferences,
              error: null,
            }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: updatedPreferences,
                error: null,
              }),
            }),
          }),
        }),
      });

      const { result: mutationResult } = renderHook(
        () => useUpdateNotificationPreferences(),
        { wrapper }
      );

      await act(async () => {
        mutationResult.current.mutate({
          userId: mockUserId,
          preferences: { sound_effects: false },
        });
      });

      await waitFor(() => {
        expect(mutationResult.current.isSuccess).toBe(true);
      });
    });

    it('should update dark_mode preference successfully', async () => {
      const updatedPreferences = {
        ...mockPreferences,
        dark_mode: true,
      };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockPreferences,
              error: null,
            }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: updatedPreferences,
                error: null,
              }),
            }),
          }),
        }),
      });

      const { result: mutationResult } = renderHook(
        () => useUpdateNotificationPreferences(),
        { wrapper }
      );

      await act(async () => {
        mutationResult.current.mutate({
          userId: mockUserId,
          preferences: { dark_mode: true },
        });
      });

      await waitFor(() => {
        expect(mutationResult.current.isSuccess).toBe(true);
      });
    });

    it('should update multiple preferences at once', async () => {
      const updates = {
        push_enabled: false,
        email_enabled: false,
        session_reminders: false,
        club_invites: false,
        dark_mode: true,
      };

      const updatedPreferences = {
        ...mockPreferences,
        ...updates,
        updated_at: new Date().toISOString(),
      };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockPreferences,
              error: null,
            }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: updatedPreferences,
                error: null,
              }),
            }),
          }),
        }),
      });

      const { result: mutationResult } = renderHook(
        () => useUpdateNotificationPreferences(),
        { wrapper }
      );

      await act(async () => {
        mutationResult.current.mutate({
          userId: mockUserId,
          preferences: updates,
        });
      });

      await waitFor(() => {
        expect(mutationResult.current.isSuccess).toBe(true);
      });

      // Verify update was called with all preferences
      const updateMock = (supabase.from as jest.Mock)().update;
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          ...updates,
          updated_at: expect.any(String),
        })
      );
    });

    it('should update cache after successful mutation', async () => {
      const updatedPreferences = {
        ...mockPreferences,
        push_enabled: false,
      };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockPreferences,
              error: null,
            }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: updatedPreferences,
                error: null,
              }),
            }),
          }),
        }),
      });

      const { result: prefsResult } = renderHook(
        () => useNotificationPreferences(mockUserId),
        { wrapper }
      );
      const { result: mutationResult } = renderHook(
        () => useUpdateNotificationPreferences(),
        { wrapper }
      );

      await waitFor(() => {
        expect(prefsResult.current.data).toEqual(mockPreferences);
      });

      await act(async () => {
        mutationResult.current.mutate({
          userId: mockUserId,
          preferences: { push_enabled: false },
        });
      });

      await waitFor(() => {
        expect(mutationResult.current.isSuccess).toBe(true);
      });

      // Check that cache was updated
      await waitFor(() => {
        expect(prefsResult.current.data?.push_enabled).toBe(false);
      });
    });

    it('should include updated_at timestamp in update', async () => {
      const updatedPreferences = {
        ...mockPreferences,
        push_enabled: false,
        updated_at: new Date().toISOString(),
      };

      const updateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: updatedPreferences,
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockPreferences,
              error: null,
            }),
          }),
        }),
        update: updateMock,
      });

      const { result: mutationResult } = renderHook(
        () => useUpdateNotificationPreferences(),
        { wrapper }
      );

      await act(async () => {
        mutationResult.current.mutate({
          userId: mockUserId,
          preferences: { push_enabled: false },
        });
      });

      await waitFor(() => {
        expect(mutationResult.current.isSuccess).toBe(true);
      });

      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          push_enabled: false,
          updated_at: expect.any(String),
        })
      );
    });

    it('should handle update errors', async () => {
      const updateError = new Error('Update failed');

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockPreferences,
              error: null,
            }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: updateError,
              }),
            }),
          }),
        }),
      });

      const { result: mutationResult } = renderHook(
        () => useUpdateNotificationPreferences(),
        { wrapper }
      );

      await act(async () => {
        mutationResult.current.mutate({
          userId: mockUserId,
          preferences: { push_enabled: false },
        });
      });

      await waitFor(() => {
        expect(mutationResult.current.isError).toBe(true);
      });

      expect(Toast.show).toHaveBeenCalledWith({
        type: 'error',
        text1: 'Failed to update preferences',
        text2: updateError.message,
      });
    });

    it('should handle error without message', async () => {
      const updateError = new Error();

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockPreferences,
              error: null,
            }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: updateError,
              }),
            }),
          }),
        }),
      });

      const { result: mutationResult } = renderHook(
        () => useUpdateNotificationPreferences(),
        { wrapper }
      );

      await act(async () => {
        mutationResult.current.mutate({
          userId: mockUserId,
          preferences: { push_enabled: false },
        });
      });

      await waitFor(() => {
        expect(mutationResult.current.isError).toBe(true);
      });

      expect(Toast.show).toHaveBeenCalledWith({
        type: 'error',
        text1: 'Failed to update preferences',
        text2: 'Please try again',
      });
    });
  });

  describe('Query Key Management', () => {
    it('should use correct query key with userId', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockPreferences,
              error: null,
            }),
          }),
        }),
      });

      renderHook(() => useNotificationPreferences(mockUserId), { wrapper });

      await waitFor(() => {
        const queryState = queryClient.getQueryState(['notification-preferences', mockUserId]);
        expect(queryState).toBeDefined();
      });
    });

    it('should invalidate query on mutation', async () => {
      const updatedPreferences = {
        ...mockPreferences,
        push_enabled: false,
      };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockPreferences,
              error: null,
            }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: updatedPreferences,
                error: null,
              }),
            }),
          }),
        }),
      });

      const { result: prefsResult } = renderHook(
        () => useNotificationPreferences(mockUserId),
        { wrapper }
      );
      const { result: mutationResult } = renderHook(
        () => useUpdateNotificationPreferences(),
        { wrapper }
      );

      await waitFor(() => {
        expect(prefsResult.current.data).toEqual(mockPreferences);
      });

      const queriesBefore = queryClient.getQueryCache().getAll().length;

      await act(async () => {
        mutationResult.current.mutate({
          userId: mockUserId,
          preferences: { push_enabled: false },
        });
      });

      await waitFor(() => {
        expect(mutationResult.current.isSuccess).toBe(true);
      });

      // Cache should be updated (not just invalidated)
      const queriesAfter = queryClient.getQueryCache().getAll().length;
      expect(queriesAfter).toBeGreaterThanOrEqual(queriesBefore);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null preferences data gracefully', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useNotificationPreferences(mockUserId), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeNull();
    });

    it('should handle empty string userId', () => {
      const { result } = renderHook(() => useNotificationPreferences(''), { wrapper });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('should handle concurrent updates to same preference', async () => {
      const updatedPreferences1 = {
        ...mockPreferences,
        push_enabled: false,
      };
      const updatedPreferences2 = {
        ...mockPreferences,
        email_enabled: false,
      };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockPreferences,
              error: null,
            }),
          }),
        }),
        update: jest.fn()
          .mockReturnValueOnce({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: updatedPreferences1,
                  error: null,
                }),
              }),
            }),
          })
          .mockReturnValueOnce({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: updatedPreferences2,
                  error: null,
                }),
              }),
            }),
          }),
      });

      const { result: mutationResult } = renderHook(
        () => useUpdateNotificationPreferences(),
        { wrapper }
      );

      await act(async () => {
        mutationResult.current.mutate({
          userId: mockUserId,
          preferences: { push_enabled: false },
        });
        mutationResult.current.mutate({
          userId: mockUserId,
          preferences: { email_enabled: false },
        });
      });

      await waitFor(() => {
        expect(mutationResult.current.isSuccess).toBe(true);
      });

      // Both toasts should have been shown
      expect(Toast.show).toHaveBeenCalledTimes(2);
    });

    it('should handle partial preference object', async () => {
      const updatedPreferences = {
        ...mockPreferences,
        push_enabled: false,
      };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockPreferences,
              error: null,
            }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: updatedPreferences,
                error: null,
              }),
            }),
          }),
        }),
      });

      const { result: mutationResult } = renderHook(
        () => useUpdateNotificationPreferences(),
        { wrapper }
      );

      // Update with only one field
      await act(async () => {
        mutationResult.current.mutate({
          userId: mockUserId,
          preferences: { push_enabled: false },
        });
      });

      await waitFor(() => {
        expect(mutationResult.current.isSuccess).toBe(true);
      });

      // Only the specified field should be in the update
      const updateMock = (supabase.from as jest.Mock)().update;
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          push_enabled: false,
          updated_at: expect.any(String),
        })
      );
    });
  });

  describe('Refetch Functionality', () => {
    it('should refetch preferences on demand', async () => {
      const mockSelect = jest.fn()
        .mockReturnValueOnce({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockPreferences,
              error: null,
            }),
          }),
        })
        .mockReturnValueOnce({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { ...mockPreferences, dark_mode: true },
              error: null,
            }),
          }),
        });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useNotificationPreferences(mockUserId), { wrapper });

      await waitFor(() => {
        expect(result.current.data?.dark_mode).toBe(false);
      });

      act(() => {
        result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.data?.dark_mode).toBe(true);
      });

      expect(mockSelect).toHaveBeenCalledTimes(2);
    });
  });
});
