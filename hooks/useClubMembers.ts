import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../config/supabase';
import { Database } from '@court-game/shared/types/database.types';
import Toast from 'react-native-toast-message';

type ClubMembership = Database['public']['Tables']['club_memberships']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface ClubMemberWithProfile extends ClubMembership {
  profile: Profile;
}

interface UpdateMemberRoleParams {
  membershipId: string;
  role: 'owner' | 'admin' | 'member';
  clubId: string;
}

interface RemoveMemberParams {
  membershipId: string;
  clubId: string;
}

interface InviteMemberParams {
  clubId: string;
  invitedBy: string;
  invitedUserId?: string;
  invitedEmail?: string;
}

// Fetch all members of a club with their profile info
export function useClubMembers(clubId: string | undefined) {
  return useQuery({
    queryKey: ['club-members', clubId],
    queryFn: async () => {
      if (!clubId) throw new Error('Club ID is required');

      const { data, error } = await supabase
        .from('club_memberships')
        .select(`
          id,
          club_id,
          user_id,
          role,
          status,
          joined_at,
          profiles!inner (
            id,
            email,
            display_name,
            username,
            avatar_url,
            created_at
          )
        `)
        .eq('club_id', clubId)
        .eq('status', 'active')
        .order('role', { ascending: true }) // Owner first, then admin, then member
        .order('joined_at', { ascending: true });

      if (error) throw error;

      // Transform to flat objects with profile nested
      return data.map((membership: any) => ({
        id: membership.id,
        club_id: membership.club_id,
        user_id: membership.user_id,
        role: membership.role,
        status: membership.status,
        joined_at: membership.joined_at,
        profile: membership.profiles,
      })) as ClubMemberWithProfile[];
    },
    enabled: !!clubId,
  });
}

// Get member count for a club
export function useClubMemberCount(clubId: string | undefined) {
  return useQuery({
    queryKey: ['club-member-count', clubId],
    queryFn: async () => {
      if (!clubId) throw new Error('Club ID is required');

      const { count, error } = await supabase
        .from('club_memberships')
        .select('*', { count: 'exact', head: true })
        .eq('club_id', clubId)
        .eq('status', 'active');

      if (error) throw error;
      return count || 0;
    },
    enabled: !!clubId,
  });
}

// Check user's role in a club
export function useUserClubRole(clubId: string | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: ['user-club-role', clubId, userId],
    queryFn: async () => {
      if (!clubId || !userId) throw new Error('Club ID and User ID are required');

      const { data, error } = await supabase
        .from('club_memberships')
        .select('role, status')
        .eq('club_id', clubId)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No membership found
          return null;
        }
        throw error;
      }

      return data;
    },
    enabled: !!clubId && !!userId,
  });
}

// Update member role mutation (owner/admin only)
export function useUpdateMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: UpdateMemberRoleParams) => {
      const { membershipId, role } = params;

      const { data, error } = await supabase
        .from('club_memberships')
        .update({ role })
        .eq('id', membershipId)
        .select()
        .single();

      if (error) throw error;
      return data as ClubMembership;
    },
    onSuccess: (data, variables) => {
      // Invalidate club members query
      queryClient.invalidateQueries({ queryKey: ['club-members', variables.clubId] });
      queryClient.invalidateQueries({ queryKey: ['user-club-role', variables.clubId] });

      Toast.show({
        type: 'success',
        text1: 'Role updated',
        text2: 'Member role has been changed',
      });
    },
    onError: (error: Error) => {
      Toast.show({
        type: 'error',
        text1: 'Failed to update role',
        text2: error.message || 'Please try again',
      });
    },
  });
}

// Remove member mutation (owner/admin only)
export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: RemoveMemberParams) => {
      const { membershipId } = params;

      // Soft delete: update status to 'removed'
      const { data, error } = await supabase
        .from('club_memberships')
        .update({ status: 'removed' })
        .eq('id', membershipId)
        .select()
        .single();

      if (error) throw error;
      return data as ClubMembership;
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['club-members', variables.clubId] });
      queryClient.invalidateQueries({ queryKey: ['club-member-count', variables.clubId] });

      Toast.show({
        type: 'success',
        text1: 'Member removed',
        text2: 'Member has been removed from the club',
      });
    },
    onError: (error: Error) => {
      Toast.show({
        type: 'error',
        text1: 'Failed to remove member',
        text2: error.message || 'Please try again',
      });
    },
  });
}

// Invite member mutation (owner/admin only)
export function useInviteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: InviteMemberParams) => {
      // Validate that either userId or email is provided
      if (!params.invitedUserId && !params.invitedEmail) {
        throw new Error('Either user ID or email is required');
      }

      // Check if user is already a member
      if (params.invitedUserId) {
        const { data: existingMembership } = await supabase
          .from('club_memberships')
          .select('id, status')
          .eq('club_id', params.clubId)
          .eq('user_id', params.invitedUserId)
          .single();

        if (existingMembership) {
          if (existingMembership.status === 'active') {
            throw new Error('User is already a member of this club');
          }
          if (existingMembership.status === 'pending') {
            throw new Error('User already has a pending invitation');
          }
        }
      }

      // Check if invitation already exists
      const inviteQuery = supabase
        .from('club_invitations')
        .select('id, status')
        .eq('club_id', params.clubId)
        .eq('status', 'pending');

      if (params.invitedUserId) {
        inviteQuery.eq('invited_user_id', params.invitedUserId);
      } else if (params.invitedEmail) {
        inviteQuery.eq('invited_email', params.invitedEmail);
      }

      const { data: existingInvite } = await inviteQuery.single();

      if (existingInvite) {
        throw new Error('Invitation already sent to this user');
      }

      // Create invitation
      const { data, error } = await supabase
        .from('club_invitations')
        .insert({
          club_id: params.clubId,
          invited_by: params.invitedBy,
          invited_user_id: params.invitedUserId || null,
          invited_email: params.invitedEmail || null,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      // Invalidate invitations query
      queryClient.invalidateQueries({ queryKey: ['club-invitations'] });
      queryClient.invalidateQueries({ queryKey: ['user-invitations'] });

      Toast.show({
        type: 'success',
        text1: 'Invitation sent',
        text2: 'Member has been invited to join the club',
      });
    },
    onError: (error: Error) => {
      Toast.show({
        type: 'error',
        text1: 'Failed to send invitation',
        text2: error.message || 'Please try again',
      });
    },
  });
}

// Leave club mutation (for members who want to leave)
export function useLeaveClub() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { clubId: string; userId: string }) => {
      const { clubId, userId } = params;

      // Check if user is the owner
      const { data: club } = await supabase
        .from('clubs')
        .select('owner_id')
        .eq('id', clubId)
        .single();

      if (club?.owner_id === userId) {
        throw new Error('Club owners cannot leave. Please transfer ownership or delete the club.');
      }

      // Remove membership
      const { error } = await supabase
        .from('club_memberships')
        .update({ status: 'removed' })
        .eq('club_id', clubId)
        .eq('user_id', userId);

      if (error) throw error;
      return clubId;
    },
    onSuccess: (clubId, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['clubs', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['club-members', clubId] });
      queryClient.invalidateQueries({ queryKey: ['club-member-count', clubId] });

      Toast.show({
        type: 'success',
        text1: 'Left club',
        text2: 'You have left the club',
      });
    },
    onError: (error: Error) => {
      Toast.show({
        type: 'error',
        text1: 'Failed to leave club',
        text2: error.message || 'Please try again',
      });
    },
  });
}
