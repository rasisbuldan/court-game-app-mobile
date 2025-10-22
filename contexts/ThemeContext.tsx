import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

export type FontSize = 'small' | 'medium' | 'large';
export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  // Theme mode
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  isDark: boolean;

  // Font size
  fontSize: FontSize;
  setFontSize: (size: FontSize) => Promise<void>;
  fontScale: number;

  // Reduce animation
  reduceAnimation: boolean;
  setReduceAnimation: (value: boolean) => Promise<void>;
  toggleReduceAnimation: () => Promise<void>;

  // Loading state
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_MODE_KEY = '@courtster_theme_mode';
const FONT_SIZE_KEY = '@courtster_font_size';
const REDUCE_ANIMATION_KEY = '@courtster_reduce_animation';

const FONT_SCALE_MAP: Record<FontSize, number> = {
  small: 0.875,  // 87.5% of base size
  medium: 1.0,   // 100% (default)
  large: 1.125,  // 112.5% of base size
};

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();

  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [fontSize, setFontSizeState] = useState<FontSize>('medium');
  const [reduceAnimation, setReduceAnimationState] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate isDark based on theme mode
  const isDark = themeMode === 'system'
    ? systemColorScheme === 'dark'
    : themeMode === 'dark';

  // Get font scale multiplier
  const fontScale = FONT_SCALE_MAP[fontSize];

  // Load all preferences on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const [storedThemeMode, storedFontSize, storedReduceAnimation] = await Promise.all([
        AsyncStorage.getItem(THEME_MODE_KEY),
        AsyncStorage.getItem(FONT_SIZE_KEY),
        AsyncStorage.getItem(REDUCE_ANIMATION_KEY),
      ]);

      if (storedThemeMode) {
        setThemeModeState(storedThemeMode as ThemeMode);
      }
      if (storedFontSize) {
        setFontSizeState(storedFontSize as FontSize);
      }
      if (storedReduceAnimation !== null) {
        setReduceAnimationState(storedReduceAnimation === 'true');
      }
    } catch (error) {
      console.error('Failed to load theme preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_MODE_KEY, mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error('Failed to save theme mode:', error);
    }
  };

  const setFontSize = async (size: FontSize) => {
    try {
      await AsyncStorage.setItem(FONT_SIZE_KEY, size);
      setFontSizeState(size);
    } catch (error) {
      console.error('Failed to save font size:', error);
    }
  };

  const setReduceAnimation = async (value: boolean) => {
    try {
      await AsyncStorage.setItem(REDUCE_ANIMATION_KEY, value.toString());
      setReduceAnimationState(value);
    } catch (error) {
      console.error('Failed to save animation preference:', error);
    }
  };

  const toggleReduceAnimation = async () => {
    await setReduceAnimation(!reduceAnimation);
  };

  const value: ThemeContextType = {
    themeMode,
    setThemeMode,
    isDark,
    fontSize,
    setFontSize,
    fontScale,
    reduceAnimation,
    setReduceAnimation,
    toggleReduceAnimation,
    isLoading,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Theme color utilities
export const colors = {
  light: {
    background: '#FFFFFF',
    backgroundSecondary: '#F9FAFB',
    text: '#111827',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    card: '#FFFFFF',
    primary: '#3B82F6',
    primaryLight: '#DBEAFE',
    success: '#10B981',
    successLight: '#D1FAE5',
    warning: '#F59E0B',
    warningLight: '#FEF3C7',
    error: '#EF4444',
    errorLight: '#FEE2E2',
    gray: '#6B7280',
    grayLight: '#F3F4F6',
  },
  dark: {
    background: '#111827',
    backgroundSecondary: '#1F2937',
    text: '#F9FAFB',
    textSecondary: '#D1D5DB',
    textTertiary: '#9CA3AF',
    border: '#374151',
    borderLight: '#1F2937',
    card: '#1F2937',
    primary: '#60A5FA',
    primaryLight: '#1E3A8A',
    success: '#34D399',
    successLight: '#064E3B',
    warning: '#FBBF24',
    warningLight: '#78350F',
    error: '#F87171',
    errorLight: '#7F1D1D',
    gray: '#9CA3AF',
    grayLight: '#374151',
  },
};

export function getThemeColors(isDark: boolean) {
  return isDark ? colors.dark : colors.light;
}
