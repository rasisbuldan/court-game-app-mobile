import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../hooks/useAuth';
import { useAnimationPreference } from '../../hooks/useAnimationPreference';

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
  const { signIn, signUp } = useAuth();
  const { reduceAnimation } = useAnimationPreference();

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SignupForm>({
    resolver: zodResolver(isSignup ? signupSchema : loginSchema),
    defaultValues: {
      email: '',
      password: '',
      displayName: '',
    },
  });

  const onSubmit = async (data: SignupForm) => {
    try {
      setLoading(true);
      if (isSignup) {
        await signUp(data.email, data.password, data.displayName);
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
      style={{ backgroundColor: reduceAnimation ? '#FFFFFF' : '#F9FAFB' }}
    >
      <StatusBar style="dark" />
      <ScrollView
        contentContainerClassName="flex-grow justify-center p-6"
        keyboardShouldPersistTaps="handled"
      >
        <View className="mb-12">
          <Text className="text-4xl font-bold text-gray-900 mb-2">Courtster</Text>
          <Text className="text-lg text-gray-600">
            {isSignup
              ? 'Create your account to get started'
              : 'Welcome back! Sign in to continue'}
          </Text>
        </View>

        <View className="space-y-4">
          {isSignup && (
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Name</Text>
              <Controller
                control={control}
                name="displayName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base"
                    placeholder="Your name"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    autoCapitalize="words"
                    editable={!loading}
                  />
                )}
              />
              {errors.displayName && (
                <Text className="text-red-500 text-sm mt-1">
                  {errors.displayName.message}
                </Text>
              )}
            </View>
          )}

          <View>
            <Text className="text-sm font-medium text-gray-700 mb-2">Email</Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base"
                  placeholder="your@email.com"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!loading}
                />
              )}
            />
            {errors.email && (
              <Text className="text-red-500 text-sm mt-1">{errors.email.message}</Text>
            )}
          </View>

          <View>
            <Text className="text-sm font-medium text-gray-700 mb-2">Password</Text>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base"
                  placeholder="••••••••"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  secureTextEntry
                  editable={!loading}
                />
              )}
            />
            {errors.password && (
              <Text className="text-red-500 text-sm mt-1">{errors.password.message}</Text>
            )}
          </View>

          <TouchableOpacity
            className="bg-primary-500 rounded-lg px-6 py-4 items-center mt-4"
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-base font-semibold">
                {isSignup ? 'Create Account' : 'Sign In'}
              </Text>
            )}
          </TouchableOpacity>

          <View className="flex-row items-center justify-center mt-6">
            <Text className="text-gray-600">
              {isSignup ? 'Already have an account?' : "Don't have an account?"}
            </Text>
            <TouchableOpacity onPress={toggleMode} disabled={loading}>
              <Text className="text-primary-500 font-semibold ml-2">
                {isSignup ? 'Sign In' : 'Sign Up'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
