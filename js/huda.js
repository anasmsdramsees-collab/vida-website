/* ============================================================
   VIDA — هدى (Huda) — Sales Chat Assistant
   ------------------------------------------------------------
   Persona  : Office-planning consultant, engineering background.
   Flow     : Greeting → Looking-for → Category → Purpose →
              Space → Dimension-aware recommendation → Hand-off.
   Hand-off : "Talk to a real VIDA staff" → WhatsApp with the
              entire conversation context attached.
   Numbers  : Accepts both Arabic-Indic (٠-٩) and Latin (0-9)
              digits, normalised before parsing.
   ============================================================ */

const Huda = {

  // ───────── PERSONA ─────────
  name_ar: "هدى",
  name_en: "Huda",
  intro_ar: "أهلاً وسهلاً 🌿 أنا هدى، مستشارة تخطيط مكاتب في فيدا. خلفيتي هندسية ومتخصصة في توزيع المساحات وإختيار الأثاث المناسب. حياك الله، إيه اللي بتدوّر عليه اليوم؟",
  intro_en: "Hi there 🌿 I'm Huda, an office-planning consultant at Vida. I have an engineering background and I help clients pick the right pieces for their space. What are you looking for today?",

  // ───────── STATE ─────────
  // GREETING → LOOKING_FOR → CATEGORY → PURPOSE → SPACE → SHOW
  state: "GREETING",
  ctx: {
    looking_for: null,     // "piece" | "office" | "browse"
    category: null,        // ceo | admin | meeting | workstation | chair | …
    purpose: null,         // corporate | home | school | cafe | government | stadium | retail | other
    space_m2: null,
    employees: null,
    dim_cm: null,          // { w, d, h } if user gave actual dimensions
    expecting: null,       // "m2" | "employees" | "dimensions"
    history: [],
  },
  open: false,

  // ───────── KNOWLEDGE: PURPOSE → suggested category order ─────────
  purposeRecommend: {
    corporate:  ["ceo", "admin", "workstation", "meeting", "chair", "storage"],
    home:       ["workstation", "chair", "storage"],
    school:     ["school", "chair", "storage"],
    cafe:       ["cafe", "chair"],
    government: ["admin", "meeting", "ceo", "chair", "storage"],
    stadium:    ["stadium", "chair"],
    retail:     ["chair", "storage", "cafe"],
    other:      ["workstation", "chair", "storage"],
  },

  purposeLabel(p, lang) {
    const m = {
      corporate:  { ar: "مكتب شركة",  en: "Corporate office" },
      home:       { ar: "مكتب منزلي", en: "Home office" },
      school:     { ar: "مدرسة",       en: "School" },
      cafe:       { ar: "مقهى / مطعم", en: "Café / Restaurant" },
      government: { ar: "جهة حكومية",  en: "Government" },
      stadium:    { ar: "ملعب رياضي",  en: "Stadium" },
      retail:     { ar: "محل تجاري",   en: "Retail" },
      other:      { ar: "آخر",         en: "Other" },
    };
    return m[p] ? m[p][lang] : p;
  },

  // ───────── SPACE PLANNING (Saudi norms) ─────────
  plan(space_m2, employees) {
    if (!space_m2 && !employees) return null;
    let area = space_m2, people = employees;
    if (!area && people)   area = Math.round(people * 6 * 1.3);
    if (!people && area)   people = Math.max(1, Math.floor(area / 6));

    let tier;
    if (area < 25)       tier = "micro";
    else if (area < 70)  tier = "small";
    else if (area < 150) tier = "medium";
    else if (area < 350) tier = "large";
    else                 tier = "enterprise";

    return { tier, area, people };
  },

  tierLabel(tier, lang) {
    const m = {
      micro:      { ar: "مكتب صغير لشخص أو شخصين",   en: "Micro office (1–2 ppl)" },
      small:      { ar: "مكتب صغير (3-8 موظفين)",     en: "Small office (3–8 staff)" },
      medium:     { ar: "مكتب متوسط (9-20 موظف)",     en: "Medium office (9–20 staff)" },
      large:      { ar: "مكتب كبير (20-50 موظف)",      en: "Large office (20–50 staff)" },
      enterprise: { ar: "تجهيز كامل (50+ موظف)",       en: "Enterprise fit-out (50+)" },
    };
    return m[tier] ? m[tier][lang] : tier;
  },

  // ───────── DIMENSION PARSING ─────────
  // Parses "240 × 70 × 75 cm" → { w:240, d:70, h:75 }
  parseProductDimensions(spec) {
    if (!spec) return null;
    const m = spec.match(/(\d+)\s*[×xX*]\s*(\d+)\s*[×xX*]\s*(\d+)/);
    if (!m) return null;
    return { w: +m[1], d: +m[2], h: +m[3] };
  },

  // Footprint area in m² for one unit of the product
  productFootprint(product) {
    if (!product.specs || !product.specs.dimensions) return null;
    const d = this.parseProductDimensions(product.specs.dimensions);
    if (!d) return null;
    return (d.w * d.d) / 10000;
  },

  // Does a product reasonably fit a given m²? (~ half-budget rule: leave room to walk)
  productFitsSpace(product, space_m2) {
    if (!space_m2) return true;
    const fp = this.productFootprint(product);
    if (!fp) return true;
    return fp <= space_m2 * 0.5;
  },

  // ───────── INTENT MATCHING ─────────
  normalizeDigits(text) {
    if (!text) return text;
    // Arabic-Indic ٠-٩ (U+0660..U+0669)
    // Eastern-Arabic / Persian ۰-۹ (U+06F0..U+06F9)
    return text
      .replace(/[\u0660-\u0669]/g, d => String.fromCharCode(d.charCodeAt(0) - 0x0660 + 48))
      .replace(/[\u06F0-\u06F9]/g, d => String.fromCharCode(d.charCodeAt(0) - 0x06F0 + 48));
  },

  matchIntent(rawText) {
    const text = this.normalizeDigits(String(rawText || "")).trim();
    const t = text.toLowerCase();

    // Direct category requests
    if (/(كرسي|كراسي|chair|seat)/i.test(t))                                return { intent: "browse", cat: "chair" };
    if (/(مكتب رئيس|مدير عام|رئاسة|تنفيذي|\bceo\b|executive|president)/i.test(t)) return { intent: "browse", cat: "ceo" };
    if (/(مكتب إداري|مكتب اداري|\badmin\b)/i.test(t))                       return { intent: "browse", cat: "admin" };
    if (/(غرفة اجتماعات|اجتماع|meeting|boardroom|conference)/i.test(t))    return { intent: "browse", cat: "meeting" };
    if (/(ورك ستيشن|ورك ستشن|workstation|\bbench\b)/i.test(t))             return { intent: "browse", cat: "workstation" };
    if (/(مكتب فردي|مكتب صغير|individual|\bsolo\b)/i.test(t))              return { intent: "browse", cat: "workstation" };
    if (/(تخزين|أرشفة|أرشيف|storage|filing|cabinet)/i.test(t))             return { intent: "browse", cat: "storage" };
    if (/(كافيه|مقهى|café|\bcafe\b|coffee)/i.test(t))                      return { intent: "browse", cat: "cafe" };
    if (/(مدرسة|مدارس|school|student|class)/i.test(t))                     return { intent: "browse", cat: "school" };
    if (/(ملعب|ملاعب|stadium|arena)/i.test(t))                             return { intent: "browse", cat: "stadium" };

    // FAQ intents
    if (/(عنوان|وين|أين|location|address|where)/i.test(t))                 return { intent: "location" };
    if (/(ساعة|ساعات|دوام|workday|hours|\bopen\b|when.*open)/i.test(t))    return { intent: "hours" };
    if (/(تواصل|اتصال|واتساب|whatsapp|phone|\bcall\b|contact)/i.test(t))   return { intent: "contact" };
    if (/(توصيل|شحن|delivery|shipping)/i.test(t))                          return { intent: "delivery" };
    if (/(دفع|payment|installment|تقسيط)/i.test(t))                        return { intent: "payment" };
    if (/(ضمان|warranty|guarantee)/i.test(t))                              return { intent: "warranty" };
    if (/(سعر|كم سعر|how much|cost|price)/i.test(t))                       return { intent: "price" };

    // Numbers — checked BEFORE agent so "20 موظف" maps to employee count, not "talk to agent"
    const numMatch = text.match(/(\d{1,5})/);
    if (numMatch) {
      const n = parseInt(numMatch[1], 10);
      if (/(متر|m2|m²|sqm|square|سنتي|سنتيمتر)/i.test(t))           return { intent: "size", value: n };
      if (/(موظف|شخص|person|people|employee|staff|أفراد)/i.test(t)) return { intent: "employees", value: n };
      return { intent: "number", value: n };
    }

    // Talk-to-staff — requires an explicit verb / phrase, not just a noun mention.
    if (/(كلم موظف|كلم مندوب|اتكلم مع|اتصل بمندوب|اريد موظف|محتاج موظف|بدي موظف|talk to (a |an )?(staff|agent|human|representative|rep)|speak (with|to) (a |an )?(agent|staff|human)|live agent|human help|customer service|عاوز موظف|عايز موظف)/i.test(t))
      return { intent: "agent" };

    // Restart — whole-word / phrase only, not a substring of "new_office"
    if (/(^|\s)(restart|start over)(\s|$|[!?\.])|^restart$|ابدأ من جديد|ابدا من جديد|من الأول|من البداية|أعد المحادثة/i.test(t))
      return { intent: "restart" };

    return { intent: "unknown", text };
  },

  // ───────── UI INJECTION ─────────
  injectUI() {
    document.body.insertAdjacentHTML("beforeend", `
      <button class="huda-fab" id="hudaFab" aria-label="Open chat with Huda">
        <svg class="huda-fab__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
        </svg>
        <span class="huda-fab__label" data-lang-en>Chat with Huda</span>
        <span class="huda-fab__label" data-lang-ar>كلم هدى</span>
        <span class="huda-fab__pulse"></span>
      </button>

      <aside class="huda-panel" id="hudaPanel" aria-hidden="true">
        <header class="huda-panel__head">
          <div class="huda-avatar">
            <svg viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="20" fill="#C8A55B"/>
              <circle cx="20" cy="15" r="6" fill="#27504E"/>
              <path d="M8 35 C 8 26, 32 26, 32 35 Z" fill="#27504E"/>
              <path d="M14 13 Q 20 7, 26 13 L 26 17 Q 20 12, 14 17 Z" fill="#1a3a37"/>
            </svg>
          </div>
          <div class="huda-panel__title">
            <strong data-lang-en>Huda</strong><strong data-lang-ar>هدى</strong>
            <div class="huda-panel__sub">
              <span data-lang-en>Office Planning Consultant · Online</span>
              <span data-lang-ar>مستشارة تخطيط مكاتب · متواجدة الآن</span>
            </div>
          </div>
          <button class="huda-panel__close" id="hudaClose" aria-label="Close">✕</button>
        </header>

        <div class="huda-messages" id="hudaMessages"></div>

        <div class="huda-suggestions" id="hudaSuggestions"></div>

        <div class="huda-quick-actions" id="hudaQuickActions">
          <button type="button" id="hudaAgentBtn" class="huda-quick-action">
            <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24z"/></svg>
            <span data-lang-en>Talk to a real VIDA staff</span>
            <span data-lang-ar>كلم موظف فيدا مباشرة</span>
          </button>
        </div>

        <form class="huda-input" id="hudaForm">
          <input type="text" id="hudaInput" autocomplete="off" placeholder="" aria-label="Type a message">
          <button type="submit" aria-label="Send">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        </form>
      </aside>
    `);

    document.getElementById("hudaFab").addEventListener("click", () => this.toggle(true));
    document.getElementById("hudaClose").addEventListener("click", () => this.toggle(false));
    document.getElementById("hudaAgentBtn").addEventListener("click", () => this.handoffToWhatsApp());
    document.getElementById("hudaForm").addEventListener("submit", e => {
      e.preventDefault();
      const v = document.getElementById("hudaInput").value.trim();
      if (v) this.userSays(v);
    });

    this.updatePlaceholder();
  },

  updatePlaceholder() {
    const inp = document.getElementById("hudaInput");
    if (!inp) return;
    inp.placeholder = (getLang() === "ar") ? "اكتب رسالتك…" : "Type your message…";
  },

  // ───────── PANEL ─────────
  toggle(open) {
    this.open = open;
    const panel = document.getElementById("hudaPanel");
    panel.classList.toggle("huda-panel--open", open);
    panel.setAttribute("aria-hidden", String(!open));
    if (open && this.ctx.history.length === 0) {
      this.showGreeting();
    }
    if (open) setTimeout(() => document.getElementById("hudaInput").focus(), 200);
  },

  // ───────── MESSAGES ─────────
  addMessage(role, html) {
    const lang = getLang();
    const wrap = document.getElementById("hudaMessages");
    const cls  = role === "bot" ? "huda-msg huda-msg--bot" : "huda-msg huda-msg--user";
    const time = new Date().toLocaleTimeString(lang === "ar" ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" });
    const id = "m" + Date.now() + Math.random().toString(36).slice(2, 6);
    wrap.insertAdjacentHTML("beforeend", `
      <div class="${cls}" id="${id}">
        <div class="huda-bubble">${html}</div>
        <div class="huda-time">${time}</div>
      </div>`);
    wrap.scrollTop = wrap.scrollHeight;
    this.ctx.history.push({ role, text: html.replace(/<[^>]+>/g, " ").trim() });
    return id;
  },

  typing() {
    const id = this.addMessage("bot", `<span class="huda-typing"><span></span><span></span><span></span></span>`);
    return () => {
      const el = document.getElementById(id);
      if (el) el.remove();
      this.ctx.history.pop();
    };
  },

  async botSays(html, suggestions = []) {
    const stop = this.typing();
    await new Promise(r => setTimeout(r, 600 + Math.random() * 400));
    stop();
    this.addMessage("bot", html);
    this.renderSuggestions(suggestions);
  },

  renderSuggestions(suggestions) {
    const wrap = document.getElementById("hudaSuggestions");
    wrap.innerHTML = "";
    suggestions.forEach(s => {
      const btn = document.createElement("button");
      btn.className = "huda-chip";
      btn.textContent = s.label;
      btn.addEventListener("click", () => {
        this.addMessage("user", this.escape(s.label));
        wrap.innerHTML = "";
        if (typeof s.action === "function") s.action();
        else if (s.value)                    this.handleChip(s.key || "value", s.value);
        else if (typeof s.text === "string") this.handleInput(s.text, s);
      });
      wrap.appendChild(btn);
    });
  },

  escape(s) { return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); },

  // ───────── INPUT PIPELINE ─────────
  userSays(text) {
    this.addMessage("user", this.escape(text));
    document.getElementById("hudaInput").value = "";
    this.handleInput(text);
  },

  // Chip handler — uses explicit key/value so it never goes through NLP
  handleChip(key, value) {
    switch (key) {
      case "looking_for":  return this.chooseLookingFor(value);
      case "category":     return this.chooseCategory(value);
      case "purpose":      return this.choosePurpose(value);
      case "space_mode":   return this.chooseSpaceMode(value);
      case "command":
        if (value === "restart")  return this.restart();
        if (value === "agent")    return this.handoffToWhatsApp();
        if (value === "browse_all") return window.location.href = (location.pathname.includes("/pages/") ? "" : "pages/") + "products.html";
        if (value === "browse_cat") return window.location.href = (location.pathname.includes("/pages/") ? "" : "pages/") + "products.html?cat=" + (this.ctx.category || "");
        return;
    }
  },

  async handleInput(text, fromChip) {
    const lang = getLang();
    const intent = this.matchIntent(text);

    // Global intents (work in any state)
    if (intent.intent === "location")  return this.replyLocation();
    if (intent.intent === "hours")     return this.replyHours();
    if (intent.intent === "contact")   return this.replyContact();
    if (intent.intent === "delivery")  return this.replyDelivery();
    if (intent.intent === "payment")   return this.replyPayment();
    if (intent.intent === "warranty")  return this.replyWarranty();
    if (intent.intent === "agent")     return this.handoffToWhatsApp();
    if (intent.intent === "restart")   return this.restart();
    if (intent.intent === "browse")    { this.ctx.category = intent.cat; return this.askPurpose(); }

    // State-specific
    switch (this.state) {
      case "GREETING":
      case "LOOKING_FOR": return this.askLookingFor();
      case "CATEGORY":    return this.askCategory();
      case "PURPOSE":     return this.askPurpose();
      case "SPACE":       return this.handleSpaceInput(text, intent);
      case "EMPLOYEES":   return this.handleEmployeesInput(text, intent);
      default:            return this.handleUnknown(text);
    }
  },

  // ───────── REPLIES (FAQs) ─────────
  replyLocation() {
    const lang = getLang();
    return this.botSays(
      lang === "ar"
        ? "معرضنا في <strong>الرياض — شارع أبو بكر الصديق</strong> 🌿 حياك متى ما تحب."
        : "Our showroom is on <strong>Abu Bakr Al-Siddiq Street, Riyadh</strong> 🌿",
      this.standardSuggestions()
    );
  },
  replyHours() {
    const lang = getLang();
    return this.botSays(
      lang === "ar"
        ? "ساعات العمل:<br>الأحد – الخميس: 9 ص – 9 م<br>السبت: 4 م – 9 م<br>الجمعة: مغلق"
        : "Working hours:<br>Sun–Thu: 9 AM – 9 PM<br>Sat: 4 PM – 9 PM<br>Fri: Closed",
      this.standardSuggestions()
    );
  },
  replyContact() {
    const lang = getLang();
    return this.botSays(
      lang === "ar"
        ? "📞 <a href='tel:+966535732765' style='color:var(--vida-gold)'>+966 53 573 2765</a><br>💬 <a href='https://wa.me/966535732765' target='_blank' style='color:var(--vida-gold)'>واتساب</a><br>✉️ info@vidaaloula.com"
        : "📞 <a href='tel:+966535732765' style='color:var(--vida-gold)'>+966 53 573 2765</a><br>💬 <a href='https://wa.me/966535732765' target='_blank' style='color:var(--vida-gold)'>WhatsApp</a><br>✉️ info@vidaaloula.com",
      this.standardSuggestions()
    );
  },
  replyDelivery() {
    const lang = getLang();
    return this.botSays(
      lang === "ar"
        ? "نوصّل لكل المملكة 🚚<br>• مجاناً للطلبات أكثر من 5,000 ر.س<br>• 200 ر.س لو الطلب أقل<br>• توصيل وتركيب في الرياض خلال 3-5 أيام عمل"
        : "We deliver across Saudi Arabia 🚚<br>• FREE on orders over SAR 5,000<br>• SAR 200 below that<br>• Riyadh delivery + installation: 3–5 working days",
      this.standardSuggestions()
    );
  },
  replyPayment() {
    const lang = getLang();
    return this.botSays(
      lang === "ar"
        ? "💳 بطاقات Visa/Mastercard/مدى عبر Moyasar، Apple Pay، STC Pay، تقسيط Tabby (4 دفعات) و Tamara (3 دفعات بدون فوائد)، الدفع عند الاستلام، أو تحويل بنكي."
        : "💳 Visa/Mastercard/Mada (Moyasar), Apple Pay, STC Pay, Tabby (4 installments), Tamara (3 — 0% interest), COD, or Bank Transfer.",
      this.standardSuggestions()
    );
  },
  replyWarranty() {
    const lang = getLang();
    return this.botSays(
      lang === "ar"
        ? "ضمان <strong>سنتين</strong> على كل الأثاث، و<strong>5 سنوات</strong> على الهياكل والميكانيكا 🛡️"
        : "<strong>2-year</strong> warranty on all furniture, <strong>5-year</strong> on frames & mechanisms 🛡️",
      this.standardSuggestions()
    );
  },

  standardSuggestions() {
    const lang = getLang();
    return [
      { label: lang === "ar" ? "↩ ابدأ من جديد" : "↩ Start over",     key: "command", value: "restart" },
      { label: lang === "ar" ? "💬 كلم موظف فيدا" : "💬 Talk to staff", key: "command", value: "agent" },
    ];
  },

  // ───────── FLOW ─────────
  async showGreeting() {
    const lang = getLang();
    await this.botSays(lang === "ar" ? this.intro_ar : this.intro_en);
    this.state = "LOOKING_FOR";
    setTimeout(() => this.askLookingFor(true), 600);
  },

  async askLookingFor(skipPrompt) {
    const lang = getLang();
    this.state = "LOOKING_FOR";
    if (!skipPrompt) {
      await this.botSays(lang === "ar"
        ? "خبرني، إيه اللي بتدور عليه؟"
        : "What are you looking for?");
    }
    this.renderSuggestions([
      { label: lang === "ar" ? "🛋 قطعة معينة من الستور" : "🛋 A specific piece from the store", key: "looking_for", value: "piece" },
      { label: lang === "ar" ? "🏢 تأثيث مكتب كامل"        : "🏢 Fitting out a full office",       key: "looking_for", value: "office" },
      { label: lang === "ar" ? "👀 مجرد تصفّح"               : "👀 Just browsing",                   key: "looking_for", value: "browse" },
      { label: lang === "ar" ? "💬 كلم موظف فيدا"           : "💬 Talk to staff",                   key: "command", value: "agent" },
    ]);
  },

  async chooseLookingFor(choice) {
    this.ctx.looking_for = choice;
    const lang = getLang();
    if (choice === "browse") {
      const featured = (window.PRODUCTS || []).filter(p => p.featured).slice(0, 4);
      await this.botSays(lang === "ar" ? "تفضل، دي بعض من أفضل القطع عندنا 🌿" : "Here are some of our favourites 🌿");
      this.appendProductGrid(featured);
      this.renderSuggestions([
        { label: lang === "ar" ? "🔍 شوف كل المنتجات" : "🔍 Browse all products", key: "command", value: "browse_all" },
        { label: lang === "ar" ? "💬 كلم موظف فيدا"    : "💬 Talk to staff",       key: "command", value: "agent" },
        { label: lang === "ar" ? "↩ ابدأ من جديد"      : "↩ Start over",          key: "command", value: "restart" },
      ]);
      return;
    }
    if (choice === "office") return this.askProjectType();
    if (choice === "piece")  return this.askCategory();
  },

  async askProjectType() {
    const lang = getLang();
    this.state = "PROJECT_TYPE";
    await this.botSays(lang === "ar"
      ? "تمام، نوع المشروع إيه بالظبط؟"
      : "Got it — what kind of project?");
    this.renderSuggestions([
      { label: lang === "ar" ? "🏢 مكتب جديد كامل"   : "🏢 Brand-new office",     key: "looking_for", value: "office" },
      { label: lang === "ar" ? "🔄 تجديد مكتب قائم"   : "🔄 Renovating an office", key: "looking_for", value: "office" },
      { label: lang === "ar" ? "🏠 مكتب منزلي"        : "🏠 Home office",          key: "purpose",     value: "home" },
      { label: lang === "ar" ? "↩ رجوع"               : "↩ Back",                  key: "command",     value: "restart" },
    ]);
    // After picking, we go to purpose
    this.state = "PURPOSE_AFTER_OFFICE";
  },

  async askCategory() {
    const lang = getLang();
    this.state = "CATEGORY";
    await this.botSays(lang === "ar"
      ? "حلو! أي قطعة بالذات تهمك؟"
      : "Nice! Which piece are you interested in?");
    const cats = window.CATEGORIES || [];
    const chips = cats.map(c => ({
      label: lang === "ar" ? c.ar : c.en,
      key: "category",
      value: c.id,
    }));
    chips.push({ label: lang === "ar" ? "↩ رجوع" : "↩ Back", key: "command", value: "restart" });
    this.renderSuggestions(chips);
  },

  async chooseCategory(catId) {
    this.ctx.category = catId;
    await this.askPurpose();
  },

  async askPurpose() {
    const lang = getLang();
    this.state = "PURPOSE";
    const catName = this.ctx.category
      ? (window.CATEGORIES || []).find(c => c.id === this.ctx.category)
      : null;
    const catLabel = catName ? (lang === "ar" ? catName.ar : catName.en) : "";

    const msg = lang === "ar"
      ? `ممتاز${catLabel ? ` — اختيارك <strong>${catLabel}</strong>` : ""} ✨<br>خبرني، طبيعة عملك إيه أو لإيه هتستخدمها؟`
      : `Great${catLabel ? ` — you picked <strong>${catLabel}</strong>` : ""} ✨<br>What's the nature of your business / use case?`;
    await this.botSays(msg);

    this.renderSuggestions([
      { label: lang === "ar" ? "🏢 مكتب شركة"   : "🏢 Corporate office",  key: "purpose", value: "corporate" },
      { label: lang === "ar" ? "🏠 مكتب منزلي" : "🏠 Home office",        key: "purpose", value: "home" },
      { label: lang === "ar" ? "🏫 مدرسة"        : "🏫 School",             key: "purpose", value: "school" },
      { label: lang === "ar" ? "☕ مقهى / مطعم" : "☕ Café / Restaurant",  key: "purpose", value: "cafe" },
      { label: lang === "ar" ? "🏛 جهة حكومية"   : "🏛 Government",         key: "purpose", value: "government" },
      { label: lang === "ar" ? "🏟 ملعب رياضي"   : "🏟 Stadium",            key: "purpose", value: "stadium" },
      { label: lang === "ar" ? "🛍 محل تجاري"     : "🛍 Retail",             key: "purpose", value: "retail" },
      { label: lang === "ar" ? "↩ رجوع"          : "↩ Back",               key: "command", value: "restart" },
    ]);
  },

  async choosePurpose(p) {
    this.ctx.purpose = p;
    return this.askSpace();
  },

  async askSpace() {
    const lang = getLang();
    this.state = "SPACE";
    await this.botSays(lang === "ar"
      ? "تمام 📐 عشان أقدر أرشحلك المقاسات المناسبة، احكيلي عن المساحة المتاحة عندك."
      : "Perfect 📐 So I can suggest the right dimensions, tell me about your available space.");
    this.renderSuggestions([
      { label: lang === "ar" ? "📏 أكتب المساحة بالمتر" : "📏 Tell by m²",       key: "space_mode", value: "m2" },
      { label: lang === "ar" ? "👥 عدد الموظفين"          : "👥 By staff count",   key: "space_mode", value: "employees" },
      { label: lang === "ar" ? "🤷 مش متأكد دلوقتي"        : "🤷 Not sure yet",      key: "space_mode", value: "skip" },
      { label: lang === "ar" ? "💬 كلم موظف فيدا"          : "💬 Talk to staff",    key: "command", value: "agent" },
    ]);
  },

  async chooseSpaceMode(mode) {
    const lang = getLang();
    if (mode === "skip") {
      this.ctx.expecting = null;
      return this.showRecommendation();
    }
    this.ctx.expecting = mode;
    if (mode === "m2") {
      this.state = "SPACE";
      return this.botSays(lang === "ar"
        ? "كم متر تقريباً؟ تقدر تكتبه بالعربي أو الإنجليزي (مثلاً: ٤٥ أو 45)."
        : "Roughly how many m²? (e.g. 45)");
    }
    if (mode === "employees") {
      this.state = "EMPLOYEES";
      return this.botSays(lang === "ar"
        ? "كم عدد الموظفين؟"
        : "How many employees?");
    }
  },

  async handleSpaceInput(text, intent) {
    const lang = getLang();
    const normalized = this.normalizeDigits(text);

    // Number extraction
    const n = intent.value || parseInt((normalized.match(/\d+/) || [])[0], 10);
    if (!n) {
      return this.botSays(lang === "ar"
        ? "احتاج رقم 🙏 مثلاً: ٤٥ أو 45"
        : "I need a number 🙏 e.g. 45");
    }

    if (intent.intent === "size")           this.ctx.space_m2 = n;
    else if (intent.intent === "employees")  this.ctx.employees = n;
    else if (this.ctx.expecting === "m2")    this.ctx.space_m2 = n;
    else if (this.ctx.expecting === "employees") this.ctx.employees = n;
    else                                     (n > 50 ? this.ctx.space_m2 = n : this.ctx.employees = n);

    this.ctx.expecting = null;
    return this.showRecommendation();
  },

  async handleEmployeesInput(text, intent) {
    const lang = getLang();
    const n = intent.value || parseInt((this.normalizeDigits(text).match(/\d+/) || [])[0], 10);
    if (!n) return this.botSays(lang === "ar" ? "احتاج رقم 🙏" : "I need a number 🙏");
    this.ctx.employees = n;
    return this.showRecommendation();
  },

  // ───────── RECOMMENDATION ─────────
  async showRecommendation() {
    const lang = getLang();
    this.state = "SHOW";

    const plan = this.plan(this.ctx.space_m2, this.ctx.employees);
    const cat = this.ctx.category;
    const purpose = this.ctx.purpose;

    // Build candidate list
    let candidates = (window.PRODUCTS || []).slice();
    if (cat) candidates = candidates.filter(p => p.category === cat);
    else if (purpose && this.purposeRecommend[purpose]) {
      const allowedCats = new Set(this.purposeRecommend[purpose]);
      candidates = candidates.filter(p => allowedCats.has(p.category));
    }
    // Filter by space if known
    if (plan && plan.area) {
      candidates = candidates.filter(p => this.productFitsSpace(p, plan.area));
    }
    // Prefer featured first
    candidates.sort((a, b) => Number(b.featured || 0) - Number(a.featured || 0));

    const items = candidates.slice(0, 4);

    // Build intro
    const parts = [];
    if (cat) {
      const cname = (window.CATEGORIES || []).find(c => c.id === cat);
      if (cname) parts.push(lang === "ar" ? `الفئة: <strong>${cname.ar}</strong>` : `Category: <strong>${cname.en}</strong>`);
    }
    if (purpose) parts.push(lang === "ar" ? `الغرض: <strong>${this.purposeLabel(purpose, "ar")}</strong>` : `Use case: <strong>${this.purposeLabel(purpose, "en")}</strong>`);
    if (plan)   parts.push(lang === "ar"
      ? `المساحة: <strong>${plan.area} م²</strong> · ${plan.people} موظف · <strong>${this.tierLabel(plan.tier, "ar")}</strong>`
      : `Space: <strong>${plan.area} m²</strong> · ${plan.people} staff · <strong>${this.tierLabel(plan.tier, "en")}</strong>`);

    const intro = (lang === "ar"
      ? "بناءً على اللي قلتلي:<br>"
      : "Based on what you've told me:<br>") + parts.join("<br>") +
      (items.length
        ? (lang === "ar" ? "<br><br>أرشحلك القطع دي 👇" : "<br><br>I'd recommend these 👇")
        : (lang === "ar" ? "<br><br>للأسف ما لقيت قطع تناسب الفلتر دا، خليني أحوّلك لموظف فيدا 🙏" : "<br><br>I couldn't find pieces that match — let me hand you to a VIDA staff member 🙏"));

    await this.botSays(intro);

    if (items.length) this.appendProductGrid(items, /*showDims=*/true);

    this.renderSuggestions([
      { label: lang === "ar" ? "💬 كلم موظف فيدا"     : "💬 Talk to VIDA staff",   key: "command", value: "agent" },
      { label: lang === "ar" ? `🔍 شوف كل ${cat ? "الفئة" : "المنتجات"}` : `🔍 Browse ${cat ? "category" : "all"}`,
        key: "command", value: cat ? "browse_cat" : "browse_all" },
      { label: lang === "ar" ? "↩ ابدأ من جديد"        : "↩ Start over",           key: "command", value: "restart" },
    ]);
  },

  appendProductGrid(items, showDims) {
    const lang = getLang();
    const wrap = document.getElementById("hudaMessages");
    const grid = items.map(p => this.productCardHTML(p, showDims)).join("");
    wrap.insertAdjacentHTML("beforeend", `<div class="huda-prodgrid">${grid}</div>`);
    wrap.scrollTop = wrap.scrollHeight;
  },

  productCardHTML(p, showDims) {
    const lang = getLang();
    const url  = (location.pathname.includes("/pages/") ? "" : "pages/") + "product.html?id=" + p.id;
    const img  = (location.pathname.includes("/pages/") ? "../" : "") + p.image;
    const name = (typeof p.name === "object") ? (lang === "ar" ? p.name.ar : p.name.en) : p.name;
    const price = (Number(p.price)).toLocaleString(lang === "ar" ? "ar-SA" : "en-US");
    const priceLabel = lang === "ar" ? `${price} ر.س` : `SAR ${price}`;
    const dims = (showDims && p.specs && p.specs.dimensions) ? `<div class="huda-prod__dims">📐 ${p.specs.dimensions}</div>` : "";
    return `
      <a class="huda-prod" href="${url}">
        <div class="huda-prod__img"><img src="${img}" alt="${name}" loading="lazy"></div>
        <div class="huda-prod__body">
          <div class="huda-prod__name">${name}</div>
          ${dims}
          <div class="huda-prod__price">${priceLabel}</div>
        </div>
      </a>`;
  },

  handleUnknown(text) {
    const lang = getLang();
    return this.botSays(
      lang === "ar"
        ? "ما فهمتك بالظبط 🤔 ممكن تختار من الاقتراحات تحت، أو لو حابب تكلم موظف فيدا مباشرة:"
        : "I didn't quite get that 🤔 Pick from the options below, or chat with a VIDA staff member directly:",
      [
        { label: lang === "ar" ? "💬 كلم موظف فيدا" : "💬 Talk to staff", key: "command", value: "agent" },
        { label: lang === "ar" ? "↩ ابدأ من جديد"  : "↩ Start over",    key: "command", value: "restart" },
      ]
    );
  },

  // ───────── RESTART ─────────
  async restart() {
    this.state = "GREETING";
    this.ctx = { looking_for: null, category: null, purpose: null, space_m2: null, employees: null, dim_cm: null, expecting: null, history: this.ctx.history };
    const lang = getLang();
    await this.botSays(lang === "ar" ? "تمام، نبدأ من جديد 🌿" : "OK, fresh start 🌿");
    this.askLookingFor(true);
  },

  // ───────── HAND-OFF TO WHATSAPP ─────────
  handoffToWhatsApp() {
    const lang = getLang();
    const lines = [];
    lines.push(lang === "ar" ? "*مرحباً، تحدثت مع هدى عبر الموقع*" : "*Hi — I was chatting with Huda on the site*");
    if (this.ctx.looking_for) {
      const ll = { piece: "قطعة معينة", office: "تأثيث مكتب", browse: "تصفح", home: "مكتب منزلي" };
      lines.push((lang === "ar" ? "أبحث عن: " : "Looking for: ") + (ll[this.ctx.looking_for] || this.ctx.looking_for));
    }
    if (this.ctx.category) {
      const c = (window.CATEGORIES || []).find(x => x.id === this.ctx.category);
      lines.push((lang === "ar" ? "الفئة: " : "Category: ") + (c ? (lang === "ar" ? c.ar : c.en) : this.ctx.category));
    }
    if (this.ctx.purpose)   lines.push((lang === "ar" ? "طبيعة العمل: " : "Use case: ") + this.purposeLabel(this.ctx.purpose, lang));
    if (this.ctx.space_m2)  lines.push((lang === "ar" ? "المساحة: " : "Space: ") + this.ctx.space_m2 + " m²");
    if (this.ctx.employees) lines.push((lang === "ar" ? "عدد الموظفين: " : "Staff: ") + this.ctx.employees);
    lines.push("");
    lines.push(lang === "ar" ? "محتاج أتكلم مع موظف فيدا للتفاصيل." : "I'd like to speak with a VIDA staff member for details.");

    const url = `https://wa.me/${VIDA.whatsapp}?text=${encodeURIComponent(lines.join("\n"))}`;
    // Visual feedback in the chat
    this.botSays(lang === "ar"
      ? "بحوّلك لموظف فيدا عبر واتساب 👋"
      : "Connecting you to a VIDA staff member on WhatsApp 👋");
    setTimeout(() => window.open(url, "_blank"), 600);
  },

  // ───────── INIT ─────────
  init() {
    if (document.getElementById("hudaFab")) return;
    this.injectUI();
    if (typeof setLang === "function") setLang(getLang());
  },
};

document.addEventListener("DOMContentLoaded", () => setTimeout(() => Huda.init(), 50));
window.Huda = Huda;
