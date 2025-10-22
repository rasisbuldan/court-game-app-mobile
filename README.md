# Courtster Mobile

Mobile app for Courtster - Padel and Tennis tournament manager built with React Native and Expo.

## 🚀 Tech Stack

- **React Native** 0.81.5
- **Expo SDK** 54
- **React** 19.1.0
- **TypeScript** 5.9.2
- **Expo Router** 6.0.13 (File-based navigation)
- **NativeWind** 4.1 (Tailwind CSS for React Native)
- **Supabase** 2.57.3 (Auth + Database)
- **React Query** 5.70.1 (Data fetching + offline caching)
- **React Native Reanimated** 4.1.1 (Animations)

## 📦 Installation

```bash
# Install dependencies
yarn install

# Start Expo dev server
yarn start

# Run on iOS (macOS only)
yarn ios

# Run on Android
yarn android

# Run on web (for testing)
yarn web
```

## 📱 Features

- ✅ **Authentication** - Email/password login with Supabase
- ✅ **Tournament Management** - Create and manage Mexicano format tournaments
- ✅ **Real-time Sync** - Automatic data synchronization
- ✅ **Offline Support** - React Query persistent cache
- ✅ **Dark/Light Mode** - System preference support
- ✅ **Animations** - Smooth transitions with Reanimated 4
- ✅ **Type Safety** - Full TypeScript coverage

## 🏗️ Project Structure

```
app/
├── (auth)/              # Authentication screens
│   ├── login.tsx
│   └── callback.tsx
├── (tabs)/              # Main app tabs
│   ├── home.tsx
│   └── session/[id].tsx
├── _layout.tsx          # Root layout
└── create-session.tsx   # Create tournament modal

components/
├── session/             # Session-specific components
└── ui/                  # Reusable UI components

hooks/
├── useAuth.tsx          # Authentication hook
├── useOfflineSync.tsx   # Offline sync logic
└── useNetworkStatus.tsx # Network detection

config/
├── supabase.ts          # Supabase client
└── react-query.ts       # React Query setup
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
EXPO_PUBLIC_AUTH_REDIRECT_URL=courtster://auth/callback
```

### iOS Configuration

- **Deployment Target**: iOS 15.2+
- **New Architecture**: Enabled
- **Bundle ID**: `com.courtster.app`

### Android Configuration

- **Target SDK**: 35 (Android 15)
- **Min SDK**: 26 (Android 8.0)
- **Package**: `com.courtster.app`
- **Edge-to-Edge**: Enabled
- **Predictive Back Gesture**: Enabled

## 📚 Shared Package

This app uses `@courtster/shared` for:
- Business logic (Mexicano algorithm)
- TypeScript types
- Utility functions
- Database schema

See main repo: [court-game-app](https://github.com/rasisbuldan/court-game-app)

## 🧪 Building for Production

### iOS Build

```bash
# Configure EAS (first time)
eas build:configure

# Build for iOS
yarn build:ios
```

### Android Build

```bash
# Build for Android
yarn build:android
```

## 📖 Documentation

- **CLAUDE.md** - Development guidelines for AI assistance
- **SESSION_IMPLEMENTATION.md** - Session screen implementation details
- **TESTING.md** - Testing guidelines

## 🤝 Related Repositories

- **Main Monorepo**: [court-game-app](https://github.com/rasisbuldan/court-game-app)
- **Web App**: Included in main monorepo (`packages/web`)
- **Shared Package**: Included in main monorepo (`packages/shared`)

## 📄 License

Part of the Courtster project.

---

**Built with React Native 19 and Expo SDK 54**
