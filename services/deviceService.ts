/**
 * Device Service - Stable Device Fingerprinting & 3-Device Limit Enforcement
 *
 * Prevents account sharing by limiting users to 3 active devices.
 * Uses stable identifiers that survive OS updates:
 * - iOS: IDFV (identifierForVendor)
 * - Android: AndroidId
 */

import * as Application from 'expo-application';
import * as Crypto from 'expo-crypto';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from '../config/supabase';
import { Logger } from '../utils/logger';

// ============================================================================
// Types
// ============================================================================

export interface DeviceInfo {
  id: string;
  device_fingerprint: string;
  device_name: string;
  device_model: string;
  platform: 'ios' | 'android';
  os_version: string;
  last_active_at: string;
  created_at: string;
  is_active: boolean;
}

export interface DeviceCheckResult {
  status: 'OK' | 'LIMIT_EXCEEDED';
  activeDeviceCount: number;
  devices?: DeviceInfo[];
  currentDeviceRegistered?: boolean;
}

export class DeviceLimitError extends Error {
  devices: DeviceInfo[];

  constructor(message: string, devices: DeviceInfo[]) {
    super(message);
    this.name = 'DeviceLimitError';
    this.devices = devices;
  }
}

// ============================================================================
// Device Fingerprinting
// ============================================================================

/**
 * Generate stable device fingerprint that survives OS updates
 * Uses IDFV on iOS, AndroidId on Android
 */
