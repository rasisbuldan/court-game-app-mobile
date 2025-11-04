# Google SSO Setup Guide for Mobile App (Updated 2025)

This guide explains how to configure Google OAuth for the Courtster mobile app using modern 2025 best practices.

**Last Updated:** January 2025
**Expo SDK:** 54
**React Native:** 0.81.4
**Supabase Auth:** Latest (v2.x)

---

## Prerequisites

- ✅ Expo SDK 54+ installed
- ✅ Supabase project created
- ✅ Google Cloud account (free tier works)
- ✅ iOS/Android development environment set up

---

## Step 1: Enable Google Provider in Supabase

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to **Authentication** → **Providers**
3. Find **Google** in the list
4. Toggle to **Enable**
5. Note the callback URL shown (you'll need this):
   ```
   https://<your-project-ref>.supabase.co/auth/v1/callback
   ```

---

## Step 2: Configure Google Cloud Console

### 2.1 Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a project** → **New Project**
3. Name it: `Courtster` (or your preferred name)
4. Select your organization (if applicable)
5. Click **Create**
6. Wait for project creation (usually < 30 seconds)

### 2.2 Enable Required APIs (2025 Update)

**⚠️ IMPORTANT:** As of 2023, Google+ API was deprecated. Use these instead:

1. Go to **APIs & Services** → **Enabled APIs & services**
2. Click **+ ENABLE APIS AND SERVICES**
3. Search and enable:
   - ✅ **Google People API** (replaces Google+ API)
   - ✅ **Google Sign-In API** (for OAuth)
   - ✅ **Identity Toolkit API** (for identity verification)

**Why these APIs?**
- **People API**: Access user profile information (name, photo, email)
- **Sign-In API**: Handle OAuth 2.0 flows
- **Identity Toolkit**: Enhanced security and identity verification

### 2.3 Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** (unless you have Google Workspace)
   - 💡 **Tip**: External allows anyone with a Google account to sign in
3. Click **Create**

**Fill in the required fields:**

#### App Information
- **App name**: Courtster
- **User support email**: your-email@example.com
- **App logo**:
  - Recommended: 512x512 PNG
  - Must be < 1MB
  - Square aspect ratio
  - Upload your app logo for better trust

#### App Domain (Optional but Recommended)
- **Application home page**: `https://courtster.app` (if you have one)
- **Application privacy policy**: Required for production
- **Application terms of service**: Required for production

💡 **2025 Tip**: Even in testing, adding privacy policy URL reduces user friction

#### Developer Contact Information
- **Email addresses**: Add 1-3 contact emails
- These will be shown to users and Google if issues arise

4. Click **Save and Continue**

#### Scopes Configuration

5. **Scopes**: Click **Add or Remove Scopes**

   **Required Scopes (2025):**
   - ✅ `.../auth/userinfo.email` - User's email address
   - ✅ `.../auth/userinfo.profile` - User's basic profile info
   - ✅ `openid` - OpenID Connect authentication

   **Optional but Recommended:**
   - `https://www.googleapis.com/auth/user.phonenumbers.read` - For future phone verification
   - `https://www.googleapis.com/auth/user.birthday.read` - For age verification (sports apps)

6. Click **Update** → **Save and Continue**

#### Test Users

7. **Test users**: Click **+ ADD USERS**
   - Add your email: `your-email@example.com`
   - Add team members' emails
   - Max 100 test users in testing mode

8. Click **Save** → **Save and Continue**
9. Review summary → **Back to Dashboard**

**🔒 2025 Security Note:**
Your app will show "unverified" warning until you complete OAuth verification with Google. For beta testing, this is fine. For production App Store release, complete verification (see Security Considerations section).

**📱 2025 Branding Fix:**
If your OAuth consent screen shows "bmnpxxxx.supabase.co" instead of your app name:
1. Upload an **App logo** (512x512 PNG) in the Branding section - this triggers verification
2. **Publish your app** (changes from Testing → Published) to remove user limits
3. For production, submit for full verification to remove "unverified" warning

See the "Fixing the Consent Screen Branding" section below for detailed steps.

---

### 2.4 Create OAuth 2.0 Credentials

#### For iOS (Native App)

1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. **Application type**: Select **iOS**
4. Fill in:
   - **Name**: `Courtster iOS`
   - **Bundle ID**: `com.courtster.mobile` (from your app.json)

   💡 **Find your Bundle ID**:
   ```bash
   cat app.json | grep "bundleIdentifier"
   ```

5. Click **Create**
6. **Copy the iOS Client ID** - Save it somewhere safe!

**Format:** `123456789-abcdefg.apps.googleusercontent.com`

#### For Android (Native App) - 2025 Addition

1. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
2. **Application type**: Select **Android**
3. Fill in:
   - **Name**: `Courtster Android`
   - **Package name**: `com.courtster.mobile`
   - **SHA-1 certificate fingerprint**: Get from your keystore

   💡 **Get SHA-1 for Development**:
   ```bash
   cd android
   ./gradlew signingReport
   # Look for SHA1 under 'Variant: debug'
   ```

   💡 **Get SHA-1 for Production**:
   ```bash
   keytool -list -v -keystore your-release-key.keystore
   ```

4. Click **Create**
5. **Copy the Android Client ID**

#### For Web (Supabase Backend) - **REQUIRED**

**⚠️ Critical:** Supabase requires Web OAuth credentials to handle the OAuth flow.

1. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
2. **Application type**: Select **Web application**
3. Fill in:
   - **Name**: `Courtster Supabase Backend`
   - **Authorized JavaScript origins**: Leave empty (not used)
   - **Authorized redirect URIs**: Click **+ ADD URI**
     ```
     https://<your-project-ref>.supabase.co/auth/v1/callback
     ```

     💡 **Find your project ref**:
     - From Supabase Dashboard URL
     - Or Settings → API → Project URL
     - Format: `https://abcdefghijklmnop.supabase.co`

4. Click **Create**
5. **Copy both**:
   - ✅ Client ID
   - ✅ Client Secret

**🔒 2025 Security Warning:**
- Never commit Client Secret to git
- Store in environment variables only
- Rotate secrets if accidentally exposed

---

## Step 3: Configure Supabase with Google Credentials

1. Go back to Supabase Dashboard
2. Navigate to **Authentication** → **Providers** → **Google**
3. Toggle **Enable Sign in with Google** to ON
4. Fill in the form:

   **Client ID (for OAuth):**
   ```
   Paste your Web Client ID here (from step 2.4)
   ```

   **Client Secret (for OAuth):**
   ```
   Paste your Web Client Secret here (from step 2.4)
   ```

   **Redirect URL:**
   ```
   Should auto-populate: https://<ref>.supabase.co/auth/v1/callback
   ```

   ✅ This is automatically set by Supabase - verify it matches your Google Console redirect URI

5. **Skip nonce check** (Advanced):
   - Leave UNCHECKED for better security
   - Only enable if you have specific requirements

6. Click **Save**

**📝 Important Notes:**
- You only need the **Web Client ID/Secret** in Supabase
- iOS and Android Client IDs are used in your app code via environment variables
- Supabase handles the OAuth flow using the web credentials
- The mobile app redirects users through the web OAuth flow, then deep links back

---

## Step 4: Configure Expo App

### 4.1 Verify app.json Configuration

Check your `app.json` has proper scheme and identifiers:

```json
{
  "expo": {
    "name": "Courtster",
    "slug": "courtster",
    "scheme": "courtster",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.courtster.mobile",
      "supportsTablet": true,
      "infoPlist": {
        "CFBundleURLTypes": [
          {
            "CFBundleURLSchemes": ["courtster"]
          }
        ]
      }
    },
    "android": {
      "package": "com.courtster.mobile",
      "intentFilters": [
        {
          "action": "VIEW",
          "data": [
            {
              "scheme": "courtster"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

**🔑 2025 Key Points:**
- `scheme` enables deep linking back to your app
- Must match redirect URL in environment variables
- iOS needs `CFBundleURLTypes`, Android needs `intentFilters`

### 4.2 Environment Variables

Update your `.env` file:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Auth Configuration
EXPO_PUBLIC_AUTH_REDIRECT_URL=courtster://auth/callback

# Google OAuth (Optional - for native flows)
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-ios-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your-android-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
```

**⚠️ Security Reminder:**
- Add `.env` to `.gitignore`
- Use `.env.example` for team reference (without real values)
- Never commit real credentials

### 4.3 Install Required Dependencies

Verify these packages are installed:

```bash
cd packages/mobile
pnpm install expo-web-browser expo-auth-session expo-linking
```

**Package Purposes (2025):**
- `expo-web-browser`: Opens OAuth flow in secure browser
- `expo-auth-session`: Handles OAuth state management
- `expo-linking`: Manages deep link callbacks

---

## Step 5: Test Google SSO

### Development Testing Workflow

#### On iOS Simulator

1. Start Expo dev server with tunnel (required for OAuth):
   ```bash
   cd packages/mobile
   pnpm start -- --tunnel
   # Or
   npx expo start --tunnel
   ```

2. Press `i` to open iOS simulator

3. Navigate to Login screen

4. Tap **"Sign in with Google"**

5. OAuth flow:
   - ✅ Opens in Safari (secure context)
   - ✅ Shows Google sign-in page
   - ✅ Select account
   - ✅ Grant permissions
   - ✅ Redirects back to app (`courtster://auth/callback`)
   - ✅ Profile created automatically
   - ✅ User logged in

6. **Expected behavior:**
   - First time: Profile created with Google info
   - Subsequent: Instant sign-in

#### On Android Emulator

1. Start with tunnel:
   ```bash
   pnpm start -- --tunnel
   ```

2. Press `a` to open Android emulator

3. Follow same flow as iOS

4. **Android-specific notes:**
   - May need to enable Chrome Custom Tabs
   - Some emulators require Google Play Services
   - Test on both emulator and real device

#### On Physical Device (Recommended for Final Testing)

**iOS:**
```bash
# Install Expo Go from App Store
# Start with tunnel
pnpm start -- --tunnel
# Scan QR code with camera
```

**Android:**
```bash
# Install Expo Go from Play Store
# Start with tunnel
pnpm start -- --tunnel
# Scan QR code with Expo Go app
```

**🚀 2025 Performance Tip:**
Physical devices give more accurate OAuth flow testing than simulators.

---

## Fixing the Consent Screen Branding (Shows Supabase URL Instead of App Name)

### Problem
When users click "Sign in with Google", they see:
```
"Select an account to continue to bmnpxxxx.supabase.co"
```

Instead of:
```
"Select an account to continue to Courtster"
```

This happens because:
- Your app is in **Testing** status (not published)
- Google shows the **redirect URI domain** (Supabase) instead of your app name
- No app logo uploaded = less prominent branding

### Quick Fix (5 minutes) - Upload Logo

**This is the fastest way to improve branding during beta testing:**

1. Go to **Google Cloud Console** → **APIs & Services** → **OAuth consent screen**
2. Scroll to **Branding** section
3. Click **Choose File** under **App logo**
4. Upload your app logo:
   - Format: PNG or JPG
   - Size: 512x512 pixels (recommended)
   - File size: < 1MB
   - Square aspect ratio
5. Fill in other branding fields (optional but recommended):
   - **App domain**: Your website (if you have one)
   - **Privacy policy link**: Required for verification
   - **Terms of service link**: Required for verification
6. Click **Save**
7. **Wait 24-48 hours** for Google to process

**Result After Logo Upload:**
- ✅ App logo shows on consent screen
- ✅ App name more prominent
- ✅ Looks more professional
- ⚠️ Still shows Supabase domain in URL (until full verification)

### Better Fix (2 minutes) - Publish Your App

**Removes the 100 test user limit and improves branding:**

1. Go to **OAuth consent screen**
2. At the top, you'll see **Publishing status: Testing**
3. Click **"PUBLISH APP"** button
4. Read the confirmation dialog
5. Click **"CONFIRM"**

**What Changes:**
- ✅ Status changes to **"In production"**
- ✅ No more 100 test user limit
- ✅ App name shows more prominently
- ✅ Anyone with a Google account can sign in
- ⚠️ Still shows "This app isn't verified" warning (until full verification)
- ⚠️ Users must click "Advanced" → "Continue" to proceed

**Important Notes:**
- Publishing does **NOT** require verification
- Your app can be "Published" while "Unverified" - this is normal
- Recommended for beta testing with >100 users
- Required before submitting to App Store/Play Store

### Best Fix (1-2 weeks) - Submit for Verification

**For production-ready branding with no warnings:**

1. **Prepare Required Materials:**
   - ✅ Privacy policy URL (publicly accessible)
   - ✅ Terms of service URL (publicly accessible)
   - ✅ App homepage URL
   - ✅ YouTube video showing OAuth flow (unlisted is OK)
   - ✅ 512x512 app logo uploaded
   - ✅ App published (previous step)

2. **Submit Verification Request:**
   - Go to **OAuth consent screen**
   - Click **"Submit for Verification"** or **"Prepare for Verification"**
   - Fill out the form:
     - **Application name**: Courtster
     - **Support email**: Your support email
     - **Scopes justification**: "We use email and profile scopes to create user accounts and personalize the experience"
     - **Domain verification**: Will need to verify Supabase domain
     - **Video link**: Upload a 1-2 minute screencast showing:
       - User clicks "Sign in with Google"
       - Google consent screen appears
       - User grants permissions
       - User is logged into your app
   - Click **Submit**

3. **Handle Domain Verification Email:**
   - Google will email you asking to verify `xxxxx.supabase.co` ownership
   - **Reply with**:
     ```
     This domain (xxxxx.supabase.co) belongs to Supabase, a third-party
     authentication service we use for Google OAuth integration. We do not
     own this domain but use it as our OAuth redirect URI as required by
     Supabase's authentication infrastructure.
     ```
   - Google will accept this explanation and continue verification

4. **Wait for Approval:**
   - Initial review: 3-7 business days
   - Domain explanation: 1-2 business days
   - Total: ~1-2 weeks typical

**Result After Verification:**
- ✅ App name shows instead of Supabase URL
- ✅ No "unverified" warning
- ✅ Professional appearance
- ✅ No "Advanced" click required
- ✅ Ready for App Store/Play Store submission

### Recommended Timeline

**For Beta Testing (Now):**
1. ✅ Upload app logo (5 min) - do this today
2. ✅ Publish app (2 min) - do this today if >100 testers
3. ⏳ Add test users for controlled beta (<100 users)

**Before App Store Submission:**
1. ✅ Create privacy policy + terms of service pages
2. ✅ Record OAuth flow demo video
3. ✅ Submit for verification (1-2 weeks before launch)
4. ⏳ Wait for Google approval

**References:**
- [Supabase Issue #33387](https://github.com/supabase/supabase/issues/33387) - Community discussion
- [Google OAuth Verification](https://support.google.com/cloud/answer/9110914) - Official docs

---

## Troubleshooting (2025 Edition)

### Issue: "Redirect URI mismatch"

**Symptoms:**
- Error 400: redirect_uri_mismatch
- OAuth fails immediately

**Solutions:**
1. ✅ Check Google Console → Credentials → Web client → Authorized redirect URIs
2. ✅ Verify URL matches exactly:
   ```
   https://abcdefghijklmnop.supabase.co/auth/v1/callback
   ```
3. ✅ No trailing slashes
4. ✅ Case-sensitive match
5. ✅ Wait 5 minutes after adding URI (Google caching)

**2025 Fix:**
```bash
# Verify your Supabase URL
echo $EXPO_PUBLIC_SUPABASE_URL
# Should match Google Console redirect URI base
```

---

### Issue: "Invalid client"

**Symptoms:**
- Error: invalid_client
- "The OAuth client was not found"

**Solutions:**
1. ✅ Using **Web** client ID in Supabase (not iOS/Android)
2. ✅ Client Secret matches exactly (no spaces)
3. ✅ iOS/Android client IDs in "Authorized Client IDs" field
4. ✅ All credentials from same Google Cloud project

**2025 Debug:**
```typescript
// In useAuth.tsx, temporarily log:
console.log('OAuth config:', {
  provider: 'google',
  redirectUrl: process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL,
});
```

---

### Issue: "API not enabled"

**Symptoms:**
- Error: "Google People API has not been used"
- "API is not enabled for this project"

**Solutions:**
1. ✅ Enable People API (replaces deprecated Google+ API)
2. ✅ Enable Google Sign-In API
3. ✅ Enable Identity Toolkit API
4. ✅ Wait 1-2 minutes for propagation

**Quick Fix:**
```
Google Console → APIs & Services → Library
Search: "People API" → Enable
Search: "Sign-In API" → Enable
Search: "Identity Toolkit" → Enable
```

---

### Issue: "Access blocked: App's request is invalid"

**Symptoms:**
- OAuth consent screen shows error
- "Error 400: invalid_request"

**Root Causes (2025):**
1. ❌ Scopes misconfigured in OAuth consent screen
2. ❌ Redirect URI mismatch
3. ❌ App in "Testing" mode with non-test user

**Solutions:**
1. ✅ Add user to Test Users list in OAuth consent screen
2. ✅ Verify scopes include: email, profile, openid
3. ✅ Check redirect URI in both Google Console and Supabase

---

### Issue: "OAuth flow cancelled" or "User closed window"

**Symptoms:**
- User sees Google sign-in, then returns to app without signing in
- No error, but not authenticated

**This is normal behavior:**
- ✅ User cancelled intentionally
- ✅ Not an error - just user choice
- ✅ Let user try again

**2025 UX Improvement:**
```typescript
// In your sign-in handler
try {
  await signInWithGoogle();
} catch (error) {
  if (error.code === 'ERR_CANCELED') {
    // Don't show error toast - user cancelled intentionally
    return;
  }
  // Show error only for real errors
  Toast.show({ type: 'error', text1: 'Sign-in failed' });
}
```

---

### Issue: "Unable to open URL" or "WebBrowser not available"

**Symptoms:**
- Error: "Could not open URL"
- OAuth flow doesn't start

**Solutions:**
1. ✅ Install dependencies:
   ```bash
   cd packages/mobile
   pnpm install expo-web-browser expo-auth-session
   pnpm install # Reinstall native modules
   ```

2. ✅ Restart Expo dev server:
   ```bash
   # Kill current server
   # Clear cache
   pnpm start --clear
   ```

3. ✅ Rebuild native code (if using development client):
   ```bash
   npx expo prebuild --clean
   ```

---

### Issue: Profile not created after successful OAuth

**Symptoms:**
- OAuth completes successfully
- User authenticated
- But `profiles` table has no row

**Solutions:**
1. ✅ Check Supabase logs: Dashboard → Logs → Filter "auth"
2. ✅ Verify `profiles` table exists with trigger
3. ✅ Check RLS policies allow inserts:
   ```sql
   -- Should have this policy
   CREATE POLICY "Users can create own profile"
   ON profiles FOR INSERT
   WITH CHECK (auth.uid() = id);
   ```

4. ✅ Verify trigger creates profile:
   ```sql
   -- Check function exists
   SELECT * FROM pg_proc WHERE proname = 'handle_new_user';

   -- Check trigger exists
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```

**2025 Fix:**
```sql
-- Manually create trigger if missing
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    lower(split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

### Issue: "App not verified" warning

**Symptoms:**
- Google shows "This app isn't verified" screen
- Users see scary warning

**This is expected in development:**
- ✅ Normal for apps in "Testing" status
- ✅ Users can click "Advanced" → "Go to Courtster (unsafe)"
- ✅ Test users won't see this warning

**For Production (2025):**
1. Submit OAuth verification request to Google
2. Provide:
   - Privacy policy URL
   - Terms of service URL
   - App homepage
   - Video demonstration
   - Justification for scopes requested
3. Typical approval time: 1-2 weeks
4. Required for App Store/Play Store submission

**Temporary Workaround:**
- Add all beta testers as "Test users" in OAuth consent screen
- They won't see verification warning

---

## Security Considerations (2025 Update)

### Production Checklist

Before App Store/Play Store submission:

#### 1. OAuth Verification
- [ ] Submit app for Google OAuth verification
- [ ] Provide all required URLs (privacy, terms, homepage)
- [ ] Create demo video showing OAuth flow
- [ ] Wait for approval (1-2 weeks typical)

#### 2. Secure Credentials Management
- [ ] Client Secret in environment variables only
- [ ] Never commit credentials to git
- [ ] Use different credentials for dev/staging/prod
- [ ] Implement credential rotation policy (every 90 days)

#### 3. OAuth Consent Screen
- [ ] Professional app logo (512x512)
- [ ] Complete app description
- [ ] Privacy policy URL (required)
- [ ] Terms of service URL (required)
- [ ] Support email that's monitored

#### 4. iOS App Store Requirements
- [ ] Bundle ID matches Google Console
- [ ] Associated domains configured
- [ ] Apple Sign In also implemented (Apple requirement)
- [ ] Privacy policy accessible in-app

#### 5. Android Play Store Requirements
- [ ] Package name matches Google Console
- [ ] Release SHA-1 fingerprint added
- [ ] OAuth consent tested with production credentials
- [ ] Privacy policy linked in Play Store listing

#### 6. Supabase Production Setup
- [ ] Use production Supabase project (not shared dev)
- [ ] Enable rate limiting on auth endpoints
- [ ] Configure email templates (welcome, reset, etc.)
- [ ] Set up monitoring and alerts
- [ ] Enable Supabase Auth v2 features:
  - [ ] Email verification required
  - [ ] MFA support (optional)
  - [ ] Session timeout configuration

#### 7. Scope Minimization (2025 Security Best Practice)
- ✅ Only request scopes you actually use
- ✅ Email, profile, openid are sufficient for most apps
- ❌ Don't request phone number if you don't need it
- ❌ Don't request calendar access unless app feature requires it

**Why this matters:**
- Faster OAuth approval from Google
- Higher user trust (fewer permissions requested)
- Lower risk if credentials compromised

---

## Advanced Configuration (2025)

### 1. Automatic Profile Picture Sync

Update your profile creation trigger to sync Google avatar:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    display_name,
    username,
    avatar_url  -- New field
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    lower(regexp_replace(
      split_part(NEW.email, '@', 1),
      '[^a-z0-9]', '', 'g'
    )),
    NEW.raw_user_meta_data->>'avatar_url'  -- Google profile picture
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2. Refresh Token Handling

Supabase automatically handles refresh tokens, but you can customize:

```typescript
// In config/supabase.ts
export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce', // 2025: Use PKCE for better security
    },
  }
);
```

**2025 Security:** PKCE (Proof Key for Code Exchange) is now recommended for all OAuth flows in mobile apps.

### 3. Multiple OAuth Providers

Add Apple Sign In (required for iOS App Store):

```typescript
// In useAuth.tsx
async signInWithApple() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL,
    },
  });

  if (error) throw error;
  return data;
}
```

Configure in Supabase Dashboard → Providers → Apple

### 4. Silent Sign-In (Skip OAuth Screen for Returning Users)

**2025 Feature:** Google supports silent sign-in for returning users:

```typescript
async signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL,
      queryParams: {
        prompt: 'select_account', // Let user choose account
        // OR
        // prompt: 'none', // Skip if already signed in (silent)
      },
    },
  });
}
```

**Options:**
- `select_account`: Always show account picker (recommended)
- `none`: Silent sign-in if session exists
- `consent`: Force consent screen (for scope changes)

---

## Rate Limits (2025 Update)

### Google OAuth Quotas

**Default Limits:**
- 10,000 requests/day (OAuth requests)
- 100 requests/100 seconds/user

**For Production Apps:**
1. Request quota increase in Google Cloud Console
2. Go to: APIs & Services → Quotas & System Limits
3. Select: Google Sign-In API
4. Request increase to:
   - 1,000,000 requests/day (typical for apps with 10k+ users)
   - Provide justification

**Typical Approval:** 1-2 business days

### Supabase Auth Limits

**Free Tier:**
- 50,000 MAU (Monthly Active Users)
- Unlimited auth requests

**Pro Tier ($25/month):**
- 100,000 MAU
- Priority support
- Point-in-time recovery

**Optimization Tips:**
- Cache user sessions locally (Supabase does this automatically)
- Use refresh tokens (automatic with Supabase)
- Implement session expiry (default: 1 hour, refresh: 30 days)

---

## User Experience Best Practices (2025)

### 1. Loading States

```typescript
const [isLoading, setIsLoading] = useState(false);

