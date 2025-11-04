/**
 * Notification Analytics Service
 *
 * Tracks notification metrics, delivery rates, and user engagement
 */

import { Logger } from '../utils/logger';
import { NotificationType } from './notificationsEnhanced';
import { supabase } from '../config/supabase';

export interface NotificationMetrics {
  sent: number;
  delivered: number;
  opened: number;
  failed: number;
  deliveryRate: number; // delivered / sent
  openRate: number; // opened / delivered
}

export interface NotificationEvent {
  id: string;
  type: NotificationType;
  status: 'sent' | 'delivered' | 'opened' | 'failed';
  userId: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

class NotificationAnalytics {
  private events: NotificationEvent[] = [];
  private readonly maxEvents = 1000;

  /**
   * Track notification sent
   */
  trackSent(type: NotificationType, userId: string, metadata?: Record<string, any>) {
    this.addEvent({
      id: this.generateId(),
      type,
      status: 'sent',
      userId,
      timestamp: new Date(),
      metadata,
    });
  }

  /**
   * Track notification delivered
   */
  trackDelivered(type: NotificationType, userId: string, metadata?: Record<string, any>) {
    this.addEvent({
      id: this.generateId(),
      type,
      status: 'delivered',
      userId,
      timestamp: new Date(),
      metadata,
    });
  }

  /**
   * Track notification opened/tapped
   */
  trackOpened(type: NotificationType, userId: string, metadata?: Record<string, any>) {
    this.addEvent({
      id: this.generateId(),
      type,
      status: 'opened',
      userId,
      timestamp: new Date(),
      metadata,
    });
  }

  /**
   * Track notification failed
   */
  trackFailed(type: NotificationType, userId: string, error: string, metadata?: Record<string, any>) {
    this.addEvent({
      id: this.generateId(),
      type,
      status: 'failed',
      userId,
      timestamp: new Date(),
      metadata: { ...metadata, error },
    });
  }

  /**
   * Get metrics for a specific notification type
   */
  getMetricsByType(type: NotificationType): NotificationMetrics {
    const typeEvents = this.events.filter(e => e.type === type);

    const sent = typeEvents.filter(e => e.status === 'sent').length;
    const delivered = typeEvents.filter(e => e.status === 'delivered').length;
    const opened = typeEvents.filter(e => e.status === 'opened').length;
    const failed = typeEvents.filter(e => e.status === 'failed').length;

    return {
      sent,
      delivered,
      opened,
      failed,
      deliveryRate: sent > 0 ? (delivered / sent) * 100 : 0,
      openRate: delivered > 0 ? (opened / delivered) * 100 : 0,
    };
  }

  /**
   * Get overall metrics across all notification types
   */
  getOverallMetrics(): NotificationMetrics {
    const sent = this.events.filter(e => e.status === 'sent').length;
    const delivered = this.events.filter(e => e.status === 'delivered').length;
    const opened = this.events.filter(e => e.status === 'opened').length;
    const failed = this.events.filter(e => e.status === 'failed').length;

    return {
      sent,
      delivered,
      opened,
      failed,
      deliveryRate: sent > 0 ? (delivered / sent) * 100 : 0,
      openRate: delivered > 0 ? (opened / delivered) * 100 : 0,
    };
  }

  /**
   * Get metrics for a specific user
   */
  getUserMetrics(userId: string): NotificationMetrics {
    const userEvents = this.events.filter(e => e.userId === userId);

    const sent = userEvents.filter(e => e.status === 'sent').length;
    const delivered = userEvents.filter(e => e.status === 'delivered').length;
    const opened = userEvents.filter(e => e.status === 'opened').length;
    const failed = userEvents.filter(e => e.status === 'failed').length;

    return {
      sent,
      delivered,
      opened,
      failed,
      deliveryRate: sent > 0 ? (delivered / sent) * 100 : 0,
      openRate: delivered > 0 ? (opened / delivered) * 100 : 0,
    };
  }

