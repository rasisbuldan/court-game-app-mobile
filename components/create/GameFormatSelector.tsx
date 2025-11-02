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
    description: 'Skill-based matchmaking with rotating partners',
  },
  {
    value: 'americano',
    label: 'Americano',
    description: 'Round robin - everyone pairs with everyone',
  },
  {
    value: 'fixed_partner',
    label: 'Fixed Partner',
    description: 'Mexicano with permanent partner pairs',
  },
  {
    value: 'mixed_mexicano',
    label: 'Mixed Mexicano',
    description: 'Mexicano with mandatory mixed doubles (1M+1W)',
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
              backgroundColor: isSelected ? '#EF4444' : '#FFFFFF',
              borderWidth: 1,
              borderColor: isSelected ? '#EF4444' : '#D1D5DB',
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
                fontSize: 14,
                fontWeight: '600',
                color: isSelected ? '#FFFFFF' : '#111827',
                marginBottom: 4,
              }}
            >
              {format.label}
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: isSelected ? '#FFFFFF' : '#6B7280',
                lineHeight: 17,
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
