# Comprehensive Test Coverage Plan - Mobile App

**Target**: Increase coverage from 19.76% to 70%+
**Approach**: 3 independent parallel agents
**Focus**: Logic-heavy code, business rules, state management

## Executive Summary

Current state: **701 tests passing, 110 failing, 19.76% coverage**

This plan divides untested code into 3 independent workstreams that can be executed in parallel by separate agents without file conflicts.

---

## Phase Distribution

### AGENT 1: Utilities & Core Logic (Pure Functions)
**Directory**: `utils/` and `config/`
**Type**: Pure TypeScript unit tests
**Complexity**: Low-Medium
**Files**: 13 files
**Expected Coverage**: +15%

### AGENT 2: Hooks & State Management
**Directory**: `hooks/`
**Type**: React hook tests with mocking
**Complexity**: Medium
**Files**: 8 untested hooks
**Expected Coverage**: +20%

### AGENT 3: Components & UI Logic
**Directory**: `components/` and `app/`
**Type**: Component tests + integration tests
**Complexity**: High
**Files**: 40+ components
**Expected Coverage**: +35%

---

# 🤖 AGENT 1: Utilities & Core Logic

## Overview
Focus on pure functions and utilities. No React, no UI. Clean unit tests with high coverage potential.

## Test Location
Create tests in: `__tests__/unit/utils/`

## Files to Test

### 1. `utils/formValidation.ts` ⭐ HIGH PRIORITY
**Purpose**: Validates form inputs across the app

**Test File**: `__tests__/unit/utils/formValidation.test.ts`

**Key Functions to Test**:
- Email validation (valid/invalid formats)
- Password strength validation (min length, complexity)
- Name validation (empty, too long, special chars)
- Number validation (courts, players, rounds)
- URL validation
- Phone number validation

**Test Scenarios**:
```typescript
describe('formValidation', () => {
  describe('validateEmail', () => {
    it('should accept valid email addresses', () => {
      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('user+tag@domain.co.uk')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(validateEmail('')).toBe(false);
      expect(validateEmail(null)).toBe(false);
      expect(validateEmail(undefined)).toBe(false);
    });
  });

  // Similar for password, name, number validations...
});
```

### 2. `utils/sessionValidation.ts` ⭐ HIGH PRIORITY
**Purpose**: Validates session configurations

**Test File**: `__tests__/unit/utils/sessionValidation.test.ts`

**Key Logic**:
- Validate player count vs courts
- Validate game modes vs player count
- Validate scoring configurations
- Validate date/time ranges

**Test Scenarios**:
- Valid configurations (happy path)
- Invalid player/court combinations
- Invalid game mode selections
- Boundary conditions (min/max players)
- Edge cases (empty arrays, nulls)

### 3. `utils/typeGuards.ts` ⭐ HIGH PRIORITY
**Purpose**: Runtime type checking

**Test File**: `__tests__/unit/utils/typeGuards.test.ts`

**Key Functions**:
- `isPlayer()`
- `isSession()`
- `isRound()`
- `isMatch()`
- Type narrowing functions

**Test Scenarios**:
```typescript
describe('typeGuards', () => {
  describe('isPlayer', () => {
    it('should return true for valid player objects', () => {
      const player = { id: '1', name: 'Alice', rating: 5, ... };
      expect(isPlayer(player)).toBe(true);
    });

    it('should return false for invalid objects', () => {
      expect(isPlayer({})).toBe(false);
      expect(isPlayer({ id: '1' })).toBe(false); // missing fields
      expect(isPlayer(null)).toBe(false);
    });

    it('should validate all required fields', () => {
      const incomplete = { id: '1', name: 'Alice' }; // missing rating
      expect(isPlayer(incomplete)).toBe(false);
    });
  });
});
```

### 4. `utils/pinUtils.ts`
**Purpose**: Generate and validate session PINs

**Test File**: `__tests__/unit/utils/pinUtils.test.ts`

**Key Functions**:
- `generatePIN()` - Creates 4-digit PIN
- `validatePIN()` - Checks PIN format
- `hashPIN()` - Hashes PIN for storage

**Test Scenarios**:
- PIN generation produces 4 digits
- PINs are unique (test multiple generations)
- Validation accepts 4 digits only
- Validation rejects invalid formats
- Hash function is deterministic

### 5. `utils/retryWithBackoff.ts`
**Purpose**: Retry logic with exponential backoff

