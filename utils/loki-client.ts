/**
 * Grafana Loki Client - Batched Log Shipping (2025)
 *
 * Sends logs to Grafana Cloud Loki for centralized log aggregation.
 * Batches logs to reduce API calls and stay within free tier limits.
 *
 * Free Tier: 50GB logs/month, 7-14 day retention, 100x query limit
 *
 * Authentication: Service Account Tokens (Bearer auth)
 * - API Keys deprecated January 2025
 * - Tokens start with "glsa_"
 *
 * Features:
 * - Structured metadata for high-cardinality data (user/device/session IDs)
 * - Exponential backoff retry logic
 * - Optimized batching with size-based flushing
 * - Auto-flush on app background to prevent log loss
 */

import { AppState, AppStateStatus } from 'react-native';

interface LogEntry {
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  context?: Record<string, any>;
  timestamp?: number; // Unix timestamp in milliseconds
  // High-cardinality metadata (not indexed, for filtering)
  metadata?: {
    userId?: string;
    deviceId?: string;
    sessionId?: string;
    traceId?: string;
  };
}

interface LokiStream {
  stream: Record<string, string>; // Indexed labels
  values: Array<[string, string, Record<string, string>?]>; // [timestamp_ns, log_line, structured_metadata]
}

class LokiClient {
  private queue: LogEntry[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private appStateSubscription: ReturnType<typeof AppState.addEventListener> | null = null;
  private readonly pushUrl: string;
  private readonly serviceAccountToken: string;
  private readonly tenantId: string;
  private readonly enabled: boolean;

  // Performance optimizations
  private readonly maxQueueSize = 100; // Flush when queue reaches this size
  private readonly maxBatchBytes = 1048576; // 1MB max batch size (Loki limit: 1.5MB)
  private readonly flushIntervalMs = 5000; // Flush every 5 seconds

  // Retry configuration with exponential backoff
  private readonly maxRetries = 3;
  private readonly baseRetryDelay = 1000; // 1 second
  private retryCount = 0;
  private retryTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.pushUrl = process.env.EXPO_PUBLIC_LOKI_PUSH_URL || '';
    this.serviceAccountToken = process.env.EXPO_PUBLIC_LOKI_SERVICE_ACCOUNT_TOKEN || '';
    this.tenantId = process.env.EXPO_PUBLIC_LOKI_TENANT_ID || '';

    // Check feature flag
    const lokiEnabled = process.env.EXPO_PUBLIC_ENABLE_LOKI === 'true';

    // Enable with valid credentials AND feature flag (development mode allowed for testing)
    this.enabled = lokiEnabled && !!this.pushUrl && !!this.serviceAccountToken && !!this.tenantId;

    if (this.enabled) {
      // Validate Cloud Access Policy token format
      const isValidToken = this.serviceAccountToken.startsWith('glc_') ||
                          this.serviceAccountToken.startsWith('glsa_');
      if (!isValidToken) {
        console.warn('[LokiClient] Invalid token format (should start with glc_ or glsa_)');
        (this as any).enabled = false;
        return;
      }

      // Start periodic flush
      this.flushInterval = setInterval(() => this.flush(), this.flushIntervalMs);

      // Listen for app state changes to flush on background
      this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);

      // Log that Loki is active
      if (__DEV__) {
        console.log('[LokiClient] Initialized and enabled');
      }
    } else if (__DEV__) {
      console.log('[LokiClient] Disabled (development mode or missing credentials)');
    }
  }

  /**
   * Handle app state changes - flush queue when app goes to background
   */
  private handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === 'background' || nextAppState === 'inactive') {
      // App is going to background - flush any pending logs
      if (this.queue.length > 0) {
        if (__DEV__) {
          console.log(`[LokiClient] 📲 App going to ${nextAppState}, flushing ${this.queue.length} logs`);
        }
        this.flush();
      }
    }
  }

  /**
   * Push a log entry to the queue
   */
  push(entry: LogEntry) {
    // Skip if disabled
    if (!this.enabled) {
      console.log('[LokiClient] ⏭️ Log skipped (disabled):', {
        enabled: this.enabled,
        level: entry.level,
        message: entry.message.substring(0, 50),
      });
      return;
    }

    // Add timestamp if not provided
    if (!entry.timestamp) {
      entry.timestamp = Date.now();
    }

    this.queue.push(entry);

    console.log('[LokiClient] 📝 Log queued:', {
      level: entry.level,
      message: entry.message.substring(0, 50),
      queueLength: this.queue.length,
      maxQueueSize: this.maxQueueSize,
      estimatedBatchSize: this.estimateBatchSize(),
      maxBatchBytes: this.maxBatchBytes,
    });

    // Flush immediately if queue is full or batch size exceeded
    if (this.queue.length >= this.maxQueueSize || this.estimateBatchSize() >= this.maxBatchBytes) {
      console.log('[LokiClient] 🔥 Triggering immediate flush (queue full or batch size exceeded)');
      this.flush();
    }
  }

  /**
   * Estimate current batch size in bytes
   */
  private estimateBatchSize(): number {
    return this.queue.reduce((total, entry) => {
      // Rough estimate: JSON.stringify size + metadata overhead
      const logSize = JSON.stringify(entry).length;
      return total + logSize + 200; // +200 for Loki protocol overhead
    }, 0);
  }

  /**
   * Flush queued logs to Loki with exponential backoff retry
   */
  private async flush() {
    if (this.queue.length === 0 || !this.enabled) {
      // Skip silently - no need to log when queue is empty
      return;
    }

    // Take all logs from queue
    const logs = this.queue.splice(0, this.queue.length);

    try {
      const streams = this.formatForLoki(logs);
      const requestBody = JSON.stringify({ streams });

      // Log request details
      console.log('[LokiClient] 🚀 Sending logs to Loki:', {
        url: this.pushUrl,
        logCount: logs.length,
        hasToken: !!this.serviceAccountToken,
        tokenPrefix: this.serviceAccountToken.substring(0, 10) + '...',
        bodySize: requestBody.length,
        streams: streams,
      });

      // Grafana Cloud Loki uses Basic Auth:
      // Username = Loki tenant ID
      // Password = Cloud Access Policy token
      const credentials = `${this.tenantId}:${this.serviceAccountToken}`;
      const basicAuth = btoa(credentials);

      const response = await fetch(this.pushUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Grafana Cloud Loki authentication
          'Authorization': `Basic ${basicAuth}`,
        },
        body: requestBody,
      });

      // Log response details
      console.log('[LokiClient] 📥 Response from Loki:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
      });

      // Try to read response body
      const responseText = await response.text();
      if (responseText) {
        console.log('[LokiClient] Response body:', responseText);
      }

      if (!response.ok) {
        // Check for rate limiting
        if (response.status === 429) {
          throw new Error('Loki rate limit exceeded - free tier: 100x query limit');
        }
        throw new Error(`Loki push failed: ${response.status} ${response.statusText} - ${responseText}`);
      }

      // Success - reset retry count
      this.retryCount = 0;
      console.log('[LokiClient] ✅ Logs sent successfully!');
    } catch (error) {
      // Log error with full details
      console.error('[LokiClient] ❌ Failed to send logs:', {
        error,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        logCount: logs.length,
        retryCount: this.retryCount,
      });

      // Retry with exponential backoff
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        const delay = this.baseRetryDelay * Math.pow(2, this.retryCount - 1);

        console.log(`[LokiClient] 🔄 Retrying in ${delay}ms (attempt ${this.retryCount}/${this.maxRetries})`);

        // Re-add failed logs to front of queue (prioritize old logs)
        this.queue.unshift(...logs);

        // Schedule retry
        if (this.retryTimeout) clearTimeout(this.retryTimeout);
        this.retryTimeout = setTimeout(() => this.flush(), delay);
      } else {
        // Max retries exceeded - drop oldest logs to prevent memory leak
        console.warn(`[LokiClient] ⚠️ Max retries exceeded, dropping ${logs.length} logs`);
        this.retryCount = 0; // Reset for next batch
      }
    }
  }

  /**
   * Format logs for Loki API with structured metadata (2025)
   */
  private formatForLoki(logs: LogEntry[]): LokiStream[] {
    return [
      {
        stream: {
          // Indexed labels (low-cardinality)
          app: 'courtster-mobile',
          environment: __DEV__ ? 'development' : 'production',
          platform: 'react-native',
        },
        values: logs.map((log) => {
          // Loki requires nanosecond timestamps
          const timestampNs = String((log.timestamp || Date.now()) * 1000000);

          // Format log line as JSON (context included in log body)
          const logLine = JSON.stringify({
            level: log.level,
            message: log.message,
            ...log.context,
          });

          // Structured metadata (high-cardinality, not indexed)
          // Better performance for user/device/session IDs
          const metadata = log.metadata
            ? Object.entries(log.metadata).reduce((acc, [key, value]) => {
                if (value !== undefined && value !== null) {
                  acc[key] = String(value);
                }
                return acc;
              }, {} as Record<string, string>)
            : undefined;

          // Return with optional structured metadata
          return metadata ? [timestampNs, logLine, metadata] : [timestampNs, logLine];
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

    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }

    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
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
      estimatedBatchSize: this.estimateBatchSize(),
      maxBatchBytes: this.maxBatchBytes,
      retryCount: this.retryCount,
    };
  }
}

// Export singleton instance
export const lokiClient = new LokiClient();
