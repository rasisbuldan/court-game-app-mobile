/**
 * useAuth Hook Tests
 *
 * Comprehensive unit tests for authentication hook covering:
 * - Initial session restoration
 * - Sign in flow (success, failure, device limit)
 * - Sign up flow with profile creation
 * - Sign out flow
 * - Device management
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../useAuth';
import { supabase } from '../../config/supabase';
import Toast from 'react-native-toast-message';
import { Logger } from '../../utils/logger';
import * as deviceService from '../../services/deviceService';
import * as RevenueCat from '../../services/revenueCat';
import { resetPostHog } from '../../services/posthog';

// Mock dependencies
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

describe('useAuth Hook', () => {
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

    // Default Supabase mocks
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

  describe('Initial Session Restoration', () => {
    it('should start with loading state', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      expect(result.current.loading).toBe(true);
      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
    });

    it('should restore existing session on mount', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.session).toEqual(mockSession);
    });

    it('should handle session restoration errors gracefully', async () => {
      const error = new Error('Network error');
      (supabase.auth.getSession as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
      expect(Logger.error).toHaveBeenCalledWith(
        'Critical session error',
        error,
        { action: 'getSession' }
      );
    });

    it('should set up auth state change listener', () => {
      renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      expect(supabase.auth.onAuthStateChange).toHaveBeenCalled();
    });

    it('should unsubscribe from auth changes on unmount', () => {
      const unsubscribe = jest.fn();
      (supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
        data: { subscription: { unsubscribe } },
      });

      const { unmount } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      unmount();

      expect(unsubscribe).toHaveBeenCalled();
    });
  });

  describe('Sign In Flow', () => {
    it('should sign in successfully with valid credentials', async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await act(async () => {
        await result.current.signIn('test@example.com', 'password123');
      });

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(deviceService.checkDeviceLimit).toHaveBeenCalledWith('user-123');
      expect(deviceService.registerCurrentDevice).toHaveBeenCalledWith('user-123');

      expect(Toast.show).toHaveBeenCalledWith({
        type: 'success',
        text1: 'Welcome back!',
        text2: 'You have successfully logged in.',
      });

      expect(Logger.info).toHaveBeenCalledWith(
        'Sign in completed successfully',
        expect.objectContaining({ action: 'signIn', userId: 'user-123' })
      );
    });

    it('should handle invalid credentials', async () => {
      const authError = new Error('Invalid login credentials');
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: authError,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await expect(
        act(async () => {
          await result.current.signIn('test@example.com', 'wrongpassword');
        })
      ).rejects.toThrow('Invalid login credentials');

      expect(Toast.show).toHaveBeenCalledWith({
        type: 'error',
        text1: 'Login Failed',
        text2: 'Invalid login credentials',
      });
    });

    it('should handle device limit exceeded', async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const mockDevices = [
        { id: 'device-1', device_name: 'iPhone 14', last_active: new Date().toISOString() },
        { id: 'device-2', device_name: 'iPad Pro', last_active: new Date().toISOString() },
        { id: 'device-3', device_name: 'iPhone 13', last_active: new Date().toISOString() },
      ];

      (deviceService.checkDeviceLimit as jest.Mock).mockResolvedValue({
        status: 'LIMIT_EXCEEDED',
        activeDeviceCount: 3,
        devices: mockDevices,
      });

      (supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await act(async () => {
        await result.current.signIn('test@example.com', 'password123');
      });

      // Should show device modal
      expect(result.current.showDeviceModal).toBe(true);
      expect(result.current.deviceModalDevices).toEqual(mockDevices);

      // Should sign out temporarily
      expect(supabase.auth.signOut).toHaveBeenCalled();

      // Should NOT register device or show success toast
      expect(deviceService.registerCurrentDevice).not.toHaveBeenCalled();
      expect(Toast.show).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: 'success' })
      );

      expect(Logger.warn).toHaveBeenCalledWith(
        'Device limit exceeded, showing device management',
        expect.objectContaining({ deviceCount: 3 })
      );
    });
  });

  describe('Sign Up Flow', () => {
    it('should sign up successfully and create profile', async () => {
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

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await act(async () => {
        await result.current.signUp('test@example.com', 'password123', 'Test User');
      });

      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          data: {
            display_name: 'Test User',
          },
        },
      });

      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(mockInsert).toHaveBeenCalled();
      expect(deviceService.registerCurrentDevice).toHaveBeenCalledWith('user-123');

      expect(Toast.show).toHaveBeenCalledWith({
        type: 'success',
        text1: 'Account Created!',
        text2: 'Welcome to Courtster.',
      });
    });

    it('should rollback auth user if profile creation fails', async () => {
      jest.useFakeTimers();

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

      // Reset signOut mock to ensure clean state
      (supabase.auth.signOut as jest.Mock).mockClear();
      (supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      let signUpError;
      await act(async () => {
        try {
          const promise = result.current.signUp('test@example.com', 'password123', 'Test User');

          // Fast-forward through all retry delays (1s + 2s + 3s = 6s)
          await jest.advanceTimersByTimeAsync(6000);

          await promise;
        } catch (error) {
          signUpError = error;
        }
      });

      expect(signUpError).toBeDefined();
      expect((signUpError as Error).message).toBe('Profile creation failed');

      // Should rollback by signing out
      expect(supabase.auth.signOut).toHaveBeenCalled();

      expect(Toast.show).toHaveBeenCalledWith({
        type: 'error',
        text1: 'Account Creation Failed',
        text2: 'Profile setup failed. Please try again.',
      });

      jest.useRealTimers();
    });
  });

  describe('Sign Out Flow', () => {
    it('should sign out successfully', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      (supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      await act(async () => {
        await result.current.signOut();
      });

      expect(supabase.auth.signOut).toHaveBeenCalled();
      expect(resetPostHog).toHaveBeenCalled();

      expect(Toast.show).toHaveBeenCalledWith({
        type: 'success',
        text1: 'Signed Out',
        text2: 'You have been logged out.',
      });
    });

    it('should logout from RevenueCat if initialized', async () => {
      (RevenueCat.isRevenueCatInitialized as jest.Mock).mockReturnValue(true);
      (RevenueCat.logoutRevenueCat as jest.Mock).mockResolvedValue(undefined);
      (supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await act(async () => {
        await result.current.signOut();
      });

      expect(RevenueCat.logoutRevenueCat).toHaveBeenCalled();
    });

    it('should handle sign out errors', async () => {
      const error = new Error('Network error');
      (supabase.auth.signOut as jest.Mock).mockResolvedValue({ error });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await expect(
        act(async () => {
          await result.current.signOut();
        })
      ).rejects.toThrow('Network error');

      expect(Toast.show).toHaveBeenCalledWith({
        type: 'error',
        text1: 'Sign Out Failed',
        text2: 'Network error',
      });
    });
  });

  describe('useAuth Hook Outside Provider', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Suppress console error for this test
      const originalError = console.error;
      console.error = jest.fn();

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');

      console.error = originalError;
    });
  });
});
