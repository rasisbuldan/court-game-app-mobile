import { View, Text, TouchableOpacity, Modal, Platform, Animated } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { Calendar, Clock } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';

interface DateTimePickerModalProps {
  dateValue: string | null; // ISO date string (YYYY-MM-DD) or null
  timeValue: string | null; // Time string (HH:MM) or null
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
  minimumDate?: Date;
  placeholder?: string;
}

export function DateTimePickerModal({
  dateValue,
  timeValue,
  onDateChange,
  onTimeChange,
  minimumDate,
  placeholder = 'Select date & time',
}: DateTimePickerModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempDateTime, setTempDateTime] = useState<Date>(new Date());
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(0)).current;

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

  // Parse current values to Date object
  const getCurrentDateTime = () => {
    try {
      if (dateValue && timeValue) {
        const [hours, minutes] = timeValue.split(':').map(Number);
        // Parse date parts to avoid timezone issues
        const [year, month, day] = dateValue.split('-').map(Number);
        const date = new Date(year, month - 1, day, hours, minutes, 0, 0);
        return date;
      }
    } catch (e) {
      console.error('Error parsing datetime:', e);
    }
    return minimumDate || new Date();
  };

  // Format display label
  const getDisplayLabel = () => {
    if (dateValue && timeValue) {
      try {
        // Parse date parts to avoid timezone issues
        const [year, month, day] = dateValue.split('-').map(Number);
        const [hours, minutes] = timeValue.split(':').map(Number);
        const date = new Date(year, month - 1, day);

        const dateStr = date.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        });

        const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        const period = hours < 12 ? 'AM' : 'PM';
        const timeStr = `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;

        return `${dateStr}, ${timeStr}`;
      } catch (e) {
        console.error('Error formatting datetime:', e);
      }
    }
    return placeholder;
  };

  // Handle modal open
  const handleOpen = () => {
    setTempDateTime(getCurrentDateTime());
    setIsOpen(true);
  };

  // Handle datetime change (iOS only, inline with picker)
  const handleChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setTempDateTime(selectedDate);
    }
  };

  // Handle Done button
  const handleDone = () => {
    // Extract local date components to avoid timezone conversion
    const year = tempDateTime.getFullYear();
    const month = (tempDateTime.getMonth() + 1).toString().padStart(2, '0');
    const day = tempDateTime.getDate().toString().padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const hours = tempDateTime.getHours().toString().padStart(2, '0');
    const minutes = tempDateTime.getMinutes().toString().padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;

    onDateChange(dateStr);
    onTimeChange(timeStr);
    setIsOpen(false);
  };

  // Handle Cancel button
  const handleCancel = () => {
    setIsOpen(false);
  };

  return (
    <>
      <TouchableOpacity
        onPress={handleOpen}
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
        <Text style={{ fontSize: 14, fontWeight: '500', color: (dateValue && timeValue) ? '#111827' : '#9CA3AF' }}>
          {getDisplayLabel()}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Calendar color="#6B7280" size={18} />
          <Clock color="#6B7280" size={16} />
        </View>
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="none"
        onRequestClose={handleCancel}
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
            onPress={handleCancel}
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
                Select Date & Time
              </Text>
              <Text style={{ fontSize: 13, color: '#6B7280', lineHeight: 18 }}>
                Choose when your session will start
              </Text>
            </View>

            {/* Native iOS DateTime Picker */}
            {Platform.OS === 'ios' && (
              <View style={{ paddingHorizontal: 20, paddingVertical: 10 }}>
                <DateTimePicker
                  value={tempDateTime}
                  mode="datetime"
                  display="spinner"
                  onChange={handleChange}
                  minimumDate={minimumDate}
                  minuteInterval={5}
                  textColor="#111827"
                  style={{ height: 200 }}
                />
              </View>
            )}

            {/* Action Buttons */}
            <View style={{
              flexDirection: 'row',
              gap: 14,
              paddingHorizontal: 20,
              paddingTop: 16,
              paddingBottom: 8,
            }}>
              <TouchableOpacity
                onPress={handleCancel}
                activeOpacity={0.6}
                style={{
                  flex: 1,
                  backgroundColor: '#F3F4F6',
                  borderRadius: 14,
                  paddingVertical: Platform.OS === 'ios' ? 16 : 14,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#374151' }}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleDone}
                activeOpacity={0.6}
                style={{
                  flex: 1,
                  backgroundColor: '#EF4444',
                  borderRadius: 14,
                  paddingVertical: Platform.OS === 'ios' ? 16 : 14,
                  alignItems: 'center',
                  shadowColor: '#EF4444',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFFFFF' }}>
                  Done
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    </>
  );
}
