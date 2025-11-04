/**
 * Centralized Logger - Sentry + Loki + PostHog Integration (2025)
 *
 * Provides unified logging interface for the app.
 * Routes logs to appropriate services based on severity and environment.
 *
 * 2025 Updates:
 * - Structured metadata for high-cardinality data (user/device/session IDs)
 * - Automatic device/session context extraction
 * - Optimized Loki integration with service account tokens
 *
 * Usage:
 *   Logger.error('Failed to create session', error, { userId, sessionId });
 *   Logger.warn('Rate limit approaching', { remaining: 5 });
 *   Logger.info('Session created successfully', { sessionId, playerCount });
 *   Logger.debug('Local variable state', { players, rounds });
 */

import { sentry } from './sentry-wrapper';
import { posthog, setPostHogInstance } from './posthog-wrapper';
import { lokiClient } from './loki-client';
import * as Device from 'expo-device';
import * as Application from 'expo-application';

// Global context for structured metadata
let deviceId: string | null = null;
let currentUserId: string | null = null;

/**
 * Set PostHog instance (called from _layout.tsx)
 * @deprecated Use setPostHogInstance from posthog-wrapper instead
 */
export function setPostHog(posthogInstance: any) {
  setPostHogInstance(posthogInstance);
}

/**
 * Initialize device context (call once on app start)
 */
export async function initializeDeviceContext() {
  try {
    // Get device ID based on platform
    if (Device.osName === 'Android') {
      deviceId = await Application.getAndroidId();
    } else {
      // For iOS, use a combination of model + brand as identifier
      deviceId = `${Device.modelName || 'unknown'}-${Device.brand || 'unknown'}`;
    }
  } catch (error) {
    if (__DEV__) {
      console.error('[Logger] Failed to get device ID:', error);
    }
  }
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
   * - Loki (production only, with structured metadata)
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

    // Send to Sentry (wrapper handles feature flag check)
    sentry.captureException(error || new Error(message), {
      level: 'error',
      tags: {
        userId: context?.userId || currentUserId || undefined,
        sessionId: context?.sessionId,
        clubId: context?.clubId,
        action: context?.action,
        screen: context?.screen,
      },
      extra: context?.metadata,
    });

    // Send to Loki with structured metadata (2025)
    lokiClient.push({
      level: 'error',
      message,
      context: {
        error: error?.message,
        stack: error?.stack,
        action: context?.action,
        screen: context?.screen,
        clubId: context?.clubId,
        ...context?.metadata,
      },
      // High-cardinality data goes in metadata (not indexed, better performance)
      metadata: {
        userId: context?.userId || currentUserId || undefined,
        deviceId: deviceId || undefined,
        sessionId: context?.sessionId,
        traceId: error?.cause ? String(error.cause) : undefined,
      },
    });

    // Track as PostHog event (wrapper handles feature flag check and error handling)
    posthog.capture('error_occurred', {
      message,
      errorType: error?.name,
      errorMessage: error?.message,
      action: context?.action,
      screen: context?.screen,
      userId: context?.userId || currentUserId,
    });
  }

  /**
   * Warning logging - Issues that should be addressed but aren't critical
   *
   * Destinations:
   * - Sentry (with warning level)
   * - Loki (production only, with structured metadata)
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

    // Send to Sentry with warning level (wrapper handles feature flag check)
    sentry.captureMessage(message, {
      level: 'warning',
      tags: {
        userId: context?.userId || currentUserId || undefined,
        sessionId: context?.sessionId,
        action: context?.action,
        screen: context?.screen,
      },
      extra: context as Record<string, any>,
    });

    // Send to Loki with structured metadata (2025)
    lokiClient.push({
      level: 'warn',
      message,
      context: {
        action: context?.action,
        screen: context?.screen,
        clubId: context?.clubId,
        ...context?.metadata,
      },
      metadata: {
        userId: context?.userId || currentUserId || undefined,
        deviceId: deviceId || undefined,
        sessionId: context?.sessionId,
      },
    });
  }

  /**
   * Info logging - Notable events and user actions
   *
   * Destinations:
   * - Loki (production only, with structured metadata)
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

    // Send to Loki with structured metadata (2025)
    lokiClient.push({
      level: 'info',
      message,
      context: {
        action: context?.action,
        screen: context?.screen,
        clubId: context?.clubId,
        ...context?.metadata,
      },
      metadata: {
        userId: context?.userId || currentUserId || undefined,
        deviceId: deviceId || undefined,
        sessionId: context?.sessionId,
      },
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
    // Store user ID for structured metadata
    currentUserId = userId;

    // Set Sentry user context (wrapper handles feature flag check)
    sentry.setUser({
      id: userId,
      email,
      ...metadata,
    });

    // Set PostHog user identity (wrapper handles feature flag check and error handling)
    posthog.identify(userId, {
      email,
      ...metadata,
    });
  }

  /**
   * Clear user context (call on logout)
   */
  static clearUser() {
    // Clear stored user ID
    currentUserId = null;

    // Clear Sentry user context (wrapper handles feature flag check)
    sentry.setUser(null);

    // Reset PostHog user (wrapper handles feature flag check and error handling)
    posthog.reset();
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
    // Wrapper handles feature flag check
    sentry.addBreadcrumb({
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
    // Send to PostHog as event (wrapper handles feature flag check and error handling)
    posthog.capture('performance_timing', {
      name,
      duration_ms: durationMs,
      ...context,
    });

    // Log to Loki with structured metadata (2025)
    lokiClient.push({
      level: 'info',
      message: `Performance: ${name} took ${durationMs}ms`,
      context: {
        timingName: name,
        durationMs,
        action: context?.action,
        screen: context?.screen,
        ...context?.metadata,
      },
      metadata: {
        userId: context?.userId || currentUserId || undefined,
        deviceId: deviceId || undefined,
        sessionId: context?.sessionId,
      },
    });

    // Log slow operations to Sentry as warnings (wrapper handles feature flag check)
    if (durationMs > 1000) {
      // >1 second is slow
      sentry.captureMessage(`Slow operation: ${name} took ${durationMs}ms`, {
        level: 'warning',
        tags: {
          operation: name,
          duration_ms: String(durationMs),
        },
        extra: context as Record<string, any>,
      });
    }
  }

  /**
   * Mask email for privacy in logs
   * Example: "user@example.com" → "u***@example.com"
   */
  static maskEmail(email: string): string {
    const [localPart, domain] = email.split('@');
    if (!domain) return email; // Invalid email
    const masked = localPart.charAt(0) + '***';
    return `${masked}@${domain}`;
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
export const maskEmail = Logger.maskEmail.bind(Logger);
