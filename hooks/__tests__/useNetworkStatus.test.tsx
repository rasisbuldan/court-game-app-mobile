/**
 * useNetworkStatus Hook Tests
 *
 * Comprehensive unit tests for network status monitoring hook covering:
 * - Initial state
 * - Network state changes (connected, disconnected, internet reachable)
 * - Event listener setup and cleanup
 * - Combined isOnline status calculation
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import NetInfo from '@react-native-community/netinfo';
import { useNetworkStatus } from '../useNetworkStatus';

// Mock @react-native-community/netinfo
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(),
  fetch: jest.fn(),
}));

// NetInfo State type interface
interface NetInfoState {
  type: string;
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  details: any;
}

describe('useNetworkStatus Hook', () => {
  let mockEventListener: (state: NetInfoState) => void;
  let mockUnsubscribe: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUnsubscribe = jest.fn();

    // Mock addEventListener to capture the listener callback
    (NetInfo.addEventListener as jest.Mock).mockImplementation((callback) => {
      mockEventListener = callback;
      return mockUnsubscribe;
    });

    // Default fetch mock - connected state
    (NetInfo.fetch as jest.Mock).mockResolvedValue({
      type: 'wifi',
      isConnected: true,
      isInternetReachable: true,
      details: {
        isConnectionExpensive: false,
      },
    } as NetInfoState);
  });

  describe('Initial State', () => {
    it('should start with null values', () => {
      const { result } = renderHook(() => useNetworkStatus());

      expect(result.current.isConnected).toBeNull();
      expect(result.current.isInternetReachable).toBeNull();
      // When isConnected is null, isOnline is null (null && true !== false = null)
      expect(result.current.isOnline).toBeNull();
    });

    it('should fetch initial network state on mount', async () => {
      renderHook(() => useNetworkStatus());

      await waitFor(() => {
        expect(NetInfo.fetch).toHaveBeenCalled();
      });
    });

    it('should set up event listener on mount', () => {
      renderHook(() => useNetworkStatus());

      expect(NetInfo.addEventListener).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should update state with initial fetch result', async () => {
      const { result } = renderHook(() => useNetworkStatus());

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      expect(result.current.isConnected).toBe(true);
      expect(result.current.isInternetReachable).toBe(true);
      expect(result.current.isOnline).toBe(true);
    });
  });

  describe('Event Listener Setup', () => {
    it('should register event listener for network changes', () => {
      renderHook(() => useNetworkStatus());

      expect(NetInfo.addEventListener).toHaveBeenCalledTimes(1);
      expect(mockEventListener).toBeDefined();
    });

    it('should unsubscribe from event listener on unmount', () => {
      const { unmount } = renderHook(() => useNetworkStatus());

      expect(mockUnsubscribe).not.toHaveBeenCalled();

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    });
  });

  describe('Network State Changes', () => {
    it('should update state when network connects (WiFi)', async () => {
      const { result } = renderHook(() => useNetworkStatus());

      // Wait for initial state
      await waitFor(() => {
        expect(result.current.isConnected).not.toBeNull();
      });

      // Simulate WiFi connection
      act(() => {
        mockEventListener({
          type: 'wifi',
          isConnected: true,
          isInternetReachable: true,
          details: {
            isConnectionExpensive: false,
            ssid: 'Test WiFi',
            bssid: '00:00:00:00:00:00',
            strength: 100,
            ipAddress: '192.168.1.100',
            subnet: '255.255.255.0',
            frequency: 2400,
          },
        } as NetInfoState);
      });

      expect(result.current.isConnected).toBe(true);
      expect(result.current.isInternetReachable).toBe(true);
      expect(result.current.isOnline).toBe(true);
    });

    it('should update state when network connects (Cellular)', async () => {
      const { result } = renderHook(() => useNetworkStatus());

      await waitFor(() => {
        expect(result.current.isConnected).not.toBeNull();
      });

      // Simulate cellular connection
      act(() => {
        mockEventListener({
          type: 'cellular',
          isConnected: true,
          isInternetReachable: true,
          details: {
            isConnectionExpensive: true,
            cellularGeneration: '4g',
            carrier: 'Test Carrier',
          },
        } as NetInfoState);
      });

      expect(result.current.isConnected).toBe(true);
      expect(result.current.isInternetReachable).toBe(true);
      expect(result.current.isOnline).toBe(true);
    });

    it('should update state when network disconnects', async () => {
      const { result } = renderHook(() => useNetworkStatus());

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Simulate disconnection
      act(() => {
        mockEventListener({
          type: 'none',
          isConnected: false,
          isInternetReachable: false,
          details: null,
        } as NetInfoState);
      });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.isInternetReachable).toBe(false);
      expect(result.current.isOnline).toBe(false);
    });

    it('should handle connected but no internet reachable state', async () => {
      const { result } = renderHook(() => useNetworkStatus());

      await waitFor(() => {
        expect(result.current.isConnected).not.toBeNull();
      });

      // Simulate connected to WiFi but no internet
      act(() => {
        mockEventListener({
          type: 'wifi',
          isConnected: true,
          isInternetReachable: false,
          details: {
            isConnectionExpensive: false,
            ssid: 'No Internet WiFi',
            bssid: '00:00:00:00:00:00',
            strength: 100,
            ipAddress: '192.168.1.100',
            subnet: '255.255.255.0',
            frequency: 2400,
          },
        } as NetInfoState);
      });

      expect(result.current.isConnected).toBe(true);
      expect(result.current.isInternetReachable).toBe(false);
      expect(result.current.isOnline).toBe(false);
    });

    it('should handle null isInternetReachable as online when connected', async () => {
      const { result } = renderHook(() => useNetworkStatus());

      await waitFor(() => {
        expect(result.current.isConnected).not.toBeNull();
      });

      // Simulate connected with unknown internet reachability
      act(() => {
        mockEventListener({
          type: 'wifi',
          isConnected: true,
          isInternetReachable: null,
          details: {
            isConnectionExpensive: false,
          },
        } as NetInfoState);
      });

      expect(result.current.isConnected).toBe(true);
      expect(result.current.isInternetReachable).toBeNull();
      // Should be online when connected and isInternetReachable is not explicitly false
      expect(result.current.isOnline).toBe(true);
    });

    it('should handle ethernet connection', async () => {
      const { result } = renderHook(() => useNetworkStatus());

      await waitFor(() => {
        expect(result.current.isConnected).not.toBeNull();
      });

      // Simulate ethernet connection (rare on mobile, but possible)
      act(() => {
        mockEventListener({
          type: 'ethernet',
          isConnected: true,
          isInternetReachable: true,
          details: {
            isConnectionExpensive: false,
            ipAddress: '192.168.1.100',
            subnet: '255.255.255.0',
          },
        } as NetInfoState);
      });

      expect(result.current.isConnected).toBe(true);
      expect(result.current.isInternetReachable).toBe(true);
      expect(result.current.isOnline).toBe(true);
    });

    it('should handle bluetooth connection', async () => {
      const { result } = renderHook(() => useNetworkStatus());

      await waitFor(() => {
        expect(result.current.isConnected).not.toBeNull();
      });

      // Simulate bluetooth connection
      act(() => {
        mockEventListener({
          type: 'bluetooth',
          isConnected: true,
          isInternetReachable: true,
          details: {
            isConnectionExpensive: false,
          },
        } as NetInfoState);
      });

      expect(result.current.isConnected).toBe(true);
      expect(result.current.isInternetReachable).toBe(true);
      expect(result.current.isOnline).toBe(true);
    });

    it('should handle WiMAX connection', async () => {
      const { result } = renderHook(() => useNetworkStatus());

      await waitFor(() => {
        expect(result.current.isConnected).not.toBeNull();
      });

      // Simulate WiMAX connection
      act(() => {
        mockEventListener({
          type: 'wimax',
          isConnected: true,
          isInternetReachable: true,
          details: {
            isConnectionExpensive: false,
          },
        } as NetInfoState);
      });

      expect(result.current.isConnected).toBe(true);
      expect(result.current.isInternetReachable).toBe(true);
      expect(result.current.isOnline).toBe(true);
    });

    it('should handle unknown connection type', async () => {
      const { result } = renderHook(() => useNetworkStatus());

      await waitFor(() => {
        expect(result.current.isConnected).not.toBeNull();
      });

      // Simulate unknown connection type
      act(() => {
        mockEventListener({
          type: 'unknown',
          isConnected: null,
          isInternetReachable: null,
          details: null,
        } as NetInfoState);
      });

      expect(result.current.isConnected).toBeNull();
      expect(result.current.isInternetReachable).toBeNull();
      // When isConnected is null, isOnline is null (null && true !== false = null)
      expect(result.current.isOnline).toBeNull();
    });
  });

  describe('Multiple State Transitions', () => {
    it('should handle rapid network state changes', async () => {
      const { result } = renderHook(() => useNetworkStatus());

      await waitFor(() => {
        expect(result.current.isConnected).not.toBeNull();
      });

      // Connect
      act(() => {
        mockEventListener({
          type: 'wifi',
          isConnected: true,
          isInternetReachable: true,
          details: { isConnectionExpensive: false },
        } as NetInfoState);
      });
      expect(result.current.isOnline).toBe(true);

      // Disconnect
      act(() => {
        mockEventListener({
          type: 'none',
          isConnected: false,
          isInternetReachable: false,
          details: null,
        } as NetInfoState);
      });
      expect(result.current.isOnline).toBe(false);

      // Reconnect with cellular
      act(() => {
        mockEventListener({
          type: 'cellular',
          isConnected: true,
          isInternetReachable: true,
          details: { isConnectionExpensive: true, cellularGeneration: '4g' },
        } as NetInfoState);
      });
      expect(result.current.isOnline).toBe(true);

      // Switch to WiFi
      act(() => {
        mockEventListener({
          type: 'wifi',
          isConnected: true,
          isInternetReachable: true,
          details: { isConnectionExpensive: false },
        } as NetInfoState);
      });
      expect(result.current.isOnline).toBe(true);
    });

    it('should handle transition from unknown to connected', async () => {
      // Start with unknown state
      (NetInfo.fetch as jest.Mock).mockResolvedValue({
        type: 'unknown',
        isConnected: null,
        isInternetReachable: null,
        details: null,
      } as NetInfoState);

      const { result } = renderHook(() => useNetworkStatus());

      await waitFor(() => {
        expect(result.current.isConnected).toBeNull();
      });

      // Transition to connected
      act(() => {
        mockEventListener({
          type: 'wifi',
          isConnected: true,
          isInternetReachable: true,
          details: { isConnectionExpensive: false },
        } as NetInfoState);
      });

      expect(result.current.isConnected).toBe(true);
      expect(result.current.isInternetReachable).toBe(true);
      expect(result.current.isOnline).toBe(true);
    });
  });

  describe('Initial Fetch Scenarios', () => {
    it('should handle initial fetch returning disconnected state', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({
        type: 'none',
        isConnected: false,
        isInternetReachable: false,
        details: null,
      } as NetInfoState);

      const { result } = renderHook(() => useNetworkStatus());

      await waitFor(() => {
        expect(result.current.isConnected).toBe(false);
      });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.isInternetReachable).toBe(false);
      expect(result.current.isOnline).toBe(false);
    });

    it('should handle initial fetch returning unknown state', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({
        type: 'unknown',
        isConnected: null,
        isInternetReachable: null,
        details: null,
      } as NetInfoState);

      const { result } = renderHook(() => useNetworkStatus());

      await waitFor(() => {
        expect(result.current.isConnected).toBeNull();
      });

      expect(result.current.isConnected).toBeNull();
      expect(result.current.isInternetReachable).toBeNull();
      // When isConnected is null, isOnline is null (null && true !== false = null)
      expect(result.current.isOnline).toBeNull();
    });

    it('should handle initial fetch with null internet reachability', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({
        type: 'wifi',
        isConnected: true,
        isInternetReachable: null,
        details: { isConnectionExpensive: false },
      } as NetInfoState);

      const { result } = renderHook(() => useNetworkStatus());

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      expect(result.current.isConnected).toBe(true);
      expect(result.current.isInternetReachable).toBeNull();
      expect(result.current.isOnline).toBe(true);
    });
  });

  describe('isOnline Calculation', () => {
    it('should calculate isOnline correctly when both connected and internet reachable', async () => {
      const { result } = renderHook(() => useNetworkStatus());

      await waitFor(() => {
        expect(result.current.isConnected).not.toBeNull();
      });

      act(() => {
        mockEventListener({
          type: 'wifi',
          isConnected: true,
          isInternetReachable: true,
          details: { isConnectionExpensive: false },
        } as NetInfoState);
      });

      // isOnline = isConnected && isInternetReachable !== false
      expect(result.current.isOnline).toBe(true);
    });

    it('should calculate isOnline as false when disconnected', async () => {
      const { result } = renderHook(() => useNetworkStatus());

      await waitFor(() => {
        expect(result.current.isConnected).not.toBeNull();
      });

      act(() => {
        mockEventListener({
          type: 'none',
          isConnected: false,
          isInternetReachable: false,
          details: null,
        } as NetInfoState);
      });

      // isOnline = false && false !== false = false
      expect(result.current.isOnline).toBe(false);
    });

    it('should calculate isOnline as false when connected but internet not reachable', async () => {
      const { result } = renderHook(() => useNetworkStatus());

      await waitFor(() => {
        expect(result.current.isConnected).not.toBeNull();
      });

      act(() => {
        mockEventListener({
          type: 'wifi',
          isConnected: true,
          isInternetReachable: false,
          details: { isConnectionExpensive: false },
        } as NetInfoState);
      });

      // isOnline = true && false !== false = false
      expect(result.current.isOnline).toBe(false);
    });

    it('should calculate isOnline as true when connected with null internet reachability', async () => {
      const { result } = renderHook(() => useNetworkStatus());

      await waitFor(() => {
        expect(result.current.isConnected).not.toBeNull();
      });

      act(() => {
        mockEventListener({
          type: 'wifi',
          isConnected: true,
          isInternetReachable: null,
          details: { isConnectionExpensive: false },
        } as NetInfoState);
      });

      // isOnline = true && null !== false = true
      expect(result.current.isOnline).toBe(true);
    });

    it('should calculate isOnline as null when connection state is null', async () => {
      const { result } = renderHook(() => useNetworkStatus());

      await waitFor(() => {
        expect(result.current.isConnected).not.toBeNull();
      });

      act(() => {
        mockEventListener({
          type: 'unknown',
          isConnected: null,
          isInternetReachable: null,
          details: null,
        } as NetInfoState);
      });

      // isOnline = null && null !== false = null (null is falsy, so && returns null)
      expect(result.current.isOnline).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle same state updates gracefully', async () => {
      const { result } = renderHook(() => useNetworkStatus());

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      const initialOnline = result.current.isOnline;

      // Send same state multiple times
      act(() => {
        mockEventListener({
          type: 'wifi',
          isConnected: true,
          isInternetReachable: true,
          details: { isConnectionExpensive: false },
        } as NetInfoState);
      });

      expect(result.current.isOnline).toBe(initialOnline);
    });

    it('should persist state across re-renders', async () => {
      const { result, rerender } = renderHook(() => useNetworkStatus());

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      const stateBeforeRerender = {
        isConnected: result.current.isConnected,
        isInternetReachable: result.current.isInternetReachable,
        isOnline: result.current.isOnline,
      };

      rerender();

      expect(result.current.isConnected).toBe(stateBeforeRerender.isConnected);
      expect(result.current.isInternetReachable).toBe(stateBeforeRerender.isInternetReachable);
      expect(result.current.isOnline).toBe(stateBeforeRerender.isOnline);
    });
  });
});
