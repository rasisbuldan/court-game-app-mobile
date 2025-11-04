/**
 * Public Results Page
 *
 * Displays shared session results accessible via share link.
 * Requires PIN verification before showing results.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Lock, RefreshCw } from 'lucide-react-native';
import { useSessionSharing } from '../../hooks/useSessionSharing';
import { PINVerificationSheet } from '../../components/session/PINVerificationSheet';
import { PublicLeaderboard } from '../../components/session/PublicLeaderboard';
import { Logger } from '../../utils/logger';

export default function PublicResultsPage() {
  const { shareToken } = useLocalSearchParams<{ shareToken: string }>();
  const router = useRouter();

  const [isPINVerified, setIsPINVerified] = useState(false);
  const [showPINSheet, setShowPINSheet] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const { useSharedSession, checkTokenVerified } = useSessionSharing();

  const {
    data: session,
    isLoading: isLoadingSession,
    error: sessionError,
    refetch,
  } = useSharedSession(isPINVerified ? shareToken : undefined);

  // Check if token is already verified locally
  useEffect(() => {
    const checkVerification = async () => {
      if (!shareToken) {
        setIsChecking(false);
        return;
      }

      try {
        Logger.info('Checking if share token is verified', {
          action: 'check_token_verified',
          shareToken,
        });

        const isVerified = await checkTokenVerified(shareToken);

        if (isVerified) {
          // Token already verified - show results directly
          setIsPINVerified(true);
          setShowPINSheet(false);
        } else {
          // Need PIN verification
          setShowPINSheet(true);
        }
      } catch (error) {
        Logger.error('Failed to check token verification', error as Error, {
          action: 'check_token_verified',
          shareToken,
        });
        setShowPINSheet(true);
      } finally {
        setIsChecking(false);
      }
    };

    checkVerification();
  }, [shareToken]);

  // Handle successful PIN verification
  const handlePINSuccess = () => {
    Logger.info('PIN verified successfully', {
      action: 'pin_verification_success',
      shareToken,
    });

    setIsPINVerified(true);
    setShowPINSheet(false);
  };

  // Handle cancel PIN verification
  const handlePINCancel = () => {
    Logger.info('PIN verification cancelled', {
      action: 'pin_verification_cancelled',
      shareToken,
    });

    router.back();
  };

  // Invalid share token
  if (!shareToken) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-20 h-20 rounded-full bg-red-100 items-center justify-center mb-6">
            <Lock size={40} color="#DC2626" strokeWidth={2} />
          </View>

          <Text className="text-2xl font-bold text-gray-900 mb-3 text-center">
            Invalid Share Link
          </Text>

          <Text className="text-base text-gray-600 mb-8 text-center leading-6">
            This link is not valid. Please check the link and try again.
          </Text>

          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-primary-500 rounded-xl py-3 px-6"
            activeOpacity={0.8}
          >
            <Text className="text-white font-bold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Checking verification status
  if (isChecking) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="text-gray-600 mt-4">Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Session not found or error
  if (isPINVerified && sessionError) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-20 h-20 rounded-full bg-red-100 items-center justify-center mb-6">
            <Lock size={40} color="#DC2626" strokeWidth={2} />
          </View>

          <Text className="text-2xl font-bold text-gray-900 mb-3 text-center">
            Session Not Found
          </Text>

          <Text className="text-base text-gray-600 mb-8 text-center leading-6">
            This session may have been deleted or is no longer shared.
          </Text>

          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-primary-500 rounded-xl py-3 px-6"
            activeOpacity={0.8}
          >
            <Text className="text-white font-bold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Session not found (no error but no data)
  if (isPINVerified && !isLoadingSession && !session) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-20 h-20 rounded-full bg-yellow-100 items-center justify-center mb-6">
            <Lock size={40} color="#F59E0B" strokeWidth={2} />
          </View>

          <Text className="text-2xl font-bold text-gray-900 mb-3 text-center">
            No Results Available
          </Text>

          <Text className="text-base text-gray-600 mb-8 text-center leading-6">
            This session doesn't have any results yet, or sharing has been disabled.
          </Text>

          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => router.back()}
              className="bg-gray-200 rounded-xl py-3 px-6"
              activeOpacity={0.8}
            >
              <Text className="text-gray-700 font-bold">Go Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => refetch()}
              className="bg-primary-500 rounded-xl py-3 px-6 flex-row items-center gap-2"
              activeOpacity={0.8}
            >
              <RefreshCw size={18} color="#FFFFFF" strokeWidth={2} />
              <Text className="text-white font-bold">Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-3">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color="#6B7280" strokeWidth={2.5} />
          </TouchableOpacity>

          <View className="flex-1">
            <Text className="text-lg font-bold text-gray-900">Shared Results</Text>
            {session && (
              <Text className="text-sm text-gray-600" numberOfLines={1}>
                {session.session_name}
              </Text>
            )}
          </View>

          {isPINVerified && (
            <View className="bg-green-100 px-3 py-1.5 rounded-full">
              <Text className="text-green-700 text-xs font-bold">Verified</Text>
            </View>
          )}
        </View>
      </View>

      {/* Content */}
      {isPINVerified && session ? (
        <PublicLeaderboard session={session} isLoading={isLoadingSession} />
      ) : (
        <View className="flex-1 items-center justify-center px-6">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="text-gray-600 mt-4">Loading results...</Text>
        </View>
      )}

      {/* PIN Verification Sheet */}
      <PINVerificationSheet
        shareToken={shareToken}
        visible={showPINSheet}
        onSuccess={handlePINSuccess}
        onCancel={handlePINCancel}
      />
    </SafeAreaView>
  );
}