async function handleGoogleSignIn() {
  try {
    setIsLoading(true);
    await signInWithGoogle();
    // Success handled by auth state listener
  } catch (error) {
    if (error.code === 'ERR_CANCELED') return; // User cancelled
    Toast.show({
      type: 'error',
      text1: 'Sign-in failed',
      text2: 'Please try again'
    });
  } finally {
    setIsLoading(false);
  }
}
```

### 2. Informative Error Messages

```typescript
function getErrorMessage(error: any): string {
  const errorMap: Record<string, string> = {
    'invalid_request': 'Sign-in configuration error. Please contact support.',
    'access_denied': 'You denied access to your Google account.',
    'invalid_grant': 'Sign-in session expired. Please try again.',
    'ERR_CANCELED': '', // Don't show error for cancellation
  };

  return errorMap[error.code] || 'An unexpected error occurred';
}
```

### 3. Automatic Profile Completion

After OAuth, show optional profile completion:

```typescript
// After successful Google sign-in
if (isNewUser && !profile.username) {
  // Navigate to profile completion screen
  router.push('/complete-profile');
}
```

### 4. Email Verification (Optional)

Even with OAuth, you can require email verification:

```sql
-- In Supabase Dashboard → Authentication → Settings
-- Enable "Confirm email" for Google provider
```

**Trade-off:**
- ✅ Pro: Extra security layer
- ❌ Con: Extra friction (Google emails are pre-verified)

**2025 Recommendation:** Skip email verification for OAuth users (Google already verified the email).

---

## Testing with Different Accounts

### Development Testing

1. **Add Test Users** in Google Cloud Console:
   - OAuth consent screen → Test users → + ADD USERS
   - Add up to 100 test emails
   - No verification warning for test users

2. **Test Scenarios:**
   - ✅ First-time sign-up (creates profile)
   - ✅ Returning user (finds existing profile)
   - ✅ User with multiple Google accounts (picker works)
   - ✅ User cancels OAuth flow (handles gracefully)
   - ✅ Network failure during OAuth (error handling)

### QA/Beta Testing

For beta testers without Google Console access:

**Option 1:** Add all testers as test users (up to 100)

**Option 2:** Publish OAuth app (removes 100-user limit):
1. OAuth consent screen → Publishing status → PUBLISH APP
2. Still shows "unverified" warning
3. No user limit
4. Users can click through warning

**2025 Recommendation:** Use TestFlight (iOS) or Internal Testing (Android) with test users list for controlled beta.

---

## Monitoring and Analytics (2025)

### Track OAuth Success/Failure

```typescript
// In useAuth.tsx
import { Logger } from '../utils/logger';
import posthog from '../services/posthog';

