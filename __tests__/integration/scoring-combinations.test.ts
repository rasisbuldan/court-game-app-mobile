import { validateSession, isSessionValid } from '../../utils/sessionValidation';
import { SessionFormData } from '../../hooks/useSessionForm';
import { PlayerFormData } from '../../hooks/usePlayerForm';

/**
 * Comprehensive test suite for all scoring mode, court, and game type combinations
 * Ensures that all valid configurations work and all invalid ones are blocked
 */

// Helper to create base session form data
const createBaseSession = (overrides?: Partial<SessionFormData>): SessionFormData => ({
  name: 'Test Session',
  club_name: 'Test Club',
  club_id: null,
  sport: 'padel',
  type: 'mexicano',
  mode: 'sequential',
  scoring_mode: 'points',
  courts: 1,
  points_per_match: 21,
  game_date: '2025-12-31',
  game_time: '19:00',
  duration_hours: 2,
  matchup_preference: 'any',
  win_margin: 0,
  games_to_win: 6,
  total_games: 6,
  points_per_game: 11,
  enable_tiebreak: false,
  tiebreak_points: 7,
  ...overrides,
});

// Helper to create players
const createPlayers = (count: number, genderPattern?: 'male' | 'female' | 'alternating'): PlayerFormData[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `player-${i + 1}`,
    name: `Player ${i + 1}`,
    rating: 5,
    gender: genderPattern === 'alternating'
      ? (i % 2 === 0 ? 'male' : 'female')
      : genderPattern || 'male',
    partnerId: null,
  }));
};

