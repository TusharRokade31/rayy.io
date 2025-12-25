# RRRAY Mobile App - Deployment Guide

## 🚀 Complete Deployment Instructions for iOS & Android

Your RRRAY mobile app is ready to deploy! Follow these steps to publish to App Store and Google Play.

---

## Prerequisites ✅

You mentioned you already have:
- ✅ Apple Developer Account ($99/year)
- ✅ Google Play Developer Account ($25 one-time)

**Additional Requirements:**
- Expo account (create free at https://expo.dev)
- EAS CLI installed globally
- Your Apple ID and Team ID
- Google Play service account JSON key

---

## Step 1: Install EAS CLI

```bash
npm install -g eas-cli
```

---

## Step 2: Login to Expo

```bash
cd /app/mobile
eas login
```

Create an Expo account if you don't have one, or login with existing credentials.

---

## Step 3: Configure Your Project

### Update `app.json` with Your Information

Edit `/app/mobile/app.json`:

```json
{
  "expo": {
    "name": "RRRAY",
    "slug": "rrray-mobile",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.rrray.marketplace",  // Change if needed
      "buildNumber": "1.0.0"
    },
    "android": {
      "package": "com.rrray.marketplace",  // Change if needed
      "versionCode": 1
    }
  }
}
```

### Update `eas.json` with Your Credentials

Edit `/app/mobile/eas.json` in the `submit.production` section:

**For iOS:**
```json
"ios": {
  "appleId": "your-apple-id@example.com",       // Your Apple ID email
  "ascAppId": "1234567890",                     // From App Store Connect
  "appleTeamId": "ABC123DEF4"                   // From Apple Developer portal
}
```

**For Android:**
- Create a service account in Google Play Console
- Download the JSON key file
- Save it as `google-play-service-account.json` in `/app/mobile/`

---

## Step 4: Create App Store Connect App (iOS)

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click "My Apps" → "+" → "New App"
3. Fill in:
   - **Platform**: iOS
   - **Name**: RRRAY - Kids Classes
   - **Primary Language**: English
   - **Bundle ID**: com.rrray.marketplace (or your chosen ID)
   - **SKU**: rrray-mobile-001
4. Click "Create"
5. Note down the **App ID** (found in App Information)
6. Update `eas.json` with this App ID in `ascAppId`

---

## Step 5: Create Google Play Console App (Android)

1. Go to [Google Play Console](https://play.google.com/console)
2. Click "Create app"
3. Fill in:
   - **App name**: RRRAY - Kids Classes
   - **Default language**: English (United States)
   - **App or game**: App
   - **Free or paid**: Free
4. Accept declarations and create app
5. Set up your app:
   - Add app icon (512x512 PNG)
   - Add feature graphic (1024x500 PNG)
   - Add screenshots (at least 2)
   - Write description
   - Set content rating
   - Set target audience

---

## Step 6: Build Production Apps

### Build for iOS:

```bash
cd /app/mobile
eas build --platform ios --profile production
```

This will:
- Upload your code to Expo servers
- Build the iOS app (.ipa file)
- Take approximately 10-20 minutes
- You'll get a download link when complete

### Build for Android:

```bash
eas build --platform android --profile production
```

This will:
- Create an Android App Bundle (.aab file)
- Take approximately 10-20 minutes
- You'll get a download link when complete

### Build Both Simultaneously:

```bash
eas build --platform all --profile production
```

---

## Step 7: Submit to App Stores

### Submit to App Store (iOS):

**Option A: Automatic Submission via EAS**
```bash
eas submit --platform ios --profile production
```

**Option B: Manual Upload**
1. Download the .ipa file from Expo build
2. Use Transporter app (Mac) or Xcode
3. Upload to App Store Connect
4. Fill in app metadata, screenshots, privacy info
5. Submit for review

### Submit to Google Play (Android):

**Option A: Automatic Submission via EAS**
```bash
eas submit --platform android --profile production
```

**Option B: Manual Upload**
1. Download the .aab file from Expo build
2. Go to Google Play Console → Your App → Production
3. Create new release
4. Upload the .aab file
5. Fill in release notes
6. Review and roll out to production

---

## Step 8: Required Assets

### App Icons
Create these images and place in `/app/mobile/assets/`:

- `icon.png` - 1024x1024 PNG (iOS & Android app icon)
- `adaptive-icon.png` - 1024x1024 PNG (Android adaptive icon foreground)
- `splash.png` - 1284x2778 PNG (Launch screen)
- `favicon.png` - 48x48 PNG (Web favicon)

### App Store Screenshots (iOS)
Required sizes:
- 6.5" iPhone: 1284 x 2778 pixels (iPhone 14 Pro Max)
- 5.5" iPhone: 1242 x 2208 pixels (iPhone 8 Plus)

### Google Play Screenshots (Android)
Required:
- At least 2 screenshots
- Recommended: 1080 x 1920 pixels (portrait)

---

## Step 9: App Store Metadata

### iOS App Store Connect

Fill in these sections:
1. **App Information**
   - Name: RRRAY - Kids Classes
   - Subtitle: Find Amazing Classes for Your Kids
   - Category: Education
   - Content Rights: Check if you have rights

2. **Pricing and Availability**
   - Price: Free
   - Availability: All countries

3. **App Privacy**
   - Privacy Policy URL: https://rrray.com/privacy
   - Data Types Collected:
     - Contact Info (Email, Phone)
     - User Content (Photos if using image picker)
     - Identifiers (User ID)
     - Usage Data (Analytics)

4. **Description**
```
Discover the best kids' classes, camps, and activities with RRRAY! 

✨ Features:
• Browse thousands of classes by category
• AI-powered class recommendations
• Search by age, interest, or location
• Book and pay securely with Razorpay
• Manage bookings and profiles
• Chat with our AI advisor for personalized suggestions

Perfect for parents looking to enrich their children's learning journey!
```

5. **Keywords**
```
kids classes, children activities, camps, workshops, education, learning, sports, arts, music, dance
```

6. **Screenshots**
   - Upload at least 3-5 screenshots showing key features

### Google Play Console

Fill in these sections:
1. **Store Listing**
   - Short description (80 chars):
     ```
     Find and book amazing kids' classes, camps & activities near you!
     ```
   
   - Full description (4000 chars):
     ```
     RRRAY is your one-stop marketplace for discovering and booking the best kids' classes, camps, and activities!

     ✨ KEY FEATURES:
     
     🔍 Smart Search
     Find classes by category, age group, or location. Filter by trial classes, workshops, camps, and more!
     
     🤖 AI Advisor
     Get personalized class recommendations powered by AI. Ask questions and get instant answers about classes.
     
     💳 Secure Payments
     Book and pay safely with Razorpay integration. Support for credit cards, UPI, and more payment methods.
     
     📅 Easy Booking Management
     View upcoming and past bookings, reschedule sessions, and manage multiple child profiles.
     
     🎯 Age-Appropriate Content
     Browse classes designed specifically for your child's age group, from toddlers to teens.
     
     ⭐ Verified Reviews
     Read reviews from other parents and share your experiences to help the community.
     
     📱 User-Friendly Interface
     Beautiful, intuitive design makes finding and booking classes a breeze.
     
     PERFECT FOR:
     • Parents looking for enrichment activities
     • Kids interested in sports, arts, music, dance, coding, and more
     • Families seeking weekend camps and workshops
     • Anyone wanting to try classes before committing
     
     WHY CHOOSE RRRAY?
     ✓ Thousands of verified classes and instructors
     ✓ Trial classes available for most activities
     ✓ Real-time availability and instant booking
     ✓ Secure payment processing
     ✓ Dedicated customer support
     ✓ AI-powered recommendations
     
     Download RRRAY today and give your child the gift of learning!
     ```

2. **Categorization**
   - App category: Education
   - Tags: Education, Kids, Learning, Activities

3. **Content Rating**
   - Target age: Everyone
   - Complete the content rating questionnaire

4. **Store Presence**
   - Countries: Select all or specific countries
   - Pricing: Free

---

## Step 10: App Review Process

### iOS App Store Review (1-7 days)
- Apple reviews for:
  - Functionality
  - Design guidelines
  - Privacy compliance
  - Content appropriateness
- You'll receive status updates via email
- May request additional info or changes

### Google Play Review (1-3 days)
- Google reviews for:
  - Policy compliance
  - Content guidelines
  - Technical performance
- Usually faster than iOS
- May require policy acknowledgments

---

## Step 11: Post-Submission Monitoring

### Track Your App Status

**iOS:**
- Check App Store Connect dashboard
- Monitor "Activity" tab for review status
- Respond promptly to any review feedback

**Android:**
- Check Google Play Console
- Monitor "Release" section
- Address any policy warnings

### Notify Users
Once approved:
- Update your website with app store links
- Send email to existing users
- Post on social media
- Add "Download on App Store" and "Get it on Google Play" badges

---

## Common Issues & Solutions

### Build Errors

**Issue: "Build failed - missing dependencies"**
```bash
cd /app/mobile
rm -rf node_modules
yarn install
eas build --platform all --profile production
```

**Issue: "Bundle identifier already exists"**
- Change `bundleIdentifier` in `app.json` to something unique
- Example: `com.yourcompany.rrray`

### Submission Errors

**Issue: "Missing required metadata"**
- Ensure all App Store Connect fields are filled
- Add all required screenshots
- Complete privacy policy section

**Issue: "Invalid service account key (Android)"**
- Re-download service account JSON from Google Play Console
- Ensure correct file path in `eas.json`
- Check file permissions

---

## Update Strategy

### For Future Updates:

1. **Increment Version Numbers:**
   ```json
   // app.json
   "version": "1.0.1",  // Increment
   "ios": {
     "buildNumber": "1.0.1"  // Increment
   },
   "android": {
     "versionCode": 2  // Increment by 1
   }
   ```

2. **Rebuild and Resubmit:**
   ```bash
   eas build --platform all --profile production
   eas submit --platform all --profile production
   ```

---

## Production URLs

After deployment, your apps will be accessible at:

- **iOS App Store**: https://apps.apple.com/app/rrray/id[YOUR_APP_ID]
- **Google Play Store**: https://play.google.com/store/apps/details?id=com.rrray.marketplace

---

## Support & Troubleshooting

### EAS Build Dashboard
Monitor builds: https://expo.dev/accounts/[your-account]/projects/rrray-mobile/builds

### Helpful Commands

```bash
# Check build status
eas build:list

# View build logs
eas build:view [build-id]

# Cancel a build
eas build:cancel [build-id]

# Check submission status
eas submit:list

# Update credentials
eas credentials
```

### Getting Help

- **Expo Docs**: https://docs.expo.dev
- **EAS Build Docs**: https://docs.expo.dev/build/introduction
- **EAS Submit Docs**: https://docs.expo.dev/submit/introduction

---

## Checklist Before Deployment

- [ ] Updated app.json with correct bundle IDs
- [ ] Created App Store Connect app (iOS)
- [ ] Created Google Play Console app (Android)
- [ ] Updated eas.json with credentials
- [ ] Created all required app icons and screenshots
- [ ] Written app descriptions and metadata
- [ ] Set up privacy policy
- [ ] Tested app locally on simulator/emulator
- [ ] Backend APIs are deployed and working
- [ ] Payment integration configured (Razorpay)
- [ ] Analytics/tracking configured (if needed)

---

## Quick Start Commands

```bash
# 1. Install EAS CLI
npm install -g eas-cli

# 2. Login
cd /app/mobile
eas login

# 3. Build production apps
eas build --platform all --profile production

# 4. Submit to stores (after builds complete)
eas submit --platform all --profile production
```

---

## Congratulations! 🎉

Your RRRAY mobile app is ready for the world. Once deployed, users will be able to download and use your app on both iOS and Android devices!

For any issues during deployment, refer to the troubleshooting section or Expo documentation.
