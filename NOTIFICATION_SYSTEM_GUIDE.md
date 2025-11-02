# Robust Notification System Guide

## Overview

This guide covers the production-ready notification system with comprehensive error handling, monitoring, analytics, and recovery mechanisms.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Notification System Architecture                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐         │
│  │              │    │              │    │              │         │
│  │  Enhanced    │───▶│    Token     │───▶│  Supabase    │         │
│  │  Notification│    │   Manager    │    │  Database    │         │
│  │   Service    │    │              │    │              │         │
│  │              │    └──────────────┘    └──────────────┘         │
│  └──────┬───────┘                                                   │
│         │                                                            │
│         ▼                                                            │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐         │
│  │              │    │              │    │              │         │
│  │   Circuit    │    │    Rate      │    │   Offline    │         │
│  │   Breaker    │    │   Limiter    │    │    Queue     │         │
│  │              │    │              │    │              │         │
│  └──────────────┘    └──────────────┘    └──────────────┘         │
│                                                                       │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐         │
│  │              │    │              │    │              │         │
│  │  Analytics   │    │   Health     │    │    Error     │         │
│  │   Service    │    │   Monitor    │    │   Logger     │         │
│  │              │    │              │    │              │         │
│  └──────────────┘    └──────────────┘    └──────────────┘         │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Enhanced Notification Service (`notificationsEnhanced.ts`)

The main service with comprehensive error handling and retry logic.

**Features**:
- Device validation before registration
- Permission request with error handling
- Token validation and format checking
- Android channel setup with fallback
- Rate limiting (20 notifications/minute)
- Circuit breaker protection
- Exponential backoff retry

**Example Usage**:
```typescript
import { registerForPushNotifications } from '@/services/notificationsEnhanced';

// Register for notifications (handles all errors internally)
const token = await registerForPushNotifications();

if (token) {
  console.log('Successfully registered:', token);
} else {
  console.log('Registration failed - check error logs');
}
```

### 2. Error Handling System (`notificationError.ts`)

Sophisticated error handling with categorization and logging.

**Error Codes**:
- `PERMISSION_DENIED` - User denied permissions
- `TOKEN_REGISTRATION_FAILED` - Failed to get push token
- `TOKEN_SAVE_FAILED` - Failed to save token to database
- `NOTIFICATION_SEND_FAILED` - Failed to send notification
- `INVALID_TOKEN` - Token format invalid
- `NETWORK_ERROR` - Network connectivity issue
- `DATABASE_ERROR` - Database operation failed
- `DEVICE_NOT_SUPPORTED` - Device doesn't support push
- `PROJECT_ID_MISSING` - EAS project ID not configured
- `CHANNEL_SETUP_FAILED` - Android channel creation failed
- `RATE_LIMIT_EXCEEDED` - Too many requests

**Example Usage**:
```typescript
import { errorLogger, NotificationError } from '@/services/notificationError';

// Get recent errors
const recentErrors = errorLogger.getRecentErrors(10);

// Get errors by code
const permissionErrors = errorLogger.getErrorsByCode('PERMISSION_DENIED');

// Get error statistics
const stats = errorLogger.getErrorStats();
console.log('Permission errors:', stats.PERMISSION_DENIED);
```

**Circuit Breaker**:
```typescript
import { CircuitBreaker } from '@/services/notificationError';

const breaker = new CircuitBreaker(
  5,      // Threshold: 5 failures
  60000,  // Timeout: 1 minute
  3       // Half-open attempts
);

// Execute with circuit breaker protection
const result = await breaker.execute(async () => {
  return await riskyOperation();
});
```

**Rate Limiter**:
```typescript
import { RateLimiter } from '@/services/notificationError';

const limiter = new RateLimiter(
  10,     // Max 10 requests
  60000   // Per minute
);

// Throttle operation
try {
  await limiter.throttle(async () => {
    return await sendNotification();
  });
} catch (error) {
  // Handle rate limit error
}
```

### 3. Token Manager (`tokenManager.ts`)

Manages push token lifecycle with validation and cleanup.

**Features**:
- Token format validation
- Automatic stale token cleanup (90 days)
- Token cache for performance
- Batch token validation
- Last-used timestamp tracking
- Token statistics

**Example Usage**:
```typescript
import { tokenManager } from '@/services/tokenManager';

// Save token with validation
await tokenManager.saveToken(userId, token);

// Get user's tokens
const tokens = await tokenManager.getUserTokens(userId);

// Clean up stale tokens
const cleaned = await tokenManager.cleanupStaleTokens(userId);

// Get token statistics
const stats = await tokenManager.getTokenStats(userId);
console.log('Valid tokens:', stats.valid);
console.log('Stale tokens:', stats.stale);

// Invalidate token
await tokenManager.invalidateToken(token);
```

