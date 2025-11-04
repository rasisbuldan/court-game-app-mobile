/**
 * PIN Verification Sheet
 *
 * Modal sheet for entering a 4-digit PIN to access a shared session.
 * Provides a numeric keypad for PIN entry with visual feedback.
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Vibration,
} from 'react-native';
import { Lock, X } from 'lucide-react-native';
import { useSessionSharing } from '../../hooks/useSessionSharing';
import { Logger } from '../../utils/logger';

interface PINVerificationSheetProps {
  shareToken: string;
  onSuccess: () => void;
  onCancel: () => void;
  visible: boolean;
}

export function PINVerificationSheet({
  shareToken,
  onSuccess,
  onCancel,
  visible,
}: PINVerificationSheetProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  const { verifySharePIN } = useSessionSharing();

  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (visible) {
      setPin('');
      setError('');
    }
  }, [visible]);

  // Handle PIN digit input
  const handleDigitPress = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      setError('');

      // Auto-verify when 4 digits entered
      if (newPin.length === 4) {
        verifyPIN(newPin);
      }
    }
  };

  // Handle backspace
  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
    setError('');
  };

  // Verify PIN
  const verifyPIN = async (pinToVerify: string) => {
    try {
      Logger.info('Verifying PIN for shared session', {
        action: 'verify_pin_ui',
        shareToken,
      });

      const result = await verifySharePIN.mutateAsync({
        shareToken,
        pin: pinToVerify,
      });

      if (result) {
        // Success - notify parent
        onSuccess();
      } else {
        // Invalid PIN - show error and shake
        setError('Incorrect PIN. Please try again.');
        setPin('');
        Vibration.vibrate(400);

        // Shake animation
        Animated.sequence([
          Animated.timing(shakeAnimation, {
            toValue: 10,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnimation, {
            toValue: -10,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnimation, {
            toValue: 10,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnimation, {
            toValue: 0,
            duration: 50,
            useNativeDriver: true,
          }),
        ]).start();
      }
    } catch (err) {
      Logger.error('PIN verification failed', err as Error, {
        action: 'verify_pin_ui',
        shareToken,
      });
      setError('Verification failed. Please try again.');
      setPin('');
    }
  };

  if (!visible) return null;

  return (
    <View className="absolute inset-0 bg-black/50 items-center justify-center z-50">
      <View className="bg-white rounded-3xl p-8 mx-6 w-full max-w-sm">
        {/* Header */}
        <View className="items-center mb-8">
          <View className="w-16 h-16 rounded-full bg-primary-100 items-center justify-center mb-4">
            <Lock size={32} color="#3B82F6" strokeWidth={2} />
          </View>

          <Text className="text-2xl font-bold text-gray-900 mb-2">
            Enter PIN
          </Text>

          <Text className="text-center text-gray-600 text-base">
            This session is protected. Enter the 4-digit PIN to view results.
          </Text>
        </View>

        {/* PIN Display */}
        <Animated.View
          style={{ transform: [{ translateX: shakeAnimation }] }}
          className="flex-row justify-center gap-4 mb-2"
        >
          {[0, 1, 2, 3].map((index) => (
            <View
              key={index}
              className={`w-14 h-14 rounded-2xl border-2 items-center justify-center ${
                pin.length > index
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-300 bg-gray-50'
              }`}
            >
              {pin.length > index && (
                <View className="w-3 h-3 rounded-full bg-primary-500" />
              )}
            </View>
          ))}
        </Animated.View>

        {/* Error Message */}
        {error ? (
          <Text className="text-center text-red-500 text-sm mb-6 h-5">
            {error}
          </Text>
        ) : (
          <View className="h-5 mb-6" />
        )}

        {/* Numeric Keypad */}
        <View className="gap-3">
          {/* Row 1: 1, 2, 3 */}
          <View className="flex-row gap-3">
            {['1', '2', '3'].map((digit) => (
              <TouchableOpacity
                key={digit}
                onPress={() => handleDigitPress(digit)}
                disabled={verifySharePIN.isPending}
                className="flex-1 h-16 rounded-2xl bg-gray-100 active:bg-gray-200 items-center justify-center"
                activeOpacity={0.7}
              >
                <Text className="text-2xl font-semibold text-gray-900">
                  {digit}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Row 2: 4, 5, 6 */}
          <View className="flex-row gap-3">
            {['4', '5', '6'].map((digit) => (
              <TouchableOpacity
                key={digit}
                onPress={() => handleDigitPress(digit)}
                disabled={verifySharePIN.isPending}
                className="flex-1 h-16 rounded-2xl bg-gray-100 active:bg-gray-200 items-center justify-center"
                activeOpacity={0.7}
              >
                <Text className="text-2xl font-semibold text-gray-900">
                  {digit}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Row 3: 7, 8, 9 */}
          <View className="flex-row gap-3">
            {['7', '8', '9'].map((digit) => (
              <TouchableOpacity
                key={digit}
                onPress={() => handleDigitPress(digit)}
                disabled={verifySharePIN.isPending}
                className="flex-1 h-16 rounded-2xl bg-gray-100 active:bg-gray-200 items-center justify-center"
                activeOpacity={0.7}
              >
                <Text className="text-2xl font-semibold text-gray-900">
                  {digit}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Row 4: Cancel, 0, Backspace */}
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={onCancel}
              disabled={verifySharePIN.isPending}
              className="flex-1 h-16 rounded-2xl bg-gray-100 active:bg-gray-200 items-center justify-center"
              activeOpacity={0.7}
            >
              <X size={24} color="#6B7280" strokeWidth={2.5} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleDigitPress('0')}
              disabled={verifySharePIN.isPending}
              className="flex-1 h-16 rounded-2xl bg-gray-100 active:bg-gray-200 items-center justify-center"
              activeOpacity={0.7}
            >
              <Text className="text-2xl font-semibold text-gray-900">0</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleBackspace}
              disabled={verifySharePIN.isPending || pin.length === 0}
              className="flex-1 h-16 rounded-2xl bg-gray-100 active:bg-gray-200 items-center justify-center"
              activeOpacity={0.7}
            >
              <Text className="text-2xl font-semibold text-gray-900">⌫</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Loading Indicator */}
        {verifySharePIN.isPending && (
          <View className="absolute inset-0 bg-white/90 rounded-3xl items-center justify-center">
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text className="text-gray-600 mt-4 font-medium">
              Verifying...
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