describe('Scoring Combinations - Valid Configurations', () => {
  describe('Sport × Scoring Mode', () => {
    it('validates Padel + Points mode (4 points)', () => {
      const session = createBaseSession({
        sport: 'padel',
        scoring_mode: 'points',
        points_per_match: 4,
      });
      const players = createPlayers(4);

      expect(isSessionValid(session, players)).toBe(true);
    });

    it('validates Padel + Points mode (11 points)', () => {
      const session = createBaseSession({
        sport: 'padel',
        scoring_mode: 'points',
        points_per_match: 11,
      });
      const players = createPlayers(4);

      expect(isSessionValid(session, players)).toBe(true);
    });

    it('validates Padel + Points mode (21 points)', () => {
      const session = createBaseSession({
        sport: 'padel',
        scoring_mode: 'points',
        points_per_match: 21,
      });
      const players = createPlayers(4);

      expect(isSessionValid(session, players)).toBe(true);
    });

    it('validates Padel + First to X Games', () => {
      const session = createBaseSession({
        sport: 'padel',
        scoring_mode: 'first_to',
        points_per_match: 6,
      });
      const players = createPlayers(4);

      const results = validateSession(session, players);
      const errors = results.filter(r => r.severity === 'error');
      const warnings = results.filter(r => r.severity === 'warning');

      expect(errors.length).toBe(0);
      expect(warnings.length).toBe(1); // Should have warning about unusual config
      expect(warnings[0].message).toContain('Padel typically uses points scoring');
    });

    it('validates Tennis + First to 6 games', () => {
      const session = createBaseSession({
        sport: 'tennis',
        scoring_mode: 'first_to',
        points_per_match: 6,
      });
      const players = createPlayers(4);

      expect(isSessionValid(session, players)).toBe(true);
    });

    it('validates Tennis + Total Games', () => {
      const session = createBaseSession({
        sport: 'tennis',
        scoring_mode: 'total_games',
        points_per_match: 6,
      });
      const players = createPlayers(4);

      expect(isSessionValid(session, players)).toBe(true);
    });

    it('rejects Tennis + Points mode', () => {
      const session = createBaseSession({
        sport: 'tennis',
        scoring_mode: 'points',
        points_per_match: 21,
      });
      const players = createPlayers(4);

      const results = validateSession(session, players);
      const errors = results.filter(r => r.severity === 'error');

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('Tennis uses game-based scoring');
    });
  });

  describe('Game Type × Player Count', () => {
    it('validates Mexicano with 4 players', () => {
      const session = createBaseSession({ type: 'mexicano' });
      const players = createPlayers(4);

      expect(isSessionValid(session, players)).toBe(true);
    });

    it('validates Mexicano with 8 players', () => {
      const session = createBaseSession({ type: 'mexicano' });
      const players = createPlayers(8);

      expect(isSessionValid(session, players)).toBe(true);
    });

    it('validates Mexicano with 16 players', () => {
      const session = createBaseSession({ type: 'mexicano' });
      const players = createPlayers(16);

      expect(isSessionValid(session, players)).toBe(true);
    });

    it('validates Fixed Partner with 4 players (all paired)', () => {
      const players = createPlayers(4);
      // Pair them up
      players[0].partnerId = players[1].id;
      players[1].partnerId = players[0].id;
      players[2].partnerId = players[3].id;
      players[3].partnerId = players[2].id;

      const session = createBaseSession({ type: 'fixed_partner' });

      expect(isSessionValid(session, players)).toBe(true);
    });

    it('rejects Fixed Partner with odd number of players', () => {
      const session = createBaseSession({ type: 'fixed_partner' });
      const players = createPlayers(5);

      const results = validateSession(session, players);
      const errors = results.filter(r => r.severity === 'error');

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('even number of players');
    });

    it('rejects Fixed Partner with unpaired players', () => {
      const session = createBaseSession({ type: 'fixed_partner' });
      const players = createPlayers(4);
      // Don't set partners

      const results = validateSession(session, players);
      const errors = results.filter(r => r.severity === 'error');

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('must have partners');
    });

    it('validates Mixed Mexicano with equal M/F (4M + 4F)', () => {
      const males = createPlayers(4, 'male');
      const females = createPlayers(4, 'female');
      const players = [...males, ...females];

      const session = createBaseSession({
        type: 'mixed_mexicano',
        matchup_preference: 'mixed_only',
      });

      expect(isSessionValid(session, players)).toBe(true);
    });

    it('rejects Mixed Mexicano with unequal M/F', () => {
      const males = createPlayers(5, 'male');
      const females = createPlayers(3, 'female');
      const players = [...males, ...females];

      const session = createBaseSession({
        type: 'mixed_mexicano',
        matchup_preference: 'mixed_only',
      });

      const results = validateSession(session, players);
      const errors = results.filter(r => r.severity === 'error');

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('equal number of male and female players');
    });
  });

  describe('Play Mode × Courts × Players', () => {
    it('validates Sequential with 1 court, 4 players', () => {
      const session = createBaseSession({
        mode: 'sequential',
        courts: 1,
      });
      const players = createPlayers(4);

      expect(isSessionValid(session, players)).toBe(true);
    });

    it('validates Sequential with 2 courts, 8 players', () => {
      const session = createBaseSession({
        mode: 'sequential',
        courts: 2,
      });
      const players = createPlayers(8);

      expect(isSessionValid(session, players)).toBe(true);
    });

    it('validates Parallel with 2 courts, 9 players (rotation)', () => {
      const session = createBaseSession({
        mode: 'parallel',
        courts: 2,
      });
      const players = createPlayers(9); // 8 play, 1 sits

      expect(isSessionValid(session, players)).toBe(true);
    });

    it('validates Parallel with 3 courts, 16 players', () => {
      const session = createBaseSession({
        mode: 'parallel',
        courts: 3,
      });
      const players = createPlayers(16); // 12 play, 4 sit

      expect(isSessionValid(session, players)).toBe(true);
    });

    it('rejects Parallel with exactly courts×4 players (no rotation)', () => {
      const session = createBaseSession({
        mode: 'parallel',
        courts: 2,
      });
      const players = createPlayers(8); // Exactly 2×4 = 8

      const results = validateSession(session, players);
      const errors = results.filter(r => r.severity === 'error');

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('won\'t rotate between courts');
    });

    it('rejects Parallel with < courts×4 players', () => {
      const session = createBaseSession({
        mode: 'parallel',
        courts: 3,
      });
      const players = createPlayers(10); // Need at least 12

      const results = validateSession(session, players);
      const errors = results.filter(r => r.severity === 'error');

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('requires at least');
    });

    it('rejects Parallel with < 2 courts', () => {
      const session = createBaseSession({
        mode: 'parallel',
        courts: 1,
      });
      const players = createPlayers(8);

      const results = validateSession(session, players);
      const errors = results.filter(r => r.severity === 'error');

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('2-4 courts');
    });

    it('rejects Parallel with > 4 courts', () => {
      const session = createBaseSession({
        mode: 'parallel',
        courts: 5,
      });
      const players = createPlayers(24);

      const results = validateSession(session, players);
      const errors = results.filter(r => r.severity === 'error');

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('2-4 courts');
    });
  });

  describe('Mixed Mode × Parallel Courts', () => {
    it('validates Mixed Mexicano + Parallel with 2M+2F per court', () => {
      const males = createPlayers(6, 'male');
      const females = createPlayers(6, 'female');
      const players = [...males, ...females]; // 12 total

      const session = createBaseSession({
        type: 'mixed_mexicano',
        mode: 'parallel',
        courts: 2,
        matchup_preference: 'mixed_only',
      });

      expect(isSessionValid(session, players)).toBe(true);
    });

    it('rejects Mixed Mexicano + Parallel without enough males/females per court', () => {
      const males = createPlayers(3, 'male');
      const females = createPlayers(3, 'female');
      const players = [...males, ...females]; // 6 total, need at least 8 (2M+2F × 2 courts)

      const session = createBaseSession({
        type: 'mixed_mexicano',
        mode: 'parallel',
        courts: 2,
        matchup_preference: 'mixed_only',
      });

      const results = validateSession(session, players);
      const errors = results.filter(r => r.severity === 'error');

      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('Matchup Preferences', () => {
    it('validates mixed_only with sufficient male/female players', () => {
      const males = createPlayers(4, 'male');
      const females = createPlayers(4, 'female');
      const players = [...males, ...females];

      const session = createBaseSession({
        matchup_preference: 'mixed_only',
      });

      expect(isSessionValid(session, players)).toBe(true);
    });

    it('rejects mixed_only without both genders', () => {
      const players = createPlayers(8, 'male'); // All male

      const session = createBaseSession({
        matchup_preference: 'mixed_only',
      });

      const results = validateSession(session, players);
      const errors = results.filter(r => r.severity === 'error');

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('both male and female players');
    });

    it('rejects mixed_only with insufficient males or females', () => {
      const males = createPlayers(1, 'male');
      const females = createPlayers(7, 'female');
      const players = [...males, ...females];

      const session = createBaseSession({
        matchup_preference: 'mixed_only',
      });

      const results = validateSession(session, players);
      const errors = results.filter(r => r.severity === 'error');

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('at least 2 males and 2 females');
    });
  });

  describe('Scoring Configuration Ranges', () => {
    it('validates points_per_match = 1 (minimum)', () => {
      const session = createBaseSession({ points_per_match: 1 });
      const players = createPlayers(4);

      expect(isSessionValid(session, players)).toBe(true);
    });

    it('validates points_per_match = 100 (maximum)', () => {
      const session = createBaseSession({ points_per_match: 100 });
      const players = createPlayers(4);

      expect(isSessionValid(session, players)).toBe(true);
    });

    it('rejects points_per_match < 1', () => {
      const session = createBaseSession({ points_per_match: 0 });
      const players = createPlayers(4);

      const results = validateSession(session, players);
      const errors = results.filter(r => r.severity === 'error');

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('between 1 and 100');
    });

    it('rejects points_per_match > 100', () => {
      const session = createBaseSession({ points_per_match: 101 });
      const players = createPlayers(4);

      const results = validateSession(session, players);
      const errors = results.filter(r => r.severity === 'error');

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('between 1 and 100');
    });
  });

  describe('Session Info Validation', () => {
    it('rejects empty session name', () => {
      const session = createBaseSession({ name: '' });
      const players = createPlayers(4);

      const results = validateSession(session, players);
      const errors = results.filter(r => r.severity === 'error');

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('Session name is required');
    });

    it('rejects session name < 3 characters', () => {
      const session = createBaseSession({ name: 'AB' });
      const players = createPlayers(4);

      const results = validateSession(session, players);
      const errors = results.filter(r => r.severity === 'error');

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('at least 3 characters');
    });

    it('rejects fewer than 4 players', () => {
      const session = createBaseSession();
      const players = createPlayers(3);

      const results = validateSession(session, players);
      const errors = results.filter(r => r.severity === 'error');

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('At least 4 players are required');
    });
  });
});
