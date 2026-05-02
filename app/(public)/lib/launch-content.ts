import type { PublicLocale } from "./public-routing";

export type PublicBlock =
  | {
      type: "hero";
      heading: string;
      subtext?: string;
      body?: string;
      ctaLabel?: string;
      ctaHref?: string;
    }
  | {
      type: "text";
      heading?: string;
      body?: string;
      content?: string;
    }
  | {
      type: "feature-list";
      heading?: string;
      subtext?: string;
      items: string[];
    }
  | {
      type: "stats";
      heading?: string;
      stats: Array<{ label: string; value: string }>;
    }
  | {
      type: "decision-system-preview";
    }
  | {
      type: "cta";
      heading: string;
      body?: string;
      ctaLabel?: string;
      ctaHref?: string;
    };

export type PublicPageContent = {
  locale: PublicLocale;
  slug: string;
  title: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  source: "admin" | "fallback";
  blocks: PublicBlock[];
};

type FallbackInput = Omit<PublicPageContent, "locale" | "source">;

const trHome: FallbackInput = {
  slug: "",
  title: "Skyvan",
  description:
    "Skyvan, karavan kararlarını rota, yaşam senaryosu, risk ve üretim hazırlığı üzerinden sakin ve güvenilir bir sisteme dönüştürür.",
  seoTitle: "Skyvan | Sistemli Karavan Üretimi",
  seoDescription:
    "Skyvan; rota, yaşam senaryosu, risk ve üretim hazırlığını aynı kontrollü karar sisteminde buluşturan premium karavan yaklaşımıdır.",
  blocks: [
    {
      type: "hero",
      heading: "Karavan kararı, güven veren bir hazırlıkla başlar.",
      subtext: "Skyvan; rota, yaşam düzeni, teknik risk ve üretim hazırlığını aynı sakin karar sisteminde netleştirir.",
      body:
        "Burada canlı bir demo ya da satış akışı varmış gibi davranmayız. Skyvan, karar öncesi bağlamı düzenler; neyin hazır, neyin onay beklediğini açıkça gösterir.",
      ctaLabel: "Proje Başlat",
      ctaHref: "/tr/proje-baslat",
    },
    {
      type: "text",
      heading: "Özgürlük hissi, güvenilir kararlarla başlar",
      body:
        "İyi bir karavan yalnızca yatak, mutfak veya depolama seçimi değildir. Nerede duracağını, nasıl yaşayacağını, hangi teknik sınırların konforunu etkilediğini ve hangi kararların üretime hazır olduğunu birlikte düşünür.",
    },
    {
      type: "feature-list",
      heading: "Skyvan nasıl düşünür?",
      subtext: "Karavan fikri; acele seçimlerden uzak, bağlamı açık, riski görünür ve üretime hazırlanabilir bir karar akışına dönüşür.",
      items: [
        "Veri",
        "Senaryo",
        "Risk",
        "Öneri",
        "Kontrol",
        "Üretim Hazırlığı",
      ],
    },
    {
      type: "text",
      heading: "Skyvan AI kararın yerini almaz",
      body:
        "Skyvan AI bir chatbot değildir.\nFinal teknik, ticari veya üretim kararı vermez.\nKarar öncesi bağlamı açıklar, riskleri görünür kılar ve insan onayını daha bilinçli hale getirir.",
    },
    {
      type: "feature-list",
      heading: "Kendi Karavanını Tasarla — Çok Yakında",
      subtext:
        "Skyvan Workshop henüz aktif bir configurator değildir. Bu alan, yaklaşan tasarım deneyiminin net sınırlarla konumlanan dürüst duyurusudur.",
      items: [
        "Bugün seçim, fiyatlandırma, form gönderimi veya lead kaydı başlatmaz.",
        "Açıldığında rota, konfor ve yaşam alışkanlıklarını daha net düşünmeye yardımcı olacak.",
        "Kararın yerine geçmeyen, hazırlığı güçlendiren kontrollü bir deneyim olarak konumlanacak.",
      ],
    },
    {
      type: "feature-list",
      heading: "Üretim ve müşteri yolculuğu",
      items: [
        "Rota, mevsim ve günlük yaşam ihtiyacı sade bir çerçevede anlaşılır.",
        "Araç, yaşam düzeni, enerji ve depolama beklentileri teknik bağlama oturur.",
        "Riskler, eksikler ve onay bekleyen kararlar erken görünür hale gelir.",
        "Admin yayın gerçekliği ve insan onayı güven sınırını korur.",
      ],
    },
    {
      type: "cta",
      heading: "Yolculuğun güvenilir bir hazırlıkla başlasın",
      body:
        "Skyvan yaklaşımını keşfet; rota, konfor, risk ve üretim hazırlığını daha kontrollü bir başlangıçta bir araya getir. Proje başlatma sayfası şu anda yalnızca güvenli bir bilgilendirme yüzeyidir.",
      ctaLabel: "Proje Başlat",
      ctaHref: "/tr/proje-baslat",
    },
  ],
};

