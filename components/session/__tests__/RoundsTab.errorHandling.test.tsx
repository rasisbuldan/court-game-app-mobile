/**
 * Unit tests for Algorithm Initialization Error Handling (Issue #5 fix)
 * Tests the error UI with retry button in RoundsTab component
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RoundsTab } from '../RoundsTab';
import { Player, Round } from '@courtster/shared';
import Toast from 'react-native-toast-message';

// Mock dependencies
jest.mock('react-native-toast-message');
jest.mock('../../../config/supabase');
jest.mock('../../../utils/offlineQueue');
jest.mock('../../../hooks/useNetworkStatus', () => ({
  useNetworkStatus: () => ({ isOnline: true }),
}));

// Test data factories
const createPlayer = (overrides: Partial<Player> = {}): Player => ({
  id: `player-${Math.random()}`,
  name: 'Test Player',
  rating: 5,
  playCount: 0,
  sitCount: 0,
  consecutiveSits: 0,
  consecutivePlays: 0,
  status: 'active',
  totalPoints: 0,
  wins: 0,
  losses: 0,
  ties: 0,
  skipRounds: [],
  skipCount: 0,
  compensationPoints: 0,
  gender: 'male',
  ...overrides,
});

const createMockSession = (overrides = {}) => ({
  id: 'session-1',
  name: 'Test Session',
  sport: 'padel',
  type: 'mexicano',
  scoring_mode: 'total_points',
  points_per_match: 24,
  courts: 2,
  ...overrides,
});

// Wrapper component with React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('RoundsTab - Algorithm Error Handling (Issue #5 Fix)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Error UI Rendering', () => {
    it('should render error UI when algorithmError is present', () => {
      // Arrange
      const players = [createPlayer(), createPlayer(), createPlayer(), createPlayer()];
      const session = createMockSession();

      // Act
      const { getByText } = render(
        <RoundsTab
          currentRound={undefined}
          currentRoundIndex={0}
          allRounds={[]}
          hasMatchesStarted={false}
          session={session}
          players={players}
          algorithm={null}
          algorithmError="Algorithm initialization failed"
          sessionId="session-1"
          onRoundChange={jest.fn()}
        />,
        { wrapper: createWrapper() }
      );

      // Assert
      expect(getByText('Setup Error')).toBeTruthy();
      expect(getByText('Algorithm initialization failed')).toBeTruthy();
    });

    it('should show retry button when onRetryAlgorithm callback is provided', () => {
      // Arrange
      const players = [createPlayer(), createPlayer()];
      const session = createMockSession();
      const mockRetry = jest.fn();

      // Act
      const { getByText } = render(
        <RoundsTab
          currentRound={undefined}
          currentRoundIndex={0}
          allRounds={[]}
          hasMatchesStarted={false}
          session={session}
          players={players}
          algorithm={null}
          algorithmError="Some error occurred"
          onRetryAlgorithm={mockRetry}
          sessionId="session-1"
          onRoundChange={jest.fn()}
        />,
        { wrapper: createWrapper() }
      );

      // Assert
      expect(getByText('Retry')).toBeTruthy();
      expect(getByText('Go Back')).toBeTruthy();
    });

    it('should NOT show retry button when onRetryAlgorithm is not provided', () => {
      // Arrange
      const players = [createPlayer(), createPlayer()];
      const session = createMockSession();

      // Act
      const { queryByText, getByText } = render(
        <RoundsTab
          currentRound={undefined}
          currentRoundIndex={0}
          allRounds={[]}
          hasMatchesStarted={false}
          session={session}
          players={players}
          algorithm={null}
          algorithmError="Some error occurred"
          sessionId="session-1"
          onRoundChange={jest.fn()}
        />,
        { wrapper: createWrapper() }
      );

      // Assert
      expect(queryByText('Retry')).toBeNull();
      expect(getByText('Go to Players')).toBeTruthy(); // Fallback button
    });

    it('should display specific error message for insufficient players', () => {
      // Arrange
      const players = [createPlayer(), createPlayer()]; // Only 2 players
      const session = createMockSession();

      // Act
      const { getByText } = render(
        <RoundsTab
          currentRound={undefined}
          currentRoundIndex={0}
          allRounds={[]}
          hasMatchesStarted={false}
          session={session}
          players={players}
          algorithm={null}
          algorithmError="At least 4 players are required"
          sessionId="session-1"
          onRoundChange={jest.fn()}
        />,
        { wrapper: createWrapper() }
      );

      // Assert
      expect(getByText('At least 4 players are required')).toBeTruthy();
      expect(getByText('Add at least 4 active players to start the tournament.')).toBeTruthy();
    });

    it('should display generic error message for other errors', () => {
      // Arrange
      const players = [createPlayer(), createPlayer(), createPlayer(), createPlayer()];
      const session = createMockSession();

      // Act
      const { getByText } = render(
        <RoundsTab
          currentRound={undefined}
          currentRoundIndex={0}
          allRounds={[]}
          hasMatchesStarted={false}
          session={session}
          players={players}
          algorithm={null}
          algorithmError="Invalid matchup configuration"
          sessionId="session-1"
          onRoundChange={jest.fn()}
        />,
        { wrapper: createWrapper() }
      );

      // Assert
      expect(getByText('Invalid matchup configuration')).toBeTruthy();
      expect(getByText('Please check your session configuration or try again.')).toBeTruthy();
    });
  });

  describe('Retry Functionality', () => {
    it('should call onRetryAlgorithm when retry button is pressed', async () => {
      // Arrange
      const players = [createPlayer(), createPlayer(), createPlayer(), createPlayer()];
      const session = createMockSession();
      const mockRetry = jest.fn();

      const { getByText } = render(
        <RoundsTab
          currentRound={undefined}
          currentRoundIndex={0}
          allRounds={[]}
          hasMatchesStarted={false}
          session={session}
          players={players}
          algorithm={null}
          algorithmError="Algorithm failed"
          onRetryAlgorithm={mockRetry}
          sessionId="session-1"
          onRoundChange={jest.fn()}
        />,
        { wrapper: createWrapper() }
      );

      // Act
      const retryButton = getByText('Retry');
      fireEvent.press(retryButton);

      // Assert
      await waitFor(() => {
        expect(mockRetry).toHaveBeenCalledTimes(1);
      });
    });

    it('should show toast when retry button is pressed', async () => {
      // Arrange
      const players = [createPlayer(), createPlayer(), createPlayer(), createPlayer()];
      const session = createMockSession();
      const mockRetry = jest.fn();

      const { getByText } = render(
        <RoundsTab
          currentRound={undefined}
          currentRoundIndex={0}
          allRounds={[]}
          hasMatchesStarted={false}
          session={session}
          players={players}
          algorithm={null}
          algorithmError="Algorithm failed"
          onRetryAlgorithm={mockRetry}
          sessionId="session-1"
          onRoundChange={jest.fn()}
        />,
        { wrapper: createWrapper() }
      );

      // Act
      const retryButton = getByText('Retry');
      fireEvent.press(retryButton);

      // Assert
      await waitFor(() => {
        expect(Toast.show).toHaveBeenCalledWith({
          type: 'info',
          text1: 'Retrying...',
          text2: 'Attempting to reinitialize algorithm',
          visibilityTime: 2000,
        });
      });
    });

    it('should handle multiple retry attempts', async () => {
      // Arrange
      const players = [createPlayer(), createPlayer(), createPlayer(), createPlayer()];
      const session = createMockSession();
      const mockRetry = jest.fn();

      const { getByText } = render(
        <RoundsTab
          currentRound={undefined}
          currentRoundIndex={0}
          allRounds={[]}
          hasMatchesStarted={false}
          session={session}
          players={players}
          algorithm={null}
          algorithmError="Algorithm failed"
          onRetryAlgorithm={mockRetry}
          sessionId="session-1"
          onRoundChange={jest.fn()}
        />,
        { wrapper: createWrapper() }
      );

      // Act
      const retryButton = getByText('Retry');
      fireEvent.press(retryButton);
      fireEvent.press(retryButton);
      fireEvent.press(retryButton);

      // Assert
      await waitFor(() => {
        expect(mockRetry).toHaveBeenCalledTimes(3);
      });
    });
  });

  describe('Go Back Button', () => {
    it('should show toast when Go Back button is pressed (with retry)', async () => {
      // Arrange
      const players = [createPlayer(), createPlayer()];
      const session = createMockSession();
      const mockRetry = jest.fn();

      const { getByText } = render(
        <RoundsTab
          currentRound={undefined}
          currentRoundIndex={0}
          allRounds={[]}
          hasMatchesStarted={false}
          session={session}
          players={players}
          algorithm={null}
          algorithmError="Need more players"
          onRetryAlgorithm={mockRetry}
          sessionId="session-1"
          onRoundChange={jest.fn()}
        />,
        { wrapper: createWrapper() }
      );

      // Act
      const goBackButton = getByText('Go Back');
      fireEvent.press(goBackButton);

      // Assert
      await waitFor(() => {
        expect(Toast.show).toHaveBeenCalledWith({
          type: 'info',
          text1: 'Go Back',
          text2: 'Please add players or check session settings',
        });
      });
    });

    it('should show toast when Go to Players button is pressed (no retry)', async () => {
      // Arrange
      const players = [createPlayer(), createPlayer()];
      const session = createMockSession();

      const { getByText } = render(
        <RoundsTab
          currentRound={undefined}
          currentRoundIndex={0}
          allRounds={[]}
          hasMatchesStarted={false}
          session={session}
          players={players}
          algorithm={null}
          algorithmError="Need more players"
          sessionId="session-1"
          onRoundChange={jest.fn()}
        />,
        { wrapper: createWrapper() }
      );

      // Act
      const goToPlayersButton = getByText('Go to Players');
      fireEvent.press(goToPlayersButton);

      // Assert
      await waitFor(() => {
        expect(Toast.show).toHaveBeenCalledWith({
          type: 'info',
          text1: 'Go Back',
          text2: 'Please add players or check session settings',
        });
      });
    });
  });

  describe('Error State Behavior', () => {
    it('should not render normal content when algorithmError is present', () => {
      // Arrange
      const players = [createPlayer(), createPlayer(), createPlayer(), createPlayer()];
      const session = createMockSession();

      // Act
      const { queryByText } = render(
        <RoundsTab
          currentRound={undefined}
          currentRoundIndex={0}
          allRounds={[]}
          hasMatchesStarted={false}
          session={session}
          players={players}
          algorithm={null}
          algorithmError="Some error"
          sessionId="session-1"
          onRoundChange={jest.fn()}
        />,
        { wrapper: createWrapper() }
      );

      // Assert - Should only show error UI, not normal content
      expect(queryByText('Generate Round')).toBeNull();
      expect(queryByText('Setup Error')).toBeTruthy();
    });

    it('should render normal content when algorithmError is null', () => {
      // Arrange
      const players = [createPlayer(), createPlayer(), createPlayer(), createPlayer()];
      const session = createMockSession();
      const mockAlgorithm = {} as any; // Mock algorithm

      // Act
      const { queryByText } = render(
        <RoundsTab
          currentRound={undefined}
          currentRoundIndex={0}
          allRounds={[]}
          hasMatchesStarted={false}
          session={session}
          players={players}
          algorithm={mockAlgorithm}
          algorithmError={null}
          sessionId="session-1"
          onRoundChange={jest.fn()}
        />,
        { wrapper: createWrapper() }
      );

      // Assert - Should NOT show error UI
      expect(queryByText('Setup Error')).toBeNull();
    });
  });
});
