/**
 * useClubMembers Hook Tests
 *
 * Comprehensive unit tests for club members management hooks covering:
 * - Fetching club members with profile info
 * - Fetching member count
 * - Checking user's role in a club
 * - Updating member roles (admin only)
 * - Removing members (admin only)
 * - Inviting members (admin only)
 * - Leaving club (non-owners)
 * - Query invalidation
 * - Toast notifications
 * - Error handling
 * - RBAC (role-based access control)
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useClubMembers,
  useClubMemberCount,
  useUserClubRole,
  useUpdateMemberRole,
  useRemoveMember,
  useInviteMember,
  useLeaveClub,
} from '../useClubMembers';
import { supabase } from '../../config/supabase';
import Toast from 'react-native-toast-message';

// Mock dependencies
jest.mock('../../config/supabase');
jest.mock('react-native-toast-message');

describe('useClubMembers Hooks', () => {
  const mockClubId = 'club-123';
  const mockUserId = 'user-123';
  const mockMembershipId = 'membership-123';

  const mockProfile = {
    id: 'user-456',
    email: 'member@example.com',
    display_name: 'John Doe',
    username: 'johndoe',
    avatar_url: 'https://example.com/avatar.jpg',
    created_at: new Date().toISOString(),
  };

  const mockMembership = {
    id: 'membership-456',
    club_id: mockClubId,
    user_id: 'user-456',
    role: 'member' as const,
    status: 'active' as const,
    joined_at: new Date().toISOString(),
  };

  const mockMemberWithProfile = {
    ...mockMembership,
    profile: mockProfile,
  };

  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create fresh QueryClient for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
      logger: {
        log: () => {},
        warn: () => {},
        error: () => {},
      },
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('useClubMembers Query', () => {
    it('should fetch club members with profile info successfully', async () => {
      const mockMembers = [
        {
          id: 'membership-1',
          club_id: mockClubId,
          user_id: 'user-owner',
          role: 'owner',
          status: 'active',
          joined_at: '2024-01-01T00:00:00Z',
          profiles: {
            id: 'user-owner',
            email: 'owner@example.com',
            display_name: 'Owner User',
            username: 'owner',
            avatar_url: null,
            created_at: '2024-01-01T00:00:00Z',
          },
        },
        {
          id: 'membership-2',
          club_id: mockClubId,
          user_id: 'user-admin',
          role: 'admin',
          status: 'active',
          joined_at: '2024-01-02T00:00:00Z',
          profiles: {
            id: 'user-admin',
            email: 'admin@example.com',
            display_name: 'Admin User',
            username: 'admin',
            avatar_url: null,
            created_at: '2024-01-02T00:00:00Z',
          },
        },
        {
          id: 'membership-3',
          club_id: mockClubId,
          user_id: 'user-member',
          role: 'member',
          status: 'active',
          joined_at: '2024-01-03T00:00:00Z',
          profiles: {
            id: 'user-member',
            email: 'member@example.com',
            display_name: 'Member User',
            username: 'member',
            avatar_url: null,
            created_at: '2024-01-03T00:00:00Z',
          },
        },
      ];

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: mockMembers,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useClubMembers(mockClubId), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toHaveLength(3);
      expect(result.current.data![0]).toMatchObject({
        id: 'membership-1',
        role: 'owner',
        profile: expect.objectContaining({
          display_name: 'Owner User',
        }),
      });
      expect(supabase.from).toHaveBeenCalledWith('club_memberships');
    });

    it('should return empty array when club has no members', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useClubMembers(mockClubId), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual([]);
    });

    it('should handle errors when fetching members', async () => {
      const error = new Error('Database error');

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: null,
                  error,
                }),
              }),
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useClubMembers(mockClubId), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.data).toBeUndefined();
    });

    it('should be disabled when clubId is undefined', () => {
      const { result } = renderHook(() => useClubMembers(undefined), { wrapper });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('should throw error when clubId is required but not provided', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      const { result } = renderHook(
        () => {
          const query = useClubMembers(undefined);
          React.useEffect(() => {
            if (!query.data && !query.error && !query.isLoading) {
              query.refetch();
            }
          }, [query]);
          return query;
        },
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });
    });

    it('should order members by role then joined_at', async () => {
      const orderSpy = jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: orderSpy,
            }),
          }),
        }),
      });

      renderHook(() => useClubMembers(mockClubId), { wrapper });

      await waitFor(() => {
        expect(orderSpy).toHaveBeenCalledWith('role', { ascending: true });
      });
    });

    it('should filter only active members', async () => {
      const eqSpy = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: eqSpy,
        }),
      });

      renderHook(() => useClubMembers(mockClubId), { wrapper });

      await waitFor(() => {
        expect(eqSpy).toHaveBeenCalledWith('club_id', mockClubId);
        expect(eqSpy).toHaveBeenCalledWith('status', 'active');
      });
    });
  });

  describe('useClubMemberCount Query', () => {
    it('should fetch member count successfully', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              count: 5,
              error: null,
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useClubMemberCount(mockClubId), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBe(5);
    });

    it('should return 0 when count is null', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              count: null,
              error: null,
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useClubMemberCount(mockClubId), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBe(0);
    });

    it('should handle errors when fetching count', async () => {
      const error = new Error('Count error');

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              count: null,
              error,
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useClubMemberCount(mockClubId), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
    });

    it('should be disabled when clubId is undefined', () => {
      const { result } = renderHook(() => useClubMemberCount(undefined), { wrapper });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
      expect(supabase.from).not.toHaveBeenCalled();
    });
  });

  describe('useUserClubRole Query', () => {
    it('should fetch user role successfully', async () => {
      const mockRoleData = {
        role: 'admin' as const,
        status: 'active' as const,
      };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockRoleData,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useUserClubRole(mockClubId, mockUserId), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockRoleData);
    });

    it('should return null when user has no membership', async () => {
      const error = { code: 'PGRST116', message: 'No rows found' };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error,
                }),
              }),
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useUserClubRole(mockClubId, mockUserId), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeNull();
    });

    it('should handle database errors', async () => {
      const error = { code: 'DATABASE_ERROR', message: 'Database error' };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error,
                }),
              }),
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useUserClubRole(mockClubId, mockUserId), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
    });

    it('should be disabled when clubId or userId is undefined', () => {
      const { result: result1 } = renderHook(() => useUserClubRole(undefined, mockUserId), {
        wrapper,
      });
      const { result: result2 } = renderHook(() => useUserClubRole(mockClubId, undefined), {
        wrapper,
      });

      expect(result1.current.isLoading).toBe(false);
      expect(result1.current.data).toBeUndefined();
      expect(result2.current.isLoading).toBe(false);
      expect(result2.current.data).toBeUndefined();
      expect(supabase.from).not.toHaveBeenCalled();
    });
  });

  describe('useUpdateMemberRole Mutation', () => {
    const updateParams = {
      membershipId: mockMembershipId,
      role: 'admin' as const,
      clubId: mockClubId,
    };

    it('should update member role successfully', async () => {
      const updatedMembership = {
        ...mockMembership,
        role: 'admin' as const,
      };

      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: updatedMembership,
                error: null,
              }),
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useUpdateMemberRole(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(updateParams);
      });

      expect(supabase.from).toHaveBeenCalledWith('club_memberships');
      expect(Toast.show).toHaveBeenCalledWith({
        type: 'success',
        text1: 'Role updated',
        text2: 'Member role has been changed',
      });
    });

    it('should invalidate club members query on success', async () => {
      const updatedMembership = {
        ...mockMembership,
        role: 'admin' as const,
      };

      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: updatedMembership,
                error: null,
              }),
            }),
          }),
        }),
      });

      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useUpdateMemberRole(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(updateParams);
      });

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['club-members', mockClubId],
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['user-club-role', mockClubId],
      });
    });

    it('should handle update errors', async () => {
      const error = new Error('Permission denied');

      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error,
              }),
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useUpdateMemberRole(), { wrapper });

      await expect(
        act(async () => {
          await result.current.mutateAsync(updateParams);
        })
      ).rejects.toThrow('Permission denied');

      expect(Toast.show).toHaveBeenCalledWith({
        type: 'error',
        text1: 'Failed to update role',
        text2: 'Permission denied',
      });
    });

    it('should update role correctly in database', async () => {
      const updateSpy = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockMembership,
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        update: updateSpy,
      });

      const { result } = renderHook(() => useUpdateMemberRole(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(updateParams);
      });

      expect(updateSpy).toHaveBeenCalledWith({ role: 'admin' });
    });
  });

  describe('useRemoveMember Mutation', () => {
    const removeParams = {
      membershipId: mockMembershipId,
      clubId: mockClubId,
    };

    it('should remove member successfully (soft delete)', async () => {
      const removedMembership = {
        ...mockMembership,
        status: 'removed' as const,
      };

      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: removedMembership,
                error: null,
              }),
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useRemoveMember(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(removeParams);
      });

      expect(Toast.show).toHaveBeenCalledWith({
        type: 'success',
        text1: 'Member removed',
        text2: 'Member has been removed from the club',
      });
    });

    it('should soft delete by updating status to removed', async () => {
      const updateSpy = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockMembership,
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        update: updateSpy,
      });

      const { result } = renderHook(() => useRemoveMember(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(removeParams);
      });

      expect(updateSpy).toHaveBeenCalledWith({ status: 'removed' });
    });

    it('should invalidate club members and count queries on success', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockMembership,
                error: null,
              }),
            }),
          }),
        }),
      });

      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useRemoveMember(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(removeParams);
      });

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['club-members', mockClubId],
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['club-member-count', mockClubId],
      });
    });

    it('should handle remove errors', async () => {
      const error = new Error('Permission denied');

      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error,
              }),
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useRemoveMember(), { wrapper });

      await expect(
        act(async () => {
          await result.current.mutateAsync(removeParams);
        })
      ).rejects.toThrow('Permission denied');

      expect(Toast.show).toHaveBeenCalledWith({
        type: 'error',
        text1: 'Failed to remove member',
        text2: 'Permission denied',
      });
    });
  });

  describe('useInviteMember Mutation', () => {
    const inviteParams = {
      clubId: mockClubId,
      invitedBy: mockUserId,
      invitedUserId: 'user-789',
    };

    it('should invite member by user ID successfully', async () => {
      const mockInvitation = {
        id: 'invite-123',
        club_id: mockClubId,
        invited_by: mockUserId,
        invited_user_id: 'user-789',
        invited_email: null,
        status: 'pending' as const,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      // Mock existing membership check (no existing membership)
      const membershipSelectSpy = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
      });

      // Mock existing invitation check (no existing invitation)
      const invitationSelectSpy = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' },
              }),
            }),
          }),
        }),
      });

      // Mock invitation insert
      const insertSpy = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockInvitation,
            error: null,
          }),
        }),
      });

      let callCount = 0;
      (supabase.from as jest.Mock).mockImplementation((table) => {
        callCount++;
        if (table === 'club_memberships') {
          return { select: membershipSelectSpy };
        } else if (table === 'club_invitations') {
          if (callCount === 2) {
            return { select: invitationSelectSpy };
          } else {
            return { insert: insertSpy };
          }
        }
      });

      const { result } = renderHook(() => useInviteMember(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(inviteParams);
      });

      expect(insertSpy).toHaveBeenCalled();
      expect(Toast.show).toHaveBeenCalledWith({
        type: 'success',
        text1: 'Invitation sent',
        text2: 'Member has been invited to join the club',
      });
    });

    it('should invite member by email successfully', async () => {
      const inviteByEmailParams = {
        clubId: mockClubId,
        invitedBy: mockUserId,
        invitedEmail: 'newmember@example.com',
      };

      const mockInvitation = {
        id: 'invite-123',
        club_id: mockClubId,
        invited_by: mockUserId,
        invited_user_id: null,
        invited_email: 'newmember@example.com',
        status: 'pending' as const,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const invitationSelectSpy = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' },
              }),
            }),
          }),
        }),
      });

      const insertSpy = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockInvitation,
            error: null,
          }),
        }),
      });

      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'club_invitations') {
          return {
            select: invitationSelectSpy,
            insert: insertSpy,
          };
        }
      });

      const { result } = renderHook(() => useInviteMember(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(inviteByEmailParams);
      });

      expect(insertSpy).toHaveBeenCalled();
      expect(Toast.show).toHaveBeenCalledWith({
        type: 'success',
        text1: 'Invitation sent',
        text2: 'Member has been invited to join the club',
      });
    });

    it('should reject invitation if neither userId nor email provided', async () => {
      const invalidParams = {
        clubId: mockClubId,
        invitedBy: mockUserId,
      };

      const { result } = renderHook(() => useInviteMember(), { wrapper });

      await expect(
        act(async () => {
          await result.current.mutateAsync(invalidParams);
        })
      ).rejects.toThrow('Either user ID or email is required');
    });

    it('should reject if user is already an active member', async () => {
      const existingMembership = {
        id: 'membership-existing',
        status: 'active',
      };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: existingMembership,
                error: null,
              }),
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useInviteMember(), { wrapper });

      await expect(
        act(async () => {
          await result.current.mutateAsync(inviteParams);
        })
      ).rejects.toThrow('User is already a member of this club');

      expect(Toast.show).toHaveBeenCalledWith({
        type: 'error',
        text1: 'Failed to send invitation',
        text2: 'User is already a member of this club',
      });
    });

    it('should reject if user already has pending invitation', async () => {
      const existingMembership = {
        id: 'membership-existing',
        status: 'pending',
      };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: existingMembership,
                error: null,
              }),
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useInviteMember(), { wrapper });

      await expect(
        act(async () => {
          await result.current.mutateAsync(inviteParams);
        })
      ).rejects.toThrow('User already has a pending invitation');
    });

    it('should reject if invitation already exists', async () => {
      // Mock existing membership check (no membership)
      const membershipSelectSpy = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
      });

      // Mock existing invitation check (invitation exists)
      const existingInvitation = {
        id: 'invite-existing',
        status: 'pending',
      };

      const invitationSelectSpy = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: existingInvitation,
                error: null,
              }),
            }),
          }),
        }),
      });

      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'club_memberships') {
          return { select: membershipSelectSpy };
        } else if (table === 'club_invitations') {
          return { select: invitationSelectSpy };
        }
      });

      const { result } = renderHook(() => useInviteMember(), { wrapper });

      await expect(
        act(async () => {
          await result.current.mutateAsync(inviteParams);
        })
      ).rejects.toThrow('Invitation already sent to this user');
    });

    it('should invalidate invitation queries on success', async () => {
      const membershipSelectSpy = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
      });

      const invitationSelectSpy = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' },
              }),
            }),
          }),
        }),
      });

      const insertSpy = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {},
            error: null,
          }),
        }),
      });

      let callCount = 0;
      (supabase.from as jest.Mock).mockImplementation((table) => {
        callCount++;
        if (table === 'club_memberships') {
          return { select: membershipSelectSpy };
        } else if (table === 'club_invitations') {
          if (callCount === 2) {
            return { select: invitationSelectSpy };
          } else {
            return { insert: insertSpy };
          }
        }
      });

      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useInviteMember(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(inviteParams);
      });

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['club-invitations'],
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['user-invitations'],
      });
    });
  });

  describe('useLeaveClub Mutation', () => {
    const leaveParams = {
      clubId: mockClubId,
      userId: mockUserId,
    };

    it('should allow member to leave club successfully', async () => {
      // Mock club owner check (user is not owner)
      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'clubs') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { owner_id: 'other-user' },
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === 'club_memberships') {
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  error: null,
                }),
              }),
            }),
          };
        }
      });

      const { result } = renderHook(() => useLeaveClub(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(leaveParams);
      });

      expect(Toast.show).toHaveBeenCalledWith({
        type: 'success',
        text1: 'Left club',
        text2: 'You have left the club',
      });
    });

    it('should prevent owner from leaving club', async () => {
      // Mock club owner check (user is owner)
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { owner_id: mockUserId },
              error: null,
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useLeaveClub(), { wrapper });

      await expect(
        act(async () => {
          await result.current.mutateAsync(leaveParams);
        })
      ).rejects.toThrow('Club owners cannot leave. Please transfer ownership or delete the club.');

      expect(Toast.show).toHaveBeenCalledWith({
        type: 'error',
        text1: 'Failed to leave club',
        text2: 'Club owners cannot leave. Please transfer ownership or delete the club.',
      });
    });

    it('should soft delete membership when leaving', async () => {
      const updateSpy = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      });

      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'clubs') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { owner_id: 'other-user' },
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === 'club_memberships') {
          return {
            update: updateSpy,
          };
        }
      });

      const { result } = renderHook(() => useLeaveClub(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(leaveParams);
      });

      expect(updateSpy).toHaveBeenCalledWith({ status: 'removed' });
    });

    it('should invalidate relevant queries on success', async () => {
      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'clubs') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { owner_id: 'other-user' },
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === 'club_memberships') {
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  error: null,
                }),
              }),
            }),
          };
        }
      });

      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useLeaveClub(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(leaveParams);
      });

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['clubs', mockUserId],
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['club-members', mockClubId],
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['club-member-count', mockClubId],
      });
    });

    it('should handle leave errors', async () => {
      const error = new Error('Database error');

      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'clubs') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { owner_id: 'other-user' },
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === 'club_memberships') {
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  error,
                }),
              }),
            }),
          };
        }
      });

      const { result } = renderHook(() => useLeaveClub(), { wrapper });

      await expect(
        act(async () => {
          await result.current.mutateAsync(leaveParams);
        })
      ).rejects.toThrow('Database error');

      expect(Toast.show).toHaveBeenCalledWith({
        type: 'error',
        text1: 'Failed to leave club',
        text2: 'Database error',
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state for useClubMembers', () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue(
                  new Promise(() => {}) // Never resolves
                ),
              }),
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useClubMembers(mockClubId), { wrapper });

      expect(result.current.isLoading).toBe(true);
    });

    it('should show loading state for mutations', async () => {
      let resolveUpdate: any;
      const updatePromise = new Promise((resolve) => {
        resolveUpdate = resolve;
      });

      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockReturnValue(updatePromise),
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useUpdateMemberRole(), { wrapper });

      act(() => {
        result.current.mutate({
          membershipId: mockMembershipId,
          role: 'admin',
          clubId: mockClubId,
        });
      });

      expect(result.current.isPending).toBe(true);

      // Resolve the promise
      await act(async () => {
        resolveUpdate({ data: mockMembership, error: null });
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.isPending).toBe(false);
    });
  });
});
