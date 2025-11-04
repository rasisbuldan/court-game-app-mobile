import { SessionFormData } from '../hooks/useSessionForm';
import { PlayerFormData } from '../hooks/usePlayerForm';

export type ValidationSeverity = 'error' | 'warning';
export type ValidationCategory = 'players' | 'courts' | 'scoring' | 'game_type' | 'session_info';

export interface ValidationResult {
  isValid: boolean;
  severity: ValidationSeverity;
  message: string;
  category: ValidationCategory;
  field?: string;
}

export interface ValidationRuleContext {
  formData: SessionFormData;
  players: PlayerFormData[];
}

export type ValidationRule = (context: ValidationRuleContext) => ValidationResult | null;

/**
 * Comprehensive validation rules for session creation
 * Returns null if validation passes, ValidationResult if it fails
 */
export const VALIDATION_RULES: ValidationRule[] = [
  // ============================================
  // SESSION INFO VALIDATION
  // ============================================

  (ctx) => {
    if (!ctx.formData.name.trim()) {
      return {
        isValid: false,
        severity: 'error',
        message: 'Session name is required',
        category: 'session_info',
        field: 'name',
      };
    }
    return null;
  },

  (ctx) => {
    if (ctx.formData.name.trim().length < 3) {
      return {
        isValid: false,
        severity: 'error',
        message: 'Session name must be at least 3 characters',
        category: 'session_info',
        field: 'name',
      };
    }
    return null;
  },

  (ctx) => {
    if (ctx.formData.name.trim().length > 60) {
      return {
        isValid: false,
        severity: 'error',
        message: 'Session name must be at most 60 characters',
        category: 'session_info',
        field: 'name',
      };
    }
    return null;
  },

  (ctx) => {
    if (!ctx.formData.game_date) {
      return {
        isValid: false,
        severity: 'error',
        message: 'Game date is required',
        category: 'session_info',
        field: 'game_date',
      };
    }
    return null;
  },

  (ctx) => {
    if (ctx.formData.game_date && ctx.formData.game_time) {
      try {
        const [year, month, day] = ctx.formData.game_date.split('-').map(Number);
        const [hours, minutes] = ctx.formData.game_time.split(':').map(Number);
        const selectedDateTime = new Date(year, month - 1, day, hours, minutes);
        const now = new Date();

        if (selectedDateTime < now) {
          return {
            isValid: false,
            severity: 'error',
            message: 'Session date and time must be in the future',
            category: 'session_info',
            field: 'game_date',
          };
        }
      } catch (e) {
        // Invalid date format
      }
    }
    return null;
  },

  (ctx) => {
    if (ctx.formData.duration_hours < 0.5 || ctx.formData.duration_hours > 24) {
      return {
        isValid: false,
        severity: 'error',
        message: 'Duration must be between 0.5 and 24 hours',
        category: 'session_info',
        field: 'duration_hours',
      };
    }
    return null;
  },

  // ============================================
  // PLAYER VALIDATION
  // ============================================

  (ctx) => {
    if (ctx.players.length < 4) {
      return {
        isValid: false,
        severity: 'error',
        message: 'At least 4 players are required',
        category: 'players',
      };
    }
    return null;
  },

  // ============================================
  // GAME TYPE VALIDATION
  // ============================================

  (ctx) => {
    if (ctx.formData.type === 'mixed_mexicano') {
      const maleCount = ctx.players.filter((p) => p.gender === 'male').length;
      const femaleCount = ctx.players.filter((p) => p.gender === 'female').length;

      if (maleCount !== femaleCount) {
        return {
          isValid: false,
          severity: 'error',
          message: `Mixed Mexicano requires equal number of male and female players. Current: ${maleCount} males, ${femaleCount} females`,
          category: 'game_type',
          field: 'type',
        };
      }

      if (maleCount < 2 || femaleCount < 2) {
        return {
          isValid: false,
          severity: 'error',
          message: 'Mixed Mexicano requires at least 2 males and 2 females',
          category: 'game_type',
          field: 'type',
        };
      }
    }
    return null;
  },

  (ctx) => {
    if (ctx.formData.type === 'fixed_partner') {
      if (ctx.players.length % 2 !== 0) {
        return {
          isValid: false,
          severity: 'error',
          message: 'Fixed Partner mode requires an even number of players',
          category: 'game_type',
          field: 'type',
        };
      }

      const playersWithoutPartners = ctx.players.filter((p) => !p.partnerId);
      if (playersWithoutPartners.length > 0) {
        return {
          isValid: false,
          severity: 'error',
          message: `All players must have partners in Fixed Partner mode. ${playersWithoutPartners.length} player(s) missing partners`,
          category: 'game_type',
          field: 'type',
        };
      }

      // Check mutual partnerships
      for (const player of ctx.players) {
        if (player.partnerId) {
          const partner = ctx.players.find((p) => p.id === player.partnerId);
          if (!partner || partner.partnerId !== player.id) {
            return {
              isValid: false,
              severity: 'error',
              message: 'All partnerships must be mutual',
              category: 'game_type',
              field: 'type',
            };
          }
        }
      }
    }
    return null;
  },

  // ============================================
  // MATCHUP PREFERENCE VALIDATION
  // ============================================

  (ctx) => {
    if (ctx.formData.matchup_preference === 'mixed_only') {
      const maleCount = ctx.players.filter((p) => p.gender === 'male').length;
      const femaleCount = ctx.players.filter((p) => p.gender === 'female').length;

      if (maleCount === 0 || femaleCount === 0) {
        return {
          isValid: false,
          severity: 'error',
          message: 'Mixed matchups require both male and female players',
          category: 'game_type',
          field: 'matchup_preference',
        };
      }

      if (maleCount < 2 || femaleCount < 2) {
        return {
          isValid: false,
          severity: 'error',
          message: 'Mixed matchups require at least 2 males and 2 females',
          category: 'game_type',
          field: 'matchup_preference',
        };
      }
    }
    return null;
  },

  // ============================================
  // COURTS VALIDATION
  // ============================================

  (ctx) => {
    if (ctx.formData.courts < 1 || ctx.formData.courts > 10) {
      return {
        isValid: false,
        severity: 'error',
        message: 'Courts must be between 1 and 10',
        category: 'courts',
        field: 'courts',
      };
    }
    return null;
  },

  // ============================================
  // PLAY MODE VALIDATION
  // ============================================

  (ctx) => {
    if (ctx.formData.mode === 'parallel') {
      if (ctx.formData.courts < 2 || ctx.formData.courts > 4) {
        return {
          isValid: false,
          severity: 'error',
          message: 'Parallel mode requires 2-4 courts',
          category: 'courts',
          field: 'mode',
        };
      }

      const playerCount = ctx.players.length;
      const maxPlayingPlayers = ctx.formData.courts * 4;

      // Exactly matching player count - no rotation
      if (playerCount === maxPlayingPlayers) {
        return {
          isValid: false,
          severity: 'error',
          message: `Cannot use parallel mode with exactly ${playerCount} players on ${ctx.formData.courts} court(s). Players won't rotate between courts. Please use Sequential mode instead, or add more players for rotation.`,
          category: 'courts',
          field: 'mode',
        };
      }

      // Not enough players
      if (playerCount < maxPlayingPlayers) {
        return {
          isValid: false,
          severity: 'error',
          message: `Parallel mode with ${ctx.formData.courts} courts requires at least ${maxPlayingPlayers} players. Current: ${playerCount} players`,
          category: 'courts',
          field: 'mode',
        };
      }
    }
    return null;
  },

  (ctx) => {
    if (ctx.formData.mode === 'parallel' && ctx.formData.type === 'mixed_mexicano') {
      const maleCount = ctx.players.filter((p) => p.gender === 'male').length;
      const femaleCount = ctx.players.filter((p) => p.gender === 'female').length;
      const malesNeeded = (ctx.formData.courts * 4) / 2;
      const femalesNeeded = (ctx.formData.courts * 4) / 2;

      if (maleCount < malesNeeded || femaleCount < femalesNeeded) {
        return {
          isValid: false,
          severity: 'error',
          message: `Mixed Mexicano with ${ctx.formData.courts} court(s) in parallel mode needs at least ${malesNeeded} males and ${femalesNeeded} females. Current: ${maleCount} males, ${femaleCount} females`,
          category: 'courts',
          field: 'mode',
        };
      }
    }
    return null;
  },

  // ============================================
  // SCORING MODE VALIDATION
  // ============================================

  (ctx) => {
    // Tennis should not use points mode
    if (ctx.formData.sport === 'tennis' && ctx.formData.scoring_mode === 'points') {
      return {
        isValid: false,
        severity: 'error',
        message: 'Tennis uses game-based scoring. Please select "First to X Games" or "Total Games"',
        category: 'scoring',
        field: 'scoring_mode',
      };
    }
    return null;
  },

  (ctx) => {
    // Padel with game modes is unusual but allowed (show warning)
    if (ctx.formData.sport === 'padel' && (ctx.formData.scoring_mode === 'first_to' || ctx.formData.scoring_mode === 'total_games')) {
      return {
        isValid: true,
        severity: 'warning',
        message: 'Padel typically uses points scoring. Game-based scoring is allowed but unusual.',
        category: 'scoring',
        field: 'scoring_mode',
      };
    }
    return null;
  },

  // ============================================
  // SCORING CONFIGURATION VALIDATION
  // ============================================

  (ctx) => {
    if (ctx.formData.points_per_match < 1 || ctx.formData.points_per_match > 100) {
      return {
        isValid: false,
        severity: 'error',
        message: 'Points/Games per match must be between 1 and 100',
        category: 'scoring',
        field: 'points_per_match',
      };
    }
    return null;
  },

  (ctx) => {
    if (ctx.formData.games_to_win && (ctx.formData.games_to_win < 1 || ctx.formData.games_to_win > 10)) {
      return {
        isValid: false,
        severity: 'error',
        message: 'Games to win must be between 1 and 10',
        category: 'scoring',
        field: 'games_to_win',
      };
    }
    return null;
  },

  (ctx) => {
    if (ctx.formData.total_games && (ctx.formData.total_games < 1 || ctx.formData.total_games > 15)) {
      return {
        isValid: false,
        severity: 'error',
        message: 'Total games must be between 1 and 15',
        category: 'scoring',
        field: 'total_games',
      };
    }
    return null;
  },

  (ctx) => {
    if (ctx.formData.points_per_game && (ctx.formData.points_per_game < 4 || ctx.formData.points_per_game > 32)) {
      return {
        isValid: false,
        severity: 'error',
        message: 'Points per game must be between 4 and 32',
        category: 'scoring',
        field: 'points_per_game',
      };
    }
    return null;
  },
];

