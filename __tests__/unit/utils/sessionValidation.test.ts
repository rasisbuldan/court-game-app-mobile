/**
 * Session Validation Unit Tests
 *
 * Comprehensive tests for all session validation utilities.
 * Tests cover validation rules, helper functions, edge cases, and boundary conditions.
 */

import {
  VALIDATION_RULES,
  validateSession,
  getValidationErrors,
  getValidationWarnings,
  isSessionValid,
  groupValidationsByCategory,
  ValidationResult,
  ValidationRuleContext,
} from '../../../utils/sessionValidation';
import { SessionFormData } from '../../../hooks/useSessionForm';
import { PlayerFormData } from '../../../hooks/usePlayerForm';

describe('Session Validation Utils', () => {
  // ==========================================================================
  // MOCK DATA HELPERS
  // ==========================================================================

  /**
   * Create a valid base session form data
   */
  const createValidSessionData = (overrides?: Partial<SessionFormData>): SessionFormData => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    return {
      name: 'Test Session',
      club_name: 'Test Club',
      club_id: null,
      sport: 'padel',
      type: 'mexicano',
      mode: 'sequential',
      scoring_mode: 'points',
      courts: 1,
      points_per_match: 21,
      game_date: dateStr,
      game_time: '19:00',
      duration_hours: 2,
      matchup_preference: 'any',
      games_to_win: 6,
      total_games: 6,
      points_per_game: 11,
      win_margin: 0,
      enable_tiebreak: false,
      tiebreak_points: 7,
      ...overrides,
    };
  };

  /**
   * Create valid player data
   */
  const createPlayers = (count: number, genderPattern?: 'balanced' | 'all-male' | 'all-female'): PlayerFormData[] => {
    const players: PlayerFormData[] = [];

    for (let i = 0; i < count; i++) {
      let gender: 'male' | 'female' | 'unspecified' = 'unspecified';

      if (genderPattern === 'balanced') {
        gender = i % 2 === 0 ? 'male' : 'female';
      } else if (genderPattern === 'all-male') {
        gender = 'male';
      } else if (genderPattern === 'all-female') {
        gender = 'female';
      }

      players.push({
        id: `player-${i}`,
        name: `Player ${i + 1}`,
        gender,
      });
    }

    return players;
  };

  /**
   * Create players with partnerships
   */
  const createPlayersWithPartners = (pairCount: number): PlayerFormData[] => {
    const players: PlayerFormData[] = [];

    for (let i = 0; i < pairCount; i++) {
      const player1Id = `player-${i * 2}`;
      const player2Id = `player-${i * 2 + 1}`;

      players.push(
        {
          id: player1Id,
          name: `Player ${i * 2 + 1}`,
          gender: 'unspecified',
          partnerId: player2Id,
        },
        {
          id: player2Id,
          name: `Player ${i * 2 + 2}`,
          gender: 'unspecified',
          partnerId: player1Id,
        }
      );
    }

    return players;
  };

  // ==========================================================================
  // SESSION INFO VALIDATION
  // ==========================================================================

  describe('Session Name Validation', () => {
    it('should reject empty session name', () => {
      const formData = createValidSessionData({ name: '' });
      const players = createPlayers(4);
      const errors = getValidationErrors(formData, players);

      expect(errors.some(e => e.message === 'Session name is required')).toBe(true);
      expect(errors.some(e => e.category === 'session_info')).toBe(true);
    });

    it('should reject session name with only whitespace', () => {
      const formData = createValidSessionData({ name: '   ' });
      const players = createPlayers(4);
      const errors = getValidationErrors(formData, players);

      expect(errors.some(e => e.message === 'Session name is required')).toBe(true);
    });

    it('should reject session name shorter than 3 characters', () => {
      const formData = createValidSessionData({ name: 'AB' });
      const players = createPlayers(4);
      const errors = getValidationErrors(formData, players);

      expect(errors.some(e => e.message === 'Session name must be at least 3 characters')).toBe(true);
    });

    it('should accept session name with exactly 3 characters', () => {
      const formData = createValidSessionData({ name: 'ABC' });
      const players = createPlayers(4);
      const errors = getValidationErrors(formData, players);

      expect(errors.some(e => e.field === 'name')).toBe(false);
    });

    it('should reject session name longer than 60 characters', () => {
      const formData = createValidSessionData({ name: 'A'.repeat(61) });
      const players = createPlayers(4);
      const errors = getValidationErrors(formData, players);

      expect(errors.some(e => e.message === 'Session name must be at most 60 characters')).toBe(true);
    });

    it('should accept session name with exactly 60 characters', () => {
      const formData = createValidSessionData({ name: 'A'.repeat(60) });
      const players = createPlayers(4);
      const errors = getValidationErrors(formData, players);

      expect(errors.some(e => e.field === 'name')).toBe(false);
    });

    it('should trim whitespace before validation', () => {
      const formData = createValidSessionData({ name: '  Valid Name  ' });
      const players = createPlayers(4);
      const errors = getValidationErrors(formData, players);

      expect(errors.some(e => e.field === 'name')).toBe(false);
    });
  });

  describe('Game Date Validation', () => {
    it('should reject missing game date', () => {
      const formData = createValidSessionData({ game_date: '' });
      const players = createPlayers(4);
      const errors = getValidationErrors(formData, players);

      expect(errors.some(e => e.message === 'Game date is required')).toBe(true);
      expect(errors.some(e => e.field === 'game_date')).toBe(true);
    });

    it('should reject past date and time', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toISOString().split('T')[0];

      const formData = createValidSessionData({
        game_date: dateStr,
        game_time: '10:00'
      });
      const players = createPlayers(4);
      const errors = getValidationErrors(formData, players);

      expect(errors.some(e => e.message === 'Session date and time must be in the future')).toBe(true);
    });

    it('should accept future date and time', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      const formData = createValidSessionData({
        game_date: dateStr,
        game_time: '19:00'
      });
      const players = createPlayers(4);
      const errors = getValidationErrors(formData, players);

      expect(errors.some(e => e.field === 'game_date')).toBe(false);
    });

    it('should handle invalid date format gracefully', () => {
      const formData = createValidSessionData({
        game_date: 'invalid-date',
        game_time: '19:00'
      });
      const players = createPlayers(4);

      // Should not throw error, just not validate the date/time constraint
      expect(() => validateSession(formData, players)).not.toThrow();
    });
  });

  describe('Duration Validation', () => {
    it('should reject duration below minimum (0.5 hours)', () => {
      const formData = createValidSessionData({ duration_hours: 0.4 });
      const players = createPlayers(4);
      const errors = getValidationErrors(formData, players);

      expect(errors.some(e => e.message === 'Duration must be between 0.5 and 24 hours')).toBe(true);
    });

    it('should accept minimum duration (0.5 hours)', () => {
      const formData = createValidSessionData({ duration_hours: 0.5 });
      const players = createPlayers(4);
      const errors = getValidationErrors(formData, players);

      expect(errors.some(e => e.field === 'duration_hours')).toBe(false);
    });

    it('should reject duration above maximum (24 hours)', () => {
      const formData = createValidSessionData({ duration_hours: 25 });
      const players = createPlayers(4);
      const errors = getValidationErrors(formData, players);

      expect(errors.some(e => e.message === 'Duration must be between 0.5 and 24 hours')).toBe(true);
    });

    it('should accept maximum duration (24 hours)', () => {
      const formData = createValidSessionData({ duration_hours: 24 });
      const players = createPlayers(4);
      const errors = getValidationErrors(formData, players);

      expect(errors.some(e => e.field === 'duration_hours')).toBe(false);
    });
  });

  // ==========================================================================
  // PLAYER VALIDATION
  // ==========================================================================

  describe('Player Count Validation', () => {
    it('should reject less than 4 players', () => {
      const formData = createValidSessionData();
      const players = createPlayers(3);
      const errors = getValidationErrors(formData, players);

      expect(errors.some(e => e.message === 'At least 4 players are required')).toBe(true);
      expect(errors.some(e => e.category === 'players')).toBe(true);
    });

    it('should accept exactly 4 players', () => {
      const formData = createValidSessionData();
      const players = createPlayers(4);
      const errors = getValidationErrors(formData, players);

      expect(errors.some(e => e.category === 'players')).toBe(false);
    });

    it('should accept more than 4 players', () => {
      const formData = createValidSessionData();
      const players = createPlayers(8);
      const errors = getValidationErrors(formData, players);

      expect(errors.some(e => e.category === 'players')).toBe(false);
    });
  });

  // ==========================================================================
  // GAME TYPE VALIDATION
  // ==========================================================================

  describe('Mixed Mexicano Validation', () => {
    it('should require equal male and female players', () => {
      const formData = createValidSessionData({ type: 'mixed_mexicano' });
      const players = [
        ...createPlayers(3, 'all-male'),
        ...createPlayers(2, 'all-female'),
      ];
      const errors = getValidationErrors(formData, players);

      expect(errors.some(e =>
        e.message.includes('Mixed Mexicano requires equal number of male and female players')
      )).toBe(true);
    });

    it('should accept equal male and female players', () => {
      const formData = createValidSessionData({ type: 'mixed_mexicano' });
      const players = createPlayers(8, 'balanced');
      const errors = getValidationErrors(formData, players);

      expect(errors.some(e => e.field === 'type')).toBe(false);
    });

    it('should require at least 2 males and 2 females', () => {
      const formData = createValidSessionData({ type: 'mixed_mexicano' });
      const players = [
        { id: '1', name: 'M1', gender: 'male' as const },
        { id: '2', name: 'F1', gender: 'female' as const },
      ];
      const errors = getValidationErrors(formData, players);

      expect(errors.some(e =>
        e.message === 'Mixed Mexicano requires at least 2 males and 2 females'
      )).toBe(true);
    });

    it('should show player count in error message', () => {
      const formData = createValidSessionData({ type: 'mixed_mexicano' });
      const players = [
        ...createPlayers(3, 'all-male'),
        ...createPlayers(1, 'all-female'),
      ];
      const errors = getValidationErrors(formData, players);

      expect(errors.some(e => e.message.includes('3 males, 1 females'))).toBe(true);
    });
  });

  describe('Fixed Partner Validation', () => {
    it('should require even number of players', () => {
      const formData = createValidSessionData({ type: 'fixed_partner' });
      const players = createPlayers(5);
      const errors = getValidationErrors(formData, players);

      expect(errors.some(e =>
        e.message === 'Fixed Partner mode requires an even number of players'
      )).toBe(true);
    });

    it('should accept even number of players', () => {
      const formData = createValidSessionData({ type: 'fixed_partner' });
      const players = createPlayersWithPartners(2);
      const errors = getValidationErrors(formData, players);

      expect(errors.length).toBe(0);
    });

    it('should require all players to have partners', () => {
      const formData = createValidSessionData({ type: 'fixed_partner' });
      const players = createPlayers(4); // No partners assigned
      const errors = getValidationErrors(formData, players);

      expect(errors.some(e =>
        e.message.includes('All players must have partners in Fixed Partner mode')
      )).toBe(true);
    });

    it('should show count of players without partners', () => {
      const formData = createValidSessionData({ type: 'fixed_partner' });
      const players = createPlayers(4);
      const errors = getValidationErrors(formData, players);

      expect(errors.some(e => e.message.includes('4 player(s) missing partners'))).toBe(true);
    });

    it('should require mutual partnerships', () => {
      const formData = createValidSessionData({ type: 'fixed_partner' });
      const players: PlayerFormData[] = [
        { id: '1', name: 'P1', gender: 'unspecified', partnerId: '2' },
        { id: '2', name: 'P2', gender: 'unspecified', partnerId: '3' }, // Wrong partner
        { id: '3', name: 'P3', gender: 'unspecified', partnerId: '4' },
        { id: '4', name: 'P4', gender: 'unspecified', partnerId: '3' },
      ];
      const errors = getValidationErrors(formData, players);

      expect(errors.some(e => e.message === 'All partnerships must be mutual')).toBe(true);
    });

    it('should accept valid mutual partnerships', () => {
      const formData = createValidSessionData({ type: 'fixed_partner' });
      const players = createPlayersWithPartners(2);
      const errors = getValidationErrors(formData, players);

      expect(errors.length).toBe(0);
    });
  });

  // ==========================================================================
  // MATCHUP PREFERENCE VALIDATION
  // ==========================================================================

  describe('Mixed Matchup Validation', () => {
    it('should require both genders for mixed_only preference', () => {
      const formData = createValidSessionData({ matchup_preference: 'mixed_only' });
      const players = createPlayers(4, 'all-male');
      const errors = getValidationErrors(formData, players);

      expect(errors.some(e =>
        e.message === 'Mixed matchups require both male and female players'
      )).toBe(true);
    });

    it('should require at least 2 of each gender for mixed_only', () => {
      const formData = createValidSessionData({ matchup_preference: 'mixed_only' });
      const players = [
        { id: '1', name: 'M1', gender: 'male' as const },
        { id: '2', name: 'F1', gender: 'female' as const },
        { id: '3', name: 'F2', gender: 'female' as const },
        { id: '4', name: 'F3', gender: 'female' as const },
      ];
      const errors = getValidationErrors(formData, players);

      expect(errors.some(e =>
        e.message === 'Mixed matchups require at least 2 males and 2 females'
      )).toBe(true);
    });

    it('should accept valid mixed matchup setup', () => {
      const formData = createValidSessionData({ matchup_preference: 'mixed_only' });
      const players = createPlayers(8, 'balanced');
      const errors = getValidationErrors(formData, players);

      expect(errors.some(e => e.field === 'matchup_preference')).toBe(false);
    });
  });

  // ==========================================================================
  // COURTS VALIDATION
  // ==========================================================================

  describe('Court Count Validation', () => {
    it('should reject less than 1 court', () => {
      const formData = createValidSessionData({ courts: 0 });
      const players = createPlayers(4);
      const errors = getValidationErrors(formData, players);

      expect(errors.some(e => e.message === 'Courts must be between 1 and 10')).toBe(true);
    });

    it('should accept 1 court', () => {
      const formData = createValidSessionData({ courts: 1 });
      const players = createPlayers(4);
      const errors = getValidationErrors(formData, players);

      expect(errors.some(e => e.field === 'courts')).toBe(false);
    });

    it('should reject more than 10 courts', () => {
      const formData = createValidSessionData({ courts: 11 });
      const players = createPlayers(44);
      const errors = getValidationErrors(formData, players);

      expect(errors.some(e => e.message === 'Courts must be between 1 and 10')).toBe(true);
    });

    it('should accept 10 courts', () => {
      const formData = createValidSessionData({ courts: 10, mode: 'sequential' });
      const players = createPlayers(40);
      const errors = getValidationErrors(formData, players);

      expect(errors.some(e => e.field === 'courts')).toBe(false);
    });
  });

  // ==========================================================================
  // PLAY MODE VALIDATION
  // ==========================================================================

  describe('Parallel Mode Validation', () => {
    it('should require 2-4 courts for parallel mode', () => {
      const formData = createValidSessionData({ mode: 'parallel', courts: 1 });
      const players = createPlayers(4);
      const errors = getValidationErrors(formData, players);

      expect(errors.some(e => e.message === 'Parallel mode requires 2-4 courts')).toBe(true);
    });

    it('should accept 2 courts for parallel mode', () => {
      const formData = createValidSessionData({ mode: 'parallel', courts: 2 });
      const players = createPlayers(12);
      const errors = getValidationErrors(formData, players);

      expect(errors.some(e => e.field === 'mode')).toBe(false);
    });

    it('should accept 4 courts for parallel mode', () => {
      const formData = createValidSessionData({ mode: 'parallel', courts: 4 });
      const players = createPlayers(20);
      const errors = getValidationErrors(formData, players);

      expect(errors.some(e => e.field === 'mode')).toBe(false);
    });

    it('should reject 5 courts for parallel mode', () => {
      const formData = createValidSessionData({ mode: 'parallel', courts: 5 });
      const players = createPlayers(24);
      const errors = getValidationErrors(formData, players);

      expect(errors.some(e => e.message === 'Parallel mode requires 2-4 courts')).toBe(true);
    });

    it('should reject exactly matching player count (no rotation)', () => {
      const formData = createValidSessionData({ mode: 'parallel', courts: 2 });
      const players = createPlayers(8); // Exactly 2 courts * 4 players
      const errors = getValidationErrors(formData, players);

      expect(errors.some(e =>
        e.message.includes('Cannot use parallel mode with exactly 8 players')
      )).toBe(true);
    });

    it('should require minimum players for parallel mode', () => {
      const formData = createValidSessionData({ mode: 'parallel', courts: 3 });
      const players = createPlayers(10); // Less than 3 * 4 = 12
      const errors = getValidationErrors(formData, players);

      expect(errors.some(e =>
        e.message.includes('Parallel mode with 3 courts requires at least 12 players')
      )).toBe(true);
    });

    it('should show current player count in error', () => {
      const formData = createValidSessionData({ mode: 'parallel', courts: 3 });
      const players = createPlayers(10);
      const errors = getValidationErrors(formData, players);

      expect(errors.some(e => e.message.includes('Current: 10 players'))).toBe(true);
    });
  });

  describe('Parallel Mode with Mixed Mexicano', () => {
    it('should validate gender balance for parallel mixed mexicano', () => {
      const formData = createValidSessionData({
        mode: 'parallel',
        courts: 2,
        type: 'mixed_mexicano'
      });
      const players = [
        ...createPlayers(6, 'all-male'),
        ...createPlayers(2, 'all-female'),
      ];
      const errors = getValidationErrors(formData, players);

      expect(errors.some(e =>
        e.message.includes('Mixed Mexicano with 2 court(s) in parallel mode')
      )).toBe(true);
    });

    it('should accept balanced genders for parallel mixed mexicano', () => {
      const formData = createValidSessionData({
        mode: 'parallel',
        courts: 2,
        type: 'mixed_mexicano'
      });
      const players = createPlayers(12, 'balanced');
      const errors = getValidationErrors(formData, players);

      expect(errors.length).toBe(0);
    });

    it('should show required gender counts in error', () => {
      const formData = createValidSessionData({
        mode: 'parallel',
        courts: 3,
        type: 'mixed_mexicano'
      });
      const players = [
        ...createPlayers(8, 'all-male'),
        ...createPlayers(4, 'all-female'),
      ];
      const errors = getValidationErrors(formData, players);

      expect(errors.some(e =>
        e.message.includes('needs at least 6 males and 6 females')
      )).toBe(true);
    });
  });

  // ==========================================================================
  // SCORING MODE VALIDATION
  // ==========================================================================

  describe('Tennis Scoring Validation', () => {
    it('should reject points mode for tennis', () => {
      const formData = createValidSessionData({
        sport: 'tennis',
        scoring_mode: 'points'
      });
      const players = createPlayers(4);
      const errors = getValidationErrors(formData, players);

      expect(errors.some(e =>
        e.message === 'Tennis uses game-based scoring. Please select "First to X Games" or "Total Games"'
      )).toBe(true);
    });

    it('should accept first_to mode for tennis', () => {
      const formData = createValidSessionData({
        sport: 'tennis',
        scoring_mode: 'first_to'
      });
      const players = createPlayers(4);
      const errors = getValidationErrors(formData, players);

      expect(errors.some(e => e.category === 'scoring' && e.severity === 'error')).toBe(false);
    });

    it('should accept total_games mode for tennis', () => {
      const formData = createValidSessionData({
        sport: 'tennis',
        scoring_mode: 'total_games'
      });
      const players = createPlayers(4);
      const errors = getValidationErrors(formData, players);

      expect(errors.some(e => e.category === 'scoring' && e.severity === 'error')).toBe(false);
    });
  });

  describe('Padel Scoring Warnings', () => {
    it('should warn when using game modes for padel', () => {
      const formData = createValidSessionData({
        sport: 'padel',
        scoring_mode: 'first_to'
      });
      const players = createPlayers(4);
      const warnings = getValidationWarnings(formData, players);

      expect(warnings.some(w =>
        w.message === 'Padel typically uses points scoring. Game-based scoring is allowed but unusual.'
      )).toBe(true);
    });

    it('should not error when using game modes for padel', () => {
      const formData = createValidSessionData({
        sport: 'padel',
        scoring_mode: 'total_games'
      });
      const players = createPlayers(4);
      const errors = getValidationErrors(formData, players);

      expect(errors.some(e => e.field === 'scoring_mode')).toBe(false);
    });

    it('should not warn when using points mode for padel', () => {
      const formData = createValidSessionData({
        sport: 'padel',
        scoring_mode: 'points'
      });
      const players = createPlayers(4);
      const warnings = getValidationWarnings(formData, players);

      expect(warnings.some(w => w.field === 'scoring_mode')).toBe(false);
    });
  });

  // ==========================================================================
  // SCORING CONFIGURATION VALIDATION
  // ==========================================================================

  describe('Points Per Match Validation', () => {
    it('should reject points below minimum (1)', () => {
      const formData = createValidSessionData({ points_per_match: 0 });
      const players = createPlayers(4);
      const errors = getValidationErrors(formData, players);

      expect(errors.some(e =>
        e.message === 'Points/Games per match must be between 1 and 100'
      )).toBe(true);
    });

    it('should accept minimum points (1)', () => {
      const formData = createValidSessionData({ points_per_match: 1 });
      const players = createPlayers(4);
      const errors = getValidationErrors(formData, players);

      expect(errors.some(e => e.field === 'points_per_match')).toBe(false);
    });

    it('should reject points above maximum (100)', () => {
      const formData = createValidSessionData({ points_per_match: 101 });
      const players = createPlayers(4);
      const errors = getValidationErrors(formData, players);

      expect(errors.some(e =>
        e.message === 'Points/Games per match must be between 1 and 100'
      )).toBe(true);
    });

    it('should accept maximum points (100)', () => {
      const formData = createValidSessionData({ points_per_match: 100 });
      const players = createPlayers(4);
      const errors = getValidationErrors(formData, players);

      expect(errors.some(e => e.field === 'points_per_match')).toBe(false);
    });
  });

  describe('Games To Win Validation', () => {
    it('should accept games_to_win of 0 (truthy check)', () => {
      // Validation only triggers if games_to_win is truthy
      const formData = createValidSessionData({ games_to_win: 0 });
      const players = createPlayers(4);
      const errors = getValidationErrors(formData, players);

      // 0 is falsy, so validation doesn't run
      expect(errors.some(e => e.field === 'games_to_win')).toBe(false);
    });

    it('should accept minimum games (1)', () => {
      const formData = createValidSessionData({ games_to_win: 1 });
      const players = createPlayers(4);
      const errors = getValidationErrors(formData, players);

      expect(errors.some(e => e.field === 'games_to_win')).toBe(false);
    });

    it('should reject games above maximum (10)', () => {
      const formData = createValidSessionData({ games_to_win: 11 });
      const players = createPlayers(4);
      const errors = getValidationErrors(formData, players);

      expect(errors.some(e => e.message === 'Games to win must be between 1 and 10')).toBe(true);
    });

    it('should accept maximum games (10)', () => {
      const formData = createValidSessionData({ games_to_win: 10 });
      const players = createPlayers(4);
      const errors = getValidationErrors(formData, players);

      expect(errors.some(e => e.field === 'games_to_win')).toBe(false);
    });

    it('should allow undefined games_to_win', () => {
      const formData = createValidSessionData({ games_to_win: undefined });
      const players = createPlayers(4);
      const errors = getValidationErrors(formData, players);

      expect(errors.some(e => e.field === 'games_to_win')).toBe(false);
    });
  });

  describe('Total Games Validation', () => {
    it('should accept total_games of 0 (truthy check)', () => {
      // Validation only triggers if total_games is truthy
      const formData = createValidSessionData({ total_games: 0 });
      const players = createPlayers(4);
      const errors = getValidationErrors(formData, players);

      // 0 is falsy, so validation doesn't run
      expect(errors.some(e => e.field === 'total_games')).toBe(false);
    });

    it('should accept minimum total games (1)', () => {
      const formData = createValidSessionData({ total_games: 1 });
      const players = createPlayers(4);
      const errors = getValidationErrors(formData, players);

      expect(errors.some(e => e.field === 'total_games')).toBe(false);
    });

    it('should reject total games above maximum (15)', () => {
      const formData = createValidSessionData({ total_games: 16 });
      const players = createPlayers(4);
      const errors = getValidationErrors(formData, players);

      expect(errors.some(e => e.message === 'Total games must be between 1 and 15')).toBe(true);
    });

    it('should accept maximum total games (15)', () => {
      const formData = createValidSessionData({ total_games: 15 });
      const players = createPlayers(4);
      const errors = getValidationErrors(formData, players);

      expect(errors.some(e => e.field === 'total_games')).toBe(false);
    });

    it('should allow undefined total_games', () => {
      const formData = createValidSessionData({ total_games: undefined });
      const players = createPlayers(4);
      const errors = getValidationErrors(formData, players);

      expect(errors.some(e => e.field === 'total_games')).toBe(false);
    });
  });

  describe('Points Per Game Validation', () => {
    it('should reject points below minimum (4)', () => {
      const formData = createValidSessionData({ points_per_game: 3 });
      const players = createPlayers(4);
      const errors = getValidationErrors(formData, players);

      expect(errors.some(e => e.message === 'Points per game must be between 4 and 32')).toBe(true);
    });

    it('should accept minimum points (4)', () => {
      const formData = createValidSessionData({ points_per_game: 4 });
      const players = createPlayers(4);
      const errors = getValidationErrors(formData, players);

      expect(errors.some(e => e.field === 'points_per_game')).toBe(false);
    });

    it('should reject points above maximum (32)', () => {
      const formData = createValidSessionData({ points_per_game: 33 });
      const players = createPlayers(4);
      const errors = getValidationErrors(formData, players);

      expect(errors.some(e => e.message === 'Points per game must be between 4 and 32')).toBe(true);
    });

    it('should accept maximum points (32)', () => {
      const formData = createValidSessionData({ points_per_game: 32 });
      const players = createPlayers(4);
      const errors = getValidationErrors(formData, players);

      expect(errors.some(e => e.field === 'points_per_game')).toBe(false);
    });

    it('should allow undefined points_per_game', () => {
      const formData = createValidSessionData({ points_per_game: undefined });
      const players = createPlayers(4);
      const errors = getValidationErrors(formData, players);

      expect(errors.some(e => e.field === 'points_per_game')).toBe(false);
    });
  });

  // ==========================================================================
  // HELPER FUNCTIONS
  // ==========================================================================

  describe('validateSession', () => {
    it('should return empty array for valid session', () => {
      const formData = createValidSessionData();
      const players = createPlayers(4);
      const results = validateSession(formData, players);

      expect(results).toEqual([]);
    });

    it('should return multiple errors for invalid session', () => {
      const formData = createValidSessionData({
        name: '',
        courts: 0,
        duration_hours: 0
      });
      const players = createPlayers(2);
      const results = validateSession(formData, players);

      expect(results.length).toBeGreaterThan(3);
    });

    it('should include both errors and warnings', () => {
      const formData = createValidSessionData({
        sport: 'padel',
        scoring_mode: 'first_to'
      });
      const players = createPlayers(4);
      const results = validateSession(formData, players);

      const errors = results.filter(r => r.severity === 'error');
      const warnings = results.filter(r => r.severity === 'warning');

      expect(errors.length).toBe(0);
      expect(warnings.length).toBeGreaterThan(0);
    });
  });

  describe('getValidationErrors', () => {
    it('should return only errors', () => {
      const formData = createValidSessionData({
        name: '',
        sport: 'padel',
        scoring_mode: 'first_to'
      });
      const players = createPlayers(4);
      const errors = getValidationErrors(formData, players);

      expect(errors.every(e => e.severity === 'error')).toBe(true);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should return empty array when no errors', () => {
      const formData = createValidSessionData();
      const players = createPlayers(4);
      const errors = getValidationErrors(formData, players);

      expect(errors).toEqual([]);
    });
  });

  describe('getValidationWarnings', () => {
    it('should return only warnings', () => {
      const formData = createValidSessionData({
        sport: 'padel',
        scoring_mode: 'first_to'
      });
      const players = createPlayers(4);
      const warnings = getValidationWarnings(formData, players);

      expect(warnings.every(w => w.severity === 'warning')).toBe(true);
      expect(warnings.length).toBeGreaterThan(0);
    });

    it('should return empty array when no warnings', () => {
      const formData = createValidSessionData();
      const players = createPlayers(4);
      const warnings = getValidationWarnings(formData, players);

      expect(warnings).toEqual([]);
    });
  });

  describe('isSessionValid', () => {
    it('should return true for valid session', () => {
      const formData = createValidSessionData();
      const players = createPlayers(4);
      const isValid = isSessionValid(formData, players);

      expect(isValid).toBe(true);
    });

    it('should return false for invalid session', () => {
      const formData = createValidSessionData({ name: '' });
      const players = createPlayers(4);
      const isValid = isSessionValid(formData, players);

      expect(isValid).toBe(false);
    });

    it('should return true even with warnings', () => {
      const formData = createValidSessionData({
        sport: 'padel',
        scoring_mode: 'first_to'
      });
      const players = createPlayers(4);
      const isValid = isSessionValid(formData, players);

      expect(isValid).toBe(true);
    });
  });

  describe('groupValidationsByCategory', () => {
    it('should group validations by category', () => {
      const formData = createValidSessionData({
        name: '',
        courts: 0,
      });
      const players = createPlayers(2);
      const results = validateSession(formData, players);
      const grouped = groupValidationsByCategory(results);

      expect(grouped.session_info.length).toBeGreaterThan(0);
      expect(grouped.courts.length).toBeGreaterThan(0);
      expect(grouped.players.length).toBeGreaterThan(0);
    });

    it('should initialize all categories', () => {
      const grouped = groupValidationsByCategory([]);

      expect(grouped).toHaveProperty('session_info');
      expect(grouped).toHaveProperty('players');
      expect(grouped).toHaveProperty('courts');
      expect(grouped).toHaveProperty('scoring');
      expect(grouped).toHaveProperty('game_type');
      expect(grouped.session_info).toEqual([]);
    });

    it('should correctly categorize each validation', () => {
      const validations: ValidationResult[] = [
        {
          isValid: false,
          severity: 'error',
          message: 'Session name is required',
          category: 'session_info',
          field: 'name',
        },
        {
          isValid: false,
          severity: 'error',
          message: 'At least 4 players are required',
          category: 'players',
        },
      ];

      const grouped = groupValidationsByCategory(validations);

      expect(grouped.session_info).toHaveLength(1);
      expect(grouped.players).toHaveLength(1);
      expect(grouped.courts).toHaveLength(0);
    });
  });

  // ==========================================================================
  // EDGE CASES AND COMPLEX SCENARIOS
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle empty players array', () => {
      const formData = createValidSessionData();
      const players: PlayerFormData[] = [];

      expect(() => validateSession(formData, players)).not.toThrow();
      const errors = getValidationErrors(formData, players);
      expect(errors.some(e => e.category === 'players')).toBe(true);
    });

    it('should handle large number of players', () => {
      const formData = createValidSessionData();
      const players = createPlayers(100);

      expect(() => validateSession(formData, players)).not.toThrow();
      const isValid = isSessionValid(formData, players);
      expect(isValid).toBe(true);
    });

    it('should validate all rules in sequence', () => {
      // There are 19 validation rules defined
      expect(VALIDATION_RULES.length).toBe(19);
    });

    it('should handle null partnerId', () => {
      const formData = createValidSessionData({ type: 'fixed_partner' });
      const players: PlayerFormData[] = [
        { id: '1', name: 'P1', gender: 'unspecified', partnerId: undefined },
        { id: '2', name: 'P2', gender: 'unspecified', partnerId: undefined },
        { id: '3', name: 'P3', gender: 'unspecified', partnerId: undefined },
        { id: '4', name: 'P4', gender: 'unspecified', partnerId: undefined },
      ];

      const errors = getValidationErrors(formData, players);
      expect(errors.some(e => e.message.includes('missing partners'))).toBe(true);
    });

    it('should handle multiple simultaneous violations', () => {
      const formData = createValidSessionData({
        name: 'A',
        courts: 20,
        duration_hours: 100,
        type: 'mixed_mexicano',
        mode: 'parallel',
      });
      const players = createPlayers(3, 'all-male');
      const errors = getValidationErrors(formData, players);

      expect(errors.length).toBeGreaterThan(5);
    });
  });

  describe('VALIDATION_RULES Array', () => {
    it('should have correct number of validation rules', () => {
      // There are 19 validation rules defined
      expect(VALIDATION_RULES.length).toBe(19);
    });

    it('should have all rules return null for valid context', () => {
      const formData = createValidSessionData();
      const players = createPlayers(4);
      const context: ValidationRuleContext = { formData, players };

      const results = VALIDATION_RULES.map(rule => rule(context));
      const failures = results.filter(r => r !== null);

      expect(failures).toEqual([]);
    });

    it('should have rules that return ValidationResult when invalid', () => {
      const formData = createValidSessionData({ name: '' });
      const players = createPlayers(4);
      const context: ValidationRuleContext = { formData, players };

      const results = VALIDATION_RULES.map(rule => rule(context));
      const failures = results.filter(r => r !== null);

      expect(failures.length).toBeGreaterThan(0);
      failures.forEach(result => {
        expect(result).toHaveProperty('isValid');
        expect(result).toHaveProperty('severity');
        expect(result).toHaveProperty('message');
        expect(result).toHaveProperty('category');
      });
    });
  });
});
