import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const publicDir = path.resolve('public');
const iconsDir = path.join(publicDir, 'icons');
const masterImgPath = path.resolve('src/assets/logo-master.jpg');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

async function generateAllIcons() {
  console.log('Generating professional PWA and brand icons from master...');

  // 1. Extract the squircle bounds from 1024x1024 master
  const baseSquare = await sharp(masterImgPath)
    .extract({ left: 32, top: 32, width: 960, height: 960 })
    .resize(512, 512)
    .toBuffer();

  // Transparent squircle mask for standard icon
  const squircleSvg = Buffer.from(`<svg width="512" height="512">
    <rect width="512" height="512" rx="112" ry="112" fill="#ffffff"/>
  </svg>`);

  // Standard 512x512 icon (rounded squircle with clean transparent corners)
  const icon512Buffer = await sharp(baseSquare)
    .composite([{ input: squircleSvg, blend: 'dest-in' }])
    .png()
    .toBuffer();

  await sharp(icon512Buffer).toFile(path.join(iconsDir, 'icon-512.png'));
  console.log('✓ Created icon-512.png');

  // Standard 192x192 icon
  await sharp(icon512Buffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(iconsDir, 'icon-192.png'));
  console.log('✓ Created icon-192.png');

  // Apple Touch Icon 180x180 (Full squircle for iOS)
  await sharp(icon512Buffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(iconsDir, 'apple-touch-icon.png'));
  console.log('✓ Created apple-touch-icon.png');

  // Favicon 32x32
  await sharp(icon512Buffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon-32.png'));
  console.log('✓ Created favicon-32.png');

  // Maskable 512x512 Icon:
  // Must have 100% full-bleed background without transparent corners so Android / Samsung launchers can safely mask.
  // The emblem is scaled within the 80% safe zone circle (radius 204px).
  const emblem420 = await sharp(icon512Buffer)
    .resize(420, 420)
    .toBuffer();

  const maskableSvgBg = Buffer.from(`<svg width="512" height="512">
    <defs>
      <radialGradient id="bg" cx="40%" cy="35%" r="70%">
        <stop offset="0%" stop-color="#fb923c"/>
        <stop offset="50%" stop-color="#ea580c"/>
        <stop offset="100%" stop-color="#9a3412"/>
      </radialGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.3"/>
      </filter>
    </defs>
    <rect width="512" height="512" fill="url(#bg)"/>
  </svg>`);

  const maskableBuffer = await sharp(maskableSvgBg)
    .composite([{
      input: emblem420,
      top: 46,
      left: 46
    }])
    .resize(512, 512)
    .png()
    .toBuffer();

  await sharp(maskableBuffer).toFile(path.join(iconsDir, 'icon-maskable-512.png'));
  console.log('✓ Created icon-maskable-512.png');

  // Embed base64 in SVG for vector-fallback consumers
  const base64Png = icon512Buffer.toString('base64');
  const embeddedSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <image href="data:image/png;base64,${base64Png}" width="512" height="512" />
</svg>`;

  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), embeddedSvg);
  fs.writeFileSync(path.join(iconsDir, 'icon.svg'), embeddedSvg);
  console.log('✓ Created favicon.svg and icon.svg');

  console.log('\nAll professional PWA and branding icons generated successfully!');
}

generateAllIcons().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
