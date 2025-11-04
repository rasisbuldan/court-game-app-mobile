/**
 * useClubs Hook Tests
 *
 * Comprehensive unit tests for clubs management hooks covering:
 * - Fetching user's clubs with membership info
 * - Fetching single club by ID
 * - Fetching owned clubs
 * - Creating clubs with validations
 * - Updating clubs
 * - Deleting clubs
 * - Query invalidation
 * - Toast notifications
 * - Error handling
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useClubs,
  useClub,
  useOwnedClubs,
  useCreateClub,
  useUpdateClub,
  useDeleteClub,
} from '../useClubs';
import { supabase } from '../../config/supabase';
import Toast from 'react-native-toast-message';
import { Logger } from '../../utils/logger';

// Mock dependencies
jest.mock('../../config/supabase');
jest.mock('react-native-toast-message');
jest.mock('../../utils/logger', () => ({
  Logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('useClubs Hooks', () => {
  const mockUserId = 'user-123';
  const mockClubId = 'club-123';

  const mockClub = {
    id: 'club-123',
    name: 'Tennis Club Pro',
    bio: 'Premier tennis club',
    logo_url: 'https://example.com/logo.jpg',
    owner_id: 'user-123',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockClubWithRole = {
    ...mockClub,
    userRole: 'owner',
  };

  const mockMembership = {
    club_id: 'club-123',
    role: 'owner',
    status: 'active',
    clubs: mockClub,
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

  describe('useClubs Query', () => {
    it('should return empty array when user has no clubs', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useClubs(mockUserId), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual([]);
      expect(supabase.from).toHaveBeenCalledWith('club_memberships');
    });

    it('should return clubs with membership info', async () => {
      const mockMemberships = [
        {
          club_id: 'club-1',
          role: 'owner',
          status: 'active',
          clubs: {
            id: 'club-1',
            name: 'Club One',
            bio: 'First club',
            logo_url: null,
            owner_id: mockUserId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        },
        {
          club_id: 'club-2',
          role: 'member',
          status: 'active',
          clubs: {
            id: 'club-2',
            name: 'Club Two',
            bio: 'Second club',
            logo_url: null,
            owner_id: 'other-user',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        },
      ];

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: mockMemberships,
                error: null,
              }),
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useClubs(mockUserId), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toHaveLength(2);
      expect(result.current.data![0]).toMatchObject({
        id: 'club-1',
        name: 'Club One',
        userRole: 'owner',
      });
      expect(result.current.data![1]).toMatchObject({
        id: 'club-2',
        name: 'Club Two',
        userRole: 'member',
      });
    });

    it('should handle errors when fetching clubs', async () => {
      const error = new Error('Database error');

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: null,
                error,
              }),
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useClubs(mockUserId), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.data).toBeUndefined();
    });

    it('should be disabled when userId is undefined', () => {
      const { result } = renderHook(() => useClubs(undefined), { wrapper });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('should throw error when userId is required but not provided', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }),
      });

      // Force the query to run even though disabled
      const { result } = renderHook(
        () => {
          const query = useClubs(undefined);
          // Manually trigger the query
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
  });

  describe('useClub Query', () => {
    it('should fetch single club successfully', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockClub,
              error: null,
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useClub(mockClubId), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockClub);
      expect(supabase.from).toHaveBeenCalledWith('clubs');
    });

    it('should handle errors when fetching single club', async () => {
      const error = new Error('Club not found');

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

      const { result } = renderHook(() => useClub(mockClubId), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
    });

    it('should be disabled when clubId is undefined', () => {
      const { result } = renderHook(() => useClub(undefined), { wrapper });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
      expect(supabase.from).not.toHaveBeenCalled();
    });
  });

  describe('useOwnedClubs Query', () => {
    it('should fetch owned clubs successfully', async () => {
      const ownedClubs = [mockClub];

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: ownedClubs,
              error: null,
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useOwnedClubs(mockUserId), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(ownedClubs);
      expect(supabase.from).toHaveBeenCalledWith('clubs');
    });

    it('should respect enabled option', () => {
      const { result } = renderHook(
        () => useOwnedClubs(mockUserId, { enabled: false }),
        { wrapper }
      );

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('should handle errors when fetching owned clubs', async () => {
      const error = new Error('Database error');

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: null,
              error,
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useOwnedClubs(mockUserId), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
    });

    it('should return empty array when user owns no clubs', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useOwnedClubs(mockUserId), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual([]);
    });
  });

  describe('useCreateClub Mutation', () => {
    const createParams = {
      name: 'New Club',
      bio: 'A great club',
      logo_url: 'https://example.com/logo.jpg',
      owner_id: mockUserId,
    };

    it('should create club successfully', async () => {
      // Mock count check (user has 2 clubs)
      const mockSelect = jest.fn()
        .mockReturnValueOnce({
          // First call for count check
          eq: jest.fn().mockResolvedValue({
            count: 2,
            error: null,
          }),
        })
        .mockReturnValueOnce({
          // Second call for name check
          ilike: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }, // No rows found
            }),
          }),
        });

      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockClub,
            error: null,
          }),
        }),
      });

      const mockMembershipInsert = jest.fn().mockResolvedValue({
        error: null,
      });

      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'clubs') {
          return {
            select: mockSelect,
            insert: mockInsert,
          };
        }
        if (table === 'club_memberships') {
          return {
            insert: mockMembershipInsert,
          };
        }
      });

      const { result } = renderHook(() => useCreateClub(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(createParams);
      });

      expect(mockInsert).toHaveBeenCalledWith({
        name: 'New Club',
        bio: 'A great club',
        logo_url: 'https://example.com/logo.jpg',
        owner_id: mockUserId,
      });

      expect(mockMembershipInsert).toHaveBeenCalledWith({
        club_id: mockClub.id,
        user_id: mockUserId,
        role: 'owner',
        status: 'active',
      });

      expect(Toast.show).toHaveBeenCalledWith({
        type: 'success',
        text1: 'Club created',
        text2: `${mockClub.name} is ready to go!`,
      });

      expect(Logger.info).toHaveBeenCalledWith(
        'useCreateClub: Club created successfully',
        expect.objectContaining({
          userId: mockUserId,
          clubId: mockClub.id,
          action: 'create_club_success',
        })
      );
    });

    it('should enforce 3-club limit', async () => {
      const mockEq = jest.fn().mockResolvedValue({
        count: 3,
        error: null,
      });

      const mockSelect = jest.fn().mockReturnValue({
        eq: mockEq,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useCreateClub(), { wrapper });

      await expect(
        act(async () => {
          await result.current.mutateAsync(createParams);
        })
      ).rejects.toThrow('You can only create up to 3 clubs');

      await waitFor(() => {
        expect(Toast.show).toHaveBeenCalledWith({
          type: 'error',
          text1: 'Failed to create club',
          text2: 'You can only create up to 3 clubs',
        });
      });

      expect(Logger.info).toHaveBeenCalledWith(
        'useCreateClub: Club limit reached',
        expect.objectContaining({
          userId: mockUserId,
          action: 'create_club_limit_reached',
        })
      );
    });

    it('should prevent duplicate club names (case-insensitive)', async () => {
      let fromCallCount = 0;
      (supabase.from as jest.Mock).mockImplementation(() => {
        fromCallCount++;
        if (fromCallCount === 1) {
          // First call: count check
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                count: 1,
                error: null,
              }),
            }),
          };
        } else {
          // Second call: name check - found existing
          return {
            select: jest.fn().mockReturnValue({
              ilike: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: 'existing-club' },
                  error: null,
                }),
              }),
            }),
          };
        }
      });

      const { result } = renderHook(() => useCreateClub(), { wrapper });

      await expect(
        act(async () => {
          await result.current.mutateAsync(createParams);
        })
      ).rejects.toThrow('Club name is already taken');

      await waitFor(() => {
        expect(Toast.show).toHaveBeenCalledWith({
          type: 'error',
          text1: 'Failed to create club',
          text2: 'Club name is already taken',
        });
      });

      expect(Logger.info).toHaveBeenCalledWith(
        'useCreateClub: Club name already taken',
        expect.objectContaining({
          userId: mockUserId,
          action: 'create_club_name_conflict',
        })
      );
    });

    it('should rollback club creation if membership creation fails', async () => {
      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      const membershipError = new Error('Membership creation failed');

      let clubsCallCount = 0;
      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'clubs') {
          clubsCallCount++;
          if (clubsCallCount === 1) {
            // First call: count check
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  count: 1,
                  error: null,
                }),
              }),
            };
          } else if (clubsCallCount === 2) {
            // Second call: name check
            return {
              select: jest.fn().mockReturnValue({
                ilike: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: { code: 'PGRST116' },
                  }),
                }),
              }),
            };
          } else if (clubsCallCount === 3) {
            // Third call: insert club
            return {
              insert: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockClub,
                    error: null,
                  }),
                }),
              }),
            };
          } else {
            // Fourth call: delete (rollback)
            return {
              delete: mockDelete,
            };
          }
        }
        if (table === 'club_memberships') {
          return {
            insert: jest.fn().mockResolvedValue({
              error: membershipError,
            }),
          };
        }
      });

      const { result } = renderHook(() => useCreateClub(), { wrapper });

      await expect(
        act(async () => {
          await result.current.mutateAsync(createParams);
        })
      ).rejects.toThrow('Membership creation failed');

      // Wait for rollback to complete
      await waitFor(() => {
        expect(mockDelete).toHaveBeenCalled();
      });

      expect(Logger.error).toHaveBeenCalledWith(
        'useCreateClub: Membership creation failed, rolling back',
        membershipError,
        expect.objectContaining({
          userId: mockUserId,
          clubId: mockClub.id,
          action: 'create_club_membership_rollback',
        })
      );
    });

    it('should invalidate queries on success', async () => {
      const mockSelect = jest.fn()
        .mockReturnValueOnce({
          eq: jest.fn().mockResolvedValue({
            count: 1,
            error: null,
          }),
        })
        .mockReturnValueOnce({
          ilike: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        });

      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockClub,
            error: null,
          }),
        }),
      });

      const mockMembershipInsert = jest.fn().mockResolvedValue({
        error: null,
      });

      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'clubs') {
          return {
            select: mockSelect,
            insert: mockInsert,
          };
        }
        if (table === 'club_memberships') {
          return {
            insert: mockMembershipInsert,
          };
        }
      });

      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useCreateClub(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(createParams);
      });

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['clubs', mockUserId] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['owned-clubs', mockUserId] });
    });

    it('should show toast notification on success', async () => {
      const mockSelect = jest.fn()
        .mockReturnValueOnce({
          eq: jest.fn().mockResolvedValue({
            count: 1,
            error: null,
          }),
        })
        .mockReturnValueOnce({
          ilike: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        });

      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockClub,
            error: null,
          }),
        }),
      });

      const mockMembershipInsert = jest.fn().mockResolvedValue({
        error: null,
      });

      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'clubs') {
          return {
            select: mockSelect,
            insert: mockInsert,
          };
        }
        if (table === 'club_memberships') {
          return {
            insert: mockMembershipInsert,
          };
        }
      });

      const { result } = renderHook(() => useCreateClub(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(createParams);
      });

      expect(Toast.show).toHaveBeenCalledWith({
        type: 'success',
        text1: 'Club created',
        text2: `${mockClub.name} is ready to go!`,
      });
    });
  });

  describe('useUpdateClub Mutation', () => {
    const updateParams = {
      id: mockClubId,
      name: 'Updated Club Name',
      bio: 'Updated bio',
    };

    it('should update club successfully', async () => {
      const updatedClub = { ...mockClub, ...updateParams };

      const mockSelect = jest.fn().mockReturnValue({
        ilike: jest.fn().mockReturnValue({
          neq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
      });

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: updatedClub,
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
        update: mockUpdate,
      });

      const { result } = renderHook(() => useUpdateClub(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(updateParams);
      });

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Updated Club Name',
          bio: 'Updated bio',
        })
      );

      expect(Toast.show).toHaveBeenCalledWith({
        type: 'success',
        text1: 'Club updated',
        text2: 'Your changes have been saved',
      });
    });

    it('should prevent duplicate names when updating', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          ilike: jest.fn().mockReturnValue({
            neq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: 'other-club' },
                error: null,
              }),
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useUpdateClub(), { wrapper });

      await expect(
        act(async () => {
          await result.current.mutateAsync(updateParams);
        })
      ).rejects.toThrow('Club name is already taken');

      await waitFor(() => {
        expect(Toast.show).toHaveBeenCalledWith({
          type: 'error',
          text1: 'Failed to update club',
          text2: 'Club name is already taken',
        });
      });
    });

    it('should invalidate queries on success', async () => {
      const updatedClub = { ...mockClub, ...updateParams };

      const mockSelect = jest.fn().mockReturnValue({
        ilike: jest.fn().mockReturnValue({
          neq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
      });

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: updatedClub,
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
        update: mockUpdate,
      });

      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useUpdateClub(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(updateParams);
      });

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['club', mockClubId] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['clubs'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['owned-clubs'] });
    });

    it('should show toast notification on error', async () => {
      const error = new Error('Database error');

      const mockSelect = jest.fn().mockReturnValue({
        ilike: jest.fn().mockReturnValue({
          neq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
      });

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error,
            }),
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
        update: mockUpdate,
      });

      const { result } = renderHook(() => useUpdateClub(), { wrapper });

      await expect(
        act(async () => {
          await result.current.mutateAsync(updateParams);
        })
      ).rejects.toThrow('Database error');

      await waitFor(() => {
        expect(Toast.show).toHaveBeenCalledWith({
          type: 'error',
          text1: 'Failed to update club',
          text2: 'Database error',
        });
      });
    });
  });

  describe('useDeleteClub Mutation', () => {
    const deleteParams = { id: mockClubId };

    it('should delete club successfully', async () => {
      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          error: null,
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        delete: mockDelete,
      });

      const { result } = renderHook(() => useDeleteClub(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(deleteParams);
      });

      expect(mockDelete).toHaveBeenCalled();

      expect(Toast.show).toHaveBeenCalledWith({
        type: 'success',
        text1: 'Club deleted',
        text2: 'The club has been removed',
      });
    });

    it('should invalidate all club queries on success', async () => {
      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          error: null,
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        delete: mockDelete,
      });

      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useDeleteClub(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(deleteParams);
      });

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['clubs'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['owned-clubs'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['club', mockClubId] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['club-members'] });
    });

    it('should show toast notification on error', async () => {
      const error = new Error('Database error');

      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          error,
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        delete: mockDelete,
      });

      const { result } = renderHook(() => useDeleteClub(), { wrapper });

      await expect(
        act(async () => {
          await result.current.mutateAsync(deleteParams);
        })
      ).rejects.toThrow('Database error');

      await waitFor(() => {
        expect(Toast.show).toHaveBeenCalledWith({
          type: 'error',
          text1: 'Failed to delete club',
          text2: 'Database error',
        });
      });
    });
  });
});
