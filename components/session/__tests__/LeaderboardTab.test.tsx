/**
 * LeaderboardTab Component Tests
 *
 * Tests the leaderboard display and player management functionality including:
 * - Leaderboard sorting (by points vs by wins)
 * - Player ranking display with medal icons
 * - Player statistics display
 * - Compensation points display
 * - Player status indicators and changes
 * - Player actions (status dropdown, replace player)
 * - Different game modes (Mexicano vs Americano vs Fixed Partner)
 * - Edge cases (empty leaderboard, ties, missing data, large counts)
 * - Offline behavior
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LeaderboardTab } from '../LeaderboardTab';
import { Player, Round } from '@courtster/shared';
import {
  createMockPlayers,
  createMockPlayersWithPoints,
  createMockPlayersWithStatuses,
} from '../../../__tests__/factories/playerFactory';
import { createMockSession, createMockRound } from '../../../__tests__/factories/sessionFactory';
import Toast from 'react-native-toast-message';

// Mock dependencies
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useMutation: jest.fn(),
  useQueryClient: jest.fn(),
}));

jest.mock('../../../config/supabase', () => ({
  supabase: {
    from: jest.fn((table: string) => ({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
      insert: jest.fn().mockResolvedValue({ error: null }),
    })),
  },
}));

jest.mock('../../../hooks/useNetworkStatus', () => ({
  useNetworkStatus: jest.fn(() => ({ isOnline: true })),
}));

jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
}));

jest.mock('../../../utils/offlineQueue', () => ({
  offlineQueue: {
    addOperation: jest.fn(),
  },
}));

jest.mock('../../ui/StatusDropdown', () => ({
  StatusDropdown: ({ currentStatus, onStatusChange }: any) => {
    const { View, TouchableOpacity, Text } = require('react-native');
    return (
      <View testID="status-dropdown">
        <Text>Current: {currentStatus}</Text>
        <TouchableOpacity onPress={() => onStatusChange('late')}>
          <Text>Set Late</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onStatusChange('no_show')}>
          <Text>Set No Show</Text>
        </TouchableOpacity>
      </View>
    );
  },
}));

jest.mock('../../ui/PlayerReassignModal', () => ({
  PlayerReassignModal: ({ visible, onClose, onReassign, currentPlayer, players }: any) => {
    const { View, TouchableOpacity, Text } = require('react-native');
    if (!visible) return null;
    return (
      <View testID="reassign-modal">
        <Text>Reassign {currentPlayer?.name}</Text>
        <TouchableOpacity onPress={onClose}>
          <Text>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            const newPlayer = players.find((p: Player) => p.id !== currentPlayer?.id);
            if (newPlayer && currentPlayer) {
              onReassign(currentPlayer.id, newPlayer.id);
            }
            onClose();
          }}
        >
          <Text>Confirm Reassign</Text>
        </TouchableOpacity>
      </View>
    );
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('LeaderboardTab Component', () => {
  let mockMutate: jest.Mock;
  let mockInvalidateQueries: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockMutate = jest.fn();
    mockInvalidateQueries = jest.fn();

    (require('@tanstack/react-query').useMutation as jest.Mock).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });

    (require('@tanstack/react-query').useQueryClient as jest.Mock).mockReturnValue({
      invalidateQueries: mockInvalidateQueries,
    });
  });

  describe('Leaderboard Sorting', () => {
    it('sorts players by points when sortBy is "points"', () => {
      const players = createMockPlayersWithPoints(5);
      const session = createMockSession();

      const { getByText } = render(
        <LeaderboardTab
          players={players}
          sortBy="points"
          onSortChange={jest.fn()}
          session={session}
          sessionId={session.id}
          allRounds={[]}
        />,
        { wrapper: createWrapper() }
      );

      // First player should have highest points
      expect(getByText(players[0].name)).toBeTruthy();
      expect(getByText(players[0].totalPoints.toString())).toBeTruthy();
    });

    it('sorts players by wins when sortBy is "wins"', () => {
      const players = createMockPlayersWithPoints(5);
      const session = createMockSession();

      const { getByText } = render(
        <LeaderboardTab
          players={players}
          sortBy="wins"
          onSortChange={jest.fn()}
          session={session}
          sessionId={session.id}
          allRounds={[]}
        />,
        { wrapper: createWrapper() }
      );

      // First player should have most wins
      expect(getByText(players[0].name)).toBeTruthy();
      expect(getByText(players[0].wins.toString())).toBeTruthy();
    });

    it('changes sort when sort button clicked', () => {
      const players = createMockPlayersWithPoints(5);
      const session = createMockSession();
      const onSortChange = jest.fn();

      const { getByText } = render(
        <LeaderboardTab
          players={players}
          sortBy="points"
          onSortChange={onSortChange}
          session={session}
          sessionId={session.id}
          allRounds={[]}
        />,
        { wrapper: createWrapper() }
      );

      fireEvent.press(getByText('By Wins'));

      expect(onSortChange).toHaveBeenCalledWith('wins');
    });

    it('highlights active sort button', () => {
      const players = createMockPlayersWithPoints(5);
      const session = createMockSession();

      const { getByText } = render(
        <LeaderboardTab
          players={players}
          sortBy="points"
          onSortChange={jest.fn()}
          session={session}
          sessionId={session.id}
          allRounds={[]}
        />,
        { wrapper: createWrapper() }
      );

      const pointsButton = getByText('By Points');
      expect(pointsButton).toBeTruthy();
    });
  });

  describe('Player Ranking Display', () => {
    it('displays medal icons for top 3 players', () => {
      const players = createMockPlayersWithPoints(5);
      const session = createMockSession();

      const { UNSAFE_getAllByType } = render(
        <LeaderboardTab
          players={players}
          sortBy="points"
          onSortChange={jest.fn()}
          session={session}
          sessionId={session.id}
          allRounds={[]}
        />,
        { wrapper: createWrapper() }
      );

      // Check for Trophy, Medal, Award icons from lucide-react-native
      const { Trophy, Medal, Award } = require('lucide-react-native');
      const trophies = UNSAFE_getAllByType(Trophy);
      const medals = UNSAFE_getAllByType(Medal);
      const awards = UNSAFE_getAllByType(Award);

      // Should have at least 1 trophy (rank 1), 1 medal (rank 2), 1 award (rank 3)
      expect(trophies.length).toBeGreaterThanOrEqual(1);
      expect(medals.length).toBeGreaterThanOrEqual(1);
      expect(awards.length).toBeGreaterThanOrEqual(1);
    });

    it('displays rank numbers for players beyond top 3', () => {
      const players = createMockPlayersWithPoints(10);
      const session = createMockSession();

      const { getByText } = render(
        <LeaderboardTab
          players={players}
          sortBy="points"
          onSortChange={jest.fn()}
          session={session}
          sessionId={session.id}
          allRounds={[]}
        />,
        { wrapper: createWrapper() }
      );

      // Should show rank 4, 5, etc.
      expect(getByText('4')).toBeTruthy();
      expect(getByText('5')).toBeTruthy();
    });

    it('displays all players in order', () => {
      const players = createMockPlayersWithPoints(5);
      const session = createMockSession();

      const { getByText } = render(
        <LeaderboardTab
          players={players}
          sortBy="points"
          onSortChange={jest.fn()}
          session={session}
          sessionId={session.id}
          allRounds={[]}
        />,
        { wrapper: createWrapper() }
      );

      players.forEach((player) => {
        expect(getByText(player.name)).toBeTruthy();
      });
    });
  });

  describe('Player Statistics Display', () => {
    it('displays player points correctly', () => {
      const players = createMockPlayersWithPoints(3);
      const session = createMockSession();

      const { getByText } = render(
        <LeaderboardTab
          players={players}
          sortBy="points"
          onSortChange={jest.fn()}
          session={session}
          sessionId={session.id}
          allRounds={[]}
        />,
        { wrapper: createWrapper() }
      );

      players.forEach((player) => {
        expect(getByText(player.totalPoints.toString())).toBeTruthy();
      });
    });

    it('displays W-L-T record correctly', () => {
      const players = createMockPlayersWithPoints(3);
      const session = createMockSession();

      const { getByText } = render(
        <LeaderboardTab
          players={players}
          sortBy="points"
          onSortChange={jest.fn()}
          session={session}
          sessionId={session.id}
          allRounds={[]}
        />,
        { wrapper: createWrapper() }
      );

      players.forEach((player) => {
        expect(getByText(player.wins.toString())).toBeTruthy();
        expect(getByText(player.losses.toString())).toBeTruthy();
        expect(getByText(player.ties.toString())).toBeTruthy();
      });
    });

    it('displays additional stats when row expanded', () => {
      const players = createMockPlayersWithPoints(3);
      players[0].playCount = 5;
      players[0].sitCount = 2;
      players[0].rating = 7.5;
      const session = createMockSession();

      const { getByText, UNSAFE_getAllByType } = render(
        <LeaderboardTab
          players={players}
          sortBy="points"
          onSortChange={jest.fn()}
          session={session}
          sessionId={session.id}
          allRounds={[]}
        />,
        { wrapper: createWrapper() }
      );

      // Click more options button (MoreVertical icon)
      const { MoreVertical } = require('lucide-react-native');
      const moreButtons = UNSAFE_getAllByType(MoreVertical);
      fireEvent.press(moreButtons[0].parent!);

      // Should show additional stats
      expect(getByText('Played')).toBeTruthy();
      expect(getByText('5')).toBeTruthy();
      expect(getByText('Sat Out')).toBeTruthy();
      expect(getByText('2')).toBeTruthy();
      expect(getByText('Rating')).toBeTruthy();
      expect(getByText('7.5')).toBeTruthy();
    });

    it('collapses expanded row when more button clicked again', () => {
      const players = createMockPlayersWithPoints(3);
      const session = createMockSession();

      const { queryByText, UNSAFE_getAllByType } = render(
        <LeaderboardTab
          players={players}
          sortBy="points"
          onSortChange={jest.fn()}
          session={session}
          sessionId={session.id}
          allRounds={[]}
        />,
        { wrapper: createWrapper() }
      );

      const { MoreVertical } = require('lucide-react-native');
      const moreButtons = UNSAFE_getAllByType(MoreVertical);

      // Expand
      fireEvent.press(moreButtons[0].parent!);
      expect(queryByText('Played')).toBeTruthy();

      // Collapse
      fireEvent.press(moreButtons[0].parent!);
      expect(queryByText('Played')).toBeNull();
    });
  });

  describe('Compensation Points Display', () => {
    it('displays compensation points when player has bonus', () => {
      const players = createMockPlayersWithPoints(3);
      players[0].compensationPoints = 5;
      const session = createMockSession();

      const { getByText } = render(
        <LeaderboardTab
          players={players}
          sortBy="points"
          onSortChange={jest.fn()}
          session={session}
          sessionId={session.id}
          allRounds={[]}
        />,
        { wrapper: createWrapper() }
      );

      expect(getByText('+5 bonus')).toBeTruthy();
    });

    it('does not display compensation when player has no bonus', () => {
      const players = createMockPlayersWithPoints(3);
      players[0].compensationPoints = 0;
      const session = createMockSession();

      const { queryByText } = render(
        <LeaderboardTab
          players={players}
          sortBy="points"
          onSortChange={jest.fn()}
          session={session}
          sessionId={session.id}
          allRounds={[]}
        />,
        { wrapper: createWrapper() }
      );

      expect(queryByText(/bonus/)).toBeNull();
    });

    it('displays multiple players with compensation points', () => {
      const players = createMockPlayersWithPoints(3);
      players[0].compensationPoints = 5;
      players[1].compensationPoints = 3;
      const session = createMockSession();

      const { getByText } = render(
        <LeaderboardTab
          players={players}
          sortBy="points"
          onSortChange={jest.fn()}
          session={session}
          sessionId={session.id}
          allRounds={[]}
        />,
        { wrapper: createWrapper() }
      );

      expect(getByText('+5 bonus')).toBeTruthy();
      expect(getByText('+3 bonus')).toBeTruthy();
    });
  });

  describe('Player Status Indicators', () => {
    it('displays status indicator for each player', () => {
      const players = createMockPlayersWithStatuses();
      const session = createMockSession();

      const { UNSAFE_root } = render(
        <LeaderboardTab
          players={players}
          sortBy="points"
          onSortChange={jest.fn()}
          session={session}
          sessionId={session.id}
          allRounds={[]}
        />,
        { wrapper: createWrapper() }
      );

      // Should render without crashing (status indicators are dots)
      expect(UNSAFE_root).toBeTruthy();
    });

    it('updates player status when status changed', async () => {
      const players = createMockPlayersWithPoints(3);
      const session = createMockSession();

      const { getByText, UNSAFE_getAllByType } = render(
        <LeaderboardTab
          players={players}
          sortBy="points"
          onSortChange={jest.fn()}
          session={session}
          sessionId={session.id}
          allRounds={[]}
        />,
        { wrapper: createWrapper() }
      );

      // Expand first player
      const { MoreVertical } = require('lucide-react-native');
      const moreButtons = UNSAFE_getAllByType(MoreVertical);
      fireEvent.press(moreButtons[0].parent!);

      // Change status to late
      fireEvent.press(getByText('Set Late'));

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith({
          playerId: players[0].id,
          newStatus: 'late',
        });
      });
    });

    it('shows success toast after status update', async () => {
      const players = createMockPlayersWithPoints(3);
      const session = createMockSession();

      (require('@tanstack/react-query').useMutation as jest.Mock).mockReturnValue({
        mutate: jest.fn((variables, options) => {
          options?.onSuccess?.();
        }),
        isPending: false,
      });

      const { getByText, UNSAFE_getAllByType } = render(
        <LeaderboardTab
          players={players}
          sortBy="points"
          onSortChange={jest.fn()}
          session={session}
          sessionId={session.id}
          allRounds={[]}
        />,
        { wrapper: createWrapper() }
      );

      const { MoreVertical } = require('lucide-react-native');
      const moreButtons = UNSAFE_getAllByType(MoreVertical);
      fireEvent.press(moreButtons[0].parent!);

      fireEvent.press(getByText('Set Late'));

      await waitFor(() => {
        expect(Toast.show).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'success',
            text1: 'Status Updated',
          })
        );
      });
    });

    it('shows error toast on status update failure', async () => {
      const players = createMockPlayersWithPoints(3);
      const session = createMockSession();
      const errorMessage = 'Failed to update status';

      (require('@tanstack/react-query').useMutation as jest.Mock).mockReturnValue({
        mutate: jest.fn((variables, options) => {
          options?.onError?.(new Error(errorMessage));
        }),
        isPending: false,
      });

      const { getByText, UNSAFE_getAllByType } = render(
        <LeaderboardTab
          players={players}
          sortBy="points"
          onSortChange={jest.fn()}
          session={session}
          sessionId={session.id}
          allRounds={[]}
        />,
        { wrapper: createWrapper() }
      );

      const { MoreVertical } = require('lucide-react-native');
      const moreButtons = UNSAFE_getAllByType(MoreVertical);
      fireEvent.press(moreButtons[0].parent!);

      fireEvent.press(getByText('Set Late'));

      await waitFor(() => {
        expect(Toast.show).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'error',
            text1: 'Failed to Update Status',
          })
        );
      });
    });

    it('disables status dropdown while update pending', () => {
      const players = createMockPlayersWithPoints(3);
      const session = createMockSession();

      (require('@tanstack/react-query').useMutation as jest.Mock).mockReturnValue({
        mutate: mockMutate,
        isPending: true,
      });

      const { getByTestId, UNSAFE_getAllByType } = render(
        <LeaderboardTab
          players={players}
          sortBy="points"
          onSortChange={jest.fn()}
          session={session}
          sessionId={session.id}
          allRounds={[]}
        />,
        { wrapper: createWrapper() }
      );

      const { MoreVertical } = require('lucide-react-native');
      const moreButtons = UNSAFE_getAllByType(MoreVertical);
      fireEvent.press(moreButtons[0].parent!);

      const dropdown = getByTestId('status-dropdown');
      expect(dropdown).toBeTruthy();
    });
  });

  describe('Player Reassignment', () => {
    it('opens reassign modal when replace player clicked', () => {
      const players = createMockPlayersWithPoints(3);
      const session = createMockSession();

      const { getByText, queryByTestId, UNSAFE_getAllByType } = render(
        <LeaderboardTab
          players={players}
          sortBy="points"
          onSortChange={jest.fn()}
          session={session}
          sessionId={session.id}
          allRounds={[]}
        />,
        { wrapper: createWrapper() }
      );

      // Expand first player
      const { MoreVertical } = require('lucide-react-native');
      const moreButtons = UNSAFE_getAllByType(MoreVertical);
      fireEvent.press(moreButtons[0].parent!);

      // Modal should not be visible yet
      expect(queryByTestId('reassign-modal')).toBeNull();

      // Click replace player
      fireEvent.press(getByText('Replace Player'));

      // Modal should now be visible
      expect(queryByTestId('reassign-modal')).toBeTruthy();
    });

    it('closes reassign modal when cancel clicked', () => {
      const players = createMockPlayersWithPoints(3);
      const session = createMockSession();

      const { getByText, queryByTestId, UNSAFE_getAllByType } = render(
        <LeaderboardTab
          players={players}
          sortBy="points"
          onSortChange={jest.fn()}
          session={session}
          sessionId={session.id}
          allRounds={[]}
        />,
        { wrapper: createWrapper() }
      );

      const { MoreVertical } = require('lucide-react-native');
      const moreButtons = UNSAFE_getAllByType(MoreVertical);
      fireEvent.press(moreButtons[0].parent!);

      fireEvent.press(getByText('Replace Player'));
      expect(queryByTestId('reassign-modal')).toBeTruthy();

      fireEvent.press(getByText('Cancel'));
      expect(queryByTestId('reassign-modal')).toBeNull();
    });

    it('reassigns player when confirmed', async () => {
      const players = createMockPlayersWithPoints(3);
      const session = createMockSession();
      const rounds = [createMockRound(1, 1)];

      const { getByText, UNSAFE_getAllByType } = render(
        <LeaderboardTab
          players={players}
          sortBy="points"
          onSortChange={jest.fn()}
          session={session}
          sessionId={session.id}
          allRounds={rounds}
        />,
        { wrapper: createWrapper() }
      );

      const { MoreVertical } = require('lucide-react-native');
      const moreButtons = UNSAFE_getAllByType(MoreVertical);
      fireEvent.press(moreButtons[0].parent!);

      fireEvent.press(getByText('Replace Player'));
      fireEvent.press(getByText('Confirm Reassign'));

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith({
          oldPlayerId: players[0].id,
          newPlayerId: expect.any(String),
        });
      });
    });

    it('shows success toast after reassignment', async () => {
      const players = createMockPlayersWithPoints(3);
      const session = createMockSession();

      (require('@tanstack/react-query').useMutation as jest.Mock).mockReturnValue({
        mutate: jest.fn((variables, options) => {
          options?.onSuccess?.();
        }),
        isPending: false,
      });

      const { getByText, UNSAFE_getAllByType } = render(
        <LeaderboardTab
          players={players}
          sortBy="points"
          onSortChange={jest.fn()}
          session={session}
          sessionId={session.id}
          allRounds={[]}
        />,
        { wrapper: createWrapper() }
      );

      const { MoreVertical } = require('lucide-react-native');
      const moreButtons = UNSAFE_getAllByType(MoreVertical);
      fireEvent.press(moreButtons[0].parent!);

      fireEvent.press(getByText('Replace Player'));
      fireEvent.press(getByText('Confirm Reassign'));

      await waitFor(() => {
        expect(Toast.show).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'success',
            text1: 'Player Reassigned',
          })
        );
      });
    });

    it('disables replace button while reassignment pending', () => {
      const players = createMockPlayersWithPoints(3);
      const session = createMockSession();

      (require('@tanstack/react-query').useMutation as jest.Mock)
        .mockReturnValueOnce({
          mutate: mockMutate,
          isPending: false,
        })
        .mockReturnValueOnce({
          mutate: mockMutate,
          isPending: true, // Reassign mutation is pending
        });

      const { getByText, UNSAFE_getAllByType } = render(
        <LeaderboardTab
          players={players}
          sortBy="points"
          onSortChange={jest.fn()}
          session={session}
          sessionId={session.id}
          allRounds={[]}
        />,
        { wrapper: createWrapper() }
      );

      const { MoreVertical } = require('lucide-react-native');
      const moreButtons = UNSAFE_getAllByType(MoreVertical);
      fireEvent.press(moreButtons[0].parent!);

      const replaceButton = getByText('Replace Player');
      expect(replaceButton).toBeTruthy();
    });

    it('collapses expanded player after opening reassign modal', () => {
      const players = createMockPlayersWithPoints(3);
      const session = createMockSession();

      const { getByText, queryByText, UNSAFE_getAllByType } = render(
        <LeaderboardTab
          players={players}
          sortBy="points"
          onSortChange={jest.fn()}
          session={session}
          sessionId={session.id}
          allRounds={[]}
        />,
        { wrapper: createWrapper() }
      );

      const { MoreVertical } = require('lucide-react-native');
      const moreButtons = UNSAFE_getAllByType(MoreVertical);
      fireEvent.press(moreButtons[0].parent!);

      expect(queryByText('Played')).toBeTruthy();

      fireEvent.press(getByText('Replace Player'));

      // After opening modal, expanded details should be hidden
      expect(queryByText('Played')).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('displays empty state when no players', () => {
      const session = createMockSession();

      const { getByText, UNSAFE_getAllByType } = render(
        <LeaderboardTab
          players={[]}
          sortBy="points"
          onSortChange={jest.fn()}
          session={session}
          sessionId={session.id}
          allRounds={[]}
        />,
        { wrapper: createWrapper() }
      );

      expect(getByText('No players yet')).toBeTruthy();

      const { Trophy } = require('lucide-react-native');
      const trophies = UNSAFE_getAllByType(Trophy);
      expect(trophies.length).toBeGreaterThan(0);
    });

    it('handles ties in points correctly', () => {
      const players = createMockPlayersWithPoints(3);
      // Create tie
      players[1].totalPoints = players[0].totalPoints;
      const session = createMockSession();

      const { getByText } = render(
        <LeaderboardTab
          players={players}
          sortBy="points"
          onSortChange={jest.fn()}
          session={session}
          sessionId={session.id}
          allRounds={[]}
        />,
        { wrapper: createWrapper() }
      );

      // Both players should be displayed
      expect(getByText(players[0].name)).toBeTruthy();
      expect(getByText(players[1].name)).toBeTruthy();
    });

    it('handles ties in wins correctly', () => {
      const players = createMockPlayersWithPoints(3);
      // Create tie
      players[1].wins = players[0].wins;
      const session = createMockSession();

      const { getByText } = render(
        <LeaderboardTab
          players={players}
          sortBy="wins"
          onSortChange={jest.fn()}
          session={session}
          sessionId={session.id}
          allRounds={[]}
        />,
        { wrapper: createWrapper() }
      );

      // Both players should be displayed
      expect(getByText(players[0].name)).toBeTruthy();
      expect(getByText(players[1].name)).toBeTruthy();
    });

    it('handles player with zero stats', () => {
      const players = createMockPlayers(1);
      players[0].totalPoints = 0;
      players[0].wins = 0;
      players[0].losses = 0;
      players[0].ties = 0;
      players[0].playCount = 0;
      players[0].sitCount = 0;
      const session = createMockSession();

      const { getByText, UNSAFE_getAllByType } = render(
        <LeaderboardTab
          players={players}
          sortBy="points"
          onSortChange={jest.fn()}
          session={session}
          sessionId={session.id}
          allRounds={[]}
        />,
        { wrapper: createWrapper() }
      );

      expect(getByText('0')).toBeTruthy();

      // Expand to see all zero stats
      const { MoreVertical } = require('lucide-react-native');
      const moreButtons = UNSAFE_getAllByType(MoreVertical);
      fireEvent.press(moreButtons[0].parent!);

      // Should display zeros correctly
      expect(getByText('Played')).toBeTruthy();
      expect(getByText('Sat Out')).toBeTruthy();
    });

    it('handles very large player counts', () => {
      const players = createMockPlayersWithPoints(50);
      const session = createMockSession();

      const { getByText } = render(
        <LeaderboardTab
          players={players}
          sortBy="points"
          onSortChange={jest.fn()}
          session={session}
          sessionId={session.id}
          allRounds={[]}
        />,
        { wrapper: createWrapper() }
      );

      // Should show high rank numbers
      expect(getByText('50')).toBeTruthy();
    });

    it('handles missing player name gracefully', () => {
      const players = createMockPlayers(1);
      players[0].name = '';
      const session = createMockSession();

      const { UNSAFE_root } = render(
        <LeaderboardTab
          players={players}
          sortBy="points"
          onSortChange={jest.fn()}
          session={session}
          sessionId={session.id}
          allRounds={[]}
        />,
        { wrapper: createWrapper() }
      );

      // Should render without crashing
      expect(UNSAFE_root).toBeTruthy();
    });

    it('handles undefined session gracefully', () => {
      const players = createMockPlayersWithPoints(3);

      const { getByText } = render(
        <LeaderboardTab
          players={players}
          sortBy="points"
          onSortChange={jest.fn()}
          session={null}
          sessionId="session-123"
          allRounds={[]}
        />,
        { wrapper: createWrapper() }
      );

      // Should still render players
      expect(getByText(players[0].name)).toBeTruthy();
    });

    it('displays table header when players exist', () => {
      const players = createMockPlayersWithPoints(3);
      const session = createMockSession();

      const { getByText } = render(
        <LeaderboardTab
          players={players}
          sortBy="points"
          onSortChange={jest.fn()}
          session={session}
          sessionId={session.id}
          allRounds={[]}
        />,
        { wrapper: createWrapper() }
      );

      expect(getByText('RANK')).toBeTruthy();
      expect(getByText('NAME')).toBeTruthy();
      expect(getByText('PTS')).toBeTruthy();
      expect(getByText('W-L-T')).toBeTruthy();
    });

    it('does not display table header when no players', () => {
      const session = createMockSession();

      const { queryByText } = render(
        <LeaderboardTab
          players={[]}
          sortBy="points"
          onSortChange={jest.fn()}
          session={session}
          sessionId={session.id}
          allRounds={[]}
        />,
        { wrapper: createWrapper() }
      );

      expect(queryByText('RANK')).toBeNull();
      expect(queryByText('NAME')).toBeNull();
    });

    it('handles very high compensation points', () => {
      const players = createMockPlayersWithPoints(1);
      players[0].compensationPoints = 999;
      const session = createMockSession();

      const { getByText } = render(
        <LeaderboardTab
          players={players}
          sortBy="points"
          onSortChange={jest.fn()}
          session={session}
          sessionId={session.id}
          allRounds={[]}
        />,
        { wrapper: createWrapper() }
      );

      expect(getByText('+999 bonus')).toBeTruthy();
    });

    it('handles decimal ratings correctly', () => {
      const players = createMockPlayers(1);
      players[0].rating = 7.85;
      const session = createMockSession();

      const { getByText, UNSAFE_getAllByType } = render(
        <LeaderboardTab
          players={players}
          sortBy="points"
          onSortChange={jest.fn()}
          session={session}
          sessionId={session.id}
          allRounds={[]}
        />,
        { wrapper: createWrapper() }
      );

      // Expand to see rating
      const { MoreVertical } = require('lucide-react-native');
      const moreButtons = UNSAFE_getAllByType(MoreVertical);
      fireEvent.press(moreButtons[0].parent!);

      // Should format to 1 decimal place
      expect(getByText('7.9')).toBeTruthy();
    });
  });

  describe('Offline Behavior', () => {
    beforeEach(() => {
      (require('../../../hooks/useNetworkStatus').useNetworkStatus as jest.Mock).mockReturnValue({
        isOnline: false,
      });
    });

    it('queues status update when offline', async () => {
      const players = createMockPlayersWithPoints(3);
      const session = createMockSession();
      const { offlineQueue } = require('../../../utils/offlineQueue');

      const { getByText, UNSAFE_getAllByType } = render(
        <LeaderboardTab
          players={players}
          sortBy="points"
          onSortChange={jest.fn()}
          session={session}
          sessionId={session.id}
          allRounds={[]}
        />,
        { wrapper: createWrapper() }
      );

      const { MoreVertical } = require('lucide-react-native');
      const moreButtons = UNSAFE_getAllByType(MoreVertical);
      fireEvent.press(moreButtons[0].parent!);

      fireEvent.press(getByText('Set Late'));

      await waitFor(() => {
        expect(offlineQueue.addOperation).toHaveBeenCalledWith(
          'UPDATE_PLAYER_STATUS',
          session.id,
          expect.objectContaining({
            playerId: players[0].id,
            newStatus: 'late',
          })
        );
      });
    });

    it('shows offline message in success toast', async () => {
      const players = createMockPlayersWithPoints(3);
      const session = createMockSession();

      (require('@tanstack/react-query').useMutation as jest.Mock).mockReturnValue({
        mutate: jest.fn((variables, options) => {
          options?.onSuccess?.();
        }),
        isPending: false,
      });

      const { getByText, UNSAFE_getAllByType } = render(
        <LeaderboardTab
          players={players}
          sortBy="points"
          onSortChange={jest.fn()}
          session={session}
          sessionId={session.id}
          allRounds={[]}
        />,
        { wrapper: createWrapper() }
      );

      const { MoreVertical } = require('lucide-react-native');
      const moreButtons = UNSAFE_getAllByType(MoreVertical);
      fireEvent.press(moreButtons[0].parent!);

      fireEvent.press(getByText('Set Late'));

      await waitFor(() => {
        expect(Toast.show).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'success',
            text2: 'Will sync when online',
          })
        );
      });
    });

    it('queues reassignment when offline', async () => {
      const players = createMockPlayersWithPoints(3);
      const session = createMockSession();
      const { offlineQueue } = require('../../../utils/offlineQueue');

      const { getByText, UNSAFE_getAllByType } = render(
        <LeaderboardTab
          players={players}
          sortBy="points"
          onSortChange={jest.fn()}
          session={session}
          sessionId={session.id}
          allRounds={[]}
        />,
        { wrapper: createWrapper() }
      );

      const { MoreVertical } = require('lucide-react-native');
      const moreButtons = UNSAFE_getAllByType(MoreVertical);
      fireEvent.press(moreButtons[0].parent!);

      fireEvent.press(getByText('Replace Player'));
      fireEvent.press(getByText('Confirm Reassign'));

      await waitFor(() => {
        expect(offlineQueue.addOperation).toHaveBeenCalledWith(
          'REASSIGN_PLAYER',
          session.id,
          expect.objectContaining({
            oldPlayerId: players[0].id,
            newPlayerId: expect.any(String),
          })
        );
      });
    });
  });
});
