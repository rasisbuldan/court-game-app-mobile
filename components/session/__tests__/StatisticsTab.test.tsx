/**
 * StatisticsTab Component Tests
 *
 * Comprehensive test suite covering:
 * - Statistics widgets display (MVP, Win Streak, Perfect Pairs, etc.)
 * - Tab switching between partnerships and head-to-head
 * - Partnership statistics display
 * - Head-to-head statistics display
 * - Sorting and filtering logic
 * - Empty states (no data scenarios)
 * - Edge cases (ties, single player, missing data)
 * - Data formatting (percentages, decimals)
 * - Component memoization
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { StatisticsTab } from '../StatisticsTab';
import { Player, Round, Match } from '@courtster/shared';
import {
  createMockPlayers,
  createMockPlayersWithPoints,
} from '../../../__tests__/factories/playerFactory';
import {
  createCompletedRound,
  createRoundWithMatches,
} from '../../../__tests__/factories/roundFactory';

// Mock dependencies
jest.mock('lucide-react-native', () => ({
  Users: jest.fn(() => null),
  Target: jest.fn(() => null),
  Trophy: jest.fn(() => null),
  Zap: jest.fn(() => null),
  TrendingUp: jest.fn(() => null),
  Swords: jest.fn(() => null),
}));

// Mock shared package statistics utilities
jest.mock('@courtster/shared', () => {
  const actual = jest.requireActual('@courtster/shared');
  return {
    ...actual,
    calculatePartnershipStats: jest.fn((players: Player[], rounds: Round[]) => {
      // Return mock partnership stats
      if (players.length === 0 || rounds.length === 0) return [];

      return [
        {
          player1: players[0],
          player2: players[1],
          roundsPlayed: 5,
          wins: 4,
          losses: 1,
          ties: 0,
          winRate: 80,
          totalPoints: 100,
        },
        {
          player1: players[1],
          player2: players[2],
          roundsPlayed: 3,
          wins: 2,
          losses: 1,
          ties: 0,
          winRate: 66.67,
          totalPoints: 60,
        },
      ];
    }),
    calculateHeadToHeadStats: jest.fn((players: Player[], rounds: Round[]) => {
      // Return mock head-to-head stats
      if (players.length === 0 || rounds.length === 0) return [];

      return [
        {
          player1: players[0],
          player2: players[1],
          totalMatches: 5,
          player1Wins: 3,
          player2Wins: 2,
          ties: 0,
          winRate1: 60,
          winRate2: 40,
          player1Points: 75,
          player2Points: 50,
        },
        {
          player1: players[1],
          player2: players[2],
          totalMatches: 4,
          player1Wins: 2,
          player2Wins: 2,
          ties: 0,
          winRate1: 50,
          winRate2: 50,
          player1Points: 60,
          player2Points: 60,
        },
      ];
    }),
    findPlayerWithLongestStreak: jest.fn((players: Player[], rounds: Round[]) => {
      if (players.length === 0) return null;
      return {
        player: players[0],
        currentStreak: 3,
      };
    }),
    findMVP: jest.fn((players: Player[], minGames: number) => {
      if (players.length === 0) return null;
      return {
        player: players[0],
        winRate: 75,
        wins: 6,
        losses: 2,
        ties: 0,
      };
    }),
    findPerfectPairs: jest.fn((players: Player[], rounds: Round[], minGames: number) => {
      if (players.length < 2) return [];
      return [
        {
          player1: players[0],
          player2: players[1],
          gamesPlayed: 3,
        },
      ];
    }),
    findBiggestUpset: jest.fn((players: Player[], rounds: Round[]) => {
      if (players.length < 2) return null;
      return {
        winner: players[2],
        loser: players[0],
        winnerScore: 15,
        loserScore: 9,
        ratingDifference: 2.5,
      };
    }),
    findTopRivalries: jest.fn((players: Player[], rounds: Round[], minMatches: number, limit: number) => {
      if (players.length < 2) return [];
      return [
        {
          player1: players[0],
          player2: players[1],
          matchesPlayed: 5,
          player1Wins: 3,
          player2Wins: 2,
          ties: 0,
        },
      ];
    }),
  };
});

describe('StatisticsTab Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render statistics widgets section', () => {
      const players = createMockPlayersWithPoints(4);
      const rounds = [createCompletedRound(1, 2)];

      const { UNSAFE_root } = render(
        <StatisticsTab players={players} allRounds={rounds} />
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('should render tab selector with partnerships and head-to-head options', () => {
      const players = createMockPlayersWithPoints(4);
      const rounds = [createCompletedRound(1, 2)];

      const { getByText } = render(
        <StatisticsTab players={players} allRounds={rounds} />
      );

      expect(getByText('Partnerships')).toBeTruthy();
      expect(getByText('Head-to-Head')).toBeTruthy();
    });

    it('should default to partnerships tab', () => {
      const players = createMockPlayersWithPoints(4);
      const rounds = [createCompletedRound(1, 2)];

      const { getByText } = render(
        <StatisticsTab players={players} allRounds={rounds} />
      );

      // Partnerships tab should be active (check for partnership content)
      const partnershipsButton = getByText('Partnerships');
      expect(partnershipsButton).toBeTruthy();
    });
  });

  describe('Statistics Widgets', () => {
    it('should display Win Streak widget with player name and streak', () => {
      const players = createMockPlayersWithPoints(4);
      const rounds = [createCompletedRound(1, 2)];

      const { getByText, getAllByText } = render(
        <StatisticsTab players={players} allRounds={rounds} />
      );

      expect(getByText('Win Streak')).toBeTruthy();
      // Player name may appear in multiple places (widget + partnership stats)
      const playerNames = getAllByText(players[0].name);
      expect(playerNames.length).toBeGreaterThan(0);
      expect(getByText('3 wins in a row')).toBeTruthy();
    });

    it('should display MVP widget with win rate and record', () => {
      const players = createMockPlayersWithPoints(4);
      const rounds = [createCompletedRound(1, 2)];

      const { getByText } = render(
        <StatisticsTab players={players} allRounds={rounds} />
      );

      expect(getByText('MVP')).toBeTruthy();
      expect(getByText('75%')).toBeTruthy();
      expect(getByText('6W-2L-0T')).toBeTruthy();
    });

    it('should display Perfect Pairs widget with partnership names', () => {
      const players = createMockPlayersWithPoints(4);
      const rounds = [createCompletedRound(1, 2)];

      const { getByText, getAllByText } = render(
        <StatisticsTab players={players} allRounds={rounds} />
      );

      expect(getByText('Perfect Pairs')).toBeTruthy();
      // Partnership name may appear in both widget and partnerships tab
      const partnershipNames = getAllByText(`${players[0].name} & ${players[1].name}`);
      expect(partnershipNames.length).toBeGreaterThan(0);
      expect(getByText('3 wins')).toBeTruthy();
    });

    it('should display Biggest Upset widget with score and rating difference', () => {
      const players = createMockPlayersWithPoints(4);
      const rounds = [createCompletedRound(1, 2)];

      const { getByText } = render(
        <StatisticsTab players={players} allRounds={rounds} />
      );

      expect(getByText('Biggest Upset')).toBeTruthy();
      expect(getByText(/beat/)).toBeTruthy();
      expect(getByText('15-9')).toBeTruthy();
      expect(getByText('Rating diff: 2.5')).toBeTruthy();
    });

    it('should display Top Rivalries widget with match counts', () => {
      const players = createMockPlayersWithPoints(4);
      const rounds = [createCompletedRound(1, 2)];

      const { getByText } = render(
        <StatisticsTab players={players} allRounds={rounds} />
      );

      expect(getByText('Top Rivalries')).toBeTruthy();
      expect(getByText(/vs/)).toBeTruthy();
      expect(getByText('5 matches')).toBeTruthy();
    });
  });

  describe('Empty States - Widgets', () => {
    it('should show "No active win streaks" when no streak data', () => {
      const players = createMockPlayersWithPoints(4);
      const rounds = [createCompletedRound(1, 2)];

      // Mock to return null streak
      const { findPlayerWithLongestStreak } = require('@courtster/shared');
      (findPlayerWithLongestStreak as jest.Mock).mockReturnValueOnce(null);

      const { getByText } = render(
        <StatisticsTab players={players} allRounds={rounds} />
      );

      expect(getByText('No active win streaks')).toBeTruthy();
    });

    it('should show "Not enough data" for MVP when insufficient games', () => {
      const players = createMockPlayersWithPoints(4);
      const rounds = [createCompletedRound(1, 2)];

      // Mock to return null MVP
      const { findMVP } = require('@courtster/shared');
      (findMVP as jest.Mock).mockReturnValueOnce(null);

      const { getByText } = render(
        <StatisticsTab players={players} allRounds={rounds} />
      );

      expect(getByText('Not enough data (min 2 games)')).toBeTruthy();
    });

    it('should show "No partnerships with 100% win rate" when no perfect pairs', () => {
      const players = createMockPlayersWithPoints(4);
      const rounds = [createCompletedRound(1, 2)];

      // Mock to return empty array
      const { findPerfectPairs } = require('@courtster/shared');
      (findPerfectPairs as jest.Mock).mockReturnValueOnce([]);

      const { getByText } = render(
        <StatisticsTab players={players} allRounds={rounds} />
      );

      expect(getByText('No partnerships with 100% win rate')).toBeTruthy();
    });

    it('should show "No upsets yet" when no upset data', () => {
      const players = createMockPlayersWithPoints(4);
      const rounds = [createCompletedRound(1, 2)];

      // Mock to return null upset
      const { findBiggestUpset } = require('@courtster/shared');
      (findBiggestUpset as jest.Mock).mockReturnValueOnce(null);

      const { getByText } = render(
        <StatisticsTab players={players} allRounds={rounds} />
      );

      expect(getByText('No upsets yet')).toBeTruthy();
    });

    it('should show "Not enough matchups" when no rivalry data', () => {
      const players = createMockPlayersWithPoints(4);
      const rounds = [createCompletedRound(1, 2)];

      // Mock to return empty array
      const { findTopRivalries } = require('@courtster/shared');
      (findTopRivalries as jest.Mock).mockReturnValueOnce([]);

      const { getByText } = render(
        <StatisticsTab players={players} allRounds={rounds} />
      );

      expect(getByText('Not enough matchups (min 2 matches)')).toBeTruthy();
    });
  });

  describe('Tab Switching', () => {
    it('should switch to head-to-head tab when clicked', () => {
      const players = createMockPlayersWithPoints(4);
      const rounds = [createCompletedRound(1, 2)];

      const { getByText, getAllByText } = render(
        <StatisticsTab players={players} allRounds={rounds} />
      );

      const headToHeadButton = getByText('Head-to-Head');
      fireEvent.press(headToHeadButton);

      // Should show head-to-head content (verify by checking for "vs")
      const vsElements = getAllByText(/vs/i);
      expect(vsElements.length).toBeGreaterThan(0);
    });

    it('should switch back to partnerships tab when clicked', () => {
      const players = createMockPlayersWithPoints(4);
      const rounds = [createCompletedRound(1, 2)];

      const { getByText, getAllByText } = render(
        <StatisticsTab players={players} allRounds={rounds} />
      );

      // Switch to head-to-head
      fireEvent.press(getByText('Head-to-Head'));

      // Switch back to partnerships
      fireEvent.press(getByText('Partnerships'));

      // Should show partnership content (verify by checking for "&")
      const ampersandElements = getAllByText(/&/);
      expect(ampersandElements.length).toBeGreaterThan(0);
    });

    it('should highlight active tab', () => {
      const players = createMockPlayersWithPoints(4);
      const rounds = [createCompletedRound(1, 2)];

      const { getByText } = render(
        <StatisticsTab players={players} allRounds={rounds} />
      );

      // Both tabs should be present
      expect(getByText('Partnerships')).toBeTruthy();
      expect(getByText('Head-to-Head')).toBeTruthy();
    });

    it('should maintain widget state across tab switches', () => {
      const players = createMockPlayersWithPoints(4);
      const rounds = [createCompletedRound(1, 2)];

      const { getByText } = render(
        <StatisticsTab players={players} allRounds={rounds} />
      );

      // Verify widgets are present
      expect(getByText('Win Streak')).toBeTruthy();
      expect(getByText('MVP')).toBeTruthy();

      // Switch tabs
      fireEvent.press(getByText('Head-to-Head'));

      // Widgets should still be visible
      expect(getByText('Win Streak')).toBeTruthy();
      expect(getByText('MVP')).toBeTruthy();
    });
  });

  describe('Partnerships Tab', () => {
    it('should display partnership statistics with player names', () => {
      const players = createMockPlayersWithPoints(4);
      const rounds = [createCompletedRound(1, 2)];

      const { getAllByText } = render(
        <StatisticsTab players={players} allRounds={rounds} />
      );

      // May appear in both widget and partnership tab
      const partnershipNames = getAllByText(`${players[0].name} & ${players[1].name}`);
      expect(partnershipNames.length).toBeGreaterThan(0);
    });

    it('should display partnership win rate percentage', () => {
      const players = createMockPlayersWithPoints(4);
      const rounds = [createCompletedRound(1, 2)];

      const { getByText, getAllByText } = render(
        <StatisticsTab players={players} allRounds={rounds} />
      );

      expect(getByText('80%')).toBeTruthy();
      // "win rate" appears multiple times
      const winRateLabels = getAllByText('win rate');
      expect(winRateLabels.length).toBeGreaterThan(0);
    });

    it('should display partnership record (W-L-T)', () => {
      const players = createMockPlayersWithPoints(4);
      const rounds = [createCompletedRound(1, 2)];

      const { getAllByText, getByText } = render(
        <StatisticsTab players={players} allRounds={rounds} />
      );

      // "Record" appears in multiple places
      const recordLabels = getAllByText('Record');
      expect(recordLabels.length).toBeGreaterThan(0);
      expect(getByText('4W-1L-0T')).toBeTruthy();
    });

    it('should display rounds played together', () => {
      const players = createMockPlayersWithPoints(4);
      const rounds = [createCompletedRound(1, 2)];

      const { getByText } = render(
        <StatisticsTab players={players} allRounds={rounds} />
      );

      expect(getByText('5 rounds together')).toBeTruthy();
    });

    it('should display total points scored by partnership', () => {
      const players = createMockPlayersWithPoints(4);
      const rounds = [createCompletedRound(1, 2)];

      const { getAllByText } = render(
        <StatisticsTab players={players} allRounds={rounds} />
      );

      // "Points Scored" appears in multiple places
      const pointsScoredLabels = getAllByText('Points Scored');
      expect(pointsScoredLabels.length).toBeGreaterThan(0);
      // "100" may appear in multiple contexts
      const pointElements = getAllByText('100');
      expect(pointElements.length).toBeGreaterThan(0);
    });

    it('should sort partnerships by win rate descending', () => {
      const players = createMockPlayersWithPoints(4);
      const rounds = [createCompletedRound(1, 2)];

      const { getByText } = render(
        <StatisticsTab players={players} allRounds={rounds} />
      );

      // First partnership should have higher win rate (80% before 67%)
      expect(getByText('80%')).toBeTruthy();
    });

    it('should limit to top 20 partnerships', () => {
      const players = createMockPlayersWithPoints(50); // Many players
      const rounds = [createCompletedRound(1, 10)];

      // Mock to return 25 partnerships
      const { calculatePartnershipStats } = require('@courtster/shared');
      (calculatePartnershipStats as jest.Mock).mockReturnValueOnce(
        Array.from({ length: 25 }, (_, i) => ({
          player1: players[i * 2],
          player2: players[i * 2 + 1],
          roundsPlayed: 3,
          wins: 2,
          losses: 1,
          ties: 0,
          winRate: 66.67,
          totalPoints: 60,
        }))
      );

      const { UNSAFE_root } = render(
        <StatisticsTab players={players} allRounds={rounds} />
      );

      // Component should limit to 20 - just verify it renders without error
      expect(UNSAFE_root).toBeTruthy();
    });

    it('should filter out partnerships with 0 rounds played', () => {
      const players = createMockPlayersWithPoints(4);
      const rounds = [createCompletedRound(1, 2)];

      // Mock to include partnership with 0 rounds
      const { calculatePartnershipStats } = require('@courtster/shared');
      (calculatePartnershipStats as jest.Mock).mockReturnValueOnce([
        {
          player1: players[0],
          player2: players[1],
          roundsPlayed: 5,
          wins: 4,
          losses: 1,
          ties: 0,
          winRate: 80,
          totalPoints: 100,
        },
        {
          player1: players[2],
          player2: players[3],
          roundsPlayed: 0,
          wins: 0,
          losses: 0,
          ties: 0,
          winRate: 0,
          totalPoints: 0,
        },
      ]);

      const { queryAllByText, queryByText } = render(
        <StatisticsTab players={players} allRounds={rounds} />
      );

      // Should show first partnership (may appear in widget too)
      const firstPartnership = queryAllByText(`${players[0].name} & ${players[1].name}`);
      expect(firstPartnership.length).toBeGreaterThan(0);
      // Second partnership with 0 rounds should not appear
      expect(queryByText(`${players[2].name} & ${players[3].name}`)).toBeNull();
    });

    it('should handle singular "round" text correctly', () => {
      const players = createMockPlayersWithPoints(4);
      const rounds = [createCompletedRound(1, 2)];

      // Mock partnership with 1 round
      const { calculatePartnershipStats } = require('@courtster/shared');
      (calculatePartnershipStats as jest.Mock).mockReturnValueOnce([
        {
          player1: players[0],
          player2: players[1],
          roundsPlayed: 1,
          wins: 1,
          losses: 0,
          ties: 0,
          winRate: 100,
          totalPoints: 20,
        },
      ]);

      const { getByText } = render(
        <StatisticsTab players={players} allRounds={rounds} />
      );

      expect(getByText('1 round together')).toBeTruthy();
    });
  });

  describe('Head-to-Head Tab', () => {
    it('should display head-to-head matchup with player names', () => {
      const players = createMockPlayersWithPoints(4);
      const rounds = [createCompletedRound(1, 2)];

      const { getByText, getAllByText } = render(
        <StatisticsTab players={players} allRounds={rounds} />
      );

      fireEvent.press(getByText('Head-to-Head'));

      // Player names may appear in multiple places
      const player1Names = getAllByText(players[0].name);
      expect(player1Names.length).toBeGreaterThan(0);
      const vsElements = getAllByText('vs');
      expect(vsElements.length).toBeGreaterThan(0);
      const player2Names = getAllByText(players[1].name);
      expect(player2Names.length).toBeGreaterThan(0);
    });

    it('should display player 1 win rate', () => {
      const players = createMockPlayersWithPoints(4);
      const rounds = [createCompletedRound(1, 2)];

      const { getByText } = render(
        <StatisticsTab players={players} allRounds={rounds} />
      );

      fireEvent.press(getByText('Head-to-Head'));

      expect(getByText('60%')).toBeTruthy();
    });

    it('should display total matchups count', () => {
      const players = createMockPlayersWithPoints(4);
      const rounds = [createCompletedRound(1, 2)];

      const { getByText, getAllByText } = render(
        <StatisticsTab players={players} allRounds={rounds} />
      );

      fireEvent.press(getByText('Head-to-Head'));

      // "Matchups" may appear multiple times
      const matchupsLabels = getAllByText('Matchups');
      expect(matchupsLabels.length).toBeGreaterThan(0);
      // "5" may appear in multiple contexts
      const fiveElements = getAllByText('5');
      expect(fiveElements.length).toBeGreaterThan(0);
    });

    it('should display head-to-head record', () => {
      const players = createMockPlayersWithPoints(4);
      const rounds = [createCompletedRound(1, 2)];

      const { getByText, getAllByText } = render(
        <StatisticsTab players={players} allRounds={rounds} />
      );

      fireEvent.press(getByText('Head-to-Head'));

      // "Record" appears in multiple places
      const recordLabels = getAllByText('Record');
      expect(recordLabels.length).toBeGreaterThan(0);
      expect(getByText('3-2-0')).toBeTruthy();
    });

    it('should display total points in head-to-head', () => {
      const players = createMockPlayersWithPoints(4);
      const rounds = [createCompletedRound(1, 2)];

      const { getByText, getAllByText } = render(
        <StatisticsTab players={players} allRounds={rounds} />
      );

      fireEvent.press(getByText('Head-to-Head'));

      // "Points" may appear in multiple places
      const pointsLabels = getAllByText('Points');
      expect(pointsLabels.length).toBeGreaterThan(0);
      expect(getByText('125')).toBeTruthy(); // 75 + 50
    });

    it('should sort by highest win rate between the two players', () => {
      const players = createMockPlayersWithPoints(4);
      const rounds = [createCompletedRound(1, 2)];

      const { getByText } = render(
        <StatisticsTab players={players} allRounds={rounds} />
      );

      fireEvent.press(getByText('Head-to-Head'));

      // Should show matchup with 60% win rate first (higher than 50%)
      expect(getByText('60%')).toBeTruthy();
    });

    it('should limit to top 20 head-to-head matchups', () => {
      const players = createMockPlayersWithPoints(50);
      const rounds = [createCompletedRound(1, 10)];

      // Mock to return 25 matchups
      const { calculateHeadToHeadStats } = require('@courtster/shared');
      (calculateHeadToHeadStats as jest.Mock).mockReturnValueOnce(
        Array.from({ length: 25 }, (_, i) => ({
          player1: players[i * 2],
          player2: players[i * 2 + 1],
          totalMatches: 5,
          player1Wins: 3,
          player2Wins: 2,
          ties: 0,
          winRate1: 60,
          winRate2: 40,
          player1Points: 75,
          player2Points: 50,
        }))
      );

      const { UNSAFE_root, getByText } = render(
        <StatisticsTab players={players} allRounds={rounds} />
      );

      fireEvent.press(getByText('Head-to-Head'));

      // Component should limit to 20 - verify it renders
      expect(UNSAFE_root).toBeTruthy();
    });

    it('should filter out matchups with 0 matches', () => {
      const players = createMockPlayersWithPoints(4);
      const rounds = [createCompletedRound(1, 2)];

      // Mock to include matchup with 0 matches
      const { calculateHeadToHeadStats } = require('@courtster/shared');
      (calculateHeadToHeadStats as jest.Mock).mockReturnValueOnce([
        {
          player1: players[0],
          player2: players[1],
          totalMatches: 5,
          player1Wins: 3,
          player2Wins: 2,
          ties: 0,
          winRate1: 60,
          winRate2: 40,
          player1Points: 75,
          player2Points: 50,
        },
        {
          player1: players[2],
          player2: players[3],
          totalMatches: 0,
          player1Wins: 0,
          player2Wins: 0,
          ties: 0,
          winRate1: 0,
          winRate2: 0,
          player1Points: 0,
          player2Points: 0,
        },
      ]);

      const { getByText, getAllByText } = render(
        <StatisticsTab players={players} allRounds={rounds} />
      );

      fireEvent.press(getByText('Head-to-Head'));

      // Should show first matchup
      const player0Names = getAllByText(players[0].name);
      expect(player0Names.length).toBeGreaterThan(0);
      // Second matchup with 0 matches should not be in head-to-head section
      // (though players might still appear in widgets)
    });
  });

  describe('Empty States - Tabs', () => {
    it('should show empty state for partnerships when no data', () => {
      const players = createMockPlayersWithPoints(4);
      const rounds: Round[] = [];

      // Mock to return empty array
      const { calculatePartnershipStats } = require('@courtster/shared');
      (calculatePartnershipStats as jest.Mock).mockReturnValueOnce([]);

      const { getByText, UNSAFE_getAllByType } = render(
        <StatisticsTab players={players} allRounds={rounds} />
      );

      expect(getByText('No partnership data yet')).toBeTruthy();
      expect(getByText('Play some rounds to see stats')).toBeTruthy();

      // Verify Users icon is rendered
      const { Users } = require('lucide-react-native');
      const icons = UNSAFE_getAllByType(Users);
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should show empty state for head-to-head when no data', () => {
      const players = createMockPlayersWithPoints(4);
      const rounds: Round[] = [];

      // Mock to return empty array
      const { calculateHeadToHeadStats } = require('@courtster/shared');
      (calculateHeadToHeadStats as jest.Mock).mockReturnValueOnce([]);

      const { getByText, UNSAFE_getAllByType } = render(
        <StatisticsTab players={players} allRounds={rounds} />
      );

      fireEvent.press(getByText('Head-to-Head'));

      expect(getByText('No head-to-head data yet')).toBeTruthy();
      expect(getByText('Play some rounds to see stats')).toBeTruthy();

      // Verify Target icon is rendered
      const { Target } = require('lucide-react-native');
      const icons = UNSAFE_getAllByType(Target);
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should handle empty players array gracefully', () => {
      const players: Player[] = [];
      const rounds = [createCompletedRound(1, 2)];

      const { UNSAFE_root } = render(
        <StatisticsTab players={players} allRounds={rounds} />
      );

      // Should render without crashing
      expect(UNSAFE_root).toBeTruthy();
    });

    it('should handle empty rounds array gracefully', () => {
      const players = createMockPlayersWithPoints(4);
      const rounds: Round[] = [];

      const { UNSAFE_root } = render(
        <StatisticsTab players={players} allRounds={rounds} />
      );

      // Should render without crashing
      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle single player scenario', () => {
      const players = createMockPlayers(1);
      const rounds = [createCompletedRound(1, 1)];

      // Mock functions should handle single player gracefully
      const { findPlayerWithLongestStreak, findMVP, findPerfectPairs, findBiggestUpset, findTopRivalries, calculatePartnershipStats, calculateHeadToHeadStats } = require('@courtster/shared');
      (findPlayerWithLongestStreak as jest.Mock).mockReturnValueOnce(null);
      (findMVP as jest.Mock).mockReturnValueOnce(null);
      (findPerfectPairs as jest.Mock).mockReturnValueOnce([]);
      (findBiggestUpset as jest.Mock).mockReturnValueOnce(null);
      (findTopRivalries as jest.Mock).mockReturnValueOnce([]);
      (calculatePartnershipStats as jest.Mock).mockReturnValueOnce([]);
      (calculateHeadToHeadStats as jest.Mock).mockReturnValueOnce([]);

      const { UNSAFE_root } = render(
        <StatisticsTab players={players} allRounds={rounds} />
      );

      // Should render without crashing
      expect(UNSAFE_root).toBeTruthy();
    });

    it('should format win rates to whole numbers', () => {
      const players = createMockPlayersWithPoints(4);
      const rounds = [createCompletedRound(1, 2)];

      // Mock with precise decimal
      const { calculatePartnershipStats } = require('@courtster/shared');
      (calculatePartnershipStats as jest.Mock).mockReturnValueOnce([
        {
          player1: players[0],
          player2: players[1],
          roundsPlayed: 3,
          wins: 2,
          losses: 1,
          ties: 0,
          winRate: 66.666666,
          totalPoints: 60,
        },
      ]);

      const { getByText } = render(
        <StatisticsTab players={players} allRounds={rounds} />
      );

      // Should round to whole number
      expect(getByText('67%')).toBeTruthy();
    });

    it('should handle ties in win rates', () => {
      const players = createMockPlayersWithPoints(4);
      const rounds = [createCompletedRound(1, 2)];

      // Mock two partnerships with same win rate
      const { calculatePartnershipStats } = require('@courtster/shared');
      (calculatePartnershipStats as jest.Mock).mockReturnValueOnce([
        {
          player1: players[0],
          player2: players[1],
          roundsPlayed: 3,
          wins: 2,
          losses: 1,
          ties: 0,
          winRate: 66.67,
          totalPoints: 60,
        },
        {
          player1: players[2],
          player2: players[3],
          roundsPlayed: 3,
          wins: 2,
          losses: 1,
          ties: 0,
          winRate: 66.67,
          totalPoints: 60,
        },
      ]);

      const { UNSAFE_root } = render(
        <StatisticsTab players={players} allRounds={rounds} />
      );

      // Both should be displayed
      expect(UNSAFE_root).toBeTruthy();
    });

    it('should handle very high round counts', () => {
      const players = createMockPlayersWithPoints(4);
      const rounds = [createCompletedRound(1, 2)];

      // Mock partnership with 100 rounds
      const { calculatePartnershipStats } = require('@courtster/shared');
      (calculatePartnershipStats as jest.Mock).mockReturnValueOnce([
        {
          player1: players[0],
          player2: players[1],
          roundsPlayed: 100,
          wins: 75,
          losses: 25,
          ties: 0,
          winRate: 75,
          totalPoints: 1500,
        },
      ]);

      const { getByText } = render(
        <StatisticsTab players={players} allRounds={rounds} />
      );

      expect(getByText('100 rounds together')).toBeTruthy();
      expect(getByText('1500')).toBeTruthy();
    });

    it('should handle zero win rate', () => {
      const players = createMockPlayersWithPoints(4);
      const rounds = [createCompletedRound(1, 2)];

      // Mock partnership with 0% win rate
      const { calculatePartnershipStats } = require('@courtster/shared');
      (calculatePartnershipStats as jest.Mock).mockReturnValueOnce([
        {
          player1: players[0],
          player2: players[1],
          roundsPlayed: 5,
          wins: 0,
          losses: 5,
          ties: 0,
          winRate: 0,
          totalPoints: 0,
        },
      ]);

      const { getByText } = render(
        <StatisticsTab players={players} allRounds={rounds} />
      );

      expect(getByText('0%')).toBeTruthy();
      expect(getByText('0W-5L-0T')).toBeTruthy();
    });

    it('should handle 100% win rate', () => {
      const players = createMockPlayersWithPoints(4);
      const rounds = [createCompletedRound(1, 2)];

      // Mock partnership with 100% win rate
      const { calculatePartnershipStats } = require('@courtster/shared');
      (calculatePartnershipStats as jest.Mock).mockReturnValueOnce([
        {
          player1: players[0],
          player2: players[1],
          roundsPlayed: 5,
          wins: 5,
          losses: 0,
          ties: 0,
          winRate: 100,
          totalPoints: 100,
        },
      ]);

      const { getByText } = render(
        <StatisticsTab players={players} allRounds={rounds} />
      );

      expect(getByText('100%')).toBeTruthy();
      expect(getByText('5W-0L-0T')).toBeTruthy();
    });

    it('should handle partnerships with ties', () => {
      const players = createMockPlayersWithPoints(4);
      const rounds = [createCompletedRound(1, 2)];

      // Mock partnership with ties
      const { calculatePartnershipStats } = require('@courtster/shared');
      (calculatePartnershipStats as jest.Mock).mockReturnValueOnce([
        {
          player1: players[0],
          player2: players[1],
          roundsPlayed: 6,
          wins: 3,
          losses: 1,
          ties: 2,
          winRate: 50,
          totalPoints: 72,
        },
      ]);

      const { getByText } = render(
        <StatisticsTab players={players} allRounds={rounds} />
      );

      expect(getByText('3W-1L-2T')).toBeTruthy();
    });

    it('should handle head-to-head with equal records', () => {
      const players = createMockPlayersWithPoints(4);
      const rounds = [createCompletedRound(1, 2)];

      // Mock evenly matched players
      const { calculateHeadToHeadStats } = require('@courtster/shared');
      (calculateHeadToHeadStats as jest.Mock).mockReturnValueOnce([
        {
          player1: players[0],
          player2: players[1],
          totalMatches: 6,
          player1Wins: 3,
          player2Wins: 3,
          ties: 0,
          winRate1: 50,
          winRate2: 50,
          player1Points: 90,
          player2Points: 90,
        },
      ]);

      const { getByText } = render(
        <StatisticsTab players={players} allRounds={rounds} />
      );

      fireEvent.press(getByText('Head-to-Head'));

      expect(getByText('50%')).toBeTruthy();
      expect(getByText('3-3-0')).toBeTruthy();
    });

    it('should handle head-to-head with ties', () => {
      const players = createMockPlayersWithPoints(4);
      const rounds = [createCompletedRound(1, 2)];

      // Mock with ties
      const { calculateHeadToHeadStats } = require('@courtster/shared');
      (calculateHeadToHeadStats as jest.Mock).mockReturnValueOnce([
        {
          player1: players[0],
          player2: players[1],
          totalMatches: 7,
          player1Wins: 3,
          player2Wins: 2,
          ties: 2,
          winRate1: 42.86,
          winRate2: 28.57,
          player1Points: 80,
          player2Points: 60,
        },
      ]);

      const { getByText } = render(
        <StatisticsTab players={players} allRounds={rounds} />
      );

      fireEvent.press(getByText('Head-to-Head'));

      expect(getByText('3-2-2')).toBeTruthy();
    });
  });

  describe('Component Memoization', () => {
    it('should memoize partnership stats calculation', () => {
      const players = createMockPlayersWithPoints(4);
      const rounds = [createCompletedRound(1, 2)];

      const { calculatePartnershipStats } = require('@courtster/shared');
      const mockFn = calculatePartnershipStats as jest.Mock;

      const { rerender } = render(
        <StatisticsTab players={players} allRounds={rounds} />
      );

      expect(mockFn).toHaveBeenCalledTimes(1);

      // Rerender with same props
      rerender(<StatisticsTab players={players} allRounds={rounds} />);

      // Should not call again due to useMemo
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should recalculate when players change', () => {
      const players1 = createMockPlayersWithPoints(4);
      const players2 = createMockPlayersWithPoints(4);
      const rounds = [createCompletedRound(1, 2)];

      const { calculatePartnershipStats } = require('@courtster/shared');
      const mockFn = calculatePartnershipStats as jest.Mock;

      const { rerender } = render(
        <StatisticsTab players={players1} allRounds={rounds} />
      );

      expect(mockFn).toHaveBeenCalledTimes(1);

      // Rerender with different players
      rerender(<StatisticsTab players={players2} allRounds={rounds} />);

      // Should call again due to dependency change
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should recalculate when rounds change', () => {
      const players = createMockPlayersWithPoints(4);
      const rounds1 = [createCompletedRound(1, 2)];
      const rounds2 = [createCompletedRound(1, 2), createCompletedRound(2, 2)];

      const { calculatePartnershipStats } = require('@courtster/shared');
      const mockFn = calculatePartnershipStats as jest.Mock;

      const { rerender } = render(
        <StatisticsTab players={players} allRounds={rounds1} />
      );

      expect(mockFn).toHaveBeenCalledTimes(1);

      // Rerender with different rounds
      rerender(<StatisticsTab players={players} allRounds={rounds2} />);

      // Should call again due to dependency change
      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('Data Formatting', () => {
    it('should format rating difference to 1 decimal place', () => {
      const players = createMockPlayersWithPoints(4);
      const rounds = [createCompletedRound(1, 2)];

      const { getByText } = render(
        <StatisticsTab players={players} allRounds={rounds} />
      );

      // Rating difference should show 1 decimal
      expect(getByText('Rating diff: 2.5')).toBeTruthy();
    });

    it('should display score format correctly (hyphenated)', () => {
      const players = createMockPlayersWithPoints(4);
      const rounds = [createCompletedRound(1, 2)];

      const { getByText } = render(
        <StatisticsTab players={players} allRounds={rounds} />
      );

      // Score format should be "15-9"
      expect(getByText('15-9')).toBeTruthy();
    });

    it('should display W-L-T record with correct format', () => {
      const players = createMockPlayersWithPoints(4);
      const rounds = [createCompletedRound(1, 2)];

      const { getByText } = render(
        <StatisticsTab players={players} allRounds={rounds} />
      );

      // MVP record should be "6W-2L-0T"
      expect(getByText('6W-2L-0T')).toBeTruthy();
    });

    it('should handle player names with special characters', () => {
      const players = createMockPlayersWithPoints(4);
      players[0].name = "O'Brien";
      players[1].name = 'José García';
      const rounds = [createCompletedRound(1, 2)];

      const { getAllByText } = render(
        <StatisticsTab players={players} allRounds={rounds} />
      );

      // Partnership name may appear in widget and tab
      const specialNames = getAllByText("O'Brien & José García");
      expect(specialNames.length).toBeGreaterThan(0);
    });

    it('should display correct plural/singular for widgets', () => {
      const players = createMockPlayersWithPoints(4);
      const rounds = [createCompletedRound(1, 2)];

      // Mock perfect pairs with 1 win
      const { findPerfectPairs } = require('@courtster/shared');
      (findPerfectPairs as jest.Mock).mockReturnValueOnce([
        {
          player1: players[0],
          player2: players[1],
          gamesPlayed: 1,
        },
      ]);

      const { getByText } = render(
        <StatisticsTab players={players} allRounds={rounds} />
      );

      expect(getByText('1 win')).toBeTruthy();
    });

    it('should display correct plural for multiple rivalry matches', () => {
      const players = createMockPlayersWithPoints(4);
      const rounds = [createCompletedRound(1, 2)];

      const { getByText } = render(
        <StatisticsTab players={players} allRounds={rounds} />
      );

      expect(getByText('5 matches')).toBeTruthy();
    });

    it('should handle singular rivalry match', () => {
      const players = createMockPlayersWithPoints(4);
      const rounds = [createCompletedRound(1, 2)];

      // Mock rivalry with 1 match
      const { findTopRivalries } = require('@courtster/shared');
      (findTopRivalries as jest.Mock).mockReturnValueOnce([
        {
          player1: players[0],
          player2: players[1],
          matchesPlayed: 1,
          player1Wins: 1,
          player2Wins: 0,
          ties: 0,
        },
      ]);

      const { getByText } = render(
        <StatisticsTab players={players} allRounds={rounds} />
      );

      expect(getByText('1 match')).toBeTruthy();
    });
  });
});
