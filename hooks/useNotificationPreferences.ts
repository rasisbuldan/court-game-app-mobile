import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../config/supabase';
import Toast from 'react-native-toast-message';

export interface NotificationPreferences {
  id: string;
  user_id: string;
  push_enabled: boolean;
  email_enabled: boolean;
  session_reminders: boolean;
  club_invites: boolean;
  match_results: boolean;
  session_updates: boolean;
  club_announcements: boolean;
  created_at: string;
  updated_at: string;
}

type PreferenceUpdate = Partial<Omit<NotificationPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

/**
 * Fetch user's notification preferences
 */
export function useNotificationPreferences(userId: string | undefined) {
  return useQuery({
    queryKey: ['notification-preferences', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        // If preferences don't exist, create them with defaults
        if (error.code === 'PGRST116') {
          const { data: newPrefs, error: createError } = await supabase
            .from('notification_preferences')
            .insert({
              user_id: userId,
              push_enabled: true,
              email_enabled: true,
              session_reminders: true,
              club_invites: true,
              match_results: true,
              session_updates: true,
              club_announcements: true,
            })
            .select()
            .single();

          if (createError) throw createError;
          return newPrefs as NotificationPreferences;
        }
        throw error;
      }

      return data as NotificationPreferences;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Update notification preferences
 */
export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      preferences,
    }: {
      userId: string;
      preferences: PreferenceUpdate;
    }) => {
      const { data, error } = await supabase
        .from('notification_preferences')
        .update({
          ...preferences,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data as NotificationPreferences;
    },
    onSuccess: (data, variables) => {
      // Update cache
      queryClient.setQueryData(
        ['notification-preferences', variables.userId],
        data
      );

      Toast.show({
        type: 'success',
        text1: 'Preferences updated',
        text2: 'Your notification settings have been saved',
      });
    },
    onError: (error: Error) => {
      Toast.show({
        type: 'error',
        text1: 'Failed to update preferences',
        text2: error.message || 'Please try again',
      });
    },
  });
}
