# Push Notifications Setup Guide

This guide covers how to set up and use push notifications in the Courtster mobile app for both iOS and Android.

## Overview

The app uses Expo's notification service for cross-platform push notifications with:
- **Expo Notifications** for sending notifications
- **Expo Device** for device detection
- **Supabase** for storing push tokens
- **Platform-specific channels** (Android) for notification categories

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Notification Flow                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. User grants permission                                   │
│  2. App registers for push notifications                     │
│  3. Expo returns push token                                  │
│  4. Token saved to Supabase push_tokens table               │
│  5. Server sends notification to Expo Push API              │
│  6. Expo delivers to device                                  │
│  7. App handles notification tap → navigation                │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Setup Steps

### 1. EAS Project Setup

First, you need an Expo account and EAS project:

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Initialize EAS in your project
cd packages/mobile
eas build:configure
```

### 2. Update app.json

Add your EAS project ID to `app.json`:

```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "YOUR_PROJECT_ID_HERE"
      }
    }
  }
}
```

Get your project ID from:
1. Run `eas project:info`
2. Or visit https://expo.dev/accounts/[your-account]/projects/courtster

### 3. iOS Setup (Apple Developer Account Required)

#### Push Notification Certificate

1. Go to [Apple Developer Portal](https://developer.apple.com/account)
2. Navigate to Certificates, Identifiers & Profiles
3. Create an App ID for `com.courtster.app`
4. Enable Push Notifications capability
5. Create an APNs Auth Key (or Certificate)
6. Download the .p8 key file

#### Add to EAS

```bash
eas credentials
# Select iOS > Push Notifications
# Upload your .p8 key file
```

### 4. Android Setup (Firebase Required)

#### Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. Add an Android app with package name: `com.courtster.app`
4. Download `google-services.json`
5. Place it in `packages/mobile/google-services.json`

#### Get FCM Server Key

1. In Firebase Console → Project Settings → Cloud Messaging
2. Copy the "Server key"
3. Add to EAS:

```bash
eas credentials
# Select Android > Push Notifications
# Paste your FCM server key
```

### 5. Database Migration

Run the database migration to create required tables:

```sql
-- Located in: packages/mobile/supabase/migrations/create_push_tokens_table.sql

-- Creates:
-- 1. push_tokens table (stores device tokens)
-- 2. notification_preferences table (user settings)
-- 3. RLS policies
-- 4. Auto-create preferences trigger
```

Apply migration:
```bash
# Using Supabase CLI
supabase migration up

# Or apply manually in Supabase Dashboard → SQL Editor
```

## Usage

### Permission Flow

The app automatically requests notification permissions on first launch:

```typescript
// In app/_layout.tsx
useNotifications(); // Initializes notifications
```

User flow:
1. App launches → Permission dialog appears
2. User grants permission → Push token registered
3. Token saved to Supabase
4. User can toggle preferences in Settings

### Sending Notifications

#### Local Notifications (Testing)

```typescript
import { scheduleLocalNotification, NotificationTemplates } from '@/services/notifications';

// Send a test notification
await scheduleLocalNotification(
  'Test Notification',
  'This is a test message',
  { type: NotificationType.SESSION_INVITE, sessionId: '123' }
);
```

#### Remote Notifications (Production)

Use the Expo Push API to send notifications from your backend:

```typescript
// Backend code example (Node.js)
const { Expo } = require('expo-server-sdk');

const expo = new Expo();

const messages = [{
  to: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
  sound: 'default',
  title: 'Session Starting',
  body: 'Your padel session starts in 30 minutes',
  data: {
    type: 'session_starting',
    sessionId: 'abc123'
  },
}];

const chunks = expo.chunkPushNotifications(messages);
const tickets = [];

for (const chunk of chunks) {
  const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
  tickets.push(...ticketChunk);
}
```

### Notification Types

```typescript
enum NotificationType {
  SESSION_INVITE = 'session_invite',        // When invited to a session
  SESSION_STARTING = 'session_starting',    // 30min before session
  ROUND_COMPLETE = 'round_complete',        // After round finishes
  CLUB_INVITE = 'club_invite',              // Club invitation
  CLUB_ANNOUNCEMENT = 'club_announcement',  // Club news
  MATCH_REMINDER = 'match_reminder',        // Before your match
  LEADERBOARD_UPDATE = 'leaderboard_update',// Position change
}
```

### Navigation Handling

Notifications automatically navigate to the correct screen:

```typescript
// Defined in hooks/useNotifications.ts
const handleNotificationResponse = (response) => {
  const { type, sessionId, clubId } = response.notification.request.content.data;

  switch (type) {
    case 'session_invite':
      router.push(`/(tabs)/session/${sessionId}`);
      break;
    case 'club_invite':
      router.push('/(tabs)/notifications');
      break;
    // ...etc
  }
};
```

## Testing

### Test on Physical Device

1. **iOS**: Must test on physical device (simulator doesn't support push)
2. **Android**: Can test on emulator with Google Play Services

### Send Test Notification

```bash
# Install Expo CLI
npm install -g expo-cli