const enHome: FallbackInput = {
  slug: "",
  title: "Skyvan",
  description:
    "Skyvan turns caravan decisions into a calm system of route context, living scenarios, risk, and production readiness.",
  seoTitle: "Skyvan | Premium Caravan Production",
  seoDescription:
    "Skyvan connects route, living scenarios, risk, and production readiness through a controlled premium caravan decision system.",
  blocks: [
    {
      type: "hero",
      heading: "A caravan decision starts with trusted preparation.",
      subtext: "Skyvan clarifies route, living layout, technical risk, and production readiness inside one calm decision system.",
      body:
        "We do not pretend a live demo or sales flow exists. Skyvan organizes pre-decision context and shows what is ready, what is bounded, and what still needs approval.",
      ctaLabel: "Start Project",
      ctaHref: "/en/proje-baslat",
    },
    {
      type: "text",
      heading: "Freedom starts with decisions you can trust",
      body:
        "A great caravan is more than a bed, kitchen, or storage choice. It is where you stop, how you live, which technical limits shape comfort, and which decisions are ready for production.",
    },
    {
      type: "feature-list",
      heading: "How Skyvan thinks",
      subtext: "A caravan idea becomes a decision flow with clear context, visible risk, and production preparation that can be trusted.",
      items: [
        "Data",
        "Scenario",
        "Risk",
        "Guidance",
        "Control",
        "Production Readiness",
      ],
    },
    {
      type: "text",
      heading: "Skyvan AI does not replace decisions",
      body:
        "Skyvan AI is not a chatbot.\nIt does not make final technical, commercial, or production decisions.\nIt explains context, surfaces risks, and helps human approval become better informed.",
    },
    {
      type: "feature-list",
      heading: "Design Your Own Caravan — Coming Soon",
      subtext:
        "Skyvan Workshop is not an active configurator yet. This section is a clear, bounded announcement of the design experience ahead.",
      items: [
        "Today, it starts no selection, pricing, form submission, or lead record.",
        "When it opens, it will help route, comfort, and living habits become easier to think through.",
        "It will remain a controlled experience that strengthens preparation rather than deciding for you.",
      ],
    },
    {
      type: "feature-list",
      heading: "Production and customer journey",
      items: [
        "Understand route, season, and everyday living needs through a simple frame.",
        "Place vehicle, layout, energy, and storage expectations into technical context.",
        "Surface risks, missing inputs, and decisions that still need approval.",
        "Keep trust bounded by admin publish state and human approval.",
      ],
    },
    {
      type: "cta",
      heading: "Begin the journey with trusted preparation",
      body:
        "Explore the Skyvan approach and bring route, comfort, risk, and production readiness into a more controlled beginning. The start-project page is currently a safe information surface only.",
      ctaLabel: "Start Project",
      ctaHref: "/en/proje-baslat",
    },
  ],
};

