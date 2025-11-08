# Issues Analysis - Create Session & View Session Rounds

**Analysis Date:** 2025-10-31
**Priority Areas:** Create Session Form, View Session Rounds Page
**Categories:** Stability, Edge Cases, Performance, UI Responsiveness

---

## 🔴 **CRITICAL ISSUES**

### 1. **Race Condition in Session Creation** (create-session.tsx)
**Location:** `create-session.tsx:277-386`
**Severity:** 🔴 Critical
**Impact:** Data integrity, User experience

**Problem:**
```typescript
// Lines 302-366
const { data: sessionData, error: sessionError } = await supabase
  .from('game_sessions')
  .insert({...})
  .select()
  .single();

// Lines 359-365
const { error: playersError } = await supabase.from('players').insert(playersData);

if (playersError) {
  // Rollback: delete the session
  await supabase.from('game_sessions').delete().eq('id', sessionData.id);
  throw new Error('Failed to create players');
}
```

**Issues:**
1. **No transaction support** - If players insert fails, the rollback delete might also fail
2. **Orphaned session risk** - If app crashes between session creation and player creation, session exists with no players
3. **No retry mechanism** - Network failures leave incomplete data
4. **Navigation happens before validation** - User sees session before it's fully created

**Reproduction:**
- Simulate network failure after session creation but before player creation
- Force close app during player insertion
- Test with poor network conditions

**Fix Priority:** 🔴 Immediate
**Recommended Solution:**
- Use Supabase RPC function with transaction
- Add state machine (CREATING → CREATED → READY)
- Implement exponential backoff retry
- Don't navigate until all operations complete

---

### 2. **Unvalidated Date/Time Input** (create-session.tsx)
**Location:** `create-session.tsx:706-748`
**Severity:** 🔴 Critical
**Impact:** Data corruption, Invalid sessions

**Problem:**
```typescript
<TextInput
  value={formData.game_date}
  onChangeText={(text) => updateField('game_date', text)}
  placeholder="YYYY-MM-DD"
  // NO VALIDATION!
/>

<TextInput
  value={formData.game_time}
  onChangeText={(text) => updateField('game_time', text)}
  placeholder="HH:MM"
  // NO VALIDATION!
/>
```

**Issues:**
1. **No format validation** - Users can enter "abc" or "99-99-9999"
2. **No date picker** - Manual input is error-prone
3. **No past date prevention** - Can create sessions in the past
4. **No time validation** - Can enter "25:99"
5. **Server validation only** at line 202-204 checks if date exists, but not format

**Test Cases That Break:**
```
game_date: "2025-13-45"  ✅ Passes validation (line 202)
game_date: "hello world"  ✅ Passes validation
game_time: "99:99"        ✅ Passes validation
game_time: "not a time"   ✅ Passes validation
```

**Fix Priority:** 🔴 Immediate
**Recommended Solution:**
```typescript
// Add date picker component
import DateTimePicker from '@react-native-community/datetimepicker';

// Add validation
const validateDate = (dateStr: string): boolean => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date.getTime());
};

const validateTime = (timeStr: string): boolean => {
  const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return regex.test(timeStr);
};
```

---

### 3. **Score Input Race Condition** (RoundsTab.tsx)
**Location:** `RoundsTab.tsx:160-232`
**Severity:** 🔴 Critical
**Impact:** Score loss, Data corruption

**Problem:**
```typescript
// Lines 187-202: Fire and forget pattern
if (isOnline) {
  supabase
    .from('game_sessions')
    .update({ round_data: JSON.stringify(updatedRounds) })
    .eq('id', sessionId)
    .then(({ error }) => {
      if (error) {
        // JUST LOG ERROR - SCORE IS LOST!
        console.error('Error saving score:', error);
        Toast.show({
          type: 'error',
          text1: 'Sync Failed',
          text2: 'Score will retry when online',  // FALSE! No retry!
        });
      }
    });
}
```

**Issues:**
1. **No actual retry** - Toast says "will retry" but there's no retry logic
2. **Concurrent updates** - Two users entering scores simultaneously = last write wins
3. **No optimistic UI update confirmation** - User doesn't know if save succeeded
4. **Background saves can fail silently** - User thinks score is saved

**Reproduction:**
1. Enter score in match 1
2. Immediately enter score in match 2
3. Second update might overwrite first (race condition)

