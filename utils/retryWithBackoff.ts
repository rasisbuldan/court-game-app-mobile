/**
 * Retry utility with exponential backoff
 * Implements smart retry logic for handling temporary failures
 *
 * Related: Issue #3 - Score Input Race Condition Fix
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: any, attempt: number) => boolean;
  onRetry?: (error: any, attempt: number, delayMs: number) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelayMs: 1000, // 1 second
  maxDelayMs: 10000, // 10 seconds
  backoffMultiplier: 2,
  shouldRetry: (error: any) => {
    // Retry on network errors, timeouts, and database locks
    if (error?.message?.includes('lock') ||
        error?.message?.includes('timeout') ||
        error?.message?.includes('network') ||
        error?.code === 'PGRST301' || // PostgREST timeout
        error?.code === '40P01') { // Postgres deadlock
      return true;
    }
    return false;
  },
  onRetry: () => {},
};

/**
 * Executes an async function with retry logic and exponential backoff
 *
 * @param fn - Async function to execute
 * @param options - Retry configuration options
 * @returns Promise that resolves with the function result or rejects after all retries exhausted
 *
 * @example
 * const result = await retryWithBackoff(
 *   () => supabase.from('table').update(data),
 *   {
 *     maxRetries: 3,
 *     onRetry: (error, attempt) => console.log(`Retry ${attempt}:`, error)
 *   }
 * );
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  let lastError: any;
  let attempt = 0;

  while (attempt <= opts.maxRetries) {
    try {
      // Execute the function
      return await fn();
    } catch (error) {
      lastError = error;
      attempt++;

      // Check if we should retry
      if (attempt > opts.maxRetries || !opts.shouldRetry(error, attempt)) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const baseDelay = opts.initialDelayMs * Math.pow(opts.backoffMultiplier, attempt - 1);
      // Add jitter (random 0-20% variation) to prevent thundering herd
      const jitter = Math.random() * 0.2 * baseDelay;
      const delay = Math.min(baseDelay + jitter, opts.maxDelayMs);

      // Call retry callback
      opts.onRetry(error, attempt, delay);

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // All retries exhausted
  throw lastError;
}

/**
 * Creates a retry wrapper function with pre-configured options
 *
 * @param options - Default retry options for this wrapper
 * @returns Function that wraps any async function with retry logic
 *
 * @example
 * const retryDbOperation = createRetryWrapper({
 *   maxRetries: 5,
 *   initialDelayMs: 500
 * });
 *
 * const result = await retryDbOperation(() =>
 *   supabase.from('table').update(data)
 * );
 */
export function createRetryWrapper(options: RetryOptions = {}) {
  return <T>(fn: () => Promise<T>) => retryWithBackoff(fn, options);
}

/**
 * Pre-configured retry wrapper for database operations
 * Optimized for handling lock conflicts and temporary failures
 */
export const retryDbOperation = createRetryWrapper({
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 8000,
  shouldRetry: (error: any, attempt: number) => {
    // Retry on locks, timeouts, and connection issues
    if (error?.message?.includes('lock') ||
        error?.message?.includes('timeout') ||
        error?.message?.includes('could not serialize') ||
        error?.message?.includes('connection') ||
        error?.code === 'PGRST301' ||
        error?.code === '40P01' ||
        error?.code === '40001') { // Serialization failure
      return true;
    }
    return false;
  },
});

/**
 * Pre-configured retry wrapper for score updates
 * More aggressive retry for critical score-saving operations
 */
export const retryScoreUpdate = createRetryWrapper({
  maxRetries: 5, // More retries for scores
  initialDelayMs: 500, // Faster initial retry
  maxDelayMs: 5000,
  backoffMultiplier: 1.5, // Gentler backoff
  shouldRetry: (error: any) => {
    // Always retry score updates on lock conflicts
    return error?.message?.includes('lock') ||
           error?.message?.includes('timeout') ||
           error?.code === 'PGRST301' ||
           error?.code === '40P01';
  },
});
