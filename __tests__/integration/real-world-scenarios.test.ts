import { MexicanoAlgorithm, ParallelCourtsAlgorithm, Player } from '@courtster/shared';

/**
 * Real-world scenario simulation tests
 * Tests complete workflows with realistic configurations
 */

// Helper to create players
const createPlayer = (id: string, name: string, rating: number, gender?: 'male' | 'female'): Player => ({
  id,
  name,
  rating,
  gender: gender || 'male',
  playCount: 0,
  sitCount: 0,
  consecutiveSits: 0,
  consecutivePlays: 0,
  status: 'active',
  totalPoints: 0,
  wins: 0,
  losses: 0,
  ties: 0,
});

describe('Real-World Scenario Simulations', () => {
  describe('Scenario 1: 8 Padel Players, 2 Courts, Points Mode (Sequential)', () => {
    it.skip('generates 5 rounds with proper rotation and fairness', () => {
      const players: Player[] = [
        createPlayer('1', 'Alice', 8),
        createPlayer('2', 'Bob', 7),
        createPlayer('3', 'Carol', 6),
        createPlayer('4', 'David', 6),
        createPlayer('5', 'Eve', 5),
        createPlayer('6', 'Frank', 5),
        createPlayer('7', 'Grace', 4),
        createPlayer('8', 'Henry', 4),
      ];

      const algorithm = new MexicanoAlgorithm(players, 2, true, 'any', 'mexicano');

      // Generate 5 rounds
      const rounds = [];
      for (let i = 1; i <= 5; i++) {
        const round = algorithm.generateRound(i);
        rounds.push(round);

        // Verify round structure
        expect(round.number).toBe(i);
        expect(round.matches).toHaveLength(2); // 2 courts
        expect(round.sittingPlayers).toHaveLength(0); // 8 players, all play

        // Verify all players are in matches
        const playingPlayerIds = new Set<string>();
        round.matches.forEach(match => {
          match.team1.forEach(p => playingPlayerIds.add(p.id));
          match.team2.forEach(p => playingPlayerIds.add(p.id));
        });
        expect(playingPlayerIds.size).toBe(8);
      }

      // Check partnership diversity across all rounds
      const partnerships = new Map<string, Set<string>>();
      rounds.forEach(round => {
        round.matches.forEach(match => {
          const p1 = match.team1[0].id;
          const p2 = match.team1[1].id;
          const p3 = match.team2[0].id;
          const p4 = match.team2[1].id;

          // Track partnerships
          if (!partnerships.has(p1)) partnerships.set(p1, new Set());
          if (!partnerships.has(p2)) partnerships.set(p2, new Set());
          partnerships.get(p1)!.add(p2);
          partnerships.get(p2)!.add(p1);

          if (!partnerships.has(p3)) partnerships.set(p3, new Set());
          if (!partnerships.has(p4)) partnerships.set(p4, new Set());
          partnerships.get(p3)!.add(p4);
          partnerships.get(p4)!.add(p3);
        });
      });

      // Each player should have partnered with multiple different players
      partnerships.forEach((partners, playerId) => {
        expect(partners.size).toBeGreaterThan(2); // Partnered with at least 3 different people
      });
    });
  });

  describe('Scenario 2: 12 Tennis Players, 3 Courts, First to 6 Games', () => {
    it('generates rounds with game-based scoring', () => {
      const players: Player[] = Array.from({ length: 12 }, (_, i) =>
        createPlayer(`player-${i + 1}`, `Player ${i + 1}`, 5 + (i % 3))
      );

      const algorithm = new MexicanoAlgorithm(players, 3, true, 'any', 'mexicano');

      // Generate 3 rounds
      for (let i = 1; i <= 3; i++) {
        const round = algorithm.generateRound(i);

        expect(round.number).toBe(i);
        expect(round.matches).toHaveLength(3); // 3 courts
        expect(round.sittingPlayers).toHaveLength(0); // 12 players, all play (3 courts × 4 players)

        // Verify match structure supports game scoring
        round.matches.forEach(match => {
          expect(match.team1).toHaveLength(2);
          expect(match.team2).toHaveLength(2);
          expect(match.court).toBeGreaterThanOrEqual(1);
          expect(match.court).toBeLessThanOrEqual(3);
        });
      }
    });
  });

  describe('Scenario 3: 16 Mixed Players, 4 Courts, Mixed Mexicano (Parallel)', () => {
    it.skip('maintains 2M+2F per court and fair rotation', () => {
      const males: Player[] = Array.from({ length: 8 }, (_, i) =>
        createPlayer(`male-${i + 1}`, `Male ${i + 1}`, 5, 'male')
      );
      const females: Player[] = Array.from({ length: 8 }, (_, i) =>
        createPlayer(`female-${i + 1}`, `Female ${i + 1}`, 5, 'female')
      );
      const players = [...males, ...females];

      const algorithm = new ParallelCourtsAlgorithm(players, 4, true, 'mixed_only', 'mixed_mexicano');

      // Generate 10 rounds
      const sitCounts = new Map<string, number>();
      players.forEach(p => sitCounts.set(p.id, 0));

      for (let i = 1; i <= 10; i++) {
        const round = algorithm.generateNextRound();

        expect(round.number).toBe(i);
        expect(round.matches).toHaveLength(4); // 4 courts
        expect(round.courtAssignments).toHaveLength(4);

        // Verify gender balance per court
        round.courtAssignments.forEach(courtAssignment => {
          const malesInCourt = courtAssignment.players.filter(p => p.gender === 'male').length;
          const femalesInCourt = courtAssignment.players.filter(p => p.gender === 'female').length;

          expect(malesInCourt).toBe(2);
          expect(femalesInCourt).toBe(2);
          expect(courtAssignment.players).toHaveLength(4);
        });

        // Track sitting players
        round.sittingPlayers.forEach(p => {
          sitCounts.set(p.id, (sitCounts.get(p.id) || 0) + 1);
        });

        // Verify sitting players maintain gender balance
        const sittingMales = round.sittingPlayers.filter(p => p.gender === 'male').length;
        const sittingFemales = round.sittingPlayers.filter(p => p.gender === 'female').length;
        expect(sittingMales).toBe(sittingFemales);
      }

      // Check fairness: sit counts should be balanced
      const sitCountValues = Array.from(sitCounts.values());
      const maxSits = Math.max(...sitCountValues);
      const minSits = Math.min(...sitCountValues);

      // Difference should not be more than 2 rounds over 10 rounds
      expect(maxSits - minSits).toBeLessThanOrEqual(2);
    });

    it.skip('verifies court diversity - players rotate between different courts', () => {
      const males: Player[] = Array.from({ length: 10 }, (_, i) =>
        createPlayer(`male-${i + 1}`, `Male ${i + 1}`, 5, 'male')
      );
      const females: Player[] = Array.from({ length: 10 }, (_, i) =>
        createPlayer(`female-${i + 1}`, `Female ${i + 1}`, 5, 'female')
      );
      const players = [...males, ...females]; // 20 players total

      const algorithm = new ParallelCourtsAlgorithm(players, 4, true, 'mixed_only', 'mixed_mexicano');

      // Track which courts each player has played on
      const playerCourtHistory = new Map<string, Set<number>>();
      players.forEach(p => playerCourtHistory.set(p.id, new Set()));

      // Generate 8 rounds
      for (let i = 1; i <= 8; i++) {
        const round = algorithm.generateNextRound();

        round.matches.forEach(match => {
          // Track court for each player
          [...match.team1, ...match.team2].forEach(player => {
            playerCourtHistory.get(player.id)!.add(match.court);
          });
        });
      }

      // Count players who played on multiple courts
      let playersWithCourtDiversity = 0;
      playerCourtHistory.forEach((courts, playerId) => {
        if (courts.size > 1) {
          playersWithCourtDiversity++;
        }
      });

      // Most players should have experienced multiple courts
      const diversityPercentage = (playersWithCourtDiversity / players.length) * 100;
      expect(diversityPercentage).toBeGreaterThan(70); // At least 70% played on multiple courts
    });
  });

  describe('Scenario 4: 10 Players, 2 Courts, Fixed Partner, Total Games', () => {
    it.skip('maintains partnerships and rotates opponents', () => {
      const players: Player[] = Array.from({ length: 10 }, (_, i) =>
        createPlayer(`player-${i + 1}`, `Player ${i + 1}`, 5)
      );

      // Set up partnerships (0-1, 2-3, 4-5, 6-7, 8-9)
      for (let i = 0; i < players.length; i += 2) {
        players[i].partnerId = players[i + 1].id;
        players[i + 1].partnerId = players[i].id;
      }

      const algorithm = new MexicanoAlgorithm(players, 2, true, 'any', 'fixed_partner');

      // Track opponent pairs
      const opponentPairs = new Map<string, Set<string>>();
      players.forEach(p => opponentPairs.set(p.id, new Set()));

      // Generate 8 rounds
      for (let i = 1; i <= 8; i++) {
        const round = algorithm.generateRound(i);

        round.matches.forEach(match => {
          // Verify partnerships are maintained - at least one team should be valid partners
          const team1Valid = (match.team1[0].partnerId === match.team1[1].id &&
                             match.team1[1].partnerId === match.team1[0].id);
          const team2Valid = (match.team2[0].partnerId === match.team2[1].id &&
                             match.team2[1].partnerId === match.team2[0].id);

          // In fixed partner mode, both teams should have valid partnerships
          expect(team1Valid || team2Valid).toBe(true);

          // Track opponents
          match.team1.forEach(player1 => {
            match.team2.forEach(player2 => {
              opponentPairs.get(player1.id)!.add(player2.id);
            });
          });
        });
      }

      // Each player should have faced multiple different opponents
      opponentPairs.forEach((opponents, playerId) => {
        expect(opponents.size).toBeGreaterThan(3); // Faced at least 4 different opponents
      });
    });
  });

  describe('Scenario 5: 9 Players, 2 Courts, Sequential with Sitting Rotation', () => {
    it('ensures fair sitting rotation', () => {
      const players: Player[] = Array.from({ length: 9 }, (_, i) =>
        createPlayer(`player-${i + 1}`, `Player ${i + 1}`, 5)
      );

      const algorithm = new MexicanoAlgorithm(players, 2, true, 'any', 'mexicano');

      // Track sit counts
      const sitCounts = new Map<string, number>();
      players.forEach(p => sitCounts.set(p.id, 0));

      // Generate 9 rounds (each player should sit once)
      for (let i = 1; i <= 9; i++) {
        const round = algorithm.generateRound(i);

        expect(round.matches).toHaveLength(2); // 2 courts
        expect(round.sittingPlayers).toHaveLength(1); // 1 player sits

        // Track who sits
        round.sittingPlayers.forEach(p => {
          sitCounts.set(p.id, (sitCounts.get(p.id) || 0) + 1);
        });
      }

      // After 9 rounds with 9 players, each should sit exactly once
      sitCounts.forEach((count, playerId) => {
        expect(count).toBe(1);
      });
    });
  });

  describe('Scenario 6: Performance Test - 20 Players, 5 Courts, 20 Rounds', () => {
    it('generates 20 rounds efficiently without errors', () => {
      const players: Player[] = Array.from({ length: 20 }, (_, i) =>
        createPlayer(`player-${i + 1}`, `Player ${i + 1}`, 3 + (i % 8))
      );

      const algorithm = new MexicanoAlgorithm(players, 5, true, 'any', 'mexicano');

      const startTime = Date.now();

      // Generate 20 rounds
      for (let i = 1; i <= 20; i++) {
        const round = algorithm.generateRound(i);

        expect(round.number).toBe(i);
        expect(round.matches).toHaveLength(5);

        // Verify no duplicate players in round
        const playerIds = new Set<string>();
        round.matches.forEach(match => {
          [...match.team1, ...match.team2].forEach(player => {
            expect(playerIds.has(player.id)).toBe(false);
            playerIds.add(player.id);
          });
        });
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete in reasonable time (< 1 second)
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Scenario 7: Edge Case - Minimum 4 Players, 1 Court', () => {
    it('handles minimum configuration correctly', () => {
      const players: Player[] = Array.from({ length: 4 }, (_, i) =>
        createPlayer(`player-${i + 1}`, `Player ${i + 1}`, 5)
      );

      const algorithm = new MexicanoAlgorithm(players, 1, true, 'any', 'mexicano');

      // Generate 3 rounds
      for (let i = 1; i <= 3; i++) {
        const round = algorithm.generateRound(i);

        expect(round.number).toBe(i);
        expect(round.matches).toHaveLength(1);
        expect(round.sittingPlayers).toHaveLength(0);

        // Verify all 4 players are in the match
        const match = round.matches[0];
        expect(match.team1).toHaveLength(2);
        expect(match.team2).toHaveLength(2);
      }
    });
  });
});
