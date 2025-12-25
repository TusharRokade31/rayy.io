# RRRAY Mobile App - Quick Deployment Checklist

## 🚀 Ready to Deploy in 30 Minutes!

Since you already have Apple and Google developer accounts, follow these steps:

---

## ✅ Pre-Deployment Checklist

### 1. Install EAS CLI (2 minutes)
```bash
npm install -g eas-cli
```

### 2. Create Expo Account (3 minutes)
- Go to https://expo.dev
- Sign up (free)
- Verify email

### 3. Prepare Assets (15 minutes)
Create and add these files to `/app/mobile/assets/`:
- [ ] `icon.png` (1024x1024) - App icon
- [ ] `adaptive-icon.png` (1024x1024) - Android icon
- [ ] `splash.png` (1284x2778) - Launch screen
- [ ] `favicon.png` (48x48) - Web icon

**Quick tip:** Use https://appicon.co to generate all sizes from one image!

### 4. Get Your Credentials (5 minutes)

**Apple Developer:**
- [ ] Apple ID email: ________________
- [ ] Apple Team ID: ________________ (from https://developer.apple.com/account)
- [ ] Create app in App Store Connect (get App ID)

**Google Play:**
- [ ] Create app in Google Play Console
- [ ] Create service account → Download JSON key
- [ ] Save as `google-play-service-account.json` in `/app/mobile/`

### 5. Update Configuration (2 minutes)

Edit `/app/mobile/eas.json` - Line 18-24:
```json
"ios": {
  "appleId": "YOUR_APPLE_ID@example.com",
  "ascAppId": "YOUR_APP_STORE_APP_ID",
  "appleTeamId": "YOUR_APPLE_TEAM_ID"
}
```

---

## 🎯 Deployment Commands (3 minutes)

### Step 1: Login to Expo
```bash
cd /app/mobile
eas login
```

### Step 2: Build Apps (Wait 15-20 min)
```bash
eas build --platform all --profile production
```

This builds both iOS and Android simultaneously. You'll get download links when done.

### Step 3: Submit to Stores (Wait 1-7 days for approval)
```bash
eas submit --platform all --profile production
```

Or submit manually:
- **iOS**: Upload .ipa to App Store Connect via Transporter
- **Android**: Upload .aab to Google Play Console

---

## 📝 App Store Information

### App Name
**RRRAY - Kids Classes**

### Short Description (80 chars max)
Find and book amazing kids' classes, camps & activities near you!

### Category
- iOS: Education
- Android: Education

### Keywords (iOS)
kids classes, children activities, camps, workshops, education, learning

### Screenshots Needed
- At least 3-5 screenshots showing key features
- Use your phone/simulator to capture:
  1. Home screen with categories
  2. AI Advisor chat
  3. Search results
  4. Class details
  5. Booking screen

---

## ⚡ Quick Build & Deploy

If you're ready NOW:

```bash
# Navigate to mobile directory
cd /app/mobile

# Install EAS CLI (if not already installed)
npm install -g eas-cli

# Login to Expo
eas login

# Start building!
eas build --platform all --profile production

# After builds complete (~20 min), submit
eas submit --platform all --profile production
```

---

## 🎉 Post-Deployment

### Once Apps Are Approved:

1. **Share Links:**
   - iOS: https://apps.apple.com/app/rrray/id[YOUR_APP_ID]
   - Android: https://play.google.com/store/apps/details?id=com.rrray.marketplace

2. **Update Website:**
   - Add app store badges
   - Link to download pages

3. **Notify Users:**
   - Email announcement
   - Social media posts

---

## 🆘 Need Help?

### Common Issues:

**"Missing credentials"**
→ Update `eas.json` with your Apple/Google credentials

**"Build failed"**
→ Run: `cd /app/mobile && rm -rf node_modules && yarn install`

**"Assets not found"**
→ Add icon.png, splash.png, adaptive-icon.png to `/app/mobile/assets/`

### Get Support:
- Expo Docs: https://docs.expo.dev
- EAS Build: https://docs.expo.dev/build/introduction

---

## 📊 Timeline Estimate

| Task | Time |
|------|------|
| Install & setup | 10 min |
| Prepare assets | 15 min |
| Configure credentials | 5 min |
| Build (both platforms) | 20 min |
| Submit to stores | 5 min |
| **Total Development Time** | **~55 min** |
| Store review (iOS) | 1-7 days |
| Store review (Android) | 1-3 days |

---

## ✅ You're Ready!

Your RRRAY mobile app code is complete and production-ready. Just add assets, configure credentials, and deploy!

**Next Command:**
```bash
cd /app/mobile && eas login
```

Good luck with your launch! 🚀
