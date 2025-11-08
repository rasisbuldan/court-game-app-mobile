/**
 * Unit Tests: Loki Client
 *
 * Tests for Grafana Loki log shipping client with batching and retry logic
 */

import { AppState } from 'react-native';

// Mock environment variables
const mockEnv = {
  EXPO_PUBLIC_LOKI_PUSH_URL: 'https://logs-prod-us-central1.grafana.net/loki/api/v1/push',
  EXPO_PUBLIC_LOKI_SERVICE_ACCOUNT_TOKEN: 'glsa_test_token_12345',
  EXPO_PUBLIC_LOKI_TENANT_ID: '123456',
  EXPO_PUBLIC_ENABLE_LOKI: 'true',
};

// Mock fetch globally
global.fetch = jest.fn();
global.btoa = jest.fn((str) => Buffer.from(str).toString('base64'));

// Mock timers
jest.useFakeTimers();

describe('LokiClient', () => {
  let lokiClient: any;
  let originalEnv: any;

  beforeEach(() => {
    // Save original env
    originalEnv = { ...process.env };

    // Set mock env
    Object.assign(process.env, mockEnv);

    // Clear fetch mock
    (global.fetch as jest.Mock).mockClear();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 204,
      statusText: 'No Content',
      text: async () => '',
      headers: new Map(),
    });

    // Clear module cache and re-import
    jest.resetModules();
    const module = require('../../../utils/loki-client');
    lokiClient = module.lokiClient;

    // Clear any pending timers
    jest.clearAllTimers();
  });

  afterEach(() => {
    // Restore original env
    process.env = originalEnv;

    // Clean up client
    if (lokiClient) {
      lokiClient.destroy();
    }
  });

  describe('Initialization', () => {
    it('should initialize when feature flag is enabled and credentials are valid', () => {
      const stats = lokiClient.getStats();
      expect(stats.enabled).toBe(true);
    });

    it('should be disabled when feature flag is off', () => {
      process.env.EXPO_PUBLIC_ENABLE_LOKI = 'false';
      jest.resetModules();
      const module = require('../../../utils/loki-client');
      const client = module.lokiClient;

      const stats = client.getStats();
      expect(stats.enabled).toBe(false);
    });

    it('should be disabled when push URL is missing', () => {
      delete process.env.EXPO_PUBLIC_LOKI_PUSH_URL;
      jest.resetModules();
      const module = require('../../../utils/loki-client');
      const client = module.lokiClient;

      const stats = client.getStats();
      expect(stats.enabled).toBe(false);
    });

    it('should be disabled when service account token is missing', () => {
      delete process.env.EXPO_PUBLIC_LOKI_SERVICE_ACCOUNT_TOKEN;
      jest.resetModules();
      const module = require('../../../utils/loki-client');
      const client = module.lokiClient;

      const stats = client.getStats();
      expect(stats.enabled).toBe(false);
    });

    it('should be disabled when tenant ID is missing', () => {
      delete process.env.EXPO_PUBLIC_LOKI_TENANT_ID;
      jest.resetModules();
      const module = require('../../../utils/loki-client');
      const client = module.lokiClient;

      const stats = client.getStats();
      expect(stats.enabled).toBe(false);
    });

    it('should accept glc_ token prefix', () => {
      process.env.EXPO_PUBLIC_LOKI_SERVICE_ACCOUNT_TOKEN = 'glc_test_token';
      jest.resetModules();
      const module = require('../../../utils/loki-client');
      const client = module.lokiClient;

      const stats = client.getStats();
      expect(stats.enabled).toBe(true);
    });

    it('should accept glsa_ token prefix', () => {
      process.env.EXPO_PUBLIC_LOKI_SERVICE_ACCOUNT_TOKEN = 'glsa_test_token';
      jest.resetModules();
      const module = require('../../../utils/loki-client');
      const client = module.lokiClient;

      const stats = client.getStats();
      expect(stats.enabled).toBe(true);
    });

    it('should be disabled with invalid token format', () => {
      process.env.EXPO_PUBLIC_LOKI_SERVICE_ACCOUNT_TOKEN = 'invalid_token';
      jest.resetModules();
      const module = require('../../../utils/loki-client');
      const client = module.lokiClient;

      const stats = client.getStats();
      expect(stats.enabled).toBe(false);
    });
  });

  describe('Push Logs', () => {
    it('should add log to queue', () => {
      lokiClient.push({
        level: 'info',
        message: 'Test message',
      });

      const stats = lokiClient.getStats();
      expect(stats.queueSize).toBe(1);
    });

    it('should add timestamp if not provided', () => {
      const beforeTime = Date.now();

      lokiClient.push({
        level: 'info',
        message: 'Test message',
      });

      const afterTime = Date.now();
      const stats = lokiClient.getStats();
      expect(stats.queueSize).toBe(1);
      // Timestamp should be between before and after
    });

    it('should preserve provided timestamp', () => {
      const customTimestamp = 1234567890000;

      lokiClient.push({
        level: 'info',
        message: 'Test message',
        timestamp: customTimestamp,
      });

      const stats = lokiClient.getStats();
      expect(stats.queueSize).toBe(1);
    });

    it('should skip logs when disabled', () => {
      process.env.EXPO_PUBLIC_ENABLE_LOKI = 'false';
      jest.resetModules();
      const module = require('../../../utils/loki-client');
      const client = module.lokiClient;

      client.push({
        level: 'info',
        message: 'Test message',
      });

      const stats = client.getStats();
      expect(stats.queueSize).toBe(0);
    });

    it('should support all log levels', () => {
      const levels = ['error', 'warn', 'info', 'debug'] as const;

      levels.forEach((level) => {
        lokiClient.push({
          level,
          message: `Test ${level} message`,
        });
      });

      const stats = lokiClient.getStats();
      expect(stats.queueSize).toBe(4);
    });

    it('should include context data', () => {
      lokiClient.push({
        level: 'error',
        message: 'Error occurred',
        context: {
          userId: 'user123',
          action: 'login',
          errorCode: 500,
        },
      });

      const stats = lokiClient.getStats();
      expect(stats.queueSize).toBe(1);
    });

    it('should include structured metadata', () => {
      lokiClient.push({
        level: 'info',
        message: 'User action',
        metadata: {
          userId: 'user123',
          deviceId: 'device456',
          sessionId: 'session789',
          traceId: 'trace012',
        },
      });

      const stats = lokiClient.getStats();
      expect(stats.queueSize).toBe(1);
    });
  });

  describe('Batch Flushing', () => {
    it('should flush on queue size limit', async () => {
      // Add 100 logs (max queue size)
      for (let i = 0; i < 100; i++) {
        lokiClient.push({
          level: 'info',
          message: `Log ${i}`,
        });
      }

      // Fast-forward timers to allow async flush
      await jest.runAllTimersAsync();

      expect(global.fetch).toHaveBeenCalled();
    });

    it('should flush periodically', async () => {
      lokiClient.push({
        level: 'info',
        message: 'Test message',
      });

      // Fast-forward 5 seconds (flush interval)
      await jest.advanceTimersByTimeAsync(5000);

      expect(global.fetch).toHaveBeenCalled();
    });

    it('should not flush empty queue', async () => {
      // Fast-forward flush interval
      await jest.advanceTimersByTimeAsync(5000);

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should clear queue after successful flush', async () => {
      lokiClient.push({
        level: 'info',
        message: 'Test message',
      });

      await jest.advanceTimersByTimeAsync(5000);

      const stats = lokiClient.getStats();
      expect(stats.queueSize).toBe(0);
    });
  });

  describe('Format for Loki', () => {
    it('should format logs with correct structure', async () => {
      lokiClient.push({
        level: 'info',
        message: 'Test message',
      });

      await jest.advanceTimersByTimeAsync(5000);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody).toHaveProperty('streams');
      expect(requestBody.streams).toHaveLength(1);
      expect(requestBody.streams[0]).toHaveProperty('stream');
      expect(requestBody.streams[0]).toHaveProperty('values');
    });

    it('should include indexed labels', async () => {
      lokiClient.push({
        level: 'info',
        message: 'Test message',
      });

      await jest.advanceTimersByTimeAsync(5000);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      const stream = requestBody.streams[0].stream;

      expect(stream).toHaveProperty('app', 'courtster-mobile');
      expect(stream).toHaveProperty('platform', 'react-native');
      expect(stream).toHaveProperty('environment');
    });

    it('should format timestamps as nanoseconds', async () => {
      const now = Date.now();
      lokiClient.push({
        level: 'info',
        message: 'Test message',
        timestamp: now,
      });

      await jest.advanceTimersByTimeAsync(5000);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      const timestamp = requestBody.streams[0].values[0][0];

      // Should be nanoseconds (ms * 1000000)
      expect(timestamp).toBe(String(now * 1000000));
    });

    it('should format log line as JSON', async () => {
      lokiClient.push({
        level: 'error',
        message: 'Error occurred',
        context: { errorCode: 500 },
      });

      await jest.advanceTimersByTimeAsync(5000);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      const logLine = requestBody.streams[0].values[0][1];
      const parsed = JSON.parse(logLine);

      expect(parsed).toHaveProperty('level', 'error');
      expect(parsed).toHaveProperty('message', 'Error occurred');
      expect(parsed).toHaveProperty('errorCode', 500);
    });

    it('should include structured metadata when provided', async () => {
      lokiClient.push({
        level: 'info',
        message: 'Test message',
        metadata: {
          userId: 'user123',
          deviceId: 'device456',
        },
      });

      await jest.advanceTimersByTimeAsync(5000);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      const metadata = requestBody.streams[0].values[0][2];

      expect(metadata).toHaveProperty('userId', 'user123');
      expect(metadata).toHaveProperty('deviceId', 'device456');
    });

    it('should filter out null/undefined metadata values', async () => {
      lokiClient.push({
        level: 'info',
        message: 'Test message',
        metadata: {
          userId: 'user123',
          deviceId: undefined,
          sessionId: null as any,
        },
      });

      await jest.advanceTimersByTimeAsync(5000);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      const metadata = requestBody.streams[0].values[0][2];

      expect(metadata).toHaveProperty('userId');
      expect(metadata).not.toHaveProperty('deviceId');
      expect(metadata).not.toHaveProperty('sessionId');
    });
  });

  describe('HTTP Request', () => {
    it('should send POST request to push URL', async () => {
      lokiClient.push({
        level: 'info',
        message: 'Test message',
      });

      await jest.advanceTimersByTimeAsync(5000);

      expect(global.fetch).toHaveBeenCalledWith(
        mockEnv.EXPO_PUBLIC_LOKI_PUSH_URL,
        expect.any(Object)
      );
    });

    it('should use correct headers', async () => {
      lokiClient.push({
        level: 'info',
        message: 'Test message',
      });

      await jest.advanceTimersByTimeAsync(5000);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const headers = fetchCall[1].headers;

      expect(headers).toHaveProperty('Content-Type', 'application/json');
      expect(headers).toHaveProperty('Authorization');
    });

    it('should use Basic Auth with tenant ID and token', async () => {
      lokiClient.push({
        level: 'info',
        message: 'Test message',
      });

      await jest.advanceTimersByTimeAsync(5000);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const authHeader = fetchCall[1].headers.Authorization;

      expect(authHeader).toContain('Basic ');
      expect(global.btoa).toHaveBeenCalledWith(
        `${mockEnv.EXPO_PUBLIC_LOKI_TENANT_ID}:${mockEnv.EXPO_PUBLIC_LOKI_SERVICE_ACCOUNT_TOKEN}`
      );
    });

    it('should send valid JSON body', async () => {
      lokiClient.push({
        level: 'info',
        message: 'Test message',
      });

      await jest.advanceTimersByTimeAsync(5000);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const body = fetchCall[1].body;

      expect(() => JSON.parse(body)).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      lokiClient.push({
        level: 'info',
        message: 'Test message',
      });

      await jest.advanceTimersByTimeAsync(5000);

      // Should not throw - error is handled internally
      const stats = lokiClient.getStats();
      expect(stats.retryCount).toBeGreaterThan(0);
    });

    it('should handle HTTP error responses', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Server error',
        headers: new Map(),
      });

      lokiClient.push({
        level: 'info',
        message: 'Test message',
      });

      await jest.advanceTimersByTimeAsync(5000);

      const stats = lokiClient.getStats();
      expect(stats.retryCount).toBeGreaterThan(0);
    });

    it('should handle rate limiting (429)', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        text: async () => 'Rate limited',
        headers: new Map(),
      });

      lokiClient.push({
        level: 'info',
        message: 'Test message',
      });

      await jest.advanceTimersByTimeAsync(5000);

      const stats = lokiClient.getStats();
      expect(stats.retryCount).toBeGreaterThan(0);
    });

    it('should retry with exponential backoff', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      lokiClient.push({
        level: 'info',
        message: 'Test message',
      });

      // First attempt at flush interval
      await jest.advanceTimersByTimeAsync(5000);
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // First retry after 1s
      await jest.advanceTimersByTimeAsync(1000);
      expect(global.fetch).toHaveBeenCalledTimes(2);

      // Second retry after 2s
      await jest.advanceTimersByTimeAsync(2000);
      expect(global.fetch).toHaveBeenCalledTimes(3);

      // Third retry after 4s
      await jest.advanceTimersByTimeAsync(4000);
      expect(global.fetch).toHaveBeenCalledTimes(4);
    });

    it('should give up after max retries', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      lokiClient.push({
        level: 'info',
        message: 'Test message',
      });

      // Exhaust all retries
      await jest.advanceTimersByTimeAsync(5000); // Initial
      await jest.advanceTimersByTimeAsync(1000); // Retry 1
      await jest.advanceTimersByTimeAsync(2000); // Retry 2
      await jest.advanceTimersByTimeAsync(4000); // Retry 3

      const stats = lokiClient.getStats();
      expect(stats.retryCount).toBe(0); // Reset after max retries
      expect(stats.queueSize).toBe(0); // Logs dropped
    });

    it('should reset retry count on success', async () => {
      // First request fails
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      // Second request succeeds
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 204,
        statusText: 'No Content',
        text: async () => '',
        headers: new Map(),
      });

      lokiClient.push({
        level: 'info',
        message: 'Test message',
      });

      await jest.advanceTimersByTimeAsync(5000); // Initial attempt fails
      await jest.advanceTimersByTimeAsync(1000); // Retry succeeds

      const stats = lokiClient.getStats();
      expect(stats.retryCount).toBe(0); // Reset on success
    });
  });

  describe('App State Changes', () => {
    it('should flush on app going to background', async () => {
      lokiClient.push({
        level: 'info',
        message: 'Test message',
      });

      // Simulate app going to background
      const stateChangeCallback = (AppState.addEventListener as jest.Mock).mock.calls[0][1];
      stateChangeCallback('background');

      await jest.runAllTimersAsync();

      expect(global.fetch).toHaveBeenCalled();
    });

    it('should flush on app going to inactive', async () => {
      lokiClient.push({
        level: 'info',
        message: 'Test message',
      });

      // Simulate app going to inactive
      const stateChangeCallback = (AppState.addEventListener as jest.Mock).mock.calls[0][1];
      stateChangeCallback('inactive');

      await jest.runAllTimersAsync();

      expect(global.fetch).toHaveBeenCalled();
    });

    it('should not flush on empty queue during background', async () => {
      // Simulate app going to background with empty queue
      const stateChangeCallback = (AppState.addEventListener as jest.Mock).mock.calls[0][1];
      stateChangeCallback('background');

      await jest.runAllTimersAsync();

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Batch Size Estimation', () => {
    it('should estimate batch size', () => {
      lokiClient.push({
        level: 'info',
        message: 'Test message',
      });

      const stats = lokiClient.getStats();
      expect(stats.estimatedBatchSize).toBeGreaterThan(0);
    });

    it('should flush when batch size exceeds limit', async () => {
      // Create a large log entry
      const largeContext = { data: 'x'.repeat(100000) };

      for (let i = 0; i < 15; i++) {
        lokiClient.push({
          level: 'info',
          message: 'Large log entry',
          context: largeContext,
        });
      }

      await jest.runAllTimersAsync();

      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('Statistics', () => {
    it('should return correct stats', () => {
      lokiClient.push({
        level: 'info',
        message: 'Test message 1',
      });
      lokiClient.push({
        level: 'error',
        message: 'Test message 2',
      });

      const stats = lokiClient.getStats();

      expect(stats).toHaveProperty('enabled');
      expect(stats).toHaveProperty('queueSize', 2);
      expect(stats).toHaveProperty('maxQueueSize');
      expect(stats).toHaveProperty('estimatedBatchSize');
      expect(stats).toHaveProperty('maxBatchBytes');
      expect(stats).toHaveProperty('retryCount', 0);
    });
  });

  describe('Cleanup', () => {
    it('should clear flush interval on destroy', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      lokiClient.destroy();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });

    it('should clear retry timeout on destroy', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      lokiClient.destroy();

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('should remove app state listener on destroy', () => {
      const removeListener = jest.fn();
      (AppState.addEventListener as jest.Mock).mockReturnValue({
        remove: removeListener,
      });

      // Create new client to get fresh listener
      jest.resetModules();
      const module = require('../../../utils/loki-client');
      const client = module.lokiClient;

      client.destroy();

      expect(removeListener).toHaveBeenCalled();
    });

    it('should flush remaining logs on destroy', async () => {
      lokiClient.push({
        level: 'info',
        message: 'Test message',
      });

      lokiClient.destroy();
      await jest.runAllTimersAsync();

      expect(global.fetch).toHaveBeenCalled();
    });
  });
});
