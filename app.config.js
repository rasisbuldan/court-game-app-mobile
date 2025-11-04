module.exports = {
  expo: {
    name: "Courtster",
    slug: "courtster",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    scheme: "courtster",
    newArchEnabled: true,
    platforms: ["ios", "android"],
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.courtster.app",
      buildNumber: "1.0.0",
      infoPlist: {
        NSCameraUsageDescription: "Allow Courtster to access your camera to take photos for tournaments.",
        NSPhotoLibraryUsageDescription: "Allow Courtster to access your photo library.",
        UIViewControllerBasedStatusBarAppearance: true
      },
      config: {
        usesNonExemptEncryption: false
      },
      // Optimized for iPhone 14/15 Pro
      deploymentTarget: "15.2"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.courtster.app",
      versionCode: 1,
      // Optimized for Samsung S24 (Android 15)
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: true,
      permissions: [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ],
      compileSdkVersion: 35,
      targetSdkVersion: 35,
      minSdkVersion: 26,
      // Handle hardware back button properly
      softwareKeyboardLayoutMode: "pan"
    },
    androidNavigationBar: {
      visible: "sticky-immersive",
      barStyle: "dark-content",
      backgroundColor: "#ffffff"
    },
    androidStatusBar: {
      barStyle: "dark-content",
      backgroundColor: "#ffffff",
      translucent: false
    },
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro"
    },
    plugins: [
      "expo-router",
      [
        "expo-build-properties",
        {
          ios: {
            deploymentTarget: "15.2",
            // Enable for better performance on newer iPhones
            newArchEnabled: true
          },
          android: {
            compileSdkVersion: 35,
            targetSdkVersion: 35,
            minSdkVersion: 26,
            buildToolsVersion: "35.0.0",
            enableProguardInReleaseBuilds: true,
            enableShrinkResourcesInReleaseBuilds: true,
            // Optimize for Samsung S24
            newArchEnabled: true
          }
        }
      ]
    ],
    extra: {
      router: {
        origin: false
      },
      eas: {
        projectId: "acb8be5d-da30-4ae1-ac25-57a6543452cf"
      }
    },
    owner: "rasisbuldandev"
  }
};
