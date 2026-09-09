# Balaji Building Material Supplier (BBMS)

A complete, production-ready, ultra-fast **static website + Progressive Web App (PWA)** built for **Balaji Building Material Supplier**, Tasgaon, Dist. Sangli, Maharashtra.

Runs 100% client-side with no backend or database required, fully deployable to **Cloudflare Pages**.

---

## 1. Business Information

- **Business Name:** Balaji Building Material Supplier (बालाजी बिल्डिंग मटेरियल सप्लायर्स)
- **Location:** Tasgaon, Dist. Sangli, Maharashtra, India - 416312
- **Phone / WhatsApp:** [+91 8484029427](tel:+918484029427)
- **WhatsApp Link:** [https://wa.me/918484029427](https://wa.me/918484029427)
- **UPI Payment ID:** `pujarisudip5@okaxis`
- **Products (Sold per Brass):**
  1. Sand (वाळू - River Sand)
  2. Khadi / Crushed Aggregate (खडी - 10mm, 20mm, 40mm)
  3. Dust Sand / Crush Sand (डस्ट सँड)
  4. Wash Valu / Washed Sand (वॉश वाळू)

---

## 2. Key Features

### 🌐 Bilingual Website (मराठी & English) with 100% Pure Marathi Invoice
- Default language: **Marathi (मराठी)** for local customers; easily toggles to English.
- Selection is remembered in `localStorage`.
- Translates everything: navigation, hero copy, material descriptions, quotation builder, and WhatsApp prefill templates.
- **Invoice Card:** Strictly formatted in **100% pure Marathi only** (`|| श्री दारेश्वर प्रसन्न ||`, `कच्चे बिल / डिलिव्हरी चालन`, etc.) regardless of website UI language.
- Native Devanagari typography with `Noto Sans Devanagari` via Google Fonts.

### 📋 Interactive Quotation Builder
- Customer selects materials via checkboxes and specifies quantity in brass using stepper buttons.
- Real-time calculation of total brass volume.
- Customer enters their name and site/village (e.g. Tasgaon, Vita, Chinchani).
- Single-click **"Send Quotation Request on WhatsApp"** button opens a pre-filled, cleanly formatted WhatsApp message to `+91 8484029427`.

### 🔐 Hidden Owner Panel & PIN Authentication
- **Access Method:** Tapping the footer copyright text **7 times within 3 seconds** or navigating to `#owner` activates the secure PIN prompt.
- **PIN:** `Sudip@622`
- **Security:** The PIN is **never stored in plain text**. Only its `SHA-256` hash (`61648a4dcebd96a87d3f6010c3eaf7d7c9ab46b684f4650dfdba304b2e0dd4ad`) is checked using the browser's native `crypto.subtle.digest`.
- **Lockout Protection:** 5 consecutive failed attempts automatically locks the prompt for 5 minutes.
- **Session Management:** Stored in `sessionStorage` until the browser tab closes, with an instant "Logout" button.

### 🧾 Owner Invoice Generator & Scannable Open UPI QR Code
- **Invoice Number:** Auto-incrementing format `BBM-2026-001` (persisted in `localStorage`).
- **Editable Fields:** Customer Name, Mobile Number, Village/Site, Remarks (e.g. Tipper vehicle number).
- **Dynamic Line Items:** Add/remove items with quantity in brass and custom rate (₹/brass).
- **Auto-Calculations:** Grand Total, Advance Paid, and Balance Due.
- **DOM Invoice Preview:** 100% pure Marathi A5 layout with `|| श्री दारेश्वर प्रसन्न ||`, itemized table, and payment totals.
- **Scannable Open UPI QR Code:** Strictly non-amount driven (allows customer to enter their own payment in Google Pay, PhonePe, Paytm, BHIM, etc.):
  `upi://pay?pa=pujarisudip5@okaxis&pn=Balaji%20Building%20Material%20Supplier&cu=INR&tn=Invoice%20<invoice_no>`
- **Export & Sharing:**
  - `html2canvas` renders a 2x high-resolution PNG image.
  - **Web Share API (`navigator.share`):** Allows direct image sharing to WhatsApp on mobile devices.
  - **Fallback:** Automatically downloads the PNG image and opens a WhatsApp chat with the customer containing payment details and invoice summary.
- **Offline Invoice History:** Invoices saved securely on the owner's device only (`localStorage`). Searchable by customer name, mobile, or bill number.
- **Backup & Restore:** "Export Backup" downloads all invoice records as JSON; "Import Backup" restores them anytime.

### 📱 Progressive Web App (PWA)
- Installable on Android, iOS, and Desktop directly via browser menu options (Chrome/Edge "Install app" or Safari "Add to Home Screen").
- No annoying public in-app install banners shown to casual visitors.
- Hand-written Service Worker (`sw.js`) with cache-first strategy for static assets and offline support.
- Entire Owner Panel and Invoice Generator work **100% offline without internet connection**.

### 🔍 Search Engine Optimization (SEO)
- JSON-LD Structured Data: `LocalBusiness` schema with address, phone, opening hours, and product offers.
- Open Graph and Twitter Card tags with `mr_IN` locale.
- `robots.txt`, `sitemap.xml`, and bilingual `hreflang` tags.

---

## 3. Technology Stack

- **Core:** Pure Vanilla HTML5, CSS3, JavaScript (ES Modules)
- **Bundler:** Vite 5
- **Dependencies:**
  - `html2canvas` (converts invoice DOM to PNG)
  - `qrcode` (generates UPI payment QR codes)
  - `sharp` (dev-dependency for icon generation)
- **Total Bundled JS:** < 75 KB gzipped

---

## 4. Setup & Running Locally

### Prerequisites
- Node.js (v18 or newer)
- npm

### Installation
```bash
# Clone or navigate to the repository
cd BBMS

# Install dependencies
npm install
```

### Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

### Production Build
```bash
npm run build
```
The optimized static build is generated in the `dist/` directory.

### Preview Production Build
```bash
npm run preview
```

---

## 5. Deploying to GitHub Pages (Custom Domain: `balajisuppliers.krishatech.in`)

The project is pre-configured with a GitHub Actions workflow (`.github/workflows/deploy.yml`) and `CNAME` files for `balajisuppliers.krishatech.in`.

### Step 1: Push Repository to GitHub
```bash
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
git push -u origin main
```

### Step 2: Enable GitHub Pages in GitHub Settings
1. Go to your GitHub repository: **Settings** → **Pages**.
2. Under **Build and deployment** → **Source**, select:
   - **GitHub Actions** (Recommended — automatically runs `.github/workflows/deploy.yml` on every push).
3. Under **Custom domain**:
   - Verify `balajisuppliers.krishatech.in` is populated from the `CNAME` file.
   - Check **Enforce HTTPS**.

### Step 3: DNS Configuration for `balajisuppliers.krishatech.in`
In your DNS management provider (for `krishatech.in`), add:
- **Type:** `CNAME`
- **Name / Host:** `balajisuppliers`
- **Target / Value:** `<your-github-username>.github.io` (or your GitHub organization's GitHub Pages domain)
- **TTL:** `Automatic` or `300`

---

## 6. Deploying to Cloudflare Pages (Alternative)

The `dist/` directory is 100% static and requires zero server configuration.

### Option A: Via Cloudflare Dashboard (Git Integration)
1. Push your repository to GitHub or GitLab.
2. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/) and go to **Workers & Pages**.
3. Click **Create Application** → **Pages** → **Connect to Git**.
4. Select your repository.
5. In **Build settings**, configure:
   - **Framework preset:** `Vite`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
6. Click **Save and Deploy**. Custom domain `balajisuppliers.krishatech.in` can be added under **Custom domains**.

### Option B: Direct Upload via Wrangler CLI
```bash
# Build the project
npm run build

# Deploy the dist folder
npx wrangler pages deploy dist --project-name=balaji-building-material
```

---

## 6. License & Copyright

© 2026 Balaji Building Material Supplier, Tasgaon. All rights reserved.
