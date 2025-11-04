/**
 * Session Sharing Hook
 *
 * Provides functions to enable, disable, and verify session sharing with PIN protection.
 * Handles local storage of verified tokens for seamless public access.
 */

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';
import { generatePIN, hashPIN, verifyPIN, generateShareToken } from '../utils/pinUtils';
import { Logger } from '../utils/logger';

// ============================================================================
// Types
// ============================================================================

export interface SharedSession {
  id: string;
  session_name: string;
  location: string;
  date: string;
  status: 'in_progress' | 'completed' | 'cancelled';
  share_token: string;
  is_public: boolean;
  created_at: string;
  players?: Array<{
    id: string;
    player_name: string;
    matches_won: number;
    matches_lost: number;
    points_won: number;
    points_lost: number;
    rating: number;
  }>;
  rounds?: Array<{
    id: string;
    round_number: number;
    matches: Array<{
      id: string;
      team1_player1: string;
      team1_player2: string;
      team2_player1: string;
      team2_player2: string;
      team1_score: number;
      team2_score: number;
      completed: boolean;
    }>;
  }>;
}

export interface EnableSharingResult {
  shareToken: string;
  pin: string;
  shareUrl: string;
}

// ============================================================================
// AsyncStorage Keys
// ============================================================================

const VERIFIED_TOKENS_KEY = '@courtster/verified_share_tokens';

// Store verified tokens locally so users don't re-enter PIN
async function saveVerifiedToken(shareToken: string): Promise<void> {
  try {
    const existingTokens = await AsyncStorage.getItem(VERIFIED_TOKENS_KEY);
    const tokens = existingTokens ? JSON.parse(existingTokens) : [];

    if (!tokens.includes(shareToken)) {
      tokens.push(shareToken);
      await AsyncStorage.setItem(VERIFIED_TOKENS_KEY, JSON.stringify(tokens));
    }

    Logger.debug('Share token saved to verified list', { shareToken });
  } catch (error) {
    Logger.error('Failed to save verified token', error as Error, {
      action: 'save_verified_token',
    });
  }
}

async function isTokenVerified(shareToken: string): Promise<boolean> {
  try {
    const existingTokens = await AsyncStorage.getItem(VERIFIED_TOKENS_KEY);
    const tokens = existingTokens ? JSON.parse(existingTokens) : [];
    return tokens.includes(shareToken);
  } catch (error) {
    Logger.error('Failed to check verified token', error as Error, {
      action: 'check_verified_token',
    });
    return false;
  }
}

async function removeVerifiedToken(shareToken: string): Promise<void> {
  try {
    const existingTokens = await AsyncStorage.getItem(VERIFIED_TOKENS_KEY);
    const tokens = existingTokens ? JSON.parse(existingTokens) : [];
    const filtered = tokens.filter((t: string) => t !== shareToken);
    await AsyncStorage.setItem(VERIFIED_TOKENS_KEY, JSON.stringify(filtered));

    Logger.debug('Share token removed from verified list', { shareToken });
  } catch (error) {
    Logger.error('Failed to remove verified token', error as Error, {
      action: 'remove_verified_token',
    });
  }
}

// ============================================================================
// Hook
// ============================================================================

