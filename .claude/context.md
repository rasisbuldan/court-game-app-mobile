# Courtster Mobile - Context for Claude Code

This file provides essential context to help Claude Code work more productively with this React Native mobile app.

## Quick Reference

### Tech Stack
- **Framework**: React Native 0.81.4 + Expo SDK 54
- **Language**: TypeScript 5.9.2 (strict mode)
- **Navigation**: Expo Router (file-based routing)
- **Styling**: NativeWind 4.1 (Tailwind CSS for React Native)
- **Backend**: Supabase 2.57.3 (Auth + Database + Realtime)
- **State Management**: React Query 5.70.1 + Local State
- **Forms**: React Hook Form + Zod validation
- **Testing**: Jest + React Native Testing Library

### Project Structure
```
packages/mobile/
├── app/                    # Expo Router screens (file-based)
│   ├── _layout.tsx        # Root layout with providers
│   ├── (auth)/            # Auth screens: login, signup, callback
│   ├── (tabs)/            # Main app: home, session/[id]
│   └── create-session.tsx # Modal for creating tournaments
├── components/            # Reusable UI components
│   ├── ui/               # Generic UI components
│   └── session/          # Session-specific components
├── hooks/                # Custom React hooks
├── utils/                # Utility functions
├── config/               # Configuration (supabase, react-query)
├── __tests__/            # Test utilities and factories
└── __mocks__/            # Jest mocks
```

---

## Critical Rules

### ❌ Never Do This:
1. **Don't use HTML elements**: No `<div>`, `<span>`, `<button>`, `<input>`
2. **Don't use StyleSheet.create()**: Use NativeWind classes instead
3. **Don't use web-only Tailwind**: No `hover:`, `group`, `peer`
4. **Don't use findIndex in loops**: Use Map for O(1) lookups (see Issue #14)
5. **Don't forget to mock**: Always mock supabase, Toast, and navigation in tests
6. **Don't use 'any' type**: Use specific types or generics
7. **Don't skip tests**: Every new feature needs tests

### ✅ Always Do This:
1. **Use React Native components**: `<View>`, `<Text>`, `<TouchableOpacity>`
2. **Use NativeWind classes**: `className="bg-white p-4 rounded-lg"`
3. **Use activeOpacity**: For touch feedback on pressable elements
4. **Use React Query**: For all server data fetching
5. **Use Map for lookups**: For efficient data access in loops
6. **Add TypeScript types**: Explicit prop interfaces
7. **Write tests**: Follow LeaderboardTab.test.tsx pattern
8. **Clean up state**: Prevent memory leaks (see Issue #6)

---

## Common Tasks

### 1. Creating a New Screen
```typescript
// File: app/(tabs)/my-screen.tsx
import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function MyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View className="flex-1 bg-gray-50 p-4">
      <Text className="text-2xl font-bold">My Screen</Text>
    </View>
  );
}
```

**Route**: `/(tabs)/my-screen` or `/(tabs)/my-screen/[id]` for dynamic routes

### 2. Creating a Component
```typescript
// File: components/ui/MyComponent.tsx
import { View, Text, TouchableOpacity } from 'react-native';

interface MyComponentProps {
  title: string;
  onPress?: () => void;
}

export function MyComponent({ title, onPress }: MyComponentProps) {
  return (
    <View className="bg-white rounded-lg p-4 shadow-sm">
      <Text className="text-lg font-semibold">{title}</Text>
      {onPress && (
        <TouchableOpacity
          onPress={onPress}
          className="mt-2 bg-primary-500 rounded-lg px-4 py-2"
          activeOpacity={0.7}
        >
          <Text className="text-white font-semibold">Press</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
```

### 3. Data Fetching with React Query
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../config/supabase';

// Fetch data
const { data, isLoading, error } = useQuery({
  queryKey: ['sessions', userId],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return data;
  },
});

