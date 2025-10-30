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
  Image,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, Link } from 'expo-router';
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
  Users,
  Plus,
  ChevronRight,
  MoreVertical,
  LogOut,
  Circle,
  Target,
} from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { formatDistance } from 'date-fns';
import { useClubs, useOwnedClubs } from '../../hooks/useClubs';
import { useClubMemberCount } from '../../hooks/useClubMembers';
import ClubCard from '../../components/clubs/ClubCard';

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
  const router = useRouter();
  const { user, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editingUsername, setEditingUsername] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [showMenu, setShowMenu] = useState(false);

  // Fetch user's clubs
  const { data: clubs, isLoading: clubsLoading } = useClubs(user?.id);
  const { data: ownedClubs } = useOwnedClubs(user?.id);

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    try {
      console.log('Loading profile for user:', user?.id);
      if (!user) {
        console.log('No user found, returning');
        return;
      }

      // Load user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      console.log('Profile data:', profileData);
      console.log('Profile error:', profileError);

      if (profileError && profileError.code === 'PGRST116') {
        // Profile doesn't exist, create it
        console.log('Profile not found, creating new profile');
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

        console.log('New profile created:', newProfile);
        console.log('Create error:', createError);

        if (createError) throw createError;
        setProfile(newProfile);
        setNewDisplayName(newProfile.display_name || '');
        setNewUsername(newProfile.username || '');
      } else if (profileError) {
        // Some other error occurred
        throw profileError;
      } else if (profileData) {
        // Profile exists, use it
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
    <View className="flex-1 bg-gray-50">
      {/* Glassmorphic Background Blobs */}
      <View className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Top left - Light rose */}
        <View
          className="absolute rounded-full"
          style={{
            width: 420,
            height: 420,
            top: -180,
            left: -160,
            backgroundColor: '#FCE7F3',
            opacity: 0.4,
          }}
        />

        {/* Top right - Pink */}
        <View
          className="absolute rounded-full"
          style={{
            width: 360,
            height: 360,
            top: 40,
            right: -140,
            backgroundColor: '#FBCFE8',
            opacity: 0.35,
          }}
        />

        {/* Middle - Light red */}
        <View
          className="absolute rounded-full"
          style={{
            width: 340,
            height: 340,
            top: 380,
            left: 80,
            backgroundColor: '#FEE2E2',
            opacity: 0.3,
          }}
        />

        {/* Bottom left - Rose */}
        <View
          className="absolute rounded-full"
          style={{
            width: 400,
            height: 400,
            bottom: -80,
            left: 120,
            backgroundColor: '#FBCFE8',
            opacity: 0.2,
          }}
        />

        {/* Bottom right - Light lavender */}
        <View
          className="absolute rounded-full"
          style={{
            width: 260,
            height: 260,
            bottom: 100,
            right: -80,
            backgroundColor: '#E9D5FF',
            opacity: 0.25,
          }}
        />
      </View>

      {/* Fixed Header */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          paddingTop: insets.top,
        }}
      >
        {Platform.OS === 'ios' ? (
          <>
            <BlurView
              intensity={80}
              tint="light"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            />
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
              }}
            />
          </>
        ) : (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: '#FFFFFF',
            }}
          />
        )}

        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(0, 0, 0, 0.05)',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text style={{ fontSize: 24, fontWeight: '700', color: '#111827' }}>
            Profile
          </Text>
          <TouchableOpacity
            onPress={() => setShowMenu(true)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: '#F3F4F6',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MoreVertical color="#374151" size={20} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Menu Modal */}
      {showMenu && (
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            zIndex: 200,
          }}
        >
          <View
            style={{
              position: 'absolute',
              top: insets.top + 64,
              right: 16,
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              paddingVertical: 8,
              minWidth: 220,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 16,
              elevation: 8,
            }}
          >
            {/* Create Club Option */}
            {ownedClubs && ownedClubs.length < 3 && (
              <TouchableOpacity
                onPress={() => {
                  setShowMenu(false);
                  router.push('/(tabs)/create-club');
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                }}
              >
                <Plus color="#EF4444" size={20} />
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827', flex: 1 }}>
                  Create Club
                </Text>
              </TouchableOpacity>
            )}

            {/* Divider */}
            <View style={{ height: 1, backgroundColor: '#F3F4F6', marginVertical: 4 }} />

            {/* Sign Out Option */}
            <TouchableOpacity
              onPress={() => {
                setShowMenu(false);
                Alert.alert(
                  'Sign Out',
                  'Are you sure you want to sign out?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Sign Out',
                      style: 'destructive',
                      onPress: async () => {
                        await signOut();
                        router.replace('/(auth)/login');
                      },
                    },
                  ]
                );
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
              }}
            >
              <LogOut color="#EF4444" size={20} />
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#EF4444', flex: 1 }}>
                Sign Out
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}

      <ScrollView
        style={{ flex: 1, paddingTop: insets.top + 64 }}
        contentContainerStyle={{
          paddingBottom: Platform.OS === 'ios' ? 100 : insets.bottom + 120,
          paddingHorizontal: 16,
          paddingTop: 16
        }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={{ gap: 16 }}>
        {/* Profile Card */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 24,
            padding: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 12,
            elevation: 3,
            position: 'relative',
          }}
        >
          {/* Edit Profile Icon Button - Top Right */}
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/edit-profile')}
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              width: 40,
              height: 40,
              backgroundColor: '#FEE2E2',
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
            }}
          >
            <Edit2 color="#EF4444" size={20} />
          </TouchableOpacity>

          <View className="flex-row gap-4">
            {/* Profile Picture */}
            <View className="relative">
              <View style={{ width: 88, height: 88, borderRadius: 22, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: profile.avatar_url ? '#E5E7EB' : '#EF4444' }}>
                {uploadingAvatar ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : profile.avatar_url ? (
                  <Image
                    source={{ uri: profile.avatar_url }}
                    style={{ width: 88, height: 88 }}
                    resizeMode="cover"
                  />
                ) : (
                  <User color="#fff" size={44} />
                )}
              </View>
              <TouchableOpacity
                onPress={handleAvatarUpload}
                disabled={uploadingAvatar}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: 32,
                  height: 32,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                  opacity: uploadingAvatar ? 0.5 : 1,
                  borderWidth: 2,
                  borderColor: '#FFFFFF',
                }}
              >
                <Camera color="#6B7280" size={16} />
              </TouchableOpacity>
            </View>

            {/* Profile Info */}
            <View className="flex-1 min-w-0 justify-center" style={{ paddingRight: 44 }}>
              {/* Display Name */}
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 6, lineHeight: 24 }} numberOfLines={1}>
                {profile.display_name || 'Set your name'}
              </Text>

              {/* Username */}
              <Text style={{ fontSize: 15, fontWeight: '500', color: '#6B7280', marginBottom: 10 }} numberOfLines={1}>
                @{profile.username || 'username'}
              </Text>

              {/* Email */}
              <Text style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 8 }} numberOfLines={1}>
                {profile.email}
              </Text>

              {/* Joined Date */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Calendar color="#9CA3AF" size={14} />
                <Text style={{ fontSize: 13, color: '#9CA3AF' }}>Joined {joinedDate}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Clubs Section - Loading Skeleton */}
        {clubsLoading && (
          <>
            {/* Section Label */}
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.5, textTransform: 'uppercase', paddingHorizontal: 4 }}>
              Club
            </Text>

            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                padding: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: '#E5E7EB',
                  }}
                />
                <View style={{ flex: 1 }}>
                  <View style={{ width: '60%', height: 16, backgroundColor: '#E5E7EB', borderRadius: 4, marginBottom: 6 }} />
                  <View style={{ width: '80%', height: 13, backgroundColor: '#F3F4F6', borderRadius: 4 }} />
                </View>
              </View>
            </View>
          </>
        )}

        {/* My Clubs Section */}
        {!clubsLoading && clubs && clubs.length > 0 && (
          <>
            {/* Section Label */}
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.5, textTransform: 'uppercase', paddingHorizontal: 4 }}>
              Club
            </Text>

            <View>
              {clubs.map((club, index) => (
                <View key={club.id} style={{ marginBottom: index < clubs.length - 1 ? 12 : 0 }}>
                  <TouchableOpacity
                    onPress={() => router.push(`/(tabs)/club-detail?id=${club.id}`)}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: 16,
                      padding: 16,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 8,
                      elevation: 2,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      {/* Club Logo */}
                      <View
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 24,
                          backgroundColor: club.logo_url ? '#E5E7EB' : '#F43F5E',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                        }}
                      >
                        {club.logo_url ? (
                          <Image
                            source={{ uri: club.logo_url }}
                            style={{ width: 48, height: 48 }}
                            resizeMode="cover"
                          />
                        ) : (
                          <Text style={{ fontSize: 20, fontWeight: '700', color: '#FFFFFF' }}>
                            {club.name.charAt(0).toUpperCase()}
                          </Text>
                        )}
                      </View>

                      {/* Club Info */}
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 }}>
                          {club.name}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          {/* Role Badge */}
                          <View
                            style={{
                              paddingHorizontal: 8,
                              paddingVertical: 3,
                              borderRadius: 10,
                              backgroundColor:
                                club.userRole === 'owner'
                                  ? '#D1FAE5'
                                  : club.userRole === 'admin'
                                  ? '#DBEAFE'
                                  : '#F3F4F6',
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 11,
                                fontWeight: '600',
                                color:
                                  club.userRole === 'owner'
                                    ? '#059669'
                                    : club.userRole === 'admin'
                                    ? '#3B82F6'
                                    : '#6B7280',
                              }}
                            >
                              {club.userRole === 'owner' ? 'Owner' : club.userRole === 'admin' ? 'Admin' : 'Member'}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Arrow */}
                      <ChevronRight color="#9CA3AF" size={20} />
                    </View>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Empty Clubs State */}
        {!clubsLoading && (!clubs || clubs.length === 0) && (
          <>
            {/* Section Label */}
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.5, textTransform: 'uppercase', paddingHorizontal: 4 }}>
              Club
            </Text>

            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                padding: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
              }}
            >

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: '#FEE2E2',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Users color="#EF4444" size={24} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 }}>
                  No Clubs Yet
                </Text>
                <Text style={{ fontSize: 13, color: '#6B7280', lineHeight: 18 }}>
                  Create or join clubs to organize sessions
                </Text>
              </View>
            </View>
            <Link href="/(tabs)/create-club" asChild>
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: '#EF4444',
                  marginTop: 12,
                }}
              >
                <Plus color="#FFFFFF" size={18} />
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>Create Your First Club</Text>
              </TouchableOpacity>
            </Link>
          </View>
          </>
        )}

        {/* Statistics Grid */}
        {stats && (
          <>
            {/* Section Label */}
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.5, textTransform: 'uppercase', paddingHorizontal: 4 }}>
              Statistics
            </Text>

            <View className="flex-row gap-3">
              <View
                style={{
                  flex: 1,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 20,
                  padding: 16,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.06,
                  shadowRadius: 12,
                  elevation: 3,
                }}
              >
                <View style={{ marginBottom: 12, width: 40, height: 40, borderRadius: 12, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' }}>
                  <Trophy color="#EF4444" size={20} />
                </View>
                <Text style={{ fontSize: 28, fontWeight: '700', color: '#111827', marginBottom: 4, lineHeight: 32 }}>{stats.total_sessions}</Text>
                <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '500' }}>
                  Total Sessions
                </Text>
              </View>

              <View
                style={{
                  flex: 1,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 20,
                  padding: 16,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.06,
                  shadowRadius: 12,
                  elevation: 3,
                }}
              >
                <View style={{ marginBottom: 12, width: 40, height: 40, borderRadius: 12, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock color="#3B82F6" size={20} />
                </View>
                <Text style={{ fontSize: 28, fontWeight: '700', color: '#111827', marginBottom: 4, lineHeight: 32 }}>{stats.total_hours}</Text>
                <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '500' }}>
                  Total Hours
                </Text>
              </View>
            </View>

            <View className="flex-row gap-3">
              <View
                style={{
                  flex: 1,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 20,
                  padding: 16,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.06,
                  shadowRadius: 12,
                  elevation: 3,
                }}
              >
                <View style={{ marginBottom: 12, width: 40, height: 40, borderRadius: 12, backgroundColor: '#FED7AA', alignItems: 'center', justifyContent: 'center' }}>
                  <Target color="#EA580C" size={20} />
                </View>
                <Text style={{ fontSize: 28, fontWeight: '700', color: '#111827', marginBottom: 4, lineHeight: 32 }}>{stats.padel_sessions}</Text>
                <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '500' }}>
                  Padel Sessions
                </Text>
              </View>

              <View
                style={{
                  flex: 1,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 20,
                  padding: 16,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.06,
                  shadowRadius: 12,
                  elevation: 3,
                }}
              >
                <View style={{ marginBottom: 12, width: 40, height: 40, borderRadius: 12, backgroundColor: '#D1FAE5', alignItems: 'center', justifyContent: 'center' }}>
                  <Circle color="#10B981" size={20} />
                </View>
                <Text style={{ fontSize: 28, fontWeight: '700', color: '#111827', marginBottom: 4, lineHeight: 32 }}>{stats.tennis_sessions}</Text>
                <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '500' }}>
                  Tennis Sessions
                </Text>
              </View>
            </View>

            {/* Activity Calendar (30-day view) */}
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 24,
                padding: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <View className="mb-2">
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-base font-bold text-gray-900">Activity Calendar</Text>
                  <Text className="text-xs text-gray-600">Last 30 days</Text>
                </View>
                <Text className="text-xs text-gray-500">
                  {(() => {
                    const today = new Date();
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(today.getDate() - 29);
                    const startMonth = thirtyDaysAgo.toLocaleString('default', { month: 'short' });
                    const endMonth = today.toLocaleString('default', { month: 'short' });
                    return startMonth === endMonth ? startMonth : `${startMonth} - ${endMonth}`;
                  })()}
                </Text>
              </View>

              {/* Calendar Grid */}
              <View style={{ width: '80%', alignSelf: 'center', gap: 3 }}>
                {/* Day labels */}
                <View style={{ flexDirection: 'row', gap: 3, marginBottom: 4 }}>
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
                      <Text style={{ fontSize: 9, color: '#9CA3AF', fontWeight: '600' }}>
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
                    <View key={weekIndex} style={{ flexDirection: 'row', gap: 3, marginBottom: 3 }}>
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
                          backgroundColor = '#FCA5A5'; // rose-300
                          textColor = '#BE123C'; // rose-700
                        } else if (intensity === 2) {
                          backgroundColor = '#FB7185'; // rose-400
                          textColor = '#FFFFFF';
                        } else if (intensity === 3) {
                          backgroundColor = '#F43F5E'; // rose-500
                          textColor = '#FFFFFF';
                        } else if (intensity === 4) {
                          backgroundColor = '#E11D48'; // rose-600
                          textColor = '#FFFFFF';
                        }

                        return (
                          <TouchableOpacity
                            key={dayIndex}
                            style={{
                              flex: 1,
                              aspectRatio: 1,
                              backgroundColor,
                              borderRadius: 4,
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
                            <Text style={{ fontSize: 8, fontWeight: '600', color: textColor }}>
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
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 24,
                padding: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <Text className="text-base font-bold text-gray-900 mb-3">Detailed Statistics</Text>
              <View className="flex-row flex-wrap gap-2">
                <View style={{ backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12, width: '48%' }}>
                  <Text className="text-xs text-gray-600 font-medium mb-1">Avg Players</Text>
                  <Text className="text-xl font-bold text-gray-900">
                    {stats.avg_players_per_session}
                  </Text>
                </View>

                <View style={{ backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12, width: '48%' }}>
                  <Text className="text-xs text-gray-600 font-medium mb-1">Common Points</Text>
                  <Text className="text-xl font-bold text-gray-900">{stats.most_common_points}</Text>
                </View>

                <View style={{ backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12, width: '48%' }}>
                  <Text className="text-xs text-gray-600 font-medium mb-1">Usual Courts</Text>
                  <Text className="text-xl font-bold text-gray-900">
                    {stats.most_used_court_count}
                  </Text>
                </View>

                <View style={{ backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12, width: '48%' }}>
                  <Text className="text-xs text-gray-600 font-medium mb-1">Mexicano</Text>
                  <Text className="text-xl font-bold text-gray-900">{stats.mexicano_sessions}</Text>
                </View>

                <View style={{ backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12, width: '48%' }}>
                  <Text className="text-xs text-gray-600 font-medium mb-1">Americano</Text>
                  <Text className="text-xl font-bold text-gray-900">{stats.americano_sessions}</Text>
                </View>

                <View style={{ backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12, width: '48%' }}>
                  <Text className="text-xs text-gray-600 font-medium mb-1">Total Rounds</Text>
                  <Text className="text-xl font-bold text-gray-900">
                    {stats.total_rounds_played}
                  </Text>
                </View>

                <View style={{ backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12, width: '48%' }}>
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
    </View>
  );
}
