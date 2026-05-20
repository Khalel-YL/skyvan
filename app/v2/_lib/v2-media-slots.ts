export type V2MediaSlotKey = "hero" | "scenario" | "productionProof" | "workshopGate";

export type V2MediaSlotPurpose =
  | "brand-stage"
  | "lifestyle-scenario"
  | "production-truth"
  | "controlled-workshop";

export type V2MediaSlotAssetKind = "image" | "video";

export type V2MediaSlotDefinition = {
  key: V2MediaSlotKey;
  purpose: V2MediaSlotPurpose;
  preferredAssetKind: V2MediaSlotAssetKind;
  fallbackAssetKind: V2MediaSlotAssetKind;
  aspectRatio: "16:10" | "4:3" | "1:1";
  priority: "critical" | "important" | "supporting";
  publicRole: {
    tr: string;
    en: string;
  };
  shotDirection: {
    tr: string;
    en: string;
  };
  mustShow: {
    tr: string[];
    en: string[];
  };
  mustAvoid: {
    tr: string[];
    en: string[];
  };
  accessibility: {
    altTextGuidance: {
      tr: string;
      en: string;
    };
    avoidTextInImage: boolean;
  };
  futureAdminMediaRequirements: {
    requiresAltText: boolean;
    requiresFocalPoint: boolean;
    requiresApproval: boolean;
    requiresUsageTracking: boolean;
    notes: string;
  };
};

