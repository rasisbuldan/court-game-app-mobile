/**
 * Account Simulator - Developer Testing Utility
 *
 * Allows test accounts to simulate different subscription tiers, trial states,
 * and club roles without modifying the database.
 *
 * SECURITY: Only works for whitelisted test accounts
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Logger } from './logger';

// ============================================================================
// Types
// ============================================================================

export type SimulatorSubscriptionTier = 'free' | 'personal' | 'club';
export type SimulatorClubRole = 'owner' | 'admin' | 'member' | null;
export type SimulatorClubStatus = 'active' | 'pending' | 'removed';
export type SimulatorPaymentStatus =
  | 'active'           // Normal active subscription
  | 'expired'          // Subscription expired
  | 'expiring_soon'    // Expires within 7 days
  | 'cancelled'        // User cancelled, but still has access until period end
  | 'billing_issue'    // Payment failed
  | 'grace_period';    // In grace period after payment failure

export interface SimulatorSubscriptionState {
  tier: SimulatorSubscriptionTier;
  isTrialActive: boolean;
  trialDaysRemaining: number;
  sessionsUsedThisMonth: number;
  // RevenueCat payment simulation
  paymentStatus: SimulatorPaymentStatus;
  subscriptionExpiresAt: string | null; // ISO date string
  willRenew: boolean;
  billingIssueDetectedAt: string | null; // ISO date string
}

export interface SimulatorClubRoleState {
  clubId: string | null;
  role: SimulatorClubRole;
  status: SimulatorClubStatus;
}

export interface SimulatorState {
  enabled: boolean;
  subscription: SimulatorSubscriptionState;
  clubRole: SimulatorClubRoleState;
}

export type SimulatorPreset =
  | 'new_free_user'
  | 'free_limit_reached'
  | 'personal_trial_ending'
  | 'personal_active'
  | 'personal_expiring_soon'
  | 'personal_expired'
  | 'personal_cancelled'
  | 'personal_billing_issue'
  | 'club_owner'
  | 'club_member';

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = '@courtster_account_simulator';

// Whitelisted test accounts
const ALLOWED_EMAILS = ['test@courtster.app', 'test2@courtster.app'];

// Default state (simulator disabled)
const DEFAULT_STATE: SimulatorState = {
  enabled: false,
  subscription: {
    tier: 'free',
    isTrialActive: false,
    trialDaysRemaining: 0,
    sessionsUsedThisMonth: 0,
    paymentStatus: 'active',
    subscriptionExpiresAt: null,
    willRenew: true,
    billingIssueDetectedAt: null,
  },
  clubRole: {
    clubId: null,
    role: null,
    status: 'active',
  },
};

// Preset configurations
const PRESETS: Record<SimulatorPreset, Partial<SimulatorState>> = {
  new_free_user: {
    subscription: {
      tier: 'free',
      isTrialActive: true,
      trialDaysRemaining: 14,
      sessionsUsedThisMonth: 0,
      paymentStatus: 'active',
      subscriptionExpiresAt: null,
      willRenew: true,
      billingIssueDetectedAt: null,
    },
    clubRole: {
      clubId: null,
      role: null,
      status: 'active',
    },
  },
  free_limit_reached: {
    subscription: {
      tier: 'free',
      isTrialActive: false,
      trialDaysRemaining: 0,
      sessionsUsedThisMonth: 4,
      paymentStatus: 'active',
      subscriptionExpiresAt: null,
      willRenew: true,
      billingIssueDetectedAt: null,
    },
    clubRole: {
      clubId: null,
      role: null,
      status: 'active',
    },
  },
  personal_trial_ending: {
    subscription: {
      tier: 'personal',
      isTrialActive: true,
      trialDaysRemaining: 2,
      sessionsUsedThisMonth: 0,
      paymentStatus: 'active',
      subscriptionExpiresAt: getDateDaysFromNow(2),
      willRenew: true,
      billingIssueDetectedAt: null,
    },
    clubRole: {
      clubId: null,
      role: null,
      status: 'active',
    },
  },
  personal_active: {
    subscription: {
      tier: 'personal',
      isTrialActive: false,
      trialDaysRemaining: 0,
      sessionsUsedThisMonth: 0,
      paymentStatus: 'active',
      subscriptionExpiresAt: getDateDaysFromNow(25), // Next billing in 25 days
      willRenew: true,
      billingIssueDetectedAt: null,
    },
    clubRole: {
      clubId: null,
      role: null,
      status: 'active',
    },
  },
  personal_expiring_soon: {
    subscription: {
      tier: 'personal',
      isTrialActive: false,
      trialDaysRemaining: 0,
      sessionsUsedThisMonth: 2,
      paymentStatus: 'expiring_soon',
      subscriptionExpiresAt: getDateDaysFromNow(5), // Expires in 5 days
      willRenew: true,
      billingIssueDetectedAt: null,
    },
    clubRole: {
      clubId: null,
      role: null,
      status: 'active',
    },
  },
  personal_expired: {
    subscription: {
      tier: 'free', // Reverted to free
      isTrialActive: false,
      trialDaysRemaining: 0,
      sessionsUsedThisMonth: 1,
      paymentStatus: 'expired',
      subscriptionExpiresAt: getDateDaysFromNow(-3), // Expired 3 days ago
      willRenew: false,
      billingIssueDetectedAt: null,
    },
    clubRole: {
      clubId: null,
      role: null,
      status: 'active',
    },
  },
  personal_cancelled: {
    subscription: {
      tier: 'personal', // Still has access until period ends
      isTrialActive: false,
      trialDaysRemaining: 0,
      sessionsUsedThisMonth: 3,
      paymentStatus: 'cancelled',
      subscriptionExpiresAt: getDateDaysFromNow(12), // 12 days of access left
      willRenew: false, // User cancelled auto-renewal
      billingIssueDetectedAt: null,
    },
    clubRole: {
      clubId: null,
      role: null,
      status: 'active',
    },
  },
  personal_billing_issue: {
    subscription: {
      tier: 'personal', // Still has access (grace period)
      isTrialActive: false,
      trialDaysRemaining: 0,
      sessionsUsedThisMonth: 2,
      paymentStatus: 'billing_issue',
      subscriptionExpiresAt: getDateDaysFromNow(3), // 3 days in grace period
      willRenew: true,
      billingIssueDetectedAt: getDateDaysFromNow(-2), // Issue detected 2 days ago
    },
    clubRole: {
      clubId: null,
      role: null,
      status: 'active',
    },
  },
  club_owner: {
    subscription: {
      tier: 'club',
      isTrialActive: false,
      trialDaysRemaining: 0,
      sessionsUsedThisMonth: 0,
      paymentStatus: 'active',
      subscriptionExpiresAt: getDateDaysFromNow(20),
      willRenew: true,
      billingIssueDetectedAt: null,
    },
    clubRole: {
      clubId: 'simulated-club-id',
      role: 'owner',
      status: 'active',
    },
  },
  club_member: {
    subscription: {
      tier: 'personal',
      isTrialActive: false,
      trialDaysRemaining: 0,
      sessionsUsedThisMonth: 0,
      paymentStatus: 'active',
      subscriptionExpiresAt: getDateDaysFromNow(15),
      willRenew: true,
      billingIssueDetectedAt: null,
    },
    clubRole: {
      clubId: 'simulated-club-id',
      role: 'member',
      status: 'active',
    },
  },
};

// ============================================================================
// Helper Functions (Internal)
// ============================================================================

/**
 * Get ISO date string for a date N days from now
 */
