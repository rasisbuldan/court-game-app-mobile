import { View, Text, TextInput, TouchableOpacity, FlatList, Platform, Alert } from 'react-native';
import { useState, useRef } from 'react';
import { useRouter } from 'expo-router';
import { X, User, Lock } from 'lucide-react-native';
import { PlayerFormData, Gender } from '../../hooks/usePlayerForm';
import { GameType } from '../../hooks/useSessionForm';

interface PlayerManagerProps {
  players: PlayerFormData[];
  onAdd: (name: string, gender?: Gender) => void;
  onAddPair: (name1: string, name2: string, gender1?: Gender, gender2?: Gender) => void;
  onRemove: (playerId: string) => void;
  onGenderChange: (playerId: string, gender: Gender) => void;
  onPartnerChange: (playerId: string, partnerId: string | undefined) => void;
  gameType: GameType;
  onImport: () => void;
  canImportFromReclub?: boolean; // Subscription-based feature access
}

export function PlayerManager({
  players,
  onAdd,
  onAddPair,
  onRemove,
  onGenderChange,
  onPartnerChange,
  gameType,
  onImport,
  canImportFromReclub = false, // Default to false (locked) for security
}: PlayerManagerProps) {
  const router = useRouter();
  const [playerName, setPlayerName] = useState('');
  const [player2Name, setPlayer2Name] = useState('');
  const playerInputRef = useRef<TextInput>(null);
  const player2InputRef = useRef<TextInput>(null);

  const isFixedPartner = gameType === 'fixed_partner';

  const handleAddPlayer = () => {
    if (playerName.trim()) {
      try {
        onAdd(playerName.trim());
        setPlayerName('');
        // Keep keyboard open - refocus immediately without timeout
        // On iOS, this prevents the keyboard from dismissing
        playerInputRef.current?.focus();
      } catch (error) {
        // Error handled by parent
      }
    }
  };

  const handleAddPair = () => {
    if (playerName.trim() && player2Name.trim()) {
      try {
        onAddPair(playerName.trim(), player2Name.trim());
        setPlayerName('');
        setPlayer2Name('');
        // Keep keyboard open - refocus first input immediately
        playerInputRef.current?.focus();
      } catch (error) {
        // Error handled by parent
      }
    }
  };

  const toggleGender = (playerId: string, currentGender: Gender) => {
    const nextGender: Gender =
      currentGender === 'male' ? 'female' : currentGender === 'female' ? 'unspecified' : 'male';
    onGenderChange(playerId, nextGender);
  };

  const getGenderIcon = (gender: Gender) => {
    if (gender === 'male') {
      return { bg: 'rgba(59, 130, 246, 0.2)', border: '#3B82F6', text: '#1E40AF', icon: '♂' };
    }
    if (gender === 'female') {
      return { bg: 'rgba(236, 72, 153, 0.2)', border: '#EC4899', text: '#BE185D', icon: '♀' };
    }
    return { bg: 'rgba(107, 114, 128, 0.2)', border: '#6B7280', text: '#374151', icon: '?' };
  };

  const getAvailablePartners = (playerId: string) => {
    return players.filter((p) => p.id !== playerId && !p.partnerId);
  };

  return (
    <View style={{ gap: 16 }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <User color="#111827" size={18} strokeWidth={2} />
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: 0.8 }}>
            Players
          </Text>
          {players.length > 0 && (
            <View
              style={{
                backgroundColor: '#EF4444',
                borderRadius: 12,
                paddingHorizontal: 8,
                paddingVertical: 2,
                minWidth: 24,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF' }}>
                {players.length}
              </Text>
            </View>
          )}
        </View>

        {/* Import Button */}
        <View>
          <TouchableOpacity
            onPress={() => {
              if (!canImportFromReclub) {
                router.push('/(tabs)/subscription');
                return;
              }
              onImport();
            }}
            activeOpacity={canImportFromReclub ? 0.7 : 1}
            style={{
              backgroundColor: canImportFromReclub ? 'rgba(55, 65, 81, 0.85)' : 'rgba(156, 163, 175, 0.4)',
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 6,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              opacity: canImportFromReclub ? 1 : 0.6,
            }}
          >
            {!canImportFromReclub && <Lock color="#6B7280" size={12} strokeWidth={2.5} />}
            <Text style={{ fontSize: 12, fontWeight: '600', color: canImportFromReclub ? '#FFFFFF' : '#6B7280' }}>
              Import from Reclub
            </Text>
          </TouchableOpacity>
          {!canImportFromReclub && (
            <Text style={{ fontSize: 10, color: '#9CA3AF', marginTop: 4, fontStyle: 'italic' }}>
              Upgrade account to use feature
            </Text>
          )}
        </View>
      </View>

      {/* Add Player Form */}
      {isFixedPartner ? (
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 12, color: '#6B7280', fontStyle: 'italic' }}>
            Add players in pairs - they'll be permanent partners for the tournament
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TextInput
              ref={playerInputRef}
              value={playerName}
              onChangeText={setPlayerName}
              placeholder="Player 1 name"
              placeholderTextColor="#9CA3AF"
              style={{
                flex: 1,
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#D1D5DB',
                borderRadius: 16,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 14,
                color: '#111827',
              }}
              onSubmitEditing={() => player2InputRef.current?.focus()}
              returnKeyType="next"
              blurOnSubmit={false}
              enablesReturnKeyAutomatically
            />
            <TextInput
              ref={player2InputRef}
              value={player2Name}
              onChangeText={setPlayer2Name}
              placeholder="Player 2 name"
              placeholderTextColor="#9CA3AF"
              style={{
                flex: 1,
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#D1D5DB',
                borderRadius: 16,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 14,
                color: '#111827',
              }}
              onSubmitEditing={handleAddPair}
              returnKeyType="done"
              blurOnSubmit={false}
              enablesReturnKeyAutomatically
            />
          </View>
          <TouchableOpacity
            onPress={handleAddPair}
            style={{
              backgroundColor: '#EF4444',
              borderRadius: 12,
              paddingVertical: 12,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>
              Add Pair
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            ref={playerInputRef}
            value={playerName}
            onChangeText={setPlayerName}
            placeholder="Player name"
            placeholderTextColor="#9CA3AF"
            style={{
              flex: 1,
              backgroundColor: '#FFFFFF',
              borderWidth: 1,
              borderColor: '#D1D5DB',
              borderRadius: 16,
              paddingHorizontal: 16,
              paddingVertical: 12,
              fontSize: 14,
              color: '#111827',
            }}
            onSubmitEditing={handleAddPlayer}
            returnKeyType="done"
            blurOnSubmit={false}
            enablesReturnKeyAutomatically
          />
          <TouchableOpacity
            onPress={handleAddPlayer}
            style={{
              backgroundColor: '#EF4444',
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 12,
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>
              Add
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Players List */}
      {players.length > 0 && (
        <View style={{ gap: 6 }}>
          {players.map((player) => {
            const genderStyle = getGenderIcon(player.gender);
            const availablePartners = getAvailablePartners(player.id);
            const currentPartner = players.find((p) => p.id === player.partnerId);

            return (
              <View
                key={player.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderWidth: 1,
                  borderColor: '#D1D5DB',
                  borderRadius: 12,
                  padding: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                {/* Gender Toggle */}
                <TouchableOpacity
                  onPress={() => toggleGender(player.id, player.gender)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: genderStyle.bg,
                    borderWidth: 1.5,
                    borderColor: genderStyle.border,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 16, color: genderStyle.text }}>
                    {genderStyle.icon}
                  </Text>
                </TouchableOpacity>

                {/* Player Name */}
                <Text
                  style={{
                    flex: 1,
                    fontSize: 14,
                    fontWeight: '500',
                    color: '#111827',
                  }}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {player.name}
                </Text>

                {/* Partner Indicator (Fixed Partner Mode) */}
                {isFixedPartner && currentPartner && (
                  <View style={{
                    backgroundColor: '#F3F4F6',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 8,
                    maxWidth: 100,
                  }}>
                    <Text
                      style={{
                        fontSize: 11,
                        color: '#6B7280',
                        fontWeight: '600',
                      }}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      ↔ {currentPartner.name}
                    </Text>
                  </View>
                )}

                {/* Delete Button */}
                <TouchableOpacity
                  onPress={() => onRemove(player.id)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <X color="#DC2626" size={16} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
