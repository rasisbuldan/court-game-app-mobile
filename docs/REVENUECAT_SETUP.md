# RevenueCat Setup Guide - Courtster Mobile

Complete guide to set up RevenueCat for in-app purchases (iOS and Android).

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

---

## Overview

**What You're Setting Up:**
- **Free Tier**: 4 sessions/month, 1 court, 1 club
- **Personal Tier**: Unlimited sessions, courts, clubs
- **Club Tier**: Same as Personal + priority support
- **Trial Period**: 2 weeks for new users

**What's Already Implemented:**
- ✅ RevenueCat SDK integrated (`react-native-purchases` v9.6.1)
- ✅ Service layer (`services/revenueCat.ts`)
- ✅ Subscription hook (`hooks/useSubscription.ts`)
- ✅ Feature access control
- ✅ Trial period logic
- ✅ Supabase sync for subscription tiers

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

### 2.1 Add iOS App
1. Go to **"Project Settings"** → **"Apps"**
2. Click **"+ New"** → **"iOS"**
3. Fill in:
   - **App Name:** `Courtster iOS`
   - **Bundle ID:** `com.courtster.mobile` (from `app.json`)
   - **Shared Secret:** Leave empty for now (we'll add after creating subscriptions)
4. Click **"Save"**
5. **Copy your iOS API Key** (starts with `appl_`)

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

### 3.1 Navigate to Products
1. In RevenueCat Dashboard: **"Products"** tab
2. Click **"+ New"**

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

Entitlements define what features users get with their subscription.

### 4.1 Create "Personal" Entitlement
1. Go to **"Entitlements"** tab
2. Click **"+ New"**
3. **Identifier:** `personal` (⚠️ must match code in `services/revenueCat.ts`)
4. **Display Name:** `Personal Features`
5. **Attached Products:** Select:
   - `personal_monthly`
   - `personal_yearly`
6. Click **"Save"**

### 4.2 Create "Club" Entitlement
1. Click **"+ New"**
2. **Identifier:** `club` (⚠️ must match code)
3. **Display Name:** `Club Features`
4. **Attached Products:** Select:
   - `club_monthly`
   - `club_yearly`
5. Click **"Save"**

---

## Step 5: Create Offerings

Offerings group products for display in your app.

### 5.1 Create Default Offering
1. Go to **"Offerings"** tab
2. Click **"+ New"**
3. **Identifier:** `default`
4. **Display Name:** `Default Offering`
5. **Description:** `Main subscription options`
6. Click **"Save"**

### 5.2 Add Packages to Default Offering
1. Click on **"default"** offering
2. Click **"+ Add Package"** for each:

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

### Test in Development

#### iOS Sandbox Testing
1. Create sandbox test account in App Store Connect
2. Sign out of production App Store on device
3. Run app on device (NOT simulator for purchases)
4. Trigger purchase flow
5. Sign in with sandbox account when prompted
6. Complete purchase

#### Android Test Accounts
1. Add test accounts in Google Play Console
2. Install app via internal testing track
3. Test purchase flow
4. Purchases are free for test accounts

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