**Test File**: `__tests__/unit/utils/retryWithBackoff.test.ts`

**Key Logic**:
- Retry failed operations
- Exponential backoff calculation
- Max retry limit
- Success after N retries

**Test Scenarios**:
```typescript
describe('retryWithBackoff', () => {
  it('should retry failed operations', async () => {
    let attempts = 0;
    const operation = jest.fn().mockImplementation(() => {
      attempts++;
      if (attempts < 3) throw new Error('Fail');
      return 'success';
    });

    const result = await retryWithBackoff(operation, { maxRetries: 5 });
    expect(result).toBe('success');
    expect(attempts).toBe(3);
  });

  it('should throw after max retries', async () => {
    const operation = jest.fn().mockRejectedValue(new Error('Always fail'));

    await expect(
      retryWithBackoff(operation, { maxRetries: 3 })
    ).rejects.toThrow('Always fail');
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it('should use exponential backoff', async () => {
    const delays: number[] = [];
    const operation = jest.fn().mockRejectedValue(new Error('Fail'));

    try {
      await retryWithBackoff(operation, {
        maxRetries: 3,
        onRetry: (delay) => delays.push(delay)
      });
    } catch (e) {}

    // Verify delays: [1000, 2000, 4000] (exponential)
    expect(delays[1]).toBeGreaterThan(delays[0]);
    expect(delays[2]).toBeGreaterThan(delays[1]);
  });
});
```

### 6. `utils/animations.ts`
**Purpose**: Animation timing and easing functions

**Test File**: `__tests__/unit/utils/animations.test.ts`

**Key Functions**:
- Easing functions (easeIn, easeOut, easeInOut)
- Timing calculations
- Animation duration helpers

**Test Scenarios**:
- Easing functions return values in [0, 1]
- Timing calculations are correct
- Edge cases (t=0, t=1)

### 7. `utils/logger.ts`
**Purpose**: Application logging utility

**Test File**: `__tests__/unit/utils/logger.test.ts`

**Key Logic**:
- Log levels (debug, info, warn, error)
- Conditional logging based on environment
- Log formatting

**Test Scenarios**:
- Logs at appropriate levels
- Respects environment settings (no debug in production)
- Formats log messages correctly

### 8. `utils/loki-client.ts`
**Purpose**: Grafana Loki integration

**Test File**: `__tests__/unit/utils/loki-client.test.ts`

**Key Functions**:
- Push logs to Loki
- Format log entries
- Batch log sending
- Error handling

**Test Scenarios**:
- Mock fetch calls
- Verify log format
- Test batching logic
- Handle network errors gracefully

### 9. `utils/posthog-wrapper.ts`
**Purpose**: PostHog analytics wrapper

**Test File**: `__tests__/unit/utils/posthog-wrapper.test.ts`

**Key Functions**:
- Track events
- Set user properties
- Initialize PostHog
- Privacy controls

**Test Scenarios**:
- Mock PostHog library
- Verify event tracking calls
- Test initialization
- Respect privacy settings (opt-out)

### 10. `utils/sentry-wrapper.ts`
**Purpose**: Sentry error tracking wrapper

**Test File**: `__tests__/unit/utils/sentry-wrapper.test.ts`

**Key Functions**:
- Capture errors
- Set user context
- Add breadcrumbs
- Initialize Sentry

**Test Scenarios**:
- Mock Sentry library
- Verify error capture
- Test context setting
- Handle initialization errors

### 11. `utils/accountSimulator.ts`
**Purpose**: Simulate account states for testing

**Test File**: `__tests__/unit/utils/accountSimulator.test.ts`

**Key Functions**:
- Generate mock users
- Simulate account states
- Create test data

**Test Scenarios**:
- Generate valid mock data
- Different account states
- Edge cases

### 12. `config/react-query.ts`
**Purpose**: React Query configuration

**Test File**: `__tests__/unit/config/react-query.test.ts`

**Key Logic**:
- QueryClient configuration
- Default options
- Retry logic
- Cache time settings

**Test Scenarios**:
```typescript
describe('React Query Config', () => {
  it('should create QueryClient with correct defaults', () => {
    const client = createQueryClient();
    expect(client).toBeDefined();
    expect(client.getDefaultOptions().queries?.retry).toBe(3);
  });

  it('should configure offline behavior', () => {
    const client = createQueryClient();
    const options = client.getDefaultOptions();
    expect(options.queries?.networkMode).toBe('offlineFirst');
  });
});
```

