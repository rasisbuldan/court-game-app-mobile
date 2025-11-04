import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from '../config/supabase';
import { Logger } from '../utils/logger';

/**
 * Notification Types
 */
export enum NotificationType {
  SESSION_INVITE = 'session_invite',
  SESSION_STARTING = 'session_starting',
  ROUND_COMPLETE = 'round_complete',
  CLUB_INVITE = 'club_invite',
  CLUB_ANNOUNCEMENT = 'club_announcement',
  MATCH_REMINDER = 'match_reminder',
  LEADERBOARD_UPDATE = 'leaderboard_update',
}

export interface NotificationData {
  type: NotificationType;
  sessionId?: string;
  clubId?: string;
  roundNumber?: number;
  [key: string]: any;
}

/**
 * Configure how notifications are displayed
 */
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data = notification.request.content.data as NotificationData;

    // Priority notifications (always show with sound)
    const priorityTypes = [
      NotificationType.SESSION_INVITE,
      NotificationType.CLUB_INVITE,
      NotificationType.SESSION_STARTING,
    ];

    const isPriority = priorityTypes.includes(data.type);

    return {
      shouldShowAlert: true,
      shouldPlaySound: isPriority,
      shouldSetBadge: true,
      priority: isPriority
        ? Notifications.AndroidNotificationPriority.HIGH
        : Notifications.AndroidNotificationPriority.DEFAULT,
    };
  },
});

/**
 * Request notification permissions from the user
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Check if running on a physical device
  if (!Device.isDevice) {
    Logger.warn('Push notifications only work on physical devices', { action: 'registerForPushNotifications' });
    return null;
  }

  try {
    // Get existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not already granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      Logger.warn('Push notification permission denied', { action: 'registerForPushNotifications' });
      return null;
    }

    // Get the push token
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;

    if (!projectId || projectId === '00000000-0000-0000-0000-000000000000') {
      Logger.warn('Expo project ID not configured - push notifications disabled', { action: 'registerForPushNotifications' });
      return null;
    }

    const pushToken = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    // Android-specific channel configuration
    if (Platform.OS === 'android') {
      await setupAndroidChannels();
    }

    return pushToken.data;
  } catch (error) {
    Logger.error('Error registering for push notifications', error as Error, { action: 'registerForPushNotifications' });
    return null;
  }
}

/**
 * Set up Android notification channels
 */
async function setupAndroidChannels() {
  // High priority channel for invites and urgent notifications
  await Notifications.setNotificationChannelAsync('urgent', {
    name: 'Urgent Notifications',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#EF4444',
    sound: 'default',
    enableVibrate: true,
  });

  // Default channel for general notifications
  await Notifications.setNotificationChannelAsync('default', {
    name: 'General Notifications',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250],
    lightColor: '#3B82F6',
    sound: 'default',
  });

  // Low priority channel for updates
  await Notifications.setNotificationChannelAsync('updates', {
    name: 'Updates',
    importance: Notifications.AndroidImportance.LOW,
    vibrationPattern: [0, 100],
    lightColor: '#10B981',
  });
}

/**
 * Store push token in Supabase for the current user
 * Includes retry logic to handle session propagation delays
 */
export async function savePushToken(userId: string, token: string, retries = 3): Promise<void> {
  try {
    // ✅ Verify auth session exists before attempting INSERT
    // This prevents RLS failures during sign-up when session hasn't propagated yet
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      Logger.warn('Session check failed, retrying...', { userId, retriesLeft: retries });
      throw sessionError;
    }

    if (!session) {
      Logger.warn('No active session found, retrying...', { userId, retriesLeft: retries });
      throw new Error('No active session - auth not yet propagated');
    }

    const deviceInfo = {
      platform: Platform.OS,
      model: Device.modelName || 'Unknown',
      osVersion: Device.osVersion || 'Unknown',
    };

    const { error } = await supabase
      .from('push_tokens')
      .upsert({
        user_id: userId,
        token,
        device_info: deviceInfo,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,token',
      });

    if (error) throw error;
    Logger.info('Push token saved successfully', { userId });
  } catch (error) {
    // Retry if session isn't ready yet
    if (retries > 0) {
      Logger.warn('Retrying push token save...', { userId, retriesLeft: retries - 1 });
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      return savePushToken(userId, token, retries - 1);
    }

    Logger.error('Error saving push token after retries', error as Error, { action: 'savePushToken', userId });
    // Don't throw - push tokens are non-critical, app should continue working
  }
}

