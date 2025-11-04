# Grafana Cloud Loki Setup - Complete Guide

## What You Need

Based on the official Grafana Cloud documentation, you need:

1. **Loki Tenant ID** - Your unique tenant identifier
2. **Cloud Access Policy Token** - Token with `logs:write` permission
3. **Loki Push URL** - Your Grafana Cloud Loki endpoint

## Step-by-Step Setup

### Step 1: Find Your Loki Tenant ID

#### Method 1: From Loki Data Source (Easiest)
1. Go to: https://grafana.com/
2. Login to your Grafana Cloud account
3. Navigate to: **Connections** → **Data Sources**
4. Click on **Loki** (or **grafanacloud-<your-stack>-logs**)
5. Look for the **"User"** field in the settings
   - This is your **Loki Tenant ID**
   - It's usually a **6-digit number** like `123456`

#### Method 2: From Grafana Cloud Portal
1. Go to: https://grafana.com/orgs/[your-org]
2. Click on your **Stack**
3. Go to **Details** or **Configuration**
4. Look for:
   - **Loki User ID**
   - **Hosted Logs ID**
   - **Tenant ID**

#### Method 3: From the Loki URL
Sometimes the tenant ID is embedded in the Loki URL shown in the data source:
```
https://logs-prod-032.grafana.net/loki/api/v1/push
```

If you see a URL like:
```
https://123456:password@logs-prod-032.grafana.net/loki
```

The `123456` is your tenant ID.

---

### Step 2: Create Cloud Access Policy Token

**Important:** You need a **Cloud Access Policy Token**, NOT a Service Account Token!

1. Go to: https://grafana.com/
2. Navigate to: **Security** → **Access Policies** (or **Administration** → **Cloud Access Policies**)
3. Click **"Create access policy"**
4. Configure the policy:
   - **Name:** `courtster-mobile-loki-write`
   - **Display Name:** `Mobile App Loki Logs`
   - **Scopes:** Select **"Logs"** → Check **"Write"**

5. Click **"Create"**
6. Now create a token for this policy:
   - Click on the policy you just created
   - Click **"Add token"**
   - **Token name:** `mobile-app-token`
   - **Expiration:** Choose expiration (or "Never" for testing)
   - Click **"Create"**
7. **IMPORTANT:** Copy the token immediately!
   - It starts with `glc_` (Cloud token) or `glsa_` (Service Account)
   - You won't be able to see it again
   - Save it securely

---

### Step 3: Update Your `.env` File

Add these three variables to your `.env` file:

```bash
# Grafana Cloud Loki Configuration
EXPO_PUBLIC_LOKI_PUSH_URL=https://logs-prod-032.grafana.net/loki/api/v1/push
EXPO_PUBLIC_LOKI_TENANT_ID=123456  # Replace with your tenant ID
EXPO_PUBLIC_LOKI_SERVICE_ACCOUNT_TOKEN=glc_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx  # Replace with your token
```

**Replace:**
- `123456` with your actual Loki Tenant ID from Step 1
- `glc_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx` with your actual Cloud Access Policy Token from Step 2

---

### Step 4: Verify Configuration with curl

Test your credentials before running the app:

```bash
# Replace these with your actual values
TENANT_ID="123456"
TOKEN="glc_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
URL="https://logs-prod-032.grafana.net/loki/api/v1/push"

# Test the connection
curl -v -u "$TENANT_ID:$TOKEN" \
  -X POST "$URL" \
  -H "Content-Type: application/json" \
  -d '{
    "streams": [{
      "stream": {"app": "test"},
      "values": [["'$(date +%s)000000000'", "{\"message\":\"test\"}"]]
    }]
  }'
```

**Expected Result:**
```
< HTTP/1.1 204 No Content
```

**If you get 401 Unauthorized:**
- Check your tenant ID is correct
- Ensure your token has `logs:write` scope
- Try regenerating the token

---

### Step 5: Restart Your App

```bash
npx expo start --clear
```

Trigger a log in your app and check Metro console for:
```
[LokiClient] ✅ Logs sent successfully!
```

---

## Troubleshooting

### Error: 401 Unauthorized

**Possible causes:**
1. ❌ Wrong tenant ID
2. ❌ Token doesn't have `logs:write` permission
3. ❌ Token expired
4. ❌ Using Service Account token instead of Cloud Access Policy token

**Solution:**
- Double-check tenant ID from Loki data source
- Create new Cloud Access Policy with `logs:write` scope
- Generate fresh token

### Error: "legacy auth cannot be upgraded"

This means you're using the wrong authentication method.

**Solution:**
- Ensure you're using **Cloud Access Policy Token** (starts with `glc_`)
- NOT Service Account Token (starts with `glsa_`)

### Error: "host is not found"

This means the endpoint URL is incorrect.

**Solution:**
- Copy the exact URL from your Loki data source settings
- Should be: `https://logs-prod-XXX.grafana.net/loki/api/v1/push`
- Replace `XXX` with your region (e.g., `032`, `us-central1`)

### No logs appearing in Grafana

1. **Check Loki is enabled in development:**
   - Verify `EXPO_PUBLIC_ENABLE_LOKI=true` in `.env`
   - Check `loki-client.ts` has development mode enabled (line 64)

2. **Check logs are being queued:**
   - Look for `[LokiClient] 📝 Log queued` in Metro console
   - If not appearing, Loki is disabled

3. **Check logs are being sent:**
   - Look for `[LokiClient] 🚀 Sending logs to Loki` in Metro console
   - Should appear every 5 seconds when logs are queued

4. **Check for errors:**
   - Look for `[LokiClient] ❌ Failed to send logs` in Metro console
   - Check the error message for details

---

## Common Tenant ID Formats

Your tenant ID is usually one of these:

| Format | Example | Where to Find |
|--------|---------|---------------|
| 6-digit number | `123456` | Loki Data Source "User" field |
| 7-digit number | `1234567` | Same |
| Stack ID | `stack-123` | Stack details page |
| Org ID | `org-123456` | Organization settings |

**Most common:** 6-7 digit number

---

## Finding Your Loki URL

Your Loki Push URL depends on your Grafana Cloud region:

**US Regions:**
- `https://logs-prod-032.grafana.net/loki/api/v1/push` (US East)
- `https://logs-prod-us-central1.grafana.net/loki/api/v1/push` (US Central)

**EU Regions:**
- `https://logs-prod-eu-west-0.grafana.net/loki/api/v1/push` (EU West)

**Check yours in:** Connections → Data Sources → Loki → URL field

---

## Next Steps

Once you have:
- ✅ Loki Tenant ID
- ✅ Cloud Access Policy Token
- ✅ Loki Push URL

Update your `.env` file and restart the app. You should see logs flowing to Grafana Cloud!

---

## Need Help?

If you're still stuck, share:
1. Your Grafana Cloud plan (free/paid)
2. Your Grafana Cloud region (US/EU)
3. The exact error message from curl test
4. Screenshot of your Loki data source settings (hide sensitive info)

I'll help you debug!
