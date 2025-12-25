#!/bin/bash
# Script to manually set iOS build number and marketing version

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}iOS Build Number Setter${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

# Get current values
PLIST_PATH="ios/App/App/Info.plist"
PBXPROJ_PATH="ios/App/App.xcodeproj/project.pbxproj"

if [ ! -f "$PLIST_PATH" ]; then
    echo -e "${RED}❌ Error: Info.plist not found at $PLIST_PATH${NC}"
    exit 1
fi

if [ ! -f "$PBXPROJ_PATH" ]; then
    echo -e "${RED}❌ Error: project.pbxproj not found at $PBXPROJ_PATH${NC}"
    exit 1
fi

# Check if arguments provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <build_number> [marketing_version]"
    echo ""
    echo "Examples:"
    echo "  $0 220                    # Set build number to 220"
    echo "  $0 220 2.2.0              # Set build number to 220 and version to 2.2.0"
    echo ""
    echo -e "${YELLOW}Current values:${NC}"
    CURRENT_BUILD=$(grep "CURRENT_PROJECT_VERSION = " "$PBXPROJ_PATH" | head -1 | sed 's/.*= \(.*\);/\1/')
    CURRENT_VERSION=$(grep "MARKETING_VERSION = " "$PBXPROJ_PATH" | head -1 | sed 's/.*= \(.*\);/\1/')
    echo -e "  Build Number: ${GREEN}$CURRENT_BUILD${NC}"
    echo -e "  Marketing Version: ${GREEN}$CURRENT_VERSION${NC}"
    exit 0
fi

BUILD_NUMBER=$1
MARKETING_VERSION=${2:-""}

# Validate build number
if ! [[ "$BUILD_NUMBER" =~ ^[0-9]+$ ]]; then
    echo -e "${RED}❌ Error: Build number must be a positive integer${NC}"
    exit 1
fi

if [ "$BUILD_NUMBER" -le 100 ]; then
    echo -e "${YELLOW}⚠️  Warning: Build number $BUILD_NUMBER is <= 100${NC}"
    echo -e "${YELLOW}   App Store Connect requires build number > 100${NC}"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo -e "${BLUE}Setting iOS Build Number to: ${GREEN}$BUILD_NUMBER${NC}"

# Update project.pbxproj
sed -i '' "s/CURRENT_PROJECT_VERSION = [0-9]*;/CURRENT_PROJECT_VERSION = $BUILD_NUMBER;/g" "$PBXPROJ_PATH"
echo -e "${GREEN}✅ Updated project.pbxproj${NC}"

# Update Info.plist if it has hardcoded value (instead of variable)
PLIST_VALUE=$(plutil -extract CFBundleVersion raw "$PLIST_PATH" 2>/dev/null || echo "\$(CURRENT_PROJECT_VERSION)")
if [[ "$PLIST_VALUE" != "\$(CURRENT_PROJECT_VERSION)" ]]; then
    plutil -replace CFBundleVersion -string "$BUILD_NUMBER" "$PLIST_PATH"
    echo -e "${GREEN}✅ Updated Info.plist${NC}"
else
    echo -e "${GREEN}✅ Info.plist uses variable (will be set by Xcode)${NC}"
fi

# Update marketing version if provided
if [ ! -z "$MARKETING_VERSION" ]; then
    echo ""
    echo -e "${BLUE}Setting Marketing Version to: ${GREEN}$MARKETING_VERSION${NC}"
    
    sed -i '' "s/MARKETING_VERSION = [^;]*;/MARKETING_VERSION = $MARKETING_VERSION;/g" "$PBXPROJ_PATH"
    echo -e "${GREEN}✅ Updated project.pbxproj${NC}"
    
    PLIST_VERSION=$(plutil -extract CFBundleShortVersionString raw "$PLIST_PATH" 2>/dev/null || echo "\$(MARKETING_VERSION)")
    if [[ "$PLIST_VERSION" != "\$(MARKETING_VERSION)" ]]; then
        plutil -replace CFBundleShortVersionString -string "$MARKETING_VERSION" "$PLIST_PATH"
        echo -e "${GREEN}✅ Updated Info.plist${NC}"
    else
        echo -e "${GREEN}✅ Info.plist uses variable (will be set by Xcode)${NC}"
    fi
fi

echo ""
echo -e "${BLUE}=========================================${NC}"
echo -e "${GREEN}✅ iOS Build Configuration Updated${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""
echo -e "New values:"
echo -e "  Build Number: ${GREEN}$BUILD_NUMBER${NC}"
if [ ! -z "$MARKETING_VERSION" ]; then
    echo -e "  Marketing Version: ${GREEN}$MARKETING_VERSION${NC}"
fi
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Commit these changes: git add . && git commit -m 'Bump iOS build to $BUILD_NUMBER'"
echo "  2. Push to GitHub: git push"
echo "  3. Build the app: npx cap sync ios && npx cap open ios"
echo "  4. In Xcode: Product → Archive"
echo ""
echo -e "${BLUE}To verify the built IPA contains this build number:${NC}"
echo -e "  unzip -p App.ipa \"Payload/*.app/Info.plist\" | plutil -p - | grep CFBundleVersion"
echo ""