### 4. Notification Queue (`notificationQueue.ts`)

Offline support with automatic retry and network detection.

**Features**:
- Offline notification queuing
- Automatic retry on network restore
- Max 3 retry attempts per notification
- Queue persistence in AsyncStorage
- Network state monitoring
- Queue size management (max 100)

**Example Usage**:
```typescript
import { notificationQueue } from '@/services/notificationQueue';

// Queue a notification (auto-sends when online)
await notificationQueue.enqueue({
  type: NotificationType.SESSION_INVITE,
  userId: 'user-123',
  title: 'Session Invitation',
  body: 'You have been invited',
  data: { sessionId: 'session-456' },
});

// Check queue status
const status = notificationQueue.getQueueStatus();
console.log('Queued:', status.total);
console.log('Online:', status.networkAvailable);

// Manually process queue
await notificationQueue.processQueue();

// Retry failed notifications
await notificationQueue.retryFailed();
```

### 5. Analytics Service (`notificationAnalytics.ts`)

Track notification metrics and user engagement.

**Metrics Tracked**:
- Notifications sent
- Delivery rate
- Open rate (tap-through)
- Failed notifications
- Type-specific metrics
- User-specific metrics

**Example Usage**:
```typescript
import { notificationAnalytics } from '@/services/notificationAnalytics';

// Track events
notificationAnalytics.trackSent(NotificationType.SESSION_INVITE, userId);
notificationAnalytics.trackDelivered(NotificationType.SESSION_INVITE, userId);
notificationAnalytics.trackOpened(NotificationType.SESSION_INVITE, userId);

// Get metrics
const overall = notificationAnalytics.getOverallMetrics();
console.log('Delivery rate:', overall.deliveryRate);
console.log('Open rate:', overall.openRate);

// Get metrics by type
const sessionInviteMetrics = notificationAnalytics.getMetricsByType(
  NotificationType.SESSION_INVITE
);

// Get user metrics
const userMetrics = notificationAnalytics.getUserMetrics(userId);

// Get summary for dashboard
const summary = notificationAnalytics.getSummary();
```

**Performance Monitoring**:
```typescript
import { performanceMonitor } from '@/services/notificationAnalytics';

// Measure operation
const end = performanceMonitor.start('tokenRegistration');
await registerForPushNotifications();
end(); // Records duration

// Get statistics
const stats = performanceMonitor.getStats('tokenRegistration');
console.log('Mean:', stats.mean, 'ms');
console.log('P95:', stats.p95, 'ms');
```

### 6. Testing & Health Checks (`notificationTesting.ts`)

Comprehensive testing utilities and health monitoring.

**Example Usage**:
```typescript
import {
  runHealthChecks,
  sendTestNotification,
  generateTestReport,
  benchmarkNotifications,
} from '@/services/notificationTesting';

// Run health checks
const health = await runHealthChecks(userId);
console.log('Overall health:', health.overall); // healthy | degraded | unhealthy

// Check specific components
if (!health.checks.permissions.passed) {
  console.log('Permissions issue:', health.checks.permissions.error);
}

// Send test notification
const test = await sendTestNotification(NotificationType.SESSION_INVITE);
console.log('Test notification scheduled for:', test.scheduledFor);

// Generate full report
const report = await generateTestReport(userId);
console.log(report);

// Run performance benchmark
const benchmark = await benchmarkNotifications(10);
console.log('Token registration mean:', benchmark.tokenRegistration.mean, 'ms');
```

## Error Handling Best Practices

### 1. Always Check Return Values

```typescript
// ❌ Bad - assumes success
const token = await registerForPushNotifications();
await savePushToken(userId, token);

// ✅ Good - handles failure
const token = await registerForPushNotifications();
if (token) {
  await savePushToken(userId, token);
} else {
  console.warn('Failed to register - check error logs');
  // Fallback: Queue for retry or notify user
}
```

### 2. Use Try-Catch for Critical Operations

```typescript
try {
  await scheduleLocalNotification(title, body, data);
  notificationAnalytics.trackSent(data.type, userId);
} catch (error) {
  console.error('Failed to send notification:', error);
  notificationAnalytics.trackFailed(data.type, userId, error.message);

  // Fallback: Add to queue for retry
  await notificationQueue.enqueue({ type, userId, title, body, data });
}
```

### 3. Monitor Error Logs Regularly

