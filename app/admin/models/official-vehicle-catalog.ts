export type OfficialVehicleStatus = "draft" | "active" | "archived";

export type OfficialVehicleFamilyKey =
  | "ducato-class"
  | "transit-class"
  | "sprinter-class"
  | "master-class"
  | "crafter-class"
  | "daily-class";

export type OfficialVehicleSeedKey =
  | "ducato-class-l2h2"
  | "ducato-class-l3h2"
  | "ducato-class-l4h3"
  | "transit-class-l3h2"
  | "transit-class-l4h3"
  | "sprinter-class-l2h2"
  | "sprinter-class-l3h2"
  | "master-class-l2h2"
  | "master-class-l3h2"
  | "crafter-class-l3h2"
  | "crafter-class-l4h3"
  | "daily-class-l3h2"
  | "daily-class-l4h3";

export type OfficialVehicleSeed = {
  key: OfficialVehicleSeedKey;
  familyKey: OfficialVehicleFamilyKey;
  familyLabel: string;
  manufacturerLabel: string;
  variantLabel: string;
  slug: string;
  baseWeightKg: number;
  maxPayloadKg: number;
  wheelbaseMm: number;
  roofLengthMm: number;
  roofWidthMm: number;
  status: OfficialVehicleStatus;
  marketScope: string;
  platformClass: string;
  note: string;
};

export type OfficialVehicleImportBatchKey =
  | "large-van-core"
  | OfficialVehicleFamilyKey;

export type OfficialVehicleImportBatch = {
  key: OfficialVehicleImportBatchKey;
  title: string;
  description: string;
  seedKeys: OfficialVehicleSeedKey[];
};

