# Monitoring Stack Setup Guide (Updated 2025)

This guide shows how to configure the monitoring stack (Sentry + Grafana Loki + PostHog) for the Courtster mobile app.

**Last Updated:** January 2025
**Loki Version:** 3.5 (latest stable)
**React Native:** 0.81.4
**Expo SDK:** 54

## Overview

The app uses three free-tier monitoring services:
- **Sentry**: Error tracking & performance monitoring (5k errors/month, 10k transactions/month)
- **Grafana Cloud (Loki)**: Log aggregation (50GB logs/month, 7-14 day retention)
- **PostHog**: Product analytics (1M events/month)

All services have generous free tiers that support <100 beta users and can scale to 1000+ users in production.

**⚠️ 2025 Update:** Grafana Loki 3.x introduces major new features including structured metadata, native OpenTelemetry support, and pattern-based queries. See "Loki 3.x Features" section below.

---

## 1. Sentry Setup

### Create Sentry Account
1. Go to https://sentry.io/signup/
2. Create a new account (free tier)
3. Create a new project:
   - Platform: **React Native**
   - Project name: `courtster-mobile`

### Get DSN
1. After project creation, copy the **DSN** from the setup screen
2. It looks like: `https://abc123@o123456.ingest.sentry.io/123456`

### Add to .env
```bash
EXPO_PUBLIC_SENTRY_DSN=https://your_dsn_here@o123456.ingest.sentry.io/123456
```

### Test Sentry
```typescript
import { Logger } from './utils/logger';

// This will appear in Sentry dashboard
Logger.error('Test error', new Error('This is a test'));
```

---

## 2. Grafana Cloud (Loki) Setup

### Create Grafana Cloud Account
1. Go to https://grafana.com/auth/sign-up/create-user
2. Sign up for free tier
3. Create a new stack (choose closest region to users)

**2025 Free Tier Limits:**
- ✅ **50GB logs/month** (unchanged)
- ✅ **7-14 day retention** (documentation says 14 days, effective retention may be 7 days)
- ⚠️ **Query limit: 100x ingested volume** - You can query up to 100x your monthly log volume
- ⚠️ **Exceeding query limits may result in unexpected billing** - Monitor your usage!
- ✅ **Unlimited users** on free tier
- ✅ **10k metrics, 50GB traces** also included

**Pro Tier ($19/month):**
- 10k metrics, 50GB logs, 50GB traces
- **13-month metric retention** (vs 30 days for logs/traces)
- **30-day retention** for logs, traces, profiles
- Ready for scaling beyond beta

### Setup Loki
1. In Grafana Cloud dashboard, go to **"Loki" → "Send logs"**
2. Copy your Loki endpoint:
   - Format: `https://logs-prod-us-central1.grafana.net/loki/api/v1/push`

3. **Get your credentials (2025 - Service Account Tokens):**

   ⚠️ **IMPORTANT:** API Keys are fully deprecated as of January 2025. Use **Service Account Tokens** instead.

   **Create a Service Account:**
   1. Go to **"Administration" → "Service Accounts"** (in left sidebar)
   2. Click **"Add service account"**
   3. Fill in details:
      - **Display name**: `courtster-mobile-loki`
      - **Role**: `Editor` (or create custom role with only Loki write permissions)
   4. Click **"Create"**

   **Generate Token:**
   1. After creating service account, click **"Add service account token"**
   2. Token name: `mobile-app-logs`
   3. Expiration: Choose based on security needs (recommend 90 days for production, never expire for dev)
   4. Click **"Generate token"**
   5. **Copy the token immediately** - you won't see it again!
      - Format: `glsa_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx_xxxxxxxx`

   **Authentication Method:**
   - Service Account Tokens use `Bearer` authentication (not Basic auth)
   - Header format: `Authorization: Bearer glsa_xxxxx...`

   **Note:** If you have existing API keys, they were automatically migrated to service accounts in January 2025 and will continue to work.