**Fix Priority:** 🔴 Immediate
**Recommended Solution:**
- Queue score updates instead of fire-and-forget
- Add version field for optimistic concurrency control
- Show loading spinner during save
- Implement actual retry with exponential backoff

---

## 🟠 **HIGH PRIORITY ISSUES**

### 4. **Missing Player Count Validation** (create-session.tsx)
**Location:** `create-session.tsx:229-231, 267-272`
**Severity:** 🟠 High
**Impact:** Algorithm crashes, Invalid sessions

**Problem:**
```typescript
// Line 229-231: Only checks minimum
if (players.length < 4) {
  errors.push('At least 4 players are required');
}

// Line 267-272: Only checks parallel mode minimum
if (formData.mode === 'parallel') {
  const minPlayers = formData.courts * 4;
  if (players.length < minPlayers) {
    errors.push(`Parallel mode with ${formData.courts} courts requires at least ${minPlayers} players`);
  }
}
```

**Missing Validations:**
1. **No maximum player limit** - Algorithm likely has limits
2. **No court/player ratio validation** for sequential mode
3. **No odd player count warning** (one always sits)
4. **No validation for optimal court usage**

**Edge Cases:**
- 100 players with 1 court → Massive wait times
- 5 players with 2 courts → Inefficient
- 3 players → Should fail but might pass before player insert

**Fix Priority:** 🟠 High
**Recommended Solution:**
```typescript
// Add maximum validation
const MAX_PLAYERS = 50;
if (players.length > MAX_PLAYERS) {
  errors.push(`Maximum ${MAX_PLAYERS} players allowed`);
}

// Add optimal court/player ratio warning
const playersPerCourt = players.length / formData.courts;
if (playersPerCourt < 4 || playersPerCourt > 20) {
  warnings.push(`Consider ${Math.ceil(players.length / 12)} courts for optimal play`);
}

// Warn for odd player counts (except fixed partner)
if (formData.type !== 'fixed_partner' && players.length % 2 !== 0) {
  warnings.push('Odd player count: one player will always sit out');
}
```

---

### 5. **Algorithm Initialization Failure Handling** (session/[id].tsx)
**Location:** `session/[id].tsx:145-160`
**Severity:** 🟠 High
**Impact:** App crash, Unusable session

**Problem:**
```typescript
useEffect(() => {
  if (players.length >= 4 && session) {
    try {
      const algo = new MexicanoAlgorithm(
        players,
        session.courts || 1,
        true,
        session.matchup_preference as any,
        session.type as any
      );
      setAlgorithm(algo);
    } catch (error) {
      console.error('Failed to initialize algorithm:', error);
      // NO USER FEEDBACK! User sees nothing
    }
  }
}, [players, session]);
```

**Issues:**
1. **Silent failure** - User doesn't know algorithm failed
2. **No retry mechanism** - Stays broken forever
3. **No fallback** - Can't recover without app restart
4. **Continue button available** - User can try to generate rounds with null algorithm

**What Happens:**
- Algorithm fails to initialize
- User clicks "Generate Round 1"
- App crashes with "algorithm is null" error (line 56)

**Fix Priority:** 🟠 High
**Recommended Solution:**
```typescript
const [algorithmError, setAlgorithmError] = useState<string | null>(null);

useEffect(() => {
  if (players.length >= 4 && session) {
    try {
      const algo = new MexicanoAlgorithm(...);
      setAlgorithm(algo);
      setAlgorithmError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setAlgorithmError(message);
      Toast.show({
        type: 'error',
        text1: 'Setup Failed',
        text2: message,
      });
    }
  }
}, [players, session]);

// In render:
if (algorithmError) {
  return <ErrorState message={algorithmError} onRetry={() => router.back()} />;
}
```

---

### 6. **Memory Leak from Score Input State** (RoundsTab.tsx)
**Location:** `RoundsTab.tsx:42-50`
**Severity:** 🟠 High
**Impact:** Performance degradation, App slowdown

**Problem:**
```typescript
// Lines 42-45: Two separate state objects
const [localScores, setLocalScores] = useState<{ [key: string]: { team1?: string; team2?: string } }>({});
const [savedScores, setSavedScores] = useState<{ [key: string]: { team1Score?: number; team2Score?: number } }>({});

// Lines 48-50: Only cleared on round change
useEffect(() => {
  setLocalScores({});
  setSavedScores({});
}, [currentRoundIndex]);
```

