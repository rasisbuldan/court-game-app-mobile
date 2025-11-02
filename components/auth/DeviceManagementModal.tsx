/**
 * Device Management Modal
 *
 * Shown when user tries to sign in on a 4th device.
 * User must remove one of their 3 registered devices to continue.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { formatDistanceToNow } from 'date-fns';
import Toast from 'react-native-toast-message';
import { DeviceInfo, removeDevice } from '../../services/deviceService';

interface DeviceManagementModalProps {
  visible: boolean;
  devices: DeviceInfo[];
  userId: string;
  onDeviceRemoved: () => void;
  onCancel: () => void;
}

export function DeviceManagementModal({
  visible,
  devices,
  userId,
  onDeviceRemoved,
  onCancel,
}: DeviceManagementModalProps) {
  const [removingDeviceId, setRemovingDeviceId] = useState<string | null>(null);

  const handleRemoveDevice = async (device: DeviceInfo) => {
    Alert.alert(
      'Remove Device',
      `Are you sure you want to remove "${device.device_name}"?\n\nThis device will be signed out immediately.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setRemovingDeviceId(device.id);

            try {
              await removeDevice(device.id, userId);

              Toast.show({
                type: 'success',
                text1: 'Device Removed',
                text2: `${device.device_name} has been signed out`,
              });

              // Notify parent to retry registration
              onDeviceRemoved();
            } catch (error) {
              console.error('Error removing device:', error);
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to remove device. Please try again.',
              });
            } finally {
              setRemovingDeviceId(null);
            }
          },
        },
      ]
    );
  };

  const getDeviceIcon = (platform: string) => {
    return platform === 'ios' ? '📱' : '📱';
  };

  const formatLastActive = (lastActiveAt: string) => {
    try {
      return formatDistanceToNow(new Date(lastActiveAt), { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View className="flex-1 bg-black/50 justify-center items-center px-6">
        <View className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
          {/* Header */}
          <View className="bg-red-50 px-6 py-5 border-b border-red-100">
            <Text className="text-xl font-bold text-gray-900 mb-2">
              Device Limit Reached
            </Text>
            <Text className="text-sm text-gray-600">
              You can only use Courtster on 3 devices. Remove a device to continue signing in.
            </Text>
          </View>

          {/* Device List */}
          <ScrollView
            className="max-h-96"
            showsVerticalScrollIndicator={false}
          >
            <View className="px-6 py-4">
              <Text className="text-xs font-semibold text-gray-500 uppercase mb-3">
                Active Devices (3/3)
              </Text>

              {devices.map((device, index) => (
                <View
                  key={device.id}
                  className={`border border-gray-200 rounded-lg p-4 ${
                    index < devices.length - 1 ? 'mb-3' : ''
                  }`}
                >
                  <View className="flex-row items-start">
                    <Text className="text-2xl mr-3">
                      {getDeviceIcon(device.platform)}
                    </Text>

                    <View className="flex-1">
                      <Text className="text-base font-semibold text-gray-900 mb-1">
                        {device.device_name}
                      </Text>

                      <Text className="text-sm text-gray-600 mb-2">
                        {device.platform === 'ios' ? 'iOS' : 'Android'} {device.os_version}
                      </Text>

                      <Text className="text-xs text-gray-500">
                        Last active {formatLastActive(device.last_active_at)}
                      </Text>
                    </View>
                  </View>

                  {/* Remove Button */}
                  <TouchableOpacity
                    className={`mt-4 py-2.5 px-4 rounded-lg border ${
                      removingDeviceId === device.id
                        ? 'bg-gray-100 border-gray-300'
                        : 'bg-red-50 border-red-200'
                    }`}
                    onPress={() => handleRemoveDevice(device)}
                    disabled={removingDeviceId === device.id}
                  >
                    {removingDeviceId === device.id ? (
                      <View className="flex-row items-center justify-center">
                        <ActivityIndicator size="small" color="#EF4444" />
                        <Text className="text-sm font-medium text-red-600 ml-2">
                          Removing...
                        </Text>
                      </View>
                    ) : (
                      <Text className="text-sm font-semibold text-red-600 text-center">
                        Remove Device
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Footer */}
          <View className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <TouchableOpacity
              className="py-3 px-4 rounded-lg border border-gray-300 bg-white"
              onPress={onCancel}
              disabled={removingDeviceId !== null}
            >
              <Text className="text-sm font-semibold text-gray-700 text-center">
                Cancel Sign In
              </Text>
            </TouchableOpacity>

            <Text className="text-xs text-gray-500 text-center mt-3">
              Removed devices will be signed out immediately
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}
