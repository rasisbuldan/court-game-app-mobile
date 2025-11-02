# Unimplemented Features & TODO Items

This document tracks features, functionality, and code that are either:
- Not yet implemented
- Using placeholder/mock behavior
- In active development
- Marked as "Coming Soon"

Last updated: 2025-10-31

---

## 1. Settings & Preferences

### 1.1 Notification Settings (No Backend Persistence)
**File:** `app/(tabs)/settings.tsx`
**Lines:** 35-41

Seven toggle settings exist in UI but have **no backend persistence**:
- ✅ UI Toggle exists
- ❌ Changes not saved to database
- ❌ No sync across devices
- ❌ Settings reset on app restart

**Settings:**
- Push Notifications
- Email Notifications
- Session Reminders
- Club Invites
- Match Results
- Sound Effects
- Dark Mode

**TODO:**
- [ ] Create `user_settings` table in Supabase
- [ ] Implement save/load hooks
- [ ] Add settings sync on app start
- [ ] Connect to actual notification system

---

### 1.2 Subscription Feature (Coming Soon)
**File:** `app/(tabs)/settings.tsx`
**Lines:** 58-64

**Current Behavior:**
- Tapping "Subscribe to Premium" shows toast: "Coming Soon"
- No pricing, payment, or subscription logic implemented

**TODO:**
- [ ] Design subscription tiers
- [ ] Integrate payment provider (Stripe/RevenueCat)
- [ ] Implement premium features
- [ ] Add subscription status checking
- [ ] Add restore purchases flow

---

## 2. Authentication & Profile

### 2.1 Profile Creation Debug Logging
**File:** `app/(tabs)/profile.tsx`
**Lines:** 96-127

**Issue:** Excessive console.log statements in profile loading logic

**TODO:**
- [ ] Remove or gate console logs behind DEBUG flag
- [ ] Use proper error reporting service

---

### 2.2 Edit Profile Functionality
**File:** `app/(tabs)/edit-profile.tsx`

**Implemented:**
- ✅ Display name editing
- ✅ Avatar upload from gallery
- ✅ Camera capture for avatar

**Partially Implemented:**
- ⚠️ Heavy logging during save/upload (lines 313, 373)

**TODO:**
- [ ] Clean up console logs
- [ ] Add form validation feedback
- [ ] Add image crop/resize before upload

---

## 3. Session Management

### 3.1 Create Session - Matchup Preferences
**File:** `app/(tabs)/create-session.tsx`
**Lines:** 879-891

**Issue:** Matchup preferences disabled for Mixed Mexicano when non-mixed option selected

**Current State:**
- Balanced matchups
- Minimize rematches
- Keep partnerships
- Group by skill level

**TODO:**
- [ ] Clarify UX for when these are disabled
- [ ] Add tooltip explaining why disabled
- [ ] Implement Mixed Mexicano-specific matchup logic

---

### 3.2 Reclub Import Service (Development State)
**File:** `services/reclubImportService.ts`
**Lines:** 41, 54, 58, 66, 78, 82, 93, 97, 175, 189

**Status:** ⚠️ Functional but with extensive debug logging

**Features:**
- ✅ Fetch Reclub session HTML
- ✅ Parse player names from HTML
- ✅ Validate session data
- ✅ Error handling

**Issues:**
- 10+ console.log statements throughout parsing logic
- Debug logs expose internal parsing details

**TODO:**
- [ ] Remove/gate console.log statements
- [ ] Add proper error reporting
- [ ] Consider using structured logging library
- [ ] Add unit tests for HTML parsing

---

### 3.3 Session Results Sharing
**File:** `components/session/ShareResultsModal.tsx`

**Implemented:**
- ✅ Copy shareable link: `https://courtster.app/result/{sessionId}`
- ✅ Native share dialog

**Not Implemented:**
- ❌ Public web page at `courtster.app/result/{sessionId}`
- ❌ Public results viewing without login
- ❌ Social media preview cards (OG tags)

**TODO:**
- [ ] Build web results page (in web package)
- [ ] Add Open Graph meta tags
- [ ] Implement public API endpoint for results
- [ ] Add privacy controls (public vs private sessions)

