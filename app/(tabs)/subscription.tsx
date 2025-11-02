import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Check, Crown, Users, Sparkles, Zap, TrendingUp } from 'lucide-react-native';
import { useSubscription } from '../../hooks/useSubscription';
import Toast from 'react-native-toast-message';

type BillingInterval = 'monthly' | 'yearly';
type SubscriptionPlan = 'personal' | 'club';

export default function SubscriptionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { subscriptionStatus, featureAccess } = useSubscription();

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('personal');
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');
  const [isProcessing, setIsProcessing] = useState(false);

  const currentTier = subscriptionStatus?.tier || 'free';
  const isTrialActive = subscriptionStatus?.isTrialActive || false;

  // Pricing in IDR
  const pricing = {
    personal: {
      monthly: 49000,
      yearly: 299000,
    },
    club: {
      monthly: 139000,
      yearly: 699000,
    },
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculateYearlySavings = (plan: SubscriptionPlan) => {
    const monthlyCost = pricing[plan].monthly * 12;
    const yearlyCost = pricing[plan].yearly;
    const savings = monthlyCost - yearlyCost;
    const savingsPercent = Math.round((savings / monthlyCost) * 100);
    return { savings, savingsPercent };
  };

  const handleSubscribe = async () => {
    setIsProcessing(true);

    try {
      // TODO: Integrate with Revenue Cat for iOS StoreKit
      // For now, just show a toast
      Toast.show({
        type: 'info',
        text1: 'Payment Integration Coming Soon',
        text2: `${selectedPlan === 'personal' ? 'Personal' : 'Club'} plan - ${formatCurrency(pricing[selectedPlan][billingInterval])}/${billingInterval}`,
        visibilityTime: 4000,
      });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Subscription Failed',
        text2: 'Please try again later',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const personalSavings = calculateYearlySavings('personal');
  const clubSavings = calculateYearlySavings('club');

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      {/* Header */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          paddingTop: insets.top,
          backgroundColor: '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: '#E5E7EB',
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: '#F3F4F6',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ArrowLeft color="#374151" size={20} />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>
            Subscription
          </Text>
          <View style={{ width: 36 }} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 60,
          paddingHorizontal: 16,
          paddingBottom: Platform.OS === 'ios' ? 180 : 160
        }}
      >
        {/* Current Plan Status */}
        {currentTier !== 'free' || isTrialActive ? (
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  backgroundColor: '#FEE2E2',
                  borderRadius: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Crown color="#EF4444" size={20} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>
                  {isTrialActive ? 'Trial Active' : `${currentTier.charAt(0).toUpperCase() + currentTier.slice(1)} Plan`}
                </Text>
                <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                  {isTrialActive
                    ? `${subscriptionStatus?.trialDaysRemaining} days remaining`
                    : 'Active subscription'}
                </Text>
              </View>
            </View>
            {isTrialActive && (
              <View
                style={{
                  backgroundColor: '#FEF2F2',
                  borderRadius: 12,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: '#FCA5A5',
                }}
              >
                <Text style={{ fontSize: 13, color: '#991B1B', lineHeight: 18 }}>
                  Your trial ends in {subscriptionStatus?.trialDaysRemaining} days. Upgrade now to continue enjoying unlimited access.
                </Text>
              </View>
            )}
          </View>
        ) : null}

        {/* Free Tier Status */}
        {currentTier === 'free' && !isTrialActive && subscriptionStatus && (
          <View
            style={{
              backgroundColor: '#FEF2F2',
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: '#FCA5A5',
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#991B1B', marginBottom: 8 }}>
              Free Tier Limits
            </Text>
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 13, color: '#991B1B' }}>
                • Sessions: {subscriptionStatus.sessionsUsedThisMonth}/{subscriptionStatus.sessionsUsedThisMonth + subscriptionStatus.sessionsRemainingThisMonth} used this month
              </Text>
              <Text style={{ fontSize: 13, color: '#991B1B' }}>
                • Courts: Limited to 1 court per session
              </Text>
              <Text style={{ fontSize: 13, color: '#991B1B' }}>
                • Clubs: Limited to 1 club
              </Text>
              <Text style={{ fontSize: 13, color: '#991B1B' }}>
                • Reclub Import: Not available
              </Text>
            </View>
          </View>
        )}

        {/* Billing Toggle */}
        <View style={{ marginTop: 20, alignItems: 'center' }}>
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 14,
              padding: 3,
              flexDirection: 'row',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <TouchableOpacity
              onPress={() => setBillingInterval('monthly')}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 20,
                borderRadius: 11,
                backgroundColor: billingInterval === 'monthly' ? '#EF4444' : 'transparent',
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '600',
                  color: billingInterval === 'monthly' ? '#FFFFFF' : '#6B7280',
                }}
              >
                Monthly
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setBillingInterval('yearly')}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 20,
                borderRadius: 11,
                backgroundColor: billingInterval === 'yearly' ? '#EF4444' : 'transparent',
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '600',
                  color: billingInterval === 'yearly' ? '#FFFFFF' : '#6B7280',
                }}
              >
                Yearly
              </Text>
            </TouchableOpacity>
          </View>
          {/* Savings badge - only show when yearly selected */}
          {billingInterval === 'yearly' && (
            <View
              style={{
                marginTop: 8,
                backgroundColor: '#FEF2F2',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 12,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#DC2626', textAlign: 'center' }}>
                Save up to 39%
              </Text>
            </View>
          )}
        </View>

        {/* Plans */}
        <View style={{ marginTop: 24, gap: 16 }}>
          {/* Free Tier Info */}
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: '#E5E7EB',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.04,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  backgroundColor: '#F3F4F6',
                  borderRadius: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 20 }}>🎁</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>Free Tier</Text>
                <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 1 }}>Always free, with limits</Text>
              </View>
            </View>
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 13, color: '#6B7280' }}>• 4 sessions per month</Text>
              <Text style={{ fontSize: 13, color: '#6B7280' }}>• 1 court per session</Text>
              <Text style={{ fontSize: 13, color: '#6B7280' }}>• 1 club maximum</Text>
            </View>
          </View>

          {/* Personal Plan */}
          <TouchableOpacity
            onPress={() => setSelectedPlan('personal')}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 16,
              borderWidth: 2,
              borderColor: selectedPlan === 'personal' ? '#EF4444' : '#E5E7EB',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: selectedPlan === 'personal' ? 0.08 : 0.04,
              shadowRadius: 8,
              elevation: selectedPlan === 'personal' ? 3 : 2,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    backgroundColor: '#FEE2E2',
                    borderRadius: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Sparkles color="#EF4444" size={20} />
                </View>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>
                    Personal
                  </Text>
                  <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 1 }}>
                    For individual players
                  </Text>
                </View>
              </View>
              {selectedPlan === 'personal' && (
                <View
                  style={{
                    width: 24,
                    height: 24,
                    backgroundColor: '#EF4444',
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Check color="#FFFFFF" size={16} strokeWidth={3} />
                </View>
              )}
            </View>

            <Text style={{ fontSize: 28, fontWeight: '600', color: '#111827', marginBottom: 2 }}>
              {formatCurrency(pricing.personal[billingInterval])}
            </Text>
            <Text style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 12 }}>
              per {billingInterval === 'monthly' ? 'month' : 'year'}
            </Text>

            {billingInterval === 'yearly' && (
              <View
                style={{
                  backgroundColor: '#FEF2F2',
                  borderRadius: 10,
                  padding: 8,
                  marginBottom: 12,
                }}
              >
                <Text style={{ fontSize: 11, color: '#991B1B', fontWeight: '600' }}>
                  💰 Save {formatCurrency(personalSavings.savings)} ({personalSavings.savingsPercent}% off)
                </Text>
              </View>
            )}

            <View style={{ gap: 8 }}>
              {[
                'Unlimited sessions',
                'Unlimited courts',
                'Import from Reclub',
                'Priority support',
              ].map((feature, index) => (
                <View key={index} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Check color="#10B981" size={16} strokeWidth={2.5} />
                  <Text style={{ fontSize: 13, color: '#374151' }}>{feature}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>

          {/* Club Plan */}
          <TouchableOpacity
            onPress={() => setSelectedPlan('club')}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 16,
              borderWidth: 2,
              borderColor: selectedPlan === 'club' ? '#EF4444' : '#E5E7EB',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: selectedPlan === 'club' ? 0.08 : 0.04,
              shadowRadius: 8,
              elevation: selectedPlan === 'club' ? 3 : 2,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    backgroundColor: '#DBEAFE',
                    borderRadius: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Users color="#3B82F6" size={20} />
                </View>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>
                    Club Group
                  </Text>
                  <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 1 }}>
                    For up to 5 members
                  </Text>
                </View>
              </View>
              {selectedPlan === 'club' && (
                <View
                  style={{
                    width: 24,
                    height: 24,
                    backgroundColor: '#EF4444',
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Check color="#FFFFFF" size={16} strokeWidth={3} />
                </View>
              )}
            </View>

            <Text style={{ fontSize: 28, fontWeight: '600', color: '#111827', marginBottom: 2 }}>
              {formatCurrency(pricing.club[billingInterval])}
            </Text>
            <Text style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>
              per {billingInterval === 'monthly' ? 'month' : 'year'}
            </Text>
            {/* Per member pricing subtitle */}
            <Text style={{ fontSize: 11, color: '#6B7280', marginBottom: 12, fontStyle: 'italic' }}>
              +IDR 20,000/month per additional member
            </Text>

            {billingInterval === 'yearly' && (
              <View
                style={{
                  backgroundColor: '#EFF6FF',
                  borderRadius: 10,
                  padding: 8,
                  marginBottom: 12,
                }}
              >
                <Text style={{ fontSize: 11, color: '#1E40AF', fontWeight: '600' }}>
                  💰 Save {formatCurrency(clubSavings.savings)} ({clubSavings.savingsPercent}% off)
                </Text>
              </View>
            )}

            <View style={{ gap: 8 }}>
              {[
                'All Personal features',
                'Up to 5 club members',
                'Shared subscription',
                'Shared game sessions',
                'Club leader tools',
              ].map((feature, index) => (
                <View key={index} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Check color="#10B981" size={16} strokeWidth={2.5} />
                  <Text style={{ fontSize: 13, color: '#374151' }}>{feature}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        </View>

        {/* Coming Soon Notice */}
        <View
          style={{
            backgroundColor: '#FEF3C7',
            borderRadius: 16,
            padding: 16,
            marginTop: 24,
            borderWidth: 1,
            borderColor: '#FCD34D',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Zap color="#F59E0B" size={20} />
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#92400E' }}>
              Club Management - Coming Soon
            </Text>
          </View>
          <Text style={{ fontSize: 13, color: '#78350F', lineHeight: 18 }}>
            Advanced club management features will be available in a future update. Stay tuned!
          </Text>
        </View>
      </ScrollView>

      {/* Bottom CTA - Fixed at bottom */}
      <View
        style={{
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 80 : 65, // Account for tab bar height
          left: 0,
          right: 0,
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 12,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 8,
        }}
      >
        <TouchableOpacity
          onPress={handleSubscribe}
          disabled={isProcessing}
          style={{
            backgroundColor: '#EF4444',
            borderRadius: 14,
            paddingVertical: 14,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#EF4444',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          {isProcessing ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}>
              Subscribe to {selectedPlan === 'personal' ? 'Personal' : 'Club Group'} • {formatCurrency(pricing[selectedPlan][billingInterval])}/{billingInterval === 'monthly' ? 'mo' : 'yr'}
            </Text>
          )}
        </TouchableOpacity>
        <Text style={{ fontSize: 10, color: '#9CA3AF', textAlign: 'center', marginTop: 6 }}>
          Payment via Apple App Store • Cancel anytime
        </Text>
      </View>
    </View>
  );
}