**Issues:**
1. **State grows indefinitely** within a round
2. **Not cleared when navigating away** from session
3. **Key format unclear** - Potential for collisions
4. **Duplicate state** - localScores and savedScores track similar data

**Scenario:**
- Session with 10 rounds, 4 matches each
- User edits scores multiple times
- After 30 minutes: 40 matches × 5 edits/match = 200 state entries
- State object grows to several KB in memory

**Fix Priority:** 🟠 High
**Recommended Solution:**
```typescript
// Use match-specific keys and cleanup
const getMatchKey = (matchIndex: number) => `r${currentRoundIndex}-m${matchIndex}`;

// Clear state on component unmount
useEffect(() => {
  return () => {
    setLocalScores({});
    setSavedScores({});
  };
}, []);

// Consider using refs for transient state
const localScoresRef = useRef<Map<string, ScoreData>>(new Map());
```

---

## 🟡 **MEDIUM PRIORITY ISSUES**

### 7. **No Debouncing on Form Inputs** (create-session.tsx)
**Location:** Throughout form (lines 479-494, 706-748)
**Severity:** 🟡 Medium
**Impact:** Performance, Unnecessary re-renders

**Problem:**
```typescript
<TextInput
  value={formData.name}
  onChangeText={(text) => updateField('name', text)}  // Triggers on every keystroke
/>
```

**Impact:**
- Re-renders on every keystroke
- Validation runs on every keystroke (line 388)
- Creates performance issues with large player lists

**Measurement:**
- Typing "Test Session" = 12 keystrokes = 12 re-renders = 12 validation calls
- With 50 players, each keystroke validates 50 player entries

**Fix Priority:** 🟡 Medium
**Recommended Solution:**
```typescript
import { useMemo, useCallback } from 'react';
import debounce from 'lodash.debounce';

const debouncedUpdateField = useMemo(
  () => debounce((field, value) => {
    updateField(field, value);
  }, 300),
  []
);
```

---

### 8. **Reclub Import Lacks Error Recovery** (create-session.tsx)
**Location:** `create-session.tsx:104-187`
**Severity:** 🟡 Medium
**Impact:** Poor UX, Lost imports

**Problem:**
```typescript
try {
  const result = await importPlayersFromReclub(reclubUrl.trim());

  if (result.error) {
    Toast.show({...});
    return;  // URL stays in input, modal stays open
  }

  // ... success path

} catch (error) {
  Toast.show({...});
  // URL stays in input, modal stays open
} finally {
  setIsImporting(false);
}
```

**Issues:**
1. **Modal doesn't close on error** - User must manually close
2. **URL not cleared on error** - User must manually delete
3. **No "Try Again" option** - Must close modal and reopen
4. **No import preview** - Can't verify before importing

**Fix Priority:** 🟡 Medium
**Recommended Solution:**
- Add "Try Again" button in error state
- Show import preview before confirming
- Clear URL on successful import only
- Auto-close modal after successful import delay

---

### 9. **Keyboard Obscures Input Fields** (create-session.tsx)
**Location:** `create-session.tsx:438-441`
**Severity:** 🟡 Medium
**Impact:** UX, Accessibility

**Problem:**
```typescript
<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}  // Android uses 'height'
  style={{ flex: 1 }}
>
```

**Issues:**
1. **Android 'height' behavior is buggy** - Often doesn't work correctly
2. **No scrollToInput** - Can't programmatically scroll to active input
3. **KeyboardAvoidingView conflicts with ScrollView** - Known React Native issue
4. **Tab bar height not accounted for** (TAB_BAR_HEIGHT = 88)

**Reproduction:**
1. Open create session on Android
2. Tap on time input at bottom
3. Keyboard covers input field

**Fix Priority:** 🟡 Medium
**Recommended Solution:**
```typescript
// Use android:windowSoftInputMode="adjustResize" in AndroidManifest.xml
// Remove KeyboardAvoidingView
// Add contentInset to ScrollView
<ScrollView
  contentContainerStyle={{
    paddingTop: insets.top + 60,
    paddingBottom: TAB_BAR_HEIGHT + 16 + (Platform.OS === 'ios' ? 0 : 200),
  }}
  keyboardShouldPersistTaps="handled"
/>
```

---