---

## 4. Club Management

### 4.1 Club Creation Hook (Heavy Logging)
**File:** `hooks/useClubs.ts`
**Lines:** 117-217

**Issue:** 15+ console.log statements throughout useCreateClub mutation

**TODO:**
- [ ] Remove console logs from production
- [ ] Use proper error tracking service
- [ ] Add structured logging for debugging

---

### 4.2 Club Creation Screen
**File:** `app/(tabs)/create-club.tsx`
**Lines:** 168-207

**Issue:** Mutation lifecycle logging in production code

**TODO:**
- [ ] Clean up console logs
- [ ] Add better user feedback for errors
- [ ] Implement form validation messages

---

## 5. Offline Support

### 5.1 Offline Queue System
**File:** `utils/offlineQueue.ts`
**Lines:** 31, 43, 63, 119, 123, 238

**Status:** ✅ Functional but with error logging

**Features:**
- ✅ Queue operations when offline
- ✅ Sync when back online
- ✅ AsyncStorage persistence

**Issues:**
- Multiple console.error statements
- No user notification when operations are queued

**TODO:**
- [ ] Add user-visible offline indicator
- [ ] Show toast when operations are queued
- [ ] Show sync progress when reconnecting
- [ ] Add retry logic with exponential backoff
- [ ] Implement conflict resolution for concurrent edits

---

## 6. Demo & Preview Files

### 6.1 Layout Preview Screens (13 Files)
**Purpose:** Design exploration and UI/UX testing

**Files:**
- `app/(tabs)/demo.tsx`
- `app/(tabs)/demo-nav.tsx`
- `app/(tabs)/session-demo.tsx`
- `app/(tabs)/create-session-demo.tsx`
- `app/(tabs)/leaderboard-demo.tsx`
- `app/(tabs)/head-to-head-demo.tsx`
- `app/(tabs)/partnerships-demo.tsx`
- `app/(tabs)/background-demo.tsx`
- `app/(tabs)/layout-previews.tsx`
- `components/demo/BackgroundVariants.tsx`
- `components/demo/HeadToHeadCardVariants.tsx`
- `components/demo/PartnershipCardVariants.tsx`
- `components/session/LeaderboardLayoutDemo.tsx`

**Status:** ✅ Hidden from production nav (href: null)

**TODO:**
- [ ] Decide: Keep for development or remove?
- [ ] If keeping: Gate behind feature flag
- [ ] If removing: Archive design decisions first

---

## 7. Error Handling & Logging

### 7.1 Excessive Console Logging

**Files with Heavy Logging:**
- `hooks/useClubs.ts` (15+ logs)
- `services/reclubImportService.ts` (10+ logs)
- `app/(tabs)/profile.tsx` (12+ logs)
- `app/(tabs)/create-club.tsx` (8+ logs)
- `utils/offlineQueue.ts` (6+ error logs)

**Issue:** ~57 console.error statements across codebase

**TODO:**
- [ ] Implement centralized logging service
- [ ] Use environment-based log levels
- [ ] Integrate error tracking (Sentry, LogRocket, etc.)
- [ ] Remove console.log from production builds
- [ ] Add proper error boundaries

---

## 8. Feature Flags & Environment

### 8.1 No Feature Flag System
**Issue:** Demo screens, debug logs, and experimental features mixed with production code

**TODO:**
- [ ] Implement feature flag system (LaunchDarkly, Unleash, or custom)
- [ ] Gate demo screens behind `ENABLE_DEMOS` flag
- [ ] Gate debug logging behind `DEBUG` flag
- [ ] Add environment detection (dev/staging/prod)

---

## 9. Testing & Quality

> **📋 For comprehensive testing strategy and roadmap, see [TESTING_STRATEGY.md](./TESTING_STRATEGY.md)**

### 9.1 Limited Test Coverage (~2%)

**Existing Tests:**
- ✅ `components/session/__tests__/LeaderboardTab.test.tsx` - Comprehensive (360 lines)
- ⚠️ `app/(tabs)/__tests__/settings.test.tsx` - Basic
- ⚠️ `app/(auth)/__tests__/login.test.tsx` - Basic
- ⚠️ `__tests__/platform-styling.test.tsx` - Basic

