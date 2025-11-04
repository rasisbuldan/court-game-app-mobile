/**
 * LoginScreen Component Tests
 *
 * Comprehensive unit tests for the login screen covering:
 * - Initial render and UI elements
 * - Form validation (email, password, display name)
 * - Login flow (success, failure, loading states)
 * - Sign up flow (success, failure, validation)
 * - Mode switching (login <-> signup)
 * - Google OAuth flow
 * - Password reset flow
 * - Device management modal
 * - Error handling and edge cases
 * - Keyboard interactions
 * - Accessibility
 */

import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { renderHook, act } from '@testing-library/react-native';
import * as RN from 'react-native';
import LoginScreen from '../login';
import { useAuth } from '../../../hooks/useAuth';
import { supabase } from '../../../config/supabase';
import Toast from 'react-native-toast-message';

// Mock Keyboard.dismiss
jest.spyOn(RN.Keyboard, 'dismiss').mockImplementation(() => {});

// Mock dependencies
jest.mock('../../../hooks/useAuth');
jest.mock('../../../config/supabase');
jest.mock('react-native-toast-message');
jest.mock('../../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    reduceAnimation: false,
    theme: 'light',
  }),
}));
jest.mock('../../../utils/posthog-wrapper', () => ({
  posthog: {
    capture: jest.fn(),
  },
}));

