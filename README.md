# InteriorCraft Studio — Interior Design Quotation App

A fully frontend-only web app for generating detailed interior design price quotations. No backend, no database — all product/pricing data lives in local JSON files. The final quotation is generated and downloaded entirely in the browser.

---

## Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or later (includes npm)

### Install & Run

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Project Structure

```
src/
├── data/                   ← All catalog & pricing data (edit these to update prices)
│   ├── categories.json     ← Room/category definitions (Kitchen, Wardrobe, etc.)
│   ├── products.json       ← Products with dimension types and defaults
│   ├── qualityTiers.json   ← Economy / Standard / Premium / Luxury rates per product
│   ├── addons.json         ← Optional add-ons with flat prices
│   ├── settings.json       ← GST %, company details, terms & conditions
│   └── promoCodes.json     ← Discount/promo codes
│
├── components/             ← Reusable UI components
│   ├── Navbar.jsx
│   ├── CartDrawer.jsx
│   ├── FloatingCartBar.jsx
│   ├── CategoryCard.jsx
│   ├── ProductCard.jsx
│   ├── QualityTierSelector.jsx
│   ├── DimensionInput.jsx
│   ├── AddonSelector.jsx
│   ├── PricePreviewBar.jsx
│   ├── QuotationSummary.jsx
│   └── CustomerDetailsForm.jsx
│
├── pages/                  ← Route-level page components
│   ├── Home.jsx
│   ├── CategoriesListPage.jsx
│   ├── CategoryPage.jsx
│   ├── ProductConfigPage.jsx
│   ├── CartPage.jsx
│   └── QuotationPage.jsx
│
├── store/
│   └── cartStore.js        ← Zustand store (localStorage-persisted)
│
├── utils/
│   ├── pricing.js          ← All price calculation logic (single source of truth)
│   └── pdfExport.js        ← Client-side PDF via jsPDF + html2canvas
│
├── App.jsx                 ← Router + layout shell
├── main.jsx
└── index.css               ← Tailwind + custom component styles
```

---

## How to Update Pricing / Products

All data is in `/src/data/`. Edit the JSON files and redeploy.

### Add a new product
1. Add an entry to `products.json` with a unique `id` and the correct `categoryId`
2. Add quality tier entries to `qualityTiers.json` referencing the same `productId`
3. Deploy

### Change a price
Edit `ratePerUnit` in the relevant entry in `qualityTiers.json`.

### Change GST or company details
Edit `settings.json`.

### Add/deactivate a promo code
Edit `promoCodes.json`. Set `"active": false` to disable a code without deleting it.

---

## Pricing Logic

All calculations live in `src/utils/pricing.js`:

```
For area/length-based products:
  quantity  = length × width  (sq ft)  OR  length  (running feet)
  lineTotal = quantity × tier.ratePerUnit + sum(addon prices)

For piece-based products:
  lineTotal = quantity × tier.ratePerUnit + sum(addon prices)

subtotal      = sum(all lineTotals)
discountAmt   = from promo code OR manual %
taxableAmount = subtotal − discountAmt
taxAmount     = taxableAmount × gstPercent / 100
grandTotal    = taxableAmount + taxAmount + installationCharge + transportCharge
```

---

## Build for Production

```bash
npm run build
```

Output goes to `dist/`. This is a completely static site — no server required.

---

## Deployment

### Vercel (recommended — zero config)
```bash
npm install -g vercel
vercel
```
Set output directory to `dist`.

### Netlify
1. `npm run build`
2. Drag the `dist/` folder to [app.netlify.com/drop](https://app.netlify.com/drop)

Or connect your Git repo and set:
- Build command: `npm run build`
- Publish directory: `dist`

Add a `netlify.toml` for SPA routing (already included).

### GitHub Pages
```bash
npm install -g gh-pages
# In package.json add: "homepage": "https://<username>.github.io/<repo>"
npm run build
npx gh-pages -d dist
```

---

## Features

- **6 categories**, **14 products**, **56 quality tiers** pre-loaded with real market rates
- **Live price preview** that updates instantly as you change dimensions/tier/add-ons
- **Cart persisted to localStorage** — survives page refresh
- **Promo codes** validated client-side (try `WELCOME10`, `FLAT5K`, `DEMO`)
- **Final quotation**: itemized breakdown with CGST/SGST split, discount, grand total
- **PDF download** via jsPDF + html2canvas (multi-page support)
- **Print-friendly** CSS (`@media print` hides all UI chrome)
- **WhatsApp & Email share** links pre-filled with quote summary
- Fully **mobile-responsive** with Tailwind CSS

---

## Tech Stack

| Layer | Library |
|---|---|
| Framework | React 18 + Vite |
| Styling | Tailwind CSS v3 |
| Routing | React Router v6 |
| State / Cart | Zustand + persist middleware |
| PDF export | jsPDF + html2canvas |
| Icons | Lucide React |
| Data | Local JSON files |

---

## Future Upgrades (Phase 2)

- Room-by-room multi-room quote builder with summary per room
- 3D room configurator
- Light/dark theme
- Admin JSON preview tool (load JSON → preview cards → export updated JSON)
- Multiple currency support (static conversion rate in `settings.json`)
- Backend + database for storing submitted leads (requires adding an API layer)
