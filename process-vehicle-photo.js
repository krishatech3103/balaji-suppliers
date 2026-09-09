import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const srcImg = '/home/sandip.pujari@domain.chitaledairy.co.in/.gemini/antigravity-ide/brain/0bca8277-4dd0-44a3-b92f-2e280b71b1c8/.user_uploaded/media_1788952747180.jpg';

async function processVehicle() {
  console.log('Processing uploaded vehicle photo...');
  const metadata = await sharp(srcImg).metadata();
  console.log('Source image dimensions:', metadata.width, 'x', metadata.height);

  // Generate hero-truck.webp & hero-truck.jpg
  await sharp(srcImg)
    .resize(900, null, { withoutEnlargement: true })
    .webp({ quality: 88 })
    .toFile('public/images/hero-truck.webp');
  console.log('✓ Created public/images/hero-truck.webp');

  await sharp(srcImg)
    .resize(900, null, { withoutEnlargement: true })
    .jpeg({ quality: 90 })
    .toFile('public/images/hero-truck.jpg');
  console.log('✓ Created public/images/hero-truck.jpg');

  // Also save a dedicated delivery-vehicle asset
  await sharp(srcImg)
    .resize(900, null, { withoutEnlargement: true })
    .webp({ quality: 88 })
    .toFile('public/images/delivery-vehicle.webp');
  console.log('✓ Created public/images/delivery-vehicle.webp');

  await sharp(srcImg)
    .resize(900, null, { withoutEnlargement: true })
    .jpeg({ quality: 90 })
    .toFile('public/images/delivery-vehicle.jpg');
  console.log('✓ Created public/images/delivery-vehicle.jpg');

  console.log('Vehicle processing complete!');
}

processVehicle().catch(err => {
  console.error(err);
  process.exit(1);
});
