/**
 * Notification Queue Service
 *
 * Handles queuing notifications for offline support and automatic retry
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Logger } from '../utils/logger';
import { NotificationType } from './notificationsEnhanced';
import {
  NotificationError,
  NotificationErrorCode,
  errorLogger,
} from './notificationError';

const QUEUE_STORAGE_KEY = 'NOTIFICATION_QUEUE';
const MAX_QUEUE_SIZE = 100;
const MAX_RETRY_ATTEMPTS = 3;

export interface QueuedNotification {
  id: string;
  type: NotificationType;
  userId: string;
  title: string;
  body: string;
  data: Record<string, any>;
  createdAt: Date;
  attempts: number;
  lastAttempt?: Date;
  error?: string;
}

class NotificationQueue {
  private queue: QueuedNotification[] = [];
  private processing: boolean = false;
  private networkAvailable: boolean = true;

  constructor() {
    this.initializeNetworkListener();
    this.loadQueue();
  }

  /**
   * Initialize network listener
   */
  private initializeNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasOffline = !this.networkAvailable;
      this.networkAvailable = state.isConnected ?? false;

      // If we just came online, process the queue
      if (wasOffline && this.networkAvailable) {
        Logger.info('Network restored, processing notification queue');
        this.processQueue();
      }
    });
  }

  /**
   * Load queue from storage
   */
  private async loadQueue() {
    try {
      const stored = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored, (key, value) => {
          // Convert date strings back to Date objects
          if (key === 'createdAt' || key === 'lastAttempt') {
            return value ? new Date(value) : undefined;
          }
          return value;
        });
        Logger.debug(`Loaded ${this.queue.length} notifications from queue`);
      }
    } catch (error) {
      errorLogger.log(
        new NotificationError(
          NotificationErrorCode.DATABASE_ERROR,
          'Failed to load notification queue',
          error as Error,
          undefined,
          false
        )
      );
    }
  }

  /**
   * Save queue to storage
   */
  private async saveQueue() {
    try {
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      errorLogger.log(
        new NotificationError(
          NotificationErrorCode.DATABASE_ERROR,
          'Failed to save notification queue',
          error as Error,
          undefined,
          false
        )
      );
    }
  }

  /**
   * Add notification to queue
   */
  async enqueue(notification: Omit<QueuedNotification, 'id' | 'createdAt' | 'attempts'>) {
    // Check queue size
    if (this.queue.length >= MAX_QUEUE_SIZE) {
      // Remove oldest item
      this.queue.shift();
      Logger.warn('Notification queue full, removing oldest item');
    }

    const queuedNotification: QueuedNotification = {
      ...notification,
      id: this.generateId(),
      createdAt: new Date(),
      attempts: 0,
    };

    this.queue.push(queuedNotification);
    await this.saveQueue();

    Logger.debug(`Queued notification: ${notification.type}`);

    // Try to process immediately if online
    if (this.networkAvailable) {
      this.processQueue();
    }
  }

  /**
   * Process queued notifications
   */
  async processQueue() {
    if (this.processing || !this.networkAvailable || this.queue.length === 0) {
      return;
    }

    this.processing = true;
    Logger.debug(`Processing ${this.queue.length} queued notifications`);

    const results = {
      sent: 0,
      failed: 0,
      retrying: 0,
    };

    // Process each notification
    for (let i = this.queue.length - 1; i >= 0; i--) {
      const notification = this.queue[i];

      try {
        // Send notification
        await this.sendNotification(notification);

        // Remove from queue on success
        this.queue.splice(i, 1);
        results.sent++;
      } catch (error) {
        notification.attempts++;
        notification.lastAttempt = new Date();
        notification.error = (error as Error).message;

        // Remove if max attempts reached
        if (notification.attempts >= MAX_RETRY_ATTEMPTS) {
          this.queue.splice(i, 1);
          results.failed++;

          errorLogger.log(
            new NotificationError(
              NotificationErrorCode.NOTIFICATION_SEND_FAILED,
              `Failed to send notification after ${MAX_RETRY_ATTEMPTS} attempts`,
              error as Error,
              {
                notificationId: notification.id,
                type: notification.type,
              },
              false
            )
          );
        } else {
          results.retrying++;
        }
      }
    }

    await this.saveQueue();
    this.processing = false;

    Logger.info('Queue processed', { results });
  }

  /**
   * Send a notification (implement actual sending logic)
   */
  private async sendNotification(notification: QueuedNotification): Promise<void> {
    // This would be replaced with actual notification sending logic
    // For now, it's a placeholder

    // Import notification service to avoid circular dependency
    const { scheduleLocalNotification } = await import('./notificationsEnhanced');

    const notificationId = await scheduleLocalNotification(
      notification.title,
      notification.body,
      {
        type: notification.type,
        ...notification.data,
      }
    );

    if (!notificationId) {
      throw new Error('Failed to send notification');
    }
  }

  /**
   * Get queue size
   */
  getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Get queue status
   */
  getQueueStatus() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    return {
      total: this.queue.length,
      processing: this.processing,
      networkAvailable: this.networkAvailable,
      recent: this.queue.filter(n => n.createdAt > oneHourAgo).length,
      failed: this.queue.filter(n => n.attempts >= MAX_RETRY_ATTEMPTS).length,
      byType: this.groupByType(),
    };
  }

  /**
   * Clear the queue
   */
  async clearQueue() {
    this.queue = [];
    await this.saveQueue();
    Logger.info('Notification queue cleared');
  }

  /**
   * Remove specific notification from queue
   */
  async remove(notificationId: string) {
    const index = this.queue.findIndex(n => n.id === notificationId);
    if (index !== -1) {
      this.queue.splice(index, 1);
      await this.saveQueue();
    }
  }

  /**
   * Get all queued notifications
   */
  getAllQueued(): QueuedNotification[] {
    return [...this.queue];
  }

  /**
   * Get failed notifications (max attempts reached but still in queue)
   */
  getFailedNotifications(): QueuedNotification[] {
    return this.queue.filter(n => n.attempts >= MAX_RETRY_ATTEMPTS);
  }

  /**
   * Retry failed notifications
   */
  async retryFailed() {
    this.queue.forEach(n => {
      if (n.attempts >= MAX_RETRY_ATTEMPTS) {
        n.attempts = 0;
        n.lastAttempt = undefined;
        n.error = undefined;
      }
    });

    await this.saveQueue();
    this.processQueue();
  }

  // Private methods

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private groupByType(): Record<NotificationType, number> {
    const grouped: any = {};

    this.queue.forEach(notification => {
      grouped[notification.type] = (grouped[notification.type] || 0) + 1;
    });

    return grouped;
  }
}

export const notificationQueue = new NotificationQueue();
