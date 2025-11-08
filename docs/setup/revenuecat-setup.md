# RevenueCat Setup Guide - Courtster Mobile (2025)

Complete guide to set up RevenueCat for in-app purchases (iOS and Android) - Updated for November 2025 with latest dashboard features and best practices.

> **Last Updated:** November 2025
> **RevenueCat SDK:** v9.6.1 (react-native-purchases)
> **Min Requirements:** React Native 0.73.0+, iOS 13.4+, Android API 19+ (Kotlin 1.8.0+)
> **Dashboard Version:** 2025 (with redesigned navigation)

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Step 1: Create RevenueCat Account](#step-1-create-revenuecat-account)
4. [Step 2: Configure App in RevenueCat](#step-2-configure-app-in-revenuecat)
5. [Step 3: Set Up Products](#step-3-set-up-products)
6. [Step 4: Configure Entitlements](#step-4-configure-entitlements)
7. [Step 5: Create Offerings](#step-5-create-offerings)
8. [Step 6: iOS App Store Setup](#step-6-ios-app-store-setup)
9. [Step 7: Android Google Play Setup](#step-7-android-google-play-setup)
10. [Step 8: Update Environment Variables](#step-8-update-environment-variables)
11. [Testing](#testing)
12. [Subscription Tiers](#subscription-tiers)
13. [Troubleshooting](#troubleshooting)
14. [What's New in 2025](#whats-new-in-2025)

---

## Overview

**What You're Setting Up:**
- **Free Tier**: 4 sessions/month, 1 court, 1 club
- **Personal Tier**: Unlimited sessions, courts, clubs
- **Club Tier**: Same as Personal + priority support
- **Trial Period**: 2 weeks for new users

**What's Already Implemented:**
- ✅ RevenueCat SDK integrated (`react-native-purchases` v9.6.1)
  - Supports React Native 0.73.0+ (New Architecture ready)
  - Android: Min API 19 (Android 4.4), Kotlin 1.8.0+
  - iOS: Min deployment target 13.4+
- ✅ Service layer (`services/revenueCat.ts`)
- ✅ Subscription hook (`hooks/useSubscription.ts`)
- ✅ Feature access control
- ✅ Trial period logic
- ✅ Supabase sync for subscription tiers
- ✅ Restore purchases functionality

**What You Need to Configure:**
- RevenueCat Dashboard (products, entitlements, offerings)
- iOS App Store Connect (in-app purchases)
- Android Google Play Console (subscriptions)
- Environment variables

---

## Prerequisites

### Required Accounts
1. ✅ **RevenueCat Account** - https://app.revenuecat.com/signup
2. ✅ **Apple Developer Account** ($99/year) - https://developer.apple.com/
3. ✅ **Google Play Developer Account** ($25 one-time) - https://play.google.com/console

### Required Access
- Admin access to App Store Connect
- Admin access to Google Play Console
- Supabase project with `profiles` table

### Important: Expo Development Build Required

> **⚠️ Critical:** `react-native-purchases` contains native code and **does NOT work with Expo Go**. You must use a development build.

**For Courtster Mobile:**
```bash
# Create development build (required for testing)
npx expo install expo-dev-client
eas build --profile development --platform ios
eas build --profile development --platform android

# Or run locally with development build
npx expo run:ios
npx expo run:android
```

**Why?**
- Expo Go is a sandbox that only supports Expo SDK packages
- RevenueCat SDK requires native modules for App Store/Play Store integration
- Development builds include all native dependencies

---

## Step 1: Create RevenueCat Account

### 1.1 Sign Up
1. Go to https://app.revenuecat.com/signup
2. Sign up with email or Google
3. Choose **Free** plan (includes up to $2,500 monthly tracked revenue)

### 1.2 Create Project
1. Click **"Create New Project"**
2. **Project Name:** `Courtster`
3. **Platform:** Select **"iOS & Android"**
4. Click **"Create Project"**

---

## Step 2: Configure App in RevenueCat

> **💡 2025 Dashboard Navigation:** The RevenueCat dashboard has a new vertical navigation layout. Look for **"Product catalog"** in the left sidebar to access Products, Offerings, and Entitlements.

### 2.1 Add iOS App
1. Go to **"Project Settings"** → **"Apps"** (in left sidebar)
2. Click **"+ New"** → **"iOS"**
3. Fill in:
   - **App Name:** `Courtster iOS`
   - **Bundle ID:** `com.courtster.mobile` (from `app.json`)
   - **App Store Connect API Key:** (Recommended - more secure than shared secret)
     - Generate in App Store Connect → Users and Access → Keys
     - Or use **Shared Secret:** (legacy method - less secure)
4. Click **"Save"**
5. **Copy your iOS API Key** (starts with `appl_`)

> **⚠️ Security Best Practice (2025):** Use App Store Connect API Key instead of App-Specific Shared Secret. It's more secure and works across multiple apps.

### 2.2 Add Android App
1. Click **"+ New"** → **"Android"**
2. Fill in:
   - **App Name:** `Courtster Android`
   - **Package Name:** `com.courtster.mobile` (from `app.json`)
3. Click **"Save"**
4. **Copy your Android API Key** (starts with `goog_`)

### 2.3 Save API Keys
```bash
# Add to your .env file
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_xxxxxxxxxxxxxxxxxxxxx
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_xxxxxxxxxxxxxxxxxxxxx
```

---

## Step 3: Set Up Products

> **💡 2025 Update:** Products are now in the **"Product catalog"** section in the left sidebar, not a tab.

### 3.1 Navigate to Products
1. In RevenueCat Dashboard: Click **"Product catalog"** in left sidebar
2. Click the **"Products"** tab
3. Click **"+ New"**

### 3.2 Create Personal Monthly Product
1. **Product ID:** `personal_monthly`
2. **Type:** **Subscription**
3. **Display Name:** `Personal Monthly`
4. **Description:** `Unlimited sessions and courts for one month`
5. Click **"Save"**

### 3.3 Create Personal Yearly Product
1. **Product ID:** `personal_yearly`
2. **Type:** **Subscription**
3. **Display Name:** `Personal Yearly`
4. **Description:** `Unlimited sessions and courts for one year`
5. Click **"Save"**

### 3.4 Create Club Monthly Product
1. **Product ID:** `club_monthly`
2. **Type:** **Subscription**
3. **Display Name:** `Club Monthly`
4. **Description:** `Premium features for club organizers`
5. Click **"Save"**

### 3.5 Create Club Yearly Product
1. **Product ID:** `club_yearly`
2. **Type:** **Subscription**
3. **Display Name:** `Club Yearly`
4. **Description:** `Premium features for club organizers (yearly)`
5. Click **"Save"**

---

## Step 4: Configure Entitlements

Entitlements define what features users get with their subscription. Think of them as feature flags that unlock when a user subscribes.

> **💡 2025 Best Practice:** Use entitlements as feature flags to control access to premium features in your app. This allows you to change which products unlock which features without updating your app.

### 4.1 Create "Personal" Entitlement
1. In **"Product catalog"** (left sidebar), click **"Entitlements"** tab
2. Click **"+ New entitlement"**
3. **Identifier:** `personal` (⚠️ must match code in `services/revenueCat.ts`)
4. **Display Name:** `Personal Features`
5. Click **"Save"**
6. Click **"Attach"** button and select products:
   - `personal_monthly`
   - `personal_yearly`

### 4.2 Create "Club" Entitlement
1. Click **"+ New entitlement"**
2. **Identifier:** `club` (⚠️ must match code)
3. **Display Name:** `Club Features`
4. Click **"Save"**
5. Click **"Attach"** and select products:
   - `club_monthly`
   - `club_yearly`

---

## Step 5: Create Offerings

Offerings group products for display in your app. They allow you to A/B test different pricing strategies without updating your app.

> **💡 2025 Update:** Offerings are now in the **"Product catalog"** section alongside Products and Entitlements.

### 5.1 Create Default Offering
1. In **"Product catalog"** (left sidebar), click **"Offerings"** tab
2. Click **"+ New"**
3. **Identifier:** `default`
4. **Display Name:** `Default Offering`
5. **Description:** `Main subscription options`
6. Click **"Save"**

### 5.2 Add Packages to Default Offering
1. Click on your **"default"** offering
2. In the **Packages** section, click **"+ Add package"** for each:

**Package 1: Personal Monthly**
- **Package Type:** `MONTHLY`
- **Product:** `personal_monthly`
- Click **"Add"**

**Package 2: Personal Yearly**
- **Package Type:** `ANNUAL`
- **Product:** `personal_yearly`
- Click **"Add"**

**Package 3: Club Monthly**
- **Package Type:** `MONTHLY`
- **Product:** `club_monthly`
- Click **"Add"**

**Package 4: Club Yearly**
- **Package Type:** `ANNUAL`
- **Product:** `club_yearly`
- Click **"Add"**

---

## Step 6: iOS App Store Setup

### 6.1 Create In-App Purchases in App Store Connect

1. Go to https://appstoreconnect.apple.com/
2. Navigate to **"My Apps"** → Select **Courtster**
3. Click **"Subscriptions"** in sidebar
4. Click **"+"** → **"Create Subscription Group"**

#### Create Subscription Group
- **Reference Name:** `Courtster Subscriptions`
- Click **"Create"**

#### Add Subscriptions
For each product, click **"+"** and fill in:

**Personal Monthly:**
- **Product ID:** `personal_monthly` (⚠️ must match RevenueCat)
- **Reference Name:** `Personal Monthly Subscription`
- **Subscription Duration:** `1 Month`
- **Price:** $4.99 (or your pricing)
- **Subscription Group:** Select created group
- **Localizations:** Add English description
- Click **"Save"**

**Personal Yearly:**
- **Product ID:** `personal_yearly`
- **Reference Name:** `Personal Yearly Subscription`
- **Subscription Duration:** `1 Year`
- **Price:** $49.99 (or your pricing)
- **Subscription Group:** Same group
- **Localizations:** Add English description
- Click **"Save"**

Repeat for `club_monthly` and `club_yearly`.

### 6.2 Get Shared Secret
1. In App Store Connect, go to **"App Information"**
2. Scroll to **"App-Specific Shared Secret"**
3. Click **"Generate"**
4. **Copy the secret**
5. Paste in RevenueCat: **Project Settings** → **Apps** → **iOS App** → **Shared Secret**

### 6.3 Submit for Review
1. Complete all required metadata for each subscription
2. Submit for App Review (required even for testing)
3. Approval usually takes 24-48 hours

---

## Step 7: Android Google Play Setup

### 7.1 Create Subscriptions in Google Play Console

1. Go to https://play.google.com/console/
2. Select **Courtster** app
3. Navigate to **"Monetization"** → **"Subscriptions"**
4. Click **"Create subscription"**

#### Create Each Subscription

**Personal Monthly:**
- **Product ID:** `personal_monthly` (⚠️ must match RevenueCat)
- **Name:** `Personal Monthly`
- **Description:** `Unlimited sessions and courts for one month`
- **Billing Period:** `1 month`
- **Price:** $4.99
- **Free Trial:** 2 weeks (optional)
- Click **"Save"**
- Click **"Activate"**

**Personal Yearly:**
- **Product ID:** `personal_yearly`
- **Name:** `Personal Yearly`
- **Description:** `Unlimited sessions and courts for one year`
- **Billing Period:** `1 year`
- **Price:** $49.99
- **Free Trial:** 2 weeks (optional)
- Click **"Save"**
- Click **"Activate"**

Repeat for `club_monthly` and `club_yearly`.

### 7.2 Set Up Service Account

1. In Google Play Console: **"Setup"** → **"API access"**
2. Click **"Create new service account"**
3. Follow link to Google Cloud Console
4. Create service account with **Pub/Sub Admin** role
5. Generate JSON key
6. **Download the JSON key file**

### 7.3 Upload Service Account to RevenueCat

1. In RevenueCat: **"Project Settings"** → **"Apps"** → **Android App**
2. Scroll to **"Google Play Service Account Credentials"**
3. Upload the JSON key file
4. Click **"Save"**

### 7.4 Configure Play Console Notifications

1. In Google Play Console: **"Monetization"** → **"Monetization setup"**
2. Scroll to **"Real-time developer notifications"**
3. **Topic Name:** Create new Cloud Pub/Sub topic
4. Copy topic name
5. In RevenueCat: **"Project Settings"** → **"Integrations"** → **"Google Cloud Pub/Sub"**
6. Paste topic name
7. Click **"Save"**

---

## Step 8: Update Environment Variables

### 8.1 Add to `.env`

```bash
# RevenueCat Configuration
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_xxxxxxxxxxxxxxxxxxxxx
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_xxxxxxxxxxxxxxxxxxxxx
```

### 8.2 Restart App

```bash
npx expo start --clear
```

---

## Testing

> **⚠️ 2025 Reminder:** Always test on **real devices**, not simulators/emulators. In-app purchases don't work properly on simulators.

### Test in Development

#### iOS Sandbox Testing

**Setup (One-time):**
1. **App Store Connect** → **Users and Access** → **Sandbox Testers**
2. Click **"+"** to create tester
3. Use unique email (e.g., `test-ios@courtster.com`)
4. Choose region (affects pricing display)
5. **Important:** Remember password - you'll need it on device

**Testing Flow:**
1. **Sign out** of production App Store on device:
   - Settings → App Store → Tap Apple ID → Sign Out
2. **Build and install** app with development build:
   ```bash
   npx expo run:ios --device
   ```
3. **Trigger purchase** flow in app
4. iOS will prompt: **"Sign in with Apple ID"**
5. Enter **sandbox tester email** and password
6. Complete purchase (will show **[Sandbox]** banner)
7. Verify entitlements unlock in app

**Tips:**
- Sandbox purchases are instant (no waiting)
- Can test subscription renewals (accelerated time)
- Monthly subscriptions renew every 5 minutes in sandbox
- Maximum 6 renewals before auto-cancel

#### Android Test Accounts

**Setup (One-time):**
1. **Google Play Console** → **Setup** → **License Testing**
2. Add Gmail accounts (e.g., `testuser@gmail.com`)
3. **OR** use internal testing track with invited testers

**Testing Flow:**
1. **Build** app for internal testing:
   ```bash
   eas build --profile preview --platform android
   ```
2. **Upload to Play Console** internal testing track
3. **Install** from Play Store (must be from store, not local build)
4. **Trigger purchase** flow in app
5. Google Play shows **"Test purchase"** label
6. Complete purchase (no charge for test accounts)
7. Verify entitlements unlock

**Tips:**
- Test purchases behave like real purchases
- Can cancel subscriptions from Play Store
- Use Play Console to view test transactions

### Test Purchase Flow

```typescript
import { useSubscription } from './hooks/useSubscription';

function SubscriptionScreen() {
  const {
    offerings,
    purchasePackage,
    isPurchasing,
    isRevenueCatReady,
  } = useSubscription();

  const handlePurchase = async (pkg: PurchasesPackage) => {
    try {
      purchasePackage(pkg);
      // Success handled by hook
    } catch (error) {
      console.error('Purchase failed:', error);
    }
  };

  if (!isRevenueCatReady) {
    return <Text>Loading...</Text>;
  }

  return (
    <View>
      {offerings?.[0]?.availablePackages.map((pkg) => (
        <TouchableOpacity
          key={pkg.identifier}
          onPress={() => handlePurchase(pkg)}
          disabled={isPurchasing}
        >
          <Text>{pkg.product.title}</Text>
          <Text>{pkg.product.priceString}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
```

### Verify in RevenueCat Dashboard

1. Go to **"Customers"** tab
2. Search for your test user ID
3. Check active subscriptions
4. Verify entitlements

---

## Subscription Tiers

### Free Tier
- **Sessions:** 4 per month
- **Courts:** 1
- **Clubs:** 1
- **Reclub Import:** ❌
- **Trial:** 2 weeks (full access)

### Personal Tier
- **Sessions:** Unlimited
- **Courts:** Unlimited
- **Clubs:** Unlimited
- **Reclub Import:** ✅
- **Price:** $4.99/month or $49.99/year

### Club Tier
- **Sessions:** Unlimited
- **Courts:** Unlimited
- **Clubs:** Unlimited
- **Reclub Import:** ✅
- **Priority Support:** ✅
- **Price:** $9.99/month or $99.99/year

---

## Troubleshooting

### "No offerings available"
- **Cause:** RevenueCat not initialized or no API key
- **Fix:** Check `.env` has correct API keys, restart app

### "Product not found"
- **Cause:** Product IDs don't match between stores and RevenueCat
- **Fix:** Verify Product IDs are identical in:
  - App Store Connect
  - Google Play Console
  - RevenueCat Dashboard

### "Purchase failed"
- **Cause:** Not using sandbox account on iOS
- **Fix:** Sign out of production App Store, use sandbox account

### Subscriptions not syncing
- **Cause:** Service account not configured
- **Fix:** Upload service account JSON to RevenueCat (Android)
- **Fix:** Add shared secret to RevenueCat (iOS)

### "User not entitled"
- **Cause:** Products not attached to entitlements
- **Fix:** In RevenueCat → Entitlements → Attach all products

---

## Additional Resources

- **RevenueCat Docs:** https://www.revenuecat.com/docs
- **iOS In-App Purchase:** https://developer.apple.com/in-app-purchase/
- **Android Subscriptions:** https://developer.android.com/google/play/billing/subscriptions
- **React Native Purchases:** https://github.com/RevenueCat/react-native-purchases

---

## Next Steps After Setup

1. ✅ Test purchases with sandbox accounts
2. ✅ Implement paywall UI in app
3. ✅ Add "Restore Purchases" button
4. ✅ Test subscription restoration on reinstall
5. ✅ Monitor purchases in RevenueCat dashboard
6. ✅ Set up revenue notifications (Slack, email)

---

**Need Help?** Check the troubleshooting section or contact RevenueCat support at https://community.revenuecat.com/

---

## What's New in 2025

### 🎨 Dashboard Redesign
- **New vertical navigation** - Cleaner layout with sidebar navigation
- **Product Catalog consolidation** - Products, Offerings, Entitlements, and Virtual Currencies all in one place
- **Projects as top-level view** - Easier to manage multiple apps

### 🤖 RevenueCat MCP Server (Beta)
Configure your entire subscription setup using AI assistants with natural language:

```
"Create a premium monthly subscription for my iOS app"
"Set up an entitlement called 'premium_features' and attach my monthly product"
"Show me all active subscriptions for user@example.com"
```

The MCP server allows you to manage RevenueCat without navigating the dashboard. Perfect for quick setup and testing.

> **Try it:** https://www.revenuecat.com/docs/mcp

### 🔐 Enhanced Security
- **App Store Connect API Keys** now recommended over App-Specific Shared Secrets
- More secure and works across multiple apps
- Easier to rotate and manage

### 📱 SDK Updates (react-native-purchases v9.6.1)
- **React Native New Architecture** support (Fabric + TurboModules)
- **React Native 0.73.0+** minimum requirement
- **In-App Messages support** for both iOS and Android
  - Google Play In-App Messages
  - App Store In-App Messages
  - Shown by default on both platforms
- **Android BillingClient 5** integration
  - New subscription model with base plans and offers
  - Better handling of subscription upgrades/downgrades

### 🔔 Platform Server Notifications
Set up Platform Server Notifications for faster webhook delivery:
- iOS: App Store Server Notifications V2
- Android: Google Cloud Pub/Sub Real-time Developer Notifications

Faster notification delivery = faster entitlement updates = better UX.

### 🎯 Entitlements as Feature Flags
New best practice: Use entitlements to control feature access instead of checking subscription status directly.

```typescript
// ✅ Good (2025 best practice)
const { hasEntitlement } = useSubscription();
if (hasEntitlement('personal')) {
  // Show premium feature
}

// ❌ Old way (less flexible)
const { tier } = useSubscription();
if (tier === 'personal' || tier === 'club') {
  // Show premium feature
}
```

Benefits:
- Change which products unlock features without app updates
- A/B test different entitlement combinations
- Gradually roll out features to subscribers

### 📊 Improved Analytics
- Better charts and visualizations in dashboard
- More granular cohort analysis
- Improved churn prediction

---

## Migration Notes

### From v8 to v9 (react-native-purchases)
No breaking changes for most users. Key updates:
- Improved TypeScript types
- Better error messages
- Performance optimizations

### From v7 to v8
See full migration guide: https://github.com/RevenueCat/react-native-purchases/blob/main/migrations/v8-MIGRATION.md

### From v6 to v7
- Minimum Android SDK bumped from API 16 to API 19
- In-App Messages added (enabled by default)
- Improved subscription lifecycle handling

---

## 2025 Best Practices Checklist

- [ ] Use **App Store Connect API Keys** instead of Shared Secrets (iOS)
- [ ] Enable **Platform Server Notifications** for faster webhook delivery
- [ ] Use **entitlements as feature flags** instead of checking tiers directly
- [ ] Implement **restore purchases** functionality (required by stores)
- [ ] Set up **proper error handling** with fallbacks for network issues
- [ ] Never submit apps with **Test Store API keys** - use production keys
- [ ] Use **development builds** for Expo (Expo Go doesn't support native code)
- [ ] Test on **real devices** (not simulators) for purchase testing
- [ ] Configure SDK **only once** at app startup (use context provider)
- [ ] Monitor **dashboard analytics** regularly for subscription health

---

## Important Notes for November 2025

### ⚠️ Consumable Products Configuration
**New in v9.0.0+:** One-time purchase products MUST be correctly configured in the RevenueCat dashboard as either **consumable** or **non-consumable**.

- Incorrectly configured consumables will be consumed by RevenueCat
- This prevents restoration from v9.0.0 onward
- Double-check your product types in the dashboard before going live

### 🆕 Recent SDK Updates
- **v9.5.1+** includes latest purchases-hybrid-common updates
- Improved Expo Go support and web targets
- Enhanced error handling and reliability

### 📱 Expo Compatibility
- **Expo SDK 54** fully supported (current in Courtster Mobile)
- Development builds required (Expo Go does NOT support native modules)
- Use `expo-dev-client` for testing

### 🍎 iOS 18 & 🤖 Android 15 Support
**Courtster Mobile is optimized for the latest OS versions:**

**iOS 18:**
- Full compatibility with StoreKit 2
- Support for new subscription features
- Works with Live Activities (future feature)
- Deployment target: iOS 15.0+ (backward compatible)

**Android 15:**
- Target SDK: 35 (Android 15)
- Google Play Billing Library 6+ ready
- Edge-to-edge display support
- Predictive back gesture compatible
- Min SDK: 26 (Android 8.0)

---

**Last Updated:** November 2025 | **Next Review:** May 2026
