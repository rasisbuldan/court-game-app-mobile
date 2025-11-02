/**
 * Centralized Logger - Sentry + Loki + PostHog Integration
 *
 * Provides unified logging interface for the app.
 * Routes logs to appropriate services based on severity and environment.
 *
 * Usage:
 *   Logger.error('Failed to create session', error, { userId, sessionId });
 *   Logger.warn('Rate limit approaching', { remaining: 5 });
 *   Logger.info('Session created successfully', { sessionId, playerCount });
 *   Logger.debug('Local variable state', { players, rounds });
 */

import * as Sentry from '@sentry/react-native';
import { lokiClient } from './loki-client';

// PostHog will be initialized in _layout.tsx and imported here
// For now, we'll use a lazy reference to avoid circular dependencies
let posthog: any = null;

export function setPostHog(posthogInstance: any) {
  posthog = posthogInstance;
}

// ============================================================================
// Types
// ============================================================================

export interface LogContext {
  userId?: string;
  sessionId?: string;
  clubId?: string;
  action?: string;
  screen?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// Logger Class
// ============================================================================

export class Logger {
  /**
   * Error logging - Critical issues that need immediate attention
   *
   * Destinations:
   * - Sentry (always, with high priority)
   * - Loki (production only)
   * - PostHog (as error event)
   * - Console (development only)
   *
   * Use for:
   * - API failures
   * - Database errors
   * - Unhandled exceptions
   * - Critical user-facing errors
   */
  static error(message: string, error?: Error, context?: LogContext) {
    // Console in development only
    if (__DEV__) {
      console.error(`[ERROR] ${message}`, error, context);
    }

    // Send to Sentry (always, even in dev if you want to test)
    Sentry.captureException(error || new Error(message), {
      level: 'error',
      tags: {
        userId: context?.userId,
        sessionId: context?.sessionId,
        clubId: context?.clubId,
        action: context?.action,
        screen: context?.screen,
      },
      extra: context?.metadata,
    });

    // Send to Loki (production only)
    lokiClient.push({
      level: 'error',
      message,
      context: {
        error: error?.message,
        stack: error?.stack,
        ...context,
      },
    });

    // Track as PostHog event (helps correlate errors with user behavior)
    if (posthog) {
      posthog.capture('error_occurred', {
        message,
        errorType: error?.name,
        errorMessage: error?.message,
        action: context?.action,
        screen: context?.screen,
        userId: context?.userId,
      });
    }
  }

  /**
   * Warning logging - Issues that should be addressed but aren't critical
   *
   * Destinations:
   * - Sentry (with warning level)
   * - Loki (production only)
   * - Console (development only)
   *
   * Use for:
   * - Recoverable errors
   * - Deprecated feature usage
   * - Rate limit warnings
   * - Unexpected but handled states
   */
  static warn(message: string, context?: LogContext) {
    if (__DEV__) {
      console.warn(`[WARN] ${message}`, context);
    }

    // Send to Sentry with warning level
    Sentry.captureMessage(message, {
      level: 'warning',
      tags: {
        userId: context?.userId,
        sessionId: context?.sessionId,
        action: context?.action,
        screen: context?.screen,
      },
      extra: context,
    });

    // Send to Loki (production only)
    lokiClient.push({
      level: 'warn',
      message,
      context,
    });
  }

  /**
   * Info logging - Notable events and user actions
   *
   * Destinations:
   * - Loki (production only)
   * - Console (development only)
   *
   * Use for:
   * - User actions (create session, join club, etc.)
   * - State changes (online/offline, login/logout)
   * - API calls (start/complete)
   * - Feature usage tracking
   */
  static info(message: string, context?: LogContext) {
    if (__DEV__) {
      console.log(`[INFO] ${message}`, context);
    }

    // Send to Loki (production only)
    lokiClient.push({
      level: 'info',
      message,
      context,
    });
  }

  /**
   * Debug logging - Development-only detailed information
   *
   * Destinations:
   * - Console (development only)
   *
   * Use for:
   * - Variable inspection
   * - Flow debugging
   * - Performance measurements
   * - Temporary investigation logs
   */
  static debug(message: string, data?: any) {
    if (__DEV__) {
      console.log(`[DEBUG] ${message}`, data);
    }
    // Note: Debug logs are NOT sent to Loki or Sentry (too verbose, costs money)
  }

  /**
   * Set user context for all logging services
   *
   * Call this after user login to associate logs with specific users
   */
  static setUser(userId: string, email?: string, metadata?: Record<string, any>) {
    // Set Sentry user context
    Sentry.setUser({
      id: userId,
      email,
      ...metadata,
    });

    // Set PostHog user identity
    if (posthog) {
      posthog.identify(userId, {
        email,
        ...metadata,
      });
    }
  }

  /**
   * Clear user context (call on logout)
   */
  static clearUser() {
    Sentry.setUser(null);

    if (posthog) {
      posthog.reset();
    }
  }

  /**
   * Add breadcrumb for debugging context
   *
   * Breadcrumbs are attached to error reports to show what led to the error
   */
  static addBreadcrumb(
    category: string,
    message: string,
    level: 'debug' | 'info' | 'warning' | 'error' = 'info',
    data?: Record<string, any>
  ) {
    Sentry.addBreadcrumb({
      category,
      message,
      level,
      data,
      timestamp: Date.now() / 1000,
    });
  }

  /**
   * Track performance timing
   *
   * Use for measuring critical operations like:
   * - Screen load time
   * - API response time
   * - Algorithm execution time
   */
  static timing(name: string, durationMs: number, context?: LogContext) {
    // Send to PostHog as event
    if (posthog) {
      posthog.capture('performance_timing', {
        name,
        duration_ms: durationMs,
        ...context,
      });
    }

    // Log to Loki for analysis
    lokiClient.push({
      level: 'info',
      message: `Performance: ${name} took ${durationMs}ms`,
      context: {
        timingName: name,
        durationMs,
        ...context,
      },
    });

    // Log slow operations to Sentry as warnings
    if (durationMs > 1000) {
      // >1 second is slow
      Sentry.captureMessage(`Slow operation: ${name} took ${durationMs}ms`, {
        level: 'warning',
        tags: {
          operation: name,
          duration_ms: String(durationMs),
        },
        extra: context,
      });
    }
  }
}

// ============================================================================
// Convenience Exports
// ============================================================================

export const error = Logger.error.bind(Logger);
export const warn = Logger.warn.bind(Logger);
export const info = Logger.info.bind(Logger);
export const debug = Logger.debug.bind(Logger);
export const setUser = Logger.setUser.bind(Logger);
export const clearUser = Logger.clearUser.bind(Logger);
export const addBreadcrumb = Logger.addBreadcrumb.bind(Logger);
export const timing = Logger.timing.bind(Logger);
