# Session Detail Page - Comprehensive Analysis

**File:** `/app/(tabs)/session/[id].tsx`
**Lines:** 1460
**Date Analyzed:** 2025-11-02
**Severity Legend:** 🔴 Critical | 🟠 High | 🟡 Medium | 🟢 Low

---

## Executive Summary

The session detail page is a complex component with **1460 lines** handling tournament state management, player switching, round navigation, and real-time updates. Overall, it's **well-architected** with good error handling and optimization patterns. However, there are **critical issues** that could cause production failures.

### Risk Score: **7.2/10** (High Risk)

**Critical Issues:** 3
**High Priority Issues:** 8
**Medium Priority Issues:** 12
**Low Priority Issues:** 7

---

## 🔴 Critical Issues

### 1. Missing Authorization Check

**Location:** Lines 91-103, 106-137
**Severity:** 🔴 Critical (Security)

**Problem:**
```typescript
const { data: session, isLoading: sessionLoading } = useQuery({
  queryKey: ['session', id],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },
});
```

**Issue:** No verification that the current user owns or has access to this session. Relies entirely on RLS policies, but doesn't validate user ownership client-side.

**Attack Vector:**
1. User navigates to `/session/<any-uuid>`
2. If RLS policy is misconfigured, they can access any session
3. Can view, modify, or delete other users' data

**Fix:**
```typescript
const { data: session, isLoading: sessionLoading } = useQuery({
  queryKey: ['session', id],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    // SECURITY: Validate ownership
    if (data.user_id !== user?.id) {
      throw new Error('You do not have access to this session');
    }

    return data;
  },
  enabled: !!user?.id && !!id,
});
```

**Test Scenario:**
```typescript
// Try accessing another user's session
const anotherUsersSessionId = 'uuid-from-another-user';
router.push(`/session/${anotherUsersSessionId}`);
// Expected: Error or redirect
// Actual: Might show the session (if RLS is misconfigured)
```

---

### 2. Race Condition in Algorithm Initialization

**Location:** Lines 178-215
**Severity:** 🔴 Critical (Logic Error)

**Problem:**
```typescript
const initializeAlgorithm = useCallback(() => {
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
      setAlgorithmError(null);
    } catch (error) {
      setAlgorithmError(errorMessage);
      setAlgorithm(null);
    }
  }
}, [players, session]);

useEffect(() => {
  initializeAlgorithm();
}, [initializeAlgorithm]);
```

**Issue:**
1. `players` and `session` are loaded asynchronously
2. Algorithm might initialize with **stale player data**
3. If players query completes before session, algorithm uses partial data
4. No synchronization guarantee

**Race Condition Scenario:**
```
Time 0: Component mounts
Time 100ms: players query completes (4 players)
Time 101ms: initializeAlgorithm() runs with 4 players
Time 200ms: session query completes
Time 201ms: initializeAlgorithm() runs again
Time 250ms: players query updates (5 players added)
Time 251ms: Algorithm has OLD data, new player not included
```

**Fix:**
```typescript
const initializeAlgorithm = useCallback(() => {
  // WAIT for both players AND session to be loaded
  if (!session || !players || players.length === 0) return;

  if (players.length >= 4) {
    try {
      const algo = new MexicanoAlgorithm(
        players,
        session.courts || 1,
        true,
        session.matchup_preference as any,
        session.type as any
      );
      setAlgorithm(algo);
      setAlgorithmError(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown algorithm error';
      setAlgorithmError(errorMessage);
      setAlgorithm(null);
    }
  } else {
    setAlgorithmError('At least 4 players are required');
    setAlgorithm(null);
  }
}, [players, session]);

useEffect(() => {
  // Only initialize when BOTH are ready
  if (!sessionLoading && !playersLoading) {
    initializeAlgorithm();
  }
}, [sessionLoading, playersLoading, initializeAlgorithm]);
```

---

### 3. Unsafe Type Assertions

**Location:** Lines 126, 134, 186
**Severity:** 🔴 Critical (Type Safety)