const trPages: Record<string, FallbackInput> = {
  sistem: {
    slug: "sistem",
    title: "Skyvan Sistem",
    description: "Skyvan public site, admin ve mühendislik katmanlarının nasıl tek üretim omurgasına bağlandığını anlatır.",
    seoTitle: "Skyvan Sistem | Admin Kontrollü Karavan Omurgası",
    seoDescription: "Skyvan sistemi; Admin Pages, medya, SEO, mühendislik uyarıları ve public render katmanını güvenli şekilde bağlar.",
    blocks: [
      { type: "hero", heading: "Karavan üretimi bir sistem meselesidir.", subtext: "Skyvan, public deneyimi admin tarafından yönetilen gerçek içerikle besler." },
      { type: "feature-list", heading: "Ana katmanlar", items: ["Admin Pages yayın gerçekliğini belirler.", "Public site yalnızca güvenli ve yayınlanmış içeriği okur.", "Mühendislik çekirdeği karar hazırlığını destekler.", "Audit ve publish akışı içerik güvenini korur."] },
      { type: "text", heading: "Premium ama kontrollü", body: "Skyvan görsel olarak sakin ve güçlü bir marka deneyimi sunarken, operasyonel gerçekliği bypass etmez. Her public sayfa admin tarafından yayınlanmış içerikle beslenebilir; aksi durumda zengin yerleşik lansman içeriği gösterilir." },
      { type: "cta", heading: "Sistemin çalışma mantığını incele", ctaLabel: "Nasıl Çalışır", ctaHref: "/tr/nasil-calisir" },
    ],
  },
  "nasil-calisir": {
    slug: "nasil-calisir",
    title: "Skyvan Nasıl Çalışır",
    description: "Skyvan, içerik yönetişimi ve mühendislik hazırlığını public deneyime güvenli şekilde taşır.",
    seoTitle: "Skyvan Nasıl Çalışır | İçerikten Üretime",
    seoDescription: "Skyvan çalışma modeli; admin onayı, public yayın, AI destekli hazırlık ve üretim sürecini kontrollü biçimde bağlar.",
    blocks: [
      { type: "hero", heading: "Önce gerçeklik, sonra vitrin.", subtext: "Public site admin onayını bekler; güvenli içerik yoksa marka anlatımıyla boşluk bırakmaz." },
      { type: "feature-list", heading: "Akış", items: ["İçerik Admin Pages içinde hazırlanır.", "SEO, açıklama ve yayın durumu kontrol edilir.", "Public route içeriği read-only olarak okur.", "Müşteri deneyimi sade, hızlı ve premium kalır."] },
      { type: "text", heading: "AI rolü", body: "Skyvan AI is not a chatbot. Açıklar, uyarır, yönlendirir ve hazırlığı destekler; final teknik, ticari, publish veya fiyatlandırma kararı vermez." },
      { type: "cta", heading: "Karavan deneyimini keşfet", ctaLabel: "Karavan Deneyimi", ctaHref: "/tr/karavan-deneyimi" },
    ],
  },
  "karavan-deneyimi": {
    slug: "karavan-deneyimi",
    title: "Karavan Deneyimi",
    description: "Skyvan, karavan deneyimini yaşam düzeni, güvenlik ve üretim hazırlığı üzerinden ele alır.",
    seoTitle: "Karavan Deneyimi | Skyvan",
    seoDescription: "Skyvan karavan deneyimi; yaşam senaryosu, yol konforu, depolama, enerji ve mühendislik hazırlığını birlikte düşünür.",
    blocks: [
      { type: "hero", heading: "Karavan yalnızca araç değil, kararlar bütünüdür.", subtext: "Yatak, mutfak, enerji, depolama ve yol alışkanlıkları aynı sistem içinde değerlendirilir." },
      { type: "feature-list", heading: "Deneyim odağı", items: ["Gerçek kullanım senaryosu netleştirilir.", "Konfor ve teknik gereklilik birlikte düşünülür.", "Görsel beklenti ile üretim gerçekliği ayrıştırılır.", "Her karar üretime hazırlık açısından anlamlandırılır."] },
      { type: "stats", heading: "Bakış açısı", stats: [{ label: "Yaşam", value: "Düzen" }, { label: "Yol", value: "Güven" }, { label: "Üretim", value: "Hazırlık" }] },
      { type: "cta", heading: "Mühendislik yaklaşımını gör", ctaLabel: "Mühendislik", ctaHref: "/tr/muhendislik" },
    ],
  },
  muhendislik: {
    slug: "muhendislik",
    title: "Mühendislik",
    description: "Skyvan mühendisliği karar hazırlığı, uyarı üretimi ve teknik güven üzerine kurulur.",
    seoTitle: "Skyvan Mühendislik | Teknik Güven ve Hazırlık",
    seoDescription: "Skyvan mühendislik yaklaşımı; açıklanabilir uyarılar, teknik hazırlık ve nihai kararların insan onayında kalması üzerine kuruludur.",
    blocks: [
      { type: "hero", heading: "Mühendislik kararın yerini almaz; kararı hazırlar.", subtext: "Skyvan teknik riskleri görünür kılar ve karar sahiplerine daha iyi bağlam verir." },
      { type: "text", heading: "AI sınırı", body: "Skyvan AI is not a chatbot. Açıklar, uyarır, yönlendirir ve hazırlığı destekler. Final teknik, ticari, publish veya fiyatlandırma kararlarını vermez." },
      { type: "feature-list", heading: "Güven katmanları", items: ["Uyumluluk sinyalleri görünür olur.", "Eksikler erken fark edilir.", "Admin publish kararı içerik kalitesini korur.", "Teknik sorumluluk sistem dışına itilmez."] },
      { type: "cta", heading: "Üretim sürecine geç", ctaLabel: "Üretim Süreci", ctaHref: "/tr/uretim-sureci" },
    ],
  },
  "uretim-sureci": {
    slug: "uretim-sureci",
    title: "Üretim Süreci",
    description: "Skyvan üretim süreci, müşteri ihtiyacından teknik hazırlığa uzanan kontrollü bir yolculuktur.",
    seoTitle: "Skyvan Üretim Süreci | Kontrollü Karavan Hazırlığı",
    seoDescription: "Skyvan üretim süreci; ihtiyaç keşfi, teknik hazırlık, kontrollü karar ve admin yönetimli yayın omurgasıyla ilerler.",
    blocks: [
      { type: "hero", heading: "Üretim, iyi hazırlanmış kararla başlar.", subtext: "Skyvan üretim yolculuğunu acele satıştan çok doğru hazırlık üzerine kurar." },
      { type: "feature-list", heading: "Yolculuk", items: ["İhtiyaç ve kullanım profili anlaşılır.", "Araç ve düzen beklentileri belirlenir.", "Teknik riskler ve eksikler değerlendirilir.", "Onaylı anlatım public sitede güvenle yayınlanır."] },
      { type: "text", heading: "Workshop teaser", body: "Kendi Karavanını Tasarla deneyimi çok yakında. Bu public sayfa gerçek configurator, fiyatlandırma veya lead akışı başlatmaz." },
      { type: "cta", heading: "Sık soruları incele", ctaLabel: "SSS", ctaHref: "/tr/sss" },
    ],
  },
  sss: {
    slug: "sss",
    title: "Sık Sorulan Sorular",
    description: "Skyvan hakkında public site, AI rolü, workshop teaser ve proje başlatma yaklaşımı.",
    seoTitle: "Skyvan SSS | Sık Sorulan Sorular",
    seoDescription: "Skyvan SSS; AI rolü, public site, admin yayın sistemi, workshop teaser ve güvenli proje niyeti hakkında yanıtlar sunar.",
    blocks: [
      { type: "hero", heading: "Sık sorulan sorular", subtext: "Skyvan'ın ne yaptığı kadar ne yapmadığı da bilinçli olarak tanımlıdır." },
      { type: "feature-list", heading: "Kısa yanıtlar", items: ["Public site DB'ye yazmaz; yalnızca güvenli içerik okur.", "Workshop şimdilik tanıtım seviyesindedir.", "AI chatbot değildir ve final karar vermez.", "Proje başlat sayfası form veya lead kaydı oluşturmaz."] },
      { type: "cta", heading: "İletişim niyetini güvenli şekilde incele", ctaLabel: "İletişim", ctaHref: "/tr/iletisim" },
    ],
  },
  iletisim: {
    slug: "iletisim",
    title: "İletişim",
    description: "Skyvan iletişim sayfası, güvenli ve yazma işlemi yapmayan public bilgilendirme yüzeyidir.",
    seoTitle: "Skyvan İletişim | Güvenli Public Bilgilendirme",
    seoDescription: "Skyvan iletişim sayfası public tarafta form gönderimi veya lead kaydı yapmadan proje niyetini açıklar.",
    blocks: [
      { type: "hero", heading: "İletişim deneyimi kontrollü açılacak.", subtext: "Bu sayfa şu anda bilgilendirme yüzeyidir; form gönderimi veya lead kaydı yapmaz." },
      { type: "text", heading: "Güvenli yaklaşım", body: "Skyvan public site üretim ve satış akışlarını tetiklemez. İletişim ve proje başlatma yüzeyleri lansman döneminde niyet ve hazırlık anlatımı olarak çalışır." },
      { type: "cta", heading: "Proje niyet sayfasına geç", ctaLabel: "Proje Başlat", ctaHref: "/tr/proje-baslat" },
    ],
  },
  "proje-baslat": {
    slug: "proje-baslat",
    title: "Proje Başlat",
    description: "Skyvan proje başlat sayfası, güvenli coming-soon ve contact-intent deneyimidir.",
    seoTitle: "Skyvan Proje Başlat | Çok Yakında",
    seoDescription: "Skyvan proje başlat sayfası şu anda güvenli bir coming-soon yüzeyidir; form, lead kaydı, fiyatlandırma veya configurator içermez.",
    blocks: [
      { type: "hero", heading: "Proje başlatma deneyimi çok yakında.", subtext: "Bu sayfa güvenli bir contact-intent yüzeyidir. Form gönderimi, lead kaydı, fiyatlandırma veya configurator bağlantısı içermez." },
      { type: "feature-list", heading: "Şu anda ne yapar?", items: ["Skyvan yaklaşımını açıklar.", "Proje hazırlığı için beklenti oluşturur.", "Operasyonel kayıt veya teklif akışı başlatmaz.", "Public siteyi read-only tutar."] },
      { type: "cta", heading: "Sistemi keşfetmeye devam et", ctaLabel: "Ana Sayfa", ctaHref: "/tr" },
    ],
  },
};

