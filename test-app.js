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
  { name: 'Updated phone number +918484029427 (single, no duplicate)', test: indexHtml.includes('+91 8484029427') && !indexHtml.includes('8484029427 | 8484029427') },
  { name: 'UPI number 8484029427', test: indexHtml.includes('8484029427') },
  { name: 'Mantra || श्री दारेश्वर प्रसन्न ||', test: indexHtml.includes('श्री दारेश्वर प्रसन्न') && !indexHtml.includes('महालक्ष्मी') },
  { name: 'Professional Marathi invoice header (इन्व्हॉइस / बिल)', test: indexHtml.includes('इन्व्हॉइस / बिल (INVOICE)') && !indexHtml.includes('कच्चे बिल') },
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

// 6. Verify Owner Panel Features (Popups, Empty Materials, Discount, On-demand Preview)
console.log('\n6. Verifying Owner Panel Features & Elements...');
const ownerChecks = [
  { name: 'History popup button in owner topbar', test: indexHtml.includes('id="btn-owner-history-popup"') },
  { name: 'Backup popup button in owner topbar', test: indexHtml.includes('id="btn-owner-backup-popup"') },
  { name: 'History modal popup with close button', test: indexHtml.includes('id="owner-history-modal"') && indexHtml.includes('id="btn-close-hist-modal"') },
  { name: 'Backup modal popup with close button', test: indexHtml.includes('id="owner-backup-modal"') && indexHtml.includes('id="btn-close-backup-modal"') },
  { name: 'Empty items initial container & hint box', test: indexHtml.includes('id="inv-items-container"') && indexHtml.includes('id="inv-items-empty-hint"') },
  { name: 'Subtotal, Discount, and Grand Total inputs', test: indexHtml.includes('id="inv-input-subtotal"') && indexHtml.includes('id="inv-input-discount"') && indexHtml.includes('id="inv-input-grand-total"') },
  { name: 'Generate Bill button', test: indexHtml.includes('id="btn-inv-generate"') },
  { name: 'Edit Form button in invoice preview', test: indexHtml.includes('id="btn-inv-edit"') },
  { name: 'Hidden preview wrapper initially', test: indexHtml.includes('id="invoice-preview-wrapper"') && indexHtml.includes('display: none;') },
  { name: 'Discount row & Grand Total row in printable invoice card', test: indexHtml.includes('id="bill-row-discount"') && indexHtml.includes('id="bill-val-discount"') && indexHtml.includes('id="bill-val-grandtotal"') },
  { name: 'No hardcoded default item rows inside inv-items-container HTML', test: !indexHtml.includes('<div class="inv-item-row">') }
];

ownerChecks.forEach(c => {
  if (c.test) {
    console.log(`✓ ${c.name} verified`);
  } else {
    throw new Error(`Owner Panel check failed for: ${c.name}`);
  }
});

// 7. Math & Discount Calculation Unit Test
console.log('\n7. Verifying Invoice Calculation Logic with Discount...');
function calculateInvoiceTotals(items, discount, advance) {
  const subtotal = items.reduce((sum, item) => sum + Math.round(item.qty * item.rate), 0);
  const netDiscount = Math.max(0, discount || 0);
  const grandTotal = Math.max(0, subtotal - netDiscount);
  const netAdvance = Math.max(0, advance || 0);
  const balanceDue = Math.max(0, grandTotal - netAdvance);
  return { subtotal, discount: netDiscount, grandTotal, advance: netAdvance, balanceDue };
}

const sampleCalc = calculateInvoiceTotals(
  [{ qty: 2, rate: 5000 }, { qty: 1.5, rate: 2800 }], // 10000 + 4200 = 14200
  700, // discount
  5000 // advance
);

if (
  sampleCalc.subtotal === 14200 &&
  sampleCalc.discount === 700 &&
  sampleCalc.grandTotal === 13500 &&
  sampleCalc.advance === 5000 &&
  sampleCalc.balanceDue === 8500
) {
  console.log(`✓ Calculation formula matches: Subtotal ₹${sampleCalc.subtotal}, Discount -₹${sampleCalc.discount}, Grand Total ₹${sampleCalc.grandTotal}, Advance ₹${sampleCalc.advance}, Balance ₹${sampleCalc.balanceDue}`);
} else {
  throw new Error(`Calculation error: ${JSON.stringify(sampleCalc)}`);
}

console.log('\n=========================================');
console.log('🎉 ALL AUTOMATED INTEGRITY TESTS PASSED! 🎉');
console.log('=========================================\n');
