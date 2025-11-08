# Subscription Simulator - Testing Guide

## Overview

The subscription simulator allows test accounts to simulate different subscription and payment states for testing purposes without making real purchases or modifying the database.

## Access

**Whitelisted Test Accounts:**
- `test@courtster.app`
- `test2@courtster.app`

**How to Access:**
1. Sign in with a test account
2. Navigate to **Settings** tab
3. Scroll to **Account Simulator** section (only visible for test accounts)

## New Payment Status Scenarios

### 1. Personal Active ✅
**Preset:** `personal_active`

**State:**
- Tier: Personal
- Payment Status: Active
- Expires: 25 days from now
- Will Renew: Yes

**Use Case:**
- Test normal subscription behavior
- Verify premium features work correctly
- Test auto-renewal reminders

---

### 2. Personal Expiring Soon ⏰
**Preset:** `personal_expiring_soon`

**State:**
- Tier: Personal
- Payment Status: Expiring Soon
- Expires: 5 days from now
- Will Renew: Yes (auto-renewal enabled)

**Use Case:**
- Test expiration warning banners
- Verify renewal reminders trigger correctly
- Test "renewing soon" UI states

---

### 3. Personal Expired ❌
**Preset:** `personal_expired`

**State:**
- Tier: Free (reverted)
- Payment Status: Expired
- Expired: 3 days ago
- Will Renew: No

**Use Case:**
- Test feature downgrade after expiration
- Verify free tier limitations apply
- Test re-subscription prompts
- Ensure user doesn't lose data after expiration

---

### 4. Personal Cancelled ⚠️
**Preset:** `personal_cancelled`

**State:**
- Tier: Personal (still has access)
- Payment Status: Cancelled
- Expires: 12 days from now
- Will Renew: No (user cancelled auto-renewal)

**Use Case:**
- Test "cancelled but still active" state
- Verify countdown to expiration shows correctly
- Test re-enable subscription prompts
- Ensure premium features work until expiration

---

### 5. Personal Billing Issue 💳
**Preset:** `personal_billing_issue`

**State:**
- Tier: Personal (grace period)
- Payment Status: Billing Issue
- Expires: 3 days from now (grace period)
- Billing Issue Detected: 2 days ago
- Will Renew: Yes (attempted)

**Use Case:**
- Test payment failure alerts
- Verify grace period access
- Test "update payment method" prompts
- Ensure user retains access during grace period

---

## How to Use

### Method 1: Quick Preset (Recommended)

1. Go to **Settings → Account Simulator**
2. Toggle **Enable Simulator** ON
3. Tap one of the **Quick Presets**:
   - Personal Active
   - Personal Expiring Soon
   - Personal Expired
   - Personal Cancelled
   - Personal Billing Issue
4. **IMPORTANT:** Restart the app for full effect
5. Navigate through the app to test behavior

### Method 2: Manual State Configuration

1. Enable simulator
2. Use custom state via:
   ```typescript
   import { updateSubscriptionState } from '../../utils/accountSimulator';

   await updateSubscriptionState({
     tier: 'personal',
     paymentStatus: 'billing_issue',
     subscriptionExpiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
     willRenew: true,
     billingIssueDetectedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
   });
   ```

### Resetting Simulator

To return to normal database values:

1. Go to **Settings → Account Simulator**
2. Scroll to bottom
3. Tap **Reset Simulator**
4. Restart app

---

## Testing Checklist

### For Each Payment Status:

- [ ] Check subscription badge/status displays correctly
- [ ] Verify feature access matches tier
- [ ] Test navigation to subscription screen
- [ ] Verify appropriate alerts/banners show
- [ ] Test "Upgrade" or "Fix Payment" buttons
- [ ] Confirm session creation limits work
- [ ] Test Reclub import access
- [ ] Verify club creation limits

### Specific Scenarios:

