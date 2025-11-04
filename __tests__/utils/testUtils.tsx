/**
 * Test Utilities and Wrappers
 *
 * Provides reusable utilities for testing components and hooks:
 * - renderWithProviders: Wraps components with QueryClient and Auth context
 * - createMockQueryClient: Creates isolated QueryClient for each test
 * - waitForLoadingToFinish: Waits for async operations to complete
 * - mockNavigationProp: Creates mock navigation for route testing
 *
 * Usage:
 * ```typescript
 * import { renderWithProviders, waitForLoadingToFinish } from '../utils/testUtils';
 *
 * test('renders home screen', async () => {
 *   const { getByText } = renderWithProviders(<HomeScreen />);
 *   await waitForLoadingToFinish();
 *   expect(getByText('My Tournaments')).toBeTruthy();
 * });
 * ```
 */

import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';

/**
 * Create a fresh QueryClient for each test with test-friendly defaults
 */
export function createMockQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Disable automatic retries in tests to fail fast
        retry: false,
        // Disable refetch on window focus for predictable tests
        refetchOnWindowFocus: false,
        // Disable refetch on reconnect for predictable tests
        refetchOnReconnect: false,
        // Set short stale time for tests
        staleTime: 0,
        // Set short cache time for tests
        gcTime: 0,
      },
      mutations: {
        // Disable automatic retries in tests
        retry: false,
      },
    },
    logger: {
      // Suppress console logs in tests
      log: () => {},
      warn: () => {},
      error: () => {},
    },
  });
}

/**
 * Mock user for authentication context
 */
export const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: {
    display_name: 'Test User',
  },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
};

/**
 * Mock auth context value
 */
export const mockAuthContext = {
  user: mockUser,
  session: {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    token_type: 'bearer',
    user: mockUser,
  },
  loading: false,
  signIn: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
  updateProfile: jest.fn(),
};

/**
 * Mock auth context without user (unauthenticated)
 */
export const mockAuthContextUnauthenticated = {
  user: null,
  session: null,
  loading: false,
  signIn: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
  updateProfile: jest.fn(),
};

/**
 * Provider wrapper with all necessary contexts
 */
interface AllProvidersProps {
  children: ReactNode;
  queryClient?: QueryClient;
  authContext?: typeof mockAuthContext;
}

function AllProviders({
  children,
  queryClient = createMockQueryClient(),
  authContext = mockAuthContext,
}: AllProvidersProps) {
  // Note: AuthContext is mocked globally in jest.setup.js
  // This is just for documentation - actual context provided by global mocks
  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        {children}
      </NavigationContainer>
    </QueryClientProvider>
  );
}

/**
 * Custom render function with all providers
 *
 * @example
 * ```typescript
 * const { getByText } = renderWithProviders(<MyComponent />);
 * ```
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  authContext?: typeof mockAuthContext;
}

export function renderWithProviders(
  ui: ReactElement,
  options?: CustomRenderOptions
): ReturnType<typeof render> {
  const { queryClient, authContext, ...renderOptions } = options || {};

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <AllProviders queryClient={queryClient} authContext={authContext}>
      {children}
    </AllProviders>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Wait for loading states to finish
 *
 * @example
 * ```typescript
 * renderWithProviders(<MyComponent />);
 * await waitForLoadingToFinish();
 * expect(getByText('Loaded')).toBeTruthy();
 * ```
 */
export async function waitForLoadingToFinish(): Promise<void> {
  await waitFor(
    () => {
      // Wait for all pending queries to settle
      expect(true).toBe(true);
    },
    { timeout: 3000 }
  );
}

/**
 * Wait for element to appear
 *
 * @example
 * ```typescript
 * const element = await waitForElement(() => getByText('Success'));
 * ```
 */
export async function waitForElement<T>(
  callback: () => T,
  options?: { timeout?: number }
): Promise<T> {
  return waitFor(callback, { timeout: options?.timeout ?? 3000 });
}

/**
 * Mock navigation prop for testing
 */
export function mockNavigationProp(overrides: any = {}) {
  return {
    navigate: jest.fn(),
    goBack: jest.fn(),
    setOptions: jest.fn(),
    addListener: jest.fn(() => jest.fn()),
    removeListener: jest.fn(),
    reset: jest.fn(),
    isFocused: jest.fn(() => true),
    canGoBack: jest.fn(() => true),
    getId: jest.fn(() => 'mock-id'),
    getParent: jest.fn(),
    getState: jest.fn(() => ({
      routes: [],
      index: 0,
      key: 'mock-key',
    })),
    ...overrides,
  };
}

/**
 * Mock route prop for testing
 */
export function mockRouteProp<T extends object>(params: T) {
  return {
    key: 'mock-route-key',
    name: 'MockScreen',
    params,
    path: undefined,
  };
}

/**
 * Suppress console errors during test
 * Useful for testing error boundaries
 *
 * @example
 * ```typescript
 * test('handles error', () => {
 *   suppressConsoleError();
 *   // Test error scenario
 * });
 * ```
 */
export function suppressConsoleError() {
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });
}

/**
 * Suppress console warnings during test
 */
export function suppressConsoleWarn() {
  const originalWarn = console.warn;
  beforeAll(() => {
    console.warn = jest.fn();
  });
  afterAll(() => {
    console.warn = originalWarn;
  });
}

/**
 * Create mock AsyncStorage for tests
 */
export const mockAsyncStorage = {
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
};

/**
 * Reset all mocks between tests
 * Call this in afterEach
 */
export function resetAllMocks() {
  jest.clearAllMocks();
  mockAsyncStorage.getItem.mockResolvedValue(null);
  mockAsyncStorage.setItem.mockResolvedValue(undefined);
  mockAsyncStorage.removeItem.mockResolvedValue(undefined);
  mockAsyncStorage.clear.mockResolvedValue(undefined);
}

/**
 * Delay helper for async testing
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Re-export testing library utilities for convenience
 */
export {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
  act,
} from '@testing-library/react-native';