export const publicV2MediaSlotDefinitions: Record<V2MediaSlotKey, V2MediaSlotDefinition> = {
  hero: {
    key: "hero",
    purpose: "brand-stage",
    preferredAssetKind: "video",
    fallbackAssetKind: "image",
    aspectRatio: "16:10",
    priority: "critical",
    publicRole: {
      tr: "Ana Skyvan Studio sahnesi",
      en: "Main Skyvan Studio stage",
    },
    shotDirection: {
      tr:
        "Premium araç temelli yaşamı, mühendislik sakinliğini ve görsel karar güvenini aynı sahnede hissettirmeli.",
      en:
        "Should communicate premium vehicle-based living, engineering calm, and visual decision confidence in one stage.",
    },
    mustShow: {
      tr: ["Skyvan marka hissi", "araç ve yaşam bağı", "sakin teknik güven"],
      en: ["Skyvan brand feeling", "vehicle and living connection", "calm technical confidence"],
    },
    mustAvoid: {
      tr: ["jenerik karavan stok fotoğrafı", "aşırı macera klişesi", "sahte ürün seçimi"],
      en: ["generic caravan stock photo", "overdone adventure cliché", "fake product selection"],
    },
    accessibility: {
      altTextGuidance: {
        tr: "Görselin araç, yaşam ve hazırlık bağlamını kısa ve somut anlat.",
        en: "Briefly describe the vehicle, living, and preparation context shown by the asset.",
      },
      avoidTextInImage: true,
    },
    futureAdminMediaRequirements: {
      requiresAltText: true,
      requiresFocalPoint: true,
      requiresApproval: true,
      requiresUsageTracking: true,
      notes:
        "Future Admin Media connection should resolve this slot through approved media with alt text, focal point and usage tracking.",
    },
  },
  scenario: {
    key: "scenario",
    purpose: "lifestyle-scenario",
    preferredAssetKind: "image",
    fallbackAssetKind: "video",
    aspectRatio: "4:3",
    priority: "important",
    publicRole: {
      tr: "Yaşam senaryosu sahnesi",
      en: "Lifestyle scenario stage",
    },
    shotDirection: {
      tr:
        "Rota, bağımsızlık, günlük yaşam ve kullanım biçimini göstermeli; ürün katalog hissi vermemeli.",
      en:
        "Should show route, independence, daily living, and usage style; it must not feel like a product catalog.",
    },
    mustShow: {
      tr: ["insan ölçeği", "yaşam bağlamı", "rota veya duraklama hissi"],
      en: ["human scale", "living context", "route or stopping-place feeling"],
    },
    mustAvoid: {
      tr: ["katalog ürün dizilimi", "abartılı poz", "kararsız stok görseli"],
      en: ["catalog product lineup", "overstaged pose", "generic stock visual"],
    },
    accessibility: {
      altTextGuidance: {
        tr: "Yaşam senaryosunu, ortamı ve kullanım bağlamını açıklayan kısa alt metin kullan.",
        en: "Use concise alt text that explains the living scenario, environment, and usage context.",
      },
      avoidTextInImage: true,
    },
    futureAdminMediaRequirements: {
      requiresAltText: true,
      requiresFocalPoint: true,
      requiresApproval: true,
      requiresUsageTracking: true,
      notes:
        "Future Admin Media connection should preserve route/lifestyle context and avoid catalog-only assets.",
    },
  },
  productionProof: {
    key: "productionProof",
    purpose: "production-truth",
    preferredAssetKind: "image",
    fallbackAssetKind: "video",
    aspectRatio: "4:3",
    priority: "important",
    publicRole: {
      tr: "Üretilebilirlik ve kanıt sahnesi",
      en: "Buildability and proof stage",
    },
    shotDirection: {
      tr:
        "Gerçek atölye, malzeme, detay veya üretim disiplinini göstermeli; sahte teknik sayı göstermemeli.",
      en:
        "Should communicate real workshop, material, detail, or production discipline; it must not show fake technical numbers.",
    },
    mustShow: {
      tr: ["gerçek malzeme", "üretim disiplini", "detay veya kontrol hissi"],
      en: ["real material", "production discipline", "detail or control feeling"],
    },
    mustAvoid: {
      tr: ["sahte metrik", "sahte teknik çizim", "okunamayan sayı panosu"],
      en: ["fake metric", "fake technical drawing", "unreadable number panel"],
    },
    accessibility: {
      altTextGuidance: {
        tr: "Üretim, malzeme veya kontrol bağlamını abartmadan açıkla.",
        en: "Describe the production, material, or control context without exaggeration.",
      },
      avoidTextInImage: true,
    },
    futureAdminMediaRequirements: {
      requiresAltText: true,
      requiresFocalPoint: true,
      requiresApproval: true,
      requiresUsageTracking: true,
      notes:
        "Future Admin Media connection should require approval so production-truth assets do not imply unverified claims.",
    },
  },
  workshopGate: {
    key: "workshopGate",
    purpose: "controlled-workshop",
    preferredAssetKind: "image",
    fallbackAssetKind: "video",
    aspectRatio: "16:10",
    priority: "supporting",
    publicRole: {
      tr: "Kontrollü Workshop kapısı sahnesi",
      en: "Controlled Workshop gate stage",
    },
    shotDirection: {
      tr:
        "Workshop’un araç, ürün ve teknik veri hazır olduğunda açılan kontrollü bir kapı olduğunu hissettirmeli.",
      en:
        "Should communicate that Workshop opens only when vehicle, product, and technical data are ready.",
    },
    mustShow: {
      tr: ["kontrollü erişim", "hazırlık hissi", "güvenli başlangıç"],
      en: ["controlled access", "preparation feeling", "safe beginning"],
    },
    mustAvoid: {
      tr: ["canlı konfigüratör ekranı", "fiyat ekranı", "ürün seçimi yanılsaması"],
      en: ["live configurator screen", "pricing screen", "product-selection illusion"],
    },
    accessibility: {
      altTextGuidance: {
        tr: "Workshop sahnesinin kontrollü erişim ve hazırlık hissini kısa anlat.",
        en: "Briefly describe the Workshop scene as controlled access and preparation.",
      },
      avoidTextInImage: true,
    },
    futureAdminMediaRequirements: {
      requiresAltText: true,
      requiresFocalPoint: true,
      requiresApproval: true,
      requiresUsageTracking: true,
      notes:
        "Future Admin Media connection should prevent this slot from looking like an active configurator or pricing flow.",
    },
  },
};