function getDateDaysFromNow(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Check if email is allowed to use simulator
 */
export function isSimulatorAllowed(email: string | undefined): boolean {
  if (!email) return false;
  return ALLOWED_EMAILS.includes(email.toLowerCase());
}

/**
 * Load simulator state from AsyncStorage
 */
export async function loadSimulatorState(): Promise<SimulatorState> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return DEFAULT_STATE;
    }

    const parsed = JSON.parse(stored);
    // Merge with defaults to handle any missing fields
    return {
      ...DEFAULT_STATE,
      ...parsed,
      subscription: {
        ...DEFAULT_STATE.subscription,
        ...parsed.subscription,
      },
      clubRole: {
        ...DEFAULT_STATE.clubRole,
        ...parsed.clubRole,
      },
    };
  } catch (error) {
    Logger.error('Account simulator failed to load state', error as Error, { action: 'loadSimulatorState' });
    return DEFAULT_STATE;
  }
}

/**
 * Save simulator state to AsyncStorage
 */
export async function saveSimulatorState(state: SimulatorState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    Logger.error('Account simulator failed to save state', error as Error, { action: 'saveSimulatorState' });
    throw error;
  }
}

/**
 * Clear simulator state and reset to defaults
 */
export async function clearSimulatorState(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    Logger.error('Account simulator failed to clear state', error as Error, { action: 'clearSimulatorState' });
    throw error;
  }
}

