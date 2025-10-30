import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../config/supabase';
import { Database } from '@court-game/shared/types/database.types';
import Toast from 'react-native-toast-message';

type Club = Database['public']['Tables']['clubs']['Row'];
type ClubInsert = Database['public']['Tables']['clubs']['Insert'];

interface CreateClubParams {
  name: string;
  bio?: string;
  logo_url?: string;
  owner_id: string;
}

interface UpdateClubParams {
  id: string;
  name?: string;
  bio?: string;
  logo_url?: string;
}

interface DeleteClubParams {
  id: string;
}

// Fetch clubs where user is a member
export function useClubs(userId: string | undefined) {
  return useQuery({
    queryKey: ['clubs', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');

      const { data, error } = await supabase
        .from('club_memberships')
        .select(`
          club_id,
          role,
          status,
          clubs!inner (
            id,
            name,
            bio,
            logo_url,
            owner_id,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('joined_at', { ascending: false });

      if (error) throw error;

      // Return empty array if no data
      if (!data || data.length === 0) {
        return [];
      }

      // Transform to flat club objects with membership info
      return data.map((membership: any) => ({
        ...membership.clubs,
        userRole: membership.role,
      }));
    },
    enabled: !!userId,
  });
}

// Fetch single club by ID
export function useClub(clubId: string | undefined) {
  return useQuery({
    queryKey: ['club', clubId],
    queryFn: async () => {
      if (!clubId) throw new Error('Club ID is required');

      const { data, error } = await supabase
        .from('clubs')
        .select('*')
        .eq('id', clubId)
        .single();

      if (error) throw error;
      return data as Club;
    },
    enabled: !!clubId,
  });
}

// Fetch clubs owned by user (for limit check)
export function useOwnedClubs(userId: string | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['owned-clubs', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');

      const { data, error } = await supabase
        .from('clubs')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as Club[]) || [];
    },
    enabled: options?.enabled !== undefined ? options.enabled && !!userId : !!userId,
  });
}

// Create club mutation
export function useCreateClub() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateClubParams) => {
      console.log('[useCreateClub] mutationFn called with params:', params);

      // Check if user has reached the 3-club limit
      console.log('[useCreateClub] Checking club count limit...');
      const { count, error: countError } = await supabase
        .from('clubs')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', params.owner_id);

      console.log('[useCreateClub] Club count:', count, 'Error:', countError);

      if (countError) {
        console.error('[useCreateClub] Count error:', countError);
        throw countError;
      }

      if (count !== null && count >= 3) {
        console.log('[useCreateClub] Club limit reached');
        throw new Error('You can only create up to 3 clubs');
      }

      // Check if club name is already taken (case-insensitive)
      console.log('[useCreateClub] Checking if club name is taken...');
      const { data: existingClub, error: nameCheckError } = await supabase
        .from('clubs')
        .select('id')
        .ilike('name', params.name)
        .single();

      console.log('[useCreateClub] Existing club:', existingClub, 'Error:', nameCheckError);

      if (nameCheckError && nameCheckError.code !== 'PGRST116') {
        // PGRST116 = no rows returned (name available)
        console.error('[useCreateClub] Name check error:', nameCheckError);
        throw nameCheckError;
      }

      if (existingClub) {
        console.log('[useCreateClub] Club name already taken');
        throw new Error('Club name is already taken');
      }

      // Create club
      console.log('[useCreateClub] Creating club...');
      const { data: club, error: clubError } = await supabase
        .from('clubs')
        .insert({
          name: params.name.trim(),
          bio: params.bio?.trim() || null,
          logo_url: params.logo_url || null,
          owner_id: params.owner_id,
        })
        .select()
        .single();

      console.log('[useCreateClub] Club created:', club, 'Error:', clubError);

      if (clubError) {
        console.error('[useCreateClub] Club creation error:', clubError);
        throw clubError;
      }

      // Add owner as active member with owner role
      console.log('[useCreateClub] Adding owner as member...');
      const { error: membershipError } = await supabase
        .from('club_memberships')
        .insert({
          club_id: club.id,
          user_id: params.owner_id,
          role: 'owner',
          status: 'active',
        });

      console.log('[useCreateClub] Membership error:', membershipError);

      if (membershipError) {
        console.error('[useCreateClub] Membership creation error, rolling back...');
        // Rollback: delete the club if membership creation fails
        await supabase.from('clubs').delete().eq('id', club.id);
        throw membershipError;
      }

      console.log('[useCreateClub] Club created successfully:', club);
      return club as Club;
    },
    onSuccess: (data, variables) => {
      console.log('[useCreateClub] onSuccess called with data:', data);
      // Invalidate clubs query to show new club
      console.log('[useCreateClub] Invalidating queries for user:', variables.owner_id);
      queryClient.invalidateQueries({ queryKey: ['clubs', variables.owner_id] });
      queryClient.invalidateQueries({ queryKey: ['owned-clubs', variables.owner_id] });

      Toast.show({
        type: 'success',
        text1: 'Club created',
        text2: `${data.name} is ready to go!`,
      });
      console.log('[useCreateClub] onSuccess completed');
    },
    onError: (error: Error) => {
      console.error('[useCreateClub] onError called:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to create club',
        text2: error.message || 'Please try again',
      });
    },
  });
}

// Update club mutation
export function useUpdateClub() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: UpdateClubParams) => {
      const { id, ...updates } = params;

      // If name is being updated, check if it's already taken
      if (updates.name) {
        const { data: existingClub, error: nameCheckError } = await supabase
          .from('clubs')
          .select('id')
          .ilike('name', updates.name)
          .neq('id', id)
          .single();

        if (nameCheckError && nameCheckError.code !== 'PGRST116') {
          throw nameCheckError;
        }

        if (existingClub) {
          throw new Error('Club name is already taken');
        }
      }

      const { data, error } = await supabase
        .from('clubs')
        .update({
          ...updates,
          name: updates.name?.trim(),
          bio: updates.bio?.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Club;
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['club', data.id] });
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
      queryClient.invalidateQueries({ queryKey: ['owned-clubs'] });

      Toast.show({
        type: 'success',
        text1: 'Club updated',
        text2: 'Your changes have been saved',
      });
    },
    onError: (error: Error) => {
      Toast.show({
        type: 'error',
        text1: 'Failed to update club',
        text2: error.message || 'Please try again',
      });
    },
  });
}

// Delete club mutation
export function useDeleteClub() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: DeleteClubParams) => {
      const { error } = await supabase
        .from('clubs')
        .delete()
        .eq('id', params.id);

      if (error) throw error;
      return params.id;
    },
    onSuccess: (clubId) => {
      // Invalidate all club-related queries
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
      queryClient.invalidateQueries({ queryKey: ['owned-clubs'] });
      queryClient.invalidateQueries({ queryKey: ['club', clubId] });
      queryClient.invalidateQueries({ queryKey: ['club-members'] });

      Toast.show({
        type: 'success',
        text1: 'Club deleted',
        text2: 'The club has been removed',
      });
    },
    onError: (error: Error) => {
      Toast.show({
        type: 'error',
        text1: 'Failed to delete club',
        text2: error.message || 'Please try again',
      });
    },
  });
}
