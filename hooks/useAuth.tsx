import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import { useRouter, useSegments } from 'expo-router';
import Toast from 'react-native-toast-message';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import {
  checkDeviceLimit,
  registerCurrentDevice,
  validateDeviceSession,
  updateDeviceActivity,
  DeviceInfo,
} from '../services/deviceService';
import * as RevenueCat from '../services/revenueCat';
import { resetPostHog } from '../services/posthog';
import { Logger } from '../utils/logger';
import type { SignUpProgress } from '../components/SignUpLoadingModal';

// Complete auth session (allows WebBrowser to dismiss automatically on iOS)
WebBrowser.maybeCompleteAuthSession();

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  // Device management modal state
  showDeviceModal: boolean;
  deviceModalDevices: DeviceInfo[];
  onDeviceRemoved: () => Promise<void>;
  closeDeviceModal: () => void;
  // Sign-up progress state
  signUpProgress: SignUpProgress | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  // Device management modal state
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [deviceModalDevices, setDeviceModalDevices] = useState<DeviceInfo[]>([]);
  const pendingAuthRef = useRef<{ email: string; password: string } | null>(null);

  // Sign-up progress state
  const [signUpProgress, setSignUpProgress] = useState<SignUpProgress | null>(null);

  // Navigation guard to prevent infinite loops
  const isNavigatingRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    // Get initial session
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (!isMounted) return;

        if (error) {
          Logger.error('Session fetch error', error, { action: 'getSession' });
        }

        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        Logger.error('Critical session error', err, { action: 'getSession' });
        setLoading(false);
      });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Protect routes based on auth state
  useEffect(() => {
    if (loading || isNavigatingRef.current) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';

    // Safely navigate - check if router is ready
    const safeNavigate = (path: string) => {
      try {
        isNavigatingRef.current = true;
        router.replace(path as any);
        // Reset navigation guard after navigation completes
        setTimeout(() => {
          isNavigatingRef.current = false;
        }, 500);
      } catch (error) {
        // Navigation failed - router not ready yet, will retry on next effect
        Logger.warn('Navigation failed - router not ready', { path, error });
        isNavigatingRef.current = false;
      }
    };

    if (!user && !inAuthGroup) {
      // Redirect to login if not authenticated and not in auth screens
      safeNavigate('/(auth)/login');
    } else if (user && inAuthGroup) {
      // Redirect to home if authenticated and in auth screens
      safeNavigate('/(tabs)/home');
    } else if (user && !inTabsGroup && !inAuthGroup) {
      // If user is authenticated but not in tabs or auth (e.g., at index), go to home
      safeNavigate('/(tabs)/home');
    }
  }, [user, segments, loading]);

  const signIn = async (email: string, password: string) => {
    try {
      Logger.info('Sign in attempt started', { action: 'signIn', email: Logger.maskEmail(email) });

      // Step 1: Authenticate with Supabase (with retry)
      let authAttempts = 0;
      const MAX_AUTH_RETRIES = 2;
      let authData: any = null;
      let authError: any = null;

      while (authAttempts <= MAX_AUTH_RETRIES) {
        try {
          const result = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          authData = result.data;
          authError = result.error;
          break; // Success
        } catch (networkError) {
          authAttempts++;
          Logger.warn(`Sign-in network error (attempt ${authAttempts}/${MAX_AUTH_RETRIES + 1})`, {
            action: 'signIn',
            error: networkError,
          });

          if (authAttempts > MAX_AUTH_RETRIES) {
            throw new Error('Network error: Unable to sign in. Please check your connection and try again.');
          }

          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * authAttempts));
        }
      }

      if (authError) throw authError;
      if (!authData?.user) throw new Error('No user data returned');

      Logger.info('Sign in successful, checking device limit', {
        action: 'signIn',
        userId: authData.user.id,
        email: Logger.maskEmail(email)
      });

      // Step 2: Check device limit (3 devices max)
      const deviceCheck = await checkDeviceLimit(authData.user.id);

      if (deviceCheck.status === 'LIMIT_EXCEEDED') {
        Logger.warn('Device limit exceeded, showing device management', {
          action: 'signIn',
          userId: authData.user.id,
          deviceCount: deviceCheck.activeDeviceCount
        });

        // Show device management modal - user must remove a device
        setDeviceModalDevices(deviceCheck.devices || []);
        setShowDeviceModal(true);
        pendingAuthRef.current = { email, password };

        // Sign out temporarily until device is removed
        await supabase.auth.signOut();
        return; // Don't complete sign in yet
      }

      // Step 3: Register/update current device (non-critical, with retry)
      let deviceAttempts = 0;
      const MAX_DEVICE_RETRIES = 2;

      while (deviceAttempts <= MAX_DEVICE_RETRIES) {
        try {
          await registerCurrentDevice(authData.user.id);
          break; // Success
        } catch (deviceError) {
          deviceAttempts++;
          Logger.warn(`Device registration error (attempt ${deviceAttempts}/${MAX_DEVICE_RETRIES + 1})`, {
            action: 'signIn',
            userId: authData.user.id,
            error: deviceError,
          });

          if (deviceAttempts > MAX_DEVICE_RETRIES) {
            // Non-critical - log but allow sign-in
            Logger.error('Device registration failed after retries', deviceError as Error, {
              action: 'signIn',
              userId: authData.user.id,
            });
            break;
          }

          await new Promise(resolve => setTimeout(resolve, 1000 * deviceAttempts));
        }
      }

      Logger.info('Sign in completed successfully', {
        action: 'signIn',
        userId: authData.user.id
      });

      // Step 4: Complete sign in
      Toast.show({
        type: 'success',
        text1: 'Welcome back!',
        text2: 'You have successfully logged in.',
      });
    } catch (error) {
      const err = error as AuthError;

      // Better error messages for network issues
      let errorMessage = err.message || 'Please check your credentials and try again.';
      if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }

      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: errorMessage,
      });

      Logger.error('Sign in failed', err, {
        action: 'signIn',
        email: Logger.maskEmail(email),
      });

      throw error;
    }
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    let userId: string | null = null;

    try {
      Logger.info('Sign up attempt started', {
        action: 'signUp',
        email: Logger.maskEmail(email),
        hasDisplayName: !!displayName
      });

      // ✅ STEP 1: Create auth user
      setSignUpProgress('creating');

      let authAttempts = 0;
      const MAX_AUTH_RETRIES = 2;
      let authData: any = null;
      let authError: any = null;

      while (authAttempts <= MAX_AUTH_RETRIES) {
        try {
          const result = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                display_name: displayName,
              },
            },
          });

          authData = result.data;
          authError = result.error;
          break; // Success, exit retry loop
        } catch (networkError) {
          authAttempts++;
          Logger.warn(`Auth sign-up network error (attempt ${authAttempts}/${MAX_AUTH_RETRIES + 1})`, {
            action: 'signUp',
            error: networkError,
          });

          if (authAttempts > MAX_AUTH_RETRIES) {
            throw new Error('Network error: Unable to create account. Please check your connection and try again.');
          }

          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * authAttempts));
        }
      }

      if (authError) {
        setSignUpProgress(null);
        throw authError;
      }

      if (!authData?.user) {
        setSignUpProgress(null);
        throw new Error('User creation failed - no user returned');
      }

      userId = authData.user.id;

      Logger.info('Auth user created successfully', {
        action: 'signUp',
        userId,
        email: Logger.maskEmail(email)
      });

      // ✅ STEP 2: Create profile (CRITICAL - with retry)
      setSignUpProgress('profile');

      // Generate username from email (before @ symbol)
      const username = authData.user.email!.split('@')[0];

      let profileAttempts = 0;
      const MAX_PROFILE_RETRIES = 3;
      let profileCreated = false;

      while (profileAttempts <= MAX_PROFILE_RETRIES && !profileCreated) {
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              email: authData.user.email!,
              display_name: displayName || null,
              username,
            });

          if (profileError) {
            // Check if profile already exists (duplicate key)
            if (profileError.code === '23505') {
              Logger.info('Profile already exists, continuing', { action: 'signUp', userId });
              profileCreated = true;
              break;
            }
            throw profileError;
          }

          profileCreated = true;
          Logger.info('Profile created successfully', {
            action: 'signUp',
            userId
          });
        } catch (error) {
          profileAttempts++;
          Logger.warn(`Profile creation error (attempt ${profileAttempts}/${MAX_PROFILE_RETRIES + 1})`, {
            action: 'signUp',
            userId,
            error,
          });

          if (profileAttempts > MAX_PROFILE_RETRIES) {
            // CRITICAL: Rollback auth user if profile fails after retries
            Logger.error('Profile creation failed after retries, rolling back', {
              action: 'signUp',
              userId,
            });

            setSignUpProgress(null);

            try {
              await supabase.auth.signOut();
            } catch (signOutError) {
              Logger.error('Error during rollback sign out', signOutError as Error, { action: 'signUp' });
            }

            Toast.show({
              type: 'error',
              text1: 'Account Creation Failed',
              text2: 'Profile setup failed. Please try again.',
            });

            throw new Error('Profile creation failed');
          }

          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * profileAttempts));
        }
      }

      // ✅ STEP 3: Create user settings (NON-CRITICAL - with retry but won't fail signup)
      setSignUpProgress('settings');

      let settingsAttempts = 0;
      const MAX_SETTINGS_RETRIES = 2;
      let settingsCreated = false;

      while (settingsAttempts <= MAX_SETTINGS_RETRIES && !settingsCreated) {
        try {
          const { error: settingsError } = await supabase
            .from('user_settings')
            .insert({
              user_id: userId,
              animations_enabled: true,
              notifications_enabled: true,
              theme: 'system',
            });

          if (settingsError) {
            // Check if settings already exist (duplicate key)
            if (settingsError.code === '23505') {
              Logger.info('Settings already exist, continuing', { action: 'signUp', userId });
              settingsCreated = true;
              break;
            }
            throw settingsError;
          }

          settingsCreated = true;
          Logger.info('Default settings created successfully', {
            action: 'signUp',
            userId
          });
        } catch (error) {
          settingsAttempts++;
          Logger.warn(`Settings creation error (attempt ${settingsAttempts}/${MAX_SETTINGS_RETRIES + 1})`, {
            action: 'signUp',
            userId,
            error,
          });

          if (settingsAttempts > MAX_SETTINGS_RETRIES) {
            // Non-critical - log but don't fail sign-up
            Logger.error('Settings creation failed after retries, user can set up later', {
              action: 'signUp',
              userId,
            });
            break;
          }

          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * settingsAttempts));
        }
      }

      // ✅ STEP 4: Register device (with retry logic)
      let deviceAttempts = 0;
      const MAX_DEVICE_RETRIES = 2;

      while (deviceAttempts <= MAX_DEVICE_RETRIES) {
        try {
          await registerCurrentDevice(userId);
          break; // Success
        } catch (deviceError) {
          deviceAttempts++;
          Logger.warn(`Device registration error (attempt ${deviceAttempts}/${MAX_DEVICE_RETRIES + 1})`, {
            action: 'signUp',
            userId,
            error: deviceError,
          });

          if (deviceAttempts > MAX_DEVICE_RETRIES) {
            // Non-critical - log but don't fail sign-up
            Logger.error('Device registration failed after retries', {
              action: 'signUp',
              userId,
            });
            break;
          }

          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * deviceAttempts));
        }
      }

      // ✅ STEP 5: Complete - Navigate to home
      setSignUpProgress('complete');

      Logger.info('Sign up completed successfully', {
        action: 'signUp',
        userId,
        profileCreated,
        settingsCreated
      });

      Toast.show({
        type: 'success',
        text1: 'Account Created!',
        text2: 'Welcome to Courtster.',
      });

      // Small delay to show "complete" state, then clear progress
      await new Promise(resolve => setTimeout(resolve, 500));
      setSignUpProgress(null);

    } catch (error) {
      setSignUpProgress(null);
      const err = error as AuthError;

      // Better error messages for network issues
      let errorMessage = err.message || 'Please try again.';
      if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }

      // Specific error messages for profile creation failures
      if (errorMessage.toLowerCase().includes('profile')) {
        Toast.show({
          type: 'error',
          text1: 'Account Creation Failed',
          text2: 'Profile setup failed. Please try again.',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Sign Up Failed',
          text2: errorMessage,
        });
      }

      Logger.error('Sign up failed', err, {
        action: 'signUp',
        userId,
        email: Logger.maskEmail(email),
      });

      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      Logger.info('Google sign in attempt started (expo-auth-session)', { action: 'signInWithGoogle' });

      // Create the redirect URI using expo-auth-session (handles platform differences automatically)
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'courtster',
        path: 'auth/callback',
      });

      Logger.info('Redirect URI generated', {
        action: 'signInWithGoogle',
        redirectUri,
      });

      // Request OAuth URL from Supabase with skipBrowserRedirect: true
      // This tells Supabase to include tokens in the redirect URL
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUri,
          skipBrowserRedirect: true, // CRITICAL: Let expo-auth-session handle the redirect
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;

      if (!data?.url) {
        throw new Error('No OAuth URL returned from Supabase');
      }

      Logger.info('Opening OAuth browser session', {
        action: 'signInWithGoogle',
        url: data.url,
        redirectUri,
      });

      // Open the OAuth URL using expo-auth-session
      // This automatically handles deep links and browser dismissal
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectUri,
        {
          showInRecents: false, // Don't show in iOS recent apps
        }
      );

      Logger.info('OAuth browser result', {
        action: 'signInWithGoogle',
        type: result.type,
        url: result.type === 'success' ? result.url : null,
      });

      // Handle the OAuth callback result
      if (result.type === 'success' && result.url) {
        Logger.info('OAuth success, processing callback URL', {
          action: 'signInWithGoogle',
          url: result.url,
        });

        // Parse the callback URL to extract tokens
        const url = new URL(result.url);

        // Try query params first (standard OAuth format)
        let accessToken = url.searchParams.get('access_token');
        let refreshToken = url.searchParams.get('refresh_token');

        // If not in query params, try hash fragment (alternative OAuth format)
        if (!accessToken && url.hash) {
          const hashParams = new URLSearchParams(url.hash.substring(1));
          accessToken = hashParams.get('access_token');
          refreshToken = hashParams.get('refresh_token');
        }

        // Validate tokens exist
        if (!accessToken || !refreshToken) {
          Logger.error('No tokens found in OAuth callback URL', new Error('Missing tokens'), {
            action: 'signInWithGoogle',
            hasQueryParams: !!url.search,
            hasFragment: !!url.hash,
          });
          throw new Error('No authentication tokens received from Google. Please try again.');
        }

        Logger.info('Tokens extracted from callback URL', {
          action: 'signInWithGoogle',
          source: url.search ? 'query' : 'fragment',
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
        });

        // Set the session with validated tokens
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError) {
          Logger.error('Failed to set session with OAuth tokens', sessionError, {
            action: 'signInWithGoogle',
          });
          throw sessionError;
        }

        if (!sessionData.user) {
          Logger.error('No user data in session', new Error('Missing user'), {
            action: 'signInWithGoogle',
          });
          throw new Error('Failed to retrieve user information. Please try again.');
        }

        Logger.info('Session set successfully', {
          action: 'signInWithGoogle',
          userId: sessionData.user.id,
        });

        // Check device limit and create profile
        await handleOAuthSuccess(sessionData.user);
      } else if (result.type === 'cancel') {
        Logger.info('OAuth cancelled by user', { action: 'signInWithGoogle' });
        throw new Error('Sign in cancelled');
      } else {
        Logger.error('OAuth failed', new Error('OAuth result type: ' + result.type), {
          action: 'signInWithGoogle',
        });
        throw new Error('OAuth failed. Please try again.');
      }
    } catch (error) {
      const err = error as Error;
      Logger.error('Google sign in failed', err, { action: 'signInWithGoogle' });
      Toast.show({
        type: 'error',
        text1: 'Google Sign In Failed',
        text2: err.message || 'Please try again.',
      });
      throw error;
    }
  };

  // Helper function to handle post-OAuth success (device check + profile creation)
  const handleOAuthSuccess = async (user: User) => {
    try {
      // Validate user has email
      if (!user.email) {
        throw new Error('User email is required for Google sign in');
      }

      // Check device limit
      const deviceCheck = await checkDeviceLimit(user.id);

      if (deviceCheck.status === 'LIMIT_EXCEEDED') {
        Logger.warn('Device limit exceeded during Google sign in', {
          action: 'handleOAuthSuccess',
          userId: user.id,
          deviceCount: deviceCheck.activeDeviceCount,
        });

        setDeviceModalDevices(deviceCheck.devices || []);
        setShowDeviceModal(true);
        pendingAuthRef.current = { email: user.email, password: '' };

        // Sign out to prevent authenticated state without device registration
        await supabase.auth.signOut();
        return;
      }

      // Register current device (non-critical, with retry)
      let deviceAttempts = 0;
      const MAX_DEVICE_RETRIES = 2;

      while (deviceAttempts <= MAX_DEVICE_RETRIES) {
        try {
          await registerCurrentDevice(user.id);
          break; // Success
        } catch (deviceError) {
          deviceAttempts++;
          Logger.warn(`Device registration error (attempt ${deviceAttempts}/${MAX_DEVICE_RETRIES + 1})`, {
            action: 'handleOAuthSuccess',
            userId: user.id,
            error: deviceError,
          });

          if (deviceAttempts > MAX_DEVICE_RETRIES) {
            Logger.error('Device registration failed after retries', deviceError as Error, {
              action: 'handleOAuthSuccess',
              userId: user.id,
            });
            break; // Non-critical - continue
          }

          await new Promise(resolve => setTimeout(resolve, 1000 * deviceAttempts));
        }
      }

      // Check if profile exists (with retry)
      let profileCheckAttempts = 0;
      const MAX_PROFILE_CHECK_RETRIES = 2;
      let existingProfile: any = null;
      let profileCheckSuccess = false;

      while (profileCheckAttempts <= MAX_PROFILE_CHECK_RETRIES && !profileCheckSuccess) {
        try {
          const { data, error: profileFetchError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .single();

          if (profileFetchError && profileFetchError.code !== 'PGRST116') {
            // PGRST116 = no rows returned (expected for new users)
            throw profileFetchError;
          }

          existingProfile = data;
          profileCheckSuccess = true;
        } catch (error) {
          profileCheckAttempts++;
          Logger.warn(`Profile check error (attempt ${profileCheckAttempts}/${MAX_PROFILE_CHECK_RETRIES + 1})`, {
            action: 'handleOAuthSuccess',
            userId: user.id,
            error,
          });

          if (profileCheckAttempts > MAX_PROFILE_CHECK_RETRIES) {
            Logger.error('Profile check failed after retries', error as Error, {
              action: 'handleOAuthSuccess',
              userId: user.id,
            });
            throw error;
          }

          await new Promise(resolve => setTimeout(resolve, 1000 * profileCheckAttempts));
        }
      }

      // Create profile if it doesn't exist (with retry and duplicate detection)
      if (!existingProfile) {
        Logger.info('Creating profile for new Google user', {
          action: 'handleOAuthSuccess',
          userId: user.id,
          email: user.email,
        });

        let profileCreateAttempts = 0;
        const MAX_PROFILE_CREATE_RETRIES = 3;
        let profileCreated = false;

        while (profileCreateAttempts <= MAX_PROFILE_CREATE_RETRIES && !profileCreated) {
          try {
            const { error: profileInsertError } = await supabase.from('profiles').insert({
              id: user.id,
              email: user.email,
              display_name: user.user_metadata?.full_name || null,
              username: user.email.split('@')[0] || null,
              avatar_url: user.user_metadata?.avatar_url || null,
            });

            if (profileInsertError) {
              // Check if profile already exists (duplicate key)
              if (profileInsertError.code === '23505') {
                Logger.info('Profile already exists, continuing', { action: 'handleOAuthSuccess', userId: user.id });
                profileCreated = true;
                break;
              }
              throw profileInsertError;
            }

            profileCreated = true;
            Logger.info('Profile created successfully', {
              action: 'handleOAuthSuccess',
              userId: user.id,
            });
          } catch (error) {
            profileCreateAttempts++;
            Logger.warn(`Profile creation error (attempt ${profileCreateAttempts}/${MAX_PROFILE_CREATE_RETRIES + 1})`, {
              action: 'handleOAuthSuccess',
              userId: user.id,
              error,
            });

            if (profileCreateAttempts > MAX_PROFILE_CREATE_RETRIES) {
              Logger.error('Profile creation failed after retries', error as Error, {
                action: 'handleOAuthSuccess',
                userId: user.id,
              });

              // Critical failure - sign out
              await supabase.auth.signOut();
              throw new Error('Failed to create profile. Please try again.');
            }

            await new Promise(resolve => setTimeout(resolve, 1000 * profileCreateAttempts));
          }
        }
      }

      Toast.show({
        type: 'success',
        text1: 'Welcome!',
        text2: 'Signed in with Google successfully.',
      });
    } catch (error) {
      Logger.error('Error in handleOAuthSuccess', error as Error, {
        action: 'handleOAuthSuccess',
        userId: user.id,
      });
      // Re-throw to be caught by main signInWithGoogle error handler
      throw error;
    }
  };

  const signOut = async () => {
    try {
      Logger.info('Sign out started', { action: 'signOut', userId: user?.id });

      // Logout from RevenueCat (clear cached subscription data)
      if (RevenueCat.isRevenueCatInitialized()) {
        await RevenueCat.logoutRevenueCat();
      }

      // Reset PostHog user tracking
      resetPostHog();

      // Logout from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      Logger.info('Sign out completed successfully', { action: 'signOut' });

      Toast.show({
        type: 'success',
        text1: 'Signed Out',
        text2: 'You have been logged out.',
      });
    } catch (error) {
      const err = error as AuthError;
      Toast.show({
        type: 'error',
        text1: 'Sign Out Failed',
        text2: err.message || 'Please try again.',
      });
      throw error;
    }
  };

  // Handle device removal - retry sign in
  const handleDeviceRemoved = async () => {
    setShowDeviceModal(false);

    if (!pendingAuthRef.current) return;

    const { email, password } = pendingAuthRef.current;
    pendingAuthRef.current = null;

    // Retry sign in after device was removed
    try {
      await signIn(email, password);
    } catch (error) {
      Logger.error('Error retrying sign in after device removal', error as Error, { action: 'signIn', email });
    }
  };

  const closeDeviceModal = () => {
    setShowDeviceModal(false);
    pendingAuthRef.current = null;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        showDeviceModal,
        deviceModalDevices,
        onDeviceRemoved: handleDeviceRemoved,
        closeDeviceModal,
        signUpProgress,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
