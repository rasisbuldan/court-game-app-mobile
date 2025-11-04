/**
 * Public Leaderboard Component
 *
 * Read-only leaderboard for shared sessions accessible via share link.
 * Displays player rankings, stats, and match history without authentication.
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Trophy, TrendingUp, TrendingDown, Award, Users, Calendar } from 'lucide-react-native';
import type { SharedSession } from '../../hooks/useSessionSharing';

interface PublicLeaderboardProps {
  session: SharedSession;
  isLoading?: boolean;
}

type SortOption = 'rating' | 'wins' | 'points' | 'win_rate';

export function PublicLeaderboard({ session, isLoading }: PublicLeaderboardProps) {
  const [sortBy, setSortBy] = useState<SortOption>('rating');

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center py-20">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-gray-600 mt-4">Loading results...</Text>
      </View>
    );
  }

  if (!session || !session.players || session.players.length === 0) {
    return (
      <View className="flex-1 items-center justify-center py-20">
        <Trophy size={48} color="#9CA3AF" strokeWidth={1.5} />
        <Text className="text-gray-500 mt-4 text-lg">No results available yet</Text>
      </View>
    );
  }

  // Calculate win rate for each player
  const playersWithWinRate = session.players.map((player) => {
    const totalMatches = player.matches_won + player.matches_lost;
    const winRate = totalMatches > 0 ? (player.matches_won / totalMatches) * 100 : 0;
    return { ...player, winRate, totalMatches };
  });

  // Sort players based on selected option
  const sortedPlayers = [...playersWithWinRate].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return b.rating - a.rating;
      case 'wins':
        return b.matches_won - a.matches_won;
      case 'points':
        return b.points_won - a.points_won;
      case 'win_rate':
        return b.winRate - a.winRate;
      default:
        return b.rating - a.rating;
    }
  });

  // Get top 3 for podium display
  const topThree = sortedPlayers.slice(0, 3);

  // Session info header
  const sessionDate = new Date(session.date).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
      {/* Session Header */}
      <View className="bg-white border-b border-gray-200 px-6 py-6">
        <Text className="text-2xl font-bold text-gray-900 mb-2">{session.session_name}</Text>

        <View className="flex-row items-center gap-4">
          <View className="flex-row items-center gap-2">
            <Calendar size={16} color="#6B7280" strokeWidth={2} />
            <Text className="text-gray-600">{sessionDate}</Text>
          </View>

          {session.location && (
            <View className="flex-row items-center gap-2">
              <Users size={16} color="#6B7280" strokeWidth={2} />
              <Text className="text-gray-600">{session.location}</Text>
            </View>
          )}
        </View>

        {/* Status Badge */}
        <View className="mt-3">
          <View
            className={`self-start px-3 py-1.5 rounded-full ${
              session.status === 'completed'
                ? 'bg-green-100'
                : session.status === 'in_progress'
                  ? 'bg-blue-100'
                  : 'bg-gray-100'
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                session.status === 'completed'
                  ? 'text-green-700'
                  : session.status === 'in_progress'
                    ? 'text-blue-700'
                    : 'text-gray-700'
              }`}
            >
              {session.status === 'completed'
                ? 'Completed'
                : session.status === 'in_progress'
                  ? 'In Progress'
                  : 'Cancelled'}
            </Text>
          </View>
        </View>
      </View>

      {/* Podium (Top 3) */}
      {topThree.length >= 3 && (
        <View className="bg-gradient-to-b from-primary-50 to-white px-6 py-8">
          <View className="flex-row items-end justify-center gap-4">
            {/* 2nd Place */}
            <View className="flex-1 items-center">
              <View className="w-14 h-14 rounded-full bg-gray-300 items-center justify-center mb-2">
                <Text className="text-2xl font-bold text-gray-700">2</Text>
              </View>
              <Text className="text-sm font-bold text-gray-900 text-center" numberOfLines={1}>
                {topThree[1].player_name}
              </Text>
              <Text className="text-xs text-gray-600 mt-1">{topThree[1].rating.toFixed(0)}</Text>
            </View>

            {/* 1st Place */}
            <View className="flex-1 items-center -mt-4">
              <View className="w-16 h-16 rounded-full bg-yellow-400 items-center justify-center mb-2 shadow-lg">
                <Trophy size={28} color="#F59E0B" strokeWidth={2.5} />
              </View>
              <Text className="text-base font-bold text-gray-900 text-center" numberOfLines={1}>
                {topThree[0].player_name}
              </Text>
              <Text className="text-sm font-bold text-primary-600 mt-1">
                {topThree[0].rating.toFixed(0)}
              </Text>
            </View>

            {/* 3rd Place */}
            <View className="flex-1 items-center">
              <View className="w-14 h-14 rounded-full bg-orange-300 items-center justify-center mb-2">
                <Text className="text-2xl font-bold text-orange-700">3</Text>
              </View>
              <Text className="text-sm font-bold text-gray-900 text-center" numberOfLines={1}>
                {topThree[2].player_name}
              </Text>
              <Text className="text-xs text-gray-600 mt-1">{topThree[2].rating.toFixed(0)}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Sort Options */}
      <View className="bg-white border-b border-gray-200 px-6 py-4">
        <Text className="text-sm font-semibold text-gray-700 mb-3">Sort by</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
          <TouchableOpacity
            onPress={() => setSortBy('rating')}
            className={`px-4 py-2 rounded-full ${
              sortBy === 'rating' ? 'bg-primary-500' : 'bg-gray-100'
            }`}
            activeOpacity={0.7}
          >
            <Text
              className={`font-semibold ${sortBy === 'rating' ? 'text-white' : 'text-gray-700'}`}
            >
              Rating
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSortBy('wins')}
            className={`px-4 py-2 rounded-full ${
              sortBy === 'wins' ? 'bg-primary-500' : 'bg-gray-100'
            }`}
            activeOpacity={0.7}
          >
            <Text className={`font-semibold ${sortBy === 'wins' ? 'text-white' : 'text-gray-700'}`}>
              Wins
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSortBy('points')}
            className={`px-4 py-2 rounded-full ${
              sortBy === 'points' ? 'bg-primary-500' : 'bg-gray-100'
            }`}
            activeOpacity={0.7}
          >
            <Text
              className={`font-semibold ${sortBy === 'points' ? 'text-white' : 'text-gray-700'}`}
            >
              Points
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSortBy('win_rate')}
            className={`px-4 py-2 rounded-full ${
              sortBy === 'win_rate' ? 'bg-primary-500' : 'bg-gray-100'
            }`}
            activeOpacity={0.7}
          >
            <Text
              className={`font-semibold ${sortBy === 'win_rate' ? 'text-white' : 'text-gray-700'}`}
            >
              Win Rate
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Leaderboard List */}
      <View className="px-6 py-4">
        {sortedPlayers.map((player, index) => {
          const isTop3 = index < 3;
          const pointsDiff = player.points_won - player.points_lost;

          return (
            <View
              key={player.id}
              className={`bg-white rounded-2xl p-4 mb-3 ${
                isTop3 ? 'border-2 border-primary-200' : 'border border-gray-200'
              }`}
            >
              {/* Rank & Name */}
              <View className="flex-row items-center mb-3">
                <View
                  className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${
                    index === 0
                      ? 'bg-yellow-100'
                      : index === 1
                        ? 'bg-gray-100'
                        : index === 2
                          ? 'bg-orange-100'
                          : 'bg-gray-50'
                  }`}
                >
                  <Text
                    className={`font-bold text-sm ${
                      index === 0
                        ? 'text-yellow-700'
                        : index === 1
                          ? 'text-gray-700'
                          : index === 2
                            ? 'text-orange-700'
                            : 'text-gray-500'
                    }`}
                  >
                    {index + 1}
                  </Text>
                </View>

                <Text className="flex-1 text-lg font-bold text-gray-900">
                  {player.player_name}
                </Text>

                {isTop3 && (
                  <View className="bg-primary-100 px-3 py-1 rounded-full">
                    <Text className="text-primary-700 font-bold text-sm">
                      Top {index + 1}
                    </Text>
                  </View>
                )}
              </View>

              {/* Stats Grid */}
              <View className="flex-row gap-3">
                {/* Rating */}
                <View className="flex-1 bg-gray-50 rounded-xl p-3">
                  <View className="flex-row items-center gap-1 mb-1">
                    <Award size={14} color="#6B7280" strokeWidth={2} />
                    <Text className="text-xs font-semibold text-gray-600">Rating</Text>
                  </View>
                  <Text className="text-xl font-bold text-gray-900">
                    {player.rating.toFixed(0)}
                  </Text>
                </View>

                {/* Wins/Losses */}
                <View className="flex-1 bg-gray-50 rounded-xl p-3">
                  <View className="flex-row items-center gap-1 mb-1">
                    <Trophy size={14} color="#6B7280" strokeWidth={2} />
                    <Text className="text-xs font-semibold text-gray-600">W/L</Text>
                  </View>
                  <Text className="text-xl font-bold text-gray-900">
                    {player.matches_won}/{player.matches_lost}
                  </Text>
                </View>

                {/* Win Rate */}
                <View className="flex-1 bg-gray-50 rounded-xl p-3">
                  <Text className="text-xs font-semibold text-gray-600 mb-1">Win%</Text>
                  <Text className="text-xl font-bold text-gray-900">
                    {player.winRate.toFixed(0)}%
                  </Text>
                </View>
              </View>

              {/* Points Diff */}
              <View className="mt-3 flex-row items-center justify-between">
                <Text className="text-sm text-gray-600">Points Differential</Text>
                <View className="flex-row items-center gap-1">
                  {pointsDiff > 0 ? (
                    <TrendingUp size={16} color="#10B981" strokeWidth={2} />
                  ) : pointsDiff < 0 ? (
                    <TrendingDown size={16} color="#EF4444" strokeWidth={2} />
                  ) : null}
                  <Text
                    className={`text-sm font-bold ${
                      pointsDiff > 0
                        ? 'text-green-600'
                        : pointsDiff < 0
                          ? 'text-red-600'
                          : 'text-gray-600'
                    }`}
                  >
                    {pointsDiff > 0 ? '+' : ''}
                    {pointsDiff}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>

      {/* Footer Info */}
      <View className="px-6 py-8 items-center">
        <Text className="text-gray-500 text-sm text-center">
          This is a shared view of the session results
        </Text>
        <Text className="text-gray-400 text-xs text-center mt-2">
          Powered by Courtster
        </Text>
      </View>
    </ScrollView>
  );
}
