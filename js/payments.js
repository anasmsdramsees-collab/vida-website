/* ============================================================
   VIDA — Payments Module
   Handles Moyasar / Tabby / Tamara / COD / Bank / Invoice
   ============================================================ */

const Payments = {

  // Build the list of payment options the UI should render
  availableMethods(total) {
    const out = [];
    if (PAYMENTS.moyasar.enabled) {
      out.push({
        id: "moyasar",
        name_en: "Credit Card / Mada / Apple Pay",
        name_ar: "بطاقة ائتمانية / مدى / Apple Pay",
        desc_en: "Secure payment via Moyasar — Visa, Mastercard, Mada, STC Pay & Apple Pay accepted.",
        desc_ar: "دفع آمن عبر Moyasar — Visa، Mastercard، مدى، STC Pay و Apple Pay.",
        badge: "moyasar",
      });
    }
    if (PAYMENTS.tabby.enabled && total >= PAYMENTS.tabby.min_amount && total <= PAYMENTS.tabby.max_amount) {
      out.push({
        id: "tabby",
        name_en: `Tabby — Pay in ${PAYMENTS.tabby.installments} interest-free installments`,
        name_ar: `Tabby — اقسّم على ${PAYMENTS.tabby.installments} دفعات بدون فوائد`,
        desc_en: `${this.fmtAmount(total / PAYMENTS.tabby.installments)} × ${PAYMENTS.tabby.installments}. No fees, no interest.`,
        desc_ar: `${this.fmtAmount(total / PAYMENTS.tabby.installments)} × ${PAYMENTS.tabby.installments}. بدون رسوم أو فوائد.`,
        badge: "tabby",
      });
    }
    if (PAYMENTS.tamara.enabled && total >= PAYMENTS.tamara.min_amount && total <= PAYMENTS.tamara.max_amount) {
      out.push({
        id: "tamara",
        name_en: `Tamara — Split in ${PAYMENTS.tamara.installments} payments, 0% interest`,
        name_ar: `تمارا — قسّم على ${PAYMENTS.tamara.installments} دفعات، 0٪ فوائد`,
        desc_en: `${this.fmtAmount(total / PAYMENTS.tamara.installments)} × ${PAYMENTS.tamara.installments}. Sharia-compliant.`,
        desc_ar: `${this.fmtAmount(total / PAYMENTS.tamara.installments)} × ${PAYMENTS.tamara.installments}. متوافق مع الشريعة.`,
        badge: "tamara",
      });
    }
    if (PAYMENTS.cod.enabled && total <= PAYMENTS.cod.max_amount) {
      out.push({
        id: "cod",
        name_en: "Cash on Delivery",
        name_ar: "الدفع عند الاستلام",
        desc_en: "Pay in cash or by card when furniture is delivered.",
        desc_ar: "ادفع نقداً أو بالبطاقة عند تسليم الأثاث.",
        badge: "cash",
      });
    }
    if (PAYMENTS.bank.enabled) {
      out.push({
        id: "bank",
        name_en: "Bank Transfer",
        name_ar: "تحويل بنكي",
        desc_en: "We'll email bank details after order confirmation.",
        desc_ar: "هنرسل تفاصيل الحساب البنكي بعد تأكيد الطلب.",
        badge: "bank",
      });
    }
    if (PAYMENTS.invoice.enabled) {
      out.push({
        id: "invoice",
        name_en: "Corporate Invoice / Government PO",
        name_ar: "فاتورة شركة / أمر شراء حكومي",
        desc_en: "Official tax invoice issued. NET-30 terms available for verified clients.",
        desc_ar: "فاتورة ضريبية رسمية. شروط دفع NET-30 للجهات المعتمدة.",
        badge: "invoice",
      });
    }
    return out;
  },

  fmtAmount(n) {
    const lang = (localStorage.getItem("vida_lang") || "en");
    const s = Number(n).toLocaleString(lang === "ar" ? "ar-SA" : "en-US", { maximumFractionDigits: 0 });
    return lang === "ar" ? `${s} ر.س` : `SAR ${s}`;
  },

  // Badge SVGs / labels
  badgeHTML(kind) {
    const colors = {
      moyasar: { bg: "#00B8D9", text: "Moyasar" },
      tabby:   { bg: "#3BFFC1", text: "tabby"   },
      tamara:  { bg: "#FFD200", text: "tamara"  },
      cash:    { bg: "#27504E", text: "Cash"    },
      bank:    { bg: "#646F75", text: "Bank"    },
      invoice: { bg: "#502729", text: "PO"      },
    };
    const c = colors[kind] || colors.cash;
    const fg = (kind === "tabby" || kind === "tamara") ? "#000" : "#fff";
    return `<span style="background:${c.bg};color:${fg};padding:4px 10px;border-radius:6px;font-size:.7rem;font-weight:800;letter-spacing:.04em;text-transform:lowercase;">${c.text}</span>`;
  },

  // ───────────────────────────────────────────────
  // MOYASAR: drop-in form rendered inside a container
  // Works fully client-side with publishable key.
  // ───────────────────────────────────────────────
  async loadMoyasarSDK() {
    if (window.Moyasar) return;
    return new Promise((resolve, reject) => {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = "https://cdn.moyasar.com/mpf/1.14.0/moyasar.css";
      document.head.appendChild(css);

      const s = document.createElement("script");
      s.src = "https://cdn.moyasar.com/mpf/1.14.0/moyasar.js";
      s.onload = resolve;
      s.onerror = () => reject(new Error("Moyasar SDK failed to load"));
      document.head.appendChild(s);
    });
  },

  async renderMoyasar(container, order) {
    await this.loadMoyasarSDK();
    container.innerHTML = '<div class="mysr-form"></div>';

    // Moyasar takes amount in halalas (1 SAR = 100 halalas)
    Moyasar.init({
      element: ".mysr-form",
      amount: Math.round(order.total * 100),
      currency: PAYMENTS.currency,
      description: `VIDA Order ${order.id} — ${order.items.length} items`,
      publishable_api_key: PAYMENTS.moyasar.publishable_key,
      callback_url: PAYMENTS.moyasar.callback_url + "?order=" + encodeURIComponent(order.id),
      methods: PAYMENTS.moyasar.methods,
      metadata: { order_id: order.id, customer: order.customer.name },
      on_completed: function (payment) {
        // Optional: send to backend for verification
        return Promise.resolve();
      },
    });
  },

  // ───────────────────────────────────────────────
  // TABBY: requires backend to create a session.
  // For static-site MVP we open Tabby's promo widget
  // and redirect via the merchant link your backend returns.
  // ───────────────────────────────────────────────
  async renderTabby(container, order) {
    const lang = (localStorage.getItem("vida_lang") || "en");

    // 1. Show promo / installment breakdown
    container.innerHTML = `
      <div style="border:1px solid var(--vida-line); border-radius: var(--r); padding: 20px; background:#F1FFF8;">
        <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
          ${this.badgeHTML("tabby")}
          <strong>${lang==="ar"?`اقسم على ${PAYMENTS.tabby.installments} دفعات بدون فوائد`:`Pay in ${PAYMENTS.tabby.installments} interest-free installments`}</strong>
        </div>
        <div id="tabbyBreakdown" style="display:grid; grid-template-columns: repeat(${PAYMENTS.tabby.installments}, 1fr); gap:8px; margin: 12px 0;">
          ${Array.from({length: PAYMENTS.tabby.installments}, (_, i) => `
            <div style="text-align:center; padding:10px; background:#fff; border-radius:var(--r-sm); border:1px solid var(--vida-line);">
              <div style="font-size:.75rem; color:var(--text-mute);">${lang==="ar"?"الدفعة":"Payment"} ${i+1}</div>
              <div style="font-weight:700; color:var(--vida-darker);">${this.fmtAmount(order.total / PAYMENTS.tabby.installments)}</div>
              <div style="font-size:.7rem; color:var(--text-mute);">${i===0?(lang==="ar"?"اليوم":"Today"):(lang==="ar"?`بعد ${i} شهر`:`+${i} month`)}</div>
            </div>
          `).join("")}
        </div>
        <button type="button" id="tabbyBtn" class="btn btn--primary" style="width:100%; justify-content:center; background:#3BFFC1; color:#000;">
          ${lang==="ar"?"المتابعة عبر Tabby":"Continue with Tabby"} →
        </button>
        <p class="muted" style="font-size:.75rem; margin-top: 10px; text-align:center;">
          ${lang==="ar"?"الموافقة في ثوانٍ. لا فوائد، لا رسوم خفية.":"Approval in seconds. No interest, no hidden fees."}
        </p>
      </div>
    `;

    document.getElementById("tabbyBtn").addEventListener("click", async () => {
      // ─── PRODUCTION: call your backend ───
      // const res = await fetch(PAYMENTS.api.tabby_create, { method:"POST", body: JSON.stringify(order) });
      // const { checkout_url } = await res.json();
      // window.location.href = checkout_url;

      // ─── MVP / DEMO: redirect to checkout success and notify backoffice via WhatsApp ───
      Payments.demoCheckoutRedirect("tabby", order);
    });
  },

  // ───────────────────────────────────────────────
  // TAMARA: similar to Tabby
  // ───────────────────────────────────────────────
  async renderTamara(container, order) {
    const lang = (localStorage.getItem("vida_lang") || "en");

    container.innerHTML = `
      <div style="border:1px solid var(--vida-line); border-radius: var(--r); padding: 20px; background:#FFFCEC;">
        <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
          ${this.badgeHTML("tamara")}
          <strong>${lang==="ar"?`قسّم على ${PAYMENTS.tamara.installments} دفعات بدون فوائد`:`Split in ${PAYMENTS.tamara.installments} interest-free payments`}</strong>
        </div>
        <div style="display:grid; grid-template-columns: repeat(${PAYMENTS.tamara.installments}, 1fr); gap:8px; margin: 12px 0;">
          ${Array.from({length: PAYMENTS.tamara.installments}, (_, i) => `
            <div style="text-align:center; padding:10px; background:#fff; border-radius:var(--r-sm); border:1px solid var(--vida-line);">
              <div style="font-size:.75rem; color:var(--text-mute);">${lang==="ar"?"الدفعة":"Payment"} ${i+1}</div>
              <div style="font-weight:700; color:var(--vida-darker);">${this.fmtAmount(order.total / PAYMENTS.tamara.installments)}</div>
              <div style="font-size:.7rem; color:var(--text-mute);">${i===0?(lang==="ar"?"اليوم":"Today"):(lang==="ar"?`بعد ${i} شهر`:`+${i} month`)}</div>
            </div>
          `).join("")}
        </div>
        <button type="button" id="tamaraBtn" class="btn btn--primary" style="width:100%; justify-content:center; background:#FFD200; color:#000;">
          ${lang==="ar"?"المتابعة عبر تمارا":"Continue with Tamara"} →
        </button>
        <p class="muted" style="font-size:.75rem; margin-top: 10px; text-align:center;">
          ${lang==="ar"?"متوافق مع الشريعة الإسلامية. بدون فوائد.":"Sharia-compliant · 0% interest"}
        </p>
      </div>
    `;

    document.getElementById("tamaraBtn").addEventListener("click", async () => {
      // ─── PRODUCTION: call your backend ───
      // const res = await fetch(PAYMENTS.api.tamara_create, { method:"POST", body: JSON.stringify(order) });
      // const { checkout_url } = await res.json();
      // window.location.href = checkout_url;

      Payments.demoCheckoutRedirect("tamara", order);
    });
  },

  // ───────────────────────────────────────────────
  // COD — Cash on Delivery (no payment, just confirm)
  // ───────────────────────────────────────────────
  renderCOD(container, order) {
    const lang = (localStorage.getItem("vida_lang") || "en");
    container.innerHTML = `
      <div style="border:1px solid var(--vida-line); border-radius: var(--r); padding: 20px; background:#fbfaf6;">
        <p style="margin:0 0 14px;">${lang==="ar"?"هتدفع نقداً أو بالبطاقة لما يوصلك الأثاث. هنتواصل معاك لتأكيد موعد التسليم.":"You'll pay in cash or by card when your furniture is delivered. We'll call to confirm the delivery time."}</p>
        <button type="button" id="codBtn" class="btn btn--primary" style="width:100%; justify-content:center;">
          ${lang==="ar"?`تأكيد الطلب · ${Payments.fmtAmount(order.total)}`:`Confirm Order · ${Payments.fmtAmount(order.total)}`}
        </button>
      </div>
    `;
    document.getElementById("codBtn").addEventListener("click", () => Payments.confirmOrder("cod", order));
  },

  // ───────────────────────────────────────────────
  // BANK TRANSFER
  // ───────────────────────────────────────────────
  renderBank(container, order) {
    const lang = (localStorage.getItem("vida_lang") || "en");
    container.innerHTML = `
      <div style="border:1px solid var(--vida-line); border-radius: var(--r); padding: 20px; background:#fbfaf6;">
        <h4>${lang==="ar"?"تفاصيل الحساب البنكي":"Bank Account Details"}</h4>
        <div style="display:grid; gap:8px; margin: 12px 0;">
          <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--vida-line);">
            <span class="muted">${lang==="ar"?"البنك":"Bank"}</span>
            <strong>${lang==="ar"?PAYMENTS.bank.bank_name_ar:PAYMENTS.bank.bank_name_en}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--vida-line);">
            <span class="muted">${lang==="ar"?"اسم الحساب":"Account Name"}</span>
            <strong>${PAYMENTS.bank.account_name}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; padding:8px 0;">
            <span class="muted">IBAN</span>
            <strong style="font-family:monospace;">${PAYMENTS.bank.iban}</strong>
          </div>
        </div>
        <p class="muted" style="font-size:.85rem;">${lang==="ar"?"بعد التحويل، أرسل صورة من الإيصال على واتساب — هنشحن خلال 24 ساعة.":"After transferring, send the receipt via WhatsApp — we'll ship within 24 hours."}</p>
        <button type="button" id="bankBtn" class="btn btn--primary" style="width:100%; justify-content:center; margin-top:8px;">
          ${lang==="ar"?"تأكيد الطلب وإرسال التحويل لاحقاً":"Confirm Order — I'll transfer later"}
        </button>
      </div>
    `;
    document.getElementById("bankBtn").addEventListener("click", () => Payments.confirmOrder("bank", order));
  },

  // ───────────────────────────────────────────────
  // CORPORATE INVOICE
  // ───────────────────────────────────────────────
  renderInvoice(container, order) {
    const lang = (localStorage.getItem("vida_lang") || "en");
    container.innerHTML = `
      <div style="border:1px solid var(--vida-line); border-radius: var(--r); padding: 20px; background:#fbfaf6;">
        <p>${lang==="ar"?"للجهات الحكومية والشركات. هنرسل لك فاتورة ضريبية رسمية، أو ممكن نستلم أمر الشراء (PO) ونوصّل الأثاث ثم نطالب بالدفع لاحقاً (للعملاء المعتمدين).":"For government and corporate clients. We'll issue an official tax invoice, or accept your Purchase Order (PO) and bill after delivery (for verified clients)."}</p>
        <div class="field" style="margin-top:12px;">
          <label>${lang==="ar"?"الرقم الضريبي (اختياري)":"VAT Number (optional)"}</label>
          <input type="text" id="vatNo" placeholder="3000000000000">
        </div>
        <div class="field" style="margin-top:8px;">
          <label>${lang==="ar"?"رقم أمر الشراء (اختياري)":"PO Number (optional)"}</label>
          <input type="text" id="poNo">
        </div>
        <button type="button" id="invBtn" class="btn btn--primary" style="width:100%; justify-content:center; margin-top:16px;">
          ${lang==="ar"?"تأكيد الطلب — إصدار فاتورة":"Confirm Order — Issue Invoice"}
        </button>
      </div>
    `;
    document.getElementById("invBtn").addEventListener("click", () => {
      order.invoice = {
        vat_no: document.getElementById("vatNo").value,
        po_no:  document.getElementById("poNo").value,
      };
      Payments.confirmOrder("invoice", order);
    });
  },

  // ───────────────────────────────────────────────
  // FINALIZE — save order + redirect to success page
  // ───────────────────────────────────────────────
  confirmOrder(method, order) {
    order.payment_method = method;
    order.status = method === "cod" ? "pending_delivery" : "pending_payment";
    order.placed_at = new Date().toISOString();

    // Save locally (in production this hits your /api/orders/create)
    const orders = JSON.parse(localStorage.getItem("vida_orders") || "[]");
    orders.push(order);
    localStorage.setItem("vida_orders", JSON.stringify(orders));
    localStorage.removeItem("vida_cart");

    // Build a WhatsApp message for the merchant
    const lines = [
      `*🔔 ${(localStorage.getItem("vida_lang")==="ar")?"طلب جديد":"NEW ORDER"} — ${order.id}*`,
      `${order.customer.name} · ${order.customer.phone}`,
      `${order.customer.address}`,
      ``,
      ...order.items.map(it => `• ${it.id} × ${it.qty} = ${it.line_total.toLocaleString()} SAR`),
      ``,
      `Subtotal: ${order.subtotal.toLocaleString()} SAR`,
      `Shipping: ${order.shipping.toLocaleString()} SAR`,
      `VAT (15%): ${order.vat.toLocaleString()} SAR`,
      `*TOTAL: ${order.total.toLocaleString()} SAR*`,
      ``,
      `Payment: ${method.toUpperCase()}`,
    ].join("\n");

    const wa = `https://wa.me/${VIDA.whatsapp}?text=${encodeURIComponent(lines)}`;
    window.location.href = `payment-success.html?order=${order.id}&method=${method}&wa=${encodeURIComponent(wa)}`;
  },

  // Demo flow used while backend is not yet implemented for tabby/tamara
  demoCheckoutRedirect(method, order) {
    // Mark as pending external confirmation
    this.confirmOrder(method, order);
  },
};

window.Payments = Payments;
