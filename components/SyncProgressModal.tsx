/**
 * Sync Progress Modal
 *
 * Displays sync progress when reconnecting and processing offline queue.
 * Shows detailed progress with operation counts and error handling.
 */

import { useEffect, useState } from 'react';
import { View, Text, Modal, ActivityIndicator } from 'react-native';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react-native';
import { offlineQueue } from '../utils/offlineQueue';

type SyncStatus = 'syncing' | 'synced' | 'failed' | null;

interface SyncProgress {
  current: number;
  total: number;
  status: SyncStatus;
}

export function SyncProgressModal() {
  const [progress, setProgress] = useState<SyncProgress>({
    current: 0,
    total: 0,
    status: null,
  });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Listen to sync status changes
    const unsubscribe = offlineQueue.onSyncStatusChange((status, current, total) => {
      setProgress({ current, total, status });

      if (status === 'syncing') {
        setVisible(true);
      } else if (status === 'synced' || status === 'failed') {
        // Keep modal visible for 2 seconds to show result
        setTimeout(() => {
          setVisible(false);
          setProgress({ current: 0, total: 0, status: null });
        }, 2000);
      }
    });

    return () => unsubscribe();
  }, []);

  if (!visible) {
    return null;
  }

  const { current, total, status } = progress;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
        }}
      >
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 24,
            width: '100%',
            maxWidth: 320,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.15,
            shadowRadius: 16,
            elevation: 12,
          }}
        >
          {/* Icon */}
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            {status === 'syncing' && (
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: '#DBEAFE',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ActivityIndicator size="large" color="#3B82F6" />
              </View>
            )}

            {status === 'synced' && (
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: '#D1FAE5',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircle2 color="#10B981" size={32} strokeWidth={2.5} />
              </View>
            )}

            {status === 'failed' && (
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: '#FEE2E2',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <XCircle color="#DC2626" size={32} strokeWidth={2.5} />
              </View>
            )}
          </View>

          {/* Title */}
          <Text
            style={{
              fontSize: 18,
              fontWeight: '700',
              color: '#111827',
              textAlign: 'center',
              marginBottom: 8,
            }}
          >
            {status === 'syncing' && 'Syncing Data...'}
            {status === 'synced' && 'Sync Complete'}
            {status === 'failed' && 'Sync Failed'}
          </Text>

          {/* Progress */}
          {status === 'syncing' && total > 0 && (
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 14,
                  color: '#6B7280',
                  textAlign: 'center',
                  marginBottom: 12,
                }}
              >
                {current} of {total} operations
              </Text>

              {/* Progress bar */}
              <View
                style={{
                  height: 8,
                  backgroundColor: '#E5E7EB',
                  borderRadius: 4,
                  overflow: 'hidden',
                }}
              >
                <View
                  style={{
                    height: '100%',
                    backgroundColor: '#3B82F6',
                    borderRadius: 4,
                    width: `${(current / total) * 100}%`,
                  }}
                />
              </View>
            </View>
          )}

          {/* Messages */}
          {status === 'synced' && (
            <Text
              style={{
                fontSize: 14,
                color: '#6B7280',
                textAlign: 'center',
              }}
            >
              All changes have been synchronized
            </Text>
          )}

          {status === 'failed' && (
            <View
              style={{
                backgroundColor: '#FEF2F2',
                borderRadius: 8,
                padding: 12,
                flexDirection: 'row',
                gap: 8,
              }}
            >
              <AlertCircle color="#DC2626" size={18} strokeWidth={2.5} />
              <Text
                style={{
                  flex: 1,
                  fontSize: 13,
                  color: '#991B1B',
                  lineHeight: 18,
                }}
              >
                Some operations could not be synced. They will be retried automatically.
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
