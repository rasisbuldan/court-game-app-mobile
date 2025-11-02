/**
 * Subscription Hook - Manages subscription status and feature access
 *
 * Handles:
 * - Subscription tier checking (free, personal, club)
 * - Trial period logic (2 weeks for new users)
 * - Feature access control (courts, sessions, reclub, clubs)
 * - Usage tracking (session count for free tier)
 */

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../config/supabase';
import { useAuth } from './useAuth';
import { differenceInDays, isAfter } from 'date-fns';
import { checkSimulatorOverrides } from '../utils/accountSimulator';

// ============================================================================
// Types
// ============================================================================

export type SubscriptionTier = 'free' | 'personal' | 'club';

export interface SubscriptionStatus {
  tier: SubscriptionTier;
  isTrialActive: boolean;
  trialDaysRemaining: number;
  // Free tier usage
  sessionsUsedThisMonth: number;
  sessionsRemainingThisMonth: number;
}

export interface FeatureAccess {
  // Court limits
  maxCourts: number; // -1 = unlimited
  canSelectMultipleCourts: boolean;

  // Session limits
  maxSessionsPerMonth: number; // -1 = unlimited
  canCreateSession: boolean;

  // Feature toggles
  canImportFromReclub: boolean;
  canCreateMultipleClubs: boolean;
  maxClubs: number; // -1 = unlimited

  // Display
  currentTier: SubscriptionTier;
  isTrialActive: boolean;
}

interface ProfileData {
  current_tier: string;
  trial_end_date: string | null;
  session_count_monthly: number;
  last_session_count_reset: string;
}

// ============================================================================
// Constants
// ============================================================================

const FREE_TIER_LIMITS = {
  maxSessionsPerMonth: 4,
  maxCourts: 1,
  maxClubs: 1,
  reclubImport: false,
};

const PAID_TIER_LIMITS = {
  maxSessionsPerMonth: -1, // unlimited
  maxCourts: -1, // unlimited
  maxClubs: -1, // unlimited
  reclubImport: true,
};

// ============================================================================
// Main Hook
// ============================================================================

export function useSubscription() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user's subscription status
  const {
    data: subscriptionStatus,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      // Check for simulator overrides (dev/test accounts only)
      const simulatorState = await checkSimulatorOverrides(user.email);
      if (simulatorState?.enabled) {
        console.log('[useSubscription] Using simulator overrides:', simulatorState);
        // Return simulated subscription status
        return {
          tier: simulatorState.subscription.tier,
          isTrialActive: simulatorState.subscription.isTrialActive,
          trialDaysRemaining: simulatorState.subscription.trialDaysRemaining,
          sessionsUsedThisMonth: simulatorState.subscription.sessionsUsedThisMonth,
          sessionsRemainingThisMonth: Math.max(
            0,
            FREE_TIER_LIMITS.maxSessionsPerMonth - simulatorState.subscription.sessionsUsedThisMonth
          ),
        } as SubscriptionStatus;
      }

      // Normal flow: fetch from database
      const { data, error } = await supabase
        .from('profiles')
        .select('current_tier, trial_end_date, session_count_monthly, last_session_count_reset')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      return calculateSubscriptionStatus(data);
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Calculate feature access based on subscription
  const featureAccess: FeatureAccess | null = subscriptionStatus
    ? calculateFeatureAccess(subscriptionStatus)
    : null;

  // Increment session count (call when user creates a session)
  const incrementSessionCount = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase.rpc('increment_session_count', {
        user_id: user.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription', user?.id] });
    },
  });

  return {
    subscriptionStatus,
    featureAccess,
    isLoading,
    error,
    refetch,
    incrementSessionCount: incrementSessionCount.mutate,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate subscription status from profile data
 */
function calculateSubscriptionStatus(profile: ProfileData): SubscriptionStatus {
  const tier = profile.current_tier as SubscriptionTier;
  const trialEndDate = profile.trial_end_date ? new Date(profile.trial_end_date) : null;
  const now = new Date();

  // Check if trial is active
  const isTrialActive = trialEndDate ? isAfter(trialEndDate, now) : false;
  const trialDaysRemaining = trialEndDate
    ? Math.max(0, differenceInDays(trialEndDate, now))
    : 0;

  // Calculate session usage for free tier
  const sessionsUsedThisMonth = profile.session_count_monthly || 0;
  const sessionsRemainingThisMonth = Math.max(
    0,
    FREE_TIER_LIMITS.maxSessionsPerMonth - sessionsUsedThisMonth
  );

  return {
    tier,
    isTrialActive,
    trialDaysRemaining,
    sessionsUsedThisMonth,
    sessionsRemainingThisMonth,
  };
}

/**
 * Calculate feature access based on subscription status
 */
function calculateFeatureAccess(status: SubscriptionStatus): FeatureAccess {
  // During trial, user has full access (like personal tier)
  if (status.isTrialActive) {
    return {
      maxCourts: PAID_TIER_LIMITS.maxCourts,
      canSelectMultipleCourts: true,
      maxSessionsPerMonth: PAID_TIER_LIMITS.maxSessionsPerMonth,
      canCreateSession: true,
      canImportFromReclub: PAID_TIER_LIMITS.reclubImport,
      canCreateMultipleClubs: true,
      maxClubs: PAID_TIER_LIMITS.maxClubs,
      currentTier: status.tier,
      isTrialActive: true,
    };
  }

  // Paid tiers (personal or club) have full access
  if (status.tier === 'personal' || status.tier === 'club') {
    return {
      maxCourts: PAID_TIER_LIMITS.maxCourts,
      canSelectMultipleCourts: true,
      maxSessionsPerMonth: PAID_TIER_LIMITS.maxSessionsPerMonth,
      canCreateSession: true,
      canImportFromReclub: PAID_TIER_LIMITS.reclubImport,
      canCreateMultipleClubs: true,
      maxClubs: PAID_TIER_LIMITS.maxClubs,
      currentTier: status.tier,
      isTrialActive: false,
    };
  }

  // Free tier has restrictions
  return {
    maxCourts: FREE_TIER_LIMITS.maxCourts,
    canSelectMultipleCourts: false,
    maxSessionsPerMonth: FREE_TIER_LIMITS.maxSessionsPerMonth,
    canCreateSession: status.sessionsRemainingThisMonth > 0,
    canImportFromReclub: FREE_TIER_LIMITS.reclubImport,
    canCreateMultipleClubs: false,
    maxClubs: FREE_TIER_LIMITS.maxClubs,
    currentTier: status.tier,
    isTrialActive: false,
  };
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Check if user can create a session
 */
export function useCanCreateSession() {
  const { featureAccess } = useSubscription();
  return featureAccess?.canCreateSession ?? false;
}

/**
 * Check if user can select multiple courts
 */
export function useCanSelectMultipleCourts() {
  const { featureAccess } = useSubscription();
  return featureAccess?.canSelectMultipleCourts ?? false;
}

/**
 * Get max courts allowed
 */
export function useMaxCourts() {
  const { featureAccess } = useSubscription();
  return featureAccess?.maxCourts ?? 1;
}

/**
 * Check if user can import from Reclub
 */
export function useCanImportFromReclub() {
  const { featureAccess } = useSubscription();
  return featureAccess?.canImportFromReclub ?? false;
}

/**
 * Check if user can create multiple clubs
 */
export function useCanCreateMultipleClubs() {
  const { featureAccess } = useSubscription();
  return featureAccess?.canCreateMultipleClubs ?? false;
}
