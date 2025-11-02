import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { Subscription } from 'expo-notifications';
import {
  registerForPushNotifications,
  savePushToken,
  removePushToken,
  NotificationData,
  NotificationType,
  setBadgeCount,
} from '../services/notifications';
import { useAuth } from './useAuth';

export function useNotifications() {
  const { user } = useAuth();
  const router = useRouter();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<Subscription>();
  const responseListener = useRef<Subscription>();

  useEffect(() => {
    if (!user) return;

    // Register for push notifications
    registerForPushNotifications()
      .then((token) => {
        if (token) {
          setExpoPushToken(token);
          // Save token to Supabase
          savePushToken(user.id, token).catch(console.error);
        }
      })
      .catch(console.error);

    // Listener for notifications received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
      setNotification(notification);

      // Update badge count
      updateBadgeCount();
    });

    // Listener for when user taps on a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification tapped:', response);
      handleNotificationResponse(response);
    });

    return () => {
      // Use modern API: subscription.remove() instead of deprecated removeNotificationSubscription
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [user]);

  // Handle notification tap navigation
  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data as NotificationData;

    switch (data.type) {
      case NotificationType.SESSION_INVITE:
      case NotificationType.SESSION_STARTING:
      case NotificationType.ROUND_COMPLETE:
      case NotificationType.LEADERBOARD_UPDATE:
        if (data.sessionId) {
          router.push(`/(tabs)/session/${data.sessionId}`);
        }
        break;

      case NotificationType.CLUB_INVITE:
        // Navigate to notifications tab to see invitations
        router.push('/(tabs)/notifications');
        break;

      case NotificationType.CLUB_ANNOUNCEMENT:
        if (data.clubId) {
          router.push({
            pathname: '/(tabs)/club-detail',
            params: { id: data.clubId },
          });
        }
        break;

      case NotificationType.MATCH_REMINDER:
        if (data.sessionId) {
          router.push(`/(tabs)/session/${data.sessionId}`);
        }
        break;

      default:
        console.log('Unknown notification type:', data.type);
    }

    // Clear the badge when notification is handled
    setBadgeCount(0).catch(console.error);
  };

  // Update badge count based on unread notifications
  const updateBadgeCount = async () => {
    try {
      const delivered = await Notifications.getPresentedNotificationsAsync();
      await setBadgeCount(delivered.length);
    } catch (error) {
      console.error('Error updating badge count:', error);
    }
  };

  // Cleanup token on logout
  const cleanupPushToken = async () => {
    if (user && expoPushToken) {
      await removePushToken(user.id, expoPushToken);
      setExpoPushToken(null);
    }
  };

  return {
    expoPushToken,
    notification,
    cleanupPushToken,
  };
}
