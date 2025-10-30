import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../config/supabase';
import { Database } from '@court-game/shared/types/database.types';
import Toast from 'react-native-toast-message';

type ClubInvitation = Database['public']['Tables']['club_invitations']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type Club = Database['public']['Tables']['clubs']['Row'];

interface InvitationWithDetails extends ClubInvitation {
  club: Club;
  inviter: Profile;
}

interface AcceptInvitationParams {
  invitationId: string;
  userId: string;
}

interface DeclineInvitationParams {
  invitationId: string;
}

interface CancelInvitationParams {
  invitationId: string;
}

// Fetch all pending invitations for a user
export function useUserInvitations(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-invitations', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');

      // Get user's email for email-based invitations
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single();

      const userEmail = profile?.email;

      // Fetch invitations by user_id OR email
      const { data, error } = await supabase
        .from('club_invitations')
        .select(`
          id,
          club_id,
          invited_by,
          invited_user_id,
          invited_email,
          status,
          created_at,
          expires_at,
          clubs!inner (
            id,
            name,
            bio,
            logo_url,
            owner_id,
            created_at
          ),
          profiles!club_invitations_invited_by_fkey (
            id,
            display_name,
            username,
            avatar_url
          )
        `)
        .or(`invited_user_id.eq.${userId},invited_email.eq.${userEmail}`)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform to flat objects
      return data.map((invitation: any) => ({
        id: invitation.id,
        club_id: invitation.club_id,
        invited_by: invitation.invited_by,
        invited_user_id: invitation.invited_user_id,
        invited_email: invitation.invited_email,
        status: invitation.status,
        created_at: invitation.created_at,
        expires_at: invitation.expires_at,
        club: invitation.clubs,
        inviter: invitation.profiles,
      })) as InvitationWithDetails[];
    },
    enabled: !!userId,
  });
}

// Fetch pending invitations count (for badge)
export function useInvitationsCount(userId: string | undefined) {
  return useQuery({
    queryKey: ['invitations-count', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');

      // Get user's email for email-based invitations
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single();

      const userEmail = profile?.email;

      const { count, error } = await supabase
        .from('club_invitations')
        .select('*', { count: 'exact', head: true })
        .or(`invited_user_id.eq.${userId},invited_email.eq.${userEmail}`)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString());

      if (error) throw error;
      return count || 0;
    },
    enabled: !!userId,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time badge updates
  });
}

// Fetch invitations sent by a club (for club admins)
export function useClubInvitations(clubId: string | undefined) {
  return useQuery({
    queryKey: ['club-invitations', clubId],
    queryFn: async () => {
      if (!clubId) throw new Error('Club ID is required');

      const { data, error } = await supabase
        .from('club_invitations')
        .select(`
          id,
          club_id,
          invited_by,
          invited_user_id,
          invited_email,
          status,
          created_at,
          expires_at,
          profiles!club_invitations_invited_user_id_fkey (
            id,
            display_name,
            username,
            avatar_url,
            email
          )
        `)
        .eq('club_id', clubId)
        .in('status', ['pending', 'accepted', 'declined'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map((invitation: any) => ({
        ...invitation,
        invitee: invitation.profiles,
      }));
    },
    enabled: !!clubId,
  });
}

// Accept invitation mutation
export function useAcceptInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: AcceptInvitationParams) => {
      const { invitationId, userId } = params;

      // Get invitation details
      const { data: invitation, error: inviteError } = await supabase
        .from('club_invitations')
        .select('club_id, status, expires_at')
        .eq('id', invitationId)
        .single();

      if (inviteError) throw inviteError;

      // Check if invitation is still valid
      if (invitation.status !== 'pending') {
        throw new Error('Invitation is no longer valid');
      }

      if (new Date(invitation.expires_at) < new Date()) {
        throw new Error('Invitation has expired');
      }

      // Check if user is already a member
      const { data: existingMembership } = await supabase
        .from('club_memberships')
        .select('id, status')
        .eq('club_id', invitation.club_id)
        .eq('user_id', userId)
        .single();

      if (existingMembership?.status === 'active') {
        throw new Error('You are already a member of this club');
      }

      // Begin transaction-like operations
      // 1. Update invitation status
      const { error: updateError } = await supabase
        .from('club_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitationId);

      if (updateError) throw updateError;

      // 2. Create or reactivate membership
      if (existingMembership) {
        // Reactivate removed membership
        const { error: reactivateError } = await supabase
          .from('club_memberships')
          .update({
            status: 'active',
            role: 'member',
            joined_at: new Date().toISOString(),
          })
          .eq('id', existingMembership.id);

        if (reactivateError) throw reactivateError;
      } else {
        // Create new membership
        const { error: membershipError } = await supabase
          .from('club_memberships')
          .insert({
            club_id: invitation.club_id,
            user_id: userId,
            role: 'member',
            status: 'active',
          });

        if (membershipError) throw membershipError;
      }

      return invitation.club_id;
    },
    onSuccess: (clubId, variables) => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['user-invitations', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['invitations-count', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['clubs', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['club-members', clubId] });
      queryClient.invalidateQueries({ queryKey: ['club-member-count', clubId] });

      Toast.show({
        type: 'success',
        text1: 'Invitation accepted',
        text2: 'Welcome to the club!',
      });
    },
    onError: (error: Error) => {
      Toast.show({
        type: 'error',
        text1: 'Failed to accept invitation',
        text2: error.message || 'Please try again',
      });
    },
  });
}

// Decline invitation mutation
export function useDeclineInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: DeclineInvitationParams) => {
      const { invitationId } = params;

      const { data, error } = await supabase
        .from('club_invitations')
        .update({ status: 'declined' })
        .eq('id', invitationId)
        .select('club_id')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      // Invalidate invitations queries
      queryClient.invalidateQueries({ queryKey: ['user-invitations'] });
      queryClient.invalidateQueries({ queryKey: ['invitations-count'] });
      queryClient.invalidateQueries({ queryKey: ['club-invitations', data.club_id] });

      Toast.show({
        type: 'info',
        text1: 'Invitation declined',
        text2: 'You can always accept future invitations',
      });
    },
    onError: (error: Error) => {
      Toast.show({
        type: 'error',
        text1: 'Failed to decline invitation',
        text2: error.message || 'Please try again',
      });
    },
  });
}

// Cancel invitation mutation (for club admins)
export function useCancelInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CancelInvitationParams) => {
      const { invitationId } = params;

      // Delete the invitation
      const { data, error } = await supabase
        .from('club_invitations')
        .delete()
        .eq('id', invitationId)
        .select('club_id')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Invalidate invitations queries
      queryClient.invalidateQueries({ queryKey: ['club-invitations', data.club_id] });

      Toast.show({
        type: 'success',
        text1: 'Invitation cancelled',
        text2: 'The invitation has been removed',
      });
    },
    onError: (error: Error) => {
      Toast.show({
        type: 'error',
        text1: 'Failed to cancel invitation',
        text2: error.message || 'Please try again',
      });
    },
  });
}

// Cleanup expired invitations (background task)
export function useCleanupExpiredInvitations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('club_invitations')
        .update({ status: 'expired' })
        .eq('status', 'pending')
        .lt('expires_at', new Date().toISOString());

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-invitations'] });
      queryClient.invalidateQueries({ queryKey: ['invitations-count'] });
      queryClient.invalidateQueries({ queryKey: ['club-invitations'] });
    },
  });
}
