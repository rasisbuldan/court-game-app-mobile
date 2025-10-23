# 🚀 Emulator Quick Start Guide

Get up and running with iOS Simulator and Android Emulator in minutes.

---

## TL;DR - Super Quick Setup

### iOS (5 minutes)
```bash
cd packages/mobile
./scripts/setup-ios.sh
yarn ios
```

### Android (15-30 minutes)
1. Download Android Studio: https://developer.android.com/studio
2. Run installation wizard (select all defaults)
3. Run setup script:
   ```bash
   cd packages/mobile
   ./scripts/setup-android.sh
   source ~/.zshrc  # Reload shell
   ```
4. Open Android Studio → Tools → Device Manager → Create Device (Pixel 8 Pro, API 35)
5. Run: `yarn android`

---

## Current Status

Run this to check your setup:

```bash
# iOS
xcodebuild -version                # Check Xcode
xcrun simctl list devices         # List simulators

# Android
echo $ANDROID_HOME                 # Should show path
adb --version                      # Check Android tools
emulator -list-avds                # List emulators
```

---

## Option 1: Automated Setup (Recommended)

### iOS Setup Script
```bash
cd packages/mobile
./scripts/setup-ios.sh
```

**What it does:**
- ✅ Checks Xcode installation
- ✅ Accepts licenses
- ✅ Configures command line tools
- ✅ Installs CocoaPods
- ✅ Lists available simulators
- ✅ Tests simulator launch

### Android Setup Script
```bash
cd packages/mobile
./scripts/setup-android.sh
```

**What it does:**
- ✅ Checks Android Studio installation
- ✅ Configures ANDROID_HOME
- ✅ Verifies SDK tools (adb, emulator)
- ✅ Lists installed platforms
- ✅ Accepts licenses
- ✅ Shows what's missing

---

## Option 2: Manual Setup

### iOS Manual Setup (10 minutes)

1. **Install Xcode** (if not already)
   - Open App Store
   - Search "Xcode"
   - Click Install (~13 GB)

2. **Accept License**
   ```bash
   sudo xcodebuild -license accept
   ```

3. **Configure Command Line Tools**
   ```bash
   sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
   ```

4. **Install Simulators**
   ```bash
   open -a Xcode
   # Xcode → Settings → Platforms → Download iOS 18.0
   ```

5. **Install CocoaPods**
   ```bash
   sudo gem install cocoapods
   ```

6. **Test**
   ```bash
   yarn ios
   ```

### Android Manual Setup (30 minutes)

1. **Download Android Studio**
   - Visit: https://developer.android.com/studio
   - Download for macOS
   - Drag to Applications folder

2. **Run Installation Wizard**
   - Open Android Studio
   - Select "Custom" installation
   - Check all components
   - Click through (downloads ~3-8 GB)

3. **Install SDK Platforms**
   - Tools → SDK Manager → SDK Platforms
   - ✅ Android 15.0 (API 35)
   - ✅ Android 14.0 (API 34)
   - ✅ Android 13.0 (API 33)
   - Click Apply

4. **Install SDK Tools**
   - Tools → SDK Manager → SDK Tools
   - ✅ Android SDK Build-Tools 35
   - ✅ Android SDK Command-line Tools
   - ✅ Android SDK Platform-Tools
   - ✅ Android Emulator
   - ✅ Google Play services
   - Click Apply

5. **Configure Environment**
   ```bash
   # Add to ~/.zshrc or ~/.bash_profile
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/platform-tools

   # Reload
   source ~/.zshrc
   ```

6. **Create Virtual Device**
   - Tools → Device Manager → + Create Device
   - Select: Pixel 8 Pro
   - Download: API 35, arm64-v8a (for M1/M2/M3 Macs)
   - Click Finish

7. **Test**
   ```bash
   yarn android
   ```

---

## Testing Your Setup

### Start Both Emulators

```bash
# Terminal 1: Start Expo
cd packages/mobile
yarn start

# Press 'i' for iOS
# Press 'a' for Android
```

### Or Use Individual Commands

```bash
# iOS only
yarn ios

# Android only
yarn android
```

### Or Use VS Code

1. Press `Cmd+Shift+M` (starts Expo)
2. Press `F5`
3. Select "Expo: Debug iOS" or "Expo: Debug Android"

---

## Verification Checklist

