export type V2Locale = "tr" | "en";

export type V2PageKey =
  | "home"
  | "system"
  | "howItWorks"
  | "engineering"
  | "experience"
  | "media"
  | "workshop"
  | "startProject"
  | "about"
  | "contact";

export type V2PageDefinition = {
  key: V2PageKey;
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
};

export const V2_LOCALES: V2Locale[] = ["tr", "en"];

const pagesByLocale: Record<V2Locale, Record<V2PageKey, V2PageDefinition>> = {
  tr: {
    home: {
      key: "home",
      slug: "",
      title: "Skyvan",
      eyebrow: "Skyvan Journey OS",
      description:
        "Skyvan, karavan kararını rota, yaşam, risk, enerji ve üretim hazırlığıyla birlikte ele alan yeni deneyim alanıdır.",
    },
    system: {
      key: "system",
      slug: "sistem",
      title: "Sistem",
      eyebrow: "Platform omurgası",
      description:
        "Skyvan, Workshop dahil her modülü daha büyük bir karar hazırlığı sistemi içinde konumlandırır.",
    },
    howItWorks: {
      key: "howItWorks",
      slug: "nasil-calisir",
      title: "Nasıl Çalışır",
      eyebrow: "Kontrollü yolculuk",
      description:
        "Hayal edilen rota, yaşam senaryosu ve teknik sınırlar üretime hazırlanabilir bir karara dönüşür.",
    },
    engineering: {
      key: "engineering",
      slug: "muhendislik",
      title: "Mühendislik",
      eyebrow: "Teknik güven",
      description:
        "Skyvan yaklaşımı, görsel beklenti ile üretim gerçekliğini aynı güven çizgisinde tutar.",
    },
    experience: {
      key: "experience",
      slug: "deneyim",
      title: "Deneyim",
      eyebrow: "Yaşam senaryosu",
      description:
        "Doğru karavan, nerede duracağını, nasıl yaşayacağını ve hangi konforun gerçekten gerekli olduğunu bilerek şekillenir.",
    },
    media: {
      key: "media",
      slug: "medya",
      title: "Medya",
      eyebrow: "Görsel güven",
      description:
        "Skyvan görselleştirir; ama üretilebilirlik, teknik sınır ve marka güvenini koruyarak ilerler.",
    },
    workshop: {
      key: "workshop",
      slug: "workshop",
      title: "Workshop",
      eyebrow: "Kontrollü erişim",
      description:
        "Workshop rastgele seçim için değil, doğru hazırlanmış proje yolculuğu için açılacaktır.",
    },
    startProject: {
      key: "startProject",
      slug: "proje-baslat",
      title: "Proje Başlat",
      eyebrow: "Başlangıç",
      description:
        "Skyvan proje yolculuğu, acele seçimden önce bağlamı ve üretim hazırlığını netleştirir.",
    },
    about: {
      key: "about",
      slug: "hakkimizda",
      title: "Hakkımızda",
      eyebrow: "Skyvan yaklaşımı",
      description:
        "Skyvan, karavanı yalnızca araç olarak değil, karar, yaşam ve üretim sistemi olarak ele alır.",
    },
    contact: {
      key: "contact",
      slug: "iletisim",
      title: "İletişim",
      eyebrow: "Bağlantı",
      description:
        "Skyvan iletişim yüzeyi, kontrollü proje yolculuğu için hazırlanacaktır.",
    },
  },
  en: {
    home: {
      key: "home",
      slug: "",
      title: "Skyvan",
      eyebrow: "Skyvan Journey OS",
      description:
        "Skyvan is the new public experience for preparing caravan decisions through route, living, risk, energy, and production readiness.",
    },
    system: {
      key: "system",
      slug: "system",
      title: "System",
      eyebrow: "Platform structure",
      description:
        "Skyvan positions every module, including Workshop, inside a larger decision-preparation system.",
    },
    howItWorks: {
      key: "howItWorks",
      slug: "how-it-works",
      title: "How It Works",
      eyebrow: "Controlled journey",
      description:
        "The imagined route, living scenario, and technical boundaries become a decision that can be prepared for production.",
    },
    engineering: {
      key: "engineering",
      slug: "engineering",
      title: "Engineering",
      eyebrow: "Technical confidence",
      description:
        "Skyvan keeps visual expectation and production reality on the same line of trust.",
    },
    experience: {
      key: "experience",
      slug: "experience",
      title: "Experience",
      eyebrow: "Living scenario",
      description:
        "The right caravan starts by knowing where you stop, how you live, and which comfort truly matters.",
    },
    media: {
      key: "media",
      slug: "media",
      title: "Media",
      eyebrow: "Visual trust",
      description:
        "Skyvan visualizes without breaking buildability, technical boundaries, or brand trust.",
    },
    workshop: {
      key: "workshop",
      slug: "workshop",
      title: "Workshop",
      eyebrow: "Controlled access",
      description:
        "Workshop will open for a prepared project journey, not random selection.",
    },
    startProject: {
      key: "startProject",
      slug: "start-project",
      title: "Start Project",
      eyebrow: "Beginning",
      description:
        "The Skyvan project journey clarifies context and production readiness before rushed selection.",
    },
    about: {
      key: "about",
      slug: "about",
      title: "About",
      eyebrow: "Skyvan approach",
      description:
        "Skyvan treats the caravan as a system of decisions, living, and production, not only as a vehicle.",
    },
    contact: {
      key: "contact",
      slug: "contact",
      title: "Contact",
      eyebrow: "Connection",
      description:
        "The Skyvan contact surface will support the controlled project journey.",
    },
  },
};

export function isV2Locale(value: string): value is V2Locale {
  return value === "tr" || value === "en";
}

export function getV2Page(locale: V2Locale, key: V2PageKey) {
  return pagesByLocale[locale][key];
}

export function getV2Pages(locale: V2Locale) {
  return pagesByLocale[locale];
}

export function getV2Path(locale: V2Locale, key: V2PageKey) {
  const page = getV2Page(locale, key);
  return page.slug ? `/v2/${locale}/${page.slug}` : `/v2/${locale}`;
}

export function getV2PageBySlug(locale: V2Locale, slug: string) {
  const normalizedSlug = slug.trim();
  return Object.values(pagesByLocale[locale]).find((page) => page.slug === normalizedSlug) ?? null;
}
