# Known Issues & Workarounds

**Last Updated**: 2025-10-29
**Status**: Pre-device testing

---

## 🔴 **CRITICAL** (Blocks Production)

### None Currently
✅ All critical functionality working

---

## 🟡 **HIGH** (Should Fix Soon)

### 1. Supabase Type Definitions Missing
**Component**: Multiple files (profile.tsx, session/[id].tsx)
**Error**:
```
Property 'display_name' does not exist on type 'never'
Property 'duration_hours' does not exist on type 'never'
...10+ similar errors
```

**Impact**: TypeScript errors in IDE, but functionality works

**Root Cause**: Mobile package doesn't have generated Supabase types

**Workaround**: Ignore TypeScript errors for now

**Fix**:
```bash
npx supabase gen types typescript \
  --project-id YOUR_PROJECT_ID \
  > src/types/database.types.ts
```

**ETA**: 30 minutes when ready to fix

---

### 2. Jest Tests Fail with Expo Imports
**Component**: All test files
**Error**:
```
Cannot find module 'react-native/Libraries/Animated/NativeAnimatedHelper'
ReferenceError: You are trying to import a file after the Jest environment has been torn down
```

**Impact**: Can't run automated tests

**Root Cause**: Jest-Expo preset incompatibility

**Workaround**: Use manual testing + TypeScript for validation

**Potential Fix Options**:
1. Update jest-expo to latest version
2. Configure custom module mapper
3. Switch to Detox for E2E testing
4. Accept manual testing approach

**Status**: Deprioritized - manual testing sufficient

---

## 🟢 **MEDIUM** (Nice to Fix)

### 3. Profile Avatar Upload Placeholder
**Component**: app/(tabs)/profile.tsx (lines 460-467)
**Issue**: Avatar image doesn't display, only User icon shows

**Code**:
```typescript
{profile.avatar_url ? (
  <View className="w-full h-full">
    {/* You'll need to add Image component from react-native for this */}
    <User color="#fff" size={40} />
  </View>
) : (
  <User color="#fff" size={40} />
)}
```

**Impact**: Users can upload avatars but can't see them

**Workaround**: Comment indicates Image component needed

**Fix**:
```typescript
import { Image } from 'react-native';

{profile.avatar_url ? (
  <Image
    source={{ uri: profile.avatar_url }}
    style={{ width: '100%', height: '100%' }}
    resizeMode="cover"
  />
) : (
  <User color="#fff" size={40} />
)}
```

**ETA**: 5 minutes

---

### 4. Activity Calendar Month Labels Overlap
**Component**: app/(tabs)/profile.tsx (calendar rendering)
**Issue**: Month labels can overlap on small screens

**Impact**: Minor visual issue on compact devices

**Workaround**: None needed, still readable

**Fix**: Add collision detection or use week numbers instead

**ETA**: 15 minutes

---

### 5. StatisticsWidgets Empty State Styling
**Component**: components/session/widgets/StatisticsWidgets.tsx
**Issue**: Empty states could have better visual design

**Impact**: Functional but could be prettier

**Suggestion**: Add illustrations or icons for empty states

**ETA**: 30 minutes for all 5 widgets

---

## 🔵 **LOW** (Future Enhancement)

### 6. No Dark Mode Support
**Component**: All components
**Status**: Not implemented

**Impact**: App always uses light theme

**Future**: Add dark mode with useColorScheme() hook

---

### 7. Limited Accessibility Features
**Component**: Multiple components
**Missing**:
- Screen reader labels
- Accessible form validation
- Keyboard navigation
- High contrast mode

**Future**: Accessibility audit and improvements

---

### 8. No Offline Banner
**Component**: App-wide
**Issue**: Users don't know when they're offline

**Current**: Offline queue works silently

**Future**: Add banner showing "Offline - changes will sync when online"

---

### 9. No Haptic Feedback
**Component**: Buttons and interactions
**Missing**: Tactile feedback on iOS

**Future**: Add Haptic.impact() on button presses

---

### 10. Widget Calculations Not Cached
**Component**: StatisticsWidgets
**Issue**: Recalculates on every render (even though memoized)

**Impact**: Slight performance overhead with 50+ players

**Future**: Cache results with React Query

---

## ⚠️ **PLATFORM-SPECIFIC ISSUES**

### iOS

#### None Known Yet
⏳ Awaiting device testing

**Expected Potential Issues**:
- Shadow rendering on glassmorphism
- Keyboard avoiding view behavior
- Safe area insets on notched devices
- Modal presentation style