async signInWithGoogle() {
  const startTime = Date.now();

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL },
    });

    if (error) throw error;

    // Track success
    const duration = Date.now() - startTime;
    posthog.capture('oauth_success', {
      provider: 'google',
      duration_ms: duration,
    });

    Logger.info('Google OAuth succeeded', { duration });

    return data;
  } catch (error) {
    // Track failure
    posthog.capture('oauth_failed', {
      provider: 'google',
      error_code: error.code,
      error_message: error.message,
    });

    Logger.error('Google OAuth failed', error, {
      action: 'oauth_google',
    });

    throw error;
  }
}
```

### Key Metrics to Track

1. **OAuth Conversion Rate:**
   - % of users who complete OAuth flow
   - Target: > 80%

2. **OAuth Duration:**
   - Time from button click to callback
   - Target: < 10 seconds

3. **Error Rate:**
   - % of OAuth attempts that fail
   - Target: < 5%

4. **Cancellation Rate:**
   - % of users who cancel OAuth
   - Target: < 20%

---

## Resources (2025 Edition)

### Official Documentation
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth) (Updated for v2)
- [Google Identity Platform](https://developers.google.com/identity) (Replaces Google+ docs)
- [Google Sign-In for Mobile Apps](https://developers.google.com/identity/sign-in/ios/start-integrating)
- [Expo AuthSession v13+](https://docs.expo.dev/versions/latest/sdk/auth-session/)
- [Expo WebBrowser v13+](https://docs.expo.dev/versions/latest/sdk/webbrowser/)

### Video Tutorials (2025)
- [Supabase OAuth Tutorial](https://www.youtube.com/c/supabase) (Official channel)
- [Expo Authentication Best Practices](https://www.youtube.com/c/expo) (Official)

### Community Resources
- [Supabase Discord](https://discord.supabase.com) - Fast support
- [Expo Discord](https://discord.gg/expo) - React Native help
- [r/reactnative](https://reddit.com/r/reactnative) - Community Q&A

### Example Code
- [Supabase Auth Helpers](https://github.com/supabase/auth-helpers) (Official examples)
- [Expo Examples](https://github.com/expo/examples) (OAuth examples)

---

## Troubleshooting Support Checklist

If you encounter issues, gather this information before asking for help:

### Environment Info
```bash
# Run this and include output
npx expo-doctor
expo --version
node --version
npm --version

