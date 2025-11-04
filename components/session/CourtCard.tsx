/**
 * Court Card Component
 *
 * Single-column card for displaying a court's matches in parallel mode.
 * Shows court number, round navigation, match details, and sitting players.
 *
 * Features:
 * - Court header with number
 * - Round navigation (← Round X of Y →)
 * - Match display with score entry
 * - Sitting players list
 * - Full-width mobile-optimized layout
 */

import React from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { ChevronLeft, ChevronRight, Users } from 'lucide-react-native';
import { CourtAssignment, Match, Player } from '@courtster/shared';

interface CourtCardProps {
  courtNumber: number;
  courtAssignment: CourtAssignment;
  match?: Match; // Current match for this court
  currentRound: number;
  totalRounds: number;
  sittingPlayers: Player[];
  onRoundChange: (courtNumber: number, direction: 'next' | 'prev') => void;
  onScoreChange?: (courtNumber: number, team1Score: string, team2Score: string) => void;
  onScoreBlur?: (courtNumber: number) => void;
  localScores?: { team1?: string; team2?: string };
  isSaving?: boolean;
}

export function CourtCard({
  courtNumber,
  courtAssignment,
  match,
  currentRound,
  totalRounds,
  sittingPlayers,
  onRoundChange,
  onScoreChange,
  onScoreBlur,
  localScores,
  isSaving = false
}: CourtCardProps) {
  const canGoPrev = currentRound > 1;
  const canGoNext = currentRound < totalRounds;

  return (
    <View className="bg-white rounded-2xl border-2 border-gray-200 p-4 mb-4">
      {/* Court Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View>
          <Text className="text-xl font-bold text-primary-600">Court {courtNumber}</Text>
          <View className="flex-row items-center gap-1 mt-1">
            <Users size={14} color="#6B7280" strokeWidth={2} />
            <Text className="text-xs text-gray-600">
              {courtAssignment.players.length} players • Avg {courtAssignment.averageRating.toFixed(1)}
            </Text>
          </View>
        </View>
      </View>

      {/* Round Navigation */}
      <View className="flex-row items-center justify-between mb-4 bg-gray-50 rounded-xl p-3">
        <TouchableOpacity
          onPress={() => onRoundChange(courtNumber, 'prev')}
          disabled={!canGoPrev}
          className={`w-10 h-10 rounded-lg items-center justify-center ${
            canGoPrev ? 'bg-gray-200' : 'bg-gray-100'
          }`}
          activeOpacity={0.7}
        >
          <ChevronLeft
            size={20}
            color={canGoPrev ? '#374151' : '#D1D5DB'}
            strokeWidth={2.5}
          />
        </TouchableOpacity>

        <Text className="text-base font-bold text-gray-900">
          Round {currentRound} of {totalRounds}
        </Text>

        <TouchableOpacity
          onPress={() => onRoundChange(courtNumber, 'next')}
          disabled={!canGoNext}
          className={`w-10 h-10 rounded-lg items-center justify-center ${
            canGoNext ? 'bg-gray-200' : 'bg-gray-100'
          }`}
          activeOpacity={0.7}
        >
          <ChevronRight
            size={20}
            color={canGoNext ? '#374151' : '#D1D5DB'}
            strokeWidth={2.5}
          />
        </TouchableOpacity>
      </View>

      {/* Match Display */}
      {match ? (
        <View className="mb-4">
          {/* Team 1 */}
          <View className="mb-3">
            <Text className="text-xs font-semibold text-gray-600 mb-2">Team 1</Text>
            <View className="bg-gray-50 rounded-xl p-3">
              <Text className="text-base font-semibold text-gray-900">
                {match.team1[0]?.name || 'Player 1'}
              </Text>
              <Text className="text-base font-semibold text-gray-900">
                {match.team1[1]?.name || 'Player 2'}
              </Text>
            </View>
          </View>

          {/* VS Separator with Scores */}
          <View className="flex-row items-center justify-center gap-3 mb-3">
            <View className="flex-1">
              <TextInput
                className="text-3xl font-bold text-center bg-gray-50 rounded-xl py-3 border-2 border-gray-200"
                keyboardType="numeric"
                value={localScores?.team1 ?? match.team1Score?.toString() ?? ''}
                onChangeText={(text) => onScoreChange?.(courtNumber, text, localScores?.team2 ?? match.team2Score?.toString() ?? '')}
                onBlur={() => onScoreBlur?.(courtNumber)}
                placeholder="0"
                placeholderTextColor="#D1D5DB"
                editable={!isSaving}
                maxLength={2}
              />
            </View>

            <Text className="text-2xl font-bold text-gray-400">VS</Text>

            <View className="flex-1">
              <TextInput
                className="text-3xl font-bold text-center bg-gray-50 rounded-xl py-3 border-2 border-gray-200"
                keyboardType="numeric"
                value={localScores?.team2 ?? match.team2Score?.toString() ?? ''}
                onChangeText={(text) => onScoreChange?.(courtNumber, localScores?.team1 ?? match.team1Score?.toString() ?? '', text)}
                onBlur={() => onScoreBlur?.(courtNumber)}
                placeholder="0"
                placeholderTextColor="#D1D5DB"
                editable={!isSaving}
                maxLength={2}
              />
            </View>
          </View>

          {/* Team 2 */}
          <View>
            <Text className="text-xs font-semibold text-gray-600 mb-2">Team 2</Text>
            <View className="bg-gray-50 rounded-xl p-3">
              <Text className="text-base font-semibold text-gray-900">
                {match.team2[0]?.name || 'Player 3'}
              </Text>
              <Text className="text-base font-semibold text-gray-900">
                {match.team2[1]?.name || 'Player 4'}
              </Text>
            </View>
          </View>
        </View>
      ) : (
        <View className="bg-gray-50 rounded-xl p-4 mb-4">
          <Text className="text-center text-gray-500">No match for this round</Text>
        </View>
      )}

      {/* Sitting Players */}
      {sittingPlayers.length > 0 && (
        <View className="bg-yellow-50 rounded-xl p-3 border border-yellow-200">
          <Text className="text-xs font-semibold text-yellow-800 mb-2">
            Sitting This Round
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {sittingPlayers.map((player, idx) => (
              <View
                key={player.id}
                className="bg-yellow-100 px-2 py-1 rounded-lg"
              >
                <Text className="text-xs font-medium text-yellow-900">
                  {player.name}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
