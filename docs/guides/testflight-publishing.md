# TestFlight Publishing Plan

**Date Created:** 2025-11-02
**Target Platform:** iOS (TestFlight)
**Status:** Pre-Production
**Apple Developer Account:** ✅ Active

---

## 📋 Table of Contents

1. [Prerequisites Checklist](#prerequisites-checklist)
2. [Pre-Launch Requirements](#pre-launch-requirements)
3. [App Store Connect Setup](#app-store-connect-setup)
4. [Build & Configuration](#build--configuration)
5. [TestFlight Submission Process](#testflight-submission-process)
6. [Beta Testing Strategy](#beta-testing-strategy)
7. [Troubleshooting Common Issues](#troubleshooting-common-issues)
8. [Production Launch Preparation](#production-launch-preparation)

---

## 1. Prerequisites Checklist

### Apple Developer Account Requirements

- [x] **Apple Developer Account Active** ($99/year)
- [ ] **Team Admin Access** (verify role)
- [ ] **App ID Created** (com.courtster.mobile or similar)
- [ ] **Certificates & Provisioning Profiles**
  - [ ] iOS Distribution Certificate
  - [ ] App Store Provisioning Profile
  - [ ] Push Notification Certificate (if using notifications)

### Development Environment

- [ ] **Xcode 15+** installed
- [ ] **Expo Account** created and logged in
- [ ] **EAS CLI** installed globally
- [ ] **Mac with macOS 13+** (required for iOS builds)
- [ ] **Valid bundle identifier** in app.json

### Project Requirements

- [ ] **Environment variables** configured
- [ ] **App icons** in all required sizes
- [ ] **Splash screen** configured
- [ ] **Privacy Policy URL** ready
- [ ] **Support URL** ready
- [ ] **Terms of Service URL** ready

---

## 2. Pre-Launch Requirements

### Critical Issues to Fix First

Based on `COMPREHENSIVE_ANALYSIS_2025.md`, these **MUST** be resolved:

#### 🔴 Critical Issues (BLOCK TestFlight)

1. **Auth Navigation Loop Risk**
   - **File:** `hooks/useAuth.tsx:45-67`
   - **Issue:** Potential infinite redirect loop
   - **Fix Required:** Add navigation guards
   - **Estimated Time:** 2 hours

2. **Profile Creation Silent Failure**
   - **File:** `hooks/useAuth.tsx:125-145`
   - **Issue:** Failed profile creation doesn't rollback auth
   - **Fix Required:** Add transaction rollback
   - **Estimated Time:** 1 hour

3. **Missing Error Boundary**
   - **Issue:** App crashes without error recovery
   - **Fix Required:** Add app-wide error boundary
   - **Estimated Time:** 1 hour

#### 🟠 High Priority (Should Fix Before TestFlight)

1. **Console Logging Removal**
   - **Issue:** 191 console.log instances exposing data
   - **Fix Required:** Implement logger utility
   - **Estimated Time:** 2 days

2. **Performance Testing**
   - **Issue:** Not tested with 50+ players
   - **Fix Required:** Load testing
   - **Estimated Time:** 4 hours

3. **Offline Mode Validation**
   - **Issue:** Edge cases not fully tested
   - **Fix Required:** Complete offline testing
   - **Estimated Time:** 3 hours

### Code Quality Gates

```bash
# Must pass before submission
yarn typecheck          # ✅ Should have minimal errors
yarn test              # ✅ Core tests passing
yarn test:coverage     # 🎯 Target: 40%+ coverage

# Recommended
yarn lint              # Fix all linting errors
```

### Security Checklist

- [ ] **No API keys in code** (use environment variables)
- [ ] **Supabase RLS policies enabled**
- [ ] **HTTPS for all API calls**
- [ ] **No sensitive data in console logs**
- [ ] **Input validation on all forms**
- [ ] **Rate limiting on mutations**

---

## 3. App Store Connect Setup

### Step 1: Create App in App Store Connect

1. **Go to:** https://appstoreconnect.apple.com
2. **Navigate:** My Apps → + (New App)
3. **Fill in:**
   ```
   Platform: iOS
   Name: Courtster
   Primary Language: English (U.S.)
   Bundle ID: com.courtster.mobile (or your chosen ID)
   SKU: COURTSTER-001 (unique identifier)
   User Access: Full Access
   ```

### Step 2: App Information

#### Required Fields:

**Subtitle** (30 characters max):
```
Padel & Tennis Tournament Manager
```

**Description** (4000 characters max):
```
Courtster is the ultimate tournament management app for Padel and Tennis enthusiasts.
Organize Mexicano-style tournaments with ease, track player statistics, and manage
matches in real-time.

FEATURES:
• Create & manage Mexicano and Americano tournaments
• Support for Padel and Tennis
• Real-time score tracking
• Advanced player statistics
• Partnership analytics
• Head-to-head records
• Activity calendar
• Offline mode support
• Share results with participants

TOURNAMENT MODES:
• Random Partner: New partnerships every round
• Fixed Partner: Permanent teams throughout
• Mexicano: Dynamic player rotation
• Americano: Classic round-robin format

STATISTICS:
• Win rates and match history
• Partnership performance
• Head-to-head matchups
• Activity tracking
• Performance trends

Perfect for clubs, friends, and competitive players looking to organize
professional-quality tournaments.
```

**Keywords** (100 characters max):
```
padel,tennis,tournament,mexicano,americano,sports,match,score,statistics,club
```

**Support URL:**
```
https://courtster.app/support (or create support page)
```

**Marketing URL** (optional):
```
https://courtster.app
```

**Privacy Policy URL:**
```
https://courtster.app/privacy (REQUIRED - must create)
```

### Step 3: Pricing & Availability

```
Price: Free
Availability: All Countries
```

### Step 4: App Privacy

**Data Collection:** (Based on current implementation)

- [x] **Contact Info**
  - Email Address (for authentication)
  - Purpose: App Functionality, Account Management

- [x] **User Content**
  - Photos (profile avatars)
  - Purpose: App Functionality

- [x] **Identifiers**
  - User ID
  - Purpose: App Functionality, Analytics

- [x] **Usage Data**
  - Product Interaction
  - Purpose: Analytics, App Functionality

**Data Linked to User:** Yes
**Data Used to Track User:** No (unless analytics added)

### Step 5: Age Rating

```
Age Rating: 4+ (No objectionable content)
```

---

## 4. Build & Configuration

### Step 1: Update app.json

```json
{
  "expo": {
    "name": "Courtster",
    "slug": "courtster-mobile",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#EF4444"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.courtster.mobile",
      "buildNumber": "1",
      "infoPlist": {
        "NSCameraUsageDescription": "Courtster needs access to your camera to upload profile photos.",
        "NSPhotoLibraryUsageDescription": "Courtster needs access to your photo library to select profile photos."
      },
      "config": {
        "usesNonExemptEncryption": false
      }
    },
    "extra": {
      "eas": {
        "projectId": "YOUR_PROJECT_ID_HERE"
      }
    },
    "runtimeVersion": {
      "policy": "appVersion"
    }
  }
}
```

### Step 2: Create eas.json

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false,
        "resourceClass": "m-medium"
      }
    },
    "production": {
      "distribution": "store",
      "ios": {
        "resourceClass": "m-medium"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@email.com",
        "ascAppId": "REPLACE_WITH_APP_STORE_CONNECT_ID",
        "appleTeamId": "REPLACE_WITH_TEAM_ID"
      }
    }
  }
}
```

### Step 3: Install EAS CLI

```bash
npm install -g eas-cli

# Login to Expo
eas login

# Configure project
eas build:configure
```

### Step 4: Create App Icons

**Required Sizes for iOS:**

| Size | Purpose |
|------|---------|
| 1024x1024 | App Store |
| 180x180 | iPhone App Icon |
| 120x120 | iPhone App Icon @2x |
| 167x167 | iPad Pro |
| 152x152 | iPad |
| 76x76 | iPad |
| 60x60 | iPhone Spotlight |
| 40x40 | iPhone Spotlight @2x |

**Tool to Generate:**
```bash
# Use expo-optimize or online tools
npx expo-optimize
```

### Step 5: Create Splash Screen

**Recommended Dimensions:** 1242x2688 (iPhone 12 Pro Max)

---

## 5. TestFlight Submission Process

### Step 1: Build for Production

```bash
# Navigate to mobile package
cd packages/mobile

# Build iOS app for TestFlight
eas build --platform ios --profile production

# Expected output:
# ✔ Build ID: abc123...
# ✔ Build URL: https://expo.dev/...
# ⏳ Waiting for build to complete...
```

**Build Time:** 10-20 minutes
**Monitor:** https://expo.dev/accounts/[your-account]/projects/courtster-mobile/builds

### Step 2: Download & Verify Build

```bash
# Build completes, EAS provides .ipa file
# Download and verify locally (optional)

# Check build details
eas build:view [BUILD_ID]
```

### Step 3: Submit to App Store Connect

**Option A: Automatic Submission (Recommended)**

```bash
eas submit --platform ios --latest
```

**Option B: Manual Upload**

1. Download .ipa from EAS
2. Open Xcode → Organizer
3. Drag .ipa to Organizer
4. Click "Distribute App"
5. Select "TestFlight & App Store"

### Step 4: Complete App Store Connect Setup

1. **Go to:** App Store Connect → TestFlight tab
2. **Wait for processing** (5-30 minutes)
3. **Add Test Information:**

   ```
   Beta App Description:
   Test build of Courtster - Tournament management app for Padel/Tennis.

   Please test:
   - Creating tournaments
   - Score entry
   - Statistics viewing
   - Offline mode
   - Profile management

   Feedback Email: beta@courtster.app
   ```

4. **Export Compliance:**
   - Uses Encryption: Yes (HTTPS)
   - Exempt from Export Compliance: Yes (standard HTTPS only)

### Step 5: Internal Testing (Optional but Recommended)

**Add Internal Testers:**
1. TestFlight → Internal Testing → Add Testers
2. Select team members with Apple IDs
3. Automatically approved (no review needed)

**Test Internally First:**
- Basic functionality works
- No immediate crashes
- Auth flow completes
- Core features accessible

### Step 6: Submit for Beta App Review

**Required for External Testing:**

1. **Add Test Information** (required)
2. **Add Screenshot** (at least one)
3. **Add Beta App Description**
4. **Submit for Review**

**Review Time:** 24-48 hours

---

## 6. Beta Testing Strategy

### Internal Testing Group (Team Members)

**Size:** 5-10 people
**Duration:** 1 week
**Focus:** Critical bugs, crashes, core functionality

**Checklist:**
- [ ] App launches successfully
- [ ] Login/signup works
- [ ] Create session works
- [ ] Score entry functional
- [ ] Statistics display correctly
- [ ] No immediate crashes
- [ ] Offline mode basic test

### External Testing Group (Beta Testers)

**Size:** 25-50 people
**Duration:** 2-3 weeks
**Focus:** Real-world usage, edge cases, feedback

**Recruitment:**
- Friends who play Padel/Tennis
- Local club members
- Social media announcement
- TestFlight public link (optional)

**Feedback Collection:**
```
Create Google Form:
1. What device/iOS version?
2. What features did you test?
3. Did you encounter any bugs?
4. What was confusing?
5. What would you improve?
6. Would you use this app regularly?
7. Additional comments
```

### Testing Scenarios

**Scenario 1: Quick Tournament**
1. Sign up with email
2. Create 8-player Mexicano tournament
3. Play 3 rounds
4. Enter scores for all matches
5. Check leaderboard
6. View statistics

**Scenario 2: Advanced Features**
1. Create tournament with custom settings
2. Add late player mid-session
3. Switch player during match
4. Test offline mode
5. Upload profile photo
6. Share results

**Scenario 3: Edge Cases**
1. Create tournament with odd number of players
2. Test with 50+ players
3. Play 20+ rounds
4. Force app offline mid-round
5. Multiple devices same session

---

## 7. Troubleshooting Common Issues

### Issue 1: Build Fails

**Error:** `EOPNOTSUPP: operation not supported on socket`

**Solution:**
```bash
# Clear Expo cache
expo start -c

# Clear Metro cache
rm -rf node_modules/.cache

# Rebuild
eas build --platform ios --clear-cache
```

### Issue 2: Code Signing Error

**Error:** `No valid code signing certificates found`

**Solution:**
1. Go to Apple Developer → Certificates
2. Create new iOS Distribution Certificate
3. Download and double-click to install
4. Retry build

### Issue 3: Provisioning Profile Error

**Error:** `No provisioning profile found`

**Solution:**
```bash
# Let EAS manage credentials (recommended)
eas credentials

# Or manually create in Apple Developer Portal
```

### Issue 4: Build Takes Too Long

**Solution:**
```bash
# Use faster resource class (costs more)
# Update eas.json:
"production": {
  "ios": {
    "resourceClass": "m-large"  // or m-xlarge
  }
}
```

### Issue 5: TestFlight Stuck in Processing

**Causes:**
- Binary issue (rare)
- Export compliance not set
- Missing app icon

**Solution:**
1. Wait 30+ minutes
2. Check App Store Connect for errors
3. Verify all required fields filled
4. Try re-submitting build

---

## 8. Production Launch Preparation

### Pre-Launch Checklist

#### App Quality
- [ ] All critical bugs fixed from beta
- [ ] Performance tested with large datasets
- [ ] Tested on iPhone 12, 13, 14, 15 models
- [ ] Tested on iOS 15, 16, 17
- [ ] Offline mode fully functional
- [ ] Error handling graceful
- [ ] Loading states everywhere

#### Content Requirements
- [ ] **Screenshots** (6.7", 6.5", 5.5" required)
  - At least 3 screenshots per size
  - Show key features
  - No placeholder content

- [ ] **App Preview Video** (optional but recommended)
  - 15-30 seconds
  - Show core functionality

- [ ] **App Icon** finalized (1024x1024)

- [ ] **Description** reviewed and polished

#### Legal Requirements
- [ ] **Privacy Policy** published at URL
- [ ] **Terms of Service** published
- [ ] **EULA** (if custom terms needed)
- [ ] **Support email** active and monitored
- [ ] **Support page** created

#### Backend Readiness
- [ ] **Production Supabase** project configured
- [ ] **Database backups** enabled
- [ ] **RLS policies** reviewed and tested
- [ ] **API rate limits** set
- [ ] **Storage quotas** configured
- [ ] **Error monitoring** (Sentry) set up

#### Analytics & Monitoring
- [ ] **Analytics** configured (Amplitude/Mixpanel)
- [ ] **Crash reporting** enabled
- [ ] **Key events** tracked
- [ ] **User properties** defined

### App Store Review Guidelines Compliance

**Must Comply With:**

1. **Guideline 2.1:** App completeness
   - App must be fully functional
   - No placeholder content
   - All features work as described

2. **Guideline 4.0:** Design
   - Follow iOS HIG (Human Interface Guidelines)
   - No private APIs
   - Native iOS look and feel

3. **Guideline 5.1.1:** Data Collection
   - Privacy policy required
   - Clear data usage disclosure
   - User consent for tracking

**Common Rejection Reasons to Avoid:**

- Crashes on launch
- Broken links in app
- Missing privacy policy
- Placeholder content
- Requires login with no demo account
- Missing features from description

### Demo Account for Review

**Create Test Account:**
```
Email: demo@courtster.app
Password: DemoCourtster2024!

Pre-populated with:
- 2 completed sessions
- 10 players
- Statistics to review
```

**Add to App Review Information:**
```
Demo Account Username: demo@courtster.app
Demo Account Password: DemoCourtster2024!

Notes for Reviewer:
This is a tournament management app for Padel/Tennis.
To test, create a new session with the + button.
The demo account has sample data pre-loaded.
```

---

## 9. Step-by-Step TestFlight Submission

### Complete Command Sequence

```bash
# 1. Ensure you're in the right directory
cd /Users/rasis/github/court-game-app/packages/mobile

# 2. Update version (if needed)
# Edit app.json: "version": "1.0.0" → "1.0.1"

# 3. Install EAS CLI (if not already)
npm install -g eas-cli

# 4. Login to Expo
eas login

# 5. Configure EAS (first time only)
eas build:configure

# 6. Build for iOS production
eas build --platform ios --profile production

# 7. Wait for build to complete (10-20 min)
# Monitor at: https://expo.dev

# 8. Submit to App Store Connect
eas submit --platform ios --latest

# 9. Monitor submission
# Check App Store Connect for processing status
```

### After Submission

1. **Check Email:** Apple sends confirmation emails
2. **Monitor App Store Connect:** TestFlight tab
3. **Processing Time:** 5-30 minutes
4. **Review Time (External):** 24-48 hours
5. **Add Testers:** Once approved
6. **Send Invites:** TestFlight handles emails

---

## 10. Timeline Estimate

### Optimistic Timeline (Best Case)

| Phase | Duration | Total Time |
|-------|----------|------------|
| Fix critical issues | 4 hours | 4h |
| Create assets (icons, splash) | 2 hours | 6h |
| App Store Connect setup | 1 hour | 7h |
| First build & submit | 1 hour | 8h |
| Build processing | 20 min | 8h 20m |
| Internal testing | 3 days | 3d 8h |
| External beta review | 2 days | 5d 8h |
| Beta testing | 2 weeks | 2w 5d |
| Fix beta feedback | 1 week | 3w 5d |
| Production submission | 1 hour | 3w 5d 1h |
| App Store review | 2-5 days | 4w 3d |

**Total to Production:** ~4 weeks

### Realistic Timeline (With Buffer)

| Phase | Duration | Total Time |
|-------|----------|------------|
| Fix critical issues | 1 week | 1w |
| Create assets & content | 3 days | 1w 3d |
| App Store Connect setup | 1 day | 1w 4d |
| First build & troubleshooting | 1 day | 1w 5d |
| Internal testing | 1 week | 2w 5d |
| External beta review | 3 days | 3w 1d |
| Beta testing | 3 weeks | 6w 1d |
| Fix beta feedback | 2 weeks | 8w 1d |
| Production submission prep | 3 days | 8w 4d |
| App Store review | 5-7 days | 9-10w |

**Total to Production:** ~9-10 weeks

---

## 11. Cost Breakdown

### Required Costs

- **Apple Developer Account:** $99/year (already paid)
- **EAS Build Credits:**
  - Free tier: Limited builds/month
  - Production: ~$29/month (recommended)
  - On-demand: $29/build

### Optional Costs

- **Error Monitoring (Sentry):** $26/month (recommended)
- **Analytics (Amplitude):** Free tier available
- **Domain for Privacy Policy:** $12/year
- **Design Assets (if outsourced):** $50-200

**Estimated First Month:** $50-100 (beyond Apple Developer fee)

---

## 12. Success Criteria

### TestFlight Ready
- [ ] App builds successfully
- [ ] Passes internal testing
- [ ] No crash-on-launch bugs
- [ ] Core features functional
- [ ] Submitted to TestFlight

### Beta Testing Success
- [ ] 25+ active beta testers
- [ ] <5% crash rate
- [ ] >4.0 average feedback rating
- [ ] All critical bugs fixed
- [ ] Performance validated

### Production Ready
- [ ] All beta feedback addressed
- [ ] Legal pages published
- [ ] Demo account created
- [ ] Screenshots prepared
- [ ] App Store description finalized
- [ ] Passes App Store review

---

## 13. Next Immediate Steps

### This Week (Priority 1)

1. **Fix Critical Issues (4-8 hours)**
   ```bash
   # Create branch for TestFlight prep
   git checkout -b testflight-prep

   # Fix:
   - Auth navigation loop
   - Profile creation rollback
   - Add error boundary
   ```

2. **Create App Assets (2-4 hours)**
   - App icon in all sizes
   - Splash screen
   - Screenshots (can use simulator)

3. **Environment Setup (1-2 hours)**
   ```bash
   npm install -g eas-cli
   eas login
   eas build:configure
   ```

### Next Week (Priority 2)

4. **App Store Connect Setup (2-3 hours)**
   - Create app listing
   - Fill in all metadata
   - Set up TestFlight

5. **First Build & Submit (1-2 hours)**
   ```bash
   eas build --platform ios --profile production
   eas submit --platform ios --latest
   ```

6. **Internal Testing (Ongoing)**
   - Add 5-10 team members
   - Test core functionality
   - Document bugs

---

## 14. Resources & Documentation

### Official Documentation
- [Expo EAS Build](https://docs.expo.dev/build/introduction/)
- [Expo EAS Submit](https://docs.expo.dev/submit/introduction/)
- [App Store Connect Help](https://developer.apple.com/app-store-connect/)
- [TestFlight Documentation](https://developer.apple.com/testflight/)
- [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)

### Helpful Tools
- [App Icon Generator](https://www.appicon.co/)
- [Screenshot Generator](https://www.screenshots.pro/)
- [Privacy Policy Generator](https://www.termsfeed.com/privacy-policy-generator/)
- [App Store Optimization](https://www.apptamin.com/aso/)

### Support Contacts
- **Expo Support:** https://expo.dev/support
- **Apple Developer Support:** https://developer.apple.com/contact/
- **Community:** Expo Discord, Stack Overflow

---

## 15. Risk Mitigation

### High-Risk Areas

**Risk 1: App Store Rejection**
- **Probability:** Medium
- **Impact:** High (2-5 day delay)
- **Mitigation:**
  - Follow guidelines strictly
  - Test demo account
  - Complete all metadata
  - Address beta feedback

**Risk 2: Critical Bug in Production**
- **Probability:** Medium
- **Impact:** Very High (user experience)
- **Mitigation:**
  - Comprehensive beta testing
  - Error monitoring (Sentry)
  - Rollback plan (OTA updates)
  - Support email monitoring

**Risk 3: Performance Issues at Scale**
- **Probability:** Low-Medium
- **Impact:** High
- **Mitigation:**
  - Load testing before launch
  - Database indexing
  - Monitoring dashboards
  - Gradual rollout

**Risk 4: Backend Capacity**
- **Probability:** Low
- **Impact:** Critical
- **Mitigation:**
  - Supabase monitoring
  - Auto-scaling configured
  - Backup strategy
  - Rate limiting

---

## Conclusion

This plan provides a comprehensive roadmap to TestFlight and production launch. The key is to:

1. **Fix critical issues first** (don't skip this)
2. **Test thoroughly internally** before external beta
3. **Collect and act on feedback** from beta testers
4. **Prepare all assets and content** professionally
5. **Follow Apple guidelines** strictly

**Recommended Start Date:** After fixing critical issues from Phase 1
**Target TestFlight Date:** 2 weeks from start
**Target Production Date:** 8-10 weeks from start

Good luck with your launch! 🚀
