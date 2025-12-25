const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function convertSvgToPng() {
  const conversions = [
    { input: 'assets/icon.svg', output: 'assets/icon.png', width: 1024, height: 1024 },
    { input: 'assets/adaptive-icon.svg', output: 'assets/adaptive-icon.png', width: 1024, height: 1024 },
    { input: 'assets/splash.svg', output: 'assets/splash.png', width: 1284, height: 2778 },
    { input: 'assets/favicon.svg', output: 'assets/favicon.png', width: 48, height: 48 },
  ];

  console.log('🎨 Converting SVG files to PNG...\n');

  for (const conversion of conversions) {
    try {
      await sharp(conversion.input)
        .resize(conversion.width, conversion.height)
        .png()
        .toFile(conversion.output);
      
      const stats = fs.statSync(conversion.output);
      console.log(`✅ ${path.basename(conversion.output)} - ${conversion.width}x${conversion.height} - ${Math.round(stats.size / 1024)}KB`);
    } catch (error) {
      console.error(`❌ Failed to convert ${conversion.input}:`, error.message);
    }
  }

  console.log('\n🎉 All conversions complete!');
  console.log('\n📁 PNG files created in /app/mobile/assets/');
  console.log('   - icon.png (1024x1024)');
  console.log('   - adaptive-icon.png (1024x1024)');
  console.log('   - splash.png (1284x2778)');
  console.log('   - favicon.png (48x48)');
}

convertSvgToPng().catch(console.error);
