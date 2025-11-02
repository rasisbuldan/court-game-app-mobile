/**
 * Grafana Loki Client - Batched Log Shipping
 *
 * Sends logs to Grafana Cloud Loki for centralized log aggregation.
 * Batches logs to reduce API calls and stay within free tier limits.
 *
 * Free Tier: 50GB logs/month, 14-day retention
 */

interface LogEntry {
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  context?: Record<string, any>;
  timestamp?: number; // Unix timestamp in milliseconds
}

interface LokiStream {
  stream: Record<string, string>;
  values: Array<[string, string]>; // [timestamp_nanoseconds, log_line]
}

class LokiClient {
  private queue: LogEntry[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private readonly pushUrl: string;
  private readonly username: string;
  private readonly apiKey: string;
  private readonly enabled: boolean;
  private readonly maxQueueSize = 100; // Flush when queue reaches this size
  private readonly flushIntervalMs = 5000; // Flush every 5 seconds

  constructor() {
    this.pushUrl = process.env.EXPO_PUBLIC_LOKI_PUSH_URL || '';
    this.username = process.env.EXPO_PUBLIC_LOKI_USER_ID || '';
    this.apiKey = process.env.EXPO_PUBLIC_LOKI_API_KEY || '';

    // Only enable in production with valid credentials
    this.enabled = !__DEV__ && !!this.pushUrl && !!this.username && !!this.apiKey;

    if (this.enabled) {
      // Start periodic flush
      this.flushInterval = setInterval(() => this.flush(), this.flushIntervalMs);

      // Log that Loki is active
      if (__DEV__) {
        console.log('[LokiClient] Initialized and enabled');
      }
    } else if (__DEV__) {
      console.log('[LokiClient] Disabled (development mode or missing credentials)');
    }
  }

  /**
   * Push a log entry to the queue
   */
  push(entry: LogEntry) {
    // Skip if disabled or in development
    if (!this.enabled) return;

    // Add timestamp if not provided
    if (!entry.timestamp) {
      entry.timestamp = Date.now();
    }

    this.queue.push(entry);

    // Flush immediately if queue is full
    if (this.queue.length >= this.maxQueueSize) {
      this.flush();
    }
  }

  /**
   * Flush queued logs to Loki
   */
  private async flush() {
    if (this.queue.length === 0 || !this.enabled) return;

    // Take all logs from queue
    const logs = this.queue.splice(0, this.queue.length);

    try {
      const streams = this.formatForLoki(logs);

      const response = await fetch(this.pushUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${btoa(`${this.username}:${this.apiKey}`)}`,
        },
        body: JSON.stringify({ streams }),
      });

      if (!response.ok) {
        throw new Error(`Loki push failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      // Log error in development only (avoid infinite loop)
      if (__DEV__) {
        console.error('[LokiClient] Failed to send logs:', error);
      }

      // Re-add failed logs to queue (with limit to prevent memory leak)
      const logsToRetry = logs.slice(0, 50);
      this.queue.unshift(...logsToRetry);
    }
  }

  /**
   * Format logs for Loki API
   */
  private formatForLoki(logs: LogEntry[]): LokiStream[] {
    return [
      {
        stream: {
          app: 'courtster-mobile',
          environment: __DEV__ ? 'development' : 'production',
          platform: 'react-native',
        },
        values: logs.map((log) => {
          // Loki requires nanosecond timestamps
          const timestampNs = String((log.timestamp || Date.now()) * 1000000);

          // Format log line as JSON
          const logLine = JSON.stringify({
            level: log.level,
            message: log.message,
            ...log.context,
          });

          return [timestampNs, logLine];
        }),
      },
    ];
  }

  /**
   * Flush remaining logs and stop interval (call on app close)
   */
  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }

    // Final flush
    this.flush();
  }

  /**
   * Get queue stats (for debugging)
   */
  getStats() {
    return {
      enabled: this.enabled,
      queueSize: this.queue.length,
      maxQueueSize: this.maxQueueSize,
    };
  }
}

// Export singleton instance
export const lokiClient = new LokiClient();
