# VIDA Office Furniture — Website

> A modern, bilingual (Arabic / English), responsive e-commerce site for **VIDA Office Furniture**, a Riyadh-based office furniture company.

[![Status](https://img.shields.io/badge/status-ready_for_deploy-2ea043)](https://github.com)
[![Tech](https://img.shields.io/badge/stack-HTML%20·%20CSS%20·%20JS-blue)](https://github.com)
[![Language](https://img.shields.io/badge/i18n-AR%20|%20EN-c8a55b)](https://github.com)

---

## ✨ Features

- 🌐 **Bilingual (Arabic + English)** with full RTL/LTR support and live language toggle
- 🛒 **Full e-commerce flow** — Browse → Product detail → Cart → Checkout → Order confirmation
- 💳 **5 payment methods** for the Saudi market:
  - **Moyasar** (Visa / Mastercard / Mada / Apple Pay / STC Pay)
  - **Tabby** (4 interest-free installments)
  - **Tamara** (3 installments, Sharia-compliant)
  - Cash on Delivery
  - Bank Transfer + Corporate Invoice
- 📱 **Fully responsive** — mobile / tablet / desktop
- 🎨 **Brand-aligned** — Built to the official Vida brand guidelines (colors, fonts, logo)
- ⚡ **Zero build step** — Pure static HTML / CSS / JS. Drop it on any host.
- 💬 **WhatsApp integration** — Floating button, quote requests, order notifications
- 🗺️ **Google Maps** embed for the Riyadh showroom

---

## 🗂️ Project Structure

```
vida-website/
├── index.html                   ← Home
├── pages/
│   ├── about.html
│   ├── products.html            ← Catalog with category filters
│   ├── product.html             ← Product detail (BNPL badges, gallery)
│   ├── cart.html
│   ├── checkout.html            ← 2-step checkout, 6 payment methods
│   ├── payment-success.html
│   └── contact.html             ← Form + map + WhatsApp
├── css/
│   └── styles.css               ← All styling (brand identity, RTL/LTR, responsive)
├── js/
│   ├── main.js                  ← Header/footer, lang toggle, cart, navigation
│   ├── products.js              ← Product database (40+ items, 9 categories)
│   ├── payments-config.js       ← Gateway keys + tax/shipping config
│   └── payments.js              ← Payment module (Moyasar / Tabby / Tamara / …)
├── images/
│   ├── brand/                   ← Logo (chair symbol + word mark, multi-size, retina)
│   └── pages/                   ← Hero, category, product images
├── favicon-*.png · apple-touch-icon.png
├── PAYMENTS_SETUP.md            ← Complete payment gateway setup guide
└── README.md
```

---

## 🎨 Brand Identity

| Element | Value |
| --- | --- |
| Primary | `#27504E` (Dark Slate Gray) |
| Accent  | `#C8A55B` (Gold) |
| Sage    | `#8EA37E` |
| Bone    | `#F5F2EA` |
| English font | **Poppins** (300–900) |
| Arabic font  | **Tajawal** (300–900) |
| Logo | Remsta armchair silhouette + custom Arabic wordmark |

---

## 🛍️ Product Catalog

The site ships with **40+ products** across **9 categories**:

- CEO Offices · Administrative Offices · Meeting Rooms
- Workstations (with full Bench / Solo / Creative / System / Premium series from the 2025 catalog)
- Chairs · Storage & Filing
- Café · Stadium · School furniture

Product data lives in [`js/products.js`](js/products.js) — edit there to add / remove / re-price products.

---

## 💳 Payments

The Moyasar gateway integrates **client-side** with just a publishable key — no backend required to start collecting card payments.

For Tabby & Tamara (which need a server-side checkout session), a complete copy-paste serverless function example (Netlify / Vercel / Cloudflare Workers) is provided in [`PAYMENTS_SETUP.md`](PAYMENTS_SETUP.md).

To go live:

```bash
# 1. Add real keys in js/payments-config.js
# 2. Update WhatsApp number and IBAN in js/main.js & js/payments-config.js
# 3. Deploy to any static host (Netlify / Vercel / Cloudflare Pages / GitHub Pages)
```

---

## 🚀 Run Locally

```bash
git clone https://github.com/<user>/vida-website.git
cd vida-website

# Any static-file server works. Examples:
python3 -m http.server 8000
# or
npx serve .
```

Then open <http://localhost:8000>.

---

## 🚢 Deploy

This is a 100% static site, so you can drop it on:

- **GitHub Pages** — push to `main`, enable Pages in repo settings, done.
- **Netlify** — `netlify deploy --prod` (no build step needed)
- **Vercel** — `vercel --prod`
- **Cloudflare Pages** — connect the repo, set build output to `/`
- **Any cheap shared host** — just upload via FTP/SFTP

---

## 🌍 Live Showroom

**VIDA Office Furniture** — Riyadh, Saudi Arabia
📍 Abu Bakr Al-Siddiq Street
📞 [0535732765](tel:+966535732765) · 💬 [WhatsApp](https://wa.me/966535732765)
🌐 [vidaaloula.com](https://vidaaloula.com)

---

## 📄 License

Proprietary — All rights reserved © VIDA Office Furniture.

The brand identity (logo, chair symbol, color palette, Arabic wordmark) is owned by VIDA Office Furniture and is **not** licensed for re-use.

The code structure may be referenced for educational purposes, but the brand assets must not be redistributed.
