import type { ConvertibleVehiclePreset } from "./model-form.types";

export const convertibleVehicleCatalog: ConvertibleVehiclePreset[] = [
  {
    key: "fiat-ducato",
    title: "Fiat Ducato",
    marketTag: "TR + Global",
    bodyType: "Large Panel Van / Chassis",
    conversionClass: "Full Camper / Motor Caravan",
    summary:
      "Avrupa camper ekosisteminde en güçlü tabanlardan biri. Büyük iç hacim ve dönüşüm dostu platform.",
    slugSuggestion: "fiat-ducato",
  },
  {
    key: "peugeot-boxer-citroen-jumper",
    title: "Peugeot Boxer / Citroën Jumper",
    marketTag: "TR + Global",
    bodyType: "Large Panel Van",
    conversionClass: "Full Camper / Motor Caravan",
    summary:
      "Ducato ile aynı platform ailesinde düşünülmeli. Parça ve yerleşim mantığı benzer ilerler.",
    slugSuggestion: "boxer-jumper-platform",
  },
  {
    key: "ford-transit",
    title: "Ford Transit",
    marketTag: "TR + Global",
    bodyType: "Large Panel Van / Van",
    conversionClass: "Full Camper / Workshop Build",
    summary:
      "Türkiye’de erişilebilir ve güçlü aday. Uzun gövde, farklı tavan ve ağırlık kombinasyonları önemli avantaj.",
    slugSuggestion: "ford-transit",
  },
  {
    key: "ford-transit-custom",
    title: "Ford Transit Custom",
    marketTag: "TR + Global",
    bodyType: "Mid-Size Van",
    conversionClass: "Compact Camper / Day Van",
    summary:
      "Tam boy motor caravan yerine kompakt dönüşümler ve daha hafif yerleşimler için mantıklı taban.",
    slugSuggestion: "ford-transit-custom",
  },
  {
    key: "mercedes-sprinter",
    title: "Mercedes-Benz Sprinter",
    marketTag: "TR + Global",
    bodyType: "Large Panel Van / Chassis",
    conversionClass: "Premium Camper / Motor Caravan",
    summary:
      "Uzunluk, yükseklik ve ağırlık varyantlarıyla profesyonel dönüşümlerde çok güçlü referans platform.",
    slugSuggestion: "mercedes-sprinter",
  },
  {
    key: "vw-crafter-man-tge",
    title: "Volkswagen Crafter / MAN TGE",
    marketTag: "Global",
    bodyType: "Large Panel Van",
    conversionClass: "Full Camper / Fleet Conversion",
    summary:
      "Büyük gövde ve güçlü ticari yapı sayesinde büyük hacimli camper kurulumları için uygun.",
    slugSuggestion: "crafter-tge-platform",
  },
  {
    key: "iveco-daily",
    title: "Iveco Daily",
    marketTag: "Global + Niche TR",
    bodyType: "Heavy Van / Chassis",
    conversionClass: "Heavy Duty Camper / Expedition Base",
    summary:
      "Daha ağır sistemler ve özel gövde senaryoları için değerlendirilebilecek sağlam bir taban.",
    slugSuggestion: "iveco-daily",
  },
  {
    key: "renault-master-platform",
    title: "Renault Master / Movano / Interstar",
    marketTag: "TR + Global",
    bodyType: "Large Panel Van",
    conversionClass: "Full Camper / Utility Base",
    summary:
      "Geniş Avrupa pazarında sık görülen platform ailesi. Dönüşüm için pratik ve dengeli seçenek.",
    slugSuggestion: "master-movano-interstar",
  },
  {
    key: "compact-van-class",
    title: "Doblo / Caddy / Courier Sınıfı",
    marketTag: "TR + Global",
    bodyType: "Compact Van",
    conversionClass: "Micro Camper / Lite Setup",
    summary:
      "Tam karavan yerine hafif ve minimal senaryolar için düşünülmeli. Sistem içinde ayrı sınıf gibi ele alınmalı.",
    slugSuggestion: "compact-van-class",
  },
];