import { View, Text, TouchableOpacity, TextInput, Modal, ScrollView, Platform, Animated, KeyboardAvoidingView } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check, Edit3 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface PresetSelectorProps {
  value: number;
  onChange: (value: number) => void;
  mode: 'points' | 'games';
}

const POINT_PRESETS = [4, 11, 16, 21, 24, 32];
const GAME_PRESETS = [3, 4, 5, 6, 8, 10];

export function PresetSelector({ value, onChange, mode }: PresetSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customValue, setCustomValue] = useState(value.toString());
  const [showCustomInput, setShowCustomInput] = useState(false);
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(0)).current;

  const presets = mode === 'points' ? POINT_PRESETS : GAME_PRESETS;
  const label = mode === 'points' ? 'Points' : 'Games';
  const isCustom = !presets.includes(value);

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

  const handleCustomSubmit = () => {
    const num = parseInt(customValue) || (mode === 'points' ? 21 : 6);
    onChange(num);
    setShowCustomInput(false);
    setIsOpen(false);
  };

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
        <View>
          <Text style={{ fontSize: 14, fontWeight: '500', color: '#111827' }}>
            {value} {label}
          </Text>
          {isCustom && (
            <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>Custom</Text>
          )}
        </View>
        <ChevronDown color="#6B7280" size={20} />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="none"
        onRequestClose={() => {
          setIsOpen(false);
          setShowCustomInput(false);
        }}
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
            onPress={() => {
              setIsOpen(false);
              setShowCustomInput(false);
            }}
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
                Select {label}
              </Text>
              <Text style={{ fontSize: 13, color: '#6B7280', lineHeight: 18 }}>
                {showCustomInput ? `Enter your custom ${label.toLowerCase()} value` : 'Choose a preset or enter custom value'}
              </Text>
            </View>

            {!showCustomInput ? (
              <ScrollView style={{ maxHeight: 400 }}>
                {/* Preset Options */}
                {presets.map((preset, index) => {
                  const isSelected = value === preset;
                  const isLast = index === presets.length - 1;

                  return (
                    <TouchableOpacity
                      key={preset}
                      onPress={() => {
                        onChange(preset);
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
                        {preset} {label}
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

                {/* Custom Option */}
                <TouchableOpacity
                  onPress={() => {
                    setCustomValue(value.toString());
                    setShowCustomInput(true);
                  }}
                  activeOpacity={0.6}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 24,
                    paddingVertical: Platform.OS === 'ios' ? 20 : 18,
                    backgroundColor: isCustom ? '#FEF2F2' : '#FAFAFA',
                    borderTopWidth: 1.5,
                    borderTopColor: '#E5E7EB',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: '#FEE2E2',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Edit3 color="#EF4444" size={16} strokeWidth={2.5} />
                    </View>
                    <Text style={{ fontSize: 18, fontWeight: '600', color: '#EF4444', letterSpacing: -0.3 }}>
                      Custom Value
                    </Text>
                  </View>
                  {isCustom && (
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
              </ScrollView>
            ) : (
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
              >
                <View style={{ padding: 20, gap: 16 }}>
                  <TextInput
                    value={customValue}
                    onChangeText={setCustomValue}
                    keyboardType="number-pad"
                    autoFocus
                    placeholder={`Enter ${label.toLowerCase()}`}
                    placeholderTextColor="#9CA3AF"
                    style={{
                      backgroundColor: '#F9FAFB',
                      borderWidth: 2,
                      borderColor: '#EF4444',
                      borderRadius: 14,
                      paddingHorizontal: 18,
                      paddingVertical: 14,
                      fontSize: 18,
                      fontWeight: '600',
                      color: '#111827',
                      textAlign: 'center',
                    }}
                  />

                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <TouchableOpacity
                      onPress={() => setShowCustomInput(false)}
                      activeOpacity={0.7}
                      style={{
                        flex: 1,
                        backgroundColor: '#F3F4F6',
                        borderRadius: 14,
                        paddingVertical: 14,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151' }}>
                        Back
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleCustomSubmit}
                      activeOpacity={0.7}
                      style={{
                        flex: 1,
                        backgroundColor: '#EF4444',
                        borderRadius: 14,
                        paddingVertical: 14,
                        alignItems: 'center',
                        shadowColor: '#EF4444',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 4,
                      }}
                    >
                      <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF' }}>
                        Apply
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </KeyboardAvoidingView>
            )}
          </Animated.View>
        </Animated.View>
      </Modal>
    </>
  );
}
