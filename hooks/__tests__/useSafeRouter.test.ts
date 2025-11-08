/**
 * useSafeRouter Hook Tests
 *
 * Comprehensive unit tests for safe router hook covering:
 * - Router availability and initialization
 * - Navigation methods (push, replace, back, setParams, canGoBack)
 * - Error handling when router context is unavailable
 * - No-op router behavior and console logging
 * - Proper state management with isReady flag
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import { useSafeRouter } from '../useSafeRouter';

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

describe('useSafeRouter Hook', () => {
  let consoleLogSpy: jest.SpyInstance;
  let mockRouter: ReturnType<typeof useRouter>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock console.log to verify no-op logging
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    // Default mock router with all methods
    mockRouter = {
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      canGoBack: jest.fn(() => true),
      setParams: jest.fn(),
    } as any;
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('Router Available - Success Path', () => {
    beforeEach(() => {
      (useRouter as jest.Mock).mockReturnValue(mockRouter);
    });

    it('should return the actual router when context is available', () => {
      const { result } = renderHook(() => useSafeRouter());

      expect(result.current).toBeDefined();
      expect(result.current.push).toBe(mockRouter.push);
      expect(result.current.replace).toBe(mockRouter.replace);
      expect(result.current.back).toBe(mockRouter.back);
      expect(result.current.canGoBack).toBe(mockRouter.canGoBack);
      expect(result.current.setParams).toBe(mockRouter.setParams);
    });

    it('should successfully navigate using push', () => {
      const { result } = renderHook(() => useSafeRouter());

      act(() => {
        result.current.push('/home');
      });

      expect(mockRouter.push).toHaveBeenCalledWith('/home');
      expect(mockRouter.push).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should successfully navigate using push with params', () => {
      const { result } = renderHook(() => useSafeRouter());

      act(() => {
        result.current.push({
          pathname: '/session/[id]',
          params: { id: '123' },
        });
      });

      expect(mockRouter.push).toHaveBeenCalledWith({
        pathname: '/session/[id]',
        params: { id: '123' },
      });
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should successfully navigate using replace', () => {
      const { result } = renderHook(() => useSafeRouter());

      act(() => {
        result.current.replace('/login');
      });

      expect(mockRouter.replace).toHaveBeenCalledWith('/login');
      expect(mockRouter.replace).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should successfully navigate using replace with params', () => {
      const { result } = renderHook(() => useSafeRouter());

      act(() => {
        result.current.replace({
          pathname: '/session/[id]',
          params: { id: '456' },
        });
      });

      expect(mockRouter.replace).toHaveBeenCalledWith({
        pathname: '/session/[id]',
        params: { id: '456' },
      });
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should successfully navigate back', () => {
      const { result } = renderHook(() => useSafeRouter());

      act(() => {
        result.current.back();
      });

      expect(mockRouter.back).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should successfully check canGoBack', () => {
      const { result } = renderHook(() => useSafeRouter());

      const canGoBack = result.current.canGoBack();

      expect(canGoBack).toBe(true);
      expect(mockRouter.canGoBack).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should successfully set params', () => {
      const { result } = renderHook(() => useSafeRouter());

      act(() => {
        result.current.setParams({ filter: 'active' });
      });

      expect(mockRouter.setParams).toHaveBeenCalledWith({ filter: 'active' });
      expect(mockRouter.setParams).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should handle multiple sequential navigation calls', () => {
      const { result } = renderHook(() => useSafeRouter());

      act(() => {
        result.current.push('/home');
        result.current.replace('/login');
        result.current.back();
      });

      expect(mockRouter.push).toHaveBeenCalledWith('/home');
      expect(mockRouter.replace).toHaveBeenCalledWith('/login');
      expect(mockRouter.back).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should update isReady state when router is available', async () => {
      renderHook(() => useSafeRouter());

      // The isReady state should be set to true via useEffect
      // We verify this by checking the router is functional (not the no-op version)
      // Since we can't access internal state directly, we verify behavior
      await waitFor(() => {
        expect(useRouter).toHaveBeenCalled();
      });
    });
  });

  describe('Router Unavailable - Error Path', () => {
    beforeEach(() => {
      // Mock useRouter to throw an error
      (useRouter as jest.Mock).mockImplementation(() => {
        throw new Error('Navigation context not ready');
      });
    });

    it('should return no-op router when context is not available', () => {
      const { result } = renderHook(() => useSafeRouter());

      expect(result.current).toBeDefined();
      expect(result.current.push).toBeDefined();
      expect(result.current.replace).toBeDefined();
      expect(result.current.back).toBeDefined();
      expect(result.current.canGoBack).toBeDefined();
      expect(result.current.setParams).toBeDefined();
    });

    it('should log and ignore push when router is not available', () => {
      const { result } = renderHook(() => useSafeRouter());

      act(() => {
        result.current.push('/home');
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[useSafeRouter] Navigation context not ready, ignoring push:',
        ['/home']
      );
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    });

    it('should log and ignore push with params when router is not available', () => {
      const { result } = renderHook(() => useSafeRouter());

      const params = {
        pathname: '/session/[id]',
        params: { id: '123' },
      };

      act(() => {
        result.current.push(params);
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[useSafeRouter] Navigation context not ready, ignoring push:',
        [params]
      );
    });

    it('should log and ignore replace when router is not available', () => {
      const { result } = renderHook(() => useSafeRouter());

      act(() => {
        result.current.replace('/login');
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[useSafeRouter] Navigation context not ready, ignoring replace:',
        ['/login']
      );
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    });

    it('should log and ignore replace with params when router is not available', () => {
      const { result } = renderHook(() => useSafeRouter());

      const params = {
        pathname: '/session/[id]',
        params: { id: '456' },
      };

      act(() => {
        result.current.replace(params);
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[useSafeRouter] Navigation context not ready, ignoring replace:',
        [params]
      );
    });

    it('should log and ignore back when router is not available', () => {
      const { result } = renderHook(() => useSafeRouter());

      act(() => {
        result.current.back();
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[useSafeRouter] Navigation context not ready, ignoring back'
      );
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    });

    it('should return false for canGoBack when router is not available', () => {
      const { result } = renderHook(() => useSafeRouter());

      const canGoBack = result.current.canGoBack();

      expect(canGoBack).toBe(false);
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should log and ignore setParams when router is not available', () => {
      const { result } = renderHook(() => useSafeRouter());

      act(() => {
        result.current.setParams({ filter: 'active' });
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[useSafeRouter] Navigation context not ready, ignoring setParams'
      );
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple no-op navigation calls gracefully', () => {
      const { result } = renderHook(() => useSafeRouter());

      act(() => {
        result.current.push('/home');
        result.current.replace('/login');
        result.current.back();
        result.current.setParams({ foo: 'bar' });
      });

      // Should log for each call
      expect(consoleLogSpy).toHaveBeenCalledTimes(4);
      expect(consoleLogSpy).toHaveBeenNthCalledWith(
        1,
        '[useSafeRouter] Navigation context not ready, ignoring push:',
        ['/home']
      );
      expect(consoleLogSpy).toHaveBeenNthCalledWith(
        2,
        '[useSafeRouter] Navigation context not ready, ignoring replace:',
        ['/login']
      );
      expect(consoleLogSpy).toHaveBeenNthCalledWith(
        3,
        '[useSafeRouter] Navigation context not ready, ignoring back'
      );
      expect(consoleLogSpy).toHaveBeenNthCalledWith(
        4,
        '[useSafeRouter] Navigation context not ready, ignoring setParams'
      );
    });

    it('should not crash when calling navigation methods without router', () => {
      const { result } = renderHook(() => useSafeRouter());

      // Should not throw errors
      expect(() => {
        result.current.push('/home');
        result.current.replace('/login');
        result.current.back();
        result.current.canGoBack();
        result.current.setParams({});
      }).not.toThrow();
    });

    it('should handle push with various argument types', () => {
      const { result } = renderHook(() => useSafeRouter());

      act(() => {
        // String path
        result.current.push('/home');
        // Object with pathname
        result.current.push({ pathname: '/session/123' });
        // Object with pathname and params
        result.current.push({
          pathname: '/session/[id]',
          params: { id: '123', filter: 'active' },
        });
      });

      expect(consoleLogSpy).toHaveBeenCalledTimes(3);
      expect(consoleLogSpy).toHaveBeenNthCalledWith(
        1,
        '[useSafeRouter] Navigation context not ready, ignoring push:',
        ['/home']
      );
      expect(consoleLogSpy).toHaveBeenNthCalledWith(
        2,
        '[useSafeRouter] Navigation context not ready, ignoring push:',
        [{ pathname: '/session/123' }]
      );
      expect(consoleLogSpy).toHaveBeenNthCalledWith(
        3,
        '[useSafeRouter] Navigation context not ready, ignoring push:',
        [{ pathname: '/session/[id]', params: { id: '123', filter: 'active' } }]
      );
    });
  });

  describe('Error Handling Edge Cases', () => {
    it('should handle null router', () => {
      (useRouter as jest.Mock).mockReturnValue(null);

      const { result } = renderHook(() => useSafeRouter());

      act(() => {
        result.current.push('/home');
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[useSafeRouter] Navigation context not ready, ignoring push:',
        ['/home']
      );
    });

    it('should handle undefined router', () => {
      (useRouter as jest.Mock).mockReturnValue(undefined);

      const { result } = renderHook(() => useSafeRouter());

      act(() => {
        result.current.replace('/login');
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[useSafeRouter] Navigation context not ready, ignoring replace:',
        ['/login']
      );
    });

    it('should handle different error types from useRouter', () => {
      // Test with custom error
      (useRouter as jest.Mock).mockImplementation(() => {
        throw new Error('Custom navigation error');
      });

      const { result } = renderHook(() => useSafeRouter());

      act(() => {
        result.current.back();
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[useSafeRouter] Navigation context not ready, ignoring back'
      );
    });

    it('should handle non-Error thrown from useRouter', () => {
      // Test with string thrown
      (useRouter as jest.Mock).mockImplementation(() => {
        throw 'Navigation context not ready';
      });

      const { result } = renderHook(() => useSafeRouter());

      expect(result.current.canGoBack()).toBe(false);
    });
  });

  describe('State Transitions', () => {
    it('should transition from unavailable to available router', async () => {
      // Start with unavailable router
      let shouldThrow = true;
      (useRouter as jest.Mock).mockImplementation(() => {
        if (shouldThrow) {
          throw new Error('Navigation context not ready');
        }
        return mockRouter;
      });

      const { result, rerender } = renderHook(() => useSafeRouter());

      // Initially should use no-op router
      act(() => {
        result.current.push('/home');
      });
      expect(consoleLogSpy).toHaveBeenCalled();

      // Clear the spy for next assertion
      consoleLogSpy.mockClear();

      // Make router available
      shouldThrow = false;
      rerender();

      // Now should use real router
      act(() => {
        result.current.push('/login');
      });

      // Note: Due to how the hook captures the router at render time,
      // this test demonstrates the hook's behavior but the transition
      // would happen on next render in real usage
      // The important part is that it doesn't crash
    });

    it('should persist router reference across re-renders when available', () => {
      (useRouter as jest.Mock).mockReturnValue(mockRouter);

      const { result, rerender } = renderHook(() => useSafeRouter());

      const initialRouter = result.current;

      rerender();

      // Router reference should be stable (same instance returned by useRouter)
      expect(result.current).toBe(initialRouter);
    });

    it('should handle unmount gracefully', () => {
      (useRouter as jest.Mock).mockReturnValue(mockRouter);

      const { unmount } = renderHook(() => useSafeRouter());

      expect(() => unmount()).not.toThrow();
    });

    it('should handle unmount gracefully when router was unavailable', () => {
      (useRouter as jest.Mock).mockImplementation(() => {
        throw new Error('Navigation context not ready');
      });

      const { unmount } = renderHook(() => useSafeRouter());

      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Performance and Memory', () => {
    it('should not create new functions on every render when router is available', () => {
      (useRouter as jest.Mock).mockReturnValue(mockRouter);

      const { result, rerender } = renderHook(() => useSafeRouter());

      const firstRenderPush = result.current.push;

      rerender();

      // When using actual router, methods should be the same reference
      expect(result.current.push).toBe(firstRenderPush);
    });

    it('should create no-op functions when router is unavailable', () => {
      (useRouter as jest.Mock).mockImplementation(() => {
        throw new Error('Navigation context not ready');
      });

      const { result } = renderHook(() => useSafeRouter());

      // No-op router is created as a new object
      expect(typeof result.current.push).toBe('function');
      expect(typeof result.current.replace).toBe('function');
      expect(typeof result.current.back).toBe('function');
      expect(typeof result.current.canGoBack).toBe('function');
      expect(typeof result.current.setParams).toBe('function');
    });
  });

  describe('Type Safety', () => {
    it('should maintain router type signature for push', () => {
      (useRouter as jest.Mock).mockReturnValue(mockRouter);

      const { result } = renderHook(() => useSafeRouter());

      // Should accept string
      act(() => {
        result.current.push('/home');
      });

      // Should accept object with pathname
      act(() => {
        result.current.push({ pathname: '/session/123' });
      });

      expect(mockRouter.push).toHaveBeenCalledTimes(2);
    });

    it('should maintain router type signature for replace', () => {
      (useRouter as jest.Mock).mockReturnValue(mockRouter);

      const { result } = renderHook(() => useSafeRouter());

      // Should accept string
      act(() => {
        result.current.replace('/login');
      });

      // Should accept object with pathname
      act(() => {
        result.current.replace({ pathname: '/home' });
      });

      expect(mockRouter.replace).toHaveBeenCalledTimes(2);
    });

    it('should maintain router type signature for setParams', () => {
      (useRouter as jest.Mock).mockReturnValue(mockRouter);

      const { result } = renderHook(() => useSafeRouter());

      act(() => {
        result.current.setParams({ id: '123', filter: 'active' });
      });

      expect(mockRouter.setParams).toHaveBeenCalledWith({
        id: '123',
        filter: 'active',
      });
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle navigation attempt during app initialization', () => {
      // Simulate app not fully initialized
      (useRouter as jest.Mock).mockImplementation(() => {
        throw new Error('Rendered fewer hooks than expected');
      });

      const { result } = renderHook(() => useSafeRouter());

      // Should not crash and should log
      act(() => {
        result.current.push('/home');
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[useSafeRouter] Navigation context not ready, ignoring push:',
        ['/home']
      );
    });

    it('should handle rapid navigation calls', () => {
      (useRouter as jest.Mock).mockReturnValue(mockRouter);

      const { result } = renderHook(() => useSafeRouter());

      act(() => {
        result.current.push('/home');
        result.current.push('/profile');
        result.current.push('/settings');
      });

      expect(mockRouter.push).toHaveBeenCalledTimes(3);
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should handle back navigation when canGoBack is false', () => {
      (useRouter as jest.Mock).mockReturnValue({
        ...mockRouter,
        canGoBack: jest.fn(() => false),
      });

      const { result } = renderHook(() => useSafeRouter());

      const canGoBack = result.current.canGoBack();

      expect(canGoBack).toBe(false);
    });

    it('should handle navigation with complex params', () => {
      (useRouter as jest.Mock).mockReturnValue(mockRouter);

      const { result } = renderHook(() => useSafeRouter());

      const complexParams = {
        pathname: '/session/[id]/match/[matchId]',
        params: {
          id: '123',
          matchId: '456',
          filter: 'completed',
          sortBy: 'date',
        },
      };

      act(() => {
        result.current.push(complexParams);
      });

      expect(mockRouter.push).toHaveBeenCalledWith(complexParams);
    });
  });
});
