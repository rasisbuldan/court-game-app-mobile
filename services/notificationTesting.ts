/**
 * Notification Testing and Health Check Utilities
 *
 * Tools for testing notification functionality and monitoring system health
 */

import * as Notifications from 'expo-notifications';
import {
  registerForPushNotifications,
  scheduleLocalNotification,
  getBadgeCount,
  setBadgeCount,
  areNotificationsEnabled,
  getHealthStatus,
  NotificationType,
  NotificationTemplates,
} from './notificationsEnhanced';
import { tokenManager } from './tokenManager';
import { notificationQueue } from './notificationQueue';
import { notificationAnalytics, performanceMonitor } from './notificationAnalytics';
import { errorLogger } from './notificationError';

export interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
  details?: any;
}

export interface HealthCheckResult {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  checks: {
    permissions: TestResult;
    tokenRegistration: TestResult;
    localNotifications: TestResult;
    badgeSupport: TestResult;
    database: TestResult;
    queue: TestResult;
  };
  metrics: {
    errorCount: number;
    queueSize: number;
    cacheSize: number;
  };
}

/**
 * Test Notification Permissions
 */
async function testPermissions(): Promise<TestResult> {
  const startTime = Date.now();
  try {
    const enabled = await areNotificationsEnabled();
    return {
      name: 'Permissions',
      passed: enabled,
      duration: Date.now() - startTime,
      details: { enabled },
    };
  } catch (error) {
    return {
      name: 'Permissions',
      passed: false,
      duration: Date.now() - startTime,
      error: (error as Error).message,
    };
  }
}

/**
 * Test Token Registration
 */
async function testTokenRegistration(): Promise<TestResult> {
  const startTime = Date.now();
  try {
    const token = await registerForPushNotifications();
    return {
      name: 'Token Registration',
      passed: token !== null,
      duration: Date.now() - startTime,
      details: {
        tokenLength: token?.length,
        format: token?.substring(0, 20) + '...',
      },
    };
  } catch (error) {
    return {
      name: 'Token Registration',
      passed: false,
      duration: Date.now() - startTime,
      error: (error as Error).message,
    };
  }
}

/**
 * Test Local Notifications
 */
async function testLocalNotifications(): Promise<TestResult> {
  const startTime = Date.now();
  try {
    const notificationId = await scheduleLocalNotification(
      'Test Notification',
      'This is a test notification',
      { type: NotificationType.SESSION_INVITE },
      { seconds: 1 }
    );

    // Cancel the test notification
    if (notificationId) {
      setTimeout(async () => {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
      }, 2000);
    }

    return {
      name: 'Local Notifications',
      passed: notificationId !== null,
      duration: Date.now() - startTime,
      details: { notificationId },
    };
  } catch (error) {
    return {
      name: 'Local Notifications',
      passed: false,
      duration: Date.now() - startTime,
      error: (error as Error).message,
    };
  }
}

/**
 * Test Badge Support
 */
async function testBadgeSupport(): Promise<TestResult> {
  const startTime = Date.now();
  try {
    const initialCount = await getBadgeCount();
    await setBadgeCount(5);
    const newCount = await getBadgeCount();
    await setBadgeCount(initialCount); // Reset

    return {
      name: 'Badge Support',
      passed: true,
      duration: Date.now() - startTime,
      details: { initialCount, testCount: newCount },
    };
  } catch (error) {
    return {
      name: 'Badge Support',
      passed: false,
      duration: Date.now() - startTime,
      error: (error as Error).message,
    };
  }
}

/**
 * Test Database Connection
 */
async function testDatabase(userId?: string): Promise<TestResult> {
  const startTime = Date.now();
  try {
    if (!userId) {
      return {
        name: 'Database',
        passed: false,
        duration: Date.now() - startTime,
        error: 'User ID required for database test',
      };
    }

    const tokens = await tokenManager.getUserTokens(userId);
    const stats = await tokenManager.getTokenStats(userId);

    return {
      name: 'Database',
      passed: true,
      duration: Date.now() - startTime,
      details: { tokenCount: tokens.length, stats },
    };
  } catch (error) {
    return {
      name: 'Database',
      passed: false,
      duration: Date.now() - startTime,
      error: (error as Error).message,
    };
  }
}

/**
 * Test Notification Queue
 */
async function testQueue(): Promise<TestResult> {
  const startTime = Date.now();
  try {
    const status = notificationQueue.getQueueStatus();

    return {
      name: 'Notification Queue',
      passed: true,
      duration: Date.now() - startTime,
      details: status,
    };
  } catch (error) {
    return {
      name: 'Notification Queue',
      passed: false,
      duration: Date.now() - startTime,
      error: (error as Error).message,
    };
  }
}

/**
 * Run all health checks
 */
export async function runHealthChecks(userId?: string): Promise<HealthCheckResult> {
  console.log('Running notification system health checks...');

  const [permissions, tokenReg, localNotifs, badge, database, queue] = await Promise.all([
    testPermissions(),
    testTokenRegistration(),
    testLocalNotifications(),
    testBadgeSupport(),
    testDatabase(userId),
    testQueue(),
  ]);

  const checks = {
    permissions,
    tokenRegistration: tokenReg,
    localNotifications: localNotifs,
    badgeSupport: badge,
    database,
    queue,
  };

  // Calculate overall health
  const failedChecks = Object.values(checks).filter(c => !c.passed).length;
  let overall: 'healthy' | 'degraded' | 'unhealthy';

  if (failedChecks === 0) {
    overall = 'healthy';
  } else if (failedChecks <= 2) {
    overall = 'degraded';
  } else {
    overall = 'unhealthy';
  }

  const result: HealthCheckResult = {
    overall,
    timestamp: new Date(),
    checks,
    metrics: {
      errorCount: errorLogger.getRecentErrors(10).length,
      queueSize: notificationQueue.getQueueSize(),
      cacheSize: tokenManager.getCacheSize(),
    },
  };

  console.log('Health check complete:', overall);
  return result;
}

