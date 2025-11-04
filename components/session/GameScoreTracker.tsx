/**
 * Game Score Tracker Component
 *
 * Tracks individual game scores within a match for scoring modes:
 * - First to X Games: Shows game-by-game scores
 * - Total Games: Shows all games played
 *
 * Displays game scores, current match status, and allows editing.
 */

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Trophy, Plus, Minus, Check } from 'lucide-react-native';
import { GameScore } from '@courtster/shared';

export type { GameScore };

interface GameScoreTrackerProps {
  games: GameScore[];
  onUpdateGame: (gameNumber: number, team1Score: number, team2Score: number) => void;
  onCompleteGame: (gameNumber: number) => void;
  pointsPerGame: number;
  readonly?: boolean;
}

export function GameScoreTracker({
  games,
  onUpdateGame,
  onCompleteGame,
  pointsPerGame,
  readonly = false,
}: GameScoreTrackerProps) {
  // Calculate match summary
  const team1GamesWon = games.filter((g) => g.completed && g.team1Score > g.team2Score).length;
  const team2GamesWon = games.filter((g) => g.completed && g.team2Score > g.team1Score).length;
  const team1TotalPoints = games.reduce((sum, g) => sum + g.team1Score, 0);
  const team2TotalPoints = games.reduce((sum, g) => sum + g.team2Score, 0);

  const handleIncrement = (gameNumber: number, team: 1 | 2) => {
    const game = games.find((g) => g.gameNumber === gameNumber);
    if (!game || game.completed) return;

    const newTeam1Score = team === 1 ? game.team1Score + 1 : game.team1Score;
    const newTeam2Score = team === 2 ? game.team2Score + 1 : game.team2Score;

    onUpdateGame(gameNumber, newTeam1Score, newTeam2Score);
  };

  const handleDecrement = (gameNumber: number, team: 1 | 2) => {
    const game = games.find((g) => g.gameNumber === gameNumber);
    if (!game || game.completed) return;

    const newTeam1Score = team === 1 ? Math.max(0, game.team1Score - 1) : game.team1Score;
    const newTeam2Score = team === 2 ? Math.max(0, game.team2Score - 1) : game.team2Score;

    onUpdateGame(gameNumber, newTeam1Score, newTeam2Score);
  };

  return (
    <View className="bg-white rounded-2xl p-4 border border-gray-200">
      {/* Header */}
      <View className="mb-4">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-base font-bold text-gray-900">Game Scores</Text>
          <View className="bg-gray-100 px-3 py-1 rounded-full">
            <Text className="text-xs font-semibold text-gray-700">
              {games.filter((g) => g.completed).length} / {games.length} Games
            </Text>
          </View>
        </View>

        {/* Match Summary */}
        <View className="flex-row items-center gap-4 bg-gray-50 rounded-xl p-3">
          <View className="flex-1">
            <Text className="text-xs text-gray-600 mb-1">Team 1</Text>
            <View className="flex-row items-center gap-2">
              <Text className="text-2xl font-bold text-gray-900">{team1GamesWon}</Text>
              <Text className="text-sm text-gray-500">games</Text>
            </View>
            <Text className="text-xs text-gray-500 mt-1">{team1TotalPoints} pts total</Text>
          </View>

          <View className="w-px h-12 bg-gray-300" />

          <View className="flex-1">
            <Text className="text-xs text-gray-600 mb-1">Team 2</Text>
            <View className="flex-row items-center gap-2">
              <Text className="text-2xl font-bold text-gray-900">{team2GamesWon}</Text>
              <Text className="text-sm text-gray-500">games</Text>
            </View>
            <Text className="text-xs text-gray-500 mt-1">{team2TotalPoints} pts total</Text>
          </View>
        </View>
      </View>

      {/* Games List */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="gap-3"
        contentContainerStyle={{ paddingRight: 16 }}
      >
        {games.map((game) => {
          const isActive = !game.completed;
          const team1Won = game.completed && game.team1Score > game.team2Score;
          const team2Won = game.completed && game.team2Score > game.team1Score;

          return (
            <View
              key={game.gameNumber}
              className={`w-32 rounded-xl p-3 border-2 ${
                isActive
                  ? 'bg-blue-50 border-blue-300'
                  : team1Won
                    ? 'bg-green-50 border-green-300'
                    : team2Won
                      ? 'bg-red-50 border-red-300'
                      : 'bg-gray-50 border-gray-200'
              }`}
            >
              {/* Game Number */}
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-xs font-bold text-gray-600">
                  Game {game.gameNumber}
                </Text>
                {game.completed && (
                  <View className="bg-green-500 p-1 rounded-full">
                    <Check size={10} color="#FFFFFF" strokeWidth={3} />
                  </View>
                )}
              </View>

              {/* Team 1 Score */}
              <View className="mb-2">
                <Text className="text-xs text-gray-600 mb-1">Team 1</Text>
                <View className="flex-row items-center justify-between">
                  <Text
                    className={`text-2xl font-bold ${
                      team1Won ? 'text-green-700' : 'text-gray-900'
                    }`}
                  >
                    {game.team1Score}
                  </Text>
                  {!readonly && isActive && (
                    <View className="flex-row gap-1">
                      <TouchableOpacity
                        onPress={() => handleDecrement(game.gameNumber, 1)}
                        className="w-6 h-6 rounded bg-gray-200 items-center justify-center"
                        activeOpacity={0.7}
                      >
                        <Minus size={12} color="#6B7280" strokeWidth={2.5} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleIncrement(game.gameNumber, 1)}
                        className="w-6 h-6 rounded bg-primary-500 items-center justify-center"
                        activeOpacity={0.7}
                      >
                        <Plus size={12} color="#FFFFFF" strokeWidth={2.5} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>

              {/* Team 2 Score */}
              <View className="mb-3">
                <Text className="text-xs text-gray-600 mb-1">Team 2</Text>
                <View className="flex-row items-center justify-between">
                  <Text
                    className={`text-2xl font-bold ${
                      team2Won ? 'text-green-700' : 'text-gray-900'
                    }`}
                  >
                    {game.team2Score}
                  </Text>
                  {!readonly && isActive && (
                    <View className="flex-row gap-1">
                      <TouchableOpacity
                        onPress={() => handleDecrement(game.gameNumber, 2)}
                        className="w-6 h-6 rounded bg-gray-200 items-center justify-center"
                        activeOpacity={0.7}
                      >
                        <Minus size={12} color="#6B7280" strokeWidth={2.5} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleIncrement(game.gameNumber, 2)}
                        className="w-6 h-6 rounded bg-primary-500 items-center justify-center"
                        activeOpacity={0.7}
                      >
                        <Plus size={12} color="#FFFFFF" strokeWidth={2.5} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>

              {/* Complete Game Button */}
              {!readonly && isActive && (
                <TouchableOpacity
                  onPress={() => onCompleteGame(game.gameNumber)}
                  className="bg-green-500 rounded-lg py-2 items-center"
                  activeOpacity={0.8}
                >
                  <Text className="text-white text-xs font-bold">Complete</Text>
                </TouchableOpacity>
              )}

              {/* Game Result */}
              {game.completed && (
                <View className="items-center">
                  <View className="flex-row items-center gap-1">
                    <Trophy
                      size={12}
                      color={team1Won ? '#15803D' : '#B91C1C'}
                      strokeWidth={2}
                    />
                    <Text className="text-xs font-bold text-gray-700">
                      Team {team1Won ? '1' : '2'} won
                    </Text>
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Info */}
      <View className="mt-3 bg-blue-50 rounded-lg p-2">
        <Text className="text-xs text-blue-800 text-center">
          Each game is played to {pointsPerGame} points
        </Text>
      </View>
    </View>
  );
}