```typescript
// In production, periodically check error logs
setInterval(() => {
  const errorStats = errorLogger.getErrorStats();

  // Alert if high error rate
  const totalErrors = Object.values(errorStats).reduce((a, b) => a + b, 0);
  if (totalErrors > 10) {
    console.warn('High error rate detected:', errorStats);
    // Send alert to monitoring service
  }
}, 60000); // Every minute
```

### 4. Implement Graceful Degradation

```typescript
// Try to send notification, fall back to in-app badge
try {
  await sendPushNotification(userId, message);
} catch (error) {
  // Fallback: Show in-app notification
  showInAppNotification(message);

  // Queue for retry when network restores
  await notificationQueue.enqueue({...});
}
```

## Production Checklist

### Setup

- [ ] EAS project ID configured in app.json
- [ ] APNs credentials uploaded (iOS)
- [ ] FCM server key uploaded (Android)
- [ ] Database migration applied (push_tokens, notification_preferences)
- [ ] NetInfo package installed for offline detection

### Testing

- [ ] Health checks pass on both platforms
- [ ] Test notifications delivered successfully
- [ ] Permission flow works correctly
- [ ] Offline queue functions properly
- [ ] Token validation works
- [ ] Circuit breaker triggers on failures
- [ ] Rate limiter prevents spam

### Monitoring

- [ ] Error logging integrated with monitoring service (Sentry, etc.)
- [ ] Analytics dashboard set up
- [ ] Performance metrics tracked
- [ ] Health checks run periodically
- [ ] Alert thresholds configured

### Performance

- [ ] Token operations cached
- [ ] Batch operations used where possible
- [ ] Queue processed efficiently
- [ ] Old errors cleaned up regularly
- [ ] Stale tokens removed periodically

## Troubleshooting

### High Error Rate

```typescript
// Check error statistics
const errorStats = errorLogger.getErrorStats();
console.log('Error breakdown:', errorStats);

// Check health
const health = await runHealthChecks(userId);
console.log('System health:', health.overall);

// Check circuit breaker state
import { pushTokenCircuitBreaker } from '@/services/notificationsEnhanced';
console.log('Circuit breaker:', pushTokenCircuitBreaker.getState());
```

### Notifications Not Delivered

```typescript
// Check queue status
const queueStatus = notificationQueue.getQueueStatus();
if (!queueStatus.networkAvailable) {
  console.log('Device offline - notifications queued');
}

// Check token validity
const tokens = await tokenManager.getUserTokens(userId);
const validTokens = tokens.filter(t => t.is_valid);
if (validTokens.length === 0) {
  console.log('No valid tokens - need to re-register');
}
```

### Performance Issues

```typescript
// Check performance stats
const perfStats = performanceMonitor.getAllStats();
console.log('Performance metrics:', perfStats);

// Run benchmark
const benchmark = await benchmarkNotifications(5);
if (benchmark.tokenRegistration.mean > 5000) {
  console.warn('Slow token registration - check network');
}
```

## Integration with Existing Code

### Update useNotifications Hook

```typescript
import { registerForPushNotifications, savePushToken } from '@/services/notificationsEnhanced';
import { notificationAnalytics } from '@/services/notificationAnalytics';
import { tokenManager } from '@/services/tokenManager';

export function useNotifications() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Register with enhanced service
    registerForPushNotifications()
      .then(token => {
        if (token) {
          // Save with token manager
          tokenManager.saveToken(user.id, token);
        }
      })
      .catch(console.error);
  }, [user]);

  // Track notification opened
  const handleNotificationTap = (notification) => {
    notificationAnalytics.trackOpened(
      notification.data.type,
      user.id,
      notification.data
    );
    // ... navigate
  };
}
```

### Migration Path

1. **Phase 1**: Deploy enhanced services alongside existing code
2. **Phase 2**: Update hooks to use new services
3. **Phase 3**: Enable monitoring and analytics
4. **Phase 4**: Remove old notification code

## Performance Benchmarks

Expected performance on typical devices:

| Operation | iOS | Android |
|-----------|-----|---------|
| Token Registration | 200-500ms | 300-800ms |
| Local Notification | 50-100ms | 100-200ms |
| Badge Update | 10-20ms | 20-50ms |
| Database Save | 100-300ms | 100-300ms |

## Support & Resources

- Error logs: Check `errorLogger.getRecentErrors()`
- Health status: Run `runHealthChecks()`
- Performance: Check `performanceMonitor.getAllStats()`
- Analytics: Review `notificationAnalytics.getSummary()`

---

**Last Updated**: 2025-01-01
**Version**: 2.0 (Production-Ready)
