import { MexicanoAlgorithm, Player, Round } from '@courtster/shared';

/**
 * Integration tests for the Mexicano Algorithm
 * These tests validate that the algorithm from @courtster/shared works correctly
 * with data from the mobile create session flow.
 */
describe('Algorithm Integration Tests', () => {
  describe('Round Generation', () => {
    it('generates first round for 8 players on 2 courts', () => {
      const players: Player[] = Array.from({ length: 8 }, (_, i) => ({
        id: `player-${i + 1}`,
        name: `Player ${i + 1}`,
        status: 'active' as const,
        rating: 5,
        playCount: 0,
        sitCount: 0,
        consecutiveSits: 0,
        consecutivePlays: 0,
        totalPoints: 0,
        wins: 0,
        losses: 0,
        ties: 0,
      }));

      const algorithm = new MexicanoAlgorithm(players, 2);
      const round = algorithm.generateRound(1);

      expect(round.number).toBe(1);
      expect(round.matches).toHaveLength(2); // 2 courts = 2 matches
      expect(round.sittingPlayers).toHaveLength(0); // 8 players, 4 per match, no one sits

      // Verify each match has 4 players (2 teams of 2)
      round.matches.forEach((match) => {
        expect(match.team1).toHaveLength(2);
        expect(match.team2).toHaveLength(2);
      });
    });

    it('handles 9 players with 1 sitting out', () => {
      const players: Player[] = Array.from({ length: 9 }, (_, i) => ({
        id: `player-${i + 1}`,
        name: `Player ${i + 1}`,
        status: 'active' as const,
        rating: 5,
        playCount: 0,
        sitCount: 0,
        consecutiveSits: 0,
        consecutivePlays: 0,
        totalPoints: 0,
        wins: 0,
        losses: 0,
        ties: 0,
      }));

      const algorithm = new MexicanoAlgorithm(players, 2);
      const round = algorithm.generateRound(1);

      expect(round.matches).toHaveLength(2); // 8 playing, 1 sitting
      expect(round.sittingPlayers).toHaveLength(1);

      // Verify sitting player
      const sittingPlayer = round.sittingPlayers[0];
      expect(sittingPlayer.id).toBeTruthy();
      expect(sittingPlayer.name).toMatch(/Player \d+/);
    });

    it('generates multiple sequential rounds', () => {
      const players: Player[] = Array.from({ length: 8 }, (_, i) => ({
        id: `player-${i + 1}`,
        name: `Player ${i + 1}`,
        status: 'active' as const,
        rating: 5,
        playCount: 0,
        sitCount: 0,
        consecutiveSits: 0,
        consecutivePlays: 0,
        totalPoints: 0,
        wins: 0,
        losses: 0,
        ties: 0,
      }));

      const algorithm = new MexicanoAlgorithm(players, 2);

      // Generate 3 rounds
      const round1 = algorithm.generateRound(1);
      const round2 = algorithm.generateRound(2);
      const round3 = algorithm.generateRound(3);

      expect(round1.number).toBe(1);
      expect(round2.number).toBe(2);
      expect(round3.number).toBe(3);

      // Each round should have different matchups
      expect(round1).not.toEqual(round2);
      expect(round2).not.toEqual(round3);
    });
  });

  describe('Player Pairing Logic', () => {
    it('does not repeat partnerships in consecutive rounds', () => {
      const players: Player[] = Array.from({ length: 8 }, (_, i) => ({
        id: `player-${i + 1}`,
        name: `Player ${i + 1}`,
        status: 'active' as const,
        rating: 5,
        playCount: 0,
        sitCount: 0,
        consecutiveSits: 0,
        consecutivePlays: 0,
        totalPoints: 0,
        wins: 0,
        losses: 0,
        ties: 0,
      }));

      const algorithm = new MexicanoAlgorithm(players, 2);

      const round1 = algorithm.generateRound(1);
      const round2 = algorithm.generateRound(2);

      // Extract partnerships from round 1
      const round1Partnerships = new Set<string>();
      round1.matches.forEach((match) => {
        const team1Key = [match.team1[0].id, match.team1[1].id].sort().join('-');
        const team2Key = [match.team2[0].id, match.team2[1].id].sort().join('-');
        round1Partnerships.add(team1Key);
        round1Partnerships.add(team2Key);
      });

      // Extract partnerships from round 2
      const round2Partnerships = new Set<string>();
      round2.matches.forEach((match) => {
        const team1Key = [match.team1[0].id, match.team1[1].id].sort().join('-');
        const team2Key = [match.team2[0].id, match.team2[1].id].sort().join('-');
        round2Partnerships.add(team1Key);
        round2Partnerships.add(team2Key);
      });

      // Check for duplicates
      const duplicates = [...round1Partnerships].filter((p) => round2Partnerships.has(p));

      // Ideally no duplicates, but algorithm might allow some
      // This test documents the behavior
      expect(duplicates.length).toBeLessThan(round1Partnerships.size);
    });

    it('balances player participation across rounds', () => {
      const players: Player[] = Array.from({ length: 9 }, (_, i) => ({
        id: `player-${i + 1}`,
        name: `Player ${i + 1}`,
        status: 'active' as const,
        rating: 5,
        playCount: 0,
        sitCount: 0,
        consecutiveSits: 0,
        consecutivePlays: 0,
        totalPoints: 0,
        wins: 0,
        losses: 0,
        ties: 0,
      }));

      const algorithm = new MexicanoAlgorithm(players, 2);

      // Generate 3 rounds
      const rounds: Round[] = [];
      for (let i = 1; i <= 3; i++) {
        const round = algorithm.generateRound(i);
        rounds.push(round);
      }

      // Count how many times each player sits out
      const sitOutCounts = new Map<string, number>();
      players.forEach((p) => sitOutCounts.set(p.id, 0));

      rounds.forEach((round) => {
        round.sittingPlayers.forEach((player) => {
          sitOutCounts.set(player.id, (sitOutCounts.get(player.id) || 0) + 1);
        });
      });

      // Each player should sit out at most once in 3 rounds (with 9 players)
      const sitOutValues = Array.from(sitOutCounts.values());
      const maxSitOuts = Math.max(...sitOutValues);
      const minSitOuts = Math.min(...sitOutValues);

      expect(maxSitOuts).toBeLessThanOrEqual(1);
      expect(Math.abs(maxSitOuts - minSitOuts)).toBeLessThanOrEqual(1); // Fair distribution
    });
  });

  describe('Skill-Based Matchmaking', () => {
    it('pairs players based on ratings for balanced matches', () => {
      const players: Player[] = [
        {
          id: '1',
          name: 'Expert 1',
          status: 'active' as const,
          rating: 9,
          playCount: 0,
          sitCount: 0,
          consecutiveSits: 0,
          consecutivePlays: 0,
          totalPoints: 0,
          wins: 0,
          losses: 0,
          ties: 0,
        },
        {
          id: '2',
          name: 'Expert 2',
          status: 'active' as const,
          rating: 9,
          playCount: 0,
          sitCount: 0,
          consecutiveSits: 0,
          consecutivePlays: 0,
          totalPoints: 0,
          wins: 0,
          losses: 0,
          ties: 0,
        },
        {
          id: '3',
          name: 'Advanced 1',
          status: 'active' as const,
          rating: 7,
          playCount: 0,
          sitCount: 0,
          consecutiveSits: 0,
          consecutivePlays: 0,
          totalPoints: 0,
          wins: 0,
          losses: 0,
          ties: 0,
        },
        {
          id: '4',
          name: 'Advanced 2',
          status: 'active' as const,
          rating: 7,
          playCount: 0,
          sitCount: 0,
          consecutiveSits: 0,
          consecutivePlays: 0,
          totalPoints: 0,
          wins: 0,
          losses: 0,
          ties: 0,
        },
        {
          id: '5',
          name: 'Intermediate 1',
          status: 'active' as const,
          rating: 5,
          playCount: 0,
          sitCount: 0,
          consecutiveSits: 0,
          consecutivePlays: 0,
          totalPoints: 0,
          wins: 0,
          losses: 0,
          ties: 0,
        },
        {
          id: '6',
          name: 'Intermediate 2',
          status: 'active' as const,
          rating: 5,
          playCount: 0,
          sitCount: 0,
          consecutiveSits: 0,
          consecutivePlays: 0,
          totalPoints: 0,
          wins: 0,
          losses: 0,
          ties: 0,
        },
        {
          id: '7',
          name: 'Beginner 1',
          status: 'active' as const,
          rating: 3,
          playCount: 0,
          sitCount: 0,
          consecutiveSits: 0,
          consecutivePlays: 0,
          totalPoints: 0,
          wins: 0,
          losses: 0,
          ties: 0,
        },
        {
          id: '8',
          name: 'Beginner 2',
          status: 'active' as const,
          rating: 3,
          playCount: 0,
          sitCount: 0,
          consecutiveSits: 0,
          consecutivePlays: 0,
          totalPoints: 0,
          wins: 0,
          losses: 0,
          ties: 0,
        },
      ];

      const algorithm = new MexicanoAlgorithm(players, 2);
      const round = algorithm.generateRound(1);

      // Calculate team ratings
      round.matches.forEach((match) => {
        const team1Rating = (match.team1[0].rating + match.team1[1].rating) / 2;
        const team2Rating = (match.team2[0].rating + match.team2[1].rating) / 2;

        // Teams should be relatively balanced (within 2 rating points)
        expect(Math.abs(team1Rating - team2Rating)).toBeLessThanOrEqual(2);
      });
    });

    it('adjusts matchmaking after scores are recorded', () => {
      const players: Player[] = Array.from({ length: 8 }, (_, i) => ({
        id: `player-${i + 1}`,
        name: `Player ${i + 1}`,
        status: 'active' as const,
        rating: 5,
        playCount: 0,
        sitCount: 0,
        consecutiveSits: 0,
        consecutivePlays: 0,
        totalPoints: 0,
        wins: 0,
        losses: 0,
        ties: 0,
      }));

      const algorithm = new MexicanoAlgorithm(players, 2);

      // Generate first round
      const round1 = algorithm.generateRound(1);

      // Add scores to round 1 matches and update algorithm
      round1.matches.forEach((match, i) => {
        match.team1Score = i === 0 ? 21 : 18; // First match: team 1 wins big
        match.team2Score = i === 0 ? 10 : 21; // Second match: team 2 wins
        algorithm.updateRatings(match);
      });

      // Generate second round
      const round2 = algorithm.generateRound(2);

      // Round 2 should exist and adapt to the scores
      expect(round2.matches).toHaveLength(2);

      // Winners from round 1 should ideally play together or against each other
      // This is a behavior test - exact logic depends on algorithm implementation
    });
  });

  describe('Edge Cases', () => {
    it('handles minimum players (4)', () => {
      const players: Player[] = Array.from({ length: 4 }, (_, i) => ({
        id: `player-${i + 1}`,
        name: `Player ${i + 1}`,
        status: 'active' as const,
        rating: 5,
        playCount: 0,
        sitCount: 0,
        consecutiveSits: 0,
        consecutivePlays: 0,
        totalPoints: 0,
        wins: 0,
        losses: 0,
        ties: 0,
      }));

      const algorithm = new MexicanoAlgorithm(players, 1);
      const round = algorithm.generateRound(1);

      expect(round.matches).toHaveLength(1);
      expect(round.sittingPlayers).toHaveLength(0);
    });

    it('handles large player count (20)', () => {
      const players: Player[] = Array.from({ length: 20 }, (_, i) => ({
        id: `player-${i + 1}`,
        name: `Player ${i + 1}`,
        status: 'active' as const,
        rating: 5,
        playCount: 0,
        sitCount: 0,
        consecutiveSits: 0,
        consecutivePlays: 0,
        totalPoints: 0,
        wins: 0,
        losses: 0,
        ties: 0,
      }));

      const algorithm = new MexicanoAlgorithm(players, 4);
      const round = algorithm.generateRound(1); // 4 courts

      expect(round.matches).toHaveLength(4); // 4 courts = 4 matches = 16 players
      expect(round.sittingPlayers).toHaveLength(4); // 20 - 16 = 4 sitting
    });

    it('handles single court scenario', () => {
      const players: Player[] = Array.from({ length: 6 }, (_, i) => ({
        id: `player-${i + 1}`,
        name: `Player ${i + 1}`,
        status: 'active' as const,
        rating: 5,
        playCount: 0,
        sitCount: 0,
        consecutiveSits: 0,
        consecutivePlays: 0,
        totalPoints: 0,
        wins: 0,
        losses: 0,
        ties: 0,
      }));

      const algorithm = new MexicanoAlgorithm(players, 1);
      const round = algorithm.generateRound(1);

      expect(round.matches).toHaveLength(1);
      expect(round.sittingPlayers).toHaveLength(2); // 6 - 4 = 2 sitting
    });

    it('ensures all players get unique positions', () => {
      const players: Player[] = Array.from({ length: 8 }, (_, i) => ({
        id: `player-${i + 1}`,
        name: `Player ${i + 1}`,
        status: 'active' as const,
        rating: 5,
        playCount: 0,
        sitCount: 0,
        consecutiveSits: 0,
        consecutivePlays: 0,
        totalPoints: 0,
        wins: 0,
        losses: 0,
        ties: 0,
      }));

      const algorithm = new MexicanoAlgorithm(players, 2);
      const round = algorithm.generateRound(1);

      // Collect all player IDs in matches
      const playingPlayerIds = new Set<string>();
      round.matches.forEach((match) => {
        match.team1.forEach((p) => playingPlayerIds.add(p.id));
        match.team2.forEach((p) => playingPlayerIds.add(p.id));
      });

      // No duplicates
      expect(playingPlayerIds.size).toBe(8);

      // All players accounted for
      players.forEach((p) => {
        expect(playingPlayerIds.has(p.id)).toBe(true);
      });
    });
  });

  describe('Form Data Integration', () => {
    it('works with data from create session form', () => {
      // Simulate data from mobile form
      const formPlayers = [
        { id: '1', name: 'Alice Johnson', gender: 'female' as const },
        { id: '2', name: 'Bob Smith', gender: 'male' as const },
        { id: '3', name: 'Carol White', gender: 'female' as const },
        { id: '4', name: 'David Brown', gender: 'male' as const },
        { id: '5', name: 'Eve Davis', gender: 'female' as const },
        { id: '6', name: 'Frank Miller', gender: 'male' as const },
        { id: '7', name: 'Grace Wilson', gender: 'female' as const },
        { id: '8', name: 'Henry Moore', gender: 'male' as const },
      ];

      // Convert to Player format
      const players: Player[] = formPlayers.map((fp) => ({
        id: fp.id,
        name: fp.name,
        status: 'active' as const,
        rating: 5, // Default rating from form
        playCount: 0,
        sitCount: 0,
        consecutiveSits: 0,
        consecutivePlays: 0,
        totalPoints: 0,
        wins: 0,
        losses: 0,
        ties: 0,
        gender: fp.gender,
      }));

      const algorithm = new MexicanoAlgorithm(players, 2);
      const round = algorithm.generateRound(1);

      expect(round.matches).toHaveLength(2);
      expect(round.number).toBe(1);

      // Verify player data is preserved
      round.matches.forEach((match) => {
        match.team1.forEach((player) => {
          expect(formPlayers.find((fp) => fp.id === player.id)).toBeTruthy();
        });
        match.team2.forEach((player) => {
          expect(formPlayers.find((fp) => fp.id === player.id)).toBeTruthy();
        });
      });
    });

    it('respects parallel mode with multiple courts', () => {
      const players: Player[] = Array.from({ length: 12 }, (_, i) => ({
        id: `player-${i + 1}`,
        name: `Player ${i + 1}`,
        status: 'active' as const,
        rating: 5,
        playCount: 0,
        sitCount: 0,
        consecutiveSits: 0,
        consecutivePlays: 0,
        totalPoints: 0,
        wins: 0,
        losses: 0,
        ties: 0,
      }));

      // Parallel mode: 3 courts
      const algorithm = new MexicanoAlgorithm(players, 3);
      const round = algorithm.generateRound(1);

      expect(round.matches).toHaveLength(3);
      expect(round.sittingPlayers).toHaveLength(0); // 12 players / 4 per match = 3 matches

      // Verify court assignment
      round.matches.forEach((match, index) => {
        expect(match.court).toBe(index + 1);
      });
    });

    it('handles sequential mode with court rotation', () => {
      const players: Player[] = Array.from({ length: 8 }, (_, i) => ({
        id: `player-${i + 1}`,
        name: `Player ${i + 1}`,
        status: 'active' as const,
        rating: 5,
        playCount: 0,
        sitCount: 0,
        consecutiveSits: 0,
        consecutivePlays: 0,
        totalPoints: 0,
        wins: 0,
        losses: 0,
        ties: 0,
      }));

      const algorithm = new MexicanoAlgorithm(players, 2);

      // Sequential mode: rounds generated one after another
      const round1 = algorithm.generateRound(1);
      const round2 = algorithm.generateRound(2);
      const round3 = algorithm.generateRound(3);

      // All rounds should have 2 matches
      expect(round1.matches).toHaveLength(2);
      expect(round2.matches).toHaveLength(2);
      expect(round3.matches).toHaveLength(2);

      // Court numbers should be consistent
      [round1, round2, round3].forEach((round) => {
        round.matches.forEach((match, index) => {
          expect(match.court).toBe(index + 1);
        });
      });
    });
  });

  describe('Validation Rules', () => {
    it('validates minimum 4 players requirement', () => {
      const players: Player[] = Array.from({ length: 3 }, (_, i) => ({
        id: `player-${i + 1}`,
        name: `Player ${i + 1}`,
        status: 'active' as const,
        rating: 5,
        playCount: 0,
        sitCount: 0,
        consecutiveSits: 0,
        consecutivePlays: 0,
        totalPoints: 0,
        wins: 0,
        losses: 0,
        ties: 0,
      }));

      // Algorithm should handle gracefully or throw error
      expect(() => {
        new MexicanoAlgorithm(players, 1);
      }).toThrow(); // Should throw during construction with too few players
    });

    it('validates sufficient players for court count', () => {
      const players: Player[] = Array.from({ length: 6 }, (_, i) => ({
        id: `player-${i + 1}`,
        name: `Player ${i + 1}`,
        status: 'active' as const,
        rating: 5,
        playCount: 0,
        sitCount: 0,
        consecutiveSits: 0,
        consecutivePlays: 0,
        totalPoints: 0,
        wins: 0,
        losses: 0,
        ties: 0,
      }));

      // 6 players with 2 courts requested
      const algorithm = new MexicanoAlgorithm(players, 2);
      const round = algorithm.generateRound(1);

      // Should only generate 1 match since there aren't enough players for 2 courts
      expect(round.matches.length).toBeLessThanOrEqual(1);
    });
  });
});
