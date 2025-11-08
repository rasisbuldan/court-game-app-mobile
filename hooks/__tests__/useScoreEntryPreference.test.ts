/**
 * useScoreEntryPreference Hook Tests
 *
 * Comprehensive unit tests for score entry preference hook covering:
 * - Default preference value ('modal')
 * - Preference loading from AsyncStorage on mount
 * - Preference updates with persistence
 * - Invalid stored value handling
 * - Storage error handling
 * - Loading state management
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useScoreEntryPreference, ScoreEntryMode } from '../useScoreEntryPreference';
import { Logger } from '../../utils/logger';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock Logger
jest.mock('../../utils/logger', () => ({
  Logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

const SCORE_ENTRY_PREFERENCE_KEY = '@courtster/score_entry_preference';

describe('useScoreEntryPreference Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State & Loading', () => {
    it('should default to modal mode when no stored preference exists', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const { result } = renderHook(() => useScoreEntryPreference());

      // Initially loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.scoreEntryMode).toBe('modal');

      // Wait for loading to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.scoreEntryMode).toBe('modal');
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(SCORE_ENTRY_PREFERENCE_KEY);
    });

    it('should load modal preference from storage on mount', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('modal');

      const { result } = renderHook(() => useScoreEntryPreference());

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.scoreEntryMode).toBe('modal');
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(SCORE_ENTRY_PREFERENCE_KEY);
    });

    it('should load inline preference from storage on mount', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('inline');

      const { result } = renderHook(() => useScoreEntryPreference());

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.scoreEntryMode).toBe('inline');
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(SCORE_ENTRY_PREFERENCE_KEY);
    });
  });

  describe('Preference Updates', () => {
    beforeEach(() => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    });

    it('should update preference to inline mode and persist to storage', async () => {
      const { result } = renderHook(() => useScoreEntryPreference());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.scoreEntryMode).toBe('modal');

      await act(async () => {
        await result.current.setScoreEntryMode('inline');
      });

      expect(result.current.scoreEntryMode).toBe('inline');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        SCORE_ENTRY_PREFERENCE_KEY,
        'inline'
      );
    });

    it('should update preference to modal mode and persist to storage', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('inline');

      const { result } = renderHook(() => useScoreEntryPreference());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.scoreEntryMode).toBe('inline');

      await act(async () => {
        await result.current.setScoreEntryMode('modal');
      });

      expect(result.current.scoreEntryMode).toBe('modal');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        SCORE_ENTRY_PREFERENCE_KEY,
        'modal'
      );
    });

    it('should handle multiple preference updates', async () => {
      const { result } = renderHook(() => useScoreEntryPreference());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // First update
      await act(async () => {
        await result.current.setScoreEntryMode('inline');
      });

      expect(result.current.scoreEntryMode).toBe('inline');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        SCORE_ENTRY_PREFERENCE_KEY,
        'inline'
      );

      // Second update
      await act(async () => {
        await result.current.setScoreEntryMode('modal');
      });

      expect(result.current.scoreEntryMode).toBe('modal');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        SCORE_ENTRY_PREFERENCE_KEY,
        'modal'
      );

      expect(AsyncStorage.setItem).toHaveBeenCalledTimes(2);
    });
  });

  describe('Invalid Value Handling', () => {
    it('should fallback to default when stored value is invalid', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('quick');

      const { result } = renderHook(() => useScoreEntryPreference());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should remain at default 'modal' since 'quick' is not valid
      expect(result.current.scoreEntryMode).toBe('modal');
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(SCORE_ENTRY_PREFERENCE_KEY);
    });

    it('should fallback to default when stored value is empty string', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('');

      const { result } = renderHook(() => useScoreEntryPreference());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.scoreEntryMode).toBe('modal');
    });

    it('should fallback to default when stored value is arbitrary string', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('some-random-value');

      const { result } = renderHook(() => useScoreEntryPreference());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.scoreEntryMode).toBe('modal');
    });

    it('should fallback to default when stored value is number', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('123');

      const { result } = renderHook(() => useScoreEntryPreference());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.scoreEntryMode).toBe('modal');
    });
  });

  describe('Error Handling', () => {
    it('should handle AsyncStorage getItem errors gracefully', async () => {
      const storageError = new Error('Storage read error');
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(storageError);

      const { result } = renderHook(() => useScoreEntryPreference());

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should fallback to default on error
      expect(result.current.scoreEntryMode).toBe('modal');
      expect(Logger.error).toHaveBeenCalledWith(
        'Failed to load score entry preference',
        storageError,
        { action: 'loadScoreEntryPreference' }
      );
    });

    it('should handle AsyncStorage setItem errors gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      const storageError = new Error('Storage write error');
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(storageError);

      const { result } = renderHook(() => useScoreEntryPreference());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const originalMode = result.current.scoreEntryMode;

      await act(async () => {
        await result.current.setScoreEntryMode('inline');
      });

      // State should still update even if storage fails
      expect(result.current.scoreEntryMode).toBe('inline');
      expect(Logger.error).toHaveBeenCalledWith(
        'Failed to save score entry preference',
        storageError,
        { action: 'saveScoreEntryPreference', mode: 'inline' }
      );
    });

    it('should handle multiple storage errors', async () => {
      const readError = new Error('Read error');
      const writeError = new Error('Write error');

      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(readError);
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(writeError);

      const { result } = renderHook(() => useScoreEntryPreference());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should handle read error
      expect(Logger.error).toHaveBeenCalledWith(
        'Failed to load score entry preference',
        readError,
        { action: 'loadScoreEntryPreference' }
      );

      // Attempt to update
      await act(async () => {
        await result.current.setScoreEntryMode('inline');
      });

      // Should handle write error
      expect(Logger.error).toHaveBeenCalledWith(
        'Failed to save score entry preference',
        writeError,
        { action: 'saveScoreEntryPreference', mode: 'inline' }
      );

      expect(Logger.error).toHaveBeenCalledTimes(2);
    });
  });

  describe('Persistence Across Remounts', () => {
    it('should persist preference across unmount and remount', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      // First mount
      const { result: result1, unmount } = renderHook(() =>
        useScoreEntryPreference()
      );

      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false);
      });

      // Update preference
      await act(async () => {
        await result1.current.setScoreEntryMode('inline');
      });

      expect(result1.current.scoreEntryMode).toBe('inline');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        SCORE_ENTRY_PREFERENCE_KEY,
        'inline'
      );

      // Unmount
      unmount();

      // Simulate storage returning saved value
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('inline');

      // Remount
      const { result: result2 } = renderHook(() => useScoreEntryPreference());

      await waitFor(() => {
        expect(result2.current.isLoading).toBe(false);
      });

      // Should load persisted preference
      expect(result2.current.scoreEntryMode).toBe('inline');
    });

    it('should load different preferences for different instances', async () => {
      // Simulate two different stored preferences
      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce('inline')
        .mockResolvedValueOnce('modal');

      const { result: result1 } = renderHook(() => useScoreEntryPreference());
      const { result: result2 } = renderHook(() => useScoreEntryPreference());

      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false);
      });

      await waitFor(() => {
        expect(result2.current.isLoading).toBe(false);
      });

      // Both should load their respective values
      expect(result1.current.scoreEntryMode).toBe('inline');
      expect(result2.current.scoreEntryMode).toBe('modal');
    });
  });

  describe('Type Safety', () => {
    it('should only accept valid ScoreEntryMode values', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useScoreEntryPreference());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Valid values should work
      await act(async () => {
        await result.current.setScoreEntryMode('inline' as ScoreEntryMode);
      });
      expect(result.current.scoreEntryMode).toBe('inline');

      await act(async () => {
        await result.current.setScoreEntryMode('modal' as ScoreEntryMode);
      });
      expect(result.current.scoreEntryMode).toBe('modal');

      // TypeScript should prevent invalid values at compile time
      // This is tested through TypeScript compilation, not runtime
    });
  });

  describe('Callback Stability', () => {
    it('should maintain stable reference for setScoreEntryMode callback', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const { result, rerender } = renderHook(() => useScoreEntryPreference());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const firstCallback = result.current.setScoreEntryMode;

      // Trigger a state change
      await act(async () => {
        await result.current.setScoreEntryMode('inline');
      });

      rerender();

      const secondCallback = result.current.setScoreEntryMode;

      // Callback should maintain stable reference (useCallback)
      expect(firstCallback).toBe(secondCallback);
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid consecutive updates', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useScoreEntryPreference());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Rapid updates
      await act(async () => {
        await result.current.setScoreEntryMode('inline');
        await result.current.setScoreEntryMode('modal');
        await result.current.setScoreEntryMode('inline');
      });

      // Final state should be 'inline'
      expect(result.current.scoreEntryMode).toBe('inline');
      expect(AsyncStorage.setItem).toHaveBeenCalledTimes(3);
    });

    it('should handle updates while still loading', async () => {
      let resolveGetItem: (value: string | null) => void;
      const getItemPromise = new Promise<string | null>((resolve) => {
        resolveGetItem = resolve;
      });

      (AsyncStorage.getItem as jest.Mock).mockReturnValue(getItemPromise);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useScoreEntryPreference());

      expect(result.current.isLoading).toBe(true);

      // Try to update while still loading
      await act(async () => {
        await result.current.setScoreEntryMode('inline');
      });

      // Resolve the loading
      act(() => {
        resolveGetItem!(null);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Update should have been applied
      expect(result.current.scoreEntryMode).toBe('inline');
    });

    it('should handle null and undefined AsyncStorage responses', async () => {
      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(undefined);

      const { result: result1 } = renderHook(() => useScoreEntryPreference());
      const { result: result2 } = renderHook(() => useScoreEntryPreference());

      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false);
      });

      await waitFor(() => {
        expect(result2.current.isLoading).toBe(false);
      });

      // Both should default to 'modal'
      expect(result1.current.scoreEntryMode).toBe('modal');
      expect(result2.current.scoreEntryMode).toBe('modal');
    });
  });

  describe('Loading State Transitions', () => {
    it('should transition from loading to loaded state', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('inline');

      const { result } = renderHook(() => useScoreEntryPreference());

      // Initial state
      expect(result.current.isLoading).toBe(true);
      expect(result.current.scoreEntryMode).toBe('modal');

      // After loading
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.scoreEntryMode).toBe('inline');
    });

    it('should set loading to false even on error', async () => {
      const error = new Error('Storage error');
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useScoreEntryPreference());

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should still complete loading despite error
      expect(result.current.isLoading).toBe(false);
      expect(result.current.scoreEntryMode).toBe('modal');
    });

    it('should only load once on mount', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('inline');

      const { result, rerender } = renderHook(() => useScoreEntryPreference());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(AsyncStorage.getItem).toHaveBeenCalledTimes(1);

      // Trigger rerender
      rerender();

      // Should not load again
      expect(AsyncStorage.getItem).toHaveBeenCalledTimes(1);
    });
  });
});
