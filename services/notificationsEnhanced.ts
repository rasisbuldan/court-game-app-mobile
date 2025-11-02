import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from '../config/supabase';
import {
  NotificationError,
  NotificationErrorCode,
  errorLogger,
  retryWithBackoff,
  CircuitBreaker,
  RateLimiter,
  healthMonitor,
} from './notificationError';

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

// Initialize circuit breaker and rate limiter
const pushTokenCircuitBreaker = new CircuitBreaker(5, 60000, 3);
const notificationRateLimiter = new RateLimiter(20, 60000); // 20 notifications per minute

/**
 * Configure how notifications are displayed
 */
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    try {
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
    } catch (error) {
      errorLogger.log(
        new NotificationError(
          NotificationErrorCode.NOTIFICATION_SEND_FAILED,
          'Failed to handle notification',
          error as Error,
          { notification: notification.request.identifier }
        )
      );

      // Return safe defaults
      return {
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: true,
      };
    }
  },
});

/**
 * Validate device support for notifications
 */
export function validateDeviceSupport(): void {
  if (!Device.isDevice) {
    throw new NotificationError(
      NotificationErrorCode.DEVICE_NOT_SUPPORTED,
      'Push notifications only work on physical devices',
      undefined,
      {
        platform: Platform.OS,
        isDevice: Device.isDevice,
      },
      false
    );
  }
}

/**
 * Request notification permissions with error handling
 */
export async function requestPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      errorLogger.log(
        new NotificationError(
          NotificationErrorCode.PERMISSION_DENIED,
          'User denied notification permissions',
          undefined,
          { finalStatus },
          false
        )
      );
      return false;
    }

    return true;
  } catch (error) {
    errorLogger.log(
      new NotificationError(
        NotificationErrorCode.PERMISSION_DENIED,
        'Failed to request permissions',
        error as Error,
        undefined,
        true
      )
    );
    return false;
  }
}

/**
 * Get Expo push token with validation and error handling
 */
async function getExpoPushToken(): Promise<string> {
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;

  if (!projectId) {
    throw new NotificationError(
      NotificationErrorCode.PROJECT_ID_MISSING,
      'Expo project ID not found in app.json. Add it under expo.extra.eas.projectId',
      undefined,
      { configPath: 'expo.extra.eas.projectId' },
      false
    );
  }

  try {
    const pushToken = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    if (!pushToken?.data) {
      throw new NotificationError(
        NotificationErrorCode.INVALID_TOKEN,
        'Received invalid push token from Expo',
        undefined,
        { pushToken },
        true
      );
    }

    // Validate token format
    if (!pushToken.data.startsWith('ExponentPushToken[')) {
      throw new NotificationError(
        NotificationErrorCode.INVALID_TOKEN,
        'Push token has invalid format',
        undefined,
        { token: pushToken.data },
        false
      );
    }

    return pushToken.data;
  } catch (error) {
    if (error instanceof NotificationError) {
      throw error;
    }

    throw new NotificationError(
      NotificationErrorCode.TOKEN_REGISTRATION_FAILED,
      'Failed to register for push notifications',
      error as Error,
      { projectId },
      true
    );
  }
}

/**
 * Set up Android notification channels with error handling
 */
async function setupAndroidChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;

  const channels = [
    {
      id: 'urgent',
      name: 'Urgent Notifications',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#EF4444',
      sound: 'default' as const,
      enableVibrate: true,
    },
    {
      id: 'default',
      name: 'General Notifications',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250],
      lightColor: '#3B82F6',
      sound: 'default' as const,
    },
    {
      id: 'updates',
      name: 'Updates',
      importance: Notifications.AndroidImportance.LOW,
      vibrationPattern: [0, 100],
      lightColor: '#10B981',
    },
  ];

  const errors: Error[] = [];

  for (const channel of channels) {
    try {
      await Notifications.setNotificationChannelAsync(channel.id, channel);
    } catch (error) {
      errors.push(error as Error);
      errorLogger.log(
        new NotificationError(
          NotificationErrorCode.CHANNEL_SETUP_FAILED,
          `Failed to create notification channel: ${channel.id}`,
          error as Error,
          { channelId: channel.id },
          false
        )
      );
    }
  }

  if (errors.length === channels.length) {
    throw new NotificationError(
      NotificationErrorCode.CHANNEL_SETUP_FAILED,
      'Failed to create all notification channels',
      errors[0],
      { channelCount: channels.length },
      false
    );
  }
}

/**
 * Register for push notifications with comprehensive error handling
 */
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    // Validate device support
    validateDeviceSupport();

    // Request permissions
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      return null;
    }

    // Get push token with circuit breaker
    const token = await pushTokenCircuitBreaker.execute(async () => {
      return await retryWithBackoff(
        getExpoPushToken,
        undefined,
        NotificationErrorCode.TOKEN_REGISTRATION_FAILED,
        { attempt: 'registerForPushNotifications' }
      );
    });

    // Set up Android channels
    await setupAndroidChannels();

    return token;
  } catch (error) {
    if (error instanceof NotificationError) {
      errorLogger.log(error);
    } else {
      errorLogger.log(
        new NotificationError(
          NotificationErrorCode.TOKEN_REGISTRATION_FAILED,
          'Unexpected error during push notification registration',
          error as Error,
          undefined,
          false
        )
      );
    }
    return null;
  }
}

