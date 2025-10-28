import { View, Text, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { offlineQueue } from '../../utils/offlineQueue';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react-native';

export function OfflineIndicator() {
  const { isOnline } = useNetworkStatus();
  const [hasUnsynced, setHasUnsynced] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'failed'>('idle');

  useEffect(() => {
    // Initialize offline queue
    offlineQueue.initialize();

    // Check initial state
    setHasUnsynced(offlineQueue.hasUnsynced());

    // Listen to queue changes
    const unsubscribeQueue = offlineQueue.onQueueChange(() => {
      setHasUnsynced(offlineQueue.hasUnsynced());
    });

    // Listen to sync status changes
    const unsubscribeSync = offlineQueue.onSyncStatusChange((status) => {
      setSyncStatus(status);

      // Reset to idle after showing synced status
      if (status === 'synced') {
        setTimeout(() => {
          setSyncStatus('idle');
        }, 3000);
      }
    });

    return () => {
      unsubscribeQueue();
      unsubscribeSync();
      offlineQueue.cleanup();
    };
  }, []);

  // Show syncing indicator
  if (syncStatus === 'syncing') {
    return (
      <View style={{
        position: 'absolute',
        top: 60,
        left: 16,
        right: 16,
        zIndex: 1000,
      }}>
        <View style={{
          backgroundColor: 'rgba(59, 130, 246, 0.95)',
          borderWidth: 1,
          borderColor: 'rgba(147, 197, 253, 0.5)',
          borderRadius: 16,
          paddingVertical: 10,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 8,
        }}>
          <ActivityIndicator size="small" color="#FFFFFF" />
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF', flex: 1 }}>
            Syncing changes...
          </Text>
        </View>
      </View>
    );
  }

  // Show synced indicator
  if (syncStatus === 'synced') {
    return (
      <View style={{
        position: 'absolute',
        top: 60,
        left: 16,
        right: 16,
        zIndex: 1000,
      }}>
        <View style={{
          backgroundColor: 'rgba(34, 197, 94, 0.95)',
          borderWidth: 1,
          borderColor: 'rgba(134, 239, 172, 0.5)',
          borderRadius: 16,
          paddingVertical: 10,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 8,
        }}>
          <CheckCircle2 color="#FFFFFF" size={18} strokeWidth={2.5} />
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF', flex: 1 }}>
            All changes synced!
          </Text>
        </View>
      </View>
    );
  }

  // Show offline mode indicator
  if (!isOnline && hasUnsynced) {
    return (
      <View style={{
        position: 'absolute',
        top: 60,
        left: 16,
        right: 16,
        zIndex: 1000,
      }}>
        <View style={{
          backgroundColor: 'rgba(239, 68, 68, 0.95)',
          borderWidth: 1,
          borderColor: 'rgba(252, 165, 165, 0.5)',
          borderRadius: 16,
          paddingVertical: 10,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 8,
        }}>
          <WifiOff color="#FFFFFF" size={18} strokeWidth={2.5} />
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF', flex: 1 }}>
            Offline Mode • {offlineQueue.getQueueLength()} unsynced
          </Text>
        </View>
      </View>
    );
  }

  // Show just offline indicator (no unsynced data)
  if (!isOnline) {
    return (
      <View style={{
        position: 'absolute',
        top: 60,
        left: 16,
        right: 16,
        zIndex: 1000,
      }}>
        <View style={{
          backgroundColor: 'rgba(107, 114, 128, 0.95)',
          borderWidth: 1,
          borderColor: 'rgba(209, 213, 219, 0.5)',
          borderRadius: 16,
          paddingVertical: 10,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 8,
        }}>
          <WifiOff color="#FFFFFF" size={18} strokeWidth={2.5} />
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF', flex: 1 }}>
            Offline Mode
          </Text>
        </View>
      </View>
    );
  }

  return null;
}
