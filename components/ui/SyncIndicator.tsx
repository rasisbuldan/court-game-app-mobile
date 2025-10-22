import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react-native';
import { useOfflineSync } from '../../hooks/useOfflineSync';

export function SyncIndicator() {
  const { hasUnsynced, queueLength, isSyncing, isOnline, manualSync } = useOfflineSync();

  if (!hasUnsynced && isOnline) {
    return null; // Don't show anything when synced and online
  }

  return (
    <View className="bg-white border-b border-gray-200 px-6 py-2">
      <TouchableOpacity
        className={`flex-row items-center gap-2 rounded-lg px-3 py-2 ${
          hasUnsynced ? 'bg-yellow-50' : isOnline ? 'bg-green-50' : 'bg-red-50'
        }`}
        onPress={isOnline && hasUnsynced ? manualSync : undefined}
        disabled={!isOnline || isSyncing}
      >
        {isSyncing ? (
          <ActivityIndicator size="small" color="#F59E0B" />
        ) : hasUnsynced ? (
          <WifiOff color="#F59E0B" size={16} />
        ) : isOnline ? (
          <Wifi color="#10B981" size={16} />
        ) : (
          <WifiOff color="#EF4444" size={16} />
        )}

        <View className="flex-1">
          {isSyncing ? (
            <Text className="text-sm font-medium text-yellow-900">Syncing changes...</Text>
          ) : hasUnsynced ? (
            <>
              <Text className="text-sm font-medium text-yellow-900">
                {queueLength} {queueLength === 1 ? 'change' : 'changes'} not synced
              </Text>
              {isOnline && (
                <Text className="text-xs text-yellow-700">Tap to sync now</Text>
              )}
            </>
          ) : !isOnline ? (
            <Text className="text-sm font-medium text-red-900">Offline - changes will sync later</Text>
          ) : null}
        </View>

        {isOnline && hasUnsynced && !isSyncing && (
          <RefreshCw color="#F59E0B" size={16} />
        )}
      </TouchableOpacity>
    </View>
  );
}