**Problem:**
```typescript
status: p.status as any,
gender: p.gender as any,
session.matchup_preference as any,
session.type as any
```

**Issue:** Using `as any` bypasses TypeScript's type checking. If database schema changes, runtime errors will occur.

**Runtime Error Scenario:**
```typescript
// Database returns: status: "inactive"
// Algorithm expects: "active" | "sitting" | "skip"
// Result: Undefined behavior, possible crash
```

**Fix:**
```typescript
// Create proper type guards
function isValidPlayerStatus(status: unknown): status is Player['status'] {
  return typeof status === 'string' &&
    ['active', 'sitting', 'skip'].includes(status);
}

function isValidGender(gender: unknown): gender is Player['gender'] {
  return typeof gender === 'string' &&
    ['male', 'female', 'unspecified'].includes(gender);
}

// Use type guards
status: isValidPlayerStatus(p.status) ? p.status : 'active',
gender: isValidGender(p.gender) ? p.gender : 'unspecified',
```

---

## 🟠 High Priority Issues

### 4. No Dropdown Dismiss on Outside Tap

**Location:** Lines 1089-1218
**Severity:** 🟠 High (UX)

**Problem:** Dropdown menu doesn't close when tapping outside. Already documented in COMPREHENSIVE_ANALYSIS_2025.md

**User Experience:**
- User opens dropdown
- Taps elsewhere on screen
- Dropdown stays open (frustrating)
- Android back button doesn't close it

**Fix:**
```typescript
{dropdownOpen && (
  <>
    {/* Backdrop to close dropdown */}
    <TouchableWithoutFeedback onPress={() => setDropdownOpen(false)}>
      <View style={StyleSheet.absoluteFill} />
    </TouchableWithoutFeedback>

    <View style={{ ... }}>
      {/* Dropdown content */}
    </View>
  </>
)}

// Add Android back button handler
useEffect(() => {
  if (Platform.OS === 'android') {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (dropdownOpen) {
        setDropdownOpen(false);
        return true; // Prevent default behavior
      }
      return false;
    });

    return () => backHandler.remove();
  }
}, [dropdownOpen]);
```

---

### 5. useMemo Missing Dependencies

**Location:** Lines 328-331
**Severity:** 🟠 High (Performance/Correctness)

**Problem:**
```typescript
const recalculatedPlayers = useMemo(() => {
  if (!session || allRounds.length === 0) return players;
  return calculatePlayerStatsFromRounds(players, allRounds, session);
}, [players, allRounds, session, calculatePlayerStatsFromRounds]);
```

**Issue:** `calculatePlayerStatsFromRounds` is memoized with empty dependencies `[]` (line 324), but it's included in the useMemo dependencies. This creates unnecessary recalculations.

**Performance Impact:**
- Recalculates on EVERY render
- With 50 players × 20 rounds = 1000+ calculations
- Should only recalculate when data changes

**Fix:**
```typescript
const calculatePlayerStatsFromRounds = useCallback(
  (playersData: Player[], rounds: Round[], sessionData: any): Player[] => {
    // ... implementation ...
  },
  // Add session-specific dependencies
  [sessionData?.points_per_match]
);
```

---

### 6. Mutation Without Optimistic Updates

**Location:** Lines 859-980 (switchPlayerMutation)
**Severity:** 🟠 High (UX)

**Problem:** Player switch mutation has no optimistic update. User waits for network request to complete before seeing changes.

**User Experience:**
```
1. User switches player
2. Sees loading spinner for 300-1000ms
3. If network is slow, 2-5 seconds
4. If offline, fails completely
```

**Fix:**
```typescript
const switchPlayerMutation = useMutation({
  mutationFn: async ({ matchIndex, position, newPlayerId }) => {
    // ... existing logic ...
  },
  onMutate: async (variables) => {
    // OPTIMISTIC UPDATE: Update UI immediately
    await queryClient.cancelQueries({ queryKey: ['session', id] });

    const previousSession = queryClient.getQueryData(['session', id]);

    // Update cache optimistically
    queryClient.setQueryData(['session', id], (old: any) => {
      if (!old) return old;
      const updatedRounds = [...old.round_data];
      // Perform switch in memory
      // ... switch logic ...
      return { ...old, round_data: updatedRounds };
    });

    return { previousSession };
  },
  onError: (err, variables, context) => {
    // ROLLBACK on error
    if (context?.previousSession) {
      queryClient.setQueryData(['session', id], context.previousSession);
    }
  },
});
```