export function useSessionSharing() {
  const queryClient = useQueryClient();

  /**
   * Enable sharing on a session
   * Generates a share token and PIN, updates database
   */
  const enableSharing = useMutation({
    mutationFn: async (sessionId: string): Promise<EnableSharingResult> => {
      try {
        // Generate token and PIN
        const shareToken = generateShareToken();
        const pin = generatePIN();
        const pinHash = await hashPIN(pin);

        Logger.info('Enabling session sharing', {
          action: 'enable_sharing',
          sessionId,
        });

        // Update session in database
        const { error } = await supabase
          .from('game_sessions')
          .update({
            share_token: shareToken,
            share_pin: pinHash,
            is_public: true,
          })
          .eq('id', sessionId);

        if (error) {
          throw error;
        }

        // Generate share URL (in production, this would be the actual domain)
        const shareUrl = `courtster://result/${shareToken}`;

        Logger.info('Session sharing enabled successfully', {
          action: 'enable_sharing',
          sessionId,
          shareToken,
        });

        return { shareToken, pin, shareUrl };
      } catch (error) {
        Logger.error('Failed to enable session sharing', error as Error, {
          action: 'enable_sharing',
          sessionId,
        });
        throw error;
      }
    },
    onSuccess: (_, sessionId) => {
      // Invalidate session queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });

  /**
   * Disable sharing on a session
   * Removes share token and PIN, revokes public access
   */
  const disableSharing = useMutation({
    mutationFn: async (sessionId: string): Promise<void> => {
      try {
        Logger.info('Disabling session sharing', {
          action: 'disable_sharing',
          sessionId,
        });

        // Get the share token before removing (to clear local storage)
        const { data: session } = await supabase
          .from('game_sessions')
          .select('share_token')
          .eq('id', sessionId)
          .single();

        if (session?.share_token) {
          await removeVerifiedToken(session.share_token);
        }

        // Remove share token and PIN from database
        const { error } = await supabase
          .from('game_sessions')
          .update({
            share_token: null,
            share_pin: null,
            is_public: false,
          })
          .eq('id', sessionId);

        if (error) {
          throw error;
        }

        Logger.info('Session sharing disabled successfully', {
          action: 'disable_sharing',
          sessionId,
        });
      } catch (error) {
        Logger.error('Failed to disable session sharing', error as Error, {
          action: 'disable_sharing',
          sessionId,
        });
        throw error;
      }
    },
    onSuccess: (_, sessionId) => {
      // Invalidate session queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });

  /**
   * Regenerate PIN for a session while keeping the same share token
   * Useful if the PIN is compromised or forgotten
   */
  const regeneratePIN = useMutation({
    mutationFn: async (sessionId: string): Promise<string> => {
      try {
        Logger.info('Regenerating session PIN', {
          action: 'regenerate_pin',
          sessionId,
        });

        // Generate new PIN
        const pin = generatePIN();
        const pinHash = await hashPIN(pin);

        // Update only the PIN, keep share_token the same
        const { error } = await supabase
          .from('game_sessions')
          .update({
            share_pin: pinHash,
          })
          .eq('id', sessionId);

        if (error) {
          throw error;
        }

        Logger.info('Session PIN regenerated successfully', {
          action: 'regenerate_pin',
          sessionId,
        });

        return pin;
      } catch (error) {
        Logger.error('Failed to regenerate PIN', error as Error, {
          action: 'regenerate_pin',
          sessionId,
        });
        throw error;
      }
    },
    onSuccess: (_, sessionId) => {
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
    },
  });

  /**
   * Verify PIN for a shared session
   * On success, stores the token locally for future access
   */
  const verifySharePIN = useMutation({
    mutationFn: async ({
      shareToken,
      pin,
    }: {
      shareToken: string;
      pin: string;
    }): Promise<boolean> => {
      try {
        Logger.info('Verifying share PIN', {
          action: 'verify_share_pin',
          shareToken,
        });

        // Get the session's PIN hash
        const { data: session, error } = await supabase
          .from('game_sessions')
          .select('share_pin')
          .eq('share_token', shareToken)
          .eq('is_public', true)
          .single();

        if (error || !session) {
          Logger.warn('Session not found or not public', {
            action: 'verify_share_pin',
            shareToken,
          });
          return false;
        }

        if (!session.share_pin) {
          Logger.warn('Session has no PIN set', {
            action: 'verify_share_pin',
            shareToken,
          });
          return false;
        }

        // Verify the PIN
        const isValid = await verifyPIN(pin, session.share_pin);

        if (isValid) {
          // Save token locally for future access
          await saveVerifiedToken(shareToken);

          Logger.info('Share PIN verified successfully', {
            action: 'verify_share_pin',
            shareToken,
          });
        } else {
          Logger.warn('Invalid share PIN', {
            action: 'verify_share_pin',
            shareToken,
          });
        }

        return isValid;
      } catch (error) {
        Logger.error('Failed to verify share PIN', error as Error, {
          action: 'verify_share_pin',
          shareToken,
        });
        return false;
      }
    },
  });

  /**
   * Get shared session data by share token
   * Returns full session data including players and rounds
   */
  const useSharedSession = (shareToken: string | undefined) => {
    return useQuery({
      queryKey: ['shared_session', shareToken],
      enabled: !!shareToken,
      queryFn: async (): Promise<SharedSession | null> => {
        if (!shareToken) {
          return null;
        }

        try {
          Logger.info('Fetching shared session', {
            action: 'get_shared_session',
            shareToken,
          });

          // Fetch session with players and rounds
          const { data: session, error } = await supabase
            .from('game_sessions')
            .select(`
              id,
              session_name,
              location,
              date,
              status,
              share_token,
              is_public,
              created_at,
              players:players(
                id,
                player_name,
                matches_won,
                matches_lost,
                points_won,
                points_lost,
                rating
              ),
              rounds:rounds(
                id,
                round_number,
                matches:matches(
                  id,
                  team1_player1:players!matches_team1_player1_fkey(player_name),
                  team1_player2:players!matches_team1_player2_fkey(player_name),
                  team2_player1:players!matches_team2_player1_fkey(player_name),
                  team2_player2:players!matches_team2_player2_fkey(player_name),
                  team1_score,
                  team2_score,
                  completed
                )
              )
            `)
            .eq('share_token', shareToken)
            .eq('is_public', true)
            .single();

          if (error || !session) {
            Logger.warn('Shared session not found or not public', {
              action: 'get_shared_session',
              shareToken,
              error: error?.message,
            });
            return null;
          }

          Logger.info('Shared session fetched successfully', {
            action: 'get_shared_session',
            shareToken,
            sessionId: session.id,
          });

          return session as SharedSession;
        } catch (error) {
          Logger.error('Failed to fetch shared session', error as Error, {
            action: 'get_shared_session',
            shareToken,
          });
          return null;
        }
      },
      // Refetch every 30 seconds to get live updates
      refetchInterval: 30000,
    });
  };

  /**
   * Check if a share token is already verified locally
   */
  const checkTokenVerified = async (shareToken: string): Promise<boolean> => {
    return isTokenVerified(shareToken);
  };

  return {
    enableSharing,
    disableSharing,
    regeneratePIN,
    verifySharePIN,
    useSharedSession,
    checkTokenVerified,
  };
}
