/**
 * useSubscription Hook Tests
 *
 * Comprehensive unit tests for subscription management hook covering:
 * - Fetching subscription status for authenticated user
 * - Default free tier behavior
 * - Premium tier feature access (personal, club)
 * - Trial period logic and expiration
 * - Feature availability checks
 * - Session count tracking for free tier
 * - Loading and error states
 * - Query caching and invalidation
 * - RevenueCat integration (purchase, restore)
 * - Offering management
 * - Simulator overrides
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useSubscription,
  useCanCreateSession,
  useCanSelectMultipleCourts,
  useMaxCourts,
  useCanImportFromReclub,
  useCanCreateMultipleClubs,
  type SubscriptionStatus,
  type FeatureAccess,
} from '../useSubscription';
import { supabase } from '../../config/supabase';
import { useAuth } from '../useAuth';
import * as RevenueCat from '../../services/revenueCat';
import * as AccountSimulator from '../../utils/accountSimulator';
import { Logger } from '../../utils/logger';

// Mock dependencies
jest.mock('../../config/supabase');
jest.mock('../useAuth');
jest.mock('../../services/revenueCat');
jest.mock('../../utils/accountSimulator');
jest.mock('../../utils/logger', () => ({
  Logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('useSubscription Hook', () => {
  const mockUserId = 'user-123';
  const mockEmail = 'test@example.com';

  const mockUser = {
    id: mockUserId,
    email: mockEmail,
    created_at: new Date().toISOString(),
  };

  const mockProfileFree: any = {
    current_tier: 'free',
    trial_end_date: null,
    session_count_monthly: 0,
    last_session_count_reset: new Date().toISOString(),
  };

  const mockProfilePersonal: any = {
    current_tier: 'personal',
    trial_end_date: null,
    session_count_monthly: 5,
    last_session_count_reset: new Date().toISOString(),
  };

  const mockProfileClub: any = {
    current_tier: 'club',
    trial_end_date: null,
    session_count_monthly: 10,
    last_session_count_reset: new Date().toISOString(),
  };

  // Helper to get future date
  const getFutureDate = (daysFromNow: number): string => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString();
  };

  // Helper to get past date
  const getPastDate = (daysAgo: number): string => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString();
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

    // Mock useAuth to return authenticated user by default
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      session: { access_token: 'mock-token' },
      loading: false,
    });

    // Mock RevenueCat methods
    (RevenueCat.isRevenueCatInitialized as jest.Mock).mockReturnValue(false);
    (RevenueCat.initializeRevenueCat as jest.Mock).mockResolvedValue(undefined);
    (RevenueCat.getOfferings as jest.Mock).mockResolvedValue([]);

    // Mock simulator to be disabled by default
    (AccountSimulator.checkSimulatorOverrides as jest.Mock).mockResolvedValue(null);
  });

  afterEach(() => {
    queryClient.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('Subscription Status Queries', () => {
    it('should fetch subscription status for authenticated user', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProfileFree,
              error: null,
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useSubscription(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.subscriptionStatus).toBeDefined();
      expect(result.current.subscriptionStatus?.tier).toBe('free');
      expect(supabase.from).toHaveBeenCalledWith('profiles');
    });

    it('should return free tier by default', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProfileFree,
              error: null,
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useSubscription(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.subscriptionStatus).toMatchObject({
        tier: 'free',
        isTrialActive: false,
        trialDaysRemaining: 0,
        sessionsUsedThisMonth: 0,
        sessionsRemainingThisMonth: 4,
      });
    });

    it('should return personal tier with correct features', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProfilePersonal,
              error: null,
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useSubscription(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.subscriptionStatus?.tier).toBe('personal');
      expect(result.current.featureAccess).toMatchObject({
        currentTier: 'personal',
        maxCourts: -1, // unlimited
        maxSessionsPerMonth: -1, // unlimited
        maxClubs: -1, // unlimited
        canSelectMultipleCourts: true,
        canCreateSession: true,
        canImportFromReclub: true,
        canCreateMultipleClubs: true,
        isTrialActive: false,
      });
    });

    it('should return club tier with correct features', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProfileClub,
              error: null,
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useSubscription(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.subscriptionStatus?.tier).toBe('club');
      expect(result.current.featureAccess).toMatchObject({
        currentTier: 'club',
        maxCourts: -1,
        maxSessionsPerMonth: -1,
        maxClubs: -1,
        canSelectMultipleCourts: true,
        canCreateSession: true,
        canImportFromReclub: true,
        canCreateMultipleClubs: true,
      });
    });

    it('should handle loading states', () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockImplementation(() => {
              // Never resolves - keeps loading
              return new Promise(() => {});
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useSubscription(), { wrapper });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.subscriptionStatus).toBeUndefined();
      expect(result.current.featureAccess).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Database error');

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

      const { result } = renderHook(() => useSubscription(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.subscriptionStatus).toBeUndefined();
    });

    it('should not fetch when user is not authenticated', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        session: null,
        loading: false,
      });

      const { result } = renderHook(() => useSubscription(), { wrapper });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.subscriptionStatus).toBeUndefined();
      expect(supabase.from).not.toHaveBeenCalled();
    });
  });

  describe('Trial Period Logic', () => {
    it('should handle active trial period', async () => {
      const profileWithTrial = {
        ...mockProfileFree,
        trial_end_date: getFutureDate(10), // Trial ends in 10 days
      };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: profileWithTrial,
              error: null,
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useSubscription(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.subscriptionStatus).toMatchObject({
        tier: 'free',
        isTrialActive: true,
        trialDaysRemaining: 10,
      });

      // During trial, user should have full access
      expect(result.current.featureAccess).toMatchObject({
        maxCourts: -1,
        maxSessionsPerMonth: -1,
        canSelectMultipleCourts: true,
        canCreateSession: true,
        canImportFromReclub: true,
        canCreateMultipleClubs: true,
        isTrialActive: true,
      });
    });

    it('should handle trial ending soon (2 days)', async () => {
      const profileWithTrial = {
        ...mockProfileFree,
        trial_end_date: getFutureDate(2), // Trial ends in 2 days
      };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: profileWithTrial,
              error: null,
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useSubscription(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.subscriptionStatus).toMatchObject({
        isTrialActive: true,
        trialDaysRemaining: 2,
      });
    });

    it('should handle expired trial', async () => {
      const profileWithExpiredTrial = {
        ...mockProfileFree,
        trial_end_date: getPastDate(1), // Trial expired 1 day ago
      };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: profileWithExpiredTrial,
              error: null,
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useSubscription(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.subscriptionStatus).toMatchObject({
        tier: 'free',
        isTrialActive: false,
        trialDaysRemaining: 0,
      });

      // After trial expires, revert to free tier limits
      expect(result.current.featureAccess).toMatchObject({
        maxCourts: 1,
        maxSessionsPerMonth: 4,
        canSelectMultipleCourts: false,
        canImportFromReclub: false,
        canCreateMultipleClubs: false,
        isTrialActive: false,
      });
    });

    it('should handle trial on last day', async () => {
      const profileWithTrial = {
        ...mockProfileFree,
        trial_end_date: getFutureDate(0), // Trial ends today (but still active)
      };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: profileWithTrial,
              error: null,
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useSubscription(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.subscriptionStatus).toMatchObject({
        isTrialActive: true,
        trialDaysRemaining: 0,
      });
    });
  });

  describe('Free Tier Session Limits', () => {
    it('should track sessions used and remaining for free tier', async () => {
      const profileWithSessions = {
        ...mockProfileFree,
        session_count_monthly: 2,
      };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: profileWithSessions,
              error: null,
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useSubscription(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.subscriptionStatus).toMatchObject({
        sessionsUsedThisMonth: 2,
        sessionsRemainingThisMonth: 2, // 4 - 2 = 2
      });

      expect(result.current.featureAccess?.canCreateSession).toBe(true); // Still has 2 left
    });

    it('should block session creation when limit reached', async () => {
      const profileWithMaxSessions = {
        ...mockProfileFree,
        session_count_monthly: 4, // Max for free tier
      };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: profileWithMaxSessions,
              error: null,
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useSubscription(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.subscriptionStatus).toMatchObject({
        sessionsUsedThisMonth: 4,
        sessionsRemainingThisMonth: 0,
      });

      expect(result.current.featureAccess?.canCreateSession).toBe(false);
    });

    it('should handle session count exceeding limit gracefully', async () => {
      const profileOverLimit = {
        ...mockProfileFree,
        session_count_monthly: 6, // Over the limit
      };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: profileOverLimit,
              error: null,
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useSubscription(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.subscriptionStatus?.sessionsRemainingThisMonth).toBe(0); // Never negative
      expect(result.current.featureAccess?.canCreateSession).toBe(false);
    });

    it('should not limit paid tier sessions', async () => {
      const paidProfileWithManySessions = {
        ...mockProfilePersonal,
        session_count_monthly: 100,
      };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: paidProfileWithManySessions,
              error: null,
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useSubscription(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.subscriptionStatus?.sessionsUsedThisMonth).toBe(100);
      expect(result.current.featureAccess?.canCreateSession).toBe(true); // No limit
    });
  });

  describe('Feature Access Checks', () => {
    it('should check court limits for free tier', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProfileFree,
              error: null,
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useSubscription(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.featureAccess).toMatchObject({
        maxCourts: 1,
        canSelectMultipleCourts: false,
      });
    });

    it('should check reclub import permission', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProfileFree,
              error: null,
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useSubscription(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.featureAccess?.canImportFromReclub).toBe(false);
    });

    it('should check club creation limits', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProfileFree,
              error: null,
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useSubscription(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.featureAccess).toMatchObject({
        maxClubs: 1,
        canCreateMultipleClubs: false,
      });
    });
  });

  describe('Session Count Increment', () => {
    it('should increment session count', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProfileFree,
              error: null,
            }),
          }),
        }),
      });

      (supabase.rpc as jest.Mock).mockResolvedValue({
        error: null,
      });

      const { result } = renderHook(() => useSubscription(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        result.current.incrementSessionCount();
      });

      await waitFor(() => {
        expect(supabase.rpc).toHaveBeenCalledWith('increment_session_count', {
          user_id: mockUserId,
        });
      });
    });

    it('should invalidate subscription query after increment', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProfileFree,
              error: null,
            }),
          }),
        }),
      });

      (supabase.rpc as jest.Mock).mockResolvedValue({
        error: null,
      });

      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useSubscription(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        result.current.incrementSessionCount();
      });

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['subscription', mockUserId] });
      });
    });

    it('should handle increment errors', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProfileFree,
              error: null,
            }),
          }),
        }),
      });

      const error = new Error('RPC failed');
      (supabase.rpc as jest.Mock).mockResolvedValue({
        error,
      });

      const { result } = renderHook(() => useSubscription(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          result.current.incrementSessionCount();
        })
      ).rejects.toThrow();
    });
  });

  describe('Query Caching', () => {
    it('should cache subscription data', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProfileFree,
              error: null,
            }),
          }),
        }),
      });

      const { result, rerender } = renderHook(() => useSubscription(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // First call
      expect(supabase.from).toHaveBeenCalledTimes(1);

      // Rerender - should use cache
      rerender();

      // Should not make another call (cache hit)
      expect(supabase.from).toHaveBeenCalledTimes(1);
    });

    it('should refetch subscription data on demand', async () => {
      let callCount = 0;
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockImplementation(() => {
              callCount++;
              return Promise.resolve({
                data: mockProfileFree,
                error: null,
              });
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useSubscription(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(callCount).toBe(1);

      // Manual refetch
      await act(async () => {
        await result.current.refetch();
      });

      expect(callCount).toBe(2);
    });
  });

  describe('RevenueCat Integration', () => {
    it('should initialize RevenueCat when user is authenticated', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProfileFree,
              error: null,
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useSubscription(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await waitFor(() => {
        expect(RevenueCat.initializeRevenueCat).toHaveBeenCalledWith(mockUserId);
      });
    });

    it('should fetch offerings when RevenueCat is ready', async () => {
      (RevenueCat.isRevenueCatInitialized as jest.Mock).mockReturnValue(true);

      const mockOfferings = [
        {
          identifier: 'default',
          availablePackages: [
            { identifier: 'monthly', product: { identifier: 'monthly_plan' } },
          ],
        },
      ];

      (RevenueCat.getOfferings as jest.Mock).mockResolvedValue(mockOfferings);

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProfileFree,
              error: null,
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useSubscription(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await waitFor(() => {
        expect(result.current.offerings).toEqual(mockOfferings);
      });
    });

    it('should handle purchase package flow', async () => {
      const mockPackage = {
        identifier: 'monthly',
        product: { identifier: 'monthly_plan' },
      } as any;

      const mockCustomerInfo = {
        entitlements: {
          active: { personal: {} },
        },
      } as any;

      (RevenueCat.purchasePackage as jest.Mock).mockResolvedValue({
        customerInfo: mockCustomerInfo,
        userCancelled: false,
      });

      (RevenueCat.getSubscriptionTierFromCustomerInfo as jest.Mock).mockReturnValue('personal');

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProfileFree,
              error: null,
            }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      });

      const { result } = renderHook(() => useSubscription(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        result.current.purchasePackage(mockPackage);
      });

      await waitFor(() => {
        expect(RevenueCat.purchasePackage).toHaveBeenCalledWith(mockPackage);
      });
    });

    it('should handle user cancelled purchase', async () => {
      const mockPackage = {
        identifier: 'monthly',
        product: { identifier: 'monthly_plan' },
      } as any;

      const mockCustomerInfo = {
        entitlements: { active: {} },
      } as any;

      (RevenueCat.purchasePackage as jest.Mock).mockResolvedValue({
        customerInfo: mockCustomerInfo,
        userCancelled: true,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProfileFree,
              error: null,
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useSubscription(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          result.current.purchasePackage(mockPackage);
        })
      ).rejects.toThrow('User cancelled purchase');
    });

    it('should handle restore purchases flow', async () => {
      const mockCustomerInfo = {
        entitlements: {
          active: { personal: {} },
        },
      } as any;

      (RevenueCat.restorePurchases as jest.Mock).mockResolvedValue(mockCustomerInfo);
      (RevenueCat.getSubscriptionTierFromCustomerInfo as jest.Mock).mockReturnValue('personal');

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProfileFree,
              error: null,
            }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      });

      const { result } = renderHook(() => useSubscription(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        result.current.restorePurchases();
      });

      await waitFor(() => {
        expect(RevenueCat.restorePurchases).toHaveBeenCalled();
      });
    });

    it('should invalidate queries after successful purchase', async () => {
      const mockPackage = {
        identifier: 'monthly',
        product: { identifier: 'monthly_plan' },
      } as any;

      const mockCustomerInfo = {
        entitlements: {
          active: { personal: {} },
        },
      } as any;

      (RevenueCat.purchasePackage as jest.Mock).mockResolvedValue({
        customerInfo: mockCustomerInfo,
        userCancelled: false,
      });

      (RevenueCat.getSubscriptionTierFromCustomerInfo as jest.Mock).mockReturnValue('personal');

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProfileFree,
              error: null,
            }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      });

      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useSubscription(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        result.current.purchasePackage(mockPackage);
      });

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['subscription', mockUserId] });
      });
    });
  });

  describe('Simulator Overrides', () => {
    it('should use simulator state when enabled for test accounts', async () => {
      const simulatorState = {
        enabled: true,
        subscription: {
          tier: 'personal',
          isTrialActive: false,
          trialDaysRemaining: 0,
          sessionsUsedThisMonth: 2,
        },
        clubRole: {
          clubId: null,
          role: null,
          status: 'active',
        },
      };

      (AccountSimulator.checkSimulatorOverrides as jest.Mock).mockResolvedValue(simulatorState);

      const { result } = renderHook(() => useSubscription(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.subscriptionStatus?.tier).toBe('personal');
      expect(result.current.subscriptionStatus?.sessionsUsedThisMonth).toBe(2);

      // Should not call Supabase when simulator is active
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('should ignore simulator when disabled', async () => {
      (AccountSimulator.checkSimulatorOverrides as jest.Mock).mockResolvedValue(null);

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProfileFree,
              error: null,
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useSubscription(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(supabase.from).toHaveBeenCalled();
    });
  });

  describe('Utility Hooks', () => {
    it('useCanCreateSession should return correct value', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProfileFree,
              error: null,
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useCanCreateSession(), { wrapper });

      await waitFor(() => {
        expect(result.current).toBe(true);
      });
    });

    it('useCanSelectMultipleCourts should return correct value', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProfileFree,
              error: null,
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useCanSelectMultipleCourts(), { wrapper });

      await waitFor(() => {
        expect(result.current).toBe(false); // Free tier cannot
      });
    });

    it('useMaxCourts should return correct value', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProfileFree,
              error: null,
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useMaxCourts(), { wrapper });

      await waitFor(() => {
        expect(result.current).toBe(1); // Free tier limit
      });
    });

    it('useCanImportFromReclub should return correct value', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProfileFree,
              error: null,
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useCanImportFromReclub(), { wrapper });

      await waitFor(() => {
        expect(result.current).toBe(false); // Free tier cannot
      });
    });

    it('useCanCreateMultipleClubs should return correct value', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProfileFree,
              error: null,
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useCanCreateMultipleClubs(), { wrapper });

      await waitFor(() => {
        expect(result.current).toBe(false); // Free tier cannot
      });
    });

    it('utility hooks should return false when loading', () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockImplementation(() => new Promise(() => {})),
          }),
        }),
      });

      const { result: canCreate } = renderHook(() => useCanCreateSession(), { wrapper });
      const { result: canMultipleCourts } = renderHook(() => useCanSelectMultipleCourts(), { wrapper });
      const { result: maxCourts } = renderHook(() => useMaxCourts(), { wrapper });
      const { result: canReclub } = renderHook(() => useCanImportFromReclub(), { wrapper });
      const { result: canMultipleClubs } = renderHook(() => useCanCreateMultipleClubs(), { wrapper });

      expect(canCreate.current).toBe(false);
      expect(canMultipleCourts.current).toBe(false);
      expect(maxCourts.current).toBe(1);
      expect(canReclub.current).toBe(false);
      expect(canMultipleClubs.current).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null trial_end_date', async () => {
      const profile = {
        ...mockProfileFree,
        trial_end_date: null,
      };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: profile,
              error: null,
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useSubscription(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.subscriptionStatus).toMatchObject({
        isTrialActive: false,
        trialDaysRemaining: 0,
      });
    });

    it('should handle null session_count_monthly', async () => {
      const profile = {
        current_tier: 'free',
        trial_end_date: null,
        session_count_monthly: null,
        last_session_count_reset: new Date().toISOString(),
      };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: profile,
              error: null,
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useSubscription(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.subscriptionStatus?.sessionsUsedThisMonth).toBe(0);
      expect(result.current.subscriptionStatus?.sessionsRemainingThisMonth).toBe(4);
    });

    it('should handle transition from personal to free tier', async () => {
      const expiredPersonalProfile = {
        current_tier: 'free', // Reverted after subscription ended
        trial_end_date: null,
        session_count_monthly: 2,
        last_session_count_reset: new Date().toISOString(),
      };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: expiredPersonalProfile,
              error: null,
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useSubscription(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.subscriptionStatus?.tier).toBe('free');
      expect(result.current.featureAccess?.maxCourts).toBe(1); // Back to free limits
    });
  });
});
