# Testing Strategy - Courtster Mobile

This document outlines the comprehensive testing strategy for the Courtster mobile application, including automation approaches, tooling, best practices, and implementation roadmap.

Last updated: 2025-10-31

---

## Table of Contents

1. [Current State](#current-state)
2. [Testing Pyramid](#testing-pyramid)
3. [Unit Testing](#unit-testing)
4. [Integration Testing](#integration-testing)
5. [E2E Testing](#e2e-testing)
6. [Visual Regression Testing](#visual-regression-testing)
7. [Performance Testing](#performance-testing)
8. [Tooling & Infrastructure](#tooling--infrastructure)
9. [CI/CD Integration](#cicd-integration)
10. [Implementation Roadmap](#implementation-roadmap)
11. [Best Practices](#best-practices)

---

## Current State

### ✅ What Exists

**Testing Infrastructure:**
- ✅ Jest configured with `jest-expo` preset
- ✅ React Native Testing Library installed
- ✅ Test scripts in package.json (`test`, `test:watch`, `test:coverage`)
- ✅ Jest setup file with proper mocks

**Existing Tests (4 files):**
1. `components/session/__tests__/LeaderboardTab.test.tsx` - **Comprehensive** (360 lines)
   - Rendering tests
   - Sorting functionality
   - Player actions
   - Status indicators
   - Visual consistency
   - Responsiveness

2. `app/(tabs)/__tests__/settings.test.tsx` - Basic screen test
3. `app/(auth)/__tests__/login.test.tsx` - Basic screen test
4. `__tests__/platform-styling.test.tsx` - Platform-specific styling test

**Coverage:**
- Configured to collect from `app/`, `components/`, `hooks/`, `utils/`
- Currently ~2% coverage (4 test files out of 200+ source files)

### ❌ What's Missing

- **No E2E testing** (Detox, Maestro, or Appium)
- **No integration tests** for critical flows
- **No visual regression testing**
- **No performance/load testing**
- **No API mocking strategy** (MSW or similar)
- **No test data factories**
- **No accessibility testing**
- **No CI/CD test automation**
- **95%+ of components untested**

---

## Testing Pyramid

We follow the standard testing pyramid approach:

```
                    /\
                   /  \
                  / E2E \          10% - Full user flows
                 /______\
                /        \
               /Integration\       30% - Feature workflows
              /____________\
             /              \
            /  Unit Tests    \     60% - Components, hooks, utils
           /__________________\
```

### Target Distribution

| Test Type | Coverage Target | Current | Gap |
|-----------|----------------|---------|-----|
| **Unit Tests** | 60-70% | ~2% | 58-68% |
| **Integration Tests** | 20-30% | 0% | 20-30% |
| **E2E Tests** | 5-10% critical paths | 0% | 5-10% |

---

## Unit Testing

### 1.1 Scope

Test individual components, hooks, and utility functions in isolation.

**What to Test:**
- ✅ Component rendering
- ✅ User interactions (button presses, input changes)
- ✅ Conditional rendering
- ✅ Props handling
- ✅ Custom hooks logic
- ✅ Utility functions
- ✅ Data transformations

**What NOT to Test:**
- ❌ Implementation details (internal state names)
- ❌ Third-party library internals
- ❌ Styling specifics (use visual regression instead)
- ❌ Complex integration flows (use integration tests)

### 1.2 Priority Components (Ordered by Criticality)

#### **Critical - Must Have Tests (P0)**

1. **Session Management**
   - [ ] `RoundsTab.tsx` - Score entry, round navigation, sitting players
   - [ ] `LeaderboardTab.tsx` - ✅ **Already tested**
   - [ ] `StatisticsTab.tsx` - Partnerships, head-to-head stats
   - [ ] `EventHistoryTab.tsx` - Event display, export

2. **Authentication**
   - [ ] `app/(auth)/login.tsx` - Form validation, sign in
   - [ ] `app/(auth)/signup.tsx` - Form validation, sign up
   - [ ] `hooks/useAuth.ts` - Auth state management

3. **Core Hooks**
   - [ ] `hooks/useSession.ts` - Session data fetching
   - [ ] `hooks/usePlayers.ts` - Player management
   - [ ] `hooks/useClubs.ts` - Club operations

4. **Utilities**
   - [ ] `utils/offlineQueue.ts` - Queue operations, sync logic
   - [ ] `services/reclubImportService.ts` - HTML parsing, validation

#### **High Priority (P1)**

5. **Session Creation**
   - [ ] `app/(tabs)/create-session.tsx` - Form validation, club selection
   - [ ] `components/create/PlayerSelector.tsx` - Player search, selection

6. **Profile & Settings**
   - [ ] `app/(tabs)/profile.tsx` - Profile display, edit navigation
   - [ ] `app/(tabs)/edit-profile.tsx` - Form validation, avatar upload
   - [ ] `app/(tabs)/settings.tsx` - Toggle interactions

7. **Modals**
   - [ ] `components/session/AddPlayerModal.tsx` - Player addition
   - [ ] `components/session/ManagePlayersModal.tsx` - Player management
   - [ ] `components/session/SwitchPlayerModal.tsx` - Player switching

#### **Medium Priority (P2)**

8. **Club Management**
   - [ ] `app/(tabs)/create-club.tsx` - Club creation form
   - [ ] `app/(tabs)/club-detail.tsx` - Club details display

9. **UI Components**
   - [ ] `components/ui/StatusDropdown.tsx` - Status selection
   - [ ] `components/ui/PlayerReassignModal.tsx` - Player reassignment

10. **Demo Components** (Optional - Low priority)
    - [ ] Demo screens - Only if kept in production

### 1.3 Unit Testing Tools

```bash
# Primary
@testing-library/react-native  # Component testing
@testing-library/jest-native    # Native matchers

# Mocking
jest.mock()                     # Module mocking
jest.fn()                       # Function mocking

# Test Utilities
@testing-library/user-event     # User interaction simulation
```

### 1.4 Unit Test Template

```typescript
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ComponentUnderTest } from '../ComponentUnderTest';

// Mock dependencies
jest.mock('@tanstack/react-query', () => ({
  // ... mocks
}));

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

describe('ComponentUnderTest', () => {
  describe('Rendering', () => {
    it('renders correctly with required props', () => {
      const { getByText } = render(
        <ComponentUnderTest />,
        { wrapper: createWrapper() }
      );

      expect(getByText('Expected Text')).toBeTruthy();
    });
  });

  describe('User Interactions', () => {
    it('handles button press', async () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <ComponentUnderTest onPress={onPress} />,
        { wrapper: createWrapper() }
      );

      fireEvent.press(getByText('Button'));

      await waitFor(() => {
        expect(onPress).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Error States', () => {
    it('displays error message when fetch fails', async () => {
      // Mock error state
      const { getByText } = render(
        <ComponentUnderTest />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(getByText('Error message')).toBeTruthy();
      });
    });
  });
});
```

---

## Integration Testing

### 2.1 Scope

Test feature workflows that involve multiple components and data flow.

**What to Test:**
- ✅ Complete user workflows (login → home → session)
- ✅ Data flow between components
- ✅ API integration (with mocked backend)
- ✅ Navigation flows
- ✅ State management across screens

### 2.2 Critical Integration Flows

#### **P0 - Must Have**

1. **Authentication Flow**
   ```
   Login → Profile Creation → Home Screen
   Signup → Email Verification → Profile Setup
   ```

2. **Session Creation Flow**
   ```
   Home → Create Session → Configure → Add Players → Start Session
   ```

3. **Score Entry Flow**
   ```
   Session Screen → Rounds Tab → Enter Scores → Update Leaderboard
   ```

4. **Round Generation Flow**
   ```
   Session Screen → Complete Round → Generate Next Round → View Matches
   ```

#### **P1 - High Priority**

5. **Player Management Flow**
   ```
   Session → Manage Players → Add/Remove/Switch → Update Session
   ```

6. **Offline Sync Flow**
   ```
   Go Offline → Enter Scores → Go Online → Sync Data
   ```

7. **Club Creation Flow**
   ```
   Settings → Create Club → Upload Logo → Invite Members
   ```

### 2.3 Integration Testing Tools

```bash
# API Mocking
msw                            # Mock Service Worker for API mocking
@testing-library/react-native  # Component interactions

# Navigation Testing
@react-navigation/testing-library  # Navigation helpers
```

### 2.4 Integration Test Template

```typescript
import { render, waitFor, within } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { setupServer } from 'msw/native';
import { rest } from 'msw';
import { RootNavigator } from '../navigation/RootNavigator';

// Setup MSW server
const server = setupServer(
  rest.get('/api/sessions', (req, res, ctx) => {
    return res(ctx.json({ data: mockSessions }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Session Creation Flow', () => {
  it('creates a session from home screen', async () => {
    const { getByText, getByPlaceholderText } = render(
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    );

    // Navigate to create session
    fireEvent.press(getByText('Create Session'));

    // Fill form
    await waitFor(() => {
      fireEvent.changeText(
        getByPlaceholderText('Session Name'),
        'Test Session'
      );
    });

    // Submit
    fireEvent.press(getByText('Create'));

    // Verify navigation and data
    await waitFor(() => {
      expect(getByText('Test Session')).toBeTruthy();
    });
  });
});
```

---

## E2E Testing

### 3.1 Why E2E Testing?

E2E tests validate complete user journeys on real devices/simulators:
- Test actual native behavior (gestures, permissions, etc.)
- Catch integration issues between native and JS layers
- Validate critical business flows end-to-end
- Build confidence for releases

### 3.2 Recommended Tool: Maestro

**Why Maestro over Detox?**
- ✅ Simpler setup (no native code changes)
- ✅ Cross-platform (iOS + Android with same tests)
- ✅ YAML-based tests (easy to read/write)
- ✅ Cloud testing support
- ✅ Fast execution
- ✅ Better for React Native + Expo

**Alternative:** Detox (more control, steeper learning curve)

### 3.3 Critical E2E Flows (5-10% of tests)

#### **P0 - Smoke Tests**

1. **Happy Path: Create and Complete Session**
   ```yaml
   # flows/create-session.yaml
   appId: com.courtster.app
   ---
   - launchApp
   - tapOn: "Create Session"
   - inputText: "Test Tournament"
   - tapOn: "Sport"
   - tapOn: "Padel"
   - tapOn: "Next"
   - tapOn: "Add Players"
   - inputText: "Player 1"
   - tapOn: "Add"
   - tapOn: "Create Session"
   - assertVisible: "Test Tournament"
   ```

2. **Authentication: Login → Logout**
   ```yaml
   # flows/auth.yaml
   - launchApp
   - tapOn: "Sign In"
   - inputText:
       id: "email-input"
       text: "test@example.com"
   - inputText:
       id: "password-input"
       text: "password123"
   - tapOn: "Sign In"
   - assertVisible: "Sessions"
   - tapOn: "Settings"
   - tapOn: "Sign Out"
   - assertVisible: "Welcome"
   ```

3. **Score Entry and Leaderboard Update**
   ```yaml
   # flows/score-entry.yaml
   - launchApp
   - tapOn: "Test Session"
   - tapOn: "Rounds"
   - inputText:
       id: "team1-score"
       text: "6"
   - inputText:
       id: "team2-score"
       text: "4"
   - tapOn: "Leaderboard"
   - assertVisible: "10 points"
   ```

#### **P1 - Core Flows**

4. **Offline Mode**
5. **Player Management**
6. **Club Operations**

### 3.4 Maestro Setup

```bash
# Install Maestro CLI
curl -Ls "https://get.maestro.mobile.dev" | bash

# Verify installation
maestro --version

# Run test
maestro test flows/create-session.yaml

# Run all tests
maestro test flows/

# Record test (generates YAML from interactions)
maestro record
```

**Folder Structure:**
```
packages/mobile/
├── e2e/
│   ├── flows/
│   │   ├── auth.yaml
│   │   ├── create-session.yaml
│   │   ├── score-entry.yaml
│   │   └── offline-sync.yaml
│   ├── helpers/
│   │   └── setup.yaml
│   └── README.md
```

### 3.5 E2E Best Practices

1. **Keep tests independent** - Each test should set up and tear down its own data
2. **Use test accounts** - Create dedicated test users, don't use production data
3. **Test critical paths only** - E2E is slow, focus on business-critical flows
4. **Run on CI for main branch** - Don't run on every commit (too slow)
5. **Use screenshot on failure** - Maestro auto-captures for debugging

---

## Visual Regression Testing

### 4.1 Why Visual Testing?

Catch unintended UI changes:
- Layout shifts
- Style regressions
- Platform-specific rendering issues
- Responsive design breakage

### 4.2 Recommended Tools

**Option 1: Storybook + Chromatic (Recommended)**
```bash
npm install @storybook/react-native
npm install chromatic --save-dev
```

**Option 2: Pixel-Perfect Snapshots**
```bash
# Use Jest snapshots with image comparison
npm install jest-image-snapshot
```

### 4.3 Components to Snapshot

- Session cards (home screen)
- Leaderboard rows
- Match cards (rounds tab)
- Statistics charts
- Modal dialogs
- Form inputs
- Navigation headers

### 4.4 Visual Testing Workflow

```typescript
// Example with jest-image-snapshot
import { render } from '@testing-library/react-native';
import { toMatchImageSnapshot } from 'jest-image-snapshot';

expect.extend({ toMatchImageSnapshot });

describe('Visual Regression', () => {
  it('matches snapshot for SessionCard', () => {
    const { toJSON } = render(<SessionCard session={mockSession} />);

    expect(toJSON()).toMatchImageSnapshot({
      failureThreshold: 0.01, // 1% difference tolerance
      failureThresholdType: 'percent',
    });
  });
});
```

---

## Performance Testing

### 5.1 Metrics to Track

1. **App Launch Time** - Time to interactive (< 2s target)
2. **Screen Transition Time** - Navigation speed (< 300ms)
3. **List Scroll Performance** - FPS during scroll (60 FPS target)
4. **Memory Usage** - Prevent memory leaks
5. **Bundle Size** - Track JS bundle growth

### 5.2 Tools

```bash
# React Native Performance
react-native-performance

# Flashlight (Performance profiling)
npm install --save-dev @perf-profiler/profiler

# Bundle analyzer
npx react-native-bundle-visualizer
```

### 5.3 Performance Tests

```typescript
// Example with react-native-performance
import { performance } from 'react-native-performance';

describe('Performance', () => {
  it('renders large list efficiently', async () => {
    const start = performance.now();

    render(<SessionList sessions={largeMockData} />);

    const end = performance.now();
    const renderTime = end - start;

    expect(renderTime).toBeLessThan(1000); // < 1s
  });
});
```

---

## Tooling & Infrastructure

### 6.1 Test Runner: Jest

**Configuration** (`jest.config.js`):
```javascript
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@courtster/shared|@supabase/.*|@tanstack/.*))'
  ],
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'hooks/**/*.{js,jsx,ts,tsx}',
    'utils/**/*.{js,jsx,ts,tsx}',
    '!**/__tests__/**',
    '!**/node_modules/**',
    '!**/*.test.{js,jsx,ts,tsx}',
    '!**/demo/**', // Exclude demo files
  ],
  coverageThresholds: {
    global: {
      statements: 70,
      branches: 65,
      functions: 70,
      lines: 70,
    },
  },
};
```

### 6.2 Mocking Strategy

**API Mocking with MSW:**
```typescript
// __mocks__/handlers.ts
import { rest } from 'msw';

export const handlers = [
  rest.get('/api/sessions', (req, res, ctx) => {
    return res(ctx.json({ data: mockSessions }));
  }),

  rest.post('/api/sessions', (req, res, ctx) => {
    return res(ctx.json({ data: { id: 'new-session' } }));
  }),
];
```

**Mock Supabase:**
```typescript
// __mocks__/supabase.ts
export const supabase = {
  from: jest.fn(() => ({
    select: jest.fn().mockResolvedValue({ data: [], error: null }),
    insert: jest.fn().mockResolvedValue({ data: null, error: null }),
    update: jest.fn().mockResolvedValue({ data: null, error: null }),
  })),
  auth: {
    getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
    signIn: jest.fn().mockResolvedValue({ data: { user: mockUser } }),
  },
};
```

### 6.3 Test Data Factories

```typescript
// __tests__/factories/sessionFactory.ts
export const createMockSession = (overrides = {}) => ({
  id: 'session-1',
  name: 'Test Session',
  type: 'mexicano',
  sport: 'padel',
  status: 'active',
  player_count: 8,
  current_round: 0,
  ...overrides,
});

export const createMockPlayer = (overrides = {}) => ({
  id: 'player-1',
  name: 'Test Player',
  rating: 1500,
  totalPoints: 0,
  wins: 0,
  losses: 0,
  ties: 0,
  status: 'active',
  ...overrides,
});
```

---

## CI/CD Integration

### 7.1 GitHub Actions Workflow

```yaml
# .github/workflows/mobile-tests.yml
name: Mobile Tests

on:
  pull_request:
    paths:
      - 'packages/mobile/**'
  push:
    branches: [main, develop]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: |
          cd packages/mobile
          yarn install

      - name: Run unit tests
        run: |
          cd packages/mobile
          yarn test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./packages/mobile/coverage/lcov.info

  e2e-tests:
    runs-on: macos-latest  # Required for iOS
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4

      - name: Install Maestro
        run: |
          curl -Ls "https://get.maestro.mobile.dev" | bash
          echo "${HOME}/.maestro/bin" >> $GITHUB_PATH

      - name: Build iOS app
        run: |
          cd packages/mobile
          npx expo prebuild
          xcodebuild -workspace ios/CourtsterMobile.xcworkspace \
            -scheme CourtsterMobile \
            -configuration Debug \
            -sdk iphonesimulator \
            -derivedDataPath build

      - name: Run E2E tests
        run: |
          cd packages/mobile
          maestro test e2e/flows/
```

### 7.2 Pre-commit Hooks

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "packages/mobile/**/*.{ts,tsx}": [
      "eslint --fix",
      "yarn test --findRelatedTests --passWithNoTests"
    ]
  }
}
```

---

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)

**Goals:**
- Set up testing infrastructure
- Achieve 30% unit test coverage
- Document testing patterns

**Tasks:**
- [ ] Update jest.config.js with coverage thresholds
- [ ] Create test data factories
- [ ] Set up MSW for API mocking
- [ ] Write 20 unit tests for critical components
- [ ] Add pre-commit hooks
- [ ] Document testing best practices

**Deliverables:**
- 30% unit test coverage
- Test factory utilities
- Testing documentation

### Phase 2: Core Coverage (Weeks 3-4)

**Goals:**
- Achieve 60% unit test coverage
- Add integration tests for critical flows
- Set up CI/CD for tests

**Tasks:**
- [ ] Write 40+ unit tests
- [ ] Create 5 integration tests (auth, session, score entry)
- [ ] Set up GitHub Actions workflow
- [ ] Add code coverage reporting (Codecov)
- [ ] Fix any failing tests in CI

**Deliverables:**
- 60% unit test coverage
- 5 integration test suites
- CI/CD pipeline running tests

### Phase 3: E2E Testing (Weeks 5-6)

**Goals:**
- Set up Maestro
- Create smoke tests for critical paths
- Run E2E tests in CI

**Tasks:**
- [ ] Install and configure Maestro
- [ ] Create 3 critical flow tests (auth, session creation, score entry)
- [ ] Set up test accounts and data
- [ ] Add E2E tests to CI (main branch only)
- [ ] Document E2E test writing process

**Deliverables:**
- 3 E2E test flows
- Maestro running in CI
- E2E testing guide

### Phase 4: Advanced Testing (Weeks 7-8)

**Goals:**
- Add visual regression testing
- Set up performance monitoring
- Achieve 70% coverage

**Tasks:**
- [ ] Set up Storybook + Chromatic
- [ ] Create visual snapshots for key components
- [ ] Add performance tests for lists/navigation
- [ ] Achieve 70% unit test coverage
- [ ] Add accessibility testing

**Deliverables:**
- Visual regression tests
- Performance benchmarks
- 70% total coverage

---

## Best Practices

### 8.1 General Testing Principles

1. **AAA Pattern** - Arrange, Act, Assert
   ```typescript
   it('updates score when input changes', () => {
     // Arrange
     const { getByTestId } = render(<ScoreInput />);

     // Act
     fireEvent.changeText(getByTestId('score-input'), '10');

     // Assert
     expect(getByTestId('score-input')).toHaveProp('value', '10');
   });
   ```

2. **Test Behavior, Not Implementation**
   ```typescript
   // ❌ Bad - Testing implementation
   expect(component.state.isLoading).toBe(true);

   // ✅ Good - Testing behavior
   expect(getByText('Loading...')).toBeTruthy();
   ```

3. **DRY with Test Utilities**
   ```typescript
   // Create reusable render helper
   const renderWithProviders = (component) => {
     return render(
       <QueryClientProvider client={queryClient}>
         <NavigationContainer>
           {component}
         </NavigationContainer>
       </QueryClientProvider>
     );
   };
   ```

4. **Descriptive Test Names**
   ```typescript
   // ❌ Bad
   it('works', () => { ... });

   // ✅ Good
   it('displays error message when login fails with invalid credentials', () => { ... });
   ```

### 8.2 React Native Specific

1. **Use testID for Complex Queries**
   ```typescript
   <TextInput testID="email-input" />

   // Test
   getByTestId('email-input')
   ```

2. **Mock Native Modules**
   ```typescript
   jest.mock('expo-image-picker', () => ({
     launchImageLibraryAsync: jest.fn(),
   }));
   ```

3. **Test Accessibility**
   ```typescript
   expect(getByLabelText('Close button')).toBeTruthy();
   expect(getByRole('button')).toBeEnabled();
   ```

### 8.3 Async Testing

```typescript
// ✅ Use waitFor for async operations
await waitFor(() => {
  expect(getByText('Session created')).toBeTruthy();
});

// ✅ Use findBy for async queries
const element = await findByText('Session created');
expect(element).toBeTruthy();
```

### 8.4 Snapshot Testing

```typescript
// Use sparingly - snapshots are brittle
it('matches snapshot', () => {
  const { toJSON } = render(<Component />);
  expect(toJSON()).toMatchSnapshot();
});
```

---

## Code Coverage Goals

### Target by Component Type

| Component Type | Coverage Target | Rationale |
|----------------|----------------|-----------|
| **Business Logic** | 90%+ | Critical, pure functions |
| **Hooks** | 85%+ | Reusable, core functionality |
| **Components** | 70%+ | User-facing, interaction-heavy |
| **Screens** | 60%+ | Navigation, layout-focused |
| **Utils** | 90%+ | Pure functions, deterministic |
| **Demo Files** | 0% | Development-only |

### Current vs Target

```
Current:  ████░░░░░░░░░░░░░░░░  2%
Target:   ██████████████░░░░░░  70%
```

---

## Maintenance & Updates

### When to Update Tests

1. **After Bug Fixes** - Add regression test
2. **Before Refactoring** - Ensure tests pass before and after
3. **After New Features** - Write tests for new code
4. **When UI Changes** - Update visual regression tests

### Test Health Monitoring

- **Weekly:** Review test failures, fix flaky tests
- **Monthly:** Review coverage reports, identify gaps
- **Quarterly:** Update testing strategy, evaluate new tools

---

## Resources & References

### Documentation
- [Jest Documentation](https://jestjs.io/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Maestro Documentation](https://maestro.mobile.dev/)
- [MSW Documentation](https://mswjs.io/)

### Learning Resources
- [Testing React Native Apps Guide](https://reactnative.dev/docs/testing-overview)
- [Kent C. Dodds - Testing Trophy](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)

### Tools
- [Codecov](https://codecov.io/) - Code coverage reporting
- [Chromatic](https://www.chromatic.com/) - Visual testing
- [Flashlight](https://github.com/bamlab/flashlight) - Performance profiling

---

## Contributing to Tests

### How to Add a New Test

1. **Create test file** next to component: `Component.test.tsx`
2. **Follow naming convention**: `describe('ComponentName', () => { ... })`
3. **Use test factory** for mock data
4. **Add to coverage threshold** if new critical component
5. **Run tests locally**: `yarn test:watch`
6. **Update this doc** if adding new patterns

### Test Review Checklist

- [ ] Tests follow AAA pattern
- [ ] Tests are independent (no shared state)
- [ ] Tests use descriptive names
- [ ] Tests cover happy path + edge cases
- [ ] Tests use proper async handling
- [ ] No hardcoded timeouts (use waitFor)
- [ ] Mocks are properly cleaned up (afterEach)

---

## FAQ

**Q: Why not Detox for E2E?**
A: Maestro is simpler, faster, and better suited for Expo apps. Detox requires native code changes.

**Q: How often should E2E tests run?**
A: On main branch only. Too slow for every PR.

**Q: Should we snapshot test everything?**
A: No. Snapshots are brittle. Use for critical UI only, prefer visual regression testing.

**Q: What about manual testing?**
A: Still necessary for exploratory testing, UX validation, and edge cases. Automation complements, doesn't replace.

**Q: How to test offline functionality?**
A: Mock NetInfo to simulate offline state, test queue operations in unit tests, validate sync in integration tests.

---

**Last Updated:** 2025-10-31
**Maintained By:** Engineering Team
**Review Schedule:** Quarterly
