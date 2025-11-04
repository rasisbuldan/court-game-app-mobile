// Mock Expo Winter
global.__ExpoImportMetaRegistry = {
  get: jest.fn(),
  set: jest.fn(),
};
global.structuredClone = jest.fn((val) => JSON.parse(JSON.stringify(val)));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

// Mock Supabase
jest.mock('./config/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
      signInWithOAuth: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(() => Promise.resolve({ data: null, error: null })),
    })),
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnValue({
        unsubscribe: jest.fn(),
      }),
      unsubscribe: jest.fn(),
    })),
  },
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  })),
  useLocalSearchParams: jest.fn(() => ({})),
  Link: ({ children }) => children,
  Stack: {
    Screen: ({ children }) => children,
  },
  Tabs: {
    Screen: ({ children }) => children,
  },
}));

// Mock expo modules
jest.mock('expo-status-bar', () => ({
  StatusBar: 'StatusBar',
}));

jest.mock('expo-blur', () => ({
  BlurView: jest.fn(({ children }) => children),
}));

jest.mock('lucide-react-native', () => {
  const mockIconFactory = () => jest.fn(() => null);
  return {
    Mail: mockIconFactory(),
    Lock: mockIconFactory(),
    User: mockIconFactory(),
    X: mockIconFactory(),
    Trophy: mockIconFactory(),
    Medal: mockIconFactory(),
    Award: mockIconFactory(),
    MoreVertical: mockIconFactory(),
    Eye: mockIconFactory(),
    EyeOff: mockIconFactory(),
  };
});

jest.mock('expo-linking', () => ({
  createURL: jest.fn(),
  parse: jest.fn(),
}));

jest.mock('expo-web-browser', () => ({
  openAuthSessionAsync: jest.fn(),
  maybeCompleteAuthSession: jest.fn(),
}));

jest.mock('expo-auth-session', () => ({
  makeRedirectUri: jest.fn(() => 'courtster://auth/callback'),
}));

// Mock React Native modules
jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
  hide: jest.fn(),
}));

// Mock React Native Keyboard - Components that use Keyboard should add jest.spyOn in their test files
// Example: jest.spyOn(RN.Keyboard, 'dismiss').mockImplementation(() => {});

// Mock React Native Reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');

  // Enhance mock with additional functions
  Reanimated.default.call = () => {};

  // Mock useAnimatedKeyboard
  Reanimated.useAnimatedKeyboard = jest.fn(() => ({
    height: { value: 0 },
    state: { value: 0 },
  }));

  // Mock useSharedValue
  Reanimated.useSharedValue = jest.fn((initial) => ({
    value: initial,
  }));

  // Mock useAnimatedStyle - returns the style object directly
  Reanimated.useAnimatedStyle = jest.fn((cb) => {
    return cb();
  });

  // Mock withTiming and withSpring
  Reanimated.withTiming = jest.fn((value) => value);
  Reanimated.withSpring = jest.fn((value) => value);
  Reanimated.withDecay = jest.fn((value) => value);
  Reanimated.withDelay = jest.fn((delay, value) => value);
  Reanimated.withSequence = jest.fn((...values) => values[values.length - 1]);
  Reanimated.withRepeat = jest.fn((value) => value);

  // Mock runOnJS
  Reanimated.runOnJS = jest.fn((fn) => fn);

  return Reanimated;
});

// Set up Reanimated tests
require('react-native-reanimated').setUpTests();

// Mock NativeWind
jest.mock('nativewind', () => ({
  styled: (component) => component,
}));

// Mock Sentry
jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  addBreadcrumb: jest.fn(),
  setUser: jest.fn(),
  setContext: jest.fn(),
  wrap: (component) => component,
  ErrorBoundary: ({ children }) => children,
}));

// Mock React Native Purchases
jest.mock('react-native-purchases', () => ({
  configure: jest.fn(),
  getCustomerInfo: jest.fn(),
  getOfferings: jest.fn(),
  purchasePackage: jest.fn(),
  restorePurchases: jest.fn(),
  logOut: jest.fn(),
  PURCHASES_ERROR_CODE: {},
}));