**📝 2025 Note on Loki 3.x:**
- Loki 3.0+ adds native **OpenTelemetry (OTLP) support** - alternative to HTTP push
- **Promtail is deprecated** (LTS until Feb 28, 2026) - use Grafana Alloy for self-hosted
- For React Native, continue using direct HTTP push (no official React Native SDK)

### Add to .env
```bash
EXPO_PUBLIC_LOKI_PUSH_URL=https://logs-prod-us-central1.grafana.net/loki/api/v1/push
EXPO_PUBLIC_LOKI_SERVICE_ACCOUNT_TOKEN=glsa_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx_xxxxxxxx
```

**🔒 Security Reminders (2025):**
- Never commit `.env` to git
- Store service account tokens securely (use environment variables in CI/CD)
- **Rotate tokens regularly** (90-day expiration recommended)
- Use separate service accounts for dev/staging/production
- If token is exposed, immediately revoke it in Grafana Cloud dashboard
- Limit token scope to minimum required permissions (principle of least privilege)

### Create Loki Dashboard
1. In Grafana, go to **"Dashboards" → "New Dashboard"**
2. Add panel with LogQL query:
   ```logql
   {app="courtster-mobile"} | json
   ```
3. Save dashboard as "Courtster Mobile Logs"

### Example Dashboards (Updated 2025 LogQL)

**Basic Queries:**
```logql
# Error rate by hour
sum by (level) (rate({app="courtster-mobile"} | json | level="error" [1h]))

# Logs by screen
{app="courtster-mobile"} | json | screen != ""

# User actions
{app="courtster-mobile"} | json | action != ""
```

**Modern Pattern-Based Queries (Loki 3.x):**
```logql
# Find errors with pattern matching (faster than regex)
{app="courtster-mobile"} |> `<_> level=error <_> action=<action> <_>`

# User session tracking
{app="courtster-mobile"} |> `<_> sessionId=<session> userId=<user> <_>`

# Performance monitoring
{app="courtster-mobile"} |> `<_> timingName=<operation> durationMs=<duration> <_>`
```

**Mobile-Specific Dashboard Panels:**
```logql
# 1. Error Rate by Screen
sum by (screen) (count_over_time({app="courtster-mobile"} | json | level="error" [5m]))

# 2. Top User Actions (last hour)
topk(10, sum by (action) (count_over_time({app="courtster-mobile"} | json | action != "" [1h])))

# 3. Performance Heatmap
sum by (timingName) (avg_over_time({app="courtster-mobile"} | json | durationMs != "" | unwrap durationMs [5m]))

# 4. Device/OS Breakdown
sum by (platform, osVersion) (count_over_time({app="courtster-mobile"} | json | platform != "" [1h]))

# 5. Network API Failures
sum by (endpoint) (count_over_time({app="courtster-mobile"} | json | action =~ ".*_failed" [15m]))

# 6. User Activity Timeline (specific user)
{app="courtster-mobile"} | json | userId="abc123" | line_format "{{.timestamp}} - {{.action}} - {{.screen}}"
```

---

## 2a. Loki 3.x Features for Mobile Apps (2025)

### What's New in Loki 3.0+

Loki 3.x (released 2024-2025) introduces several major features beneficial for mobile app logging:

#### 1. **Structured Metadata** (Critical for Mobile)

Attach metadata to logs WITHOUT indexing it - perfect for high-cardinality data like user IDs, device IDs, session IDs.

**Why It Matters:**
- Traditional labels (like `{userId="123"}`) create index entries - expensive at scale
- Structured metadata is **not indexed** but still queryable
- Perfect for mobile apps with thousands/millions of users

