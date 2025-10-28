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
  ChevronRight,
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

// Sport Icons - Racket SVG (45 degrees orientation)
const PadelIcon = ({ color = '#EA580C', size = 16 }: { color?: string; size?: number }) => (
  <View style={{ width: size, height: size, transform: [{ rotate: '45deg' }] }}>
    <View style={{
      width: size * 0.6,
      height: size * 0.8,
      borderWidth: 1.5,
      borderColor: color,
      borderRadius: 3,
      marginLeft: size * 0.2,
    }} />
    <View style={{
      width: 1.5,
      height: size * 0.4,
      backgroundColor: color,
      marginLeft: size * 0.5 - 0.75,
      marginTop: -2,
    }} />
  </View>
);

const TennisIcon = ({ color = '#16A34A', size = 16 }: { color?: string; size?: number }) => (
  <View style={{ width: size, height: size, transform: [{ rotate: '45deg' }] }}>
    <View style={{
      width: size * 0.6,
      height: size * 0.6,
      borderWidth: 1.5,
      borderColor: color,
      borderRadius: size * 0.3,
      marginLeft: size * 0.2,
    }} />
    <View style={{
      width: 1.5,
      height: size * 0.5,
      backgroundColor: color,
      marginLeft: size * 0.5 - 0.75,
      marginTop: -2,
    }} />
  </View>
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
  const [viewMode, setViewMode] = useState<'cards' | 'compact'>('cards');
  const [viewDropdownOpen, setViewDropdownOpen] = useState(false);

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
  const getSessionStatus = (session: GameSession): 'completed' | 'active' | 'cancelled' | 'setup' => {
    if (session.status === 'completed') return 'completed';
    if (session.status === 'cancelled') return 'cancelled';
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

    // Remove seconds from time (only show HH:MM)
    const time = timeString ? timeString.substring(0, 5) : '19:00';
    const duration = durationHours || 2;

    return `${time} • ${dayName}, ${day} ${month} • ${duration} ${
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

    // Compact mode rendering
    if (viewMode === 'compact') {
      return (
        <View style={{
          backgroundColor: 'rgba(255, 255, 255, 0.4)',
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.6)',
          borderRadius: 16,
          padding: 12,
          marginBottom: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 3,
          position: 'relative',
        }}>
          {/* Row 1: Name */}
          <View className="mb-2">
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>
              {item.name}
            </Text>
          </View>

          {/* Row 2: Sport - Type - Courts */}
          <View className="flex-row items-center gap-2 mb-2">
            <View className="flex-row items-center gap-1.5">
              {sport === 'padel' ? (
                <PadelIcon color="#EA580C" size={14} />
              ) : (
                <TennisIcon color="#16A34A" size={14} />
              )}
              <Text style={{ fontSize: 12, fontWeight: '500', color: '#4B5563' }}>
                {sport.charAt(0).toUpperCase() + sport.slice(1)}
              </Text>
            </View>
            <Text style={{ fontSize: 12, color: '#9CA3AF' }}>-</Text>
            <Text style={{ fontSize: 12, fontWeight: '500', color: '#4B5563' }}>
              {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
            </Text>
            <Text style={{ fontSize: 12, color: '#9CA3AF' }}>-</Text>
            <Text style={{ fontSize: 12, fontWeight: '500', color: '#4B5563' }}>
              {item.courts} {item.courts === 1 ? 'Court' : 'Courts'}
            </Text>
          </View>

          {/* Row 3: Date and Time */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-1.5 flex-1">
              <Calendar color="#6B7280" size={11} />
              <Text style={{ fontSize: 11, color: '#6B7280' }}>
                {formatGameDateTime(item.game_date, item.game_time, item.duration_hours)}
              </Text>
            </View>

            {/* Bottom Right: Triple Dot + Open Button */}
            <View className="flex-row items-center gap-2">
              {/* Triple Dot Menu */}
              <TouchableOpacity
                style={{
                  width: 36,
                  height: 36,
                  backgroundColor: 'rgba(255, 255, 255, 0.4)',
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.4)',
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onPress={() => setActiveDropdown(activeDropdown === item.id ? null : item.id)}
              >
                <MoreHorizontal color="#4B5563" size={18} />
              </TouchableOpacity>

              {/* Open Button - Red (2x Wider) */}
              <TouchableOpacity
                style={{
                  width: 96,
                  height: 36,
                  backgroundColor: '#EF4444',
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#EF4444',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 3,
                }}
                onPress={() => router.push(`/(tabs)/session/${item.id}`)}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600' }}>
                  Open
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Dropdown Menu */}
          {activeDropdown === item.id && (
            <View style={{
              position: 'absolute',
              right: 12,
              bottom: 50,
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: 16,
              width: 200,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 8,
              overflow: 'hidden',
              zIndex: 50,
            }}>
              {currentStatus !== 'completed' && (
                <TouchableOpacity
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    borderBottomWidth: 1,
                    borderBottomColor: 'rgba(229, 231, 235, 0.5)',
                  }}
                  onPress={() => handleMarkCompleted(item.id)}
                >
                  <Text style={{ fontSize: 15, fontWeight: '500', color: '#10B981' }}>
                    Mark as Completed
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                }}
                onPress={() => handleDelete(item.id)}
              >
                <Text style={{ fontSize: 15, fontWeight: '500', color: '#EF4444' }}>
                  Delete Session
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      );
    }

    // Cards mode rendering (original)
    return (
      <View style={{
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.6)',
        borderRadius: 24,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
      }}>
        {/* Header with Status */}
        <View className="flex-row items-start justify-between mb-3">
          <View className="flex-1">
            <Text style={{ fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 6 }}>
              {item.name}
            </Text>
            <View className="flex-row items-center gap-2">
              {sport === 'padel' ? (
                <PadelIcon color="#EA580C" size={14} />
              ) : (
                <TennisIcon color="#16A34A" size={14} />
              )}
              <Text style={{ fontSize: 13, fontWeight: '500', color: '#4B5563' }}>
                {sport.charAt(0).toUpperCase() + sport.slice(1)} -{' '}
                {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
              </Text>
            </View>
          </View>

          {/* Status Pill - iOS 18 Glassmorphism */}
          <View
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 14,
              backgroundColor:
                currentStatus === 'completed' ? 'rgba(34, 197, 94, 0.15)' :
                currentStatus === 'active' ? 'rgba(59, 130, 246, 0.15)' :
                currentStatus === 'cancelled' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(107, 114, 128, 0.15)',
              borderWidth: 1,
              borderColor:
                currentStatus === 'completed' ? 'rgba(34, 197, 94, 0.3)' :
                currentStatus === 'active' ? 'rgba(59, 130, 246, 0.3)' :
                currentStatus === 'cancelled' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.4)',
              shadowColor:
                currentStatus === 'completed' ? '#22C55E' :
                currentStatus === 'active' ? '#3B82F6' :
                currentStatus === 'cancelled' ? '#EF4444' : '#6B7280',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 3,
              elevation: 2,
            }}
          >
            <Text style={{
              fontSize: 11,
              fontWeight: '600',
              letterSpacing: 0.3,
              color:
                currentStatus === 'completed' ? '#15803D' :
                currentStatus === 'active' ? '#1D4ED8' :
                currentStatus === 'cancelled' ? '#DC2626' : '#374151',
            }}>
              {currentStatus.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Pills */}
        <View className="flex-row flex-wrap gap-2 mb-3">
          <View style={{ backgroundColor: 'rgba(59, 130, 246, 0.12)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.25)' }}>
            <Users color="#1E40AF" size={11} />
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#1E40AF' }}>{playerCount}</Text>
          </View>
          <View style={{ backgroundColor: 'rgba(168, 85, 247, 0.12)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(168, 85, 247, 0.25)' }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#7C3AED' }}>
              {item.courts} {item.courts === 1 ? 'Court' : 'Courts'}
            </Text>
          </View>
          <View style={{ backgroundColor: 'rgba(249, 115, 22, 0.12)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(249, 115, 22, 0.25)' }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#C2410C' }}>{item.points_per_match} Pts</Text>
          </View>
          <View style={{ backgroundColor: 'rgba(107, 114, 128, 0.12)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(107, 114, 128, 0.25)' }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#374151' }}>R{item.current_round || 0}</Text>
          </View>
        </View>

        {/* Date and Time */}
        <View className="mb-4 flex-row items-center gap-2">
          <Calendar color="#6B7280" size={14} />
          <Text style={{ fontSize: 13, color: '#6B7280', flex: 1 }}>
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
          <View style={{
            position: 'absolute',
            right: 24,
            bottom: 80,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: 16,
            width: 200,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 8,
            overflow: 'hidden',
            zIndex: 50,
          }}>
            {currentStatus !== 'completed' && (
              <TouchableOpacity
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: 'rgba(229, 231, 235, 0.5)',
                }}
                onPress={() => handleMarkCompleted(item.id)}
              >
                <Text style={{ fontSize: 15, fontWeight: '500', color: '#10B981' }}>
                  Mark as Completed
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={{
                paddingHorizontal: 16,
                paddingVertical: 14,
              }}
              onPress={() => handleDelete(item.id)}
            >
              <Text style={{ fontSize: 15, fontWeight: '500', color: '#EF4444' }}>
                Delete Session
              </Text>
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
        {/* Top left - Rose */}
        <View
          className="absolute rounded-full"
          style={{
            width: 380,
            height: 380,
            top: -100,
            left: -120,
            backgroundColor: '#FCE4EC',
            opacity: 0.3,
          }}
        />

        {/* Top right - Slate blue */}
        <View
          className="absolute rounded-full"
          style={{
            width: 320,
            height: 320,
            top: 60,
            right: -100,
            backgroundColor: '#E2E8F0',
            opacity: 0.35,
          }}
        />

        {/* Middle left - Soft purple */}
        <View
          className="absolute rounded-full"
          style={{
            width: 280,
            height: 280,
            top: 400,
            left: -80,
            backgroundColor: '#F3E8FF',
            opacity: 0.25,
          }}
        />

        {/* Middle right - Light peach */}
        <View
          className="absolute rounded-full"
          style={{
            width: 240,
            height: 240,
            top: 500,
            right: -60,
            backgroundColor: '#FED7AA',
            opacity: 0.2,
          }}
        />

        {/* Center - Subtle grey */}
        <View
          className="absolute rounded-full"
          style={{
            width: 200,
            height: 200,
            top: 300,
            left: 100,
            backgroundColor: '#F5F5F5',
            opacity: 0.3,
          }}
        />

        {/* Lower middle - Light cyan */}
        <View
          className="absolute rounded-full"
          style={{
            width: 300,
            height: 300,
            top: 700,
            left: 50,
            backgroundColor: '#CFFAFE',
            opacity: 0.25,
          }}
        />

        {/* Bottom left - Warm grey */}
        <View
          className="absolute rounded-full"
          style={{
            width: 350,
            height: 350,
            bottom: -150,
            left: -100,
            backgroundColor: '#F5F5F5',
            opacity: 0.35,
          }}
        />

        {/* Bottom center - Soft pink */}
        <View
          className="absolute rounded-full"
          style={{
            width: 280,
            height: 280,
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

      {/* Main Content */}
      <ScrollView
        className="flex-1 px-4"
        style={{ paddingTop: 60 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#EF4444"
          />
        }
      >
        {/* Search Bar - Full Width */}
        <View className="mb-3">
          <View className="relative">
            <View className="absolute left-3.5 top-1/2 z-10" style={{ marginTop: -8 }}>
              <Search color="#9CA3AF" size={16} />
            </View>
            <TextInput
              placeholder="Search sessions..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.6)',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.8)',
                borderRadius: 16,
                paddingLeft: 40,
                paddingRight: 16,
                paddingVertical: 12,
                fontSize: 14,
                color: '#111827',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
              }}
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        {/* Filter, Sort, and View - Same Row */}
        <View className="flex-row gap-3 items-center mb-4">
          {/* Filter Toggle */}
          <View style={{ position: 'relative', flex: 1 }}>
            <TouchableOpacity
              style={{
                width: '100%',
                backgroundColor: showFilters ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.6)',
                borderWidth: 1,
                borderColor: showFilters ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.8)',
                borderRadius: 16,
                paddingHorizontal: 12,
                paddingVertical: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
              }}
              onPress={() => setShowFilters(!showFilters)}
            >
              <Filter color={showFilters ? '#DC2626' : '#374151'} size={16} />
              <Text style={{ fontSize: 14, fontWeight: '600', color: showFilters ? '#991B1B' : '#374151' }}>
                Filter
              </Text>
            </TouchableOpacity>
          </View>

          {/* Sort Control */}
          <View style={{ position: 'relative', flex: 1 }}>
            <TouchableOpacity
              style={{
                width: '100%',
                backgroundColor: 'rgba(255, 255, 255, 0.6)',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.8)',
                borderRadius: 16,
                paddingHorizontal: 12,
                paddingVertical: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
              }}
              onPress={() => setSortDropdownOpen(!sortDropdownOpen)}
            >
              <SortAsc color="#374151" size={16} />
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151' }}>
                Sort
              </Text>
              <ChevronDown color="#374151" size={12} />
            </TouchableOpacity>

            {/* Sort Dropdown Menu - Inline */}
            {sortDropdownOpen && (
              <View style={{
                position: 'absolute',
                top: 52,
                left: 0,
                right: 0,
                width: '100%',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.95)',
                borderRadius: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
                elevation: 8,
                overflow: 'hidden',
                zIndex: 50,
              }}>
                <TouchableOpacity
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    borderBottomWidth: 1,
                    borderBottomColor: 'rgba(229, 231, 235, 0.5)',
                    backgroundColor: sortBy === 'creation_date' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                  }}
                  onPress={() => {
                    setSortBy('creation_date');
                    setSortDropdownOpen(false);
                  }}
                >
                  <Text style={{ fontSize: 15, fontWeight: '500', color: sortBy === 'creation_date' ? '#1D4ED8' : '#374151' }}>
                    Created
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    borderBottomWidth: 1,
                    borderBottomColor: 'rgba(229, 231, 235, 0.5)',
                    backgroundColor: sortBy === 'alphabetical' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                  }}
                  onPress={() => {
                    setSortBy('alphabetical');
                    setSortDropdownOpen(false);
                  }}
                >
                  <Text style={{ fontSize: 15, fontWeight: '500', color: sortBy === 'alphabetical' ? '#1D4ED8' : '#374151' }}>
                    A-Z
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    backgroundColor: sortBy === 'game_date' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                  }}
                  onPress={() => {
                    setSortBy('game_date');
                    setSortDropdownOpen(false);
                  }}
                >
                  <Text style={{ fontSize: 15, fontWeight: '500', color: sortBy === 'game_date' ? '#1D4ED8' : '#374151' }}>
                    Date
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* View Mode Control */}
          <View style={{ position: 'relative', flex: 1 }}>
            <TouchableOpacity
              style={{
                width: '100%',
                backgroundColor: 'rgba(255, 255, 255, 0.6)',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.8)',
                borderRadius: 16,
                paddingHorizontal: 12,
                paddingVertical: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
              }}
              onPress={() => setViewDropdownOpen(!viewDropdownOpen)}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151' }}>
                View
              </Text>
              <ChevronDown color="#374151" size={12} />
            </TouchableOpacity>

            {/* View Dropdown Menu */}
            {viewDropdownOpen && (
              <View style={{
                position: 'absolute',
                top: 52,
                left: 0,
                right: 0,
                width: '100%',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.95)',
                borderRadius: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
                elevation: 8,
                overflow: 'hidden',
                zIndex: 50,
              }}>
                <TouchableOpacity
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    borderBottomWidth: 1,
                    borderBottomColor: 'rgba(229, 231, 235, 0.5)',
                    backgroundColor: viewMode === 'cards' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                  }}
                  onPress={() => {
                    setViewMode('cards');
                    setViewDropdownOpen(false);
                  }}
                >
                  <Text style={{ fontSize: 15, fontWeight: '500', color: viewMode === 'cards' ? '#1D4ED8' : '#374151' }}>
                    Cards
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    backgroundColor: viewMode === 'compact' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                  }}
                  onPress={() => {
                    setViewMode('compact');
                    setViewDropdownOpen(false);
                  }}
                >
                  <Text style={{ fontSize: 15, fontWeight: '500', color: viewMode === 'compact' ? '#1D4ED8' : '#374151' }}>
                    Compact
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Collapsible Filters */}
        {showFilters && (
          <View style={{
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.8)',
            borderRadius: 24,
            padding: 16,
            marginBottom: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 3,
          }}>
            <View className="flex-row flex-wrap gap-4">
              {/* Status Filter */}
              <View>
                <Text className="text-xs font-semibold text-gray-700 mb-1.5">Status</Text>
                <TouchableOpacity
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    minWidth: 100,
                  }}
                  onPress={() => setStatusDropdownOpen(!statusDropdownOpen)}
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
                <Text className="text-xs font-semibold text-gray-700 mb-1.5">Sport</Text>
                <TouchableOpacity
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    minWidth: 100,
                  }}
                  onPress={() => setSportDropdownOpen(!sportDropdownOpen)}
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
                  style={{
                    backgroundColor: 'rgba(107, 114, 128, 0.8)',
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                  onPress={resetFilters}
                >
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF', textAlign: 'center' }}>
                    Reset
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

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
          <View style={{ paddingBottom: 120 }}>
            {filteredAndSortedSessions.map((item) => (
              <View key={item.id}>
                {renderSession({ item })}
              </View>
            ))}
          </View>
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
          <View style={{
            position: 'absolute',
            left: 16,
            top: 260,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: 16,
            width: 160,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 8,
            overflow: 'hidden',
          }}>
            {['all', 'setup', 'active', 'completed'].map((status, index) => (
              <TouchableOpacity
                key={status}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  ...(index < 3 && {
                    borderBottomWidth: 1,
                    borderBottomColor: 'rgba(229, 231, 235, 0.5)',
                  }),
                }}
                onPress={() => {
                  setStatusFilter(status);
                  setStatusDropdownOpen(false);
                }}
              >
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor:
                      status === 'completed' ? '#34D399' :
                      status === 'active' ? '#60A5FA' :
                      status === 'setup' ? '#9CA3AF' : '#D1D5DB',
                  }}
                />
                <Text style={{ fontSize: 15, fontWeight: '500', color: '#374151' }}>
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
          <View style={{
            position: 'absolute',
            left: 192,
            top: 260,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: 16,
            width: 160,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 8,
            overflow: 'hidden',
          }}>
            {['all', 'padel', 'tennis'].map((sport, index) => (
              <TouchableOpacity
                key={sport}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  ...(index < 2 && {
                    borderBottomWidth: 1,
                    borderBottomColor: 'rgba(229, 231, 235, 0.5)',
                  }),
                }}
                onPress={() => {
                  setSportFilter(sport);
                  setSportDropdownOpen(false);
                }}
              >
                {sport === 'padel' && <PadelIcon color="#EA580C" size={16} />}
                {sport === 'tennis' && <TennisIcon color="#16A34A" size={16} />}
                {sport === 'all' && <View style={{ width: 16, height: 16, backgroundColor: '#9CA3AF', borderRadius: 8 }} />}
                <Text style={{ fontSize: 15, fontWeight: '500', color: '#374151' }}>
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
