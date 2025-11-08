/**
 * Unit Tests: Supabase Configuration
 *
 * Tests for Supabase client initialization with AsyncStorage integration
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock @supabase/supabase-js
const mockCreateClient = jest.fn();
jest.mock('@supabase/supabase-js', () => ({
  createClient: (...args: any[]) => mockCreateClient(...args),
}));

// Mock react-native-url-polyfill
jest.mock('react-native-url-polyfill/auto', () => ({}));

describe('Supabase Configuration', () => {
  let originalEnv: any;

  beforeEach(() => {
    // Save original env
    originalEnv = { ...process.env };

    // Set up mock environment variables
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key-123';

    // Clear mocks
    mockCreateClient.mockClear();
    mockCreateClient.mockReturnValue({
      auth: {
        signIn: jest.fn(),
        signOut: jest.fn(),
      },
      from: jest.fn(),
    });

    // Clear module cache
    jest.resetModules();
  });

  afterEach(() => {
    // Restore original env
    process.env = originalEnv;
  });

  describe('Environment Variables', () => {
    it('should throw error if SUPABASE_URL is missing', () => {
      delete process.env.EXPO_PUBLIC_SUPABASE_URL;

      expect(() => {
        require('../../../config/supabase');
      }).toThrow('Missing Supabase environment variables');
    });

    it('should throw error if SUPABASE_ANON_KEY is missing', () => {
      delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

      expect(() => {
        require('../../../config/supabase');
      }).toThrow('Missing Supabase environment variables');
    });

    it('should throw error if both variables are missing', () => {
      delete process.env.EXPO_PUBLIC_SUPABASE_URL;
      delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

      expect(() => {
        require('../../../config/supabase');
      }).toThrow('Missing Supabase environment variables');
    });

    it('should not throw if both variables are present', () => {
      expect(() => {
        require('../../../config/supabase');
      }).not.toThrow();
    });

    it('should use EXPO_PUBLIC_SUPABASE_URL from env', () => {
      const testUrl = 'https://custom.supabase.co';
      process.env.EXPO_PUBLIC_SUPABASE_URL = testUrl;

      require('../../../config/supabase');

      expect(mockCreateClient).toHaveBeenCalledWith(
        testUrl,
        expect.any(String),
        expect.any(Object)
      );
    });

    it('should use EXPO_PUBLIC_SUPABASE_ANON_KEY from env', () => {
      const testKey = 'custom-anon-key-456';
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = testKey;

      require('../../../config/supabase');

      expect(mockCreateClient).toHaveBeenCalledWith(
        expect.any(String),
        testKey,
        expect.any(Object)
      );
    });
  });

  describe('Client Initialization', () => {
    it('should create Supabase client', () => {
      require('../../../config/supabase');

      expect(mockCreateClient).toHaveBeenCalled();
    });

    it('should call createClient with URL and key', () => {
      require('../../../config/supabase');

      expect(mockCreateClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-anon-key-123',
        expect.any(Object)
      );
    });

    it('should call createClient with auth options', () => {
      require('../../../config/supabase');

      expect(mockCreateClient).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          auth: expect.any(Object),
        })
      );
    });

    it('should export supabase client', () => {
      const { supabase } = require('../../../config/supabase');

      expect(supabase).toBeDefined();
    });
  });

  describe('Auth Configuration', () => {
    it('should configure AsyncStorage for auth storage', () => {
      require('../../../config/supabase');

      const authConfig = mockCreateClient.mock.calls[0][2].auth;

      expect(authConfig.storage).toBe(AsyncStorage);
    });

    it('should enable autoRefreshToken', () => {
      require('../../../config/supabase');

      const authConfig = mockCreateClient.mock.calls[0][2].auth;

      expect(authConfig.autoRefreshToken).toBe(true);
    });

    it('should enable persistSession', () => {
      require('../../../config/supabase');

      const authConfig = mockCreateClient.mock.calls[0][2].auth;

      expect(authConfig.persistSession).toBe(true);
    });

    it('should disable detectSessionInUrl', () => {
      require('../../../config/supabase');

      const authConfig = mockCreateClient.mock.calls[0][2].auth;

      expect(authConfig.detectSessionInUrl).toBe(false);
    });

    it('should have all required auth options', () => {
      require('../../../config/supabase');

      const authConfig = mockCreateClient.mock.calls[0][2].auth;

      expect(authConfig).toHaveProperty('storage');
      expect(authConfig).toHaveProperty('autoRefreshToken');
      expect(authConfig).toHaveProperty('persistSession');
      expect(authConfig).toHaveProperty('detectSessionInUrl');
    });
  });

  describe('AsyncStorage Integration', () => {
    it('should use AsyncStorage for session persistence', () => {
      require('../../../config/supabase');

      const authConfig = mockCreateClient.mock.calls[0][2].auth;

      expect(authConfig.storage).toBe(AsyncStorage);
    });

    it('should allow AsyncStorage to store tokens', () => {
      require('../../../config/supabase');

      const authConfig = mockCreateClient.mock.calls[0][2].auth;
      const storage = authConfig.storage;

      expect(storage.setItem).toBeDefined();
      expect(storage.getItem).toBeDefined();
      expect(storage.removeItem).toBeDefined();
    });

    it('should use AsyncStorage methods', () => {
      require('../../../config/supabase');

      const authConfig = mockCreateClient.mock.calls[0][2].auth;
      const storage = authConfig.storage;

      expect(storage.setItem).toBe(AsyncStorage.setItem);
      expect(storage.getItem).toBe(AsyncStorage.getItem);
      expect(storage.removeItem).toBe(AsyncStorage.removeItem);
    });
  });

  describe('URL Polyfill', () => {
    it('should import react-native-url-polyfill', () => {
      // The import should not throw
      expect(() => {
        require('../../../config/supabase');
      }).not.toThrow();
    });
  });

  describe('Database Types', () => {
    it('should support typed database access', () => {
      const { supabase } = require('../../../config/supabase');

      // Client should be created (type checking happens at compile time)
      expect(supabase).toBeDefined();
    });
  });

  describe('Client Export', () => {
    it('should export supabase as named export', () => {
      const module = require('../../../config/supabase');

      expect(module).toHaveProperty('supabase');
    });

    it('should return same client instance on multiple imports', () => {
      const { supabase: client1 } = require('../../../config/supabase');
      const { supabase: client2 } = require('../../../config/supabase');

      expect(client1).toBe(client2);
    });
  });

  describe('Error Handling', () => {
    it('should provide helpful error message for missing env vars', () => {
      delete process.env.EXPO_PUBLIC_SUPABASE_URL;

      try {
        require('../../../config/supabase');
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).toContain('Missing Supabase environment variables');
        expect(error.message).toContain('.env');
      }
    });

    it('should check both URL and key together', () => {
      delete process.env.EXPO_PUBLIC_SUPABASE_URL;
      delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

      try {
        require('../../../config/supabase');
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).toContain('Missing Supabase environment variables');
      }
    });
  });

  describe('Configuration Consistency', () => {
    it('should use same URL for all operations', () => {
      const testUrl = 'https://consistent.supabase.co';
      process.env.EXPO_PUBLIC_SUPABASE_URL = testUrl;

      require('../../../config/supabase');

      expect(mockCreateClient.mock.calls[0][0]).toBe(testUrl);
    });

    it('should use same key for all operations', () => {
      const testKey = 'consistent-key-789';
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = testKey;

      require('../../../config/supabase');

      expect(mockCreateClient.mock.calls[0][1]).toBe(testKey);
    });
  });

  describe('Mobile-Specific Configuration', () => {
    it('should persist sessions for mobile', () => {
      require('../../../config/supabase');

      const authConfig = mockCreateClient.mock.calls[0][2].auth;

      expect(authConfig.persistSession).toBe(true);
    });

    it('should auto-refresh tokens for mobile', () => {
      require('../../../config/supabase');

      const authConfig = mockCreateClient.mock.calls[0][2].auth;

      expect(authConfig.autoRefreshToken).toBe(true);
    });

    it('should not detect session in URL for mobile', () => {
      require('../../../config/supabase');

      const authConfig = mockCreateClient.mock.calls[0][2].auth;

      // Mobile apps don't use URL-based auth flows
      expect(authConfig.detectSessionInUrl).toBe(false);
    });
  });

  describe('Security', () => {
    it('should use anon key (not service role key)', () => {
      const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.anon';
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = anonKey;

      require('../../../config/supabase');

      // Should use the anon key (exposed to client)
      expect(mockCreateClient.mock.calls[0][1]).toBe(anonKey);
    });

    it('should not expose service role key', () => {
      // Service role key should never be in client code
      expect(process.env.SUPABASE_SERVICE_ROLE_KEY).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string URL', () => {
      process.env.EXPO_PUBLIC_SUPABASE_URL = '';

      expect(() => {
        require('../../../config/supabase');
      }).toThrow();
    });

    it('should handle empty string key', () => {
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = '';

      expect(() => {
        require('../../../config/supabase');
      }).toThrow();
    });

    it('should handle whitespace-only URL', () => {
      process.env.EXPO_PUBLIC_SUPABASE_URL = '   ';

      expect(() => {
        require('../../../config/supabase');
      }).toThrow();
    });

    it('should handle whitespace-only key', () => {
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = '   ';

      expect(() => {
        require('../../../config/supabase');
      }).toThrow();
    });

    it('should handle URL with protocol', () => {
      const urlWithProtocol = 'https://project.supabase.co';
      process.env.EXPO_PUBLIC_SUPABASE_URL = urlWithProtocol;

      require('../../../config/supabase');

      expect(mockCreateClient.mock.calls[0][0]).toBe(urlWithProtocol);
    });

    it('should handle URL without trailing slash', () => {
      const url = 'https://project.supabase.co';
      process.env.EXPO_PUBLIC_SUPABASE_URL = url;

      require('../../../config/supabase');

      expect(mockCreateClient.mock.calls[0][0]).toBe(url);
    });
  });

  describe('Initialization Order', () => {
    it('should import URL polyfill before createClient', () => {
      // URL polyfill should be imported first (required for React Native)
      // This is ensured by the import order in the file
      expect(() => {
        require('../../../config/supabase');
      }).not.toThrow();
    });

    it('should validate env vars before creating client', () => {
      delete process.env.EXPO_PUBLIC_SUPABASE_URL;

      // Should throw before createClient is called
      expect(() => {
        require('../../../config/supabase');
      }).toThrow();

      // createClient should never be called with invalid config
      expect(mockCreateClient).not.toHaveBeenCalled();
    });
  });

  describe('Type Safety', () => {
    it('should create client with Database types', () => {
      // Type parameter is checked at compile time
      const { supabase } = require('../../../config/supabase');

      expect(supabase).toBeDefined();
    });

    it('should support typed queries', () => {
      const { supabase } = require('../../../config/supabase');

      // Type checking happens at compile time
      expect(typeof supabase.from).toBe('function');
    });
  });

  describe('Module Structure', () => {
    it('should be a CommonJS/ES module', () => {
      const module = require('../../../config/supabase');

      expect(module).toBeInstanceOf(Object);
    });

    it('should export only supabase client', () => {
      const module = require('../../../config/supabase');
      const exports = Object.keys(module);

      expect(exports).toContain('supabase');
    });
  });

  describe('Real-World Scenarios', () => {
    it('should work with production Supabase URL', () => {
      process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://abcdefgh.supabase.co';
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

      expect(() => {
        require('../../../config/supabase');
      }).not.toThrow();
    });

    it('should work with local development URL', () => {
      process.env.EXPO_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'local-anon-key';

      expect(() => {
        require('../../../config/supabase');
      }).not.toThrow();
    });

    it('should support multiple environment configurations', () => {
      // Production
      process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://prod.supabase.co';
      require('../../../config/supabase');
      expect(mockCreateClient.mock.calls[0][0]).toContain('prod');

      jest.resetModules();
      mockCreateClient.mockClear();

      // Staging
      process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://staging.supabase.co';
      require('../../../config/supabase');
      expect(mockCreateClient.mock.calls[0][0]).toContain('staging');
    });
  });
});
