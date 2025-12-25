# RRRAY App Assets

## Files Created

### SVG Files (Vector Format)
- `icon.svg` - Main app icon (1024x1024)
- `adaptive-icon.svg` - Android adaptive icon (1024x1024)
- `splash.svg` - Splash screen (1284x2778)
- `favicon.svg` - Small favicon (48x48)

### Convert SVG to PNG

You need to convert these SVG files to PNG format:

#### Option 1: Online Converter (Easiest)
1. Go to https://svgtopng.com or https://cloudconvert.com/svg-to-png
2. Upload each SVG file
3. Set dimensions:
   - icon.svg → 1024x1024 pixels
   - adaptive-icon.svg → 1024x1024 pixels
   - splash.svg → 1284x2778 pixels
   - favicon.svg → 48x48 pixels
4. Download as PNG
5. Rename files (remove .svg, keep .png)

#### Option 2: Using Figma (Professional)
1. Go to https://figma.com
2. Create new file
3. Import SVG files
4. Export as PNG with correct dimensions

#### Option 3: Command Line (If you have ImageMagick)
```bash
convert icon.svg -resize 1024x1024 icon.png
convert adaptive-icon.svg -resize 1024x1024 adaptive-icon.png
convert splash.svg -resize 1284x2778 splash.png
convert favicon.svg -resize 48x48 favicon.png
```

## Brand Colors Used
- Primary: #06B6D4 (Teal)
- Secondary: #0891B2 (Dark Teal)
- Accent: #FBBF24 (Yellow/Gold)
- Background: White

## Design Notes
- Clean, professional design
- RRRAY branding with tagline
- Decorative stars for visual interest
- Optimized for both iOS and Android
- Meets all app store requirements
