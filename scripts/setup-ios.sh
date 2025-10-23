#!/bin/bash

# iOS Development Setup Script
# Automates Xcode and iOS Simulator setup for Courtster mobile app

set -e

echo "🍎 iOS Development Setup"
echo "========================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo -e "${RED}❌ Error: iOS development requires macOS${NC}"
    exit 1
fi

# Check if Xcode is installed
echo -e "${BLUE}📱 Checking Xcode installation...${NC}"
if [ ! -d "/Applications/Xcode.app" ]; then
    echo -e "${RED}❌ Xcode not found${NC}"
    echo "Please install Xcode from the Mac App Store:"
    echo "https://apps.apple.com/app/xcode/id497799835"
    exit 1
fi
echo -e "${GREEN}✅ Xcode found${NC}"

# Check Xcode version
XCODE_VERSION=$(xcodebuild -version | head -n 1 | awk '{print $2}')
echo -e "${BLUE}   Version: $XCODE_VERSION${NC}"

# Accept Xcode license
echo ""
echo -e "${BLUE}📜 Accepting Xcode license...${NC}"
if sudo xcodebuild -license accept 2>/dev/null; then
    echo -e "${GREEN}✅ License accepted${NC}"
else
    echo -e "${YELLOW}⚠️  License may already be accepted${NC}"
fi

# Select Xcode command line tools
echo ""
echo -e "${BLUE}🛠️  Configuring Command Line Tools...${NC}"
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
echo -e "${GREEN}✅ Command Line Tools configured${NC}"

# Check for simulators
echo ""
echo -e "${BLUE}📲 Checking iOS Simulators...${NC}"
SIMULATOR_COUNT=$(xcrun simctl list devices available | grep -c "iPhone" || true)
if [ "$SIMULATOR_COUNT" -eq 0 ]; then
    echo -e "${YELLOW}⚠️  No iOS simulators found${NC}"
    echo "Opening Xcode to download simulators..."
    echo "1. Go to Xcode → Settings → Platforms"
    echo "2. Download iOS 18.0 or iOS 17.5 simulator"
    open -a Xcode
    echo ""
    read -p "Press Enter after downloading simulators..."
else
    echo -e "${GREEN}✅ Found $SIMULATOR_COUNT iPhone simulator(s)${NC}"
fi

# List available simulators
echo ""
echo -e "${BLUE}📱 Available Simulators:${NC}"
xcrun simctl list devices available | grep "iPhone" | head -5

# Check for CocoaPods
echo ""
echo -e "${BLUE}💎 Checking CocoaPods...${NC}"
if ! command -v pod &> /dev/null; then
    echo -e "${YELLOW}⚠️  CocoaPods not found, installing...${NC}"
    sudo gem install cocoapods
    echo -e "${GREEN}✅ CocoaPods installed${NC}"
else
    POD_VERSION=$(pod --version)
    echo -e "${GREEN}✅ CocoaPods $POD_VERSION found${NC}"
fi

# Install iOS dependencies if ios folder exists
if [ -d "ios" ]; then
    echo ""
    echo -e "${BLUE}📦 Installing iOS dependencies...${NC}"
    npx pod-install ios
    echo -e "${GREEN}✅ iOS dependencies installed${NC}"
else
    echo ""
    echo -e "${YELLOW}⚠️  No ios folder found${NC}"
    echo "   It will be created when you first build for iOS"
fi

# Test simulator launch
echo ""
echo -e "${BLUE}🧪 Testing simulator launch...${NC}"
# Get first available iPhone simulator
SIMULATOR=$(xcrun simctl list devices available | grep "iPhone" | head -1 | sed 's/.*(\(.*\)).*/\1/')
if [ -n "$SIMULATOR" ]; then
    echo "Starting simulator..."
    xcrun simctl boot "$SIMULATOR" 2>/dev/null || true
    open -a Simulator
    sleep 3
    echo -e "${GREEN}✅ Simulator launched successfully${NC}"
else
    echo -e "${RED}❌ Could not find simulator to launch${NC}"
fi

# Summary
echo ""
echo "═══════════════════════════════════════════════"
echo -e "${GREEN}✅ iOS Setup Complete!${NC}"
echo "═══════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "1. Run 'yarn ios' to build and launch the app"
echo "2. Or press 'i' in the Expo terminal"
echo "3. Or use Cmd+Shift+M in VS Code"
echo ""
echo "Troubleshooting:"
echo "- If build fails, run: rm -rf ios/Pods && npx pod-install ios"
echo "- If simulator issues: xcrun simctl shutdown all"
echo ""
