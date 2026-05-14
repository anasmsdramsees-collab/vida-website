// VIDA Office Furniture — Product Database
// Categories use bilingual keys (en / ar)
// All prices are in SAR (ريال سعودي)

const CATEGORIES = [
  { id: "ceo",          en: "CEO Offices",            ar: "مكاتب رئيسية",          image: "images/pages/prof_p10.jpg" },
  { id: "admin",        en: "Administrative Offices", ar: "مكاتب إدارية",          image: "images/pages/prof_p12.jpg" },
  { id: "meeting",      en: "Meeting Rooms",          ar: "غرف اجتماعات",          image: "images/pages/prof_p14.jpg" },
  { id: "workstation",  en: "Workstations",           ar: "مكاتب عمل مشتركة",      image: "images/pages/cat_p02.jpg" },
  { id: "chair",        en: "Chairs",                 ar: "كراسي",                 image: "images/pages/prof_p18.jpg" },
  { id: "storage",      en: "Storage & Filing",       ar: "وحدات تخزين وأرشفة",    image: "images/pages/prof_p20.jpg" },
  { id: "cafe",         en: "Café Furniture",         ar: "أثاث المقاهي",          image: "images/pages/prof_p21.jpg" },
  { id: "stadium",      en: "Stadium Furniture",      ar: "أثاث الملاعب",          image: "images/pages/prof_p23.jpg" },
  { id: "school",       en: "School Furniture",       ar: "أثاث المدارس",          image: "images/pages/prof_p24.jpg" }
];

