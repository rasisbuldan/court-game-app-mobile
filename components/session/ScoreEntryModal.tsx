/**
 * Score Entry Modal
 *
 * Enhanced modal for entering match scores with support for different scoring modes:
 * - Points Mode: Simple point entry
 * - First to X Games: Game-by-game score tracking
 * - Total Games: Game-by-game score tracking
 *
 * Features:
 * - Quick increment/decrement buttons
 * - Game score tracking for game-based modes
 * - Visual feedback and validation
 * - Keyboard input support
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { X, Plus, Minus, Check, Trophy } from 'lucide-react-native';
import { GameScoreTracker, GameScore } from './GameScoreTracker';

interface ScoreEntryModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (team1Score: number, team2Score: number, gameScores?: GameScore[]) => void;
  team1Players: string[];
  team2Players: string[];
  currentTeam1Score?: number;
  currentTeam2Score?: number;
  currentGameScores?: GameScore[];
  scoringMode: 'points' | 'first_to' | 'total_games';
  pointsPerMatch?: number;
  pointsPerGame?: number;
  gamesToWin?: number;
  totalGames?: number;
  isSaving?: boolean;
}

export function ScoreEntryModal({
  visible,
  onClose,
  onSave,
  team1Players,
  team2Players,
  currentTeam1Score = 0,
  currentTeam2Score = 0,
  currentGameScores,
  scoringMode,
  pointsPerMatch = 21,
  pointsPerGame = 11,
  gamesToWin = 6,
  totalGames = 6,
  isSaving = false,
}: ScoreEntryModalProps) {
  const [team1Score, setTeam1Score] = useState(currentTeam1Score);
  const [team2Score, setTeam2Score] = useState(currentTeam2Score);
  const [gameScores, setGameScores] = useState<GameScore[]>([]);

  const isGameBasedMode = scoringMode === 'first_to' || scoringMode === 'total_games';

  // Initialize game scores for game-based modes
  useEffect(() => {
    if (visible && isGameBasedMode) {
      if (currentGameScores && currentGameScores.length > 0) {
        setGameScores(currentGameScores);
      } else {
        // Initialize games based on mode
        const numGames = scoringMode === 'first_to' ? gamesToWin * 2 - 1 : totalGames;
        const initialGames: GameScore[] = Array.from({ length: numGames }, (_, i) => ({
          gameNumber: i + 1,
          team1Score: 0,
          team2Score: 0,
          completed: false,
        }));
        setGameScores(initialGames);
      }
    } else {
      setTeam1Score(currentTeam1Score);
      setTeam2Score(currentTeam2Score);
    }
  }, [visible, scoringMode, currentGameScores, currentTeam1Score, currentTeam2Score]);

  // Calculate match score from game scores
  useEffect(() => {
    if (isGameBasedMode && gameScores.length > 0) {
      const team1Games = gameScores.filter(
        (g) => g.completed && g.team1Score > g.team2Score
      ).length;
      const team2Games = gameScores.filter(
        (g) => g.completed && g.team2Score > g.team1Score
      ).length;
      setTeam1Score(team1Games);
      setTeam2Score(team2Games);
    }
  }, [gameScores, isGameBasedMode]);

  const handleIncrement = (team: 1 | 2) => {
    if (team === 1) {
      setTeam1Score((prev) => prev + 1);
    } else {
      setTeam2Score((prev) => prev + 1);
    }
  };

  const handleDecrement = (team: 1 | 2) => {
    if (team === 1) {
      setTeam1Score((prev) => Math.max(0, prev - 1));
    } else {
      setTeam2Score((prev) => Math.max(0, prev - 1));
    }
  };

  const handleUpdateGame = (gameNumber: number, team1: number, team2: number) => {
    setGameScores((prev) =>
      prev.map((g) =>
        g.gameNumber === gameNumber ? { ...g, team1Score: team1, team2Score: team2 } : g
      )
    );
  };

  const handleCompleteGame = (gameNumber: number) => {
    setGameScores((prev) =>
      prev.map((g) =>
        g.gameNumber === gameNumber ? { ...g, completed: true } : g
      )
    );
  };

  const handleSave = () => {
    if (isGameBasedMode) {
      onSave(team1Score, team2Score, gameScores);
    } else {
      onSave(team1Score, team2Score);
    }
  };

  const isValid = () => {
    if (scoringMode === 'points') {
      // Points mode: Must sum to pointsPerMatch
      return team1Score + team2Score === pointsPerMatch;
    } else if (scoringMode === 'first_to') {
      // First to X: One team must reach gamesToWin
      return team1Score === gamesToWin || team2Score === gamesToWin;
    } else if (scoringMode === 'total_games') {
      // Total games: Must have played all games
      const completedGames = gameScores.filter((g) => g.completed).length;
      return completedGames === totalGames;
    }
    return false;
  };

  const getValidationMessage = () => {
    if (scoringMode === 'points') {
      const current = team1Score + team2Score;
      const remaining = pointsPerMatch - current;
      if (remaining > 0) {
        return `${remaining} more ${remaining === 1 ? 'point' : 'points'} needed`;
      } else if (remaining < 0) {
        return `${Math.abs(remaining)} ${Math.abs(remaining) === 1 ? 'point' : 'points'} over limit`;
      }
      return 'Ready to save';
    } else if (scoringMode === 'first_to') {
      const maxGames = Math.max(team1Score, team2Score);
      if (maxGames < gamesToWin) {
        return `${gamesToWin - maxGames} more ${gamesToWin - maxGames === 1 ? 'game' : 'games'} needed to win`;
      }
      return 'Match complete';
    } else if (scoringMode === 'total_games') {
      const completedGames = gameScores.filter((g) => g.completed).length;
      const remaining = totalGames - completedGames;
      if (remaining > 0) {
        return `${remaining} more ${remaining === 1 ? 'game' : 'games'} to complete`;
      }
      return 'All games completed';
    }
    return '';
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl max-h-5/6">
          {/* Header */}
          <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-200">
            <Text className="text-lg font-bold text-gray-900">Enter Score</Text>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
              activeOpacity={0.7}
            >
              <X size={18} color="#6B7280" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <ScrollView className="px-6 py-6" showsVerticalScrollIndicator={false}>
            {/* Teams Display */}
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-gray-600 mb-2">Team 1</Text>
                  {team1Players.map((player, i) => (
                    <Text key={i} className="text-base text-gray-900">
                      {player}
                    </Text>
                  ))}
                </View>
                <Text className="text-2xl font-bold text-gray-400 px-4">VS</Text>
                <View className="flex-1 items-end">
                  <Text className="text-sm font-semibold text-gray-600 mb-2">Team 2</Text>
                  {team2Players.map((player, i) => (
                    <Text key={i} className="text-base text-gray-900 text-right">
                      {player}
                    </Text>
                  ))}
                </View>
              </View>
            </View>

            {/* Simple Points Mode */}
            {!isGameBasedMode && (
              <View className="mb-6">
                <View className="flex-row gap-4">
                  {/* Team 1 Score */}
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-gray-600 mb-3">Team 1 Score</Text>
                    <View className="bg-gray-50 rounded-2xl p-4 border-2 border-gray-200">
                      <View className="flex-row items-center justify-between mb-3">
                        <TouchableOpacity
                          onPress={() => handleDecrement(1)}
                          className="w-12 h-12 rounded-xl bg-gray-200 items-center justify-center"
                          activeOpacity={0.7}
                        >
                          <Minus size={20} color="#6B7280" strokeWidth={2.5} />
                        </TouchableOpacity>

                        <TextInput
                          className="text-4xl font-bold text-gray-900 text-center min-w-20"
                          keyboardType="number-pad"
                          value={team1Score.toString()}
                          onChangeText={(text) => {
                            const value = parseInt(text) || 0;
                            setTeam1Score(Math.max(0, value));
                          }}
                          selectTextOnFocus
                        />

                        <TouchableOpacity
                          onPress={() => handleIncrement(1)}
                          className="w-12 h-12 rounded-xl bg-primary-500 items-center justify-center"
                          activeOpacity={0.7}
                        >
                          <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  {/* Team 2 Score */}
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-gray-600 mb-3">Team 2 Score</Text>
                    <View className="bg-gray-50 rounded-2xl p-4 border-2 border-gray-200">
                      <View className="flex-row items-center justify-between mb-3">
                        <TouchableOpacity
                          onPress={() => handleDecrement(2)}
                          className="w-12 h-12 rounded-xl bg-gray-200 items-center justify-center"
                          activeOpacity={0.7}
                        >
                          <Minus size={20} color="#6B7280" strokeWidth={2.5} />
                        </TouchableOpacity>

                        <TextInput
                          className="text-4xl font-bold text-gray-900 text-center min-w-20"
                          keyboardType="number-pad"
                          value={team2Score.toString()}
                          onChangeText={(text) => {
                            const value = parseInt(text) || 0;
                            setTeam2Score(Math.max(0, value));
                          }}
                          selectTextOnFocus
                        />

                        <TouchableOpacity
                          onPress={() => handleIncrement(2)}
                          className="w-12 h-12 rounded-xl bg-primary-500 items-center justify-center"
                          activeOpacity={0.7}
                        >
                          <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Points Summary */}
                <View className="mt-4 bg-blue-50 rounded-xl p-3 border border-blue-200">
                  <Text className="text-sm text-blue-800 text-center">
                    {team1Score + team2Score} / {pointsPerMatch} points entered
                  </Text>
                </View>
              </View>
            )}

            {/* Game-Based Mode */}
            {isGameBasedMode && gameScores.length > 0 && (
              <View className="mb-6">
                <GameScoreTracker
                  games={gameScores}
                  onUpdateGame={handleUpdateGame}
                  onCompleteGame={handleCompleteGame}
                  pointsPerGame={pointsPerGame}
                />
              </View>
            )}

            {/* Validation Message */}
            <View
              className={`rounded-xl p-3 mb-4 ${
                isValid() ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
              }`}
            >
              <View className="flex-row items-center gap-2">
                {isValid() ? (
                  <Check size={16} color="#15803D" strokeWidth={2} />
                ) : (
                  <Trophy size={16} color="#CA8A04" strokeWidth={2} />
                )}
                <Text
                  className={`text-sm font-medium ${
                    isValid() ? 'text-green-800' : 'text-yellow-800'
                  }`}
                >
                  {getValidationMessage()}
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={onClose}
                className="flex-1 bg-gray-100 rounded-xl py-4 items-center"
                activeOpacity={0.7}
              >
                <Text className="text-gray-700 font-bold">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSave}
                disabled={!isValid() || isSaving}
                className={`flex-1 rounded-xl py-4 items-center ${
                  isValid() && !isSaving ? 'bg-primary-500' : 'bg-gray-300'
                }`}
                activeOpacity={0.7}
              >
                {isSaving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-white font-bold">Save Score</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
