# Google SSO Setup Guide for Mobile App

This guide explains how to configure Google OAuth for the Courtster mobile app.

## Step 1: Enable Google Provider in Supabase

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to **Authentication** → **Providers**
3. Find **Google** in the list
4. Toggle to **Enable**
5. You'll need to configure Google Cloud Console first (see Step 2)

## Step 2: Configure Google Cloud Console

### 2.1 Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a project** → **New Project**
3. Name it: `Courtster` (or your preferred name)
4. Click **Create**

### 2.2 Enable Google+ API

1. In your project, go to **APIs & Services** → **Library**
2. Search for "Google+ API"
3. Click on it and click **Enable**

### 2.3 Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** (unless you have a Google Workspace)
3. Click **Create**

**Fill in the required fields:**
- **App name**: Courtster
- **User support email**: Your email
- **App logo**: (Optional) Upload your app logo
- **App domain**: (Leave blank for now)
- **Developer contact information**: Your email

4. Click **Save and Continue**
5. **Scopes**: Click **Add or Remove Scopes**
   - Add: `email`
   - Add: `profile`
   - Add: `openid`
6. Click **Save and Continue**
7. **Test users**: Add your email for testing
8. Click **Save and Continue**
9. Click **Back to Dashboard**

### 2.4 Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Select **Application type**: **iOS**

**For iOS:**
- **Name**: Courtster iOS
- **Bundle ID**: `com.courtster.mobile` (or your app's bundle ID from app.json)

4. Click **Create**
5. **Copy the Client ID** - you'll need this for Supabase

**Repeat for Web (required for Supabase):**
1. Click **Create Credentials** → **OAuth client ID**
2. Select **Application type**: **Web application**
3. **Name**: Courtster Supabase
4. **Authorized redirect URIs**: Add your Supabase callback URL:
   ```
   https://<your-project-ref>.supabase.co/auth/v1/callback
   ```
   (Get this from Supabase Dashboard → Authentication → Providers → Google)
5. Click **Create**
6. **Copy the Client ID and Client Secret**

## Step 3: Configure Supabase with Google Credentials

1. Go back to Supabase Dashboard
2. Navigate to **Authentication** → **Providers** → **Google**
3. Paste the **Web Client ID** into **Client ID**
4. Paste the **Client Secret** into **Client Secret**
5. **Authorized Client IDs**: Add both:
   - Your Web Client ID
   - Your iOS Client ID
6. Click **Save**

## Step 4: Configure Expo App

### 4.1 Update app.json

The app.json is already configured with:

```json
{
  "expo": {
    "scheme": "courtster",
    "ios": {
      "bundleIdentifier": "com.courtster.mobile"
    }
  }
}
```

### 4.2 Environment Variables

Already configured in your project:
```env
EXPO_PUBLIC_AUTH_REDIRECT_URL=courtster://auth/callback
```

## Step 5: Test Google SSO

### On iOS (Physical Device or Simulator)

1. Start Expo dev server:
   ```bash
   cd packages/mobile
   pnpm start:tunnel
   ```

2. Open app in Expo Go

3. Navigate to Login screen

4. Tap **"Sign in with Google"**

5. You'll be redirected to Google's OAuth page in Safari

6. Sign in with your Google account

7. Authorize the app

8. You'll be redirected back to the app

9. You should be automatically logged in!

## Troubleshooting

### Issue: "Redirect URI mismatch"

**Solution**:
1. Check that your Supabase callback URL is added to Google Console
2. Format: `https://<your-project-ref>.supabase.co/auth/v1/callback`
3. Make sure there are no trailing slashes

### Issue: "Invalid client"

**Solution**:
1. Verify Client ID and Client Secret in Supabase match Google Console
2. Make sure you're using the **Web application** credentials, not iOS
3. Check that iOS Client ID is added to **Authorized Client IDs** in Supabase

### Issue: "OAuth flow cancelled"

**Solution**:
1. User cancelled the OAuth flow - this is normal
2. Try again and complete the flow

### Issue: "Unable to open URL"

**Solution**:
1. Check that `expo-web-browser` is installed:
   ```bash
   cd packages/mobile
   pnpm install
   ```
2. Restart Expo dev server

### Issue: Profile not created

**Solution**:
1. Check Supabase logs in Dashboard → Logs
2. Verify the `profiles` table exists with correct columns
3. Check RLS policies allow inserts

## Security Considerations

### Production Checklist

Before publishing your app:

1. **OAuth Consent Screen**:
   - Submit for verification if you want to remove the "unverified app" warning
   - This can take 1-2 weeks

2. **Authorized Domains**:
   - Add your production domain to Google Console
   - Add to OAuth consent screen

3. **iOS Bundle ID**:
   - Ensure it matches your production app
   - Register with Apple

4. **Environment Variables**:
   - Ensure `EXPO_PUBLIC_AUTH_REDIRECT_URL` is correct

5. **Supabase**:
   - Use production Supabase project
   - Enable rate limiting
   - Configure email templates

## Testing with Different Accounts

1. Use **Test Users** in Google Cloud Console during development
2. Add multiple test accounts if needed
3. Each test user will see the OAuth consent screen

## Rate Limits

- Google OAuth has rate limits
- Default: 10,000 requests/day
- For production, request quota increase if needed

## User Experience

When a user signs in with Google:

1. ✅ Profile automatically created with:
   - Email from Google
   - Display name from Google
   - Username generated from email
   - Avatar URL from Google profile picture

2. ✅ Existing users automatically signed in

3. ✅ New users automatically signed up

4. ✅ No password required

## Next Steps

After Google SSO is working:

1. Test on physical iPhone device
2. Add Apple Sign In for iOS (required for App Store)
3. Add profile picture sync from Google
4. Test sign-out and re-sign-in flow

## Additional OAuth Providers

To add more providers (Facebook, Apple, etc.):

1. Follow similar steps in Supabase Dashboard
2. Configure each provider's developer console
3. Add buttons to login screen
4. Implement sign-in methods in `useAuth.tsx`

## Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Expo AuthSession](https://docs.expo.dev/versions/latest/sdk/auth-session/)
- [Expo WebBrowser](https://docs.expo.dev/versions/latest/sdk/webbrowser/)

## Support

If you encounter issues:

1. Check Supabase logs
2. Check Expo error messages
3. Verify all credentials match
4. Test with different Google accounts
5. Clear app data and try again
