import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react-native';

interface CourtSelectorProps {
  value: number;
  onChange: (value: number) => void;
  mode: 'sequential' | 'parallel';
}

const COURT_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export function CourtSelector({ value, onChange, mode }: CourtSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Filter options based on mode
  const availableOptions = mode === 'parallel'
    ? COURT_OPTIONS.filter(c => c >= 2 && c <= 4)
    : COURT_OPTIONS;

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
        <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>
          {value} {value === 1 ? 'Court' : 'Courts'}
        </Text>
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
                Select Courts
              </Text>
              <Text style={{ fontSize: 13, color: '#6B7280', lineHeight: 18 }}>
                {mode === 'parallel'
                  ? 'Parallel mode allows 2-4 courts'
                  : 'Choose number of courts available'}
              </Text>
            </View>

            {/* Options */}
            <ScrollView style={{ maxHeight: 360 }}>
              {availableOptions.map((option, index) => {
                const isSelected = value === option;
                const isLast = index === availableOptions.length - 1;

                return (
                  <TouchableOpacity
                    key={option}
                    onPress={() => {
                      onChange(option);
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
                      {option} {option === 1 ? 'Court' : 'Courts'}
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
