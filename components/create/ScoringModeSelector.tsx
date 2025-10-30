import { View, Text, TouchableOpacity } from 'react-native';
import { Sport, ScoringMode } from '../../hooks/useSessionForm';

interface ScoringModeOption {
  value: ScoringMode;
  label: string;
  description: string;
  excludeForTennis?: boolean;
}

const SCORING_MODES: ScoringModeOption[] = [
  {
    value: 'points',
    label: 'Total Points',
    description: 'Race to X total points',
    excludeForTennis: true,
  },
  {
    value: 'total_games',
    label: 'Total Games',
    description: 'Play X games total',
  },
  {
    value: 'first_to',
    label: 'First to X Points',
    description: 'First team to reach X points wins',
    excludeForTennis: true,
  },
  {
    value: 'first_to_games',
    label: 'First to X Games',
    description: 'First team to win X games',
  },
];

interface ScoringModeSelectorProps {
  value: ScoringMode;
  onChange: (value: ScoringMode) => void;
  sport: Sport;
  disabled?: boolean;
}

export function ScoringModeSelector({
  value,
  onChange,
  sport,
  disabled,
}: ScoringModeSelectorProps) {
  const availableModes = SCORING_MODES.filter(
    (mode) => !(sport === 'tennis' && mode.excludeForTennis)
  );

  return (
    <View style={{ gap: 8 }}>
      {availableModes.map((mode) => {
        const isSelected = value === mode.value;

        return (
          <TouchableOpacity
            key={mode.value}
            onPress={() => !disabled && onChange(mode.value)}
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
              {mode.label}
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: isSelected ? 'rgba(255, 255, 255, 0.9)' : '#6B7280',
                lineHeight: 18,
              }}
            >
              {mode.description}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