export const officialVehicleSeeds: OfficialVehicleSeed[] = [
  {
    key: "ducato-class-l2h2",
    familyKey: "ducato-class",
    familyLabel: "Ducato Sınıfı",
    manufacturerLabel: "Fiat Ducato",
    variantLabel: "L2H2",
    slug: "ducato-class-l2h2",
    baseWeightKg: 2650,
    maxPayloadKg: 1350,
    wheelbaseMm: 3450,
    roofLengthMm: 3120,
    roofWidthMm: 1870,
    status: "active",
    marketScope: "TR + Global",
    platformClass: "Large Van",
    note: "Full camper için giriş seviyesi büyük van referansı.",
  },
  {
    key: "ducato-class-l3h2",
    familyKey: "ducato-class",
    familyLabel: "Ducato Sınıfı",
    manufacturerLabel: "Fiat Ducato",
    variantLabel: "L3H2",
    slug: "ducato-class-l3h2",
    baseWeightKg: 2780,
    maxPayloadKg: 1450,
    wheelbaseMm: 4035,
    roofLengthMm: 3705,
    roofWidthMm: 1870,
    status: "active",
    marketScope: "TR + Global",
    platformClass: "Large Van",
    note: "Skyvan için ana referans uzunluklardan biri.",
  },
  {
    key: "ducato-class-l4h3",
    familyKey: "ducato-class",
    familyLabel: "Ducato Sınıfı",
    manufacturerLabel: "Fiat Ducato",
    variantLabel: "L4H3",
    slug: "ducato-class-l4h3",
    baseWeightKg: 2920,
    maxPayloadKg: 1500,
    wheelbaseMm: 4035,
    roofLengthMm: 4070,
    roofWidthMm: 1870,
    status: "active",
    marketScope: "TR + Global",
    platformClass: "Large Van",
    note: "Yüksek tavanlı full camper ve atölye kurulumları için güçlü baz.",
  },
  {
    key: "transit-class-l3h2",
    familyKey: "transit-class",
    familyLabel: "Transit Sınıfı",
    manufacturerLabel: "Ford Transit",
    variantLabel: "L3H2",
    slug: "transit-class-l3h2",
    baseWeightKg: 2760,
    maxPayloadKg: 1400,
    wheelbaseMm: 3750,
    roofLengthMm: 3490,
    roofWidthMm: 1780,
    status: "active",
    marketScope: "TR + Global",
    platformClass: "Large Van",
    note: "Türkiye pazarında güçlü ana adaylardan biri.",
  },
  {
    key: "transit-class-l4h3",
    familyKey: "transit-class",
    familyLabel: "Transit Sınıfı",
    manufacturerLabel: "Ford Transit",
    variantLabel: "L4H3",
    slug: "transit-class-l4h3",
    baseWeightKg: 2890,
    maxPayloadKg: 1500,
    wheelbaseMm: 3750,
    roofLengthMm: 3880,
    roofWidthMm: 1780,
    status: "active",
    marketScope: "TR + Global",
    platformClass: "Large Van",
    note: "Uzun gövde yüksek tavan kombinasyonu için normalize seed.",
  },
  {
    key: "sprinter-class-l2h2",
    familyKey: "sprinter-class",
    familyLabel: "Sprinter Sınıfı",
    manufacturerLabel: "Mercedes-Benz Sprinter",
    variantLabel: "L2H2",
    slug: "sprinter-class-l2h2",
    baseWeightKg: 2850,
    maxPayloadKg: 1300,
    wheelbaseMm: 3665,
    roofLengthMm: 3260,
    roofWidthMm: 1780,
    status: "active",
    marketScope: "TR + Global",
    platformClass: "Large Van",
    note: "Premium dönüşüm hattı için kompakt büyük van referansı.",
  },
  {
    key: "sprinter-class-l3h2",
    familyKey: "sprinter-class",
    familyLabel: "Sprinter Sınıfı",
    manufacturerLabel: "Mercedes-Benz Sprinter",
    variantLabel: "L3H2",
    slug: "sprinter-class-l3h2",
    baseWeightKg: 2960,
    maxPayloadKg: 1400,
    wheelbaseMm: 4325,
    roofLengthMm: 3880,
    roofWidthMm: 1780,
    status: "active",
    marketScope: "TR + Global",
    platformClass: "Large Van",
    note: "Uzun dingil ve yüksek tavan için operasyonel baz kayıt.",
  },
  {
    key: "master-class-l2h2",
    familyKey: "master-class",
    familyLabel: "Master Sınıfı",
    manufacturerLabel: "Renault Master",
    variantLabel: "L2H2",
    slug: "master-class-l2h2",
    baseWeightKg: 2720,
    maxPayloadKg: 1375,
    wheelbaseMm: 3682,
    roofLengthMm: 3180,
    roofWidthMm: 1765,
    status: "active",
    marketScope: "TR + Global",
    platformClass: "Large Van",
    note: "Pratik dönüşümler için dengeli başlangıç varyantı.",
  },
  {
    key: "master-class-l3h2",
    familyKey: "master-class",
    familyLabel: "Master Sınıfı",
    manufacturerLabel: "Renault Master",
    variantLabel: "L3H2",
    slug: "master-class-l3h2",
    baseWeightKg: 2850,
    maxPayloadKg: 1500,
    wheelbaseMm: 4332,
    roofLengthMm: 3730,
    roofWidthMm: 1765,
    status: "active",
    marketScope: "TR + Global",
    platformClass: "Large Van",
    note: "Geniş Avrupa platform ailesi için ana normalize kayıt.",
  },
  {
    key: "crafter-class-l3h2",
    familyKey: "crafter-class",
    familyLabel: "Crafter Sınıfı",
    manufacturerLabel: "Volkswagen Crafter",
    variantLabel: "L3H2",
    slug: "crafter-class-l3h2",
    baseWeightKg: 2890,
    maxPayloadKg: 1350,
    wheelbaseMm: 3640,
    roofLengthMm: 3450,
    roofWidthMm: 1832,
    status: "active",
    marketScope: "TR + Global",
    platformClass: "Large Van",
    note: "Crafter / TGE mantığı için kontrollü ortak referans.",
  },
  {
    key: "crafter-class-l4h3",
    familyKey: "crafter-class",
    familyLabel: "Crafter Sınıfı",
    manufacturerLabel: "Volkswagen Crafter",
    variantLabel: "L4H3",
    slug: "crafter-class-l4h3",
    baseWeightKg: 3050,
    maxPayloadKg: 1450,
    wheelbaseMm: 4490,
    roofLengthMm: 4300,
    roofWidthMm: 1832,
    status: "active",
    marketScope: "TR + Global",
    platformClass: "Large Van",
    note: "Büyük gövde camper ve servis kurulumları için geniş baz.",
  },
  {
    key: "daily-class-l3h2",
    familyKey: "daily-class",
    familyLabel: "Daily Sınıfı",
    manufacturerLabel: "IVECO Daily",
    variantLabel: "L3H2",
    slug: "daily-class-l3h2",
    baseWeightKg: 3050,
    maxPayloadKg: 1600,
    wheelbaseMm: 3520,
    roofLengthMm: 3520,
    roofWidthMm: 1800,
    status: "active",
    marketScope: "Global + Niche TR",
    platformClass: "Heavy Van",
    note: "Daha ağır teknik sistemli kurulumlar için güçlü baz.",
  },
  {
    key: "daily-class-l4h3",
    familyKey: "daily-class",
    familyLabel: "Daily Sınıfı",
    manufacturerLabel: "IVECO Daily",
    variantLabel: "L4H3",
    slug: "daily-class-l4h3",
    baseWeightKg: 3200,
    maxPayloadKg: 1800,
    wheelbaseMm: 4100,
    roofLengthMm: 4100,
    roofWidthMm: 1800,
    status: "active",
    marketScope: "Global + Niche TR",
    platformClass: "Heavy Van",
    note: "Expedition / heavy-duty senaryolar için normalize referans.",
  },
];

