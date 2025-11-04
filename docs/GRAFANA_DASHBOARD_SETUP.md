# Grafana Dashboard Setup Guide

## Overview
This guide will help you import the pre-built Courtster Mobile dashboard into your Grafana Cloud instance.

## Dashboard Features

The dashboard includes:

### 📊 Visualizations
1. **Log Levels Distribution** - Pie chart showing error/warn/info breakdown
2. **Log Rate by Level** - Time series of log volume by severity
3. **Error Count** - Gauge showing total errors
4. **Total Logs** - Counter of all logs received
5. **Top 10 Actions** - Most frequent user actions
6. **All Logs** - Full log stream
7. **Error Logs Only** - Filtered error view
8. **Warning Logs** - Filtered warning view
9. **Top Screens** - Most active app screens
10. **Performance Timing** - Response time metrics

### 🔍 Filters
- **Environment** - Switch between development/production
- **Time Range** - Last 1h, 6h, 24h, 7d, etc.

---

## Import Instructions

### Step 1: Access Grafana Cloud
1. Go to: https://grafana.com/
2. Login to your account
3. Navigate to your Grafana instance

### Step 2: Import Dashboard

**Method A: Direct JSON Import**
1. Click the **"+"** icon in the left sidebar
2. Select **"Import"**
3. Click **"Upload JSON file"**
4. Select: `docs/grafana-dashboard.json`
5. Click **"Load"**

**Method B: Copy-Paste**
1. Click the **"+"** icon in the left sidebar
2. Select **"Import"**
3. Copy the contents of `docs/grafana-dashboard.json`
4. Paste into the "Import via panel json" text area
5. Click **"Load"**

### Step 3: Configure Data Source
1. In the import screen, you'll see a **"DS_LOKI"** dropdown
2. Select your Loki data source (usually named "Loki" or "grafanacloud-logs")
3. Click **"Import"**

### Step 4: Verify Dashboard
1. Dashboard should load with all panels
2. Set time range to "Last 15 minutes"
3. You should see data if logs are being sent

---

## Dashboard Panels Explained

### 1. Log Levels Distribution (Pie Chart)
**Query:**
```logql
sum by (level) (count_over_time({app="courtster-mobile"} | json [$__interval]))
```
**Shows:** Percentage of error vs warn vs info logs

### 2. Log Rate by Level (Time Series)
**Query:**
```logql
sum by (level) (rate({app="courtster-mobile"} | json [$__interval]))
```
**Shows:** Real-time log volume trends

### 3. Error Count (Gauge)
**Query:**
```logql
sum(count_over_time({app="courtster-mobile"} | json | level="error" [$__interval]))
```
**Shows:** Total errors in time range
**Thresholds:**
- Green: 0-9 errors
- Yellow: 10-49 errors
- Red: 50+ errors

### 4. Total Logs (Stat)
**Query:**
```logql
sum(count_over_time({app="courtster-mobile"} | json [$__interval]))
```
**Shows:** Total number of logs

### 5. Top 10 Actions (Bar Chart)
**Query:**
```logql
topk(10, sum by (action) (count_over_time({app="courtster-mobile"} | json | action != "" [$__interval])))
```
**Shows:** Most frequent user actions (login, create_session, etc.)

### 6. All Logs (Log Panel)
**Query:**
```logql
{app="courtster-mobile"} | json
```
**Shows:** Full log stream with all details

### 7. Error Logs Only (Log Panel)
**Query:**
```logql
{app="courtster-mobile"} | json | level="error"
```
**Shows:** Only error-level logs for debugging

### 8. Warning Logs (Log Panel)
**Query:**
```logql
{app="courtster-mobile"} | json | level="warn"
```
**Shows:** Warning-level logs

### 9. Top Screens (Pie Chart)
**Query:**
```logql
topk(10, sum by (screen) (count_over_time({app="courtster-mobile"} | json | screen != "" [$__interval])))
```
**Shows:** Which screens generate most logs (helps identify hot paths)

### 10. Performance Timing (Time Series)
**Query:**
```logql
avg by (timingName) (avg_over_time({app="courtster-mobile"} | json | timingName != "" | unwrap durationMs [$__interval]))
```
**Shows:** Average response times for tracked operations
**Tracks:** API calls, screen loads, algorithm execution

