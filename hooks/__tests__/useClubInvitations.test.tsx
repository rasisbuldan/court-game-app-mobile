/**
 * useClubInvitations Hook Tests
 *
 * Comprehensive unit tests for club invitations management hooks covering:
 * - Fetching user invitations (by user_id and email)
 * - Fetching invitations count for badge
 * - Fetching club invitations (for admins)
 * - Accepting invitations with membership creation
 * - Declining invitations
 * - Canceling invitations (admin)
 * - Cleanup expired invitations
 * - Optimistic UI updates
 * - Query invalidation
 * - Toast notifications
 * - Error handling
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useUserInvitations,
  useInvitationsCount,
  useClubInvitations,
  useAcceptInvitation,
  useDeclineInvitation,
  useCancelInvitation,
  useCleanupExpiredInvitations,
} from '../useClubInvitations';
import { supabase } from '../../config/supabase';
import Toast from 'react-native-toast-message';

// Mock dependencies
jest.mock('../../config/supabase');
jest.mock('react-native-toast-message');

describe('useClubInvitations Hooks', () => {
  const mockUserId = 'user-123';
  const mockUserEmail = 'test@example.com';
  const mockClubId = 'club-123';
  const mockInvitationId = 'invitation-123';
  const currentDate = new Date();
  const futureDate = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

  const mockProfile = {
    id: mockUserId,
    email: mockUserEmail,
    display_name: 'Test User',
    username: 'testuser',
    avatar_url: null,
  };

  const mockClub = {
    id: mockClubId,
    name: 'Tennis Club Pro',
    bio: 'Premier tennis club',
    logo_url: 'https://example.com/logo.jpg',
    owner_id: 'owner-123',
    created_at: new Date().toISOString(),
  };

  const mockInviter = {
    id: 'inviter-123',
    display_name: 'Inviter User',
    username: 'inviter',
    avatar_url: null,
  };

  const mockInvitation = {
    id: mockInvitationId,
    club_id: mockClubId,
    invited_by: 'inviter-123',
    invited_user_id: mockUserId,
    invited_email: mockUserEmail,
    status: 'pending',
    created_at: new Date().toISOString(),
    expires_at: futureDate.toISOString(),
  };

  const mockInvitationWithDetails = {
    ...mockInvitation,
    clubs: mockClub,
    profiles: mockInviter,
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

    // Mock Date constructor to return a consistent date
    jest.useFakeTimers();
    jest.setSystemTime(currentDate);
  });

  afterEach(() => {
    queryClient.clear();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('useUserInvitations Query', () => {
    it('should fetch pending invitations for user by user_id', async () => {
      // Mock profile fetch
      const mockProfileSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockProfile,
            error: null,
          }),
        }),
      });

      // Mock invitations fetch
      const mockInvitationsSelect = jest.fn().mockReturnValue({
        or: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gt: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: [mockInvitationWithDetails],
                error: null,
              }),
            }),
          }),
        }),
      });

      let fromCallCount = 0;
      (supabase.from as jest.Mock).mockImplementation((table) => {
        fromCallCount++;
        if (table === 'profiles' && fromCallCount === 1) {
          return { select: mockProfileSelect };
        }
        if (table === 'club_invitations' && fromCallCount === 2) {
          return { select: mockInvitationsSelect };
        }
      });

      const { result } = renderHook(() => useUserInvitations(mockUserId), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toHaveLength(1);
      expect(result.current.data![0]).toMatchObject({
        id: mockInvitationId,
        club_id: mockClubId,
        status: 'pending',
        club: mockClub,
        inviter: mockInviter,
      });

      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(supabase.from).toHaveBeenCalledWith('club_invitations');
    });

    it('should fetch invitations by email when user has email', async () => {
      const mockProfileSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockProfile,
            error: null,
          }),
        }),
      });

      const mockOr = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          gt: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [mockInvitationWithDetails],
              error: null,
            }),
          }),
        }),
      });

      const mockInvitationsSelect = jest.fn().mockReturnValue({
        or: mockOr,
      });

      let fromCallCount = 0;
      (supabase.from as jest.Mock).mockImplementation((table) => {
        fromCallCount++;
        if (table === 'profiles' && fromCallCount === 1) {
          return { select: mockProfileSelect };
        }
        if (table === 'club_invitations' && fromCallCount === 2) {
          return { select: mockInvitationsSelect };
        }
      });

      const { result } = renderHook(() => useUserInvitations(mockUserId), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify the .or() was called with both user_id and email
      expect(mockOr).toHaveBeenCalledWith(
        `invited_user_id.eq.${mockUserId},invited_email.eq.${mockUserEmail}`
      );
    });

    it('should return empty array when no invitations exist', async () => {
      const mockProfileSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockProfile,
            error: null,
          }),
        }),
      });

      const mockInvitationsSelect = jest.fn().mockReturnValue({
        or: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gt: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }),
      });

      let fromCallCount = 0;
      (supabase.from as jest.Mock).mockImplementation((table) => {
        fromCallCount++;
        if (table === 'profiles' && fromCallCount === 1) {
          return { select: mockProfileSelect };
        }
        if (table === 'club_invitations' && fromCallCount === 2) {
          return { select: mockInvitationsSelect };
        }
      });

      const { result } = renderHook(() => useUserInvitations(mockUserId), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual([]);
    });

    it('should filter out expired invitations', async () => {
      const expiredDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000); // Yesterday
      const mockGt = jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      });

      const mockProfileSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockProfile,
            error: null,
          }),
        }),
      });

      const mockInvitationsSelect = jest.fn().mockReturnValue({
        or: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gt: mockGt,
          }),
        }),
      });

      let fromCallCount = 0;
      (supabase.from as jest.Mock).mockImplementation((table) => {
        fromCallCount++;
        if (table === 'profiles' && fromCallCount === 1) {
          return { select: mockProfileSelect };
        }
        if (table === 'club_invitations' && fromCallCount === 2) {
          return { select: mockInvitationsSelect };
        }
      });

      const { result } = renderHook(() => useUserInvitations(mockUserId), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify gt was called with current date to filter expired invitations
      expect(mockGt).toHaveBeenCalledWith('expires_at', currentDate.toISOString());
    });

    it('should handle errors when fetching invitations', async () => {
      const error = new Error('Database error');

      const mockProfileSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockProfile,
            error: null,
          }),
        }),
      });

      const mockInvitationsSelect = jest.fn().mockReturnValue({
        or: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gt: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: null,
                error,
              }),
            }),
          }),
        }),
      });

      let fromCallCount = 0;
      (supabase.from as jest.Mock).mockImplementation((table) => {
        fromCallCount++;
        if (table === 'profiles' && fromCallCount === 1) {
          return { select: mockProfileSelect };
        }
        if (table === 'club_invitations' && fromCallCount === 2) {
          return { select: mockInvitationsSelect };
        }
      });

      const { result } = renderHook(() => useUserInvitations(mockUserId), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.data).toBeUndefined();
    });

    it('should be disabled when userId is undefined', () => {
      const { result } = renderHook(() => useUserInvitations(undefined), { wrapper });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('should throw error when userId is required but not provided', async () => {
      const mockProfileSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockProfile,
            error: null,
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockProfileSelect,
      });

      const { result } = renderHook(
        () => {
          const query = useUserInvitations(undefined);
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

      expect(result.current.error?.message).toBe('User ID is required');
    });
  });

  describe('useInvitationsCount Query', () => {
    it('should fetch pending invitations count', async () => {
      const mockProfileSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockProfile,
            error: null,
          }),
        }),
      });

      const mockInvitationsSelect = jest.fn().mockReturnValue({
        or: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gt: jest.fn().mockResolvedValue({
              count: 3,
              error: null,
            }),
          }),
        }),
      });

      let fromCallCount = 0;
      (supabase.from as jest.Mock).mockImplementation((table) => {
        fromCallCount++;
        if (table === 'profiles' && fromCallCount === 1) {
          return { select: mockProfileSelect };
        }
        if (table === 'club_invitations' && fromCallCount === 2) {
          return { select: mockInvitationsSelect };
        }
      });

      const { result } = renderHook(() => useInvitationsCount(mockUserId), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBe(3);
    });

    it('should return 0 when count is null', async () => {
      const mockProfileSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockProfile,
            error: null,
          }),
        }),
      });

      const mockInvitationsSelect = jest.fn().mockReturnValue({
        or: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gt: jest.fn().mockResolvedValue({
              count: null,
              error: null,
            }),
          }),
        }),
      });

      let fromCallCount = 0;
      (supabase.from as jest.Mock).mockImplementation((table) => {
        fromCallCount++;
        if (table === 'profiles' && fromCallCount === 1) {
          return { select: mockProfileSelect };
        }
        if (table === 'club_invitations' && fromCallCount === 2) {
          return { select: mockInvitationsSelect };
        }
      });

      const { result } = renderHook(() => useInvitationsCount(mockUserId), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBe(0);
    });

    it('should be disabled when userId is undefined', () => {
      const { result } = renderHook(() => useInvitationsCount(undefined), { wrapper });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
      expect(supabase.from).not.toHaveBeenCalled();
    });
  });

  describe('useClubInvitations Query', () => {
    it('should fetch invitations for a club', async () => {
      const mockClubInvitation = {
        ...mockInvitation,
        profiles: mockProfile,
      };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            in: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: [mockClubInvitation],
                error: null,
              }),
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useClubInvitations(mockClubId), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toHaveLength(1);
      expect(result.current.data![0]).toMatchObject({
        id: mockInvitationId,
        club_id: mockClubId,
        invitee: mockProfile,
      });

      expect(supabase.from).toHaveBeenCalledWith('club_invitations');
    });

    it('should fetch invitations with all statuses (pending, accepted, declined)', async () => {
      const mockIn = jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            in: mockIn,
          }),
        }),
      });

      const { result } = renderHook(() => useClubInvitations(mockClubId), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockIn).toHaveBeenCalledWith('status', ['pending', 'accepted', 'declined']);
    });

    it('should be disabled when clubId is undefined', () => {
      const { result } = renderHook(() => useClubInvitations(undefined), { wrapper });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('should handle errors when fetching club invitations', async () => {
      const error = new Error('Database error');

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            in: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: null,
                error,
              }),
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useClubInvitations(mockClubId), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('useAcceptInvitation Mutation', () => {
    const acceptParams = {
      invitationId: mockInvitationId,
      userId: mockUserId,
    };

    it('should accept invitation and create membership successfully', async () => {
      let fromCallCount = 0;

      (supabase.from as jest.Mock).mockImplementation((table) => {
        fromCallCount++;

        if (table === 'club_invitations' && fromCallCount === 1) {
          // First call: get invitation details
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    club_id: mockClubId,
                    status: 'pending',
                    expires_at: futureDate.toISOString(),
                  },
                  error: null,
                }),
              }),
            }),
          };
        }

        if (table === 'club_memberships' && fromCallCount === 2) {
          // Second call: check existing membership
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: { code: 'PGRST116' }, // No rows found
                  }),
                }),
              }),
            }),
          };
        }

        if (table === 'club_invitations' && fromCallCount === 3) {
          // Third call: update invitation status
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                error: null,
              }),
            }),
          };
        }

        if (table === 'club_memberships' && fromCallCount === 4) {
          // Fourth call: create membership
          return {
            insert: jest.fn().mockResolvedValue({
              error: null,
            }),
          };
        }
      });

      const { result } = renderHook(() => useAcceptInvitation(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(acceptParams);
      });

      expect(Toast.show).toHaveBeenCalledWith({
        type: 'success',
        text1: 'Invitation accepted',
        text2: 'Welcome to the club!',
      });
    });

    it('should reactivate existing membership when accepting invitation', async () => {
      let fromCallCount = 0;
      const existingMembershipId = 'membership-123';

      (supabase.from as jest.Mock).mockImplementation((table) => {
        fromCallCount++;

        if (table === 'club_invitations' && fromCallCount === 1) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    club_id: mockClubId,
                    status: 'pending',
                    expires_at: futureDate.toISOString(),
                  },
                  error: null,
                }),
              }),
            }),
          };
        }

        if (table === 'club_memberships' && fromCallCount === 2) {
          // Check existing membership - found removed membership
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: {
                      id: existingMembershipId,
                      status: 'removed',
                    },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }

        if (table === 'club_invitations' && fromCallCount === 3) {
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                error: null,
              }),
            }),
          };
        }

        if (table === 'club_memberships' && fromCallCount === 4) {
          // Reactivate membership
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                error: null,
              }),
            }),
          };
        }
      });

      const { result } = renderHook(() => useAcceptInvitation(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(acceptParams);
      });

      expect(Toast.show).toHaveBeenCalledWith({
        type: 'success',
        text1: 'Invitation accepted',
        text2: 'Welcome to the club!',
      });
    });

    it('should reject invitation if status is not pending', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                club_id: mockClubId,
                status: 'accepted', // Already accepted
                expires_at: futureDate.toISOString(),
              },
              error: null,
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useAcceptInvitation(), { wrapper });

      await expect(
        act(async () => {
          await result.current.mutateAsync(acceptParams);
        })
      ).rejects.toThrow('Invitation is no longer valid');

      await waitFor(() => {
        expect(Toast.show).toHaveBeenCalledWith({
          type: 'error',
          text1: 'Failed to accept invitation',
          text2: 'Invitation is no longer valid',
        });
      });
    });

    it('should reject expired invitation', async () => {
      const expiredDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000); // Yesterday

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                club_id: mockClubId,
                status: 'pending',
                expires_at: expiredDate.toISOString(),
              },
              error: null,
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useAcceptInvitation(), { wrapper });

      await expect(
        act(async () => {
          await result.current.mutateAsync(acceptParams);
        })
      ).rejects.toThrow('Invitation has expired');

      await waitFor(() => {
        expect(Toast.show).toHaveBeenCalledWith({
          type: 'error',
          text1: 'Failed to accept invitation',
          text2: 'Invitation has expired',
        });
      });
    });

    it('should reject if user is already active member', async () => {
      let fromCallCount = 0;

      (supabase.from as jest.Mock).mockImplementation((table) => {
        fromCallCount++;

        if (table === 'club_invitations' && fromCallCount === 1) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    club_id: mockClubId,
                    status: 'pending',
                    expires_at: futureDate.toISOString(),
                  },
                  error: null,
                }),
              }),
            }),
          };
        }

        if (table === 'club_memberships' && fromCallCount === 2) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: {
                      id: 'membership-123',
                      status: 'active',
                    },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
      });

      const { result } = renderHook(() => useAcceptInvitation(), { wrapper });

      await expect(
        act(async () => {
          await result.current.mutateAsync(acceptParams);
        })
      ).rejects.toThrow('You are already a member of this club');

      await waitFor(() => {
        expect(Toast.show).toHaveBeenCalledWith({
          type: 'error',
          text1: 'Failed to accept invitation',
          text2: 'You are already a member of this club',
        });
      });
    });

    it('should invalidate all relevant queries on success', async () => {
      let fromCallCount = 0;

      (supabase.from as jest.Mock).mockImplementation((table) => {
        fromCallCount++;

        if (table === 'club_invitations' && fromCallCount === 1) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    club_id: mockClubId,
                    status: 'pending',
                    expires_at: futureDate.toISOString(),
                  },
                  error: null,
                }),
              }),
            }),
          };
        }

        if (table === 'club_memberships' && fromCallCount === 2) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: { code: 'PGRST116' },
                  }),
                }),
              }),
            }),
          };
        }

        if (table === 'club_invitations' && fromCallCount === 3) {
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                error: null,
              }),
            }),
          };
        }

        if (table === 'club_memberships' && fromCallCount === 4) {
          return {
            insert: jest.fn().mockResolvedValue({
              error: null,
            }),
          };
        }
      });

      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useAcceptInvitation(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(acceptParams);
      });

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['user-invitations', mockUserId] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['invitations-count', mockUserId] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['clubs', mockUserId] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['club-members', mockClubId] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['club-member-count', mockClubId] });
    });

    it('should handle network errors', async () => {
      const error = new Error('Network error');

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error,
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useAcceptInvitation(), { wrapper });

      await expect(
        act(async () => {
          await result.current.mutateAsync(acceptParams);
        })
      ).rejects.toThrow('Network error');

      await waitFor(() => {
        expect(Toast.show).toHaveBeenCalledWith({
          type: 'error',
          text1: 'Failed to accept invitation',
          text2: 'Network error',
        });
      });
    });
  });

  describe('useDeclineInvitation Mutation', () => {
    const declineParams = {
      invitationId: mockInvitationId,
    };

    it('should decline invitation successfully', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { club_id: mockClubId },
                error: null,
              }),
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useDeclineInvitation(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(declineParams);
      });

      expect(Toast.show).toHaveBeenCalledWith({
        type: 'info',
        text1: 'Invitation declined',
        text2: 'You can always accept future invitations',
      });
    });

    it('should invalidate queries on success', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { club_id: mockClubId },
                error: null,
              }),
            }),
          }),
        }),
      });

      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useDeclineInvitation(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(declineParams);
      });

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['user-invitations'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['invitations-count'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['club-invitations', mockClubId] });
    });

    it('should handle errors when declining invitation', async () => {
      const error = new Error('Database error');

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

      const { result } = renderHook(() => useDeclineInvitation(), { wrapper });

      await expect(
        act(async () => {
          await result.current.mutateAsync(declineParams);
        })
      ).rejects.toThrow('Database error');

      await waitFor(() => {
        expect(Toast.show).toHaveBeenCalledWith({
          type: 'error',
          text1: 'Failed to decline invitation',
          text2: 'Database error',
        });
      });
    });
  });

  describe('useCancelInvitation Mutation', () => {
    const cancelParams = {
      invitationId: mockInvitationId,
    };

    it('should cancel invitation successfully', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { club_id: mockClubId },
                error: null,
              }),
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useCancelInvitation(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(cancelParams);
      });

      expect(Toast.show).toHaveBeenCalledWith({
        type: 'success',
        text1: 'Invitation cancelled',
        text2: 'The invitation has been removed',
      });
    });

    it('should invalidate club invitations query on success', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { club_id: mockClubId },
                error: null,
              }),
            }),
          }),
        }),
      });

      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useCancelInvitation(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(cancelParams);
      });

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['club-invitations', mockClubId] });
    });

    it('should handle errors when canceling invitation', async () => {
      const error = new Error('Permission denied');

      (supabase.from as jest.Mock).mockReturnValue({
        delete: jest.fn().mockReturnValue({
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

      const { result } = renderHook(() => useCancelInvitation(), { wrapper });

      await expect(
        act(async () => {
          await result.current.mutateAsync(cancelParams);
        })
      ).rejects.toThrow('Permission denied');

      await waitFor(() => {
        expect(Toast.show).toHaveBeenCalledWith({
          type: 'error',
          text1: 'Failed to cancel invitation',
          text2: 'Permission denied',
        });
      });
    });
  });

  describe('useCleanupExpiredInvitations Mutation', () => {
    it('should cleanup expired invitations successfully', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            lt: jest.fn().mockResolvedValue({
              error: null,
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useCleanupExpiredInvitations(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync();
      });

      expect(supabase.from).toHaveBeenCalledWith('club_invitations');
    });

    it('should update status to expired for pending invitations past expiry date', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          lt: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });

      const { result } = renderHook(() => useCleanupExpiredInvitations(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync();
      });

      expect(mockUpdate).toHaveBeenCalledWith({ status: 'expired' });
    });

    it('should invalidate all invitation queries on success', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            lt: jest.fn().mockResolvedValue({
              error: null,
            }),
          }),
        }),
      });

      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useCleanupExpiredInvitations(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync();
      });

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['user-invitations'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['invitations-count'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['club-invitations'] });
    });

    it('should handle errors during cleanup', async () => {
      const error = new Error('Database error');

      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            lt: jest.fn().mockResolvedValue({
              error,
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useCleanupExpiredInvitations(), { wrapper });

      await expect(
        act(async () => {
          await result.current.mutateAsync();
        })
      ).rejects.toThrow('Database error');
    });
  });
});
