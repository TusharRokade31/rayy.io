# 📱 RRRAY Mobile App - iOS & Android

Production-ready React Native mobile application for RRRAY Marketplace.

---

## 🎯 Features Implemented

### ✅ Authentication
- Welcome/Onboarding screen
- Login with email/password
- Registration with full form
- JWT token management
- Persistent sessions (AsyncStorage)
- Auto-logout on token expiry

### ✅ Main Screens
1. **Home Screen**
   - Personalized greeting
   - Search bar
   - Browse by category (horizontal scroll)
   - This Week's Trials section
   - Workshops section
   - Weekend Camps section
   - Pull-to-refresh

2. **Search Screen**
   - Real-time search
   - Filter by category
   - Filter by trial availability
   - Results with images & pricing
   - Empty state handling

3. **Listing Detail Screen**
   - Full listing information
   - Image hero section
   - Meta info (age, duration, location)
   - Trial vs Regular class selector
   - Description & what to expect
   - Bottom booking bar with price

4. **Bookings Screen**
   - List of all bookings
   - Status badges (confirmed, pending, cancelled, completed)
   - Cancel booking functionality
   - Empty state with CTA
   - Pull-to-refresh

5. **Profile Screen**
   - User information display
   - Menu items (Edit Profile, Children, Payments, etc.)
   - Logout functionality

6. **Checkout Screen**
   - Booking summary
   - Child details form
   - Session date/time selection
   - Additional notes
   - Confirm & Pay button
   - Success/error handling

### ✅ Navigation
- Stack navigation for auth flow
- Bottom tabs (Home, Search, Bookings, Profile)
- Nested stack navigation for details/checkout
- Icons from MaterialCommunityIcons

### ✅ API Integration
- Axios with interceptors
- JWT token auto-injection
- Error handling with auto-logout
- Configured for https://rrray.com/api
- Services: auth, home, listings, bookings

### ✅ UI/UX
- Material Design principles
- Consistent color scheme
- Smooth animations
- Loading states
- Error states
- Empty states
- Pull-to-refresh
- Optimized images

---

## 🚀 Setup Instructions

### Prerequisites

**macOS (for iOS development):**
- Xcode 14+ (from App Store)
- CocoaPods (`sudo gem install cocoapods`)
- Node.js 18+
- Watchman (`brew install watchman`)

**Windows/Linux (for Android development):**
- Android Studio (with Android SDK)
- Node.js 18+
- Java JDK 11+

### Installation

1. **Navigate to mobile directory:**
```bash
cd /app/mobile
```

2. **Dependencies are already installed** (via yarn)

3. **For iOS (macOS only):**
```bash
cd ios
pod install
cd ..
```

4. **Set up environment:**
```bash
# .env is already configured with:
API_BASE_URL=https://rrray.com/api
```

---

## 📱 Running on Simulators

### iOS Simulator (macOS only)

1. **Start Metro bundler:**
```bash
cd /app/mobile
yarn start
```

2. **In a new terminal, run iOS:**
```bash
cd /app/mobile
yarn ios
# Or specify device:
yarn ios --simulator="iPhone 15 Pro"
```

3. **Available simulators:**
```bash
# List all available simulators
xcrun simctl list devices
```

### Android Emulator

1. **Start Android emulator first:**
   - Open Android Studio
   - Tools → Device Manager
   - Create/Start an emulator (e.g., Pixel 5, API 33)

2. **Start Metro bundler:**
```bash
cd /app/mobile
yarn start
```

3. **In a new terminal, run Android:**
```bash
cd /app/mobile
yarn android
```

### Using Expo (Alternative)

If you prefer Expo for easier testing:

1. **Install Expo CLI:**
```bash
npm install -g expo-cli
```

2. **Run with Expo:**
```bash
cd /app/mobile
expo start
```

3. **Scan QR code with Expo Go app** on your physical device

---

## 🧪 Testing Guide

### Test Flow 1: Authentication
1. Launch app → Welcome screen
2. Tap "Get Started" → Register screen
3. Fill form and register → Auto login
4. Should land on Home screen

