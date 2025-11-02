import { View, Text, FlatList, TouchableOpacity, RefreshControl, TextInput, ScrollView, Modal, Animated, Platform, Image } from 'react-native';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  club_id: string | null;
  club_name: string | null;
  clubs?: {
    id: string;
    name: string;
    logo_url: string | null;
  } | null;
}

export default function HomeScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();

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
        .select(`
          *,
          clubs:club_id (
            id,
            name,
            logo_url
          )
        `)
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
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push(`/(tabs)/session/${item.id}`)}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 16,
            marginBottom: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
            position: 'relative',
          }}
        >
          {/* Row 1: Name + Status Badge */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', flex: 1, marginRight: 8 }}>
              {item.name}
            </Text>
            {/* Status Badge */}
            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 10,
                backgroundColor:
                  currentStatus === 'completed' ? '#DCFCE7' :
                  currentStatus === 'active' ? '#DBEAFE' :
                  currentStatus === 'cancelled' ? '#FEE2E2' : '#F3F4F6',
              }}
            >
              <Text style={{
                fontSize: 10,
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

          {/* Row 2: Sport & Type */}
          <View className="flex-row items-center gap-2 mb-3">
            <View className="flex-row items-center gap-1.5">
              {sport === 'padel' ? (
                <PadelIcon color="#EA580C" size={14} />
              ) : (
                <TennisIcon color="#16A34A" size={14} />
              )}
              <Text style={{ fontSize: 13, fontWeight: '500', color: '#6B7280' }}>
                {sport.charAt(0).toUpperCase() + sport.slice(1)}
              </Text>
            </View>
            <Text style={{ fontSize: 13, color: '#D1D5DB' }}>•</Text>
            <Text style={{ fontSize: 13, fontWeight: '500', color: '#6B7280' }}>
              {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
            </Text>
          </View>

          {/* Row 3: Stats Pills and Date */}
          <View className="flex-row items-center justify-between">
            {/* Pills and Date */}
            <View className="flex-row flex-wrap gap-2 flex-1 items-center" style={{ marginRight: 12 }}>
              <View style={{ backgroundColor: '#DBEAFE', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Users color="#1E40AF" size={11} />
                <Text style={{ fontSize: 11, fontWeight: '600', color: '#1E40AF' }}>{playerCount}</Text>
              </View>
              <View style={{ backgroundColor: '#F3E8FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: '#7C3AED' }}>
                  {item.courts} {item.courts === 1 ? 'Court' : 'Courts'}
                </Text>
              </View>
              <View style={{ backgroundColor: '#FED7AA', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: '#C2410C' }}>{item.points_per_match} Pts</Text>
              </View>
              <View style={{ backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: '#374151' }}>R{item.current_round || 0}</Text>
              </View>
              <View className="flex-row items-center gap-1.5">
                <Calendar color="#9CA3AF" size={12} />
                <Text style={{ fontSize: 12, color: '#9CA3AF' }}>
                  {formatGameDateTime(item.game_date, item.game_time, item.duration_hours)}
                </Text>
              </View>
            </View>

            {/* Triple Dot Menu */}
            <TouchableOpacity
              style={{
                width: 36,
                height: 36,
                backgroundColor: '#F3F4F6',
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={(e) => {
                e.stopPropagation();
                setActiveDropdown(activeDropdown === item.id ? null : item.id);
              }}
            >
              <MoreHorizontal color="#6B7280" size={18} />
            </TouchableOpacity>
          </View>

          {/* Dropdown Menu */}
          {activeDropdown === item.id && (
            <View style={{
              position: 'absolute',
              right: 16,
              bottom: 50,
              backgroundColor: '#FFFFFF',
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
                    borderBottomColor: '#E5E7EB',
                  }}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleMarkCompleted(item.id);
                  }}
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
                onPress={(e) => {
                  e.stopPropagation();
                  handleDelete(item.id);
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: '500', color: '#EF4444' }}>
                  Delete Session
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      );
    }

    // Cards mode rendering (original)
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => router.push(`/(tabs)/session/${item.id}`)}
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 24,
          padding: 16,
          marginBottom: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        {/* Header with Status */}
        <View className="flex-row items-start justify-between mb-3">
          <View className="flex-1">
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 6 }}>
              {item.name}
            </Text>
            <View className="flex-row items-center gap-2 mb-2">
              {sport === 'padel' ? (
                <PadelIcon color="#EA580C" size={14} />
              ) : (
                <TennisIcon color="#16A34A" size={14} />
              )}
              <Text style={{ fontSize: 13, fontWeight: '500', color: '#6B7280' }}>
                {sport.charAt(0).toUpperCase() + sport.slice(1)}
              </Text>
              <Text style={{ fontSize: 13, color: '#D1D5DB' }}>•</Text>
              <Text style={{ fontSize: 13, fontWeight: '500', color: '#6B7280' }}>
                {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
              </Text>
            </View>
            {/* Club Display */}
            {item.clubs && (
              <View className="flex-row items-center gap-2">
                {item.clubs.logo_url ? (
                  <Image
                    source={{ uri: item.clubs.logo_url }}
                    style={{ width: 16, height: 16, borderRadius: 8 }}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={{
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    backgroundColor: '#F43F5E',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Text style={{ fontSize: 8, fontWeight: '700', color: '#FFFFFF' }}>
                      {item.clubs.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <Text style={{ fontSize: 12, fontWeight: '500', color: '#9CA3AF' }}>
                  {item.clubs.name}
                </Text>
              </View>
            )}
          </View>

          {/* Status Pill */}
          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 12,
              backgroundColor:
                currentStatus === 'completed' ? '#DCFCE7' :
                currentStatus === 'active' ? '#DBEAFE' :
                currentStatus === 'cancelled' ? '#FEE2E2' : '#F3F4F6',
            }}
          >
            <Text style={{
              fontSize: 10,
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

        {/* Pills and Date Row */}
        <View className="flex-row items-center justify-between">
          {/* Pills and Date */}
          <View className="flex-row flex-wrap gap-2 flex-1 items-center" style={{ marginRight: 12 }}>
            <View style={{ backgroundColor: '#DBEAFE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Users color="#1E40AF" size={11} />
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#1E40AF' }}>{playerCount}</Text>
            </View>
            <View style={{ backgroundColor: '#F3E8FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#7C3AED' }}>
                {item.courts} {item.courts === 1 ? 'Court' : 'Courts'}
              </Text>
            </View>
            <View style={{ backgroundColor: '#FED7AA', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#C2410C' }}>{item.points_per_match} Pts</Text>
            </View>
            <View style={{ backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#374151' }}>R{item.current_round || 0}</Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <Calendar color="#9CA3AF" size={12} />
              <Text style={{ fontSize: 12, color: '#9CA3AF' }}>
                {formatGameDateTime(item.game_date, item.game_time, item.duration_hours)}
              </Text>
            </View>
          </View>

          {/* Triple Dot Menu */}
          <TouchableOpacity
            style={{
              width: 36,
              height: 36,
              backgroundColor: '#F3F4F6',
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onPress={(e) => {
              e.stopPropagation();
              setActiveDropdown(activeDropdown === item.id ? null : item.id);
            }}
          >
            <MoreHorizontal color="#6B7280" size={18} />
          </TouchableOpacity>
        </View>

        {/* Dropdown Menu */}
        {activeDropdown === item.id && (
          <View style={{
            position: 'absolute',
            right: 16,
            bottom: 50,
            backgroundColor: '#FFFFFF',
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
                  borderBottomColor: '#E5E7EB',
                }}
                onPress={(e) => {
                  e.stopPropagation();
                  handleMarkCompleted(item.id);
                }}
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
              onPress={(e) => {
                e.stopPropagation();
                handleDelete(item.id);
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: '500', color: '#EF4444' }}>
                Delete Session
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1" style={{ backgroundColor: '#FAFAFA' }}>
      {/* Mesh Gradient Background - Option 4 (Premium) */}
      <View className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Top left - Rose/Peach mesh */}
        <View
          className="absolute rounded-full"
          style={{
            width: 300,
            height: 300,
            top: -100,
            left: -100,
            backgroundColor: '#FEE2E2',
            opacity: 0.6,
          }}
        >
          <View
            className="absolute rounded-full"
            style={{
              width: 210,
              height: 210,
              top: 45,
              left: 45,
              backgroundColor: '#FED7AA',
              opacity: 0.3,
            }}
          />
        </View>

        {/* Top right - Blue mesh */}
        <View
          className="absolute rounded-full"
          style={{
            width: 280,
            height: 280,
            top: 50,
            right: -80,
            backgroundColor: '#DBEAFE',
            opacity: 0.5,
          }}
        >
          <View
            className="absolute rounded-full"
            style={{
              width: 168,
              height: 168,
              top: 56,
            left: 56,
              backgroundColor: '#E0E7FF',
              opacity: 0.4,
            }}
          />
        </View>

        {/* Middle left - Green mesh */}
        <View
          className="absolute rounded-full"
          style={{
            width: 240,
            height: 240,
            top: 380,
            left: -70,
            backgroundColor: '#D1FAE5',
            opacity: 0.45,
          }}
        >
          <View
            className="absolute rounded-full"
            style={{
              width: 168,
              height: 168,
              top: 36,
              left: 36,
              backgroundColor: '#A7F3D0',
              opacity: 0.35,
            }}
          />
        </View>

        {/* Middle right - Purple mesh */}
        <View
          className="absolute rounded-full"
          style={{
            width: 260,
            height: 260,
            top: 420,
            right: -70,
            backgroundColor: '#F3E8FF',
            opacity: 0.4,
          }}
        >
          <View
            className="absolute rounded-full"
            style={{
              width: 156,
              height: 156,
              top: 52,
              left: 52,
              backgroundColor: '#E9D5FF',
              opacity: 0.3,
            }}
          />
        </View>

        {/* Lower middle - Cyan mesh */}
        <View
          className="absolute rounded-full"
          style={{
            width: 220,
            height: 220,
            top: 680,
            left: 60,
            backgroundColor: '#D1FAE5',
            opacity: 0.4,
          }}
        >
          <View
            className="absolute rounded-full"
            style={{
              width: 154,
              height: 154,
              top: 33,
              left: 33,
              backgroundColor: '#A7F3D0',
              opacity: 0.3,
            }}
          />
        </View>

        {/* Bottom right - Amber mesh */}
        <View
          className="absolute rounded-full"
          style={{
            width: 200,
            height: 200,
            bottom: -60,
            right: -50,
            backgroundColor: '#FEF3C7',
            opacity: 0.45,
          }}
        >
          <View
            className="absolute rounded-full"
            style={{
              width: 140,
              height: 140,
              top: 30,
              left: 30,
              backgroundColor: '#FDE68A',
              opacity: 0.25,
            }}
          />
        </View>

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
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#FFFFFF',
            opacity: 0.98,
          }}
        />

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: '#F3F4F6',
          }}
        >
          <Text style={{ fontSize: 24, fontWeight: '700', color: '#111827' }}>
            Courtster
          </Text>

          <TouchableOpacity
            onPress={() => router.push('/(tabs)/create-session')}
            style={{
              backgroundColor: '#EF4444',
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 8,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              shadowColor: '#EF4444',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 4,
            }}
          >
            <Plus color="#FFFFFF" size={18} strokeWidth={2.5} />
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>
              Create
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView
        className="flex-1"
        style={{ paddingTop: insets.top + 64 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#EF4444"
          />
        }
      >
        {/* Search Bar - Full Width */}
        <View style={{ marginBottom: 16 }}>
          <View className="relative">
            <View className="absolute left-3.5 top-1/2 z-10" style={{ marginTop: -8 }}>
              <Search color="#9CA3AF" size={16} />
            </View>
            <TextInput
              placeholder="Search sessions..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                paddingLeft: 40,
                paddingRight: 16,
                paddingVertical: 12,
                fontSize: 14,
                color: '#111827',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
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
                backgroundColor: showFilters ? '#FEE2E2' : '#FFFFFF',
                borderRadius: 16,
                paddingHorizontal: 12,
                paddingVertical: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
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
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                paddingHorizontal: 12,
                paddingVertical: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
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
                backgroundColor: '#FFFFFF',
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
                    borderBottomColor: '#E5E7EB',
                    backgroundColor: sortBy === 'creation_date' ? '#DBEAFE' : '#FFFFFF',
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
                    borderBottomColor: '#E5E7EB',
                    backgroundColor: sortBy === 'alphabetical' ? '#DBEAFE' : '#FFFFFF',
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
                    backgroundColor: sortBy === 'game_date' ? '#DBEAFE' : '#FFFFFF',
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
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                paddingHorizontal: 12,
                paddingVertical: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
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
                backgroundColor: '#FFFFFF',
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
                    borderBottomColor: '#E5E7EB',
                    backgroundColor: viewMode === 'cards' ? '#DBEAFE' : '#FFFFFF',
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
                    backgroundColor: viewMode === 'compact' ? '#DBEAFE' : '#FFFFFF',
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
            backgroundColor: '#FFFFFF',
            borderRadius: 24,
            padding: 16,
            marginBottom: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}>
            <View className="flex-row flex-wrap gap-4">
              {/* Status Filter */}
              <View>
                <Text className="text-xs font-semibold text-gray-700 mb-1.5">Status</Text>
                <TouchableOpacity
                  style={{
                    backgroundColor: '#F9FAFB',
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
                    backgroundColor: '#F9FAFB',
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
                    backgroundColor: '#6B7280',
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
            <View style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 24,
              padding: 32,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
              elevation: 3,
              alignSelf: 'center',
            }}>
              <View className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full mx-auto mb-4" />
              <Text className="text-gray-800">Loading sessions...</Text>
            </View>
          </View>
        ) : filteredAndSortedSessions.length === 0 ? (
          <View className="text-center py-12">
            <View style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 24,
              padding: 32,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
              elevation: 3,
            }}>
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
          <View style={{ paddingBottom: Platform.OS === 'ios' ? 100 : insets.bottom + 120 }}>
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
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 24,
            padding: 24,
            width: '100%',
            maxWidth: 400,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.2,
            shadowRadius: 16,
            elevation: 8,
          }}>
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
                  style={{
                    flex: 1,
                    backgroundColor: '#F3F4F6',
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    borderRadius: 16,
                  }}
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
            backgroundColor: '#FFFFFF',
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
                    borderBottomColor: '#E5E7EB',
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
            backgroundColor: '#FFFFFF',
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
                    borderBottomColor: '#E5E7EB',
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
