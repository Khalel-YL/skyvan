/**
 * Curated Skyvan visual source of truth.
 *
 * The files live in `public/images/skyvan/concepts` and are intentionally
 * versioned.  Admin media rows are metadata pointers to these files; the
 * public renderer still treats the static files as the curated fallback.
 */
export type SkyvanMediaCatalogItem = {
  mediaId: string;
  entityId: string;
  path: string;
  width: number;
  height: number;
  title: string;
  description: string;
  alt: {
    tr: string;
    en: string;
  };
  tags: readonly string[];
  usageScope: "public";
  isFeatured: boolean;
};

export const skyvanMediaCatalog = {
  "hero-studio": {
    mediaId: "3d074698-4426-4dd6-af25-0c499d18dfc9",
    entityId: "23fc5412-34db-418f-9100-5fce0aca1368",
    path: "/images/skyvan/concepts/hero-studio-v2.webp",
    width: 1672,
    height: 941,
    title: "Stüdyo dış görünüş konsepti",
    description: "Skyvan amblemli antrasit alkovenli karavanın stüdyo ortamındaki konsept dış görünüşü.",
    alt: {
      tr: "Skyvan amblemli antrasit alkovenli karavanın stüdyo ortamındaki konsept dış görünüşü.",
      en: "Studio exterior concept of an anthracite Skyvan overcab motorhome.",
    },
    tags: ["hero", "dış görünüş", "karavan", "konsept"],
    usageScope: "public",
    isFeatured: true,
  },
  "water-clean-service": {
    mediaId: "8e0a9ce7-cec0-4bd8-a8b3-b53c360a6028",
    entityId: "3491dcb2-effd-47ef-8481-1ec8465bbfd8",
    path: "/images/skyvan/concepts/water-clean-service-v2.webp",
    width: 1536,
    height: 1024,
    title: "Temiz su servis bölmesi",
    description: "Temiz su deposu, pompa ve baca erişimini birlikte gösteren konsept servis görünümü.",
    alt: {
      tr: "Skyvan temiz su servis bölmesi; 100 litre temiz su deposu, pompa ve baca erişimi konsepti.",
      en: "Skyvan clean-water service bay concept with a 100-litre tank, pump and vent access.",
    },
    tags: ["su", "temiz su", "servis", "mühendislik"],
    usageScope: "public",
    isFeatured: false,
  },
  "water-grey-service": {
    mediaId: "e28b79e5-9338-4263-a18a-b20d9c50ba95",
    entityId: "864498ad-d785-4a16-b432-27f2fbdb8052",
    path: "/images/skyvan/concepts/water-grey-service-v2.webp",
    width: 1536,
    height: 1024,
    title: "Gri su servis bölmesi",
    description: "Gri su deposu, pompa tahliye hattı ve dış basamak ilişkisini gösteren konsept servis görünümü.",
    alt: {
      tr: "Skyvan gri su servis bölmesi; 100 litre depo, pompa tahliye hattı ve dış basamak konsepti.",
      en: "Skyvan grey-water service bay concept with a 100-litre tank, pump drain and step access.",
    },
    tags: ["su", "gri su", "servis", "mühendislik"],
    usageScope: "public",
    isFeatured: false,
  },
  "electrical-rear-service": {
    mediaId: "a26c4eb0-4063-4d15-be07-2bd0a5258618",
    entityId: "fa79db97-75c1-4028-aa2e-b9ae4181dd60",
    path: "/images/skyvan/concepts/electrical-rear-service-v2.webp",
    width: 1536,
    height: 1024,
    title: "Arka elektrik servis bölmesi",
    description: "İnverter/şarj cihazı, MPPT, AC/DC dağıtım ve LiFePO4 akülerin servis yerleşimi konsepti.",
    alt: {
      tr: "Skyvan arka elektrik servis bölmesi; inverter, MPPT, AC/DC dağıtım ve LiFePO4 akü yerleşimi konsepti.",
      en: "Skyvan rear electrical service bay concept with inverter, MPPT, AC/DC distribution and LiFePO4 batteries.",
    },
    tags: ["elektrik", "akü", "inverter", "servis", "mühendislik"],
    usageScope: "public",
    isFeatured: false,
  },
  "interior-first-view": {
    mediaId: "7b52bbcf-45ad-48ba-ac1e-83bf796c6732",
    entityId: "6d9c339d-ea9b-4b6b-a714-b37835edb83c",
    path: "/images/skyvan/concepts/interior-first-view-v2.webp",
    width: 1672,
    height: 941,
    title: "İlk iç mekân görünümü",
    description: "U oturum, mutfak, alkoven ve ön görüş ilişkisini birlikte gösteren yaşam alanı konsepti.",
    alt: {
      tr: "Skyvan yaşam alanında U oturum, mutfak, alkoven ve ön görüş ilişkisini gösteren iç mekân konsepti.",
      en: "Skyvan interior concept showing the U lounge, galley, overcab bed and forward view together.",
    },
    tags: ["iç mekân", "yaşam alanı", "oturum", "mutfak"],
    usageScope: "public",
    isFeatured: true,
  },
  "roof-equipment": {
    mediaId: "86ff2cc7-8f02-4e78-b076-7f5688d1d278",
    entityId: "e2d24e4b-6bb3-4aae-b85a-74e10e2eff80",
    path: "/images/skyvan/concepts/roof-equipment-v2.webp",
    width: 1536,
    height: 1024,
    title: "Çatı ekipman yerleşimi",
    description: "Çatı panelleri, iklimlendirme ve servis açıklıklarının birlikte incelendiği konsept görünüm.",
    alt: {
      tr: "Skyvan araç tavanında güneş panelleri, iklimlendirme ve servis açıklıklarının yerleşim konsepti.",
      en: "Skyvan roof layout concept showing solar panels, climate equipment and service openings.",
    },
    tags: ["çatı", "güneş paneli", "iklimlendirme", "servis"],
    usageScope: "public",
    isFeatured: false,
  },
  "electrical-cabinet": {
    mediaId: "380c70b1-421a-40b2-bd34-dc6f6011bfc",
    entityId: "bd34fa9b-c578-445d-a1b8-266f8ca2c5e5",
    path: "/images/skyvan/concepts/electrical-cabinet-v2.webp",
    width: 1672,
    height: 941,
    title: "Elektrik kabini konsepti",
    description: "Kompakt ve erişilebilir bir elektrik kabini için düzen ve servis payı konsepti.",
    alt: {
      tr: "Skyvan elektrik kabini için kompakt düzen ve servis erişimi konsepti.",
      en: "Skyvan electrical cabinet concept showing a compact, serviceable arrangement.",
    },
    tags: ["elektrik", "kabinet", "servis", "erişim"],
    usageScope: "public",
    isFeatured: false,
  },
  "exterior-landscape": {
    mediaId: "e0ee2e42-3d35-4449-8d13-185b1b4abd02",
    entityId: "7471bdd1-e70e-45d5-82d7-bbb225cb2374",
    path: "/images/skyvan/concepts/exterior-landscape-v2.webp",
    width: 1672,
    height: 941,
    title: "Doğal ortam dış görünüşü",
    description: "Skyvan karavan konseptinin dağ ve göl manzarasındaki doğal ortam görünümü.",
    alt: {
      tr: "Dağ ve göl manzarasında Skyvan alkovenli karavan konsepti.",
      en: "Skyvan overcab motorhome concept beside a mountain lake.",
    },
    tags: ["dış görünüş", "doğal ortam", "karavan", "final"],
    usageScope: "public",
    isFeatured: true,
  },
  "kitchen-transition": {
    mediaId: "4ce43f48-805d-4204-babb-d5851f9dc908",
    entityId: "d3c2c677-2b2b-4705-b64c-49f7c46b4929",
    path: "/images/skyvan/concepts/kitchen-transition-v2.webp",
    width: 1536,
    height: 1024,
    title: "Mutfak ve geçiş ilişkisi",
    description: "Mutfak, giriş ve yaşam alanı arasındaki dolaşım ilişkisini gösteren iç mekân konsepti.",
    alt: {
      tr: "Skyvan karavanında mutfak, giriş ve yaşam alanı arasındaki geçişi gösteren iç mekân konsepti.",
      en: "Skyvan interior concept showing the transition between galley, entry and living space.",
    },
    tags: ["mutfak", "geçiş", "dolaşım", "iç mekân"],
    usageScope: "public",
    isFeatured: false,
  },
  "shower-separate": {
    mediaId: "50388fe4-357f-463f-99e7-c7bdd4bd2f50",
    entityId: "744541c1-1b73-40bd-8665-35ce01b62418",
    path: "/images/skyvan/concepts/shower-separate-v2.webp",
    width: 1122,
    height: 1402,
    title: "Ayrı duş alanı",
    description: "Islak ve kuru alanları ayrı ele alan kompakt duş kabini konsepti.",
    alt: {
      tr: "Karavan ölçülerine göre tasarlanmış ayrı duş kabini konsepti.",
      en: "Separate shower cubicle concept designed for a motorhome interior.",
    },
    tags: ["duş", "ıslak alan", "yaşam alanı", "iç mekân"],
    usageScope: "public",
    isFeatured: false,
  },
  "lounge-table": {
    mediaId: "7e49062d-153e-4e6f-a8c4-76267470c5b7",
    entityId: "7f67f0d8-528d-4898-b2dc-973b6ab1f4f5",
    path: "/images/skyvan/concepts/lounge-table-v2.webp",
    width: 1672,
    height: 941,
    title: "U oturum ve elektrikli masa",
    description: "U oturum, yükseltilmiş masa ve zemine bağlı teleskopik ayakla gündüz yaşam alanı konsepti.",
    alt: {
      tr: "Skyvan U oturum, yükseltilmiş elektrikli masa ve zemine bağlı teleskopik ayak konsepti.",
      en: "Skyvan U lounge concept with a raised electric table and floor-mounted telescopic pedestal.",
    },
    tags: ["oturum", "masa", "dönüşüm", "yaşam alanı"],
    usageScope: "public",
    isFeatured: true,
  },
  "toilet-separate": {
    mediaId: "0d633903-249a-40f1-b4eb-fc5db0472eb7",
    entityId: "6e59a817-a921-4fa8-8312-13d3add97a90",
    path: "/images/skyvan/concepts/toilet-separate-v2.webp",
    width: 1122,
    height: 1402,
    title: "Ayrı WC alanı",
    description: "Kompakt lavabo ve karavan tipi tuvalet içeren ayrı WC alanı konsepti.",
    alt: {
      tr: "Kompakt lavabo ve karavan tipi tuvalet içeren ayrı Skyvan WC alanı konsepti.",
      en: "Separate Skyvan motorhome WC concept with a compact basin and toilet.",
    },
    tags: ["wc", "tuvalet", "lavabo", "yaşam alanı"],
    usageScope: "public",
    isFeatured: false,
  },
  "control-centre-concept": {
    mediaId: "8afd9dae-4f5f-4703-9216-f4d0b010452b",
    entityId: "0fa9aa8d-f9d5-42eb-ae1b-4c0dea3c3f42",
    path: "/images/skyvan/concepts/control-centre-concept-v2.webp",
    width: 1536,
    height: 1024,
    title: "Kontrol merkezi tasarım önizlemesi",
    description: "Karavan içindeki kontrol ekranı ve enerji durumları için tasarım önizlemesi; canlı telemetri değildir.",
    alt: {
      tr: "Skyvan karavanında kontrol merkezi ekranı için tasarım önizlemesi; canlı telemetri değildir.",
      en: "Skyvan control-centre screen design preview; this is not live telemetry.",
    },
    tags: ["kontrol", "arayüz", "enerji", "tasarım önizlemesi"],
    usageScope: "public",
    isFeatured: false,
  },
  "lounge-bed": {
    mediaId: "49a8f582-19ee-49f3-b849-63bd1748912e",
    entityId: "01767086-1287-4c14-8644-c0f162525693",
    path: "/images/skyvan/concepts/lounge-bed-v2.webp",
    width: 1672,
    height: 941,
    title: "U oturum yatak dönüşümü",
    description: "Aynı U oturumun, teleskopik masa ayağı korunarak uyku düzenine dönüştürüldüğü konsept.",
    alt: {
      tr: "Skyvan U oturumun teleskopik masa ayağı korunarak yatak düzenine dönüşmesi konsepti.",
      en: "Skyvan U lounge converted to a bed while retaining the telescopic table pedestal.",
    },
    tags: ["oturum", "yatak", "dönüşüm", "uyku"],
    usageScope: "public",
    isFeatured: true,
  },
  "boiler-service": {
    mediaId: "fcf99d17-3102-4792-8ca5-3a94c52652f9",
    entityId: "2aa48b06-8a04-481e-a915-c7e2687bafdc",
    path: "/images/skyvan/concepts/boiler-service-v2.webp",
    width: 1536,
    height: 1024,
    title: "Su ve ortam ısıtma servis bölmesi",
    description: "Sıcak su ve ortam ısıtma bileşenleri için erişilebilir servis bölmesi konsepti.",
    alt: {
      tr: "Skyvan su ve ortam ısıtma bileşenleri için servis bölmesi konsepti.",
      en: "Skyvan service-bay concept for hot-water and space-heating components.",
    },
    tags: ["ısıtma", "boiler", "sıcak su", "servis"],
    usageScope: "public",
    isFeatured: false,
  },
  "alcove-layers": {
    mediaId: "830ddfbb-5063-4d0e-9d59-d567e742513c",
    entityId: "aef9fd53-9c29-4d22-9e54-aa0e786fb37b",
    path: "/images/skyvan/concepts/alcove-layers-v2.webp",
    width: 1536,
    height: 1024,
    title: "Alkoven katmanları açıklaması",
    description: "Alkoven duvarındaki katmanları açıklayan konsept infografik; ölçü ve uygulama araç özelinde doğrulanır.",
    alt: {
      tr: "Skyvan alkoven duvarındaki yalıtım katmanlarını açıklayan konsept infografik.",
      en: "Skyvan concept infographic explaining insulation layers in the overcab wall.",
    },
    tags: ["alkoven", "yalıtım", "katman", "infografik"],
    usageScope: "public",
    isFeatured: false,
  },
} as const satisfies Record<string, SkyvanMediaCatalogItem>;

export type SkyvanMediaCatalogKey = keyof typeof skyvanMediaCatalog;
