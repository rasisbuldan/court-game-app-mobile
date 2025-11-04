/**
 * Score Entry Preference Hook
 *
 * Manages user preference for score entry method:
 * - 'inline': Direct textbox input in match card
 * - 'modal': Full-screen modal with enhanced UI
 *
 * Preference is persisted to AsyncStorage.
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Logger } from '../utils/logger';

export type ScoreEntryMode = 'inline' | 'modal';

const SCORE_ENTRY_PREFERENCE_KEY = '@courtster/score_entry_preference';

export function useScoreEntryPreference() {
  const [scoreEntryMode, setScoreEntryMode] = useState<ScoreEntryMode>('modal'); // Default to modal
  const [isLoading, setIsLoading] = useState(true);

  // Load preference from storage on mount
  useEffect(() => {
    const loadPreference = async () => {
      try {
        const stored = await AsyncStorage.getItem(SCORE_ENTRY_PREFERENCE_KEY);
        if (stored === 'inline' || stored === 'modal') {
          setScoreEntryMode(stored);
        }
      } catch (error) {
        Logger.error('Failed to load score entry preference', error as Error, { action: 'loadScoreEntryPreference' });
      } finally {
        setIsLoading(false);
      }
    };

    loadPreference();
  }, []);

  // Save preference to storage
  const setPreference = useCallback(async (mode: ScoreEntryMode) => {
    try {
      await AsyncStorage.setItem(SCORE_ENTRY_PREFERENCE_KEY, mode);
      setScoreEntryMode(mode);
    } catch (error) {
      Logger.error('Failed to save score entry preference', error as Error, { action: 'saveScoreEntryPreference', mode });
    }
  }, []);

  return {
    scoreEntryMode,
    setScoreEntryMode: setPreference,
    isLoading,
  };
}
