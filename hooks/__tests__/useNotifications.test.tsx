/**
 * useNotifications Hook Tests
 *
 * Comprehensive unit tests for notifications management hook covering:
 * - Push notification registration
 * - Notification received listener
 * - Notification response (tap) listener
 * - Badge count management
 * - Push token save/remove operations
 * - Navigation on notification tap
 * - Cleanup on unmount
 * - Error handling
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import { useNotifications } from '../useNotifications';
import { useAuth } from '../useAuth';
import {
  registerForPushNotifications,
  savePushToken,
  removePushToken,
  NotificationType,
  setBadgeCount,
} from '../../services/notifications';
import { Logger } from '../../utils/logger';

// Mock dependencies
jest.mock('../useAuth');
jest.mock('expo-router');
jest.mock('../../services/notifications');
jest.mock('../../utils/logger', () => ({
  Logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
  getPresentedNotificationsAsync: jest.fn(),
  DEFAULT_ACTION_IDENTIFIER: 'expo.modules.notifications.actions.DEFAULT',
  AndroidImportance: {
    MAX: 5,
  },
}));

// Import after mocking
import * as Notifications from 'expo-notifications';

describe('useNotifications Hook', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    app_metadata: {},
    user_metadata: { display_name: 'Test User' },
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  };

  const mockRouter = {
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
    canGoBack: jest.fn(() => true),
  };

  let mockNotificationReceivedListener: (notification: Notifications.Notification) => void;
  let mockNotificationResponseListener: (response: Notifications.NotificationResponse) => void;
  const mockNotificationSubscription = {
    remove: jest.fn(),
  };
  const mockResponseSubscription = {
    remove: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock useAuth
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      session: { access_token: 'mock-token' },
      loading: false,
    });

    // Mock useRouter
    (useRouter as jest.Mock).mockReturnValue(mockRouter);

    // Mock notification services
    (registerForPushNotifications as jest.Mock).mockResolvedValue('ExponentPushToken[xxx]');
    (savePushToken as jest.Mock).mockResolvedValue(undefined);
    (removePushToken as jest.Mock).mockResolvedValue(undefined);
    (setBadgeCount as jest.Mock).mockResolvedValue(undefined);

    // Mock Notifications.getPresentedNotificationsAsync
    (Notifications.getPresentedNotificationsAsync as jest.Mock).mockResolvedValue([]);

    // Mock notification listeners
    (Notifications.addNotificationReceivedListener as jest.Mock).mockImplementation((callback) => {
      mockNotificationReceivedListener = callback;
      return mockNotificationSubscription;
    });

    (Notifications.addNotificationResponseReceivedListener as jest.Mock).mockImplementation((callback) => {
      mockNotificationResponseListener = callback;
      return mockResponseSubscription;
    });
  });

  describe('Initial Setup', () => {
    it('should not register for notifications when user is not authenticated', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        session: null,
        loading: false,
      });

      renderHook(() => useNotifications());

      expect(registerForPushNotifications).not.toHaveBeenCalled();
      expect(Notifications.addNotificationReceivedListener).not.toHaveBeenCalled();
      expect(Notifications.addNotificationResponseReceivedListener).not.toHaveBeenCalled();
    });

    it('should register for push notifications when user is authenticated', async () => {
      renderHook(() => useNotifications());

      await waitFor(() => {
        expect(registerForPushNotifications).toHaveBeenCalled();
      });
    });

    it('should save push token to Supabase on successful registration', async () => {
      renderHook(() => useNotifications());

      await waitFor(() => {
        expect(savePushToken).toHaveBeenCalledWith('user-123', 'ExponentPushToken[xxx]');
      });
    });

    it('should set expoPushToken state on successful registration', async () => {
      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.expoPushToken).toBe('ExponentPushToken[xxx]');
      });
    });

    it('should handle push notification registration failure', async () => {
      const error = new Error('Permission denied');
      (registerForPushNotifications as jest.Mock).mockRejectedValue(error);

      renderHook(() => useNotifications());

      await waitFor(() => {
        expect(Logger.error).toHaveBeenCalledWith(
          'Failed to register for push notifications',
          error,
          expect.objectContaining({
            action: 'registerPushNotifications',
            userId: 'user-123',
          })
        );
      });
    });

    it('should handle push token save failure', async () => {
      const error = new Error('Database error');
      (savePushToken as jest.Mock).mockRejectedValue(error);

      renderHook(() => useNotifications());

      await waitFor(() => {
        expect(Logger.error).toHaveBeenCalledWith(
          'Failed to save push token',
          error,
          expect.objectContaining({
            action: 'savePushToken',
            userId: 'user-123',
          })
        );
      });
    });

    it('should not save token if registration returns null', async () => {
      (registerForPushNotifications as jest.Mock).mockResolvedValue(null);

      renderHook(() => useNotifications());

      await waitFor(() => {
        expect(registerForPushNotifications).toHaveBeenCalled();
      });

      // Should not attempt to save null token
      expect(savePushToken).not.toHaveBeenCalled();
    });

    it('should set up notification received listener', async () => {
      renderHook(() => useNotifications());

      await waitFor(() => {
        expect(Notifications.addNotificationReceivedListener).toHaveBeenCalledWith(
          expect.any(Function)
        );
      });
    });

    it('should set up notification response listener', async () => {
      renderHook(() => useNotifications());

      await waitFor(() => {
        expect(Notifications.addNotificationResponseReceivedListener).toHaveBeenCalledWith(
          expect.any(Function)
        );
      });
    });
  });

  describe('Notification Received', () => {
    it('should update state when notification is received', async () => {
      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(mockNotificationReceivedListener).toBeDefined();
      });

      const mockNotification = {
        request: {
          identifier: 'notif-123',
          content: {
            title: 'Test Notification',
            body: 'Test body',
            data: {
              type: NotificationType.SESSION_INVITE,
              sessionId: 'session-123',
            },
          },
          trigger: null,
        },
        date: Date.now(),
      } as Notifications.Notification;

      act(() => {
        mockNotificationReceivedListener(mockNotification);
      });

      expect(result.current.notification).toEqual(mockNotification);
      expect(Logger.info).toHaveBeenCalledWith(
        'Notification received',
        { notificationId: 'notif-123' }
      );
    });

    it('should update badge count when notification is received', async () => {
      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(mockNotificationReceivedListener).toBeDefined();
      });

      const presentedNotifications = [
        { request: { identifier: 'notif-1' } },
        { request: { identifier: 'notif-2' } },
      ] as Notifications.Notification[];

      (Notifications.getPresentedNotificationsAsync as jest.Mock).mockResolvedValue(
        presentedNotifications
      );

      const mockNotification = {
        request: {
          identifier: 'notif-123',
          content: {
            title: 'Test',
            body: 'Test',
            data: {},
          },
          trigger: null,
        },
        date: Date.now(),
      } as Notifications.Notification;

      act(() => {
        mockNotificationReceivedListener(mockNotification);
      });

      await waitFor(() => {
        expect(Notifications.getPresentedNotificationsAsync).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(setBadgeCount).toHaveBeenCalledWith(2);
      });
    });

    it('should handle badge count update errors', async () => {
      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(mockNotificationReceivedListener).toBeDefined();
      });

      const error = new Error('Badge update failed');
      (Notifications.getPresentedNotificationsAsync as jest.Mock).mockRejectedValue(error);

      const mockNotification = {
        request: {
          identifier: 'notif-123',
          content: { title: 'Test', body: 'Test', data: {} },
          trigger: null,
        },
        date: Date.now(),
      } as Notifications.Notification;

      act(() => {
        mockNotificationReceivedListener(mockNotification);
      });

      await waitFor(() => {
        expect(Logger.error).toHaveBeenCalledWith(
          'Error updating badge count',
          error,
          { action: 'updateBadgeCount' }
        );
      });
    });
  });

  describe('Notification Response (Tap) - Navigation', () => {
    it('should navigate to session on SESSION_INVITE tap', async () => {
      renderHook(() => useNotifications());

      await waitFor(() => {
        expect(mockNotificationResponseListener).toBeDefined();
      });

      const response = {
        notification: {
          request: {
            identifier: 'notif-123',
            content: {
              title: 'Session Invite',
              body: 'You are invited',
              data: {
                type: NotificationType.SESSION_INVITE,
                sessionId: 'session-456',
              },
            },
            trigger: null,
          },
          date: Date.now(),
        },
        actionIdentifier: Notifications.DEFAULT_ACTION_IDENTIFIER,
      } as Notifications.NotificationResponse;

      act(() => {
        mockNotificationResponseListener(response);
      });

      expect(Logger.info).toHaveBeenCalledWith(
        'Notification tapped',
        { notificationId: 'notif-123' }
      );

      expect(mockRouter.push).toHaveBeenCalledWith('/(tabs)/session/session-456');
      expect(setBadgeCount).toHaveBeenCalledWith(0);
    });

    it('should navigate to session on SESSION_STARTING tap', async () => {
      renderHook(() => useNotifications());

      await waitFor(() => {
        expect(mockNotificationResponseListener).toBeDefined();
      });

      const response = {
        notification: {
          request: {
            identifier: 'notif-123',
            content: {
              title: 'Session Starting',
              body: 'Session is about to start',
              data: {
                type: NotificationType.SESSION_STARTING,
                sessionId: 'session-789',
              },
            },
            trigger: null,
          },
          date: Date.now(),
        },
        actionIdentifier: Notifications.DEFAULT_ACTION_IDENTIFIER,
      } as Notifications.NotificationResponse;

      act(() => {
        mockNotificationResponseListener(response);
      });

      expect(mockRouter.push).toHaveBeenCalledWith('/(tabs)/session/session-789');
    });

    it('should navigate to session on ROUND_COMPLETE tap', async () => {
      renderHook(() => useNotifications());

      await waitFor(() => {
        expect(mockNotificationResponseListener).toBeDefined();
      });

      const response = {
        notification: {
          request: {
            identifier: 'notif-123',
            content: {
              title: 'Round Complete',
              body: 'Round has finished',
              data: {
                type: NotificationType.ROUND_COMPLETE,
                sessionId: 'session-abc',
              },
            },
            trigger: null,
          },
          date: Date.now(),
        },
        actionIdentifier: Notifications.DEFAULT_ACTION_IDENTIFIER,
      } as Notifications.NotificationResponse;

      act(() => {
        mockNotificationResponseListener(response);
      });

      expect(mockRouter.push).toHaveBeenCalledWith('/(tabs)/session/session-abc');
    });

    it('should navigate to session on LEADERBOARD_UPDATE tap', async () => {
      renderHook(() => useNotifications());

      await waitFor(() => {
        expect(mockNotificationResponseListener).toBeDefined();
      });

      const response = {
        notification: {
          request: {
            identifier: 'notif-123',
            content: {
              title: 'Leaderboard Updated',
              body: 'New standings available',
              data: {
                type: NotificationType.LEADERBOARD_UPDATE,
                sessionId: 'session-def',
              },
            },
            trigger: null,
          },
          date: Date.now(),
        },
        actionIdentifier: Notifications.DEFAULT_ACTION_IDENTIFIER,
      } as Notifications.NotificationResponse;

      act(() => {
        mockNotificationResponseListener(response);
      });

      expect(mockRouter.push).toHaveBeenCalledWith('/(tabs)/session/session-def');
    });

    it('should navigate to session on MATCH_REMINDER tap', async () => {
      renderHook(() => useNotifications());

      await waitFor(() => {
        expect(mockNotificationResponseListener).toBeDefined();
      });

      const response = {
        notification: {
          request: {
            identifier: 'notif-123',
            content: {
              title: 'Match Reminder',
              body: 'Your match is coming up',
              data: {
                type: NotificationType.MATCH_REMINDER,
                sessionId: 'session-ghi',
              },
            },
            trigger: null,
          },
          date: Date.now(),
        },
        actionIdentifier: Notifications.DEFAULT_ACTION_IDENTIFIER,
      } as Notifications.NotificationResponse;

      act(() => {
        mockNotificationResponseListener(response);
      });

      expect(mockRouter.push).toHaveBeenCalledWith('/(tabs)/session/session-ghi');
    });

    it('should navigate to notifications tab on CLUB_INVITE tap', async () => {
      renderHook(() => useNotifications());

      await waitFor(() => {
        expect(mockNotificationResponseListener).toBeDefined();
      });

      const response = {
        notification: {
          request: {
            identifier: 'notif-123',
            content: {
              title: 'Club Invite',
              body: 'You are invited to join a club',
              data: {
                type: NotificationType.CLUB_INVITE,
              },
            },
            trigger: null,
          },
          date: Date.now(),
        },
        actionIdentifier: Notifications.DEFAULT_ACTION_IDENTIFIER,
      } as Notifications.NotificationResponse;

      act(() => {
        mockNotificationResponseListener(response);
      });

      expect(mockRouter.push).toHaveBeenCalledWith('/(tabs)/notifications');
    });

    it('should navigate to club detail on CLUB_ANNOUNCEMENT tap', async () => {
      renderHook(() => useNotifications());

      await waitFor(() => {
        expect(mockNotificationResponseListener).toBeDefined();
      });

      const response = {
        notification: {
          request: {
            identifier: 'notif-123',
            content: {
              title: 'Club Announcement',
              body: 'New announcement from your club',
              data: {
                type: NotificationType.CLUB_ANNOUNCEMENT,
                clubId: 'club-123',
              },
            },
            trigger: null,
          },
          date: Date.now(),
        },
        actionIdentifier: Notifications.DEFAULT_ACTION_IDENTIFIER,
      } as Notifications.NotificationResponse;

      act(() => {
        mockNotificationResponseListener(response);
      });

      expect(mockRouter.push).toHaveBeenCalledWith({
        pathname: '/(tabs)/club-detail',
        params: { id: 'club-123' },
      });
    });

    it('should not navigate if sessionId is missing for session notifications', async () => {
      renderHook(() => useNotifications());

      await waitFor(() => {
        expect(mockNotificationResponseListener).toBeDefined();
      });

      const response = {
        notification: {
          request: {
            identifier: 'notif-123',
            content: {
              title: 'Session Invite',
              body: 'Missing sessionId',
              data: {
                type: NotificationType.SESSION_INVITE,
                // sessionId is missing
              },
            },
            trigger: null,
          },
          date: Date.now(),
        },
        actionIdentifier: Notifications.DEFAULT_ACTION_IDENTIFIER,
      } as Notifications.NotificationResponse;

      act(() => {
        mockNotificationResponseListener(response);
      });

      expect(mockRouter.push).not.toHaveBeenCalled();
      // Badge should still be cleared
      expect(setBadgeCount).toHaveBeenCalledWith(0);
    });

    it('should not navigate if clubId is missing for club announcement', async () => {
      renderHook(() => useNotifications());

      await waitFor(() => {
        expect(mockNotificationResponseListener).toBeDefined();
      });

      const response = {
        notification: {
          request: {
            identifier: 'notif-123',
            content: {
              title: 'Club Announcement',
              body: 'Missing clubId',
              data: {
                type: NotificationType.CLUB_ANNOUNCEMENT,
                // clubId is missing
              },
            },
            trigger: null,
          },
          date: Date.now(),
        },
        actionIdentifier: Notifications.DEFAULT_ACTION_IDENTIFIER,
      } as Notifications.NotificationResponse;

      act(() => {
        mockNotificationResponseListener(response);
      });

      expect(mockRouter.push).not.toHaveBeenCalled();
      expect(setBadgeCount).toHaveBeenCalledWith(0);
    });

    it('should log warning for unknown notification type', async () => {
      renderHook(() => useNotifications());

      await waitFor(() => {
        expect(mockNotificationResponseListener).toBeDefined();
      });

      const response = {
        notification: {
          request: {
            identifier: 'notif-123',
            content: {
              title: 'Unknown',
              body: 'Unknown type',
              data: {
                type: 'UNKNOWN_TYPE',
              },
            },
            trigger: null,
          },
          date: Date.now(),
        },
        actionIdentifier: Notifications.DEFAULT_ACTION_IDENTIFIER,
      } as Notifications.NotificationResponse;

      act(() => {
        mockNotificationResponseListener(response);
      });

      expect(Logger.warn).toHaveBeenCalledWith(
        'Unknown notification type',
        { notificationType: 'UNKNOWN_TYPE' }
      );

      // Should still clear badge
      expect(setBadgeCount).toHaveBeenCalledWith(0);
    });

    it('should handle badge clear errors on notification tap', async () => {
      renderHook(() => useNotifications());

      await waitFor(() => {
        expect(mockNotificationResponseListener).toBeDefined();
      });

      const error = new Error('Badge clear failed');
      (setBadgeCount as jest.Mock).mockRejectedValue(error);

      const response = {
        notification: {
          request: {
            identifier: 'notif-123',
            content: {
              title: 'Test',
              body: 'Test',
              data: {
                type: NotificationType.CLUB_INVITE,
              },
            },
            trigger: null,
          },
          date: Date.now(),
        },
        actionIdentifier: Notifications.DEFAULT_ACTION_IDENTIFIER,
      } as Notifications.NotificationResponse;

      act(() => {
        mockNotificationResponseListener(response);
      });

      await waitFor(() => {
        expect(Logger.error).toHaveBeenCalledWith(
          'Failed to clear badge count',
          error,
          { action: 'setBadgeCount' }
        );
      });
    });
  });

  describe('Cleanup', () => {
    it('should remove notification listeners on unmount', async () => {
      const { unmount } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(Notifications.addNotificationReceivedListener).toHaveBeenCalled();
        expect(Notifications.addNotificationResponseReceivedListener).toHaveBeenCalled();
      });

      unmount();

      expect(mockNotificationSubscription.remove).toHaveBeenCalled();
      expect(mockResponseSubscription.remove).toHaveBeenCalled();
    });

    it('should not fail if listeners were not set up', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        session: null,
        loading: false,
      });

      const { unmount } = renderHook(() => useNotifications());

      // Should not throw
      expect(() => unmount()).not.toThrow();
    });

    it('should cleanup push token when cleanupPushToken is called', async () => {
      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.expoPushToken).toBe('ExponentPushToken[xxx]');
      });

      await act(async () => {
        await result.current.cleanupPushToken();
      });

      expect(removePushToken).toHaveBeenCalledWith('user-123', 'ExponentPushToken[xxx]');
      expect(result.current.expoPushToken).toBeNull();
    });

    it('should not cleanup token if user is not available', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        session: null,
        loading: false,
      });

      const { result } = renderHook(() => useNotifications());

      await act(async () => {
        await result.current.cleanupPushToken();
      });

      expect(removePushToken).not.toHaveBeenCalled();
    });

    it('should not cleanup token if token is not available', async () => {
      (registerForPushNotifications as jest.Mock).mockResolvedValue(null);

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.expoPushToken).toBeNull();
      });

      await act(async () => {
        await result.current.cleanupPushToken();
      });

      expect(removePushToken).not.toHaveBeenCalled();
    });
  });

  describe('User State Changes', () => {
    it('should re-register when user logs in', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        session: null,
        loading: false,
      });

      const { rerender } = renderHook(() => useNotifications());

      expect(registerForPushNotifications).not.toHaveBeenCalled();

      // User logs in
      (useAuth as jest.Mock).mockReturnValue({
        user: mockUser,
        session: { access_token: 'mock-token' },
        loading: false,
      });

      rerender();

      await waitFor(() => {
        expect(registerForPushNotifications).toHaveBeenCalled();
      });
    });

    it('should remove listeners when user logs out', async () => {
      const { rerender } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(Notifications.addNotificationReceivedListener).toHaveBeenCalled();
      });

      // User logs out
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        session: null,
        loading: false,
      });

      rerender();

      await waitFor(() => {
        expect(mockNotificationSubscription.remove).toHaveBeenCalled();
        expect(mockResponseSubscription.remove).toHaveBeenCalled();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle notification with missing data', async () => {
      renderHook(() => useNotifications());

      await waitFor(() => {
        expect(mockNotificationReceivedListener).toBeDefined();
      });

      const mockNotification = {
        request: {
          identifier: 'notif-123',
          content: {
            title: 'Test',
            body: 'Test',
            // data is missing
          },
          trigger: null,
        },
        date: Date.now(),
      } as any;

      // Should not throw
      expect(() => {
        act(() => {
          mockNotificationReceivedListener(mockNotification);
        });
      }).not.toThrow();
    });

    it('should handle notification response with minimal data', async () => {
      renderHook(() => useNotifications());

      await waitFor(() => {
        expect(mockNotificationResponseListener).toBeDefined();
      });

      const response = {
        notification: {
          request: {
            identifier: 'notif-123',
            content: {
              title: 'Test',
              body: 'Test',
              data: {} as any, // Empty data object
            },
            trigger: null,
          },
          date: Date.now(),
        },
        actionIdentifier: Notifications.DEFAULT_ACTION_IDENTIFIER,
      } as Notifications.NotificationResponse;

      // Should handle empty data gracefully
      act(() => {
        mockNotificationResponseListener(response);
      });

      // Should still try to clear badge
      await waitFor(() => {
        expect(setBadgeCount).toHaveBeenCalledWith(0);
      });
    });

    it('should handle multiple rapid notifications', async () => {
      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(mockNotificationReceivedListener).toBeDefined();
      });

      const notifications = [
        {
          request: {
            identifier: 'notif-1',
            content: { title: 'Test 1', body: 'Body 1', data: {} },
            trigger: null,
          },
          date: Date.now(),
        },
        {
          request: {
            identifier: 'notif-2',
            content: { title: 'Test 2', body: 'Body 2', data: {} },
            trigger: null,
          },
          date: Date.now(),
        },
        {
          request: {
            identifier: 'notif-3',
            content: { title: 'Test 3', body: 'Body 3', data: {} },
            trigger: null,
          },
          date: Date.now(),
        },
      ] as Notifications.Notification[];

      notifications.forEach((notif) => {
        act(() => {
          mockNotificationReceivedListener(notif);
        });
      });

      // Should have the last notification
      expect(result.current.notification?.request.identifier).toBe('notif-3');
    });
  });
});