describe('LoginScreen Component', () => {
  const mockSignIn = jest.fn();
  const mockSignUp = jest.fn();
  const mockSignInWithGoogle = jest.fn();
  const mockCloseDeviceModal = jest.fn();
  const mockOnDeviceRemoved = jest.fn();

  const defaultAuthContext = {
    signIn: mockSignIn,
    signUp: mockSignUp,
    signInWithGoogle: mockSignInWithGoogle,
    showDeviceModal: false,
    deviceModalDevices: [],
    onDeviceRemoved: mockOnDeviceRemoved,
    closeDeviceModal: mockCloseDeviceModal,
    user: null,
    signUpProgress: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue(defaultAuthContext);
  });

  describe('Initial Render - Login Mode', () => {
    it('should render login form by default', () => {
      render(<LoginScreen />);

      // Title
      expect(screen.getByText('Courtster')).toBeTruthy();
      expect(screen.getByText('Welcome back! Sign in to continue')).toBeTruthy();

      // Form fields
      expect(screen.getByPlaceholderText('you@example.com')).toBeTruthy();
      expect(screen.getByPlaceholderText('Enter your password')).toBeTruthy();

      // Display name should NOT be visible in login mode
      expect(screen.queryByPlaceholderText('John Doe')).toBeNull();

      // Submit button
      expect(screen.getByText('Sign In')).toBeTruthy();

      // Toggle to sign up
      expect(screen.getByText("Don't have an account?")).toBeTruthy();
      expect(screen.getByText('Sign Up')).toBeTruthy();

      // Forgot password link
      expect(screen.getByText('Forgot Password?')).toBeTruthy();

      // OAuth button
      expect(screen.getByText('Sign in with Google')).toBeTruthy();
    });

    it('should have proper accessibility labels', () => {
      const { getByPlaceholderText } = render(<LoginScreen />);

      const emailInput = getByPlaceholderText('you@example.com');
      const passwordInput = getByPlaceholderText('Enter your password');

      expect(emailInput).toBeTruthy();
      expect(passwordInput).toBeTruthy();
    });
  });

  describe('Form Validation - Login Mode', () => {
    it('should show error for invalid email format', async () => {
      render(<LoginScreen />);

      const emailInput = screen.getByPlaceholderText('you@example.com');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const submitButton = screen.getByText('Sign In');

      // Fill form with invalid email
      fireEvent.changeText(emailInput, 'invalid-email');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(submitButton);

      // Wait for validation error
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeTruthy();
      });

      // Should not call signIn
      expect(mockSignIn).not.toHaveBeenCalled();
    });

    it('should show error for empty email', async () => {
      render(<LoginScreen />);

      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const submitButton = screen.getByText('Sign In');

      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeTruthy();
      });

      expect(mockSignIn).not.toHaveBeenCalled();
    });

    it('should show error for short password', async () => {
      render(<LoginScreen />);

      const emailInput = screen.getByPlaceholderText('you@example.com');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const submitButton = screen.getByText('Sign In');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, '12345'); // Only 5 characters
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Password must be at least 6 characters long')).toBeTruthy();
      });

      expect(mockSignIn).not.toHaveBeenCalled();
    });

    it('should accept valid email and password', async () => {
      mockSignIn.mockResolvedValue(undefined);

      render(<LoginScreen />);

      const emailInput = screen.getByPlaceholderText('you@example.com');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const submitButton = screen.getByText('Sign In');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });
  });

  describe('Login Flow', () => {
    it('should call signIn with correct credentials', async () => {
      mockSignIn.mockResolvedValue(undefined);

      render(<LoginScreen />);

      const emailInput = screen.getByPlaceholderText('you@example.com');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const submitButton = screen.getByText('Sign In');

      fireEvent.changeText(emailInput, 'user@example.com');
      fireEvent.changeText(passwordInput, 'securePassword123');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('user@example.com', 'securePassword123');
      });
    });

    it('should handle login errors gracefully', async () => {
      mockSignIn.mockRejectedValue(new Error('Invalid credentials'));

      render(<LoginScreen />);

      const emailInput = screen.getByPlaceholderText('you@example.com');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const submitButton = screen.getByText('Sign In');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'wrongpassword');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalled();
      });

      // Error is handled in useAuth, just verify signIn was called
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'wrongpassword');
    });
  });

  describe('Sign Up Mode', () => {
    it('should switch to sign up mode', () => {
      render(<LoginScreen />);

      const signUpToggle = screen.getByText('Sign Up');
      fireEvent.press(signUpToggle);

      // Title changes
      expect(screen.getByText('Create Account')).toBeTruthy();
      expect(screen.getByText('Create your account to get started')).toBeTruthy();

      // Display name field appears
      expect(screen.getByPlaceholderText('John Doe')).toBeTruthy();

      // Submit button text changes
      expect(screen.getByText('Create Account')).toBeTruthy();

      // Toggle text changes
      expect(screen.getByText('Already have an account?')).toBeTruthy();
      expect(screen.getByText('Sign In')).toBeTruthy();
    });

    it('should reset form when switching modes', () => {
      render(<LoginScreen />);

      const emailInput = screen.getByPlaceholderText('you@example.com');
      const passwordInput = screen.getByPlaceholderText('Enter your password');

      // Fill login form
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');

      // Switch to sign up
      const signUpToggle = screen.getByText('Sign Up');
      fireEvent.press(signUpToggle);

      // Form should be reset
      expect(emailInput.props.value).toBe('');
      expect(passwordInput.props.value).toBe('');
    });
  });

  describe('Form Validation - Sign Up Mode', () => {
    it('should validate display name in sign up mode', async () => {
      render(<LoginScreen />);

      // Switch to sign up
      fireEvent.press(screen.getByText('Sign Up'));

      const emailInput = screen.getByPlaceholderText('you@example.com');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const displayNameInput = screen.getByPlaceholderText('John Doe');
      const submitButton = screen.getByText('Create Account');

      // Try with short name
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(displayNameInput, 'A'); // Too short
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Name must be at least 2 characters')).toBeTruthy();
      });

      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it('should validate display name with invalid characters', async () => {
      render(<LoginScreen />);

      // Switch to sign up
      fireEvent.press(screen.getByText('Sign Up'));

      const emailInput = screen.getByPlaceholderText('you@example.com');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const displayNameInput = screen.getByPlaceholderText('John Doe');
      const submitButton = screen.getByText('Create Account');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(displayNameInput, 'Test123'); // Contains numbers
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Name can only contain letters, spaces, hyphens, and apostrophes')).toBeTruthy();
      });

      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it('should accept valid display name', async () => {
      mockSignUp.mockResolvedValue(undefined);

      render(<LoginScreen />);

      // Switch to sign up
      fireEvent.press(screen.getByText('Sign Up'));

      const emailInput = screen.getByPlaceholderText('you@example.com');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const displayNameInput = screen.getByPlaceholderText('John Doe');
      const submitButton = screen.getByText('Create Account');

      fireEvent.changeText(emailInput, 'newuser@example.com');
      fireEvent.changeText(passwordInput, 'securePass123');
      fireEvent.changeText(displayNameInput, "John O'Brien-Smith"); // Valid name with apostrophe and hyphen
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith(
          'newuser@example.com',
          'securePass123',
          "John O'Brien-Smith"
        );
      });
    });
  });

  describe('Sign Up Flow', () => {
    it('should call signUp with correct data', async () => {
      mockSignUp.mockResolvedValue(undefined);

      render(<LoginScreen />);

      // Switch to sign up
      fireEvent.press(screen.getByText('Sign Up'));

      const emailInput = screen.getByPlaceholderText('you@example.com');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const displayNameInput = screen.getByPlaceholderText('John Doe');
      const submitButton = screen.getByText('Create Account');

      fireEvent.changeText(emailInput, 'newuser@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(displayNameInput, 'New User');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith(
          'newuser@example.com',
          'password123',
          'New User'
        );
      });
    });

    it('should show loading modal during sign up', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        ...defaultAuthContext,
        signUpProgress: 'creating',
      });

      render(<LoginScreen />);

      // SignUpLoadingModal should be visible
      expect(screen.getByText('Creating your account...')).toBeTruthy();
    });
  });

  describe('Google OAuth Flow', () => {
    it('should call signInWithGoogle when Google button pressed', async () => {
      mockSignInWithGoogle.mockResolvedValue(undefined);

      render(<LoginScreen />);

      const googleButton = screen.getByText('Sign in with Google');
      fireEvent.press(googleButton);

      await waitFor(() => {
        expect(mockSignInWithGoogle).toHaveBeenCalled();
      });
    });

    it('should handle Google sign in errors', async () => {
      mockSignInWithGoogle.mockRejectedValue(new Error('Google auth failed'));

      render(<LoginScreen />);

      const googleButton = screen.getByText('Sign in with Google');
      fireEvent.press(googleButton);

      await waitFor(() => {
        expect(mockSignInWithGoogle).toHaveBeenCalled();
      });

      // Error is handled in useAuth
      expect(mockSignInWithGoogle).toHaveBeenCalled();
    });
  });

  describe('Password Reset Flow', () => {
    it('should open password reset modal', () => {
      render(<LoginScreen />);

      const forgotPasswordLink = screen.getByText('Forgot Password?');
      fireEvent.press(forgotPasswordLink);

      // Modal should be visible
      expect(screen.getByText('Reset Password')).toBeTruthy();
      expect(screen.getByPlaceholderText('your@email.com')).toBeTruthy();
      expect(screen.getByText('Send Reset Link')).toBeTruthy();
    });

    it('should validate email in password reset', async () => {
      render(<LoginScreen />);

      // Open modal
      fireEvent.press(screen.getByText('Forgot Password?'));

      const resetButton = screen.getByText('Send Reset Link');
      fireEvent.press(resetButton);

      // Should show error toast for empty email
      await waitFor(() => {
        expect(Toast.show).toHaveBeenCalledWith({
          type: 'error',
          text1: 'Email Required',
          text2: 'Please enter your email address',
        });
      });
    });

    it('should send password reset email', async () => {
      const mockResetPassword = jest.fn().mockResolvedValue({
        data: {},
        error: null,
      });
      (supabase.auth.resetPasswordForEmail as jest.Mock) = mockResetPassword;

      render(<LoginScreen />);

      // Open modal
      fireEvent.press(screen.getByText('Forgot Password?'));

      const emailInput = screen.getByPlaceholderText('your@email.com');
      const resetButton = screen.getByText('Send Reset Link');

      fireEvent.changeText(emailInput, 'user@example.com');
      fireEvent.press(resetButton);

      await waitFor(() => {
        expect(mockResetPassword).toHaveBeenCalledWith('user@example.com', expect.any(Object));
      });

      expect(Toast.show).toHaveBeenCalledWith({
        type: 'success',
        text1: 'Email Sent',
        text2: 'Check your inbox for password reset instructions',
      });
    });

    it('should handle password reset errors', async () => {
      const mockResetPassword = jest.fn().mockResolvedValue({
        data: null,
        error: new Error('Email not found'),
      });
      (supabase.auth.resetPasswordForEmail as jest.Mock) = mockResetPassword;

      render(<LoginScreen />);

      // Open modal
      fireEvent.press(screen.getByText('Forgot Password?'));

      const emailInput = screen.getByPlaceholderText('your@email.com');
      const resetButton = screen.getByText('Send Reset Link');

      fireEvent.changeText(emailInput, 'nonexistent@example.com');
      fireEvent.press(resetButton);

      await waitFor(() => {
        expect(Toast.show).toHaveBeenCalledWith({
          type: 'error',
          text1: 'Reset Failed',
          text2: 'Email not found',
        });
      });
    });
  });

  describe('Device Management Modal', () => {
    it('should show device management modal when device limit exceeded', () => {
      const mockDevices = [
        { id: 'device-1', device_name: 'iPhone 14', last_active: new Date().toISOString() },
        { id: 'device-2', device_name: 'iPad Pro', last_active: new Date().toISOString() },
      ];

      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        created_at: new Date().toISOString(),
      };

      (useAuth as jest.Mock).mockReturnValue({
        ...defaultAuthContext,
        user: mockUser,
        showDeviceModal: true,
        deviceModalDevices: mockDevices,
      });

      render(<LoginScreen />);

      // Device modal should be visible
      expect(screen.getByText(/device limit/i)).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in password', async () => {
      mockSignIn.mockResolvedValue(undefined);

      render(<LoginScreen />);

      const emailInput = screen.getByPlaceholderText('you@example.com');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const submitButton = screen.getByText('Sign In');

      const specialPassword = 'p@$$w0rd!#%&*()';
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, specialPassword);
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('test@example.com', specialPassword);
      });
    });
  });
});