### iOS ✓
- [ ] Xcode installed (`/Applications/Xcode.app` exists)
- [ ] License accepted (no errors when running `xcodebuild -version`)
- [ ] Simulators available (`xcrun simctl list devices` shows iPhone)
- [ ] CocoaPods installed (`pod --version` works)
- [ ] App launches in simulator (`yarn ios` works)

### Android ✓
- [ ] Android Studio installed (`/Applications/Android Studio.app` exists)
- [ ] ANDROID_HOME set (`echo $ANDROID_HOME` shows path)
- [ ] adb works (`adb --version` shows version)
- [ ] Emulator works (`emulator -list-avds` shows devices)
- [ ] AVD created (at least one device listed)
- [ ] App launches in emulator (`yarn android` works)

---

## Common Issues & Fixes

### iOS

**"xcrun: error: unable to find utility simctl"**
```bash
sudo xcode-select --reset
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
```

**"No simulators available"**
```bash
open -a Xcode
# Xcode → Settings → Platforms → Download iOS Simulator
```

**"CocoaPods not installed"**
```bash
sudo gem install cocoapods
```

### Android

**"ANDROID_HOME not set"**
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
source ~/.zshrc
```

**"adb: command not found"**
```bash
export PATH=$PATH:$ANDROID_HOME/platform-tools
source ~/.zshrc
```

**"No devices found"**
```bash
# Create AVD via Android Studio
# Tools → Device Manager → + Create Device
```

**Emulator slow on Apple Silicon Mac**
```bash
# Use ARM64 system images, not x86_64
# In Device Manager → Edit AVD → Change System Image to arm64-v8a
```

---

## Performance Tips

### iOS Simulator
- Use smaller devices (iPhone SE is faster than Pro Max)
- Reduce graphics: Simulator → Debug → Graphics Quality → Low
- Close other apps to free RAM

### Android Emulator
- Use ARM64 images on Apple Silicon Macs (MUCH faster)
- Increase RAM: Device Manager → Edit AVD → RAM: 4096 MB
- Enable Quick Boot: Device Manager → Edit AVD → Boot option: Quick boot
- GPU acceleration: `emulator -avd NAME -gpu host`

---

## System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **macOS** | 10.14+ | 13.0+ |
| **RAM** | 8 GB | 16 GB |
| **Disk** | 25 GB free | 40 GB free |
| **Xcode** | 14.0+ | 15.0+ |
| **Android Studio** | Latest stable | Latest stable |
| **Java** | JDK 11 | JDK 17 ✅ |

---

## Next Steps After Setup

1. **Read the full guide**: `MOBILE_EMULATOR_SETUP.md`

2. **Test your app**:
   ```bash
   yarn start
   # Press 'i' for iOS, 'a' for Android
   ```

3. **Enable debugging**: Press `F5` in VS Code

4. **Learn keyboard shortcuts**: See `VSCODE_SHORTCUTS_GUIDE.md`

5. **Explore Expo docs**:
   - iOS: https://docs.expo.dev/workflow/ios-simulator/
   - Android: https://docs.expo.dev/workflow/android-studio-emulator/

---

## Quick Commands Reference

```bash
# Setup
./scripts/setup-ios.sh           # iOS automated setup
./scripts/setup-android.sh        # Android automated setup

# Run app
yarn start                        # Start Expo dev server
yarn ios                          # Run on iOS simulator
yarn android                      # Run on Android emulator

# Simulators
xcrun simctl list devices        # List iOS simulators
emulator -list-avds              # List Android AVDs
xcrun simctl boot "iPhone 15"    # Start iOS simulator
emulator -avd Pixel_8_Pro_API_35 # Start Android emulator

# Debugging
adb devices                       # List connected devices
adb logcat                        # View Android logs
xcrun simctl shutdown all         # Stop all iOS simulators

# Clean
rm -rf .expo node_modules/.cache  # Clear Expo cache
yarn start --clear                # Start with cleared cache
```

---

## Help & Resources

- **Full Setup Guide**: `MOBILE_EMULATOR_SETUP.md`
- **VS Code Guide**: `VSCODE_SHORTCUTS_GUIDE.md`
- **Troubleshooting**: See full guide for detailed solutions
- **Expo Docs**: https://docs.expo.dev/
- **React Native Docs**: https://reactnative.dev/

---

**Need help?** Run the setup scripts - they'll tell you exactly what's missing!

```bash
cd packages/mobile
./scripts/setup-ios.sh      # Check iOS setup
./scripts/setup-android.sh  # Check Android setup
```