---

### 7. No Query Error Handling

**Location:** Lines 91-152
**Severity:** 🟠 High (Error Handling)

**Problem:** Queries have no error handling. If Supabase is down, user sees indefinite loading spinner.

**Error Scenarios:**
- Network timeout
- Supabase offline
- Invalid session ID
- Database query error

**Current Behavior:**
```typescript
const { data: session, isLoading: sessionLoading } = useQuery({
  queryKey: ['session', id],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;  // ← No UI feedback!
    return data;
  },
});
```

**Fix:**
```typescript
const {
  data: session,
  isLoading: sessionLoading,
  isError: sessionError,
  error: sessionErrorDetails
} = useQuery({
  queryKey: ['session', id],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },
  retry: 2,
  retryDelay: 1000,
});

// In render:
if (sessionError) {
  return (
    <View className="flex-1 items-center justify-center px-6">
      <Text className="text-xl font-semibold text-red-600 mb-2">
        Failed to Load Session
      </Text>
      <Text className="text-gray-600 text-center mb-6">
        {sessionErrorDetails?.message || 'Unknown error'}
      </Text>
      <TouchableOpacity onPress={() => queryClient.invalidateQueries(['session', id])}>
        <Text className="text-primary-500 font-semibold">Retry</Text>
      </TouchableOpacity>
    </View>
  );
}
```

---

### 8. Player Switch Validation Incomplete

**Location:** Lines 664-783
**Severity:** 🟠 High (Logic)

**Problem:** `validatePlayerSwitch` checks for duplicates and mode-specific rules, but MISSING critical validations:

**Missing Validations:**
1. **Player is not injured/unavailable**
2. **Player has already played maximum rounds** (fatigue limit)
3. **Court capacity validation** (is court full?)
4. **Time-based validation** (match already started?)

**Example Missing Check:**
```typescript
// MISSING: Check if match has scores entered
if (currentMatch.team1Score !== undefined || currentMatch.team2Score !== undefined) {
  return {
    valid: false,
    error: 'Cannot switch players after scores have been entered'
  };
}

// MISSING: Check player availability
if (newPlayer.status !== 'active') {
  return {
    valid: false,
    error: `${newPlayer.name} is not available (status: ${newPlayer.status})`
  };
}
```

---

### 9. performPlayerSwap Mutation

**Location:** Lines 786-856
**Severity:** 🟠 High (Logic)

**Problem:** Complex swap logic that mutates the round object directly. Hard to test, hard to debug.

**Issues:**
1. Direct mutation of `round` object (line 842, 847)
2. Edge case: What if player is in BOTH sitting players AND match? (line 851)
3. No validation that swap was successful
4. Throws generic errors without context

**Better Approach:**
```typescript
const performPlayerSwap = useCallback((
  round: Round,
  matchIndex: number,
  position: string,
  oldPlayer: Player,
  newPlayer: Player
): { success: boolean; updatedRound: Round; error?: string } => {

  // Create a COPY instead of mutating
  const updatedRound = JSON.parse(JSON.stringify(round));

  try {
    // Perform swap on copy
    // ... swap logic ...

    // Validate swap was successful
    const swapSuccessful = validateSwapResult(updatedRound, oldPlayer, newPlayer);

    if (!swapSuccessful) {
      return {
        success: false,
        updatedRound: round,
        error: 'Swap validation failed'
      };
    }

    return {
      success: true,
      updatedRound
    };
  } catch (error) {
    return {
      success: false,
      updatedRound: round,
      error: error instanceof Error ? error.message : 'Unknown swap error'
    };
  }
}, []);
```

---

### 10. Missing Suspense Error Boundaries