export async function getDeviceFingerprint(): Promise<string> {
  try {
    const platform = Platform.OS as 'ios' | 'android';

    // Get stable vendor-specific ID
    let vendorId: string | null = null;

    if (platform === 'ios') {
      vendorId = await Application.getIosIdForVendorAsync();
    } else if (platform === 'android') {
      vendorId = await Application.getAndroidId();
    }

    if (!vendorId) {
      throw new Error('Failed to get device vendor ID');
    }

    // Create stable hash (SHA256)
    // This fingerprint will NOT change on OS updates
    const fingerprint = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${platform}-${vendorId}`
    );

    return fingerprint;
  } catch (error) {
    Logger.error('Error generating device fingerprint', error as Error, { action: 'generateDeviceFingerprint' });
    throw new Error('Failed to generate device fingerprint');
  }
}

/**
 * Get current device metadata for display purposes
 */
export function getDeviceMetadata(): {
  model: string;
  platform: 'ios' | 'android';
  osVersion: string;
  defaultName: string;
} {
  const platform = Platform.OS as 'ios' | 'android';
  const model = Device.modelName || 'Unknown Device';
  const osVersion = Device.osVersion || 'Unknown';

  // Generate a friendly default name
  const defaultName = `${model}`;

  return {
    model,
    platform,
    osVersion,
    defaultName,
  };
}

// ============================================================================
// Device Registration & Limit Checking
// ============================================================================

/**
 * Check if user has reached the 3-device limit
 * Returns device list if limit is exceeded
 */
export async function checkDeviceLimit(userId: string): Promise<DeviceCheckResult> {
  try {
    const currentFingerprint = await getDeviceFingerprint();

    // Get all active devices for this user
    const { data: devices, error } = await supabase
      .from('user_devices')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('last_active_at', { ascending: false });

    if (error) throw error;

    const activeDeviceCount = devices?.length || 0;
    const currentDeviceRegistered = devices?.some(
      (d) => d.device_fingerprint === currentFingerprint
    );

    // Check if current device is already registered
    if (currentDeviceRegistered) {
      return {
        status: 'OK',
        activeDeviceCount,
        currentDeviceRegistered: true,
      };
    }

    // Check if limit is exceeded
    if (activeDeviceCount >= 3) {
      return {
        status: 'LIMIT_EXCEEDED',
        activeDeviceCount,
        devices: devices || [],
        currentDeviceRegistered: false,
      };
    }

    // User has space for new device
    return {
      status: 'OK',
      activeDeviceCount,
      currentDeviceRegistered: false,
    };
  } catch (error) {
    Logger.error('Error checking device limit', error as Error, { action: 'checkDeviceLimit', userId });
    throw error;
  }
}

/**
 * Register current device for the user
 * Auto-generates device name based on model
 */
export async function registerCurrentDevice(userId: string): Promise<DeviceInfo> {
  try {
    const fingerprint = await getDeviceFingerprint();
    const metadata = getDeviceMetadata();

    // Check if device already exists (upsert pattern)
    const { data: existingDevice } = await supabase
      .from('user_devices')
      .select('*')
      .eq('user_id', userId)
      .eq('device_fingerprint', fingerprint)
      .single();

    if (existingDevice) {
      // Update last_active_at and metadata
      const { data, error } = await supabase
        .from('user_devices')
        .update({
          last_active_at: new Date().toISOString(),
          os_version: metadata.osVersion,
          is_active: true, // Reactivate if was inactive
        })
        .eq('id', existingDevice.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    // Insert new device
    const { data, error } = await supabase
      .from('user_devices')
      .insert({
        user_id: userId,
        device_fingerprint: fingerprint,
        device_name: metadata.defaultName,
        device_model: metadata.model,
        platform: metadata.platform,
        os_version: metadata.osVersion,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    Logger.error('Error registering device', error as Error, { action: 'registerDevice', userId });
    throw error;
  }
}

/**
 * Update device last active timestamp
 * Call this periodically (e.g., on app launch)
 */
export async function updateDeviceActivity(userId: string): Promise<void> {
  try {
    const fingerprint = await getDeviceFingerprint();

    await supabase
      .from('user_devices')
      .update({ last_active_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('device_fingerprint', fingerprint);
  } catch (error) {
    Logger.error('Error updating device activity', error as Error, { action: 'updateDeviceActivity', userId });
    // Non-critical error, don't throw
  }
}

// ============================================================================
// Device Management (User Actions)
// ============================================================================

/**
 * Get all active devices for the current user
 */
export async function getUserDevices(userId: string): Promise<DeviceInfo[]> {
  try {
    const { data, error } = await supabase
      .from('user_devices')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('last_active_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    Logger.error('Error fetching user devices', error as Error, { action: 'getUserDevices', userId });
    throw error;
  }
}

/**
 * Check if device is the current device
 */
export async function isCurrentDevice(deviceFingerprint: string): Promise<boolean> {
  try {
    const currentFingerprint = await getDeviceFingerprint();
    return deviceFingerprint === currentFingerprint;
  } catch (error) {
    Logger.error('Error checking current device', error as Error, { action: 'isCurrentDevice', userId });
    return false;
  }
}

/**
 * Remove a device (mark as inactive)
 * This will trigger automatic sign-out on that device
 *
 * @param deviceId - The device ID to remove
 * @param userId - The user ID (for security check)
 */
export async function removeDevice(deviceId: string, userId: string): Promise<void> {
  try {
    // Mark device as inactive
    const { error } = await supabase
      .from('user_devices')
      .update({ is_active: false })
      .eq('id', deviceId)
      .eq('user_id', userId); // Security: ensure user owns this device

    if (error) throw error;

    // Note: The removed device will be signed out automatically
    // when it tries to make an API call and the RLS policy blocks it
    // or when the auth state listener detects the device is inactive
  } catch (error) {
    Logger.error('Error removing device', error as Error, { action: 'removeDevice', userId, deviceId });
    throw error;
  }
}

/**
 * Update device name (user-editable)
 */
export async function updateDeviceName(
  deviceId: string,
  userId: string,
  newName: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_devices')
      .update({ device_name: newName.trim() })
      .eq('id', deviceId)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    Logger.error('Error updating device name', error as Error, { action: 'updateDeviceName', userId, deviceId });
    throw error;
  }
}

// ============================================================================
// Device Session Validation (Call on App Launch)
// ============================================================================

/**
 * Validate that current device is still active
 * Throw error if device was removed (triggers sign-out)
 */
export async function validateDeviceSession(userId: string): Promise<boolean> {
  try {
    const fingerprint = await getDeviceFingerprint();

    const { data, error } = await supabase
      .from('user_devices')
      .select('is_active')
      .eq('user_id', userId)
      .eq('device_fingerprint', fingerprint)
      .single();

    if (error || !data) {
      // Device not found - was removed
      return false;
    }

    if (!data.is_active) {
      // Device was deactivated
      return false;
    }

    // Device is still active
    return true;
  } catch (error) {
    Logger.error('Error validating device session', error as Error, { action: 'validateDeviceSession', userId });
    return false;
  }
}