const enPages: Record<string, FallbackInput> = Object.fromEntries(
  Object.entries(trPages).map(([slug, page]) => [
    slug,
    {
      ...page,
      title:
        {
          sistem: "Skyvan System",
          "nasil-calisir": "How Skyvan Works",
          "karavan-deneyimi": "Caravan Experience",
          muhendislik: "Engineering",
          "uretim-sureci": "Production Process",
          sss: "FAQ",
          iletisim: "Contact",
          "proje-baslat": "Start Project",
        }[slug] ?? page.title,
      description:
        slug === "proje-baslat"
          ? "A safe coming-soon contact-intent page with no form submission, lead creation, pricing, or configurator link."
          : `Skyvan ${slug} page for the governed public launch experience.`,
      seoTitle:
        {
          sistem: "Skyvan System | Governed Caravan Platform",
          "nasil-calisir": "How Skyvan Works | From Content to Production",
          "karavan-deneyimi": "Caravan Experience | Skyvan",
          muhendislik: "Skyvan Engineering | Trust and Preparation",
          "uretim-sureci": "Skyvan Production Process",
          sss: "Skyvan FAQ",
          iletisim: "Skyvan Contact",
          "proje-baslat": "Start a Skyvan Project | Coming Soon",
        }[slug] ?? page.seoTitle,
      seoDescription:
        slug === "proje-baslat"
          ? "The Skyvan start-project page is currently a safe coming-soon surface with no form, lead creation, pricing, or configurator."
          : "Learn how Skyvan connects governed content, engineering preparation, and a premium read-only public website.",
      blocks: translateBlocks(slug, page.blocks),
    },
  ]),
);

