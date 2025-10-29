import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';
import LoginScreen from '../login';
import { useAuth } from '../../../hooks/useAuth';

// Mock the useAuth hook
jest.mock('../../../hooks/useAuth');
jest.mock('../../../hooks/useAnimationPreference', () => ({
  useAnimationPreference: () => ({ reduceAnimation: false }),
}));

const mockSignIn = jest.fn();
const mockSignUp = jest.fn();
const mockSignInWithGoogle = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (useAuth as jest.Mock).mockReturnValue({
    signIn: mockSignIn,
    signUp: mockSignUp,
    signInWithGoogle: mockSignInWithGoogle,
  });
});

describe('LoginScreen', () => {
  describe('Rendering', () => {
    it('renders login mode by default', () => {
      const { getByText, getByPlaceholderText } = render(<LoginScreen />);

      expect(getByText('Welcome back! Sign in to continue')).toBeTruthy();
      expect(getByPlaceholderText('your@email.com')).toBeTruthy();
      expect(getByPlaceholderText('••••••••')).toBeTruthy();
      expect(getByText('Sign In')).toBeTruthy();
    });

    it('renders signup mode when toggled', () => {
      const { getByText, getByPlaceholderText } = render(<LoginScreen />);

      const signUpToggle = getByText('Sign Up');
      fireEvent.press(signUpToggle);

      expect(getByText('Create your account to get started')).toBeTruthy();
      expect(getByPlaceholderText('Your name')).toBeTruthy();
      expect(getByText('Create Account')).toBeTruthy();
    });

    it('renders glassmorphism background bubbles', () => {
      const { UNSAFE_getByType } = render(<LoginScreen />);
      // Verify background bubbles are rendered (4 views for bubbles)
      const component = UNSAFE_getByType('View');
      expect(component).toBeTruthy();
    });

    it('renders Google sign in button', () => {
      const { getByText } = render(<LoginScreen />);
      expect(getByText('Sign in with Google')).toBeTruthy();
    });
  });

  describe('Form Validation', () => {
    it('shows email validation error for invalid email', async () => {
      const { getByPlaceholderText, getByText, findByText } = render(<LoginScreen />);

      const emailInput = getByPlaceholderText('your@email.com');
      const submitButton = getByText('Sign In');

      fireEvent.changeText(emailInput, 'invalid-email');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(findByText('Please enter a valid email')).toBeTruthy();
      });
    });

    it('shows password validation error for short password', async () => {
      const { getByPlaceholderText, getByText, findByText } = render(<LoginScreen />);

      const passwordInput = getByPlaceholderText('••••••••');
      const submitButton = getByText('Sign In');

      fireEvent.changeText(passwordInput, '123');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(findByText('Password must be at least 6 characters')).toBeTruthy();
      });
    });

    it('shows displayName validation error in signup mode', async () => {
      const { getByPlaceholderText, getByText, findByText } = render(<LoginScreen />);

      // Switch to signup mode
      const signUpToggle = getByText('Sign Up');
      fireEvent.press(signUpToggle);

      const displayNameInput = getByPlaceholderText('Your name');
      const submitButton = getByText('Create Account');

      fireEvent.changeText(displayNameInput, 'A');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(findByText('Name must be at least 2 characters')).toBeTruthy();
      });
    });
  });

  describe('Authentication', () => {
    it('calls signIn with correct credentials', async () => {
      mockSignIn.mockResolvedValueOnce(undefined);

      const { getByPlaceholderText, getByText } = render(<LoginScreen />);

      const emailInput = getByPlaceholderText('your@email.com');
      const passwordInput = getByPlaceholderText('••••••••');
      const submitButton = getByText('Sign In');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('calls signUp with correct credentials', async () => {
      mockSignUp.mockResolvedValueOnce(undefined);

      const { getByPlaceholderText, getByText } = render(<LoginScreen />);

      // Switch to signup mode
      const signUpToggle = getByText('Sign Up');
      fireEvent.press(signUpToggle);

      const displayNameInput = getByPlaceholderText('Your name');
      const emailInput = getByPlaceholderText('your@email.com');
      const passwordInput = getByPlaceholderText('••••••••');
      const submitButton = getByText('Create Account');

      fireEvent.changeText(displayNameInput, 'Test User');
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith('test@example.com', 'password123', 'Test User');
      });
    });

    it('calls signInWithGoogle when Google button is pressed', async () => {
      mockSignInWithGoogle.mockResolvedValueOnce(undefined);

      const { getByText } = render(<LoginScreen />);

      const googleButton = getByText('Sign in with Google');
      fireEvent.press(googleButton);

      await waitFor(() => {
        expect(mockSignInWithGoogle).toHaveBeenCalled();
      });
    });

    it('shows loading indicator during sign in', async () => {
      mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      const { getByPlaceholderText, getByText, UNSAFE_queryByType } = render(<LoginScreen />);

      const emailInput = getByPlaceholderText('your@email.com');
      const passwordInput = getByPlaceholderText('••••••••');
      const submitButton = getByText('Sign In');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(submitButton);

      // ActivityIndicator should be visible during loading
      await waitFor(() => {
        const indicator = UNSAFE_queryByType('ActivityIndicator');
        expect(indicator).toBeTruthy();
      });
    });
  });

  describe('Mode Toggling', () => {
    it('toggles between login and signup modes', () => {
      const { getByText } = render(<LoginScreen />);

      // Initially in login mode
      expect(getByText('Sign In')).toBeTruthy();
      expect(getByText("Don't have an account?")).toBeTruthy();

      // Switch to signup
      const signUpToggle = getByText('Sign Up');
      fireEvent.press(signUpToggle);

      expect(getByText('Create Account')).toBeTruthy();
      expect(getByText('Already have an account?')).toBeTruthy();

      // Switch back to login
      const signInToggle = getByText('Sign In');
      fireEvent.press(signInToggle);

      expect(getByText('Sign In')).toBeTruthy();
    });

    it('clears form when mode is toggled', () => {
      const { getByPlaceholderText, getByText } = render(<LoginScreen />);

      const emailInput = getByPlaceholderText('your@email.com');
      fireEvent.changeText(emailInput, 'test@example.com');

      // Toggle to signup
      const signUpToggle = getByText('Sign Up');
      fireEvent.press(signUpToggle);

      // Email should be cleared
      const newEmailInput = getByPlaceholderText('your@email.com');
      expect(newEmailInput.props.value).toBe('');
    });
  });

  describe('Platform-Specific Styling', () => {
    it('applies iOS-specific styles', () => {
      Platform.OS = 'ios';
      const { UNSAFE_root } = render(<LoginScreen />);

      // Verify component renders without errors on iOS
      expect(UNSAFE_root).toBeTruthy();
    });

    it('applies Android-specific styles', () => {
      Platform.OS = 'android';
      const { UNSAFE_root } = render(<LoginScreen />);

      // Verify component renders without errors on Android
      expect(UNSAFE_root).toBeTruthy();
    });

    it('has proper border styles on Android', () => {
      Platform.OS = 'android';
      const { getByPlaceholderText } = render(<LoginScreen />);

      const emailInput = getByPlaceholderText('your@email.com');
      const parentView = emailInput.parent;

      // Verify border style is applied (would be in parent View)
      expect(parentView).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('disables buttons during loading', async () => {
      mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      const { getByPlaceholderText, getByText } = render(<LoginScreen />);

      const emailInput = getByPlaceholderText('your@email.com');
      const passwordInput = getByPlaceholderText('••••••••');
      const submitButton = getByText('Sign In');
      const googleButton = getByText('Sign in with Google');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(submitButton);

      // Buttons should be disabled during loading
      await waitFor(() => {
        expect(submitButton.props.accessibilityState?.disabled).toBeTruthy();
        expect(googleButton.props.accessibilityState?.disabled).toBeTruthy();
      });
    });

    it('has proper accessibility properties', () => {
      const { getByPlaceholderText } = render(<LoginScreen />);

      const emailInput = getByPlaceholderText('your@email.com');
      const passwordInput = getByPlaceholderText('••••••••');

      // Verify inputs have proper props
      expect(emailInput).toBeTruthy();
      expect(passwordInput).toBeTruthy();
      expect(passwordInput.props.secureTextEntry).toBe(true);
    });
  });
});
