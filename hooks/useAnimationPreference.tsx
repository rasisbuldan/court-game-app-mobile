/**
 * @deprecated Use `useTheme` from '../../contexts/ThemeContext' instead.
 * This hook is now a wrapper around ThemeContext for backwards compatibility.
 * Animation preferences are now synced with Supabase via the user_settings table.
 */

import { useTheme } from '../contexts/ThemeContext';

export function useAnimationPreference() {
  const { reduceAnimation, setReduceAnimation, toggleReduceAnimation, isLoading } = useTheme();

  return {
    reduceAnimation,
    setReduceAnimation,
    toggleReduceAnimation,
    isLoading,
  };
}
