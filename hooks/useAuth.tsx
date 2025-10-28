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
      // Note: OAuth implementation requires expo-auth-session
      // This is a placeholder for the OAuth flow
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL,
        },
      });

      if (error) throw error;
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