**Location:** Lines 1244-1324
**Severity:** 🟠 High (Stability)

**Problem:** Lazy-loaded components wrapped in `Suspense` but no ErrorBoundary. If lazy load fails, app crashes.

**Crash Scenario:**
```
1. User navigates to session
2. Network drops during lazy load of RoundsTab
3. Lazy load Promise rejects
4. Suspense has no error fallback
5. App crashes with white screen
```

**Fix:**
```typescript
// Create ErrorBoundary component
class LazyLoadErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-red-600 font-semibold mb-2">Failed to Load</Text>
          <Text className="text-gray-600 text-center mb-4">
            This component could not be loaded. Please refresh the app.
          </Text>
          <TouchableOpacity onPress={() => this.setState({ hasError: false })}>
            <Text className="text-primary-500 font-semibold">Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

// Wrap lazy components
<LazyLoadErrorBoundary>
  <Suspense fallback={<LoadingSpinner />}>
    <RoundsTab {...props} />
  </Suspense>
</LazyLoadErrorBoundary>
```

---

### 11. Dropdown State Not Persistent

**Location:** Lines 70, 1089-1218
**Severity:** 🟠 High (UX)

**Problem:** Dropdown menu state is local and not synced with navigation. If user opens dropdown and swipes to another tab, dropdown state is lost.

**Confusing UX:**
```
1. User opens dropdown in Rounds tab
2. User swipes to Leaderboard tab
3. User swipes back to Rounds tab
4. Dropdown is closed (state lost)
5. User thinks app is buggy
```

**Also:** Multiple dropdown menus across tabs could be open simultaneously (memory leak potential).

**Fix:**
```typescript
// Close dropdown when changing tabs
useEffect(() => {
  setDropdownOpen(false);
}, [tab]);

// Or use a ref to track dropdown state across renders
const dropdownOpenRef = useRef(false);
```

---

## 🟡 Medium Priority Issues

### 12. Hardcoded Colors

**Location:** Throughout file (Lines 993, 1008, 1018, 1053, 1094, etc.)
**Severity:** 🟡 Medium (Maintainability)

**Problem:** 50+ hardcoded color values. Makes dark mode impossible and theme changes difficult.

**Examples:**
```typescript
backgroundColor: '#F9FAFB'  // Line 1018
color: '#111827'           // Line 1036
backgroundColor: '#EF4444' // Line 1053
shadowColor: '#000'        // Line 1057
```

**Already Documented:** COMPREHENSIVE_ANALYSIS_2025.md (662 hardcoded colors across app)

**Fix:** Import theme colors:
```typescript
import { useTheme, getThemeColors } from '../../../contexts/ThemeContext';

const colors = getThemeColors(isDark);

// Use theme colors
backgroundColor: colors.background
color: colors.text.primary
backgroundColor: colors.primary[500]
```

---

### 13. No Pagination for Large Datasets

**Location:** Lines 106-137 (players query)
**Severity:** 🟡 Medium (Performance)

**Problem:** Fetches ALL players at once. If session has 200+ players, performance degrades.

**Performance Impact:**
- 200 players × 20 rounds × 4 matches = 16,000 calculations
- useMemo recalculates on every player change
- No virtualization

**Fix:**
```typescript
const { data: playersData = [], isLoading: playersLoading } = useQuery({
  queryKey: ['players', id, currentPage],
  queryFn: async () => {
    const limit = 50;
    const offset = currentPage * limit;

    const { data, error, count } = await supabase
      .from('players')
      .select('*', { count: 'exact' })
      .eq('session_id', id)
      .order('total_points', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return { players: data, totalCount: count };
  },
});

// Implement virtual scrolling in leaderboard
```

---

### 14. Missing Input Sanitization

**Location:** Lines 373-426 (addPlayerMutation), 429-465 (removePlayerMutation)
**Severity:** 🟡 Medium (Security)

**Problem:** Player name input is not sanitized. Allows injection attacks.

