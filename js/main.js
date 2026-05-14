/* ============================================================
   VIDA Office Furniture — Main Script
   Handles language, navigation, cart, and shared UI
   ============================================================ */

const VIDA = {
  whatsapp: "966550881411",
  phone: "0550881411",
  email: "info@vidaaloula.com",
  address_en: "Riyadh — Abu Bakr Al-Siddiq Street",
  address_ar: "الرياض — شارع أبو بكر الصديق",
  domain: "vidaaloula.com",
  vat_rate: 0.15,
  shipping_threshold: 5000,
  shipping_fee: 200,
};

// ---------- Helpers ----------
function $(sel, ctx = document) { return ctx.querySelector(sel); }
function $$(sel, ctx = document) { return Array.from(ctx.querySelectorAll(sel)); }

function getLang() {
  return localStorage.getItem("vida_lang") || document.documentElement.lang || "en";
}
function setLang(lang) {
  localStorage.setItem("vida_lang", lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  updateLangButton();
  // Update document title bilingual support
  const titleEn = document.documentElement.getAttribute("data-title-en");
  const titleAr = document.documentElement.getAttribute("data-title-ar");
  if (titleEn && titleAr) document.title = (lang === "ar" ? titleAr : titleEn) + " — VIDA";
}
function updateLangButton() {
  const lang = getLang();
  $$(".lang-toggle").forEach(b => b.textContent = lang === "ar" ? "EN" : "العربية");
}

function fmtPrice(n) {
  const lang = getLang();
  const s = Number(n).toLocaleString(lang === "ar" ? "ar-SA" : "en-US");
  return lang === "ar" ? `${s} ر.س` : `SAR ${s}`;
}

function pickLang(obj) {
  const lang = getLang();
  if (!obj) return "";
  if (typeof obj === "string") return obj;
  return obj[lang] || obj.en || "";
}

// ---------- Cart ----------
function getCart() {
  try { return JSON.parse(localStorage.getItem("vida_cart") || "[]"); }
  catch { return []; }
}
function saveCart(cart) {
  localStorage.setItem("vida_cart", JSON.stringify(cart));
  updateCartBadge();
}
function addToCart(productId, qty = 1) {
  const cart = getCart();
  const existing = cart.find(i => i.id === productId);
  if (existing) existing.qty += qty;
  else cart.push({ id: productId, qty });
  saveCart(cart);
  showToast(getLang() === "ar" ? "تمت الإضافة للسلة" : "Added to cart");
}
function updateCartItem(productId, qty) {
  const cart = getCart();
  const item = cart.find(i => i.id === productId);
  if (!item) return;
  if (qty <= 0) {
    saveCart(cart.filter(i => i.id !== productId));
  } else {
    item.qty = qty;
    saveCart(cart);
  }
}
function removeFromCart(productId) {
  saveCart(getCart().filter(i => i.id !== productId));
}
function clearCart() { saveCart([]); }
function cartCount() { return getCart().reduce((s, i) => s + i.qty, 0); }
function cartSubtotal() {
  return getCart().reduce((s, i) => {
    const p = (window.PRODUCTS || []).find(x => x.id === i.id);
    return s + (p ? p.price * i.qty : 0);
  }, 0);
}
function cartTotals() {
  const subtotal = cartSubtotal();
  const shipping = subtotal === 0 ? 0 : (subtotal >= VIDA.shipping_threshold ? 0 : VIDA.shipping_fee);
  const vat = subtotal * VIDA.vat_rate;
  const total = subtotal + shipping + vat;
  return { subtotal, shipping, vat, total };
}
function updateCartBadge() {
  const n = cartCount();
  $$(".cart-badge").forEach(b => {
    b.textContent = n;
    b.style.display = n > 0 ? "grid" : "none";
  });
}

// ---------- Toast ----------
let toastTimer = null;
function showToast(msg) {
  let toast = $(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

// ---------- Templates ----------
function renderHeader(activePage = "") {
  const lang = getLang();
  const path = location.pathname.includes("/pages/") ? ".." : ".";
  return `
  <header class="site-header">
    <div class="site-header__inner">
      <a href="${path}/index.html" class="logo" aria-label="VIDA Office Furniture">
        <img class="logo__mark"
             src="${path}/images/brand/chair_symbol_48.png"
             srcset="${path}/images/brand/chair_symbol_48.png 1x, ${path}/images/brand/chair_symbol_48@2x.png 2x"
             alt="VIDA chair symbol">
        <span class="logo__text">
          <span class="logo__word">VIDA</span>
          <span class="logo__sub" data-lang-en>OFFICE FURNITURE</span>
          <span class="logo__sub" data-lang-ar>فيدا الأولى للأثاث المكتبي</span>
        </span>
      </a>

      <nav class="nav" id="mainNav">
        <a href="${path}/index.html" ${activePage==="home"?'class="active"':""}>
          <span data-lang-en>Home</span><span data-lang-ar>الرئيسية</span>
        </a>
        <a href="${path}/pages/products.html" ${activePage==="products"?'class="active"':""}>
          <span data-lang-en>Products</span><span data-lang-ar>المنتجات</span>
        </a>
        <a href="${path}/pages/about.html" ${activePage==="about"?'class="active"':""}>
          <span data-lang-en>About</span><span data-lang-ar>من نحن</span>
        </a>
        <a href="${path}/pages/contact.html" ${activePage==="contact"?'class="active"':""}>
          <span data-lang-en>Contact</span><span data-lang-ar>تواصل</span>
        </a>
      </nav>

      <div class="header-tools">
        <button class="lang-toggle" id="langBtn" aria-label="Toggle language">${lang === "ar" ? "EN" : "العربية"}</button>
        <a href="${path}/pages/cart.html" class="icon-btn" aria-label="Cart">
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
          <span class="cart-badge" style="display:none">0</span>
        </a>
        <button class="icon-btn menu-btn" id="menuBtn" aria-label="Menu">
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
      </div>
    </div>
  </header>`;
}

function renderFooter() {
  const path = location.pathname.includes("/pages/") ? ".." : ".";
  return `
  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div>
          <img class="footer-logo"
               src="${path}/images/brand/logo_full_white_120.png"
               alt="VIDA Office Furniture"
               style="height: 110px; width: auto; margin-bottom: 16px; display: block;">
          <p style="color:#c9d1ce" data-lang-en>Modern, elegant office furniture for inspiring workspaces. Quality and design — a magical touch for your work environment.</p>
          <p style="color:#c9d1ce" data-lang-ar>أثاث مكتبي عصري وأنيق لمساحات عمل ملهمة. الجودة والتصميم — لمسة سحرية لبيئة عملك.</p>
          <div class="social">
            <a href="#" aria-label="Instagram"><svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153a4.908 4.908 0 011.153 1.772c.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 01-1.153 1.772 4.915 4.915 0 01-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 01-1.772-1.153 4.904 4.904 0 01-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 011.153-1.772A4.897 4.897 0 015.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 5a5 5 0 100 10 5 5 0 000-10zm6.5-.25a1.25 1.25 0 10-2.5 0 1.25 1.25 0 002.5 0zM12 9a3 3 0 110 6 3 3 0 010-6z"/></svg></a>
            <a href="#" aria-label="X / Twitter"><svg fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>
            <a href="#" aria-label="Facebook"><svg fill="currentColor" viewBox="0 0 24 24"><path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 011.141.195v3.325a8.623 8.623 0 00-.653-.036 26.805 26.805 0 00-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 00-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647z"/></svg></a>
            <a href="https://wa.me/${VIDA.whatsapp}" aria-label="WhatsApp"><svg fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.247-.694.247-1.289.173-1.413z"/></svg></a>
          </div>
        </div>

        <div>
          <h4 data-lang-en>Shop</h4><h4 data-lang-ar>تسوّق</h4>
          <ul>
            <li><a href="${path}/pages/products.html?cat=ceo"><span data-lang-en>CEO Offices</span><span data-lang-ar>مكاتب رئيسية</span></a></li>
            <li><a href="${path}/pages/products.html?cat=admin"><span data-lang-en>Administrative</span><span data-lang-ar>مكاتب إدارية</span></a></li>
            <li><a href="${path}/pages/products.html?cat=meeting"><span data-lang-en>Meeting Rooms</span><span data-lang-ar>غرف اجتماعات</span></a></li>
            <li><a href="${path}/pages/products.html?cat=workstation"><span data-lang-en>Workstations</span><span data-lang-ar>مكاتب عمل</span></a></li>
            <li><a href="${path}/pages/products.html?cat=chair"><span data-lang-en>Chairs</span><span data-lang-ar>كراسي</span></a></li>
          </ul>
        </div>

        <div>
          <h4 data-lang-en>Company</h4><h4 data-lang-ar>الشركة</h4>
          <ul>
            <li><a href="${path}/pages/about.html"><span data-lang-en>About Us</span><span data-lang-ar>من نحن</span></a></li>
            <li><a href="${path}/pages/contact.html"><span data-lang-en>Contact</span><span data-lang-ar>تواصل</span></a></li>
            <li><a href="${path}/pages/contact.html#quote"><span data-lang-en>Request a Quote</span><span data-lang-ar>طلب عرض سعر</span></a></li>
            <li><a href="${path}/pages/contact.html#showroom"><span data-lang-en>Visit Showroom</span><span data-lang-ar>زيارة المعرض</span></a></li>
          </ul>
        </div>

        <div>
          <h4 data-lang-en>Contact</h4><h4 data-lang-ar>اتصل بنا</h4>
          <ul>
            <li><span data-lang-en>${VIDA.address_en}</span><span data-lang-ar>${VIDA.address_ar}</span></li>
            <li><a href="tel:+${VIDA.whatsapp}">${VIDA.phone}</a></li>
            <li><a href="mailto:${VIDA.email}">${VIDA.email}</a></li>
            <li><a href="https://${VIDA.domain}">${VIDA.domain}</a></li>
          </ul>
        </div>
      </div>

      <div class="footer__bottom">
        <div>© <span id="yearNow"></span> VIDA Office Furniture. <span data-lang-en>All rights reserved.</span><span data-lang-ar>جميع الحقوق محفوظة.</span></div>
        <div data-lang-en>Designed with passion in Riyadh.</div>
        <div data-lang-ar>صُمم بشغف في الرياض.</div>
      </div>
    </div>
  </footer>

  <a class="whatsapp-float" href="https://wa.me/${VIDA.whatsapp}" target="_blank" rel="noopener" aria-label="WhatsApp">
    <svg fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.247-.694.247-1.289.173-1.413z"/></svg>
  </a>`;
}

function productCardHTML(p) {
  const path = location.pathname.includes("/pages/") ? "" : "pages/";
  return `
    <a href="${path}product.html?id=${p.id}" class="product-card">
      <div class="product-card__img">
        <img src="${location.pathname.includes("/pages/") ? "../" + p.image : p.image}" alt="${pickLang(p.name)}" loading="lazy">
        <span class="product-card__series">${pickLang(p.series)}</span>
      </div>
      <div class="product-card__body">
        <div class="product-card__cat">${p.id}</div>
        <div class="product-card__name">${pickLang(p.name)}</div>
        <div class="product-card__price">
          ${fmtPrice(p.price)}
          <small>${getLang()==="ar"?"شامل الضريبة":"VAT incl."}</small>
        </div>
      </div>
    </a>`;
}

// ---------- Init ----------
function injectChrome(activePage) {
  document.body.insertAdjacentHTML("afterbegin", renderHeader(activePage));
  document.body.insertAdjacentHTML("beforeend", renderFooter());

  // Apply language
  setLang(getLang());

  // Lang button
  $("#langBtn")?.addEventListener("click", () => {
    setLang(getLang() === "ar" ? "en" : "ar");
    // Re-render dynamic content if needed
    if (typeof window.onLangChange === "function") window.onLangChange();
  });

  // Menu button (mobile)
  $("#menuBtn")?.addEventListener("click", () => $("#mainNav").classList.toggle("open"));

  // Year
  const y = $("#yearNow"); if (y) y.textContent = new Date().getFullYear();

  updateCartBadge();
}

// Run as soon as DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  const active = document.body.getAttribute("data-page") || "";
  injectChrome(active);
});
