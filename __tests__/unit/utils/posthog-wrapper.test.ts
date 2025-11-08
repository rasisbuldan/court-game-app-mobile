/**
 * Unit Tests: PostHog Wrapper
 *
 * Tests for PostHog analytics wrapper with feature flag support
 */

describe('PostHog Wrapper', () => {
  let posthog: any;
  let setPostHogInstance: any;
  let mockPostHogInstance: any;
  let originalEnv: any;

  beforeEach(() => {
    // Save original env
    originalEnv = { ...process.env };

    // Mock PostHog instance
    mockPostHogInstance = {
      capture: jest.fn(),
      identify: jest.fn(),
      reset: jest.fn(),
      setPersonProperties: jest.fn(),
      setPersonPropertiesOnce: jest.fn(),
      startSessionRecording: jest.fn(),
      stopSessionRecording: jest.fn(),
    };

    // Clear module cache and re-import
    jest.resetModules();
    const module = require('../../../utils/posthog-wrapper');
    posthog = module.posthog;
    setPostHogInstance = module.setPostHogInstance;
  });

  afterEach(() => {
    // Restore original env
    process.env = originalEnv;
  });

  describe('Initialization', () => {
    it('should start with no instance', () => {
      expect(posthog.getInstance()).toBeNull();
      expect(posthog.isEnabled()).toBe(false);
    });

    it('should allow setting PostHog instance', () => {
      setPostHogInstance(mockPostHogInstance);

      expect(posthog.getInstance()).toBe(mockPostHogInstance);
    });

    it('should be enabled with instance and feature flag', () => {
      process.env.EXPO_PUBLIC_ENABLE_POSTHOG = 'true';
      jest.resetModules();
      const module = require('../../../utils/posthog-wrapper');
      const ph = module.posthog;
      const setInstance = module.setPostHogInstance;

      setInstance(mockPostHogInstance);

      expect(ph.isEnabled()).toBe(true);
    });

    it('should be disabled without feature flag', () => {
      process.env.EXPO_PUBLIC_ENABLE_POSTHOG = 'false';
      jest.resetModules();
      const module = require('../../../utils/posthog-wrapper');
      const ph = module.posthog;
      const setInstance = module.setPostHogInstance;

      setInstance(mockPostHogInstance);

      expect(ph.isEnabled()).toBe(false);
    });

    it('should be disabled without instance even with feature flag', () => {
      process.env.EXPO_PUBLIC_ENABLE_POSTHOG = 'true';
      jest.resetModules();
      const module = require('../../../utils/posthog-wrapper');
      const ph = module.posthog;

      expect(ph.isEnabled()).toBe(false);
    });
  });

  describe('capture()', () => {
    beforeEach(() => {
      process.env.EXPO_PUBLIC_ENABLE_POSTHOG = 'true';
      jest.resetModules();
      const module = require('../../../utils/posthog-wrapper');
      posthog = module.posthog;
      setPostHogInstance = module.setPostHogInstance;
      setPostHogInstance(mockPostHogInstance);
    });

    it('should capture event when enabled', () => {
      posthog.capture('test_event');

      expect(mockPostHogInstance.capture).toHaveBeenCalledWith('test_event', undefined);
    });

    it('should capture event with properties', () => {
      const properties = {
        screen: 'Home',
        action: 'click',
        value: 123,
      };

      posthog.capture('test_event', properties);

      expect(mockPostHogInstance.capture).toHaveBeenCalledWith('test_event', properties);
    });

    it('should not capture when disabled', () => {
      process.env.EXPO_PUBLIC_ENABLE_POSTHOG = 'false';
      jest.resetModules();
      const module = require('../../../utils/posthog-wrapper');
      const ph = module.posthog;
      const setInstance = module.setPostHogInstance;
      setInstance(mockPostHogInstance);

      ph.capture('test_event');

      expect(mockPostHogInstance.capture).not.toHaveBeenCalled();
    });

    it('should not capture without instance', () => {
      process.env.EXPO_PUBLIC_ENABLE_POSTHOG = 'true';
      jest.resetModules();
      const module = require('../../../utils/posthog-wrapper');
      const ph = module.posthog;

      ph.capture('test_event');

      expect(mockPostHogInstance.capture).not.toHaveBeenCalled();
    });

    it('should handle capture errors gracefully', () => {
      mockPostHogInstance.capture.mockImplementation(() => {
        throw new Error('Capture failed');
      });

      // Should not throw
      expect(() => {
        posthog.capture('test_event');
      }).not.toThrow();
    });

    it('should support various property types', () => {
      const properties = {
        string: 'value',
        number: 42,
        boolean: true,
        null: null,
        object: { nested: 'data' },
        array: [1, 2, 3],
      };

      posthog.capture('test_event', properties);

      expect(mockPostHogInstance.capture).toHaveBeenCalledWith('test_event', properties);
    });
  });

  describe('identify()', () => {
    beforeEach(() => {
      process.env.EXPO_PUBLIC_ENABLE_POSTHOG = 'true';
      jest.resetModules();
      const module = require('../../../utils/posthog-wrapper');
      posthog = module.posthog;
      setPostHogInstance = module.setPostHogInstance;
      setPostHogInstance(mockPostHogInstance);
    });

    it('should identify user', () => {
      posthog.identify('user123');

      expect(mockPostHogInstance.identify).toHaveBeenCalledWith('user123', undefined);
    });

    it('should identify user with properties', () => {
      const properties = {
        email: 'user@example.com',
        name: 'John Doe',
        plan: 'premium',
      };

      posthog.identify('user123', properties);

      expect(mockPostHogInstance.identify).toHaveBeenCalledWith('user123', properties);
    });

    it('should not identify when disabled', () => {
      process.env.EXPO_PUBLIC_ENABLE_POSTHOG = 'false';
      jest.resetModules();
      const module = require('../../../utils/posthog-wrapper');
      const ph = module.posthog;
      const setInstance = module.setPostHogInstance;
      setInstance(mockPostHogInstance);

      ph.identify('user123');

      expect(mockPostHogInstance.identify).not.toHaveBeenCalled();
    });

    it('should handle identify errors gracefully', () => {
      mockPostHogInstance.identify.mockImplementation(() => {
        throw new Error('Identify failed');
      });

      expect(() => {
        posthog.identify('user123');
      }).not.toThrow();
    });
  });

  describe('reset()', () => {
    beforeEach(() => {
      process.env.EXPO_PUBLIC_ENABLE_POSTHOG = 'true';
      jest.resetModules();
      const module = require('../../../utils/posthog-wrapper');
      posthog = module.posthog;
      setPostHogInstance = module.setPostHogInstance;
      setPostHogInstance(mockPostHogInstance);
    });

    it('should reset user identity', () => {
      posthog.reset();

      expect(mockPostHogInstance.reset).toHaveBeenCalled();
    });

    it('should not reset when disabled', () => {
      process.env.EXPO_PUBLIC_ENABLE_POSTHOG = 'false';
      jest.resetModules();
      const module = require('../../../utils/posthog-wrapper');
      const ph = module.posthog;
      const setInstance = module.setPostHogInstance;
      setInstance(mockPostHogInstance);

      ph.reset();

      expect(mockPostHogInstance.reset).not.toHaveBeenCalled();
    });

    it('should handle reset errors gracefully', () => {
      mockPostHogInstance.reset.mockImplementation(() => {
        throw new Error('Reset failed');
      });

      expect(() => {
        posthog.reset();
      }).not.toThrow();
    });
  });

  describe('setPersonProperties()', () => {
    beforeEach(() => {
      process.env.EXPO_PUBLIC_ENABLE_POSTHOG = 'true';
      jest.resetModules();
      const module = require('../../../utils/posthog-wrapper');
      posthog = module.posthog;
      setPostHogInstance = module.setPostHogInstance;
      setPostHogInstance(mockPostHogInstance);
    });

    it('should set person properties', () => {
      const properties = {
        subscription: 'premium',
        role: 'admin',
      };

      posthog.setPersonProperties(properties);

      expect(mockPostHogInstance.setPersonProperties).toHaveBeenCalledWith(properties);
    });

    it('should not set properties when disabled', () => {
      process.env.EXPO_PUBLIC_ENABLE_POSTHOG = 'false';
      jest.resetModules();
      const module = require('../../../utils/posthog-wrapper');
      const ph = module.posthog;
      const setInstance = module.setPostHogInstance;
      setInstance(mockPostHogInstance);

      ph.setPersonProperties({ test: 'value' });

      expect(mockPostHogInstance.setPersonProperties).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', () => {
      mockPostHogInstance.setPersonProperties.mockImplementation(() => {
        throw new Error('Set properties failed');
      });

      expect(() => {
        posthog.setPersonProperties({ test: 'value' });
      }).not.toThrow();
    });
  });

  describe('setPersonPropertiesOnce()', () => {
    beforeEach(() => {
      process.env.EXPO_PUBLIC_ENABLE_POSTHOG = 'true';
      jest.resetModules();
      const module = require('../../../utils/posthog-wrapper');
      posthog = module.posthog;
      setPostHogInstance = module.setPostHogInstance;
      setPostHogInstance(mockPostHogInstance);
    });

    it('should set person properties once', () => {
      const properties = {
        firstSeen: '2025-01-01',
        initialPlan: 'free',
      };

      posthog.setPersonPropertiesOnce(properties);

      expect(mockPostHogInstance.setPersonPropertiesOnce).toHaveBeenCalledWith(properties);
    });

    it('should not set properties when disabled', () => {
      process.env.EXPO_PUBLIC_ENABLE_POSTHOG = 'false';
      jest.resetModules();
      const module = require('../../../utils/posthog-wrapper');
      const ph = module.posthog;
      const setInstance = module.setPostHogInstance;
      setInstance(mockPostHogInstance);

      ph.setPersonPropertiesOnce({ test: 'value' });

      expect(mockPostHogInstance.setPersonPropertiesOnce).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', () => {
      mockPostHogInstance.setPersonPropertiesOnce.mockImplementation(() => {
        throw new Error('Set properties once failed');
      });

      expect(() => {
        posthog.setPersonPropertiesOnce({ test: 'value' });
      }).not.toThrow();
    });
  });

  describe('startSessionRecording()', () => {
    beforeEach(() => {
      process.env.EXPO_PUBLIC_ENABLE_POSTHOG = 'true';
      jest.resetModules();
      const module = require('../../../utils/posthog-wrapper');
      posthog = module.posthog;
      setPostHogInstance = module.setPostHogInstance;
      setPostHogInstance(mockPostHogInstance);
    });

    it('should start session recording', () => {
      posthog.startSessionRecording();

      expect(mockPostHogInstance.startSessionRecording).toHaveBeenCalled();
    });

    it('should not start recording when disabled', () => {
      process.env.EXPO_PUBLIC_ENABLE_POSTHOG = 'false';
      jest.resetModules();
      const module = require('../../../utils/posthog-wrapper');
      const ph = module.posthog;
      const setInstance = module.setPostHogInstance;
      setInstance(mockPostHogInstance);

      ph.startSessionRecording();

      expect(mockPostHogInstance.startSessionRecording).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', () => {
      mockPostHogInstance.startSessionRecording.mockImplementation(() => {
        throw new Error('Start recording failed');
      });

      expect(() => {
        posthog.startSessionRecording();
      }).not.toThrow();
    });
  });

  describe('stopSessionRecording()', () => {
    beforeEach(() => {
      process.env.EXPO_PUBLIC_ENABLE_POSTHOG = 'true';
      jest.resetModules();
      const module = require('../../../utils/posthog-wrapper');
      posthog = module.posthog;
      setPostHogInstance = module.setPostHogInstance;
      setPostHogInstance(mockPostHogInstance);
    });

    it('should stop session recording', () => {
      posthog.stopSessionRecording();

      expect(mockPostHogInstance.stopSessionRecording).toHaveBeenCalled();
    });

    it('should not stop recording when disabled', () => {
      process.env.EXPO_PUBLIC_ENABLE_POSTHOG = 'false';
      jest.resetModules();
      const module = require('../../../utils/posthog-wrapper');
      const ph = module.posthog;
      const setInstance = module.setPostHogInstance;
      setInstance(mockPostHogInstance);

      ph.stopSessionRecording();

      expect(mockPostHogInstance.stopSessionRecording).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', () => {
      mockPostHogInstance.stopSessionRecording.mockImplementation(() => {
        throw new Error('Stop recording failed');
      });

      expect(() => {
        posthog.stopSessionRecording();
      }).not.toThrow();
    });
  });

  describe('Privacy Controls', () => {
    it('should respect opt-out via feature flag', () => {
      process.env.EXPO_PUBLIC_ENABLE_POSTHOG = 'false';
      jest.resetModules();
      const module = require('../../../utils/posthog-wrapper');
      const ph = module.posthog;
      const setInstance = module.setPostHogInstance;
      setInstance(mockPostHogInstance);

      // All methods should be no-ops when disabled
      ph.capture('event');
      ph.identify('user');
      ph.reset();
      ph.setPersonProperties({});
      ph.setPersonPropertiesOnce({});
      ph.startSessionRecording();
      ph.stopSessionRecording();

      expect(mockPostHogInstance.capture).not.toHaveBeenCalled();
      expect(mockPostHogInstance.identify).not.toHaveBeenCalled();
      expect(mockPostHogInstance.reset).not.toHaveBeenCalled();
      expect(mockPostHogInstance.setPersonProperties).not.toHaveBeenCalled();
      expect(mockPostHogInstance.setPersonPropertiesOnce).not.toHaveBeenCalled();
      expect(mockPostHogInstance.startSessionRecording).not.toHaveBeenCalled();
      expect(mockPostHogInstance.stopSessionRecording).not.toHaveBeenCalled();
    });

    it('should allow re-enabling via feature flag', () => {
      // Start disabled
      process.env.EXPO_PUBLIC_ENABLE_POSTHOG = 'false';
      jest.resetModules();
      let module = require('../../../utils/posthog-wrapper');
      let ph = module.posthog;
      let setInstance = module.setPostHogInstance;
      setInstance(mockPostHogInstance);

      ph.capture('event1');
      expect(mockPostHogInstance.capture).not.toHaveBeenCalled();

      // Re-enable
      process.env.EXPO_PUBLIC_ENABLE_POSTHOG = 'true';
      jest.resetModules();
      module = require('../../../utils/posthog-wrapper');
      ph = module.posthog;
      setInstance = module.setPostHogInstance;
      setInstance(mockPostHogInstance);

      ph.capture('event2');
      expect(mockPostHogInstance.capture).toHaveBeenCalledWith('event2', undefined);
    });
  });

  describe('getInstance()', () => {
    it('should return null initially', () => {
      expect(posthog.getInstance()).toBeNull();
    });

    it('should return PostHog instance after setting', () => {
      setPostHogInstance(mockPostHogInstance);

      expect(posthog.getInstance()).toBe(mockPostHogInstance);
    });

    it('should allow direct access to PostHog methods', () => {
      setPostHogInstance(mockPostHogInstance);
      const instance = posthog.getInstance();

      instance.capture('test');

      expect(mockPostHogInstance.capture).toHaveBeenCalledWith('test');
    });
  });

  describe('isEnabled()', () => {
    it('should return false without feature flag', () => {
      process.env.EXPO_PUBLIC_ENABLE_POSTHOG = 'false';
      jest.resetModules();
      const module = require('../../../utils/posthog-wrapper');
      const ph = module.posthog;
      const setInstance = module.setPostHogInstance;
      setInstance(mockPostHogInstance);

      expect(ph.isEnabled()).toBe(false);
    });

    it('should return false without instance', () => {
      process.env.EXPO_PUBLIC_ENABLE_POSTHOG = 'true';
      jest.resetModules();
      const module = require('../../../utils/posthog-wrapper');
      const ph = module.posthog;

      expect(ph.isEnabled()).toBe(false);
    });

    it('should return true with both feature flag and instance', () => {
      process.env.EXPO_PUBLIC_ENABLE_POSTHOG = 'true';
      jest.resetModules();
      const module = require('../../../utils/posthog-wrapper');
      const ph = module.posthog;
      const setInstance = module.setPostHogInstance;
      setInstance(mockPostHogInstance);

      expect(ph.isEnabled()).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle setting null instance', () => {
      setPostHogInstance(null);

      expect(posthog.getInstance()).toBeNull();
      expect(posthog.isEnabled()).toBe(false);
    });

    it('should handle setting undefined instance', () => {
      setPostHogInstance(undefined);

      expect(posthog.getInstance()).toBeUndefined();
      expect(posthog.isEnabled()).toBe(false);
    });

    it('should handle empty event names', () => {
      process.env.EXPO_PUBLIC_ENABLE_POSTHOG = 'true';
      jest.resetModules();
      const module = require('../../../utils/posthog-wrapper');
      const ph = module.posthog;
      const setInstance = module.setPostHogInstance;
      setInstance(mockPostHogInstance);

      ph.capture('');

      expect(mockPostHogInstance.capture).toHaveBeenCalledWith('', undefined);
    });

    it('should handle special characters in event names', () => {
      process.env.EXPO_PUBLIC_ENABLE_POSTHOG = 'true';
      jest.resetModules();
      const module = require('../../../utils/posthog-wrapper');
      const ph = module.posthog;
      const setInstance = module.setPostHogInstance;
      setInstance(mockPostHogInstance);

      ph.capture('event:test.foo-bar_123');

      expect(mockPostHogInstance.capture).toHaveBeenCalledWith('event:test.foo-bar_123', undefined);
    });

    it('should handle circular references in properties', () => {
      process.env.EXPO_PUBLIC_ENABLE_POSTHOG = 'true';
      jest.resetModules();
      const module = require('../../../utils/posthog-wrapper');
      const ph = module.posthog;
      const setInstance = module.setPostHogInstance;
      setInstance(mockPostHogInstance);

      const circular: any = { a: 1 };
      circular.self = circular;

      // Should not throw
      expect(() => {
        ph.capture('test', circular);
      }).not.toThrow();
    });
  });
});
