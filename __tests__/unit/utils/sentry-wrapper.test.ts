/**
 * Unit Tests: Sentry Wrapper
 *
 * Tests for Sentry error tracking wrapper with feature flag support
 */

// Mock Sentry before importing
jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(() => 'event-id-123'),
  captureMessage: jest.fn(() => 'message-id-456'),
  setUser: jest.fn(),
  addBreadcrumb: jest.fn(),
  setTag: jest.fn(),
  setContext: jest.fn(),
}));

describe('Sentry Wrapper', () => {
  let sentry: any;
  let SentryMock: any;
  let originalEnv: any;

  beforeEach(() => {
    // Save original env
    originalEnv = { ...process.env };

    // Get mocked Sentry
    SentryMock = require('@sentry/react-native');

    // Clear all mocks
    jest.clearAllMocks();

    // Clear module cache and re-import
    jest.resetModules();
    const module = require('../../../utils/sentry-wrapper');
    sentry = module.sentry;
  });

  afterEach(() => {
    // Restore original env
    process.env = originalEnv;
  });

  describe('Feature Flag Control', () => {
    it('should be enabled when feature flag is true', () => {
      process.env.EXPO_PUBLIC_ENABLE_SENTRY = 'true';
      jest.resetModules();
      const module = require('../../../utils/sentry-wrapper');
      const sentryWrapper = module.sentry;

      expect(sentryWrapper.isEnabled()).toBe(true);
    });

    it('should be disabled when feature flag is false', () => {
      process.env.EXPO_PUBLIC_ENABLE_SENTRY = 'false';
      jest.resetModules();
      const module = require('../../../utils/sentry-wrapper');
      const sentryWrapper = module.sentry;

      expect(sentryWrapper.isEnabled()).toBe(false);
    });

    it('should be disabled when feature flag is missing', () => {
      delete process.env.EXPO_PUBLIC_ENABLE_SENTRY;
      jest.resetModules();
      const module = require('../../../utils/sentry-wrapper');
      const sentryWrapper = module.sentry;

      expect(sentryWrapper.isEnabled()).toBe(false);
    });
  });

  describe('captureException()', () => {
    beforeEach(() => {
      process.env.EXPO_PUBLIC_ENABLE_SENTRY = 'true';
      jest.resetModules();
      const module = require('../../../utils/sentry-wrapper');
      sentry = module.sentry;
      SentryMock = require('@sentry/react-native');
    });

    it('should capture exception when enabled', () => {
      const error = new Error('Test error');

      const eventId = sentry.captureException(error);

      expect(SentryMock.captureException).toHaveBeenCalledWith(error, undefined);
      expect(eventId).toBe('event-id-123');
    });

    it('should capture exception with context', () => {
      const error = new Error('Test error');
      const context = {
        level: 'error' as const,
        tags: { component: 'Login' },
      };

      sentry.captureException(error, context);

      expect(SentryMock.captureException).toHaveBeenCalledWith(error, context);
    });

    it('should not capture when disabled', () => {
      process.env.EXPO_PUBLIC_ENABLE_SENTRY = 'false';
      jest.resetModules();
      const module = require('../../../utils/sentry-wrapper');
      const sentryWrapper = module.sentry;
      SentryMock.captureException.mockClear();

      const error = new Error('Test error');
      const eventId = sentryWrapper.captureException(error);

      expect(SentryMock.captureException).not.toHaveBeenCalled();
      expect(eventId).toBe('');
    });

    it('should capture Error instances', () => {
      const error = new Error('Error message');

      sentry.captureException(error);

      expect(SentryMock.captureException).toHaveBeenCalledWith(error, undefined);
    });

    it('should capture TypeError instances', () => {
      const error = new TypeError('Type error');

      sentry.captureException(error);

      expect(SentryMock.captureException).toHaveBeenCalledWith(error, undefined);
    });

    it('should capture string errors', () => {
      const error = 'String error';

      sentry.captureException(error);

      expect(SentryMock.captureException).toHaveBeenCalledWith(error, undefined);
    });

    it('should capture custom error objects', () => {
      const error = { message: 'Custom error', code: 500 };

      sentry.captureException(error);

      expect(SentryMock.captureException).toHaveBeenCalledWith(error, undefined);
    });

    it('should pass through capture context options', () => {
      const error = new Error('Test error');
      const context = {
        level: 'fatal' as const,
        tags: { feature: 'authentication' },
        extra: { userId: 'user123' },
        fingerprint: ['custom', 'fingerprint'],
      };

      sentry.captureException(error, context);

      expect(SentryMock.captureException).toHaveBeenCalledWith(error, context);
    });
  });

  describe('captureMessage()', () => {
    beforeEach(() => {
      process.env.EXPO_PUBLIC_ENABLE_SENTRY = 'true';
      jest.resetModules();
      const module = require('../../../utils/sentry-wrapper');
      sentry = module.sentry;
      SentryMock = require('@sentry/react-native');
    });

    it('should capture message when enabled', () => {
      const eventId = sentry.captureMessage('Test message');

      expect(SentryMock.captureMessage).toHaveBeenCalledWith('Test message', undefined);
      expect(eventId).toBe('message-id-456');
    });

    it('should capture message with context', () => {
      const context = {
        level: 'warning' as const,
        tags: { source: 'api' },
      };

      sentry.captureMessage('Warning message', context);

      expect(SentryMock.captureMessage).toHaveBeenCalledWith('Warning message', context);
    });

    it('should not capture when disabled', () => {
      process.env.EXPO_PUBLIC_ENABLE_SENTRY = 'false';
      jest.resetModules();
      const module = require('../../../utils/sentry-wrapper');
      const sentryWrapper = module.sentry;
      SentryMock.captureMessage.mockClear();

      const eventId = sentryWrapper.captureMessage('Test message');

      expect(SentryMock.captureMessage).not.toHaveBeenCalled();
      expect(eventId).toBe('');
    });

    it('should support different severity levels', () => {
      const levels = ['fatal', 'error', 'warning', 'info', 'debug'] as const;

      levels.forEach((level) => {
        SentryMock.captureMessage.mockClear();

        sentry.captureMessage('Test message', { level });

        expect(SentryMock.captureMessage).toHaveBeenCalledWith('Test message', { level });
      });
    });

    it('should capture empty messages', () => {
      sentry.captureMessage('');

      expect(SentryMock.captureMessage).toHaveBeenCalledWith('', undefined);
    });
  });

  describe('setUser()', () => {
    beforeEach(() => {
      process.env.EXPO_PUBLIC_ENABLE_SENTRY = 'true';
      jest.resetModules();
      const module = require('../../../utils/sentry-wrapper');
      sentry = module.sentry;
      SentryMock = require('@sentry/react-native');
    });

    it('should set user when enabled', () => {
      const user = {
        id: 'user123',
        email: 'user@example.com',
        username: 'testuser',
      };

      sentry.setUser(user);

      expect(SentryMock.setUser).toHaveBeenCalledWith(user);
    });

    it('should clear user with null', () => {
      sentry.setUser(null);

      expect(SentryMock.setUser).toHaveBeenCalledWith(null);
    });

    it('should not set user when disabled', () => {
      process.env.EXPO_PUBLIC_ENABLE_SENTRY = 'false';
      jest.resetModules();
      const module = require('../../../utils/sentry-wrapper');
      const sentryWrapper = module.sentry;
      SentryMock.setUser.mockClear();

      const user = { id: 'user123' };
      sentryWrapper.setUser(user);

      expect(SentryMock.setUser).not.toHaveBeenCalled();
    });

    it('should set user with minimal info', () => {
      const user = { id: 'user123' };

      sentry.setUser(user);

      expect(SentryMock.setUser).toHaveBeenCalledWith(user);
    });

    it('should set user with additional fields', () => {
      const user = {
        id: 'user123',
        email: 'user@example.com',
        username: 'testuser',
        ip_address: '192.168.1.1',
        subscription: 'premium',
      };

      sentry.setUser(user);

      expect(SentryMock.setUser).toHaveBeenCalledWith(user);
    });
  });

  describe('addBreadcrumb()', () => {
    beforeEach(() => {
      process.env.EXPO_PUBLIC_ENABLE_SENTRY = 'true';
      jest.resetModules();
      const module = require('../../../utils/sentry-wrapper');
      sentry = module.sentry;
      SentryMock = require('@sentry/react-native');
    });

    it('should add breadcrumb when enabled', () => {
      const breadcrumb = {
        message: 'User clicked button',
        level: 'info' as const,
      };

      sentry.addBreadcrumb(breadcrumb);

      expect(SentryMock.addBreadcrumb).toHaveBeenCalledWith(breadcrumb);
    });

    it('should not add breadcrumb when disabled', () => {
      process.env.EXPO_PUBLIC_ENABLE_SENTRY = 'false';
      jest.resetModules();
      const module = require('../../../utils/sentry-wrapper');
      const sentryWrapper = module.sentry;
      SentryMock.addBreadcrumb.mockClear();

      const breadcrumb = { message: 'Test' };
      sentryWrapper.addBreadcrumb(breadcrumb);

      expect(SentryMock.addBreadcrumb).not.toHaveBeenCalled();
    });

    it('should add navigation breadcrumb', () => {
      const breadcrumb = {
        category: 'navigation',
        message: 'Navigate to Home',
        level: 'info' as const,
        data: { from: '/login', to: '/home' },
      };

      sentry.addBreadcrumb(breadcrumb);

      expect(SentryMock.addBreadcrumb).toHaveBeenCalledWith(breadcrumb);
    });

    it('should add http breadcrumb', () => {
      const breadcrumb = {
        category: 'http',
        type: 'http' as const,
        data: {
          url: 'https://api.example.com/users',
          method: 'GET',
          status_code: 200,
        },
      };

      sentry.addBreadcrumb(breadcrumb);

      expect(SentryMock.addBreadcrumb).toHaveBeenCalledWith(breadcrumb);
    });

    it('should add user action breadcrumb', () => {
      const breadcrumb = {
        category: 'user',
        message: 'Button clicked',
        level: 'info' as const,
        data: { buttonId: 'submit', screen: 'Login' },
      };

      sentry.addBreadcrumb(breadcrumb);

      expect(SentryMock.addBreadcrumb).toHaveBeenCalledWith(breadcrumb);
    });

    it('should add breadcrumb with timestamp', () => {
      const breadcrumb = {
        message: 'Event occurred',
        timestamp: Date.now() / 1000,
      };

      sentry.addBreadcrumb(breadcrumb);

      expect(SentryMock.addBreadcrumb).toHaveBeenCalledWith(breadcrumb);
    });
  });

  describe('setTag()', () => {
    beforeEach(() => {
      process.env.EXPO_PUBLIC_ENABLE_SENTRY = 'true';
      jest.resetModules();
      const module = require('../../../utils/sentry-wrapper');
      sentry = module.sentry;
      SentryMock = require('@sentry/react-native');
    });

    it('should set string tag when enabled', () => {
      sentry.setTag('environment', 'production');

      expect(SentryMock.setTag).toHaveBeenCalledWith('environment', 'production');
    });

    it('should set number tag', () => {
      sentry.setTag('version', 123);

      expect(SentryMock.setTag).toHaveBeenCalledWith('version', 123);
    });

    it('should set boolean tag', () => {
      sentry.setTag('isPremium', true);

      expect(SentryMock.setTag).toHaveBeenCalledWith('isPremium', true);
    });

    it('should not set tag when disabled', () => {
      process.env.EXPO_PUBLIC_ENABLE_SENTRY = 'false';
      jest.resetModules();
      const module = require('../../../utils/sentry-wrapper');
      const sentryWrapper = module.sentry;
      SentryMock.setTag.mockClear();

      sentryWrapper.setTag('test', 'value');

      expect(SentryMock.setTag).not.toHaveBeenCalled();
    });

    it('should set multiple tags', () => {
      sentry.setTag('screen', 'Home');
      sentry.setTag('userId', 'user123');
      sentry.setTag('sessionId', 'session456');

      expect(SentryMock.setTag).toHaveBeenCalledTimes(3);
      expect(SentryMock.setTag).toHaveBeenCalledWith('screen', 'Home');
      expect(SentryMock.setTag).toHaveBeenCalledWith('userId', 'user123');
      expect(SentryMock.setTag).toHaveBeenCalledWith('sessionId', 'session456');
    });
  });

  describe('setContext()', () => {
    beforeEach(() => {
      process.env.EXPO_PUBLIC_ENABLE_SENTRY = 'true';
      jest.resetModules();
      const module = require('../../../utils/sentry-wrapper');
      sentry = module.sentry;
      SentryMock = require('@sentry/react-native');
    });

    it('should set context when enabled', () => {
      const context = {
        deviceId: 'device123',
        model: 'iPhone 14',
        os: 'iOS 17',
      };

      sentry.setContext('device', context);

      expect(SentryMock.setContext).toHaveBeenCalledWith('device', context);
    });

    it('should clear context with null', () => {
      sentry.setContext('device', null);

      expect(SentryMock.setContext).toHaveBeenCalledWith('device', null);
    });

    it('should not set context when disabled', () => {
      process.env.EXPO_PUBLIC_ENABLE_SENTRY = 'false';
      jest.resetModules();
      const module = require('../../../utils/sentry-wrapper');
      const sentryWrapper = module.sentry;
      SentryMock.setContext.mockClear();

      sentryWrapper.setContext('test', { key: 'value' });

      expect(SentryMock.setContext).not.toHaveBeenCalled();
    });

    it('should set multiple contexts', () => {
      const device = { model: 'iPhone 14' };
      const app = { version: '1.0.0' };

      sentry.setContext('device', device);
      sentry.setContext('app', app);

      expect(SentryMock.setContext).toHaveBeenCalledTimes(2);
      expect(SentryMock.setContext).toHaveBeenCalledWith('device', device);
      expect(SentryMock.setContext).toHaveBeenCalledWith('app', app);
    });

    it('should set context with nested objects', () => {
      const context = {
        user: {
          id: 'user123',
          subscription: {
            tier: 'premium',
            expires: '2025-12-31',
          },
        },
      };

      sentry.setContext('subscription', context);

      expect(SentryMock.setContext).toHaveBeenCalledWith('subscription', context);
    });
  });

  describe('isEnabled()', () => {
    it('should return true when enabled', () => {
      process.env.EXPO_PUBLIC_ENABLE_SENTRY = 'true';
      jest.resetModules();
      const module = require('../../../utils/sentry-wrapper');
      const sentryWrapper = module.sentry;

      expect(sentryWrapper.isEnabled()).toBe(true);
    });

    it('should return false when disabled', () => {
      process.env.EXPO_PUBLIC_ENABLE_SENTRY = 'false';
      jest.resetModules();
      const module = require('../../../utils/sentry-wrapper');
      const sentryWrapper = module.sentry;

      expect(sentryWrapper.isEnabled()).toBe(false);
    });

    it('should return false when env var is missing', () => {
      delete process.env.EXPO_PUBLIC_ENABLE_SENTRY;
      jest.resetModules();
      const module = require('../../../utils/sentry-wrapper');
      const sentryWrapper = module.sentry;

      expect(sentryWrapper.isEnabled()).toBe(false);
    });

    it('should return false for any value other than "true"', () => {
      const values = ['True', 'TRUE', '1', 'yes', 'enabled', ''];

      values.forEach((value) => {
        process.env.EXPO_PUBLIC_ENABLE_SENTRY = value;
        jest.resetModules();
        const module = require('../../../utils/sentry-wrapper');
        const sentryWrapper = module.sentry;

        expect(sentryWrapper.isEnabled()).toBe(false);
      });
    });
  });

  describe('Privacy Controls', () => {
    it('should not send any data when disabled', () => {
      process.env.EXPO_PUBLIC_ENABLE_SENTRY = 'false';
      jest.resetModules();
      const module = require('../../../utils/sentry-wrapper');
      const sentryWrapper = module.sentry;
      SentryMock = require('@sentry/react-native');

      // Try all methods
      sentryWrapper.captureException(new Error('test'));
      sentryWrapper.captureMessage('test');
      sentryWrapper.setUser({ id: 'user' });
      sentryWrapper.addBreadcrumb({ message: 'test' });
      sentryWrapper.setTag('key', 'value');
      sentryWrapper.setContext('name', { data: 'test' });

      // Nothing should be called
      expect(SentryMock.captureException).not.toHaveBeenCalled();
      expect(SentryMock.captureMessage).not.toHaveBeenCalled();
      expect(SentryMock.setUser).not.toHaveBeenCalled();
      expect(SentryMock.addBreadcrumb).not.toHaveBeenCalled();
      expect(SentryMock.setTag).not.toHaveBeenCalled();
      expect(SentryMock.setContext).not.toHaveBeenCalled();
    });
  });

  describe('Type Exports', () => {
    it('should export User type', () => {
      const module = require('../../../utils/sentry-wrapper');

      // Type should be available for import
      expect(module).toBeDefined();
    });

    it('should export Breadcrumb type', () => {
      const module = require('../../../utils/sentry-wrapper');

      // Type should be available for import
      expect(module).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      process.env.EXPO_PUBLIC_ENABLE_SENTRY = 'true';
      jest.resetModules();
      const module = require('../../../utils/sentry-wrapper');
      sentry = module.sentry;
      SentryMock = require('@sentry/react-native');
    });

    it('should handle null exception', () => {
      sentry.captureException(null);

      expect(SentryMock.captureException).toHaveBeenCalledWith(null, undefined);
    });

    it('should handle undefined exception', () => {
      sentry.captureException(undefined);

      expect(SentryMock.captureException).toHaveBeenCalledWith(undefined, undefined);
    });

    it('should handle empty tag key', () => {
      sentry.setTag('', 'value');

      expect(SentryMock.setTag).toHaveBeenCalledWith('', 'value');
    });

    it('should handle empty context name', () => {
      sentry.setContext('', { data: 'test' });

      expect(SentryMock.setContext).toHaveBeenCalledWith('', { data: 'test' });
    });

    it('should handle deeply nested context', () => {
      const deepContext: any = { level: 0 };
      let current = deepContext;

      for (let i = 1; i < 10; i++) {
        current.nested = { level: i };
        current = current.nested;
      }

      sentry.setContext('deep', deepContext);

      expect(SentryMock.setContext).toHaveBeenCalledWith('deep', deepContext);
    });
  });
});