  /**
   * Get events within a time range
   */
  getEventsByTimeRange(startDate: Date, endDate: Date): NotificationEvent[] {
    return this.events.filter(
      e => e.timestamp >= startDate && e.timestamp <= endDate
    );
  }

  /**
   * Get most engaged notification types
   */
  getMostEngagedTypes(): Array<{ type: NotificationType; openRate: number }> {
    const types = Object.values(NotificationType);

    return types
      .map(type => ({
        type,
        openRate: this.getMetricsByType(type).openRate,
      }))
      .sort((a, b) => b.openRate - a.openRate);
  }

  /**
   * Save analytics to Supabase for long-term storage
   */
  async saveAnalytics(userId: string) {
    try {
      const metrics = this.getUserMetrics(userId);

      const { error } = await supabase
        .from('notification_analytics')
        .insert({
          user_id: userId,
          metrics,
          timestamp: new Date().toISOString(),
        });

      if (error) throw error;
    } catch (error) {
      Logger.error('Failed to save notification analytics', error as Error, {
        action: 'save_analytics',
        userId,
      });
    }
  }

  /**
   * Get analytics summary for dashboard
   */
  getSummary() {
    const overall = this.getOverallMetrics();
    const mostEngaged = this.getMostEngagedTypes().slice(0, 3);

    const last24Hours = this.getEventsByTimeRange(
      new Date(Date.now() - 24 * 60 * 60 * 1000),
      new Date()
    );

    return {
      overall,
      mostEngaged,
      last24Hours: {
        total: last24Hours.length,
        byType: this.groupByType(last24Hours),
      },
    };
  }

  /**
   * Clear old events to prevent memory issues
   */
  clearOldEvents(daysToKeep: number = 30) {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    this.events = this.events.filter(e => e.timestamp >= cutoffDate);
  }

  /**
   * Reset all analytics (useful for testing)
   */
  reset() {
    this.events = [];
  }

  // Private methods

  private addEvent(event: NotificationEvent) {
    this.events.push(event);

    // Keep only recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Auto-cleanup old events periodically
    if (this.events.length % 100 === 0) {
      this.clearOldEvents();
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private groupByType(events: NotificationEvent[]): Record<NotificationType, number> {
    const grouped: any = {};

    events.forEach(event => {
      grouped[event.type] = (grouped[event.type] || 0) + 1;
    });

    return grouped;
  }
}

export const notificationAnalytics = new NotificationAnalytics();

/**
 * Performance Monitor
 */
class PerformanceMonitor {
  private measurements: Map<string, number[]> = new Map();

  /**
   * Start measuring an operation
   */
  start(operation: string): () => void {
    const startTime = Date.now();

    return () => {
      const duration = Date.now() - startTime;
      this.record(operation, duration);
    };
  }

  /**
   * Record a measurement
   */
  record(operation: string, duration: number) {
    if (!this.measurements.has(operation)) {
      this.measurements.set(operation, []);
    }

    const measurements = this.measurements.get(operation)!;
    measurements.push(duration);

    // Keep only last 100 measurements
    if (measurements.length > 100) {
      measurements.shift();
    }
  }

  /**
   * Get statistics for an operation
   */
  getStats(operation: string) {
    const measurements = this.measurements.get(operation) || [];

    if (measurements.length === 0) {
      return null;
    }

    const sorted = [...measurements].sort((a, b) => a - b);
    const sum = measurements.reduce((a, b) => a + b, 0);

    return {
      count: measurements.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      mean: sum / measurements.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  }

  /**
   * Get all performance stats
   */
  getAllStats() {
    const stats: Record<string, any> = {};

    this.measurements.forEach((_, operation) => {
      stats[operation] = this.getStats(operation);
    });

    return stats;
  }

  /**
   * Clear all measurements
   */
  reset() {
    this.measurements.clear();
  }
}

export const performanceMonitor = new PerformanceMonitor();
