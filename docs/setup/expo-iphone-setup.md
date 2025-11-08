# Connecting Expo to iPhone - Complete Guide

This guide explains how to connect your iPhone to the Expo development server running in WSL.

## Prerequisites

1. **Expo Go app installed on iPhone**
   - Download from App Store: [Expo Go](https://apps.apple.com/app/apple-store/id982107779)

2. **Same Network**
   - Your iPhone and Windows PC must be on the same WiFi network

3. **Expo CLI installed**
   - Already included in the project

## Method 1: Tunnel Mode (RECOMMENDED for WSL)

This is the easiest and most reliable method when using WSL.

### Step 1: Start Expo with Tunnel

```bash
cd packages/mobile
pnpm start:tunnel
```

**What happens:**
- Expo creates a secure tunnel using ngrok
- Generates a URL like: `exp://ab-cde.your-username.exp.direct:80`
- Works from anywhere (doesn't require same network)
- May take 30-60 seconds to start

### Step 2: Connect from iPhone

**Option A: Scan QR Code**
1. Open **Expo Go** app on iPhone
2. Tap **Scan QR code**
3. Scan the QR code displayed in terminal

**Option B: Manual URL**
1. Open **Expo Go** app
2. Tap **Enter URL manually**
3. Enter the tunnel URL from terminal (starts with `exp://`)

### Troubleshooting Tunnel Mode

**Issue: "Tunnel failed to start"**
- Solution: Run `pnpm start:tunnel --clear` to clear cache
- Or: Check your internet connection (tunnel requires internet)

**Issue: "Unable to connect"**
- Solution: Wait 30-60 seconds for tunnel to fully establish
- Solution: Try restarting the dev server

## Method 2: LAN Mode (Requires Port Forwarding)

This method uses your local network but requires port forwarding setup.

### Step 1: Run Port Forward Script

**In Windows PowerShell (as Administrator):**

```powershell
cd \\wsl$\Ubuntu\home\stoorm\github\court-game-app\packages\mobile\misc
.\wsl-expo-port-forward.ps1
```

### Step 2: Find Your Windows IP Address

**In Windows PowerShell:**
```powershell
ipconfig
```

Look for "IPv4 Address" under your active network adapter (usually starts with 192.168.x.x or 10.0.x.x)

### Step 3: Start Expo with LAN

```bash
cd packages/mobile
pnpm start:lan
```

### Step 4: Connect from iPhone

**Manual Connection:**
1. Open **Expo Go** app
2. Tap **Enter URL manually**
3. Enter: `exp://[YOUR_WINDOWS_IP]:8081`
   - Example: `exp://192.168.1.100:8081`

## Method 3: Development Build (Advanced)

For production-like testing, create a development build:

```bash
cd packages/mobile

# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo
eas login

# Build for iOS
eas build --profile development --platform ios
```

Then install the `.ipa` file on your iPhone via TestFlight or direct installation.

## Common Issues & Solutions

### Issue 1: "Something went wrong"

**Symptoms:**
- App loads but shows error screen
- Red error box in Expo Go

**Solutions:**
1. Clear Metro bundler cache:
   ```bash
   pnpm start --clear
   ```

2. Clear Expo cache:
   ```bash
   rm -rf .expo
   pnpm start
   ```

3. Reinstall dependencies:
   ```bash
   rm -rf node_modules
   pnpm install
   ```

### Issue 2: "Network response timed out"

**Symptoms:**
- Expo Go shows "Network response timed out"
- Can't connect to dev server

**Solutions:**

**For Tunnel Mode:**
1. Check internet connection
2. Restart with clear cache:
   ```bash
   pnpm start:tunnel --clear
   ```
3. Wait longer (tunnel can take up to 60 seconds)

**For LAN Mode:**
1. Verify port forwarding is running (run PowerShell script)
2. Check Windows Firewall isn't blocking ports
3. Confirm iPhone and PC are on same network
4. Try using Windows IP instead of localhost

### Issue 3: "Unable to resolve module"

**Symptoms:**
- Error about missing modules
- Import errors

**Solutions:**
1. Install missing dependencies:
   ```bash
   pnpm install
   ```

2. Clear watchman cache (if installed):
   ```bash
   watchman watch-del-all
   ```

3. Restart Metro bundler:
   ```bash
   pnpm start --reset-cache
   ```

### Issue 4: QR Code not scanning

**Solutions:**
1. Make sure QR code is fully visible in terminal
2. Hold iPhone steady and close to screen
3. Use manual URL entry instead (Option B)
4. Screenshot QR code and scan from Photos app

### Issue 5: "Could not connect to development server"

**For Tunnel Mode:**
- Wait 30-60 seconds for tunnel to establish
- Check that tunnel URL shows in terminal
- Try restarting: `pnpm start:tunnel --clear`

**For LAN Mode:**
- Run the PowerShell port forwarding script
- Verify Windows IP address is correct
- Check both devices are on same WiFi
- Disable VPN on Windows if active

## Debugging Tips

### 1. Check Expo Status

When Expo is running, you should see:
```
Metro waiting on exp://[IP]:8081
› Scan the QR code above with Expo Go (Android) or Camera app (iOS)
```

For tunnel mode:
```
› Tunnel ready.
› Metro waiting on exp://ab-cde.username.exp.direct:80
```

### 2. Test Port Forwarding (LAN Mode)

In WSL terminal:
```bash
curl http://localhost:8081
```

From Windows PowerShell:
```powershell
curl http://localhost:8081
```

Both should return HTML content.

### 3. Check Firewall Rules (LAN Mode)

In PowerShell (as Admin):
```powershell
Get-NetFirewallRule -DisplayName "WSL Expo Port*"
```

Should show 4 rules (for ports 8081, 19000, 19001, 19002)

### 4. Verify WSL Port Forwarding (LAN Mode)

In PowerShell:
```powershell
netsh interface portproxy show v4tov4
```

Should show forwarding for ports 8081, 19000, 19001, 19002

## Best Practices

### For Daily Development

1. **Use Tunnel Mode** for simplicity:
   ```bash
   pnpm start:tunnel
   ```

2. **Keep Expo Go updated** on iPhone

3. **Clear cache** if you see strange errors:
   ```bash
   pnpm start --clear
   ```

### For Testing Performance

1. Use development build (Method 3) for production-like performance
2. Tunnel mode has some overhead, LAN mode is faster

### For Team Development

1. Use tunnel mode - team members can connect from anywhere
2. Share tunnel URL in team chat
3. Everyone needs Expo Go app installed

## Quick Reference

| Command | Purpose |
|---------|---------|
| `pnpm start:tunnel` | Start with tunnel (recommended for WSL) |
| `pnpm start:lan` | Start with LAN (requires port forward) |
| `pnpm start --clear` | Clear cache and start |
| `pnpm start --reset-cache` | Reset Metro bundler cache |

## Getting Windows IP Address

**PowerShell:**
```powershell
(Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias Wi-Fi).IPAddress
```

**Or:**
```powershell
ipconfig | findstr IPv4
```

## Port Reference

| Port | Purpose |
|------|---------|
| 8081 | Metro bundler (main) |
| 19000 | Expo Go connection |
| 19001 | Expo Go connection (alternate) |
| 19002 | Expo DevTools |

## Still Having Issues?

1. **Check Expo status page**: https://status.expo.dev/
2. **Restart everything**:
   - Close Expo Go on iPhone
   - Stop dev server (Ctrl+C)
   - Restart: `pnpm start:tunnel --clear`
   - Reopen Expo Go

3. **Try different network**: Switch to mobile hotspot or different WiFi

4. **Check Expo Go version**: Update to latest version in App Store

5. **Verify Expo CLI**:
   ```bash
   npx expo --version
   ```

## Success Checklist

✅ Expo Go app installed on iPhone
✅ iPhone and PC on same WiFi (for LAN mode) OR internet connection (for tunnel)
✅ Dev server running (`pnpm start:tunnel`)
✅ Tunnel URL or QR code visible in terminal
✅ Scanned QR code or entered URL in Expo Go
✅ App loading on iPhone

## Need More Help?

- Expo Documentation: https://docs.expo.dev/guides/
- Expo Discord: https://chat.expo.dev/
- Stack Overflow: Tag your question with `expo` and `react-native`
