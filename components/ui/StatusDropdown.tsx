import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react-native';

type PlayerStatus = 'active' | 'late' | 'departed' | 'no_show';

interface StatusDropdownProps {
  currentStatus: PlayerStatus;
  onStatusChange: (newStatus: PlayerStatus) => void;
  disabled?: boolean;
}

const STATUS_OPTIONS: { value: PlayerStatus; label: string; color: string; description: string }[] = [
  {
    value: 'active',
    label: 'Active',
    color: '#10B981',
    description: 'Player is present and ready to play',
  },
  {
    value: 'late',
    label: 'Late',
    color: '#F59E0B',
    description: 'Player will arrive soon, exclude from current round',
  },
  {
    value: 'departed',
    label: 'Left Early',
    color: '#6B7280',
    description: 'Player has left the tournament',
  },
  {
    value: 'no_show',
    label: 'No Show',
    color: '#EF4444',
    description: 'Player did not arrive',
  },
];

export function StatusDropdown({ currentStatus, onStatusChange, disabled }: StatusDropdownProps) {
  const [modalVisible, setModalVisible] = useState(false);

  const currentOption = STATUS_OPTIONS.find((opt) => opt.value === currentStatus);

  const handleSelect = (status: PlayerStatus) => {
    onStatusChange(status);
    setModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        className="flex-row items-center gap-2 bg-gray-100 rounded-lg px-3 py-2"
        onPress={() => !disabled && setModalVisible(true)}
        disabled={disabled}
      >
        <View
          className="w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: currentOption?.color || '#6B7280' }}
        />
        <Text className="text-sm font-medium text-gray-900 flex-1">
          {currentOption?.label || 'Unknown'}
        </Text>
        <ChevronDown color="#6B7280" size={16} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl pt-6 pb-8">
            <View className="px-6 mb-4">
              <Text className="text-xl font-bold text-gray-900">Change Player Status</Text>
              <Text className="text-sm text-gray-600 mt-1">
                Select the player's current availability
              </Text>
            </View>

            <ScrollView className="max-h-96">
              {STATUS_OPTIONS.map((option) => {
                const isSelected = option.value === currentStatus;

                return (
                  <TouchableOpacity
                    key={option.value}
                    className={`flex-row items-start px-6 py-4 border-b border-gray-100 ${
                      isSelected ? 'bg-primary-50' : 'bg-white'
                    }`}
                    onPress={() => handleSelect(option.value)}
                  >
                    <View className="flex-1 mr-3">
                      <View className="flex-row items-center gap-2 mb-1">
                        <View
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: option.color }}
                        />
                        <Text className="text-base font-semibold text-gray-900">
                          {option.label}
                        </Text>
                      </View>
                      <Text className="text-sm text-gray-600">{option.description}</Text>
                    </View>
                    {isSelected && <Check color="#3B82F6" size={20} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View className="px-6 mt-4">
              <TouchableOpacity
                className="bg-gray-200 rounded-lg py-3"
                onPress={() => setModalVisible(false)}
              >
                <Text className="text-gray-900 font-semibold text-center">Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
