/* ============================================================
   VIDA — هدى (Huda) Sales Chatbot
   ------------------------------------------------------------
   Persona: An engineer / office space planner.
   Asks: project type → space (m²) or employees → preferences.
   Recommends: relevant SKUs from PRODUCTS catalogue.
   Hand-off: WhatsApp with the full conversation context.
   ============================================================ */

const Huda = {

  // ───────── PERSONA ─────────
  name_ar: "هدى",
  name_en: "Huda",
  intro_ar: "أهلاً وسهلاً! أنا هدى، مستشارة تخطيط مكاتب في فيدا — خلفيتي هندسية ومتخصصة في توزيع المساحات وإختيار الأثاث المكتبي المناسب. كيف ممكن أساعدك اليوم؟",
  intro_en: "Hi! I'm Huda — office-planning consultant at Vida. I have an engineering background and I specialise in space planning and furniture selection. How can I help you today?",

  // ───────── STATE ─────────
  state: "GREETING",   // GREETING → PROJECT_TYPE → SIZE → SHOW → BROWSE
  ctx: {
    project_type: null,   // new_office | renovation | home_office | specific_item
    space_m2: null,
    employees: null,
    target_category: null,
    expecting: null,        // "m2" | "employees" — disambiguates raw numbers from chips
    history: [],
  },
  open: false,

  // ───────── SPACE-PLANNING KNOWLEDGE ─────────
  /* Saudi office planning rule-of-thumb:
       Workstation (shared bench): ~ 4–5 m² per seat (incl. circulation)
       Cellular workstation     : ~ 6–8 m²
       Admin / mid-mgr office    : ~ 9–14 m²
       Director office           : ~ 14–20 m²
       CEO / GM office           : ~ 22–35 m²
       Meeting room (6 ppl)      : ~ 14–18 m²
       Reception + waiting       : ~ 12–18 m²
  */
  plan(space_m2, employees) {
    // Either size or employees is required
    if (!space_m2 && !employees) return null;
    // If only employees provided, estimate area
    let area = space_m2;
    let people = employees;
    if (!area && people)   area = Math.round(people * 6 * 1.3);       // 6 m²/person + 30% circulation
    if (!people && area)   people = Math.max(1, Math.floor(area / 6));

    // Decide a setup tier
    let tier;
    if (area < 25)       tier = "micro";          // 1-2 people
    else if (area < 70)  tier = "small";          // 3-8 people
    else if (area < 150) tier = "medium";         // 9-20 people
    else if (area < 350) tier = "large";          // 20-50 people
    else                 tier = "enterprise";     // 50+

    return { tier, area, people };
  },

  // Suggested SKUs per tier — pulls real items from PRODUCTS
  suggestionsFor(tier) {
    const byCat = (cat, n = 2) =>
      (window.PRODUCTS || []).filter(p => p.category === cat).slice(0, n);

    const map = {
      micro: [
        ...byCat("workstation", 2).filter(p => p.id === "VS-101" || p.id === "VS-201W").slice(0, 2),
        ...byCat("chair", 1),
        ...byCat("storage", 1),
      ],
      small: [
        ...byCat("workstation", 2).filter(p => p.id === "VS-401" || p.id === "VS-201O").slice(0, 2),
        ...byCat("admin", 1),
        ...byCat("chair", 2),
      ],
      medium: [
        ...byCat("workstation", 1).filter(p => p.id === "VS-601W").slice(0, 1),
        ...byCat("admin", 1),
        ...byCat("meeting", 1),
        ...byCat("ceo", 1),
      ],
      large: [
        ...byCat("workstation", 1).filter(p => p.id === "VS-501").slice(0, 1),
        ...byCat("ceo", 1),
        ...byCat("meeting", 1),
        ...byCat("admin", 1),
        ...byCat("storage", 1),
        ...byCat("cafe", 1),
      ],
      enterprise: [
        ...byCat("ceo", 2),
        ...byCat("meeting", 2),
        ...byCat("workstation", 1),
        ...byCat("storage", 1),
      ],
    };
    // Remove duplicates (in case of overlap from byCat with filters)
    const seen = new Set();
    return (map[tier] || []).filter(p => p && !seen.has(p.id) && seen.add(p.id));
  },

  tierLabel(tier, lang) {
    const m = {
      micro:      { ar: "مكتب صغير لشخص أو شخصين",      en: "Micro office (1–2 people)" },
      small:      { ar: "مكتب صغير (3-8 موظفين)",        en: "Small office (3–8 staff)" },
      medium:     { ar: "مكتب متوسط (9-20 موظف)",        en: "Medium office (9–20 staff)" },
      large:      { ar: "مكتب كبير (20-50 موظف)",         en: "Large office (20–50 staff)" },
      enterprise: { ar: "تجهيز شركة كاملة (50+ موظف)",    en: "Enterprise fit-out (50+ staff)" },
    };
    return m[tier] ? m[tier][lang] : tier;
  },

  // ───────── UI INJECTION ─────────
  injectUI() {
    const path = location.pathname.includes("/pages/") ? ".." : ".";
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

        <form class="huda-input" id="hudaForm">
          <input type="text"
                 id="hudaInput"
                 autocomplete="off"
                 placeholder=""
                 aria-label="Type a message">
          <button type="submit" aria-label="Send">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        </form>
      </aside>
    `);

    // Wire events
    document.getElementById("hudaFab").addEventListener("click", () => this.toggle(true));
    document.getElementById("hudaClose").addEventListener("click", () => this.toggle(false));
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

  // ───────── PANEL OPEN/CLOSE ─────────
  toggle(open) {
    this.open = open;
    const panel = document.getElementById("hudaPanel");
    panel.classList.toggle("huda-panel--open", open);
    panel.setAttribute("aria-hidden", String(!open));
    if (open && this.ctx.history.length === 0) {
      this.showGreeting();
    }
    if (open) {
      setTimeout(() => document.getElementById("hudaInput").focus(), 200);
    }
  },

  // ───────── MESSAGE RENDERING ─────────
  addMessage(role, html, opts = {}) {
    const lang = getLang();
    const wrap = document.getElementById("hudaMessages");
    const cls  = role === "bot" ? "huda-msg huda-msg--bot" : "huda-msg huda-msg--user";
    const time = new Date().toLocaleTimeString(lang === "ar" ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" });
    const id = "m" + Date.now() + Math.random().toString(36).slice(2, 6);
    wrap.insertAdjacentHTML("beforeend", `
      <div class="${cls}" id="${id}">
        <div class="huda-bubble">${html}</div>
        <div class="huda-time">${time}</div>
      </div>
    `);
    wrap.scrollTop = wrap.scrollHeight;
    this.ctx.history.push({ role, text: html.replace(/<[^>]+>/g, " ").trim(), opts });
    return id;
  },

  typing() {
    const id = this.addMessage("bot", `<span class="huda-typing"><span></span><span></span><span></span></span>`);
    return () => {
      const el = document.getElementById(id);
      if (el) el.remove();
      // Don't add typing to history
      this.ctx.history.pop();
    };
  },

  async botSays(html, suggestions = []) {
    const stop = this.typing();
    await new Promise(r => setTimeout(r, 600 + Math.random() * 500));
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
        // Echo the user choice as a user message
        this.addMessage("user", s.label);
        wrap.innerHTML = "";
        if (typeof s.action === "function") s.action();
        else if (typeof s.text === "string")  this.handleInput(s.text, s);
      });
      wrap.appendChild(btn);
    });
  },

  // ───────── INPUT PIPELINE ─────────
  userSays(text) {
    this.addMessage("user", this.escape(text));
    document.getElementById("hudaInput").value = "";
    this.handleInput(text);
  },

  escape(s) { return s.replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); },

  // ───────── NLP-LIGHT KEYWORD MATCHING ─────────
  matchIntent(text) {
    const t = text.toLowerCase();
    // Direct category requests
    if (/(كرسي|كراسي|chair|seat)/i.test(t))                              return { intent: "browse", cat: "chair" };
    if (/(مكتب رئيس|مدير عام|رئاسة|تنفيذي|CEO|executive|president)/i.test(t)) return { intent: "browse", cat: "ceo" };
    if (/(مكتب إداري|مكتب اداري|admin)/i.test(t))                          return { intent: "browse", cat: "admin" };
    if (/(غرفة اجتماعات|اجتماع|meeting|boardroom|conference)/i.test(t))   return { intent: "browse", cat: "meeting" };
    if (/(ورك ستيشن|ورك ستشن|workstation|bench)/i.test(t))                return { intent: "browse", cat: "workstation" };
    if (/(مكتب فردي|مكتب صغير|individual|solo)/i.test(t))                 return { intent: "browse", cat: "workstation" };
    if (/(تخزين|أرشفة|أرشيف|storage|filing|cabinet)/i.test(t))            return { intent: "browse", cat: "storage" };
    if (/(كافيه|مقهى|cafe|café|coffee)/i.test(t))                        return { intent: "browse", cat: "cafe" };
    if (/(مدرسة|مدارس|school|student|class)/i.test(t))                    return { intent: "browse", cat: "school" };
    if (/(ملعب|ملاعب|stadium|arena)/i.test(t))                            return { intent: "browse", cat: "stadium" };

    // Generic queries
    if (/(سعر|كم|price|how much|cost)/i.test(t))                          return { intent: "price" };
    if (/(عنوان|وين|أين|location|address|where)/i.test(t))                return { intent: "location" };
    if (/(ساعة|ساعات|دوام|workday|hours|open|when)/i.test(t))             return { intent: "hours" };
    if (/(تواصل|اتصال|واتساب|whatsapp|phone|call|contact)/i.test(t))      return { intent: "contact" };
    if (/(توصيل|شحن|delivery|shipping)/i.test(t))                         return { intent: "delivery" };
    if (/(دفع|طريقة|payment|installment|تقسيط)/i.test(t))                 return { intent: "payment" };
    if (/(ضمان|warranty|guarantee)/i.test(t))                             return { intent: "warranty" };

    // Restart
    if (/(جديد|new|restart|start over|من الأول)/i.test(t))                return { intent: "restart" };

    // Numbers — could be space or employees
    const num = parseInt((t.match(/(\d{1,4})/) || [])[1]);
    if (num) {
      if (/(متر|m2|m²|sqm|square)/i.test(t))                              return { intent: "size", value: num };
      if (/(موظف|شخص|person|people|employee|staff)/i.test(t))             return { intent: "employees", value: num };
      // Ambiguous number — let state decide
      return { intent: "number", value: num };
    }

    return { intent: "unknown", text };
  },

  // ───────── DIALOGUE HANDLER ─────────
  async handleInput(text, fromChip) {
    const lang = getLang();
    const intent = (fromChip && fromChip.text) ? this.matchIntent(fromChip.text) : this.matchIntent(text);

    // Global intents (work in any state)
    if (intent.intent === "location") {
      return this.botSays(
        lang === "ar"
          ? "معرضنا في <strong>الرياض — شارع أبو بكر الصديق</strong>. حياك الله متى ما تحب نتشرف بزيارتك! 🌿"
          : "Our showroom is on <strong>Abu Bakr Al-Siddiq Street, Riyadh</strong>. You're very welcome to visit us anytime! 🌿",
        [
          { label: lang === "ar" ? "📍 الاتجاهات على الخريطة" : "📍 Open in Maps",
            action: () => window.open("https://www.google.com/maps/search/?api=1&query=Abu+Bakr+Al-Siddiq+Street+Riyadh", "_blank") },
          { label: lang === "ar" ? "↩ رجوع" : "↩ Back", text: lang === "ar" ? "ابدأ من جديد" : "restart" },
        ]
      );
    }
    if (intent.intent === "hours") {
      return this.botSays(
        lang === "ar"
          ? "ساعات العمل:<br>الأحد – الخميس: 9 ص – 9 م<br>السبت: 4 م – 9 م<br>الجمعة: مغلق"
          : "Working hours:<br>Sun–Thu: 9 AM – 9 PM<br>Sat: 4 PM – 9 PM<br>Fri: Closed",
        [{ label: lang === "ar" ? "↩ رجوع" : "↩ Back", text: "restart" }]
      );
    }
    if (intent.intent === "contact") {
      return this.botSays(
        lang === "ar"
          ? "تقدر تتواصل معنا:<br>📞 <a href='tel:+966535732765' style='color:var(--vida-gold)'>+966 53 573 2765</a><br>💬 <a href='https://wa.me/966535732765' target='_blank' style='color:var(--vida-gold)'>واتساب</a><br>✉️ info@vidaaloula.com"
          : "Get in touch:<br>📞 <a href='tel:+966535732765' style='color:var(--vida-gold)'>+966 53 573 2765</a><br>💬 <a href='https://wa.me/966535732765' target='_blank' style='color:var(--vida-gold)'>WhatsApp</a><br>✉️ info@vidaaloula.com",
        [{ label: lang === "ar" ? "↩ رجوع" : "↩ Back", text: "restart" }]
      );
    }
    if (intent.intent === "delivery") {
      return this.botSays(
        lang === "ar"
          ? "نوصّل لجميع مناطق المملكة 🚚<br>• <strong>مجاناً</strong> للطلبات أكثر من 5,000 ر.س<br>• 200 ر.س لما يكون الطلب أقل<br>• نوصّل ونركّب في الرياض خلال 3-5 أيام عمل"
          : "We deliver across Saudi Arabia 🚚<br>• <strong>FREE</strong> on orders over SAR 5,000<br>• SAR 200 below that<br>• Riyadh delivery + installation: 3–5 working days",
        [{ label: lang === "ar" ? "↩ رجوع" : "↩ Back", text: "restart" }]
      );
    }
    if (intent.intent === "payment") {
      return this.botSays(
        lang === "ar"
          ? "نقبل: بطاقات Visa/Mastercard/مدى عبر Moyasar، Apple Pay، STC Pay، تقسيط Tabby (4 دفعات) و Tamara (3 دفعات بدون فوائد)، الدفع عند الاستلام، أو تحويل بنكي 💳"
          : "We accept: Visa/Mastercard/Mada via Moyasar, Apple Pay, STC Pay, Tabby (4 installments), Tamara (3 installments — 0% interest), Cash on Delivery, and Bank Transfer 💳",
        [{ label: lang === "ar" ? "↩ رجوع" : "↩ Back", text: "restart" }]
      );
    }
    if (intent.intent === "warranty") {
      return this.botSays(
        lang === "ar"
          ? "نقدّم ضمان <strong>سنتين</strong> على كل قطع الأثاث، وضمان <strong>5 سنوات</strong> على الهياكل والميكانيكا. مع دعم ما بعد البيع متاح طول أيام الأسبوع 🤝"
          : "We offer a <strong>2-year</strong> warranty on all furniture, and <strong>5 years</strong> on frames and mechanisms. After-sales support available throughout the week 🤝",
        [{ label: lang === "ar" ? "↩ رجوع" : "↩ Back", text: "restart" }]
      );
    }
    if (intent.intent === "restart") {
      this.state = "GREETING";
      this.ctx.project_type = null;
      this.ctx.space_m2 = null;
      this.ctx.employees = null;
      return this.showGreeting(true);
    }
    if (intent.intent === "browse") {
      return this.recommendByCategory(intent.cat);
    }

    // STATE-SPECIFIC handling
    switch (this.state) {
      case "GREETING":
      case "PROJECT_TYPE":
        return this.handleProjectType(text, intent);
      case "SIZE":
        return this.handleSize(text, intent);
      case "EMPLOYEES":
        return this.handleEmployees(text, intent);
      default:
        return this.handleUnknown(text);
    }
  },

  // ───────── FLOWS ─────────
  async showGreeting(restarted = false) {
    const lang = getLang();
    const prefix = restarted ? (lang === "ar" ? "تمام، نبدأ من جديد. " : "OK, fresh start. ") : "";
    const intro = lang === "ar" ? this.intro_ar : this.intro_en;
    await this.botSays(prefix + intro);
    this.state = "PROJECT_TYPE";

    setTimeout(() => {
      const followUp = lang === "ar"
        ? "خبّريني، نوع مشروعك إيه؟"
        : "Tell me — what kind of project is this?";
      this.botSays(followUp, [
        { label: lang === "ar" ? "🏢 مكتب جديد كامل" : "🏢 New full office",          text: "new_office" },
        { label: lang === "ar" ? "🔄 تجديد مكتب قائم" : "🔄 Renovating an office",   text: "renovation" },
        { label: lang === "ar" ? "🏠 مكتب منزلي"        : "🏠 Home office",            text: "home_office" },
        { label: lang === "ar" ? "🛋 قطعة معينة"         : "🛋 A specific piece",       text: "specific" },
      ]);
    }, 800);
  },

  async handleProjectType(text, intent) {
    const lang = getLang();
    const t = text.toLowerCase();
    let chosen;

    if (/(new_office|مكتب جديد|كامل|full|new full)/i.test(t)) chosen = "new_office";
    else if (/(renovation|تجديد)/i.test(t))                    chosen = "renovation";
    else if (/(home_office|home|منزلي|منزل|بيت)/i.test(t))      chosen = "home_office";
    else if (/(specific|قطعة|معينة|واحدة)/i.test(t))           chosen = "specific";
    else chosen = null;

    this.ctx.project_type = chosen;

    if (chosen === "specific") {
      await this.botSays(
        lang === "ar"
          ? "تمام! تبحث عن نوع معين من الأثاث؟"
          : "Got it! Which kind of furniture are you looking for?",
        (window.CATEGORIES || []).slice(0, 6).map(c => ({
          label: (lang === "ar" ? c.ar : c.en),
          action: () => this.recommendByCategory(c.id),
        }))
      );
      return;
    }

    if (chosen === "home_office") {
      this.ctx.employees = 1;
      const plan = this.plan(null, 1);
      return this.showRecommendation(plan);
    }

    // For new_office / renovation: ask about size
    this.state = "SIZE";
    await this.botSays(
      lang === "ar"
        ? "ممتاز 🌿 عشان أقدر أرشح لك أفضل توزيع، خبرني المساحة المتاحة بالمتر المربع، أو عدد الموظفين اللي هيشتغلوا في المكتب."
        : "Great 🌿 To recommend the best layout, tell me either the available space in m² — or the number of employees.",
      [
        { label: lang === "ar" ? "📐 المساحة بالمتر"   : "📐 Tell by m²",       text: lang === "ar" ? "عندي مساحة معينة" : "I know my m²" },
        { label: lang === "ar" ? "👥 عدد الموظفين"      : "👥 By staff count",    text: lang === "ar" ? "عندي عدد موظفين" : "I know my headcount" },
      ]
    );
  },

  async handleSize(text, intent) {
    const lang = getLang();

    // 1) Explicit chip / phrase chooses HOW the user wants to specify
    if (/مساحة|m2|m²|متر|sqm/i.test(text) && !intent.value) {
      this.ctx.expecting = "m2";
      return this.botSays(lang === "ar" ? "أبشر، كم متر تقريباً؟ مثلاً: 45" : "Sure — how many m² roughly? E.g. 45");
    }
    if (/موظف|عامل|staff|employee|headcount/i.test(text) && !intent.value) {
      this.ctx.expecting = "employees";
      this.state = "EMPLOYEES";
      return this.botSays(lang === "ar" ? "تمام، كم عدد الموظفين؟" : "OK, how many employees?");
    }

    // 2) Number provided — assign according to what we're expecting
    let n = intent.value || parseInt((text.match(/\d+/) || [])[0]);

    if (n) {
      if (intent.intent === "size")             this.ctx.space_m2 = n;
      else if (intent.intent === "employees")    this.ctx.employees = n;
      else if (this.ctx.expecting === "m2")      this.ctx.space_m2 = n;
      else if (this.ctx.expecting === "employees") this.ctx.employees = n;
      else {
        // Bare number with no context — heuristic
        if (n > 50) this.ctx.space_m2 = n;
        else        this.ctx.employees = n;
      }
    } else {
      return this.botSays(lang === "ar"
        ? "ما فهمتك تمام 🤔 ابعت لي رقم — مثلاً: 45 متر، أو 8 موظفين."
        : "I didn't catch that 🤔 Could you send a number? E.g. 45 m² or 8 employees.");
    }

    const plan = this.plan(this.ctx.space_m2, this.ctx.employees);
    this.ctx.expecting = null;
    return this.showRecommendation(plan);
  },

  async handleEmployees(text, intent) {
    const lang = getLang();
    const n = intent.value || parseInt(text);
    if (!n) {
      return this.botSays(lang === "ar" ? "كم عدد الموظفين؟ اكتب رقم لو سمحت." : "How many employees? Please send a number.");
    }
    this.ctx.employees = n;
    const plan = this.plan(this.ctx.space_m2, this.ctx.employees);
    return this.showRecommendation(plan);
  },

  async showRecommendation(plan) {
    const lang = getLang();
    if (!plan) {
      return this.botSays(lang === "ar"
        ? "محتاجة معلومة المساحة أو عدد الموظفين عشان أرشح لك."
        : "I need either the space or the number of staff to recommend.");
    }
    this.state = "SHOW";
    const tierLabel = this.tierLabel(plan.tier, lang);
    const sizeText = plan.area ? `${plan.area} m²` : "—";
    const peopleText = plan.people ? (lang === "ar" ? `${plan.people} موظف` : `${plan.people} staff`) : "—";

    const intro = lang === "ar"
      ? `حسب اللي وصفته، توقعي إنك تحتاج <strong>${tierLabel}</strong>.<br>📐 المساحة: <strong>${sizeText}</strong> · 👥 ${peopleText}<br><br>هرشح لك الباقة دي:`
      : `Based on what you described, I'd plan for a <strong>${tierLabel}</strong>.<br>📐 Area: <strong>${sizeText}</strong> · 👥 ${peopleText}<br><br>Here's my suggested kit:`;

    const items = this.suggestionsFor(plan.tier);
    const cardsHTML = items.slice(0, 4).map(p => this.productCardHTML(p)).join("");

    await this.botSays(intro);
    const wrap = document.getElementById("hudaMessages");
    wrap.insertAdjacentHTML("beforeend", `<div class="huda-prodgrid">${cardsHTML}</div>`);
    wrap.scrollTop = wrap.scrollHeight;

    this.renderSuggestions([
      { label: lang === "ar" ? "💬 خد عرض سعر على واتساب" : "💬 Get a WhatsApp quote", action: () => this.handoffToWhatsApp(plan) },
      { label: lang === "ar" ? "🔍 شوف كل المنتجات"      : "🔍 Browse all products",   action: () => window.location.href = (location.pathname.includes("/pages/") ? "" : "pages/") + "products.html" },
      { label: lang === "ar" ? "↩ ابدأ من جديد"           : "↩ Start over",            text: "restart" },
    ]);
  },

  async recommendByCategory(catId) {
    const lang = getLang();
    const cat = (window.CATEGORIES || []).find(c => c.id === catId);
    if (!cat) return this.handleUnknown("");
    const items = (window.PRODUCTS || []).filter(p => p.category === catId).slice(0, 4);
    const intro = lang === "ar"
      ? `أكيد! من <strong>${cat.ar}</strong> عندنا الموديلات دي:`
      : `Sure! In <strong>${cat.en}</strong> we have:`;
    await this.botSays(intro);
    const wrap = document.getElementById("hudaMessages");
    wrap.insertAdjacentHTML("beforeend", `<div class="huda-prodgrid">${items.map(p => this.productCardHTML(p)).join("")}</div>`);
    wrap.scrollTop = wrap.scrollHeight;

    this.renderSuggestions([
      { label: lang === "ar" ? "🔍 شوف كل الفئة" : "🔍 See whole category",
        action: () => window.location.href = (location.pathname.includes("/pages/") ? "" : "pages/") + "products.html?cat=" + catId },
      { label: lang === "ar" ? "💬 سؤال للسيلز"   : "💬 Ask sales team",   action: () => this.handoffToWhatsApp(null) },
      { label: lang === "ar" ? "↩ ابدأ من جديد"     : "↩ Start over",       text: "restart" },
    ]);
  },

  productCardHTML(p) {
    const lang = getLang();
    const url  = (location.pathname.includes("/pages/") ? "" : "pages/") + "product.html?id=" + p.id;
    const img  = (location.pathname.includes("/pages/") ? "../" : "") + p.image;
    const name = (typeof p.name === "object") ? (lang === "ar" ? p.name.ar : p.name.en) : p.name;
    const price = (Number(p.price)).toLocaleString(lang === "ar" ? "ar-SA" : "en-US");
    const priceLabel = lang === "ar" ? `${price} ر.س` : `SAR ${price}`;
    return `
      <a class="huda-prod" href="${url}">
        <div class="huda-prod__img"><img src="${img}" alt="${name}" loading="lazy"></div>
        <div class="huda-prod__body">
          <div class="huda-prod__name">${name}</div>
          <div class="huda-prod__price">${priceLabel}</div>
        </div>
      </a>`;
  },

  async handleUnknown(text) {
    const lang = getLang();
    return this.botSays(
      lang === "ar"
        ? "عذراً ما فهمت تماماً 🤔 ممكن تختار من الاقتراحات تحت، أو تكتبي سؤالك بشكل مختلف؟ أو لو حابة، تقدر تكلم فريق المبيعات مباشرة على واتساب."
        : "I didn't quite get that 🤔 You can pick from the suggestions below, or rephrase. Or chat with our sales team directly on WhatsApp.",
      [
        { label: lang === "ar" ? "💬 افتح واتساب" : "💬 Open WhatsApp", action: () => this.handoffToWhatsApp(null) },
        { label: lang === "ar" ? "↩ ابدأ من جديد"  : "↩ Start over",    text: "restart" },
      ]
    );
  },

  // ───────── HAND-OFF ─────────
  handoffToWhatsApp(plan) {
    const lang = getLang();
    const lines = [];
    lines.push(lang === "ar" ? "*مرحباً، تحدثت مع هدى عبر الموقع*" : "*Hi — I chatted with Huda on the website*");
    if (this.ctx.project_type) {
      const ptLabel = { new_office: "مكتب جديد كامل", renovation: "تجديد مكتب", home_office: "مكتب منزلي", specific: "قطعة معينة" };
      lines.push((lang === "ar" ? "نوع المشروع: " : "Project: ") + (ptLabel[this.ctx.project_type] || this.ctx.project_type));
    }
    if (this.ctx.space_m2)  lines.push((lang === "ar" ? "المساحة: " : "Area: ") + this.ctx.space_m2 + " m²");
    if (this.ctx.employees) lines.push((lang === "ar" ? "عدد الموظفين: " : "Staff: ") + this.ctx.employees);
    if (plan)               lines.push((lang === "ar" ? "الفئة الموصى بها: " : "Recommended tier: ") + this.tierLabel(plan.tier, "en"));
    lines.push("");
    lines.push(lang === "ar" ? "أبغى استفسر عن العروض المتاحة." : "I'd like to ask about available options.");

    const url = `https://wa.me/${VIDA.whatsapp}?text=${encodeURIComponent(lines.join("\n"))}`;
    window.open(url, "_blank");
  },

  // ───────── INIT ─────────
  init() {
    if (document.getElementById("hudaFab")) return;
    this.injectUI();
    // Re-apply language visibility now that we've added DOM
    if (typeof setLang === "function") setLang(getLang());
  },
};

// Boot after main chrome injection
document.addEventListener("DOMContentLoaded", () => {
  // Wait a tick so main.js has injected header/footer
  setTimeout(() => Huda.init(), 50);
});

window.Huda = Huda;