### 10. **Player Switch Logic Has Edge Cases** (session/[id].tsx)
**Location:** `session/[id].tsx:463-639`
**Severity:** 🟡 Medium
**Impact:** Data integrity, Logic errors

**Problem:**
```typescript
// Lines 502-506: Complex swap detection
const isSwap = round.matches.some(match =>
  match.team1?.some(p => p.id === newPlayer.id) ||
  match.team2?.some(p => p.id === newPlayer.id)
);

// Lines 508-562: Nested position finding logic
round.matches.forEach((match, idx) => {
  if (match.team1?.[0]?.id === newPlayer.id) {
    swapMatchIndex = idx;
    swapPosition = 'team1_0';
  } else if (match.team1?.[1]?.id === newPlayer.id) {
    // ... repeated 4 times
  }
});
```

**Issues:**
1. **Optional chaining masks errors** - match.team1?.[0] could be undefined
2. **No validation of swap validity** - Can swap players breaking partnerships in fixed_partner mode
3. **No gender validation** - Can break mixed_mexicano gender requirements
4. **No array bounds checking** - Assumes team1/team2 always have 2 players
5. **Complex nested logic** - Hard to test and maintain

**Edge Cases:**
- What if match.team1 has only 1 player?
- What if player is in sitting array AND matches? (data corruption)
- What if swap creates invalid mixed doubles?

**Fix Priority:** 🟡 Medium
**Recommended Solution:**
- Add validation before swap
- Extract swap logic to separate function
- Add comprehensive tests for edge cases
- Validate game type constraints

---

## 🟢 **LOW PRIORITY ISSUES**

### 11. **Excessive Console Logging**
**Location:** Throughout codebase
**Severity:** 🟢 Low
**Impact:** Performance, Security

**Examples:**
```typescript
// session/[id].tsx:157
console.error('Failed to initialize algorithm:', error);

// RoundsTab.tsx:195, 206, 215
console.error('Error saving score:', error);
console.error('Error updating player stats:', err);
console.error('Error logging event:', error);
```

**Issues:**
1. **Production logs leak data** - Errors contain session IDs, player data
2. **No log aggregation** - Can't track issues in production
3. **console.log statements** - Should be removed before production

**Fix Priority:** 🟢 Low
**Recommended Solution:**
- Use logging library (e.g., react-native-logs)
- Add error tracking (Sentry)
- Remove console.log in production builds

---

### 12. **No Loading Skeleton for Session Screen**
**Location:** `session/[id].tsx:650-657`
**Severity:** 🟢 Low
**Impact:** UX

**Problem:**
```typescript
if (sessionLoading || playersLoading) {
  return (
    <View className="flex-1 items-center justify-center bg-gray-50">
      <ActivityIndicator size="large" color="#3B82F6" />
      <Text className="text-gray-600 mt-4">Loading session...</Text>
    </View>
  );
}
```

**Issues:**
- Full-screen spinner creates jarring transition
- No progressive loading
- No skeleton screens

**Fix Priority:** 🟢 Low
**Recommended Solution:**
- Add skeleton screens that match final layout
- Show header immediately while loading data
- Progressive disclosure of tabs

---

### 13. **Hardcoded Colors Instead of Theme**
**Location:** Throughout components
**Severity:** 🟢 Low
**Impact:** Maintainability, Dark mode

**Examples:**
```typescript
// create-session.tsx:394-401
<View
  style={{
    backgroundColor: '#FFFFFF',  // Hardcoded
    opacity: 0.98,
  }}
/>

// RoundsTab.tsx:283-289
<View style={{
  flexDirection: 'row',
  backgroundColor: '#FFFFFF',  // Hardcoded
  borderRadius: 12,
}}>
```

**Issues:**
- Dark mode not fully supported (ThemeContext exists but not used consistently)
- Hard to change color scheme
- Inconsistent color values across components

**Fix Priority:** 🟢 Low
**Recommended Solution:**
- Use theme colors from ThemeContext consistently
- Define color palette in constants
- Use NativeWind classes instead of inline styles where possible

---

## 📊 **PERFORMANCE ISSUES**

### 14. **Inefficient Player Stats Calculation** (session/[id].tsx)
**Location:** `session/[id].tsx:170-261`
**Severity:** 🟠 High
**Impact:** Performance, Scalability

