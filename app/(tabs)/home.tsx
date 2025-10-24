import { View, Text, FlatList, TouchableOpacity, RefreshControl, TextInput, ScrollView, Modal, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Trophy,
  Users,
  Calendar,
  Search,
  ChevronDown,
  SortAsc,
  Filter,
  X,
  MoreHorizontal,
  Settings
} from 'lucide-react-native';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useState, useRef, useEffect } from 'react';
import Toast from 'react-native-toast-message';

// Sport Icons (simplified for React Native)
const PadelIcon = ({ color = '#EA580C', size = 16 }: { color?: string; size?: number }) => (
  <View style={{ width: size, height: size, borderWidth: 1, borderColor: color, borderRadius: 2 }} />
);

const TennisIcon = ({ color = '#16A34A', size = 16 }: { color?: string; size?: number }) => (
  <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 1, borderColor: color }} />
);

interface GameSession {
  id: string;
  name: string;
  type: 'mexicano' | 'americano' | 'mixed_mexicano';
  sport: 'padel' | 'tennis';
  courts: number;
  points_per_match: number;
  status: string;
  current_round: number;
  player_count: number;
  game_date: string;
  game_time: string;
  duration_hours: number;
  created_at: string;
}

export default function HomeScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();

  // State
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sportFilter, setSportFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('creation_date');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [sportDropdownOpen, setSportDropdownOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  // Fetch sessions
  const {
    data: sessions = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['sessions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as GameSession[];
    },
    enabled: !!user,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('game_sessions')
        .delete()
        .eq('id', id)
        .eq('user_id', user!.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      Toast.show({ type: 'success', text1: 'Session deleted' });
    },
    onError: () => {
      Toast.show({ type: 'error', text1: 'Failed to delete session' });
    },
  });

  // Mark as completed mutation
  const completeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('game_sessions')
        .update({ status: 'completed' })
        .eq('id', id)
        .eq('user_id', user!.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      Toast.show({ type: 'success', text1: 'Session marked as completed' });
    },
    onError: () => {
      Toast.show({ type: 'error', text1: 'Failed to update session' });
    },
  });

  // Helper functions
  const getSessionStatus = (session: GameSession) => {
    if (session.status === 'completed') return 'completed';
    if (session.current_round > 0) return 'active';
    return 'setup';
  };

  const getPlayerCount = (session: GameSession) => {
    return session.player_count || (session.type === 'mexicano' ? 8 : 6);
  };

  const formatGameDateTime = (dateString: string, timeString: string, durationHours: number) => {
    if (!dateString) return 'No date set';

    const date = new Date(dateString);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const year = date.getFullYear();

    const time = timeString || '19:00';
    const duration = durationHours || 2;

    return `${dayName}, ${day} ${month} ${year} - ${time} - ${duration} ${
      duration === 1 ? 'hour' : 'hours'
    }`;
  };

  // Filtering and sorting
  const filteredAndSortedSessions = sessions
    .filter((session) => {
      // Status filter
      if (statusFilter !== 'all' && getSessionStatus(session) !== statusFilter) return false;

      // Sport filter
      if (sportFilter !== 'all' && (session.sport || 'padel') !== sportFilter) return false;

      // Date filter
      if (dateFilter) {
        const sessionDate = new Date(session.game_date).toISOString().split('T')[0];
        if (sessionDate !== dateFilter) return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          session.name.toLowerCase().includes(query) ||
          session.type.toLowerCase().includes(query) ||
          (session.sport || 'padel').toLowerCase().includes(query)
        );
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'alphabetical':
          return a.name.localeCompare(b.name);
        case 'game_date':
          const dateA = new Date(a.game_date || 0);
          const dateB = new Date(b.game_date || 0);
          return dateB.getTime() - dateA.getTime();
        case 'creation_date':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  const resetFilters = () => {
    setStatusFilter('all');
    setSportFilter('all');
    setDateFilter('');
    setShowFilters(false);
  };

  const handleDelete = (id: string) => {
    setSessionToDelete(id);
    setDeleteModalOpen(true);
    setActiveDropdown(null);
  };

  const confirmDelete = () => {
    if (sessionToDelete) {
      deleteMutation.mutate(sessionToDelete);
    }
    setDeleteModalOpen(false);
    setSessionToDelete(null);
  };

  const handleMarkCompleted = (id: string) => {
    completeMutation.mutate(id);
    setActiveDropdown(null);
  };

  const renderSession = ({ item }: { item: GameSession }) => {
    const currentStatus = getSessionStatus(item);
    const playerCount = getPlayerCount(item);
    const sport = item.sport || 'padel';

    return (
      <View className="bg-white/20 backdrop-blur-xl border border-white/50 rounded-3xl p-6 mb-6 shadow-xl">
        {/* Header with Status */}
        <View className="flex-row items-start justify-between mb-4">
          <View className="flex-1">
            <Text className="text-lg font-bold text-gray-900 mb-2">{item.name}</Text>
            <View className="flex-row items-center gap-2">
              {sport === 'padel' ? (
                <PadelIcon color="#EA580C" size={16} />
              ) : (
                <TennisIcon color="#16A34A" size={16} />
              )}
              <Text className="text-sm font-medium text-gray-700">
                {sport.charAt(0).toUpperCase() + sport.slice(1)} -{' '}
                {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
              </Text>
            </View>
          </View>

          <View
            className={`px-2.5 py-1 rounded-full ${
              currentStatus === 'completed'
                ? 'bg-green-500/10'
                : currentStatus === 'active'
                ? 'bg-red-500/10'
                : 'bg-gray-500/10'
            }`}
            style={{
              borderWidth: 1,
              borderColor:
                currentStatus === 'completed'
                  ? 'rgba(34, 197, 94, 0.2)'
                  : currentStatus === 'active'
                  ? 'rgba(239, 68, 68, 0.2)'
                  : 'rgba(107, 114, 128, 0.2)',
            }}
          >
            <Text
              className={`text-xs font-semibold ${
                currentStatus === 'completed'
                  ? 'text-green-700'
                  : currentStatus === 'active'
                  ? 'text-red-700'
                  : 'text-gray-700'
              }`}
            >
              {currentStatus}
            </Text>
          </View>
        </View>

        {/* Pills */}
        <View className="flex-row flex-wrap gap-2 mb-4">
          <View className="bg-blue-500/10 px-2.5 py-1 rounded-full flex-row items-center gap-1" style={{ borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.2)' }}>
            <Users color="#1E40AF" size={12} />
            <Text className="text-xs font-semibold text-blue-800">{playerCount} Players</Text>
          </View>
          <View className="bg-purple-500/10 px-2.5 py-1 rounded-full" style={{ borderWidth: 1, borderColor: 'rgba(168, 85, 247, 0.2)' }}>
            <Text className="text-xs font-semibold text-purple-800">
              {item.courts} {item.courts === 1 ? 'Court' : 'Courts'}
            </Text>
          </View>
          <View className="bg-orange-500/10 px-2.5 py-1 rounded-full" style={{ borderWidth: 1, borderColor: 'rgba(249, 115, 22, 0.2)' }}>
            <Text className="text-xs font-semibold text-orange-800">{item.points_per_match} Points</Text>
          </View>
          <View className="bg-gray-500/10 px-2.5 py-1 rounded-full" style={{ borderWidth: 1, borderColor: 'rgba(107, 114, 128, 0.2)' }}>
            <Text className="text-xs font-semibold text-gray-800">Round {item.current_round || 0}</Text>
          </View>
        </View>

        {/* Date and Time */}
        <View className="mb-6 flex-row items-center gap-2">
          <Calendar color="#6B7280" size={16} />
          <Text className="text-sm text-gray-600 flex-1">
            {formatGameDateTime(item.game_date, item.game_time, item.duration_hours)}
          </Text>
        </View>

        {/* Action Buttons */}
        <View className="flex-row gap-2">
          <TouchableOpacity
            className="flex-1 bg-gradient-to-r from-rose-500 to-rose-600 rounded-2xl py-3 px-4"
            style={{ backgroundColor: '#F43F5E' }}
            onPress={() => router.push(`/(tabs)/session/${item.id}`)}
          >
            <Text className="text-white font-medium text-sm text-center">Open Session</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="w-12 h-12 bg-white/40 border border-white/40 rounded-2xl items-center justify-center"
            onPress={() => setActiveDropdown(activeDropdown === item.id ? null : item.id)}
          >
            <MoreHorizontal color="#4B5563" size={20} />
          </TouchableOpacity>
        </View>

        {/* Dropdown Menu */}
        {activeDropdown === item.id && (
          <View className="absolute right-6 bottom-20 bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl shadow-xl py-1 z-50" style={{ width: 176 }}>
            {currentStatus !== 'completed' && (
              <TouchableOpacity
                className="px-4 py-3 border-b border-gray-200"
                onPress={() => handleMarkCompleted(item.id)}
              >
                <Text className="text-sm text-green-600">Mark as Completed</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              className="px-4 py-3"
              onPress={() => handleDelete(item.id)}
            >
              <Text className="text-sm text-red-600">Delete Session</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Glassmorphic Background Blobs */}
      <View className="absolute inset-0 overflow-hidden pointer-events-none">
        <View
          className="absolute w-96 h-96 rounded-full opacity-30"
          style={{
            top: 80,
            left: -80,
            backgroundColor: '#FCE4EC',
            filter: 'blur(60px)'
          }}
        />
        <View
          className="absolute w-80 h-80 rounded-full opacity-40"
          style={{
            top: 160,
            right: -80,
            backgroundColor: '#E2E8F0',
            filter: 'blur(60px)'
          }}
        />
        <View
          className="absolute w-72 h-72 rounded-full opacity-30"
          style={{
            bottom: -80,
            left: '33%',
            backgroundColor: '#F5F5F5',
            filter: 'blur(60px)'
          }}
        />
      </View>

      {/* Header - Fixed with Glassmorphism */}
      <View className="bg-white/20 backdrop-blur-xl border-b border-white/30 shadow-sm" style={{ paddingTop: 48, paddingBottom: 12, paddingHorizontal: 16 }}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <View className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-xl items-center justify-center shadow-md" style={{ backgroundColor: '#DC2626' }}>
              <Trophy color="white" size={24} />
            </View>
            <View>
              <Text className="text-lg font-bold text-gray-900">Courtster</Text>
              <Text className="text-xs text-gray-700">Racquet Game Sessions</Text>
            </View>
          </View>

          <TouchableOpacity
            className="bg-white/40 backdrop-blur-xl border border-white/40 p-2.5 rounded-2xl shadow-sm"
            onPress={() => setSettingsOpen(!settingsOpen)}
          >
            <Settings color="#374151" size={20} />
          </TouchableOpacity>
        </View>

        {/* Settings Dropdown */}
        {settingsOpen && (
          <View className="absolute right-4 top-24 bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl shadow-xl py-1 z-50" style={{ width: 192 }}>
            <TouchableOpacity
              className="px-4 py-3 border-b border-gray-200"
              onPress={() => {
                Toast.show({ type: 'info', text1: 'Subscriptions coming soon!' });
                setSettingsOpen(false);
              }}
            >
              <Text className="text-sm text-gray-700">Subscriptions</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="px-4 py-3"
              onPress={() => {
                signOut();
                setSettingsOpen(false);
              }}
            >
              <Text className="text-sm text-red-600">Sign Out</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Main Content */}
      <ScrollView className="flex-1 px-4 pt-4">
        {/* Title */}
        <View className="text-center mb-6">
          <Text className="text-2xl font-bold text-gray-900 text-center mb-2">
            Racquet Game Sessions
          </Text>
          <Text className="text-base text-gray-800 text-center">
            Manage your padel and tennis sessions
          </Text>
        </View>

        {/* New Session Button */}
        <TouchableOpacity
          className="bg-gradient-to-r from-rose-500 to-rose-600 rounded-3xl py-4 px-8 flex-row items-center justify-center gap-3 shadow-xl mb-6"
          style={{ backgroundColor: '#F43F5E' }}
          onPress={() => router.push('/create-session')}
        >
          <Plus color="white" size={24} />
          <Text className="text-white font-semibold text-lg">New Session</Text>
        </TouchableOpacity>

        {/* Search and Filter */}
        <View className="flex-row gap-3 items-center mb-6">
          {/* Search */}
          <View className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 text-gray-400" style={{ marginTop: -8 }} size={16} />
            <TextInput
              placeholder="Search sessions..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="w-full pl-10 pr-4 py-2.5 bg-white/40 backdrop-blur-xl border border-white/40 rounded-2xl text-gray-900 text-sm shadow-sm"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Filter Toggle */}
          <TouchableOpacity
            className={`border px-3 py-2.5 rounded-2xl flex-row items-center gap-2 shadow-sm ${
              showFilters ? 'bg-rose-500/20 border-rose-400/60' : 'bg-white/40 border-white/40'
            }`}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Filter color={showFilters ? '#991B1B' : '#374151'} size={16} />
            <Text className={`text-sm font-medium ${showFilters ? 'text-rose-800' : 'text-gray-700'}`}>
              Filter
            </Text>
          </TouchableOpacity>
        </View>

        {/* Collapsible Filters */}
        {showFilters && (
          <View className="bg-white/20 backdrop-blur-xl border border-white/40 rounded-3xl p-4 shadow-lg mb-6">
            <View className="flex-row flex-wrap gap-4">
              {/* Status Filter */}
              <View>
                <Text className="text-xs font-medium text-gray-700 mb-1">Status</Text>
                <TouchableOpacity
                  className="bg-white/40 border border-white/40 px-3 py-2 rounded-2xl flex-row items-center gap-2 shadow-sm"
                  onPress={() => setStatusDropdownOpen(!statusDropdownOpen)}
                  style={{ minWidth: 100 }}
                >
                  <View
                    className={`w-2 h-2 rounded-full ${
                      statusFilter === 'completed'
                        ? 'bg-green-400'
                        : statusFilter === 'active'
                        ? 'bg-blue-400'
                        : statusFilter === 'setup'
                        ? 'bg-gray-400'
                        : 'bg-gray-300'
                    }`}
                  />
                  <Text className="text-sm text-gray-700">
                    {statusFilter === 'all' ? 'All' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                  </Text>
                  <ChevronDown color="#374151" size={12} />
                </TouchableOpacity>
              </View>

              {/* Sport Filter */}
              <View>
                <Text className="text-xs font-medium text-gray-700 mb-1">Sport</Text>
                <TouchableOpacity
                  className="bg-white/40 border border-white/40 px-3 py-2 rounded-2xl flex-row items-center gap-2 shadow-sm"
                  onPress={() => setSportDropdownOpen(!sportDropdownOpen)}
                  style={{ minWidth: 100 }}
                >
                  {sportFilter === 'padel' && <PadelIcon color="#EA580C" size={16} />}
                  {sportFilter === 'tennis' && <TennisIcon color="#16A34A" size={16} />}
                  {sportFilter === 'all' && <View className="w-4 h-4 bg-gray-400 rounded-full" />}
                  <Text className="text-sm text-gray-700">
                    {sportFilter === 'all' ? 'All' : sportFilter.charAt(0).toUpperCase() + sportFilter.slice(1)}
                  </Text>
                  <ChevronDown color="#374151" size={12} />
                </TouchableOpacity>
              </View>

              {/* Reset Button */}
              <View className="flex-1 justify-end">
                <TouchableOpacity
                  className="bg-gray-500/80 px-4 py-2 rounded-2xl shadow-sm"
                  onPress={resetFilters}
                >
                  <Text className="text-sm font-medium text-white text-center">Reset</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Sort Control */}
        <View className="flex-row justify-start mb-6">
          <TouchableOpacity
            className="bg-white/40 border border-white/40 px-3 py-2 rounded-2xl flex-row items-center gap-1 shadow-sm"
            onPress={() => setSortDropdownOpen(!sortDropdownOpen)}
          >
            <SortAsc color="#374151" size={16} />
            <Text className="text-sm font-medium text-gray-700">
              Sort: {sortBy === 'creation_date' ? 'Created' : sortBy === 'alphabetical' ? 'A-Z' : 'Date'}
            </Text>
            <ChevronDown color="#374151" size={12} />
          </TouchableOpacity>
        </View>

        {/* Sessions List */}
        {isLoading ? (
          <View className="text-center py-12">
            <View className="bg-white/20 backdrop-blur-xl border border-white/40 rounded-3xl p-8 shadow-lg self-center">
              <View className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full mx-auto mb-4" />
              <Text className="text-gray-800">Loading sessions...</Text>
            </View>
          </View>
        ) : filteredAndSortedSessions.length === 0 ? (
          <View className="text-center py-12">
            <View className="bg-white/20 backdrop-blur-xl border border-white/40 rounded-3xl p-8 shadow-lg">
              <View
                className="w-16 h-16 rounded-2xl items-center justify-center mx-auto mb-4 shadow-md"
                style={{ backgroundColor: '#DC2626' }}
              >
                <Trophy color="white" size={32} />
              </View>
              <Text className="text-gray-900 font-medium mb-2 text-center">
                {searchQuery
                  ? 'No sessions found'
                  : statusFilter === 'all'
                  ? 'No racquet game sessions yet'
                  : `No ${statusFilter} sessions`}
              </Text>
              <Text className="text-gray-700 text-sm text-center">
                {searchQuery
                  ? `No sessions match "${searchQuery}"`
                  : statusFilter === 'all'
                  ? 'Create your first racquet game session to get started'
                  : `No sessions with ${statusFilter} status found`}
              </Text>
            </View>
          </View>
        ) : (
          <FlatList
            data={filteredAndSortedSessions}
            renderItem={renderSession}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                tintColor="#F43F5E"
              />
            }
            contentContainerStyle={{ paddingBottom: 24 }}
            scrollEnabled={false}
          />
        )}
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalOpen(false)}
      >
        <View className="flex-1 bg-black/40 items-center justify-center p-4">
          <View className="bg-white/30 backdrop-blur-xl border border-white/40 rounded-3xl shadow-2xl p-6 w-full max-w-sm">
            <View className="items-center">
              <View className="w-12 h-12 bg-red-100 rounded-full items-center justify-center mb-4">
                <X color="#DC2626" size={24} />
              </View>
              <Text className="text-lg font-bold text-gray-900 mb-2">Delete Session</Text>
              <Text className="text-gray-700 mb-6 text-center">
                Are you sure you want to delete this session? This action cannot be undone.
              </Text>
              <View className="flex-row gap-3 w-full">
                <TouchableOpacity
                  className="flex-1 bg-white/70 border border-gray-200/50 py-2.5 px-4 rounded-2xl"
                  onPress={() => {
                    setDeleteModalOpen(false);
                    setSessionToDelete(null);
                  }}
                >
                  <Text className="text-gray-700 font-medium text-sm text-center">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 py-2.5 px-4 rounded-2xl shadow-md"
                  style={{ backgroundColor: '#F43F5E' }}
                  onPress={confirmDelete}
                >
                  <Text className="text-white font-medium text-sm text-center">Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Sort Dropdown Modal */}
      <Modal
        visible={sortDropdownOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSortDropdownOpen(false)}
      >
        <TouchableOpacity
          className="flex-1"
          activeOpacity={1}
          onPress={() => setSortDropdownOpen(false)}
        >
          <View className="absolute left-4 top-96 bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl shadow-xl py-1" style={{ width: 144 }}>
            <TouchableOpacity
              className="px-4 py-3 border-b border-gray-200"
              onPress={() => {
                setSortBy('creation_date');
                setSortDropdownOpen(false);
              }}
            >
              <Text className="text-sm text-gray-700">Created</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="px-4 py-3 border-b border-gray-200"
              onPress={() => {
                setSortBy('alphabetical');
                setSortDropdownOpen(false);
              }}
            >
              <Text className="text-sm text-gray-700">A-Z</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="px-4 py-3"
              onPress={() => {
                setSortBy('game_date');
                setSortDropdownOpen(false);
              }}
            >
              <Text className="text-sm text-gray-700">Game Date</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Status Dropdown Modal */}
      <Modal
        visible={statusDropdownOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setStatusDropdownOpen(false)}
      >
        <TouchableOpacity
          className="flex-1"
          activeOpacity={1}
          onPress={() => setStatusDropdownOpen(false)}
        >
          <View className="absolute left-4 top-80 bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl shadow-xl py-1" style={{ width: 128 }}>
            {['all', 'setup', 'active', 'completed'].map((status) => (
              <TouchableOpacity
                key={status}
                className="px-4 py-2 flex-row items-center gap-2"
                onPress={() => {
                  setStatusFilter(status);
                  setStatusDropdownOpen(false);
                }}
              >
                <View
                  className={`w-2 h-2 rounded-full ${
                    status === 'completed'
                      ? 'bg-green-400'
                      : status === 'active'
                      ? 'bg-blue-400'
                      : status === 'setup'
                      ? 'bg-gray-400'
                      : 'bg-gray-300'
                  }`}
                />
                <Text className="text-sm text-gray-700">
                  {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Sport Dropdown Modal */}
      <Modal
        visible={sportDropdownOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSportDropdownOpen(false)}
      >
        <TouchableOpacity
          className="flex-1"
          activeOpacity={1}
          onPress={() => setSportDropdownOpen(false)}
        >
          <View className="absolute left-32 top-80 bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl shadow-xl py-1" style={{ width: 128 }}>
            {['all', 'padel', 'tennis'].map((sport) => (
              <TouchableOpacity
                key={sport}
                className="px-4 py-2 flex-row items-center gap-2"
                onPress={() => {
                  setSportFilter(sport);
                  setSportDropdownOpen(false);
                }}
              >
                {sport === 'padel' && <PadelIcon color="#EA580C" size={16} />}
                {sport === 'tennis' && <TennisIcon color="#16A34A" size={16} />}
                {sport === 'all' && <View className="w-4 h-4 bg-gray-400 rounded-full" />}
                <Text className="text-sm text-gray-700">
                  {sport === 'all' ? 'All' : sport.charAt(0).toUpperCase() + sport.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
