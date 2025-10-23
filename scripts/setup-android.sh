#!/bin/bash

# Android Development Setup Script
# Automates Android Studio and Emulator setup for Courtster mobile app

set -e

echo "🤖 Android Development Setup"
echo "============================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Detect OS
OS_TYPE="unknown"
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS_TYPE="macos"
    SDK_ROOT="$HOME/Library/Android/sdk"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS_TYPE="linux"
    SDK_ROOT="$HOME/Android/Sdk"
else
    echo -e "${RED}❌ Unsupported OS: $OSTYPE${NC}"
    exit 1
fi

# Check if Android Studio is installed
echo -e "${BLUE}🔍 Checking Android Studio installation...${NC}"
if [[ "$OS_TYPE" == "macos" ]]; then
    if [ ! -d "/Applications/Android Studio.app" ]; then
        echo -e "${RED}❌ Android Studio not found${NC}"
        echo ""
        echo "Please download and install Android Studio:"
        echo "https://developer.android.com/studio"
        echo ""
        echo "After installation, run this script again."
        exit 1
    fi
    echo -e "${GREEN}✅ Android Studio found${NC}"
fi

# Check ANDROID_HOME
echo ""
echo -e "${BLUE}🏠 Checking ANDROID_HOME...${NC}"
if [ -z "$ANDROID_HOME" ]; then
    echo -e "${YELLOW}⚠️  ANDROID_HOME not set${NC}"
    echo ""
    echo "Adding to shell profile..."

    # Determine shell profile file
    SHELL_PROFILE=""
    if [ -f "$HOME/.zshrc" ]; then
        SHELL_PROFILE="$HOME/.zshrc"
    elif [ -f "$HOME/.bash_profile" ]; then
        SHELL_PROFILE="$HOME/.bash_profile"
    elif [ -f "$HOME/.bashrc" ]; then
        SHELL_PROFILE="$HOME/.bashrc"
    else
        echo -e "${RED}❌ Could not determine shell profile${NC}"
        exit 1
    fi

    # Add environment variables
    cat >> "$SHELL_PROFILE" << EOF

# Android SDK (added by setup-android.sh)
export ANDROID_HOME=$SDK_ROOT
export PATH=\$PATH:\$ANDROID_HOME/emulator
export PATH=\$PATH:\$ANDROID_HOME/platform-tools
export PATH=\$PATH:\$ANDROID_HOME/tools
export PATH=\$PATH:\$ANDROID_HOME/tools/bin
EOF

    echo -e "${GREEN}✅ Added to $SHELL_PROFILE${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  Please run: source $SHELL_PROFILE${NC}"
    echo "   Then run this script again."
    exit 0
else
    echo -e "${GREEN}✅ ANDROID_HOME: $ANDROID_HOME${NC}"
fi

# Check if SDK directory exists
echo ""
echo -e "${BLUE}📦 Checking Android SDK...${NC}"
if [ ! -d "$ANDROID_HOME" ]; then
    echo -e "${RED}❌ Android SDK not found at: $ANDROID_HOME${NC}"
    echo ""
    echo "Please:"
    echo "1. Open Android Studio"
    echo "2. Go to Tools → SDK Manager"
    echo "3. Install Android SDK"
    echo "4. Run this script again"
    exit 1
fi
echo -e "${GREEN}✅ Android SDK found${NC}"

# Check for platform-tools (adb)
echo ""
echo -e "${BLUE}🔧 Checking platform-tools...${NC}"
if ! command -v adb &> /dev/null; then
    echo -e "${RED}❌ adb not found${NC}"
    echo "Please install 'Android SDK Platform-Tools' via Android Studio SDK Manager"
    exit 1
fi
ADB_VERSION=$(adb --version | head -1)
echo -e "${GREEN}✅ $ADB_VERSION${NC}"

# Check for emulator
echo ""
echo -e "${BLUE}📱 Checking emulator...${NC}"
if ! command -v emulator &> /dev/null; then
    echo -e "${RED}❌ emulator not found${NC}"
    echo "Please install 'Android Emulator' via Android Studio SDK Manager"
    exit 1
fi
echo -e "${GREEN}✅ Emulator found${NC}"

# Check for Java
echo ""
echo -e "${BLUE}☕ Checking Java...${NC}"
if ! command -v java &> /dev/null; then
    echo -e "${RED}❌ Java not found${NC}"
    echo "Please install JDK 11 or 17"
    exit 1
fi
JAVA_VERSION=$(java -version 2>&1 | head -1)
echo -e "${GREEN}✅ $JAVA_VERSION${NC}"

# List installed SDK platforms
echo ""
echo -e "${BLUE}📲 Installed Android Platforms:${NC}"
if [ -d "$ANDROID_HOME/platforms" ]; then
    ls -1 "$ANDROID_HOME/platforms" | sed 's/android-/API Level /' || echo "None"
