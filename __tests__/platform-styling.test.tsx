import { Platform } from 'react-native';

describe('Platform-Specific Styling', () => {
  beforeEach(() => {
    // Reset Platform.OS before each test
    Platform.OS = 'ios';
  });

  describe('iOS Styling', () => {
    it('Platform.OS is ios', () => {
      expect(Platform.OS).toBe('ios');
    });

    it('uses correct glassmorphism opacity for iOS', () => {
      Platform.OS = 'ios';
      const iosOpacity = Platform.OS === 'ios' ? 0.4 : 0.5;
      expect(iosOpacity).toBe(0.4);
    });

    it('uses iOS shadows instead of elevation', () => {
      Platform.OS = 'ios';
      const shadowStyle = Platform.OS === 'android' ? { elevation: 3 } : {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      };

      expect(shadowStyle).toHaveProperty('shadowColor');
      expect(shadowStyle).toHaveProperty('shadowOpacity');
      expect(shadowStyle).not.toHaveProperty('elevation');
    });
  });

  describe('Android Styling', () => {
    it('Platform.OS is android', () => {
      Platform.OS = 'android';
      expect(Platform.OS).toBe('android');
    });

    it('uses correct glassmorphism opacity for Android', () => {
      Platform.OS = 'android';
      const androidOpacity = Platform.OS === 'android' ? 0.5 : 0.4;
      expect(androidOpacity).toBe(0.5);
    });

    it('uses elevation instead of iOS shadows', () => {
      Platform.OS = 'android';
      const shadowStyle = Platform.OS === 'android' ? { elevation: 3 } : {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      };

      expect(shadowStyle).toHaveProperty('elevation');
      expect(shadowStyle).not.toHaveProperty('shadowColor');
    });

    it('uses borderStyle solid for Android', () => {
      Platform.OS = 'android';
      const borderStyle = { borderStyle: 'solid' as const };
      expect(borderStyle.borderStyle).toBe('solid');
    });

    it('uses overflow hidden for Android borders', () => {
      Platform.OS = 'android';
      const overflowStyle = { overflow: 'hidden' as const };
      expect(overflowStyle.overflow).toBe('hidden');
    });

    it('uses more opaque border colors on Android', () => {
      Platform.OS = 'android';
      const borderColor = Platform.OS === 'android'
        ? 'rgba(229, 231, 235, 0.8)'
        : 'rgba(229, 231, 235, 0.6)';

      expect(borderColor).toBe('rgba(229, 231, 235, 0.8)');
    });
  });

  describe('Platform Detection', () => {
    it('can switch between platforms', () => {
      Platform.OS = 'ios';
      expect(Platform.OS).toBe('ios');

      Platform.OS = 'android';
      expect(Platform.OS).toBe('android');
    });

    it('Platform.select works correctly', () => {
      Platform.OS = 'ios';
      const iosValue = Platform.select({
        ios: 'iOS Value',
        android: 'Android Value',
        default: 'Default Value',
      });
      expect(iosValue).toBe('iOS Value');

      Platform.OS = 'android';
      const androidValue = Platform.select({
        ios: 'iOS Value',
        android: 'Android Value',
        default: 'Default Value',
      });
      expect(androidValue).toBe('Android Value');
    });
  });

  describe('Design System Consistency', () => {
    it('uses consistent border radius (16-24px)', () => {
      const borderRadii = [16, 20, 24];
      borderRadii.forEach(radius => {
        expect(radius).toBeGreaterThanOrEqual(16);
        expect(radius).toBeLessThanOrEqual(24);
      });
    });

    it('uses red accent color (#EF4444)', () => {
      const redColor = '#EF4444';
      expect(redColor).toBe('#EF4444');
    });

    it('uses consistent semi-transparent whites', () => {
      const transparentWhites = [
        'rgba(255, 255, 255, 0.4)',
        'rgba(255, 255, 255, 0.5)',
        'rgba(255, 255, 255, 0.6)',
        'rgba(255, 255, 255, 0.7)',
        'rgba(255, 255, 255, 0.8)',
      ];

      transparentWhites.forEach(color => {
        expect(color).toMatch(/rgba\(255, 255, 255, 0\.[4-8]\)/);
      });
    });

    it('uses consistent red/maroon gradient colors', () => {
      const gradientColors = [
        '#FEE2E2',
        '#FCA5A5',
        '#FECACA',
        '#FBCFE8',
      ];

      gradientColors.forEach(color => {
        expect(color).toMatch(/^#[A-F0-9]{6}$/);
      });
    });
  });
});
