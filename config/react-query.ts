import { QueryClient } from '@tanstack/react-query';
import type { Persister, PersistedClient } from '@tanstack/react-query-persist-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // React Query options optimized for mobile
      gcTime: 1000 * 60 * 60 * 24, // 24 hours (formerly cacheTime)
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      // Don't retry cancelled queries on mount
      retryOnMount: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

const STORAGE_KEY = 'COURTSTER_QUERY_CACHE';

export const asyncStoragePersister: Persister = {
  persistClient: async (client: PersistedClient) => {
    try {
      // Filter out queries that are in a pending/fetching state
      const filteredClient = {
        ...client,
        clientState: {
          ...client.clientState,
          queries: client.clientState.queries.filter((query: any) => {
            // Only persist queries that are not currently fetching
            return query.state.status !== 'pending' && !query.state.fetchStatus || query.state.fetchStatus === 'idle';
          }),
        },
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filteredClient));
    } catch (error) {
      console.error('Failed to persist query client:', error);
    }
  },
  restoreClient: async () => {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      if (cached) {
        const client = JSON.parse(cached) as PersistedClient;
        // Clear any queries that might have been in a bad state
        if (client.clientState?.queries) {
          client.clientState.queries = client.clientState.queries.map((query: any) => ({
            ...query,
            state: {
              ...query.state,
              // Reset fetch status to prevent cancelled errors
              fetchStatus: 'idle',
            },
          }));
        }
        return client;
      }
      return undefined;
    } catch (error) {
      console.error('Failed to restore query client:', error);
      return undefined;
    }
  },
  removeClient: async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to remove query client:', error);
    }
  },
};
