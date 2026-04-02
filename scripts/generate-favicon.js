/**
 * generate-favicon.js
 * Converts assets/favicon.svg → PNG sizes for Expo web export.
 * Run: node scripts/generate-favicon.js
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SRC = path.join(__dirname, '..', 'assets', 'favicon.svg');
const OUT = path.join(__dirname, '..', 'assets');

if (!fs.existsSync(SRC)) {
  console.error('favicon.svg not found at', SRC);
  process.exit(1);
}

const sizes = [16, 32, 48, 64, 180, 192];

Promise.all(
  sizes.map((size) =>
    sharp(SRC)
      .resize(size, size)
      .png()
      .toFile(path.join(OUT, `favicon-${size}.png`))
      .then(() => console.log(`✓ favicon-${size}.png`))
  )
).then(async () => {
  // Main favicon.png (64x64) used by app.json
  await sharp(SRC).resize(64, 64).png().toFile(path.join(OUT, 'favicon.png'));
  console.log('✓ favicon.png (main)');
  console.log('\nAll favicons generated successfully.');
}).catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