### 13. `config/supabase.ts`
**Purpose**: Supabase client configuration

**Test File**: `__tests__/unit/config/supabase.test.ts`

**Key Logic**:
- Client initialization
- AsyncStorage integration
- Environment variables
- Error handling

**Test Scenarios**:
- Mock AsyncStorage
- Verify client creation
- Test missing env vars
- Handle initialization errors

## Testing Patterns for Agent 1

### Pattern 1: Pure Function Testing
```typescript
import { functionToTest } from '../../../utils/fileName';

describe('functionName', () => {
  it('should handle valid input', () => {
    const result = functionToTest(validInput);
    expect(result).toBe(expectedOutput);
  });

  it('should handle invalid input', () => {
    expect(() => functionToTest(invalidInput)).toThrow();
  });

  it('should handle edge cases', () => {
    expect(functionToTest(null)).toBe(defaultValue);
    expect(functionToTest(undefined)).toBe(defaultValue);
    expect(functionToTest('')).toBe(defaultValue);
  });
});
```

### Pattern 2: Mocking External Dependencies
```typescript
import { sendToLoki } from '../../../utils/loki-client';

jest.mock('fetch');
const mockedFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('loki-client', () => {
  beforeEach(() => {
    mockedFetch.mockClear();
  });

  it('should send logs to Loki', async () => {
    mockedFetch.mockResolvedValue({
      ok: true,
      status: 200,
    } as Response);

    await sendToLoki({ level: 'info', message: 'test' });

    expect(mockedFetch).toHaveBeenCalledWith(
      expect.stringContaining('loki'),
      expect.objectContaining({
        method: 'POST',
        body: expect.any(String),
      })
    );
  });
});
```

## Success Criteria for Agent 1

✅ All 13 files have comprehensive test coverage
✅ Each function has 3+ test cases (happy path, error, edge cases)
✅ Code coverage for utils/ directory > 80%
✅ All tests pass independently
✅ No external dependencies (no React, no UI)
✅ Fast execution (< 2 seconds for all utils tests)

---

# 🤖 AGENT 2: Hooks & State Management

## Overview
Test React hooks with proper mocking of external dependencies (Supabase, AsyncStorage, React Query).

## Test Location
Create tests in: `hooks/__tests__/`

## Setup Requirements
```typescript
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create wrapper with providers
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};
```

## Files to Test

### 1. `hooks/useOfflineSync.tsx` ⭐ HIGH PRIORITY
**Purpose**: Synchronize offline changes when back online

**Test File**: `hooks/__tests__/useOfflineSync.test.tsx`

**Key Logic**:
- Queue offline mutations
- Sync when network available
- Handle sync conflicts
- Clear queue after success

**Test Scenarios**:
```typescript
describe('useOfflineSync', () => {
  it('should queue mutations when offline', async () => {
    const { result } = renderHook(() => useOfflineSync(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.queueMutation('createPlayer', { name: 'Alice' });
    });

    expect(result.current.queueLength).toBe(1);
  });

  it('should sync queue when online', async () => {
    // Mock network status change
    const { result } = renderHook(() => useOfflineSync(), {
      wrapper: createWrapper(),
    });

    // Queue mutations while offline
    await act(async () => {
      await result.current.queueMutation('createPlayer', { name: 'Alice' });
      await result.current.queueMutation('updateScore', { matchId: '1', score: 10 });
    });

    // Trigger online event
    await act(async () => {
      await result.current.syncQueue();
    });

    await waitFor(() => {
      expect(result.current.queueLength).toBe(0);
    });
  });

  it('should handle sync errors', async () => {
    // Mock failed sync
    const { result } = renderHook(() => useOfflineSync(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.queueMutation('failingMutation', {});
    });

    await act(async () => {
      await result.current.syncQueue();
    });

    // Should keep failed mutations in queue
    expect(result.current.queueLength).toBeGreaterThan(0);
    expect(result.current.lastError).toBeDefined();
  });
});
```

### 2. `hooks/useSubscription.ts` ⭐ HIGH PRIORITY
**Purpose**: Manage user subscription state

**Test File**: `hooks/__tests__/useSubscription.test.ts`

**Key Logic**:
- Fetch subscription status
- Check feature availability
- Handle subscription changes
- Cache subscription data

**Test Scenarios**:
- Free tier user (limited features)
- Premium user (all features)
- Expired subscription
- Loading states
- Error handling

