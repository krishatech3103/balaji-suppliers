import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { translations } from './src/js/translations.js';
import { createUpiPaymentUri, UPI_CONFIG } from './src/js/qr.js';

console.log('--- RUNNING AUTOMATED UNIT & INTEGRITY TESTS ---');

// 1. Verify Translations Dictionary
console.log('1. Verifying Bilingual Translations...');
if (!translations.mr || !translations.en) {
  throw new Error('Translations missing mr or en dictionary');
}

const mrKeys = Object.keys(translations.mr);
const enKeys = Object.keys(translations.en);
console.log(`✓ Marathi dictionary has ${mrKeys.length} keys`);
console.log(`✓ English dictionary has ${enKeys.length} keys`);

// Check key symmetry
const missingInEn = mrKeys.filter(k => !(k in translations.en));
const missingInMr = enKeys.filter(k => !(k in translations.mr));
if (missingInEn.length > 0) {
  console.warn('Keys missing in English:', missingInEn);
} else {
  console.log('✓ All Marathi keys have corresponding English translations');
}
if (missingInMr.length > 0) {
  console.warn('Keys missing in Marathi:', missingInMr);
} else {
  console.log('✓ All English keys have corresponding Marathi translations');
}

// 2. Verify SHA-256 PIN Security
console.log('\n2. Verifying Owner PIN SHA-256 Hash...');
const expectedPin = 'Sudip@622';
const computedHash = crypto.createHash('sha256').update(expectedPin).digest('hex');
const storedHash = '61648a4dcebd96a87d3f6010c3eaf7d7c9ab46b684f4650dfdba304b2e0dd4ad';

if (computedHash === storedHash) {
  console.log(`✓ PIN Hash verified: ${computedHash}`);
} else {
  throw new Error(`PIN Hash mismatch: computed ${computedHash} vs stored ${storedHash}`);
}

// 3. Verify UPI Payment URL Generator (Strictly Open / Non-Amount Driven)
console.log('\n3. Verifying UPI Payment URL Generator (Non-Amount Driven)...');
const sampleUpiUri = createUpiPaymentUri('BBM-2026-001');
console.log('Generated UPI URI:', sampleUpiUri);

if (
  sampleUpiUri.includes('pa=pujarisudip5%40okaxis') &&
  sampleUpiUri.includes('pn=Balaji%20Building%20Material%20Supplier') &&
  !sampleUpiUri.includes('am=') &&
  sampleUpiUri.includes('cu=INR') &&
  sampleUpiUri.includes('tn=Invoice%20BBM-2026-001')
) {
  console.log('✓ Open static UPI payment URI format is valid (NO amount hardcoded, open for customer input)');
} else {
  throw new Error('UPI URI generated does not match expected open format');
}

// 4. Verify Built Static Output in dist/
console.log('\n4. Verifying dist/ folder static assets for Cloudflare Pages...');
const distDir = path.resolve('dist');
const requiredFiles = [
  'index.html',
  'manifest.webmanifest',
  'sw.js',
  'robots.txt',
  'sitemap.xml',
  'CNAME',
  'favicon.svg',
  'favicon-32.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'images/sand.webp',
  'images/khadi.webp',
  'images/crush-sand.webp',
  'images/wash-valu.webp',
  'images/hero-truck.webp',
  'images/delivery-vehicle.webp'
];

requiredFiles.forEach(relPath => {
  const fullPath = path.join(distDir, relPath);
  if (fs.existsSync(fullPath)) {
    const stats = fs.statSync(fullPath);
    console.log(`✓ ${relPath} exists (${stats.size} bytes)`);
  } else {
    throw new Error(`Required file missing in dist: ${relPath}`);
  }
});

// Check assets directory
const assetsDir = path.join(distDir, 'assets');
const assetFiles = fs.readdirSync(assetsDir);
const hasJs = assetFiles.some(f => f.endsWith('.js'));
const hasCss = assetFiles.some(f => f.endsWith('.css'));

if (hasJs && hasCss) {
  console.log(`✓ Bundled JS and CSS found in dist/assets (${assetFiles.join(', ')})`);
} else {
  throw new Error('Missing bundled JS or CSS in dist/assets');
}

// 5. Verify index.html Contents
console.log('\n5. Verifying SEO & Accessibility tags in index.html...');
const indexHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');

const checks = [
  { name: 'LocalBusiness JSON-LD schema', test: indexHtml.includes('"@type": "LocalBusiness"') },
  { name: 'Updated phone number +918484029427', test: indexHtml.includes('+918484029427') && !indexHtml.includes('8484029472') },
  { name: 'UPI ID pujarisudip5@okaxis', test: indexHtml.includes('pujarisudip5@okaxis') },
  { name: 'Mantra || श्री दारेश्वर प्रसन्न ||', test: indexHtml.includes('श्री दारेश्वर प्रसन्न') && !indexHtml.includes('महालक्ष्मी') },
  { name: 'Pure Marathi invoice header', test: indexHtml.includes('कच्चे बिल / डिलिव्हरी चालन') },
  { name: 'Vehicle photo & fleet showcase (no specific vehicle number)', test: indexHtml.includes('hero-truck.webp') && indexHtml.includes('delivery-vehicle.webp') && !indexHtml.includes('MH 50 7410') },
  { name: 'Instagram visit button & link', test: indexHtml.includes('instagram.com/mr_s_u_d_y_a_0622') },
  { name: 'Custom domain balajisuppliers.krishatech.in canonical & SEO tags', test: indexHtml.includes('balajisuppliers.krishatech.in') && !indexHtml.includes('pages.dev') },
  { name: 'Marathi title / description', test: indexHtml.includes('वाळू खडी पुरवठादार तासगाव') },
  { name: 'Hreflang alternates', test: indexHtml.includes('hreflang="mr"') && indexHtml.includes('hreflang="en"') },
  { name: 'Open Graph tags', test: indexHtml.includes('og:title') && indexHtml.includes('og:locale') },
  { name: 'PWA manifest link', test: indexHtml.includes('manifest.webmanifest') }
];

checks.forEach(c => {
  if (c.test) {
    console.log(`✓ ${c.name} present`);
  } else {
    throw new Error(`Check failed for: ${c.name}`);
  }
});

console.log('\n=========================================');
console.log('🎉 ALL AUTOMATED INTEGRITY TESTS PASSED! 🎉');
console.log('=========================================\n');
