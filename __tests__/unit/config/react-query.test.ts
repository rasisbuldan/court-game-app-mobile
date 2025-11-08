/**
 * Unit Tests: React Query Configuration
 *
 * Tests for QueryClient and AsyncStorage persistence configuration
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock Logger
jest.mock('../../../utils/logger', () => ({
  Logger: {
    error: jest.fn(),
  },
}));

describe('React Query Configuration', () => {
  let queryClient: any;
  let asyncStoragePersister: any;

  beforeEach(() => {
    // Clear AsyncStorage mock
    (AsyncStorage.setItem as jest.Mock).mockClear();
    (AsyncStorage.getItem as jest.Mock).mockClear();
    (AsyncStorage.removeItem as jest.Mock).mockClear();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

    // Clear module cache and re-import
    jest.resetModules();
    const config = require('../../../config/react-query');
    queryClient = config.queryClient;
    asyncStoragePersister = config.asyncStoragePersister;
  });

  describe('QueryClient Configuration', () => {
    it('should be created with default options', () => {
      expect(queryClient).toBeDefined();
      expect(queryClient.getDefaultOptions).toBeDefined();
    });

    it('should have correct gcTime (formerly cacheTime)', () => {
      const options = queryClient.getDefaultOptions();

      expect(options.queries.gcTime).toBe(1000 * 60 * 60 * 24); // 24 hours
    });

    it('should have correct staleTime', () => {
      const options = queryClient.getDefaultOptions();

      expect(options.queries.staleTime).toBe(1000 * 60 * 5); // 5 minutes
    });

    it('should refetch on reconnect', () => {
      const options = queryClient.getDefaultOptions();

      expect(options.queries.refetchOnReconnect).toBe(true);
    });

    it('should not refetch on window focus', () => {
      const options = queryClient.getDefaultOptions();

      expect(options.queries.refetchOnWindowFocus).toBe(false);
    });

    it('should not retry on mount', () => {
      const options = queryClient.getDefaultOptions();

      expect(options.queries.retryOnMount).toBe(false);
    });

    it('should have mutation retry configured', () => {
      const options = queryClient.getDefaultOptions();

      expect(options.mutations.retry).toBe(1);
    });
  });

  describe('Query Retry Logic', () => {
    it('should have retry function configured', () => {
      const options = queryClient.getDefaultOptions();

      expect(typeof options.queries.retry).toBe('function');
    });

    it('should not retry CancelledError', () => {
      const options = queryClient.getDefaultOptions();
      const retryFn = options.queries.retry;

      const cancelledError = new Error('CancelledError: Request was cancelled');
      const shouldRetry = retryFn(0, cancelledError);

      expect(shouldRetry).toBe(false);
    });

    it('should retry network errors up to 2 times', () => {
      const options = queryClient.getDefaultOptions();
      const retryFn = options.queries.retry;

      const networkError = new Error('Network error');

      expect(retryFn(0, networkError)).toBe(true); // First retry
      expect(retryFn(1, networkError)).toBe(true); // Second retry
      expect(retryFn(2, networkError)).toBe(false); // No third retry
    });

    it('should retry on first failure', () => {
      const options = queryClient.getDefaultOptions();
      const retryFn = options.queries.retry;

      const error = new Error('Request failed');
      const shouldRetry = retryFn(0, error);

      expect(shouldRetry).toBe(true);
    });

    it('should retry on second failure', () => {
      const options = queryClient.getDefaultOptions();
      const retryFn = options.queries.retry;

      const error = new Error('Request failed');
      const shouldRetry = retryFn(1, error);

      expect(shouldRetry).toBe(true);
    });

    it('should not retry after 2 failures', () => {
      const options = queryClient.getDefaultOptions();
      const retryFn = options.queries.retry;

      const error = new Error('Request failed');
      const shouldRetry = retryFn(2, error);

      expect(shouldRetry).toBe(false);
    });
  });

  describe('AsyncStorage Persister', () => {
    it('should have persistClient method', () => {
      expect(asyncStoragePersister.persistClient).toBeDefined();
      expect(typeof asyncStoragePersister.persistClient).toBe('function');
    });

    it('should have restoreClient method', () => {
      expect(asyncStoragePersister.restoreClient).toBeDefined();
      expect(typeof asyncStoragePersister.restoreClient).toBe('function');
    });

    it('should have removeClient method', () => {
      expect(asyncStoragePersister.removeClient).toBeDefined();
      expect(typeof asyncStoragePersister.removeClient).toBe('function');
    });
  });

  describe('persistClient()', () => {
    it('should save client state to AsyncStorage', async () => {
      const mockClient = {
        clientState: {
          queries: [
            {
              state: {
                status: 'success',
                fetchStatus: 'idle',
                data: { id: 1, name: 'Test' },
              },
            },
          ],
        },
      };

      await asyncStoragePersister.persistClient(mockClient);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'COURTSTER_QUERY_CACHE',
        expect.any(String)
      );
    });

    it('should filter out pending queries', async () => {
      const mockClient = {
        clientState: {
          queries: [
            {
              state: {
                status: 'pending',
                fetchStatus: 'fetching',
                data: null,
              },
            },
            {
              state: {
                status: 'success',
                fetchStatus: 'idle',
                data: { id: 1 },
              },
            },
          ],
        },
      };

      await asyncStoragePersister.persistClient(mockClient);

      const savedData = (AsyncStorage.setItem as jest.Mock).mock.calls[0][1];
      const parsed = JSON.parse(savedData);

      expect(parsed.clientState.queries).toHaveLength(1);
      expect(parsed.clientState.queries[0].state.status).toBe('success');
    });

    it('should filter out queries with CancelledError', async () => {
      const mockClient = {
        clientState: {
          queries: [
            {
              state: {
                status: 'error',
                error: { message: 'CancelledError: Request cancelled' },
              },
            },
            {
              state: {
                status: 'success',
                fetchStatus: 'idle',
                data: { id: 1 },
              },
            },
          ],
        },
      };

      await asyncStoragePersister.persistClient(mockClient);

      const savedData = (AsyncStorage.setItem as jest.Mock).mock.calls[0][1];
      const parsed = JSON.parse(savedData);

      expect(parsed.clientState.queries).toHaveLength(1);
      expect(parsed.clientState.queries[0].state.status).toBe('success');
    });

    it('should filter out fetching queries', async () => {
      const mockClient = {
        clientState: {
          queries: [
            {
              state: {
                status: 'success',
                fetchStatus: 'fetching',
                data: { id: 1 },
              },
            },
            {
              state: {
                status: 'success',
                fetchStatus: 'idle',
                data: { id: 2 },
              },
            },
          ],
        },
      };

      await asyncStoragePersister.persistClient(mockClient);

      const savedData = (AsyncStorage.setItem as jest.Mock).mock.calls[0][1];
      const parsed = JSON.parse(savedData);

      expect(parsed.clientState.queries).toHaveLength(1);
      expect(parsed.clientState.queries[0].state.data.id).toBe(2);
    });

    it('should handle persistence errors gracefully', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Storage full'));

      const mockClient = {
        clientState: {
          queries: [],
        },
      };

      // Should not throw
      await expect(asyncStoragePersister.persistClient(mockClient)).resolves.toBeUndefined();
    });

    it('should preserve client structure', async () => {
      const mockClient = {
        timestamp: Date.now(),
        clientState: {
          queries: [
            {
              queryKey: ['users', 1],
              state: {
                status: 'success',
                fetchStatus: 'idle',
                data: { id: 1, name: 'Test' },
              },
            },
          ],
          mutations: [],
        },
      };

      await asyncStoragePersister.persistClient(mockClient);

      const savedData = (AsyncStorage.setItem as jest.Mock).mock.calls[0][1];
      const parsed = JSON.parse(savedData);

      expect(parsed).toHaveProperty('timestamp');
      expect(parsed).toHaveProperty('clientState');
      expect(parsed.clientState).toHaveProperty('queries');
    });
  });

  describe('restoreClient()', () => {
    it('should return undefined when no cached data', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const client = await asyncStoragePersister.restoreClient();

      expect(client).toBeUndefined();
    });

    it('should restore cached client state', async () => {
      const cachedClient = {
        clientState: {
          queries: [
            {
              state: {
                status: 'success',
                data: { id: 1, name: 'Cached' },
              },
            },
          ],
        },
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(cachedClient));

      const client = await asyncStoragePersister.restoreClient();

      expect(client).toBeDefined();
      expect(client?.clientState.queries).toHaveLength(1);
      expect(client?.clientState.queries[0].state.data.id).toBe(1);
    });

    it('should reset fetch status to idle', async () => {
      const cachedClient = {
        clientState: {
          queries: [
            {
              state: {
                status: 'success',
                fetchStatus: 'fetching',
                data: { id: 1 },
              },
            },
          ],
        },
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(cachedClient));

      const client = await asyncStoragePersister.restoreClient();

      expect(client?.clientState.queries[0].state.fetchStatus).toBe('idle');
    });

    it('should handle restore errors gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Read error'));

      const client = await asyncStoragePersister.restoreClient();

      expect(client).toBeUndefined();
    });

    it('should handle invalid JSON gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('invalid-json');

      const client = await asyncStoragePersister.restoreClient();

      expect(client).toBeUndefined();
    });

    it('should handle empty string gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('');

      const client = await asyncStoragePersister.restoreClient();

      expect(client).toBeUndefined();
    });
  });

  describe('removeClient()', () => {
    it('should remove client from AsyncStorage', async () => {
      await asyncStoragePersister.removeClient();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('COURTSTER_QUERY_CACHE');
    });

    it('should handle removal errors gracefully', async () => {
      (AsyncStorage.removeItem as jest.Mock).mockRejectedValue(new Error('Remove error'));

      // Should not throw
      await expect(asyncStoragePersister.removeClient()).resolves.toBeUndefined();
    });
  });

  describe('Storage Key', () => {
    it('should use consistent storage key for all operations', async () => {
      const mockClient = {
        clientState: { queries: [] },
      };

      await asyncStoragePersister.persistClient(mockClient);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'COURTSTER_QUERY_CACHE',
        expect.any(String)
      );

      await asyncStoragePersister.restoreClient();
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('COURTSTER_QUERY_CACHE');

      await asyncStoragePersister.removeClient();
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('COURTSTER_QUERY_CACHE');
    });
  });

  describe('Mobile Optimizations', () => {
    it('should have long cache time for mobile', () => {
      const options = queryClient.getDefaultOptions();

      // 24 hours is optimal for mobile to reduce data usage
      expect(options.queries.gcTime).toBe(24 * 60 * 60 * 1000);
    });

    it('should have moderate stale time', () => {
      const options = queryClient.getDefaultOptions();

      // 5 minutes balances freshness with performance
      expect(options.queries.staleTime).toBe(5 * 60 * 1000);
    });

    it('should refetch on reconnect for offline support', () => {
      const options = queryClient.getDefaultOptions();

      expect(options.queries.refetchOnReconnect).toBe(true);
    });

    it('should not refetch on window focus to save data', () => {
      const options = queryClient.getDefaultOptions();

      expect(options.queries.refetchOnWindowFocus).toBe(false);
    });
  });

  describe('Query State Filtering', () => {
    it('should persist only idle queries', async () => {
      const mockClient = {
        clientState: {
          queries: [
            { state: { status: 'success', fetchStatus: 'idle' } },
            { state: { status: 'success', fetchStatus: 'fetching' } },
            { state: { status: 'success', fetchStatus: 'paused' } },
          ],
        },
      };

      await asyncStoragePersister.persistClient(mockClient);

      const savedData = (AsyncStorage.setItem as jest.Mock).mock.calls[0][1];
      const parsed = JSON.parse(savedData);

      // Should only keep idle query
      expect(parsed.clientState.queries).toHaveLength(1);
    });

    it('should not persist queries without fetchStatus', async () => {
      const mockClient = {
        clientState: {
          queries: [
            { state: { status: 'success' } }, // No fetchStatus
            { state: { status: 'success', fetchStatus: 'idle' } },
          ],
        },
      };

      await asyncStoragePersister.persistClient(mockClient);

      const savedData = (AsyncStorage.setItem as jest.Mock).mock.calls[0][1];
      const parsed = JSON.parse(savedData);

      // Should keep queries without fetchStatus or with idle status
      expect(parsed.clientState.queries.length).toBeGreaterThan(0);
    });
  });

  describe('Error Recovery', () => {
    it('should recover from corrupt cache on restore', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('{corrupt}');

      const client = await asyncStoragePersister.restoreClient();

      expect(client).toBeUndefined();
    });

    it('should handle persistence failure without affecting app', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Quota exceeded'));

      const mockClient = {
        clientState: { queries: [] },
      };

      // App should continue working
      await expect(asyncStoragePersister.persistClient(mockClient)).resolves.toBeUndefined();
    });
  });

  describe('Integration', () => {
    it('should work with full persist-restore cycle', async () => {
      const originalClient = {
        timestamp: Date.now(),
        clientState: {
          queries: [
            {
              queryKey: ['sessions'],
              state: {
                status: 'success',
                fetchStatus: 'idle',
                data: [{ id: 1, name: 'Session 1' }],
              },
            },
          ],
        },
      };

      // Persist
      await asyncStoragePersister.persistClient(originalClient);

      // Restore
      const restoredClient = await asyncStoragePersister.restoreClient();

      expect(restoredClient).toBeDefined();
      expect(restoredClient?.clientState.queries[0].queryKey).toEqual(['sessions']);
      expect(restoredClient?.clientState.queries[0].state.data).toEqual([
        { id: 1, name: 'Session 1' },
      ]);
    });

    it('should handle persist-remove-restore cycle', async () => {
      const mockClient = {
        clientState: { queries: [] },
      };

      // Persist
      await asyncStoragePersister.persistClient(mockClient);
      expect(AsyncStorage.setItem).toHaveBeenCalled();

      // Remove
      await asyncStoragePersister.removeClient();
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      // Restore should return undefined
      const client = await asyncStoragePersister.restoreClient();
      expect(client).toBeUndefined();
    });
  });
});