**Missing Tests (95%+ of code):**
- [ ] RoundsTab (score entry, critical)
- [ ] StatisticsTab
- [ ] EventHistoryTab
- [ ] Session creation flow
- [ ] Authentication flows (signup, password reset)
- [ ] Offline queue operations
- [ ] Reclub import parsing
- [ ] All hooks (useAuth, useSession, usePlayers, useClubs)
- [ ] All utilities (offlineQueue, etc.)
- [ ] Integration tests (0%)
- [ ] E2E tests (0%)

**TODO:**
- [ ] Implement Phase 1 of testing roadmap (30% coverage)
- [ ] Add test data factories
- [ ] Set up MSW for API mocking
- [ ] Add integration tests for critical flows
- [ ] Set up E2E tests with Maestro
- [ ] Configure CI/CD with test coverage reports
- [ ] Add visual regression testing
- [ ] Achieve 70% test coverage target

---

## 10. Performance & Optimization

### 10.1 Potential Performance Issues

**Large Lists:**
- Session list on home screen (no virtualization limit)
- Event history (no pagination)
- Leaderboard (renders all players)

**TODO:**
- [ ] Add pagination to event history
- [ ] Add virtual scrolling for large lists
- [ ] Implement data prefetching
- [ ] Add loading skeletons
- [ ] Optimize images (lazy loading, compression)

---

## 11. Security & Privacy

### 11.1 Missing Features

**TODO:**
- [ ] Add session privacy controls (public/private)
- [ ] Implement data export (GDPR compliance)
- [ ] Add account deletion flow
- [ ] Implement rate limiting for API calls
- [ ] Add input sanitization for user-generated content
- [ ] Review and update privacy policy

---

## 12. Push Notifications

### 12.1 Not Implemented

**Current State:**
- Settings toggle exists but does nothing
- No push notification infrastructure

**TODO:**
- [ ] Set up Expo push notification service
- [ ] Implement backend notification triggers
- [ ] Add notification preferences per notification type
- [ ] Handle notification deep linking
- [ ] Add notification history/inbox
- [ ] Implement badge counts

---

## 13. Localization & Accessibility

### 13.1 Hardcoded Strings

**Issue:** All UI text is hardcoded in English

**TODO:**
- [ ] Extract strings to i18n files
- [ ] Add multi-language support
- [ ] Add RTL layout support
- [ ] Add accessibility labels
- [ ] Test with VoiceOver/TalkBack
- [ ] Add font scaling support

---

## 14. Analytics & Monitoring

### 14.1 No Analytics

**TODO:**
- [ ] Integrate analytics (Mixpanel, Amplitude, etc.)
- [ ] Track key user flows
- [ ] Add crash reporting
- [ ] Add performance monitoring
- [ ] Set up custom events
- [ ] Create analytics dashboard

---

## Priority Recommendations

### High Priority (Ship Blockers)
1. ✅ Remove all console.log statements from production
2. ⚠️ Implement settings persistence (user experience issue)
3. ⚠️ Add proper error tracking service
4. ⚠️ Decide on demo files (remove or feature flag)

### Medium Priority (User Experience)
5. ⚠️ Add offline indicator and sync feedback
6. ⚠️ Implement push notifications
7. ⚠️ Add public results page
8. ⚠️ Improve error messages and validation

### Low Priority (Nice to Have)
9. Add subscription feature
10. Add analytics tracking
11. Improve test coverage
12. Add localization

---

## How to Use This Document

**When adding new features:**
1. Check if it's listed here first
2. Update status when implementing
3. Remove item when fully complete

**Before releases:**
1. Review high priority items
2. Ensure no blockers remain
3. Test features marked as "partially implemented"

**For new contributors:**
- This document shows what needs work
- Check TODOs for good first issues
- Ask maintainers before starting large items

---

## Contributing

To update this document:
1. Add new items as you discover them
2. Update status when making progress
3. Remove completed items
4. Keep priority sections updated
5. Run date in header: `YYYY-MM-DD`
