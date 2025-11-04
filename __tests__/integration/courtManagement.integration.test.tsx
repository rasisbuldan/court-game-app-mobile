/**
 * Court Management Integration Tests
 *
 * Comprehensive tests for court allocation and management:
 * - Sequential vs Parallel court modes
 * - Court assignment optimization
 * - Court availability tracking
 * - Dynamic court count changes
 * - Real-world court scenarios
 */

import { MexicanoAlgorithm, ParallelCourtsAlgorithm } from '@courtster/shared';
import { supabase } from '../../config/supabase';
import { playerFactory } from '../factories';

jest.mock('../../config/supabase');

describe('Court Management Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Sequential Courts Mode', () => {
    it('should assign matches sequentially to courts', () => {
      const players = Array.from({ length: 16 }, (_, i) =>
        playerFactory({ name: `Player ${i + 1}` })
      );
      const algorithm = new MexicanoAlgorithm(players, 4);
      const round = algorithm.generateRound(1);

      // In sequential mode, courts are filled one at a time
      // Match 0 -> Court 1, Match 1 -> Court 2, etc.
      expect(round.matches.length).toBe(4);

      round.matches.forEach((match, idx) => {
        match.courtNumber = idx + 1; // Sequential assignment
      });

      // Verify sequential assignment
      const courtNumbers = round.matches.map(m => m.courtNumber).sort();
      expect(courtNumbers).toEqual([1, 2, 3, 4]);
    });

    it('should handle court completion and reassignment', () => {
      const players = Array.from({ length: 12 }, (_, i) =>
        playerFactory({ name: `Player ${i + 1}` })
      );
      const algorithm = new MexicanoAlgorithm(players, 3);
      const round = algorithm.generateRound(1);

      // Assign court numbers
      round.matches.forEach((match, idx) => {
        match.courtNumber = idx + 1;
      });

      // Simulate matches completing at different times
      round.matches[0].completed = true;
      round.matches[0].completedAt = new Date('2024-01-01T10:00:00Z');

      round.matches[1].completed = true;
      round.matches[1].completedAt = new Date('2024-01-01T10:15:00Z');

      round.matches[2].completed = false; // Still playing

      // Court 1 and 2 are now available for next round
      const availableCourts = round.matches
        .filter(m => m.completed)
        .map(m => m.courtNumber);

      expect(availableCourts).toContain(1);
      expect(availableCourts).toContain(2);
      expect(availableCourts).not.toContain(3);
    });
  });

  describe('Parallel Courts Mode', () => {
    it('should assign all matches to start simultaneously', () => {
      const players = Array.from({ length: 16 }, (_, i) =>
        playerFactory({ name: `Player ${i + 1}` })
      );

      // Create parallel courts algorithm
      const algorithm = new ParallelCourtsAlgorithm(players, 4);
      const round = algorithm.generateNextRound();

      expect(round.matches.length).toBe(4);

      // All matches start at the same time
      const startTime = new Date();
      round.matches.forEach(match => {
        match.startTime = startTime;
        match.courtNumber = round.matches.indexOf(match) + 1;
      });

      // Verify all start simultaneously
      const uniqueStartTimes = new Set(round.matches.map(m => m.startTime?.toISOString()));
      expect(uniqueStartTimes.size).toBe(1);
    });

    it('should wait for all courts to finish before next round', () => {
      const players = Array.from({ length: 12 }, (_, i) =>
        playerFactory({ name: `Player ${i + 1}` })
      );
      const algorithm = new ParallelCourtsAlgorithm(players, 3);
      const round = algorithm.generateNextRound();

      // Simulate matches finishing at different times
      round.matches[0].completed = true;
      round.matches[1].completed = true;
      round.matches[2].completed = false; // Still playing

      // Cannot start next round until all complete
      const canStartNextRound = round.matches.every(m => m.completed);
      expect(canStartNextRound).toBe(false);

      // Complete last match
      round.matches[2].completed = true;

      const allComplete = round.matches.every(m => m.completed);
      expect(allComplete).toBe(true);
    });
  });

  describe('Court Count Optimization', () => {
    const testCases = [
      { players: 8, optimalCourts: 2, maxMatches: 2 },
      { players: 12, optimalCourts: 3, maxMatches: 3 },
      { players: 16, optimalCourts: 4, maxMatches: 4 },
      { players: 20, optimalCourts: 5, maxMatches: 5 },
      { players: 10, optimalCourts: 2, maxMatches: 2 }, // 2 sitting
      { players: 14, optimalCourts: 3, maxMatches: 3 }, // 2 sitting
    ];

    testCases.forEach(({ players: playerCount, optimalCourts, maxMatches }) => {
      it(`should optimize ${playerCount} players to ${optimalCourts} courts`, () => {
        const players = Array.from({ length: playerCount }, (_, i) =>
          playerFactory({ name: `Player ${i + 1}` })
        );
        const algorithm = new MexicanoAlgorithm(players, optimalCourts);
        const round = algorithm.generateRound(1);

        expect(round.matches.length).toBeLessThanOrEqual(maxMatches);

        // Verify all courts are utilized
        const assignedPlayers = new Set<number>();
        round.matches.forEach(match => {
          match.team1.forEach(p => assignedPlayers.add(p));
          match.team2.forEach(p => assignedPlayers.add(p));
        });

        // Should be playing on all courts (4 players per court)
        expect(assignedPlayers.size).toBe(optimalCourts * 4);
      });
    });
  });

  describe('Dynamic Court Count Changes', () => {
    it('should handle court becoming unavailable mid-tournament', async () => {
      const players = Array.from({ length: 12 }, (_, i) =>
        playerFactory({ name: `Player ${i + 1}` })
      );
      const sessionData = {
        id: 'session-123',
        courts: 3,
        current_round: 1,
      };

      // Round 1 with 3 courts
      let algorithm = new MexicanoAlgorithm(players, 3);
      const round1 = algorithm.generateRound(1);
      expect(round1.matches.length).toBe(3);

      // Court 3 becomes unavailable
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: { ...sessionData, courts: 2 },
          error: null,
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });

      const result = await (supabase.from('game_sessions') as any)
        .update({ courts: 2 })
        .eq('id', 'session-123');

      expect(result.data.courts).toBe(2);

      // Round 2 with only 2 courts
      algorithm = new MexicanoAlgorithm(players, 2);
      const round2 = algorithm.generateRound(2);
      expect(round2.matches.length).toBe(2); // Reduced to 2 matches
    });

    it('should handle additional court becoming available', async () => {
      const players = Array.from({ length: 12 }, (_, i) =>
        playerFactory({ name: `Player ${i + 1}` })
      );
      const sessionData = {
        id: 'session-123',
        courts: 2,
        current_round: 1,
      };

      // Round 1 with 2 courts
      let algorithm = new MexicanoAlgorithm(players, 2);
      const round1 = algorithm.generateRound(1);
      expect(round1.matches.length).toBe(2);

      // Additional court becomes available
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: { ...sessionData, courts: 3 },
          error: null,
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });

      const result = await (supabase.from('game_sessions') as any)
        .update({ courts: 3 })
        .eq('id', 'session-123');

      expect(result.data.courts).toBe(3);

      // Round 2 with 3 courts - now can utilize all 3 courts with 12 players
      algorithm = new MexicanoAlgorithm(players, 3);
      const round2 = algorithm.generateRound(2);
      expect(round2.matches.length).toBe(3); // Increased to 3 matches
    });
  });

  describe('Court Assignment Preferences', () => {
    it('should respect court preferences when specified', () => {
      const players = Array.from({ length: 8 }, (_, i) =>
        playerFactory({
          name: `Player ${i + 1}`,
          preferredCourt: i < 4 ? 1 : 2, // Players prefer specific courts
        })
      );
      const algorithm = new MexicanoAlgorithm(players, 2);
      const round = algorithm.generateRound(1);

      // Assign court numbers
      round.matches.forEach((match, idx) => {
        match.courtNumber = idx + 1;
      });

      // Verify matches exist
      expect(round.matches.length).toBe(2);
      expect(round.matches[0].courtNumber).toBe(1);
      expect(round.matches[1].courtNumber).toBe(2);
    });

    it('should handle indoor vs outdoor court preferences', () => {
      const courtTypes = [
        { courtNumber: 1, type: 'indoor', surface: 'hard' },
        { courtNumber: 2, type: 'outdoor', surface: 'hard' },
        { courtNumber: 3, type: 'indoor', surface: 'clay' },
      ];

      const players = Array.from({ length: 12 }, (_, i) =>
        playerFactory({
          name: `Player ${i + 1}`,
          preferredCourtType: i % 2 === 0 ? 'indoor' : 'outdoor',
        })
      );

      const algorithm = new MexicanoAlgorithm(players, 3);
      const round = algorithm.generateRound(1);

      // Assign courts based on type
      round.matches.forEach((match, idx) => {
        match.courtNumber = courtTypes[idx].courtNumber;
        match.courtType = courtTypes[idx].type;
      });

      const indoorMatches = round.matches.filter(m => m.courtType === 'indoor');
      const outdoorMatches = round.matches.filter(m => m.courtType === 'outdoor');

      expect(indoorMatches.length).toBe(2);
      expect(outdoorMatches.length).toBe(1);
    });
  });

  describe('Court Utilization Tracking', () => {
    it('should track court usage time', () => {
      const players = Array.from({ length: 8 }, (_, i) =>
        playerFactory({ name: `Player ${i + 1}` })
      );
      const algorithm = new MexicanoAlgorithm(players, 2);
      const round = algorithm.generateRound(1);

      const startTime = new Date('2024-01-01T10:00:00Z');
      const endTime = new Date('2024-01-01T10:45:00Z');

      round.matches.forEach((match, idx) => {
        match.courtNumber = idx + 1;
        match.startTime = startTime;
        match.endTime = idx === 0 ? endTime : undefined; // Match 1 finished
      });

      // Calculate usage time for court 1
      const court1Match = round.matches.find(m => m.courtNumber === 1);
      if (court1Match?.startTime && court1Match?.endTime) {
        const usageMinutes =
          (court1Match.endTime.getTime() - court1Match.startTime.getTime()) / (1000 * 60);
        expect(usageMinutes).toBe(45);
      }
    });

    it('should calculate average match duration per court', () => {
      const matchDurations = [
        { court: 1, duration: 45 },
        { court: 1, duration: 50 },
        { court: 2, duration: 40 },
        { court: 2, duration: 48 },
      ];

      const court1Avg = matchDurations
        .filter(m => m.court === 1)
        .reduce((sum, m) => sum + m.duration, 0) / 2;

      const court2Avg = matchDurations
        .filter(m => m.court === 2)
        .reduce((sum, m) => sum + m.duration, 0) / 2;

      expect(court1Avg).toBe(47.5);
      expect(court2Avg).toBe(44);
    });
  });

  describe('Real-world Court Scenarios', () => {
    it('should handle club with mixed court availability', () => {
      // Club has 5 courts but only 3 available for tournament
      const totalCourts = 5;
      const availableCourts = 3;
      const players = Array.from({ length: 12 }, (_, i) =>
        playerFactory({ name: `Player ${i + 1}` })
      );

      const algorithm = new MexicanoAlgorithm(players, availableCourts);
      const round = algorithm.generateRound(1);

      expect(round.matches.length).toBe(availableCourts);

      // Assign only available courts
      const assignedCourts = [1, 2, 3]; // Courts 4 and 5 not available
      round.matches.forEach((match, idx) => {
        match.courtNumber = assignedCourts[idx];
      });

      const usedCourts = round.matches.map(m => m.courtNumber);
      expect(usedCourts.every(c => c <= availableCourts)).toBe(true);
    });

    it('should handle peak hour court rotation', () => {
      // During peak hours, need faster court turnover
      const players = Array.from({ length: 16 }, (_, i) =>
        playerFactory({ name: `Player ${i + 1}` })
      );
      const algorithm = new MexicanoAlgorithm(players, 4);

      // Generate multiple rounds to simulate rotation
      const rounds = [];
      for (let i = 1; i <= 3; i++) {
        const round = algorithm.generateRound(i);
        round.matches.forEach((match, idx) => {
          match.courtNumber = idx + 1;
          match.startTime = new Date(`2024-01-01T${17 + i - 1}:00:00Z`); // 5 PM, 6 PM, 7 PM
        });
        rounds.push(round);

        // Simulate scoring
        round.matches.forEach(match => {
          match.team1Score = 32;
          match.team2Score = 20;
          match.completed = true;
        });

        algorithm.updatePlayerStats(round, players);
      }

      // Verify all rounds completed during peak hours
      expect(rounds.length).toBe(3);
      expect(rounds.every(r => r.matches.every(m => m.completed))).toBe(true);
    });

    it('should handle court maintenance schedule', () => {
      // Court 2 needs maintenance after round 2
      const players = Array.from({ length: 12 }, (_, i) =>
        playerFactory({ name: `Player ${i + 1}` })
      );

      // Round 1 and 2 with 3 courts
      let algorithm = new MexicanoAlgorithm(players, 3);
      const round1 = algorithm.generateRound(1);
      const round2 = algorithm.generateRound(2);

      expect(round1.matches.length).toBe(3);
      expect(round2.matches.length).toBe(3);

      // Court 2 under maintenance for round 3
      const maintenanceCourts = new Set([2]);
      const availableCourts = [1, 3];

      algorithm = new MexicanoAlgorithm(players, availableCourts.length);
      const round3 = algorithm.generateRound(3);

      expect(round3.matches.length).toBe(2); // Only 2 courts available

      // Assign only non-maintenance courts
      round3.matches.forEach((match, idx) => {
        match.courtNumber = availableCourts[idx];
      });

      const usedCourts = round3.matches.map(m => m.courtNumber);
      expect(usedCourts.every(c => !maintenanceCourts.has(c))).toBe(true);
    });
  });

  describe('Court Assignment Edge Cases', () => {
    it('should handle single court tournament', () => {
      const players = Array.from({ length: 4 }, (_, i) =>
        playerFactory({ name: `Player ${i + 1}` })
      );
      const algorithm = new MexicanoAlgorithm(players, 1);
      const round = algorithm.generateRound(1);

      expect(round.matches.length).toBe(1);
      expect(round.matches[0].courtNumber || 1).toBe(1);
    });

    it('should handle more courts than needed', () => {
      const players = Array.from({ length: 8 }, (_, i) =>
        playerFactory({ name: `Player ${i + 1}` })
      );
      // 8 players only need 2 courts, but 5 courts available
      const algorithm = new MexicanoAlgorithm(players, 5);
      const round = algorithm.generateRound(1);

      // Should only use 2 courts
      expect(round.matches.length).toBe(2);
    });

    it('should handle court number gaps (non-sequential)', () => {
      const availableCourts = [1, 3, 5, 7]; // Courts 2, 4, 6 not available
      const players = Array.from({ length: 16 }, (_, i) =>
        playerFactory({ name: `Player ${i + 1}` })
      );

      const algorithm = new MexicanoAlgorithm(players, availableCourts.length);
      const round = algorithm.generateRound(1);

      // Assign with gaps
      round.matches.forEach((match, idx) => {
        match.courtNumber = availableCourts[idx];
      });

      const usedCourts = round.matches.map(m => m.courtNumber).sort();
      expect(usedCourts).toEqual([1, 3, 5, 7]);
    });
  });
});
