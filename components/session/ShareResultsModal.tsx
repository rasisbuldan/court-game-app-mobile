import { View, Text, Modal, TouchableOpacity, Clipboard, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { X, Copy, Check, Share2, ExternalLink, Lock, RefreshCw, EyeOff } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useSessionSharing } from '../../hooks/useSessionSharing';

interface ShareResultsModalProps {
  visible: boolean;
  onClose: () => void;
  sessionId: string;
  sessionName: string;
  isPublic?: boolean;
  shareToken?: string | null;
}

export function ShareResultsModal({
  visible,
  onClose,
  sessionId,
  sessionName,
  isPublic = false,
  shareToken: existingShareToken = null,
}: ShareResultsModalProps) {
  const [copied, setCopied] = useState(false);
  const [pinCopied, setPinCopied] = useState(false);
  const [shareData, setShareData] = useState<{
    shareToken: string;
    pin: string;
    shareUrl: string;
  } | null>(null);

  const { enableSharing, disableSharing, regeneratePIN } = useSessionSharing();

  // If already shared, build share URL from existing token
  useEffect(() => {
    if (isPublic && existingShareToken) {
      setShareData({
        shareToken: existingShareToken,
        pin: '****', // Hidden - user needs to regenerate to see
        shareUrl: `courtster://result/${existingShareToken}`,
      });
    } else {
      setShareData(null);
    }
  }, [isPublic, existingShareToken]);

  const handleEnableSharing = async () => {
    try {
      const result = await enableSharing.mutateAsync(sessionId);
      setShareData(result);

      Toast.show({
        type: 'success',
        text1: 'Sharing Enabled!',
        text2: `PIN: ${result.pin}`,
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to Enable Sharing',
        text2: 'Please try again',
      });
    }
  };

  const handleDisableSharing = async () => {
    try {
      await disableSharing.mutateAsync(sessionId);
      setShareData(null);

      Toast.show({
        type: 'success',
        text1: 'Sharing Disabled',
        text2: 'Public access has been revoked',
      });

      onClose();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to Disable Sharing',
        text2: 'Please try again',
      });
    }
  };

  const handleRegeneratePIN = async () => {
    try {
      const newPin = await regeneratePIN.mutateAsync(sessionId);

      if (shareData) {
        setShareData({ ...shareData, pin: newPin });
      }

      Toast.show({
        type: 'success',
        text1: 'PIN Regenerated',
        text2: `New PIN: ${newPin}`,
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to Regenerate PIN',
        text2: 'Please try again',
      });
    }
  };

  const handleCopyLink = () => {
    if (shareData) {
      Clipboard.setString(shareData.shareUrl);
      setCopied(true);
      Toast.show({
        type: 'success',
        text1: 'Link Copied!',
        text2: 'Share it with your friends',
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyPIN = () => {
    if (shareData && shareData.pin !== '****') {
      Clipboard.setString(shareData.pin);
      setPinCopied(true);
      Toast.show({
        type: 'success',
        text1: 'PIN Copied!',
        text2: 'Share it with the link',
      });
      setTimeout(() => setPinCopied(false), 2000);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 justify-center items-center px-4">
        <TouchableOpacity
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          onPress={onClose}
          activeOpacity={1}
        />

        {/* Modal Content */}
        <View className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-xl bg-primary-50 items-center justify-center">
                <Share2 color="#3B82F6" size={22} strokeWidth={2.5} />
              </View>
              <Text className="text-xl font-bold text-gray-900">Share Results</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-lg bg-gray-100 items-center justify-center"
            >
              <X color="#6B7280" size={18} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* Session Name */}
          <View className="mb-5">
            <Text className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
              Session
            </Text>
            <View className="bg-gray-50 rounded-xl p-3.5 border border-gray-200">
              <Text className="text-base font-semibold text-gray-900">{sessionName}</Text>
            </View>
          </View>

          {/* Not Shared State */}
          {!shareData && (
            <>
              <View className="mb-5">
                <View className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
                  <View className="flex-row items-start gap-2">
                    <Lock size={16} color="#2563EB" strokeWidth={2} />
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-blue-900 mb-1">
                        PIN-Protected Sharing
                      </Text>
                      <Text className="text-sm text-blue-700 leading-5">
                        Generate a secure link and 4-digit PIN to share results with anyone. They'll
                        need the PIN to view.
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleEnableSharing}
                disabled={enableSharing.isPending}
                className="bg-primary-500 rounded-2xl py-4 px-6 flex-row items-center justify-center gap-2 shadow-lg"
                activeOpacity={0.8}
              >
                {enableSharing.isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Share2 color="#FFFFFF" size={20} strokeWidth={2.5} />
                )}
                <Text className="text-white text-base font-bold">
                  {enableSharing.isPending ? 'Enabling...' : 'Enable Sharing'}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* Shared State */}
          {shareData && (
            <>
              {/* Share Link */}
              <View className="mb-4">
                <Text className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                  Share Link
                </Text>
                <View className="bg-gray-50 rounded-xl p-3.5 border border-gray-200 mb-2">
                  <Text className="text-sm font-medium text-primary-600 font-mono" numberOfLines={1}>
                    {shareData.shareUrl}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={handleCopyLink}
                  className={`rounded-xl py-3 px-4 flex-row items-center justify-center gap-2 ${
                    copied ? 'bg-green-500' : 'bg-primary-500'
                  }`}
                  activeOpacity={0.8}
                >
                  {copied ? (
                    <Check color="#FFFFFF" size={18} strokeWidth={2.5} />
                  ) : (
                    <Copy color="#FFFFFF" size={18} strokeWidth={2.5} />
                  )}
                  <Text className="text-white font-bold">
                    {copied ? 'Copied!' : 'Copy Link'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* PIN Display */}
              <View className="mb-5">
                <Text className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                  Access PIN
                </Text>
                <View className="bg-gray-50 rounded-xl p-4 border border-gray-200 mb-2">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <Lock size={18} color="#6B7280" strokeWidth={2} />
                      <Text className="text-2xl font-bold text-gray-900 tracking-widest">
                        {shareData.pin}
                      </Text>
                    </View>
                    {shareData.pin !== '****' && (
                      <TouchableOpacity
                        onPress={handleCopyPIN}
                        className={`px-3 py-1.5 rounded-lg ${
                          pinCopied ? 'bg-green-100' : 'bg-gray-200'
                        }`}
                        activeOpacity={0.7}
                      >
                        <Text
                          className={`text-xs font-bold ${
                            pinCopied ? 'text-green-700' : 'text-gray-700'
                          }`}
                        >
                          {pinCopied ? 'Copied' : 'Copy'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {shareData.pin === '****' ? (
                  <TouchableOpacity
                    onPress={handleRegeneratePIN}
                    disabled={regeneratePIN.isPending}
                    className="bg-gray-100 rounded-xl py-3 px-4 flex-row items-center justify-center gap-2"
                    activeOpacity={0.7}
                  >
                    {regeneratePIN.isPending ? (
                      <ActivityIndicator color="#6B7280" size="small" />
                    ) : (
                      <EyeOff size={16} color="#6B7280" strokeWidth={2} />
                    )}
                    <Text className="text-gray-700 font-semibold text-sm">
                      {regeneratePIN.isPending ? 'Generating...' : 'Show New PIN'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={handleRegeneratePIN}
                    disabled={regeneratePIN.isPending}
                    className="bg-gray-100 rounded-xl py-3 px-4 flex-row items-center justify-center gap-2"
                    activeOpacity={0.7}
                  >
                    {regeneratePIN.isPending ? (
                      <ActivityIndicator color="#6B7280" size="small" />
                    ) : (
                      <RefreshCw size={16} color="#6B7280" strokeWidth={2} />
                    )}
                    <Text className="text-gray-700 font-semibold text-sm">
                      {regeneratePIN.isPending ? 'Regenerating...' : 'Regenerate PIN'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Warning Notice */}
              <View className="bg-yellow-50 rounded-xl p-3 mb-4 border border-yellow-200">
                <Text className="text-xs text-yellow-800 leading-5">
                  Share both the link and PIN with others. The PIN is required to view results.
                </Text>
              </View>

              {/* Disable Sharing */}
              <TouchableOpacity
                onPress={handleDisableSharing}
                disabled={disableSharing.isPending}
                className="border-2 border-red-200 rounded-xl py-3 px-4 flex-row items-center justify-center gap-2"
                activeOpacity={0.7}
              >
                {disableSharing.isPending ? (
                  <ActivityIndicator color="#DC2626" size="small" />
                ) : (
                  <X size={16} color="#DC2626" strokeWidth={2} />
                )}
                <Text className="text-red-600 font-bold text-sm">
                  {disableSharing.isPending ? 'Disabling...' : 'Disable Sharing'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