function translateBlocks(slug: string, blocks: PublicBlock[]): PublicBlock[] {
  if (slug === "proje-baslat") {
    return [
      {
        type: "hero",
        heading: "Project start is coming soon.",
        subtext:
          "This is a safe contact-intent page. It has no form submission, lead creation, pricing, or configurator link.",
      },
      {
        type: "feature-list",
        heading: "What it does today",
        items: [
          "Explains the Skyvan approach.",
          "Sets expectations for project preparation.",
          "Does not trigger offers or operational records.",
          "Keeps the public website read-only.",
        ],
      },
      { type: "cta", heading: "Continue exploring the system", ctaLabel: "Home", ctaHref: "/en" },
    ];
  }

  if (slug === "muhendislik") {
    return [
      { type: "hero", heading: "Engineering prepares decisions; it does not replace them.", subtext: "Skyvan makes technical risks visible and gives decision owners better context." },
      { type: "text", heading: "AI boundary", body: "Skyvan AI is not a chatbot. It explains, warns, guides, and supports preparation. It does not make final technical, commercial, publish, or pricing decisions." },
      { type: "feature-list", heading: "Trust layers", items: ["Compatibility signals become visible.", "Missing context is surfaced early.", "Admin publish state protects content quality.", "Technical responsibility remains governed."] },
      { type: "cta", heading: "Review the production process", ctaLabel: "Production Process", ctaHref: "/en/uretim-sureci" },
    ];
  }

  return blocks.map((block) => {
    if (block.type === "hero") {
      return {
        ...block,
        heading:
          slug === "sistem"
            ? "Caravan production is a system problem."
            : slug === "nasil-calisir"
              ? "Reality first. Showcase second."
              : slug === "karavan-deneyimi"
                ? "A caravan is not only a vehicle. It is a set of decisions."
                : slug === "uretim-sureci"
                  ? "Production starts with a well-prepared decision."
                  : slug === "sss"
                    ? "Frequently asked questions"
                    : slug === "iletisim"
                      ? "Contact experience will open in a controlled way."
                      : block.heading,
        subtext: block.subtext
          ? "Skyvan connects governed content, engineering preparation, and a premium public experience."
          : block.subtext,
      };
    }

    if (block.type === "feature-list") {
      return {
        ...block,
        items: block.items.map((item) =>
          item
            .replace("Public site", "The public site")
            .replace("AI chatbot değildir ve final karar vermez.", "AI is not a chatbot and does not make final decisions.")
            .replace("Workshop şimdilik tanıtım seviyesindedir.", "The Workshop is currently a teaser only."),
        ),
      };
    }

    return block;
  });
}