**Problem:**
```typescript
const calculatePlayerStatsFromRounds = useCallback(
  (playersData: Player[], rounds: Round[], sessionData: any): Player[] => {
    // Reset all stats - O(n)
    const updatedPlayers = playersData.map((player) => ({
      ...player,
      totalPoints: 0,
      // ... 10 fields
    }));

    // Calculate base stats from rounds - O(r * m * p)
    rounds.forEach((round) => {  // r rounds
      round.matches.forEach((match) => {  // m matches per round
        // ... team1.forEach, team2.forEach  // p players per match
        match.team1.forEach((player) => {
          const playerIndex = updatedPlayers.findIndex((p) => p.id === player.id);  // O(n) lookup!
          // ... update stats
        });
      });
    });

    // ... more iterations
  },
  []
);
```

**Complexity Analysis:**
- `findIndex` in nested loop: **O(r × m × p × n)** where n = player count
- For 20 rounds, 4 matches/round, 8 players: **20 × 4 × 4 × 8 = 2,560 iterations**
- Runs on every render when allRounds changes!

**Performance Impact:**
- Janky UI when entering scores
- Slow round generation
- Battery drain

**Fix Priority:** 🟠 High
**Recommended Solution:**
```typescript
const calculatePlayerStatsFromRounds = useCallback(
  (playersData: Player[], rounds: Round[], sessionData: any): Player[] => {
    // Use Map for O(1) lookups
    const playerStatsMap = new Map(
      playersData.map(p => [p.id, { ...p, totalPoints: 0, wins: 0, ... }])
    );

    // Single pass through data - O(r * m)
    rounds.forEach((round) => {
      round.matches.forEach((match) => {
        match.team1.forEach((player) => {
          const stats = playerStatsMap.get(player.id);  // O(1) lookup
          if (stats) {
            stats.totalPoints += match.team1Score || 0;
            // ... update stats
          }
        });
      });
    });

    return Array.from(playerStatsMap.values());
  },
  []
);
```

---

### 15. **useMemo Dependencies Cause Excessive Recalculation** (session/[id].tsx)
**Location:** `session/[id].tsx:264-267, 270-298`
**Severity:** 🟡 Medium
**Impact:** Performance

**Problem:**
```typescript
// Line 264-267: Recalculates on EVERY render
const recalculatedPlayers = useMemo(() => {
  if (!session || allRounds.length === 0) return players;
  return calculatePlayerStatsFromRounds(players, allRounds, session);
}, [players, allRounds, session, calculatePlayerStatsFromRounds]);

// Line 270-298: Sorts on every sortBy change OR players change
const sortedPlayers = useMemo(() => {
  return [...recalculatedPlayers].sort((a, b) => {
    // ... 30 lines of sorting logic
  });
}, [players, sortBy]);  // BUG: Should depend on recalculatedPlayers, not players!
```

**Issues:**
1. **Wrong dependencies** - sortedPlayers depends on `players` instead of `recalculatedPlayers`
2. **Expensive calculation** on every render
3. **calculatePlayerStatsFromRounds in dependencies** - Function reference changes on every render
4. **Deep comparison not used** - players array change = full recalc even if content same

**Fix Priority:** 🟡 Medium
**Recommended Solution:**
```typescript
// Fix dependency
const sortedPlayers = useMemo(() => {
  return [...recalculatedPlayers].sort((a, b) => {
    // ...
  });
}, [recalculatedPlayers, sortBy]);  // Correct dependency

// Remove function from dependencies
const calculatePlayerStatsFromRounds = useCallback(
  (playersData: Player[], rounds: Round[], sessionData: any): Player[] => {
    // ...
  },
  [] // Empty - function never changes
);
```

---

### 16. **ScrollView Performance with Many Rounds**
**Location:** `RoundsTab.tsx:366-395`
**Severity:** 🟡 Medium
**Impact:** Performance with large sessions

**Problem:**
```typescript
<ScrollView
  className="flex-1"
  showsVerticalScrollIndicator={false}
  contentContainerStyle={{ paddingBottom: 16 }}
>
  {currentRound?.matches?.length > 0 ? currentRound.matches.map((match, index) => {
    // Renders ALL matches even if off-screen
    return <MatchCard key={index} ... />
  })}
</ScrollView>
```

**Issues:**
- Renders all matches at once (no virtualization)
- For sessions with many courts (10 courts = 10 matches), all render
- Each MatchCard is complex with multiple TextInputs

**Impact:**
- Slow initial render
- Laggy scrolling with 8+ courts
- Memory usage grows with match count