**How to Use:**
```typescript
// In your loki-client.ts - add structured metadata support
interface LokiStream {
  stream: Record<string, string>;  // Indexed labels
  values: Array<[string, string, Record<string, string>?]>;  // [timestamp, log, metadata]
}

// Example log entry with structured metadata
{
  stream: {
    app: "courtster-mobile",
    environment: "production",
    platform: "ios"  // Low-cardinality labels
  },
  values: [
    [
      "1640000000000000000",  // Timestamp
      '{"level":"error","message":"API failed","endpoint":"/sessions"}',  // Log line
      {
        userId: "user123",      // High-cardinality metadata
        deviceId: "device456",
        sessionId: "session789",
        traceId: "trace-abc"    // For distributed tracing
      }
    ]
  ]
}
```

**Query Structured Metadata:**
```logql
# Find logs for specific user (fast, not indexed)
{app="courtster-mobile"} | userId="user123"

# Combine with pattern matching
{app="courtster-mobile"} | userId="user123" |> `<_> level=error <_>`
```

#### 2. **Native OpenTelemetry Support**

Loki 3.0+ has built-in OTLP (OpenTelemetry Protocol) endpoint.

**Benefits:**
- Single instrumentation for logs, traces, metrics
- Industry standard protocol
- Future-proof your stack
- Better integration with distributed tracing

**Migration Path:**
```typescript
// Current Approach (HTTP Push)
POST /loki/api/v1/push
Headers: {
  'Authorization': 'Bearer glsa_xxxxx...',  // 2025: Service Account Token
  'Content-Type': 'application/json'
}

// OpenTelemetry Approach (OTLP)
POST /otlp/v1/logs

// React Native OpenTelemetry SDK
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';

const logExporter = new OTLPLogExporter({
  url: 'https://your-stack.grafana.net/otlp/v1/logs',
  headers: {
    // 2025: Use Bearer token with service account
    'Authorization': `Bearer ${process.env.EXPO_PUBLIC_LOKI_SERVICE_ACCOUNT_TOKEN}`,
  },
});
```

**Recommendation:** Stick with HTTP push for now (simpler), but consider OpenTelemetry for long-term scalability.

#### 3. **Bloom Filters** (Query Performance)

Bloom filters can eliminate 70-90% of data chunks for "needle in haystack" searches.

**What It Does:**
- Pre-filters data before scanning
- Dramatically speeds up queries for specific users/sessions
- Especially helpful for structured metadata queries

**Automatically Enabled** in Grafana Cloud - no configuration needed.

**Performance Gain:**
```logql
# Without bloom filters: Scans all data
{app="courtster-mobile"} | userId="user123"
# Time: ~5 seconds

# With bloom filters: Scans only relevant chunks
{app="courtster-mobile"} | userId="user123"
# Time: ~500ms (10x faster!)
```

#### 4. **Pattern-Based Queries** (Easier than Regex)

New `|>` operator for intuitive pattern matching.

**Old Way (Regex - Complex):**
```logql
{app="courtster-mobile"} |~ ".*caller=http.go.*level=debug.*msg=\"POST.*"
```

**New Way (Pattern - Simple):**
```logql
{app="courtster-mobile"} |> `<_> caller=http.go:194 level=debug <_> msg="POST /push <_>`
```

**Wildcards:**
- `<_>` - Match any text
- `<variable>` - Capture into variable for grouping

**Benefits:**
- More readable
- Better performance
- Easier to maintain

### Implementing Loki 3.x Features

#### ⚠️ IMPORTANT: Update Authentication to Service Account Token

**Your existing `loki-client.ts` needs to be updated for 2025:**

```typescript
// OLD (Deprecated - Basic Auth with API Key)
headers: {
  'Authorization': `Basic ${btoa(`${this.username}:${this.apiKey}`)}`,
  'Content-Type': 'application/json',
}

// NEW (2025 - Bearer Token with Service Account)
headers: {
  'Authorization': `Bearer ${this.serviceAccountToken}`,
  'Content-Type': 'application/json',
}
```

**Update your LokiClient constructor:**
```typescript
// In services/loki-client.ts
interface LokiClientConfig {
  pushUrl: string;
  serviceAccountToken: string;  // Changed from username + apiKey
}

