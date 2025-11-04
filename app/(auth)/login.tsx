import { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Modal,
  Image,
  ViewStyle,
  DimensionValue,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { StatusBar } from 'expo-status-bar';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';
import { Mail, Lock, User as UserIcon, X as XIcon } from 'lucide-react-native';
import { DeviceManagementModal } from '../../components/auth/DeviceManagementModal';
import { SignUpLoadingModal } from '../../components/SignUpLoadingModal';
import { supabase } from '../../config/supabase';
import Toast from 'react-native-toast-message';
import Svg, { Path } from 'react-native-svg';
import { posthog } from '../../utils/posthog-wrapper';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedKeyboard,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

const signupSchema = loginSchema.extend({
  displayName: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be 50 characters or less')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
});

type LoginForm = z.infer<typeof loginSchema>;
type SignupForm = z.infer<typeof signupSchema>;

export default function LoginScreen() {
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const { signIn, signUp, signInWithGoogle, showDeviceModal, deviceModalDevices, onDeviceRemoved, closeDeviceModal, user, signUpProgress } = useAuth();
  const { reduceAnimation } = useTheme();

  // Refs for keyboard navigation
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);

  // Keyboard animation
  const keyboard = useAnimatedKeyboard();

  const animatedContentStyle = useAnimatedStyle(() => {
    'worklet';
    const targetY = -keyboard.height.value * 0.4;

    return {
      transform: [
        {
          translateY: withTiming(targetY, {
            duration: 180,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          }),
        },
      ],
    };
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SignupForm>({
    resolver: zodResolver(isSignup ? signupSchema : loginSchema) as any,
    defaultValues: {
      email: '',
      password: '',
      displayName: '',
    },
  });

  const onSubmit = async (data: SignupForm | LoginForm) => {
    try {
      setLoading(true);
      if (isSignup) {
        await signUp(data.email, data.password, (data as SignupForm).displayName);
      } else {
        await signIn(data.email, data.password);
      }
    } catch (error) {
      // Error handled in auth context
    } finally {
      setLoading(false);
    }
  };

  const handleKeyboardSubmit = () => {
    Keyboard.dismiss();
    handleSubmit(onSubmit)();
  };

  const toggleMode = () => {
    setIsSignup(!isSignup);
    reset();
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      await signInWithGoogle();
    } catch (error) {
      // Error handled in auth context
    } finally {
      setGoogleLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    // Basic email validation
    if (!resetEmail || resetEmail.trim() === '') {
      Toast.show({
        type: 'error',
        text1: 'Email Required',
        text2: 'Please enter your email address',
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(resetEmail.trim())) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Email',
        text2: 'Please enter a valid email address',
      });
      return;
    }

    try {
      setResetLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: 'courtster://auth/callback',
      });

      if (error) throw error;

      Toast.show({
        type: 'success',
        text1: 'Email Sent',
        text2: 'Check your inbox for password reset instructions',
      });

      setShowPasswordReset(false);
      setResetEmail('');
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Reset Failed',
        text2: error.message || 'Failed to send reset email',
      });
    } finally {
      setResetLoading(false);
    }
  };

  // Animated Bubble Component (iOS only, respects reduceAnimation)
  const AnimatedBubble = ({
    size,
    color,
    opacity = 0.4,
    top,
    left,
    right,
    bottom,
    delay = 0,
    duration = 8000,
  }: {
    size: number;
    color: string;
    opacity?: number;
    top?: number | string;
    left?: number | string;
    right?: number | string;
    bottom?: number | string;
    delay?: number;
    duration?: number;
  }) => {
    // Animation values
    const translateY = useSharedValue(0);
    const translateX = useSharedValue(0);
    const scale = useSharedValue(1);

    useEffect(() => {
      // Only animate on iOS and if animations are not reduced
      if (Platform.OS === 'ios' && !reduceAnimation) {
        // Use Easing.bezier for smoother, more natural animations
        const smoothEasing = Easing.bezier(0.4, 0.0, 0.2, 1); // Material Design standard easing

        // Vertical floating animation - smooth and gentle
        translateY.value = withRepeat(
          withSequence(
            withTiming(20, { duration: duration / 2, easing: smoothEasing }),
            withTiming(0, { duration: duration / 2, easing: smoothEasing })
          ),
          -1, // infinite
          false
        );

        // Horizontal subtle drift - slower for depth effect
        translateX.value = withRepeat(
          withSequence(
            withTiming(15, { duration: duration, easing: smoothEasing }),
            withTiming(0, { duration: duration, easing: smoothEasing })
          ),
          -1,
          false
        );

        // Gentle pulsing scale - very subtle for performance
        scale.value = withRepeat(
          withSequence(
            withTiming(1.03, { duration: duration * 0.75, easing: smoothEasing }), // Reduced from 1.05 to 1.03
            withTiming(1, { duration: duration * 0.75, easing: smoothEasing })
          ),
          -1,
          false
        );
      }
    }, [reduceAnimation, duration, translateY, translateX, scale]);

    const animatedStyle = useAnimatedStyle(() => {
      // Only apply animations on iOS when enabled
      if (Platform.OS === 'ios' && !reduceAnimation) {
        return {
          transform: [
            { translateY: translateY.value },
            { translateX: translateX.value },
            { scale: scale.value },
          ],
        };
      }
      return {};
    });

    const baseStyle: ViewStyle = {
      position: 'absolute',
      width: size,
      height: size,
      backgroundColor: color,
      borderRadius: size / 2,
      opacity: opacity,
    };

    // Add position props (cast to DimensionValue for TypeScript)
    if (top !== undefined) baseStyle.top = top as DimensionValue;
    if (left !== undefined) baseStyle.left = left as DimensionValue;
    if (right !== undefined) baseStyle.right = right as DimensionValue;
    if (bottom !== undefined) baseStyle.bottom = bottom as DimensionValue;

    return (
      <Animated.View
        style={[
          baseStyle,
          animatedStyle,
        ]}
      />
    );
  };

  // Final bubble configuration - 5 bubbles asymmetric flow
  const bubblePositions = useMemo(() => [
    // Back layer - Largest, most transparent
    { size: 460, color: "#FEE2E2", opacity: 0.21, top: -160, left: -210, duration: 15500, delay: 100 },
    { size: 410, color: "#FECACA", opacity: 0.22, bottom: -135, right: -165, duration: 16500, delay: 750 },

    // Middle layer - Medium size and opacity
    { size: 360, color: "#FCA5A5", opacity: 0.28, top: 120, right: -125, duration: 12200, delay: 420 },
    { size: 320, color: "#FECACA", opacity: 0.30, top: "52%", left: -90, duration: 11200, delay: 1150 },

    // Front layer - Smaller, more opaque
    { size: 220, color: "#F87171", opacity: 0.35, top: "28%", left: "13%", duration: 9200, delay: 1420 },
  ], []);

  // Memoize background bubbles to prevent re-renders
  const backgroundBubbles = useMemo(() => (
    <View style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflow: 'hidden',
    }} pointerEvents="none">
      {bubblePositions.map((bubble, index) => (
        <AnimatedBubble
          key={`bubble-${index}`}
          size={bubble.size}
          color={bubble.color}
          opacity={bubble.opacity}
          top={bubble.top}
          left={bubble.left}
          right={bubble.right}
          bottom={bubble.bottom}
          duration={bubble.duration}
          delay={bubble.delay}
        />
      ))}
    </View>
  ), [reduceAnimation]);

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <StatusBar style="dark" />

      {/* Background Gradient Bubbles - Memoized */}
      {backgroundBubbles}

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <Animated.ScrollView
          style={animatedContentStyle}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingHorizontal: 20,
            paddingVertical: 24,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
          bounces={false}
        >
            <View>
          {/* Logo/Title Section */}
          <View style={{ marginBottom: 40, alignItems: 'center' }}>
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 22,
              marginBottom: 20,
              overflow: 'hidden',
              backgroundColor: '#FFFFFF',
              // Android-optimized shadow
              ...(Platform.OS === 'android' ? {
                elevation: 12,
              } : {
                shadowColor: '#EF4444',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.25,
                shadowRadius: 16,
              }),
            }}>
              <Image
                source={require('../../../../assets/courtster-logo.png')}
                style={{ width: 80, height: 80 }}
                resizeMode="cover"
                accessible={true}
                accessibilityLabel="Courtster logo"
              />
            </View>
            <Text
              style={{
                fontSize: 32,
                fontWeight: '700',
                color: '#111827',
                marginBottom: 8,
                letterSpacing: -0.5,
              }}
              accessibilityRole="header"
            >
              Courtster
            </Text>
            <Text style={{
              fontSize: 15,
              color: '#6B7280',
              textAlign: 'center',
              paddingHorizontal: 24,
              lineHeight: 22,
            }}>
              {isSignup
                ? 'Create your account to get started'
                : 'Welcome back! Sign in to continue'}
            </Text>
          </View>

          {/* Form Card with Glassmorphism */}
          <View style={{
            backgroundColor: Platform.OS === 'android'
              ? 'rgba(255, 255, 255, 0.95)' // More opaque on Android for better performance
              : 'rgba(255, 255, 255, 0.7)',
            borderRadius: 20,
            padding: 20,
            // Android-optimized shadow
            ...(Platform.OS === 'android' ? {
              elevation: 4,
            } : {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 16,
            }),
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: Platform.OS === 'android'
              ? 'rgba(229, 231, 235, 0.8)' // More opaque on Android
              : 'rgba(229, 231, 235, 0.6)',
            overflow: 'hidden',
          }}>
            {/* Name Field (Sign Up Only) */}
            {isSignup && (
              <View style={{ marginBottom: 18 }}>
                <Text style={{
                  fontSize: 13,
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: 8,
                }}>
                  Full Name
                </Text>
                <Controller
                  control={control}
                  name="displayName"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={{
                      borderRadius: 12,
                      borderWidth: 1.5,
                      borderStyle: 'solid',
                      borderColor: errors.displayName ? 'rgba(239, 68, 68, 0.3)' : 'rgba(229, 231, 235, 0.5)',
                      overflow: 'hidden',
                      backgroundColor: 'rgba(255, 255, 255, 0.7)',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.05,
                      shadowRadius: 8,
                      elevation: 2,
                    }}>
                      <BlurView
                        intensity={20}
                        tint="light"
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: 'rgba(249, 250, 251, 0.6)',
                        }}
                      >
                        <UserIcon color={errors.displayName ? '#EF4444' : '#9CA3AF'} size={20} strokeWidth={2} style={{ marginLeft: 14 }} />
                      <TextInput
                        style={{
                          flex: 1,
                          marginLeft: 12,
                          marginRight: 14,
                          fontSize: 15,
                          color: '#111827',
                          paddingVertical: Platform.OS === 'ios' ? 14 : 12,
                          paddingHorizontal: 0,
                          includeFontPadding: false,
                        }}
                        placeholder="John Doe"
                        placeholderTextColor="#9CA3AF"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        autoCapitalize="words"
                        textContentType="name"
                        autoComplete="name"
                        editable={!loading && !googleLoading}
                        underlineColorAndroid="transparent"
                        accessibilityLabel="Full name"
                        accessibilityHint="Enter your full name"
                        returnKeyType="next"
                        blurOnSubmit={false}
                        onSubmitEditing={() => emailInputRef.current?.focus()}
                      />
                      </BlurView>
                    </View>
                  )}
                />
                {errors.displayName && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                    <Text style={{
                      fontSize: 13,
                      color: '#EF4444',
                      marginLeft: 2,
                    }}>
                      {errors.displayName.message}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Email Field */}
            <View style={{ marginBottom: 18 }}>
              <Text style={{
                fontSize: 13,
                fontWeight: '600',
                color: '#374151',
                marginBottom: 8,
              }}>
                Email Address
              </Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={{
                    borderRadius: 12,
                    borderWidth: 1.5,
                    borderStyle: 'solid',
                    borderColor: errors.email ? 'rgba(239, 68, 68, 0.3)' : 'rgba(229, 231, 235, 0.5)',
                    overflow: 'hidden',
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    elevation: 2,
                  }}>
                    <BlurView
                      intensity={20}
                      tint="light"
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: 'rgba(249, 250, 251, 0.6)',
                      }}
                    >
                      <Mail color={errors.email ? '#EF4444' : '#9CA3AF'} size={20} strokeWidth={2} style={{ marginLeft: 14 }} />
                    <TextInput
                      ref={emailInputRef}
                      style={{
                        flex: 1,
                        marginLeft: 12,
                        marginRight: 14,
                        fontSize: 15,
                        color: '#111827',
                        paddingVertical: Platform.OS === 'ios' ? 14 : 12,
                        paddingHorizontal: 0,
                        includeFontPadding: false,
                      }}
                      placeholder="you@example.com"
                      placeholderTextColor="#9CA3AF"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      textContentType="emailAddress"
                      autoComplete="email"
                      editable={!loading && !googleLoading}
                      underlineColorAndroid="transparent"
                      accessibilityLabel="Email address"
                      accessibilityHint="Enter your email address"
                      returnKeyType="next"
                      blurOnSubmit={false}
                      onSubmitEditing={() => passwordInputRef.current?.focus()}
                    />
                    </BlurView>
                  </View>
                )}
              />
              {errors.email && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                  <Text style={{
                    fontSize: 13,
                    color: '#EF4444',
                    marginLeft: 2,
                  }}>
                    {errors.email.message}
                  </Text>
                </View>
              )}
            </View>

            {/* Password Field */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{
                fontSize: 13,
                fontWeight: '600',
                color: '#374151',
                marginBottom: 8,
              }}>
                Password
              </Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={{
                    borderRadius: 12,
                    borderWidth: 1.5,
                    borderStyle: 'solid',
                    borderColor: errors.password ? 'rgba(239, 68, 68, 0.3)' : 'rgba(229, 231, 235, 0.5)',
                    overflow: 'hidden',
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    elevation: 2,
                  }}>
                    <BlurView
                      intensity={20}
                      tint="light"
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: 'rgba(249, 250, 251, 0.6)',
                      }}
                    >
                      <Lock color={errors.password ? '#EF4444' : '#9CA3AF'} size={20} strokeWidth={2} style={{ marginLeft: 14 }} />
                    <TextInput
                      ref={passwordInputRef}
                      style={{
                        flex: 1,
                        marginLeft: 12,
                        marginRight: 14,
                        fontSize: 15,
                        color: '#111827',
                        paddingVertical: Platform.OS === 'ios' ? 14 : 12,
                        paddingHorizontal: 0,
                        includeFontPadding: false,
                      }}
                      placeholder="Enter your password"
                      placeholderTextColor="#9CA3AF"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      secureTextEntry
                      textContentType={isSignup ? "newPassword" : "password"}
                      autoComplete={isSignup ? "password-new" : "password"}
                      editable={!loading && !googleLoading}
                      underlineColorAndroid="transparent"
                      accessibilityLabel="Password"
                      accessibilityHint={isSignup ? "Enter a secure password" : "Enter your password"}
                      returnKeyType="done"
                      blurOnSubmit={true}
                      onSubmitEditing={handleKeyboardSubmit}
                    />
                    </BlurView>
                  </View>
                )}
              />
              {errors.password && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                  <Text style={{
                    fontSize: 13,
                    color: '#EF4444',
                    marginLeft: 2,
                  }}>
                    {errors.password.message}
                  </Text>
                </View>
              )}
            </View>

            {/* Forgot Password Link (Login only) */}
            {!isSignup && (
              <TouchableOpacity
                onPress={() => setShowPasswordReset(true)}
                style={{ alignSelf: 'flex-end', marginBottom: 16, paddingVertical: 4 }}
                activeOpacity={0.7}
              >
                <Text style={{ color: '#EF4444', fontSize: 14, fontWeight: '600' }}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            )}

            {/* Sign In/Up Button */}
            <TouchableOpacity
              style={{
                backgroundColor: '#EF4444',
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 14,
                minHeight: 48, // Better touch target
                overflow: 'hidden',
                // Android-optimized shadow
                ...(Platform.OS === 'android' ? {
                  elevation: 3,
                } : {
                  shadowColor: '#EF4444',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                }),
              }}
              onPress={handleSubmit(onSubmit)}
              disabled={loading || googleLoading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={{
                  color: '#FFFFFF',
                  fontSize: 16,
                  fontWeight: '700',
                }}>
                  {isSignup ? 'Create Account' : 'Sign In'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginVertical: 18,
            }}>
              <View style={{ flex: 1, height: 1, backgroundColor: '#D1D5DB' }} />
              <Text style={{
                color: '#9CA3AF',
                paddingHorizontal: 14,
                fontSize: 13,
                fontWeight: '600',
              }}>
                OR
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: '#D1D5DB' }} />
            </View>

            {/* Google Sign In Button - Pill Type (Google Branding Guidelines) */}
            <TouchableOpacity
              style={{
                backgroundColor: '#FFFFFF', // Light theme fill
                borderRadius: 20, // Pill shape - fully rounded
                borderWidth: 1,
                borderStyle: 'solid',
                borderColor: '#747775', // Light theme stroke
                paddingLeft: Platform.OS === 'ios' ? 16 : 12, // iOS: 16px, Android/Web: 12px
                paddingRight: Platform.OS === 'ios' ? 16 : 12, // iOS: 16px, Android/Web: 12px
                paddingVertical: 10,
                flexDirection: 'row',
                alignItems: 'center',
                alignSelf: 'center', // Center button in container while maintaining natural width
                minHeight: 40,
                overflow: 'hidden',
                // Android-optimized shadow
                ...(Platform.OS === 'android' ? {
                  elevation: 2,
                } : {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                }),
              }}
              onPress={handleGoogleSignIn}
              disabled={loading || googleLoading}
              activeOpacity={0.9}
            >
              {googleLoading ? (
                <ActivityIndicator color="#1A73E8" size="small" />
              ) : (
                <>
                  {/* Google "G" Logo SVG - 18x18px */}
                  <View style={{
                    width: 18,
                    height: 18,
                    marginRight: Platform.OS === 'ios' ? 12 : 10, // iOS: 12px, Android/Web: 10px spacing after logo
                  }}>
                    <Svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <Path d="M17.64 9.20454C17.64 8.56636 17.5827 7.95272 17.4764 7.36363H9V10.845H13.8436C13.635 11.97 13.0009 12.9231 12.0477 13.5613V15.8195H14.9564C16.6582 14.2527 17.64 11.9454 17.64 9.20454Z" fill="#4285F4"/>
                      <Path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5613C11.2418 14.1013 10.2109 14.4204 9 14.4204C6.65591 14.4204 4.67182 12.8372 3.96409 10.71H0.957275V13.0418C2.43818 15.9831 5.48182 18 9 18Z" fill="#34A853"/>
                      <Path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957275C0.347727 6.17318 0 7.54772 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC04"/>
                      <Path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335"/>
                    </Svg>
                  </View>
                  <Text style={{
                    color: '#1F1F1F', // Light theme font color
                    fontSize: 14, // Google spec: 14px
                    lineHeight: 20, // Google spec: 20px line height
                    fontWeight: '500', // Roboto Medium
                    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto', // Use system font on iOS, Roboto on Android
                  }}>
                    Sign in with Google
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Toggle Sign In/Up */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 20,
            marginBottom: 8,
          }}>
            <Text style={{ color: '#6B7280', fontSize: 14 }}>
              {isSignup ? 'Already have an account?' : "Don't have an account?"}
            </Text>
            <TouchableOpacity
              onPress={toggleMode}
              disabled={loading || googleLoading}
              style={{ marginLeft: 6, paddingVertical: 4, paddingHorizontal: 4 }}
              activeOpacity={0.7}
            >
              <Text style={{
                color: '#EF4444',
                fontSize: 14,
                fontWeight: '700',
              }}>
                {isSignup ? 'Sign In' : 'Sign Up'}
              </Text>
            </TouchableOpacity>
          </View>
            </View>
        </Animated.ScrollView>
      </TouchableWithoutFeedback>

      {/* Password Reset Modal */}
      <Modal
        visible={showPasswordReset}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPasswordReset(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
        <TouchableWithoutFeedback onPress={() => setShowPasswordReset(false)}>
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 20,
            padding: 24,
            width: '100%',
            maxWidth: 400,
            maxHeight: '80%',
            ...( Platform.OS === 'android' ? {
              elevation: 8,
            } : {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
            }),
          }}>
            {/* Close Button */}
            <TouchableOpacity
              onPress={() => setShowPasswordReset(false)}
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: '#F3F4F6',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
              }}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <XIcon color="#6B7280" size={20} strokeWidth={2.5} />
            </TouchableOpacity>

            {/* Title */}
            <Text style={{
              fontSize: 22,
              fontWeight: '700',
              color: '#111827',
              marginBottom: 8,
            }}>
              Reset Password
            </Text>

            <Text style={{
              fontSize: 14,
              color: '#6B7280',
              marginBottom: 24,
              lineHeight: 20,
            }}>
              Enter your email address and we'll send you instructions to reset your password.
            </Text>

            {/* Email Input */}
            <View style={{
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: 'rgba(229, 231, 235, 0.5)',
              marginBottom: 20,
              overflow: 'hidden',
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}>
              <BlurView
                intensity={20}
                tint="light"
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: 'rgba(249, 250, 251, 0.6)',
                }}
              >
                <Mail color="#9CA3AF" size={20} strokeWidth={2} style={{ marginLeft: 14 }} />
              <TextInput
                style={{
                  flex: 1,
                  marginLeft: 12,
                  marginRight: 14,
                  fontSize: 15,
                  color: '#111827',
                  paddingVertical: 12,
                  paddingHorizontal: 0,
                  includeFontPadding: false,
                }}
                placeholder="your@email.com"
                placeholderTextColor="#9CA3AF"
                value={resetEmail}
                onChangeText={setResetEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoFocus
                underlineColorAndroid="transparent"
                returnKeyType="done"
                onSubmitEditing={() => {
                  Keyboard.dismiss();
                  if (resetEmail) {
                    handlePasswordReset();
                  }
                }}
              />
              </BlurView>
            </View>

            {/* Send Reset Button */}
            <TouchableOpacity
              onPress={handlePasswordReset}
              disabled={resetLoading}
              style={{
                backgroundColor: '#EF4444',
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: 'center',
                marginBottom: 12,
                ...(Platform.OS === 'android' ? {
                  elevation: 2,
                } : {
                  shadowColor: '#EF4444',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                }),
              }}
              activeOpacity={0.8}
            >
              {resetLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={{
                  color: '#FFFFFF',
                  fontSize: 16,
                  fontWeight: '600',
                }}>
                  Send Reset Link
                </Text>
              )}
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
              onPress={() => setShowPasswordReset(false)}
              style={{
                paddingVertical: 10,
                alignItems: 'center',
              }}
              activeOpacity={0.7}
            >
              <Text style={{
                color: '#6B7280',
                fontSize: 14,
                fontWeight: '600',
              }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {/* Device Management Modal */}
      {user && (
        <DeviceManagementModal
          visible={showDeviceModal}
          devices={deviceModalDevices}
          userId={user.id}
          onDeviceRemoved={onDeviceRemoved}
          onCancel={closeDeviceModal}
        />
      )}

      {/* Sign Up Loading Modal */}
      <SignUpLoadingModal
        visible={signUpProgress !== null}
        progress={signUpProgress}
      />
    </View>
  );
}
