/**
 * Unit Tests: Account Simulator
 *
 * Tests for developer testing utility that simulates subscription states
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock Logger
jest.mock('../../../utils/logger', () => ({
  Logger: {
    error: jest.fn(),
  },
}));

describe('Account Simulator', () => {
  let accountSimulator: any;

  beforeEach(() => {
    // Clear AsyncStorage mock
    (AsyncStorage.setItem as jest.Mock).mockClear();
    (AsyncStorage.getItem as jest.Mock).mockClear();
    (AsyncStorage.removeItem as jest.Mock).mockClear();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

    // Clear module cache and re-import
    jest.resetModules();
    accountSimulator = require('../../../utils/accountSimulator');
  });

  describe('isSimulatorAllowed()', () => {
    it('should allow test@courtster.app', () => {
      const allowed = accountSimulator.isSimulatorAllowed('test@courtster.app');

      expect(allowed).toBe(true);
    });

    it('should allow test2@courtster.app', () => {
      const allowed = accountSimulator.isSimulatorAllowed('test2@courtster.app');

      expect(allowed).toBe(true);
    });

    it('should be case-insensitive', () => {
      const allowed = accountSimulator.isSimulatorAllowed('TEST@COURTSTER.APP');

      expect(allowed).toBe(true);
    });

    it('should reject non-whitelisted emails', () => {
      const allowed = accountSimulator.isSimulatorAllowed('user@example.com');

      expect(allowed).toBe(false);
    });

    it('should reject undefined email', () => {
      const allowed = accountSimulator.isSimulatorAllowed(undefined);

      expect(allowed).toBe(false);
    });

    it('should reject null email', () => {
      const allowed = accountSimulator.isSimulatorAllowed(null);

      expect(allowed).toBe(false);
    });

    it('should reject empty string', () => {
      const allowed = accountSimulator.isSimulatorAllowed('');

      expect(allowed).toBe(false);
    });
  });

  describe('loadSimulatorState()', () => {
    it('should return default state when no stored data', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const state = await accountSimulator.loadSimulatorState();

      expect(state.enabled).toBe(false);
      expect(state.subscription.tier).toBe('free');
      expect(state.clubRole.role).toBeNull();
    });

    it('should parse stored state', async () => {
      const storedState = {
        enabled: true,
        subscription: {
          tier: 'personal',
          isTrialActive: false,
        },
        clubRole: {
          clubId: 'club123',
          role: 'owner',
        },
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(storedState));

      const state = await accountSimulator.loadSimulatorState();

      expect(state.enabled).toBe(true);
      expect(state.subscription.tier).toBe('personal');
      expect(state.clubRole.role).toBe('owner');
    });

    it('should merge with defaults for missing fields', async () => {
      const partialState = {
        enabled: true,
        subscription: { tier: 'personal' },
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(partialState));

      const state = await accountSimulator.loadSimulatorState();

      expect(state.subscription).toHaveProperty('isTrialActive');
      expect(state.subscription).toHaveProperty('trialDaysRemaining');
      expect(state.clubRole).toHaveProperty('role');
    });

    it('should handle JSON parse errors', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('invalid-json');

      const state = await accountSimulator.loadSimulatorState();

      expect(state).toEqual(expect.objectContaining({ enabled: false }));
    });

    it('should handle AsyncStorage errors', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const state = await accountSimulator.loadSimulatorState();

      expect(state).toEqual(expect.objectContaining({ enabled: false }));
    });
  });

  describe('saveSimulatorState()', () => {
    it('should save state to AsyncStorage', async () => {
      const state = {
        enabled: true,
        subscription: {
          tier: 'personal' as const,
          isTrialActive: false,
          trialDaysRemaining: 0,
          sessionsUsedThisMonth: 0,
          paymentStatus: 'active' as const,
          subscriptionExpiresAt: null,
          willRenew: true,
          billingIssueDetectedAt: null,
        },
        clubRole: {
          clubId: null,
          role: null,
          status: 'active' as const,
        },
      };

      await accountSimulator.saveSimulatorState(state);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@courtster_account_simulator',
        JSON.stringify(state)
      );
    });

    it('should handle save errors', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Save error'));

      const state = {
        enabled: true,
        subscription: {} as any,
        clubRole: {} as any,
      };

      await expect(accountSimulator.saveSimulatorState(state)).rejects.toThrow('Save error');
    });
  });

  describe('clearSimulatorState()', () => {
    it('should remove state from AsyncStorage', async () => {
      await accountSimulator.clearSimulatorState();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@courtster_account_simulator');
    });

    it('should handle clear errors', async () => {
      (AsyncStorage.removeItem as jest.Mock).mockRejectedValue(new Error('Clear error'));

      await expect(accountSimulator.clearSimulatorState()).rejects.toThrow('Clear error');
    });
  });

  describe('applyPreset()', () => {
    it('should apply new_free_user preset', async () => {
      const state = await accountSimulator.applyPreset('new_free_user');

      expect(state.enabled).toBe(true);
      expect(state.subscription.tier).toBe('free');
      expect(state.subscription.isTrialActive).toBe(true);
      expect(state.subscription.trialDaysRemaining).toBe(14);
      expect(state.subscription.sessionsUsedThisMonth).toBe(0);
    });

    it('should apply free_limit_reached preset', async () => {
      const state = await accountSimulator.applyPreset('free_limit_reached');

      expect(state.subscription.tier).toBe('free');
      expect(state.subscription.isTrialActive).toBe(false);
      expect(state.subscription.sessionsUsedThisMonth).toBe(4);
    });

    it('should apply personal_trial_ending preset', async () => {
      const state = await accountSimulator.applyPreset('personal_trial_ending');

      expect(state.subscription.tier).toBe('personal');
      expect(state.subscription.isTrialActive).toBe(true);
      expect(state.subscription.trialDaysRemaining).toBe(2);
    });

    it('should apply personal_active preset', async () => {
      const state = await accountSimulator.applyPreset('personal_active');

      expect(state.subscription.tier).toBe('personal');
      expect(state.subscription.isTrialActive).toBe(false);
      expect(state.subscription.paymentStatus).toBe('active');
      expect(state.subscription.willRenew).toBe(true);
    });

    it('should apply personal_expiring_soon preset', async () => {
      const state = await accountSimulator.applyPreset('personal_expiring_soon');

      expect(state.subscription.tier).toBe('personal');
      expect(state.subscription.paymentStatus).toBe('expiring_soon');
    });

    it('should apply personal_expired preset', async () => {
      const state = await accountSimulator.applyPreset('personal_expired');

      expect(state.subscription.tier).toBe('free'); // Reverted to free
      expect(state.subscription.paymentStatus).toBe('expired');
      expect(state.subscription.willRenew).toBe(false);
    });

    it('should apply personal_cancelled preset', async () => {
      const state = await accountSimulator.applyPreset('personal_cancelled');

      expect(state.subscription.tier).toBe('personal'); // Still has access
      expect(state.subscription.paymentStatus).toBe('cancelled');
      expect(state.subscription.willRenew).toBe(false);
    });

    it('should apply personal_billing_issue preset', async () => {
      const state = await accountSimulator.applyPreset('personal_billing_issue');

      expect(state.subscription.tier).toBe('personal');
      expect(state.subscription.paymentStatus).toBe('billing_issue');
      expect(state.subscription.billingIssueDetectedAt).not.toBeNull();
    });

    it('should apply club_owner preset', async () => {
      const state = await accountSimulator.applyPreset('club_owner');

      expect(state.subscription.tier).toBe('club');
      expect(state.clubRole.role).toBe('owner');
      expect(state.clubRole.clubId).toBe('simulated-club-id');
    });

    it('should apply club_member preset', async () => {
      const state = await accountSimulator.applyPreset('club_member');

      expect(state.subscription.tier).toBe('personal');
      expect(state.clubRole.role).toBe('member');
      expect(state.clubRole.clubId).toBe('simulated-club-id');
    });

    it('should save state after applying preset', async () => {
      await accountSimulator.applyPreset('personal_active');

      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('updateSubscriptionState()', () => {
    it('should update subscription tier', async () => {
      const state = await accountSimulator.updateSubscriptionState({
        tier: 'club',
      });

      expect(state.subscription.tier).toBe('club');
    });

    it('should update trial status', async () => {
      const state = await accountSimulator.updateSubscriptionState({
        isTrialActive: true,
        trialDaysRemaining: 5,
      });

      expect(state.subscription.isTrialActive).toBe(true);
      expect(state.subscription.trialDaysRemaining).toBe(5);
    });

    it('should update payment status', async () => {
      const state = await accountSimulator.updateSubscriptionState({
        paymentStatus: 'billing_issue',
      });

      expect(state.subscription.paymentStatus).toBe('billing_issue');
    });

    it('should preserve other fields', async () => {
      // First set up some state
      await accountSimulator.applyPreset('personal_active');

      // Then update just one field
      const state = await accountSimulator.updateSubscriptionState({
        sessionsUsedThisMonth: 5,
      });

      expect(state.subscription.tier).toBe('personal'); // Preserved
      expect(state.subscription.sessionsUsedThisMonth).toBe(5); // Updated
    });

    it('should save state after update', async () => {
      (AsyncStorage.setItem as jest.Mock).mockClear();

      await accountSimulator.updateSubscriptionState({ tier: 'personal' });

      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('updateClubRoleState()', () => {
    it('should update club role', async () => {
      const state = await accountSimulator.updateClubRoleState({
        role: 'admin',
      });

      expect(state.clubRole.role).toBe('admin');
    });

    it('should update club ID', async () => {
      const state = await accountSimulator.updateClubRoleState({
        clubId: 'new-club-id',
      });

      expect(state.clubRole.clubId).toBe('new-club-id');
    });

    it('should update club status', async () => {
      const state = await accountSimulator.updateClubRoleState({
        status: 'pending',
      });

      expect(state.clubRole.status).toBe('pending');
    });

    it('should preserve other fields', async () => {
      await accountSimulator.applyPreset('club_owner');

      const state = await accountSimulator.updateClubRoleState({
        status: 'removed',
      });

      expect(state.clubRole.role).toBe('owner'); // Preserved
      expect(state.clubRole.status).toBe('removed'); // Updated
    });

    it('should save state after update', async () => {
      (AsyncStorage.setItem as jest.Mock).mockClear();

      await accountSimulator.updateClubRoleState({ role: 'member' });

      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('toggleSimulator()', () => {
    it('should enable simulator', async () => {
      const state = await accountSimulator.toggleSimulator(true);

      expect(state.enabled).toBe(true);
    });

    it('should disable simulator', async () => {
      const state = await accountSimulator.toggleSimulator(false);

      expect(state.enabled).toBe(false);
    });

    it('should preserve other state when toggling', async () => {
      await accountSimulator.applyPreset('personal_active');

      const state = await accountSimulator.toggleSimulator(false);

      expect(state.enabled).toBe(false);
      expect(state.subscription.tier).toBe('personal'); // Preserved
    });

    it('should save state after toggle', async () => {
      (AsyncStorage.setItem as jest.Mock).mockClear();

      await accountSimulator.toggleSimulator(true);

      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('checkSimulatorOverrides()', () => {
    it('should return null for non-whitelisted emails', async () => {
      const overrides = await accountSimulator.checkSimulatorOverrides('user@example.com');

      expect(overrides).toBeNull();
    });

    it('should return null for undefined email', async () => {
      const overrides = await accountSimulator.checkSimulatorOverrides(undefined);

      expect(overrides).toBeNull();
    });

    it('should return null when simulator is disabled', async () => {
      await accountSimulator.toggleSimulator(false);

      const overrides = await accountSimulator.checkSimulatorOverrides('test@courtster.app');

      expect(overrides).toBeNull();
    });

    it('should return state when simulator is enabled for whitelisted email', async () => {
      await accountSimulator.applyPreset('personal_active');

      const overrides = await accountSimulator.checkSimulatorOverrides('test@courtster.app');

      expect(overrides).not.toBeNull();
      expect(overrides?.enabled).toBe(true);
      expect(overrides?.subscription.tier).toBe('personal');
    });

    it('should work with uppercase email', async () => {
      await accountSimulator.applyPreset('personal_active');

      const overrides = await accountSimulator.checkSimulatorOverrides('TEST@COURTSTER.APP');

      expect(overrides).not.toBeNull();
    });
  });

  describe('getPresetLabel()', () => {
    it('should return labels for all presets', () => {
      const presets = accountSimulator.getAvailablePresets();

      presets.forEach((preset: string) => {
        const label = accountSimulator.getPresetLabel(preset);
        expect(label).toBeTruthy();
        expect(typeof label).toBe('string');
      });
    });

    it('should return readable labels', () => {
      expect(accountSimulator.getPresetLabel('new_free_user')).toBe('New Free User');
      expect(accountSimulator.getPresetLabel('club_owner')).toBe('Club Owner');
    });
  });

  describe('getPresetDescription()', () => {
    it('should return descriptions for all presets', () => {
      const presets = accountSimulator.getAvailablePresets();

      presets.forEach((preset: string) => {
        const description = accountSimulator.getPresetDescription(preset);
        expect(description).toBeTruthy();
        expect(typeof description).toBe('string');
      });
    });

    it('should return descriptive text', () => {
      const description = accountSimulator.getPresetDescription('new_free_user');

      expect(description).toContain('Free tier');
      expect(description).toContain('trial');
    });
  });

  describe('getAvailablePresets()', () => {
    it('should return all preset keys', () => {
      const presets = accountSimulator.getAvailablePresets();

      expect(presets).toContain('new_free_user');
      expect(presets).toContain('free_limit_reached');
      expect(presets).toContain('personal_trial_ending');
      expect(presets).toContain('personal_active');
      expect(presets).toContain('personal_expiring_soon');
      expect(presets).toContain('personal_expired');
      expect(presets).toContain('personal_cancelled');
      expect(presets).toContain('personal_billing_issue');
      expect(presets).toContain('club_owner');
      expect(presets).toContain('club_member');
    });

    it('should return array of strings', () => {
      const presets = accountSimulator.getAvailablePresets();

      expect(Array.isArray(presets)).toBe(true);
      presets.forEach((preset: any) => {
        expect(typeof preset).toBe('string');
      });
    });

    it('should return at least 10 presets', () => {
      const presets = accountSimulator.getAvailablePresets();

      expect(presets.length).toBeGreaterThanOrEqual(10);
    });
  });

  describe('Subscription Tiers', () => {
    it('should support free tier', async () => {
      const state = await accountSimulator.updateSubscriptionState({ tier: 'free' });

      expect(state.subscription.tier).toBe('free');
    });

    it('should support personal tier', async () => {
      const state = await accountSimulator.updateSubscriptionState({ tier: 'personal' });

      expect(state.subscription.tier).toBe('personal');
    });

    it('should support club tier', async () => {
      const state = await accountSimulator.updateSubscriptionState({ tier: 'club' });

      expect(state.subscription.tier).toBe('club');
    });
  });

  describe('Club Roles', () => {
    it('should support owner role', async () => {
      const state = await accountSimulator.updateClubRoleState({ role: 'owner' });

      expect(state.clubRole.role).toBe('owner');
    });

    it('should support admin role', async () => {
      const state = await accountSimulator.updateClubRoleState({ role: 'admin' });

      expect(state.clubRole.role).toBe('admin');
    });

    it('should support member role', async () => {
      const state = await accountSimulator.updateClubRoleState({ role: 'member' });

      expect(state.clubRole.role).toBe('member');
    });

    it('should support null role', async () => {
      const state = await accountSimulator.updateClubRoleState({ role: null });

      expect(state.clubRole.role).toBeNull();
    });
  });

  describe('Club Status', () => {
    it('should support active status', async () => {
      const state = await accountSimulator.updateClubRoleState({ status: 'active' });

      expect(state.clubRole.status).toBe('active');
    });

    it('should support pending status', async () => {
      const state = await accountSimulator.updateClubRoleState({ status: 'pending' });

      expect(state.clubRole.status).toBe('pending');
    });

    it('should support removed status', async () => {
      const state = await accountSimulator.updateClubRoleState({ status: 'removed' });

      expect(state.clubRole.status).toBe('removed');
    });
  });

  describe('Payment Status', () => {
    const statuses = [
      'active',
      'expired',
      'expiring_soon',
      'cancelled',
      'billing_issue',
      'grace_period',
    ] as const;

    statuses.forEach((status) => {
      it(`should support ${status} payment status`, async () => {
        const state = await accountSimulator.updateSubscriptionState({
          paymentStatus: status,
        });

        expect(state.subscription.paymentStatus).toBe(status);
      });
    });
  });

  describe('Date Handling', () => {
    it('should generate future dates for subscription expiration', async () => {
      const state = await accountSimulator.applyPreset('personal_active');
      const expiresAt = state.subscription.subscriptionExpiresAt;

      expect(expiresAt).not.toBeNull();
      if (expiresAt) {
        const expiryDate = new Date(expiresAt);
        const now = new Date();
        expect(expiryDate.getTime()).toBeGreaterThan(now.getTime());
      }
    });

    it('should generate past dates for expired subscriptions', async () => {
      const state = await accountSimulator.applyPreset('personal_expired');
      const expiresAt = state.subscription.subscriptionExpiresAt;

      expect(expiresAt).not.toBeNull();
      if (expiresAt) {
        const expiryDate = new Date(expiresAt);
        const now = new Date();
        expect(expiryDate.getTime()).toBeLessThan(now.getTime());
      }
    });

    it('should use ISO date strings', async () => {
      const state = await accountSimulator.applyPreset('personal_active');
      const expiresAt = state.subscription.subscriptionExpiresAt;

      if (expiresAt) {
        expect(() => new Date(expiresAt)).not.toThrow();
        expect(expiresAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple rapid state changes', async () => {
      await accountSimulator.applyPreset('new_free_user');
      await accountSimulator.applyPreset('personal_active');
      await accountSimulator.applyPreset('club_owner');

      const state = await accountSimulator.loadSimulatorState();

      expect(state.subscription.tier).toBe('club');
      expect(state.clubRole.role).toBe('owner');
    });

    it('should handle partial updates', async () => {
      await accountSimulator.applyPreset('personal_active');

      const state = await accountSimulator.updateSubscriptionState({
        sessionsUsedThisMonth: 10,
      });

      expect(state.subscription.sessionsUsedThisMonth).toBe(10);
      expect(state.subscription.tier).toBe('personal'); // Not affected
    });

    it('should handle clearing and reloading', async () => {
      await accountSimulator.applyPreset('personal_active');
      await accountSimulator.clearSimulatorState();

      const state = await accountSimulator.loadSimulatorState();

      expect(state.enabled).toBe(false);
      expect(state.subscription.tier).toBe('free');
    });
  });
});
