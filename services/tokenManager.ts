/**
 * Push Token Management Service
 *
 * Handles token validation, cleanup, and lifecycle management
 */

import { supabase } from '../config/supabase';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import {
  NotificationError,
  NotificationErrorCode,
  errorLogger,
  retryWithBackoff,
} from './notificationError';

export interface PushToken {
  id: string;
  user_id: string;
  token: string;
  device_info: {
    platform: string;
    model: string;
    osVersion: string;
    appVersion?: string;
  };
  created_at: string;
  updated_at: string;
  last_used?: string;
  is_valid: boolean;
}

class TokenManager {
  private tokenCache: Map<string, PushToken> = new Map();
  private readonly TOKEN_EXPIRY_DAYS = 90; // Tokens not used in 90 days are considered stale
  private readonly VALIDATION_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Validate token format
   */
  validateTokenFormat(token: string): boolean {
    // Expo push token format: ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]
    const expoTokenPattern = /^ExponentPushToken\[[a-zA-Z0-9_-]+\]$/;

    if (!expoTokenPattern.test(token)) {
      errorLogger.log(
        new NotificationError(
          NotificationErrorCode.INVALID_TOKEN,
          'Token does not match Expo push token format',
          undefined,
          { token: token.substring(0, 30) + '...' },
          false
        )
      );
      return false;
    }

    return true;
  }

  /**
   * Save token with validation
   */
  async saveToken(userId: string, token: string): Promise<boolean> {
    if (!this.validateTokenFormat(token)) {
      return false;
    }

    try {
      const deviceInfo = {
        platform: Platform.OS,
        model: Device.modelName || 'Unknown',
        osVersion: Device.osVersion || 'Unknown',
        appVersion: require('../../app.json').expo.version,
      };

      await retryWithBackoff(
        async () => {
          const { error } = await supabase.from('push_tokens').upsert(
            {
              user_id: userId,
              token,
              device_info: deviceInfo,
              updated_at: new Date().toISOString(),
              last_used: new Date().toISOString(),
              is_valid: true,
            },
            {
              onConflict: 'user_id,token',
            }
          );

          if (error) throw error;
        },
        undefined,
        NotificationErrorCode.TOKEN_SAVE_FAILED,
        { userId, devicePlatform: Platform.OS }
      );

      // Update cache
      this.tokenCache.set(token, {
        id: '',
        user_id: userId,
        token,
        device_info: deviceInfo,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_used: new Date().toISOString(),
        is_valid: true,
      });

      return true;
    } catch (error) {
      if (error instanceof NotificationError) {
        errorLogger.log(error);
      }
      return false;
    }
  }

  /**
   * Get all tokens for a user
   */
  async getUserTokens(userId: string): Promise<PushToken[]> {
    try {
      const { data, error } = await supabase
        .from('push_tokens')
        .select('*')
        .eq('user_id', userId)
        .eq('is_valid', true)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      return data as PushToken[];
    } catch (error) {
      errorLogger.log(
        new NotificationError(
          NotificationErrorCode.DATABASE_ERROR,
          'Failed to fetch user tokens',
          error as Error,
          { userId },
          true
        )
      );
      return [];
    }
  }

  /**
   * Mark token as invalid
   */
  async invalidateToken(token: string): Promise<void> {
    try {
      await retryWithBackoff(
        async () => {
          const { error } = await supabase
            .from('push_tokens')
            .update({
              is_valid: false,
              updated_at: new Date().toISOString(),
            })
            .eq('token', token);

          if (error) throw error;
        },
        undefined,
        NotificationErrorCode.DATABASE_ERROR,
        { operation: 'invalidateToken' }
      );

      // Remove from cache
      this.tokenCache.delete(token);
    } catch (error) {
      errorLogger.log(
        new NotificationError(
          NotificationErrorCode.DATABASE_ERROR,
          'Failed to invalidate token',
          error as Error,
          { token: token.substring(0, 30) + '...' },
          false
        )
      );
    }
  }

