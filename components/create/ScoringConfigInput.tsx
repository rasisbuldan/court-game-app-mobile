/**
 * Scoring Configuration Input
 *
 * Displays scoring configuration inputs based on the selected scoring mode:
 * - Points Mode: Points per match, win margin
 * - First to X Games: Games to win, points per game, tiebreak rules
 * - Total Games: Total games, points per game, tiebreak rules
 */

import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { ScoringMode } from '../../hooks/useSessionForm';
import { Info } from 'lucide-react-native';

interface ScoringConfig {
  points_per_match?: number;
  games_to_win?: number;
  total_games?: number;
  points_per_game?: number;
  win_margin?: number;
  enable_tiebreak?: boolean;
  tiebreak_points?: number;
}

interface ScoringConfigInputProps {
  scoringMode: ScoringMode;
  config: ScoringConfig;
  onChange: (config: ScoringConfig) => void;
  disabled?: boolean;
}

export function ScoringConfigInput({
  scoringMode,
  config,
  onChange,
  disabled,
}: ScoringConfigInputProps) {
  const updateConfig = (key: keyof ScoringConfig, value: number | boolean) => {
    onChange({ ...config, [key]: value });
  };

  // Points Mode Configuration
  if (scoringMode === 'points') {
    return (
      <View className="gap-4">
        {/* Points per Match */}
        <View>
          <Text className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
            Points per Match
          </Text>
          <View className="flex-row gap-2">
            {[15, 21, 25, 30].map((points) => (
              <TouchableOpacity
                key={points}
                onPress={() => updateConfig('points_per_match', points)}
                disabled={disabled}
                className={`flex-1 py-3 rounded-xl border-2 items-center ${
                  config.points_per_match === points
                    ? 'bg-primary-500 border-primary-500'
                    : 'bg-white border-gray-200'
                }`}
                activeOpacity={0.7}
              >
                <Text
                  className={`font-bold ${
                    config.points_per_match === points ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {points}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom Input */}
          <View className="mt-2">
            <Text className="text-xs text-gray-600 mb-1">Custom Points</Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-semibold"
              keyboardType="number-pad"
              placeholder="Enter custom points"
              value={
                config.points_per_match && ![15, 21, 25, 30].includes(config.points_per_match)
                  ? config.points_per_match.toString()
                  : ''
              }
              onChangeText={(text) => {
                const value = parseInt(text);
                if (!isNaN(value) && value > 0) {
                  updateConfig('points_per_match', value);
                }
              }}
              editable={!disabled}
            />
          </View>
        </View>

        {/* Win Margin (optional) */}
        <View>
          <View className="flex-row items-center gap-2 mb-2">
            <Text className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Minimum Win Margin
            </Text>
            <View className="bg-blue-100 p-1 rounded-full">
              <Info size={12} color="#3B82F6" strokeWidth={2} />
            </View>
          </View>
          <Text className="text-xs text-gray-500 mb-2">
            Require team to win by at least this many points (e.g., 2 for deuce)
          </Text>
          <View className="flex-row gap-2">
            {[0, 1, 2].map((margin) => (
              <TouchableOpacity
                key={margin}
                onPress={() => updateConfig('win_margin', margin)}
                disabled={disabled}
                className={`flex-1 py-3 rounded-xl border-2 items-center ${
                  (config.win_margin || 0) === margin
                    ? 'bg-primary-500 border-primary-500'
                    : 'bg-white border-gray-200'
                }`}
                activeOpacity={0.7}
              >
                <Text
                  className={`font-bold ${
                    (config.win_margin || 0) === margin ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {margin === 0 ? 'None' : `${margin} pts`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  }

  // First to X Games Mode Configuration
  if (scoringMode === 'first_to') {
    return (
      <View className="gap-4">
        {/* Games to Win */}
        <View>
          <Text className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
            Games to Win Match
          </Text>
          <View className="flex-row gap-2">
            {[3, 5, 6, 7].map((games) => (
              <TouchableOpacity
                key={games}
                onPress={() => updateConfig('games_to_win', games)}
                disabled={disabled}
                className={`flex-1 py-3 rounded-xl border-2 items-center ${
                  config.games_to_win === games
                    ? 'bg-primary-500 border-primary-500'
                    : 'bg-white border-gray-200'
                }`}
                activeOpacity={0.7}
              >
                <Text
                  className={`font-bold ${
                    config.games_to_win === games ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {games}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Points per Game */}
        <View>
          <Text className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
            Points per Game
          </Text>
          <View className="flex-row gap-2">
            {[11, 15, 21].map((points) => (
              <TouchableOpacity
                key={points}
                onPress={() => updateConfig('points_per_game', points)}
                disabled={disabled}
                className={`flex-1 py-3 rounded-xl border-2 items-center ${
                  config.points_per_game === points
                    ? 'bg-primary-500 border-primary-500'
                    : 'bg-white border-gray-200'
                }`}
                activeOpacity={0.7}
              >
                <Text
                  className={`font-bold ${
                    config.points_per_game === points ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {points}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tiebreak Rules */}
        <View>
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Tiebreak in Final Game
            </Text>
            <TouchableOpacity
              onPress={() => updateConfig('enable_tiebreak', !config.enable_tiebreak)}
              disabled={disabled}
              className={`px-4 py-2 rounded-full border-2 ${
                config.enable_tiebreak
                  ? 'bg-primary-500 border-primary-500'
                  : 'bg-white border-gray-200'
              }`}
              activeOpacity={0.7}
            >
              <Text
                className={`text-xs font-bold ${
                  config.enable_tiebreak ? 'text-white' : 'text-gray-600'
                }`}
              >
                {config.enable_tiebreak ? 'Enabled' : 'Disabled'}
              </Text>
            </TouchableOpacity>
          </View>

          {config.enable_tiebreak && (
            <View className="mt-2">
              <Text className="text-xs text-gray-600 mb-2">Tiebreak Points</Text>
              <View className="flex-row gap-2">
                {[7, 10, 15].map((points) => (
                  <TouchableOpacity
                    key={points}
                    onPress={() => updateConfig('tiebreak_points', points)}
                    disabled={disabled}
                    className={`flex-1 py-3 rounded-xl border-2 items-center ${
                      config.tiebreak_points === points
                        ? 'bg-primary-500 border-primary-500'
                        : 'bg-white border-gray-200'
                    }`}
                    activeOpacity={0.7}
                  >
                    <Text
                      className={`font-bold ${
                        config.tiebreak_points === points ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {points}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>
      </View>
    );
  }

  // Total Games Mode Configuration
  if (scoringMode === 'total_games') {
    return (
      <View className="gap-4">
        {/* Total Games */}
        <View>
          <Text className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
            Total Games to Play
          </Text>
          <View className="flex-row gap-2">
            {[3, 5, 6, 9].map((games) => (
              <TouchableOpacity
                key={games}
                onPress={() => updateConfig('total_games', games)}
                disabled={disabled}
                className={`flex-1 py-3 rounded-xl border-2 items-center ${
                  config.total_games === games
                    ? 'bg-primary-500 border-primary-500'
                    : 'bg-white border-gray-200'
                }`}
                activeOpacity={0.7}
              >
                <Text
                  className={`font-bold ${
                    config.total_games === games ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {games}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Points per Game */}
        <View>
          <Text className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
            Points per Game
          </Text>
          <View className="flex-row gap-2">
            {[11, 15, 21].map((points) => (
              <TouchableOpacity
                key={points}
                onPress={() => updateConfig('points_per_game', points)}
                disabled={disabled}
                className={`flex-1 py-3 rounded-xl border-2 items-center ${
                  config.points_per_game === points
                    ? 'bg-primary-500 border-primary-500'
                    : 'bg-white border-gray-200'
                }`}
                activeOpacity={0.7}
              >
                <Text
                  className={`font-bold ${
                    config.points_per_game === points ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {points}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Info Box */}
        <View className="bg-blue-50 rounded-xl p-3 border border-blue-200">
          <View className="flex-row items-start gap-2">
            <Info size={16} color="#3B82F6" strokeWidth={2} />
            <Text className="flex-1 text-xs text-blue-800 leading-5">
              Winner is determined by total games won. If tied, point differential decides the
              winner.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return null;
}
