import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ANIMATION_PREFERENCE_KEY = '@courtster_reduce_animation';

export function useAnimationPreference() {
  const [reduceAnimation, setReduceAnimationState] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load preference on mount
  useEffect(() => {
    loadPreference();
  }, []);

  const loadPreference = async () => {
    try {
      const value = await AsyncStorage.getItem(ANIMATION_PREFERENCE_KEY);
      if (value !== null) {
        setReduceAnimationState(value === 'true');
      }
    } catch (error) {
      console.error('Failed to load animation preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setReduceAnimation = useCallback(async (value: boolean) => {
    try {
      await AsyncStorage.setItem(ANIMATION_PREFERENCE_KEY, value.toString());
      setReduceAnimationState(value);
    } catch (error) {
      console.error('Failed to save animation preference:', error);
    }
  }, []);

  const toggleReduceAnimation = useCallback(async () => {
    const newValue = !reduceAnimation;
    await setReduceAnimation(newValue);
  }, [reduceAnimation, setReduceAnimation]);

  return {
    reduceAnimation,
    setReduceAnimation,
    toggleReduceAnimation,
    isLoading,
  };
}
