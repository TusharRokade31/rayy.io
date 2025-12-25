# 🎨 Google Play Store Assets Generation Guide - RRRAY

## Overview

This guide helps you create all required assets for Google Play Store submission.

---

## 📁 Files Created

1. **`feature-graphic-1024x500.svg`** - Feature graphic (text-based)
2. **`feature-graphic-with-phone-1024x500.svg`** - Feature graphic (with phone mockup)

---

## 🚀 Convert SVG to PNG (Required Format)

### Method 1: Online Converter (Easiest)

1. Go to **https://cloudconvert.com/svg-to-png**

2. Upload the SVG file you prefer:
   - `feature-graphic-1024x500.svg` (simple, text-focused)
   - OR `feature-graphic-with-phone-1024x500.svg` (with phone mockup)

3. Set dimensions: **1024 x 500 pixels**

4. Click **Start Conversion**

5. Download as **`feature-graphic.png`**

### Method 2: Mac Command Line

```bash
cd /app/frontend/play-store-assets

# Convert with qlmanage
qlmanage -t -s 1024 -o . feature-graphic-1024x500.svg

# Rename
mv feature-graphic-1024x500.svg.png feature-graphic.png
```

### Method 3: Using ImageMagick

```bash
cd /app/frontend/play-store-assets

# Install ImageMagick if needed
brew install imagemagick

# Convert
convert feature-graphic-1024x500.svg -resize 1024x500 feature-graphic.png
```

---

## 📱 Complete Google Play Store Asset Requirements

### Required Assets:

#### 1. **Feature Graphic** ✅ (Created)
- **Size:** 1024 x 500 px
- **Format:** PNG or JPEG
- **Max size:** 15 MB
- **Purpose:** Shown at top of store listing

#### 2. **App Icon** (512 x 512 px)
- **Size:** 512 x 512 px
- **Format:** PNG (32-bit)
- **No transparency, no rounded corners**

**To Create:**
```bash
# Use the iOS icon and resize
cd /app/frontend/ios-assets

# If you have app-icon-1024.png
sips -z 512 512 app-icon-1024.png --out ../play-store-assets/app-icon-512.png

# Or convert SVG
qlmanage -t -s 512 -o ../play-store-assets app-icon-1024.svg
mv ../play-store-assets/app-icon-1024.svg.png ../play-store-assets/app-icon-512.png
```

#### 3. **Screenshots** (2-8 required)

**Phone Screenshots:**
- **Min:** 320 px
- **Max:** 3840 px
- **Aspect ratio:** Between 16:9 and 9:16
- **Recommended:** 1080 x 1920 px or 1440 x 2560 px

**Tablet Screenshots (Optional but Recommended):**
- **7-inch:** 1200 x 1920 px
- **10-inch:** 1600 x 2560 px

#### 4. **Promo Video** (Optional)
- YouTube URL
- Shows app functionality
- 30 seconds to 2 minutes

---

## 🎯 How to Take Screenshots

### Option A: Using Android Emulator in Android Studio

1. Open Android Studio
2. Run app on emulator
3. Navigate to key screens
4. Click camera icon in emulator toolbar
5. Screenshots saved to: `~/Desktop/`

### Option B: Real Device

1. Navigate to important screens
2. Press **Power + Volume Down** simultaneously
3. Transfer screenshots to computer

### Option C: Using ADB

```bash
# Take screenshot
adb shell screencap -p /sdcard/screenshot.png

# Pull to computer
adb pull /sdcard/screenshot.png ./screenshots/
```

### Recommended Screens to Capture:

1. **Home/Search screen** - Shows browsing experience
2. **Class details** - Shows information and booking
3. **Search results** - Shows variety of classes
4. **Profile/Bookings** - Shows user dashboard
5. **Category view** - Shows organization
6. **Booking confirmation** - Shows ease of booking

---

## 📐 Asset Specifications Summary

| Asset | Size | Format | Notes |
|-------|------|--------|-------|
| **Feature Graphic** | 1024 x 500 px | PNG/JPEG | Required |
| **App Icon** | 512 x 512 px | PNG (32-bit) | Required |
| **Phone Screenshots** | 1080 x 1920 px | PNG/JPEG | 2-8 required |
| **7" Tablet Screenshots** | 1200 x 1920 px | PNG/JPEG | Optional |
| **10" Tablet Screenshots** | 1600 x 2560 px | PNG/JPEG | Optional |
| **Promo Video** | YouTube URL | MP4 | Optional |

---

## 🎨 Design Tips

### Feature Graphic:
- Use high contrast for text visibility
- Include app icon/logo
- Show key features or benefits
- Keep text minimal and readable
- Avoid clutter

### Screenshots:
- Show actual app content (not mockups)
- Add captions/text overlays to highlight features
- Use consistent styling across all screenshots
- Show diverse content (different classes/categories)
- Include UI elements (navigation, buttons)

### App Icon:
- Must be recognizable at small sizes
- No transparency (solid background)
- Corners will be rounded automatically by Android
- Matches branding (RRRAY logo)

---

## 📋 Quick Checklist

Before uploading to Play Store:

- [ ] Feature graphic (1024x500 PNG)
- [ ] App icon (512x512 PNG)
- [ ] At least 2 phone screenshots
- [ ] Optional: Tablet screenshots
- [ ] Optional: Promo video (YouTube)
- [ ] All images under 15 MB
- [ ] All screenshots show actual app content
- [ ] No placeholder text in graphics
- [ ] Branding consistent across all assets

---

## 🔗 Useful Tools

- **CloudConvert:** https://cloudconvert.com/svg-to-png
- **Figma:** https://www.figma.com/ (Design tool)
- **Canva:** https://www.canva.com/ (Add text overlays to screenshots)
- **Screenshot Framer:** https://screenshots.pro/ (Add device frames)

---

## 🚀 Next Steps

After creating all assets:

1. Convert feature graphic SVG to PNG
2. Create app icon (512x512)
3. Take 2-8 screenshots of app
4. Proceed with Android deployment guide
5. Upload assets to Google Play Console

---

**Continue to `/app/ANDROID_DEPLOYMENT_GUIDE.md` for complete Play Store submission instructions.**