---

### Android

#### None Known Yet
⏳ Awaiting device testing

**Expected Potential Issues**:
- Border radius clipping
- Elevation vs shadow discrepancies
- Back button handling in modals
- Keyboard pushing content

---

## 🐛 **BUGS TO VERIFY**

These need confirmation during device testing:

### Unverified Issues
- [ ] Can you add player with same name in different case? (e.g., "John" vs "john")
- [ ] What happens if you remove a player mid-round?
- [ ] Does activity calendar handle timezone correctly?
- [ ] Can widgets handle 0 rounds gracefully?
- [ ] What if all players have same win rate for MVP?
- [ ] Does perfect pairs handle ties correctly?
- [ ] Biggest upset with equal ratings?
- [ ] Rivalry with 0 ties display?

**Action**: Test these scenarios during device testing

---

## 🔄 **WORKAROUNDS IN CODE**

### Type Assertions
**Location**: app/(auth)/login.tsx
**Why**: Dynamic form schema based on mode (login/signup)
**Code**:
```typescript
resolver: zodResolver(isSignup ? signupSchema : loginSchema) as any
displayName: (data as SignupForm).displayName
```
**Risk**: Low - runtime validation still works
**Future**: Find type-safe solution

---

### Platform Checks
**Location**: Multiple files
**Why**: Different rendering for iOS vs Android
**Code**:
```typescript
Platform.OS === 'android' ? { elevation: 4 } : { shadowOpacity: 0.1 }
```
**Risk**: None - intended behavior
**Future**: Extract to theme utilities

---

### Empty Array Fallbacks
**Location**: Statistics calculations
**Why**: Prevent crashes with no data
**Code**:
```typescript
if (!players.length || !allRounds.length) return null;
```
**Risk**: None - safe defaults
**Future**: Could add loading states

---

## 📋 **TESTING CHECKLIST**

Mark issues found during testing:

### Player Management
- [ ] Add player with special characters in name
- [ ] Add player with very long name (50+ chars)
- [ ] Remove player who has played matches
- [ ] Change status of sitting player
- [ ] Try to add 100+ players

### Scoring Modes
- [ ] Enter score > points_per_match
- [ ] Enter negative score
- [ ] Try to advance with partial scores
- [ ] Change scoring mode mid-session (should be locked)
- [ ] Test all 4 modes with real gameplay

### Activity Calendar
- [ ] View with 0 sessions
- [ ] View with 30 sessions (all days filled)
- [ ] Tap on day with 0 sessions
- [ ] Tap on day with 5+ sessions
- [ ] Test across month boundaries

### Statistics Widgets
- [ ] View with 0 rounds
- [ ] View with 1 round
- [ ] View with 20+ rounds
- [ ] Multiple players tied for MVP
- [ ] No perfect pairs exist
- [ ] No upsets in matches
- [ ] All matchups played only once

---

## 🚨 **EMERGENCY FIXES**

If you encounter a critical bug during testing:

### 1. Document First
```markdown
## CRITICAL: [Short Description]
**Discovered**: [Date/Time]
**Device**: [iOS/Android version]
**Steps to Reproduce**:
1.
2.
3.

**Expected**:
**Actual**:
**Impact**:
**Error Log**:
```

### 2. Quick Fix Options
- Revert problematic commit
- Add try-catch with fallback
- Disable feature temporarily
- Add feature flag

### 3. Report
- Add to this file
- Create GitHub issue
- Notify team
- Plan permanent fix

---

## 📝 **ISSUE TEMPLATE**

When adding new issues:

```markdown
### [Issue Number]. [Short Title]
**Component**: [File path]
**Severity**: 🔴 Critical / 🟡 High / 🟢 Medium / 🔵 Low

**Description**:
[What's wrong?]

**Impact**:
[How does this affect users?]

**Reproduction**:
1. Step 1
2. Step 2
3. See error

**Expected Behavior**:
[What should happen]

**Actual Behavior**:
[What actually happens]

**Error Messages**:
```
[Any error logs]
```

**Workaround**:
[Temporary solution if available]

**Proposed Fix**:
[How to permanently fix]

**ETA**:
[Estimated time to fix]

**Status**:
[ ] Reported
[ ] Investigating
[ ] Fix in Progress
[ ] Testing Fix
[ ] Resolved
```

---

**Note**: This document should be updated continuously as issues are discovered and resolved. Don't wait until end of session - document immediately!

**Last Review**: 2025-10-29 (Pre-device testing)
**Next Review**: After device testing session
