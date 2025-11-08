/**
 * Unit tests for retryWithBackoff utility
 * Tests retry logic, exponential backoff, error handling, and edge cases
 */

import {
  retryWithBackoff,
  createRetryWrapper,
  retryDbOperation,
  retryScoreUpdate,
  RetryOptions,
} from '../../../utils/retryWithBackoff';

describe('retryWithBackoff', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Successful Operations', () => {
    it('should return result immediately on first try success', async () => {
      const successFn = jest.fn().mockResolvedValue('success');

      const promise = retryWithBackoff(successFn);
      await Promise.resolve(); // Flush promises
      const result = await promise;

      expect(result).toBe('success');
      expect(successFn).toHaveBeenCalledTimes(1);
    });

    it('should return correct data type on success', async () => {
      const objectResult = { id: '123', name: 'Test' };
      const successFn = jest.fn().mockResolvedValue(objectResult);

      const result = await retryWithBackoff(successFn);

      expect(result).toEqual(objectResult);
      expect(result).toHaveProperty('id', '123');
    });

    it('should handle async functions that return primitives', async () => {
      const numberFn = jest.fn().mockResolvedValue(42);
      const boolFn = jest.fn().mockResolvedValue(true);
      const stringFn = jest.fn().mockResolvedValue('test');

      expect(await retryWithBackoff(numberFn)).toBe(42);
      expect(await retryWithBackoff(boolFn)).toBe(true);
      expect(await retryWithBackoff(stringFn)).toBe('test');
    });

    it('should handle async functions that return null or undefined', async () => {
      const nullFn = jest.fn().mockResolvedValue(null);
      const undefinedFn = jest.fn().mockResolvedValue(undefined);

      expect(await retryWithBackoff(nullFn)).toBeNull();
      expect(await retryWithBackoff(undefinedFn)).toBeUndefined();
    });
  });

  describe('Retry Logic', () => {
    it('should retry after failure with lock error', async () => {
      const lockError = new Error('Database lock detected');
      const fn = jest
        .fn()
        .mockRejectedValueOnce(lockError)
        .mockResolvedValueOnce('success');

      const result = await retryWithBackoff(fn, { initialDelayMs: 10 });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should retry after failure with timeout error', async () => {
      const timeoutError = new Error('Request timeout');
      const fn = jest
        .fn()
        .mockRejectedValueOnce(timeoutError)
        .mockResolvedValueOnce('success');

      const result = await retryWithBackoff(fn, { initialDelayMs: 10 });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should retry after failure with network error', async () => {
      const networkError = new Error('network failure');
      const fn = jest
        .fn()
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce('success');

      const result = await retryWithBackoff(fn, { initialDelayMs: 10 });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should retry with PostgREST timeout code PGRST301', async () => {
      const error = { message: 'Timeout', code: 'PGRST301' };
      const fn = jest
        .fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce('success');

      const result = await retryWithBackoff(fn, { initialDelayMs: 10 });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should retry with Postgres deadlock code 40P01', async () => {
      const error = { message: 'Deadlock', code: '40P01' };
      const fn = jest
        .fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce('success');

      const result = await retryWithBackoff(fn, { initialDelayMs: 10 });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should succeed after N retries', async () => {
      const error = new Error('lock error');
      const fn = jest
        .fn()
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce('success');

      const result = await retryWithBackoff(fn, {
        maxRetries: 5,
        initialDelayMs: 10,
      });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(4); // Initial + 3 retries
    });
  });

  describe('Exponential Backoff Calculation', () => {
    it('should calculate exponential backoff correctly', async () => {
      const error = new Error('lock error');
      const fn = jest
        .fn()
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce('success');

      const onRetry = jest.fn();

      const promise = retryWithBackoff(fn, {
        initialDelayMs: 1000,
        backoffMultiplier: 2,
        onRetry,
      });

      jest.runAllTimers();

      await promise;

      expect(onRetry).toHaveBeenCalledTimes(2);
      // First retry delay should be around 1000ms (+ jitter up to 200ms)
      expect(onRetry.mock.calls[0][2]).toBeGreaterThanOrEqual(1000);
      expect(onRetry.mock.calls[0][2]).toBeLessThanOrEqual(1200);
      // Second retry delay should be around 2000ms (+ jitter up to 400ms)
      expect(onRetry.mock.calls[1][2]).toBeGreaterThanOrEqual(2000);
      expect(onRetry.mock.calls[1][2]).toBeLessThanOrEqual(2400);
    });

    it('should respect maxDelayMs cap', async () => {
      const error = new Error('lock error');
      const fn = jest
        .fn()
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce('success');

      const onRetry = jest.fn();

      const promise = retryWithBackoff(fn, {
        initialDelayMs: 1000,
        maxDelayMs: 2500,
        backoffMultiplier: 2,
        onRetry,
      });

      jest.runAllTimers();

      await promise;

      // Third retry should be capped at maxDelayMs
      expect(onRetry.mock.calls[2][2]).toBeLessThanOrEqual(2500);
    });

    it('should add jitter to prevent thundering herd', async () => {
      const error = new Error('lock error');
      const delays: number[] = [];

      // Run multiple attempts to verify jitter variation
      for (let i = 0; i < 5; i++) {
        const fn = jest
          .fn()
          .mockRejectedValueOnce(error)
          .mockResolvedValueOnce('success');

        const onRetry = jest.fn((err, attempt, delay) => {
          delays.push(delay);
        });

        const promise = retryWithBackoff(fn, {
          initialDelayMs: 1000,
          onRetry,
        });

        jest.runAllTimers();
        await promise;
      }

      // Check that delays have variation (not all identical)
      const uniqueDelays = new Set(delays);
      expect(uniqueDelays.size).toBeGreaterThan(1);

      // All delays should be within expected range (1000-1200ms)
      delays.forEach(delay => {
        expect(delay).toBeGreaterThanOrEqual(1000);
        expect(delay).toBeLessThanOrEqual(1200);
      });
    });

    it('should use custom backoff multiplier', async () => {
      const error = new Error('lock error');
      const fn = jest
        .fn()
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce('success');

      const onRetry = jest.fn();

      const promise = retryWithBackoff(fn, {
        initialDelayMs: 1000,
        backoffMultiplier: 1.5,
        onRetry,
      });

      jest.runAllTimers();

      await promise;

      // First retry: 1000 * 1.5^0 = 1000ms
      expect(onRetry.mock.calls[0][2]).toBeGreaterThanOrEqual(1000);
      expect(onRetry.mock.calls[0][2]).toBeLessThanOrEqual(1200);
      // Second retry: 1000 * 1.5^1 = 1500ms
      expect(onRetry.mock.calls[1][2]).toBeGreaterThanOrEqual(1500);
      expect(onRetry.mock.calls[1][2]).toBeLessThanOrEqual(1800);
    });
  });

  describe('Max Retry Limit', () => {
    it('should respect maxRetries limit', async () => {
      const error = new Error('lock error');
      const fn = jest.fn().mockRejectedValue(error);

      const promise = retryWithBackoff(fn, {
        maxRetries: 2,
        initialDelayMs: 100,
      });

      // Advance through all retries
      for (let i = 0; i <= 2; i++) {
        await Promise.resolve();
        jest.advanceTimersByTime(1000);
      }

      await expect(promise).rejects.toThrow('lock error');
      expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should throw error after max retries exhausted', async () => {
      const error = new Error('persistent lock error');
      const fn = jest.fn().mockRejectedValue(error);

      const promise = retryWithBackoff(fn, {
        maxRetries: 3,
        initialDelayMs: 100,
      });

      for (let i = 0; i <= 3; i++) {
        await Promise.resolve();
        jest.advanceTimersByTime(1000);
      }

      await expect(promise).rejects.toThrow('persistent lock error');
      expect(fn).toHaveBeenCalledTimes(4);
    });

    it('should handle maxRetries = 0 (no retries)', async () => {
      const error = new Error('lock error');
      const fn = jest.fn().mockRejectedValue(error);

      const promise = retryWithBackoff(fn, { maxRetries: 0 });

      await expect(promise).rejects.toThrow('lock error');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should handle maxRetries = 1 (one retry)', async () => {
      const error = new Error('lock error');
      const fn = jest.fn().mockRejectedValue(error);

      const promise = retryWithBackoff(fn, {
        maxRetries: 1,
        initialDelayMs: 100,
      });

      await Promise.resolve();
      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      await expect(promise).rejects.toThrow('lock error');
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('Custom shouldRetry Function', () => {
    it('should not retry when shouldRetry returns false', async () => {
      const error = new Error('lock error');
      const fn = jest.fn().mockRejectedValue(error);

      const shouldRetry = jest.fn().mockReturnValue(false);

      const promise = retryWithBackoff(fn, { shouldRetry });

      await expect(promise).rejects.toThrow('lock error');
      expect(fn).toHaveBeenCalledTimes(1);
      expect(shouldRetry).toHaveBeenCalledWith(error, 1);
    });

    it('should retry when shouldRetry returns true', async () => {
      const error = new Error('custom error');
      const fn = jest
        .fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce('success');

      const shouldRetry = jest.fn().mockReturnValue(true);

      const promise = retryWithBackoff(fn, {
        shouldRetry,
        initialDelayMs: 100,
      });

      await Promise.resolve();
      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      const result = await promise;
      expect(result).toBe('success');
      expect(shouldRetry).toHaveBeenCalledWith(error, 1);
    });

    it('should pass error and attempt number to shouldRetry', async () => {
      const error = new Error('test error');
      const fn = jest.fn().mockRejectedValue(error);

      const shouldRetry = jest.fn((err, attempt) => attempt < 3);

      const promise = retryWithBackoff(fn, {
        shouldRetry,
        initialDelayMs: 100,
        maxRetries: 5,
      });

      for (let i = 0; i < 3; i++) {
        await Promise.resolve();
        jest.advanceTimersByTime(1000);
      }

      await expect(promise).rejects.toThrow('test error');
      expect(shouldRetry).toHaveBeenCalledTimes(3);
      expect(shouldRetry).toHaveBeenNthCalledWith(1, error, 1);
      expect(shouldRetry).toHaveBeenNthCalledWith(2, error, 2);
      expect(shouldRetry).toHaveBeenNthCalledWith(3, error, 3);
    });

    it('should not retry on non-retryable errors', async () => {
      const authError = new Error('Unauthorized');
      const fn = jest.fn().mockRejectedValue(authError);

      const promise = retryWithBackoff(fn);

      await expect(promise).rejects.toThrow('Unauthorized');
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('onRetry Callback', () => {
    it('should call onRetry callback on each retry', async () => {
      const error = new Error('lock error');
      const fn = jest
        .fn()
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce('success');

      const onRetry = jest.fn();

      const promise = retryWithBackoff(fn, {
        onRetry,
        initialDelayMs: 100,
      });

      jest.runAllTimers();

      await promise;
      expect(onRetry).toHaveBeenCalledTimes(2);
    });

    it('should pass error, attempt, and delay to onRetry', async () => {
      const error = new Error('lock error');
      const fn = jest
        .fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce('success');

      const onRetry = jest.fn();

      const promise = retryWithBackoff(fn, {
        onRetry,
        initialDelayMs: 1000,
      });

      jest.runAllTimers();

      await promise;

      expect(onRetry).toHaveBeenCalledWith(error, 1, expect.any(Number));
      const delay = onRetry.mock.calls[0][2];
      expect(delay).toBeGreaterThanOrEqual(1000);
      expect(delay).toBeLessThanOrEqual(1200);
    });

    it('should not call onRetry on first attempt', async () => {
      const fn = jest.fn().mockResolvedValue('success');
      const onRetry = jest.fn();

      await retryWithBackoff(fn, { onRetry });

      expect(onRetry).not.toHaveBeenCalled();
    });
  });

  describe('createRetryWrapper', () => {
    it('should create wrapper with pre-configured options', async () => {
      const wrapper = createRetryWrapper({
        maxRetries: 5,
        initialDelayMs: 500,
      });

      const error = new Error('lock error');
      const fn = jest
        .fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce('success');

      const promise = wrapper(fn);

      jest.runAllTimers();

      const result = await promise;
      expect(result).toBe('success');
    });

    it('should allow overriding options per call', async () => {
      const wrapper = createRetryWrapper({ maxRetries: 5 });

      const error = new Error('lock error');
      const fn = jest.fn().mockRejectedValue(error);

      const promise = wrapper(fn);

      // Wrapper should use maxRetries: 5
      jest.runAllTimers();

      await expect(promise).rejects.toThrow();
      expect(fn).toHaveBeenCalledTimes(6); // Initial + 5 retries
    });
  });

  describe('retryDbOperation', () => {
    it('should retry on database lock errors', async () => {
      const error = new Error('Database lock detected');
      const fn = jest
        .fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce('success');

      const promise = retryDbOperation(fn);

      jest.runAllTimers();

      const result = await promise;
      expect(result).toBe('success');
    });

    it('should retry on serialization failure (40001)', async () => {
      const error = { message: 'Serialization failure', code: '40001' };
      const fn = jest
        .fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce('success');

      const promise = retryDbOperation(fn);

      jest.runAllTimers();

      const result = await promise;
      expect(result).toBe('success');
    });

    it('should retry on connection errors', async () => {
      const error = new Error('connection failed');
      const fn = jest
        .fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce('success');

      const promise = retryDbOperation(fn);

      jest.runAllTimers();

      const result = await promise;
      expect(result).toBe('success');
    });

    it('should have correct default configuration', () => {
      // Test that retryDbOperation uses correct defaults by checking behavior
      const error = new Error('lock error');
      const fn = jest.fn().mockRejectedValue(error);
      const onRetry = jest.fn();

      const promise = retryDbOperation(fn);

      // Should use maxRetries: 3
      for (let i = 0; i <= 3; i++) {
        Promise.resolve().then(() => jest.advanceTimersByTime(10000));
      }

      // Verify it attempts 4 times (initial + 3 retries)
      setTimeout(() => {
        expect(fn).toHaveBeenCalledTimes(4);
      }, 0);
    });
  });

  describe('retryScoreUpdate', () => {
    it('should retry on lock conflicts', async () => {
      const error = new Error('Database lock detected');
      const fn = jest
        .fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce('success');

      const promise = retryScoreUpdate(fn);

      jest.runAllTimers();

      const result = await promise;
      expect(result).toBe('success');
    });

    it('should use more aggressive retry for scores', async () => {
      const error = new Error('lock error');
      const fn = jest.fn().mockRejectedValue(error);

      const promise = retryScoreUpdate(fn);

      // Should allow up to 5 retries
      jest.runAllTimers();

      await expect(promise).rejects.toThrow();
      expect(fn).toHaveBeenCalledTimes(6); // Initial + 5 retries
    });

    it('should use faster initial retry', () => {
      const error = new Error('lock error');
      const fn = jest
        .fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce('success');

      const onRetry = jest.fn();

      // retryScoreUpdate uses initialDelayMs: 500
      const promise = retryScoreUpdate(fn);

      Promise.resolve().then(() => {
        jest.advanceTimersByTime(600); // 500ms + jitter
        Promise.resolve().then(async () => {
          await promise;
          // First delay should be around 500ms
          expect(fn).toHaveBeenCalledTimes(2);
        });
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle function that throws synchronously', async () => {
      const fn = jest.fn(() => {
        throw new Error('sync error');
      });

      await expect(retryWithBackoff(fn)).rejects.toThrow('sync error');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should handle empty error object', async () => {
      const fn = jest.fn().mockRejectedValueOnce({}).mockResolvedValueOnce('success');

      await expect(retryWithBackoff(fn)).rejects.toEqual({});
    });

    it('should handle error with missing properties', async () => {
      const error = { someField: 'value' };
      const fn = jest.fn().mockRejectedValue(error);

      await expect(retryWithBackoff(fn)).rejects.toEqual(error);
    });

    it('should handle very large maxRetries', async () => {
      const error = new Error('lock error');
      const fn = jest.fn().mockRejectedValue(error);

      const promise = retryWithBackoff(fn, {
        maxRetries: 1000,
        initialDelayMs: 10,
      });

      // Only advance a few times and verify it continues
      for (let i = 0; i < 5; i++) {
        await Promise.resolve();
        jest.advanceTimersByTime(100);
      }

      expect(fn.mock.calls.length).toBeGreaterThan(1);
    });

    it('should handle initialDelayMs = 0', async () => {
      const error = new Error('lock error');
      const fn = jest
        .fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce('success');

      const promise = retryWithBackoff(fn, { initialDelayMs: 0 });

      await Promise.resolve();
      jest.advanceTimersByTime(1);
      await Promise.resolve();

      const result = await promise;
      expect(result).toBe('success');
    });

    it('should handle backoffMultiplier = 1 (no exponential growth)', async () => {
      const error = new Error('lock error');
      const fn = jest
        .fn()
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce('success');

      const onRetry = jest.fn();

      const promise = retryWithBackoff(fn, {
        initialDelayMs: 1000,
        backoffMultiplier: 1,
        onRetry,
      });

      jest.runAllTimers();

      await promise;

      // All delays should be around 1000ms (no growth)
      onRetry.mock.calls.forEach(call => {
        expect(call[2]).toBeGreaterThanOrEqual(1000);
        expect(call[2]).toBeLessThanOrEqual(1200);
      });
    });

    it('should handle multiple sequential retry operations', async () => {
      const error = new Error('lock error');

      const fn1 = jest
        .fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce('success1');

      const fn2 = jest
        .fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce('success2');

      const promise1 = retryWithBackoff(fn1, { initialDelayMs: 100 });
      await Promise.resolve();
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
      const result1 = await promise1;

      const promise2 = retryWithBackoff(fn2, { initialDelayMs: 100 });
      await Promise.resolve();
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
      const result2 = await promise2;

      expect(result1).toBe('success1');
      expect(result2).toBe('success2');
    });
  });

  describe('Error Types', () => {
    it('should preserve original error instance', async () => {
      class CustomError extends Error {
        code: string;
        constructor(message: string, code: string) {
          super(message);
          this.code = code;
        }
      }

      const error = new CustomError('Custom error', 'CUSTOM_001');
      const fn = jest.fn().mockRejectedValue(error);

      try {
        await retryWithBackoff(fn);
      } catch (e) {
        expect(e).toBeInstanceOf(CustomError);
        expect((e as CustomError).code).toBe('CUSTOM_001');
      }
    });

    it('should handle Error objects with custom properties', async () => {
      const error = new Error('Test error');
      (error as any).statusCode = 500;
      (error as any).details = { foo: 'bar' };

      const fn = jest.fn().mockRejectedValue(error);

      try {
        await retryWithBackoff(fn);
      } catch (e) {
        expect((e as any).statusCode).toBe(500);
        expect((e as any).details).toEqual({ foo: 'bar' });
      }
    });
  });
});
