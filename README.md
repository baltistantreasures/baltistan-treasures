# Baltistan Treasures

Static product catalogue. No cart, no checkout. Customers order on WhatsApp and pay cash on delivery.

## Structure

```
baltistan-treasures/
├── index.html                 Page layout
├── favicon.png, apple-touch-icon.png
├── vercel.json                Vercel settings (clean URLs, caching)
├── assets/
│   ├── images/                Logo (brown, light, mark) and hero photo
│   ├── css/styles.css         All styling
│   └── js/
│       ├── config.js          WhatsApp number, social links, delivery note  ← edit this
│       └── app.js             Product grid, filters, search, WhatsApp order messages
├── data/
│   ├── products_export.csv    Your Shopify export
│   └── products.js            Product data the site reads (generated from the CSV)
└── scripts/
    └── csv_to_products.py     Rebuilds data/products.js from the CSV
```

## Before going live

Open `assets/js/config.js` and set `whatsappNumber` (digits only, e.g. `923001234567`), `phoneDisplay`, `email`, and your social links. Empty links are hidden automatically.

## Deploy on Vercel

Option A, via GitHub: push this folder to a GitHub repo, then on vercel.com choose Add New → Project → import the repo. Framework preset: **Other**. Leave build command and output directory empty. Deploy.

Option B, via terminal:
```
npm i -g vercel
cd baltistan-treasures
vercel --prod
```

## Updating products or prices

Export products from Shopify again, replace `data/products_export.csv`, then run:
```
python3 scripts/csv_to_products.py data/products_export.csv
```
Commit and push; Vercel redeploys on its own. Only products with status `active` are shown.

## Images

Product photos currently load from Shopify's CDN (the links in your CSV). If you close the Shopify store those links may stop working, so download the photos into an `images/` folder and point the `images` entries in `data/products.js` to `/images/your-file.jpg`.

## Order links

Each product opens WhatsApp with a pre-written message: product, chosen size or colour, quantity, total, and blank lines for name, address, city and phone. Product popups can be shared directly, e.g. `yoursite.com/#walnuts`.
