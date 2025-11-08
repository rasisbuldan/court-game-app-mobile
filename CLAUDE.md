# CLAUDE.md - Mobile App

This file provides guidance to Claude Code when working with the **React Native mobile app** in this monorepo.

## Project Overview

Courtster Mobile is a **React Native** app built with **Expo** for managing Padel and Tennis tournaments using the "Mexicano" format. It shares core business logic with the web app via the `@courtster/shared` package.

## Tech Stack

- **React Native** 0.81.4
- **Expo SDK** 54 (with Router)
- **TypeScript** 5.9.2
- **NativeWind** 4.1 (Tailwind CSS for React Native)
- **Supabase** 2.57.3 (Auth + Database)
- **React Query** 5.70.1 (Data fetching + caching)
- **React Hook Form** + **Zod** (Forms + validation)
- **Expo Router** 4.0 (File-based navigation)

## Development Commands

```bash
# Start Expo dev server
pnpm start

# Run on iOS (macOS only)
pnpm ios

# Run on Android
pnpm android

# Run on web (for testing)
pnpm web

# Type check
pnpm typecheck

# Build for production
pnpm build:ios
pnpm build:android
```

## Project Structure

```
packages/mobile/
├── app/                    # Expo Router pages (file-based routing)
│   ├── _layout.tsx        # Root layout with providers
│   ├── index.tsx          # Entry point (redirects based on auth)
│   ├── (auth)/            # Auth group (login, signup, callback)
│   ├── (tabs)/            # Main app tabs (home, session)
│   └── create-session.tsx # Modal screen for creating tournaments
├── components/            # Reusable UI components
├── hooks/                 # Custom hooks (useAuth, etc.)
├── config/                # App configuration
│   ├── supabase.ts       # Supabase client with AsyncStorage
│   └── react-query.ts    # React Query client with persistence
├── assets/                # Images, fonts, icons
├── app.json              # Expo configuration
├── babel.config.js       # Babel config (NativeWind + Reanimated)
├── metro.config.js       # Metro bundler config (monorepo support)
├── tailwind.config.js    # Tailwind/NativeWind config
├── global.css            # Global styles
└── package.json
```

## Key Concepts

### 1. File-Based Routing (Expo Router)

**Routes automatically generated from file structure:**

```
app/
├── index.tsx                  → /
├── (auth)/
│   ├── login.tsx             → /(auth)/login
│   └── callback.tsx          → /(auth)/callback
├── (tabs)/
│   ├── home.tsx              → /(tabs)/home
│   └── session/[id].tsx      → /(tabs)/session/:id
└── create-session.tsx        → /create-session (modal)
```

**Navigation:**
```typescript
import { useRouter } from 'expo-router';

const router = useRouter();
router.push('/(tabs)/session/123');  // Navigate
router.back();                        // Go back
router.replace('/(auth)/login');     // Replace (no back)
```

**Route params:**
```typescript
import { useLocalSearchParams } from 'expo-router';

const { id } = useLocalSearchParams<{ id: string }>();
```

### 2. Shared Package Usage

**Import from `@courtster/shared` for business logic:**

```typescript
// ✅ Good - Use shared package
import {
  MexicanoAlgorithm,
  Player,
  Round,
  Match,
  verifyPIN,
  calculatePartnershipStats
} from '@courtster/shared';

// ❌ Bad - Don't duplicate logic
// Keep all algorithms in shared package
```

**What's in @courtster/shared:**
- `lib/mexicano-algorithm.ts` - Core tournament logic
- `lib/session-sharing.ts` - PIN generation/verification
- `lib/scoring-utilities.ts` - Score calculations
- `types/database.types.ts` - Supabase types
- `utils/statisticsUtils.ts` - Statistics functions

### 3. NativeWind (Tailwind CSS)

**Use Tailwind classes directly on React Native components:**

```tsx
import { View, Text } from 'react-native';

<View className="flex-1 bg-gray-50 p-4">
  <Text className="text-2xl font-bold text-gray-900">
    Courtster
  </Text>
</View>
```

**Key differences from web Tailwind:**
- No `hover:` modifiers (mobile has no hover)
- Use `gap-4` instead of `space-x-4` or `space-y-4`
- No `group` utilities
- `contentContainerClassName` for ScrollView/FlatList content

### 4. Authentication Flow

**Auth is managed by `useAuth` hook:**

```typescript
import { useAuth } from '../hooks/useAuth';

const { user, session, loading, signIn, signUp, signOut } = useAuth();

// Sign in
await signIn('user@example.com', 'password');

// Sign up
await signUp('user@example.com', 'password', 'Display Name');

// Sign out
await signOut();
```