/**
 * Send test notification to current device
 */
export async function sendTestNotification(type: NotificationType = NotificationType.SESSION_INVITE) {
  const templates = {
    [NotificationType.SESSION_INVITE]: NotificationTemplates.sessionInvite('Test Session', 'Test User'),
    [NotificationType.CLUB_INVITE]: NotificationTemplates.clubInvite('Test Club', 'Test User'),
    [NotificationType.SESSION_STARTING]: NotificationTemplates.sessionStarting('Test Session', 30),
    [NotificationType.ROUND_COMPLETE]: NotificationTemplates.roundComplete('Test Session', 1),
    [NotificationType.MATCH_REMINDER]: NotificationTemplates.matchReminder(['Player 1', 'Player 2'], 1),
    [NotificationType.LEADERBOARD_UPDATE]: NotificationTemplates.leaderboardUpdate('Test Session', 1),
    [NotificationType.CLUB_ANNOUNCEMENT]: NotificationTemplates.clubAnnouncement('Test Club', 'This is a test announcement'),
  };

  const template = templates[type];

  const notificationId = await scheduleLocalNotification(
    template.title,
    template.body,
    { type: template.type },
    { seconds: 2 } // Schedule for 2 seconds from now
  );

  return {
    notificationId,
    type,
    scheduledFor: new Date(Date.now() + 2000),
  };
}

/**
 * Generate test report
 */
export async function generateTestReport(userId?: string): Promise<string> {
  const healthCheck = await runHealthChecks(userId);
  const analytics = notificationAnalytics.getSummary();
  const performance = performanceMonitor.getAllStats();
  const errorStats = errorLogger.getErrorStats();

  const report = `
===========================================
Notification System Test Report
===========================================
Generated: ${healthCheck.timestamp.toISOString()}
Overall Health: ${healthCheck.overall.toUpperCase()}

-------------------------------------------
System Checks
-------------------------------------------
${Object.entries(healthCheck.checks)
  .map(
    ([name, result]) =>
      `${result.passed ? '✓' : '✗'} ${name}: ${result.passed ? 'PASSED' : 'FAILED'}${
        result.error ? ` (${result.error})` : ''
      } (${result.duration}ms)`
  )
  .join('\n')}

-------------------------------------------
Metrics
-------------------------------------------
Error Count (last 10): ${healthCheck.metrics.errorCount}
Queue Size: ${healthCheck.metrics.queueSize}
Token Cache Size: ${healthCheck.metrics.cacheSize}

-------------------------------------------
Analytics
-------------------------------------------
Overall Metrics:
  Sent: ${analytics.overall.sent}
  Delivered: ${analytics.overall.delivered}
  Opened: ${analytics.overall.opened}
  Failed: ${analytics.overall.failed}
  Delivery Rate: ${analytics.overall.deliveryRate.toFixed(2)}%
  Open Rate: ${analytics.overall.openRate.toFixed(2)}%

Last 24 Hours: ${analytics.last24Hours.total} notifications

Most Engaged Types:
${analytics.mostEngaged
  .map((t, i) => `  ${i + 1}. ${t.type}: ${t.openRate.toFixed(2)}% open rate`)
  .join('\n')}

-------------------------------------------
Performance
-------------------------------------------
${Object.entries(performance)
  .map(
    ([operation, stats]: [string, any]) =>
      stats
        ? `${operation}:
  Mean: ${stats.mean.toFixed(2)}ms
  Median: ${stats.median.toFixed(2)}ms
  P95: ${stats.p95.toFixed(2)}ms
  P99: ${stats.p99.toFixed(2)}ms`
        : ''
  )
  .filter(Boolean)
  .join('\n\n')}

-------------------------------------------
Error Statistics
-------------------------------------------
${Object.entries(errorStats)
  .map(([code, count]) => `${code}: ${count}`)
  .join('\n') || 'No errors recorded'}

===========================================
`;

  return report;
}

/**
 * Benchmark notification operations
 */
export async function benchmarkNotifications(iterations: number = 10) {
  const results = {
    tokenRegistration: [] as number[],
    localNotification: [] as number[],
    badgeUpdate: [] as number[],
  };

  console.log(`Running benchmark with ${iterations} iterations...`);

  for (let i = 0; i < iterations; i++) {
    // Test token registration
    const tokenStart = Date.now();
    await registerForPushNotifications();
    results.tokenRegistration.push(Date.now() - tokenStart);

    // Test local notification
    const notifStart = Date.now();
    const notifId = await scheduleLocalNotification(
      'Benchmark',
      'Test',
      { type: NotificationType.SESSION_INVITE },
      { seconds: 60 } // Schedule far in future
    );
    results.localNotification.push(Date.now() - notifStart);

    // Clean up
    if (notifId) {
      await Notifications.cancelScheduledNotificationAsync(notifId);
    }

    // Test badge update
    const badgeStart = Date.now();
    await setBadgeCount(i);
    results.badgeUpdate.push(Date.now() - badgeStart);
  }

  const calculateStats = (values: number[]) => {
    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      mean: sum / values.length,
      median: sorted[Math.floor(sorted.length / 2)],
    };
  };

  return {
    iterations,
    tokenRegistration: calculateStats(results.tokenRegistration),
    localNotification: calculateStats(results.localNotification),
    badgeUpdate: calculateStats(results.badgeUpdate),
  };
}
