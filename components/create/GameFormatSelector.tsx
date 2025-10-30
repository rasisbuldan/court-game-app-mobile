import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { GameType } from '../../hooks/useSessionForm';

interface GameFormatOption {
  value: GameType;
  label: string;
  description: string;
}

const GAME_FORMATS: GameFormatOption[] = [
  {
    value: 'mexicano',
    label: 'Mexicano',
    description: 'Rotating partners, everyone plays with everyone',
  },
  {
    value: 'mixed_mexicano',
    label: 'Mixed Mexicano',
    description: 'Gender-balanced rotating pairs',
  },
  {
    value: 'americano',
    label: 'Americano',
    description: 'Fixed partners, American-style tournament',
  },
  {
    value: 'fixed_partner',
    label: 'Fixed Partner',
    description: 'Manual partner assignments for all players',
  },
];

interface GameFormatSelectorProps {
  value: GameType;
  onChange: (value: GameType) => void;
  disabled?: boolean;
}

export function GameFormatSelector({ value, onChange, disabled }: GameFormatSelectorProps) {
  return (
    <View style={{ gap: 8 }}>
      {GAME_FORMATS.map((format) => {
        const isSelected = value === format.value;

        return (
          <TouchableOpacity
            key={format.value}
            onPress={() => !disabled && onChange(format.value)}
            disabled={disabled}
            activeOpacity={0.7}
            style={{
              backgroundColor: isSelected ? '#EF4444' : 'rgba(255, 255, 255, 0.9)',
              borderWidth: 1,
              borderColor: isSelected ? '#EF4444' : 'rgba(209, 213, 219, 0.5)',
              borderRadius: 14,
              padding: 16,
              shadowColor: isSelected ? '#EF4444' : '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isSelected ? 0.25 : 0.03,
              shadowRadius: isSelected ? 6 : 3,
              elevation: isSelected ? 4 : 1,
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontWeight: '700',
                color: isSelected ? '#FFFFFF' : '#111827',
                marginBottom: 4,
              }}
            >
              {format.label}
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: isSelected ? 'rgba(255, 255, 255, 0.9)' : '#6B7280',
                lineHeight: 18,
              }}
            >
              {format.description}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
