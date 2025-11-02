/**
 * Type Guards for Runtime Validation
 * CRITICAL FIX #3: Replace `as any` with proper type validation
 */

import { Player } from '@courtster/shared';

/**
 * Valid player status values
 */
export type PlayerStatus = 'active' | 'sitting' | 'skip';

/**
 * Valid gender values
 */
export type Gender = 'male' | 'female' | 'unspecified';

/**
 * Valid matchup preferences
 */
export type MatchupPreference = 'balanced' | 'mixed' | 'random';

/**
 * Valid session types
 */
export type SessionType = 'mexicano' | 'americano' | 'fixed_partner' | 'mixed_mexicano';

/**
 * Type guard for player status
 */
export function isValidPlayerStatus(status: unknown): status is PlayerStatus {
  return (
    typeof status === 'string' &&
    ['active', 'sitting', 'skip'].includes(status)
  );
}

/**
 * Type guard for gender
 */
export function isValidGender(gender: unknown): gender is Gender {
  return (
    typeof gender === 'string' &&
    ['male', 'female', 'unspecified'].includes(gender)
  );
}

/**
 * Type guard for matchup preference
 */
export function isValidMatchupPreference(preference: unknown): preference is MatchupPreference {
  return (
    typeof preference === 'string' &&
    ['balanced', 'mixed', 'random'].includes(preference)
  );
}

/**
 * Type guard for session type
 */
export function isValidSessionType(type: unknown): type is SessionType {
  return (
    typeof type === 'string' &&
    ['mexicano', 'americano', 'fixed_partner', 'mixed_mexicano'].includes(type)
  );
}

/**
 * Safe player status converter with fallback
 */
export function toPlayerStatus(status: unknown): PlayerStatus {
  return isValidPlayerStatus(status) ? status : 'active';
}

/**
 * Safe gender converter with fallback
 */
export function toGender(gender: unknown): Gender {
  return isValidGender(gender) ? gender : 'unspecified';
}

/**
 * Safe matchup preference converter with fallback
 */
export function toMatchupPreference(preference: unknown): MatchupPreference {
  return isValidMatchupPreference(preference) ? preference : 'balanced';
}

/**
 * Safe session type converter with fallback
 */
export function toSessionType(type: unknown): SessionType {
  return isValidSessionType(type) ? type : 'mexicano';
}

/**
 * Validate and sanitize player name
 */
export function sanitizePlayerName(name: unknown): string {
  if (typeof name !== 'string') return '';

  // Trim and limit length
  const trimmed = name.trim().substring(0, 100);

  // Remove invalid characters (allow letters, numbers, spaces, hyphens, apostrophes)
  const sanitized = trimmed.replace(/[^a-zA-Z0-9\s\-']/g, '');

  return sanitized;
}

/**
 * Validate rating is within valid range
 */
export function validateRating(rating: unknown): number {
  const num = Number(rating);

  if (isNaN(num)) return 5; // Default rating
  if (num < 0) return 0;
  if (num > 10) return 10;

  return Math.round(num * 10) / 10; // Round to 1 decimal
}

/**
 * Validate score is within valid range
 */
export function validateScore(score: unknown): number | undefined {
  if (score === null || score === undefined) return undefined;

  const num = Number(score);

  if (isNaN(num)) return undefined;
  if (num < 0) return 0;
  if (num > 999) return 999; // Reasonable max score

  return Math.round(num);
}

/**
 * Validate match scores follow proper game rules
 * @param team1Score - Score for team 1
 * @param team2Score - Score for team 2
 * @param scoringMode - Scoring mode ('first_to_15', 'first_to_21', etc.)
 * @returns Validation result with error message if invalid
 */
export function validateMatchScore(
  team1Score: number,
  team2Score: number,
  scoringMode: string = 'first_to_15'
): { valid: boolean; error?: string } {
  // Cannot have negative scores
  if (team1Score < 0 || team2Score < 0) {
    return { valid: false, error: 'Scores cannot be negative' };
  }

  // Cannot both be zero (no game played)
  if (team1Score === 0 && team2Score === 0) {
    return { valid: false, error: 'At least one team must score' };
  }

  // Validate based on scoring mode
  if (scoringMode === 'first_to_15') {
    const winner = Math.max(team1Score, team2Score);
    const loser = Math.min(team1Score, team2Score);

    // Winning team must reach at least 15
    if (winner < 15) {
      return {
        valid: false,
        error: 'Winning team must reach at least 15 points (first to 15)'
      };
    }

    // Standard win: 15 points with loser having 0-14
    if (winner === 15 && loser <= 14) {
      return { valid: true };
    }

    // Deuce situation: Must win by 2 after 15
    if (winner > 15) {
      const diff = Math.abs(team1Score - team2Score);
      if (diff < 2) {
        return {
          valid: false,
          error: 'Must win by 2 points after reaching 15 (e.g., 17-15, 18-16)'
        };
      }

      // Reasonable maximum to prevent data entry errors
      if (winner > 30) {
        return {
          valid: false,
          error: 'Score seems too high. Please verify the score is correct.'
        };
      }

      return { valid: true };
    }
  }

  if (scoringMode === 'first_to_21') {
    const winner = Math.max(team1Score, team2Score);
    const loser = Math.min(team1Score, team2Score);

    // Winning team must reach at least 21
    if (winner < 21) {
      return {
        valid: false,
        error: 'Winning team must reach at least 21 points (first to 21)'
      };
    }

    // Standard win: 21 points with loser having 0-20
    if (winner === 21 && loser <= 20) {
      return { valid: true };
    }

    // Deuce situation: Must win by 2 after 21
    if (winner > 21) {
      const diff = Math.abs(team1Score - team2Score);
      if (diff < 2) {
        return {
          valid: false,
          error: 'Must win by 2 points after reaching 21 (e.g., 23-21, 24-22)'
        };
      }

      // Reasonable maximum
      if (winner > 40) {
        return {
          valid: false,
          error: 'Score seems too high. Please verify the score is correct.'
        };
      }

      return { valid: true };
    }
  }

  // For any other scoring mode or edge cases, allow the score
  return { valid: true };
}
