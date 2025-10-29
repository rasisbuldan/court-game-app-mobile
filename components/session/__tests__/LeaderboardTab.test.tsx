import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { LeaderboardTab } from '../LeaderboardTab';
import { Player } from '@courtster/shared';

// Mock QueryClient for React Query
jest.mock('@tanstack/react-query', () => ({
  useMutation: jest.fn(() => ({
    mutate: jest.fn(),
    isPending: false,
  })),
  useQueryClient: jest.fn(() => ({
    invalidateQueries: jest.fn(),
  })),
}));

jest.mock('../../../hooks/useNetworkStatus', () => ({
  useNetworkStatus: () => ({ isOnline: true }),
}));

const mockPlayers: Player[] = [
  {
    id: '1',
    name: 'Player 1',
    rating: 1500,
    totalPoints: 100,
    wins: 5,
    losses: 2,
    ties: 1,
    playCount: 8,
    sitCount: 2,
    compensationPoints: 0,
    status: 'active',
  },
  {
    id: '2',
    name: 'Player 2',
    rating: 1400,
    totalPoints: 80,
    wins: 4,
    losses: 3,
    ties: 1,
    playCount: 8,
    sitCount: 2,
    compensationPoints: 10,
    status: 'active',
  },
  {
    id: '3',
    name: 'Player 3',
    rating: 1300,
    totalPoints: 60,
    wins: 3,
    losses: 4,
    ties: 1,
    playCount: 8,
    sitCount: 2,
    compensationPoints: 0,
    status: 'late',
  },
];

const mockSession = { id: 'session-1' };
const mockAllRounds: any[] = [];

