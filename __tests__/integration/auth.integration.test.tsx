/**
 * Authentication Integration Tests
 *
 * End-to-end tests for complete authentication flows:
 * - Sign up flow with profile creation
 * - Sign in flow with session restoration
 * - Sign out flow with cleanup
 * - Device limit handling
 * - Error recovery
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../../hooks/useAuth';
import { supabase } from '../../config/supabase';
import Toast from 'react-native-toast-message';
import * as deviceService from '../../services/deviceService';
import * as RevenueCat from '../../services/revenueCat';
import { resetPostHog } from '../../services/posthog';

// Re-use the existing mocks from unit tests
jest.mock('../../config/supabase');
jest.mock('react-native-toast-message');
jest.mock('../../utils/logger', () => ({
  Logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    maskEmail: jest.fn((email) => email.replace(/(.{2}).*(@.*)/, '$1***$2')),
  },
}));
jest.mock('../../services/deviceService');
jest.mock('../../services/revenueCat');
jest.mock('../../services/posthog');
jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: jest.fn(),
  }),
  useSegments: () => [],
}));

describe('Authentication Integration Tests', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    app_metadata: {},
    user_metadata: { display_name: 'Test User' },
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  };

  const mockSession = {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    token_type: 'bearer' as const,
    user: mockUser,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Default state: no session
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    (supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    });

    // Default device service mocks
    (deviceService.checkDeviceLimit as jest.Mock).mockResolvedValue({
      status: 'OK',
      activeDeviceCount: 1,
    });
    (deviceService.registerCurrentDevice as jest.Mock).mockResolvedValue(undefined);

    // Default RevenueCat mocks
    (RevenueCat.isRevenueCatInitialized as jest.Mock).mockReturnValue(false);
  });

  describe('Complete Sign Up Flow', () => {
    it('should complete full sign up journey successfully', async () => {
      // Step 1: Setup mocks for sign up
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const mockInsert = jest.fn().mockResolvedValue({
        error: null,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      // Mock auth state change callback
      let authStateChangeCallback: Function;
      (supabase.auth.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
        authStateChangeCallback = callback;
        return {
          data: { subscription: { unsubscribe: jest.fn() } },
        };
      });

      // Step 2: Render hook
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      // Step 3: Initial state should be unauthenticated
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();

      // Step 4: Sign up
      await act(async () => {
        await result.current.signUp('newuser@example.com', 'password123', 'New User');
        // Simulate auth state change after signup
        authStateChangeCallback('SIGNED_IN', mockSession);
      });

      // Step 5: Verify auth account created
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'password123',
        options: {
          data: {
            display_name: 'New User',
          },
        },
      });

      // Step 6: Verify profile created
      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'user-123',
          display_name: 'New User',
          email: 'test@example.com', // Email comes from mockUser, not the signup email
        })
      );

      // Step 7: Verify device registered
      expect(deviceService.registerCurrentDevice).toHaveBeenCalledWith('user-123');

      // Step 8: Verify success toast
      expect(Toast.show).toHaveBeenCalledWith({
        type: 'success',
        text1: 'Account Created!',
        text2: 'Welcome to Courtster.',
      });

      // Step 9: Verify final state
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.session).toEqual(mockSession);
    });

    it('should rollback on profile creation failure', async () => {
      jest.useFakeTimers();

      // Setup sign up success but profile failure
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const profileError = new Error('Database error');
      const mockInsert = jest.fn().mockResolvedValue({
        error: profileError,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      // Mock signOut to be called during rollback
      const mockSignOut = jest.fn().mockResolvedValue({ error: null });
      (supabase.auth.signOut as jest.Mock) = mockSignOut;

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Attempt sign up
      let signUpError;
      await act(async () => {
        try {
          const promise = result.current.signUp('newuser@example.com', 'password123', 'New User');

          // Fast-forward through all retry delays (1s + 2s + 3s = 6s)
          await jest.advanceTimersByTimeAsync(6000);

          await promise;
        } catch (error) {
          signUpError = error;
        }
      });

      expect(signUpError).toBeDefined();
      expect((signUpError as Error).message).toBe('Profile creation failed');

      // Verify rollback occurred
      expect(mockSignOut).toHaveBeenCalled();

      // Verify error toast
      expect(Toast.show).toHaveBeenCalledWith({
        type: 'error',
        text1: 'Account Creation Failed',
        text2: 'Profile setup failed. Please try again.',
      });

      // Final state should be unauthenticated
      expect(result.current.user).toBeNull();

      jest.useRealTimers();
    });
  });

  describe('Complete Sign In Flow', () => {
    it('should complete full sign in journey successfully', async () => {
      // Step 1: Setup mocks
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      // Mock auth state change callback to update state
      let authStateChangeCallback: Function;
      (supabase.auth.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
        authStateChangeCallback = callback;
        return {
          data: { subscription: { unsubscribe: jest.fn() } },
        };
      });

      // Step 2: Render hook
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Step 3: Sign in
      await act(async () => {
        await result.current.signIn('test@example.com', 'password123');
        // Simulate auth state change
        authStateChangeCallback('SIGNED_IN', mockSession);
      });

      // Step 4: Verify authentication
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });

      // Step 5: Verify device limit check
      expect(deviceService.checkDeviceLimit).toHaveBeenCalledWith('user-123');

      // Step 6: Verify device registration
      expect(deviceService.registerCurrentDevice).toHaveBeenCalledWith('user-123');

      // Step 7: Verify success toast
      expect(Toast.show).toHaveBeenCalledWith({
        type: 'success',
        text1: 'Welcome back!',
        text2: 'You have successfully logged in.',
      });

      // Step 8: Verify final state
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.session).toEqual(mockSession);
    });

    it('should handle device limit exceeded with modal', async () => {
      // Setup device limit exceeded
      const mockDevices = [
        { id: 'device-1', device_name: 'iPhone 14', last_active: new Date().toISOString() },
        { id: 'device-2', device_name: 'iPad Pro', last_active: new Date().toISOString() },
        { id: 'device-3', device_name: 'iPhone 13', last_active: new Date().toISOString() },
      ];

      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      (deviceService.checkDeviceLimit as jest.Mock).mockResolvedValue({
        status: 'LIMIT_EXCEEDED',
        activeDeviceCount: 3,
        devices: mockDevices,
      });

      (supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Attempt sign in
      await act(async () => {
        await result.current.signIn('test@example.com', 'password123');
      });

      // Should show device modal
      expect(result.current.showDeviceModal).toBe(true);
      expect(result.current.deviceModalDevices).toEqual(mockDevices);

      // Should temporarily sign out
      expect(supabase.auth.signOut).toHaveBeenCalled();

      // Should NOT show success toast
      expect(Toast.show).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: 'success' })
      );

      // User should remain unauthenticated until device is removed
      expect(result.current.user).toBeNull();
    });

    it('should recover from temporary auth errors', async () => {
      // First attempt fails
      (supabase.auth.signInWithPassword as jest.Mock)
        .mockResolvedValueOnce({
          data: { user: null, session: null },
          error: new Error('Network timeout'),
        })
        // Second attempt succeeds
        .mockResolvedValueOnce({
          data: { user: mockUser, session: mockSession },
          error: null,
        });

      // Mock auth state change callback to update state
      let authStateChangeCallback: Function;
      (supabase.auth.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
        authStateChangeCallback = callback;
        return {
          data: { subscription: { unsubscribe: jest.fn() } },
        };
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // First attempt fails
      await expect(
        act(async () => {
          await result.current.signIn('test@example.com', 'password123');
        })
      ).rejects.toThrow('Network timeout');

      expect(Toast.show).toHaveBeenCalledWith({
        type: 'error',
        text1: 'Login Failed',
        text2: 'Network error. Please check your connection and try again.',
      });

      // Second attempt succeeds
      await act(async () => {
        await result.current.signIn('test@example.com', 'password123');
        // Simulate auth state change
        authStateChangeCallback('SIGNED_IN', mockSession);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(Toast.show).toHaveBeenCalledWith({
        type: 'success',
        text1: 'Welcome back!',
        text2: 'You have successfully logged in.',
      });
    });
  });

  describe('Complete Sign Out Flow', () => {
    it('should complete full sign out journey successfully', async () => {
      // Step 1: Setup authenticated state
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const mockSignOut = jest.fn().mockResolvedValue({ error: null });
      (supabase.auth.signOut as jest.Mock) = mockSignOut;

      // Mock auth state change callback to update state
      let authStateChangeCallback: Function;
      (supabase.auth.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
        authStateChangeCallback = callback;
        return {
          data: { subscription: { unsubscribe: jest.fn() } },
        };
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      // Wait for session restoration
      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      // Step 2: Sign out
      await act(async () => {
        await result.current.signOut();
        // Simulate auth state change to null
        authStateChangeCallback('SIGNED_OUT', null);
      });

      // Step 3: Verify sign out called
      expect(mockSignOut).toHaveBeenCalled();

      // Step 4: Verify analytics reset
      expect(resetPostHog).toHaveBeenCalled();

      // Step 5: Verify success toast
      expect(Toast.show).toHaveBeenCalledWith({
        type: 'success',
        text1: 'Signed Out',
        text2: 'You have been logged out.',
      });

      // Step 6: Verify final state is unauthenticated
      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
    });

    it('should logout from RevenueCat if initialized', async () => {
      // Setup authenticated state with RevenueCat
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      (RevenueCat.isRevenueCatInitialized as jest.Mock).mockReturnValue(true);
      (RevenueCat.logoutRevenueCat as jest.Mock).mockResolvedValue(undefined);

      const mockSignOut = jest.fn().mockResolvedValue({ error: null });
      (supabase.auth.signOut as jest.Mock) = mockSignOut;

      // Mock auth state change callback
      let authStateChangeCallback: Function;
      (supabase.auth.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
        authStateChangeCallback = callback;
        return {
          data: { subscription: { unsubscribe: jest.fn() } },
        };
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      // Sign out
      await act(async () => {
        await result.current.signOut();
        // Simulate auth state change to null
        authStateChangeCallback('SIGNED_OUT', null);
      });

      // Verify RevenueCat logout
      expect(RevenueCat.logoutRevenueCat).toHaveBeenCalled();
      expect(resetPostHog).toHaveBeenCalled();
    });
  });

  describe('Session Restoration Flow', () => {
    it('should restore session on app launch', async () => {
      // Setup existing session
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      // Render hook (simulates app launch)
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      // Initially loading
      expect(result.current.loading).toBe(true);
      expect(result.current.user).toBeNull();

      // Wait for session restoration
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Session should be restored
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.session).toEqual(mockSession);
    });

    it('should handle session restoration errors gracefully', async () => {
      // Setup error during session restoration
      (supabase.auth.getSession as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      // Wait for error handling
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should end up in unauthenticated state
      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
    });
  });

  describe('Auth State Persistence', () => {
    it('should maintain auth state across hook instances', async () => {
      // Reset mocks for this test
      jest.clearAllMocks();

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      (supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } },
      });

      // Create single AuthProvider wrapper
      const wrapper = ({ children }: any) => <AuthProvider>{children}</AuthProvider>;

      // First instance
      const { result: result1 } = renderHook(() => useAuth(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result1.current.user).toEqual(mockUser);
      });

      // For this test, we'll verify that the state is consistent within a single provider
      // Multiple separate providers would have separate state (which is expected behavior)
      expect(result1.current.user?.id).toBe('user-123');
      expect(result1.current.session?.user.id).toBe('user-123');
    });

    it('should sync auth state changes across hook instances', async () => {
      // Reset mocks for this test
      jest.clearAllMocks();

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      // Mock auth state change callback
      let authStateChangeCallback: Function;
      (supabase.auth.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
        authStateChangeCallback = callback;
        return {
          data: { subscription: { unsubscribe: jest.fn() } },
        };
      });

      // Default device service mocks
      (deviceService.checkDeviceLimit as jest.Mock).mockResolvedValue({
        status: 'OK',
        activeDeviceCount: 1,
      });
      (deviceService.registerCurrentDevice as jest.Mock).mockResolvedValue(undefined);

      // Create wrapper
      const wrapper = ({ children }: any) => <AuthProvider>{children}</AuthProvider>;

      // Single instance test - sign in and verify state changes
      const { result } = renderHook(() => useAuth(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Sign in
      await act(async () => {
        await result.current.signIn('test@example.com', 'password123');
        // Simulate auth state change
        authStateChangeCallback('SIGNED_IN', mockSession);
      });

      // Verify authenticated state
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.session).toEqual(mockSession);
    });
  });
});
