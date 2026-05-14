/* ============================================================
   VIDA — Payments Configuration
   ------------------------------------------------------------
   Replace TEST keys with LIVE keys before launching.
   ============================================================ */

const PAYMENTS = {
  // ─────────── MOYASAR (Saudi cards / Mada / Apple Pay / STC Pay) ───────────
  // Dashboard: https://dashboard.moyasar.com
  // Get keys from: Settings → API Keys
  moyasar: {
    enabled: true,
    publishable_key: "pk_test_REPLACE_WITH_YOUR_MOYASAR_PUBLISHABLE_KEY",
    // ⚠️ NEVER expose the secret key in client-side code.
    // It is used by your backend / webhook handler only.
    methods: ["creditcard", "applepay", "stcpay"],
    // After successful payment Moyasar redirects here
    callback_url: window.location.origin + "/pages/payment-success.html",
  },

  // ─────────── TABBY (Buy Now, Pay Later — 4 installments) ───────────
  // Dashboard: https://merchant.tabby.ai
  // Get keys from: Settings → API Keys
  tabby: {
    enabled: true,
    public_key: "pk_test_REPLACE_WITH_YOUR_TABBY_PUBLIC_KEY",
    merchant_code: "VIDA_SA",   // Provided by Tabby
    lang: "ar",                 // or "en"
    currency: "SAR",
    min_amount: 100,            // SAR — Tabby usually requires min order amount
    max_amount: 100000,
    installments: 4,
  },

  // ─────────── TAMARA (Buy Now, Pay Later — 3 installments) ───────────
  // Dashboard: https://partners.tamara.co
  // Get keys from: Settings → API Configuration
  tamara: {
    enabled: true,
    public_key: "REPLACE_WITH_YOUR_TAMARA_PUBLIC_KEY",
    country: "SA",
    currency: "SAR",
    min_amount: 100,
    max_amount: 50000,
    installments: 3,
  },

  // ─────────── COD / Bank Transfer / Corporate Invoice ───────────
  cod: { enabled: true, max_amount: 50000 },     // Cash on delivery cap
  bank: {
    enabled: true,
    iban: "SA00 0000 0000 0000 0000 0000",     // Replace with real IBAN
    bank_name_en: "Saudi National Bank",
    bank_name_ar: "البنك الأهلي السعودي",
    account_name: "VIDA Office Furniture",
  },
  invoice: { enabled: true },   // For B2B / government

  // ─────────── Order / Tax / Currency ───────────
  currency: "SAR",
  vat_rate: 0.15,
  shipping_threshold: 5000,
  shipping_fee: 200,

  // ─────────── Backend endpoints (TO BE IMPLEMENTED) ───────────
  // These are the URLs your backend exposes to:
  //   1) Create a Moyasar invoice / payment
  //   2) Create a Tabby checkout session
  //   3) Create a Tamara checkout session
  //   4) Receive webhooks
  api: {
    moyasar_create:  "/api/payments/moyasar/create",
    tabby_create:    "/api/payments/tabby/create",
    tamara_create:   "/api/payments/tamara/create",
    order_create:    "/api/orders/create",
  },
};

window.PAYMENTS = PAYMENTS;
