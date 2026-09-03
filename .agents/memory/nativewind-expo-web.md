---
name: NativeWind Expo web setup
description: NativeWind integration details needed to keep Expo web preview bootable.
---

NativeWind Expo apps in this workspace need the `react-native-css-interop` runtime peer and `darkMode: 'class'` in Tailwind config when the Expo app uses automatic appearance settings.

**Why:** Without the peer, Metro cannot resolve `react-native-css-interop/jsx-runtime`; with media dark mode, Expo web can crash on startup with a color-scheme error.

**How to apply:** When adding NativeWind to a new Expo artifact, install both `nativewind` and `react-native-css-interop`, configure `withNativeWind` in Metro, and use class-based dark mode.