# Package versions
cat package.json | grep -E "(expo|supabase|@supabase)"
```

### Debug Logs
```typescript
// Add to useAuth.tsx temporarily
console.log('Environment check:', {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
  redirectUrl: process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL,
  hasAnonKey: !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
});
```

### Supabase Logs
1. Dashboard → Logs
2. Filter: "auth"
3. Time range: Last 1 hour
4. Look for errors

### Google Cloud Logs
1. Google Cloud Console → Logging
2. Query: `resource.type="oauth_app"`
3. Look for 4xx/5xx errors

---

## Next Steps After Setup

Once Google SSO is working:

### Phase 1: Core Functionality (Week 1)
- [x] Google sign-in works
- [ ] Test on iOS physical device
- [ ] Test on Android physical device
- [ ] Profile creation verified
- [ ] Sign-out and re-sign-in flow tested

### Phase 2: Additional Auth (Week 2)
- [ ] Add Apple Sign In (required for iOS App Store)
- [ ] Add email/password fallback
- [ ] Implement password reset flow
- [ ] Add profile completion screen

### Phase 3: Production Prep (Week 3-4)
- [ ] Submit OAuth verification to Google
- [ ] Add privacy policy
- [ ] Add terms of service
- [ ] Test with beta users
- [ ] Monitor auth metrics

### Phase 4: Advanced Features (Week 5+)
- [ ] Implement MFA (optional)
- [ ] Add biometric auth (Face ID/Touch ID)
- [ ] Session management UI
- [ ] Account deletion flow

---

## Additional OAuth Providers

### Apple Sign In (Required for iOS)

**Setup:**
1. Supabase Dashboard → Providers → Apple → Enable
2. Apple Developer Console → Certificates, IDs & Profiles
3. Create Service ID
4. Configure Sign in with Apple
5. Add callback URL: `https://<ref>.supabase.co/auth/v1/callback`