/**
 * Validate session form data and players
 * @returns Array of validation results (empty if all valid)
 */
export function validateSession(
  formData: SessionFormData,
  players: PlayerFormData[]
): ValidationResult[] {
  const context: ValidationRuleContext = { formData, players };
  const results: ValidationResult[] = [];

  for (const rule of VALIDATION_RULES) {
    const result = rule(context);
    if (result) {
      results.push(result);
    }
  }

  return results;
}

/**
 * Get only error-level validation results
 */
export function getValidationErrors(
  formData: SessionFormData,
  players: PlayerFormData[]
): ValidationResult[] {
  return validateSession(formData, players).filter(r => r.severity === 'error');
}

/**
 * Get only warning-level validation results
 */
export function getValidationWarnings(
  formData: SessionFormData,
  players: PlayerFormData[]
): ValidationResult[] {
  return validateSession(formData, players).filter(r => r.severity === 'warning');
}

/**
 * Check if session configuration is valid (no errors)
 */
export function isSessionValid(
  formData: SessionFormData,
  players: PlayerFormData[]
): boolean {
  return getValidationErrors(formData, players).length === 0;
}

/**
 * Group validation results by category
 */
export function groupValidationsByCategory(
  results: ValidationResult[]
): Record<ValidationCategory, ValidationResult[]> {
  const grouped: Record<ValidationCategory, ValidationResult[]> = {
    session_info: [],
    players: [],
    courts: [],
    scoring: [],
    game_type: [],
  };

  results.forEach(result => {
    grouped[result.category].push(result);
  });

  return grouped;
}
