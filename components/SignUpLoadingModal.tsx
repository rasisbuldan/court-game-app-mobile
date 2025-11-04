import React, { useEffect, useRef } from 'react';
import { View, Text, Modal, ActivityIndicator } from 'react-native';

export type SignUpProgress = 'creating' | 'profile' | 'settings' | 'complete';

interface Props {
  visible: boolean;
  progress: SignUpProgress | null;
}

const progressSteps = {
  creating: 'Creating your account...',
  profile: 'Setting up your profile...',
  settings: 'Configuring settings...',
  complete: 'Almost done...',
};

const progressSubtext = {
  creating: 'This may take a few seconds',
  profile: 'Finalizing your details',
  settings: 'Setting up preferences',
  complete: 'Redirecting you now',
};

export function SignUpLoadingModal({ visible, progress }: Props) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Safety timeout: If modal is stuck open for > 30 seconds, log warning
    // This helps debug if something goes wrong
    if (visible) {
      timeoutRef.current = setTimeout(() => {
        console.warn('[SignUpLoadingModal] Modal has been open for 30+ seconds. Progress:', progress);
      }, 30000);
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [visible, progress]);

  // Don't render modal if not visible
  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {
        // Prevent dismissal on Android back button during sign-up
        console.log('[SignUpLoadingModal] Back button pressed, preventing dismissal during sign-up');
      }}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <View style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          padding: 32,
          minWidth: 280,
          maxWidth: 320,
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}>
          <ActivityIndicator size="large" color="#3B82F6" />

          <Text style={{
            marginTop: 20,
            fontSize: 18,
            fontWeight: '600',
            color: '#111827',
            textAlign: 'center',
          }}>
            {progress ? progressSteps[progress] : 'Loading...'}
          </Text>

          <Text style={{
            marginTop: 8,
            fontSize: 14,
            color: '#6B7280',
            textAlign: 'center',
          }}>
            {progress ? progressSubtext[progress] : 'Please wait'}
          </Text>
        </View>
      </View>
    </Modal>
  );
}