# Get your push token from app logs
# Then send a test push:
npx expo send-push \
  --token ExponentPushToken[YOUR_TOKEN] \
  --title "Test" \
  --body "Testing notifications"
```

### Debugging

Enable verbose logging:

```typescript
// In services/notifications.ts
console.log('Push token:', token);
console.log('Notification received:', notification);
console.log('Device info:', Device.modelName, Device.osVersion);
```

Check Expo dashboard for push receipt details:
https://expo.dev/accounts/[your-account]/projects/courtster/push-notifications

## Android Notification Channels

The app creates 3 channels with different priorities:

### Urgent (High Priority)
- **Used for**: Session invites, club invites, session starting
- **Behavior**: Sound + vibration + heads-up
- **Color**: Red (#EF4444)

### Default (Medium Priority)
- **Used for**: General notifications, match reminders
- **Behavior**: Sound + vibration
- **Color**: Blue (#3B82F6)

### Updates (Low Priority)
- **Used for**: Leaderboard updates, round complete
- **Behavior**: Silent + vibration
- **Color**: Green (#10B981)

## User Preferences

Users can control notifications in **Settings > Notifications**:

- ✅ Push Notifications (master toggle)
- ✅ Email Notifications
- ✅ Session Reminders
- ✅ Club Invitations
- ✅ Match Results
- ✅ Session Updates
- ✅ Club Announcements

Preferences are stored in Supabase and synced across devices.

## Troubleshooting

### No Permission Dialog

```typescript
import { areNotificationsEnabled } from '@/services/notifications';

const enabled = await areNotificationsEnabled();
if (!enabled) {
  // Show manual instructions to enable in Settings
}
```

### Token Not Saved

Check:
1. User is authenticated
2. Supabase RLS policies allow insert
3. Network connection
4. Database migration applied

### Notifications Not Received

1. **Check push token is valid**
   ```typescript
   const token = await Notifications.getExpoPushTokenAsync();
   console.log('Token:', token.data);
   ```

2. **Verify FCM/APNs credentials in EAS**
   ```bash
   eas credentials
   ```

3. **Check Expo dashboard for errors**
   - Go to Push Notifications tab
   - Look for failed deliveries

4. **Test with Expo Push Tool**
   ```bash
   npx expo send-push --token YOUR_TOKEN --title "Test" --body "Test"
   ```

### iOS: Notifications in Foreground

iOS shows an alert. Customize in `services/notifications.ts`:

```typescript
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,  // Show banner in foreground
    shouldPlaySound: false, // Don't play sound in foreground
    shouldSetBadge: true,   // Update badge
  }),
});
```

## Production Checklist

Before releasing:

- [ ] EAS project ID set in app.json
- [ ] APNs credentials uploaded to EAS (iOS)
- [ ] FCM server key uploaded to EAS (Android)
- [ ] google-services.json added (Android)
- [ ] Database migrations applied
- [ ] Tested on physical iOS device
- [ ] Tested on Android device/emulator
- [ ] Backend sends notifications correctly
- [ ] Navigation from notifications works
- [ ] User preferences save correctly
- [ ] Badge counts update
- [ ] Tokens cleanup on logout

## Backend Integration

To send notifications from your backend:

1. **Get user's push tokens from Supabase**
   ```sql
   SELECT token FROM push_tokens WHERE user_id = $1;
   ```

2. **Check user's notification preferences**
   ```sql
   SELECT * FROM notification_preferences WHERE user_id = $1;
   ```

3. **Send via Expo Push API**
   ```javascript
   const expo = new Expo();
   const messages = pushTokens.map(token => ({
     to: token,
     sound: 'default',
     title: 'Your Title',
     body: 'Your Message',
     data: { type: 'session_invite', sessionId: '123' }
   }));

   await expo.sendPushNotificationsAsync(messages);
   ```

## Security

- Push tokens stored with RLS policies (users can only see their own)
- Tokens deleted on user account deletion (CASCADE)
- Preferences default to opt-in (GDPR compliant)
- Tokens removed on sign out

## Performance

- Tokens cached in React Query (5min stale time)
- Preferences cached locally
- Batch notifications for multiple users
- Use Expo's chunking for large sends

## Resources

- [Expo Notifications Docs](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Expo Push Notifications Guide](https://docs.expo.dev/push-notifications/overview/)
- [EAS Build Docs](https://docs.expo.dev/build/introduction/)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Apple Push Notifications](https://developer.apple.com/documentation/usernotifications)

## Support

For issues:
1. Check Expo Dashboard logs
2. Review device console logs
3. Test with Expo push tool
4. Check FCM/APNs credentials

---

**Last Updated**: 2025-01-01
**Expo SDK**: 54
**Expo Notifications**: 0.32.12