const PRODUCTS = [
  // ─────── WORKSTATIONS (from catalog) ───────
  {
    id: "VS-401", category: "workstation", featured: true,
    name: { en: "Cross Bench 4", ar: "كروس بنش ٤" },
    series: { en: "Bench Series", ar: "سلسلة البنش" },
    price: 8400,
    image: "images/pages/cat_p03.jpg",
    gallery: ["images/pages/cat_p03.jpg", "images/pages/cat_p02.jpg"],
    desc: {
      en: "Four-station cross configuration with white surface and dark anthracite divider panels. Integrated power trunking points at each workstation.",
      ar: "تكوين متقاطع لأربع محطات عمل بسطح أبيض وفواصل بلون أنثراسايت داكن. مع توصيلات كهرباء مدمجة في كل محطة."
    },
    specs: { dimensions: "240 × 240 × 75 cm", persons: "4", finish: "White / Anthracite" }
  },
  {
    id: "VS-201W", category: "workstation", featured: false,
    name: { en: "Duo White", ar: "ديو وايت" },
    series: { en: "Solo Series", ar: "سلسلة سولو" },
    price: 4900,
    image: "images/pages/cat_p04.jpg",
    gallery: ["images/pages/cat_p04.jpg"],
    desc: {
      en: "Two-station face-to-face workstation in pristine white with ergonomic mesh chairs and integrated storage pedestals.",
      ar: "محطة عمل ثنائية وجهًا لوجه باللون الأبيض الناصع مع كراسي شبكية مريحة ووحدات تخزين مدمجة."
    },
    specs: { dimensions: "280 × 140 × 75 cm", persons: "2", finish: "White" }
  },
  {
    id: "VS-201O", category: "workstation", featured: true,
    name: { en: "Duo Oak", ar: "ديو أوك" },
    series: { en: "Solo Series", ar: "سلسلة سولو" },
    price: 5400,
    image: "images/pages/cat_p05.jpg",
    gallery: ["images/pages/cat_p05.jpg"],
    desc: {
      en: "Warm oak finish double workstation with cable management and acoustic dividers. Pairs natural wood with modern minimalism.",
      ar: "محطة عمل مزدوجة بلمسة خشب الأوك الدافئة مع إدارة الكابلات وفواصل عازلة للصوت. تجمع بين الخشب الطبيعي والبساطة العصرية."
    },
    specs: { dimensions: "280 × 140 × 75 cm", persons: "2", finish: "Oak" }
  },
  {
    id: "VS-202C", category: "workstation", featured: true,
    name: { en: "Duo Color", ar: "ديو كولور" },
    series: { en: "Creative Series", ar: "سلسلة كرييتيف" },
    price: 5800,
    image: "images/pages/cat_p06.jpg",
    gallery: ["images/pages/cat_p06.jpg"],
    desc: {
      en: "Vibrant yellow accent frame two-station setup with cable trays and tool rails. Designed for creative teams.",
      ar: "محطة عمل ثنائية بإطار أصفر مميز مع حوامل للكابلات وقضبان للأدوات. مصممة للفرق المبدعة."
    },
    specs: { dimensions: "280 × 140 × 75 cm", persons: "2", finish: "Yellow / White" }
  },
  {
    id: "VS-101", category: "workstation", featured: false,
    name: { en: "Solo Station", ar: "سولو ستيشن" },
    series: { en: "Solo Series", ar: "سلسلة سولو" },
    price: 2800,
    image: "images/pages/cat_p07.jpg",
    gallery: ["images/pages/cat_p07.jpg"],
    desc: {
      en: "Single private workstation with side pedestal storage. Ideal for focused work and small offices.",
      ar: "محطة عمل فردية خاصة مع وحدة تخزين جانبية. مثالية للعمل المركّز والمكاتب الصغيرة."
    },
    specs: { dimensions: "140 × 70 × 75 cm", persons: "1", finish: "White" }
  },
  {
    id: "VS-601W", category: "workstation", featured: true,
    name: { en: "Bench 6 Walnut", ar: "بنش ٦ والنت" },
    series: { en: "Bench Series", ar: "سلسلة البنش" },
    price: 11500,
    image: "images/pages/cat_p08.jpg",
    gallery: ["images/pages/cat_p08.jpg"],
    desc: {
      en: "Six-station open bench in rich walnut finish with white acoustic cross-dividers. White round-leg frame. Perfect for coworking environments.",
      ar: "بنش مفتوح لست محطات عمل بلمسة الجوز الفاخر مع فواصل صوتية بيضاء متقاطعة. إطار بأرجل دائرية بيضاء. مثالي لبيئات العمل المشترك."
    },
    specs: { dimensions: "720 × 70 × 75 cm", persons: "6", finish: "Walnut" }
  },
  {
    id: "VS-401O", category: "workstation", featured: false,
    name: { en: "Bench 6 Walnut Open", ar: "بنش ٦ مفتوح" },
    series: { en: "Bench Series", ar: "سلسلة البنش" },
    price: 10800,
    image: "images/pages/cat_p09.jpg",
    gallery: ["images/pages/cat_p09.jpg"],
    desc: {
      en: "Open-plan six-station configuration with central divider rail. Cable trough integrated along the spine.",
      ar: "تكوين مفتوح من ست محطات عمل مع قضيب فاصل مركزي. مع مجرى كابلات مدمج على طول العمود الفقري."
    },
    specs: { dimensions: "720 × 140 × 75 cm", persons: "6", finish: "Walnut / White" }
  },
  {
    id: "VS-501", category: "workstation", featured: true,
    name: { en: "Open Plan Suite", ar: "أوبن بلان سويت" },
    series: { en: "System Series", ar: "سلسلة سيستم" },
    price: 18900,
    image: "images/pages/cat_p10.jpg",
    gallery: ["images/pages/cat_p10.jpg"],
    desc: {
      en: "Modular open-plan suite combining workstations with privacy screens, storage walls, and integrated planters for biophilic offices.",
      ar: "جناح متكامل بنظام مفتوح يجمع بين محطات العمل وألواح الخصوصية وجدران التخزين والأحواض النباتية المدمجة للمكاتب الخضراء."
    },
    specs: { dimensions: "Configurable", persons: "8-12", finish: "Multi" }
  },
  {
    id: "VS-403", category: "workstation", featured: false,
    name: { en: "Bench 4 Birch", ar: "بنش ٤ بيرش" },
    series: { en: "Bench Series", ar: "سلسلة البنش" },
    price: 7900,
    image: "images/pages/cat_p11.jpg",
    gallery: ["images/pages/cat_p11.jpg"],
    desc: {
      en: "Four-person bench in light birch finish with circular column legs. Bright, Scandinavian-inspired aesthetic.",
      ar: "بنش لأربعة أشخاص بلمسة خشب البتولا الفاتح مع أرجل أعمدة دائرية. تصميم مشرق مستوحى من الطراز الإسكندنافي."
    },
    specs: { dimensions: "280 × 140 × 75 cm", persons: "4", finish: "Birch" }
  },
  {
    id: "VS-301B", category: "workstation", featured: false,
    name: { en: "Bench 3 Blue", ar: "بنش ٣ بلو" },
    series: { en: "Creative Series", ar: "سلسلة كرييتيف" },
    price: 6900,
    image: "images/pages/cat_p12.jpg",
    gallery: ["images/pages/cat_p12.jpg"],
    desc: {
      en: "Three-station blue accent bench with steel A-frame. Adds personality and energy to creative studios.",
      ar: "بنش لثلاث محطات بلون أزرق مميز مع إطار فولاذي على شكل حرف A. يضيف الشخصية والطاقة للاستوديوهات المبدعة."
    },
    specs: { dimensions: "240 × 140 × 75 cm", persons: "3", finish: "Blue / Oak" }
  },
  {
    id: "VS-601P", category: "workstation", featured: false,
    name: { en: "Bench 6 White Premium", ar: "بنش ٦ وايت بريميوم" },
    series: { en: "Premium Series", ar: "سلسلة بريميوم" },
    price: 13500,
    image: "images/pages/cat_p13.jpg",
    gallery: ["images/pages/cat_p13.jpg"],
    desc: {
      en: "Premium six-station bench in clean white with grey acoustic dividers and integrated pedestal cabinets.",
      ar: "بنش بريميوم لست محطات باللون الأبيض النقي مع فواصل صوتية رمادية ووحدات تخزين مدمجة."
    },
    specs: { dimensions: "720 × 140 × 75 cm", persons: "6", finish: "White / Grey" }
  },
  {
    id: "VS-602", category: "workstation", featured: false,
    name: { en: "Bench 6 Industrial", ar: "بنش ٦ إندستريال" },
    series: { en: "Premium Series", ar: "سلسلة بريميوم" },
    price: 12900,
    image: "images/pages/cat_p14.jpg",
    gallery: ["images/pages/cat_p14.jpg"],
    desc: {
      en: "Industrial-style bench with black O-frame and acoustic panels. Bold and modern look for tech offices.",
      ar: "بنش بطراز صناعي مع إطار أسود وألواح صوتية. مظهر جريء وعصري لمكاتب التقنية."
    },
    specs: { dimensions: "720 × 140 × 75 cm", persons: "6", finish: "Black" }
  },

  // ─────── CEO OFFICES ───────
  {
    id: "CE-101", category: "ceo", featured: true,
    name: { en: "Executive Suite — Vida One", ar: "جناح تنفيذي — فيدا ون" },
    series: { en: "Premium Executive", ar: "تنفيذي بريميوم" },
    price: 38000,
    image: "images/pages/prof_p10.jpg",
    gallery: ["images/pages/prof_p10.jpg", "images/pages/prof_p09.jpg"],
    desc: {
      en: "Complete executive office suite — large L-shaped desk with credenza, leather executive chair, side lounge, and integrated bookshelf wall.",
      ar: "جناح مكتب تنفيذي متكامل — مكتب كبير على شكل حرف L مع وحدة جانبية، وكرسي تنفيذي جلدي، وأريكة جانبية، وجدار رفوف مدمج."
    },
    specs: { dimensions: "Custom layout", persons: "1 + guests", finish: "Walnut & Gold" }
  },
  {
    id: "CE-102", category: "ceo", featured: true,
    name: { en: "President Desk Aura", ar: "مكتب الرئاسة أورا" },
    series: { en: "Premium Executive", ar: "تنفيذي بريميوم" },
    price: 22000,
    image: "images/pages/prof_p09.jpg",
    gallery: ["images/pages/prof_p09.jpg"],
    desc: {
      en: "Sculptural large executive desk with leather inlay top, soft champagne finish, and integrated drawer pedestal.",
      ar: "مكتب تنفيذي كبير منحوت بسطح من الجلد ولمسة شامبانيا ناعمة ووحدة أدراج مدمجة."
    },
    specs: { dimensions: "260 × 110 × 76 cm", persons: "1", finish: "Champagne / Leather" }
  },
  {
    id: "CE-103", category: "ceo", featured: false,
    name: { en: "Director Office Verde", ar: "مكتب المدير فيردي" },
    series: { en: "Executive", ar: "تنفيذي" },
    price: 16500,
    image: "images/pages/prof_p11.jpg",
    gallery: ["images/pages/prof_p11.jpg"],
    desc: {
      en: "Director-tier office package — desk, mid-back chair, two-seater guest lounge, and side storage credenza in Vida Verde.",
      ar: "حزمة مكتب لمستوى المدير — مكتب، كرسي بظهر متوسط، أريكة ضيوف لشخصين، ووحدة تخزين جانبية بلون فيدا فيردي."
    },
    specs: { dimensions: "Suite", persons: "1 + 2", finish: "Verde Green" }
  },

  // ─────── ADMINISTRATIVE OFFICES ───────
  {
    id: "AD-101", category: "admin", featured: true,
    name: { en: "Manager Desk Pro", ar: "مكتب مدير برو" },
    series: { en: "Administrative", ar: "إداري" },
    price: 7200,
    image: "images/pages/prof_p12.jpg",
    gallery: ["images/pages/prof_p12.jpg"],
    desc: {
      en: "Versatile L-shaped manager's desk with return, drawer pedestal, and modesty panel. Available in five finishes.",
      ar: "مكتب مدير متعدد الاستخدامات على شكل L مع امتداد ووحدة أدراج ولوح حياء. متوفر بخمس لمسات نهائية."
    },
    specs: { dimensions: "180 × 160 × 75 cm", persons: "1", finish: "Oak / Walnut / White" }
  },
  {
    id: "AD-102", category: "admin", featured: false,
    name: { en: "Admin Desk Classic", ar: "مكتب إداري كلاسيك" },
    series: { en: "Administrative", ar: "إداري" },
    price: 4400,
    image: "images/pages/prof_p13.jpg",
    gallery: ["images/pages/prof_p13.jpg"],
    desc: {
      en: "Classic single administrative desk with integrated drawer unit. Perfect for HR, finance, and operations.",
      ar: "مكتب إداري فردي كلاسيكي مع وحدة أدراج مدمجة. مثالي للموارد البشرية والمالية والعمليات."
    },
    specs: { dimensions: "160 × 80 × 75 cm", persons: "1", finish: "Beech / Walnut" }
  },
  {
    id: "AD-103", category: "admin", featured: true,
    name: { en: "Reception Counter Wave", ar: "كاونتر استقبال ويف" },
    series: { en: "Administrative", ar: "إداري" },
    price: 9800,
    image: "images/pages/prof_p13.jpg",
    gallery: ["images/pages/prof_p13.jpg"],
    desc: {
      en: "Sculpted reception counter with two work positions, raised guest counter, and LED brand strip.",
      ar: "كاونتر استقبال منحوت بموقعَي عمل وكاونتر ضيوف مرتفع وشريط LED للهوية."
    },
    specs: { dimensions: "280 × 80 × 110 cm", persons: "2", finish: "Custom" }
  },

  // ─────── MEETING ROOMS ───────
  {
    id: "MT-810", category: "meeting", featured: true,
    name: { en: "Boardroom Table Vida 10", ar: "طاولة قاعة اجتماعات فيدا ١٠" },
    series: { en: "Boardroom", ar: "قاعات المجلس" },
    price: 14500,
    image: "images/pages/prof_p14.jpg",
    gallery: ["images/pages/prof_p14.jpg"],
    desc: {
      en: "Ten-seater oval boardroom table with cable port, power module wells, and matte lacquer finish.",
      ar: "طاولة بيضاوية لعشرة أشخاص مع منافذ كابلات ووحدات طاقة ولمسة لكر مطفي."
    },
    specs: { dimensions: "400 × 140 × 75 cm", persons: "10", finish: "Walnut Matte" }
  },
  {
    id: "MT-606", category: "meeting", featured: false,
    name: { en: "Meeting Table 6", ar: "طاولة اجتماعات ٦" },
    series: { en: "Meeting", ar: "اجتماعات" },
    price: 6900,
    image: "images/pages/prof_p15.jpg",
    gallery: ["images/pages/prof_p15.jpg"],
    desc: {
      en: "Six-seater rectangular meeting table with central cable management and tempered glass top option.",
      ar: "طاولة اجتماعات مستطيلة لستة أشخاص مع إدارة كابلات مركزية وخيار سطح زجاج مقسّى."
    },
    specs: { dimensions: "240 × 110 × 75 cm", persons: "6", finish: "Oak" }
  },
  {
    id: "MT-404", category: "meeting", featured: true,
    name: { en: "Huddle Table 4", ar: "طاولة هادل ٤" },
    series: { en: "Meeting", ar: "اجتماعات" },
    price: 3200,
    image: "images/pages/prof_p15.jpg",
    gallery: ["images/pages/prof_p15.jpg"],
    desc: {
      en: "Compact four-seater huddle table — quick-meet, brainstorm, or breakout space companion.",
      ar: "طاولة هادل مدمجة لأربعة أشخاص — رفيق مثالي للاجتماعات السريعة والعصف الذهني."
    },
    specs: { dimensions: "120 × 120 × 75 cm", persons: "4", finish: "White / Oak" }
  },

  // ─────── CHAIRS ───────
  {
    id: "CH-EX01", category: "chair", featured: true,
    name: { en: "Executive Chair Alto", ar: "كرسي تنفيذي ألتو" },
    series: { en: "Executive Seating", ar: "كراسي تنفيذية" },
    price: 2800,
    image: "images/pages/prof_p18.jpg",
    gallery: ["images/pages/prof_p18.jpg"],
    desc: {
      en: "High-back executive chair in soft Italian leather, adjustable headrest, synchronized tilt, and aluminum base.",
      ar: "كرسي تنفيذي بظهر مرتفع من الجلد الإيطالي الناعم، مع مسند رأس قابل للتعديل وإمالة متزامنة وقاعدة من الألمنيوم."
    },
    specs: { dimensions: "70 × 70 × 125 cm", weight_capacity: "150 kg", finish: "Black Leather" }
  },
  {
    id: "CH-TS02", category: "chair", featured: true,
    name: { en: "Task Chair Mesh Pro", ar: "كرسي مكتبي ميش برو" },
    series: { en: "Task Seating", ar: "كراسي عمل" },
    price: 1400,
    image: "images/pages/prof_p19.jpg",
    gallery: ["images/pages/prof_p19.jpg"],
    desc: {
      en: "Ergonomic mesh-back task chair with adjustable lumbar support, 4D armrests, and seat depth adjustment.",
      ar: "كرسي مكتبي مريح بظهر شبكي مع دعم قطني قابل للتعديل ومساند ذراع 4D وتعديل عمق المقعد."
    },
    specs: { dimensions: "65 × 65 × 110 cm", weight_capacity: "130 kg", finish: "Black Mesh" }
  },
  {
    id: "CH-VS03", category: "chair", featured: false,
    name: { en: "Visitor Chair Bow", ar: "كرسي زائر باو" },
    series: { en: "Visitor Seating", ar: "كراسي زوار" },
    price: 850,
    image: "images/pages/prof_p19.jpg",
    gallery: ["images/pages/prof_p19.jpg"],
    desc: {
      en: "Cantilever visitor chair with bowed steel frame and upholstered seat. Stackable.",
      ar: "كرسي زائر معلّق بإطار فولاذي منحني ومقعد منجد. قابل للتكديس."
    },
    specs: { dimensions: "55 × 60 × 90 cm", weight_capacity: "120 kg", finish: "Chrome / Fabric" }
  },
  {
    id: "CH-CN04", category: "chair", featured: false,
    name: { en: "Conference Chair Plus", ar: "كرسي اجتماعات بلس" },
    series: { en: "Conference", ar: "اجتماعات" },
    price: 1100,
    image: "images/pages/prof_p20.jpg",
    gallery: ["images/pages/prof_p20.jpg"],
    desc: {
      en: "Mid-back conference chair with soft leatherette upholstery and polished aluminum base.",
      ar: "كرسي اجتماعات بظهر متوسط مع تنجيد جلدي ناعم وقاعدة ألمنيوم مصقولة."
    },
    specs: { dimensions: "60 × 65 × 110 cm", weight_capacity: "130 kg", finish: "Brown Leather" }
  },

  // ─────── STORAGE & FILING ───────
  {
    id: "ST-401", category: "storage", featured: true,
    name: { en: "Mobile Shelving System", ar: "نظام رفوف متحركة" },
    series: { en: "Archive", ar: "أرشفة" },
    price: 22000,
    image: "images/pages/prof_p20.jpg",
    gallery: ["images/pages/prof_p20.jpg"],
    desc: {
      en: "High-density mobile shelving system on rails — store up to 3× the documents in the same footprint.",
      ar: "نظام رفوف متحركة بكثافة عالية على قضبان — يخزن حتى 3 أضعاف المستندات في نفس المساحة."
    },
    specs: { dimensions: "Custom", capacity: "3× standard", finish: "Powder-coated steel" }
  },
  {
    id: "ST-202", category: "storage", featured: false,
    name: { en: "4-Drawer Filing Cabinet", ar: "خزانة ملفات ٤ أدراج" },
    series: { en: "Filing", ar: "ملفات" },
    price: 1900,
    image: "images/pages/prof_p20.jpg",
    gallery: ["images/pages/prof_p20.jpg"],
    desc: {
      en: "Steel 4-drawer letter-size filing cabinet with anti-tilt mechanism and central locking.",
      ar: "خزانة ملفات فولاذية بأربعة أدراج مع آلية مضادة للانقلاب وقفل مركزي."
    },
    specs: { dimensions: "45 × 60 × 132 cm", drawers: "4", finish: "Light Grey" }
  },
  {
    id: "ST-301", category: "storage", featured: false,
    name: { en: "Office Bookshelf Combo", ar: "رف كتب مكتبي كومبو" },
    series: { en: "Storage", ar: "تخزين" },
    price: 3400,
    image: "images/pages/prof_p20.jpg",
    gallery: ["images/pages/prof_p20.jpg"],
    desc: {
      en: "Modular bookshelf combo with open and closed compartments. Combines display and concealed storage.",
      ar: "رف كتب معياري مع مقصورات مفتوحة ومغلقة. يجمع بين العرض والتخزين المخفي."
    },
    specs: { dimensions: "180 × 40 × 200 cm", finish: "Oak / White" }
  },

  // ─────── CAFÉ FURNITURE ───────
  {
    id: "CF-101", category: "cafe", featured: true,
    name: { en: "Café Table Round 70", ar: "طاولة كافيه دائرية ٧٠" },
    series: { en: "Café", ar: "مقاهي" },
    price: 950,
    image: "images/pages/prof_p21.jpg",
    gallery: ["images/pages/prof_p21.jpg"],
    desc: {
      en: "Round café table with marble-look top and chrome pedestal base. Indoor and covered outdoor use.",
      ar: "طاولة كافيه دائرية بسطح يشبه الرخام وقاعدة كرومية. للاستخدام الداخلي والخارجي المغطى."
    },
    specs: { dimensions: "Ø 70 × 75 cm", finish: "Marble / Chrome" }
  },
  {
    id: "CF-102", category: "cafe", featured: false,
    name: { en: "Café Lounge Chair", ar: "كرسي كافيه لاونج" },
    series: { en: "Café", ar: "مقاهي" },
    price: 720,
    image: "images/pages/prof_p21.jpg",
    gallery: ["images/pages/prof_p21.jpg"],
    desc: {
      en: "Mid-century inspired café lounge chair with bouclé fabric and oak legs.",
      ar: "كرسي لاونج بإلهام منتصف القرن مع قماش بوكليه وأرجل من الأوك."
    },
    specs: { dimensions: "65 × 70 × 80 cm", finish: "Cream Bouclé" }
  },
  {
    id: "CF-103", category: "cafe", featured: true,
    name: { en: "High-Top Bar Set", ar: "طاولة بار عالية" },
    series: { en: "Café", ar: "مقاهي" },
    price: 1800,
    image: "images/pages/prof_p22.jpg",
    gallery: ["images/pages/prof_p22.jpg"],
    desc: {
      en: "High-top bar table with two matching stools. Perfect for break rooms and coffee corners.",
      ar: "طاولة بار عالية مع كرسيين بار متناسقين. مثالية لغرف الاستراحة وزوايا القهوة."
    },
    specs: { dimensions: "60 × 60 × 105 cm", pieces: "1 table + 2 stools", finish: "Walnut" }
  },

  // ─────── STADIUM FURNITURE ───────
  {
    id: "SD-101", category: "stadium", featured: true,
    name: { en: "Stadium Seat Pro", ar: "كرسي ملاعب برو" },
    series: { en: "Stadium", ar: "ملاعب" },
    price: 220,
    image: "images/pages/prof_p23.jpg",
    gallery: ["images/pages/prof_p23.jpg"],
    desc: {
      en: "Heavy-duty stadium tip-up seat with UV-resistant polypropylene shell and steel mounting bracket. Fire-rated.",
      ar: "كرسي ملاعب قابل للطي بقشرة بولي بروبيلين مقاومة للأشعة فوق البنفسجية وقاعدة فولاذية. مقاوم للحريق."
    },
    specs: { dimensions: "45 × 50 × 80 cm", finish: "Multi-color", mounting: "Floor or beam" }
  },
  {
    id: "SD-102", category: "stadium", featured: false,
    name: { en: "VIP Stadium Seat", ar: "كرسي ملاعب VIP" },
    series: { en: "Stadium", ar: "ملاعب" },
    price: 880,
    image: "images/pages/prof_p23.jpg",
    gallery: ["images/pages/prof_p23.jpg"],
    desc: {
      en: "Cushioned VIP stadium seat with armrests, cup holder, and personalized engraving option.",
      ar: "كرسي ملاعب VIP منجد مع مساند ذراع وحامل كوب وخيار نقش شخصي."
    },
    specs: { dimensions: "55 × 60 × 95 cm", finish: "Leather / Steel" }
  },

  // ─────── SCHOOL FURNITURE ───────
  {
    id: "SC-101", category: "school", featured: true,
    name: { en: "Student Desk Single", ar: "مكتب طالب فردي" },
    series: { en: "School", ar: "مدارس" },
    price: 340,
    image: "images/pages/prof_p24.jpg",
    gallery: ["images/pages/prof_p24.jpg"],
    desc: {
      en: "Ergonomic single student desk with book storage tray below. Stackable and easy to clean.",
      ar: "مكتب طالب فردي مريح مع رف لتخزين الكتب أسفل المقعد. قابل للتكديس وسهل التنظيف."
    },
    specs: { dimensions: "60 × 45 × 75 cm", finish: "Beech" }
  },
  {
    id: "SC-102", category: "school", featured: false,
    name: { en: "Student Chair Ergo", ar: "كرسي طالب إرجو" },
    series: { en: "School", ar: "مدارس" },
    price: 180,
    image: "images/pages/prof_p24.jpg",
    gallery: ["images/pages/prof_p24.jpg"],
    desc: {
      en: "Ergonomic student chair with anti-bacterial polypropylene seat and powder-coated steel frame.",
      ar: "كرسي طالب مريح بمقعد بولي بروبيلين مضاد للبكتيريا وإطار فولاذي مطلي بالبودرة."
    },
    specs: { dimensions: "40 × 40 × 80 cm", finish: "Blue / Yellow / Red" }
  },
  {
    id: "SC-103", category: "school", featured: true,
    name: { en: "Teacher's Desk", ar: "مكتب معلّم" },
    series: { en: "School", ar: "مدارس" },
    price: 1400,
    image: "images/pages/prof_p25.jpg",
    gallery: ["images/pages/prof_p25.jpg"],
    desc: {
      en: "Teacher's desk with locking drawer, cable port, and chalk/marker tray.",
      ar: "مكتب معلّم مع درج بقفل ومنفذ كابل ورف للطباشير والأقلام."
    },
    specs: { dimensions: "140 × 65 × 75 cm", finish: "Oak / White" }
  }
];

// Make available globally
window.CATEGORIES = CATEGORIES;
window.PRODUCTS = PRODUCTS;
