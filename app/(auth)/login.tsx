import { useState, useMemo } from 'react';
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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';
import { Mail, Lock, User as UserIcon, X as XIcon } from 'lucide-react-native';
import { DeviceManagementModal } from '../../components/auth/DeviceManagementModal';
import { supabase } from '../../config/supabase';
import Toast from 'react-native-toast-message';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = loginSchema.extend({
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
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
  const { signIn, signUp, signInWithGoogle, showDeviceModal, deviceModalDevices, onDeviceRemoved, closeDeviceModal, user } = useAuth();
  const { reduceAnimation } = useTheme();

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
    if (!resetEmail || !resetEmail.includes('@')) {
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
      {/* Top left - Rose/Red */}
      <View style={{
        position: 'absolute',
        width: 400,
        height: 400,
        top: -120,
        left: -140,
        backgroundColor: '#FEE2E2',
        borderRadius: 200,
        opacity: 0.4,
      }} />
      {/* Top right - Maroon */}
      <View style={{
        position: 'absolute',
        width: 350,
        height: 350,
        top: 80,
        right: -120,
        backgroundColor: '#FCA5A5',
        borderRadius: 175,
        opacity: 0.3,
      }} />
      {/* Middle - Light Red */}
      <View style={{
        position: 'absolute',
        width: 320,
        height: 320,
        top: '40%',
        left: '50%',
        marginLeft: -160,
        backgroundColor: '#FECACA',
        borderRadius: 160,
        opacity: 0.25,
      }} />
      {/* Bottom - Soft Pink */}
      <View style={{
        position: 'absolute',
        width: 380,
        height: 380,
        bottom: -140,
        right: -100,
        backgroundColor: '#FEE2E2',
        borderRadius: 190,
        opacity: 0.35,
      }} />
    </View>
  ), []);

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <StatusBar style="dark" />

      {/* Background Gradient Bubbles - Memoized */}
      {backgroundBubbles}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingHorizontal: 20,
            paddingVertical: 24,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo/Title Section */}
          <View style={{ marginBottom: 32, alignItems: 'center' }}>
            <View style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              backgroundColor: '#EF4444',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
              overflow: 'hidden',
              // Android-optimized shadow
              ...(Platform.OS === 'android' ? {
                elevation: 8,
              } : {
                shadowColor: '#EF4444',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
              }),
            }}>
              <Text style={{ fontSize: 36, fontWeight: '800', color: '#FFFFFF' }}>C</Text>
            </View>
            <Text style={{
              fontSize: 28,
              fontWeight: '800',
              color: '#111827',
              marginBottom: 6,
            }}>
              Courtster
            </Text>
            <Text style={{
              fontSize: 15,
              color: '#6B7280',
              textAlign: 'center',
              paddingHorizontal: 16,
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
              <View style={{ marginBottom: 16 }}>
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
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#FFFFFF',
                      borderRadius: 14,
                      borderWidth: 1.5,
                      borderStyle: 'solid',
                      borderColor: errors.displayName ? '#EF4444' : '#E5E7EB',
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      overflow: 'hidden',
                    }}>
                      <UserIcon color="#9CA3AF" size={20} strokeWidth={2} />
                      <TextInput
                        style={{
                          flex: 1,
                          marginLeft: 10,
                          fontSize: 15,
                          color: '#111827',
                          padding: 0, // Remove default padding on Android
                          includeFontPadding: false, // Android-specific
                        }}
                        placeholder="Your name"
                        placeholderTextColor="#9CA3AF"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        autoCapitalize="words"
                        editable={!loading && !googleLoading}
                        underlineColorAndroid="transparent" // Remove Android underline
                      />
                    </View>
                  )}
                />
                {errors.displayName && (
                  <Text style={{
                    fontSize: 12,
                    color: '#EF4444',
                    marginTop: 6,
                    marginLeft: 2,
                  }}>
                    {errors.displayName.message}
                  </Text>
                )}
              </View>
            )}

            {/* Email Field */}
            <View style={{ marginBottom: 16 }}>
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
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#FFFFFF',
                    borderRadius: 14,
                    borderWidth: 1.5,
                    borderStyle: 'solid',
                    borderColor: errors.email ? '#EF4444' : '#E5E7EB',
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    overflow: 'hidden',
                  }}>
                    <Mail color="#9CA3AF" size={20} strokeWidth={2} />
                    <TextInput
                      style={{
                        flex: 1,
                        marginLeft: 10,
                        fontSize: 15,
                        color: '#111827',
                        padding: 0,
                        includeFontPadding: false,
                      }}
                      placeholder="your@email.com"
                      placeholderTextColor="#9CA3AF"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      editable={!loading && !googleLoading}
                      underlineColorAndroid="transparent"
                    />
                  </View>
                )}
              />
              {errors.email && (
                <Text style={{
                  fontSize: 12,
                  color: '#EF4444',
                  marginTop: 6,
                  marginLeft: 2,
                }}>
                  {errors.email.message}
                </Text>
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
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#FFFFFF',
                    borderRadius: 14,
                    borderWidth: 1.5,
                    borderStyle: 'solid',
                    borderColor: errors.password ? '#EF4444' : '#E5E7EB',
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    overflow: 'hidden',
                  }}>
                    <Lock color="#9CA3AF" size={20} strokeWidth={2} />
                    <TextInput
                      style={{
                        flex: 1,
                        marginLeft: 10,
                        fontSize: 15,
                        color: '#111827',
                        padding: 0,
                        includeFontPadding: false,
                      }}
                      placeholder="••••••••"
                      placeholderTextColor="#9CA3AF"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      secureTextEntry
                      editable={!loading && !googleLoading}
                      underlineColorAndroid="transparent"
                    />
                  </View>
                )}
              />
              {errors.password && (
                <Text style={{
                  fontSize: 12,
                  color: '#EF4444',
                  marginTop: 6,
                  marginLeft: 2,
                }}>
                  {errors.password.message}
                </Text>
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

            {/* Google Sign In Button */}
            <TouchableOpacity
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 14,
                borderWidth: 1.5,
                borderStyle: 'solid',
                borderColor: '#E5E7EB',
                paddingVertical: 14,
                paddingHorizontal: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 48,
                overflow: 'hidden',
              }}
              onPress={handleGoogleSignIn}
              disabled={loading || googleLoading}
              activeOpacity={0.8}
            >
              {googleLoading ? (
                <ActivityIndicator color="#EF4444" size="small" />
              ) : (
                <>
                  <View style={{
                    width: 20,
                    height: 20,
                    marginRight: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Text style={{ fontSize: 16 }}>🔵</Text>
                  </View>
                  <Text style={{
                    color: '#374151',
                    fontSize: 15,
                    fontWeight: '600',
                  }}>
                    {isSignup ? 'Sign up with Google' : 'Sign in with Google'}
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
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Password Reset Modal */}
      <Modal
        visible={showPasswordReset}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPasswordReset(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 20,
            padding: 24,
            width: '100%',
            maxWidth: 400,
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
                top: 16,
                right: 16,
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: '#F3F4F6',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              activeOpacity={0.7}
            >
              <XIcon color="#6B7280" size={18} strokeWidth={2.5} />
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
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#F9FAFB',
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: '#E5E7EB',
              paddingHorizontal: 14,
              paddingVertical: 12,
              marginBottom: 20,
            }}>
              <Mail color="#9CA3AF" size={20} strokeWidth={2} />
              <TextInput
                style={{
                  flex: 1,
                  marginLeft: 10,
                  fontSize: 15,
                  color: '#111827',
                  padding: 0,
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
              />
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
        </View>
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
    </View>
  );
}
