import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ea580c" />
      <stop offset="50%" stop-color="#f97316" />
      <stop offset="100%" stop-color="#c2410c" />
    </linearGradient>
    <linearGradient id="truckGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#f1f5f9" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fde047" />
      <stop offset="100%" stop-color="#eab308" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.3"/>
    </filter>
  </defs>

  <!-- Background rounded rect -->
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)"/>

  <!-- Subtle texture lines -->
  <path d="M0 400 L512 280 L512 512 L0 512 Z" fill="#000000" opacity="0.08"/>
  <circle cx="440" cy="80" r="140" fill="#ffffff" opacity="0.06"/>

  <!-- Inner glowing circle/shield -->
  <g filter="url(#shadow)">
    <!-- Sand / Material Pile in Tipper Bed -->
    <path d="M120 250 Q180 170 270 210 Q310 190 350 250 Z" fill="url(#goldGrad)"/>

    <!-- Tipper Truck Body -->
    <!-- Dumper Bed -->
    <path d="M100 240 L285 240 L285 320 L115 320 L95 250 Z" fill="url(#truckGrad)"/>
    <path d="M120 255 L270 255 L270 305 L130 305 Z" fill="#e2e8f0" opacity="0.6"/>

    <!-- Cab -->
    <path d="M295 220 L360 220 L405 280 L405 330 L295 330 Z" fill="url(#truckGrad)"/>

    <!-- Cab Window -->
    <path d="M310 235 L355 235 L385 275 L310 275 Z" fill="#0f172a" opacity="0.85"/>

    <!-- Cab Grille / Bumper -->
    <rect x="390" y="295" width="20" height="25" rx="4" fill="#64748b"/>
    <circle cx="400" cy="305" r="4" fill="#fde047"/>

    <!-- Truck Underbody / Chassis -->
    <rect x="105" y="320" width="295" height="15" rx="4" fill="#334155"/>

    <!-- Wheels -->
    <!-- Back Wheel 1 -->
    <circle cx="155" cy="345" r="38" fill="#1e293b"/>
    <circle cx="155" cy="345" r="22" fill="#94a3b8"/>
    <circle cx="155" cy="345" r="10" fill="#0f172a"/>

    <!-- Back Wheel 2 -->
    <circle cx="235" cy="345" r="38" fill="#1e293b"/>
    <circle cx="235" cy="345" r="22" fill="#94a3b8"/>
    <circle cx="235" cy="345" r="10" fill="#0f172a"/>

    <!-- Front Wheel -->
    <circle cx="365" cy="345" r="38" fill="#1e293b"/>
    <circle cx="365" cy="345" r="22" fill="#94a3b8"/>
    <circle cx="365" cy="345" r="10" fill="#0f172a"/>

    <!-- Bold "B" Branding Badge in the sky -->
    <circle cx="160" cy="140" r="54" fill="#ffffff" filter="url(#shadow)"/>
    <path d="M142 105 L164 105 C178 105 186 112 186 122 C186 130 180 135 172 138 C182 141 189 148 189 159 C189 171 179 179 164 179 L142 179 Z M156 118 L156 135 L164 135 C170 135 173 131 173 126 C173 121 170 118 164 118 Z M156 148 L156 166 L165 166 C172 166 175 162 175 157 C175 152 171 148 165 148 Z" fill="#ea580c"/>

    <!-- Small Text / Star -->
    <path d="M245 125 L250 138 L264 138 L253 147 L257 160 L245 151 L233 160 L237 147 L226 138 L240 138 Z" fill="#fde047"/>
    <path d="M285 120 L290 133 L304 133 L293 142 L297 155 L285 146 L273 155 L277 142 L266 133 L280 133 Z" fill="#fde047" transform="scale(0.8) translate(70, 20)"/>
  </g>

  <!-- Bottom Brand Text Accent -->
  <text x="256" y="440" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="34" fill="#ffffff" text-anchor="middle" letter-spacing="2">BALAJI B.M.</text>
  <text x="256" y="472" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="19" fill="#fde047" text-anchor="middle" letter-spacing="1">TASGAON</text>
</svg>`;

const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" fill="#ea580c"/>
  <g transform="translate(51, 51) scale(0.8)">
    ${iconSvg.replace('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">', '').replace('</svg>', '')}
  </g>
</svg>`;

const publicDir = path.resolve('public');
const iconsDir = path.join(publicDir, 'icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Write SVG icons
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), iconSvg);
fs.writeFileSync(path.join(iconsDir, 'icon.svg'), iconSvg);

async function generatePngs() {
  const svgBuffer = Buffer.from(iconSvg);
  const maskableBuffer = Buffer.from(maskableSvg);

  // 192x192
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(iconsDir, 'icon-192.png'));

  // 512x512
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(iconsDir, 'icon-512.png'));

  // Maskable 512x512
  await sharp(maskableBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(iconsDir, 'icon-maskable-512.png'));

  // Apple Touch Icon 180x180
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(iconsDir, 'apple-touch-icon.png'));

  // Favicon 32x32
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon-32.png'));

  console.log('All icons generated successfully!');
}

generatePngs().catch(console.error);