else
    echo "None"
fi

# Check for required SDK platforms
echo ""
echo -e "${BLUE}🎯 Checking required SDK platforms...${NC}"
REQUIRED_PLATFORMS=("35" "34" "33")
MISSING_PLATFORMS=()

for API in "${REQUIRED_PLATFORMS[@]}"; do
    if [ ! -d "$ANDROID_HOME/platforms/android-$API" ]; then
        MISSING_PLATFORMS+=("$API")
        echo -e "${YELLOW}⚠️  Android API $API not installed${NC}"
    else
        echo -e "${GREEN}✅ Android API $API installed${NC}"
    fi
done

if [ ${#MISSING_PLATFORMS[@]} -ne 0 ]; then
    echo ""
    echo -e "${YELLOW}⚠️  Missing SDK platforms: ${MISSING_PLATFORMS[*]}${NC}"
    echo ""
    echo "To install:"
    echo "1. Open Android Studio"
    echo "2. Go to Tools → SDK Manager → SDK Platforms"
    echo "3. Check: Android 15.0 (API 35), Android 14.0 (API 34), Android 13.0 (API 33)"
    echo "4. Click Apply"
fi

# List available AVDs
echo ""
echo -e "${BLUE}📱 Available Virtual Devices:${NC}"
AVD_LIST=$(emulator -list-avds)
if [ -z "$AVD_LIST" ]; then
    echo -e "${YELLOW}⚠️  No AVDs found${NC}"
    echo ""
    echo "To create an AVD:"
    echo "1. Open Android Studio"
    echo "2. Go to Tools → Device Manager"
    echo "3. Click + Create Device"
    echo "4. Select Pixel 8 Pro"
    echo "5. Download API 35 system image (arm64-v8a for Apple Silicon)"
    echo "6. Click Finish"
else
    echo -e "${GREEN}✅ Found AVD(s):${NC}"
    echo "$AVD_LIST" | sed 's/^/   /'
fi

# Check for build-tools
echo ""
echo -e "${BLUE}🔨 Checking build-tools...${NC}"
if [ -d "$ANDROID_HOME/build-tools" ]; then
    LATEST_BUILD_TOOLS=$(ls -1 "$ANDROID_HOME/build-tools" | sort -V | tail -1)
    echo -e "${GREEN}✅ Latest: $LATEST_BUILD_TOOLS${NC}"
else
    echo -e "${YELLOW}⚠️  No build-tools found${NC}"
    echo "Install via Android Studio SDK Manager → SDK Tools → Android SDK Build-Tools"
fi

# Verify licenses
echo ""
echo -e "${BLUE}📜 Checking SDK licenses...${NC}"
if [ -d "$ANDROID_HOME/licenses" ]; then
    echo -e "${GREEN}✅ Licenses accepted${NC}"
else
    echo -e "${YELLOW}⚠️  Licenses not accepted${NC}"
    echo "Accepting licenses..."
    yes | sdkmanager --licenses 2>/dev/null || true
    echo -e "${GREEN}✅ Licenses accepted${NC}"
fi

# Test emulator launch (if AVD exists)
if [ -n "$AVD_LIST" ]; then
    echo ""
    read -p "Would you like to test the emulator? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        FIRST_AVD=$(echo "$AVD_LIST" | head -1)
        echo -e "${BLUE}🧪 Starting emulator: $FIRST_AVD${NC}"
        emulator -avd "$FIRST_AVD" &
        echo -e "${GREEN}✅ Emulator starting (this may take a minute)...${NC}"
    fi
fi

# Summary
echo ""
echo "═══════════════════════════════════════════════"
echo -e "${GREEN}✅ Android Setup Check Complete!${NC}"
echo "═══════════════════════════════════════════════"
echo ""

# Summary of what's needed
if [ ${#MISSING_PLATFORMS[@]} -eq 0 ] && [ -n "$AVD_LIST" ]; then
    echo -e "${GREEN}🎉 All requirements met!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Run 'yarn android' to build and launch the app"
    echo "2. Or press 'a' in the Expo terminal"
    echo "3. Or use Cmd+Shift+M in VS Code"
else
    echo -e "${YELLOW}⚠️  Action required:${NC}"
    if [ ${#MISSING_PLATFORMS[@]} -ne 0 ]; then
        echo "- Install Android API levels: ${MISSING_PLATFORMS[*]}"
    fi
    if [ -z "$AVD_LIST" ]; then
        echo "- Create at least one Android Virtual Device (AVD)"
    fi
    echo ""
    echo "Open Android Studio and complete the setup steps above."
fi

echo ""
echo "Troubleshooting:"
echo "- If 'adb' not found: Reload shell with 'source ~/.zshrc'"
echo "- If emulator slow: Use arm64-v8a images on Apple Silicon Macs"
echo "- If build fails: Run 'adb kill-server && adb start-server'"
echo ""
