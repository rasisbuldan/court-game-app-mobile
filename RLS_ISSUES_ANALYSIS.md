# RLS Policy Issues - Root Cause Analysis

## Summary

The RLS policy violations are caused by **race conditions during sign-up** where database operations happen before the Supabase auth session is fully established.

## Issues Found

### 1. Profile Creation Missing Username ✅ IDENTIFIED
**Location:** `hooks/useAuth.tsx:216-222`

**Problem:**
```typescript
const { error: profileError } = await supabase
  .from('profiles')
  .insert({
    id: data.user.id,
    email: data.user.email!,
    display_name: displayName || null,
    // ❌ Missing: username field (NOT NULL constraint)
  });
```

**Error:**
```
null value in column "username" of relation "profiles" violates not-null constraint
```

**Fix:**
Add username field (use email prefix as fallback):
```typescript
const { error: profileError } = await supabase
  .from('profiles')
  .insert({
    id: data.user.id,
    email: data.user.email!,
    display_name: displayName || null,
    username: data.user.email!.split('@')[0], // ✅ Generate username from email
  });
```

### 2. User Settings RLS Failure ✅ IDENTIFIED
**Location:** `hooks/useSettings.ts:71-75`

**Problem:**
The `useSettings` hook automatically creates default settings when they don't exist. However, this INSERT can happen immediately after sign-up before the auth session is fully propagated, causing `auth.uid()` to return NULL.

**Sequence:**
1. User signs up → `signUp()` completes
2. Auth state changes → `useSettings` hook runs
3. Settings not found → Tries to INSERT default settings
4. ⚠️ Auth session not fully propagated yet → `auth.uid()` = NULL
5. ❌ RLS policy rejects: "new row violates row-level security policy"

**Current Code:**
```typescript
// This runs automatically when settings don't exist
const { data: newSettings, error: createError } = await supabase
  .from('user_settings')
  .insert(defaultSettings)  // ❌ Can fail if auth.uid() is NULL
  .select()
  .single();
```

**Solutions:**

#### Option A: Create settings during sign-up (RECOMMENDED)
Add settings creation to `signUp()` function right after profile creation:
```typescript
// In hooks/useAuth.tsx after profile creation
if (data.user) {
  // Create profile
  await supabase.from('profiles').insert({...});

  // ✅ Create default settings immediately
  await supabase.from('user_settings').insert({
    user_id: data.user.id,
    animations_enabled: true,
    notifications_enabled: true,
    theme: 'system',
  });
}
```

#### Option B: Add retry logic with exponential backoff
```typescript
// In useSettings.ts
const createDefaultSettings = async (retries = 3) => {
  try {
    return await supabase.from('user_settings').insert(defaultSettings).select().single();
  } catch (error) {
    if (retries > 0 && error.code === 'PGRST' /* RLS violation */) {
      await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms
      return createDefaultSettings(retries - 1);
    }
    throw error;
  }
};
```

### 3. Push Tokens RLS Failure ✅ IDENTIFIED
**Location:** `services/notifications.ts:149-159`

**Problem:**
Similar to user_settings - push token registration happens during/after sign-up before session is fully established.

**Current Code:**
```typescript
export async function savePushToken(userId: string, token: string): Promise<void> {
  const { error } = await supabase
    .from('push_tokens')
    .upsert({
      user_id: userId,  // ❌ Can fail if auth.uid() is NULL
      token,
      device_info: deviceInfo,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,token',
    });
```

**Solution:**
Add retry logic or move to after session is confirmed:
```typescript
export async function savePushToken(userId: string, token: string, retries = 3): Promise<void> {
  try {
    // Verify session exists first
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No active session');
    }

    const { error } = await supabase.from('push_tokens').upsert({...});
    if (error) throw error;
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return savePushToken(userId, token, retries - 1);
    }
    throw error;
  }
}
```

## RLS Policies Status

✅ **All policies are correctly configured:**

### push_tokens
- ✅ Users can view own push tokens (SELECT)
- ✅ Users can insert own push tokens (INSERT)
- ✅ Users can update own push tokens (UPDATE)
- ✅ Users can delete own push tokens (DELETE)

### user_settings
- ✅ Users can read own settings (SELECT)
- ✅ Users can insert own settings (INSERT)
- ✅ Users can update own settings (UPDATE)
- ✅ Users can delete own settings (DELETE)

### notification_preferences
- ✅ Users can view own notification preferences (SELECT)
- ✅ Users can insert own notification preferences (INSERT)
- ✅ Users can update own notification preferences (UPDATE)
- ✅ Users can delete own notification preferences (DELETE)

All policies use `auth.uid() = user_id` - **no issues with policy logic**.

## Root Cause

The issue is **NOT with the RLS policies** but with **timing**:

1. Supabase auth session takes time to propagate after sign-up
2. React Query hooks run immediately when user state changes
3. INSERTs happen before `auth.uid()` is available
4. RLS policies correctly reject (auth.uid() = NULL)

## Recommended Fixes

### Priority 1: Fix Profile Creation (CRITICAL)
Add `username` field to profile INSERT in `hooks/useAuth.tsx:216-222`

### Priority 2: Move Settings Creation to Sign-Up (HIGH)
Create default user_settings during `signUp()` instead of lazy-loading in hook

### Priority 3: Add Push Token Retry Logic (MEDIUM)
Add session check + retry logic to `savePushToken()`

## Testing Plan

1. Create new account via email/password
2. Verify profile created with username
3. Verify user_settings created during sign-up
4. Verify no RLS errors in console
5. Test push token registration (if enabled)

## Files to Modify

1. `hooks/useAuth.tsx` - Add username to profile, create default settings
2. `hooks/useSettings.ts` - Remove auto-create logic (or add retry)
3. `services/notifications.ts` - Add session verification + retry

---

**Status:** Analysis complete, ready for implementation
**Date:** 2025-01-04
**Impact:** HIGH - Blocks new user sign-ups
