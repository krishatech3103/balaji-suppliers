import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const outDir = path.resolve('public/images');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const images = [
  {
    src: '/home/sandip.pujari@domain.chitaledairy.co.in/.gemini/antigravity-ide/brain/0bca8277-4dd0-44a3-b92f-2e280b71b1c8/river_sand_photo_1788950646727.jpg',
    name: 'sand'
  },
  {
    src: '/home/sandip.pujari@domain.chitaledairy.co.in/.gemini/antigravity-ide/brain/0bca8277-4dd0-44a3-b92f-2e280b71b1c8/khadi_aggregate_photo_1788950663311.jpg',
    name: 'khadi'
  },
  {
    src: '/home/sandip.pujari@domain.chitaledairy.co.in/.gemini/antigravity-ide/brain/0bca8277-4dd0-44a3-b92f-2e280b71b1c8/crush_dust_sand_photo_1788950681072.jpg',
    name: 'crush-sand'
  },
  {
    src: '/home/sandip.pujari@domain.chitaledairy.co.in/.gemini/antigravity-ide/brain/0bca8277-4dd0-44a3-b92f-2e280b71b1c8/wash_valu_photo_1788950720149.jpg',
    name: 'wash-valu'
  },
  {
    src: '/home/sandip.pujari@domain.chitaledairy.co.in/.gemini/antigravity-ide/brain/0bca8277-4dd0-44a3-b92f-2e280b71b1c8/hero_delivery_truck_photo_1788950770663.jpg',
    name: 'hero-truck'
  }
];

async function processImages() {
  for (const img of images) {
    console.log(`Processing ${img.name}...`);
    // Create optimized WebP
    await sharp(img.src)
      .resize(800, 600, { fit: 'cover' })
      .webp({ quality: 85 })
      .toFile(path.join(outDir, `${img.name}.webp`));

    // Create optimized JPG fallback
    await sharp(img.src)
      .resize(800, 600, { fit: 'cover' })
      .jpeg({ quality: 85, progressive: true })
      .toFile(path.join(outDir, `${img.name}.jpg`));
  }
  console.log('All product images processed into public/images successfully!');
}

processImages().catch(console.error);
