import { View, Text, TouchableOpacity, Modal, ScrollView, Platform, Animated, Alert } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check, Lock } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useMaxCourts } from '../../hooks/useSubscription';

interface CourtSelectorProps {
  value: number;
  onChange: (value: number) => void;
  mode: 'sequential' | 'parallel';
}

const COURT_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export function CourtSelector({ value, onChange, mode }: CourtSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Get subscription-based court limit
  const maxCourts = useMaxCourts();

  // Filter options based on mode AND subscription
  let availableOptions = COURT_OPTIONS;

  // Parallel mode restrictions (2-4 courts)
  if (mode === 'parallel') {
    availableOptions = availableOptions.filter(c => c >= 2 && c <= 4);
  }

  // Subscription restrictions (free tier = max 1 court)
  if (maxCourts !== -1) {
    availableOptions = availableOptions.filter(c => c <= maxCourts);
  }

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
        <Text style={{ fontSize: 14, fontWeight: '500', color: '#111827' }}>
          {value} {value === 1 ? 'Court' : 'Courts'}
        </Text>
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
                Select Courts
              </Text>
              <Text style={{ fontSize: 13, color: '#6B7280', lineHeight: 18 }}>
                {mode === 'parallel'
                  ? 'Parallel mode allows 2-4 courts'
                  : maxCourts === 1
                  ? 'Free tier limited to 1 court'
                  : 'Choose number of courts available'}
              </Text>
            </View>

            {/* Options */}
            <ScrollView style={{ maxHeight: 420 }}>
              {availableOptions.map((option, index) => {
                const isSelected = value === option;
                const isLast = index === availableOptions.length - 1 && maxCourts === -1;

                return (
                  <TouchableOpacity
                    key={option}
                    onPress={() => {
                      onChange(option);
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
                      {option} {option === 1 ? 'Court' : 'Courts'}
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

              {/* Locked Options (Free Tier) */}
              {maxCourts !== -1 && COURT_OPTIONS.filter(c => c > maxCourts && (mode !== 'parallel' || (c >= 2 && c <= 4))).length > 0 && (
                <>
                  {/* Upgrade Prompt */}
                  <TouchableOpacity
                    onPress={() => {
                      setIsOpen(false);
                      Alert.alert(
                        'Upgrade to Personal',
                        'Unlock unlimited courts with a Personal subscription.\n\nMonthly: IDR 49,000\nYearly: IDR 299,000',
                        [
                          { text: 'Maybe Later', style: 'cancel' },
                          { text: 'Upgrade', onPress: () => {
                            router.push('/(tabs)/subscription');
                          }}
                        ]
                      );
                    }}
                    style={{
                      marginHorizontal: 24,
                      marginVertical: 12,
                      padding: 16,
                      backgroundColor: '#FEF2F2',
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: '#FCA5A5',
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                      <Lock color="#EF4444" size={16} />
                      <Text style={{ fontSize: 14, fontWeight: '600', color: '#EF4444', marginLeft: 6 }}>
                        Upgrade to unlock more courts
                      </Text>
                    </View>
                    <Text style={{ fontSize: 12, color: '#991B1B', lineHeight: 16 }}>
                      Personal plan: Unlimited courts • IDR 49k/month
                    </Text>
                  </TouchableOpacity>

                  {/* Locked Options */}
                  {COURT_OPTIONS.filter(c => c > maxCourts && (mode !== 'parallel' || (c >= 2 && c <= 4))).map((option, index, arr) => (
                    <View
                      key={`locked-${option}`}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingHorizontal: 24,
                        paddingVertical: Platform.OS === 'ios' ? 18 : 16,
                        backgroundColor: '#F9FAFB',
                        borderBottomWidth: index === arr.length - 1 ? 0 : 0.5,
                        borderBottomColor: 'rgba(0, 0, 0, 0.05)',
                        opacity: 0.5,
                      }}
                    >
                      <Text style={{ fontSize: 16, color: '#9CA3AF' }}>
                        {option} {option === 1 ? 'Court' : 'Courts'}
                      </Text>
                      <Lock color="#9CA3AF" size={18} />
                    </View>
                  ))}
                </>
              )}
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </Modal>
    </>
  );
}