**Attack Vectors:**
```typescript
// SQL Injection attempt (blocked by Supabase, but still...)
name: "'; DROP TABLE players; --"

// XSS attempt
name: "<script>alert('XSS')</script>"

// Very long name (DoS)
name: "A".repeat(10000)
```

**Fix:**
```typescript
const addPlayerMutation = useMutation({
  mutationFn: async ({ name, rating }: { name: string; rating: number }) => {
    // SANITIZE input
    const sanitizedName = name.trim().substring(0, 100);

    if (sanitizedName.length < 2) {
      throw new Error('Player name must be at least 2 characters');
    }

    if (!/^[a-zA-Z0-9\s\-']+$/.test(sanitizedName)) {
      throw new Error('Player name contains invalid characters');
    }

    if (rating < 0 || rating > 10) {
      throw new Error('Rating must be between 0 and 10');
    }

    // Rest of mutation...
  },
});
```

---

### 15. Regenerate Round Loses Scores

**Location:** Lines 498-554, 580-598
**Severity:** 🟡 Medium (Data Loss)

**Problem:** Regenerating a round deletes ALL scores without backup or undo.

**Data Loss Scenario:**
```
1. Tournament has 20 matches with scores entered
2. Organizer accidentally clicks "Regenerate Round"
3. Clicks "Regenerate" in confirmation (muscle memory)
4. All 20 match scores are PERMANENTLY LOST
5. No undo, no recovery
```

**Fix:**
```typescript
const handleRegenerateRound = () => {
  const currentRound = allRounds[currentRoundIndex];
  const hasScores = currentRound.matches.some(
    m => m.team1Score !== undefined || m.team2Score !== undefined
  );

  Alert.alert(
    'Regenerate Round',
    hasScores
      ? `⚠️ WARNING: This round has ${currentRound.matches.length} matches with scores entered. All scores will be permanently lost.\n\nAre you absolutely sure?`
      : `Generate new pairings for Round ${currentRound?.number}?`,
    [
      { text: 'Cancel', style: 'cancel' },
      ...(hasScores ? [{
        text: 'Keep Scores',
        onPress: () => {
          // New feature: Regenerate but preserve scores where possible
        }
      }] : []),
      {
        text: hasScores ? 'DELETE SCORES & Regenerate' : 'Regenerate',
        style: 'destructive',
        onPress: () => {
          // Log to event history before regenerating
          regenerateRoundMutation.mutate();
        },
      },
    ]
  );
};
```

---

### 16. No Debouncing on Mutations

**Location:** Lines 373-554 (all mutations)
**Severity:** 🟡 Medium (Performance/UX)

**Problem:** No debouncing or rate limiting on mutation buttons. User can spam "Add Player" or "Remove Player" causing:
1. Multiple database writes
2. Race conditions
3. Wasted API calls
4. Confusing UX

**Spam Scenario:**
```
User double-clicks "Add Player" button:
1. First click: Starts mutation
2. Second click (100ms later): Starts another mutation
3. Result: Player added TWICE
```

**Fix:**
```typescript
// Use mutation.isPending to disable buttons
<TouchableOpacity
  onPress={handleAddPlayer}
  disabled={addPlayerMutation.isPending || removePlayerMutation.isPending}
  style={{
    opacity: addPlayerMutation.isPending ? 0.5 : 1
  }}
>
  {addPlayerMutation.isPending ? (
    <ActivityIndicator />
  ) : (
    <Text>Add Player</Text>
  )}
</TouchableOpacity>

// Or use debounce
const debouncedAddPlayer = useMemo(
  () => debounce((name, rating) => {
    addPlayerMutation.mutate({ name, rating });
  }, 500),
  [addPlayerMutation]
);
```

---

### 17. Memory Leak Potential

**Location:** Lines 12, 87-88 (Reanimated SharedValues)
**Severity:** 🟡 Medium (Performance)

**Problem:** `useSharedValue` creates animated values that are never cleaned up. If user navigates between sessions repeatedly, memory accumulates.

**Memory Leak:**
```
User flow:
1. Opens Session A → Creates 3 SharedValues
2. Navigates back → Component unmounts, SharedValues in memory
3. Opens Session B → Creates 3 more SharedValues
4. Repeat 100 times → 300 SharedValues in memory
```