constructor(config: LokiClientConfig) {
  this.pushUrl = config.pushUrl;
  this.serviceAccountToken = config.serviceAccountToken;
}

// Update the fetch call
const response = await fetch(this.pushUrl, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${this.serviceAccountToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ streams }),
});
```

**Update initialization in your app:**
```typescript
// OLD
const lokiClient = new LokiClient({
  pushUrl: process.env.EXPO_PUBLIC_LOKI_PUSH_URL!,
  username: process.env.EXPO_PUBLIC_LOKI_USER_ID!,
  apiKey: process.env.EXPO_PUBLIC_LOKI_API_KEY!,
});

// NEW (2025)
const lokiClient = new LokiClient({
  pushUrl: process.env.EXPO_PUBLIC_LOKI_PUSH_URL!,
  serviceAccountToken: process.env.EXPO_PUBLIC_LOKI_SERVICE_ACCOUNT_TOKEN!,
});
```

#### Option A: Keep Current Implementation + Add Structured Metadata (Recommended)

Your current `loki-client.ts` using HTTP push works great. After updating authentication, add structured metadata:

```typescript
// Small change to formatForLoki method
values: logs.map((log) => {
  const timestampNs = String((log.timestamp || Date.now()) * 1000000);
  const logLine = JSON.stringify({
    level: log.level,
    message: log.message,
    ...log.context,
  });

  // Add structured metadata for user/device tracking
  const metadata = {
    ...(log.context?.userId && { userId: String(log.context.userId) }),
    ...(log.context?.deviceId && { deviceId: String(log.context.deviceId) }),
    ...(log.context?.sessionId && { sessionId: String(log.context.sessionId) }),
  };

  return Object.keys(metadata).length > 0
    ? [timestampNs, logLine, metadata]  // With metadata
    : [timestampNs, logLine];            // Without metadata
}),
```

#### Option B: Migrate to OpenTelemetry (Future-Proof)

For long-term scalability, consider OpenTelemetry:

**Pros:**
- Industry standard
- Single SDK for logs + traces + metrics
- Better vendor-neutral approach
- Native Loki 3.x support

**Cons:**
- More complex setup
- Larger bundle size
- Additional dependencies

**When to Migrate:**
- When you need distributed tracing
- When scaling beyond 1000 users
- When adding more observability tools

### Loki 3.x Best Practices for Mobile

1. **Use Structured Metadata for High-Cardinality Data:**
   - ✅ User IDs, device IDs, session IDs
   - ❌ Don't create labels for these (expensive!)

2. **Use Labels for Low-Cardinality Data:**
   - ✅ app, environment, platform, level
   - ❌ Limit to <10 unique label combinations

3. **Leverage Pattern Queries:**
   - Easier to write and maintain
   - Better performance than regex

4. **Monitor Query Limits:**
   - Free tier: 100x ingested volume
   - Track usage in Grafana Cloud dashboard
   - Set up alerts for approaching limits

5. **Optimize Log Volume:**
   - Sample high-frequency logs in production
   - Use appropriate log levels
   - Batch logs efficiently (you're already doing this!)

---

## 3. PostHog Setup

### Create PostHog Account
1. Go to https://app.posthog.com/signup
2. Sign up for free tier (cloud or self-hosted)
3. Create a new project: `Courtster Mobile`

### Get API Key
1. Go to **"Settings" → "Project" → "Project API Key"**
2. Copy the API key (starts with `phc_`)

### Add to .env
```bash
EXPO_PUBLIC_POSTHOG_API_KEY=phc_your_api_key_here
```

### Install PostHog (Week 3)
```bash
yarn add posthog-react-native expo-file-system expo-application expo-device expo-localization
```

### Initialize PostHog (in app/_layout.tsx)
```typescript
import PostHog from 'posthog-react-native';
import { setPostHog } from '../utils/logger';

