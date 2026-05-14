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
  // Arabic responses use Saudi dialect; English responses use casual American tone.
  intro_ar: "هلا والله 🌿 أنا هدى، مستشارة تخطيط مكاتب في فيدا. خلفيتي هندسية وأساعد الناس يختاروا الأثاث المناسب لمساحاتهم. وش تبي تطلب اليوم؟",
  intro_en: "Hey there 🌿 I'm Huda — VIDA's office-planning consultant. I've got an engineering background, so I'm here to help you pick the right pieces for your space. What can I help you find?",

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

  // ───────── KNOWLEDGE: detailed business types ─────────
  // Each entry: short Arabic label + a parent "purpose" category used for filtering
  // and a list of recommended SKU categories tailored to that business.
  businessTypes: {
    // Professional services (→ corporate purpose)
    law:          { ar: "مكتب محاماة",      en: "Law office",         purpose: "corporate", cats: ["ceo", "admin", "meeting", "chair", "storage"] },
    consulting:   { ar: "مكتب استشاري",      en: "Consulting firm",    purpose: "corporate", cats: ["admin", "meeting", "workstation", "chair"] },
    accounting:   { ar: "مكتب محاسبة",       en: "Accounting office",  purpose: "corporate", cats: ["admin", "workstation", "storage", "meeting"] },
    realestate:   { ar: "مكتب عقاري",        en: "Real-estate office", purpose: "corporate", cats: ["admin", "meeting", "workstation", "chair"] },
    marketing:    { ar: "وكالة تسويق",       en: "Marketing agency",   purpose: "corporate", cats: ["workstation", "meeting", "chair", "cafe"] },
    engineering:  { ar: "مكتب هندسي",        en: "Engineering office", purpose: "corporate", cats: ["workstation", "meeting", "ceo", "storage"] },
    architecture: { ar: "مكتب معماري",       en: "Architecture studio",purpose: "corporate", cats: ["workstation", "meeting", "ceo"] },
    tech:         { ar: "شركة تقنية",        en: "Tech company",       purpose: "corporate", cats: ["workstation", "meeting", "chair", "cafe"] },
    startup:      { ar: "شركة ناشئة",        en: "Startup",            purpose: "corporate", cats: ["workstation", "cafe", "meeting", "chair"] },
    advertising:  { ar: "وكالة إعلانية",      en: "Ad agency",          purpose: "corporate", cats: ["workstation", "meeting", "cafe"] },
    bank:         { ar: "بنك / مصرف",        en: "Bank",               purpose: "corporate", cats: ["admin", "ceo", "chair", "meeting", "storage"] },
    insurance:    { ar: "شركة تأمين",        en: "Insurance",          purpose: "corporate", cats: ["admin", "workstation", "meeting", "chair"] },
    logistics:    { ar: "شركة شحن / لوجستيك", en: "Logistics",          purpose: "corporate", cats: ["admin", "storage", "workstation"] },
    travel:       { ar: "وكالة سفر",         en: "Travel agency",      purpose: "corporate", cats: ["admin", "chair", "cafe"] },
    studio:       { ar: "ستوديو",            en: "Studio",             purpose: "corporate", cats: ["workstation", "chair", "cafe"] },
    coworking:    { ar: "مساحة عمل مشتركة",   en: "Coworking",          purpose: "corporate", cats: ["workstation", "cafe", "meeting", "chair"] },
    // Healthcare
    clinic:       { ar: "عيادة",             en: "Clinic",             purpose: "corporate", cats: ["chair", "admin", "storage", "cafe"] },
    hospital:     { ar: "مستشفى",            en: "Hospital",           purpose: "corporate", cats: ["chair", "admin", "storage", "meeting"] },
    lab:          { ar: "مختبر طبي",          en: "Medical lab",        purpose: "corporate", cats: ["workstation", "storage", "chair"] },
    pharmacy:     { ar: "صيدلية",            en: "Pharmacy",           purpose: "retail",    cats: ["storage", "chair"] },
    dental:       { ar: "عيادة أسنان",        en: "Dental clinic",      purpose: "corporate", cats: ["chair", "admin", "storage"] },
    // Education
    school:       { ar: "مدرسة",             en: "School",             purpose: "school",    cats: ["school", "chair", "storage"] },
    university:   { ar: "جامعة / كلية",       en: "University",         purpose: "school",    cats: ["school", "meeting", "admin", "chair"] },
    training:     { ar: "مركز تدريب",         en: "Training center",    purpose: "school",    cats: ["school", "meeting", "chair"] },
    academy:      { ar: "أكاديمية",           en: "Academy",            purpose: "school",    cats: ["school", "chair", "meeting"] },
    kindergarten: { ar: "حضانة / روضة",       en: "Kindergarten",       purpose: "school",    cats: ["school", "chair"] },
    library:      { ar: "مكتبة عامة",         en: "Library",            purpose: "school",    cats: ["chair", "storage", "school"] },
    // F&B
    cafe:         { ar: "مقهى / كافيه",       en: "Café",               purpose: "cafe",      cats: ["cafe", "chair"] },
    restaurant:   { ar: "مطعم",              en: "Restaurant",         purpose: "cafe",      cats: ["cafe", "chair"] },
    bakery:       { ar: "مخبز / كيك شوب",     en: "Bakery",             purpose: "cafe",      cats: ["cafe", "chair", "storage"] },
    foodcourt:    { ar: "فوود كورت",          en: "Food court",         purpose: "cafe",      cats: ["cafe", "chair"] },
    // Retail
    retail:       { ar: "محل تجاري",         en: "Retail",             purpose: "retail",    cats: ["chair", "storage", "cafe"] },
    boutique:     { ar: "بوتيك",            en: "Boutique",           purpose: "retail",    cats: ["chair", "storage"] },
    showroom:     { ar: "معرض",             en: "Showroom",           purpose: "retail",    cats: ["chair", "storage", "cafe"] },
    salon:        { ar: "صالون تجميل",       en: "Beauty salon",       purpose: "retail",    cats: ["chair", "cafe", "storage"] },
    barbershop:   { ar: "صالون حلاقة",       en: "Barbershop",         purpose: "retail",    cats: ["chair", "storage"] },
    spa:          { ar: "سبا",              en: "Spa",                purpose: "retail",    cats: ["chair", "storage"] },
    // Hospitality
    hotel:        { ar: "فندق",             en: "Hotel",              purpose: "corporate", cats: ["chair", "cafe", "admin", "ceo", "storage"] },
    resort:       { ar: "منتجع",            en: "Resort",             purpose: "corporate", cats: ["chair", "cafe", "admin"] },
    eventhall:    { ar: "قاعة مناسبات",      en: "Event hall",         purpose: "corporate", cats: ["chair", "stadium"] },
    // Sports / Recreation
    stadium:      { ar: "ملعب / مدرّجات",    en: "Stadium",            purpose: "stadium",   cats: ["stadium", "chair"] },
    gym:          { ar: "صالة رياضية",       en: "Gym / fitness",      purpose: "retail",    cats: ["chair", "storage"] },
    club:         { ar: "نادي",             en: "Club",               purpose: "retail",    cats: ["chair", "cafe", "storage"] },
    // Religious / Public
    mosque:       { ar: "مسجد / جامع",       en: "Mosque",             purpose: "government",cats: ["chair", "storage"] },
    municipality: { ar: "بلدية / وزارة",     en: "Government office",  purpose: "government",cats: ["admin", "ceo", "meeting", "chair", "storage"] },
    // Home
    home:         { ar: "مكتب منزلي",        en: "Home office",        purpose: "home",      cats: ["workstation", "chair", "storage"] },
    villa:        { ar: "فيلا / منزل",       en: "Villa / home",       purpose: "home",      cats: ["workstation", "chair", "storage"] },
    // Other / catch-all
    workshop:     { ar: "ورشة عمل",         en: "Workshop",           purpose: "corporate", cats: ["workstation", "storage", "chair"] },
    callcenter:   { ar: "كول سنتر",          en: "Call center",        purpose: "corporate", cats: ["workstation", "chair", "storage"] },
  },

  // Saudi-dialect & MSA & English keywords → businessTypes key
  detectBusinessType(rawText) {
    if (!rawText) return null;
    const t = this.normalizeDigits(String(rawText)).toLowerCase();
    // Order matters: most specific first so "عيادة أسنان" wins over "عيادة".
    const map = [
      ["dental",       ["عيادة أسنان", "اسنان", "أسنان", "dentist", "dental"]],
      ["pharmacy",     ["صيدلية", "صيدلي", "pharmacy", "pharmacist"]],
      ["lab",          ["مختبر طبي", "مختبر", "lab ", "laboratory", "تحاليل"]],
      ["hospital",     ["مستشفى", "hospital", "مستوصف"]],
      ["clinic",       ["عيادة", "طبيب", "doctor", "clinic", "طب ", "صحي", "صحية"]],
      ["kindergarten", ["حضانة", "روضة", "kindergarten", "nursery", "preschool", "أطفال"]],
      ["university",   ["جامعة", "كلية", "university", "college"]],
      ["training",     ["تدريب", "training", "معهد"]],
      ["academy",      ["أكاديمية", "academy"]],
      ["library",      ["مكتبة", "library"]],
      ["school",       ["مدرسة", "مدارس", "school", "ابتدائ", "متوسط", "ثانوي", "طلاب", "طالب"]],
      ["bakery",       ["مخبز", "حلويات", "كيك", "كيك شوب", "bakery", "pastry"]],
      ["foodcourt",    ["فوود كورت", "فود كورت", "food court", "كافتيريا"]],
      ["restaurant",   ["مطعم", "مطاعم", "restaurant", "diner", "وجبات", "بوفيه"]],
      ["cafe",         ["مقهى", "كافيه", "كافي", "كوفي", "قهوة", "café", "cafe", "coffee"]],
      ["boutique",     ["بوتيك", "boutique"]],
      ["salon",        ["صالون تجميل", "تجميل", "beauty", "salon", "spa", "سبا"]],
      ["barbershop",   ["صالون حلاقة", "حلاقة", "barber", "barbershop"]],
      ["showroom",     ["معرض", "صالة عرض", "showroom", "gallery", "exhibition"]],
      ["retail",       ["محل", "متجر", "ستور", "store", "shop", "retail"]],
      // Note: "home" rule is intentionally placed BEFORE "hotel" so the substring
      // "نزل" inside "منزل" doesn't accidentally trigger the hotel match.
      ["home",         ["مكتب منزلي", "منزلي", "بيتي", "home office", "home"]],
      ["villa",        ["فيلا", "فلة", "villa"]],
      ["hotel",        ["فندق", "hotel", "hostel"]],
      ["resort",       ["منتجع", "قرية سياحية", "resort"]],
      ["eventhall",    ["قاعة مناسبات", "قاعة احتفال", "event hall", "banquet"]],
      ["stadium",      ["ملعب", "ملاعب", "مدرج", "مدرجات", "stadium", "arena"]],
      ["gym",          ["جيم", "نادي رياضي", "صالة رياضية", "رياضة", "gym", "fitness"]],
      ["club",         ["نادي", "club"]],
      ["mosque",       ["مسجد", "جامع", "مصلى", "mosque"]],
      ["municipality", ["بلدية", "وزارة", "حكومي", "حكومية", "ministry", "government", "أمانة"]],
      ["bank",         ["بنك", "مصرف", "bank", "banking"]],
      ["insurance",    ["تأمين", "insurance"]],
      // Stems used here on purpose so all gendered / pluralised forms match
      // (e.g. "لوجست" catches لوجستية / لوجستي / لوجستيات).
      ["logistics",    ["شحن", "لوجست", "نقل بضائع", "نقل وتخزين", "logistics", "freight", "courier", "shipping company"]],
      ["travel",       ["سفر", "سياحة", "سياحي", "travel agency", "tourism", "vacation"]],
      ["law",          ["محاما", "محامي", "محامين", "قانون", "law office", "law firm", "legal", "attorney", "lawyer"]],
      ["consulting",   ["استشار", "consult", "advisor", "advisory"]],
      ["accounting",   ["محاسب", "accounting", "cpa", "auditor", "تدقيق", "مراجع"]],
      ["realestate",   ["عقار", "real estate", "realty", "اراضي", "أراضي", "تطوير عقاري"]],
      ["marketing",    ["تسويق", "اعلان", "إعلان", "marketing", "ادفرتايز", "ديجيتال ماركتنق"]],
      ["advertising",  ["وكالة اعلان", "وكالة إعلان", "advertising agency", "وكالة دعاية"]],
      ["engineering",  ["هندس", "مهندس", "engineering"]],
      ["architecture", ["معمار", "تصميم داخلي", "architect", "interior design"]],
      ["tech",         ["تقني", "تكنولوج", "tech", "software", "saas", "ai", "بيانات", "ذكاء اصطناعي", "developer", "programming", "it company"]],
      ["startup",      ["startup", "ناشئ", "اعمال صغيرة"]],
      ["coworking",    ["coworking", "مساحة عمل مشتركة", "مساحات مشتركة"]],
      ["callcenter",   ["كول سنتر", "call center", "خدمة عملاء", "customer support"]],
      ["workshop",     ["ورشة", "workshop", "نجارة", "حدادة"]],
      ["studio",       ["ستوديو", "استوديو", "studio", "تصوير"]],
    ];

    for (const [key, kws] of map) {
      if (kws.some(k => t.includes(k.toLowerCase()))) return key;
    }
    return null;
  },

  // ───────── FURNITURE-NEEDS PARSER (free-text → categories) ─────────
  furnitureNeeds: [
    ["chair",       ["كرسي", "كراسي", "كرسيين", "مقاعد", "جلوس", "استقبال زوار", "chair", "chairs", "seat", "seating", "sofa", "couch", "lounge seat", "armchair"]],
    ["workstation", ["مكتب", "مكاتب", "محطه عمل", "محطات عمل", "ورك ستيشن", "بنش", "workstation", "workstations", "desk", "desks", "open plan", "shared desk"]],
    ["ceo",         ["مكتب مدير", "مكتب رئيس", "مكتب تنفيذي", "مدير عام", "تنفيذي", "ceo", "executive", "director office", "manager office"]],
    ["admin",       ["كاونتر استقبال", "كاونتر", "ريسبشن", "ادمن", "موظف اداري", "reception", "front desk", "counter", "admin desk"]],
    ["meeting",     ["اجتماع", "اجتماعات", "طاولة اجتماع", "غرفه اجتماعات", "boardroom", "meeting", "conference", "huddle"]],
    ["storage",     ["تخزين", "خزانه", "خزائن", "دولاب", "رفوف", "ارشيف", "ارشفه", "ملفات", "مستودع", "storage", "filing", "cabinet", "cabinets", "shelf", "shelves", "stockroom", "inventory"]],
    ["cafe",        ["قهوه", "كوفي", "كافيه", "بار", "استراحه", "كنتين", "coffee", "café", "cafe", "break room", "pantry", "lounge area"]],
    ["school",      ["طالب", "طلاب", "صف", "فصل", "تعليم", "تدريب", "student", "classroom", "training room", "lecture"]],
    ["stadium",     ["مدرج", "مدرجات", "جلوس جماهيري", "stadium", "bleachers", "grandstand"]],
  ],

  parseFurnitureNeeds(text) {
    const t = this.normalizeDialect(this.normalizeDigits(String(text || ""))).toLowerCase();
    const found = new Set();
    for (const [cat, kws] of this.furnitureNeeds) {
      if (kws.some(k => t.includes(k.toLowerCase()))) found.add(cat);
    }
    return found;
  },

  // ───────── OPEN-ENDED BUSINESS DETAILS QUESTION ─────────
  async promptBusinessDetails(activityText) {
    const lang = getLang();
    this.state = "BUSINESS_DETAILS";
    this.ctx.unknownActivity = activityText;
    const phrasings = lang === "ar" ? [
      `زين، النشاط دا (<strong>${activityText}</strong>) جديد عليّ شوي — بس مالها 🌿 خبرني أكثر:<br>• إيش الخدمات اللي تقدمونها؟<br>• كم شخص يشتغل عندكم تقريباً؟<br>• إيش القطع اللي محتاجينها (مكاتب، كراسي، استقبال، تخزين، اجتماعات…)؟`,
      `أبشر، خلني أفهم نشاطكم أكثر 🌿 <strong>${activityText}</strong> — احكيلي شوي عن:<br>• طبيعة المكان (استقبال زوار / موظفين بس / كلاهما)<br>• القطع اللي تتخيلها (كرسي / مكتب / كاونتر / تخزين / اجتماعات…)`,
      `حلو، نشاط مميز 👌 خبرني عن:<br>• كم شخص يشتغل عندكم<br>• هل تستقبلون عملاء أو زوار<br>• أي قطع أثاث بالتحديد بدت تفكر فيها`,
    ] : [
      `Got it — <strong>${activityText}</strong> isn't on my standard list 🌿 Tell me a bit more:<br>• What services do you offer?<br>• How many people work there?<br>• Which pieces are you thinking about (desks, chairs, reception, storage, meeting…)?`,
      `Cool, let me get a better feel for <strong>${activityText}</strong> 🌿 Walk me through:<br>• Is it customer-facing or staff-only?<br>• What furniture do you picture (chairs, workstations, counter, storage, meeting…)?`,
      `Interesting business 👌 Help me out with:<br>• How many people work there<br>• Do you have visitors / customers<br>• Any specific furniture you're thinking of`,
    ];
    const pick = phrasings[Math.floor(Math.random() * phrasings.length)];
    await this.botSays(pick);
    this.renderSuggestions([
      { label: lang === "ar" ? "❓ اسأليني أنتِ بدلاً مني" : "❓ Ask me yes/no questions instead", action: () => this.startCustomDiscovery() },
      { label: lang === "ar" ? "💬 كلم موظف فيدا"            : "💬 Talk to a real rep",            key: "command", value: "agent" },
      { label: lang === "ar" ? "↩ ابدأ من جديد"               : "↩ Start over",                     key: "command", value: "restart" },
    ]);
  },

  // Free text input while at BUSINESS_DETAILS — parse needs then proceed to space
  async handleBusinessDetailsInput(text) {
    const lang = getLang();
    const cats = this.parseFurnitureNeeds(text);

    // Try to extract a headcount mentioned in the response
    const numMatch = this.normalizeDigits(text).match(/(\d{1,4})\s*(موظف|شخص|أشخاص|people|staff|employee)/i);
    if (numMatch) this.ctx.employees = parseInt(numMatch[1], 10);

    if (cats.size === 0) {
      // Nothing useful detected — fall back to the yes/no wizard
      await this.botSays(lang === "ar"
        ? "تمام، خلني أسألك بطريقه أوضح بأسئلة بسيطة 🌿"
        : "No worries — let me ask in a more structured way 🌿");
      return this.startCustomDiscovery();
    }

    this.ctx.businessCats = Array.from(cats);
    const labelMap = lang === "ar"
      ? { chair: "كراسي", workstation: "محطات عمل", ceo: "مكتب مدير", admin: "كاونتر/إداري", meeting: "غرفة اجتماعات", storage: "تخزين", cafe: "ركن استراحه", school: "أثاث تعليمي", stadium: "مدرّجات" }
      : { chair: "chairs", workstation: "workstations", ceo: "manager office", admin: "reception", meeting: "meeting room", storage: "storage", cafe: "break corner", school: "classroom seating", stadium: "grandstand" };
    const labels = this.ctx.businessCats.map(c => labelMap[c] || c).join("، ");

    const headcountLine = this.ctx.employees
      ? (lang === "ar" ? `<br>وعدد الموظفين: <strong>${this.ctx.employees}</strong>` : `<br>Staff: <strong>${this.ctx.employees}</strong>`)
      : "";

    await this.botSays(lang === "ar"
      ? `زين، فهمت 🌿 يعني محتاجين: <strong>${labels}</strong>${headcountLine}<br><br>الآن خبرني عن المساحه عشان أحدد المقاسات المناسبه.`
      : `Got it 🌿 So you're looking at: <strong>${labels}</strong>${headcountLine}<br><br>Now tell me about the space so I can lock in the right dimensions.`);
    return this.askSpace();
  },

  // ───────── DISCOVERY WIZARD (fallback when free-text didn't extract anything) ─────────
  customDiscoveryQuestions: [
    { ar: "عندكم منطقه استقبال للعملاء / الزوار؟",        en: "Do you have a reception or customer-facing area?",  catsIfYes: ["chair"] },
    { ar: "تحتاجون محطات عمل ثابته للموظفين؟",            en: "Do you need fixed workstations for staff?",         catsIfYes: ["workstation", "chair"] },
    { ar: "تحتاجون مكتب منفصل للمدير أو الإدارة؟",        en: "Do you need a separate manager's office?",          catsIfYes: ["admin", "ceo"] },
    { ar: "تعقدون اجتماعات بشكل منتظم؟",                   en: "Do you hold regular meetings?",                     catsIfYes: ["meeting"] },
    { ar: "محتاجين تخزين أو أرشفه ملفات؟",                 en: "Do you need storage or filing?",                    catsIfYes: ["storage"] },
    { ar: "عندكم منطقه استراحه أو شرب قهوه؟",              en: "Do you have a break room or coffee corner?",        catsIfYes: ["cafe"] },
    { ar: "نشاطكم تعليمي / تدريبي (يحتاج كراسي طلاب)؟",   en: "Is your activity educational / training (student seating)?", catsIfYes: ["school"] },
    { ar: "تحتاجون مدرّجات أو جلوس جماهيري؟",             en: "Do you need tiered or grandstand seating?",         catsIfYes: ["stadium"] },
  ],

  async startCustomDiscovery() {
    const lang = getLang();
    this.state = "CUSTOM_DISCOVERY";
    this.ctx.discoveryIndex = 0;
    this.ctx.discoveryCats = new Set();
    await this.botSays(lang === "ar"
      ? "تمام، خلني أسألك كم سؤال بسيط عشان أحدد المناسب لكم بالضبط 🌿"
      : "No worries — let me ask you a few quick questions so I can pin down exactly what fits 🌿");
    return this.askNextDiscoveryQuestion();
  },

  async askNextDiscoveryQuestion() {
    const lang = getLang();
    const i = this.ctx.discoveryIndex;
    const q = this.customDiscoveryQuestions[i];
    if (!q) return this.askSpace(); // After discovery, ask about space
    await this.botSays(lang === "ar" ? q.ar : q.en);
    this.renderSuggestions([
      { label: lang === "ar" ? "✅ إي نعم"   : "✅ Yes", action: () => this.answerDiscovery(true)  },
      { label: lang === "ar" ? "❌ لا"        : "❌ No",  action: () => this.answerDiscovery(false) },
      { label: lang === "ar" ? "↩ تخطّى"      : "↩ Skip", action: () => this.answerDiscovery(false) },
      { label: lang === "ar" ? "💬 كلم موظف" : "💬 Talk to staff", key: "command", value: "agent" },
    ]);
  },

  answerDiscovery(yes) {
    const q = this.customDiscoveryQuestions[this.ctx.discoveryIndex];
    if (yes && q) q.catsIfYes.forEach(c => this.ctx.discoveryCats.add(c));
    this.ctx.discoveryIndex++;
    return this.askNextDiscoveryQuestion();
  },

  // ───────── SAUDI-DIALECT NORMALISATION ─────────
  // Rewrites Saudi colloquial expressions to MSA equivalents BEFORE intent matching.
  // JS regex `\b` doesn't recognise Arabic word boundaries, so we space-pad and
  // match " word " patterns explicitly.
  normalizeDialect(text) {
    if (!text) return text;
    let s = " " + String(text) + " ";

    // [searchSubstring, replacement]
    const rules = [
      // "what" variants → ما
      [" وش ", " ما "], [" إيش ", " ما "], [" ايش ", " ما "],
      // "I want / I'd like" → اريد
      [" أبي ", " اريد "],   [" ابي ", " اريد "],
      [" أبغى ", " اريد "],  [" ابغى ", " اريد "], [" أبغا ", " اريد "], [" ابغا ", " اريد "],
      [" بغيت ", " اريد "],  [" ودي ", " اريد "],  [" نفسي ", " اريد "],
      [" عاوز ", " اريد "],  [" عايز ", " اريد "], [" محتاج ", " اريد "], [" بدي ", " اريد "],
      // "Now" / "OK"
      [" الحين ", " الآن "], [" حالحين ", " الآن "], [" زين ", " تمام "], [" ماشي ", " تمام "],
      // "How much" → كم
      [" بكم ", " كم "], [" بكام ", " كم "],
      // "Where" → اين
      [" وين ", " اين "], [" فين ", " اين "], [" وينه ", " اين "],
      // Greetings — strip so they don't accidentally match
      [" هلا ", " "], [" هلابك ", " "], [" حياك ", " "], [" حياكم ", " "],
      [" السلام عليكم ", " "], [" سلام ", " "],
      // "For" / "belonging to" (Saudi)
      [" حق ", " لـ "],
    ];

    for (const [a, b] of rules) {
      while (s.indexOf(a) !== -1) s = s.replace(a, b);
    }
    // Hamza variations — normalise after positional replacements
    return s.replace(/أ|إ|آ/g, "ا").trim().replace(/\s+/g, " ");
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
    // Apply digit + Saudi-dialect normalisation first so the regex set stays compact.
    const text = this.normalizeDialect(this.normalizeDigits(String(rawText || "")).trim());
    const t = text.toLowerCase();

    // Direct category requests — dialect-normalised input means أ→ا, etc.
    if (/(كرسي|كراسي|chair|seat|كرسيين)/i.test(t))                                              return { intent: "browse", cat: "chair" };
    if (/(مكتب رئيس|مدير عام|رئاسة|تنفيذي|\bceo\b|executive|president|مكتب فاخر)/i.test(t))    return { intent: "browse", cat: "ceo" };
    if (/(مكتب اداري|admin|مكتب موظف|مكاتب اداريه|مكتب مدير)/i.test(t))                          return { intent: "browse", cat: "admin" };
    if (/(غرفه اجتماعات|اجتماع|meeting|boardroom|conference|طاوله اجتماع)/i.test(t))            return { intent: "browse", cat: "meeting" };
    if (/(ورك ستيشن|ورك ستشن|workstation|\bbench\b|بنش)/i.test(t))                              return { intent: "browse", cat: "workstation" };
    if (/(مكتب فردي|مكتب صغير|individual|\bsolo\b|مكتب لشخص)/i.test(t))                         return { intent: "browse", cat: "workstation" };
    if (/(تخزين|ارشفه|ارشيف|storage|filing|cabinet|خزانه|دولاب|رفوف)/i.test(t))                  return { intent: "browse", cat: "storage" };
    if (/(كافيه|مقهى|café|\bcafe\b|coffee|كوفي|قهوه)/i.test(t))                                  return { intent: "browse", cat: "cafe" };
    if (/(مدرسه|مدارس|school|student|class|طلاب|طالب)/i.test(t))                                 return { intent: "browse", cat: "school" };
    if (/(ملعب|ملاعب|stadium|arena|مدرج|مدرجات)/i.test(t))                                       return { intent: "browse", cat: "stadium" };

    // FAQ intents — dialect-normalised, so وش / إيش / بكم already mapped
    if (/(عنوان|اين|location|address|where|مكانكم|محلكم)/i.test(t))             return { intent: "location" };
    if (/(ساعه|ساعات|دوام|workday|hours|\bopen\b|when.*open|متى.*دوام)/i.test(t))return { intent: "hours" };
    if (/(تواصل|اتصال|واتساب|whatsapp|phone|\bcall\b|contact|رقمكم)/i.test(t))    return { intent: "contact" };
    if (/(توصيل|شحن|delivery|shipping|متى يوصل)/i.test(t))                       return { intent: "delivery" };
    if (/(طريقه دفع|payment|installment|تقسيط|اقساط)/i.test(t))                  return { intent: "payment" };
    if (/(ضمان|warranty|guarantee|كفاله)/i.test(t))                              return { intent: "warranty" };
    if (/(سعر|كم سعر|how much|cost|price|اسعاركم|بكم|كم تكلف)/i.test(t))          return { intent: "price" };

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
        <div class="huda-fab__avatar">
          <img class="huda-fab__img"
               src="${(location.pathname.includes("/pages/") ? "../" : "")}images/brand/huda-avatar.jpg"
               alt=""
               onerror="this.style.display='none';this.nextElementSibling.style.display='block';">
          <svg class="huda-fab__fallback" viewBox="0 0 100 100" style="display:none;">
            <!-- Brand-aligned stylised portrait: cream hijab + dark green blazer + gold pin -->
            <circle cx="50" cy="50" r="50" fill="#C8A55B"/>
            <path d="M50 6 C 24 6, 19 36, 22 62 Q 23 92, 50 92 Q 77 92, 78 62 C 81 36, 76 6, 50 6 Z" fill="#F5F2EA"/>
            <ellipse cx="50" cy="42" rx="17" ry="21" fill="#F1D2B6"/>
            <ellipse cx="43" cy="42" rx="1.8" ry="2.4" fill="#1a3a37"/>
            <ellipse cx="57" cy="42" rx="1.8" ry="2.4" fill="#1a3a37"/>
            <path d="M39 36 Q 43 33, 47 36" stroke="#3a2820" stroke-width="1.4" fill="none" stroke-linecap="round"/>
            <path d="M53 36 Q 57 33, 61 36" stroke="#3a2820" stroke-width="1.4" fill="none" stroke-linecap="round"/>
            <path d="M44 52 Q 50 56, 56 52" stroke="#8B5A48" stroke-width="1.2" fill="none" stroke-linecap="round"/>
            <path d="M20 95 Q 20 70, 36 64 L 64 64 Q 80 70, 80 95 Z" fill="#27504E"/>
            <circle cx="50" cy="76" r="3" fill="none" stroke="#C8A55B" stroke-width="1.6"/>
          </svg>
          <span class="huda-fab__online"></span>
        </div>
        <div class="huda-fab__text">
          <strong class="huda-fab__name" data-lang-en>Huda</strong>
          <strong class="huda-fab__name" data-lang-ar>هدى</strong>
          <small class="huda-fab__sub"  data-lang-en>Hi! Need help?</small>
          <small class="huda-fab__sub"  data-lang-ar>هلا، تحتاج مساعدة؟</small>
        </div>
        <span class="huda-fab__pulse"></span>
      </button>

      <aside class="huda-panel" id="hudaPanel" aria-hidden="true">
        <header class="huda-panel__head">
          <div class="huda-avatar">
            <!-- Real photo (saved by the client). Falls back to a brand-aligned
                 stylised portrait if the image is missing or fails to load. -->
            <img class="huda-avatar__img"
                 src="${(location.pathname.includes("/pages/") ? "../" : "")}images/brand/huda-avatar.jpg"
                 alt="Huda"
                 onerror="this.style.display='none';this.nextElementSibling.style.display='block';">
            <svg class="huda-avatar__fallback" viewBox="0 0 100 100" style="display:none;">
              <circle cx="50" cy="50" r="50" fill="#C8A55B"/>
              <path d="M50 6 C 24 6, 19 36, 22 62 Q 23 92, 50 92 Q 77 92, 78 62 C 81 36, 76 6, 50 6 Z" fill="#F5F2EA"/>
              <ellipse cx="50" cy="42" rx="17" ry="21" fill="#F1D2B6"/>
              <ellipse cx="43" cy="42" rx="1.8" ry="2.4" fill="#1a3a37"/>
              <ellipse cx="57" cy="42" rx="1.8" ry="2.4" fill="#1a3a37"/>
              <path d="M39 36 Q 43 33, 47 36" stroke="#3a2820" stroke-width="1.4" fill="none" stroke-linecap="round"/>
              <path d="M53 36 Q 57 33, 61 36" stroke="#3a2820" stroke-width="1.4" fill="none" stroke-linecap="round"/>
              <path d="M44 52 Q 50 56, 56 52" stroke="#8B5A48" stroke-width="1.2" fill="none" stroke-linecap="round"/>
              <path d="M20 95 Q 20 70, 36 64 L 64 64 Q 80 70, 80 95 Z" fill="#27504E"/>
              <circle cx="50" cy="76" r="3" fill="none" stroke="#C8A55B" stroke-width="1.6"/>
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
      case "LOOKING_FOR":       return this.askLookingFor();
      case "CATEGORY":          return this.askCategory();
      case "PURPOSE":           return this.handlePurposeInput(text);
      case "BUSINESS_DETAILS":  return this.handleBusinessDetailsInput(text);
      case "SPACE":             return this.handleSpaceInput(text, intent);
      case "EMPLOYEES":         return this.handleEmployeesInput(text, intent);
      case "CUSTOM_DISCOVERY":  return; // ignore free text while the yes/no wizard runs
      default:                  return this.handleUnknown(text);
    }
  },

  // ───────── REPLIES (FAQs) ─────────
  replyLocation() {
    const lang = getLang();
    return this.botSays(
      lang === "ar"
        ? "معرضنا بـ <strong>الرياض — شارع أبو بكر الصديق</strong> 🌿 حياك الله متى ما تبي تجي."
        : "Our showroom's at <strong>Abu Bakr Al-Siddiq Street, Riyadh</strong> 🌿 Stop by anytime!",
      this.standardSuggestions()
    );
  },
  replyHours() {
    const lang = getLang();
    return this.botSays(
      lang === "ar"
        ? "دوامنا كذا:<br>الأحد – الخميس: 9 الصبح – 9 الليل<br>السبت: 4 العصر – 9 الليل<br>الجمعه: مغلق"
        : "Here are our hours:<br>Sun–Thu: 9 AM – 9 PM<br>Sat: 4 PM – 9 PM<br>Fri: Closed",
      this.standardSuggestions()
    );
  },
  replyContact() {
    const lang = getLang();
    return this.botSays(
      lang === "ar"
        ? "تقدر تتواصل معنا على:<br>📞 <a href='tel:+966535732765' style='color:var(--vida-gold)'>+966 53 573 2765</a><br>💬 <a href='https://wa.me/966535732765' target='_blank' style='color:var(--vida-gold)'>واتساب</a><br>✉️ info@vidaaloula.com"
        : "Here's how to reach us:<br>📞 <a href='tel:+966535732765' style='color:var(--vida-gold)'>+966 53 573 2765</a><br>💬 <a href='https://wa.me/966535732765' target='_blank' style='color:var(--vida-gold)'>WhatsApp</a><br>✉️ info@vidaaloula.com",
      this.standardSuggestions()
    );
  },
  replyDelivery() {
    const lang = getLang();
    return this.botSays(
      lang === "ar"
        ? "نوصّل لكل مناطق المملكه 🚚<br>• ببلاش للطلبات فوق 5,000 ر.س<br>• 200 ر.س لو الطلب أقل من كذا<br>• في الرياض نوصّل ونركّب خلال 3-5 أيام عمل"
        : "We ship anywhere in Saudi Arabia 🚚<br>• <strong>FREE</strong> on orders over SAR 5,000<br>• SAR 200 below that<br>• Riyadh delivery + installation: 3–5 business days",
      this.standardSuggestions()
    );
  },
  replyPayment() {
    const lang = getLang();
    return this.botSays(
      lang === "ar"
        ? "نقبل كل طرق الدفع المريحه 💳<br>• فيزا / ماستركارد / مدى عن طريق Moyasar<br>• Apple Pay و STC Pay<br>• تقسيط Tabby (٤ دفعات) و Tamara (٣ دفعات بدون فوائد)<br>• دفع عند الاستلام<br>• تحويل بنكي / فاتورة شركه"
        : "We've got all the payment options covered 💳<br>• Visa / Mastercard / Mada (via Moyasar)<br>• Apple Pay & STC Pay<br>• Tabby (4 installments) & Tamara (3 installments, 0% interest)<br>• Cash on delivery<br>• Bank transfer / corporate invoice",
      this.standardSuggestions()
    );
  },
  replyWarranty() {
    const lang = getLang();
    return this.botSays(
      lang === "ar"
        ? "نعطيك ضمان <strong>سنتين</strong> على كل القطع، و<strong>٥ سنوات</strong> على الهياكل والميكانيكا 🛡️ — كل قطعه عندنا مكفوله."
        : "You're covered with a <strong>2-year</strong> warranty on all pieces, plus <strong>5 years</strong> on frames & mechanisms 🛡️",
      this.standardSuggestions()
    );
  },

  standardSuggestions() {
    const lang = getLang();
    return [
      { label: lang === "ar" ? "↩ ابدأ من جديد"   : "↩ Start over",          key: "command", value: "restart" },
      { label: lang === "ar" ? "💬 كلم موظف فيدا" : "💬 Talk to a real rep", key: "command", value: "agent" },
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
        ? "خبرني، إيش تبي تطلب؟"
        : "So, what are you in the market for?");
    }
    this.renderSuggestions([
      { label: lang === "ar" ? "🛋 قطعه معينه من الستور" : "🛋 A specific piece",          key: "looking_for", value: "piece" },
      { label: lang === "ar" ? "🏢 تأثيث مكتب كامل"      : "🏢 Furnish a full office",     key: "looking_for", value: "office" },
      { label: lang === "ar" ? "👀 مجرد أتفرّج"           : "👀 Just browsing",             key: "looking_for", value: "browse" },
      { label: lang === "ar" ? "💬 كلم موظف فيدا"        : "💬 Talk to a real rep",        key: "command",     value: "agent" },
    ]);
  },

  async chooseLookingFor(choice) {
    this.ctx.looking_for = choice;
    const lang = getLang();
    if (choice === "browse") {
      const featured = (window.PRODUCTS || []).filter(p => p.featured).slice(0, 4);
      await this.botSays(lang === "ar" ? "تفضّل، دي من أحلى القطع عندنا 🌿" : "Here are some of our top picks 🌿");
      this.appendProductGrid(featured);
      this.renderSuggestions([
        { label: lang === "ar" ? "🔍 شوف كل المنتجات" : "🔍 Browse everything",   key: "command", value: "browse_all" },
        { label: lang === "ar" ? "💬 كلم موظف فيدا"    : "💬 Talk to a real rep", key: "command", value: "agent" },
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
      ? "زين، إيش نوع المشروع بالظبط؟"
      : "Cool — what kind of project are we talking about?");
    this.renderSuggestions([
      { label: lang === "ar" ? "🏢 مكتب جديد كامل" : "🏢 Brand-new office",     key: "looking_for", value: "office" },
      { label: lang === "ar" ? "🔄 تجديد مكتب قائم" : "🔄 Renovating an office", key: "looking_for", value: "office" },
      { label: lang === "ar" ? "🏠 مكتب منزلي"      : "🏠 Home office",          key: "purpose",     value: "home" },
      { label: lang === "ar" ? "↩ رجوع"              : "↩ Back",                  key: "command",     value: "restart" },
    ]);
  },

  async askCategory() {
    const lang = getLang();
    this.state = "CATEGORY";
    await this.botSays(lang === "ar"
      ? "حلو! إيش القطعه اللي تبيها بالضبط؟"
      : "Awesome — which piece are you after?");
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
      ? `زين${catLabel ? ` — اخترت <strong>${catLabel}</strong>` : ""} ✨<br>خبرني، إيش طبيعة شغلكم أو لإيش راح تستخدمها؟<br><small style="color:var(--text-mute)">تقدر تكتب نشاطك بنفسك لو ما لقيته بالقائمه.</small>`
      : `Sweet${catLabel ? ` — you picked <strong>${catLabel}</strong>` : ""} ✨<br>What's the nature of your business or use case?<br><small style="color:var(--text-mute)">Feel free to type it in your own words if it's not in the list.</small>`;
    await this.botSays(msg);

    this.renderSuggestions([
      { label: lang === "ar" ? "🏢 مكتب شركه"      : "🏢 Corporate office",   key: "purpose", value: "corporate" },
      { label: lang === "ar" ? "🏠 مكتب منزلي"    : "🏠 Home office",         key: "purpose", value: "home" },
      { label: lang === "ar" ? "🏫 مدرسه / جامعه"  : "🏫 School / University", key: "purpose", value: "school" },
      { label: lang === "ar" ? "☕ مقهى / مطعم"    : "☕ Café / Restaurant",   key: "purpose", value: "cafe" },
      { label: lang === "ar" ? "🏥 عياده / مستشفى"  : "🏥 Clinic / Hospital",  action: () => this.applyBusinessType("clinic") },
      { label: lang === "ar" ? "💼 محاماة / استشاري" : "💼 Law / Consulting",  action: () => this.applyBusinessType("law") },
      { label: lang === "ar" ? "🏨 فندق / منتجع"    : "🏨 Hotel / Resort",     action: () => this.applyBusinessType("hotel") },
      { label: lang === "ar" ? "💇 صالون / سبا"      : "💇 Salon / Spa",        action: () => this.applyBusinessType("salon") },
      { label: lang === "ar" ? "🏛 جهة حكوميه"     : "🏛 Government",          key: "purpose", value: "government" },
      { label: lang === "ar" ? "🏟 ملعب / مدرّجات"  : "🏟 Stadium",             key: "purpose", value: "stadium" },
      { label: lang === "ar" ? "🛍 محل تجاري"        : "🛍 Retail",              key: "purpose", value: "retail" },
      { label: lang === "ar" ? "💭 غيره — أكتبه"    : "💭 Other — type it",    action: () => this.promptFreeBusiness() },
    ]);
  },

  async promptFreeBusiness() {
    const lang = getLang();
    this.state = "PURPOSE";
    this.ctx.expecting = "purpose_text";
    await this.botSays(lang === "ar"
      ? "تمام، أكتب نشاطكم بكلامك… (مثلاً: متجر بطاريات سيارات، صيدليه، استوديو تصوير، ورشة سيارات، حضانة…)"
      : "Cool — just type your activity in your own words… (e.g. car battery store, pharmacy, photo studio, auto workshop, daycare…)");
  },

  // Resolves a businessTypes key → purpose + cats, then advances to the space step.
  async applyBusinessType(key) {
    const bt = this.businessTypes[key];
    if (!bt) return this.startCustomDiscovery();
    const lang = getLang();
    this.ctx.businessType = key;
    this.ctx.purpose = bt.purpose;
    this.ctx.businessCats = bt.cats;
    await this.botSays(lang === "ar"
      ? `زين! سجلته كـ <strong>${bt.ar}</strong> 👍`
      : `Got it — noted as <strong>${bt.en}</strong> 👍`);
    return this.askSpace();
  },

  // Handles free text typed while at the PURPOSE step.
  async handlePurposeInput(text) {
    const detected = this.detectBusinessType(text);
    if (detected) return this.applyBusinessType(detected);
    // Activity not in our list — ask an open-ended creative follow-up so we can
    // learn what they actually need (rather than going straight to yes/no).
    return this.promptBusinessDetails(text);
  },

  async choosePurpose(p) {
    this.ctx.purpose = p;
    return this.askSpace();
  },

  async askSpace() {
    const lang = getLang();
    this.state = "SPACE";
    await this.botSays(lang === "ar"
      ? "تمام 📐 عشان أرشّحلك المقاس المناسب، خبرني عن المساحه المتاحه عندك."
      : "Sweet 📐 To get the dimensions right, tell me a bit about the space you have.");
    this.renderSuggestions([
      { label: lang === "ar" ? "📏 أكتب المساحه بالمتر" : "📏 Tell by m²",         key: "space_mode", value: "m2" },
      { label: lang === "ar" ? "👥 عدد الموظفين"          : "👥 By staff count",     key: "space_mode", value: "employees" },
      { label: lang === "ar" ? "🤷 ما أعرفها دلحين"         : "🤷 Not sure yet",        key: "space_mode", value: "skip" },
      { label: lang === "ar" ? "💬 كلم موظف فيدا"           : "💬 Talk to a real rep", key: "command", value: "agent" },
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
        ? "كم متر تقريباً؟ تقدر تكتب بالعربي أو الإنجليزي (مثل: ٤٥ أو 45)."
        : "Roughly how many m²? (e.g. 45)");
    }
    if (mode === "employees") {
      this.state = "EMPLOYEES";
      return this.botSays(lang === "ar" ? "كم موظف عندكم؟" : "How many staff do you have?");
    }
  },

  async handleSpaceInput(text, intent) {
    const lang = getLang();
    const normalized = this.normalizeDigits(text);

    // Number extraction
    const n = intent.value || parseInt((normalized.match(/\d+/) || [])[0], 10);
    if (!n) {
      return this.botSays(lang === "ar"
        ? "أحتاج رقم لو سمحت 🙏 مثل: ٤٥ أو 45"
        : "Need a number 🙏 e.g. 45");
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
    if (!n) return this.botSays(lang === "ar" ? "أحتاج رقم لو سمحت 🙏" : "Need a number 🙏");
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

    // Build candidate list — priority order:
    //   1. user picked a category explicitly → only that cat
    //   2. businessTypes mapping (specific industry) → its cats
    //   3. discovery wizard cats (yes-answers from the questionnaire)
    //   4. generic purpose recommendation
    let candidates = (window.PRODUCTS || []).slice();
    if (cat) {
      candidates = candidates.filter(p => p.category === cat);
    } else if (this.ctx.businessCats && this.ctx.businessCats.length) {
      const allowed = new Set(this.ctx.businessCats);
      candidates = candidates.filter(p => allowed.has(p.category));
    } else if (this.ctx.discoveryCats && this.ctx.discoveryCats.size) {
      const allowed = this.ctx.discoveryCats;
      candidates = candidates.filter(p => allowed.has(p.category));
    } else if (purpose && this.purposeRecommend[purpose]) {
      const allowed = new Set(this.purposeRecommend[purpose]);
      candidates = candidates.filter(p => allowed.has(p.category));
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
      if (cname) parts.push(lang === "ar" ? `الفئه: <strong>${cname.ar}</strong>` : `Category: <strong>${cname.en}</strong>`);
    }
    // Prefer the specific businessType label if we have one
    if (this.ctx.businessType && this.businessTypes[this.ctx.businessType]) {
      const bt = this.businessTypes[this.ctx.businessType];
      parts.push(lang === "ar" ? `النشاط: <strong>${bt.ar}</strong>` : `Activity: <strong>${bt.en}</strong>`);
    } else if (purpose) {
      parts.push(lang === "ar" ? `الغرض: <strong>${this.purposeLabel(purpose, "ar")}</strong>` : `Use case: <strong>${this.purposeLabel(purpose, "en")}</strong>`);
    }
    if (plan)   parts.push(lang === "ar"
      ? `المساحه: <strong>${plan.area} م²</strong> · ${plan.people} موظف · <strong>${this.tierLabel(plan.tier, "ar")}</strong>`
      : `Space: <strong>${plan.area} m²</strong> · ${plan.people} staff · <strong>${this.tierLabel(plan.tier, "en")}</strong>`);

    const intro = (lang === "ar"
      ? "بناءً على اللي قلتلي:<br>"
      : "Based on what you've told me:<br>") + parts.join("<br>") +
      (items.length
        ? (lang === "ar" ? "<br><br>أرشّحلك القطع دي 👇" : "<br><br>Here's what I'd recommend 👇")
        : (lang === "ar" ? "<br><br>للأسف ما لقيت قطع تطابق المواصفات. خلني أحوّلك لموظف فيدا 🙏" : "<br><br>I couldn't find a perfect match — let me hand you off to a VIDA rep 🙏"));

    await this.botSays(intro);

    if (items.length) this.appendProductGrid(items, /*showDims=*/true);

    this.renderSuggestions([
      { label: lang === "ar" ? "💬 كلم موظف فيدا"        : "💬 Talk to a real rep", key: "command", value: "agent" },
      { label: lang === "ar" ? `🔍 شوف كل ${cat ? "الفئه" : "المنتجات"}` : `🔍 Browse ${cat ? "category" : "all"}`,
        key: "command", value: cat ? "browse_cat" : "browse_all" },
      { label: lang === "ar" ? "↩ ابدأ من جديد"          : "↩ Start over",           key: "command", value: "restart" },
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
        ? "ما فهمتك بالضبط 🤔 اختر من الاقتراحات تحت، أو لو تبي تكلم موظف فيدا مباشرة:"
        : "Hmm, I didn't quite catch that 🤔 Pick from the options below, or chat with a real VIDA rep:",
      [
        { label: lang === "ar" ? "💬 كلم موظف فيدا" : "💬 Talk to a real rep", key: "command", value: "agent" },
        { label: lang === "ar" ? "↩ ابدأ من جديد"   : "↩ Start over",          key: "command", value: "restart" },
      ]
    );
  },

  // ───────── RESTART ─────────
  async restart() {
    this.state = "GREETING";
    this.ctx = {
      looking_for: null, category: null, purpose: null, businessType: null,
      businessCats: null, space_m2: null, employees: null, dim_cm: null,
      expecting: null, history: this.ctx.history,
    };
    const lang = getLang();
    await this.botSays(lang === "ar" ? "تمام، نبدأ من جديد 🌿" : "Cool, fresh start 🌿");
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
      ? "بحوّلك لواحد من موظفين فيدا عبر واتساب 👋"
      : "Connecting you to a real VIDA rep on WhatsApp 👋");
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