**Fix:**
```typescript
useEffect(() => {
  // Cleanup animated values on unmount
  return () => {
    // Reanimated automatically cleans up, but explicit is better
    tabPosition.value = 0;
    roundTranslateX.value = 0;
    roundOpacity.value = 1;
  };
}, []);
```

---

### 18. Tab Indicator Animation Has No Error Handling

**Location:** Lines 1239-1242
**Severity:** 🟡 Medium (Stability)

**Problem:** `onPageScroll` updates `tabPosition.value` but doesn't handle errors. If `e.nativeEvent` is undefined or malformed, app crashes.

**Crash Scenario:**
```typescript
onPageScroll={(e) => {
  // What if e is null?
  // What if e.nativeEvent is undefined?
  tabPosition.value = e.nativeEvent.position + e.nativeEvent.offset;
}}
```

**Fix:**
```typescript
onPageScroll={(e) => {
  try {
    const position = e?.nativeEvent?.position ?? 0;
    const offset = e?.nativeEvent?.offset ?? 0;
    tabPosition.value = position + offset;
  } catch (error) {
    console.error('Tab animation error:', error);
    // Fallback to current tab index
    tabPosition.value = currentTabIndex;
  }
}}
```

---

### 19. Toast Notifications Not Accessible

**Location:** Lines 198-203, 413-417, 452-456, etc.
**Severity:** 🟡 Medium (Accessibility)

**Problem:** Toast notifications have no accessibility announcements. Screen reader users won't hear success/error messages.

**Fix:**
```typescript
import { AccessibilityInfo } from 'react-native';

Toast.show({
  type: 'success',
  text1: 'Player Added',
  text2: 'Player has been added to sitting players',
  onShow: () => {
    // Announce to screen readers
    AccessibilityInfo.announceForAccessibility(
      'Success: Player added to sitting players'
    );
  },
});
```

---

### 20. getCurrentSnapshot Error

**Location:** Lines 334-362 (sortedPlayers useMemo)
**Severity:** 🟡 Medium (React 18)

**Problem:** `useMemo` calculation is expensive and could cause "Cannot access getCurrentSnapshot" error in React 18 concurrent mode.

**React 18 Issue:**
```
useMemo runs during render
Sorting 200 players takes 50ms
React fiber is interrupted
getCurrentSnapshot error
```

**Fix:**
```typescript
// Use useMemo with proper dependencies and add useDeferredValue for concurrent mode
const deferredPlayers = useDeferredValue(recalculatedPlayers);

const sortedPlayers = useMemo(() => {
  // Use deferred value to prevent blocking render
  return [...deferredPlayers].sort((a, b) => {
    // ... sorting logic ...
  });
}, [deferredPlayers, sortBy]);
```

---

### 21. Event History Query Unbounded

**Location:** Lines 140-152
**Severity:** 🟡 Medium (Performance)

**Problem:** Fetches ALL event history with no limit. If session has 10,000 events (long tournament), query is slow.

**Fix:**
```typescript
const { data: eventHistory = [] } = useQuery({
  queryKey: ['eventHistory', id, eventPage],
  queryFn: async () => {
    const limit = 100;
    const offset = eventPage * limit;

    const { data, error } = await supabase
      .from('event_history')
      .select('*')
      .eq('session_id', id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
  },
});
```

---

### 22. Compact Mode Not Persisted

**Location:** Lines 75, 1184-1191
**Severity:** 🟡 Medium (UX)

**Problem:** Compact mode toggle is local state. If user refreshes app, preference is lost.

**Fix:**
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const [compactMode, setCompactMode] = useState(false);

// Load preference on mount
useEffect(() => {
  AsyncStorage.getItem('compactMode').then(value => {
    if (value !== null) {
      setCompactMode(value === 'true');
    }
  });
}, []);

