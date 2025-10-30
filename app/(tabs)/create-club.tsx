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
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useCreateClub, useOwnedClubs } from '../../hooks/useClubs';
import { supabase } from '../../config/supabase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Check, Camera, Users } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';

export default function CreateClubScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Form validation errors
  const [errors, setErrors] = useState({
    name: '',
    bio: '',
  });

  const createClubMutation = useCreateClub();
  const { data: ownedClubs } = useOwnedClubs(user?.id, {
    enabled: !createClubMutation.isPending && !createClubMutation.isSuccess
  });

  const handleLogoUpload = async () => {
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
        setUploadingLogo(true);
        const image = result.assets[0];

        // Create unique file name
        const fileExt = image.uri.split('.').pop() || 'jpg';
        const fileName = `${user?.id}_${Date.now()}.${fileExt}`;
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

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('club-logos')
          .upload(filePath, bytes, {
            contentType: `image/${fileExt}`,
            upsert: false,
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw uploadError;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('club-logos')
          .getPublicUrl(filePath);

        setLogoUrl(publicUrl);

        Toast.show({
          type: 'success',
          text1: 'Logo uploaded',
          text2: 'Your club logo is ready',
        });
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      Toast.show({
        type: 'error',
        text1: 'Upload failed',
        text2: 'Please try again',
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const validateForm = () => {
    const newErrors = {
      name: '',
      bio: '',
    };

    let isValid = true;

    // Check 3-club limit
    if (ownedClubs && ownedClubs.length >= 3) {
      Toast.show({
        type: 'error',
        text1: 'Club limit reached',
        text2: 'You can only create up to 3 clubs',
      });
      return false;
    }

    // Name validation
    if (!name.trim()) {
      newErrors.name = 'Club name is required';
      isValid = false;
    } else if (name.length < 3) {
      newErrors.name = 'Club name must be at least 3 characters';
      isValid = false;
    } else if (name.length > 50) {
      newErrors.name = 'Club name must be less than 50 characters';
      isValid = false;
    } else if (!/^[a-zA-Z0-9\s\-_]+$/.test(name)) {
      newErrors.name = 'Club name can only contain letters, numbers, spaces, hyphens, and underscores';
      isValid = false;
    }

    // Bio validation (optional but has limits)
    if (bio && bio.length > 200) {
      newErrors.bio = 'Bio must be less than 200 characters';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleCreate = async () => {
    console.log('[CreateClub] handleCreate called');

    if (!validateForm()) {
      console.log('[CreateClub] Form validation failed');
      return;
    }

    if (!user?.id) {
      console.log('[CreateClub] No user ID found');
      Toast.show({
        type: 'error',
        text1: 'Authentication required',
        text2: 'Please sign in to create a club',
      });
      return;
    }

    console.log('[CreateClub] Starting mutation with data:', {
      name: name.trim(),
      bio: bio.trim() || undefined,
      logo_url: logoUrl || undefined,
      owner_id: user.id,
    });

    createClubMutation.mutate(
      {
        name: name.trim(),
        bio: bio.trim() || undefined,
        logo_url: logoUrl || undefined,
        owner_id: user.id,
      },
      {
        onSuccess: (data) => {
          console.log('[CreateClub] Mutation onSuccess called with data:', data);
          // Use replace to avoid navigation stack issues
          router.replace('/(tabs)/profile');
          console.log('[CreateClub] Navigation to profile triggered');
        },
        onError: (error) => {
          console.error('[CreateClub] Mutation onError called:', error);
        },
      }
    );
  };

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
            Create Club
          </Text>

          <TouchableOpacity
            onPress={handleCreate}
            disabled={createClubMutation.isPending}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: createClubMutation.isPending ? '#FCA5A5' : '#EF4444',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {createClubMutation.isPending ? (
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
        {/* Club Logo */}
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
                backgroundColor: logoUrl ? '#E5E7EB' : '#F43F5E',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              {uploadingLogo ? (
                <ActivityIndicator size="large" color="#fff" />
              ) : logoUrl ? (
                <Image
                  source={{ uri: logoUrl }}
                  style={{ width: 120, height: 120 }}
                  resizeMode="cover"
                />
              ) : (
                <Users color="#fff" size={60} />
              )}
            </View>
            <TouchableOpacity
              onPress={handleLogoUpload}
              disabled={uploadingLogo}
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
                opacity: uploadingLogo ? 0.5 : 1,
              }}
            >
              <Camera color="#FFFFFF" size={20} />
            </TouchableOpacity>
          </View>
          <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 12, textAlign: 'center' }}>
            Upload a club logo (optional)
          </Text>
        </View>

        {/* Club Limit Warning */}
        {ownedClubs && ownedClubs.length >= 2 && (
          <View
            style={{
              backgroundColor: '#FEF3C7',
              borderRadius: 16,
              padding: 16,
              marginBottom: 24,
              borderLeftWidth: 4,
              borderLeftColor: '#F59E0B',
            }}
          >
            <Text style={{ fontSize: 14, color: '#92400E', fontWeight: '600', marginBottom: 4 }}>
              {ownedClubs.length === 2 ? 'One club left!' : 'Club limit reached'}
            </Text>
            <Text style={{ fontSize: 13, color: '#92400E', lineHeight: 18 }}>
              {ownedClubs.length === 2
                ? 'You can create 1 more club (3 clubs maximum).'
                : 'You have reached the maximum of 3 clubs.'}
            </Text>
          </View>
        )}

        {/* Club Name */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
            Club Name *
          </Text>
          <TextInput
            value={name}
            onChangeText={(text) => {
              setName(text);
              setErrors({ ...errors, name: '' });
            }}
            placeholder="Enter club name"
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              paddingHorizontal: 16,
              paddingVertical: 12,
              fontSize: 16,
              color: '#111827',
              borderWidth: errors.name ? 1 : 0,
              borderColor: errors.name ? '#EF4444' : 'transparent',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}
            maxLength={50}
          />
          {errors.name ? (
            <Text style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>
              {errors.name}
            </Text>
          ) : null}
          <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>
            3-50 characters. Letters, numbers, spaces, hyphens, and underscores only.
          </Text>
        </View>

        {/* Bio */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
            Bio (Optional)
          </Text>
          <TextInput
            value={bio}
            onChangeText={(text) => {
              setBio(text);
              setErrors({ ...errors, bio: '' });
            }}
            placeholder="A brief description of your club"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              paddingHorizontal: 16,
              paddingVertical: 12,
              fontSize: 16,
              color: '#111827',
              borderWidth: errors.bio ? 1 : 0,
              borderColor: errors.bio ? '#EF4444' : 'transparent',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
              minHeight: 100,
            }}
            maxLength={200}
          />
          {errors.bio ? (
            <Text style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>
              {errors.bio}
            </Text>
          ) : null}
          <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>
            {bio.length}/200 characters
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
            About Clubs
          </Text>
          <Text style={{ fontSize: 13, color: '#1E40AF', lineHeight: 20 }}>
            • You can create up to 3 clubs{'\n'}
            • Invite members to join your club{'\n'}
            • Create game sessions for your club{'\n'}
            • Club names must be unique
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
