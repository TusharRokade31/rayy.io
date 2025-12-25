#!/bin/bash
# Script to verify iOS version numbers before build/upload

echo "========================================="
echo "iOS VERSION VERIFICATION"
echo "========================================="
echo ""

echo "📋 Checking Xcode Project Settings..."
echo "---"
XCODE_PROJECT="/app/frontend/ios/App/App.xcodeproj/project.pbxproj"

MARKETING_VERSION=$(grep "MARKETING_VERSION = " "$XCODE_PROJECT" | head -1 | sed 's/.*= \(.*\);/\1/')
BUILD_NUMBER=$(grep "CURRENT_PROJECT_VERSION = " "$XCODE_PROJECT" | head -1 | sed 's/.*= \(.*\);/\1/')

echo "✅ MARKETING_VERSION (CFBundleShortVersionString): $MARKETING_VERSION"
echo "✅ CURRENT_PROJECT_VERSION (CFBundleVersion): $BUILD_NUMBER"
echo ""

echo "📋 Checking Info.plist Configuration..."
echo "---"
INFO_PLIST="/app/frontend/ios/App/App/Info.plist"

SHORT_VERSION=$(grep -A 1 "CFBundleShortVersionString" "$INFO_PLIST" | tail -1 | sed 's/.*<string>\(.*\)<\/string>/\1/')
BUNDLE_VERSION=$(grep -A 1 "CFBundleVersion" "$INFO_PLIST" | tail -1 | sed 's/.*<string>\(.*\)<\/string>/\1/')

echo "✅ CFBundleShortVersionString: $SHORT_VERSION"
echo "✅ CFBundleVersion: $BUNDLE_VERSION"
echo ""

echo "📋 Checking package.json & capacitor.config.json..."
echo "---"
PKG_VERSION=$(grep '"version"' /app/frontend/package.json | head -1 | sed 's/.*: "\(.*\)".*/\1/')
CAP_VERSION=$(grep '"version"' /app/frontend/capacitor.config.json | sed 's/.*: "\(.*\)".*/\1/')

echo "✅ package.json version: $PKG_VERSION"
echo "✅ capacitor.config.json version: $CAP_VERSION"
echo ""

echo "========================================="
echo "SUMMARY FOR APP STORE CONNECT"
echo "========================================="
echo ""
echo "When you build and upload the IPA, it should contain:"
echo ""
echo "  CFBundleShortVersionString: $MARKETING_VERSION"
echo "  CFBundleVersion: $BUILD_NUMBER"
echo ""
echo "This CFBundleVersion ($BUILD_NUMBER) is > 100, so it will be accepted by App Store Connect."
echo ""
echo "========================================="
echo "VERIFICATION COMMAND FOR BUILT IPA"
echo "========================================="
echo ""
echo "After building, run this to verify the IPA:"
echo ""
echo '  unzip -p App.ipa "Payload/*.app/Info.plist" | plutil -p - | grep -E "CFBundleShortVersionString|CFBundleVersion"'
echo ""
echo "Expected output:"
echo '  "CFBundleShortVersionString" => "'$MARKETING_VERSION'"'
echo '  "CFBundleVersion" => "'$BUILD_NUMBER'"'
echo ""
