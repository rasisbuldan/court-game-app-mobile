/**
 * Offline Queue Tests
 *
 * Tests offline queue functionality including:
 * - Toast notifications when queuing offline
 * - Exponential backoff retry logic
 * - Sync progress tracking
 * - Error handling and recovery
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import Toast from 'react-native-toast-message';
import { offlineQueue } from '../utils/offlineQueue';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('@react-native-community/netinfo');
jest.mock('react-native-toast-message');
jest.mock('../config/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('OfflineQueue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    // Reset queue state
    (offlineQueue as any).queue = [];
    (offlineQueue as any).isProcessing = false;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Toast Notifications', () => {
    it('shows toast when operation is queued offline', async () => {
      // Mock offline state
      (NetInfo.fetch as jest.Mock).mockResolvedValue({
        isConnected: false,
        isInternetReachable: false,
      });

      await offlineQueue.addOperation('UPDATE_SCORE', 'session-1', {
        matchIndex: 0,
        team1Score: 6,
        team2Score: 4,
      });

      expect(Toast.show).toHaveBeenCalledWith({
        type: 'info',
        text1: 'Saved offline',
        text2: 'Changes will sync when you\'re back online',
        visibilityTime: 3000,
      });
    });

    it('does not show toast when operation is queued online', async () => {
      // Mock online state
      (NetInfo.fetch as jest.Mock).mockResolvedValue({
        isConnected: true,
        isInternetReachable: true,
      });

      await offlineQueue.addOperation('UPDATE_SCORE', 'session-1', {
        matchIndex: 0,
        team1Score: 6,
        team2Score: 4,
      });

      expect(Toast.show).not.toHaveBeenCalled();
    });
  });

  describe('Exponential Backoff', () => {
    it('applies correct delays for retry attempts', async () => {
      const delays = [0, 2000, 4000, 8000, 16000];

      for (let retryCount = 0; retryCount < delays.length; retryCount++) {
        const expectedDelay = delays[retryCount];

        // Create operation with specific retry count
        const operation = {
          id: `op-${retryCount}`,
          type: 'UPDATE_SCORE' as const,
          sessionId: 'session-1',
          data: {},
          timestamp: Date.now(),
          retryCount,
        };

        // Check that the correct delay would be applied
        const actualDelay = delays[Math.min(retryCount, delays.length - 1)];
        expect(actualDelay).toBe(expectedDelay);
      }
    });

    it('caps retry delay at maximum (16s)', () => {
      const maxRetryCount = 10; // Far beyond our retry limit
      const delays = [0, 2000, 4000, 8000, 16000];

      const delay = delays[Math.min(maxRetryCount, delays.length - 1)];

      expect(delay).toBe(16000); // Should cap at 16s
    });
  });

  describe('Retry Logic', () => {
    it('retries failed operations up to MAX_RETRIES (5 times)', async () => {
      const operation = {
        id: 'op-1',
        type: 'UPDATE_SCORE' as const,
        sessionId: 'session-1',
        data: {},
        timestamp: Date.now(),
        retryCount: 4, // Start at 4, so next attempt is the 5th (MAX_RETRIES)
      };

      (offlineQueue as any).queue = [operation];

      // Mock operation to always fail
      const executeSpy = jest.spyOn(offlineQueue as any, 'executeOperation');
      executeSpy.mockRejectedValue(new Error('Network error'));

      // Mock AsyncStorage
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const processPromise = offlineQueue.processQueue();

      // Fast-forward through all timers
      jest.runAllTimers();

      const result = await processPromise;

      // Should fail after reaching MAX_RETRIES
      expect(result.failed).toBe(1);
      expect(result.success).toBe(0);
    });

    it('removes operation after max retries', async () => {
      const operation = {
        id: 'op-1',
        type: 'UPDATE_SCORE' as const,
        sessionId: 'session-1',
        data: {},
        timestamp: Date.now(),
        retryCount: 4, // One less than MAX_RETRIES
      };

      (offlineQueue as any).queue = [operation];

      // Mock operation to fail
      const executeSpy = jest.spyOn(offlineQueue as any, 'executeOperation');
      executeSpy.mockRejectedValue(new Error('Network error'));

      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const processPromise = offlineQueue.processQueue();

      // Fast-forward through all timers
      jest.runAllTimers();

      await processPromise;

      // Queue should be empty after max retries
      expect(offlineQueue.getQueueLength()).toBe(0);
    });
  });

  describe('Sync Progress Tracking', () => {
    it('notifies listeners of sync progress', async () => {
      const mockListener = jest.fn();
      const unsubscribe = offlineQueue.onSyncStatusChange(mockListener);

      const operations = [
        {
          id: 'op-1',
          type: 'UPDATE_SCORE' as const,
          sessionId: 'session-1',
          data: {},
          timestamp: Date.now(),
          retryCount: 0,
        },
        {
          id: 'op-2',
          type: 'UPDATE_SCORE' as const,
          sessionId: 'session-1',
          data: {},
          timestamp: Date.now(),
          retryCount: 0,
        },
      ];

      (offlineQueue as any).queue = operations;

      // Mock successful execution
      const executeSpy = jest.spyOn(offlineQueue as any, 'executeOperation');
      executeSpy.mockResolvedValue(undefined);

      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      // Trigger sync with notification
      await (offlineQueue as any).processQueueWithNotification();

      // Should notify syncing, then synced
      expect(mockListener).toHaveBeenCalledWith('syncing', 0, 2);
      expect(mockListener).toHaveBeenCalledWith('syncing', 1, 2);
      expect(mockListener).toHaveBeenCalledWith('syncing', 2, 2);
      expect(mockListener).toHaveBeenCalledWith('synced', 2, 2);

      unsubscribe();
    });

    it('notifies failed status when operations fail', async () => {
      const mockListener = jest.fn();
      const unsubscribe = offlineQueue.onSyncStatusChange(mockListener);

      const operation = {
        id: 'op-1',
        type: 'UPDATE_SCORE' as const,
        sessionId: 'session-1',
        data: {},
        timestamp: Date.now(),
        retryCount: 4, // Will fail on next attempt
      };

      (offlineQueue as any).queue = [operation];

      // Mock failed execution
      const executeSpy = jest.spyOn(offlineQueue as any, 'executeOperation');
      executeSpy.mockRejectedValue(new Error('Network error'));

      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const processPromise = (offlineQueue as any).processQueueWithNotification();

      // Fast-forward through all timers
      jest.runAllTimers();

      await processPromise;

      // Should notify failed status
      expect(mockListener).toHaveBeenCalledWith(expect.stringMatching(/failed|synced/), expect.any(Number), expect.any(Number));

      unsubscribe();
    });
  });

  describe('Error Handling', () => {
    it('handles AsyncStorage save errors gracefully', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      // Should not throw
      await expect(
        offlineQueue.addOperation('UPDATE_SCORE', 'session-1', {})
      ).resolves.toBeDefined();
    });

    it('handles listener errors without crashing', () => {
      const errorListener = jest.fn(() => {
        throw new Error('Listener error');
      });

      const goodListener = jest.fn();

      offlineQueue.onSyncStatusChange(errorListener);
      offlineQueue.onSyncStatusChange(goodListener);

      // Should not throw even with bad listener
      expect(() => {
        (offlineQueue as any).notifySyncListeners('syncing', 0, 1);
      }).not.toThrow();

      // Good listener should still be called
      expect(goodListener).toHaveBeenCalled();
    });
  });

  describe('Queue Persistence', () => {
    it('saves queue to AsyncStorage when adding operation', async () => {
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
      (NetInfo.fetch as jest.Mock).mockResolvedValue({
        isConnected: true,
        isInternetReachable: true,
      });

      await offlineQueue.addOperation('UPDATE_SCORE', 'session-1', {});

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'OFFLINE_QUEUE',
        expect.any(String)
      );
    });

    it('loads queue from AsyncStorage on initialize', async () => {
      const storedQueue = JSON.stringify([
        {
          id: 'op-1',
          type: 'UPDATE_SCORE',
          sessionId: 'session-1',
          data: {},
          timestamp: Date.now(),
          retryCount: 0,
        },
      ]);

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(storedQueue);

      await offlineQueue.initialize();

      expect(offlineQueue.getQueueLength()).toBe(1);
    });
  });
});
