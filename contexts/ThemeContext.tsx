import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import { useSettings } from '../hooks/useSettings';
import { Logger } from '../utils/logger';

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

const FONT_SIZE_KEY = '@courtster_font_size'; // Keep fontSize in AsyncStorage (not critical for beta)

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

  // Use Supabase-backed settings (depends on auth)
  const { settings, isLoading: settingsLoading, updateSettings } = useSettings();

  // fontSize stays in AsyncStorage (not critical for beta sync)
  const [fontSize, setFontSizeState] = useState<FontSize>('medium');
  const [fontSizeLoading, setFontSizeLoading] = useState(true);

  // Derive values from Supabase settings (with defaults)
  const themeMode = settings?.theme || 'system';
  const reduceAnimation = settings ? !settings.animations_enabled : false; // Inverted: animations_enabled -> reduceAnimation

  // Calculate isDark based on theme mode
  const isDark = themeMode === 'system'
    ? systemColorScheme === 'dark'
    : themeMode === 'dark';

  // Get font scale multiplier
  const fontScale = FONT_SCALE_MAP[fontSize];

  // Combined loading state
  const isLoading = settingsLoading || fontSizeLoading;

  // Load fontSize from AsyncStorage on mount
  useEffect(() => {
    loadFontSize();
  }, []);

  const loadFontSize = async () => {
    try {
      const storedFontSize = await AsyncStorage.getItem(FONT_SIZE_KEY);
      if (storedFontSize) {
        setFontSizeState(storedFontSize as FontSize);
      }
    } catch (error) {
      Logger.error('ThemeContext: Failed to load font size', error as Error, {
        action: 'load_font_size',
      });
    } finally {
      setFontSizeLoading(false);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      updateSettings({ theme: mode });
    } catch (error) {
      Logger.error('ThemeContext: Failed to save theme mode', error as Error, {
        action: 'save_theme_mode',
        metadata: { mode },
      });
    }
  };

  const setFontSize = async (size: FontSize) => {
    try {
      await AsyncStorage.setItem(FONT_SIZE_KEY, size);
      setFontSizeState(size);
    } catch (error) {
      Logger.error('ThemeContext: Failed to save font size', error as Error, {
        action: 'save_font_size',
        metadata: { size },
      });
    }
  };

  const setReduceAnimation = async (value: boolean) => {
    try {
      // Invert: reduceAnimation (UI) -> animations_enabled (backend)
      updateSettings({ animations_enabled: !value });
    } catch (error) {
      Logger.error('ThemeContext: Failed to save animation preference', error as Error, {
        action: 'save_animation_preference',
        metadata: { value },
      });
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
