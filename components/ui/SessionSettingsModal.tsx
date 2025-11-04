import { View, Text, TouchableOpacity, Modal, Switch, Platform } from 'react-native';
import { X, Zap, Moon, Type, Edit3 } from 'lucide-react-native';
import { useTheme, FontSize, ThemeMode, getThemeColors } from '../../contexts/ThemeContext';
import { useScoreEntryPreference, ScoreEntryMode } from '../../hooks/useScoreEntryPreference';

interface SessionSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function SessionSettingsModal({
  visible,
  onClose,
}: SessionSettingsModalProps) {
  const {
    themeMode,
    setThemeMode,
    isDark,
    fontSize,
    setFontSize,
    fontScale,
    reduceAnimation,
    toggleReduceAnimation,
  } = useTheme();

  const { scoreEntryMode, setScoreEntryMode } = useScoreEntryPreference();

  const colors = getThemeColors(isDark);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <View style={{ backgroundColor: colors.card }} className="rounded-t-3xl pt-6 pb-8">
          {/* Header */}
          <View className="flex-row items-center justify-between px-6 mb-4">
            <Text style={{ color: colors.text, fontSize: 20 * fontScale }} className="font-bold">
              Settings
            </Text>
            <TouchableOpacity onPress={onClose} accessible accessibilityRole="button" accessibilityLabel="Close settings">
              <X color={colors.textSecondary} size={24} />
            </TouchableOpacity>
          </View>

          {/* Settings List */}
          <View className="px-6">
            {/* Dark Mode Toggle */}
            <View style={{ borderBottomColor: colors.border }} className="py-4 border-b">
              <View className="flex-1">
                <View className="flex-row items-center gap-2 mb-2">
                  <Moon color={colors.textSecondary} size={18} />
                  <Text style={{ color: colors.text, fontSize: 16 * fontScale }} className="font-semibold">
                    Dark Mode
                  </Text>
                </View>
                <Text style={{ color: colors.textSecondary, fontSize: 14 * fontScale }} className="mb-3">
                  Choose your preferred theme
                </Text>
                <View className="flex-row gap-2">
                  {(['light', 'dark', 'system'] as ThemeMode[]).map((mode) => (
                    <TouchableOpacity
                      key={mode}
                      onPress={() => setThemeMode(mode)}
                      className="flex-1 py-2.5 px-3 rounded-lg"
                      style={{
                        backgroundColor: themeMode === mode ? colors.primary : colors.grayLight,
                      }}
                      accessible
                      accessibilityRole="button"
                      accessibilityLabel={`${mode} mode`}
                      accessibilityState={{ selected: themeMode === mode }}
                    >
                      <Text
                        style={{
                          color: themeMode === mode ? '#FFFFFF' : colors.text,
                          fontSize: 14 * fontScale,
                        }}
                        className="font-medium text-center capitalize"
                      >
                        {mode}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Font Size Selector */}
            <View style={{ borderBottomColor: colors.border }} className="py-4 border-b">
              <View className="flex-1">
                <View className="flex-row items-center gap-2 mb-2">
                  <Type color={colors.textSecondary} size={18} />
                  <Text style={{ color: colors.text, fontSize: 16 * fontScale }} className="font-semibold">
                    Font Size
                  </Text>
                </View>
                <Text style={{ color: colors.textSecondary, fontSize: 14 * fontScale }} className="mb-3">
                  Adjust text size for better readability
                </Text>
                <View className="flex-row gap-2">
                  {(['small', 'medium', 'large'] as FontSize[]).map((size) => (
                    <TouchableOpacity
                      key={size}
                      onPress={() => setFontSize(size)}
                      className="flex-1 py-2.5 px-3 rounded-lg"
                      style={{
                        backgroundColor: fontSize === size ? colors.primary : colors.grayLight,
                      }}
                      accessible
                      accessibilityRole="button"
                      accessibilityLabel={`${size} font size`}
                      accessibilityState={{ selected: fontSize === size }}
                    >
                      <Text
                        style={{
                          color: fontSize === size ? '#FFFFFF' : colors.text,
                          fontSize: size === 'small' ? 12 : size === 'medium' ? 14 : 16,
                        }}
                        className="font-medium text-center capitalize"
                      >
                        {size}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Score Entry Mode Selector */}
            <View style={{ borderBottomColor: colors.border }} className="py-4 border-b">
              <View className="flex-1">
                <View className="flex-row items-center gap-2 mb-2">
                  <Edit3 color={colors.textSecondary} size={18} />
                  <Text style={{ color: colors.text, fontSize: 16 * fontScale }} className="font-semibold">
                    Score Entry Method
                  </Text>
                </View>
                <Text style={{ color: colors.textSecondary, fontSize: 14 * fontScale }} className="mb-3">
                  Choose how to enter match scores
                </Text>
                <View className="flex-row gap-2">
                  {([
                    { value: 'inline', label: 'Inline', description: 'Quick textbox' },
                    { value: 'modal', label: 'Modal', description: 'Full screen' },
                  ] as { value: ScoreEntryMode; label: string; description: string }[]).map((mode) => (
                    <TouchableOpacity
                      key={mode.value}
                      onPress={() => setScoreEntryMode(mode.value)}
                      className="flex-1 py-3 px-3 rounded-lg"
                      style={{
                        backgroundColor: scoreEntryMode === mode.value ? colors.primary : colors.grayLight,
                      }}
                      accessible
                      accessibilityRole="button"
                      accessibilityLabel={`${mode.label} score entry`}
                      accessibilityState={{ selected: scoreEntryMode === mode.value }}
                    >
                      <Text
                        style={{
                          color: scoreEntryMode === mode.value ? '#FFFFFF' : colors.text,
                          fontSize: 14 * fontScale,
                        }}
                        className="font-semibold text-center mb-1"
                      >
                        {mode.label}
                      </Text>
                      <Text
                        style={{
                          color: scoreEntryMode === mode.value ? '#FFFFFF' : colors.textSecondary,
                          fontSize: 12 * fontScale,
                        }}
                        className="text-center"
                      >
                        {mode.description}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Reduce Animation Toggle */}
            <View style={{ borderBottomColor: colors.border }} className="flex-row items-center justify-between py-4 border-b">
              <View className="flex-1 mr-4">
                <View className="flex-row items-center gap-2 mb-1">
                  <Zap color={colors.textSecondary} size={18} />
                  <Text style={{ color: colors.text, fontSize: 16 * fontScale }} className="font-semibold">
                    Reduce Animation
                  </Text>
                </View>
                <Text style={{ color: colors.textSecondary, fontSize: 14 * fontScale }}>
                  Use static backgrounds for better performance
                </Text>
              </View>
              <Switch
                value={reduceAnimation}
                onValueChange={toggleReduceAnimation}
                trackColor={{
                  false: Platform.OS === 'ios' ? colors.border : colors.textTertiary,
                  true: Platform.OS === 'ios' ? colors.primaryLight : colors.primary,
                }}
                thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : reduceAnimation ? '#FFFFFF' : colors.grayLight}
                ios_backgroundColor={colors.border}
                accessible
                accessibilityRole="switch"
                accessibilityLabel="Reduce animation toggle"
                accessibilityState={{ checked: reduceAnimation }}
              />
            </View>
          </View>

          {/* Close Button */}
          <View className="px-6 mt-6">
            <TouchableOpacity
              className="rounded-lg py-3"
              style={{ backgroundColor: colors.grayLight }}
              onPress={onClose}
              accessible
              accessibilityRole="button"
              accessibilityLabel="Close settings"
            >
              <Text style={{ color: colors.text, fontSize: 16 * fontScale }} className="font-semibold text-center">
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
