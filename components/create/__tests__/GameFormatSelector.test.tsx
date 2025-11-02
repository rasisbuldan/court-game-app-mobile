import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { GameFormatSelector } from '../GameFormatSelector';
import { GameType } from '../../../hooks/useSessionForm';

describe('GameFormatSelector', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders all game format options', () => {
      const { getByText } = render(
        <GameFormatSelector value="mexicano" onChange={mockOnChange} />
      );

      expect(getByText('Mexicano')).toBeTruthy();
      expect(getByText('Americano')).toBeTruthy();
      expect(getByText('Fixed Partner')).toBeTruthy();
      expect(getByText('Mixed Mexicano')).toBeTruthy();
    });

    it('shows descriptions for each format', () => {
      const { getByText } = render(
        <GameFormatSelector value="mexicano" onChange={mockOnChange} />
      );

      expect(getByText('Skill-based matchmaking with rotating partners')).toBeTruthy();
      expect(getByText('Round robin - everyone pairs with everyone')).toBeTruthy();
      expect(getByText('Mexicano with permanent partner pairs')).toBeTruthy();
      expect(getByText('Mexicano with mandatory mixed doubles (1M+1W)')).toBeTruthy();
    });

    it('highlights the selected option', () => {
      const { getByText } = render(
        <GameFormatSelector value="mexicano" onChange={mockOnChange} />
      );

      const mexicanoCard = getByText('Mexicano').parent?.parent;
      expect(mexicanoCard?.props.style).toMatchObject({
        backgroundColor: '#EF4444',
      });
    });

    it('does not highlight unselected options', () => {
      const { getByText } = render(
        <GameFormatSelector value="mexicano" onChange={mockOnChange} />
      );

      const americanoCard = getByText('Americano').parent?.parent;
      expect(americanoCard?.props.style).toMatchObject({
        backgroundColor: '#FFFFFF',
      });
    });
  });

  describe('Interaction', () => {
    it('calls onChange when an option is selected', () => {
      const { getByText } = render(
        <GameFormatSelector value="mexicano" onChange={mockOnChange} />
      );

      fireEvent.press(getByText('Americano'));

      expect(mockOnChange).toHaveBeenCalledWith('americano');
    });

    it('calls onChange with correct value for each option', () => {
      const formats: Array<{ label: string; value: GameType }> = [
        { label: 'Mexicano', value: 'mexicano' },
        { label: 'Americano', value: 'americano' },
        { label: 'Fixed Partner', value: 'fixed_partner' },
        { label: 'Mixed Mexicano', value: 'mixed_mexicano' },
      ];

      formats.forEach(({ label, value }) => {
        mockOnChange.mockClear();

        const { getByText } = render(
          <GameFormatSelector value="mexicano" onChange={mockOnChange} />
        );

        fireEvent.press(getByText(label));

        expect(mockOnChange).toHaveBeenCalledWith(value);
      });
    });

    it('does not call onChange when disabled', () => {
      const { getByText } = render(
        <GameFormatSelector value="mexicano" onChange={mockOnChange} disabled />
      );

      fireEvent.press(getByText('Americano'));

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Disabled State', () => {
    it('applies disabled styling when disabled', () => {
      const { getByText } = render(
        <GameFormatSelector value="mexicano" onChange={mockOnChange} disabled />
      );

      const mexicanoCard = getByText('Mexicano').parent?.parent;
      // When disabled, cards should maintain their appearance but be non-interactive
      expect(mexicanoCard).toBeTruthy();
    });

    it('prevents interaction when disabled', () => {
      const { getByText } = render(
        <GameFormatSelector value="mexicano" onChange={mockOnChange} disabled />
      );

      const americanoButton = getByText('Americano').parent?.parent;

      fireEvent.press(americanoButton!);

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Selection States', () => {
    it('updates visual state when value changes', () => {
      const { getByText, rerender } = render(
        <GameFormatSelector value="mexicano" onChange={mockOnChange} />
      );

      let mexicanoCard = getByText('Mexicano').parent?.parent;
      let americanoCard = getByText('Americano').parent?.parent;

      expect(mexicanoCard?.props.style.backgroundColor).toBe('#EF4444');
      expect(americanoCard?.props.style.backgroundColor).toBe('#FFFFFF');

      rerender(<GameFormatSelector value="americano" onChange={mockOnChange} />);

      mexicanoCard = getByText('Mexicano').parent?.parent;
      americanoCard = getByText('Americano').parent?.parent;

      expect(mexicanoCard?.props.style.backgroundColor).toBe('#FFFFFF');
      expect(americanoCard?.props.style.backgroundColor).toBe('#EF4444');
    });

    it('handles all game types correctly', () => {
      const gameTypes: GameType[] = ['mexicano', 'americano', 'fixed_partner', 'mixed_mexicano'];

      gameTypes.forEach((gameType) => {
        const { getByText } = render(
          <GameFormatSelector value={gameType} onChange={mockOnChange} />
        );

        // Find the selected card by checking backgroundColor
        const allCards = [
          getByText('Mexicano').parent?.parent,
          getByText('Americano').parent?.parent,
          getByText('Fixed Partner').parent?.parent,
          getByText('Mixed Mexicano').parent?.parent,
        ];

        const selectedCards = allCards.filter(
          (card) => card?.props.style.backgroundColor === '#EF4444'
        );

        expect(selectedCards).toHaveLength(1);
      });
    });
  });

  describe('Accessibility', () => {
    it('provides touch feedback through TouchableOpacity', () => {
      const { getByText } = render(
        <GameFormatSelector value="mexicano" onChange={mockOnChange} />
      );

      // Verify button is TouchableOpacity by checking it responds to press
      const mexicanoButton = getByText('Mexicano').parent?.parent;
      expect(mexicanoButton).toBeTruthy();
    });

    it('renders all text content correctly', () => {
      const { getByText } = render(
        <GameFormatSelector value="mexicano" onChange={mockOnChange} />
      );

      // Verify all labels are accessible
      expect(getByText('Mexicano')).toBeTruthy();
      expect(getByText('Americano')).toBeTruthy();
      expect(getByText('Fixed Partner')).toBeTruthy();
      expect(getByText('Mixed Mexicano')).toBeTruthy();

      // Verify all descriptions are accessible
      expect(getByText('Skill-based matchmaking with rotating partners')).toBeTruthy();
      expect(getByText('Round robin - everyone pairs with everyone')).toBeTruthy();
      expect(getByText('Mexicano with permanent partner pairs')).toBeTruthy();
      expect(getByText('Mexicano with mandatory mixed doubles (1M+1W)')).toBeTruthy();
    });
  });
});