**Protected routes:**
- Routes automatically protected by auth state in `_layout.tsx`
- Unauthenticated users redirected to `/(auth)/login`
- Authenticated users redirected to `/(tabs)/home`

### 5. Data Fetching with React Query

**Always use React Query for server data:**

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '../config/supabase';

// Fetch data
const { data, isLoading, refetch } = useQuery({
  queryKey: ['sessions', user?.id],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('user_id', user!.id);
    if (error) throw error;
    return data;
  },
});

// Mutate data
const mutation = useMutation({
  mutationFn: async (newSession) => {
    const { data, error } = await supabase
      .from('game_sessions')
      .insert(newSession)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['sessions'] });
  },
});
```

**Benefits:**
- Automatic caching with AsyncStorage
- Offline support
- Optimistic updates
- Background refetching

### 6. Forms with React Hook Form + Zod

**Standard pattern for all forms:**

```typescript
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Min 6 characters'),
});

type FormData = z.infer<typeof schema>;

const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
  resolver: zodResolver(schema),
});

<Controller
  control={control}
  name="email"
  render={({ field: { onChange, onBlur, value } }) => (
    <TextInput
      className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3"
      value={value}
      onChangeText={onChange}
      onBlur={onBlur}
      keyboardType="email-address"
    />
  )}
/>
{errors.email && <Text className="text-red-500">{errors.email.message}</Text>}
```

### 7. Toast Notifications

**Use react-native-toast-message:**

```typescript
import Toast from 'react-native-toast-message';

// Success
Toast.show({
  type: 'success',
  text1: 'Success!',
  text2: 'Operation completed',
});

// Error
Toast.show({
  type: 'error',
  text1: 'Error',
  text2: 'Something went wrong',
});
```

**Toast component added in `_layout.tsx`**

## Common Patterns

### List Rendering

```tsx
import { FlatList } from 'react-native';

<FlatList
  data={sessions}
  renderItem={({ item }) => <SessionCard session={item} />}
  keyExtractor={(item) => item.id}
  refreshControl={
    <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
  }
  contentContainerClassName="pb-6"
/>
```

### Loading States

```tsx
import { ActivityIndicator } from 'react-native';

{isLoading ? (
  <View className="flex-1 items-center justify-center">
    <ActivityIndicator size="large" color="#3B82F6" />
    <Text className="text-gray-600 mt-4">Loading...</Text>
  </View>
) : (
  <Content />
)}
```

### Buttons

```tsx
import { TouchableOpacity } from 'react-native';

<TouchableOpacity
  className="bg-primary-500 rounded-lg px-6 py-3 items-center"
  onPress={handlePress}
  disabled={loading}
>
  <Text className="text-white font-semibold">Submit</Text>
</TouchableOpacity>
```

## iOS 18 & Android 15 Optimizations

### iOS 18 (Configured in app.json)
- **Deployment Target**: iOS 15.0+ (supports iOS 18)
- **New Architecture**: Enabled (`newArchEnabled: true`)
- Future enhancements:
  - Live Activities for active sessions
  - Widgets for quick tournament view
  - App Intents for Siri integration

### Android 15 (Configured in app.json)
- **Target SDK**: 35 (Android 15)
- **Compile SDK**: 35
- **Min SDK**: 26 (Android 8.0)
- **Edge-to-Edge**: Enabled
- **Predictive Back Gesture**: Enabled
- **Proguard**: Enabled for release builds

## Environment Variables

**Required in `.env`:**
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
EXPO_PUBLIC_AUTH_REDIRECT_URL=courtster://auth/callback
```

**Access in code:**
```typescript
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
```

## Database Schema

Uses same Supabase schema as web app:

**Tables:**
- `profiles` - User accounts
- `game_sessions` - Tournament sessions
- `players` - Player stats per session
- `event_history` - Audit log

**Types imported from `@courtster/shared`:**
```typescript
import type { Database } from '@courtster/shared';

type Session = Database['public']['Tables']['game_sessions']['Row'];
type Player = Database['public']['Tables']['players']['Row'];
```

## Documentation

All documentation is now organized in a structured folder hierarchy:

### 📁 [docs/](./docs/)
Main documentation directory with organized subdirectories:

- **[docs/setup/](./docs/setup/)** - Configuration guides (push notifications, RevenueCat, OAuth, Grafana, etc.)
- **[docs/features/](./docs/features/)** - Feature documentation (sessions, clubs, subscriptions, offline sync, etc.)
- **[docs/architecture/](./docs/architecture/)** - Architecture decisions and patterns (glassmorphism, error boundaries, etc.)
- **[docs/guides/](./docs/guides/)** - Developer guides (testing strategy, TestFlight publishing, etc.)
- **[docs/operations/](./docs/operations/)** - Operations docs (console cleanup, maintenance, etc.)

