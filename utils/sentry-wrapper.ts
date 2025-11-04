/**
 * Sentry Wrapper - Feature Flag Integration
 *
 * Wraps Sentry SDK with feature flag checks to enable/disable error tracking
 * via environment variable: EXPO_PUBLIC_ENABLE_SENTRY
 *
 * Usage:
 *   import { sentry } from './utils/sentry-wrapper';
 *   sentry.captureException(error);  // Only sends if feature flag enabled
 */

import * as Sentry from '@sentry/react-native';

// Check if Sentry is enabled via feature flag
const isSentryEnabled = () => process.env.EXPO_PUBLIC_ENABLE_SENTRY === 'true';

/**
 * Sentry wrapper that respects feature flag
 * All methods check the feature flag before calling actual Sentry methods
 */
export const sentry = {
  /**
   * Capture an exception/error
   */
  captureException(
    exception: any,
    captureContext?: Parameters<typeof Sentry.captureException>[1]
  ): string {
    if (!isSentryEnabled()) {
      return ''; // Return empty string if disabled
    }
    return Sentry.captureException(exception, captureContext);
  },

  /**
   * Capture a message
   */
  captureMessage(
    message: string,
    captureContext?: Parameters<typeof Sentry.captureMessage>[1]
  ): string {
    if (!isSentryEnabled()) {
      return '';
    }
    return Sentry.captureMessage(message, captureContext);
  },

  /**
   * Set user context
   */
  setUser(user: Sentry.User | null): void {
    if (!isSentryEnabled()) {
      return;
    }
    Sentry.setUser(user);
  },

  /**
   * Add breadcrumb for debugging context
   */
  addBreadcrumb(breadcrumb: Sentry.Breadcrumb): void {
    if (!isSentryEnabled()) {
      return;
    }
    Sentry.addBreadcrumb(breadcrumb);
  },

  /**
   * Set tag for error grouping
   */
  setTag(key: string, value: string | number | boolean): void {
    if (!isSentryEnabled()) {
      return;
    }
    Sentry.setTag(key, value);
  },

  /**
   * Set context for additional error data
   */
  setContext(name: string, context: { [key: string]: any } | null): void {
    if (!isSentryEnabled()) {
      return;
    }
    Sentry.setContext(name, context);
  },

  /**
   * Check if Sentry is currently enabled
   */
  isEnabled(): boolean {
    return isSentryEnabled();
  },
};

// Export User and Breadcrumb types for convenience
export type { User, Breadcrumb } from '@sentry/react-native';
