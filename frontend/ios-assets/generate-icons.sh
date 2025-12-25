#!/bin/bash

# RRRAY iOS App Icon Generator
# This script generates all required icon sizes for iOS App Store submission

echo "🎨 RRRAY iOS Icon Generator"
echo "================================"

# Check if ImageMagick or similar tool is available
if ! command -v convert &> /dev/null && ! command -v sips &> /dev/null; then
    echo "❌ Error: No image conversion tool found"
    echo ""
    echo "Please install one of the following:"
    echo "  • ImageMagick: brew install imagemagick"
    echo "  • Or use macOS built-in 'sips' command"
    echo ""
    echo "Alternative: Use online converter:"
    echo "  1. Go to https://www.adobe.com/express/feature/image/resize"
    echo "  2. Upload app-icon-1024.svg"
    echo "  3. Export at each required size below"
    exit 1
fi

# Create output directory
mkdir -p icons

# iOS App Icon sizes required
# App Store: 1024x1024
# iPhone: 180x180, 120x120, 87x87, 80x80, 60x60, 58x58, 40x40, 29x29
# iPad: 167x167, 152x152, 76x76, 40x40, 29x29
# Notification: 20x20

declare -a sizes=(
    "1024:App Store (1024x1024)"
    "180:iPhone App (60pt @3x)"
    "120:iPhone App (60pt @2x)"
    "87:iPhone Settings (29pt @3x)"
    "80:iPhone Spotlight (40pt @2x)"
    "60:iPhone Notification (20pt @3x)"
    "58:iPhone Settings (29pt @2x)"
    "40:iPhone Spotlight (40pt @1x) / iPad Notification (20pt @2x)"
    "29:iPhone Settings (29pt @1x)"
    "167:iPad Pro (83.5pt @2x)"
    "152:iPad App (76pt @2x)"
    "76:iPad App (76pt @1x)"
    "20:iPhone/iPad Notification (20pt @1x)"
)

echo ""
echo "📱 Generating iOS icons..."
echo ""

for size_info in "${sizes[@]}"; do
    IFS=':' read -r size description <<< "$size_info"
    
    if command -v convert &> /dev/null; then
        # Using ImageMagick
        convert app-icon-1024.svg -resize ${size}x${size} icons/icon-${size}x${size}.png
    elif command -v sips &> /dev/null; then
        # Using macOS sips (requires PNG source first)
        # First convert SVG to large PNG, then resize
        if [ ! -f app-icon-1024.png ]; then
            echo "Please convert app-icon-1024.svg to PNG first"
            echo "Or use: qlmanage -t -s 1024 -o . app-icon-1024.svg"
            exit 1
        fi
        sips -z $size $size app-icon-1024.png --out icons/icon-${size}x${size}.png > /dev/null 2>&1
    fi
    
    echo "  ✓ icon-${size}x${size}.png - $description"
done

echo ""
echo "✅ Icon generation complete!"
echo ""
echo "Generated icons are in: ./icons/"
echo ""
echo "📋 Next steps:"
echo "  1. Copy icons to ios/App/App/Assets.xcassets/AppIcon.appiconset/"
echo "  2. Update Contents.json with correct icon references"
echo "  3. Build and test in Xcode"
echo ""
