# Test Integration

Write integration tests for a feature workflow.

## Usage
```
/test-integration "Score Entry Flow"
```

## Instructions

You are tasked with writing integration tests for a complete user workflow/feature.

### Requirements:

1. **Understand the Flow**
   - Map out the complete user journey
   - Identify all screens/components involved
   - Note all API calls and state changes
   - Understand success and failure paths

2. **Setup**
   - Use React Native Testing Library
   - Mock navigation and routing
   - Mock API calls (use MSW if available, otherwise jest mocks)
   - Create realistic test data for the entire flow

3. **Test Structure**
   ```typescript
   describe('Integration: Feature Name', () => {
     describe('Happy Path', () => {
       it('should complete full workflow successfully', async () => {
         // Test complete flow from start to finish
       });
     });

     describe('Error Scenarios', () => {
       it('should handle API errors gracefully', async () => {
         // Test error handling
       });
     });

     describe('Edge Cases', () => {
       it('should handle offline mode', async () => {
         // Test edge cases
       });
     });
   });
   ```

4. **What to Test**
   - **Complete User Journey**: From entry point to completion
   - **Multi-Screen Flows**: Navigation between screens
   - **State Persistence**: Data survives screen changes
   - **API Integration**: All API calls work correctly
   - **Error Handling**: Graceful failures and user feedback
   - **Loading States**: Proper loading indicators
   - **Success States**: Correct success messages and navigation

5. **Best Practices**
   - Test real user workflows, not isolated components
   - Use realistic data (from factories)
   - Test both success and failure paths
   - Verify navigation occurs correctly
   - Check that toasts/alerts appear
   - Ensure data persists across screens

6. **File Location**
   - Create in: `__tests__/integration/featureName.test.tsx`
   - Example: `__tests__/integration/scoreEntry.test.tsx`

### Template:

```typescript
import React from 'react';
import { render, fireEvent, waitFor, within } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock all external dependencies
jest.mock('../../config/supabase');
jest.mock('react-native-toast-message');

// Test data
const mockSession = { /* ... */ };
const mockPlayers = [/* ... */];

// Create app wrapper with all providers
const createTestApp = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });

  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        {children}
      </NavigationContainer>
    </QueryClientProvider>
  );
};

describe('Integration: Feature Name', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Happy Path', () => {
    it('should complete entire workflow', async () => {
      // 1. Render starting screen
      const { getByText, getByTestId } = render(
        <StartingScreen />,
        { wrapper: createTestApp() }
      );

      // 2. User action 1
      fireEvent.press(getByText('Start'));

      // 3. Wait for navigation
      await waitFor(() => {
        expect(getByText('Next Screen')).toBeTruthy();
      });

      // 4. User action 2
      fireEvent.changeText(getByTestId('input'), 'test value');
      fireEvent.press(getByText('Submit'));

      // 5. Verify success
      await waitFor(() => {
        expect(getByText('Success!')).toBeTruthy();
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error when API fails', async () => {
      // Mock API failure
      // Test error handling
    });
  });
});
```

### Deliverable:
Complete integration test file covering the entire user workflow with all paths tested.
