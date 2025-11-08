/**
 * Unit tests for Logger utility
 * Tests log levels, environment-based logging, formatting, and integrations
 */

import { Logger } from '../../../utils/logger';
import { sentry } from '../../../utils/sentry-wrapper';
import { posthog } from '../../../utils/posthog-wrapper';
import { lokiClient } from '../../../utils/loki-client';

// Mock all integrations
jest.mock('../../../utils/sentry-wrapper', () => ({
  sentry: {
    captureException: jest.fn(),
    captureMessage: jest.fn(),
    setUser: jest.fn(),
    addBreadcrumb: jest.fn(),
  },
}));

jest.mock('../../../utils/posthog-wrapper', () => ({
  posthog: {
    capture: jest.fn(),
    identify: jest.fn(),
    reset: jest.fn(),
  },
  setPostHogInstance: jest.fn(),
}));

jest.mock('../../../utils/loki-client', () => ({
  lokiClient: {
    push: jest.fn(),
  },
}));

// Mock expo modules
jest.mock('expo-device', () => ({
  osName: 'iOS',
  modelName: 'iPhone 14',
  brand: 'Apple',
}));

jest.mock('expo-application', () => ({
  getAndroidId: jest.fn().mockResolvedValue('test-android-id'),
}));

// Store original __DEV__ value
const originalDev = global.__DEV__;