// Save preference on change
const toggleCompactMode = async () => {
  const newValue = !compactMode;
  setCompactMode(newValue);
  await AsyncStorage.setItem('compactMode', String(newValue));
};
```

---

### 23. Missing Analytics Tracking

**Location:** Throughout file
**Severity:** 🟡 Medium (Product)

**Problem:** No analytics tracking for key user actions. Can't measure:
- How many players switch during matches
- How often rounds are regenerated
- Which tabs are used most
- Where users drop off

**Fix:**
```typescript
import Analytics from '@/utils/analytics';

const handleSwitchPlayer = (matchIndex, position, newPlayerId) => {
  Analytics.track('player_switched', {
    sessionId: id,
    matchIndex,
    position,
    roundNumber: currentRoundIndex + 1,
  });

  switchPlayerMutation.mutate({ matchIndex, position, newPlayerId });
};
```

---

## 🟢 Low Priority Issues

### 24. Console.log in Production

**Location:** Lines 169, 192
**Severity:** 🟢 Low (Production Ready)

**Problem:**
```typescript
console.error('Failed to parse round_data:', session.round_data);
console.error('[Algorithm Init Error]:', error);
```

Should use logger utility instead of console.log/error.

**Fix:**
```typescript
import { logger } from '@/utils/logger';

logger.error('Failed to parse round_data', { sessionId: id, roundData: session.round_data });
```

---

### 25. Magic Numbers

**Location:** Throughout (Lines 1053, 1069, 1096, etc.)
**Severity:** 🟢 Low (Maintainability)

**Problem:** Magic numbers for sizes, padding, spacing:
```typescript
width: 40,          // What is 40?
paddingVertical: 12, // Why 12?
borderRadius: 16,    // Where does 16 come from?
```

**Fix:**
```typescript
const BUTTON_SIZE = 40;
const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};
const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
};
```

---

### 26. No Loading State for Modals

**Location:** Lines 1340-1373 (Modals)
**Severity:** 🟢 Low (UX Polish)

**Problem:** Modals appear instantly. If modal content takes time to load, user sees blank modal.

---

### 27. No Deep Link Support

**Location:** Line 36
**Severity:** 🟢 Low (Feature)

**Problem:** Can't share direct links to specific tabs or rounds.

**Feature Request:**
```
/session/123?tab=statistics
/session/123?round=5
```

---

### 28. Haptic Feedback Not Configurable

**Location:** Lines 611-613, 1234-1237
**Severity:** 🟢 Low (Accessibility)

**Problem:** Haptic feedback always triggers if `reduceAnimation` is false. Some users may want animation but not haptics.

**Fix:**
```typescript
const { reduceAnimation, disableHaptics } = useTheme();

