/**
 * Match Score Input Component
 *
 * Wrapper component that handles score entry based on user preference:
 * - Inline mode: Shows textbox inputs directly in match card
 * - Modal mode: Shows button that opens full-screen ScoreEntryModal
 *
 * Abstracts the complexity away from RoundsTab.
 */

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Edit3, CheckCircle2 } from 'lucide-react-native';
import { ScoreEntryModal } from './ScoreEntryModal';
import { GameScore } from './GameScoreTracker';
import { useScoreEntryPreference } from '../../hooks/useScoreEntryPreference';

interface MatchScoreInputProps {
  matchIndex: number;
  team1Players: string[];
  team2Players: string[];
  team1Score?: number;
  team2Score?: number;
  gameScores?: GameScore[];
  scoringMode: 'points' | 'first_to' | 'total_games';
  pointsPerMatch?: number;
  pointsPerGame?: number;
  gamesToWin?: number;
  totalGames?: number;
  onScoreChange: (matchIndex: number, team1Score: number, team2Score: number, gameScores?: GameScore[]) => void;
  isSaving?: boolean;
  isSaved?: boolean;
  localTeam1Score?: string;
  localTeam2Score?: string;
  onLocalScoreChange?: (team: 1 | 2, value: string) => void;
  compactMode?: boolean;
}

export function MatchScoreInput({
  matchIndex,
  team1Players,
  team2Players,
  team1Score,
  team2Score,
  gameScores,
  scoringMode,
  pointsPerMatch = 21,
  pointsPerGame = 11,
  gamesToWin = 6,
  totalGames = 6,
  onScoreChange,
  isSaving,
  isSaved,
  localTeam1Score,
  localTeam2Score,
  onLocalScoreChange,
  compactMode = false,
}: MatchScoreInputProps) {
  const { scoreEntryMode } = useScoreEntryPreference();
  const [modalVisible, setModalVisible] = useState(false);

  const handleModalSave = (team1: number, team2: number, games?: GameScore[]) => {
    onScoreChange(matchIndex, team1, team2, games);
    setModalVisible(false);
  };

  // Modal Mode: Show button to open modal
  if (scoreEntryMode === 'modal') {
    const hasScore = team1Score !== undefined && team2Score !== undefined;

    return (
      <>
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          disabled={isSaving}
          className={`rounded-xl p-4 border-2 ${
            hasScore
              ? 'bg-green-50 border-green-300'
              : 'bg-gray-50 border-gray-200'
          }`}
          activeOpacity={0.7}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              {hasScore ? (
                <View className="flex-row items-center gap-3">
                  <View>
                    <Text className="text-xs text-gray-600 mb-1">Score</Text>
                    <Text className="text-2xl font-bold text-gray-900">
                      {team1Score} - {team2Score}
                    </Text>
                  </View>
                  {isSaved && (
                    <CheckCircle2 size={20} color="#10B981" fill="#10B981" />
                  )}
                </View>
              ) : (
                <View className="flex-row items-center gap-2">
                  <Edit3 size={16} color="#6B7280" strokeWidth={2} />
                  <Text className="text-sm font-semibold text-gray-600">
                    Tap to enter score
                  </Text>
                </View>
              )}
            </View>

            {isSaving && <ActivityIndicator size="small" color="#3B82F6" />}
          </View>
        </TouchableOpacity>

        <ScoreEntryModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onSave={handleModalSave}
          team1Players={team1Players}
          team2Players={team2Players}
          currentTeam1Score={team1Score}
          currentTeam2Score={team2Score}
          currentGameScores={gameScores}
          scoringMode={scoringMode}
          pointsPerMatch={pointsPerMatch}
          pointsPerGame={pointsPerGame}
          gamesToWin={gamesToWin}
          totalGames={totalGames}
          isSaving={isSaving}
        />
      </>
    );
  }

  // Inline Mode: Show traditional textbox inputs
  return (
    <View className={`flex-row items-center ${compactMode ? 'gap-2' : 'gap-3'}`}>
      {/* Team 1 Score Input */}
      <View className="flex-1">
        <TextInput
          style={{
            height: compactMode ? 40 : 56,
            backgroundColor: '#FFFFFF',
            borderWidth: 2,
            borderColor: isSaved && !localTeam1Score ? '#10B981' : '#E5E7EB',
            borderRadius: compactMode ? 12 : 16,
            textAlign: 'center',
            fontFamily: 'Inter',
            fontSize: compactMode ? 18 : 24,
            fontWeight: '700',
            color: '#111827',
          }}
          keyboardType="numeric"
          value={localTeam1Score ?? team1Score?.toString() ?? ''}
          onChangeText={(value) => onLocalScoreChange?.(1, value)}
          placeholder="-"
          placeholderTextColor="#D1D5DB"
          editable={!isSaving}
        />
      </View>

      {/* Separator */}
      <Text className={`font-bold text-gray-400 ${compactMode ? 'text-base' : 'text-xl'}`}>
        :
      </Text>

      {/* Team 2 Score Input */}
      <View className="flex-1">
        <TextInput
          style={{
            height: compactMode ? 40 : 56,
            backgroundColor: '#FFFFFF',
            borderWidth: 2,
            borderColor: isSaved && !localTeam2Score ? '#10B981' : '#E5E7EB',
            borderRadius: compactMode ? 12 : 16,
            textAlign: 'center',
            fontFamily: 'Inter',
            fontSize: compactMode ? 18 : 24,
            fontWeight: '700',
            color: '#111827',
          }}
          keyboardType="numeric"
          value={localTeam2Score ?? team2Score?.toString() ?? ''}
          onChangeText={(value) => onLocalScoreChange?.(2, value)}
          placeholder="-"
          placeholderTextColor="#D1D5DB"
          editable={!isSaving}
        />
      </View>

      {/* Save Indicator */}
      {isSaving && <ActivityIndicator size="small" color="#3B82F6" />}
      {isSaved && !isSaving && (
        <CheckCircle2 size={compactMode ? 16 : 20} color="#10B981" fill="#10B981" />
      )}
    </View>
  );
}
