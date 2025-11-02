# Test Hook

Write comprehensive unit tests for a React hook.

## Usage
```
/test-hook hooks/useAuth.ts
```

## Instructions

You are tasked with writing comprehensive unit tests for the React hook at the provided file path.

### Requirements:

1. **Read Hook Implementation**
   - Read the hook file thoroughly
   - Understand all dependencies and side effects
   - Note any external API calls or state management

2. **Setup & Mocking**
   - Use `@testing-library/react-hooks` for testing hooks
   - Mock all external dependencies:
     - API calls (supabase, fetch, etc.)
     - React Query hooks if used
     - Context providers
     - LocalStorage/AsyncStorage
     - Any side effects

3. **Test Coverage**
   - **Initial State**: Hook returns correct initial values
   - **State Updates**: All state setters work correctly
   - **Side Effects**: useEffect hooks trigger properly
   - **Async Operations**: API calls and loading states
   - **Error Handling**: Error states and error messages
   - **Edge Cases**: Empty data, null values, undefined
   - **Cleanup**: Cleanup functions run on unmount

4. **Test Structure**
   ```typescript
   describe('useHookName', () => {
     describe('Initial State', () => {
       it('should return initial values', () => {
         // Test
       });
     });

     describe('Actions', () => {
       it('should update state when action called', async () => {
         // Test
       });
     });

     describe('Side Effects', () => {
       it('should trigger effect on dependency change', () => {
         // Test
       });
     });

     describe('Error Handling', () => {
       it('should handle API errors gracefully', async () => {
         // Test
       });
     });
   });
   ```

5. **Best Practices**
   - Use `renderHook` from @testing-library/react-hooks
   - Use `act()` for state updates
   - Use `waitFor()` for async operations
   - Test hook in isolation (not through components)
   - Mock all external dependencies
   - Test cleanup functions with `unmount()`

6. **File Location**
   - Create test file in hooks directory
   - Use pattern: `__tests__/hookName.test.ts`
   - Example: `hooks/__tests__/useAuth.test.ts`

### Template:

```typescript
import { renderHook, act, waitFor } from '@testing-library/react-hooks';
import { useHookName } from '../useHookName';

// Mocks
jest.mock('../../config/supabase');

describe('useHookName', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return initial state', () => {
    const { result } = renderHook(() => useHookName());

    expect(result.current.value).toBe(initialValue);
    expect(result.current.loading).toBe(false);
  });

  it('should handle async operation', async () => {
    const { result } = renderHook(() => useHookName());

    await act(async () => {
      await result.current.doSomething();
    });

    await waitFor(() => {
      expect(result.current.value).toBe(expectedValue);
    });
  });

  it('should cleanup on unmount', () => {
    const { unmount } = renderHook(() => useHookName());

    unmount();

    // Verify cleanup
  });
});
```

### Deliverable:
Complete, working test file covering all hook functionality with 90%+ coverage.