export const officialVehicleImportBatches: OfficialVehicleImportBatch[] = [
  {
    key: "large-van-core",
    title: "Core Large Van Batch",
    description:
      "Skyvan için ana büyük van ailelerini tek seferde içeri alır. İlk admin seed dalgası için önerilen batch budur.",
    seedKeys: officialVehicleSeeds.map((item) => item.key),
  },
  {
    key: "ducato-class",
    title: "Ducato Sınıfı",
    description:
      "Fiat Ducato tabanlı büyük van ailesi için çekirdek varyantlar.",
    seedKeys: officialVehicleSeeds
      .filter((item) => item.familyKey === "ducato-class")
      .map((item) => item.key),
  },
  {
    key: "transit-class",
    title: "Transit Sınıfı",
    description:
      "Ford Transit ailesi için normalize edilmiş uzun gövde varyantları.",
    seedKeys: officialVehicleSeeds
      .filter((item) => item.familyKey === "transit-class")
      .map((item) => item.key),
  },
  {
    key: "sprinter-class",
    title: "Sprinter Sınıfı",
    description:
      "Mercedes-Benz Sprinter için premium large-van referans seti.",
    seedKeys: officialVehicleSeeds
      .filter((item) => item.familyKey === "sprinter-class")
      .map((item) => item.key),
  },
  {
    key: "master-class",
    title: "Master Sınıfı",
    description:
      "Renault Master sınıfı için dengeli büyük van çekirdekleri.",
    seedKeys: officialVehicleSeeds
      .filter((item) => item.familyKey === "master-class")
      .map((item) => item.key),
  },
  {
    key: "crafter-class",
    title: "Crafter Sınıfı",
    description:
      "Crafter / TGE mantığına yakın büyük hacim varyantları.",
    seedKeys: officialVehicleSeeds
      .filter((item) => item.familyKey === "crafter-class")
      .map((item) => item.key),
  },
  {
    key: "daily-class",
    title: "Daily Sınıfı",
    description:
      "Heavy-duty teknik kurulumlara uygun Daily sınıfı çekirdek varyantlar.",
    seedKeys: officialVehicleSeeds
      .filter((item) => item.familyKey === "daily-class")
      .map((item) => item.key),
  },
];

export function getOfficialVehicleSeedsForBatch(
  batchKey: OfficialVehicleImportBatchKey,
): OfficialVehicleSeed[] {
  const batch = officialVehicleImportBatches.find((item) => item.key === batchKey);

  if (!batch) {
    return [];
  }

  const allowedKeys = new Set<OfficialVehicleSeedKey>(batch.seedKeys);

  return officialVehicleSeeds.filter((item) => allowedKeys.has(item.key));
}

export function getOfficialVehicleFamilyCards(): OfficialVehicleImportBatch[] {
  return officialVehicleImportBatches.filter(
    (item) => item.key !== "large-van-core",
  );
}