import { useEffect, useState, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { offlineQueue } from '../utils/offlineQueue';
import { useNetworkStatus } from './useNetworkStatus';
import Toast from 'react-native-toast-message';
import { Logger } from '../utils/logger';

export function useOfflineSync() {
  const { isOnline } = useNetworkStatus();
  const [queueLength, setQueueLength] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Update queue length when it changes
  useEffect(() => {
    const updateQueueLength = () => {
      setQueueLength(offlineQueue.getQueueLength());
    };

    // Initial load
    offlineQueue.initialize().then(updateQueueLength);

    // Listen for changes
    const unsubscribe = offlineQueue.onQueueChange(updateQueueLength);

    return unsubscribe;
  }, []);

  // Process queue when coming online
  const processQueue = useCallback(async () => {
    if (!isOnline || isSyncing || queueLength === 0) return;

    Logger.info('Offline sync started', {
      action: 'processOfflineQueue',
      metadata: {
        queueLength,
        isOnline,
      },
    });

    setIsSyncing(true);

    try {
      const result = await offlineQueue.processQueue();

      if (result.success > 0) {
        Logger.info('Offline sync completed successfully', {
          action: 'processOfflineQueue',
          metadata: {
            successCount: result.success,
            failedCount: result.failed,
            totalOperations: result.success + result.failed,
          },
        });

        Toast.show({
          type: 'success',
          text1: 'Synced!',
          text2: `${result.success} operation(s) synced successfully`,
          visibilityTime: 2000,
        });
      }

      if (result.failed > 0) {
        Logger.warn('Offline sync completed with failures', {
          action: 'processOfflineQueue',
          metadata: {
            successCount: result.success,
            failedCount: result.failed,
          },
        });

        Toast.show({
          type: 'error',
          text1: 'Sync Failed',
          text2: `${result.failed} operation(s) could not be synced`,
        });
      }
    } catch (error) {
      Logger.error('Failed to process offline queue', error as Error, { action: 'processQueue', queueLength });
    } finally{
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, queueLength]);

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline && queueLength > 0 && !isSyncing) {
      // Delay to avoid immediate sync on network reconnection
      const timer = setTimeout(() => {
        processQueue();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isOnline, queueLength, isSyncing, processQueue]);

  // Sync when app comes to foreground
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && isOnline && queueLength > 0) {
        processQueue();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [isOnline, queueLength, processQueue]);

  return {
    hasUnsynced: queueLength > 0,
    queueLength,
    isSyncing,
    isOnline,
    manualSync: processQueue,
  };
}
