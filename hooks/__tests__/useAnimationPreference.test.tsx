/**
 * useAnimationPreference Hook Tests
 *
 * Comprehensive unit tests for animation preference hook covering:
 * - Backward compatibility with deprecated API
 * - Integration with ThemeContext
 * - Animation preference state management
 * - Manual toggle and set operations
 * - Loading states
 * - Supabase synchronization through ThemeContext
 *
 * @deprecated This hook is a wrapper around ThemeContext for backward compatibility.
 * New code should use `useTheme` from '../contexts/ThemeContext' instead.
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import React from 'react';
import { useAnimationPreference } from '../useAnimationPreference';
import { useTheme } from '../../contexts/ThemeContext';

// Mock ThemeContext
jest.mock('../../contexts/ThemeContext', () => ({
  useTheme: jest.fn(),
}));

describe('useAnimationPreference Hook', () => {
  const mockSetReduceAnimation = jest.fn();
  const mockToggleReduceAnimation = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Default ThemeContext mock
    (useTheme as jest.Mock).mockReturnValue({
      reduceAnimation: false,
      setReduceAnimation: mockSetReduceAnimation,
      toggleReduceAnimation: mockToggleReduceAnimation,
      isLoading: false,
      // Other ThemeContext values not used by useAnimationPreference
      themeMode: 'system',
      setThemeMode: jest.fn(),
      isDark: false,
      fontSize: 'medium',
      setFontSize: jest.fn(),
      fontScale: 1.0,
    });
  });

  describe('Initial State', () => {
    it('should expose reduceAnimation from ThemeContext', () => {
      const { result } = renderHook(() => useAnimationPreference());

      expect(result.current.reduceAnimation).toBe(false);
      expect(useTheme).toHaveBeenCalled();
    });

    it('should reflect reduceAnimation enabled state', () => {
      (useTheme as jest.Mock).mockReturnValue({
        reduceAnimation: true,
        setReduceAnimation: mockSetReduceAnimation,
        toggleReduceAnimation: mockToggleReduceAnimation,
        isLoading: false,
      });

      const { result } = renderHook(() => useAnimationPreference());

      expect(result.current.reduceAnimation).toBe(true);
    });

    it('should expose isLoading state', () => {
      (useTheme as jest.Mock).mockReturnValue({
        reduceAnimation: false,
        setReduceAnimation: mockSetReduceAnimation,
        toggleReduceAnimation: mockToggleReduceAnimation,
        isLoading: true,
      });

      const { result } = renderHook(() => useAnimationPreference());

      expect(result.current.isLoading).toBe(true);
    });

    it('should start with loading false when ThemeContext is ready', () => {
      const { result } = renderHook(() => useAnimationPreference());

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('setReduceAnimation', () => {
    it('should call ThemeContext setReduceAnimation with true', () => {
      const { result } = renderHook(() => useAnimationPreference());

      act(() => {
        result.current.setReduceAnimation(true);
      });

      expect(mockSetReduceAnimation).toHaveBeenCalledWith(true);
      expect(mockSetReduceAnimation).toHaveBeenCalledTimes(1);
    });

    it('should call ThemeContext setReduceAnimation with false', () => {
      const { result } = renderHook(() => useAnimationPreference());

      act(() => {
        result.current.setReduceAnimation(false);
      });

      expect(mockSetReduceAnimation).toHaveBeenCalledWith(false);
      expect(mockSetReduceAnimation).toHaveBeenCalledTimes(1);
    });

    it('should update reduceAnimation state through ThemeContext', async () => {
      const { result, rerender } = renderHook(() => useAnimationPreference());

      expect(result.current.reduceAnimation).toBe(false);

      // Simulate ThemeContext state change
      (useTheme as jest.Mock).mockReturnValue({
        reduceAnimation: true,
        setReduceAnimation: mockSetReduceAnimation,
        toggleReduceAnimation: mockToggleReduceAnimation,
        isLoading: false,
      });

      rerender();

      expect(result.current.reduceAnimation).toBe(true);
    });

    it('should handle multiple setReduceAnimation calls', () => {
      const { result } = renderHook(() => useAnimationPreference());

      act(() => {
        result.current.setReduceAnimation(true);
        result.current.setReduceAnimation(false);
        result.current.setReduceAnimation(true);
      });

      expect(mockSetReduceAnimation).toHaveBeenCalledTimes(3);
      expect(mockSetReduceAnimation).toHaveBeenNthCalledWith(1, true);
      expect(mockSetReduceAnimation).toHaveBeenNthCalledWith(2, false);
      expect(mockSetReduceAnimation).toHaveBeenNthCalledWith(3, true);
    });
  });

  describe('toggleReduceAnimation', () => {
    it('should call ThemeContext toggleReduceAnimation', () => {
      const { result } = renderHook(() => useAnimationPreference());

      act(() => {
        result.current.toggleReduceAnimation();
      });

      expect(mockToggleReduceAnimation).toHaveBeenCalledTimes(1);
    });

    it('should toggle from false to true', async () => {
      const { result, rerender } = renderHook(() => useAnimationPreference());

      expect(result.current.reduceAnimation).toBe(false);

      // Simulate toggle through ThemeContext
      (useTheme as jest.Mock).mockReturnValue({
        reduceAnimation: true,
        setReduceAnimation: mockSetReduceAnimation,
        toggleReduceAnimation: mockToggleReduceAnimation,
        isLoading: false,
      });

      rerender();

      expect(result.current.reduceAnimation).toBe(true);
    });

    it('should toggle from true to false', async () => {
      (useTheme as jest.Mock).mockReturnValue({
        reduceAnimation: true,
        setReduceAnimation: mockSetReduceAnimation,
        toggleReduceAnimation: mockToggleReduceAnimation,
        isLoading: false,
      });

      const { result, rerender } = renderHook(() => useAnimationPreference());

      expect(result.current.reduceAnimation).toBe(true);

      // Simulate toggle through ThemeContext
      (useTheme as jest.Mock).mockReturnValue({
        reduceAnimation: false,
        setReduceAnimation: mockSetReduceAnimation,
        toggleReduceAnimation: mockToggleReduceAnimation,
        isLoading: false,
      });

      rerender();

      expect(result.current.reduceAnimation).toBe(false);
    });

    it('should handle rapid toggle calls', () => {
      const { result } = renderHook(() => useAnimationPreference());

      act(() => {
        result.current.toggleReduceAnimation();
        result.current.toggleReduceAnimation();
        result.current.toggleReduceAnimation();
      });

      expect(mockToggleReduceAnimation).toHaveBeenCalledTimes(3);
    });
  });

  describe('Loading States', () => {
    it('should reflect loading state from ThemeContext', () => {
      (useTheme as jest.Mock).mockReturnValue({
        reduceAnimation: false,
        setReduceAnimation: mockSetReduceAnimation,
        toggleReduceAnimation: mockToggleReduceAnimation,
        isLoading: true,
      });

      const { result } = renderHook(() => useAnimationPreference());

      expect(result.current.isLoading).toBe(true);
    });

    it('should transition from loading to ready', async () => {
      (useTheme as jest.Mock).mockReturnValue({
        reduceAnimation: false,
        setReduceAnimation: mockSetReduceAnimation,
        toggleReduceAnimation: mockToggleReduceAnimation,
        isLoading: true,
      });

      const { result, rerender } = renderHook(() => useAnimationPreference());

      expect(result.current.isLoading).toBe(true);

      // Simulate ThemeContext finishing load
      (useTheme as jest.Mock).mockReturnValue({
        reduceAnimation: false,
        setReduceAnimation: mockSetReduceAnimation,
        toggleReduceAnimation: mockToggleReduceAnimation,
        isLoading: false,
      });

      rerender();

      expect(result.current.isLoading).toBe(false);
    });

    it('should maintain function references during loading', () => {
      (useTheme as jest.Mock).mockReturnValue({
        reduceAnimation: false,
        setReduceAnimation: mockSetReduceAnimation,
        toggleReduceAnimation: mockToggleReduceAnimation,
        isLoading: true,
      });

      const { result } = renderHook(() => useAnimationPreference());

      expect(typeof result.current.setReduceAnimation).toBe('function');
      expect(typeof result.current.toggleReduceAnimation).toBe('function');
      expect(result.current.setReduceAnimation).toBe(mockSetReduceAnimation);
      expect(result.current.toggleReduceAnimation).toBe(mockToggleReduceAnimation);
    });
  });

  describe('API Compatibility', () => {
    it('should expose all expected properties', () => {
      const { result } = renderHook(() => useAnimationPreference());

      expect(result.current).toHaveProperty('reduceAnimation');
      expect(result.current).toHaveProperty('setReduceAnimation');
      expect(result.current).toHaveProperty('toggleReduceAnimation');
      expect(result.current).toHaveProperty('isLoading');
    });

    it('should have correct types for all properties', () => {
      const { result } = renderHook(() => useAnimationPreference());

      expect(typeof result.current.reduceAnimation).toBe('boolean');
      expect(typeof result.current.setReduceAnimation).toBe('function');
      expect(typeof result.current.toggleReduceAnimation).toBe('function');
      expect(typeof result.current.isLoading).toBe('boolean');
    });

    it('should maintain stable function references across renders', () => {
      const { result, rerender } = renderHook(() => useAnimationPreference());

      const initialSetReduceAnimation = result.current.setReduceAnimation;
      const initialToggleReduceAnimation = result.current.toggleReduceAnimation;

      rerender();

      expect(result.current.setReduceAnimation).toBe(initialSetReduceAnimation);
      expect(result.current.toggleReduceAnimation).toBe(initialToggleReduceAnimation);
    });
  });

  describe('ThemeContext Integration', () => {
    it('should call useTheme on every render', () => {
      const { rerender } = renderHook(() => useAnimationPreference());

      expect(useTheme).toHaveBeenCalledTimes(1);

      rerender();

      expect(useTheme).toHaveBeenCalledTimes(2);
    });

    it('should properly delegate to ThemeContext methods', () => {
      const { result } = renderHook(() => useAnimationPreference());

      // Test setReduceAnimation delegation
      act(() => {
        result.current.setReduceAnimation(true);
      });
      expect(mockSetReduceAnimation).toHaveBeenCalledWith(true);

      // Test toggleReduceAnimation delegation
      act(() => {
        result.current.toggleReduceAnimation();
      });
      expect(mockToggleReduceAnimation).toHaveBeenCalledTimes(1);
    });

    it('should sync state changes from ThemeContext', () => {
      const { result, rerender } = renderHook(() => useAnimationPreference());

      // Initial state
      expect(result.current.reduceAnimation).toBe(false);

      // Simulate ThemeContext state change (e.g., from Supabase sync)
      (useTheme as jest.Mock).mockReturnValue({
        reduceAnimation: true,
        setReduceAnimation: mockSetReduceAnimation,
        toggleReduceAnimation: mockToggleReduceAnimation,
        isLoading: false,
      });

      rerender();

      // State should reflect ThemeContext change
      expect(result.current.reduceAnimation).toBe(true);
    });

    it('should reflect ThemeContext error state in isLoading', () => {
      // ThemeContext might set isLoading to true during error recovery
      (useTheme as jest.Mock).mockReturnValue({
        reduceAnimation: false,
        setReduceAnimation: mockSetReduceAnimation,
        toggleReduceAnimation: mockToggleReduceAnimation,
        isLoading: true,
      });

      const { result } = renderHook(() => useAnimationPreference());

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle ThemeContext returning null functions gracefully', () => {
      (useTheme as jest.Mock).mockReturnValue({
        reduceAnimation: false,
        setReduceAnimation: null,
        toggleReduceAnimation: null,
        isLoading: false,
      });

      const { result } = renderHook(() => useAnimationPreference());

      expect(result.current.reduceAnimation).toBe(false);
      expect(result.current.setReduceAnimation).toBeNull();
      expect(result.current.toggleReduceAnimation).toBeNull();
    });

    it('should work with all combinations of reduceAnimation states', () => {
      const testCases = [
        { reduceAnimation: true, isLoading: false },
        { reduceAnimation: false, isLoading: false },
        { reduceAnimation: true, isLoading: true },
        { reduceAnimation: false, isLoading: true },
      ];

      testCases.forEach(({ reduceAnimation, isLoading }) => {
        (useTheme as jest.Mock).mockReturnValue({
          reduceAnimation,
          setReduceAnimation: mockSetReduceAnimation,
          toggleReduceAnimation: mockToggleReduceAnimation,
          isLoading,
        });

        const { result } = renderHook(() => useAnimationPreference());

        expect(result.current.reduceAnimation).toBe(reduceAnimation);
        expect(result.current.isLoading).toBe(isLoading);
      });
    });

    it('should not cause re-renders when ThemeContext state is stable', () => {
      let renderCount = 0;
      const TestComponent = () => {
        const animation = useAnimationPreference();
        renderCount++;
        return animation;
      };

      const { rerender } = renderHook(() => TestComponent());

      expect(renderCount).toBe(1);

      // Rerender with same ThemeContext values
      rerender();

      // Should only render once more for the rerender call itself
      expect(renderCount).toBe(2);
    });

    it('should persist across multiple hook instances', () => {
      const { result: result1 } = renderHook(() => useAnimationPreference());
      const { result: result2 } = renderHook(() => useAnimationPreference());

      // Both instances should share the same ThemeContext state
      expect(result1.current.reduceAnimation).toBe(result2.current.reduceAnimation);
      expect(result1.current.isLoading).toBe(result2.current.isLoading);
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain exact same API as original implementation', () => {
      const { result } = renderHook(() => useAnimationPreference());

      // Check all expected properties exist
      const expectedProperties = [
        'reduceAnimation',
        'setReduceAnimation',
        'toggleReduceAnimation',
        'isLoading',
      ];

      expectedProperties.forEach((prop) => {
        expect(result.current).toHaveProperty(prop);
      });

      // Check no unexpected properties
      const actualProperties = Object.keys(result.current);
      expect(actualProperties).toHaveLength(expectedProperties.length);
    });

    it('should work as drop-in replacement for deprecated implementation', () => {
      // This test verifies the hook can replace older implementations
      const { result } = renderHook(() => useAnimationPreference());

      // Should be able to check animation preference
      expect(typeof result.current.reduceAnimation).toBe('boolean');

      // Should be able to set animation preference
      act(() => {
        result.current.setReduceAnimation(true);
      });
      expect(mockSetReduceAnimation).toHaveBeenCalledWith(true);

      // Should be able to toggle animation preference
      act(() => {
        result.current.toggleReduceAnimation();
      });
      expect(mockToggleReduceAnimation).toHaveBeenCalled();

      // Should be able to check loading state
      expect(typeof result.current.isLoading).toBe('boolean');
    });

    it('should support legacy usage patterns', () => {
      const { result } = renderHook(() => useAnimationPreference());

      // Legacy pattern: Check if animations should be reduced
      const shouldReduceAnimations = result.current.reduceAnimation;
      expect(typeof shouldReduceAnimations).toBe('boolean');

      // Legacy pattern: Disable animations
      act(() => {
        result.current.setReduceAnimation(true);
      });

      // Legacy pattern: Toggle animations
      act(() => {
        result.current.toggleReduceAnimation();
      });

      // Legacy pattern: Check if preference is loading
      const isPreferenceLoading = result.current.isLoading;
      expect(typeof isPreferenceLoading).toBe('boolean');

      // All legacy patterns should work without errors
      expect(mockSetReduceAnimation).toHaveBeenCalled();
      expect(mockToggleReduceAnimation).toHaveBeenCalled();
    });
  });

  describe('Supabase Synchronization (via ThemeContext)', () => {
    it('should reflect Supabase sync state through isLoading', () => {
      // Simulate Supabase sync in progress
      (useTheme as jest.Mock).mockReturnValue({
        reduceAnimation: false,
        setReduceAnimation: mockSetReduceAnimation,
        toggleReduceAnimation: mockToggleReduceAnimation,
        isLoading: true,
      });

      const { result } = renderHook(() => useAnimationPreference());

      expect(result.current.isLoading).toBe(true);
    });

    it('should update when Supabase sync completes', async () => {
      (useTheme as jest.Mock).mockReturnValue({
        reduceAnimation: false,
        setReduceAnimation: mockSetReduceAnimation,
        toggleReduceAnimation: mockToggleReduceAnimation,
        isLoading: true,
      });

      const { result, rerender } = renderHook(() => useAnimationPreference());

      expect(result.current.isLoading).toBe(true);

      // Simulate Supabase sync completing with new value
      (useTheme as jest.Mock).mockReturnValue({
        reduceAnimation: true,
        setReduceAnimation: mockSetReduceAnimation,
        toggleReduceAnimation: mockToggleReduceAnimation,
        isLoading: false,
      });

      rerender();

      expect(result.current.isLoading).toBe(false);
      expect(result.current.reduceAnimation).toBe(true);
    });

    it('should propagate setReduceAnimation to Supabase through ThemeContext', () => {
      const { result } = renderHook(() => useAnimationPreference());

      act(() => {
        result.current.setReduceAnimation(true);
      });

      // ThemeContext should handle Supabase sync internally
      expect(mockSetReduceAnimation).toHaveBeenCalledWith(true);
    });

    it('should handle real-time updates from other devices', () => {
      const { result, rerender } = renderHook(() => useAnimationPreference());

      expect(result.current.reduceAnimation).toBe(false);

      // Simulate real-time update from another device via ThemeContext
      (useTheme as jest.Mock).mockReturnValue({
        reduceAnimation: true,
        setReduceAnimation: mockSetReduceAnimation,
        toggleReduceAnimation: mockToggleReduceAnimation,
        isLoading: false,
      });

      rerender();

      expect(result.current.reduceAnimation).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should not create new function references unnecessarily', () => {
      const { result, rerender } = renderHook(() => useAnimationPreference());

      const firstSetReduceAnimation = result.current.setReduceAnimation;
      const firstToggleReduceAnimation = result.current.toggleReduceAnimation;

      // Multiple rerenders
      rerender();
      rerender();
      rerender();

      // Function references should remain stable
      expect(result.current.setReduceAnimation).toBe(firstSetReduceAnimation);
      expect(result.current.toggleReduceAnimation).toBe(firstToggleReduceAnimation);
    });

    it('should efficiently delegate to ThemeContext', () => {
      const { result } = renderHook(() => useAnimationPreference());

      // Call methods multiple times
      act(() => {
        result.current.setReduceAnimation(true);
        result.current.setReduceAnimation(false);
        result.current.toggleReduceAnimation();
      });

      // Each call should directly delegate to ThemeContext
      expect(mockSetReduceAnimation).toHaveBeenCalledTimes(2);
      expect(mockToggleReduceAnimation).toHaveBeenCalledTimes(1);
    });
  });
});