/**
 * Apply a preset configuration
 */
export async function applyPreset(preset: SimulatorPreset): Promise<SimulatorState> {
  const presetConfig = PRESETS[preset];
  const currentState = await loadSimulatorState();

  const newState: SimulatorState = {
    enabled: true,
    subscription: {
      ...currentState.subscription,
      ...presetConfig.subscription,
    },
    clubRole: {
      ...currentState.clubRole,
      ...presetConfig.clubRole,
    },
  };

  await saveSimulatorState(newState);
  return newState;
}

/**
 * Update subscription state
 */
export async function updateSubscriptionState(
  updates: Partial<SimulatorSubscriptionState>
): Promise<SimulatorState> {
  const currentState = await loadSimulatorState();
  const newState: SimulatorState = {
    ...currentState,
    subscription: {
      ...currentState.subscription,
      ...updates,
    },
  };

  await saveSimulatorState(newState);
  return newState;
}

/**
 * Update club role state
 */
export async function updateClubRoleState(
  updates: Partial<SimulatorClubRoleState>
): Promise<SimulatorState> {
  const currentState = await loadSimulatorState();
  const newState: SimulatorState = {
    ...currentState,
    clubRole: {
      ...currentState.clubRole,
      ...updates,
    },
  };

  await saveSimulatorState(newState);
  return newState;
}

/**
 * Toggle simulator on/off
 */
export async function toggleSimulator(enabled: boolean): Promise<SimulatorState> {
  const currentState = await loadSimulatorState();
  const newState: SimulatorState = {
    ...currentState,
    enabled,
  };

  await saveSimulatorState(newState);
  return newState;
}

/**
 * Check if simulator is active for a given email
 * Returns simulator state if active, null otherwise
 */
export async function checkSimulatorOverrides(
  email: string | undefined
): Promise<SimulatorState | null> {
  // Only allow for test accounts
  if (!isSimulatorAllowed(email)) {
    return null;
  }

  const state = await loadSimulatorState();

  // Return state only if simulator is enabled
  if (!state.enabled) {
    return null;
  }

  return state;
}

// ============================================================================
// Helper Functions for UI
// ============================================================================

/**
 * Get human-readable label for preset
 */
export function getPresetLabel(preset: SimulatorPreset): string {
  const labels: Record<SimulatorPreset, string> = {
    new_free_user: 'New Free User',
    free_limit_reached: 'Free Limit Reached',
    personal_trial_ending: 'Personal Trial Ending',
    personal_active: 'Personal Active',
    personal_expiring_soon: 'Personal Expiring Soon',
    personal_expired: 'Personal Expired',
    personal_cancelled: 'Personal Cancelled',
    personal_billing_issue: 'Personal Billing Issue',
    club_owner: 'Club Owner',
    club_member: 'Club Member',
  };
  return labels[preset];
}

/**
 * Get description for preset
 */
export function getPresetDescription(preset: SimulatorPreset): string {
  const descriptions: Record<SimulatorPreset, string> = {
    new_free_user: 'Free tier with 14-day trial, 0 sessions used',
    free_limit_reached: 'Free tier, no trial, 4/4 sessions used',
    personal_trial_ending: 'Personal tier with 2 days of trial left',
    personal_active: 'Personal tier, active subscription, renews in 25 days',
    personal_expiring_soon: 'Personal tier, expires in 5 days, will auto-renew',
    personal_expired: 'Subscription expired 3 days ago, reverted to free tier',
    personal_cancelled: 'User cancelled, 12 days of access remaining',
    personal_billing_issue: 'Payment failed 2 days ago, 3 days grace period left',
    club_owner: 'Club tier, owner role in simulated club',
    club_member: 'Personal tier, member role in simulated club',
  };
  return descriptions[preset];
}

/**
 * Get all available presets
 */
export function getAvailablePresets(): SimulatorPreset[] {
  return Object.keys(PRESETS) as SimulatorPreset[];
}