### 3. `hooks/useClubInvitations.ts`
**Purpose**: Manage club invitation state

**Test File**: `hooks/__tests__/useClubInvitations.test.ts`

**Key Functions**:
- Fetch pending invitations
- Accept invitation
- Decline invitation
- Optimistic updates

**Test Scenarios**:
```typescript
describe('useClubInvitations', () => {
  it('should fetch pending invitations', async () => {
    const { result } = renderHook(() => useClubInvitations(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should accept invitation', async () => {
    const { result } = renderHook(() => useClubInvitations(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.acceptInvitation('invite-123');
    });

    // Verify invitation removed from list
    expect(result.current.data).not.toContainEqual(
      expect.objectContaining({ id: 'invite-123' })
    );
  });
});
```

### 4. `hooks/useClubMembers.ts`
**Purpose**: Manage club member list

**Test File**: `hooks/__tests__/useClubMembers.test.ts`

**Key Functions**:
- Fetch club members
- Add member
- Remove member
- Update member role

**Test Scenarios**:
- Load members list
- Add new member
- Remove member (optimistic update)
- Change member role
- Handle permission errors

### 5. `hooks/useNotificationPreferences.ts`
**Purpose**: Manage notification settings

**Test File**: `hooks/__tests__/useNotificationPreferences.test.ts`

**Key Functions**:
- Load preferences
- Update preferences
- Sync with AsyncStorage
- Handle defaults

**Test Scenarios**:
- Load saved preferences
- Update individual setting
- Save to storage
- Handle missing preferences (defaults)

### 6. `hooks/useScoreEntryPreference.ts`
**Purpose**: Manage score entry UI preference

**Test File**: `hooks/__tests__/useScoreEntryPreference.test.ts`

**Key Logic**:
- Get current preference (manual/quick)
- Set preference
- Persist to storage

**Test Scenarios**:
```typescript
describe('useScoreEntryPreference', () => {
  it('should default to manual entry', () => {
    const { result } = renderHook(() => useScoreEntryPreference());
    expect(result.current.preference).toBe('manual');
  });

  it('should update preference', async () => {
    const { result } = renderHook(() => useScoreEntryPreference());

    await act(async () => {
      await result.current.setPreference('quick');
    });

    expect(result.current.preference).toBe('quick');
  });

  it('should persist preference', async () => {
    const { result } = renderHook(() => useScoreEntryPreference());

    await act(async () => {
      await result.current.setPreference('quick');
    });

    // Unmount and remount
    const { result: result2 } = renderHook(() => useScoreEntryPreference());

    await waitFor(() => {
      expect(result2.current.preference).toBe('quick');
    });
  });
});
```

### 7. `hooks/useSafeRouter.ts`
**Purpose**: Safe navigation wrapper

**Test File**: `hooks/__tests__/useSafeRouter.test.ts`

**Key Logic**:
- Navigate safely (catch errors)
- Prevent navigation during loading
- Handle deep links

**Test Scenarios**:
- Successful navigation
- Navigation error handling
- Blocked navigation (loading state)

### 8. `hooks/useAnimationPreference.tsx`
**Purpose**: Manage reduced motion preference

**Test File**: `hooks/__tests__/useAnimationPreference.test.tsx`

**Key Logic**:
- Detect system preference
- Allow manual override
- Persist setting

**Test Scenarios**:
- Detect reduced motion setting
- Override system preference
- Persist override

## Testing Patterns for Agent 2

### Pattern 1: Hook with React Query
```typescript
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

describe('useDataHook', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  it('should fetch data', async () => {
    const wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    const { result } = renderHook(() => useDataHook(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeDefined();
    });
  });
});
```