**Fix Priority:** 🟡 Medium
**Recommended Solution:**
```typescript
// Use FlatList instead of ScrollView + map
<FlatList
  data={currentRound?.matches || []}
  renderItem={({ item: match, index }) => (
    <MatchCard match={match} index={index} />
  )}
  keyExtractor={(_, index) => `match-${index}`}
  contentContainerStyle={{ paddingBottom: 16 }}
  initialNumToRender={4}
  maxToRenderPerBatch={2}
  windowSize={3}
/>
```

---

## 🎨 **UI/UX ISSUES**

### 17. **Dropdown Menu Not Dismissing on Outside Tap**
**Location:** `session/[id].tsx:748-846`
**Severity:** 🟡 Medium
**Impact:** UX

**Problem:**
```typescript
{dropdownOpen && (
  <View style={{
    position: 'absolute',
    // ... dropdown menu
  }}>
    {/* No TouchableWithoutFeedback wrapper */}
    {/* No onDismiss handler */}
  </View>
)}
```

**Issues:**
- Dropdown stays open when tapping elsewhere
- No backdrop to catch outside taps
- Must tap menu button again to close

**Fix Priority:** 🟡 Medium
**Recommended Solution:**
```typescript
{dropdownOpen && (
  <TouchableWithoutFeedback onPress={() => setDropdownOpen(false)}>
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      <View style={{ position: 'absolute', right: 0, top: 48, ... }}>
        {/* Dropdown content */}
      </View>
    </View>
  </TouchableWithoutFeedback>
)}
```

---

### 18. **No Visual Feedback During Score Save**
**Location:** `RoundsTab.tsx:187-217`
**Severity:** 🟡 Medium
**Impact:** UX

**Problem:**
- Score saves in background with no confirmation
- User doesn't know if save succeeded
- No "saving..." indicator
- No "saved" checkmark

**Fix Priority:** 🟡 Medium
**Recommended Solution:**
- Show checkmark icon when score saved successfully
- Show spinner during save
- Show error icon if save fails
- Use savedScores state to show save status

---

### 19. **Form Doesn't Remember State on Back Navigation**
**Location:** `create-session.tsx` entire screen
**Severity:** 🟢 Low
**Impact:** UX

**Problem:**
- User fills form partially
- Accidentally hits back button
- All form data lost
- Must start over

**Fix Priority:** 🟢 Low
**Recommended Solution:**
- Save form state to AsyncStorage on change
- Restore on mount
- Add "Save Draft" button
- Warn before navigating away with unsaved changes

---

### 20. **No Empty State for Sitting Players**
**Location:** `RoundsTab.tsx` (not visible in excerpt)
**Severity:** 🟢 Low
**Impact:** UX

**Problem:**
- When all players are playing, sitting section shows nothing
- Unclear if it's a bug or intended

**Fix Priority:** 🟢 Low
**Recommended Solution:**
- Show "All players are competing this round" message
- Add illustration/icon

---

## 🔐 **SECURITY ISSUES**

### 21. **No Rate Limiting on Session Creation**
**Location:** `create-session.tsx:277-386`
**Severity:** 🟡 Medium
**Impact:** Resource abuse

**Problem:**
- No client-side rate limiting
- User can spam create button
- Can create unlimited sessions
- No Supabase RLS policies visible in code

**Fix Priority:** 🟡 Medium
**Recommended Solution:**
- Add debounce to create button (5 second cooldown)
- Implement server-side rate limiting
- Add session count limits per user

---

### 22. **User Input Not Sanitized Before Display**
**Location:** Throughout (session names, player names)
**Severity:** 🟢 Low
**Impact:** XSS potential in web views

**Problem:**
```typescript
// Player names stored and displayed without sanitization
<Text>{player.name}</Text>  // Could contain special characters
```

**Issue:**
- While React Native Text is generally safe, special characters could cause display issues
- If data is ever displayed in WebView, could be XSS risk
- Emoji and unicode could break layouts

**Fix Priority:** 🟢 Low
**Recommended Solution:**
- Validate and sanitize input
- Strip or escape special characters
- Limit character sets allowed

---

## 📱 **EDGE CASE SCENARIOS**

### Scenario 1: "The Impatient User"
**Steps:**
1. User starts creating session
2. Fills form halfway
3. Taps "Create Session" rapidly 10 times
4. Network is slow (3G)

