import { View, Text, ScrollView, TouchableOpacity, Platform, TextInput } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  ChevronLeft, Trophy, MapPin, Calendar, Clock, Users, Target,
  ChevronRight, Check, ChevronDown, ChevronUp, Plus, X, Award
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Sample form data for demo
const sampleData = {
  name: 'Friday Night Padel',
  club: 'Downtown Sports Club',
  sport: 'Padel',
  type: 'Mexicano',
  courts: 3,
  mode: 'Sequential',
  scoringMode: 'Points',
  points: 21,
  date: '2025-01-31',
  time: '19:00',
  duration: 2,
  players: [
    { id: '1', name: 'Alex Johnson', gender: 'male' },
    { id: '2', name: 'Maria Garcia', gender: 'female' },
    { id: '3', name: 'James Smith', gender: 'male' },
    { id: '4', name: 'Sophie Chen', gender: 'female' },
    { id: '5', name: 'Emma Wilson', gender: 'female' },
    { id: '6', name: 'Lucas Brown', gender: 'male' },
  ],
};

export default function CreateSessionLayoutDemo() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedLayout, setSelectedLayout] = useState<number>(1);
  const [currentStep, setCurrentStep] = useState(1); // For wizard
  const [currentTab, setCurrentTab] = useState(0); // For tabs
  const [expandedCard, setExpandedCard] = useState(0); // For cards
  const [advancedOpen, setAdvancedOpen] = useState(false); // For layout 5

  // Tab bar height from _layout.tsx
  const TAB_BAR_HEIGHT = 88;

  // Layout 1: Multi-Step Wizard
  const WizardLayout = () => {
    const totalSteps = 5;
    const progress = (currentStep / totalSteps) * 100;

    return (
      <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
        {/* Progress Bar */}
        <View style={{ backgroundColor: '#FFFFFF', paddingTop: 16, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280' }}>
              Step {currentStep} of {totalSteps}
            </Text>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#EF4444' }}>{Math.round(progress)}%</Text>
          </View>
          <View style={{ height: 6, backgroundColor: '#F3F4F6', borderRadius: 3, overflow: 'hidden' }}>
            <View style={{ width: `${progress}%`, height: '100%', backgroundColor: '#EF4444', borderRadius: 3 }} />
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_HEIGHT + 80 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Step Content */}
          {currentStep === 1 && (
            <View style={{ gap: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8 }}>Session Basics</Text>

              <View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Session Name *</Text>
                <TextInput
                  value={sampleData.name}
                  editable={false}
                  style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827' }}
                />
              </View>

              <View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Club (Optional)</Text>
                <TouchableOpacity style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 15, color: '#111827' }}>{sampleData.club}</Text>
                  <ChevronRight color="#9CA3AF" size={20} />
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Date *</Text>
                  <View style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Calendar color="#6B7280" size={18} />
                    <Text style={{ fontSize: 15, color: '#111827' }}>Jan 31</Text>
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Time</Text>
                  <View style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Clock color="#6B7280" size={18} />
                    <Text style={{ fontSize: 15, color: '#111827' }}>{sampleData.time}</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {currentStep === 2 && (
            <View style={{ gap: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8 }}>Sport & Format</Text>

              <View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Sport *</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {['Padel', 'Tennis'].map((sport) => (
                    <TouchableOpacity key={sport} style={{ flex: 1, backgroundColor: sport === sampleData.sport ? '#EF4444' : '#FFFFFF', borderWidth: 1, borderColor: sport === sampleData.sport ? '#EF4444' : '#D1D5DB', borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}>
                      <Text style={{ fontSize: 15, fontWeight: '600', color: sport === sampleData.sport ? '#FFFFFF' : '#6B7280' }}>{sport}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Game Type *</Text>
                {['Mexicano', 'Americano', 'Fixed Partner', 'Mixed Mexicano'].map((type) => (
                  <TouchableOpacity key={type} style={{ backgroundColor: type === sampleData.type ? '#FEF2F2' : '#FFFFFF', borderWidth: 1, borderColor: type === sampleData.type ? '#EF4444' : '#E5E7EB', borderRadius: 12, padding: 14, marginBottom: 8 }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: type === sampleData.type ? '#EF4444' : '#111827' }}>{type}</Text>
                    {type === sampleData.type && <Check color="#EF4444" size={20} style={{ position: 'absolute', right: 14, top: 14 }} />}
                  </TouchableOpacity>
                ))}
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Courts</Text>
                  <TextInput value={String(sampleData.courts)} editable={false} style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827', textAlign: 'center' }} keyboardType="numeric" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Mode</Text>
                  <TouchableOpacity style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 15, color: '#111827' }}>{sampleData.mode}</Text>
                    <ChevronDown color="#9CA3AF" size={18} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {currentStep === 3 && (
            <View style={{ gap: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8 }}>Scoring Setup</Text>

              <View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Scoring Mode *</Text>
                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                  {['Points', 'First To', 'First to Games', 'Total Games'].map((mode) => (
                    <TouchableOpacity key={mode} style={{ backgroundColor: mode === sampleData.scoringMode ? '#EF4444' : '#FFFFFF', borderWidth: 1, borderColor: mode === sampleData.scoringMode ? '#EF4444' : '#D1D5DB', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: mode === sampleData.scoringMode ? '#FFFFFF' : '#6B7280' }}>{mode}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Points per Match *</Text>
                <TextInput value={String(sampleData.points)} editable={false} style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827' }} keyboardType="numeric" />
                <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 6 }}>Matches will be played to 21 points</Text>
              </View>

              <View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Duration (hours)</Text>
                <TextInput value={String(sampleData.duration)} editable={false} style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827' }} keyboardType="decimal-pad" />
              </View>
            </View>
          )}

          {currentStep === 4 && (
            <View style={{ gap: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827' }}>Players</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#6B7280' }}>{sampleData.players.length} added</Text>
              </View>

              {sampleData.players.map((player) => (
                <View key={player.id} style={{ backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#E5E7EB' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: player.gender === 'male' ? '#DBEAFE' : player.gender === 'female' ? '#FCE7F3' : '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: player.gender === 'male' ? '#3B82F6' : player.gender === 'female' ? '#EC4899' : '#6B7280' }}>
                        {player.name.charAt(0)}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>{player.name}</Text>
                  </View>
                  <TouchableOpacity>
                    <X color="#EF4444" size={20} />
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity style={{ backgroundColor: '#F9FAFB', borderWidth: 2, borderColor: '#E5E7EB', borderStyle: 'dashed', borderRadius: 12, paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                <Plus color="#6B7280" size={20} />
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#6B7280' }}>Add Player</Text>
              </TouchableOpacity>
            </View>
          )}

          {currentStep === 5 && (
            <View style={{ gap: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8 }}>Review & Confirm</Text>

              <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E5E7EB' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>Session Details</Text>
                  <TouchableOpacity onPress={() => setCurrentStep(1)}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#EF4444' }}>Edit</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ gap: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 14, color: '#6B7280' }}>Name:</Text>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>{sampleData.name}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 14, color: '#6B7280' }}>Date:</Text>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>Jan 31, 2025</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 14, color: '#6B7280' }}>Time:</Text>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>{sampleData.time}</Text>
                  </View>
                </View>
              </View>

              <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E5E7EB' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>Game Format</Text>
                  <TouchableOpacity onPress={() => setCurrentStep(2)}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#EF4444' }}>Edit</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ gap: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 14, color: '#6B7280' }}>Sport:</Text>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>{sampleData.sport}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 14, color: '#6B7280' }}>Type:</Text>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>{sampleData.type}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 14, color: '#6B7280' }}>Courts:</Text>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>{sampleData.courts}</Text>
                  </View>
                </View>
              </View>

              <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E5E7EB' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>Players ({sampleData.players.length})</Text>
                  <TouchableOpacity onPress={() => setCurrentStep(4)}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#EF4444' }}>Edit</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {sampleData.players.map((player) => (
                    <View key={player.id} style={{ backgroundColor: '#F9FAFB', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827' }}>{player.name}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={{ backgroundColor: '#EFF6FF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#DBEAFE' }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#1E40AF' }}>✓ All fields validated successfully</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Navigation Buttons */}
        <View style={{
          position: 'absolute',
          bottom: TAB_BAR_HEIGHT,
          left: 0,
          right: 0,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          padding: 16,
          paddingBottom: 16,
          flexDirection: 'row',
          gap: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 5,
        }}>
          {currentStep > 1 && (
            <TouchableOpacity
              onPress={() => setCurrentStep(currentStep - 1)}
              style={{
                flex: 1,
                backgroundColor: '#F3F4F6',
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#374151' }}>Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => currentStep < totalSteps && setCurrentStep(currentStep + 1)}
            style={{
              flex: currentStep > 1 ? 2 : 1,
              backgroundColor: '#EF4444',
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: 'center',
              shadowColor: '#EF4444',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}>
              {currentStep === totalSteps ? 'Create Session' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Layout 2: Tabbed Interface
  const TabbedLayout = () => {
    const tabs = [
      { name: 'Session', icon: Trophy },
      { name: 'Format', icon: Target },
      { name: 'Players', icon: Users },
      { name: 'Review', icon: Check },
    ];

    return (
      <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
        {/* Tab Bar */}
        <View style={{ backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10, paddingVertical: 14 }}>
            {tabs.map((tab, index) => {
              const IconComponent = tab.icon;
              const isActive = currentTab === index;
              const isCompleted = index < currentTab;

              return (
                <TouchableOpacity
                  key={tab.name}
                  onPress={() => setCurrentTab(index)}
                  style={{
                    paddingHorizontal: 18,
                    paddingVertical: 10,
                    borderRadius: 12,
                    backgroundColor: isActive ? '#EF4444' : isCompleted ? '#FEF2F2' : '#F9FAFB',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    borderWidth: 1,
                    borderColor: isActive ? '#EF4444' : isCompleted ? '#FEE2E2' : '#E5E7EB',
                    shadowColor: isActive ? '#EF4444' : 'transparent',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.15,
                    shadowRadius: 4,
                    elevation: isActive ? 2 : 0,
                  }}
                >
                  {isCompleted ? (
                    <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' }}>
                      <Check color="#FFFFFF" size={12} strokeWidth={3} />
                    </View>
                  ) : (
                    <IconComponent color={isActive ? '#FFFFFF' : '#6B7280'} size={18} strokeWidth={2} />
                  )}
                  <Text style={{ fontSize: 14, fontWeight: '700', color: isActive ? '#FFFFFF' : isCompleted ? '#EF4444' : '#6B7280' }}>
                    {tab.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_HEIGHT + 80 }}
          showsVerticalScrollIndicator={false}
        >
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 4 }}>
            {tabs[currentTab].name} Details
          </Text>
          <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 20 }}>
            Complete the information for this section
          </Text>

          {/* Content Card */}
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#E5E7EB', gap: 16 }}>
            {currentTab === 0 && (
              <View style={{ gap: 16 }}>
                <View>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Session Name *</Text>
                  <TextInput
                    value={sampleData.name}
                    editable={false}
                    style={{ backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827' }}
                  />
                </View>
                <View>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Club (Optional)</Text>
                  <TouchableOpacity style={{ backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 15, color: '#111827' }}>{sampleData.club}</Text>
                    <ChevronRight color="#9CA3AF" size={20} />
                  </TouchableOpacity>
                </View>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Date *</Text>
                    <View style={{ backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Calendar color="#6B7280" size={18} />
                      <Text style={{ fontSize: 15, color: '#111827' }}>Jan 31</Text>
                    </View>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Time</Text>
                    <View style={{ backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Clock color="#6B7280" size={18} />
                      <Text style={{ fontSize: 15, color: '#111827' }}>{sampleData.time}</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {currentTab === 1 && (
              <View style={{ gap: 16 }}>
                <View>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Sport *</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {['Padel', 'Tennis'].map((sport) => (
                      <TouchableOpacity key={sport} style={{ flex: 1, backgroundColor: sport === sampleData.sport ? '#EF4444' : '#F9FAFB', borderWidth: 1, borderColor: sport === sampleData.sport ? '#EF4444' : '#E5E7EB', borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}>
                        <Text style={{ fontSize: 15, fontWeight: '600', color: sport === sampleData.sport ? '#FFFFFF' : '#6B7280' }}>{sport}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Game Type *</Text>
                  <TouchableOpacity style={{ backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 15, color: '#111827' }}>{sampleData.type}</Text>
                    <ChevronDown color="#9CA3AF" size={20} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {currentTab === 2 && (
              <View style={{ gap: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#6B7280' }}>{sampleData.players.length} players added</Text>
                {sampleData.players.slice(0, 3).map((player) => (
                  <View key={player.id} style={{ backgroundColor: '#F9FAFB', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: player.gender === 'male' ? '#DBEAFE' : '#FCE7F3', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: player.gender === 'male' ? '#3B82F6' : '#EC4899' }}>
                        {player.name.charAt(0)}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>{player.name}</Text>
                  </View>
                ))}
                <Text style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', marginTop: 4 }}>+ {sampleData.players.length - 3} more players</Text>
              </View>
            )}

            {currentTab === 3 && (
              <View style={{ gap: 12 }}>
                <View style={{ backgroundColor: '#EFF6FF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#DBEAFE' }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#1E40AF' }}>✓ All fields validated</Text>
                </View>
                <View style={{ gap: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
                    <Text style={{ fontSize: 14, color: '#6B7280' }}>Session:</Text>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>{sampleData.name}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
                    <Text style={{ fontSize: 14, color: '#6B7280' }}>Sport:</Text>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>{sampleData.sport}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}>
                    <Text style={{ fontSize: 14, color: '#6B7280' }}>Players:</Text>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>{sampleData.players.length}</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Bottom Button */}
        <View style={{
          position: 'absolute',
          bottom: TAB_BAR_HEIGHT,
          left: 0,
          right: 0,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          padding: 16,
          paddingBottom: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 5,
        }}>
          <TouchableOpacity style={{
            backgroundColor: '#EF4444',
            borderRadius: 12,
            paddingVertical: 14,
            alignItems: 'center',
            shadowColor: '#EF4444',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 4,
          }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}>Create Session</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Layout 3: Card Stack
  const CardStackLayout = () => {
    const cards = [
      { title: 'Session Details', icon: Trophy, fields: ['Session Name', 'Club', 'Date & Time'] },
      { title: 'Game Format', icon: Target, fields: ['Sport', 'Game Type', 'Courts'] },
      { title: 'Scoring', icon: Award, fields: ['Scoring Mode', 'Points', 'Duration'] },
      { title: 'Schedule', icon: Calendar, fields: ['Start Time', 'Duration', 'Court Assignment'] },
      { title: 'Players', icon: Users, fields: [`${sampleData.players.length} players added`] },
    ];

    return (
      <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_HEIGHT + 80, gap: 12 }}
          showsVerticalScrollIndicator={false}
        >
          {cards.map((card, index) => {
            const IconComponent = card.icon;
            const isExpanded = expandedCard === index;
            const isCompleted = index < expandedCard || (index === cards.length - 1 && expandedCard === cards.length - 1);

            return (
              <TouchableOpacity
                key={card.title}
                onPress={() => setExpandedCard(index)}
                activeOpacity={0.7}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 16,
                  borderWidth: 2,
                  borderColor: isExpanded ? '#EF4444' : isCompleted ? '#10B981' : '#E5E7EB',
                  overflow: 'hidden',
                  shadowColor: isExpanded ? '#EF4444' : '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isExpanded ? 0.15 : 0.04,
                  shadowRadius: isExpanded ? 8 : 4,
                  elevation: isExpanded ? 3 : 1,
                }}
              >
                <View style={{ padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                    <View style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      backgroundColor: isExpanded ? '#FEE2E2' : isCompleted ? '#DCFCE7' : '#F9FAFB',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {isCompleted && !isExpanded ? (
                        <Check color="#10B981" size={22} strokeWidth={2.5} />
                      ) : (
                        <IconComponent color={isExpanded ? '#EF4444' : '#6B7280'} size={22} strokeWidth={2} />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 2 }}>{card.title}</Text>
                      <Text style={{ fontSize: 12, color: '#6B7280' }}>
                        {isCompleted ? 'Completed' : `${card.fields.length} fields`}
                      </Text>
                    </View>
                  </View>
                  {isExpanded ? <ChevronUp color="#EF4444" size={24} strokeWidth={2} /> : <ChevronDown color="#9CA3AF" size={24} strokeWidth={2} />}
                </View>

                {isExpanded && (
                  <View style={{ paddingHorizontal: 16, paddingBottom: 16, paddingTop: 4, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
                    {/* Example content for first card */}
                    {index === 0 && (
                      <View style={{ gap: 12, marginTop: 8 }}>
                        <View>
                          <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 }}>Session Name *</Text>
                          <TextInput value={sampleData.name} editable={false} style={{ backgroundColor: '#F9FAFB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#111827' }} />
                        </View>
                        <View>
                          <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 }}>Club (Optional)</Text>
                          <TouchableOpacity style={{ backgroundColor: '#F9FAFB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={{ fontSize: 14, color: '#111827' }}>{sampleData.club}</Text>
                            <ChevronRight color="#9CA3AF" size={18} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}

                    {/* Generic content for other cards */}
                    {index !== 0 && (
                      <View style={{ gap: 10, marginTop: 8 }}>
                        {card.fields.map((field, fieldIndex) => (
                          <View key={fieldIndex} style={{ backgroundColor: '#F9FAFB', borderRadius: 10, padding: 12 }}>
                            <Text style={{ fontSize: 14, color: '#6B7280' }}>{field}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}

          {/* Completion Indicator */}
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E5E7EB', marginTop: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <View style={{ flex: 1, height: 6, backgroundColor: '#F3F4F6', borderRadius: 3, overflow: 'hidden' }}>
                <View style={{ width: `${((expandedCard + 1) / cards.length) * 100}%`, height: '100%', backgroundColor: '#EF4444', borderRadius: 3 }} />
              </View>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#6B7280' }}>{expandedCard + 1}/{cards.length}</Text>
            </View>
            <Text style={{ fontSize: 13, color: '#6B7280', textAlign: 'center' }}>
              Complete all sections to create your session
            </Text>
          </View>
        </ScrollView>

        {/* Floating Action Button */}
        <View style={{ position: 'absolute', bottom: TAB_BAR_HEIGHT + 16, right: 16 }}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={{
              width: 60,
              height: 60,
              borderRadius: 30,
              backgroundColor: '#EF4444',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#EF4444',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <Check color="#FFFFFF" size={30} strokeWidth={3} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Layout 4: Single-Page Compact
  const CompactLayout = () => {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: '#F9FAFB' }}
        contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_HEIGHT + 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Banner */}
        <View style={{
          backgroundColor: '#EFF6FF',
          borderRadius: 12,
          padding: 14,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: '#DBEAFE',
        }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#1E40AF', marginBottom: 2 }}>✨ Compact Layout</Text>
          <Text style={{ fontSize: 11, color: '#3B82F6', lineHeight: 16 }}>
            All fields in one view for quick session creation
          </Text>
        </View>

        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#E5E7EB', gap: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}>
          {/* Session Info */}
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <Trophy color="#EF4444" size={16} strokeWidth={2.5} />
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#EF4444', textTransform: 'uppercase', letterSpacing: 0.6 }}>Session Details</Text>
            </View>
            <TextInput
              value={sampleData.name}
              editable={false}
              placeholder="Session name"
              placeholderTextColor="#9CA3AF"
              style={{
                backgroundColor: '#F9FAFB',
                borderRadius: 10,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontSize: 15,
                fontWeight: '600',
                color: '#111827',
                marginBottom: 10,
                borderWidth: 1,
                borderColor: '#E5E7EB',
              }}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1, backgroundColor: '#F9FAFB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#E5E7EB' }}>
                <Calendar color="#6B7280" size={16} />
                <Text style={{ fontSize: 14, color: '#111827', fontWeight: '500' }}>Jan 31</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: '#F9FAFB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#E5E7EB' }}>
                <Clock color="#6B7280" size={16} />
                <Text style={{ fontSize: 14, color: '#111827', fontWeight: '500' }}>{sampleData.time}</Text>
              </View>
            </View>
          </View>

          {/* Format */}
          <View style={{ borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <Target color="#EF4444" size={16} strokeWidth={2.5} />
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#EF4444', textTransform: 'uppercase', letterSpacing: 0.6 }}>Game Format</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
              {['Padel', 'Tennis'].map((sport) => (
                <TouchableOpacity
                  key={sport}
                  style={{
                    flex: 1,
                    backgroundColor: sport === sampleData.sport ? '#EF4444' : '#F9FAFB',
                    borderRadius: 10,
                    paddingVertical: 10,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: sport === sampleData.sport ? '#EF4444' : '#E5E7EB',
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '700', color: sport === sampleData.sport ? '#FFFFFF' : '#6B7280' }}>
                    {sport}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 2, backgroundColor: '#F9FAFB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: '#E5E7EB' }}>
                <Text style={{ fontSize: 14, color: '#111827', fontWeight: '500' }}>{sampleData.type}</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: '#F9FAFB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' }}>
                <Text style={{ fontSize: 14, color: '#111827', fontWeight: '700' }}>{sampleData.courts} courts</Text>
              </View>
            </View>
          </View>

          {/* Scoring */}
          <View style={{ borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <Award color="#EF4444" size={16} strokeWidth={2.5} />
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#EF4444', textTransform: 'uppercase', letterSpacing: 0.6 }}>Scoring</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1, backgroundColor: '#F9FAFB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: '#E5E7EB' }}>
                <Text style={{ fontSize: 11, color: '#6B7280', marginBottom: 2, fontWeight: '600' }}>Mode</Text>
                <Text style={{ fontSize: 14, color: '#111827', fontWeight: '600' }}>{sampleData.scoringMode}</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: '#F9FAFB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: '#E5E7EB' }}>
                <Text style={{ fontSize: 11, color: '#6B7280', marginBottom: 2, fontWeight: '600' }}>Points</Text>
                <Text style={{ fontSize: 14, color: '#111827', fontWeight: '700' }}>{sampleData.points}</Text>
              </View>
            </View>
          </View>

          {/* Players */}
          <View style={{ borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Users color="#EF4444" size={16} strokeWidth={2.5} />
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#EF4444', textTransform: 'uppercase', letterSpacing: 0.6 }}>Players</Text>
                <View style={{ backgroundColor: '#FEE2E2', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#EF4444' }}>{sampleData.players.length}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={{
                  backgroundColor: '#FEE2E2',
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Plus color="#EF4444" size={18} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {sampleData.players.map((player) => (
                <View
                  key={player.id}
                  style={{
                    backgroundColor: player.gender === 'male' ? '#EFF6FF' : player.gender === 'female' ? '#FCE7F3' : '#F9FAFB',
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    borderWidth: 1,
                    borderColor: player.gender === 'male' ? '#DBEAFE' : player.gender === 'female' ? '#FBCFE8' : '#E5E7EB',
                  }}
                >
                  <View style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: player.gender === 'male' ? '#3B82F6' : player.gender === 'female' ? '#EC4899' : '#9CA3AF',
                  }} />
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827' }}>
                    {player.name.split(' ')[0]}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={{
            backgroundColor: '#EF4444',
            borderRadius: 14,
            paddingVertical: 16,
            alignItems: 'center',
            marginTop: 20,
            shadowColor: '#EF4444',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 12,
            elevation: 6,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>Create Session</Text>
            <ChevronRight color="#FFFFFF" size={20} strokeWidth={3} />
          </View>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  // Layout 5: Glassmorphic Cards (Current Design Enhanced)
  const GlassmorphicLayout = () => {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: '#F9FAFB' }}
        contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_HEIGHT + 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Gradient Background Decoration */}
        <View style={{
          position: 'absolute',
          top: -100,
          right: -50,
          width: 250,
          height: 250,
          borderRadius: 125,
          backgroundColor: '#FEE2E2',
          opacity: 0.3,
        }} />
        <View style={{
          position: 'absolute',
          top: 200,
          left: -80,
          width: 200,
          height: 200,
          borderRadius: 100,
          backgroundColor: '#DBEAFE',
          opacity: 0.2,
        }} />

        {/* Session Details Card */}
        <View style={{
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: 24,
          padding: 20,
          gap: 16,
          marginBottom: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 16,
          elevation: 4,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Trophy color="#EF4444" size={20} strokeWidth={2.5} />
            </View>
            <Text style={{
              fontSize: 13,
              fontWeight: '700',
              color: '#374151',
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}>
              Session Details
            </Text>
          </View>

          <View>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 6 }}>
              Session Name *
            </Text>
            <TextInput
              value={sampleData.name}
              editable={false}
              placeholder="Enter session name"
              placeholderTextColor="#9CA3AF"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderWidth: 1,
                borderColor: 'rgba(209, 213, 219, 0.5)',
                borderRadius: 16,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 15,
                fontWeight: '500',
                color: '#111827',
              }}
            />
          </View>

          <View>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 6 }}>
              Club (Optional)
            </Text>
            <TouchableOpacity style={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              borderWidth: 1,
              borderColor: 'rgba(209, 213, 219, 0.5)',
              borderRadius: 16,
              paddingHorizontal: 16,
              paddingVertical: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
            }}>
              <MapPin color="#9CA3AF" size={18} />
              <Text style={{ flex: 1, fontSize: 15, fontWeight: '500', color: '#111827' }}>
                {sampleData.club}
              </Text>
              <ChevronDown color="#9CA3AF" size={20} />
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 6 }}>
                Date *
              </Text>
              <View style={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderWidth: 1,
                borderColor: 'rgba(209, 213, 219, 0.5)',
                borderRadius: 16,
                paddingHorizontal: 14,
                paddingVertical: 14,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}>
                <Calendar color="#6B7280" size={18} />
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#111827' }}>Jan 31</Text>
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 6 }}>
                Time
              </Text>
              <View style={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderWidth: 1,
                borderColor: 'rgba(209, 213, 219, 0.5)',
                borderRadius: 16,
                paddingHorizontal: 14,
                paddingVertical: 14,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}>
                <Clock color="#6B7280" size={18} />
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#111827' }}>{sampleData.time}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Game Format Card */}
        <View style={{
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: 24,
          padding: 20,
          gap: 16,
          marginBottom: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 16,
          elevation: 4,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Target color="#EF4444" size={20} strokeWidth={2.5} />
            </View>
            <Text style={{
              fontSize: 13,
              fontWeight: '700',
              color: '#374151',
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}>
              Game Format
            </Text>
          </View>

          <View>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 6 }}>
              Sport *
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {['Padel', 'Tennis'].map((sport) => (
                <TouchableOpacity
                  key={sport}
                  style={{
                    flex: 1,
                    backgroundColor: sport === sampleData.sport ? '#EF4444' : 'rgba(255, 255, 255, 0.9)',
                    borderWidth: 1,
                    borderColor: sport === sampleData.sport ? '#EF4444' : 'rgba(209, 213, 219, 0.5)',
                    borderRadius: 14,
                    paddingVertical: 12,
                    alignItems: 'center',
                    shadowColor: sport === sampleData.sport ? '#EF4444' : 'transparent',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 6,
                    elevation: sport === sampleData.sport ? 2 : 0,
                  }}
                >
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '700',
                    color: sport === sampleData.sport ? '#FFFFFF' : '#6B7280',
                  }}>
                    {sport}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 6 }}>
              Game Type *
            </Text>
            <TouchableOpacity style={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              borderWidth: 1,
              borderColor: 'rgba(209, 213, 219, 0.5)',
              borderRadius: 16,
              paddingHorizontal: 16,
              paddingVertical: 14,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <Text style={{ fontSize: 15, fontWeight: '500', color: '#111827' }}>
                {sampleData.type}
              </Text>
              <ChevronDown color="#9CA3AF" size={20} />
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 6 }}>
                Courts
              </Text>
              <View style={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderWidth: 1,
                borderColor: 'rgba(209, 213, 219, 0.5)',
                borderRadius: 14,
                paddingVertical: 12,
                alignItems: 'center',
              }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>
                  {sampleData.courts}
                </Text>
              </View>
            </View>
            <View style={{ flex: 2 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 6 }}>
                Scoring Mode
              </Text>
              <View style={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderWidth: 1,
                borderColor: 'rgba(209, 213, 219, 0.5)',
                borderRadius: 14,
                paddingVertical: 12,
                paddingHorizontal: 14,
                alignItems: 'center',
              }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>
                  {sampleData.scoringMode} • {sampleData.points} pts
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Players Card */}
        <View style={{
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: 24,
          padding: 20,
          gap: 16,
          marginBottom: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 16,
          elevation: 4,
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Users color="#EF4444" size={20} strokeWidth={2.5} />
              </View>
              <Text style={{
                fontSize: 13,
                fontWeight: '700',
                color: '#374151',
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}>
                Players
              </Text>
              <View style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 12,
              }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#EF4444' }}>
                  {sampleData.players.length}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={{
              backgroundColor: '#EF4444',
              width: 32,
              height: 32,
              borderRadius: 10,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#EF4444',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 3,
            }}>
              <Plus color="#FFFFFF" size={18} strokeWidth={3} />
            </TouchableOpacity>
          </View>

          <View style={{ gap: 10 }}>
            {sampleData.players.map((player) => (
              <View
                key={player.id}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  borderWidth: 1,
                  borderColor: 'rgba(229, 231, 235, 0.6)',
                  borderRadius: 16,
                  padding: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: player.gender === 'male' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(236, 72, 153, 0.1)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '700',
                    color: player.gender === 'male' ? '#3B82F6' : '#EC4899',
                  }}>
                    {player.name.charAt(0)}
                  </Text>
                </View>
                <Text style={{ flex: 1, fontSize: 15, fontWeight: '600', color: '#111827' }}>
                  {player.name}
                </Text>
                <TouchableOpacity>
                  <X color="#9CA3AF" size={18} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Advanced Options */}
        <TouchableOpacity
          onPress={() => setAdvancedOpen(!advancedOpen)}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: 20,
            padding: 16,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#374151' }}>
            Advanced Options
          </Text>
          {advancedOpen ? <ChevronUp color="#6B7280" size={20} /> : <ChevronDown color="#6B7280" size={20} />}
        </TouchableOpacity>

        {advancedOpen && (
          <View style={{
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: 24,
            padding: 20,
            marginBottom: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 16,
            elevation: 4,
          }}>
            <Text style={{ fontSize: 13, color: '#6B7280', textAlign: 'center' }}>
              Advanced settings would appear here
            </Text>
          </View>
        )}

        {/* Create Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={{
            backgroundColor: '#EF4444',
            borderRadius: 20,
            paddingVertical: 18,
            alignItems: 'center',
            shadowColor: '#EF4444',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.35,
            shadowRadius: 16,
            elevation: 8,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.5 }}>
            Create Session
          </Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      {/* Header */}
      <View style={{
        paddingTop: Platform.OS === 'ios' ? Math.max(insets.top, 16) + 16 : insets.top + 16,
        paddingBottom: 16,
        paddingHorizontal: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
            <ChevronLeft color="#111827" size={28} strokeWidth={2} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 24, fontWeight: '700', color: '#111827' }}>
              Create Session Layouts
            </Text>
            <Text style={{ fontSize: 13, fontWeight: '500', color: '#6B7280', marginTop: 2 }}>
              {selectedLayout === 1 ? 'Multi-Step Wizard' : selectedLayout === 2 ? 'Tabbed Interface' : selectedLayout === 3 ? 'Card Stack' : selectedLayout === 4 ? 'Compact Single-Page' : 'Glassmorphic Cards'}
            </Text>
          </View>
        </View>

        {/* Layout Selector */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[1, 2, 3, 4, 5].map((layout) => (
            <TouchableOpacity
              key={layout}
              onPress={() => {
                setSelectedLayout(layout);
                setCurrentStep(1);
                setCurrentTab(0);
                setExpandedCard(0);
                setAdvancedOpen(false);
              }}
              style={{
                flex: 1,
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 10,
                backgroundColor: selectedLayout === layout ? '#EF4444' : '#F3F4F6',
                alignItems: 'center',
              }}
            >
              <Text style={{
                fontSize: 13,
                fontWeight: '700',
                color: selectedLayout === layout ? '#FFFFFF' : '#6B7280',
              }}>
                {layout}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Layout Content */}
      {selectedLayout === 1 && <WizardLayout />}
      {selectedLayout === 2 && <TabbedLayout />}
      {selectedLayout === 3 && <CardStackLayout />}
      {selectedLayout === 4 && <CompactLayout />}
      {selectedLayout === 5 && <GlassmorphicLayout />}
    </View>
  );
}
