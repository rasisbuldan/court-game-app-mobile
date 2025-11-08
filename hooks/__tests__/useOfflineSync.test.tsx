/**
 * useOfflineSync Hook Tests
 *
 * Comprehensive unit tests for offline sync management hook covering:
 * - Queue length tracking and state management
 * - Offline queue initialization and persistence
 * - Automatic syncing when coming online
 * - Manual sync trigger
 * - Sync error handling and recovery
 * - App state change handling (foreground sync)
 * - Network status monitoring
 * - Queue change listeners
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useOfflineSync } from '../useOfflineSync';
import { useNetworkStatus } from '../useNetworkStatus';
import { offlineQueue } from '../../utils/offlineQueue';
import Toast from 'react-native-toast-message';
import { Logger } from '../../utils/logger';

// Mock dependencies
jest.mock('../useNetworkStatus');
jest.mock('../../utils/offlineQueue');
jest.mock('react-native-toast-message');
jest.mock('../../utils/logger', () => ({
  Logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('useOfflineSync Hook', () => {
  let queryClient: QueryClient;
  let mockOfflineQueue: jest.Mocked<typeof offlineQueue>;
  let mockUseNetworkStatus: jest.MockedFunction<typeof useNetworkStatus>;
  let appStateListener: ((state: AppStateStatus) => void) | null = null;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

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

    // Setup offline queue mock
    mockOfflineQueue = offlineQueue as jest.Mocked<typeof offlineQueue>;
    mockOfflineQueue.initialize = jest.fn().mockResolvedValue(undefined);
    mockOfflineQueue.getQueueLength = jest.fn().mockReturnValue(0);
    mockOfflineQueue.processQueue = jest.fn().mockResolvedValue({ success: 0, failed: 0 });
    mockOfflineQueue.onQueueChange = jest.fn().mockReturnValue(jest.fn());

    // Setup network status mock - default to online
    mockUseNetworkStatus = useNetworkStatus as jest.MockedFunction<typeof useNetworkStatus>;
    mockUseNetworkStatus.mockReturnValue({
      isConnected: true,
      isInternetReachable: true,
      isOnline: true,
    });

    // Setup AppState spy to capture listener
    appStateListener = null;
    jest.spyOn(AppState, 'addEventListener').mockImplementation((event: any, listener: any) => {
      if (event === 'change') {
        appStateListener = listener;
      }
      return {
        remove: jest.fn(),
      };
    });
  });

  afterEach(() => {
    queryClient.clear();
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('Initialization', () => {
    it('should initialize offline queue on mount', async () => {
      renderHook(() => useOfflineSync(), { wrapper });

      await waitFor(() => {
        expect(mockOfflineQueue.initialize).toHaveBeenCalled();
      });
    });

    it('should get initial queue length after initialization', async () => {
      mockOfflineQueue.getQueueLength.mockReturnValue(3);

      const { result } = renderHook(() => useOfflineSync(), { wrapper });

      await waitFor(() => {
        expect(result.current.queueLength).toBe(3);
      });

      expect(mockOfflineQueue.getQueueLength).toHaveBeenCalled();
    });

    it('should setup queue change listener', async () => {
      renderHook(() => useOfflineSync(), { wrapper });

      await waitFor(() => {
        expect(mockOfflineQueue.onQueueChange).toHaveBeenCalled();
      });
    });

    it('should cleanup queue change listener on unmount', async () => {
      const unsubscribe = jest.fn();
      mockOfflineQueue.onQueueChange.mockReturnValue(unsubscribe);

      const { unmount } = renderHook(() => useOfflineSync(), { wrapper });

      await waitFor(() => {
        expect(mockOfflineQueue.onQueueChange).toHaveBeenCalled();
      });

      unmount();

      expect(unsubscribe).toHaveBeenCalled();
    });
  });

  describe('Queue Length Tracking', () => {
    it('should update queue length when queue changes', async () => {
      let queueChangeCallback: (() => void) | null = null;
      mockOfflineQueue.onQueueChange.mockImplementation((callback) => {
        queueChangeCallback = callback;
        return jest.fn();
      });

      mockOfflineQueue.getQueueLength
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(2);

      const { result } = renderHook(() => useOfflineSync(), { wrapper });

      await waitFor(() => {
        expect(result.current.queueLength).toBe(0);
      });

      // Trigger queue change
      act(() => {
        queueChangeCallback!();
      });

      await waitFor(() => {
        expect(result.current.queueLength).toBe(2);
      });
    });

    it('should track hasUnsynced based on queue length', async () => {
      let queueChangeCallback: (() => void) | null = null;
      mockOfflineQueue.onQueueChange.mockImplementation((callback) => {
        queueChangeCallback = callback;
        return jest.fn();
      });

      mockOfflineQueue.getQueueLength.mockReturnValue(0);

      const { result } = renderHook(() => useOfflineSync(), { wrapper });

      await waitFor(() => {
        expect(result.current.hasUnsynced).toBe(false);
      });

      // Change queue length and trigger callback
      mockOfflineQueue.getQueueLength.mockReturnValue(5);

      act(() => {
        queueChangeCallback!();
      });

      await waitFor(() => {
        expect(result.current.hasUnsynced).toBe(true);
      });
    });
  });

  describe('Online Status', () => {
    it('should reflect network online status', async () => {
      mockUseNetworkStatus.mockReturnValue({
        isConnected: true,
        isInternetReachable: true,
        isOnline: true,
      });

      const { result } = renderHook(() => useOfflineSync(), { wrapper });

      expect(result.current.isOnline).toBe(true);
    });

    it('should reflect network offline status', async () => {
      mockUseNetworkStatus.mockReturnValue({
        isConnected: false,
        isInternetReachable: false,
        isOnline: false,
      });

      const { result } = renderHook(() => useOfflineSync(), { wrapper });

      expect(result.current.isOnline).toBe(false);
    });
  });

  describe('Automatic Syncing', () => {
    it('should auto-sync when coming online with queued items', async () => {
      mockOfflineQueue.getQueueLength.mockReturnValue(3);
      mockOfflineQueue.processQueue.mockResolvedValue({ success: 3, failed: 0 });

      // Start offline
      mockUseNetworkStatus.mockReturnValue({
        isConnected: false,
        isInternetReachable: false,
        isOnline: false,
      });

      const { result, rerender } = renderHook(() => useOfflineSync(), { wrapper });

      await waitFor(() => {
        expect(result.current.queueLength).toBe(3);
      });

      // Come online
      mockUseNetworkStatus.mockReturnValue({
        isConnected: true,
        isInternetReachable: true,
        isOnline: true,
      });

      rerender();

      // Wait for the 1 second delay
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(mockOfflineQueue.processQueue).toHaveBeenCalled();
      });
    });

    it('should not auto-sync when coming online with empty queue', async () => {
      mockOfflineQueue.getQueueLength.mockReturnValue(0);

      // Start offline
      mockUseNetworkStatus.mockReturnValue({
        isConnected: false,
        isInternetReachable: false,
        isOnline: false,
      });

      const { rerender } = renderHook(() => useOfflineSync(), { wrapper });

      // Come online
      mockUseNetworkStatus.mockReturnValue({
        isConnected: true,
        isInternetReachable: true,
        isOnline: true,
      });

      rerender();

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(mockOfflineQueue.processQueue).not.toHaveBeenCalled();
      });
    });

    it('should not auto-sync when already syncing', async () => {
      mockOfflineQueue.getQueueLength.mockReturnValue(3);

      // Make processQueue hang to keep isSyncing true
      let resolveProcessQueue: () => void;
      const processQueuePromise = new Promise<{ success: number; failed: number }>((resolve) => {
        resolveProcessQueue = () => resolve({ success: 3, failed: 0 });
      });
      mockOfflineQueue.processQueue.mockReturnValue(processQueuePromise);

      // Start offline with items
      mockUseNetworkStatus.mockReturnValue({
        isConnected: false,
        isInternetReachable: false,
        isOnline: false,
      });

      const { rerender } = renderHook(() => useOfflineSync(), { wrapper });

      await waitFor(() => {
        expect(mockOfflineQueue.initialize).toHaveBeenCalled();
      });

      // Come online (triggers first sync)
      mockUseNetworkStatus.mockReturnValue({
        isConnected: true,
        isInternetReachable: true,
        isOnline: true,
      });

      rerender();

      await act(async () => {
        jest.advanceTimersByTime(1000);
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(mockOfflineQueue.processQueue).toHaveBeenCalledTimes(1);
      });

      // Try to trigger another sync while first is still running
      rerender();

      await act(async () => {
        jest.advanceTimersByTime(1000);
        await Promise.resolve();
      });

      // Should not call processQueue again
      expect(mockOfflineQueue.processQueue).toHaveBeenCalledTimes(1);

      // Complete the first sync
      await act(async () => {
        resolveProcessQueue!();
        await Promise.resolve();
      });
    });

    it('should delay auto-sync by 1 second after coming online', async () => {
      mockOfflineQueue.getQueueLength.mockReturnValue(2);
      mockOfflineQueue.processQueue.mockResolvedValue({ success: 2, failed: 0 });

      // Start offline
      mockUseNetworkStatus.mockReturnValue({
        isConnected: false,
        isInternetReachable: false,
        isOnline: false,
      });

      const { rerender } = renderHook(() => useOfflineSync(), { wrapper });

      await waitFor(() => {
        expect(mockOfflineQueue.initialize).toHaveBeenCalled();
      });

      // Come online
      mockUseNetworkStatus.mockReturnValue({
        isConnected: true,
        isInternetReachable: true,
        isOnline: true,
      });

      rerender();

      // Should not sync immediately
      expect(mockOfflineQueue.processQueue).not.toHaveBeenCalled();

      // Advance by 500ms - still shouldn't sync
      await act(async () => {
        jest.advanceTimersByTime(500);
        await Promise.resolve();
      });

      expect(mockOfflineQueue.processQueue).not.toHaveBeenCalled();

      // Advance by another 500ms to reach 1 second
      await act(async () => {
        jest.advanceTimersByTime(500);
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(mockOfflineQueue.processQueue).toHaveBeenCalled();
      });
    });

    it('should cleanup timer on unmount', async () => {
      mockOfflineQueue.getQueueLength.mockReturnValue(2);

      // Start offline
      mockUseNetworkStatus.mockReturnValue({
        isConnected: false,
        isInternetReachable: false,
        isOnline: false,
      });

      const { rerender, unmount } = renderHook(() => useOfflineSync(), { wrapper });

      // Come online
      mockUseNetworkStatus.mockReturnValue({
        isConnected: true,
        isInternetReachable: true,
        isOnline: true,
      });

      rerender();

      // Unmount before timer fires
      unmount();

      // Advance time
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Should not call processQueue after unmount
      expect(mockOfflineQueue.processQueue).not.toHaveBeenCalled();
    });
  });

  describe('Manual Sync', () => {
    it('should trigger sync manually', async () => {
      mockOfflineQueue.getQueueLength.mockReturnValue(3);
      mockOfflineQueue.processQueue.mockResolvedValue({ success: 3, failed: 0 });

      const { result } = renderHook(() => useOfflineSync(), { wrapper });

      await waitFor(() => {
        expect(result.current.queueLength).toBe(3);
      });

      await act(async () => {
        await result.current.manualSync();
      });

      expect(mockOfflineQueue.processQueue).toHaveBeenCalled();
    });

    it('should not sync manually when offline', async () => {
      mockOfflineQueue.getQueueLength.mockReturnValue(3);
      mockUseNetworkStatus.mockReturnValue({
        isConnected: false,
        isInternetReachable: false,
        isOnline: false,
      });

      const { result } = renderHook(() => useOfflineSync(), { wrapper });

      await act(async () => {
        await result.current.manualSync();
      });

      expect(mockOfflineQueue.processQueue).not.toHaveBeenCalled();
    });

    it('should not sync manually when queue is empty', async () => {
      mockOfflineQueue.getQueueLength.mockReturnValue(0);

      const { result } = renderHook(() => useOfflineSync(), { wrapper });

      await act(async () => {
        await result.current.manualSync();
      });

      expect(mockOfflineQueue.processQueue).not.toHaveBeenCalled();
    });

    it('should not sync manually when already syncing', async () => {
      mockOfflineQueue.getQueueLength.mockReturnValue(3);

      let resolveProcessQueue: () => void;
      const processQueuePromise = new Promise<{ success: number; failed: number }>((resolve) => {
        resolveProcessQueue = () => resolve({ success: 3, failed: 0 });
      });
      mockOfflineQueue.processQueue.mockReturnValue(processQueuePromise);

      const { result } = renderHook(() => useOfflineSync(), { wrapper });

      await waitFor(() => {
        expect(mockOfflineQueue.initialize).toHaveBeenCalled();
      });

      // Start first sync
      await act(async () => {
        result.current.manualSync();
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(result.current.isSyncing).toBe(true);
      });

      // Try to start second sync
      await act(async () => {
        await result.current.manualSync();
      });

      // Should only call once
      expect(mockOfflineQueue.processQueue).toHaveBeenCalledTimes(1);

      // Complete the sync
      await act(async () => {
        resolveProcessQueue!();
        await Promise.resolve();
      });
    });

    it('should update isSyncing state during sync', async () => {
      mockOfflineQueue.getQueueLength.mockReturnValue(2);

      let resolveProcessQueue: () => void;
      const processQueuePromise = new Promise<{ success: number; failed: number }>((resolve) => {
        resolveProcessQueue = () => resolve({ success: 2, failed: 0 });
      });
      mockOfflineQueue.processQueue.mockReturnValue(processQueuePromise);

      const { result } = renderHook(() => useOfflineSync(), { wrapper });

      await waitFor(() => {
        expect(mockOfflineQueue.initialize).toHaveBeenCalled();
      });

      expect(result.current.isSyncing).toBe(false);

      await act(async () => {
        result.current.manualSync();
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(result.current.isSyncing).toBe(true);
      });

      await act(async () => {
        resolveProcessQueue!();
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(result.current.isSyncing).toBe(false);
      });
    });
  });

  describe('Sync Success Handling', () => {
    it('should show success toast for successful operations', async () => {
      mockOfflineQueue.getQueueLength.mockReturnValue(5);
      mockOfflineQueue.processQueue.mockResolvedValue({ success: 5, failed: 0 });

      const { result } = renderHook(() => useOfflineSync(), { wrapper });

      await act(async () => {
        await result.current.manualSync();
      });

      await waitFor(() => {
        expect(Toast.show).toHaveBeenCalledWith({
          type: 'success',
          text1: 'Synced!',
          text2: '5 operation(s) synced successfully',
          visibilityTime: 2000,
        });
      });
    });

    it('should log success info', async () => {
      mockOfflineQueue.getQueueLength.mockReturnValue(3);
      mockOfflineQueue.processQueue.mockResolvedValue({ success: 3, failed: 0 });

      const { result } = renderHook(() => useOfflineSync(), { wrapper });

      await act(async () => {
        await result.current.manualSync();
      });

      await waitFor(() => {
        expect(Logger.info).toHaveBeenCalledWith(
          'Offline sync completed successfully',
          expect.objectContaining({
            action: 'processOfflineQueue',
            metadata: expect.objectContaining({
              successCount: 3,
              failedCount: 0,
            }),
          })
        );
      });
    });

    it('should not show toast when no operations were synced', async () => {
      mockOfflineQueue.getQueueLength.mockReturnValue(0);
      mockOfflineQueue.processQueue.mockResolvedValue({ success: 0, failed: 0 });

      const { result } = renderHook(() => useOfflineSync(), { wrapper });

      await act(async () => {
        await result.current.manualSync();
      });

      expect(Toast.show).not.toHaveBeenCalled();
    });
  });

  describe('Sync Error Handling', () => {
    it('should show error toast for failed operations', async () => {
      mockOfflineQueue.getQueueLength.mockReturnValue(5);
      mockOfflineQueue.processQueue.mockResolvedValue({ success: 3, failed: 2 });

      const { result } = renderHook(() => useOfflineSync(), { wrapper });

      await act(async () => {
        await result.current.manualSync();
      });

      await waitFor(() => {
        expect(Toast.show).toHaveBeenCalledWith({
          type: 'error',
          text1: 'Sync Failed',
          text2: '2 operation(s) could not be synced',
        });
      });
    });

    it('should log warning for partial failures', async () => {
      mockOfflineQueue.getQueueLength.mockReturnValue(5);
      mockOfflineQueue.processQueue.mockResolvedValue({ success: 3, failed: 2 });

      const { result } = renderHook(() => useOfflineSync(), { wrapper });

      await act(async () => {
        await result.current.manualSync();
      });

      await waitFor(() => {
        expect(Logger.warn).toHaveBeenCalledWith(
          'Offline sync completed with failures',
          expect.objectContaining({
            action: 'processOfflineQueue',
            metadata: expect.objectContaining({
              successCount: 3,
              failedCount: 2,
            }),
          })
        );
      });
    });

    it('should handle processQueue exceptions gracefully', async () => {
      mockOfflineQueue.getQueueLength.mockReturnValue(3);
      const error = new Error('Network error');
      mockOfflineQueue.processQueue.mockRejectedValue(error);

      const { result } = renderHook(() => useOfflineSync(), { wrapper });

      await act(async () => {
        await result.current.manualSync();
      });

      await waitFor(() => {
        expect(Logger.error).toHaveBeenCalledWith(
          'Failed to process offline queue',
          error,
          expect.objectContaining({
            action: 'processQueue',
            queueLength: 3,
          })
        );
      });

      // Should reset syncing state
      expect(result.current.isSyncing).toBe(false);
    });

    it('should reset isSyncing state after error', async () => {
      mockOfflineQueue.getQueueLength.mockReturnValue(2);
      mockOfflineQueue.processQueue.mockRejectedValue(new Error('Sync failed'));

      const { result } = renderHook(() => useOfflineSync(), { wrapper });

      await act(async () => {
        await result.current.manualSync();
      });

      await waitFor(() => {
        expect(result.current.isSyncing).toBe(false);
      });
    });
  });

  describe('App State Change Handling', () => {
    it('should setup AppState listener on mount', async () => {
      renderHook(() => useOfflineSync(), { wrapper });

      await waitFor(() => {
        expect(AppState.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
      });
    });

    it('should cleanup AppState listener on unmount', async () => {
      const removeListener = jest.fn();
      jest.spyOn(AppState, 'addEventListener').mockReturnValue({
        remove: removeListener,
      });

      const { unmount } = renderHook(() => useOfflineSync(), { wrapper });

      await waitFor(() => {
        expect(AppState.addEventListener).toHaveBeenCalled();
      });

      unmount();

      expect(removeListener).toHaveBeenCalled();
    });

    it('should sync when app comes to foreground with queued items', async () => {
      mockOfflineQueue.getQueueLength.mockReturnValue(3);
      mockOfflineQueue.processQueue.mockResolvedValue({ success: 3, failed: 0 });

      renderHook(() => useOfflineSync(), { wrapper });

      await waitFor(() => {
        expect(appStateListener).not.toBeNull();
      });

      // Simulate app coming to foreground
      await act(async () => {
        appStateListener!('active');
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(mockOfflineQueue.processQueue).toHaveBeenCalled();
      });
    });

    it('should not sync on foreground if offline', async () => {
      mockOfflineQueue.getQueueLength.mockReturnValue(3);
      mockUseNetworkStatus.mockReturnValue({
        isConnected: false,
        isInternetReachable: false,
        isOnline: false,
      });

      renderHook(() => useOfflineSync(), { wrapper });

      await waitFor(() => {
        expect(appStateListener).not.toBeNull();
      });

      act(() => {
        appStateListener!('active');
      });

      await waitFor(() => {
        expect(mockOfflineQueue.processQueue).not.toHaveBeenCalled();
      });
    });

    it('should not sync on foreground if queue is empty', async () => {
      mockOfflineQueue.getQueueLength.mockReturnValue(0);

      renderHook(() => useOfflineSync(), { wrapper });

      await waitFor(() => {
        expect(appStateListener).not.toBeNull();
      });

      act(() => {
        appStateListener!('active');
      });

      await waitFor(() => {
        expect(mockOfflineQueue.processQueue).not.toHaveBeenCalled();
      });
    });

    it('should not sync when app goes to background', async () => {
      mockOfflineQueue.getQueueLength.mockReturnValue(3);

      renderHook(() => useOfflineSync(), { wrapper });

      await waitFor(() => {
        expect(appStateListener).not.toBeNull();
      });

      act(() => {
        appStateListener!('background');
      });

      await waitFor(() => {
        expect(mockOfflineQueue.processQueue).not.toHaveBeenCalled();
      });
    });

    it('should not sync when app becomes inactive', async () => {
      mockOfflineQueue.getQueueLength.mockReturnValue(3);

      renderHook(() => useOfflineSync(), { wrapper });

      await waitFor(() => {
        expect(appStateListener).not.toBeNull();
      });

      act(() => {
        appStateListener!('inactive');
      });

      await waitFor(() => {
        expect(mockOfflineQueue.processQueue).not.toHaveBeenCalled();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle queue changing from empty to having items', async () => {
      let queueChangeCallback: (() => void) | null = null;
      mockOfflineQueue.onQueueChange.mockImplementation((callback) => {
        queueChangeCallback = callback;
        return jest.fn();
      });

      mockOfflineQueue.getQueueLength.mockReturnValue(0);

      const { result } = renderHook(() => useOfflineSync(), { wrapper });

      await waitFor(() => {
        expect(result.current.queueLength).toBe(0);
        expect(result.current.hasUnsynced).toBe(false);
      });

      // Add items to queue
      mockOfflineQueue.getQueueLength.mockReturnValue(2);

      act(() => {
        queueChangeCallback!();
      });

      await waitFor(() => {
        expect(result.current.queueLength).toBe(2);
        expect(result.current.hasUnsynced).toBe(true);
      });
    });

    it('should handle rapid network changes', async () => {
      mockOfflineQueue.getQueueLength.mockReturnValue(3);
      mockOfflineQueue.processQueue.mockResolvedValue({ success: 3, failed: 0 });

      // Start offline
      mockUseNetworkStatus.mockReturnValue({
        isConnected: false,
        isInternetReachable: false,
        isOnline: false,
      });

      const { rerender } = renderHook(() => useOfflineSync(), { wrapper });

      await waitFor(() => {
        expect(mockOfflineQueue.initialize).toHaveBeenCalled();
      });

      // Come online
      mockUseNetworkStatus.mockReturnValue({
        isConnected: true,
        isInternetReachable: true,
        isOnline: true,
      });

      rerender();

      // Go offline immediately
      mockUseNetworkStatus.mockReturnValue({
        isConnected: false,
        isInternetReachable: false,
        isOnline: false,
      });

      rerender();

      // Come online again
      mockUseNetworkStatus.mockReturnValue({
        isConnected: true,
        isInternetReachable: true,
        isOnline: true,
      });

      rerender();

      // Should only process once after all changes settle
      await act(async () => {
        jest.advanceTimersByTime(1000);
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(mockOfflineQueue.processQueue).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle sync interruption by going offline', async () => {
      mockOfflineQueue.getQueueLength.mockReturnValue(5);

      let resolveProcessQueue: () => void;
      const processQueuePromise = new Promise<{ success: number; failed: number }>((resolve) => {
        resolveProcessQueue = () => resolve({ success: 3, failed: 2 });
      });
      mockOfflineQueue.processQueue.mockReturnValue(processQueuePromise);

      // Start online
      mockUseNetworkStatus.mockReturnValue({
        isConnected: true,
        isInternetReachable: true,
        isOnline: true,
      });

      const { result, rerender } = renderHook(() => useOfflineSync(), { wrapper });

      await waitFor(() => {
        expect(mockOfflineQueue.initialize).toHaveBeenCalled();
      });

      // Trigger sync
      await act(async () => {
        result.current.manualSync();
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(result.current.isSyncing).toBe(true);
      });

      // Go offline while syncing
      mockUseNetworkStatus.mockReturnValue({
        isConnected: false,
        isInternetReachable: false,
        isOnline: false,
      });

      rerender();

      // Complete the sync
      await act(async () => {
        resolveProcessQueue!();
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(result.current.isSyncing).toBe(false);
      });

      // Should still show the results
      expect(Toast.show).toHaveBeenCalled();
    });

    it('should handle multiple queue changes during sync', async () => {
      let queueChangeCallback: (() => void) | null = null;
      mockOfflineQueue.onQueueChange.mockImplementation((callback) => {
        queueChangeCallback = callback;
        return jest.fn();
      });

      mockOfflineQueue.getQueueLength
        .mockReturnValueOnce(3)
        .mockReturnValueOnce(2)
        .mockReturnValueOnce(0);

      let resolveProcessQueue: () => void;
      const processQueuePromise = new Promise<{ success: number; failed: number }>((resolve) => {
        resolveProcessQueue = () => resolve({ success: 3, failed: 0 });
      });
      mockOfflineQueue.processQueue.mockReturnValue(processQueuePromise);

      const { result } = renderHook(() => useOfflineSync(), { wrapper });

      await waitFor(() => {
        expect(result.current.queueLength).toBe(3);
      });

      // Start sync
      act(() => {
        result.current.manualSync();
      });

      // Queue changes during sync
      act(() => {
        queueChangeCallback!();
      });

      await waitFor(() => {
        expect(result.current.queueLength).toBe(2);
      });

      // Complete sync
      act(() => {
        resolveProcessQueue!();
      });

      // Final queue update
      act(() => {
        queueChangeCallback!();
      });

      await waitFor(() => {
        expect(result.current.queueLength).toBe(0);
      });
    });
  });

  describe('Logging', () => {
    it('should log when sync starts', async () => {
      let queueChangeCallback: (() => void) | null = null;
      mockOfflineQueue.onQueueChange.mockImplementation((callback) => {
        queueChangeCallback = callback;
        return jest.fn();
      });

      mockOfflineQueue.getQueueLength.mockReturnValue(5);
      mockOfflineQueue.processQueue.mockResolvedValue({ success: 5, failed: 0 });

      const { result } = renderHook(() => useOfflineSync(), { wrapper });

      await waitFor(() => {
        expect(mockOfflineQueue.initialize).toHaveBeenCalled();
      });

      // Trigger queue update to set queueLength
      act(() => {
        queueChangeCallback!();
      });

      await waitFor(() => {
        expect(result.current.queueLength).toBe(5);
      });

      await act(async () => {
        await result.current.manualSync();
      });

      expect(Logger.info).toHaveBeenCalledWith(
        'Offline sync started',
        expect.objectContaining({
          action: 'processOfflineQueue',
          metadata: expect.objectContaining({
            queueLength: 5,
            isOnline: true,
          }),
        })
      );
    });

    it('should log total operations processed', async () => {
      let queueChangeCallback: (() => void) | null = null;
      mockOfflineQueue.onQueueChange.mockImplementation((callback) => {
        queueChangeCallback = callback;
        return jest.fn();
      });

      mockOfflineQueue.getQueueLength.mockReturnValue(7);
      mockOfflineQueue.processQueue.mockResolvedValue({ success: 5, failed: 2 });

      const { result } = renderHook(() => useOfflineSync(), { wrapper });

      await waitFor(() => {
        expect(mockOfflineQueue.initialize).toHaveBeenCalled();
      });

      // Trigger queue update to set queueLength
      act(() => {
        queueChangeCallback!();
      });

      await waitFor(() => {
        expect(result.current.queueLength).toBe(7);
      });

      await act(async () => {
        await result.current.manualSync();
      });

      expect(Logger.info).toHaveBeenCalledWith(
        'Offline sync completed successfully',
        expect.objectContaining({
          metadata: expect.objectContaining({
            totalOperations: 7,
          }),
        })
      );
    });
  });
});
