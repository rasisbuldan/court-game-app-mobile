import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useState } from 'react';
import { ChevronDown, Check, Clock } from 'lucide-react-native';

interface DurationSelectorProps {
  value: number;
  onChange: (value: number) => void;
}

const DURATION_OPTIONS = [
  { value: 0.5, label: '30 minutes' },
  { value: 1, label: '1 hour' },
  { value: 1.5, label: '1h 30m' },
  { value: 2, label: '2 hours' },
  { value: 2.5, label: '2h 30m' },
  { value: 3, label: '3 hours' },
  { value: 3.5, label: '3h 30m' },
  { value: 4, label: '4 hours' },
];

export function DurationSelector({ value, onChange }: DurationSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = DURATION_OPTIONS.find((opt) => opt.value === value);
  const displayLabel = selectedOption?.label || `${value} hours`;

  return (
    <>
      <TouchableOpacity
        onPress={() => setIsOpen(true)}
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderWidth: 1,
          borderColor: 'rgba(209, 213, 219, 0.5)',
          borderRadius: 16,
          paddingHorizontal: 16,
          paddingVertical: 14,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Clock color="#6B7280" size={18} />
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>
            {displayLabel}
          </Text>
        </View>
        <ChevronDown color="#6B7280" size={20} />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 24,
              width: '100%',
              maxWidth: 340,
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 20 },
              shadowOpacity: 0.25,
              shadowRadius: 25,
              elevation: 10,
            }}
            onStartShouldSetResponder={() => true}
          >
            {/* Header */}
            <View style={{
              padding: 20,
              paddingBottom: 16,
              borderBottomWidth: 1,
              borderBottomColor: '#F3F4F6',
              backgroundColor: '#FAFAFA',
            }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 2 }}>
                Select Duration
              </Text>
              <Text style={{ fontSize: 13, color: '#6B7280', lineHeight: 18 }}>
                Choose estimated session duration
              </Text>
            </View>

            {/* Options */}
            <ScrollView style={{ maxHeight: 400 }}>
              {DURATION_OPTIONS.map((option, index) => {
                const isSelected = value === option.value;
                const isLast = index === DURATION_OPTIONS.length - 1;

                return (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    activeOpacity={0.7}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingHorizontal: 20,
                      paddingVertical: 16,
                      backgroundColor: isSelected ? '#FEF2F2' : '#FFFFFF',
                      borderBottomWidth: isLast ? 0 : 1,
                      borderBottomColor: '#F3F4F6',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 17,
                        fontWeight: isSelected ? '600' : '400',
                        color: isSelected ? '#EF4444' : '#111827',
                        letterSpacing: -0.2,
                      }}
                    >
                      {option.label}
                    </Text>
                    {isSelected && (
                      <View style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        backgroundColor: '#EF4444',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <Check color="#FFFFFF" size={16} strokeWidth={3} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
