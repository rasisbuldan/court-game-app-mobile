# Monitoring Stack Setup Guide

This guide shows how to configure the monitoring stack (Sentry + Grafana Loki + PostHog) for the Courtster mobile app.

## Overview

The app uses three free-tier monitoring services:
- **Sentry**: Error tracking & performance monitoring (5k errors/month, 10k transactions/month)
- **Grafana Cloud (Loki)**: Log aggregation (50GB logs/month, 14-day retention)
- **PostHog**: Product analytics (1M events/month)

All services have generous free tiers that support <100 beta users and can scale to 1000+ users in production.

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

### Setup Loki
1. In Grafana Cloud dashboard, go to **"Loki" → "Send logs"**
2. Copy your Loki endpoint:
   - Format: `https://logs-prod-us-central1.grafana.net/loki/api/v1/push`
3. Get your credentials:
   - User ID: Found in "Details & API Keys" (format: `123456`)
   - API Key: Create new API key with "MetricsPublisher" role

### Add to .env
```bash
EXPO_PUBLIC_LOKI_PUSH_URL=https://logs-prod-us-central1.grafana.net/loki/api/v1/push
EXPO_PUBLIC_LOKI_USER_ID=123456
EXPO_PUBLIC_LOKI_API_KEY=your_api_key_here
```

### Create Loki Dashboard
1. In Grafana, go to **"Dashboards" → "New Dashboard"**
2. Add panel with LogQL query:
   ```logql
   {app="courtster-mobile"} | json
   ```
3. Save dashboard as "Courtster Mobile Logs"

### Example Dashboards
```logql
# Error rate by hour
sum by (level) (rate({app="courtster-mobile"} | json | level="error" [1h]))

# Logs by screen
{app="courtster-mobile"} | json | screen != ""

# User actions
{app="courtster-mobile"} | json | action != ""
```

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