/**
 * Remove push token from Supabase (on logout)
 */
export async function removePushToken(userId: string, token: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('push_tokens')
      .delete()
      .eq('user_id', userId)
      .eq('token', token);

    if (error) throw error;
    Logger.info('Push token removed successfully', { userId });
  } catch (error) {
    Logger.error('Error removing push token', error as Error, { action: 'removePushToken', userId });
  }
}

/**
 * Schedule a local notification
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data: NotificationData,
  trigger?: Notifications.NotificationTriggerInput
): Promise<string> {
  const channelId = getChannelForType(data.type);

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
      ...(Platform.OS === 'android' && { channelId }),
    },
    trigger: trigger || null, // null = immediate
  });

  return notificationId;
}

/**
 * Get the appropriate Android channel for a notification type
 */
function getChannelForType(type: NotificationType): string {
  const urgentTypes = [
    NotificationType.SESSION_INVITE,
    NotificationType.CLUB_INVITE,
    NotificationType.SESSION_STARTING,
  ];

  const updateTypes = [
    NotificationType.LEADERBOARD_UPDATE,
    NotificationType.ROUND_COMPLETE,
  ];

  if (urgentTypes.includes(type)) {
    return 'urgent';
  } else if (updateTypes.includes(type)) {
    return 'updates';
  }

  return 'default';
}

/**
 * Cancel a scheduled notification
 */
export async function cancelNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get notification badge count
 */
export async function getBadgeCount(): Promise<number> {
  return await Notifications.getBadgeCountAsync();
}

/**
 * Set notification badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

/**
 * Clear all delivered notifications
 */
export async function clearAllNotifications(): Promise<void> {
  await Notifications.dismissAllNotificationsAsync();
}

/**
 * Check if notifications are enabled
 */
export async function areNotificationsEnabled(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

/**
 * Notification Templates
 */
export const NotificationTemplates = {
  sessionInvite: (sessionName: string, inviterName: string) => ({
    title: '🎾 Session Invitation',
    body: `${inviterName} invited you to join "${sessionName}"`,
    type: NotificationType.SESSION_INVITE,
  }),

  clubInvite: (clubName: string, inviterName: string) => ({
    title: '🏆 Club Invitation',
    body: `${inviterName} invited you to join ${clubName}`,
    type: NotificationType.CLUB_INVITE,
  }),

  sessionStarting: (sessionName: string, minutesUntil: number) => ({
    title: '⏰ Session Starting Soon',
    body: `"${sessionName}" starts in ${minutesUntil} minutes`,
    type: NotificationType.SESSION_STARTING,
  }),

  roundComplete: (sessionName: string, roundNumber: number) => ({
    title: '✅ Round Complete',
    body: `Round ${roundNumber} of "${sessionName}" is complete. Check the results!`,
    type: NotificationType.ROUND_COMPLETE,
  }),

  clubAnnouncement: (clubName: string, message: string) => ({
    title: `📢 ${clubName}`,
    body: message,
    type: NotificationType.CLUB_ANNOUNCEMENT,
  }),

  matchReminder: (opponentNames: string[], courtNumber?: number) => ({
    title: '🎾 Match Starting',
    body: courtNumber
      ? `Your match vs ${opponentNames.join(' & ')} on Court ${courtNumber}`
      : `Your match vs ${opponentNames.join(' & ')} is about to start`,
    type: NotificationType.MATCH_REMINDER,
  }),

  leaderboardUpdate: (sessionName: string, newPosition: number) => ({
    title: '📊 Leaderboard Update',
    body: `You're now #${newPosition} in "${sessionName}"!`,
    type: NotificationType.LEADERBOARD_UPDATE,
  }),
};
