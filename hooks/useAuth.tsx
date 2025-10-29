import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import { useRouter, useSegments } from 'expo-router';
import Toast from 'react-native-toast-message';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Protect routes based on auth state
  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';

    if (!user && !inAuthGroup) {
      // Redirect to login if not authenticated and not in auth screens
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      // Redirect to home if authenticated and in auth screens
      router.replace('/(tabs)/home');
    } else if (user && !inTabsGroup && !inAuthGroup) {
      // If user is authenticated but not in tabs or auth (e.g., at index), go to home
      router.replace('/(tabs)/home');
    }
  }, [user, segments, loading, router]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

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