export const fallbackSlugs = Object.keys(trPages);

export function getFallbackPage(locale: PublicLocale, slug?: string | null): PublicPageContent {
  const normalizedSlug = String(slug ?? "").trim();
  const source = locale === "en" ? enPages : trPages;
  const fallback = normalizedSlug ? source[normalizedSlug] : locale === "en" ? enHome : trHome;

  if (fallback) {
    return {
      ...fallback,
      locale,
      source: "fallback",
    };
  }

  return {
    locale,
    source: "fallback",
    slug: normalizedSlug,
    title: locale === "tr" ? "Skyvan Sayfası" : "Skyvan Page",
    description:
      locale === "tr"
        ? "Bu Skyvan sayfası için yayınlanmış Admin Page bulunamadı; güvenli lansman anlatımı gösteriliyor."
        : "No published Admin Page was found for this Skyvan page, so a safe launch narrative is shown.",
    seoTitle: locale === "tr" ? "Skyvan | Güvenli Public Sayfa" : "Skyvan | Safe Public Page",
    seoDescription:
      locale === "tr"
        ? "Skyvan public route, yayınlanmış Admin Page yoksa güvenli ve zengin yerleşik içerik gösterir."
        : "Skyvan public routes render safe built-in content when no published Admin Page is available.",
    blocks: [
      {
        type: "hero",
        heading: locale === "tr" ? "Bu sayfa güvenli şekilde hazırlanıyor." : "This page is being prepared safely.",
        subtext:
          locale === "tr"
            ? "Yayınlanmış admin içeriği oluşana kadar Skyvan public deneyimi boş kalmaz."
            : "Until approved admin content exists, the Skyvan public experience stays polished and useful.",
      },
      {
        type: "text",
        heading: locale === "tr" ? "Yayın güvenliği" : "Publishing safety",
        body:
          locale === "tr"
            ? "Public site DB'ye yazmaz, operasyonel akış başlatmaz ve yalnızca güvenli içerik okur."
            : "The public site never writes to the database, does not trigger operational flows, and only reads safe content.",
      },
      {
        type: "cta",
        heading: locale === "tr" ? "Ana anlatıma dön" : "Return to the main story",
        ctaLabel: locale === "tr" ? "Ana Sayfa" : "Home",
        ctaHref: `/${locale}`,
      },
    ],
  };
}