/**
 * Save push token to Supabase with error handling and retries
 */
export async function savePushToken(userId: string, token: string): Promise<void> {
  if (!userId || !token) {
    throw new NotificationError(
      NotificationErrorCode.TOKEN_SAVE_FAILED,
      'Invalid userId or token provided',
      undefined,
      { userId: !!userId, token: !!token },
      false
    );
  }

  try {
    const deviceInfo = {
      platform: Platform.OS,
      model: Device.modelName || 'Unknown',
      osVersion: Device.osVersion || 'Unknown',
      appVersion: Constants.expoConfig?.version || 'Unknown',
    };

    await retryWithBackoff(
      async () => {
        const { error } = await supabase
          .from('push_tokens')
          .upsert(
            {
              user_id: userId,
              token,
              device_info: deviceInfo,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: 'user_id,token',
            }
          );

        if (error) throw error;
      },
      undefined,
      NotificationErrorCode.TOKEN_SAVE_FAILED,
      { userId, deviceInfo }
    );

    console.log('Push token saved successfully');
  } catch (error) {
    if (error instanceof NotificationError) {
      errorLogger.log(error);
      throw error;
    }

    const notificationError = new NotificationError(
      NotificationErrorCode.DATABASE_ERROR,
      'Failed to save push token to database',
      error as Error,
      { userId, token: token.substring(0, 20) + '...' },
      true
    );
    errorLogger.log(notificationError);
    throw notificationError;
  }
}

/**
 * Remove push token from Supabase
 */
export async function removePushToken(userId: string, token: string): Promise<void> {
  try {
    await retryWithBackoff(
      async () => {
        const { error } = await supabase
          .from('push_tokens')
          .delete()
          .eq('user_id', userId)
          .eq('token', token);

        if (error) throw error;
      },
      undefined,
      NotificationErrorCode.DATABASE_ERROR,
      { userId, operation: 'remove' }
    );

    console.log('Push token removed successfully');
  } catch (error) {
    // Log but don't throw on cleanup errors
    errorLogger.log(
      new NotificationError(
        NotificationErrorCode.DATABASE_ERROR,
        'Failed to remove push token',
        error as Error,
        { userId },
        false
      )
    );
  }
}

/**
 * Schedule a local notification with rate limiting and error handling
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data: NotificationData,
  trigger?: Notifications.NotificationTriggerInput
): Promise<string | null> {
  try {
    return await notificationRateLimiter.throttle(async () => {
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
        trigger: trigger || null,
      });

      return notificationId;
    });
  } catch (error) {
    if (error instanceof NotificationError) {
      errorLogger.log(error);
      return null;
    }

    errorLogger.log(
      new NotificationError(
        NotificationErrorCode.NOTIFICATION_SEND_FAILED,
        'Failed to schedule notification',
        error as Error,
        { title, type: data.type },
        true
      )
    );
    return null;
  }
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
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    errorLogger.log(
      new NotificationError(
        NotificationErrorCode.NOTIFICATION_SEND_FAILED,
        'Failed to cancel notification',
        error as Error,
        { notificationId },
        false
      )
    );
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    errorLogger.log(
      new NotificationError(
        NotificationErrorCode.NOTIFICATION_SEND_FAILED,
        'Failed to cancel all notifications',
        error as Error,
        undefined,
        false
      )
    );
  }
}

/**
 * Get notification badge count
 */
export async function getBadgeCount(): Promise<number> {
  try {
    return await Notifications.getBadgeCountAsync();
  } catch (error) {
    errorLogger.log(
      new NotificationError(
        NotificationErrorCode.NOTIFICATION_SEND_FAILED,
        'Failed to get badge count',
        error as Error,
        undefined,
        false
      )
    );
    return 0;
  }
}

/**
 * Set notification badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch (error) {
    errorLogger.log(
      new NotificationError(
        NotificationErrorCode.NOTIFICATION_SEND_FAILED,
        'Failed to set badge count',
        error as Error,
        { count },
        false
      )
    );
  }
}

/**
 * Clear all delivered notifications
 */
export async function clearAllNotifications(): Promise<void> {
  try {
    await Notifications.dismissAllNotificationsAsync();
  } catch (error) {
    errorLogger.log(
      new NotificationError(
        NotificationErrorCode.NOTIFICATION_SEND_FAILED,
        'Failed to clear notifications',
        error as Error,
        undefined,
        false
      )
    );
  }
}

/**
 * Check if notifications are enabled
 */
export async function areNotificationsEnabled(): Promise<boolean> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    errorLogger.log(
      new NotificationError(
        NotificationErrorCode.PERMISSION_DENIED,
        'Failed to check notification permissions',
        error as Error,
        undefined,
        false
      )
    );
    return false;
  }
}

/**
 * Get notification service health status
 */
export async function getHealthStatus() {
  return await healthMonitor.checkHealth(pushTokenCircuitBreaker);
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

// Export error utilities for debugging
export { errorLogger, healthMonitor, pushTokenCircuitBreaker };
