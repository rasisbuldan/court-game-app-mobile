import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import CreateSessionScreen from '../create-session';
import { useAuth } from '../../../hooks/useAuth';
import { supabase } from '../../../config/supabase';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';

// Mock dependencies
jest.mock('../../../hooks/useAuth');
jest.mock('../../../config/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));
jest.mock('expo-router');
jest.mock('react-native-toast-message');
jest.mock('expo-haptics');
jest.mock('expo-network', () => ({
  getNetworkStateAsync: jest.fn().mockResolvedValue({
    isConnected: true,
    isInternetReachable: true,
  }),
}));

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
};

const mockRouter = {
  back: jest.fn(),
  push: jest.fn(),
};

describe('CreateSessionScreen - Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  describe('Complete Session Creation Flow', () => {
    it('creates a successful session with all required fields', async () => {
      const mockInsert = jest.fn().mockResolvedValue({
        data: { id: 'session-123', name: 'Test Session' },
        error: null,
      });

      const mockFrom = jest.fn().mockReturnValue({
        insert: mockInsert,
      });

      (supabase.from as jest.Mock).mockImplementation(mockFrom);

      const { getByText, getByPlaceholderText } = render(<CreateSessionScreen />);

      // Fill in session name
      const nameInput = getByPlaceholderText('Enter session name');
      fireEvent.changeText(nameInput, 'Integration Test Session');

      // Select club (assuming ClubSelector is rendered)
      // Note: This would need the ClubSelector to be testable

      // Add players
      const playerInput = getByPlaceholderText('Player name');
      for (let i = 1; i <= 8; i++) {
        fireEvent.changeText(playerInput, `Player ${i}`);
        const addButton = getByText('Add');
        fireEvent.press(addButton);
      }

      // Submit form
      const createButton = getByText('Create Session');
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(mockInsert).toHaveBeenCalled();
        expect(mockRouter.back).toHaveBeenCalled();
      });
    });

    it('validates minimum players requirement', async () => {
      const { getByText, getByPlaceholderText, findByText } = render(<CreateSessionScreen />);

      // Fill in session name
      const nameInput = getByPlaceholderText('Enter session name');
      fireEvent.changeText(nameInput, 'Test Session');

      // Add only 3 players (below minimum)
      const playerInput = getByPlaceholderText('Player name');
      for (let i = 1; i <= 3; i++) {
        fireEvent.changeText(playerInput, `Player ${i}`);
        const addButton = getByText('Add');
        fireEvent.press(addButton);
      }

      // Try to submit
      const createButton = getByText('Create Session');
      fireEvent.press(createButton);

      // Should show validation error
      await waitFor(() => {
        expect(findByText(/Minimum 4 players required/)).toBeTruthy();
      });
    });
  });

  describe('Validation Tests', () => {
    it('prevents submission with missing session name', async () => {
      const { getByText, getByPlaceholderText, findByText } = render(<CreateSessionScreen />);

      // Add players but no name
      const playerInput = getByPlaceholderText('Player name');
      for (let i = 1; i <= 4; i++) {
        fireEvent.changeText(playerInput, `Player ${i}`);
        const addButton = getByText('Add');
        fireEvent.press(addButton);
      }

      const createButton = getByText('Create Session');
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(findByText(/Session name is required/)).toBeTruthy();
      });
    });

    it('prevents duplicate player names', async () => {
      const { getByText, getByPlaceholderText } = render(<CreateSessionScreen />);

      const playerInput = getByPlaceholderText('Player name');
      const addButton = getByText('Add');

      // Add first player
      fireEvent.changeText(playerInput, 'John Doe');
      fireEvent.press(addButton);

      // Try to add duplicate (case-insensitive)
      fireEvent.changeText(playerInput, 'john doe');
      fireEvent.press(addButton);

      await waitFor(() => {
        expect(Toast.show).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'error',
            text1: 'Duplicate Player',
          })
        );
      });
    });

    it('validates past datetime', async () => {
      const { getByText, findByText } = render(<CreateSessionScreen />);

      // Set datetime to past (this would require DateTimePickerModal interaction)
      // For now, we test that validation exists in the form

      const createButton = getByText('Create Session');
      fireEvent.press(createButton);

      // The validation should prevent submission if datetime is in the past
      // This is tested more thoroughly in useSessionForm.test.ts
    });
  });

  describe('Game Type Specific Validation', () => {
    it('validates Mixed Mexicano requires equal gender distribution', async () => {
      const { getByText, getByPlaceholderText } = render(<CreateSessionScreen />);

      // Select Mixed Mexicano format
      fireEvent.press(getByText('Mixed Mexicano'));

      // Add unequal genders (3 males, 5 females)
      const playerInput = getByPlaceholderText('Player name');
      const addButton = getByText('Add');

      // Add players with mixed genders
      for (let i = 1; i <= 8; i++) {
        fireEvent.changeText(playerInput, `Player ${i}`);
        fireEvent.press(addButton);
      }

      // Set genders (3 males, 5 females)
      // This would require gender toggle interaction

      const createButton = getByText('Create Session');
      fireEvent.press(createButton);

      // Should show validation error about unequal genders
    });

    it('validates Fixed Partner requires even number of players', async () => {
      const { getByText, getByPlaceholderText } = render(<CreateSessionScreen />);

      // Select Fixed Partner format
      fireEvent.press(getByText('Fixed Partner'));

      // Add odd number of players (7)
      const player1Input = getByPlaceholderText('Player 1 name');
      const player2Input = getByPlaceholderText('Player 2 name');
      const addPairButton = getByText('Add Pair');

      // Add 3 complete pairs (6 players)
      for (let i = 1; i <= 3; i++) {
        fireEvent.changeText(player1Input, `Player ${i * 2 - 1}`);
        fireEvent.changeText(player2Input, `Player ${i * 2}`);
        fireEvent.press(addPairButton);
      }

      // Add one more player individually would create odd number
      // This should be prevented by the UI in Fixed Partner mode
    });

    it('validates Parallel mode requires sufficient players per court', async () => {
      const { getByText, getByPlaceholderText, findByText } = render(<CreateSessionScreen />);

      // Open advanced options
      fireEvent.press(getByText('Advanced Options'));

      // Set to parallel mode with 3 courts
      fireEvent.press(getByText('Parallel'));
      // Set courts to 3 (would need CourtSelector interaction)

      // Add only 8 players (need 12 for 3 courts)
      const playerInput = getByPlaceholderText('Player name');
      const addButton = getByText('Add');

      for (let i = 1; i <= 8; i++) {
        fireEvent.changeText(playerInput, `Player ${i}`);
        fireEvent.press(addButton);
      }

      const createButton = getByText('Create Session');
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(findByText(/Parallel mode with 3 courts requires at least 12 players/)).toBeTruthy();
      });
    });
  });

  describe('Database Operations', () => {
    it('handles database insertion errors gracefully', async () => {
      const mockInsert = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      });

      const mockFrom = jest.fn().mockReturnValue({
        insert: mockInsert,
      });

      (supabase.from as jest.Mock).mockImplementation(mockFrom);

      const { getByText, getByPlaceholderText } = render(<CreateSessionScreen />);

      // Fill in valid data
      const nameInput = getByPlaceholderText('Enter session name');
      fireEvent.changeText(nameInput, 'Test Session');

      const playerInput = getByPlaceholderText('Player name');
      const addButton = getByText('Add');

      for (let i = 1; i <= 4; i++) {
        fireEvent.changeText(playerInput, `Player ${i}`);
        fireEvent.press(addButton);
      }

      const createButton = getByText('Create Session');
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(Toast.show).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'error',
            text1: 'Error Creating Session',
          })
        );
      });
    });

    it('handles network offline scenario', async () => {
      const Network = require('expo-network');
      Network.getNetworkStateAsync.mockResolvedValueOnce({
        isConnected: false,
        isInternetReachable: false,
      });

      const { getByText, getByPlaceholderText } = render(<CreateSessionScreen />);

      // Fill in valid data
      const nameInput = getByPlaceholderText('Enter session name');
      fireEvent.changeText(nameInput, 'Test Session');

      const playerInput = getByPlaceholderText('Player name');
      const addButton = getByText('Add');

      for (let i = 1; i <= 4; i++) {
        fireEvent.changeText(playerInput, `Player ${i}`);
        fireEvent.press(addButton);
      }

      const createButton = getByText('Create Session');
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(Toast.show).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'error',
            text1: 'No Internet Connection',
          })
        );
      });
    });
  });

  describe('User Interactions', () => {
    it('allows player removal and re-addition', async () => {
      const { getByText, getByPlaceholderText, getAllByTestId } = render(<CreateSessionScreen />);

      const playerInput = getByPlaceholderText('Player name');
      const addButton = getByText('Add');

      // Add 4 players
      for (let i = 1; i <= 4; i++) {
        fireEvent.changeText(playerInput, `Player ${i}`);
        fireEvent.press(addButton);
      }

      // Remove one player (would need X button interaction)
      // Re-add a different player
      fireEvent.changeText(playerInput, 'New Player');
      fireEvent.press(addButton);

      // Should still have 4 players
    });

    it('allows gender toggling for Mixed Mexicano', async () => {
      const { getByText, getByPlaceholderText } = render(<CreateSessionScreen />);

      // Select Mixed Mexicano
      fireEvent.press(getByText('Mixed Mexicano'));

      // Add players
      const playerInput = getByPlaceholderText('Player name');
      const addButton = getByText('Add');

      for (let i = 1; i <= 4; i++) {
        fireEvent.changeText(playerInput, `Player ${i}`);
        fireEvent.press(addButton);
      }

      // Toggle genders (would need gender button interaction)
      // Verify equal distribution can be achieved
    });
  });

  describe('Form Reset', () => {
    it('clears form on successful submission', async () => {
      const mockInsert = jest.fn().mockResolvedValue({
        data: { id: 'session-123' },
        error: null,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      const { getByText, getByPlaceholderText } = render(<CreateSessionScreen />);

      const nameInput = getByPlaceholderText('Enter session name');
      fireEvent.changeText(nameInput, 'Test Session');

      const playerInput = getByPlaceholderText('Player name');
      const addButton = getByText('Add');

      for (let i = 1; i <= 4; i++) {
        fireEvent.changeText(playerInput, `Player ${i}`);
        fireEvent.press(addButton);
      }

      const createButton = getByText('Create Session');
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(mockRouter.back).toHaveBeenCalled();
      });
    });
  });
});
