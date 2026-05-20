import type { V2MediaSlotKey } from "./v2-media-slots";

export type V2ShotComplexity = "simple" | "moderate" | "advanced";

export type V2ShotSourceType =
  | "original-shoot"
  | "approved-brand-asset"
  | "approved-production-asset";

export type V2ShotBrief = {
  slotKey: V2MediaSlotKey;
  sourceType: V2ShotSourceType;
  complexity: V2ShotComplexity;
  assetGoal: {
    tr: string;
    en: string;
  };
  visualDirection: {
    tr: string;
    en: string;
  };
  composition: {
    tr: string;
    en: string;
  };
  cameraAndMotion: {
    tr: string;
    en: string;
  };
  lightingAndColor: {
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
  focalPointGuidance: {
    tr: string;
    en: string;
  };
  altTextDraft: {
    tr: string;
    en: string;
  };
  approvalNotes: {
    tr: string[];
    en: string[];
  };
};

export const publicV2MediaShotBriefOrder: V2MediaSlotKey[] = [
  "hero",
  "scenario",
  "productionProof",
  "workshopGate",
];

export const publicV2MediaShotBriefs: Record<V2MediaSlotKey, V2ShotBrief> = {
  hero: {
    slotKey: "hero",
    sourceType: "original-shoot",
    complexity: "advanced",
    assetGoal: {
      tr: "Skyvan’ın araç tabanlı yaşam kararını premium ve mühendislik kontrollü bir stüdyo sahnesi gibi göstermek.",
      en: "Show Skyvan’s vehicle-based living decision as a premium and engineering-controlled studio stage.",
    },
    visualDirection: {
      tr:
        "Ana sahne premium, sakin, mühendislik kontrollü ve araç tabanlı hissettirmeli; jenerik karavan tanıtımı gibi görünmemeli.",
      en:
        "The main stage should feel premium, calm, engineering-controlled, and vehicle-based; it must not look like a generic caravan promo.",
    },
    composition: {
      tr:
        "Araç ve yaşam kararını tek sahnede birleştiren geniş kadraj; çevrede sade stüdyo boşluğu ve güçlü negatif alan.",
      en:
        "A wide composition combining vehicle and living decision in one stage, with clean studio space and strong negative space.",
    },
    cameraAndMotion: {
      tr:
        "Gelecekte video kullanılırsa yavaş, kontrollü kamera hareketi; hızlı geçiş, drone şovu veya agresif hareket yok.",
      en:
        "If video is used later, camera motion should be slow and controlled; no fast cuts, drone spectacle, or aggressive movement.",
    },
    lightingAndColor: {
      tr:
        "Grafit, sıcak beyaz ve kontrollü metalik vurgu; neon, oyun hissi veya aşırı kontrast yok.",
      en:
        "Graphite, warm white, and controlled metallic accents; no neon, gaming feel, or excessive contrast.",
    },
    mustShow: {
      tr: [
        "Araç tabanlı yaşam hissi",
        "Premium stüdyo sakinliği",
        "Görsel karar yüzeyi",
        "Teknik güven duygusu",
      ],
      en: [
        "Vehicle-based living feeling",
        "Premium studio calm",
        "Visual decision surface",
        "Technical confidence",
      ],
    },
    mustAvoid: {
      tr: [
        "Stok karavan kamp fotoğrafı",
        "Abartılı off-road macera görüntüsü",
        "Kalabalık ürün kataloğu",
        "Sahte 3D konfigüratör hissi",
      ],
      en: [
        "Generic caravan stock photo",
        "Overdramatic off-road adventure look",
        "Crowded product catalog",
        "Fake 3D configurator feeling",
      ],
    },
    focalPointGuidance: {
      tr: "Odak noktası araç-yaşam ilişkisinde kalmalı; kesim mobilde aracı veya karar sahnesini kaybetmemeli.",
      en: "The focal point should stay on the vehicle-living relationship; mobile crops must not lose the vehicle or decision stage.",
    },
    altTextDraft: {
      tr: "Skyvan stüdyo sahnesinde araç tabanlı yaşam ve kontrollü karar hazırlığı.",
      en: "Vehicle-based living and controlled decision preparation in a Skyvan studio stage.",
    },
    approvalNotes: {
      tr: [
        "Marka hissi premium ve sakin kalmalı.",
        "Görsel herhangi bir gerçek dışı teknik iddia ima etmemeli.",
        "Kullanılacak medya Skyvan’a ait veya açıkça onaylı olmalı.",
      ],
      en: [
        "Brand feeling must stay premium and calm.",
        "The asset must not imply any unverified technical claim.",
        "Media must be Skyvan-owned or explicitly approved.",
      ],
    },
  },
  scenario: {
    slotKey: "scenario",
    sourceType: "original-shoot",
    complexity: "moderate",
    assetGoal: {
      tr: "Kullanıcının rota, yaşam biçimi ve bağımsızlık ihtiyacını sade ama güçlü bir yaşam sahnesiyle anlatmak.",
      en: "Express the user’s route, living style and independence needs through a calm but strong lifestyle scene.",
    },
    visualDirection: {
      tr:
        "İnsan ölçeği ve yaşam bağlamı öne çıkmalı; turizm reklamı veya katalog çekimi gibi görünmemeli.",
      en:
        "Human scale and living context should lead; it must not look like a tourism ad or catalog shoot.",
    },
    composition: {
      tr:
        "Araç içi veya yakın çevrede sade günlük yaşam kurgusu; karar bağlamını taşıyan rota/durma hissi korunmalı.",
      en:
        "A simple daily-living setup inside or around the vehicle; route or stopping context should remain visible.",
    },
    cameraAndMotion: {
      tr:
        "Sakin elde kamera veya sabit kompozisyon; insan hareketi doğal ve abartısız olmalı.",
      en:
        "Calm handheld or locked-off composition; human movement should feel natural and restrained.",
    },
    lightingAndColor: {
      tr:
        "Doğal sıcak ışık, kontrollü gölge ve sade tonlar; aşırı filtre veya turistik renk patlaması yok.",
      en:
        "Natural warm light, controlled shadow, and restrained tones; no heavy filter or tourism-style color burst.",
    },
    mustShow: {
      tr: [
        "İnsan ölçeği",
        "Günlük yaşam kararı",
        "Rota veya kullanım bağlamı",
        "Sade, gerçekçi atmosfer",
      ],
      en: [
        "Human scale",
        "Daily living decision",
        "Route or usage context",
        "Calm, realistic atmosphere",
      ],
    },
    mustAvoid: {
      tr: [
        "Turistik kamp klişesi",
        "Aşırı mutlu stok insan pozu",
        "Ürün katalog çekimi",
        "Dağınık iç mekân",
      ],
      en: [
        "Touristic camping cliché",
        "Overly happy stock-person pose",
        "Product catalog shot",
        "Messy interior",
      ],
    },
    focalPointGuidance: {
      tr: "Odak insan ve yaşam kararı üzerinde kalmalı; medya kırpıldığında bağlam kaybolmamalı.",
      en: "The focal point should remain on the person and living decision; cropping must preserve context.",
    },
    altTextDraft: {
      tr: "Skyvan yaşam senaryosunda rota ve bağımsız kullanım ihtiyacını değerlendiren sakin günlük sahne.",
      en: "A calm daily scene evaluating route and independence needs in a Skyvan living scenario.",
    },
    approvalNotes: {
      tr: [
        "Sahne gerçekçi olmalı, reklam klişesine kaçmamalı.",
        "İç mekân düzeni temiz ve marka güvenine uygun olmalı.",
        "Görsel herhangi bir aktif ürün seçimi izlenimi vermemeli.",
      ],
      en: [
        "The scene must feel realistic, not advertising cliché.",
        "Interior order should be clean and brand-safe.",
        "The asset must not imply active product selection.",
      ],
    },
  },
  productionProof: {
    slotKey: "productionProof",
    sourceType: "approved-production-asset",
    complexity: "moderate",
    assetGoal: {
      tr: "Görünen kararın üretilebilir olduğunu gerçek malzeme, işçilik ve kontrol hissiyle kanıtlamak.",
      en: "Prove that the visible decision is buildable through real material, craftsmanship and control.",
    },
    visualDirection: {
      tr:
        "Gerçek atölye, malzeme, detay ve onay ciddiyeti hissedilmeli; sahte teknik ekran veya ölçü gösterilmemeli.",
      en:
        "Real workshop, material, detail, and approval seriousness should be felt; no fake technical screen or measurement should appear.",
    },
    composition: {
      tr:
        "Yakın plan malzeme/detay veya temiz üretim alanı; görsel karmaşadan uzak, net ve güven veren kadraj.",
      en:
        "Close material/detail or clean production space; a clear, confidence-building frame without visual mess.",
    },
    cameraAndMotion: {
      tr:
        "Sabit veya çok yavaş hareketli çekim; kontrol, işçilik ve detay okunsun diye aceleci kurgu yok.",
      en:
        "Locked-off or very slow movement; no rushed edit so control, craftsmanship, and detail can be read.",
    },
    lightingAndColor: {
      tr:
        "Temiz atölye ışığı, malzeme dokusunu gösteren doğal kontrast; kirli veya dramatize edilmiş görüntü yok.",
      en:
        "Clean workshop light and natural contrast that shows material texture; no dirty or overdramatized image.",
    },
    mustShow: {
      tr: [
        "Gerçek malzeme veya üretim detayı",
        "Temiz işçilik",
        "Kontrollü üretim atmosferi",
        "İnsan onayı ciddiyeti",
      ],
      en: [
        "Real material or production detail",
        "Clean craftsmanship",
        "Controlled production atmosphere",
        "Human approval seriousness",
      ],
    },
    mustAvoid: {
      tr: [
        "Sahte teknik değerler",
        "Okunmayan ölçü ekranları",
        "Dağınık atölye görüntüsü",
        "Garanti edilmeyen üretim iddiası",
      ],
      en: [
        "Fake technical values",
        "Unreadable measurement screens",
        "Messy workshop view",
        "Unverified production claim",
      ],
    },
    focalPointGuidance: {
      tr: "Odak malzeme, işçilik veya kontrol noktasında kalmalı; mobil kırpma sahnenin ne olduğunu belirsizleştirmemeli.",
      en: "The focal point should stay on material, craftsmanship, or control point; mobile crop must not make the scene ambiguous.",
    },
    altTextDraft: {
      tr: "Skyvan üretim disiplinini gösteren gerçek malzeme ve temiz işçilik detayı.",
      en: "Real material and clean craftsmanship detail showing Skyvan production discipline.",
    },
    approvalNotes: {
      tr: [
        "Görsel yalnızca doğrulanabilir üretim bağlamı göstermeli.",
        "Sayı, ölçüm veya sertifika iddiası görünürse doğrulanmalı.",
        "Atölye düzeni marka güvenini zedelememeli.",
      ],
      en: [
        "The asset should show only verifiable production context.",
        "Any visible number, measurement, or certification claim must be verified.",
        "Workshop order must not hurt brand trust.",
      ],
    },
  },
  workshopGate: {
    slotKey: "workshopGate",
    sourceType: "approved-brand-asset",
    complexity: "simple",
    assetGoal: {
      tr: "Workshop’un rastgele seçim ekranı değil, kontrollü proje giriş kapısı olduğunu göstermek.",
      en: "Show Workshop as a controlled project entry gate, not a random selection screen.",
    },
    visualDirection: {
      tr:
        "Kontrollü erişim, hazırlık ve güvenli başlangıç hissi vermeli; canlı fiyat veya ürün seçimi gibi görünmemeli.",
      en:
        "Should feel like controlled access, preparation, and safe beginning; it must not look like live pricing or product selection.",
    },
    composition: {
      tr:
        "Kapı/eşik hissi veren sade marka sahnesi; ürün listesi veya ekran arayüzü göstermeden kontrollü başlangıç duygusu.",
      en:
        "A restrained brand scene with a gate/threshold feeling; controlled beginning without product lists or interface screens.",
    },
    cameraAndMotion: {
      tr:
        "Varsa video çok yavaş ve törensel olmalı; kullanıcıyı aktif konfigürasyona çağıran hareket olmamalı.",
      en:
        "If video is used, motion should be very slow and ceremonial; no motion that invites active configuration.",
    },
    lightingAndColor: {
      tr:
        "Sakin grafit, sıcak ışık ve güven veren metal tonlar; oyunlaştırılmış renk veya gösterişli efekt yok.",
      en:
        "Calm graphite, warm light, and confidence-building metal tones; no gamified color or showy effect.",
    },
    mustShow: {
      tr: [
        "Kontrollü erişim hissi",
        "Araç ve ürün verisi hazırlığı",
        "Sakin, güvenli karar atmosferi",
        "Mühür öncesi kontrol duygusu",
      ],
      en: [
        "Controlled access feeling",
        "Vehicle and product data readiness",
        "Calm, safe decision atmosphere",
        "Pre-seal control feeling",
      ],
    },
    mustAvoid: {
      tr: [
        "Canlı fiyat ekranı",
        "Fake ürün seçici",
        "Dashboard metrikleri",
        "Oyunlaştırılmış konfigüratör",
      ],
      en: [
        "Live price screen",
        "Fake product selector",
        "Dashboard metrics",
        "Gamified configurator",
      ],
    },
    focalPointGuidance: {
      tr: "Odak kontrollü giriş/eşik hissinde kalmalı; herhangi bir aktif seçim ekranı görünmemeli.",
      en: "The focal point should stay on controlled entry/threshold feeling; no active selection screen should appear.",
    },
    altTextDraft: {
      tr: "Skyvan Workshop için kontrollü proje girişini temsil eden sakin eşik sahnesi.",
      en: "A calm threshold scene representing controlled project entry for Skyvan Workshop.",
    },
    approvalNotes: {
      tr: [
        "Görsel Workshop’un bugün aktif seçim başlatmadığını gölgelememeli.",
        "Fiyat, ürün seçimi veya canlı konfigurator hissi vermemeli.",
        "Sahne hazırlık ve güven duygusunu korumalı.",
      ],
      en: [
        "The asset must not obscure that Workshop does not start active selection today.",
        "It must not imply pricing, product selection, or live configurator behavior.",
        "The scene should preserve preparation and trust.",
      ],
    },
  },
};

export function getPublicV2MediaShotBrief(slotKey: V2MediaSlotKey): V2ShotBrief {
  return publicV2MediaShotBriefs[slotKey];
}
