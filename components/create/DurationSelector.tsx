import { View, Text, TouchableOpacity, Modal, ScrollView, Platform, Animated } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check, Clock } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface DurationSelectorProps {
  value: number;
  onChange: (value: number) => void;
}

const DURATION_OPTIONS = [
  { value: 0.5, label: '30 minutes' },
  { value: 1, label: '1 hour' },
  { value: 1.5, label: '1 hour 30 minutes' },
  { value: 2, label: '2 hours' },
  { value: 2.5, label: '2 hours 30 minutes' },
  { value: 3, label: '3 hours' },
  { value: 3.5, label: '3 hours 30 minutes' },
  { value: 4, label: '4 hours' },
];

export function DurationSelector({ value, onChange }: DurationSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(0)).current;

  const selectedOption = DURATION_OPTIONS.find((opt) => opt.value === value);
  const displayLabel = selectedOption?.label || `${value} hours`;

  useEffect(() => {
    if (isOpen) {
      slideAnim.setValue(0);
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 10,
      }).start();
    }
  }, [isOpen, slideAnim]);

  return (
    <>
      <TouchableOpacity
        onPress={() => setIsOpen(true)}
        style={{
          backgroundColor: '#FFFFFF',
          borderWidth: 1,
          borderColor: '#D1D5DB',
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
          <Text style={{ fontSize: 14, fontWeight: '500', color: '#111827' }}>
            {displayLabel}
          </Text>
        </View>
        <ChevronDown color="#6B7280" size={20} />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="none"
        onRequestClose={() => setIsOpen(false)}
      >
        <Animated.View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            justifyContent: 'flex-end',
            opacity: slideAnim,
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setIsOpen(false)}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
          <Animated.View
            style={{
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              width: '100%',
              maxHeight: '75%',
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.15,
              shadowRadius: 20,
              elevation: 10,
              paddingBottom: insets.bottom || 20,
              transform: [{
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [600, 0],
                }),
              }],
            }}
            onStartShouldSetResponder={() => true}
          >
            {/* Drag Handle */}
            <View style={{
              paddingTop: 12,
              paddingBottom: 8,
              alignItems: 'center',
            }}>
              <View style={{
                width: 36,
                height: 5,
                borderRadius: 3,
                backgroundColor: '#D1D5DB',
              }} />
            </View>

            {/* Header */}
            <View style={{
              paddingHorizontal: 20,
              paddingTop: 8,
              paddingBottom: 16,
            }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 4, letterSpacing: 0.3 }}>
                Select Duration
              </Text>
              <Text style={{ fontSize: 13, color: '#6B7280', lineHeight: 18 }}>
                Choose estimated session duration
              </Text>
            </View>

            {/* Options */}
            <ScrollView style={{ maxHeight: 420 }}>
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
                    activeOpacity={0.6}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingHorizontal: 24,
                      paddingVertical: Platform.OS === 'ios' ? 18 : 16,
                      backgroundColor: isSelected ? '#FEF2F2' : '#FFFFFF',
                      borderBottomWidth: isLast ? 0 : 0.5,
                      borderBottomColor: 'rgba(0, 0, 0, 0.1)',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: isSelected ? '600' : '400',
                        color: isSelected ? '#EF4444' : '#111827',
                        letterSpacing: -0.3,
                      }}
                    >
                      {option.label}
                    </Text>
                    {isSelected && (
                      <View style={{
                        width: 26,
                        height: 26,
                        borderRadius: 13,
                        backgroundColor: '#EF4444',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <Check color="#FFFFFF" size={16} strokeWidth={2.5} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </Modal>
    </>
  );
}
