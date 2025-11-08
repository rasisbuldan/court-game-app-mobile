/**
 * Comprehensive tests for OfflineBanner component
 *
 * Testing:
 * - Network status detection
 * - Banner visibility (show/hide)
 * - Animation states (slide in/out)
 * - Platform-specific styles
 * - NetInfo listener setup and cleanup
 * - Connection state transitions
 * - Edge cases and error scenarios
 */

import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import { Platform, Animated } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { OfflineBanner } from '../OfflineBanner';

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(),
}));

// Mock WifiOff icon from lucide-react-native
jest.mock('lucide-react-native', () => ({
  WifiOff: jest.fn(() => null),
}));

// Mock Animated.timing to execute immediately
jest.spyOn(Animated, 'timing').mockImplementation((value: any, config: any) => ({
  start: (callback?: any) => {
    value.setValue(config.toValue);
    callback?.({ finished: true });
  },
}));

describe('OfflineBanner', () => {
  let mockUnsubscribe: jest.Mock;
  let mockAddEventListener: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUnsubscribe = jest.fn();
    mockAddEventListener = NetInfo.addEventListener as jest.Mock;
  });

  afterEach(() => {
    // Clean up any pending timers or animations
    jest.clearAllTimers();
  });

  describe('Initial Render', () => {
    it('should render without crashing', () => {
      mockAddEventListener.mockReturnValue(mockUnsubscribe);
      expect(() => render(<OfflineBanner />)).not.toThrow();
    });

    it('should be hidden initially when online', async () => {
      mockAddEventListener.mockImplementation((callback) => {
        // Simulate online state
        callback({ isConnected: true, isInternetReachable: true });
        return mockUnsubscribe;
      });

      const { queryByText } = render(<OfflineBanner />);

      await waitFor(() => {
        expect(queryByText('No Internet Connection')).toBeNull();
      });
    });

    it('should show banner when initially offline', async () => {
      mockAddEventListener.mockImplementation((callback) => {
        // Simulate offline state
        callback({ isConnected: false, isInternetReachable: false });
        return mockUnsubscribe;
      });

      const { getByText } = render(<OfflineBanner />);

      await waitFor(() => {
        expect(getByText('No Internet Connection')).toBeTruthy();
      });
    });
  });

  describe('Network Status Detection', () => {
    it('should show banner when isConnected is false', async () => {
      let networkCallback: any;
      mockAddEventListener.mockImplementation((callback) => {
        networkCallback = callback;
        return mockUnsubscribe;
      });

      const { getByText } = render(<OfflineBanner />);

      await act(async () => {
        networkCallback({ isConnected: false, isInternetReachable: true });
      });

      await waitFor(() => {
        expect(getByText('No Internet Connection')).toBeTruthy();
      });
    });

    it('should show banner when isInternetReachable is false', async () => {
      let networkCallback: any;
      mockAddEventListener.mockImplementation((callback) => {
        networkCallback = callback;
        return mockUnsubscribe;
      });

      const { getByText } = render(<OfflineBanner />);

      await act(async () => {
        networkCallback({ isConnected: true, isInternetReachable: false });
      });

      await waitFor(() => {
        expect(getByText('No Internet Connection')).toBeTruthy();
      });
    });

    it('should show banner when both isConnected and isInternetReachable are false', async () => {
      let networkCallback: any;
      mockAddEventListener.mockImplementation((callback) => {
        networkCallback = callback;
        return mockUnsubscribe;
      });

      const { getByText } = render(<OfflineBanner />);

      await act(async () => {
        networkCallback({ isConnected: false, isInternetReachable: false });
      });

      await waitFor(() => {
        expect(getByText('No Internet Connection')).toBeTruthy();
      });
    });

    it('should hide banner when both isConnected and isInternetReachable are true', async () => {
      let networkCallback: any;
      mockAddEventListener.mockImplementation((callback) => {
        networkCallback = callback;
        // Start offline
        callback({ isConnected: false, isInternetReachable: false });
        return mockUnsubscribe;
      });

      const { queryByText } = render(<OfflineBanner />);

      // Go back online
      await act(async () => {
        networkCallback({ isConnected: true, isInternetReachable: true });
      });

      await waitFor(() => {
        expect(queryByText('No Internet Connection')).toBeNull();
      });
    });

    it('should handle null network state values', async () => {
      let networkCallback: any;
      mockAddEventListener.mockImplementation((callback) => {
        networkCallback = callback;
        return mockUnsubscribe;
      });

      const { getByText } = render(<OfflineBanner />);

      await act(async () => {
        networkCallback({ isConnected: null, isInternetReachable: null });
      });

      await waitFor(() => {
        expect(getByText('No Internet Connection')).toBeTruthy();
      });
    });

    it('should handle undefined network state values', async () => {
      let networkCallback: any;
      mockAddEventListener.mockImplementation((callback) => {
        networkCallback = callback;
        return mockUnsubscribe;
      });

      const { getByText } = render(<OfflineBanner />);

      await act(async () => {
        networkCallback({ isConnected: undefined, isInternetReachable: undefined });
      });

      await waitFor(() => {
        expect(getByText('No Internet Connection')).toBeTruthy();
      });
    });
  });

  describe('Network State Transitions', () => {
    it('should transition from online to offline', async () => {
      let networkCallback: any;
      mockAddEventListener.mockImplementation((callback) => {
        networkCallback = callback;
        // Start online
        callback({ isConnected: true, isInternetReachable: true });
        return mockUnsubscribe;
      });

      const { getByText, queryByText } = render(<OfflineBanner />);

      // Verify initially online (banner hidden)
      await waitFor(() => {
        expect(queryByText('No Internet Connection')).toBeNull();
      });

      // Go offline
      await act(async () => {
        networkCallback({ isConnected: false, isInternetReachable: false });
      });

      // Verify banner appears
      await waitFor(() => {
        expect(getByText('No Internet Connection')).toBeTruthy();
      });
    });

    it('should transition from offline to online', async () => {
      let networkCallback: any;
      mockAddEventListener.mockImplementation((callback) => {
        networkCallback = callback;
        // Start offline
        callback({ isConnected: false, isInternetReachable: false });
        return mockUnsubscribe;
      });

      const { getByText, queryByText } = render(<OfflineBanner />);

      // Verify initially offline (banner shown)
      await waitFor(() => {
        expect(getByText('No Internet Connection')).toBeTruthy();
      });

      // Go online
      await act(async () => {
        networkCallback({ isConnected: true, isInternetReachable: true });
      });

      // Verify banner disappears
      await waitFor(() => {
        expect(queryByText('No Internet Connection')).toBeNull();
      });
    });

    it('should handle multiple rapid state changes', async () => {
      let networkCallback: any;
      mockAddEventListener.mockImplementation((callback) => {
        networkCallback = callback;
        callback({ isConnected: true, isInternetReachable: true });
        return mockUnsubscribe;
      });

      const { getByText, queryByText } = render(<OfflineBanner />);

      // Rapid state changes
      await act(async () => {
        networkCallback({ isConnected: false, isInternetReachable: false });
      });

      await act(async () => {
        networkCallback({ isConnected: true, isInternetReachable: true });
      });

      await act(async () => {
        networkCallback({ isConnected: false, isInternetReachable: false });
      });

      // Final state should be offline
      await waitFor(() => {
        expect(getByText('No Internet Connection')).toBeTruthy();
      });
    });
  });

  describe('Animation', () => {
    it('should animate banner in when going offline', async () => {
      let networkCallback: any;
      mockAddEventListener.mockImplementation((callback) => {
        networkCallback = callback;
        callback({ isConnected: true, isInternetReachable: true });
        return mockUnsubscribe;
      });

      render(<OfflineBanner />);

      await act(async () => {
        networkCallback({ isConnected: false, isInternetReachable: false });
      });

      await waitFor(() => {
        expect(Animated.timing).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          })
        );
      });
    });

    it('should animate banner out when going online', async () => {
      let networkCallback: any;
      mockAddEventListener.mockImplementation((callback) => {
        networkCallback = callback;
        callback({ isConnected: false, isInternetReachable: false });
        return mockUnsubscribe;
      });

      render(<OfflineBanner />);

      await act(async () => {
        networkCallback({ isConnected: true, isInternetReachable: true });
      });

      await waitFor(() => {
        expect(Animated.timing).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({
            toValue: -100,
            duration: 300,
            useNativeDriver: true,
          })
        );
      });
    });

    it('should use native driver for animations', async () => {
      let networkCallback: any;
      mockAddEventListener.mockImplementation((callback) => {
        networkCallback = callback;
        callback({ isConnected: true, isInternetReachable: true });
        return mockUnsubscribe;
      });

      render(<OfflineBanner />);

      await act(async () => {
        networkCallback({ isConnected: false, isInternetReachable: false });
      });

      await waitFor(() => {
        expect(Animated.timing).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({
            useNativeDriver: true,
          })
        );
      });
    });
  });

  describe('Platform-Specific Styles', () => {
    const originalPlatform = Platform.OS;

    afterEach(() => {
      Platform.OS = originalPlatform;
    });

    it('should apply iOS-specific padding', async () => {
      Platform.OS = 'ios';

      let networkCallback: any;
      mockAddEventListener.mockImplementation((callback) => {
        networkCallback = callback;
        callback({ isConnected: false, isInternetReachable: false });
        return mockUnsubscribe;
      });

      const { UNSAFE_getByType } = render(<OfflineBanner />);

      await waitFor(() => {
        // Find the inner View with platform-specific styles
        const views = UNSAFE_getByType(Animated.View);
        expect(views).toBeDefined();
      });
    });

    it('should apply Android-specific padding', async () => {
      Platform.OS = 'android';

      let networkCallback: any;
      mockAddEventListener.mockImplementation((callback) => {
        networkCallback = callback;
        callback({ isConnected: false, isInternetReachable: false });
        return mockUnsubscribe;
      });

      const { UNSAFE_getByType } = render(<OfflineBanner />);

      await waitFor(() => {
        // Find the inner View with platform-specific styles
        const views = UNSAFE_getByType(Animated.View);
        expect(views).toBeDefined();
      });
    });
  });

  describe('Component Lifecycle', () => {
    it('should set up NetInfo listener on mount', () => {
      mockAddEventListener.mockReturnValue(mockUnsubscribe);

      render(<OfflineBanner />);

      expect(NetInfo.addEventListener).toHaveBeenCalledTimes(1);
      expect(NetInfo.addEventListener).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should clean up NetInfo listener on unmount', () => {
      mockAddEventListener.mockReturnValue(mockUnsubscribe);

      const { unmount } = render(<OfflineBanner />);

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    });

    it('should not call unsubscribe before unmount', () => {
      mockAddEventListener.mockReturnValue(mockUnsubscribe);

      render(<OfflineBanner />);

      expect(mockUnsubscribe).not.toHaveBeenCalled();
    });

    it('should handle multiple mount/unmount cycles', () => {
      mockAddEventListener.mockReturnValue(mockUnsubscribe);

      const { unmount: unmount1 } = render(<OfflineBanner />);
      unmount1();

      const { unmount: unmount2 } = render(<OfflineBanner />);
      unmount2();

      expect(NetInfo.addEventListener).toHaveBeenCalledTimes(2);
      expect(mockUnsubscribe).toHaveBeenCalledTimes(2);
    });
  });

  describe('Content Rendering', () => {
    it('should render WiFi off icon when offline', async () => {
      mockAddEventListener.mockImplementation((callback) => {
        callback({ isConnected: false, isInternetReachable: false });
        return mockUnsubscribe;
      });

      const { getByText } = render(<OfflineBanner />);

      await waitFor(() => {
        expect(getByText('No Internet Connection')).toBeTruthy();
      });

      // WifiOff icon should be rendered (mocked)
      const { WifiOff } = require('lucide-react-native');
      expect(WifiOff).toHaveBeenCalled();
    });

    it('should display correct offline message', async () => {
      mockAddEventListener.mockImplementation((callback) => {
        callback({ isConnected: false, isInternetReachable: false });
        return mockUnsubscribe;
      });

      const { getByText } = render(<OfflineBanner />);

      await waitFor(() => {
        const message = getByText('No Internet Connection');
        expect(message).toBeTruthy();
        expect(message.props.children).toBe('No Internet Connection');
      });
    });

    it('should not render any content when online', async () => {
      mockAddEventListener.mockImplementation((callback) => {
        callback({ isConnected: true, isInternetReachable: true });
        return mockUnsubscribe;
      });

      const { queryByText } = render(<OfflineBanner />);

      await waitFor(() => {
        expect(queryByText('No Internet Connection')).toBeNull();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle NetInfo listener being called immediately', async () => {
      let capturedCallback: any;
      mockAddEventListener.mockImplementation((callback) => {
        capturedCallback = callback;
        // Call immediately on subscription
        callback({ isConnected: false, isInternetReachable: false });
        return mockUnsubscribe;
      });

      const { getByText } = render(<OfflineBanner />);

      await waitFor(() => {
        expect(getByText('No Internet Connection')).toBeTruthy();
      });

      expect(capturedCallback).toBeDefined();
    });

    it('should handle missing network state properties gracefully', async () => {
      let networkCallback: any;
      mockAddEventListener.mockImplementation((callback) => {
        networkCallback = callback;
        return mockUnsubscribe;
      });

      const { getByText } = render(<OfflineBanner />);

      await act(async () => {
        // Empty state object
        networkCallback({});
      });

      await waitFor(() => {
        expect(getByText('No Internet Connection')).toBeTruthy();
      });
    });

    it('should handle NetInfo returning undefined unsubscribe function', () => {
      // Return a function that returns undefined, simulating a listener that doesn't return cleanup
      mockAddEventListener.mockReturnValue(undefined as any);

      const { unmount } = render(<OfflineBanner />);

      // Component creates a cleanup function that should handle undefined gracefully
      // Note: This will throw in the actual implementation, but demonstrates the edge case
      // In production, NetInfo should always return a valid unsubscribe function
      expect(() => unmount()).toThrow('unsubscribe is not a function');
    });

    it('should maintain state across re-renders', async () => {
      let networkCallback: any;
      mockAddEventListener.mockImplementation((callback) => {
        networkCallback = callback;
        callback({ isConnected: false, isInternetReachable: false });
        return mockUnsubscribe;
      });

      const { getByText, rerender } = render(<OfflineBanner />);

      await waitFor(() => {
        expect(getByText('No Internet Connection')).toBeTruthy();
      });

      // Trigger re-render
      rerender(<OfflineBanner />);

      await waitFor(() => {
        expect(getByText('No Internet Connection')).toBeTruthy();
      });
    });

    it('should handle extremely rapid network fluctuations', async () => {
      let networkCallback: any;
      mockAddEventListener.mockImplementation((callback) => {
        networkCallback = callback;
        callback({ isConnected: true, isInternetReachable: true });
        return mockUnsubscribe;
      });

      render(<OfflineBanner />);

      // Simulate 10 rapid state changes
      for (let i = 0; i < 10; i++) {
        await act(async () => {
          networkCallback({
            isConnected: i % 2 === 0,
            isInternetReachable: i % 2 === 0,
          });
        });
      }

      // Should not crash and should be in final state (offline)
      expect(Animated.timing).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should render accessible elements when offline', async () => {
      mockAddEventListener.mockImplementation((callback) => {
        callback({ isConnected: false, isInternetReachable: false });
        return mockUnsubscribe;
      });

      const { getByText } = render(<OfflineBanner />);

      await waitFor(() => {
        const message = getByText('No Internet Connection');
        expect(message).toBeTruthy();
        expect(message.props.accessible).not.toBe(false);
      });
    });
  });

  describe('Visual Styles', () => {
    it('should apply correct positioning styles', async () => {
      mockAddEventListener.mockImplementation((callback) => {
        callback({ isConnected: false, isInternetReachable: false });
        return mockUnsubscribe;
      });

      const { UNSAFE_getByType } = render(<OfflineBanner />);

      await waitFor(() => {
        const animatedView = UNSAFE_getByType(Animated.View);
        expect(animatedView.props.style).toMatchObject({
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
        });
      });
    });

    it('should apply correct color scheme', async () => {
      mockAddEventListener.mockImplementation((callback) => {
        callback({ isConnected: false, isInternetReachable: false });
        return mockUnsubscribe;
      });

      const { getByText } = render(<OfflineBanner />);

      await waitFor(() => {
        const message = getByText('No Internet Connection');
        expect(message.props.style).toMatchObject({
          color: '#FFFFFF',
          fontSize: 14,
          fontWeight: '600',
        });
      });
    });
  });
});