  /**
   * Clean up stale tokens (not used in X days)
   */
  async cleanupStaleTokens(userId?: string): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.TOKEN_EXPIRY_DAYS);

      let query = supabase
        .from('push_tokens')
        .update({
          is_valid: false,
          updated_at: new Date().toISOString(),
        })
        .lt('last_used', cutoffDate.toISOString());

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { count, error } = await query.select('*', { count: 'exact', head: true });

      if (error) throw error;

      console.log(`Cleaned up ${count || 0} stale tokens`);
      return count || 0;
    } catch (error) {
      errorLogger.log(
        new NotificationError(
          NotificationErrorCode.DATABASE_ERROR,
          'Failed to cleanup stale tokens',
          error as Error,
          { userId },
          false
        )
      );
      return 0;
    }
  }

  /**
   * Update last used timestamp
   */
  async updateLastUsed(token: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('push_tokens')
        .update({
          last_used: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('token', token);

      if (error) throw error;

      // Update cache
      const cached = this.tokenCache.get(token);
      if (cached) {
        cached.last_used = new Date().toISOString();
      }
    } catch (error) {
      // Silently fail - this is not critical
      console.warn('Failed to update last_used timestamp:', error);
    }
  }

  /**
   * Get token statistics
   */
  async getTokenStats(userId?: string) {
    try {
      let query = supabase.from('push_tokens').select('*', { count: 'exact' });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const [validResult, invalidResult, staleResult] = await Promise.all([
        query.eq('is_valid', true),
        query.eq('is_valid', false),
        query
          .eq('is_valid', true)
          .lt(
            'last_used',
            new Date(Date.now() - this.TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString()
          ),
      ]);

      return {
        total: (validResult.count || 0) + (invalidResult.count || 0),
        valid: validResult.count || 0,
        invalid: invalidResult.count || 0,
        stale: staleResult.count || 0,
      };
    } catch (error) {
      errorLogger.log(
        new NotificationError(
          NotificationErrorCode.DATABASE_ERROR,
          'Failed to get token statistics',
          error as Error,
          { userId },
          false
        )
      );
      return { total: 0, valid: 0, invalid: 0, stale: 0 };
    }
  }

  /**
   * Remove all tokens for a user (on logout/account deletion)
   */
  async removeAllUserTokens(userId: string): Promise<boolean> {
    try {
      await retryWithBackoff(
        async () => {
          const { error } = await supabase
            .from('push_tokens')
            .delete()
            .eq('user_id', userId);

          if (error) throw error;
        },
        undefined,
        NotificationErrorCode.DATABASE_ERROR,
        { userId, operation: 'removeAllUserTokens' }
      );

      // Clear cache for this user
      for (const [token, data] of this.tokenCache.entries()) {
        if (data.user_id === userId) {
          this.tokenCache.delete(token);
        }
      }

      return true;
    } catch (error) {
      errorLogger.log(
        new NotificationError(
          NotificationErrorCode.DATABASE_ERROR,
          'Failed to remove user tokens',
          error as Error,
          { userId },
          false
        )
      );
      return false;
    }
  }

  /**
   * Validate and refresh a token
   */
  async validateAndRefreshToken(userId: string, token: string): Promise<boolean> {
    // Check format
    if (!this.validateTokenFormat(token)) {
      await this.invalidateToken(token);
      return false;
    }

    // Update last used
    await this.updateLastUsed(token);

    return true;
  }

  /**
   * Batch validate tokens
   */
  async batchValidateTokens(tokens: string[]): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();

    for (const token of tokens) {
      const isValid = this.validateTokenFormat(token);
      results.set(token, isValid);

      if (!isValid) {
        await this.invalidateToken(token);
      }
    }

    return results;
  }

  /**
   * Clear token cache
   */
  clearCache() {
    this.tokenCache.clear();
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.tokenCache.size;
  }
}

export const tokenManager = new TokenManager();