describe('Logger', () => {
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    // Mock console methods
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    // Clear all mocks
    jest.clearAllMocks();

    // Reset __DEV__ to true for most tests
    (global as any).__DEV__ = true;
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleLogSpy.mockRestore();

    // Restore original __DEV__ value
    (global as any).__DEV__ = originalDev;
  });

  describe('error()', () => {
    describe('Development Environment', () => {
      beforeEach(() => {
        (global as any).__DEV__ = true;
      });

      it('should log to console in development', () => {
        Logger.error('Test error');

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          '[ERROR] Test error',
          undefined,
          undefined
        );
      });

      it('should log error with Error object', () => {
        const error = new Error('Test error');
        Logger.error('Something failed', error);

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          '[ERROR] Something failed',
          error,
          undefined
        );
      });

      it('should log error with context', () => {
        const context = { userId: 'user123', action: 'submit' };
        Logger.error('Test error', undefined, context);

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          '[ERROR] Test error',
          undefined,
          context
        );
      });

      it('should log error with both Error and context', () => {
        const error = new Error('API failure');
        const context = { userId: 'user123', sessionId: 'session456' };
        Logger.error('API call failed', error, context);

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          '[ERROR] API call failed',
          error,
          context
        );
      });
    });

    describe('Production Environment', () => {
      beforeEach(() => {
        (global as any).__DEV__ = false;
      });

      it('should not log to console in production', () => {
        Logger.error('Test error');

        expect(consoleErrorSpy).not.toHaveBeenCalled();
      });

      it('should still send to Sentry in production', () => {
        const error = new Error('Production error');
        Logger.error('Error occurred', error);

        expect(sentry.captureException).toHaveBeenCalled();
      });
    });

    describe('Sentry Integration', () => {
      it('should send error to Sentry', () => {
        const error = new Error('Test error');
        Logger.error('Error occurred', error);

        expect(sentry.captureException).toHaveBeenCalledWith(
          error,
          expect.objectContaining({
            level: 'error',
          })
        );
      });

      it('should create Error if none provided', () => {
        Logger.error('Error message');

        expect(sentry.captureException).toHaveBeenCalledWith(
          expect.any(Error),
          expect.any(Object)
        );
      });

      it('should include context in Sentry tags', () => {
        const error = new Error('Test error');
        const context = {
          userId: 'user123',
          sessionId: 'session456',
          clubId: 'club789',
          action: 'submit',
          screen: 'SessionScreen',
        };

        Logger.error('Error occurred', error, context);

        expect(sentry.captureException).toHaveBeenCalledWith(
          error,
          expect.objectContaining({
            tags: expect.objectContaining({
              userId: 'user123',
              sessionId: 'session456',
              clubId: 'club789',
              action: 'submit',
              screen: 'SessionScreen',
            }),
          })
        );
      });

      it('should include metadata in Sentry extra', () => {
        const error = new Error('Test error');
        const context = {
          metadata: { foo: 'bar', count: 42 },
        };

        Logger.error('Error occurred', error, context);

        expect(sentry.captureException).toHaveBeenCalledWith(
          error,
          expect.objectContaining({
            extra: expect.objectContaining({
              foo: 'bar',
              count: 42,
            }),
          })
        );
      });
    });

    describe('Loki Integration', () => {
      it('should send error to Loki', () => {
        const error = new Error('Test error');
        Logger.error('Error occurred', error);

        expect(lokiClient.push).toHaveBeenCalledWith(
          expect.objectContaining({
            level: 'error',
            message: 'Error occurred',
          })
        );
      });

      it('should include error details in Loki context', () => {
        const error = new Error('Test error');
        error.stack = 'Error: Test error\n  at test.js:1:1';

        Logger.error('Error occurred', error);

        expect(lokiClient.push).toHaveBeenCalledWith(
          expect.objectContaining({
            context: expect.objectContaining({
              error: 'Test error',
              stack: expect.stringContaining('Error: Test error'),
            }),
          })
        );
      });

      it('should include high-cardinality data in Loki metadata', () => {
        const error = new Error('Test error');
        const context = {
          userId: 'user123',
          sessionId: 'session456',
        };

        Logger.error('Error occurred', error, context);

        expect(lokiClient.push).toHaveBeenCalledWith(
          expect.objectContaining({
            metadata: expect.objectContaining({
              userId: 'user123',
              sessionId: 'session456',
            }),
          })
        );
      });
    });

    describe('PostHog Integration', () => {
      it('should send error event to PostHog', () => {
        const error = new Error('Test error');
        Logger.error('Error occurred', error);

        expect(posthog.capture).toHaveBeenCalledWith(
          'error_occurred',
          expect.objectContaining({
            message: 'Error occurred',
            errorType: 'Error',
            errorMessage: 'Test error',
          })
        );
      });

      it('should include context in PostHog event', () => {
        const error = new Error('Test error');
        const context = {
          userId: 'user123',
          action: 'submit',
          screen: 'SessionScreen',
        };

        Logger.error('Error occurred', error, context);

        expect(posthog.capture).toHaveBeenCalledWith(
          'error_occurred',
          expect.objectContaining({
            userId: 'user123',
            action: 'submit',
            screen: 'SessionScreen',
          })
        );
      });
    });
  });

  describe('warn()', () => {
    describe('Development Environment', () => {
      beforeEach(() => {
        (global as any).__DEV__ = true;
      });

      it('should log to console in development', () => {
        Logger.warn('Test warning');

        expect(consoleWarnSpy).toHaveBeenCalledWith(
          '[WARN] Test warning',
          undefined
        );
      });

      it('should log warning with context', () => {
        const context = { userId: 'user123', action: 'submit' };
        Logger.warn('Test warning', context);

        expect(consoleWarnSpy).toHaveBeenCalledWith(
          '[WARN] Test warning',
          context
        );
      });
    });

    describe('Production Environment', () => {
      beforeEach(() => {
        (global as any).__DEV__ = false;
      });

      it('should not log to console in production', () => {
        Logger.warn('Test warning');

        expect(consoleWarnSpy).not.toHaveBeenCalled();
      });
    });

    describe('Sentry Integration', () => {
      it('should send warning to Sentry', () => {
        Logger.warn('Test warning');

        expect(sentry.captureMessage).toHaveBeenCalledWith(
          'Test warning',
          expect.objectContaining({
            level: 'warning',
          })
        );
      });

      it('should include context in Sentry tags', () => {
        const context = {
          userId: 'user123',
          sessionId: 'session456',
          action: 'submit',
          screen: 'SessionScreen',
        };

        Logger.warn('Test warning', context);

        expect(sentry.captureMessage).toHaveBeenCalledWith(
          'Test warning',
          expect.objectContaining({
            tags: expect.objectContaining({
              userId: 'user123',
              sessionId: 'session456',
              action: 'submit',
              screen: 'SessionScreen',
            }),
          })
        );
      });
    });

    describe('Loki Integration', () => {
      it('should send warning to Loki', () => {
        Logger.warn('Test warning');

        expect(lokiClient.push).toHaveBeenCalledWith(
          expect.objectContaining({
            level: 'warn',
            message: 'Test warning',
          })
        );
      });

      it('should include context in Loki', () => {
        const context = {
          action: 'submit',
          screen: 'SessionScreen',
          metadata: { foo: 'bar' },
        };

        Logger.warn('Test warning', context);

        expect(lokiClient.push).toHaveBeenCalledWith(
          expect.objectContaining({
            context: expect.objectContaining({
              action: 'submit',
              screen: 'SessionScreen',
              foo: 'bar',
            }),
          })
        );
      });
    });
  });

  describe('info()', () => {
    describe('Development Environment', () => {
      beforeEach(() => {
        (global as any).__DEV__ = true;
      });

      it('should log to console in development', () => {
        Logger.info('Test info');

        expect(consoleLogSpy).toHaveBeenCalledWith('[INFO] Test info', undefined);
      });

      it('should log info with context', () => {
        const context = { userId: 'user123', action: 'login' };
        Logger.info('User logged in', context);

        expect(consoleLogSpy).toHaveBeenCalledWith(
          '[INFO] User logged in',
          context
        );
      });
    });

    describe('Production Environment', () => {
      beforeEach(() => {
        (global as any).__DEV__ = false;
      });

      it('should not log to console in production', () => {
        Logger.info('Test info');

        expect(consoleLogSpy).not.toHaveBeenCalled();
      });
    });

    describe('Loki Integration', () => {
      it('should send info to Loki', () => {
        Logger.info('Test info');

        expect(lokiClient.push).toHaveBeenCalledWith(
          expect.objectContaining({
            level: 'info',
            message: 'Test info',
          })
        );
      });

      it('should not send to Sentry (info level)', () => {
        Logger.info('Test info');

        expect(sentry.captureMessage).not.toHaveBeenCalled();
        expect(sentry.captureException).not.toHaveBeenCalled();
      });

      it('should include context in Loki', () => {
        const context = {
          userId: 'user123',
          sessionId: 'session456',
          action: 'create_session',
          metadata: { playerCount: 8 },
        };

        Logger.info('Session created', context);

        expect(lokiClient.push).toHaveBeenCalledWith(
          expect.objectContaining({
            context: expect.objectContaining({
              action: 'create_session',
              playerCount: 8,
            }),
            metadata: expect.objectContaining({
              userId: 'user123',
              sessionId: 'session456',
            }),
          })
        );
      });
    });
  });

  describe('debug()', () => {
    describe('Development Environment', () => {
      beforeEach(() => {
        (global as any).__DEV__ = true;
      });

      it('should log to console in development', () => {
        Logger.debug('Test debug');

        expect(consoleLogSpy).toHaveBeenCalledWith('[DEBUG] Test debug', undefined);
      });

      it('should log debug with data', () => {
        const data = { players: ['Alice', 'Bob'], rounds: 3 };
        Logger.debug('Debug data', data);

        expect(consoleLogSpy).toHaveBeenCalledWith('[DEBUG] Debug data', data);
      });
    });

    describe('Production Environment', () => {
      beforeEach(() => {
        (global as any).__DEV__ = false;
      });

      it('should not log to console in production', () => {
        Logger.debug('Test debug');

        expect(consoleLogSpy).not.toHaveBeenCalled();
      });

      it('should not send to any external service', () => {
        Logger.debug('Test debug', { foo: 'bar' });

        expect(sentry.captureMessage).not.toHaveBeenCalled();
        expect(sentry.captureException).not.toHaveBeenCalled();
        expect(lokiClient.push).not.toHaveBeenCalled();
        expect(posthog.capture).not.toHaveBeenCalled();
      });
    });
  });

  describe('setUser()', () => {
    it('should set user in Sentry', () => {
      Logger.setUser('user123', 'user@example.com', { name: 'Test User' });

      expect(sentry.setUser).toHaveBeenCalledWith({
        id: 'user123',
        email: 'user@example.com',
        name: 'Test User',
      });
    });

    it('should identify user in PostHog', () => {
      Logger.setUser('user123', 'user@example.com', { name: 'Test User' });

      expect(posthog.identify).toHaveBeenCalledWith('user123', {
        email: 'user@example.com',
        name: 'Test User',
      });
    });

    it('should work without email', () => {
      Logger.setUser('user123');

      expect(sentry.setUser).toHaveBeenCalledWith({
        id: 'user123',
        email: undefined,
      });
    });

    it('should work without metadata', () => {
      Logger.setUser('user123', 'user@example.com');

      expect(sentry.setUser).toHaveBeenCalledWith({
        id: 'user123',
        email: 'user@example.com',
      });
    });

    it('should update currentUserId for future logs', () => {
      Logger.setUser('user123');
      Logger.error('Test error');

      expect(sentry.captureException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          tags: expect.objectContaining({
            userId: 'user123',
          }),
        })
      );
    });
  });

  describe('clearUser()', () => {
    it('should clear user from Sentry', () => {
      Logger.clearUser();

      expect(sentry.setUser).toHaveBeenCalledWith(null);
    });

    it('should reset PostHog user', () => {
      Logger.clearUser();

      expect(posthog.reset).toHaveBeenCalled();
    });

    it('should clear currentUserId', () => {
      Logger.setUser('user123');
      Logger.clearUser();
      Logger.error('Test error');

      expect(sentry.captureException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          tags: expect.objectContaining({
            userId: undefined,
          }),
        })
      );
    });
  });

  describe('addBreadcrumb()', () => {
    it('should add breadcrumb to Sentry', () => {
      Logger.addBreadcrumb('navigation', 'User navigated to home', 'info');

      expect(sentry.addBreadcrumb).toHaveBeenCalledWith({
        category: 'navigation',
        message: 'User navigated to home',
        level: 'info',
        data: undefined,
        timestamp: expect.any(Number),
      });
    });

    it('should add breadcrumb with data', () => {
      const data = { screen: 'HomeScreen', userId: 'user123' };
      Logger.addBreadcrumb('navigation', 'Screen viewed', 'info', data);

      expect(sentry.addBreadcrumb).toHaveBeenCalledWith({
        category: 'navigation',
        message: 'Screen viewed',
        level: 'info',
        data,
        timestamp: expect.any(Number),
      });
    });

    it('should default to info level', () => {
      Logger.addBreadcrumb('action', 'Button clicked');

      expect(sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'info',
        })
      );
    });

    it('should support all log levels', () => {
      Logger.addBreadcrumb('test', 'Debug', 'debug');
      Logger.addBreadcrumb('test', 'Info', 'info');
      Logger.addBreadcrumb('test', 'Warning', 'warning');
      Logger.addBreadcrumb('test', 'Error', 'error');

      expect(sentry.addBreadcrumb).toHaveBeenCalledTimes(4);
    });
  });

  describe('timing()', () => {
    it('should send timing to PostHog', () => {
      Logger.timing('api_call', 1500);

      expect(posthog.capture).toHaveBeenCalledWith(
        'performance_timing',
        expect.objectContaining({
          name: 'api_call',
          duration_ms: 1500,
        })
      );
    });

    it('should send timing to Loki', () => {
      Logger.timing('api_call', 1500);

      expect(lokiClient.push).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'info',
          message: 'Performance: api_call took 1500ms',
          context: expect.objectContaining({
            timingName: 'api_call',
            durationMs: 1500,
          }),
        })
      );
    });

    it('should include context in timing', () => {
      const context = {
        userId: 'user123',
        action: 'fetch_sessions',
        screen: 'HomeScreen',
      };

      Logger.timing('api_call', 1500, context);

      expect(posthog.capture).toHaveBeenCalledWith(
        'performance_timing',
        expect.objectContaining({
          name: 'api_call',
          duration_ms: 1500,
          userId: 'user123',
          action: 'fetch_sessions',
          screen: 'HomeScreen',
        })
      );
    });

    it('should send slow operations to Sentry as warnings', () => {
      Logger.timing('slow_operation', 2000);

      expect(sentry.captureMessage).toHaveBeenCalledWith(
        'Slow operation: slow_operation took 2000ms',
        expect.objectContaining({
          level: 'warning',
          tags: expect.objectContaining({
            operation: 'slow_operation',
            duration_ms: '2000',
          }),
        })
      );
    });

    it('should not send fast operations to Sentry', () => {
      Logger.timing('fast_operation', 500);

      expect(sentry.captureMessage).not.toHaveBeenCalled();
    });

    it('should use 1000ms threshold for slow operations', () => {
      // Just under threshold - should not warn
      Logger.timing('operation1', 999);
      expect(sentry.captureMessage).not.toHaveBeenCalled();

      // At threshold - should not warn
      Logger.timing('operation2', 1000);
      expect(sentry.captureMessage).not.toHaveBeenCalled();

      // Over threshold - should warn
      Logger.timing('operation3', 1001);
      expect(sentry.captureMessage).toHaveBeenCalledTimes(1);
    });
  });

  describe('maskEmail()', () => {
    it('should mask email correctly', () => {
      const masked = Logger.maskEmail('user@example.com');
      expect(masked).toBe('u***@example.com');
    });

    it('should mask different email formats', () => {
      expect(Logger.maskEmail('a@test.com')).toBe('a***@test.com');
      expect(Logger.maskEmail('alice@company.co.uk')).toBe('a***@company.co.uk');
      expect(Logger.maskEmail('bob.smith@example.org')).toBe('b***@example.org');
    });

    it('should handle invalid emails gracefully', () => {
      expect(Logger.maskEmail('notanemail')).toBe('notanemail');
      expect(Logger.maskEmail('')).toBe('');
      expect(Logger.maskEmail('user@')).toBe('user@'); // No domain, returns original
    });

    it('should preserve domain fully', () => {
      const masked = Logger.maskEmail('test@verylongdomain.example.com');
      expect(masked).toContain('@verylongdomain.example.com');
    });

    it('should only show first character of local part', () => {
      const masked = Logger.maskEmail('verylongemail@test.com');
      expect(masked).toBe('v***@test.com');
    });
  });

  describe('Log Formatting', () => {
    it('should format log messages with prefix', () => {
      Logger.error('Test');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        undefined,
        undefined
      );

      Logger.warn('Test');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[WARN]'),
        undefined
      );

      Logger.info('Test');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        undefined
      );

      Logger.debug('Test');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG]'),
        undefined
      );
    });

    it('should preserve message content', () => {
      Logger.error('Custom error message');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Custom error message'),
        undefined,
        undefined
      );
    });
  });

  describe('Environment Conditional Logging', () => {
    it('should respect __DEV__ flag for console output', () => {
      (global as any).__DEV__ = true;
      Logger.debug('Dev message');
      expect(consoleLogSpy).toHaveBeenCalled();

      jest.clearAllMocks();

      (global as any).__DEV__ = false;
      Logger.debug('Prod message');
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should always send errors to Sentry regardless of __DEV__', () => {
      (global as any).__DEV__ = true;
      Logger.error('Dev error');
      expect(sentry.captureException).toHaveBeenCalled();

      jest.clearAllMocks();

      (global as any).__DEV__ = false;
      Logger.error('Prod error');
      expect(sentry.captureException).toHaveBeenCalled();
    });

    it('should always send warnings to Sentry regardless of __DEV__', () => {
      (global as any).__DEV__ = true;
      Logger.warn('Dev warning');
      expect(sentry.captureMessage).toHaveBeenCalled();

      jest.clearAllMocks();

      (global as any).__DEV__ = false;
      Logger.warn('Prod warning');
      expect(sentry.captureMessage).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined error gracefully', () => {
      expect(() => Logger.error('Error', undefined)).not.toThrow();
      expect(sentry.captureException).toHaveBeenCalled();
    });

    it('should handle null context gracefully', () => {
      expect(() => Logger.error('Error', undefined, null as any)).not.toThrow();
    });

    it('should handle empty context gracefully', () => {
      expect(() => Logger.error('Error', undefined, {})).not.toThrow();
    });

    it('should handle very long messages', () => {
      const longMessage = 'A'.repeat(10000);
      expect(() => Logger.error(longMessage)).not.toThrow();
    });

    it('should handle special characters in messages', () => {
      expect(() => Logger.error('Error with émojis 🚀 and spëcial çhars')).not.toThrow();
    });

    it('should handle circular references in context', () => {
      const circular: any = { a: 1 };
      circular.self = circular;

      // Should not throw, but may have limited serialization
      expect(() => Logger.error('Error', undefined, { data: circular })).not.toThrow();
    });

    it('should handle errors with missing stack trace', () => {
      const error = new Error('No stack');
      delete error.stack;

      expect(() => Logger.error('Error', error)).not.toThrow();
    });
  });

  describe('Integration Error Handling', () => {
    it('should call Sentry integration', () => {
      // The logger doesn't have try-catch around integrations, so errors would throw
      // But in real usage, the wrappers handle errors gracefully
      Logger.error('Test error');
      expect(sentry.captureException).toHaveBeenCalled();
    });

    it('should call Loki integration', () => {
      Logger.error('Test error');
      expect(lokiClient.push).toHaveBeenCalled();
    });

    it('should call PostHog integration', () => {
      Logger.error('Test error');
      expect(posthog.capture).toHaveBeenCalled();
    });
  });

  describe('Context Propagation', () => {
    it('should propagate userId from setUser to subsequent logs', () => {
      Logger.setUser('user123');
      Logger.error('Test error');

      expect(lokiClient.push).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            userId: 'user123',
          }),
        })
      );
    });

    it('should prefer explicit userId over global userId', () => {
      Logger.setUser('globalUser');
      Logger.error('Test error', undefined, { userId: 'localUser' });

      expect(lokiClient.push).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            userId: 'localUser',
          }),
        })
      );
    });

    it('should use global userId when not provided in context', () => {
      Logger.setUser('globalUser');
      Logger.error('Test error');

      expect(lokiClient.push).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            userId: 'globalUser',
          }),
        })
      );
    });
  });

  describe('Convenience Exports', () => {
    it('should export standalone functions', () => {
      const {
        error,
        warn,
        info,
        debug,
        setUser,
        clearUser,
        addBreadcrumb,
        timing,
        maskEmail,
      } = require('../../../utils/logger');

      expect(typeof error).toBe('function');
      expect(typeof warn).toBe('function');
      expect(typeof info).toBe('function');
      expect(typeof debug).toBe('function');
      expect(typeof setUser).toBe('function');
      expect(typeof clearUser).toBe('function');
      expect(typeof addBreadcrumb).toBe('function');
      expect(typeof timing).toBe('function');
      expect(typeof maskEmail).toBe('function');
    });
  });
});