**Current Behavior:**
- ❌ Multiple sessions created (no debounce)
- ❌ Button stays enabled during submit
- ❌ No loading indicator initially

**Expected Behavior:**
- ✅ Button disabled after first tap
- ✅ Loading indicator shown
- ✅ Duplicate creation prevented

---

### Scenario 2: "The Offline Tournament Organizer"
**Steps:**
1. User creates session while offline
2. Session queued for sync
3. User enters scores for multiple rounds
4. User comes back online
5. All queued operations try to sync at once

**Current Behavior:**
- ❌ Operations might sync out of order
- ❌ No sync queue priority
- ❌ No sync progress indicator
- ❌ Failed operations not retried

**Expected Behavior:**
- ✅ Operations sync in order (create session → add players → add rounds → add scores)
- ✅ Progress indicator shows "Syncing 3 of 10..."
- ✅ Failed operations retry with backoff

---

### Scenario 3: "The Data Corruption Test"
**Steps:**
1. Two devices viewing same session
2. Device A enters score: 15-9
3. Device B enters score simultaneously: 12-12
4. Both save at exact same time

**Current Behavior:**
- ❌ Last write wins (one score lost)
- ❌ No conflict detection
- ❌ No user notification

**Expected Behavior:**
- ✅ Optimistic locking (version field)
- ✅ Conflict detected and user notified
- ✅ Option to keep their score or accept other

---

### Scenario 4: "The Screen Rotation Chaos"
**Steps:**
1. User filling out create session form
2. Screen rotates to landscape
3. Form has errors
4. Rotate back to portrait

**Current Behavior:**
- ⚠️ Form state preserved (good)
- ❌ Keyboard might cover inputs
- ❌ Validation error list might be cut off
- ❌ ScrollView position not preserved

**Expected Behavior:**
- ✅ Form adapts to orientation
- ✅ Inputs remain visible
- ✅ Scroll position maintained

---

## 🔧 **RECOMMENDED FIXES SUMMARY**

### Immediate (Week 1)
1. ✅ Fix race condition in session creation (add transactions)
2. ✅ Add date/time validation with pickers
3. ✅ Fix score save race condition (add queue + optimistic locking)

### High Priority (Week 2-3)
4. ✅ Add player count limits and warnings
5. ✅ Add algorithm initialization error handling
6. ✅ Fix memory leak in score input state
7. ✅ Optimize player stats calculation (use Map)

### Medium Priority (Week 4-6)
8. ✅ Add input debouncing
9. ✅ Improve Reclub import UX
10. ✅ Fix keyboard avoidance on Android
11. ✅ Refactor player switch logic
12. ✅ Add loading skeletons

### Low Priority (Ongoing)
13. ✅ Remove console.logs, add error tracking
14. ✅ Use theme colors consistently
15. ✅ Add form draft saving
16. ✅ Implement rate limiting

---

## 📈 **TESTING RECOMMENDATIONS**

### Unit Tests Needed
- [ ] Session creation validation
- [ ] Date/time parsing and validation
- [ ] Player stats calculation
- [ ] Score update logic
- [ ] Player switch/swap logic

### Integration Tests Needed
- [ ] Create session end-to-end
- [ ] Round generation flow
- [ ] Score entry and save
- [ ] Offline queue synchronization
- [ ] Multi-device concurrent updates

### E2E Tests Needed (Maestro)
- [ ] Create session → Generate round → Enter scores → View leaderboard
- [ ] Import from Reclub → Verify players
- [ ] Offline mode → Enter scores → Go online → Verify sync
- [ ] Multiple devices → Concurrent score entry

---

## 📊 **METRICS TO TRACK**

### Performance Metrics
- Session creation time (target: <2s)
- Round generation time (target: <1s)
- Score save time (target: <500ms)
- Player stats calculation time (target: <100ms)

### Error Metrics
- Session creation failure rate (target: <1%)
- Score save failure rate (target: <0.1%)
- Algorithm initialization failure rate (target: <0.1%)
- Offline queue sync failure rate (target: <5%)

### UX Metrics
- Time to create first session (target: <2 min)
- Form abandonment rate (target: <20%)
- Score entry errors per round (target: <0.5)

---

**Last Updated:** 2025-10-31
**Reviewed By:** Claude Code Analysis
**Next Review:** After implementing Week 1 fixes
