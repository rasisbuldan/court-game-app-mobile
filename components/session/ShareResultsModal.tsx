import { View, Text, Modal, TouchableOpacity, TextInput, Clipboard } from 'react-native';
import { useState } from 'react';
import { X, Copy, Check, Share2, ExternalLink } from 'lucide-react-native';
import Toast from 'react-native-toast-message';

interface ShareResultsModalProps {
  visible: boolean;
  onClose: () => void;
  sessionId: string;
  sessionName: string;
}

export function ShareResultsModal({
  visible,
  onClose,
  sessionId,
  sessionName,
}: ShareResultsModalProps) {
  const [copied, setCopied] = useState(false);

  const resultUrl = `https://courtster.app/result/${sessionId}`;

  const handleCopy = () => {
    Clipboard.setString(resultUrl);
    setCopied(true);
    Toast.show({
      type: 'success',
      text1: 'Link Copied!',
      text2: 'Share it with your friends',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 16,
        }}
      >
        <TouchableOpacity
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          onPress={onClose}
          activeOpacity={1}
        />

        {/* Modal Content */}
        <View
          style={{
            width: '100%',
            maxWidth: 400,
            backgroundColor: '#FFFFFF',
            borderRadius: 24,
            padding: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.15,
            shadowRadius: 24,
            elevation: 10,
          }}
        >
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: '#FEF2F2',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Share2 color="#EF4444" size={22} strokeWidth={2.5} />
              </View>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827' }}>
                Share Results
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                backgroundColor: '#F3F4F6',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X color="#6B7280" size={18} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* Description */}
          <View style={{ marginBottom: 20 }}>
            <View
              style={{
                backgroundColor: '#EFF6FF',
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: '#DBEAFE',
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#1E40AF', marginBottom: 6 }}>
                Share Public Results on Web
              </Text>
              <Text style={{ fontSize: 13, fontWeight: '500', color: '#3B82F6', lineHeight: 18 }}>
                Share the session leaderboard, statistics, and final standings with anyone via web link.
              </Text>
            </View>
          </View>

          {/* Session Name */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Game Session
            </Text>
            <View
              style={{
                backgroundColor: '#F9FAFB',
                borderRadius: 12,
                padding: 14,
                borderWidth: 1,
                borderColor: '#E5E7EB',
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>
                {sessionName}
              </Text>
            </View>
          </View>

          {/* Link Section */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Public Results Link
            </Text>
            <View
              style={{
                backgroundColor: '#F9FAFB',
                borderRadius: 12,
                padding: 14,
                borderWidth: 1,
                borderColor: '#E5E7EB',
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '500',
                  color: '#3B82F6',
                  fontFamily: 'monospace',
                }}
                numberOfLines={2}
                ellipsizeMode="middle"
              >
                {resultUrl}
              </Text>
            </View>
          </View>

          {/* Action Button */}
          <TouchableOpacity
            onPress={handleCopy}
            style={{
              backgroundColor: copied ? '#10B981' : '#EF4444',
              borderRadius: 14,
              paddingVertical: 16,
              paddingHorizontal: 24,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              shadowColor: copied ? '#10B981' : '#EF4444',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            {copied ? (
              <Check color="#FFFFFF" size={20} strokeWidth={2.5} />
            ) : (
              <Copy color="#FFFFFF" size={20} strokeWidth={2.5} />
            )}
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>
              {copied ? 'Link Copied!' : 'Copy Link to Clipboard'}
            </Text>
          </TouchableOpacity>

          {/* Footer Info */}
          <View
            style={{
              marginTop: 16,
              paddingTop: 16,
              borderTopWidth: 1,
              borderTopColor: '#E5E7EB',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <ExternalLink color="#9CA3AF" size={14} strokeWidth={2} />
            <Text style={{ fontSize: 12, fontWeight: '500', color: '#6B7280', flex: 1 }}>
              Opens in web browser with full session details
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}