**Code:**
```typescript
async signInWithApple() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL,
    },
  });
  return { data, error };
}
```

### Facebook Login

**Setup:**
1. Facebook Developers → Create App
2. Add Facebook Login product
3. Configure OAuth redirect URL
4. Supabase Dashboard → Providers → Facebook → Enable

### Microsoft/Azure AD

**Setup:**
1. Azure Portal → App registrations
2. Create new registration
3. Configure redirect URI
4. Supabase Dashboard → Providers → Azure → Enable

**Good for:** Enterprise apps, Microsoft 365 integration

---

## Support

### If you encounter issues:

1. **Check the logs** (80% of issues are visible here):
   - Supabase Dashboard → Logs
   - Expo dev tools console
   - Google Cloud Console → Logging

2. **Verify configuration**:
   - All Client IDs match
   - Redirect URIs are exact
   - Environment variables loaded

3. **Test with clean state**:
   ```bash
   # Clear Expo cache
   rm -rf .expo
   pnpm start --clear

   # Clear app data on device
   # iOS: Delete app and reinstall
   # Android: Settings → Apps → Courtster → Clear data
   ```

4. **Ask for help** with:
   - Environment info (`npx expo-doctor`)
   - Error messages (full text)
   - Steps to reproduce
   - What you've already tried

---

**Last Updated:** January 2025
**Tested with:** Expo SDK 54, Supabase v2.x, React Native 0.81.4

---