### Pattern 2: Hook with AsyncStorage
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage');
const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('useStorageHook', () => {
  beforeEach(() => {
    mockAsyncStorage.getItem.mockClear();
    mockAsyncStorage.setItem.mockClear();
  });

  it('should load from storage', async () => {
    mockAsyncStorage.getItem.mockResolvedValue('{"key": "value"}');

    const { result } = renderHook(() => useStorageHook());

    await waitFor(() => {
      expect(result.current.data).toEqual({ key: 'value' });
    });
  });
});
```

## Success Criteria for Agent 2

✅ All 8 untested hooks have comprehensive coverage
✅ Each hook has tests for: loading, success, error states
✅ Optimistic updates are tested
✅ Side effects (storage, network) are mocked
✅ Code coverage for hooks/ directory > 85%
✅ All tests use proper React Testing Library patterns
✅ No actual network calls or storage writes in tests

---

# 🤖 AGENT 3: Components & UI Logic

## Overview
Test React Native components with business logic. May need to fix some failing tests.

## Test Location
Create tests in component directories: `components/**/__tests__/`

## Priority: Fix Failing Tests First

### FAILING TEST 1: `components/session/RoundsTab.tsx`
**Current Status**: 3 test files failing
**Files**:
- `RoundsTab.test.tsx`
- `RoundsTab.errorHandling.test.tsx`
- `RoundsTab.memoryLeak.test.tsx`

**Action**: Debug and fix these tests before creating new ones

### FAILING TEST 2: `components/session/LeaderboardTab.tsx`
**Current Status**: Tests failing
**File**: `LeaderboardTab.test.tsx`

**Action**: Fix failing tests

### FAILING TEST 3: `app/(tabs)/settings.tsx`
**Current Status**: Tests failing
**File**: `settings.test.tsx`

**Action**: Fix failing tests

## New Component Tests

### Session Components

#### 1. `components/session/StatisticsTab.tsx` ⭐ HIGH PRIORITY
**Test File**: `components/session/__tests__/StatisticsTab.test.tsx`

**Key Features**:
- Display player statistics
- Show partnerships
- Head-to-head comparisons
- Filter by player

**Test Scenarios**:
```typescript
describe('StatisticsTab', () => {
  it('should render player statistics', () => {
    const { getByText } = render(
      <StatisticsTab sessionId="123" />
    );

    expect(getByText(/Total Points/i)).toBeTruthy();
    expect(getByText(/Win Rate/i)).toBeTruthy();
  });

  it('should show partnerships', () => {
    const { getByText } = render(
      <StatisticsTab sessionId="123" />
    );

    fireEvent.press(getByText('Partnerships'));

    expect(getByText(/Partnership Win Rate/i)).toBeTruthy();
  });

  it('should filter by player', () => {
    const { getByPlaceholderText, queryByText } = render(
      <StatisticsTab sessionId="123" />
    );

    const searchInput = getByPlaceholderText('Search player...');
    fireEvent.changeText(searchInput, 'Alice');

    expect(queryByText('Bob')).toBeNull();
    expect(getByText('Alice')).toBeTruthy();
  });
});
```

#### 2. `components/session/EventHistoryTab.tsx` ⭐ HIGH PRIORITY
**Test File**: `components/session/__tests__/EventHistoryTab.test.tsx`

**Key Features**:
- Display chronological event log
- Filter by event type
- Export history
- Pagination

**Test Scenarios**:
- Render events chronologically
- Filter by type (score entry, player added, etc.)
- Handle export
- Load more events (pagination)

#### 3. `components/session/ScoreEntryModal.tsx`
**Test File**: `components/session/__tests__/ScoreEntryModal.test.tsx`

**Key Features**:
- Enter match scores
- Quick entry mode
- Manual entry mode
- Validation

**Test Scenarios**:
```typescript
describe('ScoreEntryModal', () => {
  it('should enter scores in manual mode', () => {
    const onSave = jest.fn();
    const { getByLabelText, getByText } = render(
      <ScoreEntryModal
        matchId="match-1"
        onSave={onSave}
        mode="manual"
      />
    );

    fireEvent.changeText(getByLabelText('Team 1 Score'), '11');
    fireEvent.changeText(getByLabelText('Team 2 Score'), '9');
    fireEvent.press(getByText('Save'));

    expect(onSave).toHaveBeenCalledWith({
      team1Score: 11,
      team2Score: 9,
    });
  });

  it('should validate scores', () => {
    const { getByLabelText, getByText } = render(
      <ScoreEntryModal matchId="match-1" onSave={jest.fn()} />
    );

    fireEvent.changeText(getByLabelText('Team 1 Score'), '25'); // Invalid
    fireEvent.press(getByText('Save'));

    expect(getByText(/Invalid score/i)).toBeTruthy();
  });
});
```

#### 4. `components/session/MatchScoreInput.tsx`
**Test File**: `components/session/__tests__/MatchScoreInput.test.tsx`

**Key Features**:
- Inline score input
- Increment/decrement buttons
- Direct input
- Validation

**Test Scenarios**:
- Increment score
- Decrement score
- Direct input
- Min/max validation

#### 5. `components/session/GameScoreTracker.tsx`
**Test File**: `components/session/__tests__/GameScoreTracker.test.tsx`

**Key Features**:
- Track game-by-game scores
- Display current game
- Win detection
- Deuce handling

**Test Scenarios**:
- Track multiple games
- Detect win conditions
- Handle deuce scenarios
- Reset after game complete

#### 6. `components/session/PublicLeaderboard.tsx`
**Test File**: `components/session/__tests__/PublicLeaderboard.test.tsx`

**Key Features**:
- Display public leaderboard
- No authentication required
- Read-only view
- Automatic refresh

**Test Scenarios**:
- Render without auth
- Display player rankings
- Auto-refresh data
- Handle loading states

#### 7. `components/session/ShareResultsModal.tsx`
**Test File**: `components/session/__tests__/ShareResultsModal.test.tsx`

**Key Features**:
- Generate share link
- Copy to clipboard
- QR code generation
- Privacy settings

**Test Scenarios**:
- Generate public link
- Copy link to clipboard
- Generate QR code
- Respect privacy settings

#### 8. `components/session/AddPlayerModal.tsx`
**Test File**: `components/session/__tests__/AddPlayerModal.test.tsx`

**Key Features**:
- Add player to session
- Validate player data
- Prevent duplicates
- Close modal on success

**Test Scenarios**:
```typescript
describe('AddPlayerModal', () => {
  it('should add new player', async () => {
    const onAdd = jest.fn();
    const { getByPlaceholderText, getByText } = render(
      <AddPlayerModal onAdd={onAdd} />
    );

    fireEvent.changeText(getByPlaceholderText('Player Name'), 'Charlie');
    fireEvent.changeText(getByPlaceholderText('Rating'), '7');
    fireEvent.press(getByText('Add Player'));

    await waitFor(() => {
      expect(onAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Charlie',
          rating: 7,
        })
      );
    });
  });

  it('should prevent duplicate names', () => {
    const existingPlayers = [{ name: 'Alice' }];
    const { getByPlaceholderText, getByText } = render(
      <AddPlayerModal
        existingPlayers={existingPlayers}
        onAdd={jest.fn()}
      />
    );

    fireEvent.changeText(getByPlaceholderText('Player Name'), 'Alice');
    fireEvent.press(getByText('Add Player'));

    expect(getByText(/Player already exists/i)).toBeTruthy();
  });
});
```

#### 9. `components/session/ManagePlayersModal.tsx`
**Test File**: `components/session/__tests__/ManagePlayersModal.test.tsx`

**Key Features**:
- List all players
- Change player status
- Remove players
- Bulk actions

**Test Scenarios**:
- Display player list
- Change status (active/sitting/departed)
- Remove player confirmation
- Bulk status change

#### 10. `components/session/SwitchPlayerModal.tsx`
**Test File**: `components/session/__tests__/SwitchPlayerModal.test.tsx`

**Key Features**:
- Replace player mid-session
- Validate replacement
- Update match history
- Confirm action

**Test Scenarios**:
- Select replacement player
- Confirm switch
- Handle invalid selections
- Cancel action

#### 11. `components/session/PINVerificationSheet.tsx`
**Test File**: `components/session/__tests__/PINVerificationSheet.test.tsx`

**Key Features**:
- Enter 4-digit PIN
- Verify against session PIN
- Handle incorrect PIN
- Lock after attempts

**Test Scenarios**:
- Correct PIN entry
- Incorrect PIN
- Multiple failed attempts
- Auto-lock after 3 failures

#### 12. `components/session/CourtCard.tsx`
**Test File**: `components/session/__tests__/CourtCard.test.tsx`

**Key Features**:
- Display court information
- Show current match
- Status indicator
- Action buttons

**Test Scenarios**:
- Display court number
- Show playing teams
- Display match status
- Handle empty court

### Create Session Components

#### 13. `components/create/CourtSelector.tsx`
**Test File**: `components/create/__tests__/CourtSelector.test.tsx`

**Key Features**:
- Select number of courts
- Increment/decrement
- Min/max validation
- Visual feedback

**Test Scenarios**:
```typescript
describe('CourtSelector', () => {
  it('should increment court count', () => {
    const onChange = jest.fn();
    const { getByLabelText } = render(
      <CourtSelector value={1} onChange={onChange} />
    );

    fireEvent.press(getByLabelText('Increment courts'));

    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('should enforce maximum courts', () => {
    const onChange = jest.fn();
    const { getByLabelText } = render(
      <CourtSelector value={4} onChange={onChange} max={4} />
    );

    const incrementBtn = getByLabelText('Increment courts');
    expect(incrementBtn).toBeDisabled();
  });
});
```

#### 14. `components/create/DurationSelector.tsx`
**Test File**: `components/create/__tests__/DurationSelector.test.tsx`

**Key Features**:
- Select session duration
- Preset options
- Custom duration
- Validation

**Test Scenarios**:
- Select preset duration
- Enter custom duration
- Validate min/max duration
- Handle invalid input

#### 15. `components/create/ScoringModeSelector.tsx`
**Test File**: `components/create/__tests__/ScoringModeSelector.test.tsx`

**Key Features**:
- Select scoring mode
- Show explanation
- Configure points/games
- Validation

**Test Scenarios**:
- Select points mode
- Select first_to mode
- Select total_games mode
- Show mode explanation
- Validate configuration

#### 16. `components/create/ScoringConfigInput.tsx`
**Test File**: `components/create/__tests__/ScoringConfigInput.test.tsx`

**Key Features**:
- Configure points to win
- Configure games to play
- Validation
- Dynamic updates

**Test Scenarios**:
- Set points to win
- Set number of games
- Validate ranges
- Update on mode change

#### 17. `components/create/PresetSelector.tsx`
**Test File**: `components/create/__tests__/PresetSelector.test.tsx`

**Key Features**:
- Select game preset
- Load preset configuration
- Override preset values
- Save custom preset

**Test Scenarios**:
- Load preset
- Apply preset settings
- Modify preset
- Save new preset

#### 18. `components/create/DateTimePickerModal.tsx`
**Test File**: `components/create/__tests__/DateTimePickerModal.test.tsx`

**Key Features**:
- Select date
- Select time
- Validate past dates
- Time zone handling

**Test Scenarios**:
- Select valid date/time
- Reject past dates
- Handle time zones
- Cancel selection

### Club Components

#### 19. `components/clubs/ClubCard.tsx`
**Test File**: `components/clubs/__tests__/ClubCard.test.tsx`

**Key Features**:
- Display club info
- Show member count
- Action buttons
- Navigation

**Test Scenarios**:
- Display club name
- Show member count
- Navigate on press
- Show admin badge

#### 20. `components/clubs/ClubSelector.tsx`
**Test File**: `components/clubs/__tests__/ClubSelector.test.tsx`

**Key Features**:
- List user clubs
- Select club
- Create new club
- Search clubs

**Test Scenarios**:
- Display club list
- Select club
- Navigate to create
- Search functionality

### Other Components

#### 21. `components/auth/DeviceManagementModal.tsx`
**Test File**: `components/auth/__tests__/DeviceManagementModal.test.tsx`

**Key Features**:
- List logged-in devices
- Remove device
- Current device indicator
- Refresh list

**Test Scenarios**:
- Display device list
- Remove device
- Show current device
- Refresh devices

#### 22. `components/ui/SessionSettingsModal.tsx`
**Test File**: `components/ui/__tests__/SessionSettingsModal.test.tsx`

**Key Features**:
- Configure session settings
- Update settings
- Validate changes
- Save confirmation

**Test Scenarios**:
- Update setting
- Validate input
- Save changes
- Cancel changes

#### 23. `components/OfflineBanner.tsx`
**Test File**: `components/__tests__/OfflineBanner.test.tsx`

**Key Features**:
- Show when offline
- Hide when online
- Pending sync count
- Manual sync trigger

**Test Scenarios**:
```typescript
describe('OfflineBanner', () => {
  it('should show when offline', () => {
    const { getByText } = render(
      <OfflineBanner isOnline={false} pendingCount={3} />
    );

    expect(getByText(/offline/i)).toBeTruthy();
    expect(getByText(/3 changes pending/i)).toBeTruthy();
  });

  it('should hide when online', () => {
    const { queryByText } = render(
      <OfflineBanner isOnline={true} pendingCount={0} />
    );

    expect(queryByText(/offline/i)).toBeNull();
  });
});
```

## App Screens (Lower Priority)

#### 24. `app/(tabs)/home.tsx`
**Test File**: `app/(tabs)/__tests__/home.test.tsx`

**Key Features**:
- Display active sessions
- Create new session
- Navigate to session
- Refresh sessions

**Test Scenarios**:
- Render session list
- Navigate to create
- Navigate to session details
- Pull to refresh

#### 25. `app/(tabs)/profile.tsx`
**Test File**: `app/(tabs)/__tests__/profile.test.tsx`

**Key Features**:
- Display user info
- Edit profile button
- Logout button
- Settings link

**Test Scenarios**:
- Display user data
- Navigate to edit
- Handle logout
- Navigate to settings

## Testing Patterns for Agent 3

### Pattern 1: Component Rendering
```typescript
import { render } from '@testing-library/react-native';

describe('ComponentName', () => {
  it('should render correctly', () => {
    const { getByText } = render(<ComponentName />);
    expect(getByText('Expected Text')).toBeTruthy();
  });
});
```

### Pattern 2: User Interactions
```typescript
import { render, fireEvent } from '@testing-library/react-native';

describe('InteractiveComponent', () => {
  it('should handle button press', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button onPress={onPress} title="Click Me" />
    );

    fireEvent.press(getByText('Click Me'));
    expect(onPress).toHaveBeenCalled();
  });
});
```

### Pattern 3: Async Operations
```typescript
import { render, waitFor } from '@testing-library/react-native';

