import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../config/supabase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Check, Camera, User } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Form validation errors
  const [errors, setErrors] = useState({
    displayName: '',
    username: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name, username, avatar_url, email')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      if (data) {
        // Generate defaults if not set
        const defaultUsername = data.email?.split('@')[0] || `user${Math.floor(Math.random() * 10000)}`;
        const defaultDisplayName = data.email?.split('@')[0] || 'Courtster User';

        setDisplayName(data.display_name || defaultDisplayName);
        setUsername(data.username || defaultUsername);
        setAvatarUrl(data.avatar_url || '');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to load profile',
        text2: 'Please try again',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Toast.show({
          type: 'error',
          text1: 'Permission required',
          text2: 'Please allow access to your photo library',
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadingAvatar(true);
        const image = result.assets[0];

        // Create file name with user ID
        const fileExt = image.uri.split('.').pop() || 'jpg';
        const fileName = `${user?.id}.${fileExt}`;
        const filePath = fileName;

        // Read the file as base64
        const response = await fetch(image.uri);
        const arrayBuffer = await response.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );

        // Convert base64 to Uint8Array for upload
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }

        // Upload to Supabase Storage with upsert to replace existing
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, bytes, {
            contentType: `image/${fileExt}`,
            upsert: true, // Replace existing file
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw uploadError;
        }

        // Get public URL with cache busting
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        // Add timestamp to bust cache
        setAvatarUrl(`${publicUrl}?t=${Date.now()}`);

        Toast.show({
          type: 'success',
          text1: 'Photo uploaded',
          text2: 'Remember to save your changes',
        });
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      Toast.show({
        type: 'error',
        text1: 'Upload failed',
        text2: 'Please try again',
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const validateForm = () => {
    const newErrors = {
      displayName: '',
      username: '',
    };

    let isValid = true;

    // Display name validation
    if (!displayName.trim()) {
      newErrors.displayName = 'Display name is required';
      isValid = false;
    } else if (displayName.length > 50) {
      newErrors.displayName = 'Display name must be less than 50 characters';
      isValid = false;
    }

    // Username validation
    if (!username.trim()) {
      newErrors.username = 'Username is required';
      isValid = false;
    } else if (username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
      isValid = false;
    } else if (username.length > 30) {
      newErrors.username = 'Username must be less than 30 characters';
      isValid = false;
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      // Check if username is taken (if changed)
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .neq('id', user?.id)
        .single();

      if (existingUser) {
        setErrors({ ...errors, username: 'Username is already taken' });
        Toast.show({
          type: 'error',
          text1: 'Username taken',
          text2: 'Please choose a different username',
        });
        return;
      }

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName.trim(),
          username: username.trim().toLowerCase(),
          avatar_url: avatarUrl || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user?.id);

      if (error) throw error;

      // Invalidate profile query to refresh data
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });

      Toast.show({
        type: 'success',
        text1: 'Profile updated',
        text2: 'Your changes have been saved',
      });

      router.back();
    } catch (error) {
      console.error('Error updating profile:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to update profile',
        text2: 'Please try again',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#EF4444" />
        <Text style={{ marginTop: 16, fontSize: 14, color: '#6B7280' }}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#F9FAFB' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          paddingTop: insets.top,
          backgroundColor: '#FFFFFF',
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: '#F3F4F6',
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: '#F3F4F6',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X color="#374151" size={20} />
          </TouchableOpacity>

          <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>
            Edit Profile
          </Text>

          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: saving ? '#FCA5A5' : '#EF4444',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Check color="#FFFFFF" size={20} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1, paddingTop: insets.top + 64 }}
        contentContainerStyle={{
          paddingBottom: Platform.OS === 'ios' ? 100 : insets.bottom + 120,
          paddingHorizontal: 16,
          paddingTop: 16,
        }}
      >
        {/* Profile Photo */}
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <View style={{ position: 'relative' }}>
            <View
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                backgroundColor: avatarUrl ? '#E5E7EB' : '#F43F5E',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              {uploadingAvatar ? (
                <ActivityIndicator size="large" color="#fff" />
              ) : avatarUrl ? (
                <Image
                  source={{ uri: avatarUrl }}
                  style={{ width: 120, height: 120 }}
                  resizeMode="cover"
                />
              ) : (
                <User color="#fff" size={60} />
              )}
            </View>
            <TouchableOpacity
              onPress={handleAvatarUpload}
              disabled={uploadingAvatar}
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 40,
                height: 40,
                backgroundColor: '#EF4444',
                borderRadius: 20,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 3,
                borderColor: '#FFFFFF',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 4,
                opacity: uploadingAvatar ? 0.5 : 1,
              }}
            >
              <Camera color="#FFFFFF" size={20} />
            </TouchableOpacity>
          </View>
          <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 12, textAlign: 'center' }}>
            Tap the camera icon to upload a photo
          </Text>
        </View>

        {/* Display Name */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
            Display Name
          </Text>
          <TextInput
            value={displayName}
            onChangeText={(text) => {
              setDisplayName(text);
              setErrors({ ...errors, displayName: '' });
            }}
            placeholder="Enter your display name"
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              paddingHorizontal: 16,
              paddingVertical: 12,
              fontSize: 16,
              color: '#111827',
              borderWidth: errors.displayName ? 1 : 0,
              borderColor: errors.displayName ? '#EF4444' : 'transparent',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}
            maxLength={50}
          />
          {errors.displayName ? (
            <Text style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>
              {errors.displayName}
            </Text>
          ) : null}
          <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>
            This is how your name will appear to other users
          </Text>
        </View>

        {/* Username */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
            Username
          </Text>
          <View style={{ position: 'relative' }}>
            <Text
              style={{
                position: 'absolute',
                left: 16,
                top: 12,
                fontSize: 16,
                color: '#9CA3AF',
                zIndex: 1,
              }}
            >
              @
            </Text>
            <TextInput
              value={username}
              onChangeText={(text) => {
                setUsername(text.toLowerCase());
                setErrors({ ...errors, username: '' });
              }}
              placeholder="username"
              autoCapitalize="none"
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                paddingLeft: 32,
                paddingRight: 16,
                paddingVertical: 12,
                fontSize: 16,
                color: '#111827',
                borderWidth: errors.username ? 1 : 0,
                borderColor: errors.username ? '#EF4444' : 'transparent',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
              }}
              maxLength={30}
            />
          </View>
          {errors.username ? (
            <Text style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>
              {errors.username}
            </Text>
          ) : null}
          <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>
            3-30 characters, letters, numbers, and underscores only
          </Text>
        </View>

        {/* Info Box */}
        <View
          style={{
            backgroundColor: '#DBEAFE',
            borderRadius: 16,
            padding: 16,
            marginTop: 8,
          }}
        >
          <Text style={{ fontSize: 14, color: '#1E40AF', fontWeight: '600', marginBottom: 4 }}>
            Profile Tips
          </Text>
          <Text style={{ fontSize: 13, color: '#1E40AF', lineHeight: 20 }}>
            • Choose a unique username that represents you{'\n'}
            • Keep your display name professional{'\n'}
            • Upload a photo to personalize your profile
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
