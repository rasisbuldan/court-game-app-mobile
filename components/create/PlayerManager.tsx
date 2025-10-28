import { View, Text, TextInput, TouchableOpacity, FlatList, Platform } from 'react-native';
import { useState } from 'react';
import { X, User } from 'lucide-react-native';
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
}: PlayerManagerProps) {
  const [playerName, setPlayerName] = useState('');
  const [player2Name, setPlayer2Name] = useState('');

  const isFixedPartner = gameType === 'fixed_partner';

  const handleAddPlayer = () => {
    if (playerName.trim()) {
      try {
        onAdd(playerName.trim());
        setPlayerName('');
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
        <TouchableOpacity
          onPress={onImport}
          style={{
            backgroundColor: 'rgba(55, 65, 81, 0.85)',
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 6,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#FFFFFF' }}>
            Import from Reclub
          </Text>
        </TouchableOpacity>
      </View>

      {/* Add Player Form */}
      {isFixedPartner ? (
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TextInput
              value={playerName}
              onChangeText={setPlayerName}
              placeholder="Player 1 name"
              placeholderTextColor="#9CA3AF"
              style={{
                flex: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                borderWidth: 1,
                borderColor: 'rgba(209, 213, 219, 0.5)',
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontSize: 14,
                color: '#111827',
              }}
              onSubmitEditing={handleAddPair}
              returnKeyType="next"
            />
            <TextInput
              value={player2Name}
              onChangeText={setPlayer2Name}
              placeholder="Player 2 name"
              placeholderTextColor="#9CA3AF"
              style={{
                flex: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                borderWidth: 1,
                borderColor: 'rgba(209, 213, 219, 0.5)',
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontSize: 14,
                color: '#111827',
              }}
              onSubmitEditing={handleAddPair}
              returnKeyType="done"
            />
          </View>
          <TouchableOpacity
            onPress={handleAddPair}
            style={{
              backgroundColor: '#EF4444',
              borderRadius: 12,
              paddingVertical: 10,
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
            value={playerName}
            onChangeText={setPlayerName}
            placeholder="Player name"
            placeholderTextColor="#9CA3AF"
            style={{
              flex: 1,
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              borderWidth: 1,
              borderColor: 'rgba(209, 213, 219, 0.5)',
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 10,
              fontSize: 14,
              color: '#111827',
            }}
            onSubmitEditing={handleAddPlayer}
            returnKeyType="done"
          />
          <TouchableOpacity
            onPress={handleAddPlayer}
            style={{
              backgroundColor: '#EF4444',
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 10,
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
                  backgroundColor: 'rgba(255, 255, 255, 0.5)',
                  borderWidth: 1,
                  borderColor: 'rgba(209, 213, 219, 0.5)',
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
                >
                  {player.name}
                </Text>

                {/* Partner Indicator/Selector (Fixed Partner Mode) */}
                {isFixedPartner && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {currentPartner ? (
                      <Text
                        style={{
                          fontSize: 12,
                          color: '#6B7280',
                          fontWeight: '500',
                        }}
                        numberOfLines={1}
                      >
                        ↔ {currentPartner.name}
                      </Text>
                    ) : (
                      <Text style={{ fontSize: 12, color: '#9CA3AF' }}>No partner</Text>
                    )}
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
