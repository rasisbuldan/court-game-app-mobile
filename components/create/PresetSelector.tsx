import { View, Text, TouchableOpacity, TextInput, Modal, ScrollView } from 'react-native';
import { useState } from 'react';
import { ChevronDown, Check, Edit3 } from 'lucide-react-native';

interface PresetSelectorProps {
  value: number;
  onChange: (value: number) => void;
  mode: 'points' | 'games';
}

const POINT_PRESETS = [11, 16, 21, 24, 32];
const GAME_PRESETS = [3, 4, 5, 6, 8, 10];

export function PresetSelector({ value, onChange, mode }: PresetSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customValue, setCustomValue] = useState(value.toString());
  const [showCustomInput, setShowCustomInput] = useState(false);

  const presets = mode === 'points' ? POINT_PRESETS : GAME_PRESETS;
  const label = mode === 'points' ? 'Points' : 'Games';
  const isCustom = !presets.includes(value);

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
        <View>
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>
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
        animationType="slide"
        onRequestClose={() => {
          setIsOpen(false);
          setShowCustomInput(false);
        }}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {
            setIsOpen(false);
            setShowCustomInput(false);
          }}
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

                  return (
                    <TouchableOpacity
                      key={preset}
                      onPress={() => {
                        onChange(preset);
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
                        borderBottomWidth: 1,
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
                        {preset} {label}
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

                {/* Custom Option */}
                <TouchableOpacity
                  onPress={() => {
                    setCustomValue(value.toString());
                    setShowCustomInput(true);
                  }}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 20,
                    paddingVertical: 18,
                    backgroundColor: isCustom ? '#FEF2F2' : '#FAFAFA',
                    borderTopWidth: 2,
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
                    <Text style={{ fontSize: 17, fontWeight: '600', color: '#EF4444', letterSpacing: -0.2 }}>
                      Custom Value
                    </Text>
                  </View>
                  {isCustom && (
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
              </ScrollView>
            ) : (
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
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
