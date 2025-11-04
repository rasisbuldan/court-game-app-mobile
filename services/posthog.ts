/**
 * PostHog Analytics Service
 *
 * Initializes and configures PostHog for product analytics.
 * Integrates with Logger for automatic event tracking.
 */

import PostHog from 'posthog-react-native';
import { setPostHogInstance } from '../utils/posthog-wrapper';
import { Logger } from '../utils/logger';

let posthogClient: PostHog | null = null;

/**
 * Initialize PostHog client
 * Call this once when the app starts
 */
export async function initializePostHog(): Promise<PostHog | null> {
  // Skip if already initialized
  if (posthogClient) {
    return posthogClient;
  }

  const apiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY;

  // Skip if no API key (development without PostHog)
  if (!apiKey) {
    if (__DEV__) {
      Logger.debug('PostHog: No API key found, skipping initialization');
    }
    return null;
  }

  try {
    // Initialize PostHog
    posthogClient = new PostHog(apiKey, {
      // PostHog Cloud (US)
      host: 'https://us.i.posthog.com',

      // Capture settings
      captureAppLifecycleEvents: true, // App open, close, background

      // Performance
      flushAt: 20, // Flush events after 20 events
      flushInterval: 30, // Or every 30 seconds
    });

    // Connect to PostHog wrapper
    setPostHogInstance(posthogClient);

    if (__DEV__) {
      Logger.debug('PostHog initialized successfully');
    }

    return posthogClient;
  } catch (error) {
    Logger.error('PostHog initialization failed', error as Error, { action: 'initPostHog' });
    return null;
  }
}

/**
 * Get PostHog client instance
 */
export function getPostHog(): PostHog | null {
  return posthogClient;
}

/**
 * Identify user in PostHog
 */
export function identifyUser(userId: string, properties?: Record<string, any>) {
  try {
    if (posthogClient) {
      posthogClient.identify(userId, properties);
    }
  } catch (error) {
    Logger.error('PostHog user identification failed', error as Error, {
      action: 'identifyUser',
      userId
    });
  }
}

/**
 * Track custom event
 */
export function trackEvent(eventName: string, properties?: Record<string, any>) {
  try {
    if (posthogClient) {
      posthogClient.capture(eventName, properties);
    }
  } catch (error) {
    Logger.error('PostHog event tracking failed', error as Error, {
      action: 'trackEvent',
      metadata: { eventName }
    });
  }
}

/**
 * Set user properties (super properties that persist)
 */
export function setUserProperties(properties: Record<string, any>) {
  try {
    if (posthogClient) {
      posthogClient.register(properties);
    }
  } catch (error) {
    Logger.error('PostHog set user properties failed', error as Error, {
      action: 'setUserProperties'
    });
  }
}

/**
 * Track screen view
 */
export function trackScreen(screenName: string, properties?: Record<string, any>) {
  try {
    if (posthogClient) {
      posthogClient.screen(screenName, properties);
    }
  } catch (error) {
    Logger.error('PostHog screen tracking failed', error as Error, {
      action: 'trackScreen',
      screen: screenName
    });
  }
}

/**
 * Reset user (call on logout)
 */
export function resetPostHog() {
  try {
    if (posthogClient) {
      posthogClient.reset();
    }
  } catch (error) {
    Logger.error('PostHog reset failed', error as Error, { action: 'resetPostHog' });
  }
}

/**
 * Flush pending events (call before app close)
 */
export function flushPostHog() {
  try {
    if (posthogClient) {
      posthogClient.flush();
    }
  } catch (error) {
    Logger.error('PostHog flush failed', error as Error, { action: 'flushPostHog' });
  }
}
