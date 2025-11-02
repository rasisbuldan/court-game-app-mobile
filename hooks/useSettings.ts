/**
 * useSettings Hook
 *
 * Manages user settings with Supabase persistence and offline support.
 * Syncs animations, notifications, and theme preferences across devices.
 */

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../config/supabase';
import { useAuth } from './useAuth';
import { Logger } from '../utils/logger';
import { offlineQueue } from '../utils/offlineQueue';

export interface UserSettings {
  id: string;
  user_id: string;
  animations_enabled: boolean;
  notifications_enabled: boolean;
  theme: 'light' | 'dark' | 'system';
  created_at: string;
  updated_at: string;
}

type SettingsUpdate = Partial<Omit<UserSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

/**
 * Hook to manage user settings with Supabase sync
 */
export function useSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user settings
  const {
    data: settings,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['user_settings', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      Logger.debug('useSettings: Fetching settings', { userId: user.id });

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // If no settings exist, create default settings
        if (error.code === 'PGRST116') {
          Logger.info('useSettings: Creating default settings', {
            userId: user.id,
            action: 'create_default_settings',
          });

          const defaultSettings: Omit<UserSettings, 'id' | 'created_at' | 'updated_at'> = {
            user_id: user.id,
            animations_enabled: true,
            notifications_enabled: true,
            theme: 'system',
          };

          const { data: newSettings, error: createError } = await supabase
            .from('user_settings')
            .insert(defaultSettings)
            .select()
            .single();

          if (createError) {
            Logger.error('useSettings: Failed to create default settings', createError, {
              userId: user.id,
              action: 'create_default_settings',
            });
            throw createError;
          }

          return newSettings as UserSettings;
        }

        Logger.error('useSettings: Failed to fetch settings', error, {
          userId: user.id,
          action: 'fetch_settings',
        });
        throw error;
      }

      Logger.debug('useSettings: Settings fetched successfully', {
        userId: user.id,
        settings: data,
      });

      return data as UserSettings;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: SettingsUpdate) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      Logger.info('useSettings: Updating settings', {
        userId: user.id,
        action: 'update_settings',
        metadata: { updates },
      });

      const { data, error } = await supabase
        .from('user_settings')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        Logger.error('useSettings: Failed to update settings', error, {
          userId: user.id,
          action: 'update_settings',
          metadata: { updates },
        });
        throw error;
      }

      Logger.info('useSettings: Settings updated successfully', {
        userId: user.id,
        action: 'update_settings',
        metadata: { updates },
      });

      return data as UserSettings;
    },
    onMutate: async (updates) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['user_settings', user?.id] });

      // Snapshot previous value
      const previousSettings = queryClient.getQueryData<UserSettings>(['user_settings', user?.id]);

      // Optimistically update
      if (previousSettings) {
        queryClient.setQueryData<UserSettings>(['user_settings', user?.id], {
          ...previousSettings,
          ...updates,
          updated_at: new Date().toISOString(),
        });
      }

      return { previousSettings };
    },
    onError: (error, updates, context) => {
      // Rollback on error
      if (context?.previousSettings) {
        queryClient.setQueryData(['user_settings', user?.id], context.previousSettings);
      }

      // Add to offline queue if network error
      if (error instanceof Error && error.message.includes('network')) {
        offlineQueue.add({
          type: 'update',
          table: 'user_settings',
          data: updates,
          userId: user?.id,
        });

        Logger.warn('useSettings: Added to offline queue', {
          userId: user?.id,
          action: 'offline_queue_add',
          metadata: { updates },
        });
      }
    },
    onSuccess: (data) => {
      // Update cache with server response
      queryClient.setQueryData(['user_settings', user?.id], data);
    },
  });

  // Subscribe to settings changes (real-time sync)
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`user_settings:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_settings',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          Logger.debug('useSettings: Real-time update received', {
            userId: user.id,
            event: payload.eventType,
          });

          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            queryClient.setQueryData(['user_settings', user.id], payload.new as UserSettings);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user?.id, queryClient]);

  return {
    settings,
    isLoading,
    error,
    refetch,
    updateSettings: updateSettingsMutation.mutate,
    isUpdating: updateSettingsMutation.isPending,
  };
}
