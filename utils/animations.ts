import { Platform } from 'react-native';
import { WithSpringConfig, WithTimingConfig } from 'react-native-reanimated';

/**
 * Platform-specific animation configurations
 * iOS: Spring animations with bounce for native feel
 * Android: Faster, snappier transitions
 */

export const springConfig: WithSpringConfig = Platform.select({
  ios: {
    damping: 20,
    stiffness: 180,
    mass: 0.8,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 2,
  },
  default: {
    damping: 25,
    stiffness: 220,
    mass: 0.6,
    overshootClamping: true,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 2,
  },
}) as WithSpringConfig;

export const timingConfig: WithTimingConfig = Platform.select({
  ios: {
    duration: 350,
  },
  default: {
    duration: 250,
  },
}) as WithTimingConfig;

export const fastTimingConfig: WithTimingConfig = Platform.select({
  ios: {
    duration: 200,
  },
  default: {
    duration: 150,
  },
}) as WithTimingConfig;

/**
 * Tab transition configuration
 */
export const tabTransitionConfig = {
  spring: Platform.select({
    ios: {
      damping: 18,
      stiffness: 160,
      mass: 0.7,
    },
    default: {
      damping: 22,
      stiffness: 200,
      mass: 0.5,
    },
  }),
  timing: Platform.select({
    ios: {
      duration: 300,
    },
    default: {
      duration: 220,
    },
  }),
};

/**
 * Modal presentation configuration
 */
export const modalConfig = {
  spring: {
    damping: 20,
    stiffness: 140,
    mass: 0.9,
  },
  timing: {
    duration: 400,
  },
};

/**
 * Swipe-to-dismiss thresholds
 */
export const swipeThresholds = {
  dismissVelocity: 800, // Minimum velocity to trigger dismiss
  dismissDistance: 0.3, // Minimum distance (30% of screen height)
  rubberBandFactor: 0.4, // Resistance when over-swiping
};