---

## Customization Tips

### Add Alerts
1. Click on any panel
2. Select **"Edit"**
3. Go to **"Alert"** tab
4. Create alert rule (e.g., "Alert when errors > 50")

### Modify Time Range
1. Click time picker (top right)
2. Select preset or custom range
3. Or set in URL: `&from=now-6h&to=now`

### Add Variables
1. Dashboard settings (gear icon)
2. **Variables** > **"Add variable"**
3. Example: Add `userId` filter
   ```logql
   label_values({app="courtster-mobile"}, userId)
   ```

### Share Dashboard
1. Click **"Share"** icon (top right)
2. Options:
   - **Link** - Share URL
   - **Snapshot** - Static view
   - **Export** - Download JSON

---

## Common Queries

### Find specific user's logs
```logql
{app="courtster-mobile"} | userId="user_123"
```

### Find logs from specific session
```logql
{app="courtster-mobile"} | sessionId="session_abc"
```

### Search for text in messages
```logql
{app="courtster-mobile"} |= "login failed"
```

### Count errors by error type
```logql
sum by (errorType) (count_over_time({app="courtster-mobile"} | json | level="error" [1h]))
```

### View slowest operations
```logql
topk(10, avg by (timingName) (avg_over_time({app="courtster-mobile"} | json | unwrap durationMs [1h])))
```

---

## Troubleshooting

### No Data Showing
1. **Check time range** - Set to "Last 15 minutes"
2. **Verify logs are being sent** - See [LOKI_TROUBLESHOOTING.md](./LOKI_TROUBLESHOOTING.md)
3. **Check data source** - Ensure Loki data source is connected
4. **Refresh dashboard** - Click refresh icon or press Ctrl+R

### "No data source found"
1. Go to **Configuration** > **Data Sources**
2. Click **"Add data source"**
3. Select **"Loki"**
4. Configure:
   - **URL:** `https://logs-prod-032.grafana.net/loki`
   - **Auth:** Add header
     - **Header:** `Authorization`
     - **Value:** `Bearer YOUR_SERVICE_ACCOUNT_TOKEN`
5. Click **"Save & Test"**

### Slow Queries
1. Reduce time range (e.g., last 1h instead of 7d)
2. Add more specific label filters
3. Use `|= "pattern"` for faster text search
4. Consider upgrading Grafana Cloud plan

---

## Auto-Refresh

Enable auto-refresh for live monitoring:
1. Click refresh dropdown (top right)
2. Select interval: 5s, 10s, 30s, 1m, etc.
3. Dashboard will auto-update

---

## Mobile-Friendly View

Access dashboard on mobile:
1. Grafana Cloud mobile app (iOS/Android)
2. Or use browser on mobile device
3. Panels automatically adjust for small screens

---

## Saving Changes

After customizing:
1. Click **"Save dashboard"** (top right)
2. Add description of changes
3. Click **"Save"**

**Note:** Original imported dashboard can be restored from JSON file.

---

## Example Screenshots

### What You Should See

**Healthy App:**
- Log Levels: Mostly blue (info), some yellow (warn), minimal red (error)
- Log Rate: Steady, no sudden spikes
- Error Count: Green (0-9)
- Top Actions: login, create_session, view_leaderboard

**Problematic App:**
- Log Levels: High percentage of red (error)
- Log Rate: Sudden spikes
- Error Count: Red (50+)
- Error Logs: Same error repeating

---

## Next Steps

1. **Set up alerts** - Get notified when errors spike
2. **Create custom panels** - Track app-specific metrics
3. **Export & version control** - Save dashboard JSON to git
4. **Share with team** - Send dashboard links to stakeholders

---

## Resources

- [Grafana Documentation](https://grafana.com/docs/)
- [LogQL Query Language](https://grafana.com/docs/loki/latest/logql/)
- [Dashboard Best Practices](https://grafana.com/docs/grafana/latest/best-practices/dashboard-best-practices/)
- [Loki Troubleshooting](./LOKI_TROUBLESHOOTING.md)
