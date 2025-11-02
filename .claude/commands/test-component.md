# Test Component

Write comprehensive unit tests for a React Native component.

## Usage
```
/test-component components/session/RoundsTab.tsx
```

## Instructions

You are tasked with writing comprehensive unit tests for the React Native component at the provided file path.

### Requirements:

1. **Read Existing Patterns**
   - Study `packages/mobile/components/session/__tests__/LeaderboardTab.test.tsx` for testing patterns
   - Follow the same structure and conventions

2. **Setup & Mocking**
   - Use React Native Testing Library (`@testing-library/react-native`)
   - Mock all external dependencies:
     - `supabase` from `../../../config/supabase`
     - `react-native-toast-message`
     - `@tanstack/react-query` mutations
     - `expo-router` navigation
     - Any other external imports

3. **Test Coverage**
   - **Rendering Tests**: Component renders without crashing
   - **Props Tests**: All props work correctly
   - **User Interactions**: All buttons, inputs, and gestures
   - **State Changes**: Component state updates properly
   - **Edge Cases**: Empty data, loading states, error states
   - **Accessibility**: Basic accessibility checks

4. **Test Data**
   - Use test data factories from `__tests__/factories/` if they exist
   - Otherwise, create inline factories for Player, Round, Match objects
   - Use realistic but simple test data

5. **Best Practices**
   - Use descriptive test names: `it('should show error message when save fails')`
   - Group related tests with `describe()` blocks
   - Use `beforeEach()` for common setup
   - Use `waitFor()` for async operations
   - Use `fireEvent` for user interactions
   - Clean up with `cleanup()` after tests

6. **File Location**
   - Create test file in same directory as component
   - Use pattern: `__tests__/ComponentName.test.tsx`
   - Example: `components/session/__tests__/RoundsTab.test.tsx`

7. **Verification**
   - After creating tests, run: `yarn test ComponentName.test.tsx`
   - Fix any failing tests
   - Aim for 80%+ coverage of the component

### Template Structure:

```typescript
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ComponentName } from '../ComponentName';

// Mocks
jest.mock('../../../config/supabase');
jest.mock('react-native-toast-message');

// Test data factories
const createMockData = () => ({ /* ... */ });

// Wrapper with providers
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

describe('ComponentName', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      // Test here
    });
  });

  describe('User Interactions', () => {
    it('should handle button click', () => {
      // Test here
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty data', () => {
      // Test here
    });
  });
});
```

### Deliverable:
Complete, working test file with all tests passing when running `yarn test`.
