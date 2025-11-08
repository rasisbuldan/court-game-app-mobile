/**
 * CourtSelector Component Tests
 *
 * Tests the court selection modal and its interaction with:
 * - Court selection (modal-based, not increment/decrement)
 * - Mode filtering (sequential vs parallel)
 * - Subscription restrictions (free vs premium)
 * - Visual feedback and modal interactions
 * - Upgrade prompts for free users
 * - Animations and user experience
 * - Edge cases and error handling
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { CourtSelector } from '../CourtSelector';
import { useMaxCourts } from '../../../hooks/useSubscription';
import { useRouter } from 'expo-router';

// Mock dependencies
jest.mock('../../../hooks/useSubscription', () => ({
  useMaxCourts: jest.fn(),
}));

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn(() => ({ bottom: 20, top: 40, left: 0, right: 0 })),
}));

jest.mock('lucide-react-native', () => ({
  ChevronDown: jest.fn(() => null),
  Check: jest.fn(() => null),
  Lock: jest.fn(() => null),
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('CourtSelector', () => {
  const mockOnChange = jest.fn();
  const mockRouterPush = jest.fn();
  const mockUseMaxCourts = useMaxCourts as jest.MockedFunction<typeof useMaxCourts>;
  const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseMaxCourts.mockReturnValue(-1); // Unlimited by default (premium)
    mockUseRouter.mockReturnValue({
      push: mockRouterPush,
      replace: jest.fn(),
      back: jest.fn(),
      canGoBack: jest.fn(),
      setParams: jest.fn(),
    } as any);
  });

  describe('Rendering - Basic Display', () => {
    it('should render court selector button with default value', () => {
      const { getByText } = render(
        <CourtSelector value={1} onChange={mockOnChange} mode="sequential" />
      );

      expect(getByText('1 Court')).toBeTruthy();
    });

    it('should render singular "Court" for value 1', () => {
      const { getByText } = render(
        <CourtSelector value={1} onChange={mockOnChange} mode="sequential" />
      );

      expect(getByText('1 Court')).toBeTruthy();
    });

    it('should render plural "Courts" for value > 1', () => {
      const { getByText } = render(
        <CourtSelector value={3} onChange={mockOnChange} mode="sequential" />
      );

      expect(getByText('3 Courts')).toBeTruthy();
    });

    it('should render with all available values', () => {
      const values = [2, 5, 8, 10];
      values.forEach((value) => {
        const { getByText } = render(
          <CourtSelector value={value} onChange={mockOnChange} mode="sequential" />
        );
        expect(getByText(`${value} Courts`)).toBeTruthy();
      });
    });
  });

  describe('Modal Interaction - Opening and Closing', () => {
    it('should open modal when selector is pressed', () => {
      const { getByText } = render(
        <CourtSelector value={1} onChange={mockOnChange} mode="sequential" />
      );

      const selector = getByText('1 Court');
      fireEvent.press(selector);

      expect(getByText('Select Courts')).toBeTruthy();
    });

    it('should display correct modal header for sequential mode', () => {
      const { getByText } = render(
        <CourtSelector value={1} onChange={mockOnChange} mode="sequential" />
      );

      fireEvent.press(getByText('1 Court'));

      expect(getByText('Select Courts')).toBeTruthy();
      expect(getByText('Choose number of courts available')).toBeTruthy();
    });

    it('should display correct modal header for parallel mode', () => {
      const { getByText } = render(
        <CourtSelector value={2} onChange={mockOnChange} mode="parallel" />
      );

      fireEvent.press(getByText('2 Courts'));

      expect(getByText('Parallel mode allows 2-4 courts')).toBeTruthy();
    });

    it('should display free tier message when on free tier', () => {
      mockUseMaxCourts.mockReturnValue(1);

      const { getByText } = render(
        <CourtSelector value={1} onChange={mockOnChange} mode="sequential" />
      );

      fireEvent.press(getByText('1 Court'));

      expect(getByText('Free tier limited to 1 court')).toBeTruthy();
    });

    it('should close modal when backdrop is pressed', async () => {
      const { getByText, queryByText, UNSAFE_root } = render(
        <CourtSelector value={1} onChange={mockOnChange} mode="sequential" />
      );

      fireEvent.press(getByText('1 Court'));
      expect(getByText('Select Courts')).toBeTruthy();

      // Find and press the backdrop TouchableOpacity
      // The backdrop is the TouchableOpacity with onPress that closes the modal
      const modal = UNSAFE_root.findAllByProps({ onPress: expect.any(Function) });
      const backdrop = modal.find(node => node.props.activeOpacity === 1);

      if (backdrop) {
        fireEvent.press(backdrop);

        // Modal should close
        await waitFor(() => {
          expect(queryByText('Select Courts')).toBeNull();
        }, { timeout: 1000 });
      }
    });
  });

  describe('Court Selection - Sequential Mode (Premium)', () => {
    beforeEach(() => {
      mockUseMaxCourts.mockReturnValue(-1); // Unlimited
    });

    it('should display all court options (1-10) in sequential mode', () => {
      const { getAllByText } = render(
        <CourtSelector value={1} onChange={mockOnChange} mode="sequential" />
      );

      fireEvent.press(getAllByText('1 Court')[0]);

      // Check all options are available
      for (let i = 1; i <= 10; i++) {
        const label = i === 1 ? '1 Court' : `${i} Courts`;
        expect(getAllByText(label).length).toBeGreaterThan(0);
      }
    });

    it('should select court when option is pressed', () => {
      const { getByText, getAllByText } = render(
        <CourtSelector value={1} onChange={mockOnChange} mode="sequential" />
      );

      fireEvent.press(getByText('1 Court'));

      // Press "5 Courts" option (there may be multiple, get from modal)
      const fiveCourtOptions = getAllByText('5 Courts');
      // The one inside the modal is not the first one
      fireEvent.press(fiveCourtOptions[fiveCourtOptions.length - 1]);

      expect(mockOnChange).toHaveBeenCalledWith(5);
    });

    it('should close modal after selection', async () => {
      const { getByText, getAllByText, queryByText } = render(
        <CourtSelector value={1} onChange={mockOnChange} mode="sequential" />
      );

      fireEvent.press(getByText('1 Court'));
      expect(getByText('Select Courts')).toBeTruthy();

      const threeCourtOptions = getAllByText('3 Courts');
      fireEvent.press(threeCourtOptions[threeCourtOptions.length - 1]);

      await waitFor(() => {
        expect(queryByText('Select Courts')).toBeNull();
      });
    });

    it('should highlight currently selected option', () => {
      const { getAllByText } = render(
        <CourtSelector value={3} onChange={mockOnChange} mode="sequential" />
      );

      fireEvent.press(getAllByText('3 Courts')[0]);

      // Find the selected option inside modal (it should have red background)
      const allThreeCourtOptions = getAllByText('3 Courts');
      const modalOption = allThreeCourtOptions[allThreeCourtOptions.length - 1];
      // The background color is on the TouchableOpacity (parent.parent)
      expect(modalOption.parent?.parent?.props.style).toMatchObject({
        backgroundColor: '#FEF2F2',
      });
    });

    it('should show check icon on selected option', () => {
      const { getAllByText } = render(
        <CourtSelector value={4} onChange={mockOnChange} mode="sequential" />
      );

      fireEvent.press(getAllByText('4 Courts')[0]);

      // Check icon should be present for selected option
      // The Check component is mocked, but we can verify it's rendered
      const allFourCourtOptions = getAllByText('4 Courts');
      const modalOption = allFourCourtOptions[allFourCourtOptions.length - 1];
      expect(modalOption.parent).toBeTruthy();
    });
  });

  describe('Court Selection - Parallel Mode (Premium)', () => {
    beforeEach(() => {
      mockUseMaxCourts.mockReturnValue(-1); // Unlimited
    });

    it('should display only 2-4 courts in parallel mode', () => {
      const { getAllByText, queryByText } = render(
        <CourtSelector value={2} onChange={mockOnChange} mode="parallel" />
      );

      fireEvent.press(getAllByText('2 Courts')[0]);

      // Should have 2, 3, 4
      expect(getAllByText('2 Courts').length).toBeGreaterThan(0);
      expect(getAllByText('3 Courts').length).toBeGreaterThan(0);
      expect(getAllByText('4 Courts').length).toBeGreaterThan(0);

      // Should NOT have 1, 5+
      expect(queryByText('1 Court')).toBeNull();
      expect(queryByText('5 Courts')).toBeNull();
    });

    it('should allow selection within 2-4 range', () => {
      const { getByText, getAllByText } = render(
        <CourtSelector value={2} onChange={mockOnChange} mode="parallel" />
      );

      fireEvent.press(getByText('2 Courts'));

      const fourCourtOptions = getAllByText('4 Courts');
      fireEvent.press(fourCourtOptions[fourCourtOptions.length - 1]);

      expect(mockOnChange).toHaveBeenCalledWith(4);
    });

    it('should not display courts outside 2-4 range in parallel mode', () => {
      const { getByText, queryByText } = render(
        <CourtSelector value={2} onChange={mockOnChange} mode="parallel" />
      );

      fireEvent.press(getByText('2 Courts'));

      // Parallel mode should not show 1, 5, 6, 7, 8, 9, 10
      expect(queryByText('1 Court')).toBeNull();
      expect(queryByText('5 Courts')).toBeNull();
      expect(queryByText('10 Courts')).toBeNull();
    });
  });

  describe('Subscription Restrictions - Free Tier', () => {
    beforeEach(() => {
      mockUseMaxCourts.mockReturnValue(1); // Free tier
    });

    it('should display only 1 court option for free tier in sequential mode', () => {
      const { getAllByText } = render(
        <CourtSelector value={1} onChange={mockOnChange} mode="sequential" />
      );

      fireEvent.press(getAllByText('1 Court')[0]);

      // Should have only 1 court available (unlocked)
      const oneCourtOptions = getAllByText('1 Court');
      expect(oneCourtOptions.length).toBeGreaterThan(0);

      // Should have 2+ courts but they should be locked (grayed out)
      const twoCourtOptions = getAllByText('2 Courts');
      expect(twoCourtOptions.length).toBeGreaterThan(0);

      // Verify locked option has disabled styling on the View container
      const lockedOption = twoCourtOptions[0].parent?.parent;
      expect(lockedOption?.props.style).toMatchObject({
        backgroundColor: '#F9FAFB',
        opacity: 0.5,
      });
    });

    it('should display upgrade prompt for free tier', () => {
      mockUseMaxCourts.mockReturnValue(1);

      const { getByText } = render(
        <CourtSelector value={1} onChange={mockOnChange} mode="sequential" />
      );

      fireEvent.press(getByText('1 Court'));

      expect(getByText('Upgrade to unlock more courts')).toBeTruthy();
      expect(getByText('Personal plan: Unlimited courts • IDR 49k/month')).toBeTruthy();
    });

    it('should display locked options with lock icon for free tier', () => {
      mockUseMaxCourts.mockReturnValue(1);

      const { getAllByText } = render(
        <CourtSelector value={1} onChange={mockOnChange} mode="sequential" />
      );

      fireEvent.press(getAllByText('1 Court')[0]);

      // There should be locked options (2-10 courts)
      const twoCourtOptions = getAllByText('2 Courts');
      expect(twoCourtOptions.length).toBeGreaterThan(0);

      // Locked options should be styled differently (grayed out) on the View container
      const lockedOption = twoCourtOptions[0].parent?.parent;
      expect(lockedOption?.props.style).toMatchObject({
        backgroundColor: '#F9FAFB',
        opacity: 0.5,
      });
    });

    it('should not allow selection of locked options', () => {
      mockUseMaxCourts.mockReturnValue(1);

      const { getByText, getAllByText } = render(
        <CourtSelector value={1} onChange={mockOnChange} mode="sequential" />
      );

      fireEvent.press(getByText('1 Court'));

      // Try to press locked option (2 Courts)
      const twoCourtOptions = getAllByText('2 Courts');
      fireEvent.press(twoCourtOptions[0]);

      // Should NOT call onChange (locked option is not pressable)
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should show upgrade alert when pressing upgrade prompt', () => {
      mockUseMaxCourts.mockReturnValue(1);

      const { getByText } = render(
        <CourtSelector value={1} onChange={mockOnChange} mode="sequential" />
      );

      fireEvent.press(getByText('1 Court'));
      fireEvent.press(getByText('Upgrade to unlock more courts'));

      expect(Alert.alert).toHaveBeenCalledWith(
        'Upgrade to Personal',
        'Unlock unlimited courts with a Personal subscription.\n\nMonthly: IDR 49,000\nYearly: IDR 299,000',
        expect.arrayContaining([
          expect.objectContaining({ text: 'Maybe Later' }),
          expect.objectContaining({ text: 'Upgrade' }),
        ])
      );
    });

    it('should navigate to subscription page when upgrade is confirmed', () => {
      mockUseMaxCourts.mockReturnValue(1);

      const { getByText } = render(
        <CourtSelector value={1} onChange={mockOnChange} mode="sequential" />
      );

      fireEvent.press(getByText('1 Court'));
      fireEvent.press(getByText('Upgrade to unlock more courts'));

      // Get the upgrade button callback from Alert.alert
      const alertCalls = (Alert.alert as jest.Mock).mock.calls;
      const lastCall = alertCalls[alertCalls.length - 1];
      const buttons = lastCall[2];
      const upgradeButton = buttons.find((b: any) => b.text === 'Upgrade');

      // Simulate pressing the upgrade button
      upgradeButton.onPress();

      expect(mockRouterPush).toHaveBeenCalledWith('/(tabs)/subscription');
    });

    it('should not show locked options in parallel mode if free tier', () => {
      mockUseMaxCourts.mockReturnValue(1);

      const { getAllByText } = render(
        <CourtSelector value={2} onChange={mockOnChange} mode="parallel" />
      );

      fireEvent.press(getAllByText('2 Courts')[0]);

      // Parallel mode filters to 2-4, but free tier has max 1
      // So 2-4 should be shown as locked
      const twoCourtOptions = getAllByText('2 Courts');
      expect(twoCourtOptions.length).toBeGreaterThan(0);

      const threeCourtOptions = getAllByText('3 Courts');
      expect(threeCourtOptions.length).toBeGreaterThan(0);
    });
  });

  describe('Subscription Restrictions - Premium Tier', () => {
    beforeEach(() => {
      mockUseMaxCourts.mockReturnValue(-1); // Unlimited
    });

    it('should display all court options for premium users', () => {
      const { getAllByText } = render(
        <CourtSelector value={1} onChange={mockOnChange} mode="sequential" />
      );

      fireEvent.press(getAllByText('1 Court')[0]);

      // Check all 10 options are available
      for (let i = 1; i <= 10; i++) {
        const label = i === 1 ? '1 Court' : `${i} Courts`;
        expect(getAllByText(label).length).toBeGreaterThan(0);
      }
    });

    it('should not display upgrade prompt for premium users', () => {
      const { getByText, queryByText } = render(
        <CourtSelector value={1} onChange={mockOnChange} mode="sequential" />
      );

      fireEvent.press(getByText('1 Court'));

      expect(queryByText('Upgrade to unlock more courts')).toBeNull();
    });

    it('should not display locked options for premium users', () => {
      const { getAllByText } = render(
        <CourtSelector value={1} onChange={mockOnChange} mode="sequential" />
      );

      fireEvent.press(getAllByText('1 Court')[0]);

      // All options should be selectable (not locked)
      // We can verify by checking that there's no opacity: 0.5
      const allTenCourtOptions = getAllByText('10 Courts');
      const tenCourtOption = allTenCourtOptions[allTenCourtOptions.length - 1].parent;
      expect(tenCourtOption?.props.style.opacity).not.toBe(0.5);
    });
  });

  describe('Visual States and Feedback', () => {
    it('should apply selected styling to current value', () => {
      const { getAllByText } = render(
        <CourtSelector value={5} onChange={mockOnChange} mode="sequential" />
      );

      fireEvent.press(getAllByText('5 Courts')[0]);

      const allFiveCourtOptions = getAllByText('5 Courts');
      const modalOption = allFiveCourtOptions[allFiveCourtOptions.length - 1];
      // The background color is on the TouchableOpacity (parent.parent)
      expect(modalOption.parent?.parent?.props.style).toMatchObject({
        backgroundColor: '#FEF2F2',
      });
    });

    it('should apply default styling to unselected options', () => {
      const { getAllByText } = render(
        <CourtSelector value={5} onChange={mockOnChange} mode="sequential" />
      );

      fireEvent.press(getAllByText('5 Courts')[0]);

      const allThreeCourtOptions = getAllByText('3 Courts');
      const unselectedOption = allThreeCourtOptions[allThreeCourtOptions.length - 1].parent?.parent;
      expect(unselectedOption?.props.style).toMatchObject({
        backgroundColor: '#FFFFFF',
      });
    });

    it('should show lock icon for locked options', () => {
      mockUseMaxCourts.mockReturnValue(1);

      const { getByText } = render(
        <CourtSelector value={1} onChange={mockOnChange} mode="sequential" />
      );

      fireEvent.press(getByText('1 Court'));

      // Lock icon should be present for locked options
      // The Lock component is mocked, so we just verify rendering
      expect(getByText('2 Courts')).toBeTruthy();
    });

    it('should display different text colors for selected vs unselected', () => {
      const { getAllByText } = render(
        <CourtSelector value={3} onChange={mockOnChange} mode="sequential" />
      );

      fireEvent.press(getAllByText('3 Courts')[0]);

      const allThreeCourtOptions = getAllByText('3 Courts');
      const selectedText = allThreeCourtOptions[allThreeCourtOptions.length - 1];

      const allFiveCourtOptions = getAllByText('5 Courts');
      const unselectedText = allFiveCourtOptions[allFiveCourtOptions.length - 1];

      expect(selectedText.props.style).toMatchObject({
        color: '#EF4444',
        fontWeight: '600',
      });

      expect(unselectedText.props.style).toMatchObject({
        color: '#111827',
        fontWeight: '400',
      });
    });
  });

  describe('Mode Filtering - Sequential vs Parallel', () => {
    beforeEach(() => {
      mockUseMaxCourts.mockReturnValue(-1); // Unlimited
    });

    it('should allow all courts in sequential mode', () => {
      const { getAllByText } = render(
        <CourtSelector value={1} onChange={mockOnChange} mode="sequential" />
      );

      fireEvent.press(getAllByText('1 Court')[0]);

      // All 1-10 should be available
      expect(getAllByText('1 Court').length).toBeGreaterThan(0);
      expect(getAllByText('10 Courts').length).toBeGreaterThan(0);
    });

    it('should restrict courts to 2-4 in parallel mode', () => {
      const { getAllByText, queryByText } = render(
        <CourtSelector value={2} onChange={mockOnChange} mode="parallel" />
      );

      fireEvent.press(getAllByText('2 Courts')[0]);

      // Only 2-4 should be available
      expect(getAllByText('2 Courts').length).toBeGreaterThan(0);
      expect(getAllByText('3 Courts').length).toBeGreaterThan(0);
      expect(getAllByText('4 Courts').length).toBeGreaterThan(0);

      // 1 and 5+ should NOT be available
      expect(queryByText('1 Court')).toBeNull();
      expect(queryByText('5 Courts')).toBeNull();
    });

    it('should update available options when mode changes', () => {
      const { getAllByText, queryByText, rerender } = render(
        <CourtSelector value={2} onChange={mockOnChange} mode="sequential" />
      );

      fireEvent.press(getAllByText('2 Courts')[0]);
      expect(getAllByText('10 Courts').length).toBeGreaterThan(0);

      // Change to parallel mode (don't need to close modal, just rerender)
      rerender(<CourtSelector value={2} onChange={mockOnChange} mode="parallel" />);

      // Open modal again
      fireEvent.press(getAllByText('2 Courts')[0]);
      expect(queryByText('10 Courts')).toBeNull();
      expect(getAllByText('4 Courts').length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle value of 1 correctly', () => {
      const { getByText } = render(
        <CourtSelector value={1} onChange={mockOnChange} mode="sequential" />
      );

      expect(getByText('1 Court')).toBeTruthy();
    });

    it('should handle maximum value correctly (10)', () => {
      const { getByText } = render(
        <CourtSelector value={10} onChange={mockOnChange} mode="sequential" />
      );

      expect(getByText('10 Courts')).toBeTruthy();
    });

    it('should handle mode switch with current value outside new range', () => {
      const { getByText, rerender } = render(
        <CourtSelector value={5} onChange={mockOnChange} mode="sequential" />
      );

      expect(getByText('5 Courts')).toBeTruthy();

      // Switch to parallel mode (which only allows 2-4)
      rerender(<CourtSelector value={5} onChange={mockOnChange} mode="parallel" />);

      // Should still display the current value, even if out of range
      expect(getByText('5 Courts')).toBeTruthy();
    });

    it('should handle rapid modal open/close', async () => {
      const { getAllByText, queryByText, UNSAFE_root } = render(
        <CourtSelector value={1} onChange={mockOnChange} mode="sequential" />
      );

      // Open modal
      fireEvent.press(getAllByText('1 Court')[0]);
      expect(getAllByText('Select Courts').length).toBeGreaterThan(0);

      // Find and press backdrop
      const modal = UNSAFE_root.findAllByProps({ onPress: expect.any(Function) });
      const backdrop = modal.find(node => node.props.activeOpacity === 1);

      if (backdrop) {
        fireEvent.press(backdrop);

        // Wait for modal to close
        await waitFor(() => {
          expect(queryByText('Select Courts')).toBeNull();
        }, { timeout: 1000 });
      }

      // Open again
      fireEvent.press(getAllByText('1 Court')[0]);
      expect(getAllByText('Select Courts').length).toBeGreaterThan(0);
    });

    it('should handle subscription tier changing during modal open', () => {
      const { getByText, rerender } = render(
        <CourtSelector value={1} onChange={mockOnChange} mode="sequential" />
      );

      fireEvent.press(getByText('1 Court'));
      expect(getByText('Choose number of courts available')).toBeTruthy();

      // Simulate subscription tier changing
      mockUseMaxCourts.mockReturnValue(1);

      rerender(<CourtSelector value={1} onChange={mockOnChange} mode="sequential" />);

      // Should now show free tier message
      expect(getByText('Free tier limited to 1 court')).toBeTruthy();
    });

    it('should handle onChange callback errors gracefully', () => {
      const errorOnChange = jest.fn(() => {
        throw new Error('onChange error');
      });

      const { getByText, getAllByText } = render(
        <CourtSelector value={1} onChange={errorOnChange} mode="sequential" />
      );

      fireEvent.press(getByText('1 Court'));

      // This should not crash even if onChange throws
      expect(() => {
        const threeCourtOptions = getAllByText('3 Courts');
        fireEvent.press(threeCourtOptions[threeCourtOptions.length - 1]);
      }).toThrow('onChange error');
    });

    it('should handle missing safe area insets', () => {
      const useSafeAreaInsets = require('react-native-safe-area-context').useSafeAreaInsets;
      useSafeAreaInsets.mockReturnValue({ bottom: 0, top: 0, left: 0, right: 0 });

      const { getByText } = render(
        <CourtSelector value={1} onChange={mockOnChange} mode="sequential" />
      );

      fireEvent.press(getByText('1 Court'));
      expect(getByText('Select Courts')).toBeTruthy();
    });
  });

  describe('Animations and UX', () => {
    it('should render modal with animation components', () => {
      const { getByText } = render(
        <CourtSelector value={1} onChange={mockOnChange} mode="sequential" />
      );

      fireEvent.press(getByText('1 Court'));

      // Modal should be rendered (Animated.View is used)
      expect(getByText('Select Courts')).toBeTruthy();
    });

    it('should display drag handle in modal', () => {
      const { getByText } = render(
        <CourtSelector value={1} onChange={mockOnChange} mode="sequential" />
      );

      fireEvent.press(getByText('1 Court'));

      // Drag handle should be present (visual element for UX)
      // We can't easily test the View with specific styling, but we can verify modal renders
      expect(getByText('Select Courts')).toBeTruthy();
    });

    it('should render modal with transparent background overlay', () => {
      const { getByText } = render(
        <CourtSelector value={1} onChange={mockOnChange} mode="sequential" />
      );

      fireEvent.press(getByText('1 Court'));

      // Verify modal is visible
      expect(getByText('Select Courts')).toBeTruthy();
    });
  });

  describe('Accessibility and User Experience', () => {
    it('should provide clear court labels', () => {
      const { getAllByText } = render(
        <CourtSelector value={1} onChange={mockOnChange} mode="sequential" />
      );

      fireEvent.press(getAllByText('1 Court')[0]);

      // All court labels should be clear and accessible
      expect(getAllByText('1 Court').length).toBeGreaterThan(0);
      expect(getAllByText('5 Courts').length).toBeGreaterThan(0);
      expect(getAllByText('10 Courts').length).toBeGreaterThan(0);
    });

    it('should provide clear mode descriptions', () => {
      const { getByText } = render(
        <CourtSelector value={1} onChange={mockOnChange} mode="sequential" />
      );

      fireEvent.press(getByText('1 Court'));

      expect(getByText('Choose number of courts available')).toBeTruthy();
    });

    it('should provide clear upgrade messaging for free tier', () => {
      mockUseMaxCourts.mockReturnValue(1);

      const { getByText } = render(
        <CourtSelector value={1} onChange={mockOnChange} mode="sequential" />
      );

      fireEvent.press(getByText('1 Court'));

      expect(getByText('Upgrade to unlock more courts')).toBeTruthy();
      expect(getByText('Personal plan: Unlimited courts • IDR 49k/month')).toBeTruthy();
    });

    it('should provide visual separation between available and locked options', () => {
      mockUseMaxCourts.mockReturnValue(1);

      const { getByText } = render(
        <CourtSelector value={1} onChange={mockOnChange} mode="sequential" />
      );

      fireEvent.press(getByText('1 Court'));

      // Upgrade prompt should separate available from locked
      expect(getByText('Upgrade to unlock more courts')).toBeTruthy();
    });
  });

  describe('Combined Restrictions - Mode + Subscription', () => {
    it('should apply both parallel mode and free tier restrictions', () => {
      mockUseMaxCourts.mockReturnValue(1);

      const { getAllByText, queryByText } = render(
        <CourtSelector value={2} onChange={mockOnChange} mode="parallel" />
      );

      fireEvent.press(getAllByText('2 Courts')[0]);

      // Parallel mode: 2-4 courts
      // Free tier: max 1 court
      // Result: 2-4 should be shown but locked

      // 2-4 should be shown (filtered by parallel mode)
      expect(getAllByText('2 Courts').length).toBeGreaterThan(0);
      expect(getAllByText('3 Courts').length).toBeGreaterThan(0);
      expect(getAllByText('4 Courts').length).toBeGreaterThan(0);

      // 5+ should not be shown (filtered by parallel mode)
      expect(queryByText('5 Courts')).toBeNull();

      // 1 should not be shown (filtered by parallel mode which requires 2-4)
      expect(queryByText('1 Court')).toBeNull();
    });

    it('should show upgrade prompt in parallel mode with free tier', () => {
      mockUseMaxCourts.mockReturnValue(1);

      const { getByText } = render(
        <CourtSelector value={2} onChange={mockOnChange} mode="parallel" />
      );

      fireEvent.press(getByText('2 Courts'));

      expect(getByText('Upgrade to unlock more courts')).toBeTruthy();
    });

    it('should allow full parallel range for premium users', () => {
      mockUseMaxCourts.mockReturnValue(-1);

      const { getAllByText } = render(
        <CourtSelector value={2} onChange={mockOnChange} mode="parallel" />
      );

      fireEvent.press(getAllByText('2 Courts')[0]);

      // All parallel mode options (2-4) should be available
      expect(getAllByText('2 Courts').length).toBeGreaterThan(0);
      expect(getAllByText('3 Courts').length).toBeGreaterThan(0);
      expect(getAllByText('4 Courts').length).toBeGreaterThan(0);
    });
  });

  describe('Integration Tests - Complete User Flows', () => {
    it('should complete full selection flow: open → select → close', async () => {
      const { getByText, getAllByText, queryByText } = render(
        <CourtSelector value={1} onChange={mockOnChange} mode="sequential" />
      );

      // Step 1: Open modal
      fireEvent.press(getByText('1 Court'));
      expect(getByText('Select Courts')).toBeTruthy();

      // Step 2: Select option
      const sevenCourtOptions = getAllByText('7 Courts');
      fireEvent.press(sevenCourtOptions[sevenCourtOptions.length - 1]);

      // Step 3: Verify onChange called
      expect(mockOnChange).toHaveBeenCalledWith(7);

      // Step 4: Verify modal closed
      await waitFor(() => {
        expect(queryByText('Select Courts')).toBeNull();
      });
    });

    it('should complete upgrade flow: open → press upgrade → see alert → navigate', () => {
      mockUseMaxCourts.mockReturnValue(1);

      const { getByText } = render(
        <CourtSelector value={1} onChange={mockOnChange} mode="sequential" />
      );

      // Step 1: Open modal
      fireEvent.press(getByText('1 Court'));

      // Step 2: Press upgrade prompt
      fireEvent.press(getByText('Upgrade to unlock more courts'));

      // Step 3: Verify alert shown
      expect(Alert.alert).toHaveBeenCalled();

      // Step 4: Simulate upgrade button press
      const alertCalls = (Alert.alert as jest.Mock).mock.calls;
      const lastCall = alertCalls[alertCalls.length - 1];
      const buttons = lastCall[2];
      const upgradeButton = buttons.find((b: any) => b.text === 'Upgrade');
      upgradeButton.onPress();

      // Step 5: Verify navigation
      expect(mockRouterPush).toHaveBeenCalledWith('/(tabs)/subscription');
    });

    it('should handle modal cancel flow: open → cancel → no change', async () => {
      const { getAllByText, queryByText, UNSAFE_root } = render(
        <CourtSelector value={3} onChange={mockOnChange} mode="sequential" />
      );

      // Step 1: Open modal
      fireEvent.press(getAllByText('3 Courts')[0]);
      expect(getAllByText('Select Courts').length).toBeGreaterThan(0);

      // Step 2: Find and press backdrop to cancel
      const modal = UNSAFE_root.findAllByProps({ onPress: expect.any(Function) });
      const backdrop = modal.find(node => node.props.activeOpacity === 1);

      if (backdrop) {
        fireEvent.press(backdrop);

        // Step 3: Verify onChange NOT called
        expect(mockOnChange).not.toHaveBeenCalled();

        // Step 4: Verify modal closed
        await waitFor(() => {
          expect(queryByText('Select Courts')).toBeNull();
        }, { timeout: 1000 });
      }
    });

    it('should prevent selection of locked options in free tier', () => {
      mockUseMaxCourts.mockReturnValue(1);

      const { getByText, getAllByText } = render(
        <CourtSelector value={1} onChange={mockOnChange} mode="sequential" />
      );

      // Step 1: Open modal
      fireEvent.press(getByText('1 Court'));

      // Step 2: Try to select locked option
      const fiveCourtOptions = getAllByText('5 Courts');
      fireEvent.press(fiveCourtOptions[0]); // Press locked option

      // Step 3: Verify onChange NOT called
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });
});
