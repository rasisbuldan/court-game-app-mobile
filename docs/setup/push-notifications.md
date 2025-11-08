# Push Notifications Setup Guide - Courtster Mobile (2025)

Complete guide to set up push notifications for iOS and Android using Expo Notifications.

> **Last Updated:** November 2025
> **Expo SDK:** 54
> **Package:** expo-notifications v0.32.12
> **Backend:** Supabase + Expo Push Service

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [What's Already Implemented](#whats-already-implemented)
4. [Step 1: Configure Expo Project ID](#step-1-configure-expo-project-id)
5. [Step 2: iOS Setup (Apple Push Notification Service)](#step-2-ios-setup-apple-push-notification-service)
6. [Step 3: Android Setup (Firebase Cloud Messaging)](#step-3-android-setup-firebase-cloud-messaging)
7. [Step 4: Supabase Database Setup](#step-4-supabase-database-setup)
8. [Step 5: Testing Notifications](#step-5-testing-notifications)
9. [Notification Types](#notification-types)
10. [Troubleshooting](#troubleshooting)
11. [Best Practices](#best-practices)

---

## Overview

**What Courtster Uses Push Notifications For:**
- 🎾 **Session Invites** - Invite players to join tournaments
- 🏆 **Round Complete** - Notify when a round finishes
- 👥 **Club Invites** - Invite users to join clubs
- 📢 **Club Announcements** - Broadcast to club members
- ⏰ **Match Reminders** - Remind players of upcoming matches
- 📊 **Leaderboard Updates** - Notify of ranking changes
- 🚀 **Session Starting** - Alert when tournament is about to begin

**Architecture:**
```
Mobile App → Expo Push Service → APNs (iOS) / FCM (Android) → User Device
                                       ↓
                              Supabase (token storage)
```

---

## Prerequisites

### Required Accounts
1. ✅ **Expo Account** - https://expo.dev/signup (free)
2. ✅ **Apple Developer Account** - $99/year (for iOS)
3. ✅ **Google Cloud Console** - Free (for Android FCM)
4. ✅ **Supabase Project** - With push_tokens table

### Required Access
- Admin access to Apple Developer Console
- Owner/Editor access to Google Cloud Console
- Database admin access to Supabase

### Important: Physical Device Required

> **⚠️ Critical:** Push notifications **DO NOT work on simulators/emulators**. You MUST test on real devices.

---

## What's Already Implemented

The Courtster Mobile app has a complete push notification infrastructure:

### ✅ Service Layer (`services/notifications.ts`)
- Permission request handling
- Push token registration
- Android notification channels (urgent, default, updates)
- Local notification scheduling
- Supabase token storage with retry logic
- Token cleanup on logout

### ✅ Notification Types
```typescript
enum NotificationType {
  SESSION_INVITE = 'session_invite',
  SESSION_STARTING = 'session_starting',
  ROUND_COMPLETE = 'round_complete',
  CLUB_INVITE = 'club_invite',
  CLUB_ANNOUNCEMENT = 'club_announcement',
  MATCH_REMINDER = 'match_reminder',
  LEADERBOARD_UPDATE = 'leaderboard_update',
}
```

### ✅ Android Channels
- **Urgent** - High priority (invites, starting soon)
- **Default** - Normal priority (general notifications)
- **Updates** - Low priority (leaderboard, round complete)

### 🚧 What You Need to Configure
- Expo Project ID (EAS)
- iOS APNs certificates/keys
- Android FCM credentials
- Supabase push_tokens table
- Backend notification sending logic

---

## Step 1: Configure Expo Project ID

### 1.1 Create EAS Project
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Initialize EAS project
cd packages/mobile
eas build:configure
```

### 1.2 Get Project ID
```bash
# This will show your project ID
eas project:info
```

You'll see output like:
```
Project ID: 12345678-abcd-1234-abcd-123456789abc
```

### 1.3 Add to app.json
```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "12345678-abcd-1234-abcd-123456789abc"
      }
    }
  }
}
```

> **⚠️ Important:** The placeholder ID `00000000-0000-0000-0000-000000000000` will disable push notifications. Replace it with your real project ID.

---

## Step 2: iOS Setup (Apple Push Notification Service)

### 2.1 Generate APNs Key (Recommended Method)

1. Go to https://developer.apple.com/account/resources/authkeys/list
2. Click **"+"** to create a new key
3. **Name:** `Courtster Push Notifications`
4. **Enable:** ✅ Apple Push Notifications service (APNs)
5. Click **"Continue"** → **"Register"**
6. **Download the .p8 key file** (you can only download once!)
7. Note the **Key ID** (10 characters, e.g., `ABC1234DEF`)
8. Note your **Team ID** (Apple Developer Account → Membership)

### 2.2 Upload APNs Key to Expo

```bash
# Upload APNs key to Expo
eas credentials

# Select: iOS → Production → Push Notifications
# Choose: Upload a new key
# Provide:
#   - Path to .p8 file
#   - Key ID
#   - Team ID
```

### 2.3 Update app.json for iOS

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.courtster.mobile",
      "supportsTabletOnly": false,
      "infoPlist": {
        "UIBackgroundModes": ["remote-notification"]
      }
    },
    "notification": {
      "icon": "./assets/notification-icon.png",
      "color": "#3B82F6",
      "iosDisplayInForeground": true
    }
  }
}
```

### 2.4 Enable Push Notifications Capability

In Xcode (if building locally):
1. Open project in Xcode
2. Select target → **Signing & Capabilities**
3. Click **"+ Capability"**
4. Add **"Push Notifications"**

---

## Step 3: Android Setup (Firebase Cloud Messaging)

### 3.1 Create Firebase Project

1. Go to https://console.firebase.google.com/
2. Click **"Add project"**
3. **Project name:** `Courtster` (or your app name)
4. **Disable Google Analytics** (optional)
5. Click **"Create project"**

### 3.2 Add Android App to Firebase

1. In Firebase Console, click **"Add app"** → **Android**
2. **Android package name:** `com.courtster.mobile` (from app.json)
3. **App nickname:** `Courtster Mobile`
4. Click **"Register app"**
5. **Download** `google-services.json`
6. **Place in:** `packages/mobile/google-services.json`

### 3.3 Get FCM Server Key

1. In Firebase Console: **Project Settings** → **Cloud Messaging** tab
2. Under **Cloud Messaging API (Legacy)**, click **"Manage API"**
3. Click **"Enable"** (if not already enabled)
4. Copy the **Server key**

### 3.4 Upload FCM Key to Expo

```bash
# Upload FCM credentials to Expo
eas credentials

# Select: Android → Production → Push Notifications
# Choose: Upload a new FCM key
# Provide:
#   - FCM Server Key (from Firebase)
```

### 3.5 Update app.json for Android

```json
{
  "expo": {
    "android": {
      "package": "com.courtster.mobile",
      "googleServicesFile": "./google-services.json",
      "permissions": [
        "NOTIFICATIONS",
        "VIBRATE"
      ]
    }
  }
}
```

---

## Step 4: Supabase Database Setup

### 4.1 Create push_tokens Table

Run this SQL in Supabase SQL Editor:

```sql
-- Create push_tokens table
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  device_info JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_token UNIQUE (user_id, token)
);

-- Create index for fast lookups
CREATE INDEX idx_push_tokens_user_id ON push_tokens(user_id);
CREATE INDEX idx_push_tokens_token ON push_tokens(token);

-- Enable Row Level Security
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage their own tokens
CREATE POLICY "Users can insert their own tokens"
  ON push_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own tokens"
  ON push_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own tokens"
  ON push_tokens FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tokens"
  ON push_tokens FOR DELETE
  USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_push_tokens_updated_at
  BEFORE UPDATE ON push_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 4.2 Verify Table Creation

```sql
-- Check if table exists and has correct structure
SELECT * FROM push_tokens LIMIT 1;
```

---

## Step 5: Testing Notifications

### 5.1 Test Permission Request

Run the app on a **real device**:

```bash
# iOS
npx expo run:ios --device

# Android
npx expo run:android --device
```

When you sign in, the app should:
1. Request notification permission
2. Get Expo push token
3. Save token to Supabase

### 5.2 Test Local Notification

Use Expo's test tool in your app:

```typescript
import { scheduleLocalNotification, NotificationType } from '../services/notifications';

// Test button handler
const testNotification = async () => {
  await scheduleLocalNotification(
    'Test Notification',
    'This is a test from Courtster!',
    { type: NotificationType.MATCH_REMINDER }
  );
};
```

### 5.3 Test Push Notification

Use Expo's Push Notification Tool:
1. Go to https://expo.dev/notifications
2. Enter your Expo push token (from app logs)
3. **Title:** `Test from Expo`
4. **Body:** `This is a test notification`
5. Click **"Send a Notification"**

### 5.4 Verify Token Storage

Check Supabase:
```sql
SELECT
  user_id,
  token,
  device_info,
  created_at
FROM push_tokens
ORDER BY created_at DESC;
```

---

## Notification Types

### Priority Levels

```typescript
// HIGH PRIORITY (urgent channel, sound + vibration)
- SESSION_INVITE
- CLUB_INVITE
- SESSION_STARTING

// DEFAULT PRIORITY (default channel, sound)
- MATCH_REMINDER
- CLUB_ANNOUNCEMENT

// LOW PRIORITY (updates channel, silent)
- LEADERBOARD_UPDATE
- ROUND_COMPLETE
```

### Notification Data Structure

```typescript
interface NotificationData {
  type: NotificationType;
  sessionId?: string;      // For session-related notifications
  clubId?: string;         // For club-related notifications
  roundNumber?: number;    // For round complete
  [key: string]: any;      // Additional custom data
}
```

### Example: Send Session Invite

```typescript
// This would be in your backend/Supabase function
import { Expo } from 'expo-server-sdk';

const expo = new Expo();

async function sendSessionInvite(userId: string, sessionId: string) {
  // Get user's push token from database
  const { data: tokens } = await supabase
    .from('push_tokens')
    .select('token')
    .eq('user_id', userId);

  if (!tokens || tokens.length === 0) return;

  const messages = tokens.map(({ token }) => ({
    to: token,
    sound: 'default',
    title: 'New Session Invite!',
    body: 'You\'ve been invited to join a tournament',
    data: {
      type: 'session_invite',
      sessionId: sessionId,
    },
    priority: 'high',
    channelId: 'urgent', // Android channel
  }));

  const chunks = expo.chunkPushNotifications(messages);

  for (const chunk of chunks) {
    try {
      const receipts = await expo.sendPushNotificationsAsync(chunk);
      console.log('Notifications sent:', receipts);
    } catch (error) {
      console.error('Error sending notifications:', error);
    }
  }
}
```

---

## Troubleshooting

### "Push notifications only work on physical devices"
**Cause:** Running on simulator/emulator
**Fix:** Test on a real iOS/Android device

### "Expo project ID not configured"
**Cause:** Missing or placeholder project ID in app.json
**Fix:**
1. Run `eas project:info` to get real project ID
2. Update `app.json` → `extra.eas.projectId`
3. Restart app with `npx expo start --clear`

### "Permission denied" (iOS)
**Cause:** User denied notification permission
**Fix:**
1. Go to iOS Settings → Courtster → Notifications
2. Enable "Allow Notifications"
3. Restart app

### "Permission denied" (Android)
**Cause:** User denied notification permission
**Fix:**
1. Long-press app icon → App info
2. Notifications → Enable
3. Restart app

### Notifications not received (iOS)
**Possible causes:**
- APNs key not uploaded to Expo
- Wrong Team ID or Key ID
- Bundle ID mismatch
- Device on Do Not Disturb

**Fix:**
1. Verify APNs credentials: `eas credentials`
2. Check bundle ID matches: `app.json` vs Apple Developer
3. Disable Do Not Disturb
4. Check notification settings in iOS Settings

### Notifications not received (Android)
**Possible causes:**
- FCM server key not uploaded
- google-services.json missing or wrong package name
- Battery optimization killing app
- Notification channel disabled

**Fix:**
1. Verify FCM key: `eas credentials`
2. Check `google-services.json` package name matches `app.json`
3. Disable battery optimization for app
4. Check notification channel settings

### "Invalid push token"
**Cause:** Token format incorrect or expired
**Fix:**
- Re-register for push notifications
- Check token starts with `ExponentPushToken[`
- Verify token saved correctly in Supabase

### Notifications work locally but not in production
**Possible causes:**
- Using development credentials in production build
- Wrong EAS profile selected

**Fix:**
```bash
# Ensure using production profile
eas build --platform ios --profile production
eas build --platform android --profile production

# Update credentials for production
eas credentials
```

---

## Best Practices

### 1. Request Permission at the Right Time
❌ **Don't:** Request on app launch
✅ **Do:** Request when user performs action that needs notifications

```typescript
// Good - Request when user creates first session
const createSession = async () => {
  // ... create session logic ...

  // Now request notifications to get updates
  const token = await registerForPushNotifications();
  if (token && user) {
    await savePushToken(user.id, token);
  }
};
```

### 2. Handle Permission Denial Gracefully
```typescript
const token = await registerForPushNotifications();

if (!token) {
  // Show helpful message, don't block app usage
  Toast.show({
    type: 'info',
    text1: 'Notifications Disabled',
    text2: 'Enable in settings to get session updates',
  });
  // Continue with app - don't force user
}
```

### 3. Clean Up Tokens on Logout
```typescript
// In your sign-out handler
const handleSignOut = async () => {
  if (pushToken && user) {
    await removePushToken(user.id, pushToken);
  }
  await signOut();
};
```

### 4. Use Appropriate Priority
- **HIGH:** Time-sensitive (invites, starting soon)
- **DEFAULT:** Important but not urgent (reminders)
- **LOW:** Informational (leaderboard updates)

### 5. Respect User Preferences
```typescript
// Check user's notification settings
const { notificationsEnabled } = useSettings();

if (notificationsEnabled) {
  await sendNotification(...);
}
```

### 6. Batch Notifications
Don't spam users - batch related updates:
```typescript
// ❌ Bad - Send 10 notifications for 10 rounds
rounds.forEach(round => sendNotification('Round complete', round));

// ✅ Good - Send one summary
sendNotification('Tournament Complete', `All ${rounds.length} rounds finished!`);
```

### 7. Test on Both Platforms
iOS and Android handle notifications differently:
- Test on real iOS device (not simulator)
- Test on real Android device (not emulator)
- Verify channels work correctly (Android)
- Check badge counts update (iOS)

### 8. Monitor Delivery
Track notification receipts in production:
```typescript
const expo = new Expo();
const receipts = await expo.sendPushNotificationsAsync(messages);

// Check for errors
receipts.forEach(receipt => {
  if (receipt.status === 'error') {
    console.error('Notification failed:', receipt.message);
    // Remove invalid tokens from database
  }
});
```

---

## iOS 18 & Android 15 Notes

### iOS 18 Updates
- **Live Activities** support available (future feature)
- **Focus Modes** now more granular - test with different focus states
- **Notification summaries** - ensure your notifications have clear titles
- **App Intents** can trigger from notifications (future feature)

### Android 15 Updates
- **Notification permission** now more prominent in setup flow
- **Better channel controls** for users
- **Predictive back gesture** works with notification taps
- **Per-app language settings** affect notification text

---

## Additional Resources

- **Expo Notifications Docs:** https://docs.expo.dev/versions/latest/sdk/notifications/
- **Expo Push Notification Tool:** https://expo.dev/notifications
- **APNs Documentation:** https://developer.apple.com/documentation/usernotifications
- **FCM Documentation:** https://firebase.google.com/docs/cloud-messaging
- **expo-server-sdk (for backend):** https://github.com/expo/expo-server-sdk-node

---

## Next Steps After Setup

1. ✅ Test notifications on physical devices (iOS & Android)
2. ✅ Implement backend notification sending (Supabase Edge Functions)
3. ✅ Set up notification analytics (track delivery, opens)
4. ✅ Add notification preferences in app settings
5. ✅ Test with different user scenarios (invites, announcements, etc.)
6. ✅ Monitor push token storage in Supabase
7. ✅ Set up notification delivery monitoring

---

**Last Updated:** November 2025 | **Next Review:** May 2026