### 📁 [planning/](./planning/)
Feature planning, roadmaps, and implementation plans

### 📁 [analysis/](./analysis/)
Code analysis, audits, and reports with subdirectories:
- **[analysis/audits/](./analysis/audits/)** - Comprehensive code audits
- **[analysis/issues/](./analysis/issues/)** - Issue analysis and root cause investigations
- **[analysis/fixes/](./analysis/fixes/)** - Documentation of implemented fixes
- **[analysis/testing/](./analysis/testing/)** - Testing coverage reports
- **[analysis/summaries/](./analysis/summaries/)** - High-level summary reports

Each directory contains a README.md index file for easy navigation.

## Known Limitations & Future Work

> **📋 For a comprehensive list of unimplemented features, TODOs, and work-in-progress items, see [UNIMPLEMENTED.md](./UNIMPLEMENTED.md)**

### ✅ Implemented
- Authentication (email/password)
- Tournament creation with Reclub import
- Session management (create, view, edit)
- Score entry and round generation
- Leaderboard with sorting
- Statistics (partnerships, head-to-head)
- Event history with export
- Player management (add, status, reassign)
- Club management
- Offline support with queue sync
- Profile management with avatar upload

### 🚧 In Progress / Needs Work
- Settings persistence (toggles exist but don't save)
- Excessive console logging (needs cleanup)
- Public results sharing page
- Push notifications infrastructure
- Demo files organization

### 🔜 Planned
- Subscription/premium features
- Real-time updates with Supabase Realtime
- Push notifications
- Live Activities (iOS)
- Widgets (iOS/Android)
- Analytics integration
- Localization (i18n)
- Performance optimizations

## Error Handling

**Always wrap async operations in try-catch:**

```typescript
const mutation = useMutation({
  mutationFn: async (data) => {
    try {
      const { data: result, error } = await supabase
        .from('game_sessions')
        .insert(data);

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message,
      });
      throw error;
    }
  },
});
```

## Debugging

### React Native Debugger
```bash
# Start app in dev mode
pnpm start

# Press 'd' in terminal to open dev menu on device
# Select "Debug JS Remotely" or "Open React DevTools"
```

### Expo Dev Client
```bash
# View logs
pnpm start --dev-client

# Clear cache
pnpm start --clear
```

### Metro Bundler Issues
```bash
# Reset Metro cache
pnpm start --reset-cache

# Or manually
rm -rf .expo node_modules
pnpm install
```

## Testing

> **📋 For comprehensive testing strategy, tooling, and roadmap, see [docs/guides/testing-strategy.md](./docs/guides/testing-strategy.md)**

### Quick Start

**Run all tests:**
```bash
yarn test
```

**Run tests in watch mode:**
```bash
yarn test:watch
```

**Run with coverage:**
```bash
yarn test:coverage
```

### Current Test Coverage

- **Unit Tests:** ~2% coverage (4 test files)
- **Integration Tests:** 0%
- **E2E Tests:** 0%
- **Target:** 70% coverage

### Example Component Test

```typescript
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoginScreen } from '../LoginScreen';

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

describe('LoginScreen', () => {
  it('renders login form', () => {
    const { getByPlaceholderText, getByText } = render(
      <LoginScreen />,
      { wrapper: createWrapper() }
    );

    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
    expect(getByText('Sign In')).toBeTruthy();
  });

  it('validates email format', async () => {
    const { getByPlaceholderText, getByText } = render(
      <LoginScreen />,
      { wrapper: createWrapper() }
    );

    const emailInput = getByPlaceholderText('Email');
    fireEvent.changeText(emailInput, 'invalid-email');
    fireEvent.press(getByText('Sign In'));

    await waitFor(() => {
      expect(getByText('Invalid email')).toBeTruthy();
    });
  });
});
```

### Test File Organization

```
packages/mobile/
├── app/
│   └── (auth)/
│       ├── login.tsx
│       └── __tests__/
│           └── login.test.tsx
├── components/
│   └── session/
│       ├── LeaderboardTab.tsx
│       └── __tests__/
│           └── LeaderboardTab.test.tsx
├── hooks/
│   └── __tests__/
│       └── useAuth.test.ts
├── __mocks__/
│   ├── supabase.ts
│   └── handlers.ts
└── __tests__/
    └── factories/
        ├── sessionFactory.ts
        └── playerFactory.ts
```

### Testing Roadmap

**Phase 1 (Weeks 1-2):** Foundation
- Set up test infrastructure
- Achieve 30% unit test coverage
- Create test data factories

**Phase 2 (Weeks 3-4):** Core Coverage
- Achieve 60% unit test coverage
- Add integration tests for critical flows
- Set up CI/CD

**Phase 3 (Weeks 5-6):** E2E Testing
- Set up Maestro for E2E tests
- Create smoke tests
- Run E2E in CI

**Phase 4 (Weeks 7-8):** Advanced
- Visual regression testing
- Performance monitoring
- Achieve 70% coverage

## Best Practices

1. **Always use `@courtster/shared` for business logic** - Never duplicate algorithms
2. **Use NativeWind classes** - Consistent with web Tailwind syntax
3. **React Query for all server state** - Automatic caching + offline support
4. **TypeScript strict mode** - Catch errors early
5. **Responsive design** - Test on multiple device sizes
6. **Accessibility** - Add `accessibilityLabel` to touchable components
7. **Performance** - Use `React.memo` for expensive components, `useCallback` for callbacks in lists

## Common Pitfalls

### ❌ Don't Import Platform-Specific Code in Shared Package
```typescript
// In @courtster/shared - WRONG
import { useRouter } from 'expo-router';
```

### ❌ Don't Use HTML Elements
```typescript
// WRONG
<div className="flex">
  <h1>Title</h1>
</div>

// RIGHT
<View className="flex">
  <Text className="text-2xl font-bold">Title</Text>
</View>
```

### ❌ Don't Use Web-Only Tailwind Classes
```typescript
// WRONG - No hover on mobile
<TouchableOpacity className="hover:bg-blue-600">

// RIGHT - Use active states
<TouchableOpacity activeOpacity={0.7}>
```

## Claude Code Productivity

### Slash Commands

Custom commands available in `.claude/commands/` for faster development:

#### Testing Commands
- **`/test-component [path]`** - Generate comprehensive unit tests for a component
  - Example: `/test-component components/session/RoundsTab.tsx`
  - Creates test file with full coverage (rendering, interactions, edge cases)
  - Follows LeaderboardTab.test.tsx patterns

- **`/test-hook [path]`** - Generate unit tests for a React hook
  - Example: `/test-hook hooks/useAuth.ts`
  - Tests initial state, actions, side effects, and cleanup
  - Uses @testing-library/react-hooks

- **`/test-integration [name]`** - Write integration tests for workflows
  - Example: `/test-integration "Score Entry Flow"`
  - Tests complete user journeys across multiple screens
  - Includes happy path, errors, and edge cases

#### Development Commands
- **`/create-component [name]`** - Scaffold new component with tests
  - Example: `/create-component session/MatchCard`
  - Creates component + test file with proper structure
  - Includes TypeScript types and NativeWind styling

- **`/fix-types [path]`** - Fix TypeScript errors in file or project
  - Example: `/fix-types` or `/fix-types components/session/RoundsTab.tsx`
  - Analyzes and fixes type errors automatically
  - Provides detailed report of changes

- **`/pre-commit`** - Run all checks before committing
  - Runs typecheck, linting, tests
  - Checks for console.logs and debug code
  - Ensures code quality before commit

### Test Data Factories

Reusable factory functions in `__tests__/factories/`:

```typescript
import { playerFactory, matchFactory, roundFactory, createTournamentData } from '../factories';

// Create individual objects
const player = playerFactory({ name: 'Alice', rating: 8 });
const match = matchFactory({ team1Score: 15, team2Score: 9 });
const round = roundFactory({ roundNumber: 1 });

// Create complete tournament data
const { players, rounds, session } = createTournamentData(8, 3);

// Create test wrapper with providers
const wrapper = createTestWrapper();
```

### Agent Usage Guidelines

**When to use agents:**
- **Explore Agent** (medium thoroughness): Finding files, understanding codebase structure
- **General-Purpose Agent**: Complex refactoring, multi-file operations
- **Plan Agent**: Planning multi-step features before implementation

**Note:** `unit-test-engineer` agent has tool conflicts - use slash commands instead for testing.

### Context Files

- **`.claude/context.md`** - Project-specific context and patterns
- **`.claude/commands/*.md`** - Custom slash command definitions
- **`.clauignore`** - Files to exclude from agent operations

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [NativeWind v4](https://www.nativewind.dev/)
- [React Query](https://tanstack.com/query/latest)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [React Hook Form](https://react-hook-form.com/)

---

**Migration Status**: Phase 7 Complete (70%)
**Next Steps**: Complete session screen with all tabs