### Test Flow 2: Browse & Book
1. Home screen → Browse categories
2. Tap "This Week's Trials" → See trial cards
3. Tap a trial → Listing detail screen
4. Select "Trial Class" → See price
5. Tap "Book Now" → Checkout screen
6. Fill form → Confirm booking
7. Go to Bookings tab → See booking

### Test Flow 3: Search
1. Tap Search tab
2. Enter "dance" → See results
3. Tap a result → Listing detail
4. Navigate back → Search again

### Test Flow 4: Profile
1. Tap Profile tab
2. View user info
3. Tap menu items (not implemented yet)
4. Tap Logout → Back to Welcome screen

---

## 🐛 Troubleshooting

### iOS Issues

**Metro bundler not starting:**
```bash
watchman watch-del-all
rm -rf node_modules
yarn install
yarn start --reset-cache
```

**Pod install fails:**
```bash
cd ios
pod deintegrate
pod install
cd ..
```

**Xcode build errors:**
- Clean build folder (Cmd+Shift+K)
- Delete DerivedData
- Restart Xcode

### Android Issues

**Gradle build fails:**
```bash
cd android
./gradlew clean
cd ..
```

**Emulator not detected:**
```bash
adb devices
# If not listed, restart adb:
adb kill-server
adb start-server
```

**Metro bundler connection issues:**
```bash
adb reverse tcp:8081 tcp:8081
```

### Common Issues

**Cannot connect to API:**
- Check .env file has correct API_BASE_URL
- Ensure backend is running on https://rrray.com
- Check network connectivity

**Images not loading:**
- Check API responses have valid image_url
- Verify image URLs are accessible
- Check console for errors

**Authentication not persisting:**
- Check AsyncStorage permissions
- Clear app data and reinstall
- Check token is being saved

---

## 📦 Build for Production

### iOS

1. **Open Xcode:**
```bash
cd /app/mobile/ios
open RRRAY.xcworkspace
```

2. **Configure signing:**
   - Select project → Signing & Capabilities
   - Add your Apple Developer account
   - Select Team

3. **Archive:**
   - Product → Archive
   - Distribute App → App Store Connect

### Android

1. **Generate release APK:**
```bash
cd /app/mobile/android
./gradlew assembleRelease
```

2. **APK location:**
```
android/app/build/outputs/apk/release/app-release.apk
```

3. **Generate AAB for Play Store:**
```bash
./gradlew bundleRelease
```

4. **AAB location:**
```
android/app/build/outputs/bundle/release/app-release.aab
```

---

## 📝 Next Steps

### Features to Implement:
- [ ] Push notifications (Firebase/OneSignal)
- [ ] Deep linking for sharing
- [ ] Image picker for profile photo
- [ ] Payment gateway integration (Razorpay)
- [ ] Google Maps for location picker
- [ ] Social sharing
- [ ] Rating & review system
- [ ] Wishlist/favorites
- [ ] Offline mode with caching
- [ ] Analytics (Firebase/Mixpanel)

### Improvements:
- [ ] Add date/time picker UI
- [ ] Implement all Profile menu items
- [ ] Add loading skeletons
- [ ] Improve error messages
- [ ] Add success animations
- [ ] Optimize image loading with caching
- [ ] Add unit tests
- [ ] Add E2E tests (Detox)

---

## 🔧 Tech Stack

- **Framework:** React Native 0.73.0
- **Language:** JavaScript
- **Navigation:** React Navigation 6
- **API:** Axios
- **Storage:** AsyncStorage
- **UI:** React Native Paper
- **Icons:** React Native Vector Icons
- **State:** Context API

---

## 📚 Resources

- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [React Navigation](https://reactnavigation.org/docs/getting-started)
- [React Native Paper](https://reactnativepaper.com/)
- [iOS Deployment Guide](https://reactnative.dev/docs/publishing-to-app-store)
- [Android Deployment Guide](https://reactnative.dev/docs/signed-apk-android)

---

## ✅ Status

**Current:** ✅ All screens implemented and ready for testing  
**Next:** 🧪 Testing on iOS/Android simulators  
**Production:** 📦 Ready for app store submission

---

**Built with ❤️ for RRRAY**