describe('AsyncComponent', () => {
  it('should load data', async () => {
    const { getByText, queryByText } = render(<DataComponent />);

    expect(queryByText('Loading...')).toBeTruthy();

    await waitFor(() => {
      expect(getByText('Data Loaded')).toBeTruthy();
    });
  });
});
```

### Pattern 4: Form Validation
```typescript
import { render, fireEvent } from '@testing-library/react-native';

describe('FormComponent', () => {
  it('should validate input', () => {
    const { getByPlaceholderText, getByText } = render(<Form />);

    const input = getByPlaceholderText('Email');
    fireEvent.changeText(input, 'invalid-email');
    fireEvent.press(getByText('Submit'));

    expect(getByText(/Invalid email/i)).toBeTruthy();
  });
});
```

## Success Criteria for Agent 3

✅ Fix all failing tests (RoundsTab, LeaderboardTab, settings)
✅ Add tests for 20+ untested components
✅ Each component has 5+ test scenarios
✅ Test happy path, error states, edge cases
✅ Code coverage for components/ directory > 60%
✅ All UI interactions are tested
✅ Form validations are comprehensive
✅ Loading and error states are verified

---

## Global Testing Standards

### All Agents Must Follow

1. **File Naming**: `[filename].test.ts` or `[filename].test.tsx`
2. **Test Structure**: Describe blocks organized by feature
3. **Coverage Target**: 70%+ per file
4. **Assertions**: Minimum 3 test cases per function
5. **Mocking**: Mock external dependencies (Supabase, AsyncStorage, fetch)
6. **Cleanup**: Use beforeEach/afterEach for setup/teardown
7. **Independence**: Tests run in any order
8. **Speed**: Unit tests < 5ms, component tests < 50ms each

### Test Organization
```typescript
describe('FeatureName', () => {
  describe('SubFeature', () => {
    it('should handle happy path', () => {});
    it('should handle errors', () => {});
    it('should handle edge cases', () => {});
  });
});
```

### Common Mocks
```typescript
// Mock Supabase
jest.mock('../config/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getSession: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
    },
  },
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock React Navigation
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));
```

---

## Final Deliverables

Each agent must provide:

1. **Test files** in correct locations
2. **Coverage report** for their domain
3. **Summary document** listing:
   - Files tested
   - Test scenarios covered
   - Coverage percentage achieved
   - Any issues encountered

---

## Execution Timeline

**Week 1**: All agents work in parallel
**Week 2**: Integration, fix conflicts, achieve 70%+ coverage

---

## Success Metrics

**Current**: 19.76% coverage, 701 passing, 110 failing
**Target**: 70%+ coverage, 900+ passing, 0 failing

**Agent 1 Target**: utils/ at 85%+ coverage
**Agent 2 Target**: hooks/ at 85%+ coverage
**Agent 3 Target**: components/ at 65%+ coverage

---

## Questions & Support

If any agent encounters issues:
1. Document the issue
2. Continue with other files
3. Report blockers in summary

**DO NOT**:
- Edit files outside your assigned directory
- Modify existing passing tests without approval
- Skip edge cases or error scenarios
- Write integration tests (Agent 3 only)

---

**Good luck! Focus on logic, edge cases, and comprehensive coverage. 🚀**
