/**
 * PostHog Wrapper - Feature Flag Integration
 *
 * Wraps PostHog SDK with feature flag checks to enable/disable analytics
 * via environment variable: EXPO_PUBLIC_ENABLE_POSTHOG
 *
 * Usage:
 *   import { posthog } from './utils/posthog-wrapper';
 *   posthog.capture('event_name', { key: 'value' });  // Only sends if feature flag enabled
 */

// PostHog will be set from _layout.tsx after initialization
let posthogInstance: any = null;

// Check if PostHog is enabled via feature flag
const isPostHogEnabled = () => process.env.EXPO_PUBLIC_ENABLE_POSTHOG === 'true';

/**
 * Set the PostHog instance (called from _layout.tsx after initialization)
 */
export function setPostHogInstance(instance: any) {
  posthogInstance = instance;
}

/**
 * PostHog wrapper that respects feature flag
 * All methods check the feature flag before calling actual PostHog methods
 */
export const posthog = {
  /**
   * Capture an event
   */
  capture(eventName: string, properties?: Record<string, any>): void {
    if (!isPostHogEnabled() || !posthogInstance) {
      console.log('[PostHog] ⏭️ Event skipped (disabled):', {
        enabled: isPostHogEnabled(),
        hasInstance: !!posthogInstance,
        eventName,
      });
      return;
    }
    try {
      console.log('[PostHog] 📊 Event captured:', {
        eventName,
        properties,
        timestamp: new Date().toISOString(),
      });
      posthogInstance.capture(eventName, properties);
    } catch (error) {
      // Silent fail - don't crash app if analytics fails
      if (__DEV__) {
        console.error('[PostHog] Capture failed:', error);
      }
    }
  },

  /**
   * Identify a user
   */
  identify(distinctId: string, properties?: Record<string, any>): void {
    if (!isPostHogEnabled() || !posthogInstance) {
      return;
    }
    try {
      posthogInstance.identify(distinctId, properties);
    } catch (error) {
      if (__DEV__) {
        console.error('[PostHog] Identify failed:', error);
      }
    }
  },

  /**
   * Reset user identity (call on logout)
   */
  reset(): void {
    if (!isPostHogEnabled() || !posthogInstance) {
      return;
    }
    try {
      posthogInstance.reset();
    } catch (error) {
      if (__DEV__) {
        console.error('[PostHog] Reset failed:', error);
      }
    }
  },

  /**
   * Set person properties (user attributes)
   */
  setPersonProperties(properties: Record<string, any>): void {
    if (!isPostHogEnabled() || !posthogInstance) {
      return;
    }
    try {
      posthogInstance.setPersonProperties(properties);
    } catch (error) {
      if (__DEV__) {
        console.error('[PostHog] SetPersonProperties failed:', error);
      }
    }
  },

  /**
   * Set person properties once (won't override existing values)
   */
  setPersonPropertiesOnce(properties: Record<string, any>): void {
    if (!isPostHogEnabled() || !posthogInstance) {
      return;
    }
    try {
      posthogInstance.setPersonPropertiesOnce(properties);
    } catch (error) {
      if (__DEV__) {
        console.error('[PostHog] SetPersonPropertiesOnce failed:', error);
      }
    }
  },

  /**
   * Start a session recording
   */
  startSessionRecording(): void {
    if (!isPostHogEnabled() || !posthogInstance) {
      return;
    }
    try {
      posthogInstance.startSessionRecording();
    } catch (error) {
      if (__DEV__) {
        console.error('[PostHog] StartSessionRecording failed:', error);
      }
    }
  },

  /**
   * Stop a session recording
   */
  stopSessionRecording(): void {
    if (!isPostHogEnabled() || !posthogInstance) {
      return;
    }
    try {
      posthogInstance.stopSessionRecording();
    } catch (error) {
      if (__DEV__) {
        console.error('[PostHog] StopSessionRecording failed:', error);
      }
    }
  },

  /**
   * Check if PostHog is currently enabled
   */
  isEnabled(): boolean {
    return isPostHogEnabled() && !!posthogInstance;
  },

  /**
   * Get the raw PostHog instance (for advanced usage)
   */
  getInstance(): any {
    return posthogInstance;
  },
};
