# Testing Checklist - Courtster Mobile

## Device Targets
- **iPhone 14/15 Pro** (iOS 18)
- **Samsung Galaxy S24** (Android 15)

## Critical Fixes Applied

### ✅ Fixed Issues
1. **React Version Compatibility**
   - ❌ Was: React 19.1.0 (incompatible with Expo 54)
   - ✅ Fixed: React 18.3.1 (stable with Expo 54)

2. **React Native Version**
   - ❌ Was: 0.81.4 (doesn't exist)
   - ✅ Fixed: 0.76.5 (correct for Expo SDK 54)

3. **Missing expo-build-properties**
   - ✅ Added: Required for iOS/Android SDK configurations

4. **Babel Configuration**
   - ✅ Fixed: Correct plugin order (nativewind before reanimated)

5. **Metro Bundler - Monorepo Support**
   - ✅ Added: Custom resolver for `@courtster/shared` workspace package
   - ✅ Fixed: Proper watch folders for hot reload

6. **SafeArea for iPhone 14/15 Pro Notch**
   - ✅ Fixed: Increased top padding from pt-12 to pt-16
   - ✅ Added: SafeAreaProvider in root layout

7. **Android Back Button**
   - ✅ Configured: Predictive back gesture enabled
   - ✅ Set: softwareKeyboardLayoutMode to "pan"

8. **Template Cleanup**
   - ✅ Removed: Old App.tsx and index.ts (using Expo Router entry)

## Pre-Flight Checklist

### Before First Run

```bash
# 1. Install dependencies (from root)
cd /home/stoorm/github/court-game-app
pnpm install

# 2. Set up environment variables
cd packages/mobile
cp .env.example .env
# Edit .env with your Supabase credentials

# 3. Verify package.json dependencies are installed
pnpm install

# 4. Clear any Metro cache
pnpm start --clear
```

### Environment Variables Required

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhb...your_key_here
EXPO_PUBLIC_AUTH_REDIRECT_URL=courtster://auth/callback
```

## Testing on iPhone 14/15 Pro

### iOS Specific Features to Test

#### 1. SafeArea & Notch Handling
- [ ] Status bar doesn't overlap content
- [ ] Header has proper top padding (should be below notch)
- [ ] Bottom tab bar clears home indicator
- [ ] Modal sheets respect safe areas

#### 2. Dynamic Island (iPhone 14 Pro+)
- [ ] App content doesn't get hidden by Dynamic Island
- [ ] Status bar height adjusts correctly

#### 3. Gestures
- [ ] Swipe back to previous screen works
- [ ] Pull-to-refresh on lists works
- [ ] Modal dismiss with swipe down works

#### 4. Keyboard
- [ ] Keyboard doesn't cover input fields
- [ ] Dismisses when tapping outside
- [ ] Return key behavior correct (next field, submit, etc.)

### iOS Test Flow

```bash
# Start metro bundler
cd packages/mobile
pnpm start

# In another terminal, run on iOS
pnpm ios

# Or use physical device
# 1. Install Expo Go from App Store
# 2. Scan QR code from terminal
```

**Expected Screens:**
1. ✅ Login screen loads
2. ✅ Can create account / sign in
3. ✅ Redirects to home screen
4. ✅ Can navigate to create tournament (modal)
5. ✅ Can sign out

## Testing on Samsung S24

### Android Specific Features to Test

#### 1. Edge-to-Edge Display
- [ ] Content extends to screen edges
- [ ] Status bar translucent (not transparent)
- [ ] Navigation bar properly styled

#### 2. Material You / Dynamic Colors (Android 15)
- [ ] App respects system theme (light/dark)
- [ ] Colors are consistent

#### 3. Predictive Back Gesture
- [ ] Swipe from left edge shows preview
- [ ] Release completes navigation
- [ ] Cancel gesture if not swiped far enough

#### 4. Hardware Back Button
- [ ] Back button navigates correctly
- [ ] Double-tap exits app from home screen
- [ ] Modal closes on back button

#### 5. Permissions (Android 15)
- [ ] Camera permission request works (if used)
- [ ] Storage permission request works (if used)

### Android Test Flow

```bash
# Ensure Android emulator or device is running
adb devices

# Start metro bundler
cd packages/mobile
pnpm start

# In another terminal, run on Android
pnpm android

# Or use physical device
# 1. Install Expo Go from Play Store
# 2. Scan QR code (use camera or Expo Go scanner)
```

**Expected Screens:**
1. ✅ Login screen loads
2. ✅ Can create account / sign in
3. ✅ Redirects to home screen
4. ✅ Can navigate to create tournament
5. ✅ Can use hardware back button
6. ✅ Can sign out

## Common Issues & Solutions

### Issue: "Unable to resolve module @courtster/shared"

**Solution:**
```bash
# Clear Metro cache
cd packages/mobile
pnpm start --reset-cache

# Or manually clear
rm -rf .expo node_modules
pnpm install
pnpm start --clear
```

### Issue: "Invariant Violation: requireNativeComponent"

**Solution:**
```bash
# Reinstall native dependencies
cd packages/mobile
rm -rf node_modules ios/Pods
pnpm install
cd ios && pod install && cd ..
pnpm ios
```

### Issue: Tailwind classes not working

**Solution:**
```bash
# Verify global.css is imported in _layout.tsx
# Check babel.config.js has nativewind/babel plugin
# Restart Metro with --clear flag
pnpm start --clear
```

### Issue: App crashes on launch

**Solution:**
```bash
# Check for syntax errors
cd packages/mobile
pnpm typecheck

# Check Metro logs
pnpm start

# Look for red error screen on device
```

### Issue: Can't connect to Supabase

**Solution:**
```bash
# Verify .env file exists and has correct values
cat .env

# Restart Expo to pick up env changes
pnpm start --clear

# Check network connectivity on emulator/device
```

## Performance Testing

### Metrics to Check

#### iPhone 14/15 Pro
- [ ] App launches in < 3 seconds (dev mode)
- [ ] Smooth 60fps scrolling on FlatLists
- [ ] No frame drops during navigation
- [ ] Keyboard appears/dismisses smoothly

#### Samsung S24
- [ ] App launches in < 3 seconds (dev mode)
- [ ] Smooth 120fps scrolling (S24 supports 120Hz)
- [ ] No frame drops during navigation
- [ ] Animations are smooth

### Memory Usage
- [ ] No memory leaks (use dev tools)
- [ ] App doesn't crash with large tournament lists
- [ ] Images load without OOM errors

## Functional Testing

### Authentication
- [ ] Email/password login works
- [ ] Email/password signup works
- [ ] Invalid credentials show error
- [ ] Session persists after app restart
- [ ] Sign out works

### Home Screen
- [ ] Tournament list loads
- [ ] Pull to refresh works
- [ ] Empty state shows correctly
- [ ] Can tap to view tournament
- [ ] Create button opens modal

### Session Screen
- [ ] Session details load
- [ ] Leaderboard displays correctly
- [ ] Player stats are accurate
- [ ] Back button returns to home

### Offline Behavior
- [ ] Cached data shows when offline
- [ ] Graceful error messages for mutations
- [ ] Data syncs when back online

## Accessibility Testing

- [ ] Screen reader compatible (VoiceOver/TalkBack)
- [ ] Touch targets are 44x44pt minimum
- [ ] Text is readable (sufficient contrast)
- [ ] Font scales with system settings

## Checklist Summary

### Before Submitting for Review

- [ ] All critical fixes applied
- [ ] Dependencies updated to correct versions
- [ ] Environment variables documented
- [ ] Tested on physical iPhone 14/15 Pro
- [ ] Tested on physical Samsung S24 (or emulator)
- [ ] No console errors or warnings
- [ ] TypeScript compiles without errors
- [ ] All core flows work (auth, home, session)
- [ ] Performance is acceptable
- [ ] App doesn't crash

## Known Limitations (Current Phase)

### Not Yet Implemented
- ❌ Full session screen with tabs (Rounds, Statistics, History)
- ❌ Score entry interface
- ❌ Round generation
- ❌ Tournament creation wizard
- ❌ Session sharing with PIN
- ❌ Push notifications
- ❌ Live Activities (iOS)
- ❌ Widgets

### Working Features
- ✅ Authentication (email/password)
- ✅ Home screen with tournament list
- ✅ Basic session view (leaderboard preview)
- ✅ Offline caching
- ✅ Navigation
- ✅ Sign out

## Next Steps After Verification

1. **If tests pass**: Proceed with implementing full session screen
2. **If tests fail**: Document issues and fix before continuing
3. **Performance issues**: Profile with React DevTools and optimize
4. **Crashes**: Use error boundary and logging to identify root cause

---

**Testing Status**: Ready for initial testing
**Last Updated**: October 21, 2025
**Test Coverage**: Core flows (auth, navigation, data fetching)
