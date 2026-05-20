import type { V2Locale } from "./v2-routing";
import type { V2MediaSlotKey } from "./v2-media-slots";

export type PublicV2Media = {
  type: "image" | "video" | "empty";
  src?: string;
  poster?: string;
  alt?: string;
  eyebrow?: string;
  title?: string;
  caption?: string;
  slotName: string;
  slotKey: V2MediaSlotKey;
};

export type V2TheatreTone = "hero" | "scenario" | "proof" | "workshop";

export type V2HomeContent = {
  nav: {
    project: string;
    languageLabel: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    body: string;
    primaryCta: string;
    secondaryCta: string;
    media: PublicV2Media;
  };
  journey: {
    items: string[];
  };
  scenario: {
    title: string;
    body: string;
    questions: string[];
    media: PublicV2Media;
  };
  truth: {
    title: string;
    body: string;
    proofPoints: string[];
    media: PublicV2Media;
  };
  workshop: {
    title: string;
    body: string;
    details: string[];
    media: PublicV2Media;
  };
  final: {
    title: string;
    cta: string;
  };
  footer: {
    sentence: string;
  };
};

export const publicV2HomeContent: Record<V2Locale, V2HomeContent> = {
  tr: {
    nav: {
      project: "Proje Başlat",
      languageLabel: "EN",
    },
    hero: {
      eyebrow: "SKYVAN STUDIO",
      title: "Karavan kararını görsel, teknik ve üretilebilir bir sisteme dönüştürüyoruz.",
      body:
        "Skyvan; araç, yaşam senaryosu, ürün seçimi ve üretim gerçekliğini tek kontrollü akışta birleştirir.",
      primaryCta: "Proje Başlat",
      secondaryCta: "Sistemi Keşfet",
      media: {
        type: "empty",
        slotName: "hero",
        slotKey: "hero",
        eyebrow: "Skyvan medya sahnesi",
        title: "Medya sahnesi hazırlanıyor",
        caption: "Hero sahnesi",
      },
    },
    journey: {
      items: ["Rota", "Yaşam", "Risk", "Enerji", "Üretim"],
    },
    scenario: {
      title: "Önce yaşam senaryosu netleşir.",
      body:
        "Skyvan’da konfigürasyon, rastgele ürün seçimiyle değil; rota, kullanım biçimi, bağımsızlık ihtiyacı ve teknik sınırlarla başlar.",
      questions: [
        "Nerede yaşayacak?",
        "Ne kadar bağımsız kalacak?",
        "Hangi teknik sınırlar korunacak?",
      ],
      media: {
        type: "empty",
        slotName: "scenario",
        slotKey: "scenario",
        eyebrow: "Skyvan medya sahnesi",
        title: "Medya sahnesi hazırlanıyor",
        caption: "Senaryo sahnesi",
      },
    },
    truth: {
      title: "Görünen şey, üretilebilir olmalı.",
      body:
        "Skyvan’da görsel karar; ürün bağı, teknik sınır ve insan onayıyla birlikte düşünülür.",
      proofPoints: [
        "Ürün bağı olmadan görsel karar yok.",
        "Teknik sınır olmadan konfigürasyon yok.",
        "İnsan onayı olmadan kritik karar yok.",
      ],
      media: {
        type: "empty",
        slotName: "production-proof",
        slotKey: "productionProof",
        eyebrow: "Skyvan medya sahnesi",
        title: "Medya sahnesi hazırlanıyor",
        caption: "Üretim kanıt sahnesi",
      },
    },
    workshop: {
      title: "Workshop rastgele seçim için açılmaz.",
      body:
        "Araç, ürün ve teknik veri hazır olduğunda konfigürasyon güvenli şekilde ilerler.",
      details: ["Araç platformu", "Ürün veri bağı", "Teknik doğrulama", "Mühür öncesi kontrol"],
      media: {
        type: "empty",
        slotName: "workshop-gate",
        slotKey: "workshopGate",
        eyebrow: "Skyvan medya sahnesi",
        title: "Medya sahnesi hazırlanıyor",
        caption: "Workshop kapısı sahnesi",
      },
    },
    final: {
      title: "Skyvan, karavan kararını kontrol edilebilir bir sisteme dönüştürür.",
      cta: "Proje Başlat",
    },
    footer: {
      sentence: "Skyvan karavan kararını görsel, teknik ve üretilebilir bir akışta hazırlar.",
    },
  },
  en: {
    nav: {
      project: "Start Project",
      languageLabel: "TR",
    },
    hero: {
      eyebrow: "SKYVAN STUDIO",
      title: "We turn camper decisions into a visual, technical and buildable system.",
      body:
        "Skyvan connects vehicle, lifestyle scenario, product selection and production truth in one controlled flow.",
      primaryCta: "Start Project",
      secondaryCta: "Explore the System",
      media: {
        type: "empty",
        slotName: "hero",
        slotKey: "hero",
        eyebrow: "Skyvan media stage",
        title: "Media stage pending",
        caption: "Hero stage",
      },
    },
    journey: {
      items: ["Route", "Life", "Risk", "Energy", "Production"],
    },
    scenario: {
      title: "The lifestyle scenario comes first.",
      body:
        "In Skyvan, configuration does not start with random product selection. It starts with route, usage style, independence needs and technical limits.",
      questions: [
        "Where will it live?",
        "How independent should it be?",
        "Which technical limits must stay protected?",
      ],
      media: {
        type: "empty",
        slotName: "scenario",
        slotKey: "scenario",
        eyebrow: "Skyvan media stage",
        title: "Media stage pending",
        caption: "Scenario stage",
      },
    },
    truth: {
      title: "What you see must be buildable.",
      body:
        "In Skyvan, a visual decision is evaluated together with product binding, technical limits and human approval.",
      proofPoints: [
        "No visual decision without product binding.",
        "No configuration without technical limits.",
        "No critical decision without human approval.",
      ],
      media: {
        type: "empty",
        slotName: "production-proof",
        slotKey: "productionProof",
        eyebrow: "Skyvan media stage",
        title: "Media stage pending",
        caption: "Production proof stage",
      },
    },
    workshop: {
      title: "Workshop does not open for random selection.",
      body:
        "Configuration moves safely when vehicle, product and technical data are ready.",
      details: [
        "Vehicle platform",
        "Product data binding",
        "Technical validation",
        "Pre-seal control",
      ],
      media: {
        type: "empty",
        slotName: "workshop-gate",
        slotKey: "workshopGate",
        eyebrow: "Skyvan media stage",
        title: "Media stage pending",
        caption: "Workshop gate stage",
      },
    },
    final: {
      title: "Skyvan turns camper decisions into a controllable system.",
      cta: "Start Project",
    },
    footer: {
      sentence: "Skyvan prepares camper decisions as a visual, technical and buildable flow.",
    },
  },
};
