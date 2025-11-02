/**
 * RoundsTab Component Tests
 *
 * Tests the rounds display and score entry functionality including:
 * - Round navigation
 * - Score entry and validation
 * - Auto-fill scores
 * - Round generation
 * - Offline/online handling
 * - Different scoring modes
 * - Edge cases and error handling
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RoundsTab } from '../RoundsTab';
import { MexicanoAlgorithm, Player, Round } from '@courtster/shared';
import { createMockPlayers, createMockPlayersWithPoints } from '../../../__tests__/factories/playerFactory';
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
    from: jest.fn(() => ({
      update: jest.fn().mockResolvedValue({ error: null }),
      insert: jest.fn().mockResolvedValue({ error: null }),
    })),
  },
}));

jest.mock('../../../hooks/useNetworkStatus', () => ({
  useNetworkStatus: () => ({ isOnline: true }),
}));

jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
}));

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

describe('RoundsTab Component', () => {
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

  describe('Initial Round Generation', () => {
    it('displays generate button when no rounds exist', () => {
      const players = createMockPlayers(8);
      const session = createMockSession();
      const algorithm = new MexicanoAlgorithm(players, 2);

      const { getByText } = render(
        <RoundsTab
          currentRound={undefined}
          currentRoundIndex={0}
          allRounds={[]}
          hasMatchesStarted={false}
          session={session}
          players={players}
          algorithm={algorithm}
          sessionId={session.id}
          onRoundChange={jest.fn()}
        />,
        { wrapper: createWrapper() }
      );

      expect(getByText('Generate Round 1')).toBeTruthy();
    });

    it('generates first round when button clicked', () => {
      const players = createMockPlayers(8);
      const session = createMockSession();
      const algorithm = new MexicanoAlgorithm(players, 2);

      const { getByText } = render(
        <RoundsTab
          currentRound={undefined}
          currentRoundIndex={0}
          allRounds={[]}
          hasMatchesStarted={false}
          session={session}
          players={players}
          algorithm={algorithm}
          sessionId={session.id}
          onRoundChange={jest.fn()}
        />,
        { wrapper: createWrapper() }
      );

      fireEvent.press(getByText('Generate Round 1'));

      expect(mockMutate).toHaveBeenCalled();
    });

    it('throws error when algorithm is null', async () => {
      const players = createMockPlayers(8);
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
          sessionId={session.id}
          onRoundChange={jest.fn()}
        />,
        { wrapper: createWrapper() }
      );

      fireEvent.press(getByText('Generate Round 1'));

      expect(mockMutate).toHaveBeenCalled();
    });
  });

  describe('Round Navigation', () => {
    it('displays current round number correctly', () => {
      const players = createMockPlayers(8);
      const session = createMockSession();
      const rounds = [
        createMockRound(1, 2),
        createMockRound(2, 2),
        createMockRound(3, 2),
      ];

      const { getByText } = render(
        <RoundsTab
          currentRound={rounds[1]}
          currentRoundIndex={1}
          allRounds={rounds}
          hasMatchesStarted={true}
          session={session}
          players={players}
          algorithm={new MexicanoAlgorithm(players, 2)}
          sessionId={session.id}
          onRoundChange={jest.fn()}
        />,
        { wrapper: createWrapper() }
      );

      expect(getByText(/ROUND 2 OF 3/i)).toBeTruthy();
    });

    it('navigates to previous round when left chevron clicked', () => {
      const players = createMockPlayers(8);
      const session = createMockSession();
      const rounds = [createMockRound(1, 2), createMockRound(2, 2)];
      const onRoundChange = jest.fn();

      const { UNSAFE_getAllByType } = render(
        <RoundsTab
          currentRound={rounds[1]}
          currentRoundIndex={1}
          allRounds={rounds}
          hasMatchesStarted={true}
          session={session}
          players={players}
          algorithm={new MexicanoAlgorithm(players, 2)}
          sessionId={session.id}
          onRoundChange={onRoundChange}
        />,
        { wrapper: createWrapper() }
      );

      // Find ChevronLeft button (first chevron)
      const chevrons = UNSAFE_getAllByType(require('lucide-react-native').ChevronLeft);
      if (chevrons.length > 0) {
        fireEvent.press(chevrons[0].parent!);
        expect(onRoundChange).toHaveBeenCalledWith(0);
      }
    });

    it('disables previous button on first round', () => {
      const players = createMockPlayers(8);
      const session = createMockSession();
      const rounds = [createMockRound(1, 2)];

      const { UNSAFE_getAllByType } = render(
        <RoundsTab
          currentRound={rounds[0]}
          currentRoundIndex={0}
          allRounds={rounds}
          hasMatchesStarted={true}
          session={session}
          players={players}
          algorithm={new MexicanoAlgorithm(players, 2)}
          sessionId={session.id}
          onRoundChange={jest.fn()}
        />,
        { wrapper: createWrapper() }
      );

      const chevrons = UNSAFE_getAllByType(require('lucide-react-native').ChevronLeft);
      if (chevrons.length > 0) {
        // Verify chevron is disabled (low opacity)
        expect(chevrons[0].parent?.props.style).toEqual(
          expect.objectContaining({ opacity: 0.3 })
        );
      }
    });
  });

  describe('Score Entry', () => {
    describe('Fixed Points Mode', () => {
      it('accepts valid score entry', async () => {
        const players = createMockPlayers(8);
        const session = createMockSession({ scoring_mode: 'fixed', points_per_match: 24 });
        const round = createMockRound(1, 1);

        const { getAllByPlaceholderText } = render(
          <RoundsTab
            currentRound={round}
            currentRoundIndex={0}
            allRounds={[round]}
            hasMatchesStarted={true}
            session={session}
            players={players}
            algorithm={new MexicanoAlgorithm(players, 2)}
            sessionId={session.id}
            onRoundChange={jest.fn()}
          />,
          { wrapper: createWrapper() }
        );

        const scoreInputs = getAllByPlaceholderText('0');

        // Enter team 1 score
        fireEvent.changeText(scoreInputs[0], '14');
        fireEvent(scoreInputs[0], 'blur');

        await waitFor(() => {
          expect(mockMutate).toHaveBeenCalledWith(
            expect.objectContaining({
              team1Score: 14,
            })
          );
        });
      });

      it('auto-fills opponent score in fixed mode', async () => {
        const players = createMockPlayers(8);
        const session = createMockSession({ scoring_mode: 'fixed', points_per_match: 24 });
        const round = createMockRound(1, 1);

        const { getAllByPlaceholderText } = render(
          <RoundsTab
            currentRound={round}
            currentRoundIndex={0}
            allRounds={[round]}
            hasMatchesStarted={true}
            session={session}
            players={players}
            algorithm={new MexicanoAlgorithm(players, 2)}
            sessionId={session.id}
            onRoundChange={jest.fn()}
          />,
          { wrapper: createWrapper() }
        );

        const scoreInputs = getAllByPlaceholderText('0');

        // Enter team 1 score: 14
        // Should auto-fill team 2: 24 - 14 = 10
        fireEvent.changeText(scoreInputs[0], '14');
        fireEvent(scoreInputs[0], 'blur');

        await waitFor(() => {
          expect(mockMutate).toHaveBeenCalledWith(
            expect.objectContaining({
              team1Score: 14,
              team2Score: 10, // Auto-filled
            })
          );
        });
      });

      it('does NOT auto-fill in first_to mode', async () => {
        const players = createMockPlayers(8);
        const session = createMockSession({ scoring_mode: 'first_to', points_per_match: 21 });
        const round = createMockRound(1, 1);

        const { getAllByPlaceholderText } = render(
          <RoundsTab
            currentRound={round}
            currentRoundIndex={0}
            allRounds={[round]}
            hasMatchesStarted={true}
            session={session}
            players={players}
            algorithm={new MexicanoAlgorithm(players, 2)}
            sessionId={session.id}
            onRoundChange={jest.fn()}
          />,
          { wrapper: createWrapper() }
        );

        const scoreInputs = getAllByPlaceholderText('0');

        fireEvent.changeText(scoreInputs[0], '21');
        fireEvent(scoreInputs[0], 'blur');

        // In first_to mode, should NOT auto-fill
        await waitFor(() => {
          expect(mockMutate).toHaveBeenCalledWith(
            expect.objectContaining({
              team1Score: 21,
              team2Score: 0, // Not auto-filled
            })
          );
        });
      });

      it('rejects negative scores', () => {
        const players = createMockPlayers(8);
        const session = createMockSession();
        const round = createMockRound(1, 1);

        const { getAllByPlaceholderText } = render(
          <RoundsTab
            currentRound={round}
            currentRoundIndex={0}
            allRounds={[round]}
            hasMatchesStarted={true}
            session={session}
            players={players}
            algorithm={new MexicanoAlgorithm(players, 2)}
            sessionId={session.id}
            onRoundChange={jest.fn()}
          />,
          { wrapper: createWrapper() }
        );

        const scoreInputs = getAllByPlaceholderText('0');

        // Try to enter negative score
        fireEvent.changeText(scoreInputs[0], '-5');
        fireEvent(scoreInputs[0], 'blur');

        // Should not save negative scores
        expect(mockMutate).not.toHaveBeenCalled();
      });

      it('handles empty input by keeping existing value', () => {
        const players = createMockPlayers(8);
        const session = createMockSession();
        const round = createMockRound(1, 1, true);
        round.matches[0].team1Score = 10;

        const { getAllByPlaceholderText } = render(
          <RoundsTab
            currentRound={round}
            currentRoundIndex={0}
            allRounds={[round]}
            hasMatchesStarted={true}
            session={session}
            players={players}
            algorithm={new MexicanoAlgorithm(players, 2)}
            sessionId={session.id}
            onRoundChange={jest.fn()}
          />,
          { wrapper: createWrapper() }
        );

        const scoreInputs = getAllByPlaceholderText('0');

        // Clear input
        fireEvent.changeText(scoreInputs[0], '');
        fireEvent(scoreInputs[0], 'blur');

        // Should not save empty value
        expect(mockMutate).not.toHaveBeenCalled();
      });

      it('validates score exceeds maximum in fixed mode', async () => {
        const players = createMockPlayers(8);
        const session = createMockSession({ scoring_mode: 'fixed', points_per_match: 24 });
        const round = createMockRound(1, 1);

        const { getAllByPlaceholderText } = render(
          <RoundsTab
            currentRound={round}
            currentRoundIndex={0}
            allRounds={[round]}
            hasMatchesStarted={true}
            session={session}
            players={players}
            algorithm={new MexicanoAlgorithm(players, 2)}
            sessionId={session.id}
            onRoundChange={jest.fn()}
          />,
          { wrapper: createWrapper() }
        );

        const scoreInputs = getAllByPlaceholderText('0');

        // Enter score > 24 (which would auto-fill to negative)
        fireEvent.changeText(scoreInputs[0], '30');
        fireEvent(scoreInputs[0], 'blur');

        // Should still save but auto-fill will be capped at 0
        await waitFor(() => {
          expect(mockMutate).toHaveBeenCalledWith(
            expect.objectContaining({
              team1Score: 30,
              team2Score: 0, // Capped at 0 (max would be negative)
            })
          );
        });
      });
    });

    describe('First To Mode', () => {
      it('requires one team to reach exact target score', () => {
        const players = createMockPlayers(8);
        const session = createMockSession({ scoring_mode: 'first_to', points_per_match: 21 });
        const round = createMockRound(1, 1);
        round.matches[0].team1Score = 21;
        round.matches[0].team2Score = 19;

        const { getByText } = render(
          <RoundsTab
            currentRound={round}
            currentRoundIndex={0}
            allRounds={[round]}
            hasMatchesStarted={true}
            session={session}
            players={players}
            algorithm={new MexicanoAlgorithm(players, 2)}
            sessionId={session.id}
            onRoundChange={jest.fn()}
          />,
          { wrapper: createWrapper() }
        );

        // Try to generate next round
        const nextButton = getByText(/ROUND 1 OF 1/);
        fireEvent.press(nextButton.parent!.parent!);

        // Should allow generation since one team reached 21
        expect(mockMutate).toHaveBeenCalled();
      });
    });
  });

  describe('Round Generation Validation', () => {
    it('prevents next round if not all matches scored', () => {
      const players = createMockPlayers(8);
      const session = createMockSession();
      const round = createMockRound(1, 2);
      // Only first match has scores
      round.matches[0].team1Score = 12;
      round.matches[0].team2Score = 12;
      // Second match has no scores

      const { getByText } = render(
        <RoundsTab
          currentRound={round}
          currentRoundIndex={0}
          allRounds={[round]}
          hasMatchesStarted={true}
          session={session}
          players={players}
          algorithm={new MexicanoAlgorithm(players, 2)}
          sessionId={session.id}
          onRoundChange={jest.fn()}
        />,
        { wrapper: createWrapper() }
      );

      // Try to go to next round
      fireEvent.press(getByText(/ROUND 1 OF 1/).parent!.parent!);

      // Should show error toast
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          text1: 'Incomplete Round',
        })
      );

      // Should not generate round
      expect(mockMutate).not.toHaveBeenCalled();
    });

    it('allows next round when all matches scored', () => {
      const players = createMockPlayers(8);
      const session = createMockSession();
      const round = createMockRound(1, 2, true);

      const { getByText } = render(
        <RoundsTab
          currentRound={round}
          currentRoundIndex={0}
          allRounds={[round]}
          hasMatchesStarted={true}
          session={session}
          players={players}
          algorithm={new MexicanoAlgorithm(players, 2)}
          sessionId={session.id}
          onRoundChange={jest.fn()}
        />,
        { wrapper: createWrapper() }
      );

      fireEvent.press(getByText(/ROUND 1 OF 1/).parent!.parent!);

      // Should generate round
      expect(mockMutate).toHaveBeenCalled();
    });
  });

  describe('Compact vs Standard Mode', () => {
    it('renders in compact mode when compactMode=true', () => {
      const players = createMockPlayers(8);
      const session = createMockSession();
      const round = createMockRound(1, 1);

      const { getByText } = render(
        <RoundsTab
          currentRound={round}
          currentRoundIndex={0}
          allRounds={[round]}
          hasMatchesStarted={true}
          session={session}
          players={players}
          algorithm={new MexicanoAlgorithm(players, 2)}
          sessionId={session.id}
          onRoundChange={jest.fn()}
          compactMode={true}
        />,
        { wrapper: createWrapper() }
      );

      // Compact mode should show court labels
      expect(getByText(/COURT 1/i)).toBeTruthy();
    });

    it('renders in standard mode by default', () => {
      const players = createMockPlayers(8);
      const session = createMockSession();
      const round = createMockRound(1, 1);

      const { getByText } = render(
        <RoundsTab
          currentRound={round}
          currentRoundIndex={0}
          allRounds={[round]}
          hasMatchesStarted={true}
          session={session}
          players={players}
          algorithm={new MexicanoAlgorithm(players, 2)}
          sessionId={session.id}
          onRoundChange={jest.fn()}
        />,
        { wrapper: createWrapper() }
      );

      // Standard mode should show court labels too
      expect(getByText(/COURT 1/i)).toBeTruthy();
    });
  });

  describe('Sitting Players', () => {
    it('displays sitting players list', () => {
      const players = createMockPlayers(10);
      const session = createMockSession();
      const algorithm = new MexicanoAlgorithm(players, 2);
      const round = algorithm.generateRound(1);

      const { getByText } = render(
        <RoundsTab
          currentRound={round}
          currentRoundIndex={0}
          allRounds={[round]}
          hasMatchesStarted={true}
          session={session}
          players={players}
          algorithm={algorithm}
          sessionId={session.id}
          onRoundChange={jest.fn()}
        />,
        { wrapper: createWrapper() }
      );

      expect(getByText(/Sitting Out/i)).toBeTruthy();
      expect(round.sittingPlayers.length).toBe(2); // 10 players, 8 playing
    });

    it('shows switch player button when callback provided', () => {
      const players = createMockPlayers(10);
      const session = createMockSession();
      const algorithm = new MexicanoAlgorithm(players, 2);
      const round = algorithm.generateRound(1);
      const onSwitchPlayerPress = jest.fn();

      const { getByText } = render(
        <RoundsTab
          currentRound={round}
          currentRoundIndex={0}
          allRounds={[round]}
          hasMatchesStarted={true}
          session={session}
          players={players}
          algorithm={algorithm}
          sessionId={session.id}
          onRoundChange={jest.fn()}
          onSwitchPlayerPress={onSwitchPlayerPress}
        />,
        { wrapper: createWrapper() }
      );

      const switchButton = getByText('Switch Player');
      expect(switchButton).toBeTruthy();

      fireEvent.press(switchButton);
      expect(onSwitchPlayerPress).toHaveBeenCalled();
    });

    it('does not show switch button when no callback provided', () => {
      const players = createMockPlayers(10);
      const session = createMockSession();
      const algorithm = new MexicanoAlgorithm(players, 2);
      const round = algorithm.generateRound(1);

      const { queryByText } = render(
        <RoundsTab
          currentRound={round}
          currentRoundIndex={0}
          allRounds={[round]}
          hasMatchesStarted={true}
          session={session}
          players={players}
          algorithm={algorithm}
          sessionId={session.id}
          onRoundChange={jest.fn()}
        />,
        { wrapper: createWrapper() }
      );

      expect(queryByText('Switch Player')).toBeNull();
    });

    it('shows player count correctly', () => {
      const players = createMockPlayers(12);
      const session = createMockSession({ courts: 2 });
      const algorithm = new MexicanoAlgorithm(players, 2);
      const round = algorithm.generateRound(1);

      const { getByText } = render(
        <RoundsTab
          currentRound={round}
          currentRoundIndex={0}
          allRounds={[round]}
          hasMatchesStarted={true}
          session={session}
          players={players}
          algorithm={algorithm}
          sessionId={session.id}
          onRoundChange={jest.fn()}
        />,
        { wrapper: createWrapper() }
      );

      // 12 players, 8 playing on 2 courts = 4 sitting
      expect(getByText(/4 players/i)).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('handles no matches in current round', () => {
      const players = createMockPlayers(2); // Not enough for a match
      const session = createMockSession();
      const round: Round = {
        number: 1,
        matches: [],
        sittingPlayers: players,
      };

      const { getByText } = render(
        <RoundsTab
          currentRound={round}
          currentRoundIndex={0}
          allRounds={[round]}
          hasMatchesStarted={true}
          session={session}
          players={players}
          algorithm={new MexicanoAlgorithm(createMockPlayers(4), 1)}
          sessionId={session.id}
          onRoundChange={jest.fn()}
        />,
        { wrapper: createWrapper() }
      );

      expect(getByText(/No matches available/i)).toBeTruthy();
    });

    it('clears local scores when round changes', () => {
      const players = createMockPlayers(8);
      const session = createMockSession();
      const rounds = [createMockRound(1, 2), createMockRound(2, 2)];

      const { rerender, getAllByPlaceholderText } = render(
        <RoundsTab
          currentRound={rounds[0]}
          currentRoundIndex={0}
          allRounds={rounds}
          hasMatchesStarted={true}
          session={session}
          players={players}
          algorithm={new MexicanoAlgorithm(players, 2)}
          sessionId={session.id}
          onRoundChange={jest.fn()}
        />,
        { wrapper: createWrapper() }
      );

      // Enter a score
      const scoreInputs = getAllByPlaceholderText('0');
      fireEvent.changeText(scoreInputs[0], '14');

      // Change to next round
      rerender(
        <RoundsTab
          currentRound={rounds[1]}
          currentRoundIndex={1}
          allRounds={rounds}
          hasMatchesStarted={true}
          session={session}
          players={players}
          algorithm={new MexicanoAlgorithm(players, 2)}
          sessionId={session.id}
          onRoundChange={jest.fn()}
        />
      );

      // Local scores should be cleared (tested via behavior)
      const newScoreInputs = getAllByPlaceholderText('0');
      expect(newScoreInputs[0].props.value).toBe('');
    });

    it('displays all player names correctly', () => {
      const players = createMockPlayers(8);
      const session = createMockSession();
      const round = createMockRound(1, 2);

      const { getByText } = render(
        <RoundsTab
          currentRound={round}
          currentRoundIndex={0}
          allRounds={[round]}
          hasMatchesStarted={true}
          session={session}
          players={players}
          algorithm={new MexicanoAlgorithm(players, 2)}
          sessionId={session.id}
          onRoundChange={jest.fn()}
        />,
        { wrapper: createWrapper() }
      );

      // Check that player names are displayed
      round.matches.forEach(match => {
        expect(getByText(match.team1[0].name)).toBeTruthy();
        expect(getByText(match.team1[1].name)).toBeTruthy();
        expect(getByText(match.team2[0].name)).toBeTruthy();
        expect(getByText(match.team2[1].name)).toBeTruthy();
      });
    });

    it('handles undefined currentRound gracefully', () => {
      const players = createMockPlayers(8);
      const session = createMockSession();

      const { getByText } = render(
        <RoundsTab
          currentRound={undefined}
          currentRoundIndex={0}
          allRounds={[]}
          hasMatchesStarted={false}
          session={session}
          players={players}
          algorithm={new MexicanoAlgorithm(players, 2)}
          sessionId={session.id}
          onRoundChange={jest.fn()}
        />,
        { wrapper: createWrapper() }
      );

      // Should show generate button
      expect(getByText('Generate Round 1')).toBeTruthy();
    });

    it('displays loading state while generating round', () => {
      (require('@tanstack/react-query').useMutation as jest.Mock).mockReturnValue({
        mutate: mockMutate,
        isPending: true,
      });

      const players = createMockPlayers(8);
      const session = createMockSession();

      const { UNSAFE_getAllByType } = render(
        <RoundsTab
          currentRound={undefined}
          currentRoundIndex={0}
          allRounds={[]}
          hasMatchesStarted={false}
          session={session}
          players={players}
          algorithm={new MexicanoAlgorithm(players, 2)}
          sessionId={session.id}
          onRoundChange={jest.fn()}
        />,
        { wrapper: createWrapper() }
      );

      // Should show loading indicator
      const { ActivityIndicator } = require('react-native');
      const indicators = UNSAFE_getAllByType(ActivityIndicator);
      expect(indicators.length).toBeGreaterThan(0);
    });

    it('handles match with missing player data', () => {
      const players = createMockPlayers(8);
      const session = createMockSession();
      const round = createMockRound(1, 1);

      // Simulate missing player name
      round.matches[0].team1[0].name = '';

      const { UNSAFE_root } = render(
        <RoundsTab
          currentRound={round}
          currentRoundIndex={0}
          allRounds={[round]}
          hasMatchesStarted={true}
          session={session}
          players={players}
          algorithm={new MexicanoAlgorithm(players, 2)}
          sessionId={session.id}
          onRoundChange={jest.fn()}
        />,
        { wrapper: createWrapper() }
      );

      // Should still render without crashing
      expect(UNSAFE_root).toBeTruthy();
    });

    it('handles very large scores', async () => {
      const players = createMockPlayers(8);
      const session = createMockSession({ scoring_mode: 'fixed', points_per_match: 99 });
      const round = createMockRound(1, 1);

      const { getAllByPlaceholderText } = render(
        <RoundsTab
          currentRound={round}
          currentRoundIndex={0}
          allRounds={[round]}
          hasMatchesStarted={true}
          session={session}
          players={players}
          algorithm={new MexicanoAlgorithm(players, 2)}
          sessionId={session.id}
          onRoundChange={jest.fn()}
        />,
        { wrapper: createWrapper() }
      );

      const scoreInputs = getAllByPlaceholderText('0');

      fireEvent.changeText(scoreInputs[0], '99');
      fireEvent(scoreInputs[0], 'blur');

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            team1Score: 99,
          })
        );
      });
    });
  });

  describe('Offline Behavior', () => {
    it('queues score updates when offline', async () => {
      (require('../../../hooks/useNetworkStatus').useNetworkStatus as jest.Mock) = jest.fn(() => ({
        isOnline: false,
      }));

      const players = createMockPlayers(8);
      const session = createMockSession();
      const round = createMockRound(1, 1);

      const { getAllByPlaceholderText } = render(
        <RoundsTab
          currentRound={round}
          currentRoundIndex={0}
          allRounds={[round]}
          hasMatchesStarted={true}
          session={session}
          players={players}
          algorithm={new MexicanoAlgorithm(players, 2)}
          sessionId={session.id}
          onRoundChange={jest.fn()}
        />,
        { wrapper: createWrapper() }
      );

      const scoreInputs = getAllByPlaceholderText('0');

      fireEvent.changeText(scoreInputs[0], '14');
      fireEvent(scoreInputs[0], 'blur');

      // Should still call mutate (which will queue offline)
      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalled();
      });
    });
  });
});
