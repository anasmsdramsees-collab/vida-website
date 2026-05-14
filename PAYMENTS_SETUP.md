# 💳 VIDA — دليل إعداد بوابات الدفع
## Payment Gateways Setup Guide

هذا الموقع مدمج معاه **٥ طرق دفع** للسوق السعودي:

| البوابة | يدعم | الرسوم التقريبية | الموقع |
|---|---|---|---|
| **Moyasar** | Visa, Mastercard, مدى, Apple Pay, STC Pay | 2.4% + 1 ر.س | [moyasar.com](https://moyasar.com) |
| **Tabby** | تقسيط على 4 دفعات | عمولة من العميل | [tabby.ai/sa](https://tabby.ai/sa) |
| **Tamara** | تقسيط على 3 دفعات (شرعي) | عمولة من المتجر | [tamara.co](https://tamara.co) |
| **COD** | الدفع عند الاستلام | 0 | داخلي |
| **Bank Transfer** | تحويل بنكي + IBAN | 0 | داخلي |

---

## 🚀 خطوات التفعيل (Step-by-step)

### 1️⃣ Moyasar (الأهم — مدى + بطاقات + Apple Pay)

1. سجل حساب: https://dashboard.moyasar.com/signup
2. أرسل أوراق السجل التجاري لتفعيل الحساب (1-3 أيام عمل)
3. روح على **Settings → API Keys** وانسخ:
   - `Publishable Key (pk_live_...)`
   - `Secret Key (sk_live_...)` — **سرّي، لا تعرضه في كود الـ frontend**
4. افتح ملف `js/payments-config.js` وعدّل:

```javascript
moyasar: {
  enabled: true,
  publishable_key: "pk_live_ضع_مفتاحك_هنا",
  ...
}
```

5. (اختياري — للأمان) ثبّت webhook على:
   - Dashboard → Webhooks → Add: `https://vidaaloula.com/api/webhooks/moyasar`
   - دا يحتاج backend بسيط (PHP/Node.js) للتحقق من الدفع.

### 2️⃣ Tabby (تقسيط 4 دفعات)

1. سجل تاجر: https://merchant.tabby.ai/register
2. حساب البنك + سجل تجاري ضروريين للتسجيل
3. بعد التفعيل، خد:
   - `Public Key`
   - `Secret Key`
   - `Merchant Code`
4. عدّل في `js/payments-config.js`:

```javascript
tabby: {
  enabled: true,
  public_key: "pk_live_ضع_مفتاحك_هنا",
  merchant_code: "كود_التاجر",
  ...
}
```

⚠️ Tabby محتاج backend عشان يخلق checkout session — انظر قسم "Backend Integration" أسفل.

### 3️⃣ Tamara (تقسيط 3 دفعات)

1. سجل: https://partners.tamara.co
2. خد `Public Key` و `Notification Key`
3. عدّل في `js/payments-config.js`:

```javascript
tamara: {
  enabled: true,
  public_key: "ضع_مفتاحك_هنا",
  ...
}
```

### 4️⃣ تفاصيل البنك (للتحويلات البنكية)

عدّل في `js/payments-config.js`:

```javascript
bank: {
  enabled: true,
  iban: "SA00 1234 5678 9012 3456 7890",   // ضع IBAN الحقيقي
  bank_name_en: "Saudi National Bank",
  bank_name_ar: "البنك الأهلي السعودي",
  account_name: "VIDA Office Furniture",
}
```

### 5️⃣ رقم الواتساب وبيانات الاتصال

افتح `js/main.js` وعدّل:

```javascript
const VIDA = {
  whatsapp: "966535732765",          // ✅ الرقم اللي بتستقبل عليه الطلبات
  phone:    "0535732765",
  email:    "info@vidaaloula.com",
  ...
};
```

---

## 🔧 Backend Integration (مهم لـ Tabby/Tamara)

الموقع الحالي **Static HTML**، يعني شغّال بدون سيرفر. ده ينفع لـ:
- ✅ Moyasar (يشتغل client-side بـ publishable key)
- ✅ COD / Bank Transfer / Invoice (مفيش دفع أونلاين)
- ❌ Tabby و Tamara (محتاجين backend يخلق checkout session)

### الحل: serverless functions (مجاني وسريع)

**الخيار الأبسط: Netlify Functions** أو **Vercel Functions** أو **Cloudflare Workers**.

#### مثال Node.js (Netlify/Vercel) — `api/payments/tabby/create.js`

```javascript
// تشغيل: npm install node-fetch
exports.handler = async (event) => {
  const order = JSON.parse(event.body);

  const res = await fetch("https://api.tabby.ai/api/v2/checkout", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + process.env.TABBY_SECRET_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      payment: {
        amount: order.total.toFixed(2),
        currency: "SAR",
        buyer: {
          phone: order.customer.phone,
          email: order.customer.email,
          name:  order.customer.name,
        },
        order: {
          reference_id: order.id,
          items: order.items.map(it => ({
            title: it.name.en,
            quantity: it.qty,
            unit_price: it.price.toFixed(2),
            reference_id: it.id,
          })),
        },
        shipping_address: {
          city: order.customer.city || "Riyadh",
          address: order.customer.address,
        },
      },
      lang: "ar",
      merchant_code: process.env.TABBY_MERCHANT_CODE,
      merchant_urls: {
        success: "https://vidaaloula.com/pages/payment-success.html?order=" + order.id,
        cancel:  "https://vidaaloula.com/pages/checkout.html",
        failure: "https://vidaaloula.com/pages/checkout.html?failed=1",
      },
    }),
  });

  const data = await res.json();
  return {
    statusCode: 200,
    body: JSON.stringify({ checkout_url: data.configuration.available_products.installments[0].web_url }),
  };
};
```

#### مثال مماثل لـ Tamara — `api/payments/tamara/create.js`

```javascript
exports.handler = async (event) => {
  const order = JSON.parse(event.body);
  const res = await fetch("https://api.tamara.co/checkout", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + process.env.TAMARA_API_TOKEN,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      order_reference_id: order.id,
      total_amount: { amount: order.total.toFixed(2), currency: "SAR" },
      consumer: {
        first_name: order.customer.name.split(" ")[0],
        last_name:  order.customer.name.split(" ").slice(1).join(" "),
        phone_number: order.customer.phone,
        email: order.customer.email,
      },
      shipping_address: {
        first_name: order.customer.name,
        line1: order.customer.address,
        city: order.customer.city || "Riyadh",
        country_code: "SA",
      },
      items: order.items.map(it => ({
        reference_id: it.id,
        type: "Physical",
        name: it.name.en,
        quantity: it.qty,
        unit_price: { amount: it.price.toFixed(2), currency: "SAR" },
        total_amount: { amount: it.line_total.toFixed(2), currency: "SAR" },
      })),
      country_code: "SA",
      payment_type: "PAY_BY_INSTALMENTS",
      instalments: 3,
      merchant_url: {
        success: "https://vidaaloula.com/pages/payment-success.html",
        failure: "https://vidaaloula.com/pages/checkout.html?failed=1",
        cancel:  "https://vidaaloula.com/pages/checkout.html",
        notification: "https://vidaaloula.com/api/webhooks/tamara",
      },
    }),
  });
  const data = await res.json();
  return { statusCode: 200, body: JSON.stringify({ checkout_url: data.checkout_url }) };
};
```

### بعد إنشاء الـ functions:

1. ارفع المشروع على **Netlify** أو **Vercel**
2. ضيف الـ environment variables:
   - `TABBY_SECRET_KEY=sk_live_...`
   - `TABBY_MERCHANT_CODE=VIDA_SA`
   - `TAMARA_API_TOKEN=...`
   - `MOYASAR_SECRET_KEY=sk_live_...` (للـ webhook فقط)
3. افتح `js/payments.js` وفكّ الكومنت من الكود اللي بيستدعي `/api/payments/...`

---

## 🧪 الاختبار (Testing)

### Moyasar Test Cards
- **بطاقة ناجحة:** `4111 1111 1111 1111`، CVC: `123`، تاريخ: أي شهر مستقبلي
- **بطاقة فاشلة:** `4242 4242 4242 4242`
- **مدى ناجح:** `4464 1304 9700 0019`

### Tabby Test
- استخدم `pk_test_...` ثم رقم جوال: `+966500000001`

### Tamara Test
- استخدم Test API token من dashboard التطوير

---

## 📋 Checklist قبل الإطلاق

- [ ] Moyasar: حساب live + KYC مكتمل
- [ ] Moyasar: `pk_live_...` في `payments-config.js`
- [ ] Tabby: عقد موقّع + merchant code
- [ ] Tamara: عقد موقّع + API token
- [ ] IBAN البنكي صحيح في `payments-config.js`
- [ ] رقم الواتساب صحيح في `main.js`
- [ ] SSL certificate شغّال (HTTPS) — مطلوب لكل البوابات
- [ ] Backend serverless functions متنشرة (لو هتستخدم Tabby/Tamara)
- [ ] Webhook URLs مضافة في dashboards الـ gateways
- [ ] صفحة Privacy Policy و Terms & Conditions
- [ ] شعار الشهادة الضريبية مضاف للفوتر (للسعودية)

---

## 💰 ملاحظات حول التسعير والعمولات

| البوابة | عمولة |
|---|---|
| **Moyasar** | ~2.4% + 1 ر.س للعملية (مدى أرخص: 1% + 1 ر.س) |
| **Tabby** | بياخدوا عمولتهم من العميل، المتجر بياخد كامل المبلغ |
| **Tamara** | ~5-7% من قيمة الطلب (تختلف حسب الباقة) |
| **COD** | تكلفة استرجاع لو رفض العميل (~50 ر.س للطلب) |

> 💡 **نصيحة:** لو منتجاتك غالية (مكاتب 10,000+ ر.س)، **Tabby و Tamara هيرفعوا المبيعات** لأن الناس بتفضّل تقسيط على دفع كاش.

---

## 🆘 الدعم الفني

- **Moyasar Support:** support@moyasar.com — رد سريع جداً
- **Tabby Merchant Support:** sa-support@tabby.ai
- **Tamara Partners:** partners@tamara.co

---

🎉 **بكده الموقع جاهز يستقبل المدفوعات الحقيقية!**
