/**
 * Subscription Simulator - Dev Tool
 *
 * UI for testing different subscription and payment states.
 * Only accessible for whitelisted test accounts.
 */

import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react-native';
import {
  type SimulatorPreset,
  type SimulatorState,
  isSimulatorAllowed,
  loadSimulatorState,
  applyPreset,
  toggleSimulator,
  clearSimulatorState,
  getAvailablePresets,
  getPresetLabel,
  getPresetDescription,
} from '../../utils/accountSimulator';
import { Logger } from '../../utils/logger';
import { useAuth } from '../../hooks/useAuth';
import Toast from 'react-native-toast-message';

export function SubscriptionSimulator() {
  const { user } = useAuth();
  const [simulatorState, setSimulatorState] = useState<SimulatorState | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAllowed, setIsAllowed] = useState(false);

  // Check if user is allowed to use simulator
  useEffect(() => {
    const allowed = isSimulatorAllowed(user?.email);
    setIsAllowed(allowed);

    if (allowed) {
      loadState();
    }
  }, [user?.email]);

  const loadState = async () => {
    try {
      const state = await loadSimulatorState();
      setSimulatorState(state);
    } catch (error) {
      Logger.error('Failed to load simulator state', error as Error, { action: 'loadSimulatorState' });
    }
  };

  const handleToggle = async () => {
    if (!simulatorState) return;

    try {
      setLoading(true);
      const newState = await toggleSimulator(!simulatorState.enabled);
      setSimulatorState(newState);

      Toast.show({
        type: newState.enabled ? 'success' : 'info',
        text1: newState.enabled ? 'Simulator Enabled' : 'Simulator Disabled',
        text2: newState.enabled ? 'Using simulated subscription state' : 'Using real database values',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to toggle simulator',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPreset = async (preset: SimulatorPreset) => {
    try {
      setLoading(true);
      const newState = await applyPreset(preset);
      setSimulatorState(newState);

      Toast.show({
        type: 'success',
        text1: 'Preset Applied',
        text2: getPresetLabel(preset),
      });

      // Recommend app restart for full effect
      Alert.alert(
        'Preset Applied',
        'Please close and restart the app for full effect.\n\n' + getPresetDescription(preset),
        [{ text: 'OK' }]
      );
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to apply preset',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    Alert.alert(
      'Reset Simulator',
      'This will clear all simulated data and disable the simulator. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await clearSimulatorState();
              await loadState();

              Toast.show({
                type: 'success',
                text1: 'Simulator Reset',
                text2: 'Using real database values',
              });
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Failed to reset',
              });
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  if (!isAllowed) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Shield color="#EF4444" size={48} strokeWidth={2} />
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827', marginTop: 16 }}>
          Access Denied
        </Text>
        <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 8 }}>
          Subscription Simulator is only available for whitelisted test accounts.
        </Text>
      </View>
    );
  }

  if (!simulatorState) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#6B7280' }}>Loading...</Text>
      </View>
    );
  }

  const paymentPresets: SimulatorPreset[] = [
    'personal_active',
    'personal_expiring_soon',
    'personal_expired',
    'personal_cancelled',
    'personal_billing_issue',
  ];

  const otherPresets: SimulatorPreset[] = getAvailablePresets().filter(
    p => !paymentPresets.includes(p)
  );

  const getPaymentStatusIcon = (preset: SimulatorPreset) => {
    if (preset === 'personal_active') return <CheckCircle color="#10B981" size={20} />;
    if (preset === 'personal_expiring_soon') return <Clock color="#F59E0B" size={20} />;
    if (preset === 'personal_expired') return <XCircle color="#EF4444" size={20} />;
    if (preset === 'personal_cancelled') return <AlertTriangle color="#F59E0B" size={20} />;
    if (preset === 'personal_billing_issue') return <AlertTriangle color="#EF4444" size={20} />;
    return null;
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <View style={{ padding: 16 }}>
        {/* Header */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 24, fontWeight: '700', color: '#111827' }}>
            Subscription Simulator
          </Text>
          <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>
            Test different subscription and payment states for test@courtster.app
          </Text>
        </View>

        {/* Simulator Toggle */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }}>
                Simulator Status
              </Text>
              <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
                {simulatorState.enabled ? 'Using simulated state' : 'Using real database'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleToggle}
              disabled={loading}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderRadius: 8,
                backgroundColor: simulatorState.enabled ? '#10B981' : '#6B7280',
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>
                {simulatorState.enabled ? 'Enabled' : 'Disabled'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Payment Status Presets */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 12 }}>
            Payment Status Scenarios
          </Text>
          {paymentPresets.map((preset) => (
            <TouchableOpacity
              key={preset}
              onPress={() => handleApplyPreset(preset)}
              disabled={loading}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                padding: 16,
                marginBottom: 8,
                flexDirection: 'row',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <View style={{ marginRight: 12 }}>
                {getPaymentStatusIcon(preset)}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>
                  {getPresetLabel(preset)}
                </Text>
                <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                  {getPresetDescription(preset)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Other Presets */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 12 }}>
            Other Scenarios
          </Text>
          {otherPresets.map((preset) => (
            <TouchableOpacity
              key={preset}
              onPress={() => handleApplyPreset(preset)}
              disabled={loading}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                padding: 16,
                marginBottom: 8,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>
                {getPresetLabel(preset)}
              </Text>
              <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                {getPresetDescription(preset)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Reset Button */}
        <TouchableOpacity
          onPress={handleReset}
          disabled={loading}
          style={{
            backgroundColor: '#EF4444',
            borderRadius: 12,
            padding: 16,
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFFFFF' }}>
            Reset & Disable Simulator
          </Text>
        </TouchableOpacity>

        {/* Current State Debug */}
        <View
          style={{
            backgroundColor: '#F3F4F6',
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 8 }}>
            Current Simulated State
          </Text>
          <Text style={{ fontSize: 11, fontFamily: 'monospace', color: '#6B7280' }}>
            {JSON.stringify(simulatorState, null, 2)}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