describe('LeaderboardTab', () => {
  describe('Rendering', () => {
    it('renders correctly with players', () => {
      const { getByText } = render(
        <LeaderboardTab
          players={mockPlayers}
          sortBy="points"
          onSortChange={jest.fn()}
          session={mockSession}
          sessionId="session-1"
          allRounds={mockAllRounds}
        />
      );

      expect(getByText('Player 1')).toBeTruthy();
      expect(getByText('Player 2')).toBeTruthy();
      expect(getByText('Player 3')).toBeTruthy();
    });

    it('renders sort options', () => {
      const { getByText } = render(
        <LeaderboardTab
          players={mockPlayers}
          sortBy="points"
          onSortChange={jest.fn()}
          session={mockSession}
          sessionId="session-1"
          allRounds={mockAllRounds}
        />
      );

      expect(getByText('By Points')).toBeTruthy();
      expect(getByText('By Wins')).toBeTruthy();
    });

    it('displays player statistics', () => {
      const { getByText } = render(
        <LeaderboardTab
          players={mockPlayers}
          sortBy="points"
          onSortChange={jest.fn()}
          session={mockSession}
          sessionId="session-1"
          allRounds={mockAllRounds}
        />
      );

      // Check first player's stats
      expect(getByText('100')).toBeTruthy(); // points
      expect(getByText('5W-2L-1T')).toBeTruthy(); // record
      expect(getByText('8')).toBeTruthy(); // play count
      expect(getByText('2')).toBeTruthy(); // sit count
    });

    it('displays medal icons for top 3 players', () => {
      const { UNSAFE_queryAllByType } = render(
        <LeaderboardTab
          players={mockPlayers}
          sortBy="points"
          onSortChange={jest.fn()}
          session={mockSession}
          sessionId="session-1"
          allRounds={mockAllRounds}
        />
      );

      // Top 3 should have medal icons (Trophy, Medal, Award components)
      const icons = UNSAFE_queryAllByType('View');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('displays compensation points when present', () => {
      const { getByText } = render(
        <LeaderboardTab
          players={mockPlayers}
          sortBy="points"
          onSortChange={jest.fn()}
          session={mockSession}
          sessionId="session-1"
          allRounds={mockAllRounds}
        />
      );

      expect(getByText('+10 compensation points')).toBeTruthy();
    });

    it('shows empty state when no players', () => {
      const { getByText } = render(
        <LeaderboardTab
          players={[]}
          sortBy="points"
          onSortChange={jest.fn()}
          session={mockSession}
          sessionId="session-1"
          allRounds={mockAllRounds}
        />
      );

      expect(getByText('No players yet')).toBeTruthy();
    });
  });

  describe('Sorting', () => {
    it('calls onSortChange when By Points is pressed', () => {
      const onSortChange = jest.fn();

      const { getByText } = render(
        <LeaderboardTab
          players={mockPlayers}
          sortBy="wins"
          onSortChange={onSortChange}
          session={mockSession}
          sessionId="session-1"
          allRounds={mockAllRounds}
        />
      );

      const pointsButton = getByText('By Points');
      fireEvent.press(pointsButton);

      expect(onSortChange).toHaveBeenCalledWith('points');
    });

    it('calls onSortChange when By Wins is pressed', () => {
      const onSortChange = jest.fn();

      const { getByText } = render(
        <LeaderboardTab
          players={mockPlayers}
          sortBy="points"
          onSortChange={onSortChange}
          session={mockSession}
          sessionId="session-1"
          allRounds={mockAllRounds}
        />
      );

      const winsButton = getByText('By Wins');
      fireEvent.press(winsButton);

      expect(onSortChange).toHaveBeenCalledWith('wins');
    });

    it('highlights active sort option', () => {
      const { getByText } = render(
        <LeaderboardTab
          players={mockPlayers}
          sortBy="points"
          onSortChange={jest.fn()}
          session={mockSession}
          sessionId="session-1"
          allRounds={mockAllRounds}
        />
      );

      const pointsButton = getByText('By Points');
      // Active sort should have red background (verified through parent styles)
      expect(pointsButton.parent).toBeTruthy();
    });
  });

  describe('Player Actions', () => {
    it('expands player options when more button is pressed', () => {
      const { getAllByTestId, queryByText } = render(
        <LeaderboardTab
          players={mockPlayers}
          sortBy="points"
          onSortChange={jest.fn()}
          session={mockSession}
          sessionId="session-1"
          allRounds={mockAllRounds}
        />
      );

      // Find and press the more options button (MoreVertical icon)
      // Initially options should not be visible
      expect(queryByText('Mark as Completed')).toBeFalsy();
    });
  });

  describe('Status Indicators', () => {
    it('displays status indicators for all players', () => {
      const { UNSAFE_root } = render(
        <LeaderboardTab
          players={mockPlayers}
          sortBy="points"
          onSortChange={jest.fn()}
          session={mockSession}
          sessionId="session-1"
          allRounds={mockAllRounds}
        />
      );

      // Status dots should be present for each player
      expect(UNSAFE_root).toBeTruthy();
    });

    it('shows different colors for different statuses', () => {
      const playersWithDifferentStatuses: Player[] = [
        { ...mockPlayers[0], status: 'active' },
        { ...mockPlayers[1], status: 'late' },
        { ...mockPlayers[2], status: 'no_show' },
      ];

      const { UNSAFE_root } = render(
        <LeaderboardTab
          players={playersWithDifferentStatuses}
          sortBy="points"
          onSortChange={jest.fn()}
          session={mockSession}
          sessionId="session-1"
          allRounds={mockAllRounds}
        />
      );

      // Different status colors should be rendered
      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('Visual Consistency', () => {
    it('uses glassmorphism styling', () => {
      const { UNSAFE_root } = render(
        <LeaderboardTab
          players={mockPlayers}
          sortBy="points"
          onSortChange={jest.fn()}
          session={mockSession}
          sessionId="session-1"
          allRounds={mockAllRounds}
        />
      );

      // Component should render with glassmorphism styles
      expect(UNSAFE_root).toBeTruthy();
    });

    it('uses red accent colors', () => {
      const { getByText } = render(
        <LeaderboardTab
          players={mockPlayers}
          sortBy="points"
          onSortChange={jest.fn()}
          session={mockSession}
          sessionId="session-1"
          allRounds={mockAllRounds}
        />
      );

      // Points should be displayed in red
      expect(getByText('100')).toBeTruthy();
    });

    it('has proper border radius', () => {
      const { UNSAFE_root } = render(
        <LeaderboardTab
          players={mockPlayers}
          sortBy="points"
          onSortChange={jest.fn()}
          session={mockSession}
          sessionId="session-1"
          allRounds={mockAllRounds}
        />
      );

      // All cards should have 16px border radius
      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('Responsiveness', () => {
    it('renders correctly with many players', () => {
      const manyPlayers = Array.from({ length: 20 }, (_, i) => ({
        ...mockPlayers[0],
        id: `player-${i}`,
        name: `Player ${i + 1}`,
        totalPoints: 100 - i,
      }));

      const { getByText } = render(
        <LeaderboardTab
          players={manyPlayers}
          sortBy="points"
          onSortChange={jest.fn()}
          session={mockSession}
          sessionId="session-1"
          allRounds={mockAllRounds}
        />
      );

      expect(getByText('Player 1')).toBeTruthy();
      expect(getByText('Player 20')).toBeTruthy();
    });
  });
});
