import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../config/supabase';
import { useQuery } from '@tanstack/react-query';
import {
  User,
  Camera,
  Edit2,
  Check,
  X,
  Calendar,
  Trophy,
  Clock,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { formatDistance } from 'date-fns';

interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface SessionStats {
  total_sessions: number;
  total_hours: number;
  padel_sessions: number;
  tennis_sessions: number;
  active_sessions: number;
  completed_sessions: number;
  last_30_days: Array<{ date: string; count: number }>;
  avg_players_per_session: number;
  most_common_points: number;
  most_used_court_count: number;
  mexicano_sessions: number;
  americano_sessions: number;
  favorite_sport: 'padel' | 'tennis' | 'equal';
  avg_session_duration: number;
  total_rounds_played: number;
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editingUsername, setEditingUsername] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newUsername, setNewUsername] = useState('');

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    try {
      if (!user) return;

      // Load user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        // Create profile if it doesn't exist
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email || '',
            display_name: user.user_metadata?.full_name || null,
            username: user.email?.split('@')[0] || null,
          })
          .select()
          .single();

        if (createError) throw createError;
        setProfile(newProfile);
        setNewDisplayName(newProfile.display_name || '');
        setNewUsername(newProfile.username || '');
      } else if (profileData) {
        setProfile(profileData);
        setNewDisplayName(profileData.display_name || '');
        setNewUsername(profileData.username || '');
      }

      // Load session statistics
      await loadStats(user.id);
    } catch (error: any) {
      console.error('Error loading profile:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load profile',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadStats = async (userId: string) => {
    try {
      // Load all sessions for the user
      const { data: sessions, error } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      if (!sessions || sessions.length === 0) {
        setStats({
          total_sessions: 0,
          total_hours: 0,
          padel_sessions: 0,
          tennis_sessions: 0,
          active_sessions: 0,
          completed_sessions: 0,
          last_30_days: [],
          avg_players_per_session: 0,
          most_common_points: 0,
          most_used_court_count: 0,
          mexicano_sessions: 0,
          americano_sessions: 0,
          favorite_sport: 'equal',
          avg_session_duration: 0,
          total_rounds_played: 0,
        });
        return;
      }

      // Calculate statistics
      const totalSessions = sessions.length;
      const totalHours = sessions.reduce((sum, s) => sum + (s.duration_hours || 0), 0);
      const padelSessions = sessions.filter((s) => s.sport === 'padel').length;
      const tennisSessions = sessions.filter((s) => s.sport === 'tennis').length;
      const activeSessions = sessions.filter((s) => s.status === 'active').length;
      const completedSessions = sessions.filter((s) => s.status === 'completed').length;

      // Advanced statistics
      const mexicanoSessions = sessions.filter((s) => s.type === 'mexicano').length;
      const americanoSessions = sessions.filter((s) => s.type === 'americano').length;

      // Calculate average players per session
      const totalPlayers = sessions.reduce((sum, s) => sum + (s.player_count || 0), 0);
      const avgPlayersPerSession = totalSessions > 0 ? Math.round(totalPlayers / totalSessions) : 0;

      // Find most common points_per_match
      const pointsCount: { [key: number]: number } = {};
      sessions.forEach((s) => {
        const points = s.points_per_match;
        pointsCount[points] = (pointsCount[points] || 0) + 1;
      });
      const mostCommonPoints =
        Object.keys(pointsCount).length > 0
          ? Number(Object.entries(pointsCount).reduce((a, b) => (b[1] > a[1] ? b : a))[0])
          : 0;

      // Find most used court count
      const courtCount: { [key: number]: number } = {};
      sessions.forEach((s) => {
        const courts = s.courts;
        courtCount[courts] = (courtCount[courts] || 0) + 1;
      });
      const mostUsedCourtCount =
        Object.keys(courtCount).length > 0
          ? Number(Object.entries(courtCount).reduce((a, b) => (b[1] > a[1] ? b : a))[0])
          : 0;

      // Favorite sport
      let favoriteSport: 'padel' | 'tennis' | 'equal' = 'equal';
      if (padelSessions > tennisSessions) favoriteSport = 'padel';
      else if (tennisSessions > padelSessions) favoriteSport = 'tennis';

      // Average session duration
      const avgSessionDuration = totalSessions > 0 ? totalHours / totalSessions : 0;

      // Total rounds played
      const totalRoundsPlayed = sessions.reduce((sum, s) => sum + (s.current_round || 0), 0);

      // Calculate last 30 days distribution
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const last30Days: { [key: string]: number } = {};
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        last30Days[dateStr] = 0;
      }

      sessions.forEach((session) => {
        if (session.game_date) {
          const sessionDate = new Date(session.game_date);
          if (sessionDate >= thirtyDaysAgo) {
            const dateStr = sessionDate.toISOString().split('T')[0];
            if (last30Days[dateStr] !== undefined) {
              last30Days[dateStr]++;
            }
          }
        }
      });

      const last30DaysArray = Object.entries(last30Days)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      setStats({
        total_sessions: totalSessions,
        total_hours: totalHours,
        padel_sessions: padelSessions,
        tennis_sessions: tennisSessions,
        active_sessions: activeSessions,
        completed_sessions: completedSessions,
        last_30_days: last30DaysArray,
        avg_players_per_session: avgPlayersPerSession,
        most_common_points: mostCommonPoints,
        most_used_court_count: mostUsedCourtCount,
        mexicano_sessions: mexicanoSessions,
        americano_sessions: americanoSessions,
        favorite_sport: favoriteSport,
        avg_session_duration: avgSessionDuration,
        total_rounds_played: totalRoundsPlayed,
      });
    } catch (error: any) {
      console.error('Error loading stats:', error);
    }
  };

  const handleAvatarUpload = async () => {
    try {
      if (!profile) return;

      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({
          type: 'error',
          text1: 'Permission Denied',
          text2: 'Camera roll permission is required',
        });
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled) return;

      setUploadingAvatar(true);

      // Compress image to 640x640
      const manipulatedImage = await manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 640, height: 640 } }],
        { compress: 0.85, format: SaveFormat.JPEG }
      );

      // Convert to blob
      const response = await fetch(manipulatedImage.uri);
      const blob = await response.blob();

      // Delete old avatar if exists
      if (profile.avatar_url) {
        const oldPath = profile.avatar_url.split('/').pop();
        if (oldPath) {
          await supabase.storage.from('avatars').remove([`${profile.id}/${oldPath}`]);
        }
      }

      // Upload compressed avatar
      const fileName = `${Date.now()}.jpg`;
      const filePath = `${profile.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, {
          cacheControl: '3600',
          upsert: true,
          contentType: 'image/jpeg',
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, avatar_url: publicUrl });
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Profile picture updated!',
      });
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to upload profile picture',
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const updateDisplayName = async () => {
    if (!profile) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: newDisplayName })
        .eq('id', profile.id);

      if (error) throw error;

      setProfile({ ...profile, display_name: newDisplayName });
      setEditingName(false);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Display name updated',
      });
    } catch (error: any) {
      console.error('Error updating display name:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update display name',
      });
    }
  };

  const updateUsername = async () => {
    if (!profile) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username: newUsername })
        .eq('id', profile.id);

      if (error) throw error;

      setProfile({ ...profile, username: newUsername });
      setEditingUsername(false);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Username updated',
      });
    } catch (error: any) {
      console.error('Error updating username:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update username',
      });
    }
  };

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfile();
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#F43F5E" />
        <Text className="text-gray-600 mt-4">Loading profile...</Text>
      </View>
    );
  }

  if (!profile) {
    return null;
  }

  const joinedDate = formatDistance(new Date(profile.created_at), new Date(), { addSuffix: true });

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 pt-12 pb-4">
        <View className="flex-row justify-between items-center">
          <Text className="text-2xl font-bold text-gray-900">Profile</Text>
          <TouchableOpacity
            onPress={handleSignOut}
            className="bg-red-500 px-4 py-2 rounded-xl"
          >
            <Text className="text-white font-semibold text-sm">Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="p-4 gap-4">
        {/* Profile Card */}
        <View className="bg-white rounded-3xl p-4 shadow-sm">
          <View className="flex-row gap-4">
            {/* Profile Picture */}
            <View className="relative">
              <View className="w-20 h-20 bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl items-center justify-center overflow-hidden">
                {uploadingAvatar ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : profile.avatar_url ? (
                  <View className="w-full h-full">
                    {/* You'll need to add Image component from react-native for this */}
                    <User color="#fff" size={40} />
                  </View>
                ) : (
                  <User color="#fff" size={40} />
                )}
              </View>
              <TouchableOpacity
                onPress={handleAvatarUpload}
                disabled={uploadingAvatar}
                className="absolute bottom-0 right-0 w-7 h-7 bg-white rounded-full items-center justify-center shadow-md"
                style={{ opacity: uploadingAvatar ? 0.5 : 1 }}
              >
                <Camera color="#374151" size={14} />
              </TouchableOpacity>
            </View>

            {/* Profile Info */}
            <View className="flex-1 min-w-0">
              {/* Display Name */}
              {editingName ? (
                <View className="flex-row gap-2 mb-2">
                  <TextInput
                    value={newDisplayName}
                    onChangeText={setNewDisplayName}
                    onSubmitEditing={updateDisplayName}
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 text-sm"
                    placeholder="Enter display name"
                    autoFocus
                  />
                  <TouchableOpacity
                    onPress={updateDisplayName}
                    className="w-8 h-8 bg-green-500 rounded-xl items-center justify-center"
                  >
                    <Check color="#fff" size={16} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setEditingName(false);
                      setNewDisplayName(profile.display_name || '');
                    }}
                    className="w-8 h-8 bg-gray-500 rounded-xl items-center justify-center"
                  >
                    <X color="#fff" size={16} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View className="flex-row items-center gap-2 mb-2">
                  <Text className="text-lg font-bold text-gray-900 flex-1" numberOfLines={1}>
                    {profile.display_name || 'Set your name'}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setEditingName(true)}
                    className="w-6 h-6 bg-gray-100 rounded-lg items-center justify-center"
                  >
                    <Edit2 color="#374151" size={12} />
                  </TouchableOpacity>
                </View>
              )}

              {/* Username */}
              {editingUsername ? (
                <View className="flex-row gap-2 mb-2">
                  <TextInput
                    value={newUsername}
                    onChangeText={setNewUsername}
                    onSubmitEditing={updateUsername}
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 text-sm"
                    placeholder="Enter username"
                    autoFocus
                  />
                  <TouchableOpacity
                    onPress={updateUsername}
                    className="w-8 h-8 bg-green-500 rounded-xl items-center justify-center"
                  >
                    <Check color="#fff" size={16} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setEditingUsername(false);
                      setNewUsername(profile.username || '');
                    }}
                    className="w-8 h-8 bg-gray-500 rounded-xl items-center justify-center"
                  >
                    <X color="#fff" size={16} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View className="flex-row items-center gap-2 mb-2">
                  <Text className="text-sm text-gray-600 flex-1" numberOfLines={1}>
                    @{profile.username || 'username'}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setEditingUsername(true)}
                    className="w-5 h-5 bg-gray-100 rounded-lg items-center justify-center"
                  >
                    <Edit2 color="#374151" size={10} />
                  </TouchableOpacity>
                </View>
              )}

              <Text className="text-xs text-gray-600 mb-1" numberOfLines={1}>
                {profile.email}
              </Text>
              <View className="flex-row items-center gap-2">
                <Calendar color="#6B7280" size={14} />
                <Text className="text-xs text-gray-600">Joined {joinedDate}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Statistics Grid */}
        {stats && (
          <>
            <View className="flex-row gap-3">
              <View className="flex-1 bg-white rounded-2xl p-3 shadow-sm">
                <View className="flex-row items-center gap-2 mb-2">
                  <Trophy color="#F43F5E" size={16} />
                  <Text className="text-xs text-gray-600 font-medium flex-1" numberOfLines={1}>
                    Total Sessions
                  </Text>
                </View>
                <Text className="text-2xl font-bold text-gray-900">{stats.total_sessions}</Text>
              </View>

              <View className="flex-1 bg-white rounded-2xl p-3 shadow-sm">
                <View className="flex-row items-center gap-2 mb-2">
                  <Clock color="#3B82F6" size={16} />
                  <Text className="text-xs text-gray-600 font-medium flex-1" numberOfLines={1}>
                    Total Hours
                  </Text>
                </View>
                <Text className="text-2xl font-bold text-gray-900">{stats.total_hours}</Text>
              </View>
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1 bg-white rounded-2xl p-3 shadow-sm">
                <View className="flex-row items-center gap-2 mb-2">
                  <View className="w-4 h-4 bg-orange-500 rounded-lg" />
                  <Text className="text-xs text-gray-600 font-medium flex-1" numberOfLines={1}>
                    Padel
                  </Text>
                </View>
                <Text className="text-2xl font-bold text-gray-900">{stats.padel_sessions}</Text>
              </View>

              <View className="flex-1 bg-white rounded-2xl p-3 shadow-sm">
                <View className="flex-row items-center gap-2 mb-2">
                  <View className="w-4 h-4 bg-green-500 rounded-full" />
                  <Text className="text-xs text-gray-600 font-medium flex-1" numberOfLines={1}>
                    Tennis
                  </Text>
                </View>
                <Text className="text-2xl font-bold text-gray-900">{stats.tennis_sessions}</Text>
              </View>
            </View>

            {/* Activity Calendar (30-day view) */}
            <View className="bg-white rounded-3xl p-4 shadow-sm">
              <Text className="text-base font-bold text-gray-900 mb-3">Activity Calendar</Text>
              <Text className="text-xs text-gray-600 mb-3">Last 30 days</Text>

              {/* Calendar Grid */}
              <View style={{ gap: 2 }}>
                {/* Day labels */}
                <View style={{ flexDirection: 'row', gap: 2, marginBottom: 4 }}>
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                    <View
                      key={i}
                      style={{
                        flex: 1,
                        aspectRatio: 1,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 10, color: '#9CA3AF', fontWeight: '600' }}>
                        {day}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Calendar Days */}
                {(() => {
                  // Build calendar grid for last 30 days
                  const days: Array<{ date: string; count: number; dayOfMonth: number; monthLabel?: string }> = [];
                  const today = new Date();

                  for (let i = 29; i >= 0; i--) {
                    const date = new Date();
                    date.setDate(today.getDate() - i);
                    const dateStr = date.toISOString().split('T')[0];
                    const dayData = stats.last_30_days.find(d => d.date === dateStr);

                    days.push({
                      date: dateStr,
                      count: dayData?.count || 0,
                      dayOfMonth: date.getDate(),
                      monthLabel: date.getDate() === 1
                        ? date.toLocaleString('default', { month: 'short' })
                        : undefined,
                    });
                  }

                  // Calculate max count for intensity scaling
                  const maxCount = Math.max(...days.map(d => d.count), 1);

                  // Group into weeks (starting from first day)
                  const weeks: typeof days[][] = [];
                  let currentWeek: typeof days[] = [];

                  // Pad beginning with empty cells to align with day of week
                  const firstDayOfWeek = new Date(days[0].date).getDay();
                  const paddingDays = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Monday = 0

                  for (let i = 0; i < paddingDays; i++) {
                    currentWeek.push({ date: '', count: -1, dayOfMonth: 0 });
                  }

                  days.forEach((day, index) => {
                    currentWeek.push(day);
                    if (currentWeek.length === 7) {
                      weeks.push(currentWeek);
                      currentWeek = [];
                    }
                  });

                  // Add remaining days
                  if (currentWeek.length > 0) {
                    while (currentWeek.length < 7) {
                      currentWeek.push({ date: '', count: -1, dayOfMonth: 0 });
                    }
                    weeks.push(currentWeek);
                  }

                  return weeks.map((week, weekIndex) => (
                    <View key={weekIndex} style={{ flexDirection: 'row', gap: 2, marginBottom: 2 }}>
                      {week.map((day, dayIndex) => {
                        if (day.count === -1) {
                          // Empty cell
                          return (
                            <View
                              key={dayIndex}
                              style={{
                                flex: 1,
                                aspectRatio: 1,
                                backgroundColor: 'transparent',
                              }}
                            />
                          );
                        }

                        // Calculate intensity (0-4)
                        const intensity = day.count === 0 ? 0 : Math.ceil((day.count / maxCount) * 4);

                        // Color based on intensity
                        let backgroundColor = '#E5E7EB'; // gray-200
                        let textColor = '#9CA3AF'; // gray-400

                        if (intensity === 1) {
                          backgroundColor = 'rgba(252, 165, 165, 0.6)'; // rose-300
                          textColor = '#BE123C'; // rose-700
                        } else if (intensity === 2) {
                          backgroundColor = 'rgba(251, 113, 133, 0.7)'; // rose-400
                          textColor = '#FFFFFF';
                        } else if (intensity === 3) {
                          backgroundColor = 'rgba(244, 63, 94, 0.8)'; // rose-500
                          textColor = '#FFFFFF';
                        } else if (intensity === 4) {
                          backgroundColor = 'rgba(225, 29, 72, 0.9)'; // rose-600
                          textColor = '#FFFFFF';
                        }

                        return (
                          <TouchableOpacity
                            key={dayIndex}
                            style={{
                              flex: 1,
                              aspectRatio: 1,
                              backgroundColor,
                              borderRadius: 8,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            onPress={() => {
                              Toast.show({
                                type: 'info',
                                text1: day.date,
                                text2: `${day.count} session${day.count !== 1 ? 's' : ''}`,
                              });
                            }}
                          >
                            {day.monthLabel && (
                              <Text style={{
                                position: 'absolute',
                                top: -16,
                                left: 0,
                                fontSize: 9,
                                fontWeight: '700',
                                color: '#6B7280',
                              }}>
                                {day.monthLabel}
                              </Text>
                            )}
                            <Text style={{ fontSize: 10, fontWeight: '600', color: textColor }}>
                              {day.dayOfMonth}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ));
                })()}
              </View>

              {/* Legend */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginTop: 12,
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: 'rgba(229, 231, 235, 0.5)',
              }}>
                <Text style={{ fontSize: 10, color: '#6B7280' }}>Less</Text>
                {[0, 1, 2, 3, 4].map((level) => {
                  let backgroundColor = '#E5E7EB';
                  if (level === 1) backgroundColor = 'rgba(252, 165, 165, 0.6)';
                  else if (level === 2) backgroundColor = 'rgba(251, 113, 133, 0.7)';
                  else if (level === 3) backgroundColor = 'rgba(244, 63, 94, 0.8)';
                  else if (level === 4) backgroundColor = 'rgba(225, 29, 72, 0.9)';

                  return (
                    <View
                      key={level}
                      style={{
                        width: 12,
                        height: 12,
                        backgroundColor,
                        borderRadius: 3,
                      }}
                    />
                  );
                })}
                <Text style={{ fontSize: 10, color: '#6B7280' }}>More</Text>
              </View>
            </View>

            {/* Detailed Statistics */}
            <View className="bg-white rounded-3xl p-4 shadow-sm">
              <Text className="text-base font-bold text-gray-900 mb-3">Detailed Statistics</Text>
              <View className="flex-row flex-wrap gap-2">
                <View className="bg-gray-50 rounded-xl p-3 w-[48%]">
                  <Text className="text-xs text-gray-600 font-medium mb-1">Avg Players</Text>
                  <Text className="text-xl font-bold text-gray-900">
                    {stats.avg_players_per_session}
                  </Text>
                </View>

                <View className="bg-gray-50 rounded-xl p-3 w-[48%]">
                  <Text className="text-xs text-gray-600 font-medium mb-1">Common Points</Text>
                  <Text className="text-xl font-bold text-gray-900">{stats.most_common_points}</Text>
                </View>

                <View className="bg-gray-50 rounded-xl p-3 w-[48%]">
                  <Text className="text-xs text-gray-600 font-medium mb-1">Usual Courts</Text>
                  <Text className="text-xl font-bold text-gray-900">
                    {stats.most_used_court_count}
                  </Text>
                </View>

                <View className="bg-gray-50 rounded-xl p-3 w-[48%]">
                  <Text className="text-xs text-gray-600 font-medium mb-1">Mexicano</Text>
                  <Text className="text-xl font-bold text-gray-900">{stats.mexicano_sessions}</Text>
                </View>

                <View className="bg-gray-50 rounded-xl p-3 w-[48%]">
                  <Text className="text-xs text-gray-600 font-medium mb-1">Americano</Text>
                  <Text className="text-xl font-bold text-gray-900">{stats.americano_sessions}</Text>
                </View>

                <View className="bg-gray-50 rounded-xl p-3 w-[48%]">
                  <Text className="text-xs text-gray-600 font-medium mb-1">Total Rounds</Text>
                  <Text className="text-xl font-bold text-gray-900">
                    {stats.total_rounds_played}
                  </Text>
                </View>

                <View className="bg-gray-50 rounded-xl p-3 w-[48%]">
                  <Text className="text-xs text-gray-600 font-medium mb-1">Fav Sport</Text>
                  <Text className="text-xl font-bold text-gray-900">
                    {stats.favorite_sport === 'padel'
                      ? '🏓 Padel'
                      : stats.favorite_sport === 'tennis'
                      ? '🎾 Tennis'
                      : '⚖️ Equal'}
                  </Text>
                </View>

                <View className="bg-gray-50 rounded-xl p-3 w-[48%]">
                  <Text className="text-xs text-gray-600 font-medium mb-1">Avg Duration</Text>
                  <Text className="text-xl font-bold text-gray-900">
                    {stats.avg_session_duration.toFixed(1)}h
                  </Text>
                </View>

                <View className="bg-gray-50 rounded-xl p-3 w-[48%]">
                  <Text className="text-xs text-gray-600 font-medium mb-1">Fav Mode</Text>
                  <Text className="text-xl font-bold text-gray-900">
                    {stats.mexicano_sessions > stats.americano_sessions
                      ? 'Mexicano'
                      : stats.americano_sessions > stats.mexicano_sessions
                      ? 'Americano'
                      : 'Equal'}
                  </Text>
                </View>
              </View>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}
