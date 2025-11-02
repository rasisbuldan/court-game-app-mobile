import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import { useRouter, useSegments } from 'expo-router';
import Toast from 'react-native-toast-message';
import {
  checkDeviceLimit,
  registerCurrentDevice,
  validateDeviceSession,
  updateDeviceActivity,
  DeviceInfo,
} from '../services/deviceService';

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

  // Navigation guard to prevent infinite loops
  const isNavigatingRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    // Get initial session
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (!isMounted) return;

        if (error) {
          console.error('Session fetch error:', error);
        }

        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Critical session error:', err);
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

    if (!user && !inAuthGroup) {
      // Redirect to login if not authenticated and not in auth screens
      isNavigatingRef.current = true;
      router.replace('/(auth)/login');
      // Reset navigation guard after navigation completes
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 500);
    } else if (user && inAuthGroup) {
      // Redirect to home if authenticated and in auth screens
      isNavigatingRef.current = true;
      router.replace('/(tabs)/home');
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 500);
    } else if (user && !inTabsGroup && !inAuthGroup) {
      // If user is authenticated but not in tabs or auth (e.g., at index), go to home
      isNavigatingRef.current = true;
      router.replace('/(tabs)/home');
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 500);
    }
  }, [user, segments, loading]);

  const signIn = async (email: string, password: string) => {
    try {
      // Step 1: Authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (!data.user) throw new Error('No user data returned');

      // Step 2: Check device limit (3 devices max)
      const deviceCheck = await checkDeviceLimit(data.user.id);

      if (deviceCheck.status === 'LIMIT_EXCEEDED') {
        // Show device management modal - user must remove a device
        setDeviceModalDevices(deviceCheck.devices || []);
        setShowDeviceModal(true);
        pendingAuthRef.current = { email, password };

        // Sign out temporarily until device is removed
        await supabase.auth.signOut();
        return; // Don't complete sign in yet
      }

      // Step 3: Register/update current device
      await registerCurrentDevice(data.user.id);

      // Step 4: Complete sign in
      Toast.show({
        type: 'success',
        text1: 'Welcome back!',
        text2: 'You have successfully logged in.',
      });
    } catch (error) {
      const err = error as AuthError;
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: err.message || 'Please check your credentials and try again.',
      });
      throw error;
    }
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
        },
      });

      if (error) throw error;

      // Create profile if user was created
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email!,
            display_name: displayName || null,
          });

        if (profileError) {
          console.error('Error creating profile:', profileError);

          // CRITICAL: Rollback auth user creation if profile fails
          // This prevents orphaned auth users without profiles
          try {
            // Sign out to clean up session
            await supabase.auth.signOut();
          } catch (signOutError) {
            console.error('Error during rollback sign out:', signOutError);
          }

          Toast.show({
            type: 'error',
            text1: 'Account Creation Failed',
            text2: 'Profile setup failed. Please try again.',
          });

          throw new Error('Profile creation failed');
        }

        // Register first device for new user
        try {
          await registerCurrentDevice(data.user.id);
        } catch (deviceError) {
          console.error('Error registering device:', deviceError);
          // Non-critical error, allow sign up to continue
        }
      }

      Toast.show({
        type: 'success',
        text1: 'Account Created!',
        text2: 'Welcome to Courtster.',
      });
    } catch (error) {
      const err = error as AuthError;
      Toast.show({
        type: 'error',
        text1: 'Sign Up Failed',
        text2: err.message || 'Please try again.',
      });
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL || 'courtster://auth/callback',
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;

      // Open the OAuth URL in the browser
      if (data?.url) {
        const { WebBrowser } = await import('expo-web-browser');
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL || 'courtster://auth/callback'
        );

        if (result.type === 'success') {
          // Parse the URL to get the session token
          const url = new URL(result.url);
          const accessToken = url.searchParams.get('access_token');
          const refreshToken = url.searchParams.get('refresh_token');

          if (accessToken && refreshToken) {
            // Set the session
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (sessionError) throw sessionError;

            // Check if profile exists, create if not
            if (sessionData.user) {
              const { data: existingProfile } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', sessionData.user.id)
                .single();

              if (!existingProfile) {
                // Create profile for new Google user
                await supabase.from('profiles').insert({
                  id: sessionData.user.id,
                  email: sessionData.user.email!,
                  display_name: sessionData.user.user_metadata?.full_name || null,
                  username: sessionData.user.email?.split('@')[0] || null,
                  avatar_url: sessionData.user.user_metadata?.avatar_url || null,
                });
              }
            }

            Toast.show({
              type: 'success',
              text1: 'Welcome!',
              text2: 'Signed in with Google successfully.',
            });
          }
        }
      }
    } catch (error) {
      const err = error as AuthError;
      Toast.show({
        type: 'error',
        text1: 'Google Sign In Failed',
        text2: err.message || 'Please try again.',
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

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
      console.error('Error retrying sign in after device removal:', error);
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