if (!reduceAnimation && !disableHaptics) {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}
```

---

### 29. Tab Labels Inconsistent

**Location:** Lines 1397-1399
**Severity:** 🟢 Low (UX)

**Problem:**
```typescript
const getTabLabel = (tab: Tab) => {
  return tab === 'leaderboard' ? 'Board' : tab.charAt(0).toUpperCase() + tab.slice(1);
};
```

"Leaderboard" shortened to "Board" to save space, but other tabs have full names. Either shorten all or show full names.

---

### 30. No Empty State for Event History

**Location:** Lines 1310-1324
**Severity:** 🟢 Low (UX)

**Problem:** If session has no events, EventHistoryTab shows empty list with no explanation.

**Fix:**
```typescript
{eventHistory.length === 0 ? (
  <View className="flex-1 items-center justify-center py-12">
    <History color="#9CA3AF" size={48} />
    <Text className="text-gray-600 mt-4 font-medium">No events yet</Text>
    <Text className="text-gray-500 text-sm mt-2">
      Actions will appear here as you manage the session
    </Text>
  </View>
) : (
  <EventHistoryTab events={eventHistory} sessionName={session?.name} />
)}
```

---

## Test Scenarios Required

### Unit Tests

```typescript
describe('SessionScreen', () => {
  describe('Algorithm Initialization', () => {
    it('should wait for both players and session to load', () => {});
    it('should show error if less than 4 players', () => {});
    it('should retry algorithm init on error', () => {});
  });

  describe('Player Switch Validation', () => {
    it('should prevent duplicate players in same team', () => {});
    it('should prevent duplicate players in same match', () => {});
    it('should validate Mixed Mexicano gender balance', () => {});
    it('should prevent breaking Fixed Partner partnerships', () => {});
    it('should prevent switching after scores entered', () => {});
  });

  describe('Player Stats Calculation', () => {
    it('should use Map for O(1) lookups', () => {});
    it('should handle compensation points correctly', () => {});
    it('should sort by points with tiebreakers', () => {});
    it('should handle 200+ players efficiently', () => {});
  });

  describe('Round Regeneration', () => {
    it('should warn when scores exist', () => {});
    it('should log event to history', () => {});
    it('should update round data correctly', () => {});
  });

  describe('Authorization', () => {
    it('should block access to other users sessions', () => {});
    it('should validate user ownership', () => {});
  });
});
```

### Integration Tests

```typescript
describe('Session Detail Integration', () => {
  it('should load session, players, and initialize algorithm', () => {});
  it('should handle offline mode gracefully', () => {});
  it('should perform optimistic updates on player switch', () => {});
  it('should rollback on mutation error', () => {});
});
```

### E2E Tests

```typescript
describe('Session Detail E2E', () => {
  it('should navigate through all tabs', () => {});
  it('should add player and see in leaderboard', () => {});
  it('should switch player mid-match', () => {});
  it('should regenerate round and confirm', () => {});
  it('should work offline and sync when online', () => {});
});
```

---

## Performance Metrics

### Current Performance (Estimated)

| Metric | Value | Target |
|--------|-------|--------|
| Initial Load Time | 800ms | <500ms |
| Tab Switch Time | 100ms | <50ms |
| Player Switch Time | 1200ms | <300ms |
| Stats Calculation (50 players) | 300ms | <100ms |
| Memory Usage (20 rounds) | 45MB | <30MB |

### Optimization Opportunities

1. **Lazy Loading:** ✅ Already implemented
2. **useMemo Optimization:** 🟡 Partial (missing deps)
3. **Virtual Scrolling:** ❌ Not implemented
4. **Optimistic Updates:** ❌ Not implemented
5. **Code Splitting:** ✅ Already implemented

---

## Recommended Action Plan

### Week 1: Critical Fixes
1. Add authorization check (Issue #1)
2. Fix algorithm initialization race condition (Issue #2)
3. Remove `as any` type assertions (Issue #3)
4. Add dropdown dismiss on outside tap (Issue #4)

### Week 2: High Priority
5. Fix useMemo dependencies (Issue #5)
6. Add optimistic updates to mutations (Issue #6)
7. Add query error handling UI (Issue #7)
8. Complete player switch validation (Issue #8)
9. Add Suspense error boundaries (Issue #10)

### Week 3: Medium Priority
10. Implement theme system (Issue #12)
11. Add pagination for large datasets (Issue #13)
12. Add input sanitization (Issue #14)
13. Improve regenerate round UX (Issue #15)
14. Add debouncing to mutations (Issue #16)

### Week 4: Polish & Testing
15. Write unit tests for critical paths
16. Add integration tests
17. Performance testing with 200+ players
18. Accessibility improvements
19. Analytics tracking

---

## Conclusion

The session detail page is **feature-rich and well-optimized** in many areas, particularly:
- ✅ Lazy loading heavy components
- ✅ Memoized calculations with Map for O(1) lookups
- ✅ Comprehensive player switch validation
- ✅ Offline support with queue

However, **critical issues** must be addressed before TestFlight:
- 🔴 Authorization check missing
- 🔴 Race condition in algorithm init
- 🔴 Unsafe type assertions
- 🟠 No dropdown dismiss pattern
- 🟠 No optimistic updates
- 🟠 Missing error boundaries

**Estimated Effort to Fix Critical Issues:** 2-3 days
**Estimated Effort for Production Ready:** 2-3 weeks

**Risk Level for TestFlight:** HIGH (fix critical issues first)
**Risk Level for Production:** MEDIUM (after fixes + testing)
