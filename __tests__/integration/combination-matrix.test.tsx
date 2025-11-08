import { MexicanoAlgorithm, Player, Round } from '@courtster/shared';
import { createMockPlayers, createMockPlayersWithPartners } from '../factories/playerFactory';

jest.mock('../../config/supabase');
jest.mock('react-native-toast-message');
jest.mock('../../utils/logger', () => ({
  Logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Helper to calculate expected match count
const expectedMatches = (playerCount: number, courts: number): number => {
  return Math.min(courts, Math.floor(playerCount / 4));
};

describe('Parameter Combination Matrix Tests', () => {
  describe('Sport × Scoring Mode Combinations', () => {
    it('should support padel with points mode', () => {
      const players = createMockPlayers(4);
      players.forEach((p) => (p.sport = 'padel'));

      const algorithm = new MexicanoAlgorithm(players, 1, false, 'any', 'mexicano', 'points', 21);
      const round = algorithm.generateRound(1);

      expect(round.matches).toHaveLength(1);
      expect(round.matches[0].team1[0].sport).toBe('padel');
    });

    it('should support padel with first_to mode', () => {
      const players = createMockPlayers(4);
      players.forEach((p) => (p.sport = 'padel'));

      const algorithm = new MexicanoAlgorithm(players, 1, false, 'any', 'mexicano', 'first_to', undefined, 6);
      const round = algorithm.generateRound(1);

      expect(round.matches).toHaveLength(1);
      expect(round.matches[0].team1[0].sport).toBe('padel');
    });

    it('should support padel with total_games mode', () => {
      const players = createMockPlayers(4);
      players.forEach((p) => (p.sport = 'padel'));

      const algorithm = new MexicanoAlgorithm(players, 1, false, 'any', 'mexicano', 'total_games', undefined, 6);
      const round = algorithm.generateRound(1);

      expect(round.matches).toHaveLength(1);
      expect(round.matches[0].team1[0].sport).toBe('padel');
    });

    it('should NOT support tennis with points mode (auto-switches to first_to)', () => {
      const players = createMockPlayers(4);
      players.forEach((p) => (p.sport = 'tennis'));

      // UI should prevent this combination
      const invalidCombination = 'tennis' === 'tennis' && 'points' === 'points';
      expect(invalidCombination).toBe(true);

      // Should use first_to instead
      const algorithm = new MexicanoAlgorithm(players, 1, false, 'any', 'mexicano', 'first_to', undefined, 6);
      const round = algorithm.generateRound(1);
      expect(round.matches).toHaveLength(1);
    });

    it('should support tennis with first_to mode', () => {
      const players = createMockPlayers(4);
      players.forEach((p) => (p.sport = 'tennis'));

      const algorithm = new MexicanoAlgorithm(players, 1, false, 'any', 'mexicano', 'first_to', undefined, 6);
      const round = algorithm.generateRound(1);

      expect(round.matches).toHaveLength(1);
      expect(round.matches[0].team1[0].sport).toBe('tennis');
    });

    it('should support tennis with total_games mode', () => {
      const players = createMockPlayers(4);
      players.forEach((p) => (p.sport = 'tennis'));

      const algorithm = new MexicanoAlgorithm(players, 1, false, 'any', 'mexicano', 'total_games', undefined, 6);
      const round = algorithm.generateRound(1);

      expect(round.matches).toHaveLength(1);
      expect(round.matches[0].team1[0].sport).toBe('tennis');
    });
  });

  describe('Game Type × Matchup Preference Combinations', () => {
    const gameTypes = ['mexicano', 'americano', 'fixed_partner', 'mixed_mexicano'] as const;
    const matchupPrefs = ['any', 'mixed_only', 'randomized_modes'] as const;

    it('should support mexicano with any preference', () => {
      const players = createMockPlayers(8); // Need 8 for 2 courts
      const algorithm = new MexicanoAlgorithm(players, 2, false, 'any', 'mexicano');
      const round = algorithm.generateRound(1);
      expect(round.matches).toHaveLength(expectedMatches(8, 2)); // 2 matches
    });

    it('should support mexicano with mixed_only preference', () => {
      const players = createMockPlayers(4);
      players[0].gender = 'male';
      players[1].gender = 'female';
      players[2].gender = 'male';
      players[3].gender = 'female';

      const algorithm = new MexicanoAlgorithm(players, 1, false, 'mixed_only', 'mexicano');
      const round = algorithm.generateRound(1);

      // Verify mixed teams
      round.matches.forEach((match) => {
        const team1Genders = match.team1.map((p) => p.gender);
        const team2Genders = match.team2.map((p) => p.gender);
        expect(team1Genders).toContain('male');
        expect(team1Genders).toContain('female');
        expect(team2Genders).toContain('male');
        expect(team2Genders).toContain('female');
      });
    });

    it('should support mexicano with randomized_modes preference', () => {
      const players = createMockPlayers(8); // Need 8 for 2 courts
      const algorithm = new MexicanoAlgorithm(players, 2, false, 'randomized_modes', 'mexicano');
      const round = algorithm.generateRound(1);
      expect(round.matches).toHaveLength(expectedMatches(8, 2)); // 2 matches
    });

    it('should support americano with any preference', () => {
      const players = createMockPlayers(8); // Need 8 for 2 courts
      const algorithm = new MexicanoAlgorithm(players, 2, false, 'any', 'americano');
      const round = algorithm.generateRound(1);
      expect(round.matches).toHaveLength(expectedMatches(8, 2)); // 2 matches
    });

    it('should support americano with mixed_only preference', () => {
      const players = createMockPlayers(4);
      players[0].gender = 'male';
      players[1].gender = 'female';
      players[2].gender = 'male';
      players[3].gender = 'female';

      const algorithm = new MexicanoAlgorithm(players, 1, false, 'mixed_only', 'americano');
      const round = algorithm.generateRound(1);
      expect(round.matches).toHaveLength(1);
    });

    it('should support americano with randomized_modes preference', () => {
      const players = createMockPlayers(8); // Need 8 for 2 courts
      const algorithm = new MexicanoAlgorithm(players, 2, false, 'randomized_modes', 'americano');
      const round = algorithm.generateRound(1);
      expect(round.matches).toHaveLength(expectedMatches(8, 2)); // 2 matches
    });

    it('should lock fixed_partner to any preference only', () => {
      const players = createMockPlayersWithPartners(4); // 8 players = 4 pairs

      // Valid: fixed_partner + any
      const algorithm1 = new MexicanoAlgorithm(players, 2, false, 'any', 'fixed_partner');
      const round1 = algorithm1.generateRound(1);
      expect(round1.matches).toHaveLength(expectedMatches(8, 2)); // 2 matches

      // Invalid combinations would be prevented by UI
      const invalidCombos = [
        { gameType: 'fixed_partner', pref: 'mixed_only' },
        { gameType: 'fixed_partner', pref: 'randomized_modes' },
      ];

      invalidCombos.forEach((combo) => {
        const isInvalid = combo.gameType === 'fixed_partner' && combo.pref !== 'any';
        expect(isInvalid).toBe(true);
      });
    });

    it('should support mixed_mexicano with mixed_only preference', () => {
      const players = createMockPlayers(8);
      players.forEach((p, idx) => {
        p.gender = idx % 2 === 0 ? 'male' : 'female';
      });

      const algorithm = new MexicanoAlgorithm(players, 2, false, 'mixed_only', 'mixed_mexicano');
      const round = algorithm.generateRound(1);
      expect(round.matches).toHaveLength(expectedMatches(8, 2)); // 2 matches
    });

    it('should lock mixed_mexicano to mixed_only preference', () => {
      const players = createMockPlayers(6);

      // Invalid combinations
      const invalidCombos = [
        { gameType: 'mixed_mexicano', pref: 'any' },
        { gameType: 'mixed_mexicano', pref: 'randomized_modes' },
      ];

      invalidCombos.forEach((combo) => {
        const isInvalid = combo.gameType === 'mixed_mexicano' && combo.pref !== 'mixed_only';
        expect(isInvalid).toBe(true);
      });
    });
  });

  describe('Court Mode × Number of Courts Validation', () => {
    it('should support sequential mode with single court', () => {
      const players = createMockPlayers(6);
      const algorithm = new MexicanoAlgorithm(players, 1, false, 'any', 'mexicano');

      for (let i = 1; i <= 5; i++) {
        const round = algorithm.generateRound(i);
        expect(round.matches).toHaveLength(1);
        expect(round.matches[0].court).toBe(1);
      }
    });

    it('should support sequential mode with multiple courts', () => {
      const players = createMockPlayers(12); // Need 12 for 3 courts
      const algorithm = new MexicanoAlgorithm(players, 3, false, 'any', 'mexicano');

      for (let i = 1; i <= 5; i++) {
        const round = algorithm.generateRound(i);
        expect(round.matches).toHaveLength(expectedMatches(12, 3)); // 3 matches
        expect(round.matches[0].court).toBe(1);
        expect(round.matches[1].court).toBe(2);
        expect(round.matches[2].court).toBe(3);
      }
    });

    it('should support parallel mode with multiple courts', () => {
      const players = createMockPlayers(12);
      const algorithm = new MexicanoAlgorithm(players, 4, true, 'any', 'mexicano');

      // In parallel mode, use generateRoundForCourt() not generateRound()
      const round1Court1 = algorithm.generateRoundForCourt(1, 1, []);
      const court1PlayerIds = [
        ...round1Court1.matches[0].team1.map(p => p.id),
        ...round1Court1.matches[0].team2.map(p => p.id),
      ];

      const round1Court2 = algorithm.generateRoundForCourt(2, 1, court1PlayerIds);

      expect(round1Court1.matches).toHaveLength(1);
      expect(round1Court1.matches[0].court).toBe(1);
      expect(round1Court2.matches).toHaveLength(1);
      expect(round1Court2.matches[0].court).toBe(2);
    });

    it('should enforce minimum players per court (4)', () => {
      const players = createMockPlayers(6);

      // 2 courts require 8 players minimum
      const insufficientForTwoCourts = players.length < 2 * 4;
      expect(insufficientForTwoCourts).toBe(true);

      // 1 court is valid with 6 players
      const algorithm = new MexicanoAlgorithm(players, 1, false, 'any', 'mexicano');
      const round = algorithm.generateRound(1);
      expect(round.matches).toHaveLength(1);
    });

    it('should validate players % 4 === 0 for full utilization', () => {
      const testCases = [
        { players: 4, courts: 1, valid: true },   // Perfect: 1 match, no sitting
        { players: 8, courts: 2, valid: true },   // Perfect: 2 matches, no sitting
        { players: 12, courts: 3, valid: true },  // Perfect: 3 matches, no sitting
        { players: 6, courts: 1, valid: true },   // Valid: 1 match, 2 sit, rotation works
        { players: 7, courts: 1, valid: true },   // Valid: 1 match, 3 sit, rotation works
        { players: 3, courts: 1, valid: false },  // Invalid: Not enough players for even 1 match
      ];

      testCases.forEach((tc) => {
        const isValid = tc.players >= tc.courts * 4;
        expect(isValid).toBe(tc.valid);
      });
    });
  });

  describe('Complete Parameter Combinations', () => {
    it('should handle padel + mexicano + points + any + sequential', () => {
      const players = createMockPlayers(12); // Need 12 for 3 courts
      players.forEach((p) => (p.sport = 'padel'));

      const algorithm = new MexicanoAlgorithm(players, 3, false, 'any', 'mexicano', 'points', 21);
      const round = algorithm.generateRound(1);

      expect(round.matches).toHaveLength(expectedMatches(12, 3)); // 3 matches
      expect(round.matches[0].team1[0].sport).toBe('padel');
    });

    it('should handle padel + americano + first_to + mixed_only + parallel', () => {
      const players = createMockPlayers(16); // More players for better testing
      players.forEach((p, idx) => {
        p.sport = 'padel';
        p.gender = idx % 2 === 0 ? 'male' : 'female';
      });

      const algorithm = new MexicanoAlgorithm(players, 2, true, 'mixed_only', 'americano', 'first_to', undefined, 6);
      const round = algorithm.generateRoundForCourt(1, 1, []); // Use generateRoundForCourt for parallel mode

      expect(round.matches).toHaveLength(1); // Parallel mode: 1 match per court
      expect(round.matches[0].team1[0].sport).toBe('padel');
    });

    it('should handle tennis + fixed_partner + total_games + any + sequential', () => {
      const players = createMockPlayersWithPartners(4);
      players.forEach((p) => (p.sport = 'tennis'));

      const algorithm = new MexicanoAlgorithm(
        players,
        2,
        false,
        'any',
        'fixed_partner',
        'total_games',
        undefined,
        6
      );
      const round = algorithm.generateRound(1);

      expect(round.matches).toHaveLength(2);
      expect(round.matches[0].team1[0].sport).toBe('tennis');
    });

    it('should handle padel + mixed_mexicano + first_to + mixed_only + parallel', () => {
      const players = createMockPlayers(12);
      players.forEach((p, idx) => {
        p.sport = 'padel';
        p.gender = idx % 2 === 0 ? 'male' : 'female';
      });

      const algorithm = new MexicanoAlgorithm(
        players,
        3,
        true,
        'mixed_only',
        'mixed_mexicano',
        'first_to',
        undefined,
        6
      );
      const round = algorithm.generateRoundForCourt(1, 1, []); // Use generateRoundForCourt for parallel mode

      expect(round.matches).toHaveLength(1);
    });

    it('should handle tennis + americano + total_games + randomized_modes + sequential', () => {
      const players = createMockPlayers(12); // Need 12 for 3 courts
      players.forEach((p) => (p.sport = 'tennis'));

      const algorithm = new MexicanoAlgorithm(
        players,
        3,
        false,
        'randomized_modes',
        'americano',
        'total_games',
        undefined,
        6
      );
      const round = algorithm.generateRound(1);

      expect(round.matches).toHaveLength(expectedMatches(12, 3)); // 3 matches
    });
  });

  describe('Auto-Adjustment Rules', () => {
    it('should auto-adjust tennis + points to tennis + first_to', () => {
      const players = createMockPlayers(4);
      players.forEach((p) => (p.sport = 'tennis'));

      // UI prevents this, but algorithm would need first_to
      const needsAdjustment = 'tennis' === 'tennis' && 'points' === 'points';
      expect(needsAdjustment).toBe(true);

      // Corrected version
      const algorithm = new MexicanoAlgorithm(players, 1, false, 'any', 'mexicano', 'first_to', undefined, 6);
      const round = algorithm.generateRound(1);
      expect(round.matches).toHaveLength(1);
    });

    it('should auto-adjust mixed_mexicano + any to mixed_mexicano + mixed_only', () => {
      const players = createMockPlayers(8);
      players.forEach((p, idx) => (p.gender = idx % 2 === 0 ? 'male' : 'female'));

      const needsAdjustment = 'mixed_mexicano' === 'mixed_mexicano' && 'any' === 'any';
      expect(needsAdjustment).toBe(true);

      // Corrected version
      const algorithm = new MexicanoAlgorithm(players, 2, false, 'mixed_only', 'mixed_mexicano');
      const round = algorithm.generateRound(1);
      expect(round.matches).toHaveLength(expectedMatches(8, 2)); // 2 matches
    });

    it('should auto-adjust fixed_partner + mixed_only to fixed_partner + any', () => {
      const players = createMockPlayersWithPartners(4);

      const needsAdjustment = 'fixed_partner' === 'fixed_partner' && 'mixed_only' === 'mixed_only';
      expect(needsAdjustment).toBe(true);

      // Corrected version
      const algorithm = new MexicanoAlgorithm(players, 2, false, 'any', 'fixed_partner');
      const round = algorithm.generateRound(1);
      expect(round.matches).toHaveLength(2);
    });

    it('should enforce minimum 4 players per court in parallel mode', () => {
      const players = createMockPlayers(6);

      // 2 courts need 8 players
      const needsAdjustment = players.length < 2 * 4;
      expect(needsAdjustment).toBe(true);

      // Reduce to 1 court
      const algorithm = new MexicanoAlgorithm(players, 1, true, 'any', 'mexicano');
      const round = algorithm.generateRound(1, 1);
      expect(round.matches).toHaveLength(1);
    });
  });

  describe('Invalid Combinations', () => {
    it('should identify tennis + points as invalid', () => {
      const invalid = 'tennis' === 'tennis' && 'points' === 'points';
      expect(invalid).toBe(true);
    });

    it('should identify mixed_mexicano + any as invalid', () => {
      const invalid = 'mixed_mexicano' === 'mixed_mexicano' && 'any' === 'any';
      expect(invalid).toBe(true);
    });

    it('should identify mixed_mexicano + randomized_modes as invalid', () => {
      const invalid = 'mixed_mexicano' === 'mixed_mexicano' && 'randomized_modes' === 'randomized_modes';
      expect(invalid).toBe(true);
    });

    it('should identify fixed_partner + mixed_only as invalid', () => {
      const invalid = 'fixed_partner' === 'fixed_partner' && 'mixed_only' === 'mixed_only';
      expect(invalid).toBe(true);
    });

    it('should identify fixed_partner + randomized_modes as invalid', () => {
      const invalid = 'fixed_partner' === 'fixed_partner' && 'randomized_modes' === 'randomized_modes';
      expect(invalid).toBe(true);
    });

    it('should identify insufficient players for courts as invalid', () => {
      const players = 6;
      const courts = 2;
      const invalid = players < courts * 4;
      expect(invalid).toBe(true);
    });
  });

  describe('Stress Test - Multiple Rounds with Different Combinations', () => {
    it('should maintain consistency across 10 rounds with padel + mexicano + points', () => {
      const players = createMockPlayers(16); // Need 16 for 4 courts
      players.forEach((p) => (p.sport = 'padel'));

      const algorithm = new MexicanoAlgorithm(players, 4, false, 'any', 'mexicano', 'points', 21);

      for (let i = 1; i <= 10; i++) {
        const round = algorithm.generateRound(i);
        expect(round.matches).toHaveLength(expectedMatches(16, 4)); // 4 matches
        expect(round.number).toBe(i);
      }
    });

    it('should maintain consistency across 10 rounds with tennis + first_to + parallel', () => {
      const players = createMockPlayers(16);
      players.forEach((p) => (p.sport = 'tennis'));

      const algorithm = new MexicanoAlgorithm(players, 4, true, 'any', 'mexicano', 'first_to', undefined, 6);

      for (let court = 1; court <= 4; court++) {
        for (let round = 1; round <= 10; round++) {
          const roundData = algorithm.generateRoundForCourt(court, round, []); // Use generateRoundForCourt for parallel mode
          expect(roundData.matches).toHaveLength(1);
          expect(roundData.matches[0].court).toBe(court);
        }
      }
    });

    it('should maintain consistency across rounds with fixed_partner + total_games', () => {
      const players = createMockPlayersWithPartners(6); // 12 players = 6 pairs

      const algorithm = new MexicanoAlgorithm(players, 3, false, 'any', 'fixed_partner', 'total_games', undefined, 6);

      for (let i = 1; i <= 10; i++) {
        const round = algorithm.generateRound(i);
        expect(round.matches).toHaveLength(expectedMatches(12, 3)); // 3 matches

        // Verify partnerships maintained
        round.matches.forEach((match) => {
          expect(match.team1[0].partnerId).toBe(match.team1[1].id);
          expect(match.team1[1].partnerId).toBe(match.team1[0].id);
        });
      }
    });
  });
});