// Mutate data
const mutation = useMutation({
  mutationFn: async (newData) => {
    const { data, error } = await supabase
      .from('game_sessions')
      .insert(newData)
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

### 4. Forms with Validation
```typescript
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, 'Name required'),
  email: z.string().email('Invalid email'),
});

type FormData = z.infer<typeof schema>;

const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
  resolver: zodResolver(schema),
});

<Controller
  control={control}
  name="email"
  render={({ field: { onChange, value } }) => (
    <TextInput
      value={value}
      onChangeText={onChange}
      className="bg-gray-50 border rounded-lg px-4 py-3"
    />
  )}
/>
{errors.email && <Text className="text-red-500">{errors.email.message}</Text>}
```

### 5. Navigation
```typescript
import { useRouter } from 'expo-router';

const router = useRouter();

// Navigate
router.push('/(tabs)/session/123');

// Go back
router.back();

// Replace (no back button)
router.replace('/(auth)/login');
```

---

## Performance Patterns

### ✅ Efficient: Map-based Lookups (O(1))
```typescript
// Create Map for O(1) lookups
const playerMap = new Map(players.map(p => [p.id, p]));

// Use in loop
matches.forEach(match => {
  match.team1.forEach(player => {
    const stats = playerMap.get(player.id); // O(1)
    if (stats) stats.points += match.score;
  });
});
```

### ❌ Inefficient: Array findIndex (O(n))
```typescript
// Don't do this in nested loops!
matches.forEach(match => {
  match.team1.forEach(player => {
    const index = players.findIndex(p => p.id === player.id); // O(n)!
    if (index !== -1) players[index].points += match.score;
  });
});
```

---

## Testing Patterns

### Component Test Template
```typescript
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mocks
jest.mock('../../config/supabase');
jest.mock('react-native-toast-message');

// Wrapper
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('MyComponent', () => {
  it('should render', () => {
    const { getByText } = render(
      <MyComponent title="Test" />,
      { wrapper: createWrapper() }
    );
    expect(getByText('Test')).toBeTruthy();
  });
});
```

---

## Known Issues & Fixes

### Issue #14: Player Stats Calculation ✅ FIXED
- **Problem**: O(r × m × p × n) complexity with findIndex
- **Solution**: Use Map for O(1) lookups
- **Location**: session/[id].tsx lines 186-287

### Issue #5: Algorithm Initialization ✅ FIXED
- **Problem**: No retry on algorithm errors
- **Solution**: Added retry button and error handling
- **Location**: session/[id].tsx lines 145-183, RoundsTab.tsx lines 359-427

### Issue #6: Memory Leak ✅ FIXED
- **Problem**: State grew unbounded in RoundsTab
- **Solution**: Added cleanup on unmount and round change
- **Location**: RoundsTab.tsx lines 52-63

### Issue #3: Score Input Race Condition ✅ FIXED
- **Problem**: Concurrent score updates caused data loss
- **Solution**: Pessimistic locking with retry
- **Location**: RoundsTab.tsx, retryWithBackoff.ts
- **Docs**: PESSIMISTIC_LOCKING_IMPLEMENTATION.md

---

## Slash Commands Available

Use these commands for faster development:

- `/test-component [path]` - Generate comprehensive unit tests
- `/test-hook [path]` - Test React hook with all scenarios
- `/test-integration [name]` - Integration tests for workflows
- `/fix-types [path]` - Fix TypeScript errors
- `/create-component [name]` - Scaffold component with tests
- `/pre-commit` - Run all checks before committing

---

## File Naming Conventions

- **Components**: PascalCase.tsx (e.g., `PlayerCard.tsx`)
- **Hooks**: camelCase.ts (e.g., `useAuth.ts`)
- **Utils**: camelCase.ts (e.g., `statisticsUtils.ts`)
- **Tests**: ComponentName.test.tsx
- **Screens**: lowercase.tsx (Expo Router convention)

---

## Import Patterns

```typescript
// React & React Native
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

// Navigation
import { useRouter, useLocalSearchParams } from 'expo-router';

// Shared logic
import { MexicanoAlgorithm, Player, Round } from '@courtster/shared';

// Config
import { supabase } from '../../../config/supabase';

// Components
import { LeaderboardTab } from '../../../components/session/LeaderboardTab';

// Types (separate import)
import type { Database } from '@courtster/shared';
```

---

## Resources

- [Expo Router Docs](https://docs.expo.dev/router/introduction/)
- [NativeWind Docs](https://www.nativewind.dev/)
- [React Query Docs](https://tanstack.com/query/latest)
- [Supabase Docs](https://supabase.com/docs)
- [Testing Library RN](https://callstack.github.io/react-native-testing-library/)

---

**Last Updated**: 2025-10-31
**Version**: 1.0
