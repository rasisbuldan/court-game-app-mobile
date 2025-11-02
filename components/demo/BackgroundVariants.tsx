import { View, Text, ScrollView, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export function BackgroundVariants() {
  return (
    <ScrollView style={{ flex: 1 }}>
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 8 }}>
          Background Design Ideas
        </Text>
        <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 20 }}>
          5 background concepts that add depth and match the court/sports theme
        </Text>

        {/* Variant 1: Court Lines Pattern */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#6B7280', marginBottom: 12 }}>
            Option 1: Subtle Court Lines Pattern
          </Text>
          <View style={{ height: 400, borderRadius: 20, overflow: 'hidden', position: 'relative' }}>
            {/* Base gradient */}
            <View style={{ position: 'absolute', inset: 0, backgroundColor: '#F9FAFB' }} />

            {/* Court grid lines - very subtle */}
            <View style={{ position: 'absolute', inset: 0, opacity: 0.08 }}>
              {/* Vertical lines */}
              {[0, 1, 2, 3, 4].map((i) => (
                <View
                  key={`v-${i}`}
                  style={{
                    position: 'absolute',
                    left: `${i * 25}%`,
                    top: 0,
                    bottom: 0,
                    width: 1,
                    backgroundColor: '#EF4444',
                  }}
                />
              ))}
              {/* Horizontal lines */}
              {[0, 1, 2, 3].map((i) => (
                <View
                  key={`h-${i}`}
                  style={{
                    position: 'absolute',
                    top: `${i * 33}%`,
                    left: 0,
                    right: 0,
                    height: 1,
                    backgroundColor: '#EF4444',
                  }}
                />
              ))}
            </View>

            {/* Gradient overlays */}
            <View style={{ position: 'absolute', width: 200, height: 200, top: -50, left: -50, backgroundColor: '#FEE2E2', borderRadius: 100, opacity: 0.4 }} />
            <View style={{ position: 'absolute', width: 180, height: 180, bottom: -40, right: -40, backgroundColor: '#DBEAFE', borderRadius: 90, opacity: 0.3 }} />

            {/* Content preview */}
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>Session Card</Text>
                <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>Subtle court lines in background</Text>
              </View>
            </View>
          </View>
          <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 8, fontStyle: 'italic' }}>
            • Very subtle grid lines mimicking court markings{'\n'}
            • Soft gradient blobs for depth{'\n'}
            • Professional and clean look
          </Text>
        </View>

        {/* Variant 2: Diagonal Stripes (Like Court Surface) */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#6B7280', marginBottom: 12 }}>
            Option 2: Diagonal Texture (Court Surface)
          </Text>
          <View style={{ height: 400, borderRadius: 20, overflow: 'hidden', position: 'relative' }}>
            <View style={{ position: 'absolute', inset: 0, backgroundColor: '#F9FAFB' }} />

            {/* Diagonal pattern */}
            <View style={{ position: 'absolute', inset: 0, opacity: 0.03 }}>
              {[...Array(40)].map((_, i) => (
                <View
                  key={i}
                  style={{
                    position: 'absolute',
                    width: 2,
                    height: 800,
                    backgroundColor: '#EF4444',
                    transform: [{ rotate: '45deg' }],
                    left: i * 20 - 200,
                    top: -200,
                  }}
                />
              ))}
            </View>

            {/* Gradient orbs */}
            <View style={{ position: 'absolute', width: 250, height: 250, top: -80, right: -80, backgroundColor: '#FEE2E2', borderRadius: 125, opacity: 0.5 }} />
            <View style={{ position: 'absolute', width: 180, height: 180, bottom: -60, left: -60, backgroundColor: '#E0E7FF', borderRadius: 90, opacity: 0.4 }} />

            {/* Content preview */}
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>Session Card</Text>
                <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>Diagonal texture pattern</Text>
              </View>
            </View>
          </View>
          <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 8, fontStyle: 'italic' }}>
            • Diagonal lines like court surface texture{'\n'}
            • Adds movement and energy{'\n'}
            • Gradient orbs create layered depth
          </Text>
        </View>

        {/* Variant 3: Layered Shapes (Abstract Courts) */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#6B7280', marginBottom: 12 }}>
            Option 3: Layered Rectangles (Abstract Courts)
          </Text>
          <View style={{ height: 400, borderRadius: 20, overflow: 'hidden', position: 'relative' }}>
            <View style={{ position: 'absolute', inset: 0, backgroundColor: '#F9FAFB' }} />

            {/* Abstract court shapes */}
            <View style={{ position: 'absolute', width: 280, height: 160, top: 50, left: -80, backgroundColor: '#FEE2E2', borderRadius: 16, opacity: 0.3, transform: [{ rotate: '-15deg' }] }} />
            <View style={{ position: 'absolute', width: 240, height: 140, top: 100, right: -60, backgroundColor: '#DBEAFE', borderRadius: 16, opacity: 0.25, transform: [{ rotate: '12deg' }] }} />
            <View style={{ position: 'absolute', width: 200, height: 120, bottom: 80, left: 40, backgroundColor: '#D1FAE5', borderRadius: 16, opacity: 0.2, transform: [{ rotate: '8deg' }] }} />

            {/* Small accent shapes */}
            <View style={{ position: 'absolute', width: 60, height: 60, top: 200, right: 30, backgroundColor: '#FED7AA', borderRadius: 30, opacity: 0.3 }} />
            <View style={{ position: 'absolute', width: 40, height: 40, bottom: 150, left: 50, backgroundColor: '#F3E8FF', borderRadius: 20, opacity: 0.3 }} />

            {/* Content preview */}
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>Session Card</Text>
                <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>Abstract court shapes</Text>
              </View>
            </View>
          </View>
          <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 8, fontStyle: 'italic' }}>
            • Rotated rectangles represent abstract courts{'\n'}
            • Multiple layers create depth{'\n'}
            • Playful and modern aesthetic
          </Text>
        </View>

        {/* Variant 4: Mesh Gradient (Premium) */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#6B7280', marginBottom: 12 }}>
            Option 4: Mesh Gradient (Premium Feel)
          </Text>
          <View style={{ height: 400, borderRadius: 20, overflow: 'hidden', position: 'relative' }}>
            {/* Multi-color gradient blobs */}
            <View style={{ position: 'absolute', inset: 0, backgroundColor: '#FAFAFA' }} />

            <View style={{ position: 'absolute', width: 300, height: 300, top: -100, left: -100, backgroundColor: '#FEE2E2', borderRadius: 150, opacity: 0.6, }}>
              <View style={{ width: '100%', height: '100%', backgroundColor: '#FED7AA', borderRadius: 150, opacity: 0.3, transform: [{ scale: 0.7 }] }} />
            </View>

            <View style={{ position: 'absolute', width: 280, height: 280, top: 50, right: -80, backgroundColor: '#DBEAFE', borderRadius: 140, opacity: 0.5 }}>
              <View style={{ width: '100%', height: '100%', backgroundColor: '#E0E7FF', borderRadius: 140, opacity: 0.4, transform: [{ scale: 0.6 }] }} />
            </View>

            <View style={{ position: 'absolute', width: 220, height: 220, bottom: -60, left: 60, backgroundColor: '#D1FAE5', borderRadius: 110, opacity: 0.4 }}>
              <View style={{ width: '100%', height: '100%', backgroundColor: '#A7F3D0', borderRadius: 110, opacity: 0.3, transform: [{ scale: 0.7 }] }} />
            </View>

            {/* Content preview */}
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>Session Card</Text>
                <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>Mesh gradient background</Text>
              </View>
            </View>
          </View>
          <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 8, fontStyle: 'italic' }}>
            • Multiple overlapping gradient orbs{'\n'}
            • Premium, modern aesthetic{'\n'}
            • Smooth color transitions
          </Text>
        </View>

        {/* Variant 5: Dot Grid Pattern */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#6B7280', marginBottom: 12 }}>
            Option 5: Dot Grid (Technical/Court Net)
          </Text>
          <View style={{ height: 400, borderRadius: 20, overflow: 'hidden', position: 'relative' }}>
            <View style={{ position: 'absolute', inset: 0, backgroundColor: '#F9FAFB' }} />

            {/* Dot pattern */}
            <View style={{ position: 'absolute', inset: 0, opacity: 0.15 }}>
              {[...Array(15)].map((_, row) => (
                <View key={row} style={{ flexDirection: 'row', marginBottom: 24 }}>
                  {[...Array(10)].map((_, col) => (
                    <View
                      key={col}
                      style={{
                        width: 3,
                        height: 3,
                        borderRadius: 1.5,
                        backgroundColor: '#EF4444',
                        marginRight: 32,
                        marginLeft: col === 0 ? 16 : 0,
                      }}
                    />
                  ))}
                </View>
              ))}
            </View>

            {/* Gradient overlays */}
            <View style={{ position: 'absolute', width: 220, height: 220, top: -60, left: -60, backgroundColor: '#FEE2E2', borderRadius: 110, opacity: 0.5 }} />
            <View style={{ position: 'absolute', width: 200, height: 200, bottom: -50, right: -50, backgroundColor: '#DBEAFE', borderRadius: 100, opacity: 0.4 }} />
            <View style={{ position: 'absolute', width: 150, height: 150, top: 140, right: 40, backgroundColor: '#FED7AA', borderRadius: 75, opacity: 0.25 }} />

            {/* Content preview */}
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>Session Card</Text>
                <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>Dot grid pattern</Text>
              </View>
            </View>
          </View>
          <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 8, fontStyle: 'italic' }}>
            • Subtle dot grid like court net texture{'\n'}
            • Technical and precise feel{'\n'}
            • Gradient blobs soften the pattern
          </Text>
        </View>

        {/* Implementation Notes */}
        <View style={{ backgroundColor: '#EFF6FF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#DBEAFE', marginBottom: 32 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E40AF', marginBottom: 8 }}>
            💡 Implementation Tips
          </Text>
          <Text style={{ fontSize: 13, color: '#1E3A8A', lineHeight: 20 }}>
            • Keep opacity low (0.03-0.15 for patterns, 0.2-0.5 for blobs){'\n'}
            • Use multiple layers for depth{'\n'}
            • Ensure high contrast with white card surfaces{'\n'}
            • Consider animation for gradient orbs (subtle movement){'\n'}
            • Test on both light and dark device settings{'\n'}
            • Use overflow: 'hidden' on container to clip patterns
          </Text>
        </View>

        {/* Recommendation */}
        <View style={{ backgroundColor: '#FEF2F2', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#FEE2E2', marginBottom: 32 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#991B1B', marginBottom: 8 }}>
            ⭐ Recommended Combination
          </Text>
          <Text style={{ fontSize: 13, color: '#7F1D1D', lineHeight: 20 }}>
            For Courtster, I'd recommend:{'\n\n'}
            <Text style={{ fontWeight: '600' }}>Option 1 (Court Lines)</Text> or <Text style={{ fontWeight: '600' }}>Option 3 (Layered Rectangles)</Text>{'\n\n'}
            Both directly reference courts/sports while maintaining a clean, professional aesthetic. Option 3 is more playful and modern, while Option 1 is more subtle and elegant.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
