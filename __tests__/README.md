# Test Suite - Courtster Mobile

This directory contains test utilities, factories, and global test setup for the Courtster mobile app.

## Directory Structure

```
__tests__/
├── factories/          # Test data factories (to be created)
│   ├── sessionFactory.ts
│   ├── playerFactory.ts
│   └── clubFactory.ts
├── fixtures/           # Static test data (to be created)
│   └── mockData.ts
├── helpers/            # Test utilities (to be created)
│   ├── renderWithProviders.tsx
│   └── waitForAsync.ts
└── platform-styling.test.tsx
```

## Quick Start

### Running Tests

```bash
# Run all tests
yarn test

# Run in watch mode
yarn test:watch

# Run with coverage
yarn test:coverage

# Run specific test file
yarn test LeaderboardTab.test.tsx
```

### Writing Your First Test

1. **Create test file** next to the component:
   ```
   components/MyComponent.tsx
   components/__tests__/MyComponent.test.tsx
   ```

2. **Use the test template:**

```typescript
import { render, fireEvent } from '@testing-library/react-native';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    const { getByText } = render(<MyComponent />);
    expect(getByText('Expected Text')).toBeTruthy();
  });

  it('handles user interaction', () => {
    const onPress = jest.fn();
    const { getByText } = render(<MyComponent onPress={onPress} />);

    fireEvent.press(getByText('Button'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
```

## Test Factories

Test factories help create consistent mock data across tests.

### Example Factory

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
  created_at: new Date().toISOString(),
  ...overrides,
});

// Usage in tests
const session = createMockSession({ name: 'Custom Name' });
```

## Common Testing Patterns

### 1. Testing Components with React Query

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

// Use in test
render(<MyComponent />, { wrapper: createWrapper() });
```

### 2. Testing Async Operations

```typescript
import { waitFor } from '@testing-library/react-native';

it('loads data asynchronously', async () => {
  const { getByText } = render(<MyComponent />);

  await waitFor(() => {
    expect(getByText('Loaded Data')).toBeTruthy();
  });
});
```

### 3. Testing Navigation

```typescript
import { NavigationContainer } from '@react-navigation/native';

const createNavigationWrapper = () => {
  return ({ children }) => (
    <NavigationContainer>
      {children}
    </NavigationContainer>
  );
};
```

### 4. Testing Forms

```typescript
it('validates form input', async () => {
  const { getByPlaceholderText, getByText } = render(<LoginForm />);

  fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
  fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
  fireEvent.press(getByText('Submit'));

  await waitFor(() => {
    expect(getByText('Success')).toBeTruthy();
  });
});
```

## Mocking

### Mocking Supabase

```typescript
jest.mock('../../config/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockResolvedValue({ data: [], error: null }),
      insert: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}));
```

### Mocking React Query

```typescript
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(() => ({
    data: mockData,
    isLoading: false,
    error: null,
  })),
  useMutation: jest.fn(() => ({
    mutate: jest.fn(),
    isPending: false,
  })),
}));
```

### Mocking Navigation

```typescript
const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
}));
```

## Test Coverage

Run coverage report:

```bash
yarn test:coverage
```

View HTML report:

```bash
open coverage/lcov-report/index.html
```

### Coverage Goals

- **Components:** 70%+
- **Hooks:** 85%+
- **Utils:** 90%+
- **Overall:** 70%+

## Troubleshooting

### Common Issues

**Issue:** Tests fail with "Cannot find module"
```bash
# Solution: Clear cache
yarn test --clearCache
```

**Issue:** Async tests timeout
```typescript
// Solution: Increase timeout
it('long operation', async () => {
  // ...
}, 10000); // 10 second timeout
```

**Issue:** Snapshot mismatch
```bash
# Solution: Update snapshots
yarn test -u
```

## Resources

- [Testing Strategy](../TESTING_STRATEGY.md) - Comprehensive testing guide
- [React Native Testing Library Docs](https://callstack.github.io/react-native-testing-library/)
- [Jest Docs](https://jestjs.io/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Contributing

When adding tests:

1. ✅ Follow existing patterns
2. ✅ Use descriptive test names
3. ✅ Test behavior, not implementation
4. ✅ Keep tests focused and independent
5. ✅ Use factories for test data
6. ✅ Clean up mocks in `afterEach`

## Next Steps

1. Create test factories in `__tests__/factories/`
2. Add helper utilities in `__tests__/helpers/`
3. Write tests for critical components
4. Set up CI/CD for automated testing
5. Add E2E tests with Maestro

---

**Need help?** Check [TESTING_STRATEGY.md](../TESTING_STRATEGY.md) for detailed guidance.
