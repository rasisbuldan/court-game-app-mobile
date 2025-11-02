/**
 * Notification Error Handling and Monitoring
 *
 * Provides robust error handling, logging, and monitoring for notification services
 */

export enum NotificationErrorCode {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  TOKEN_REGISTRATION_FAILED = 'TOKEN_REGISTRATION_FAILED',
  TOKEN_SAVE_FAILED = 'TOKEN_SAVE_FAILED',
  NOTIFICATION_SEND_FAILED = 'NOTIFICATION_SEND_FAILED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  NETWORK_ERROR = 'NETWORK_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  DEVICE_NOT_SUPPORTED = 'DEVICE_NOT_SUPPORTED',
  PROJECT_ID_MISSING = 'PROJECT_ID_MISSING',
  CHANNEL_SETUP_FAILED = 'CHANNEL_SETUP_FAILED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}

export class NotificationError extends Error {
  code: NotificationErrorCode;
  originalError?: Error;
  context?: Record<string, any>;
  timestamp: Date;
  retryable: boolean;

  constructor(
    code: NotificationErrorCode,
    message: string,
    originalError?: Error,
    context?: Record<string, any>,
    retryable: boolean = false
  ) {
    super(message);
    this.name = 'NotificationError';
    this.code = code;
    this.originalError = originalError;
    this.context = context;
    this.timestamp = new Date();
    this.retryable = retryable;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NotificationError);
    }
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      timestamp: this.timestamp.toISOString(),
      retryable: this.retryable,
      context: this.context,
      stack: this.stack,
      originalError: this.originalError ? {
        message: this.originalError.message,
        stack: this.originalError.stack,
      } : undefined,
    };
  }
}

/**
 * Error Logger
 */
class NotificationErrorLogger {
  private errors: NotificationError[] = [];
  private readonly maxErrors = 100;

  log(error: NotificationError) {
    this.errors.push(error);

    // Keep only recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    // Log to console in development
    if (__DEV__) {
      console.error('[Notification Error]', {
        code: error.code,
        message: error.message,
        retryable: error.retryable,
        context: error.context,
        originalError: error.originalError,
      });
    }

    // In production, you could send to error tracking service like Sentry
    this.reportToMonitoring(error);
  }

  private reportToMonitoring(error: NotificationError) {
    // TODO: Integrate with error tracking service (Sentry, Bugsnag, etc.)
    // Example:
    // Sentry.captureException(error, {
    //   tags: { code: error.code, retryable: error.retryable },
    //   extra: error.context,
    // });
  }

  getRecentErrors(limit: number = 10): NotificationError[] {
    return this.errors.slice(-limit);
  }

  getErrorsByCode(code: NotificationErrorCode): NotificationError[] {
    return this.errors.filter(e => e.code === code);
  }

  clearErrors() {
    this.errors = [];
  }

  getErrorStats() {
    const stats: Record<string, number> = {};
    this.errors.forEach(error => {
      stats[error.code] = (stats[error.code] || 0) + 1;
    });
    return stats;
  }
}

export const errorLogger = new NotificationErrorLogger();

/**
 * Retry Strategy
 */
export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
};

export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  errorCode: NotificationErrorCode,
  context?: Record<string, any>
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // Log the error
      const notificationError = new NotificationError(
        errorCode,
        `Attempt ${attempt}/${config.maxAttempts} failed: ${lastError.message}`,
        lastError,
        { ...context, attempt },
        attempt < config.maxAttempts
      );
      errorLogger.log(notificationError);

      // Don't retry on last attempt
      if (attempt === config.maxAttempts) {
        break;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1),
        config.maxDelay
      );

      // Add jitter to prevent thundering herd
      const jitter = Math.random() * delay * 0.1;
      await new Promise(resolve => setTimeout(resolve, delay + jitter));
    }
  }

  throw new NotificationError(
    errorCode,
    `Operation failed after ${config.maxAttempts} attempts`,
    lastError!,
    context,
    false
  );
}

/**
 * Circuit Breaker Pattern
 */
enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Failing, reject requests
  HALF_OPEN = 'HALF_OPEN', // Testing if service recovered
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime: number = 0;
  private nextAttemptTime: number = 0;

  constructor(
    private readonly threshold: number = 5,
    private readonly timeout: number = 60000, // 1 minute
    private readonly halfOpenAttempts: number = 3
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttemptTime) {
        throw new NotificationError(
          NotificationErrorCode.RATE_LIMIT_EXCEEDED,
          'Circuit breaker is OPEN - too many recent failures',
          undefined,
          { nextAttemptTime: new Date(this.nextAttemptTime).toISOString() },
          false
        );
      }
      // Try to recover
      this.state = CircuitState.HALF_OPEN;
      this.successCount = 0;
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.halfOpenAttempts) {
        this.state = CircuitState.CLOSED;
        this.successCount = 0;
      }
    }
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.OPEN;
      this.nextAttemptTime = Date.now() + this.timeout;
    } else if (this.failureCount >= this.threshold) {
      this.state = CircuitState.OPEN;
      this.nextAttemptTime = Date.now() + this.timeout;
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  reset() {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
    this.nextAttemptTime = 0;
  }
}

/**
 * Rate Limiter
 */
export class RateLimiter {
  private requests: number[] = [];

  constructor(
    private readonly maxRequests: number = 10,
    private readonly windowMs: number = 60000 // 1 minute
  ) {}

  async throttle<T>(operation: () => Promise<T>): Promise<T> {
    const now = Date.now();

    // Remove old requests outside the window
    this.requests = this.requests.filter(time => time > now - this.windowMs);

    // Check if we've exceeded the limit
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = oldestRequest + this.windowMs - now;

      throw new NotificationError(
        NotificationErrorCode.RATE_LIMIT_EXCEEDED,
        `Rate limit exceeded. Try again in ${Math.ceil(waitTime / 1000)} seconds`,
        undefined,
        {
          maxRequests: this.maxRequests,
          windowMs: this.windowMs,
          waitTimeMs: waitTime,
        },
        true
      );
    }

    this.requests.push(now);
    return await operation();
  }

  reset() {
    this.requests = [];
  }
}

/**
 * Health Check
 */
export interface HealthStatus {
  healthy: boolean;
  lastCheck: Date;
  errors: number;
  circuitBreakerState: CircuitState;
  details: {
    permissionsGranted?: boolean;
    tokenValid?: boolean;
    databaseConnected?: boolean;
    lastNotificationSent?: Date;
  };
}

export class HealthMonitor {
  private lastHealthCheck: HealthStatus = {
    healthy: true,
    lastCheck: new Date(),
    errors: 0,
    circuitBreakerState: CircuitState.CLOSED,
    details: {},
  };

  async checkHealth(circuitBreaker: CircuitBreaker): Promise<HealthStatus> {
    const recentErrors = errorLogger.getRecentErrors(10);
    const errorCount = recentErrors.length;

    this.lastHealthCheck = {
      healthy: errorCount < 5 && circuitBreaker.getState() !== CircuitState.OPEN,
      lastCheck: new Date(),
      errors: errorCount,
      circuitBreakerState: circuitBreaker.getState(),
      details: {
        // These would be populated by actual checks
      },
    };

    return this.lastHealthCheck;
  }

  getLastHealthCheck(): HealthStatus {
    return this.lastHealthCheck;
  }
}

export const healthMonitor = new HealthMonitor();