const posthog = new PostHog(
  process.env.EXPO_PUBLIC_POSTHOG_API_KEY || '',
  {
    host: 'https://app.posthog.com',
    captureApplicationLifecycleEvents: true,
  }
);

// Make PostHog available to Logger
setPostHog(posthog);
```

---

## 4. Verification Checklist

After setting up all services:

### ✅ Sentry
- [ ] Account created
- [ ] DSN added to .env
- [ ] Test error appears in Sentry dashboard
- [ ] Email alerts configured

### ✅ Grafana Loki
- [ ] Grafana Cloud account created
- [ ] Loki credentials added to .env
- [ ] Test log appears in Grafana Explore
- [ ] Dashboard created

### ✅ PostHog (Week 3)
- [ ] Account created
- [ ] API key added to .env
- [ ] Package installed
- [ ] Test event appears in PostHog

---

## 5. Usage Examples

### Error Logging
```typescript
import { Logger } from '../utils/logger';

try {
  await supabase.from('sessions').insert(data);
} catch (error) {
  Logger.error('Failed to create session', error as Error, {
    userId: user.id,
    action: 'create_session',
    metadata: { playerCount: 8, sport: 'padel' },
  });
}
```

### Info Logging
```typescript
Logger.info('Session created successfully', {
  userId: user.id,
  sessionId: newSession.id,
  action: 'create_session',
  screen: 'CreateSession',
});
```

### Performance Tracking
```typescript
const startTime = Date.now();
const result = await complexOperation();
const duration = Date.now() - startTime;

Logger.timing('complex_operation', duration, {
  userId: user.id,
  metadata: { resultCount: result.length },
});
```

### User Context
```typescript
// On login
Logger.setUser(user.id, user.email, {
  tier: subscriptionTier,
  createdAt: user.created_at,
});

// On logout
Logger.clearUser();
```

---

## 6. Monitoring Costs (Production)

### Free Tier Limits
| Service | Free Tier | Beta (<100 users) | Production (~1000 users) | Status |
|---------|-----------|-------------------|--------------------------|--------|
| Sentry | 5k errors/month | ~50 errors/month | ~500 errors/month | ✅ Safe |
| Loki | 50GB logs/month | ~500MB/month | ~5GB/month | ✅ Safe |
| PostHog | 1M events/month | ~30k events/month | ~300k events/month | ✅ Safe |

### Staying Under Free Tier

**Sentry**:
- Use `tracesSampleRate: 0.01` (1% sampling) in production
- Filter noise (expected errors, health checks)
- Use `beforeSend` to filter PII

**Loki**:
- Only send logs in production (`!__DEV__`)
- Batch logs every 5 seconds (implemented)
- Limit queue size to 100 logs (implemented)

**PostHog**:
- Sample events at 100% for beta (<100 users)
- Consider 50% sampling at 500+ users
- Use feature flags to control tracking

---

## 7. Alerts & Notifications

### Sentry Alerts
1. Go to **"Alerts" → "Create Alert"**
2. Recommended alerts:
   - Error spike (>10 errors in 5 minutes)
   - New error type detected
   - Performance degradation (>2s response time)

### Grafana Alerts
1. Create alert rule in Grafana:
   ```logql
   sum(rate({app="courtster-mobile"} | json | level="error" [5m])) > 5
   ```
2. Send to Slack/Email

### PostHog Alerts
1. Create insight for critical metrics
2. Set up anomaly detection
3. Slack/Email notifications

---

## 8. Dashboard Links

After setup, bookmark these:
- **Sentry**: https://sentry.io/organizations/YOUR_ORG/projects/courtster-mobile/
- **Grafana**: https://YOUR_STACK.grafana.net/
- **PostHog**: https://app.posthog.com/project/YOUR_PROJECT_ID/

---

## Questions?

See the main beta release plan or contact the team.
