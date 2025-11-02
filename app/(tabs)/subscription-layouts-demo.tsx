import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Check, Crown, Sparkles, Users, X } from 'lucide-react-native';

const { width } = Dimensions.get('window');

type BillingInterval = 'monthly' | 'yearly';

export default function SubscriptionLayoutsDemo() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');

  const pricing = {
    personal: { monthly: 49000, yearly: 299000 },
    club: { monthly: 139000, yearly: 699000 },
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top,
          paddingHorizontal: 16,
          paddingBottom: 12,
          backgroundColor: '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: '#E5E7EB',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>
            Subscription Layout Variations
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 32 }}>
        {/* Layout 1: Comparison Table */}
        <View>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 }}>
            Layout 1: Comparison Table
          </Text>
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E7EB' }}>
            {/* Header Row */}
            <View style={{ flexDirection: 'row', backgroundColor: '#F9FAFB', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
              <View style={{ width: 100, padding: 12 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280' }}>Features</Text>
              </View>
              <View style={{ flex: 1, padding: 12, alignItems: 'center', borderLeftWidth: 1, borderLeftColor: '#E5E7EB' }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#111827' }}>Free</Text>
              </View>
              <View style={{ flex: 1, padding: 12, alignItems: 'center', borderLeftWidth: 1, borderLeftColor: '#E5E7EB', backgroundColor: '#FEF2F2' }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#EF4444' }}>Personal</Text>
              </View>
              <View style={{ flex: 1, padding: 12, alignItems: 'center', borderLeftWidth: 1, borderLeftColor: '#E5E7EB' }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#111827' }}>Club</Text>
              </View>
            </View>

            {/* Feature Rows */}
            {[
              { name: 'Sessions', free: '4/mo', personal: '∞', club: '∞' },
              { name: 'Courts', free: '1', personal: '∞', club: '∞' },
              { name: 'Clubs', free: '1', personal: '∞', club: '∞' },
              { name: 'Reclub', free: '✕', personal: '✓', club: '✓' },
            ].map((row, idx) => (
              <View key={idx} style={{ flexDirection: 'row', borderBottomWidth: idx < 3 ? 1 : 0, borderBottomColor: '#F3F4F6' }}>
                <View style={{ width: 100, padding: 10 }}>
                  <Text style={{ fontSize: 11, color: '#6B7280' }}>{row.name}</Text>
                </View>
                <View style={{ flex: 1, padding: 10, alignItems: 'center', borderLeftWidth: 1, borderLeftColor: '#F3F4F6' }}>
                  <Text style={{ fontSize: 11, color: '#111827' }}>{row.free}</Text>
                </View>
                <View style={{ flex: 1, padding: 10, alignItems: 'center', borderLeftWidth: 1, borderLeftColor: '#F3F4F6', backgroundColor: '#FFFBFB' }}>
                  <Text style={{ fontSize: 11, color: '#EF4444', fontWeight: '600' }}>{row.personal}</Text>
                </View>
                <View style={{ flex: 1, padding: 10, alignItems: 'center', borderLeftWidth: 1, borderLeftColor: '#F3F4F6' }}>
                  <Text style={{ fontSize: 11, color: '#111827' }}>{row.club}</Text>
                </View>
              </View>
            ))}

            {/* Price Row */}
            <View style={{ flexDirection: 'row', backgroundColor: '#F9FAFB' }}>
              <View style={{ width: 100, padding: 10 }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: '#6B7280' }}>Price</Text>
              </View>
              <View style={{ flex: 1, padding: 10, alignItems: 'center', borderLeftWidth: 1, borderLeftColor: '#E5E7EB' }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#10B981' }}>FREE</Text>
              </View>
              <View style={{ flex: 1, padding: 10, alignItems: 'center', borderLeftWidth: 1, borderLeftColor: '#E5E7EB', backgroundColor: '#FEF2F2' }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#EF4444' }}>49k</Text>
              </View>
              <View style={{ flex: 1, padding: 10, alignItems: 'center', borderLeftWidth: 1, borderLeftColor: '#E5E7EB' }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#111827' }}>139k</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Layout 2: Horizontal Cards */}
        <View>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 }}>
            Layout 2: Horizontal Swipeable Cards
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
            {/* Free */}
            <View style={{ width: width - 120, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 2, borderColor: '#E5E7EB' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <View style={{ width: 36, height: 36, backgroundColor: '#F3F4F6', borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 18 }}>🎁</Text>
                </View>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>Free</Text>
              </View>
              <Text style={{ fontSize: 24, fontWeight: '700', color: '#10B981', marginBottom: 12 }}>IDR 0</Text>
              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 12, color: '#6B7280' }}>✓ 4 sessions/month</Text>
                <Text style={{ fontSize: 12, color: '#6B7280' }}>✓ 1 court</Text>
                <Text style={{ fontSize: 12, color: '#6B7280' }}>✓ 1 club</Text>
              </View>
            </View>

            {/* Personal */}
            <View style={{ width: width - 120, backgroundColor: '#FEF2F2', borderRadius: 16, padding: 16, borderWidth: 2, borderColor: '#EF4444' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <View style={{ width: 36, height: 36, backgroundColor: '#EF4444', borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}>
                  <Crown size={18} color="#FFFFFF" />
                </View>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>Personal</Text>
              </View>
              <Text style={{ fontSize: 24, fontWeight: '700', color: '#EF4444', marginBottom: 12 }}>IDR 49k</Text>
              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 12, color: '#991B1B' }}>✓ Unlimited sessions</Text>
                <Text style={{ fontSize: 12, color: '#991B1B' }}>✓ Unlimited courts</Text>
                <Text style={{ fontSize: 12, color: '#991B1B' }}>✓ Reclub import</Text>
              </View>
            </View>

            {/* Club */}
            <View style={{ width: width - 120, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 2, borderColor: '#3B82F6' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <View style={{ width: 36, height: 36, backgroundColor: '#3B82F6', borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={18} color="#FFFFFF" />
                </View>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>Club</Text>
              </View>
              <Text style={{ fontSize: 24, fontWeight: '700', color: '#3B82F6', marginBottom: 12 }}>IDR 139k</Text>
              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 12, color: '#1E40AF' }}>✓ All Personal features</Text>
                <Text style={{ fontSize: 12, color: '#1E40AF' }}>✓ Up to 5 members</Text>
                <Text style={{ fontSize: 12, color: '#1E40AF' }}>✓ Shared access</Text>
              </View>
            </View>
          </ScrollView>
        </View>

        {/* Layout 3: Minimal List */}
        <View>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 }}>
            Layout 3: Minimal List View
          </Text>
          <View style={{ gap: 8 }}>
            <View style={{ backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#E5E7EB' }}>
              <View>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>Free</Text>
                <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 1 }}>4 sessions • 1 court</Text>
              </View>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#10B981' }}>FREE</Text>
            </View>

            <View style={{ backgroundColor: '#FEF2F2', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#FCA5A5' }}>
              <View>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>Personal</Text>
                <Text style={{ fontSize: 11, color: '#991B1B', marginTop: 1 }}>Unlimited everything</Text>
              </View>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#EF4444' }}>49k/mo</Text>
            </View>

            <View style={{ backgroundColor: '#EFF6FF', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#BFDBFE' }}>
              <View>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>Club Group</Text>
                <Text style={{ fontSize: 11, color: '#1E40AF', marginTop: 1 }}>5 members included</Text>
              </View>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#3B82F6' }}>139k/mo</Text>
            </View>
          </View>
        </View>

        {/* Layout 4: Toggle Cards (Current Implementation) */}
        <View>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 }}>
            Layout 4: Toggle Selection (Current)
          </Text>
          <View style={{ alignItems: 'center', marginBottom: 12 }}>
            <View style={{ backgroundColor: '#FFFFFF', borderRadius: 12, padding: 3, flexDirection: 'row', borderWidth: 1, borderColor: '#E5E7EB' }}>
              <TouchableOpacity
                onPress={() => setBillingInterval('monthly')}
                style={{
                  paddingVertical: 6,
                  paddingHorizontal: 16,
                  borderRadius: 9,
                  backgroundColor: billingInterval === 'monthly' ? '#EF4444' : 'transparent',
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '600', color: billingInterval === 'monthly' ? '#FFFFFF' : '#6B7280' }}>
                  Monthly
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setBillingInterval('yearly')}
                style={{
                  paddingVertical: 6,
                  paddingHorizontal: 16,
                  borderRadius: 9,
                  backgroundColor: billingInterval === 'yearly' ? '#EF4444' : 'transparent',
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '600', color: billingInterval === 'yearly' ? '#FFFFFF' : '#6B7280' }}>
                  Yearly
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ gap: 12 }}>
            <View style={{ backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, borderWidth: 2, borderColor: '#EF4444' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>Personal</Text>
                <Check size={20} color="#EF4444" strokeWidth={3} />
              </View>
              <Text style={{ fontSize: 24, fontWeight: '600', color: '#111827' }}>
                {formatCurrency(pricing.personal[billingInterval])}
              </Text>
              <Text style={{ fontSize: 11, color: '#6B7280' }}>per {billingInterval === 'monthly' ? 'month' : 'year'}</Text>
            </View>

            <View style={{ backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#E5E7EB', opacity: 0.6 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 8 }}>Club Group</Text>
              <Text style={{ fontSize: 24, fontWeight: '600', color: '#111827' }}>
                {formatCurrency(pricing.club[billingInterval])}
              </Text>
              <Text style={{ fontSize: 11, color: '#6B7280' }}>per {billingInterval === 'monthly' ? 'month' : 'year'}</Text>
            </View>
          </View>
        </View>

        {/* Layout 5: Pricing Grid */}
        <View>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 }}>
            Layout 5: Grid Layout (2 Columns)
          </Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#E5E7EB' }}>
              <View style={{ width: 32, height: 32, backgroundColor: '#F3F4F6', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                <Text style={{ fontSize: 16 }}>🎁</Text>
              </View>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 4 }}>Free</Text>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#10B981', marginBottom: 8 }}>IDR 0</Text>
              <View style={{ gap: 4 }}>
                <Text style={{ fontSize: 10, color: '#6B7280' }}>• 4 sessions/mo</Text>
                <Text style={{ fontSize: 10, color: '#6B7280' }}>• 1 court</Text>
                <Text style={{ fontSize: 10, color: '#6B7280' }}>• 1 club</Text>
              </View>
            </View>

            <View style={{ flex: 1, backgroundColor: '#FEF2F2', borderRadius: 14, padding: 14, borderWidth: 2, borderColor: '#EF4444' }}>
              <View style={{ width: 32, height: 32, backgroundColor: '#EF4444', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                <Crown size={16} color="#FFFFFF" />
              </View>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 4 }}>Personal</Text>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#EF4444', marginBottom: 8 }}>49k/mo</Text>
              <View style={{ gap: 4 }}>
                <Text style={{ fontSize: 10, color: '#991B1B' }}>• Unlimited</Text>
                <Text style={{ fontSize: 10, color: '#991B1B' }}>• All features</Text>
                <Text style={{ fontSize: 10, color: '#991B1B' }}>• Priority</Text>
              </View>
            </View>
          </View>

          <View style={{ marginTop: 12, backgroundColor: '#EFF6FF', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#BFDBFE' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <View style={{ width: 32, height: 32, backgroundColor: '#3B82F6', borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
                <Users size={16} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827' }}>Club Group</Text>
                <Text style={{ fontSize: 10, color: '#1E40AF', marginTop: 1 }}>Up to 5 members</Text>
              </View>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#3B82F6' }}>139k/mo</Text>
            </View>
          </View>
        </View>

        {/* Layout 6: Statistics Card Style (Session Theme) */}
        <View>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 }}>
            Layout 6: Statistics Card Style
          </Text>
          <View style={{ gap: 12 }}>
            {/* Free Tier */}
            <View
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.85)',
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: 'rgba(229, 231, 235, 0.5)',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>Free Tier</Text>
                  <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>Always free • Limited features</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 20, fontWeight: '700', color: '#10B981' }}>FREE</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
                <View>
                  <Text style={{ fontSize: 12, color: '#6B7280' }}>Sessions</Text>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: '#111827' }}>4/month</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, color: '#6B7280' }}>Courts</Text>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: '#111827' }}>1 max</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 12, color: '#6B7280' }}>Clubs</Text>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: '#111827' }}>1 max</Text>
                </View>
              </View>
            </View>

            {/* Personal Tier */}
            <View
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.85)',
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: 'rgba(239, 68, 68, 0.3)',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>Personal</Text>
                    <View style={{ backgroundColor: '#FEE2E2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                      <Text style={{ fontSize: 10, fontWeight: '600', color: '#EF4444' }}>POPULAR</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>Unlimited everything</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 20, fontWeight: '700', color: '#EF4444' }}>49k</Text>
                  <Text style={{ fontSize: 12, color: '#6B7280' }}>per month</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
                <View>
                  <Text style={{ fontSize: 12, color: '#6B7280' }}>Sessions</Text>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: '#111827' }}>Unlimited</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, color: '#6B7280' }}>Courts</Text>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: '#111827' }}>Unlimited</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 12, color: '#6B7280' }}>Reclub</Text>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: '#111827' }}>✓</Text>
                </View>
              </View>
            </View>

            {/* Club Tier */}
            <View
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.85)',
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: 'rgba(229, 231, 235, 0.5)',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>Club Group</Text>
                  <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>Team subscriptions</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 20, fontWeight: '700', color: '#3B82F6' }}>139k</Text>
                  <Text style={{ fontSize: 12, color: '#6B7280' }}>per month</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
                <View>
                  <Text style={{ fontSize: 12, color: '#6B7280' }}>Members</Text>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: '#111827' }}>Up to 5</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, color: '#6B7280' }}>Features</Text>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: '#111827' }}>All</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 12, color: '#6B7280' }}>Extra</Text>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: '#111827' }}>+20k/mo</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Layout 7: Head-to-Head Comparison Style */}
        <View>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 }}>
            Layout 7: Head-to-Head Comparison
          </Text>
          <View
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.85)',
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: 'rgba(229, 231, 235, 0.5)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            {/* Free vs Personal */}
            <View style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#6B7280' }}>Free</Text>
                  <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>4 sessions/mo</Text>
                </View>
                <View style={{ width: 60, alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, color: '#6B7280', fontWeight: '500' }}>VS</Text>
                </View>
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#EF4444' }}>Personal</Text>
                  <Text style={{ fontSize: 12, color: '#EF4444', marginTop: 2 }}>Unlimited</Text>
                </View>
              </View>

              {/* Progress bar */}
              <View style={{ height: 8, backgroundColor: '#F3F4F6', borderRadius: 4, overflow: 'hidden' }}>
                <View style={{ height: '100%', width: '25%', backgroundColor: '#9CA3AF' }} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                <Text style={{ fontSize: 11, color: '#6B7280' }}>Limited</Text>
                <Text style={{ fontSize: 11, color: '#EF4444', fontWeight: '600' }}>Unlimited Access</Text>
              </View>
            </View>

            <View style={{ height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 }} />

            {/* Personal vs Club */}
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#EF4444' }}>Personal</Text>
                  <Text style={{ fontSize: 12, color: '#EF4444', marginTop: 2 }}>IDR 49k/mo</Text>
                </View>
                <View style={{ width: 60, alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, color: '#6B7280', fontWeight: '500' }}>VS</Text>
                </View>
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#3B82F6' }}>Club</Text>
                  <Text style={{ fontSize: 12, color: '#3B82F6', marginTop: 2 }}>IDR 139k/mo</Text>
                </View>
              </View>

              {/* Feature comparison */}
              <View style={{ backgroundColor: '#F9FAFB', borderRadius: 8, padding: 10, marginTop: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ fontSize: 11, color: '#6B7280' }}>Solo use</Text>
                  <Text style={{ fontSize: 11, color: '#6B7280' }}>Up to 5 members</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 11, color: '#EF4444' }}>✓ All features</Text>
                  <Text style={{ fontSize: 11, color: '#3B82F6' }}>✓ Shared access</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Layout 8: Partnership Stats Style */}
        <View>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 }}>
            Layout 8: Partnership Stats Style
          </Text>
          <View
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.85)',
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: 'rgba(229, 231, 235, 0.5)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>
                  Free & Personal
                </Text>
                <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
                  Compare feature combinations
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#EF4444' }}>
                  49k
                </Text>
                <Text style={{ fontSize: 12, color: '#6B7280' }}>upgrade</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
              <View>
                <Text style={{ fontSize: 12, color: '#6B7280' }}>Value Increase</Text>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#10B981' }}>∞%</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 12, color: '#6B7280' }}>Features Unlocked</Text>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#111827' }}>All</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 12, color: '#6B7280' }}>ROI</Text>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#EF4444' }}>High</Text>
              </View>
            </View>

            {/* Upgrade path */}
            <View style={{ marginTop: 12, backgroundColor: '#FEF2F2', borderRadius: 8, padding: 10 }}>
              <Text style={{ fontSize: 11, color: '#991B1B', textAlign: 'center' }}>
                🚀 Upgrade now to unlock unlimited sessions, courts, and Reclub import
              </Text>
            </View>
          </View>
        </View>

        {/* Layout 9: Tab Selector Style (Session Theme) */}
        <View>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 }}>
            Layout 9: Tab Selector Style
          </Text>
          <View
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              borderRadius: 16,
              padding: 12,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              <View
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  backgroundColor: '#F3F4F6',
                }}
              >
                <Text style={{ textAlign: 'center', fontWeight: '600', color: '#374151', fontSize: 13 }}>
                  Free
                </Text>
              </View>
              <View
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  backgroundColor: '#EF4444',
                }}
              >
                <Text style={{ textAlign: 'center', fontWeight: '600', color: '#FFFFFF', fontSize: 13 }}>
                  Personal
                </Text>
              </View>
              <View
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  backgroundColor: '#F3F4F6',
                }}
              >
                <Text style={{ textAlign: 'center', fontWeight: '600', color: '#374151', fontSize: 13 }}>
                  Club
                </Text>
              </View>
            </View>

            {/* Selected plan details */}
            <View style={{ backgroundColor: '#FEF2F2', borderRadius: 12, padding: 14 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>Personal Plan</Text>
                <Text style={{ fontSize: 22, fontWeight: '700', color: '#EF4444' }}>49k/mo</Text>
              </View>
              <View style={{ gap: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Check size={14} color="#10B981" strokeWidth={3} />
                  <Text style={{ fontSize: 12, color: '#111827' }}>Unlimited sessions per month</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Check size={14} color="#10B981" strokeWidth={3} />
                  <Text style={{ fontSize: 12, color: '#111827' }}>Unlimited courts per session</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Check size={14} color="#10B981" strokeWidth={3} />
                  <Text style={{ fontSize: 12, color: '#111827' }}>Import from Reclub</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Layout 10: Widget Grid Style */}
        <View>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 }}>
            Layout 10: Widget Grid Style
          </Text>
          <View style={{ gap: 10 }}>
            {/* Top row - 3 widgets */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {/* Free */}
              <View
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(255, 255, 255, 0.85)',
                  borderRadius: 12,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: 'rgba(229, 231, 235, 0.5)',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.03,
                  shadowRadius: 4,
                  elevation: 1,
                }}
              >
                <Text style={{ fontSize: 11, color: '#6B7280', marginBottom: 4 }}>FREE</Text>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#10B981', marginBottom: 2 }}>IDR 0</Text>
                <Text style={{ fontSize: 10, color: '#9CA3AF' }}>Limited</Text>
              </View>

              {/* Personal */}
              <View
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  borderRadius: 12,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: 'rgba(239, 68, 68, 0.3)',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.03,
                  shadowRadius: 4,
                  elevation: 1,
                }}
              >
                <Text style={{ fontSize: 11, color: '#991B1B', marginBottom: 4 }}>PERSONAL</Text>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#EF4444', marginBottom: 2 }}>49k</Text>
                <Text style={{ fontSize: 10, color: '#DC2626' }}>Unlimited</Text>
              </View>

              {/* Club */}
              <View
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(255, 255, 255, 0.85)',
                  borderRadius: 12,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: 'rgba(229, 231, 235, 0.5)',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.03,
                  shadowRadius: 4,
                  elevation: 1,
                }}
              >
                <Text style={{ fontSize: 11, color: '#1E40AF', marginBottom: 4 }}>CLUB</Text>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#3B82F6', marginBottom: 2 }}>139k</Text>
                <Text style={{ fontSize: 10, color: '#60A5FA' }}>5 members</Text>
              </View>
            </View>

            {/* Bottom row - Feature comparison */}
            <View
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.85)',
                borderRadius: 12,
                padding: 14,
                borderWidth: 1,
                borderColor: 'rgba(229, 231, 235, 0.5)',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.03,
                shadowRadius: 4,
                elevation: 1,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827', marginBottom: 10 }}>
                Feature Comparison
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ fontSize: 11, color: '#6B7280', flex: 1 }}>Sessions</Text>
                <Text style={{ fontSize: 11, color: '#9CA3AF', width: 60, textAlign: 'center' }}>4/mo</Text>
                <Text style={{ fontSize: 11, color: '#EF4444', fontWeight: '600', width: 60, textAlign: 'center' }}>∞</Text>
                <Text style={{ fontSize: 11, color: '#3B82F6', fontWeight: '600', width: 60, textAlign: 'center' }}>∞</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ fontSize: 11, color: '#6B7280', flex: 1 }}>Courts</Text>
                <Text style={{ fontSize: 11, color: '#9CA3AF', width: 60, textAlign: 'center' }}>1</Text>
                <Text style={{ fontSize: 11, color: '#EF4444', fontWeight: '600', width: 60, textAlign: 'center' }}>∞</Text>
                <Text style={{ fontSize: 11, color: '#3B82F6', fontWeight: '600', width: 60, textAlign: 'center' }}>∞</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 11, color: '#6B7280', flex: 1 }}>Reclub</Text>
                <Text style={{ fontSize: 11, color: '#9CA3AF', width: 60, textAlign: 'center' }}>✕</Text>
                <Text style={{ fontSize: 11, color: '#10B981', fontWeight: '600', width: 60, textAlign: 'center' }}>✓</Text>
                <Text style={{ fontSize: 11, color: '#10B981', fontWeight: '600', width: 60, textAlign: 'center' }}>✓</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Layout 11: Enhanced Feature Matrix */}
        <View>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 }}>
            Layout 11: Enhanced Feature Matrix
          </Text>
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E7EB' }}>
            {/* Header with Icons */}
            <View style={{ flexDirection: 'row', backgroundColor: '#F9FAFB', borderBottomWidth: 2, borderBottomColor: '#E5E7EB' }}>
              <View style={{ width: 110, padding: 14 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151' }}>Plans</Text>
              </View>
              <View style={{ flex: 1, padding: 14, alignItems: 'center', borderLeftWidth: 1, borderLeftColor: '#E5E7EB' }}>
                <View style={{ width: 28, height: 28, backgroundColor: '#F3F4F6', borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                  <Text style={{ fontSize: 14 }}>🎁</Text>
                </View>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#111827' }}>Free</Text>
                <Text style={{ fontSize: 10, color: '#10B981', marginTop: 2 }}>IDR 0</Text>
              </View>
              <View style={{ flex: 1, padding: 14, alignItems: 'center', borderLeftWidth: 1, borderLeftColor: '#E5E7EB', backgroundColor: '#FEF2F2' }}>
                <View style={{ width: 28, height: 28, backgroundColor: '#EF4444', borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                  <Crown size={14} color="#FFFFFF" />
                </View>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#EF4444' }}>Personal</Text>
                <Text style={{ fontSize: 10, color: '#DC2626', marginTop: 2 }}>49k/mo</Text>
              </View>
              <View style={{ flex: 1, padding: 14, alignItems: 'center', borderLeftWidth: 1, borderLeftColor: '#E5E7EB', backgroundColor: '#EFF6FF' }}>
                <View style={{ width: 28, height: 28, backgroundColor: '#3B82F6', borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                  <Users size={14} color="#FFFFFF" />
                </View>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#3B82F6' }}>Club</Text>
                <Text style={{ fontSize: 10, color: '#1E40AF', marginTop: 2 }}>139k/mo</Text>
              </View>
            </View>

            {/* Feature Categories */}
            {[
              {
                category: 'Session Limits',
                features: [
                  { name: 'Sessions/Month', free: '4', personal: 'Unlimited', club: 'Unlimited' },
                  { name: 'Active Sessions', free: '1', personal: 'Unlimited', club: 'Unlimited' },
                ]
              },
              {
                category: 'Court & Players',
                features: [
                  { name: 'Courts per Session', free: '1', personal: 'Unlimited', club: 'Unlimited' },
                  { name: 'Players per Session', free: 'Unlimited', personal: 'Unlimited', club: 'Unlimited' },
                ]
              },
              {
                category: 'Advanced Features',
                features: [
                  { name: 'Reclub Import', free: '✕', personal: '✓', club: '✓' },
                  { name: 'Multiple Clubs', free: '1 Club', personal: '3 Clubs', club: '3 Clubs' },
                  { name: 'Priority Support', free: '✕', personal: '✓', club: '✓' },
                  { name: 'Shared Access', free: '✕', personal: '✕', club: '✓ (5 members)' },
                ]
              }
            ].map((section, sectionIdx) => (
              <View key={sectionIdx}>
                {/* Category Header */}
                <View style={{ backgroundColor: '#F9FAFB', paddingVertical: 8, paddingHorizontal: 14, borderTopWidth: sectionIdx > 0 ? 1 : 0, borderTopColor: '#E5E7EB' }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {section.category}
                  </Text>
                </View>

                {/* Features in Category */}
                {section.features.map((feature, idx) => (
                  <View key={idx} style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
                    <View style={{ width: 110, padding: 12, justifyContent: 'center' }}>
                      <Text style={{ fontSize: 11, color: '#374151', lineHeight: 14 }}>{feature.name}</Text>
                    </View>
                    <View style={{ flex: 1, padding: 12, alignItems: 'center', justifyContent: 'center', borderLeftWidth: 1, borderLeftColor: '#F3F4F6' }}>
                      <Text style={{ fontSize: 11, color: feature.free === '✕' ? '#DC2626' : '#111827', textAlign: 'center' }}>{feature.free}</Text>
                    </View>
                    <View style={{ flex: 1, padding: 12, alignItems: 'center', justifyContent: 'center', borderLeftWidth: 1, borderLeftColor: '#F3F4F6', backgroundColor: '#FFFBFB' }}>
                      <Text style={{ fontSize: 11, color: feature.personal === '✓' ? '#10B981' : '#EF4444', fontWeight: '600', textAlign: 'center' }}>{feature.personal}</Text>
                    </View>
                    <View style={{ flex: 1, padding: 12, alignItems: 'center', justifyContent: 'center', borderLeftWidth: 1, borderLeftColor: '#F3F4F6', backgroundColor: '#F9FAFB' }}>
                      <Text style={{ fontSize: 11, color: feature.club === '✓' || feature.club.includes('5 members') ? '#10B981' : '#3B82F6', fontWeight: '600', textAlign: 'center' }}>{feature.club}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </View>

        {/* Layout 12: Value Proposition Table */}
        <View>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 }}>
            Layout 12: Value Proposition Table
          </Text>
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E7EB' }}>
            {/* Header */}
            <View style={{ backgroundColor: '#EF4444', padding: 16 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF', textAlign: 'center', marginBottom: 4 }}>
                Choose Your Perfect Plan
              </Text>
              <Text style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.9)', textAlign: 'center' }}>
                All plans include core tournament features
              </Text>
            </View>

            {/* Comparison Grid */}
            <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', backgroundColor: '#F9FAFB' }}>
              <View style={{ width: 100, padding: 10 }} />
              <View style={{ flex: 1, padding: 10, alignItems: 'center' }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: '#6B7280' }}>FREE</Text>
              </View>
              <View style={{ flex: 1, padding: 10, alignItems: 'center', backgroundColor: '#FEF2F2' }}>
                <View style={{ backgroundColor: '#EF4444', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginBottom: 2 }}>
                  <Text style={{ fontSize: 9, fontWeight: '700', color: '#FFFFFF' }}>POPULAR</Text>
                </View>
                <Text style={{ fontSize: 11, fontWeight: '600', color: '#EF4444' }}>PERSONAL</Text>
              </View>
              <View style={{ flex: 1, padding: 10, alignItems: 'center' }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: '#6B7280' }}>CLUB</Text>
              </View>
            </View>

            {/* Features with visual indicators */}
            {[
              { label: 'Monthly Sessions', free: '4', personal: '∞', club: '∞', highlight: true },
              { label: 'Courts Available', free: '1', personal: '∞', club: '∞', highlight: true },
              { label: 'Club Creation', free: '1', personal: '3', club: '3', highlight: false },
              { label: 'Reclub Import', free: false, personal: true, club: true, highlight: true },
              { label: 'Team Sharing', free: false, personal: false, club: true, highlight: true },
              { label: 'Priority Support', free: false, personal: true, club: true, highlight: false },
            ].map((row, idx) => (
              <View key={idx} style={{ flexDirection: 'row', borderBottomWidth: idx < 5 ? 1 : 0, borderBottomColor: '#F3F4F6', backgroundColor: row.highlight ? '#FFFBEB' : '#FFFFFF' }}>
                <View style={{ width: 100, padding: 10, justifyContent: 'center' }}>
                  <Text style={{ fontSize: 11, color: '#374151', fontWeight: row.highlight ? '600' : '400' }}>{row.label}</Text>
                </View>
                <View style={{ flex: 1, padding: 10, alignItems: 'center', justifyContent: 'center', borderLeftWidth: 1, borderLeftColor: '#F3F4F6' }}>
                  {typeof row.free === 'boolean' ? (
                    <Text style={{ fontSize: 14, color: row.free ? '#10B981' : '#DC2626' }}>{row.free ? '✓' : '✕'}</Text>
                  ) : (
                    <Text style={{ fontSize: 11, color: '#111827' }}>{row.free}</Text>
                  )}
                </View>
                <View style={{ flex: 1, padding: 10, alignItems: 'center', justifyContent: 'center', borderLeftWidth: 1, borderLeftColor: '#F3F4F6', backgroundColor: '#FEF2F2' }}>
                  {typeof row.personal === 'boolean' ? (
                    <Text style={{ fontSize: 14, color: row.personal ? '#10B981' : '#DC2626', fontWeight: '700' }}>{row.personal ? '✓' : '✕'}</Text>
                  ) : (
                    <Text style={{ fontSize: 11, color: '#EF4444', fontWeight: '700' }}>{row.personal}</Text>
                  )}
                </View>
                <View style={{ flex: 1, padding: 10, alignItems: 'center', justifyContent: 'center', borderLeftWidth: 1, borderLeftColor: '#F3F4F6' }}>
                  {typeof row.club === 'boolean' ? (
                    <Text style={{ fontSize: 14, color: row.club ? '#10B981' : '#DC2626' }}>{row.club ? '✓' : '✕'}</Text>
                  ) : (
                    <Text style={{ fontSize: 11, color: '#111827' }}>{row.club}</Text>
                  )}
                </View>
              </View>
            ))}

            {/* Footer CTA */}
            <View style={{ flexDirection: 'row', backgroundColor: '#F9FAFB' }}>
              <View style={{ width: 100, padding: 10 }} />
              <View style={{ flex: 1, padding: 8, alignItems: 'center' }}>
                <TouchableOpacity style={{ backgroundColor: '#E5E7EB', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 }}>
                  <Text style={{ fontSize: 10, fontWeight: '600', color: '#6B7280' }}>Current</Text>
                </TouchableOpacity>
              </View>
              <View style={{ flex: 1, padding: 8, alignItems: 'center', backgroundColor: '#FEF2F2' }}>
                <TouchableOpacity style={{ backgroundColor: '#EF4444', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#FFFFFF' }}>Upgrade</Text>
                </TouchableOpacity>
              </View>
              <View style={{ flex: 1, padding: 8, alignItems: 'center' }}>
                <TouchableOpacity style={{ backgroundColor: '#3B82F6', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 }}>
                  <Text style={{ fontSize: 10, fontWeight: '600', color: '#FFFFFF' }}>Select</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Layout 13: Detailed Breakdown Table */}
        <View>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 }}>
            Layout 13: Detailed Breakdown Table
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ width: width * 1.2, backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E7EB' }}>
              {/* Header */}
              <View style={{ flexDirection: 'row', backgroundColor: '#111827' }}>
                <View style={{ width: 140, padding: 12 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF' }}>Feature Details</Text>
                </View>
                <View style={{ flex: 1, padding: 12, alignItems: 'center', borderLeftWidth: 1, borderLeftColor: 'rgba(255, 255, 255, 0.1)' }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF' }}>Free Tier</Text>
                  <Text style={{ fontSize: 10, color: 'rgba(255, 255, 255, 0.7)', marginTop: 2 }}>Getting Started</Text>
                </View>
                <View style={{ flex: 1, padding: 12, alignItems: 'center', borderLeftWidth: 1, borderLeftColor: 'rgba(255, 255, 255, 0.1)', backgroundColor: 'rgba(239, 68, 68, 0.15)' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Sparkles size={12} color="#FCA5A5" />
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF' }}>Personal</Text>
                  </View>
                  <Text style={{ fontSize: 10, color: '#FCA5A5', marginTop: 2 }}>Most Popular</Text>
                </View>
                <View style={{ flex: 1, padding: 12, alignItems: 'center', borderLeftWidth: 1, borderLeftColor: 'rgba(255, 255, 255, 0.1)' }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF' }}>Club Group</Text>
                  <Text style={{ fontSize: 10, color: 'rgba(255, 255, 255, 0.7)', marginTop: 2 }}>For Teams</Text>
                </View>
              </View>

              {/* Detailed rows */}
              {[
                {
                  name: 'Sessions per Month',
                  free: { value: '4', desc: 'Perfect for trying out' },
                  personal: { value: 'Unlimited', desc: 'Play whenever you want' },
                  club: { value: 'Unlimited', desc: 'Team tournaments anytime' }
                },
                {
                  name: 'Courts per Session',
                  free: { value: '1 Court', desc: 'Single court matches' },
                  personal: { value: 'Unlimited', desc: 'Multi-court events' },
                  club: { value: 'Unlimited', desc: 'Large venue support' }
                },
                {
                  name: 'Club Management',
                  free: { value: '1 Club', desc: 'Manage one club' },
                  personal: { value: '3 Clubs', desc: 'Multiple communities' },
                  club: { value: '3 Clubs', desc: 'Multiple communities' }
                },
                {
                  name: 'Data Import',
                  free: { value: 'Manual Only', desc: 'Enter players manually' },
                  personal: { value: 'Reclub Import', desc: 'Import from Reclub' },
                  club: { value: 'Reclub Import', desc: 'Quick team setup' }
                },
                {
                  name: 'Collaboration',
                  free: { value: 'Solo', desc: 'Individual use only' },
                  personal: { value: 'Solo', desc: 'Individual use only' },
                  club: { value: 'Up to 5', desc: 'Shared team access' }
                },
              ].map((row, idx) => (
                <View key={idx} style={{ flexDirection: 'row', borderBottomWidth: idx < 4 ? 1 : 0, borderBottomColor: '#F3F4F6' }}>
                  <View style={{ width: 140, padding: 12, justifyContent: 'center', backgroundColor: '#F9FAFB' }}>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: '#111827' }}>{row.name}</Text>
                  </View>
                  <View style={{ flex: 1, padding: 12, borderLeftWidth: 1, borderLeftColor: '#F3F4F6' }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#111827', marginBottom: 2 }}>{row.free.value}</Text>
                    <Text style={{ fontSize: 9, color: '#6B7280', lineHeight: 12 }}>{row.free.desc}</Text>
                  </View>
                  <View style={{ flex: 1, padding: 12, borderLeftWidth: 1, borderLeftColor: '#F3F4F6', backgroundColor: '#FFFBFB' }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#EF4444', marginBottom: 2 }}>{row.personal.value}</Text>
                    <Text style={{ fontSize: 9, color: '#991B1B', lineHeight: 12 }}>{row.personal.desc}</Text>
                  </View>
                  <View style={{ flex: 1, padding: 12, borderLeftWidth: 1, borderLeftColor: '#F3F4F6' }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#3B82F6', marginBottom: 2 }}>{row.club.value}</Text>
                    <Text style={{ fontSize: 9, color: '#1E40AF', lineHeight: 12 }}>{row.club.desc}</Text>
                  </View>
                </View>
              ))}

              {/* Pricing footer */}
              <View style={{ flexDirection: 'row', backgroundColor: '#F9FAFB' }}>
                <View style={{ width: 140, padding: 12 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#111827' }}>Monthly Price</Text>
                </View>
                <View style={{ flex: 1, padding: 12, borderLeftWidth: 1, borderLeftColor: '#E5E7EB', alignItems: 'center' }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#10B981' }}>FREE</Text>
                  <Text style={{ fontSize: 9, color: '#6B7280', marginTop: 1 }}>Forever</Text>
                </View>
                <View style={{ flex: 1, padding: 12, borderLeftWidth: 1, borderLeftColor: '#E5E7EB', alignItems: 'center', backgroundColor: '#FEF2F2' }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#EF4444' }}>IDR 49,000</Text>
                  <Text style={{ fontSize: 9, color: '#991B1B', marginTop: 1 }}>or 299k/year (save 39%)</Text>
                </View>
                <View style={{ flex: 1, padding: 12, borderLeftWidth: 1, borderLeftColor: '#E5E7EB', alignItems: 'center' }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#3B82F6' }}>IDR 139,000</Text>
                  <Text style={{ fontSize: 9, color: '#1E40AF', marginTop: 1 }}>or 699k/year (save 42%)</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>

        {/* Layout 14: Simplified Feature Grid */}
        <View>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 }}>
            Layout 14: Simplified Feature Grid
          </Text>
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E7EB' }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', backgroundColor: '#F9FAFB', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
              <View style={{ flex: 1, padding: 12, alignItems: 'center' }}>
                <View style={{ width: 32, height: 32, backgroundColor: '#F3F4F6', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                  <Text style={{ fontSize: 16 }}>🎁</Text>
                </View>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#111827' }}>Free</Text>
              </View>
              <View style={{ flex: 1, padding: 12, alignItems: 'center', borderLeftWidth: 1, borderLeftColor: '#E5E7EB', backgroundColor: '#FEF2F2' }}>
                <View style={{ width: 32, height: 32, backgroundColor: '#EF4444', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                  <Crown size={16} color="#FFFFFF" />
                </View>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#EF4444' }}>Personal</Text>
              </View>
              <View style={{ flex: 1, padding: 12, alignItems: 'center', borderLeftWidth: 1, borderLeftColor: '#E5E7EB' }}>
                <View style={{ width: 32, height: 32, backgroundColor: '#3B82F6', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                  <Users size={16} color="#FFFFFF" />
                </View>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#3B82F6' }}>Club</Text>
              </View>
            </View>

            {/* Core Metrics */}
            {[
              { icon: '📅', label: 'Sessions', free: '4/mo', personal: '∞', club: '∞' },
              { icon: '🎾', label: 'Courts', free: '1', personal: '∞', club: '∞' },
              { icon: '🏢', label: 'Clubs', free: '1', personal: '3', club: '3' },
              { icon: '📥', label: 'Import', free: '✕', personal: '✓', club: '✓' },
              { icon: '👥', label: 'Team', free: '✕', personal: '✕', club: '5' },
            ].map((row, idx) => (
              <View key={idx} style={{ flexDirection: 'row', borderBottomWidth: idx < 4 ? 1 : 0, borderBottomColor: '#F3F4F6' }}>
                <View style={{ flex: 1, padding: 12, alignItems: 'center' }}>
                  <Text style={{ fontSize: 18, marginBottom: 4 }}>{row.icon}</Text>
                  <Text style={{ fontSize: 10, color: '#6B7280', marginBottom: 6 }}>{row.label}</Text>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#111827' }}>{row.free}</Text>
                </View>
                <View style={{ flex: 1, padding: 12, alignItems: 'center', borderLeftWidth: 1, borderLeftColor: '#F3F4F6', backgroundColor: '#FFFBFB' }}>
                  <Text style={{ fontSize: 18, marginBottom: 4 }}>{row.icon}</Text>
                  <Text style={{ fontSize: 10, color: '#991B1B', marginBottom: 6 }}>{row.label}</Text>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#EF4444' }}>{row.personal}</Text>
                </View>
                <View style={{ flex: 1, padding: 12, alignItems: 'center', borderLeftWidth: 1, borderLeftColor: '#F3F4F6' }}>
                  <Text style={{ fontSize: 18, marginBottom: 4 }}>{row.icon}</Text>
                  <Text style={{ fontSize: 10, color: '#1E40AF', marginBottom: 6 }}>{row.label}</Text>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#3B82F6' }}>{row.club}</Text>
                </View>
              </View>
            ))}

            {/* Price Row */}
            <View style={{ flexDirection: 'row', backgroundColor: '#F9FAFB' }}>
              <View style={{ flex: 1, padding: 14, alignItems: 'center' }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#10B981', marginBottom: 2 }}>FREE</Text>
                <Text style={{ fontSize: 10, color: '#6B7280' }}>Always free</Text>
              </View>
              <View style={{ flex: 1, padding: 14, alignItems: 'center', borderLeftWidth: 1, borderLeftColor: '#E5E7EB', backgroundColor: '#FEF2F2' }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#EF4444', marginBottom: 2 }}>49k</Text>
                <Text style={{ fontSize: 10, color: '#991B1B' }}>per month</Text>
              </View>
              <View style={{ flex: 1, padding: 14, alignItems: 'center', borderLeftWidth: 1, borderLeftColor: '#E5E7EB' }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#3B82F6', marginBottom: 2 }}>139k</Text>
                <Text style={{ fontSize: 10, color: '#1E40AF' }}>per month</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Spacer for bottom */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}