**Expiring Soon:**
- [ ] Warning banner shows on home/profile
- [ ] Countdown timer displays days remaining
- [ ] "Manage Subscription" button navigates correctly

**Expired:**
- [ ] User reverted to free tier
- [ ] Premium features locked
- [ ] Re-subscribe prompts show
- [ ] Historical data preserved

**Cancelled:**
- [ ] Access continues until expiration
- [ ] "Cancelled" badge displays
- [ ] Re-enable subscription option available
- [ ] Countdown to full cancellation shows

**Billing Issue:**
- [ ] Alert/banner shows payment failure
- [ ] "Update Payment Method" button visible
- [ ] Grace period countdown displays
- [ ] Access maintained during grace period

---

## Implementation Details

### Data Structure

```typescript
interface SimulatorSubscriptionState {
  tier: 'free' | 'personal' | 'club';
  isTrialActive: boolean;
  trialDaysRemaining: number;
  sessionsUsedThisMonth: number;

  // Payment simulation fields
  paymentStatus: 'active' | 'expired' | 'expiring_soon' | 'cancelled' | 'billing_issue' | 'grace_period';
  subscriptionExpiresAt: string | null; // ISO date
  willRenew: boolean;
  billingIssueDetectedAt: string | null; // ISO date
}
```

### Where Simulator State is Used

1. **`useSubscription` hook** (`hooks/useSubscription.ts:97-111`)
   - Checks for simulator overrides before fetching real data
   - Returns simulated subscription status if enabled

2. **Feature Access Checks:**
   - Session creation limits
   - Reclub import
   - Multi-court selection
   - Club creation

3. **UI Components:**
   - Subscription badge
   - Feature lock overlays
   - Upgrade prompts

### Storage

- Simulated state stored in AsyncStorage
- Key: `@courtster_account_simulator`
- Persists across app restarts
- Separate from real database

---

## Troubleshooting

**Simulator not showing:**
- Ensure you're signed in with a whitelisted account
- Check `ALLOWED_EMAILS` in `utils/accountSimulator.ts`

**Changes not taking effect:**
- Restart the app after applying preset
- Verify simulator is enabled (purple "ACTIVE" badge)
- Check AsyncStorage for saved state

**Reverting to real data:**
- Use "Reset Simulator" button
- Or manually delete AsyncStorage key: `@courtster_account_simulator`

**Preset not working:**
- Check console for errors
- Verify preset exists in `PRESETS` object
- Ensure `getDateDaysFromNow()` helper is working

---

## Development Notes

### Adding New Payment Statuses

1. Add new status to `SimulatorPaymentStatus` type
2. Create preset in `PRESETS` object
3. Add label in `getPresetLabel()`
4. Add description in `getPresetDescription()`
5. Update this guide

### Adding New Whitelisted Accounts

Edit `utils/accountSimulator.ts`:

```typescript
const ALLOWED_EMAILS = [
  'test@courtster.app',
  'test2@courtster.app',
  'newtest@courtster.app', // Add here
];
```

---

## Security

- ✅ Only whitelisted test accounts can access simulator
- ✅ Simulator state stored locally (not in database)
- ✅ Production accounts cannot enable simulator
- ✅ Simulated state never syncs to backend
- ✅ Real subscription status preserved in database

---

## Quick Reference

| Preset | Tier | Status | Expires | Renews | Use Case |
|--------|------|--------|---------|--------|----------|
| Personal Active | Personal | ✅ Active | +25d | Yes | Normal subscription |
| Expiring Soon | Personal | ⏰ Expiring | +5d | Yes | Renewal reminder |
| Expired | Free | ❌ Expired | -3d | No | Post-expiration |
| Cancelled | Personal | ⚠️ Cancelled | +12d | No | Active until period ends |
| Billing Issue | Personal | 💳 Failed | +3d | Yes | Payment failed |

---

**Last Updated:** 2025-11-02
**Status:** ✅ Production Ready
