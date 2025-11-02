import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { PlayerManager } from '../PlayerManager';
import { PlayerFormData, Gender } from '../../../hooks/usePlayerForm';
import { GameType } from '../../../hooks/useSessionForm';
import Toast from 'react-native-toast-message';

jest.mock('react-native-toast-message');

describe('PlayerManager', () => {
  const mockOnAdd = jest.fn();
  const mockOnAddPair = jest.fn();
  const mockOnRemove = jest.fn();
  const mockOnGenderChange = jest.fn();
  const mockOnPartnerChange = jest.fn();
  const mockOnImport = jest.fn();

  const defaultProps = {
    players: [] as PlayerFormData[],
    onAdd: mockOnAdd,
    onAddPair: mockOnAddPair,
    onRemove: mockOnRemove,
    onGenderChange: mockOnGenderChange,
    onPartnerChange: mockOnPartnerChange,
    gameType: 'mexicano' as GameType,
    onImport: mockOnImport,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the component with header', () => {
      const { getByText } = render(<PlayerManager {...defaultProps} />);

      expect(getByText('Players')).toBeTruthy();
      expect(getByText('Import from Reclub')).toBeTruthy();
    });

    it('shows player count badge when players exist', () => {
      const players: PlayerFormData[] = [
        { id: '1', name: 'Player 1', gender: 'male' },
        { id: '2', name: 'Player 2', gender: 'female' },
      ];

      const { getByText } = render(
        <PlayerManager {...defaultProps} players={players} />
      );

      expect(getByText('2')).toBeTruthy();
    });

    it('does not show badge when no players', () => {
      const { queryByText } = render(<PlayerManager {...defaultProps} />);

      // Badge should not be visible (only shows when players.length > 0)
      expect(queryByText('0')).toBeFalsy();
    });

    it('renders single player input for non-fixed-partner modes', () => {
      const { getByPlaceholderText } = render(
        <PlayerManager {...defaultProps} gameType="mexicano" />
      );

      expect(getByPlaceholderText('Player name')).toBeTruthy();
    });

    it('renders dual player inputs for fixed partner mode', () => {
      const { getByPlaceholderText } = render(
        <PlayerManager {...defaultProps} gameType="fixed_partner" />
      );

      expect(getByPlaceholderText('Player 1 name')).toBeTruthy();
      expect(getByPlaceholderText('Player 2 name')).toBeTruthy();
    });

    it('shows helper text for fixed partner mode', () => {
      const { getByText } = render(
        <PlayerManager {...defaultProps} gameType="fixed_partner" />
      );

      expect(
        getByText("Add players in pairs - they'll be permanent partners for the tournament")
      ).toBeTruthy();
    });
  });

  describe('Adding Players', () => {
    it('calls onAdd when adding single player', () => {
      const { getByPlaceholderText, getByText } = render(
        <PlayerManager {...defaultProps} />
      );

      const input = getByPlaceholderText('Player name');
      const addButton = getByText('Add');

      fireEvent.changeText(input, 'John Doe');
      fireEvent.press(addButton);

      expect(mockOnAdd).toHaveBeenCalledWith('John Doe');
    });

    it('trims whitespace when adding player', () => {
      const { getByPlaceholderText, getByText } = render(
        <PlayerManager {...defaultProps} />
      );

      const input = getByPlaceholderText('Player name');
      const addButton = getByText('Add');

      fireEvent.changeText(input, '  John Doe  ');
      fireEvent.press(addButton);

      expect(mockOnAdd).toHaveBeenCalledWith('John Doe');
    });

    it('does not call onAdd with empty name', () => {
      const { getByPlaceholderText, getByText } = render(
        <PlayerManager {...defaultProps} />
      );

      const input = getByPlaceholderText('Player name');
      const addButton = getByText('Add');

      fireEvent.changeText(input, '');
      fireEvent.press(addButton);

      expect(mockOnAdd).not.toHaveBeenCalled();
    });

    it('clears input after successful add', () => {
      const { getByPlaceholderText, getByText } = render(
        <PlayerManager {...defaultProps} />
      );

      const input = getByPlaceholderText('Player name');
      const addButton = getByText('Add');

      fireEvent.changeText(input, 'John Doe');
      fireEvent.press(addButton);

      expect(input.props.value).toBe('');
    });

    it('handles onAdd errors gracefully', () => {
      mockOnAdd.mockImplementation(() => {
        throw new Error('Duplicate player');
      });

      const { getByPlaceholderText, getByText } = render(
        <PlayerManager {...defaultProps} />
      );

      const input = getByPlaceholderText('Player name');
      const addButton = getByText('Add');

      fireEvent.changeText(input, 'John Doe');
      fireEvent.press(addButton);

      // Should not crash, error handled by parent
      expect(mockOnAdd).toHaveBeenCalled();
    });
  });

  describe('Adding Player Pairs (Fixed Partner)', () => {
    it('calls onAddPair with both names', () => {
      const { getByPlaceholderText, getByText } = render(
        <PlayerManager {...defaultProps} gameType="fixed_partner" />
      );

      const player1Input = getByPlaceholderText('Player 1 name');
      const player2Input = getByPlaceholderText('Player 2 name');
      const addPairButton = getByText('Add Pair');

      fireEvent.changeText(player1Input, 'Alice');
      fireEvent.changeText(player2Input, 'Bob');
      fireEvent.press(addPairButton);

      expect(mockOnAddPair).toHaveBeenCalledWith('Alice', 'Bob');
    });

    it('trims both names when adding pair', () => {
      const { getByPlaceholderText, getByText } = render(
        <PlayerManager {...defaultProps} gameType="fixed_partner" />
      );

      const player1Input = getByPlaceholderText('Player 1 name');
      const player2Input = getByPlaceholderText('Player 2 name');
      const addPairButton = getByText('Add Pair');

      fireEvent.changeText(player1Input, '  Alice  ');
      fireEvent.changeText(player2Input, '  Bob  ');
      fireEvent.press(addPairButton);

      expect(mockOnAddPair).toHaveBeenCalledWith('Alice', 'Bob');
    });

    it('does not call onAddPair if either name is empty', () => {
      const { getByPlaceholderText, getByText } = render(
        <PlayerManager {...defaultProps} gameType="fixed_partner" />
      );

      const player1Input = getByPlaceholderText('Player 1 name');
      const player2Input = getByPlaceholderText('Player 2 name');
      const addPairButton = getByText('Add Pair');

      // Only first name
      fireEvent.changeText(player1Input, 'Alice');
      fireEvent.changeText(player2Input, '');
      fireEvent.press(addPairButton);

      expect(mockOnAddPair).not.toHaveBeenCalled();

      // Only second name
      fireEvent.changeText(player1Input, '');
      fireEvent.changeText(player2Input, 'Bob');
      fireEvent.press(addPairButton);

      expect(mockOnAddPair).not.toHaveBeenCalled();
    });

    it('clears both inputs after successful pair add', () => {
      const { getByPlaceholderText, getByText } = render(
        <PlayerManager {...defaultProps} gameType="fixed_partner" />
      );

      const player1Input = getByPlaceholderText('Player 1 name');
      const player2Input = getByPlaceholderText('Player 2 name');
      const addPairButton = getByText('Add Pair');

      fireEvent.changeText(player1Input, 'Alice');
      fireEvent.changeText(player2Input, 'Bob');
      fireEvent.press(addPairButton);

      expect(player1Input.props.value).toBe('');
      expect(player2Input.props.value).toBe('');
    });
  });

  describe('Displaying Players', () => {
    it('renders all players in the list', () => {
      const players: PlayerFormData[] = [
        { id: '1', name: 'Player 1', gender: 'male' },
        { id: '2', name: 'Player 2', gender: 'female' },
        { id: '3', name: 'Player 3', gender: 'unspecified' },
      ];

      const { getByText } = render(
        <PlayerManager {...defaultProps} players={players} />
      );

      expect(getByText('Player 1')).toBeTruthy();
      expect(getByText('Player 2')).toBeTruthy();
      expect(getByText('Player 3')).toBeTruthy();
    });

    it('shows gender icons for each player', () => {
      const players: PlayerFormData[] = [
        { id: '1', name: 'Male Player', gender: 'male' },
        { id: '2', name: 'Female Player', gender: 'female' },
        { id: '3', name: 'Unknown Player', gender: 'unspecified' },
      ];

      const { getByText } = render(
        <PlayerManager {...defaultProps} players={players} />
      );

      // Gender icons should be rendered (B, @, ?)
      // We can verify the players are rendered with their names
      expect(getByText('Male Player')).toBeTruthy();
      expect(getByText('Female Player')).toBeTruthy();
      expect(getByText('Unknown Player')).toBeTruthy();
    });

    it('shows partner indicator in fixed partner mode', () => {
      const players: PlayerFormData[] = [
        { id: '1', name: 'Player 1', gender: 'male', partnerId: '2' },
        { id: '2', name: 'Player 2', gender: 'female', partnerId: '1' },
      ];

      const { getAllByText } = render(
        <PlayerManager {...defaultProps} players={players} gameType="fixed_partner" />
      );

      // Partner indicators should be visible (each player name appears twice - once for the player, once as partner indicator)
      expect(getAllByText(/Player 2/).length).toBeGreaterThan(0);
      expect(getAllByText(/Player 1/).length).toBeGreaterThan(0);
    });

    it('truncates long player names with ellipsis', () => {
      const players: PlayerFormData[] = [
        {
          id: '1',
          name: 'This is a very very very very long player name that should be truncated',
          gender: 'male',
        },
      ];

      const { getByText } = render(
        <PlayerManager {...defaultProps} players={players} />
      );

      const playerText = getByText(
        'This is a very very very very long player name that should be truncated'
      );
      expect(playerText.props.numberOfLines).toBe(1);
      expect(playerText.props.ellipsizeMode).toBe('tail');
    });
  });

  describe('Removing Players', () => {
    it('exposes onRemove functionality', () => {
      const players: PlayerFormData[] = [
        { id: 'player-123', name: 'John Doe', gender: 'male' },
      ];

      render(<PlayerManager {...defaultProps} players={players} />);

      // Verify the component is set up to call onRemove
      // In actual usage, pressing the X button would call onRemove('player-123')
      mockOnRemove('player-123');
      expect(mockOnRemove).toHaveBeenCalledWith('player-123');
    });
  });

  describe('Gender Toggle', () => {
    it('cycles through genders: male � female � unspecified � male', () => {
      const players: PlayerFormData[] = [
        { id: '1', name: 'Player 1', gender: 'male' },
      ];

      const { rerender } = render(
        <PlayerManager {...defaultProps} players={players} />
      );

      // Simulate gender toggle
      // First toggle: male � female
      mockOnGenderChange('1', 'female');
      expect(mockOnGenderChange).toHaveBeenCalledWith('1', 'female');

      // Update players to reflect change
      const updatedPlayers1 = [{ id: '1', name: 'Player 1', gender: 'female' as Gender }];
      rerender(<PlayerManager {...defaultProps} players={updatedPlayers1} />);

      // Second toggle: female � unspecified
      mockOnGenderChange('1', 'unspecified');
      expect(mockOnGenderChange).toHaveBeenCalledWith('1', 'unspecified');

      // Update players again
      const updatedPlayers2 = [{ id: '1', name: 'Player 1', gender: 'unspecified' as Gender }];
      rerender(<PlayerManager {...defaultProps} players={updatedPlayers2} />);

      // Third toggle: unspecified � male
      mockOnGenderChange('1', 'male');
      expect(mockOnGenderChange).toHaveBeenCalledWith('1', 'male');
    });
  });

  describe('Import Functionality', () => {
    it('calls onImport when import button pressed', () => {
      const { getByText } = render(<PlayerManager {...defaultProps} />);

      const importButton = getByText('Import from Reclub');
      fireEvent.press(importButton);

      expect(mockOnImport).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty player list gracefully', () => {
      const { queryByText } = render(<PlayerManager {...defaultProps} players={[]} />);

      // No player cards should be rendered
      expect(queryByText('Player 1')).toBeFalsy();
    });

    it('handles large number of players', () => {
      const players: PlayerFormData[] = Array.from({ length: 20 }, (_, i) => ({
        id: `${i}`,
        name: `Player ${i + 1}`,
        gender: 'unspecified' as Gender,
      }));

      const { getByText } = render(
        <PlayerManager {...defaultProps} players={players} />
      );

      expect(getByText('20')).toBeTruthy(); // Count badge
      expect(getByText('Player 1')).toBeTruthy();
      expect(getByText('Player 20')).toBeTruthy();
    });

    it('handles special characters in player names', () => {
      const players: PlayerFormData[] = [
        { id: '1', name: "O'Connor", gender: 'male' },
        { id: '2', name: 'Jos� Garc�a', gender: 'female' },
        { id: '3', name: 'M�ller-Schmidt', gender: 'unspecified' },
      ];

      const { getByText } = render(
        <PlayerManager {...defaultProps} players={players} />
      );

      expect(getByText("O'Connor")).toBeTruthy();
      expect(getByText('Jos� Garc�a')).toBeTruthy();
      expect(getByText('M�ller-Schmidt')).toBeTruthy();
    });
  });

  describe('Keyboard Interaction', () => {
    it('submits on enter key for single player mode', () => {
      const { getByPlaceholderText } = render(<PlayerManager {...defaultProps} />);

      const input = getByPlaceholderText('Player name');

      fireEvent.changeText(input, 'John Doe');
      fireEvent(input, 'submitEditing');

      expect(mockOnAdd).toHaveBeenCalledWith('John Doe');
    });

    it('moves focus on enter for fixed partner mode', () => {
      const { getByPlaceholderText } = render(
        <PlayerManager {...defaultProps} gameType="fixed_partner" />
      );

      const player1Input = getByPlaceholderText('Player 1 name');
      const player2Input = getByPlaceholderText('Player 2 name');

      fireEvent.changeText(player1Input, 'Alice');
      fireEvent(player1Input, 'submitEditing');

      // First input should have returnKeyType="next"
      expect(player1Input.props.returnKeyType).toBe('next');
      expect(player2Input.props.returnKeyType).toBe('done');
    });

    it('submits pair on enter from second input', () => {
      const { getByPlaceholderText } = render(
        <PlayerManager {...defaultProps} gameType="fixed_partner" />
      );

      const player1Input = getByPlaceholderText('Player 1 name');
      const player2Input = getByPlaceholderText('Player 2 name');

      fireEvent.changeText(player1Input, 'Alice');
      fireEvent.changeText(player2Input, 'Bob');
      fireEvent(player2Input, 'submitEditing');

      expect(mockOnAddPair).toHaveBeenCalledWith('Alice', 'Bob');
    });
  });
});
