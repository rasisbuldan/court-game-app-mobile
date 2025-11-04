/**
 * useSettings Hook Tests
 *
 * Comprehensive unit tests for settings management hook covering:
 * - Settings fetching with authentication
 * - Default settings creation when none exist
 * - Settings updates with optimistic UI
 * - Error handling and rollback
 * - Offline queue integration
 * - Real-time subscriptions
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useSettings } from '../useSettings';
import { useAuth } from '../useAuth';
import { supabase } from '../../config/supabase';
import { Logger } from '../../utils/logger';
import { offlineQueue } from '../../utils/offlineQueue';

// Mock dependencies
jest.mock('../useAuth');
jest.mock('../../config/supabase');
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
    add: jest.fn(),
  },
}));

describe('useSettings Hook', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    app_metadata: {},
    user_metadata: { display_name: 'Test User' },
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  };

  const mockSettings = {
    id: 'settings-1',
    user_id: 'user-123',
    animations_enabled: true,
    notifications_enabled: true,
    theme: 'system' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
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

    // Default auth mock - authenticated user
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      session: { access_token: 'mock-token' },
      loading: false,
    });

    // Mock Supabase channel subscription
    const mockChannel = {
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnValue({
        unsubscribe: jest.fn(),
      }),
      unsubscribe: jest.fn(),
    };
    (supabase.channel as jest.Mock).mockReturnValue(mockChannel);
  });

  afterEach(() => {
    queryClient.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('Settings Fetching', () => {
    it('should fetch existing settings successfully', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockSettings,
              error: null,
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useSettings(), { wrapper });

      // Initially loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.settings).toBeUndefined();

      // Wait for settings to load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.settings).toEqual(mockSettings);
      expect(result.current.error).toBeNull();
      expect(Logger.debug).toHaveBeenCalledWith(
        'useSettings: Fetching settings',
        { userId: 'user-123' }
      );
      expect(Logger.debug).toHaveBeenCalledWith(
        'useSettings: Settings fetched successfully',
        expect.objectContaining({ userId: 'user-123' })
      );
    });

    it('should not fetch when user is not authenticated', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        session: null,
        loading: false,
      });

      const { result } = renderHook(() => useSettings(), { wrapper });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.settings).toBeUndefined();
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('should create default settings when none exist (PGRST116 error)', async () => {
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockSettings,
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

      const { result } = renderHook(() => useSettings(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(Logger.info).toHaveBeenCalledWith(
        'useSettings: Creating default settings',
        expect.objectContaining({
          userId: 'user-123',
          action: 'create_default_settings',
        })
      );

      expect(mockInsert).toHaveBeenCalledWith({
        user_id: 'user-123',
        animations_enabled: true,
        notifications_enabled: true,
        theme: 'system',
      });

      expect(result.current.settings).toEqual(mockSettings);
    });

    it('should handle default settings creation failure', async () => {
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

      const { result } = renderHook(() => useSettings(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(Logger.error).toHaveBeenCalledWith(
        'useSettings: Failed to create default settings',
        createError,
        expect.objectContaining({
          userId: 'user-123',
          action: 'create_default_settings',
        })
      );
    });

    it('should handle fetch errors', async () => {
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

      const { result } = renderHook(() => useSettings(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(Logger.error).toHaveBeenCalledWith(
        'useSettings: Failed to fetch settings',
        fetchError,
        expect.objectContaining({
          userId: 'user-123',
          action: 'fetch_settings',
        })
      );
    });
  });

  describe('Settings Updates', () => {
    beforeEach(async () => {
      // Setup initial settings
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockSettings,
              error: null,
            }),
          }),
        }),
      });
    });

    it('should update settings successfully', async () => {
      const updatedSettings = {
        ...mockSettings,
        animations_enabled: false,
        updated_at: new Date().toISOString(),
      };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockSettings,
              error: null,
            }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: updatedSettings,
                error: null,
              }),
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useSettings(), { wrapper });

      await waitFor(() => {
        expect(result.current.settings).toEqual(mockSettings);
      });

      await act(async () => {
        result.current.updateSettings({ animations_enabled: false });
      });

      // Wait for mutation to complete and settings to update
      await waitFor(() => {
        expect(result.current.isUpdating).toBe(false);
      });

      await waitFor(() => {
        expect(result.current.settings).toEqual(updatedSettings);
      });

      expect(Logger.info).toHaveBeenCalledWith(
        'useSettings: Updating settings',
        expect.objectContaining({
          userId: 'user-123',
          action: 'update_settings',
          metadata: { updates: { animations_enabled: false } },
        })
      );

      expect(Logger.info).toHaveBeenCalledWith(
        'useSettings: Settings updated successfully',
        expect.objectContaining({
          userId: 'user-123',
          action: 'update_settings',
        })
      );
    });

    it('should perform optimistic update', async () => {
      let resolveUpdate: (value: any) => void;
      const updatePromise = new Promise((resolve) => {
        resolveUpdate = resolve;
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockSettings,
              error: null,
            }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockImplementation(() => updatePromise),
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useSettings(), { wrapper });

      await waitFor(() => {
        expect(result.current.settings).toEqual(mockSettings);
      });

      const originalSettings = result.current.settings;

      act(() => {
        result.current.updateSettings({ theme: 'dark' });
      });

      // Check optimistic update applied immediately
      await waitFor(() => {
        expect(result.current.settings?.theme).toBe('dark');
      });

      // Complete the mutation
      act(() => {
        resolveUpdate!({
          data: { ...mockSettings, theme: 'dark' },
          error: null,
        });
      });

      await waitFor(() => {
        expect(result.current.isUpdating).toBe(false);
      });
    });

    it('should rollback on update error', async () => {
      const updateError = new Error('Update failed');

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockSettings,
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

      const { result } = renderHook(() => useSettings(), { wrapper });

      await waitFor(() => {
        expect(result.current.settings).toEqual(mockSettings);
      });

      const originalSettings = result.current.settings;

      act(() => {
        result.current.updateSettings({ theme: 'dark' });
      });

      await waitFor(() => {
        expect(result.current.isUpdating).toBe(false);
      });

      // Settings should be rolled back to original
      expect(result.current.settings).toEqual(originalSettings);

      expect(Logger.error).toHaveBeenCalledWith(
        'useSettings: Failed to update settings',
        updateError,
        expect.objectContaining({
          userId: 'user-123',
          action: 'update_settings',
        })
      );
    });

    it('should add to offline queue on network error', async () => {
      const networkError = new Error('network error - offline');

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockSettings,
              error: null,
            }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: networkError,
              }),
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useSettings(), { wrapper });

      await waitFor(() => {
        expect(result.current.settings).toEqual(mockSettings);
      });

      act(() => {
        result.current.updateSettings({ notifications_enabled: false });
      });

      await waitFor(() => {
        expect(result.current.isUpdating).toBe(false);
      });

      expect(offlineQueue.add).toHaveBeenCalledWith({
        type: 'update',
        table: 'user_settings',
        data: { notifications_enabled: false },
        userId: 'user-123',
      });

      expect(Logger.warn).toHaveBeenCalledWith(
        'useSettings: Added to offline queue',
        expect.objectContaining({
          userId: 'user-123',
          action: 'offline_queue_add',
        })
      );
    });

    it('should update multiple settings at once', async () => {
      const updates = {
        animations_enabled: false,
        notifications_enabled: false,
        theme: 'dark' as const,
      };

      const updatedSettings = {
        ...mockSettings,
        ...updates,
        updated_at: new Date().toISOString(),
      };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockSettings,
              error: null,
            }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: updatedSettings,
                error: null,
              }),
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useSettings(), { wrapper });

      await waitFor(() => {
        expect(result.current.settings).toEqual(mockSettings);
      });

      act(() => {
        result.current.updateSettings(updates);
      });

      await waitFor(() => {
        expect(result.current.isUpdating).toBe(false);
      });

      await waitFor(() => {
        expect(result.current.settings).toMatchObject(updates);
      });
    });
  });

  describe('Real-time Subscriptions', () => {
    it('should set up channel subscription on mount', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockSettings,
              error: null,
            }),
          }),
        }),
      });

      const mockUnsubscribe = jest.fn();
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockReturnValue({
          unsubscribe: mockUnsubscribe,
        }),
        unsubscribe: mockUnsubscribe,
      };
      (supabase.channel as jest.Mock).mockReturnValue(mockChannel);

      renderHook(() => useSettings(), { wrapper });

      await waitFor(() => {
        expect(supabase.channel).toHaveBeenCalledWith('user_settings:user-123');
      });

      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_settings',
          filter: 'user_id=eq.user-123',
        },
        expect.any(Function)
      );

      expect(mockChannel.subscribe).toHaveBeenCalled();
    });

    it('should unsubscribe from channel on unmount', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockSettings,
              error: null,
            }),
          }),
        }),
      });

      const mockUnsubscribe = jest.fn();
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockReturnValue({
          unsubscribe: mockUnsubscribe,
        }),
        unsubscribe: mockUnsubscribe,
      };
      (supabase.channel as jest.Mock).mockReturnValue(mockChannel);

      const { unmount } = renderHook(() => useSettings(), { wrapper });

      await waitFor(() => {
        expect(mockChannel.subscribe).toHaveBeenCalled();
      });

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('should update cache on real-time UPDATE event', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockSettings,
              error: null,
            }),
          }),
        }),
      });

      let realtimeCallback: Function;
      const mockUnsubscribe = jest.fn();
      const mockChannel = {
        on: jest.fn().mockImplementation((event, config, callback) => {
          realtimeCallback = callback;
          return mockChannel;
        }),
        subscribe: jest.fn().mockReturnValue({
          unsubscribe: mockUnsubscribe,
        }),
        unsubscribe: mockUnsubscribe,
      };
      (supabase.channel as jest.Mock).mockReturnValue(mockChannel);

      const { result } = renderHook(() => useSettings(), { wrapper });

      await waitFor(() => {
        expect(result.current.settings).toEqual(mockSettings);
      });

      // Simulate real-time update
      const updatedSettings = { ...mockSettings, theme: 'dark' as const };
      act(() => {
        realtimeCallback!({
          eventType: 'UPDATE',
          new: updatedSettings,
        });
      });

      await waitFor(() => {
        expect(result.current.settings?.theme).toBe('dark');
      });

      expect(Logger.debug).toHaveBeenCalledWith(
        'useSettings: Real-time update received',
        {
          userId: 'user-123',
          event: 'UPDATE',
        }
      );
    });

    it('should update cache on real-time INSERT event', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockSettings,
              error: null,
            }),
          }),
        }),
      });

      let realtimeCallback: Function;
      const mockUnsubscribe = jest.fn();
      const mockChannel = {
        on: jest.fn().mockImplementation((event, config, callback) => {
          realtimeCallback = callback;
          return mockChannel;
        }),
        subscribe: jest.fn().mockReturnValue({
          unsubscribe: mockUnsubscribe,
        }),
        unsubscribe: mockUnsubscribe,
      };
      (supabase.channel as jest.Mock).mockReturnValue(mockChannel);

      const { result } = renderHook(() => useSettings(), { wrapper });

      await waitFor(() => {
        expect(result.current.settings).toEqual(mockSettings);
      });

      // Simulate real-time insert
      const newSettings = { ...mockSettings, id: 'settings-2' };
      act(() => {
        realtimeCallback!({
          eventType: 'INSERT',
          new: newSettings,
        });
      });

      await waitFor(() => {
        expect(result.current.settings?.id).toBe('settings-2');
      });
    });

    it('should not subscribe when user is not authenticated', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        session: null,
        loading: false,
      });

      renderHook(() => useSettings(), { wrapper });

      expect(supabase.channel).not.toHaveBeenCalled();
    });
  });

  describe('Refetch', () => {
    it('should refetch settings on demand', async () => {
      const mockSelect = jest.fn()
        .mockReturnValueOnce({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockSettings,
              error: null,
            }),
          }),
        })
        .mockReturnValueOnce({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { ...mockSettings, theme: 'dark' as const },
              error: null,
            }),
          }),
        });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useSettings(), { wrapper });

      await waitFor(() => {
        expect(result.current.settings?.theme).toBe('system');
      });

      act(() => {
        result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.settings?.theme).toBe('dark');
      });

      expect(mockSelect).toHaveBeenCalledTimes(2);
    });
  });
});
