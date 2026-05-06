"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ArrowLeft,
  Box,
  ChevronDown,
  Hammer,
  Minus,
  Plus,
  Truck,
  Zap,
} from "lucide-react";

import { saveEngineeringBuild } from "./actions";
import ThreeDConfiguratorViewer from "./ThreeDConfiguratorViewer";
import {
  buildWorkshopLayerSelection,
  getDefaultWorkshopCameraView,
  type WorkshopAssetLayerMetadata,
  type WorkshopAssetReadinessSummary,
} from "./_lib/workshop-asset-selection";
import {
  buildWorkshopRenderDiagnostics,
  buildWorkshopRenderPlan,
} from "./_lib/workshop-render-contract";

type WorkshopProduct = {
  id: string;
  title?: string | null;
  name?: string | null;
  sku?: string | null;
  weightKg?: string | number | null;
  basePrice?: string | number | null;
  powerDrawWatts?: string | number | null;
  powerSupplyWatts?: string | number | null;
  productType?: string | null;
  productSubType?: string | null;
  workshopEffect?: "none" | "layer" | "mesh" | "material" | string | null;
  workshopVisibility?:
    | "selectable_visual"
    | "selectable_hidden"
    | "ai_package_only"
    | string
    | null;
  targetLayer?: string | null;
  meshKey?: string | null;
  materialKey?: string | null;
  technicalSpecs?: Record<string, unknown> | null;
  categoryId?: string | null;
  categorySlug?: string | null;
  categoryName?: string | null;
};

type WorkshopModel = {
  id: string;
  slug: string;
  brand?: string | null;
  name?: string | null;
  baseWeightKg?: string | number | null;
  maxPayloadKg?: string | number | null;
};

type WorkshopCartItem = {
  product: WorkshopProduct;
  quantity: number;
};

type AiInsight = {
  type: "info" | "critical";
  title: string;
  message: string;
};

type SaveEngineeringBuildSuccessResult = Extract<
  Awaited<ReturnType<typeof saveEngineeringBuild>>,
  { success: true }
>;

type WorkshopAiDecisionAggregate =
  NonNullable<SaveEngineeringBuildSuccessResult["aiDecisionBundle"]>["aggregate"];
type WorkshopAiDecisionProduct =
  NonNullable<SaveEngineeringBuildSuccessResult["aiDecisionBundle"]>["products"][number];

type VehicleGroupDefinition = {
  id: string;
  label: string;
  detail: string;
  matchers: string[];
  variantOrder: string[];
};

type VehicleGroup = VehicleGroupDefinition & {
  models: WorkshopModel[];
};

type LayoutZone = {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  tone: string;
};

type ProjectLayoutTemplate = {
  id: string;
  name: string;
  short: string;
  tags: string[];
  suitableFor: string[];
  zones: LayoutZone[];
};

type VisualLayerType =
  | "vehicle_shell"
  | "floor"
  | "wall"
  | "bed"
  | "kitchen"
  | "storage"
  | "bathroom"
  | "seat"
  | "table"
  | "window"
  | "door"
  | "material_overlay"
  | "shadow"
  | "light";

type VisualLayer = {
  id: string;
  type: VisualLayerType;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  visible: boolean;
  materialTarget?: "surface" | "furniture" | "floor" | "wall";
  className: string;

  /**
   * Optional future visual asset layer.
   * CSS fallback remains mandatory because asset files may not exist yet.
   */
  assetUrl?: string;
  fallbackClassName?: string;
};

type ProductVisualMeta =
  | {
      visual: false;
      reason: "none" | "mesh_pending";
    }
  | {
      visual: true;
      effectType: "material";
      target: "furniture" | "floor" | "wall";
      material: string;
    }
  | {
      visual: true;
      effectType: "layer";
      targetLayer: WorkshopTargetLayer;
    };

type WorkshopTargetLayer = "bed" | "kitchen" | "storage" | "bathroom" | "table" | "seat";

const workshopTargetLayerLabels: Record<WorkshopTargetLayer, string> = {
  bathroom: "Banyo",
  bed: "Yatak",
  kitchen: "Mutfak",
  seat: "Oturma",
  storage: "Depolama",
  table: "Masa",
};

const vehicleGroupDefinitions: VehicleGroupDefinition[] = [
  {
    id: "psa",
    label: "PSA Grubu",
    detail: "Fiat Ducato / Peugeot Boxer / Citroen Jumper",
    matchers: ["ducato", "boxer", "jumper"],
    variantOrder: ["L2H2", "L3H2", "L4H2", "L3H3", "L4H3"],
  },
  {
    id: "mercedes",
    label: "Mercedes Grubu",
    detail: "Mercedes-Benz Sprinter",
    matchers: ["sprinter"],
    variantOrder: ["L2H2", "L3H2", "L3H3", "L4H3"],
  },
  {
    id: "ford",
    label: "Ford Grubu",
    detail: "Ford Transit",
    matchers: ["transit"],
    variantOrder: ["L2H2", "L3H2", "L4H3"],
  },
  {
    id: "vw",
    label: "VW Grubu",
    detail: "Volkswagen Crafter / Volkswagen Transporter",
    matchers: ["crafter", "transporter"],
    variantOrder: ["L1H1", "L2H1", "L3H2", "L4H3"],
  },
  {
    id: "renault",
    label: "Renault Grubu",
    detail: "Renault Master / Renault Trafic",
    matchers: ["master", "trafic"],
    variantOrder: ["L1H1", "L2H1", "L2H2", "L3H2", "L3H3"],
  },
  {
    id: "iveco",
    label: "Iveco",
    detail: "Iveco Daily",
    matchers: ["daily"],
    variantOrder: ["L3H2", "L4H3", "L5H3"],
  },
];

const projectLayoutTemplates: ProjectLayoutTemplate[] = [
  {
    id: "kompakt-yasam-plani",
    name: "Kompakt Yaşam Planı",
    short: "Çift kişilik yatak + kompakt mutfak",
    tags: ["Yatak", "Mutfak", "Depolama"],
    suitableFor: ["L2H2", "L3H2"],
    zones: [
      { id: "depolama", label: "Depolama", x: 6, y: 10, w: 22, h: 18, tone: "bg-zinc-700/80" },
      { id: "mutfak", label: "Mutfak", x: 32, y: 10, w: 24, h: 24, tone: "bg-amber-500/70" },
      { id: "yatak", label: "Yatak", x: 60, y: 10, w: 30, h: 52, tone: "bg-blue-500/70" },
      { id: "gecis", label: "Geçiş", x: 32, y: 40, w: 24, h: 22, tone: "bg-white/10" },
    ],
  },
  {
    id: "duslu-seyahat-plani",
    name: "Duşlu Seyahat Planı",
    short: "Duş/WC + mutfak + yatak",
    tags: ["Dus/WC", "Mutfak", "Yatak"],
    suitableFor: ["L3H2", "L4H3"],
    zones: [
      { id: "dus", label: "Duş/WC", x: 6, y: 10, w: 22, h: 32, tone: "bg-cyan-500/70" },
      { id: "mutfak", label: "Mutfak", x: 32, y: 10, w: 24, h: 22, tone: "bg-amber-500/70" },
      { id: "depolama", label: "Depolama", x: 32, y: 36, w: 24, h: 26, tone: "bg-zinc-700/80" },
      { id: "yatak", label: "Yatak", x: 60, y: 10, w: 30, h: 52, tone: "bg-blue-500/70" },
    ],
  },
  {
    id: "aile-oturma-plani",
    name: "Aile Oturma Planı",
    short: "Oturma grubu + dönüşebilir yatak",
    tags: ["Oturma", "Masa", "Yatak"],
    suitableFor: ["L3H2", "L4H3"],
    zones: [
      { id: "oturma", label: "Oturma", x: 6, y: 10, w: 28, h: 36, tone: "bg-emerald-500/70" },
      { id: "masa", label: "Masa", x: 38, y: 18, w: 16, h: 16, tone: "bg-orange-500/70" },
      { id: "mutfak", label: "Mutfak", x: 58, y: 10, w: 32, h: 20, tone: "bg-amber-500/70" },
      { id: "yatak", label: "Yatak", x: 58, y: 34, w: 32, h: 28, tone: "bg-blue-500/70" },
    ],
  },
  {
    id: "off-grid-plan",
    name: "Bağımsız Enerji Planı",
    short: "Enerji ve depolama öncelikli düzen",
    tags: ["Enerji", "Depolama", "Uzun Yol"],
    suitableFor: ["L4H3", "L5H3"],
    zones: [
      { id: "enerji", label: "Enerji", x: 6, y: 10, w: 24, h: 24, tone: "bg-fuchsia-500/70" },
      { id: "depolama", label: "Depolama", x: 6, y: 38, w: 24, h: 24, tone: "bg-zinc-700/80" },
      { id: "mutfak", label: "Mutfak", x: 34, y: 10, w: 24, h: 22, tone: "bg-amber-500/70" },
      { id: "yatak", label: "Yatak", x: 62, y: 10, w: 28, h: 30, tone: "bg-blue-500/70" },
      { id: "depo", label: "Uzun Yol", x: 62, y: 44, w: 28, h: 18, tone: "bg-emerald-500/70" },
    ],
  },
];

function formatModelSlug(value: string) {
  return value
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getModelDisplayName(model: WorkshopModel) {
  const preferredName = model.name?.trim();

  if (preferredName) {
    return preferredName;
  }

  return formatModelSlug(model.slug);
}

function getModelPlatformLabel(model: WorkshopModel) {
  const preferredBrand = model.brand?.trim();

  if (preferredBrand) {
    return `${preferredBrand} Platformu`;
  }

  return `${getModelDisplayName(model)} Platformu`;
}

function getModelSearchText(model: WorkshopModel) {
  return `${model.slug} ${model.name ?? ""} ${model.brand ?? ""}`.toLowerCase();
}

function getModelVariantLabel(model: WorkshopModel) {
  const source = `${model.slug} ${model.name ?? ""}`;
  const variantMatch = source.match(/l\s*([1-5])\s*h\s*([1-4])/i);

  if (variantMatch) {
    return `L${variantMatch[1]}H${variantMatch[2]}`;
  }

  return null;
}

function getModelSeriesLabel(model: WorkshopModel) {
  const displayName = getModelDisplayName(model);
  const variantLabel = getModelVariantLabel(model);

  if (!variantLabel) {
    return displayName;
  }

  const variantIndex = displayName.toLowerCase().indexOf(variantLabel.toLowerCase());
  if (variantIndex > 0) {
    return displayName.slice(0, variantIndex).trim();
  }

  return displayName;
}

function getProductVisualMeta(product: WorkshopProduct): ProductVisualMeta | null {
  if (
    product.workshopVisibility === "ai_package_only" ||
    product.workshopVisibility === "selectable_hidden"
  ) {
    return {
      visual: false,
      reason: "none",
    };
  }

  const targetLayer = normalizeWorkshopTargetLayer(product.targetLayer);

  if (product.workshopEffect === "layer" && targetLayer) {
    return {
      visual: true,
      effectType: "layer",
      targetLayer,
    };
  }

  if (product.workshopEffect === "material" && product.materialKey) {
    return {
      visual: true,
      effectType: "material",
      target: "furniture",
      material: product.materialKey,
    };
  }

  if (product.workshopEffect === "mesh") {
    return {
      visual: false,
      reason: "mesh_pending",
    };
  }

  return {
    visual: false,
    reason: "none",
  };
}

function isManuallySelectableProduct(product: WorkshopProduct) {
  return product.workshopVisibility !== "ai_package_only";
}

function normalizeWorkshopTargetLayer(value?: string | null): WorkshopTargetLayer | null {
  if (
    value === "bed" ||
    value === "kitchen" ||
    value === "storage" ||
    value === "bathroom" ||
    value === "table" ||
    value === "seat"
  ) {
    return value;
  }

  return null;
}

function getMaterialOverlayClass(
  target: "furniture" | "floor" | "wall",
  material: string | null,
) {
  if (!material) {
    return "";
  }

  if (target === "furniture" && material === "wood_oak") {
    return "bg-[linear-gradient(145deg,rgba(143,108,73,0.24),rgba(98,70,44,0.34))]";
  }

  if (target === "floor" && material === "graphite_floor") {
    return "bg-[linear-gradient(180deg,rgba(98,84,68,0.16),rgba(28,24,20,0.24))]";
  }

  if (target === "wall" && material === "soft_wall") {
    return "bg-[linear-gradient(180deg,rgba(212,212,216,0.08),rgba(82,82,91,0.14))]";
  }

  return "";
}

function getLayoutDrivenVisualLayers(layout: ProjectLayoutTemplate) {
  const layerState: Record<string, boolean> = {};

  layout.zones.forEach((zone) => {
    const label = zone.label.toLowerCase();

    if (label.includes("yatak")) {
      layerState.bed = true;
    }
    if (label.includes("mutfak")) {
      layerState.kitchen = true;
    }
    if (label.includes("depolama")) {
      layerState.storage = true;
    }
    if (label.includes("duş") || label.includes("wc")) {
      layerState.bathroom = true;
    }
    if (label.includes("oturma")) {
      layerState.seat = true;
    }
    if (label.includes("masa")) {
      layerState.table = true;
    }
  });

  return layerState;
}

function rebuildVisualStateFromSelectedProducts(nextProducts: WorkshopCartItem[]) {
  const activeVisualLayers: Record<string, boolean> = {};
  const activeMaterials: {
    furniture: string | null;
    floor: string | null;
    wall: string | null;
  } = {
    furniture: null,
    floor: null,
    wall: null,
  };

  nextProducts.forEach((item) => {
    for (let index = 0; index < item.quantity; index += 1) {
      const meta = getProductVisualMeta(item.product);

      if (!meta || meta.visual === false) {
        continue;
      }

      if (meta.effectType === "material") {
        activeMaterials[meta.target] = meta.material;
      }

      if (meta.effectType === "layer") {
        activeVisualLayers[meta.targetLayer] = true;
      }
    }
  });

  return {
    activeVisualLayers,
    activeMaterials,
  };
}

function createVisualLayer(
  layer: Omit<VisualLayer, "className"> & { className?: string },
): VisualLayer {
  return {
    ...layer,
    className: layer.className ?? "",
  };
}

function renderLayoutSchematic(
  layout: ProjectLayoutTemplate,
  size: "small" | "large" = "small",
) {
  const containerClass =
    size === "large"
      ? "h-full min-h-[26rem] rounded-[2rem] border border-white/8 bg-[radial-gradient(circle_at_top,rgba(96,165,250,0.08),transparent_30%),linear-gradient(180deg,rgba(13,13,15,0.98),rgba(5,5,6,0.99))] shadow-[0_30px_80px_rgba(0,0,0,0.45)]"
      : "h-36 rounded-[1.25rem] border border-white/8 bg-[linear-gradient(180deg,rgba(14,14,16,0.96),rgba(6,6,7,0.98))]";
  const labelClass =
    size === "large"
      ? "text-[10px] tracking-[0.08em]"
      : "text-[8px] tracking-[0.08em]";
  const frameClass =
    size === "large"
      ? "absolute inset-[6%_6%] rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(28,28,32,0.96),rgba(13,13,15,0.98))] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),inset_0_-30px_50px_rgba(0,0,0,0.28)]"
      : "absolute inset-[10%_7%] rounded-[1.2rem] border border-white/10 bg-black/50";
  const canvasClass =
    size === "large"
      ? "absolute inset-[6%_8%] rounded-[1.8rem] border border-white/8 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_42%),linear-gradient(180deg,rgba(43,43,48,0.88),rgba(24,24,28,0.94))] shadow-[inset_0_18px_24px_rgba(255,255,255,0.03),inset_0_-24px_38px_rgba(0,0,0,0.26)]"
      : "absolute inset-0";
  const zoneClass =
    size === "large"
      ? "rounded-[1.15rem] border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),inset_0_-10px_18px_rgba(0,0,0,0.22),0_16px_30px_rgba(0,0,0,0.18)] backdrop-blur-[1px]"
      : "rounded-[0.85rem] border border-white/10";
  const zoneToneMap: Record<string, string> = {
    Yatak:
      "bg-[linear-gradient(180deg,rgba(96,165,250,0.9),rgba(37,99,235,0.72))] before:absolute before:inset-0 before:rounded-[inherit] before:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.2),transparent_48%)] before:content-['']",
    Mutfak:
      "bg-[linear-gradient(180deg,rgba(251,191,36,0.88),rgba(217,119,6,0.7))] before:absolute before:inset-0 before:rounded-[inherit] before:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_48%)] before:content-['']",
    "Duş/WC":
      "bg-[linear-gradient(180deg,rgba(34,211,238,0.88),rgba(8,145,178,0.72))] before:absolute before:inset-0 before:rounded-[inherit] before:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_48%)] before:content-['']",
    Depolama:
      "bg-[linear-gradient(180deg,rgba(113,113,122,0.88),rgba(63,63,70,0.72))] before:absolute before:inset-0 before:rounded-[inherit] before:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_48%)] before:content-['']",
    Oturma:
      "bg-[linear-gradient(180deg,rgba(52,211,153,0.88),rgba(5,150,105,0.72))] before:absolute before:inset-0 before:rounded-[inherit] before:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_48%)] before:content-['']",
    Masa:
      "bg-[linear-gradient(180deg,rgba(251,146,60,0.88),rgba(194,65,12,0.72))] before:absolute before:inset-0 before:rounded-[inherit] before:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_48%)] before:content-['']",
    Enerji:
      "bg-[linear-gradient(180deg,rgba(217,70,239,0.9),rgba(147,51,234,0.72))] before:absolute before:inset-0 before:rounded-[inherit] before:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.2),transparent_48%)] before:content-['']",
    "Uzun Yol":
      "bg-[linear-gradient(180deg,rgba(74,222,128,0.88),rgba(22,163,74,0.72))] before:absolute before:inset-0 before:rounded-[inherit] before:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_48%)] before:content-['']",
    Geçiş:
      "bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]",
  };

  return (
    <div className={`relative w-full overflow-hidden ${containerClass}`}>
      <div className={frameClass}>
        {size === "large" ? (
          <>
            <div className="absolute left-[4.2%] top-[7%] bottom-[7%] w-[3.8%] rounded-full border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]" />
            <div className="absolute right-[4.2%] top-[7%] bottom-[7%] w-[3.8%] rounded-full border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]" />
          </>
        ) : null}
        <div className={canvasClass}>
          <div className="absolute inset-0 rounded-[inherit] bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:22px_22px]" />
          {size === "large" ? (
            <div className="absolute inset-[4%] rounded-[1.5rem] border border-white/6" />
          ) : null}
        </div>
        {layout.zones.map((zone) => (
          <div
            key={zone.id}
            className={`absolute flex items-center justify-center px-1 text-center font-medium text-white/95 ${zoneClass} ${zoneToneMap[zone.label] ?? zone.tone} ${labelClass}`}
            style={{
              left: `${zone.x}%`,
              top: `${zone.y}%`,
              width: `${zone.w}%`,
              height: `${zone.h}%`,
            }}
          >
            <span className="relative z-10">{zone.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function getIsometricAssetBasePath(modelSlug?: string | null) {
  return `/visuals/isometric/${modelSlug || "default"}`;
}

function getIsometricSceneLayers(input: {
  layout: ProjectLayoutTemplate;
  modelSlug?: string | null;
  activeVisualLayers: Record<string, boolean>;
  activeMaterials: {
    furniture: string | null;
    floor: string | null;
    wall: string | null;
  };
}) {
  const assetBasePath = getIsometricAssetBasePath(input.modelSlug);
  const layoutLayers = getLayoutDrivenVisualLayers(input.layout);
  const isLayerVisible = (layerId: keyof typeof layoutLayers | string) =>
    Boolean(layoutLayers[layerId] || input.activeVisualLayers[layerId]);
  const isLayerHighlighted = (layerId: string) => Boolean(input.activeVisualLayers[layerId]);

  const furnitureMaterial = getMaterialOverlayClass(
    "furniture",
    input.activeMaterials.furniture,
  );
  const floorMaterial = getMaterialOverlayClass("floor", input.activeMaterials.floor);
  const wallMaterial = getMaterialOverlayClass("wall", input.activeMaterials.wall);

  return [
    createVisualLayer({
      id: "shadow-base",
      type: "shadow",
      label: "Yumuşak Gölge",
      x: 6,
      y: 80,
      w: 88,
      h: 11,
      z: 1,
      visible: true,
      assetUrl: `${assetBasePath}/shadow.png`,
      className:
        "rounded-[50%] bg-[radial-gradient(circle,rgba(0,0,0,0.52),rgba(0,0,0,0.02)_72%)] blur-3xl",
    }),
    createVisualLayer({
      id: "vehicle-shell",
      type: "vehicle_shell",
      label: "Araç Gövdesi",
      x: 6,
      y: 8,
      w: 88,
      h: 70,
      z: 5,
      visible: true,
      assetUrl: `${assetBasePath}/shell.png`,
      className:
        "rounded-[3.35rem] border border-white/12 bg-[linear-gradient(180deg,rgba(42,42,46,0.96),rgba(13,13,15,0.99))] shadow-[inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-24px_34px_rgba(0,0,0,0.2),0_36px_90px_rgba(0,0,0,0.4)] before:absolute before:inset-[1.7%] before:rounded-[3rem] before:border before:border-white/6 before:content-['']",
    }),
    createVisualLayer({
      id: "light",
      type: "light",
      label: "Üst Işık",
      x: 12,
      y: 11,
      w: 72,
      h: 22,
      z: 6,
      visible: true,
      assetUrl: `${assetBasePath}/light.png`,
      className:
        "rounded-[50%] bg-[radial-gradient(circle,rgba(255,255,255,0.18),rgba(255,255,255,0.01)_72%)] blur-3xl",
    }),
    createVisualLayer({
      id: "shell-cutaway-rim",
      type: "vehicle_shell",
      label: "Kesit Kenarı",
      x: 10,
      y: 13,
      w: 80,
      h: 9,
      z: 8,
      visible: true,
      assetUrl: `${assetBasePath}/cutaway-rim.png`,
      className:
        "rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(86,86,94,0.42),rgba(34,34,39,0.18))] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
    }),
    createVisualLayer({
      id: "wall-left",
      type: "wall",
      label: "Sol Duvar",
      x: 13,
      y: 20,
      w: 12,
      h: 46,
      z: 10,
      visible: true,
      materialTarget: "wall",
      assetUrl: `${assetBasePath}/wall-left.png`,
      className:
        "rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(112,112,118,0.34),rgba(44,44,49,0.18))] shadow-[inset_3px_0_12px_rgba(255,255,255,0.05),inset_0_-14px_22px_rgba(0,0,0,0.24),0_10px_22px_rgba(0,0,0,0.14)] before:absolute before:right-[6%] before:top-[8%] before:bottom-[8%] before:w-[12%] before:rounded-full before:bg-black/18 before:content-[''] " +
        wallMaterial,
    }),
    createVisualLayer({
      id: "wall-right",
      type: "wall",
      label: "Sağ Duvar",
      x: 75,
      y: 20,
      w: 12,
      h: 46,
      z: 10,
      visible: true,
      materialTarget: "wall",
      assetUrl: `${assetBasePath}/wall-right.png`,
      className:
        "rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(112,112,118,0.34),rgba(44,44,49,0.18))] shadow-[inset_-3px_0_12px_rgba(255,255,255,0.05),inset_0_-14px_22px_rgba(0,0,0,0.24),0_10px_22px_rgba(0,0,0,0.14)] before:absolute before:left-[6%] before:top-[8%] before:bottom-[8%] before:w-[12%] before:rounded-full before:bg-black/18 before:content-[''] " +
        wallMaterial,
    }),
    createVisualLayer({
      id: "wall-back",
      type: "wall",
      label: "Arka Duvar",
      x: 24,
      y: 18,
      w: 52,
      h: 12,
      z: 12,
      visible: true,
      materialTarget: "wall",
      assetUrl: `${assetBasePath}/wall-back.png`,
      className:
        "rounded-[1.65rem] border border-white/8 bg-[linear-gradient(180deg,rgba(126,126,136,0.28),rgba(46,46,50,0.18))] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-8px_14px_rgba(0,0,0,0.18)] before:absolute before:inset-x-[6%] before:bottom-[18%] before:h-[8%] before:rounded-full before:bg-black/16 before:content-[''] " +
        wallMaterial,
    }),
    createVisualLayer({
      id: "cabin-boundary",
      type: "wall",
      label: "Kabin Ayrımı",
      x: 30,
      y: 61,
      w: 38,
      h: 5,
      z: 15,
      visible: true,
      materialTarget: "wall",
      assetUrl: `${assetBasePath}/cabin-boundary.png`,
      className:
        "rounded-full border border-white/8 bg-[linear-gradient(180deg,rgba(90,90,96,0.32),rgba(40,40,44,0.18))] shadow-[0_10px_14px_rgba(0,0,0,0.14)]",
    }),
    createVisualLayer({
      id: "window-left",
      type: "window",
      label: "Sol Pencere",
      x: 15.8,
      y: 24,
      w: 7.2,
      h: 18,
      z: 13,
      visible: true,
      assetUrl: `${assetBasePath}/window-left.png`,
      className:
        "rounded-[1.05rem] border border-sky-200/18 bg-[linear-gradient(180deg,rgba(148,184,207,0.18),rgba(71,85,105,0.06))] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-sm before:absolute before:inset-[14%] before:rounded-[0.8rem] before:border before:border-white/10 before:content-['']",
    }),
    createVisualLayer({
      id: "window-right",
      type: "window",
      label: "Sağ Pencere",
      x: 77,
      y: 24,
      w: 7.2,
      h: 18,
      z: 13,
      visible: true,
      assetUrl: `${assetBasePath}/window-right.png`,
      className:
        "rounded-[1.05rem] border border-sky-200/18 bg-[linear-gradient(180deg,rgba(148,184,207,0.18),rgba(71,85,105,0.06))] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-sm before:absolute before:inset-[14%] before:rounded-[0.8rem] before:border before:border-white/10 before:content-['']",
    }),
    createVisualLayer({
      id: "door",
      type: "door",
      label: "Giriş",
      x: 71,
      y: 53,
      w: 14,
      h: 16,
      z: 14,
      visible: true,
      assetUrl: `${assetBasePath}/door.png`,
      className:
        "rounded-[1.4rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] before:absolute before:right-[16%] before:top-[18%] before:h-[12%] before:w-[8%] before:rounded-full before:bg-white/30 before:content-['']",
    }),
    createVisualLayer({
      id: "floor",
      type: "floor",
      label: "Zemin",
      x: 21,
      y: 28,
      w: 58,
      h: 39,
      z: 20,
      visible: true,
      materialTarget: "floor",
      assetUrl: `${assetBasePath}/floor.png`,
      className:
        "rounded-[2.15rem] border border-white/8 bg-[linear-gradient(180deg,rgba(94,74,57,0.46),rgba(41,31,25,0.94))] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-16px_30px_rgba(0,0,0,0.26),0_16px_34px_rgba(0,0,0,0.18)] before:absolute before:inset-0 before:rounded-[inherit] before:bg-[linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.015)_1px,transparent_1px)] before:bg-[size:28px_28px] before:opacity-60 before:content-[''] after:absolute after:inset-[2.6%] after:rounded-[1.75rem] after:border after:border-black/12 after:content-[''] " +
        floorMaterial,
    }),
    createVisualLayer({
      id: "bed",
      type: "bed",
      label: "Yatak",
      x: 54,
      y: 35,
      w: 19,
      h: 24,
      z: 30,
      visible: isLayerVisible("bed"),
      materialTarget: "furniture",
      assetUrl: `${assetBasePath}/bed.png`,
      className:
        "rounded-[1.35rem] border border-slate-200/12 bg-[linear-gradient(180deg,rgba(187,196,206,0.92),rgba(109,122,138,0.72))] shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_22px_32px_rgba(0,0,0,0.24)] before:absolute before:inset-x-[6%] before:bottom-[-12%] before:h-[24%] before:rounded-[1rem] before:bg-[linear-gradient(180deg,rgba(88,64,45,0.72),rgba(45,31,24,0.92))] before:shadow-[0_12px_20px_rgba(0,0,0,0.18)] before:content-[''] after:absolute after:left-[10%] after:right-[10%] after:top-[10%] after:h-[28%] after:rounded-[1rem] after:bg-white/18 after:content-[''] " +
        (isLayerHighlighted("bed")
          ? "ring-2 ring-slate-200/24 shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_26px_38px_rgba(148,163,184,0.18)] "
          : "opacity-80 ") +
        furnitureMaterial,
    }),
    createVisualLayer({
      id: "kitchen",
      type: "kitchen",
      label: "Mutfak",
      x: 34,
      y: 31,
      w: 14,
      h: 22,
      z: 32,
      visible: isLayerVisible("kitchen"),
      materialTarget: "furniture",
      assetUrl: `${assetBasePath}/kitchen.png`,
      className:
        "rounded-[1.15rem] border border-stone-200/12 bg-[linear-gradient(180deg,rgba(141,120,96,0.86),rgba(83,63,49,0.82))] shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_22px_34px_rgba(0,0,0,0.24)] before:absolute before:inset-x-[4%] before:top-[-7%] before:h-[16%] before:rounded-[0.9rem] before:bg-[linear-gradient(180deg,rgba(220,220,223,0.84),rgba(122,122,128,0.62))] before:shadow-[0_8px_16px_rgba(0,0,0,0.16)] before:content-[''] after:absolute after:left-[12%] after:top-[16%] after:h-[16%] after:w-[18%] after:rounded-full after:border after:border-black/12 after:bg-black/16 after:content-[''] " +
        (isLayerHighlighted("kitchen")
          ? "ring-2 ring-stone-200/22 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_26px_40px_rgba(161,98,7,0.14)] "
          : "opacity-80 ") +
        furnitureMaterial,
    }),
    createVisualLayer({
      id: "storage",
      type: "storage",
      label: "Depolama",
      x: 24,
      y: 31,
      w: 12,
      h: 20,
      z: 31,
      visible: isLayerVisible("storage"),
      materialTarget: "furniture",
      assetUrl: `${assetBasePath}/storage.png`,
      className:
        "rounded-[1.1rem] border border-white/10 bg-[linear-gradient(180deg,rgba(126,120,112,0.8),rgba(67,61,58,0.76))] shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_20px_30px_rgba(0,0,0,0.24)] before:absolute before:left-[8%] before:right-[8%] before:top-[8%] before:h-[18%] before:rounded-[0.8rem] before:bg-[linear-gradient(180deg,rgba(160,140,116,0.42),rgba(77,58,38,0.26))] before:content-[''] after:absolute after:right-[-8%] after:top-[10%] after:bottom-[10%] after:w-[12%] after:rounded-full after:bg-black/14 after:blur-[1px] after:content-[''] " +
        (isLayerHighlighted("storage")
          ? "ring-2 ring-white/18 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_26px_38px_rgba(255,255,255,0.08)] "
          : "opacity-78 ") +
        furnitureMaterial,
    }),
    createVisualLayer({
      id: "bathroom",
      type: "bathroom",
      label: "Duş/WC",
      x: 24,
      y: 28,
      w: 14,
      h: 16,
      z: 33,
      visible: isLayerVisible("bathroom"),
      assetUrl: `${assetBasePath}/bathroom.png`,
      className:
        "rounded-[1.2rem] border border-sky-100/14 bg-[linear-gradient(180deg,rgba(141,174,186,0.8),rgba(74,104,114,0.76))] shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_22px_34px_rgba(0,0,0,0.24)] before:absolute before:left-[16%] before:top-[16%] before:h-[22%] before:w-[22%] before:rounded-full before:bg-white/22 before:content-[''] after:absolute after:right-[14%] after:bottom-[16%] after:h-[14%] after:w-[24%] after:rounded-full after:bg-black/10 after:content-[''] " +
        (isLayerHighlighted("bathroom")
          ? "ring-2 ring-sky-200/22 shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_26px_38px_rgba(125,211,252,0.14)] "
          : "opacity-78 "),
    }),
    createVisualLayer({
      id: "seat",
      type: "seat",
      label: "Oturma",
      x: 28,
      y: 46,
      w: 18,
      h: 12,
      z: 34,
      visible: isLayerVisible("seat"),
      materialTarget: "furniture",
      assetUrl: `${assetBasePath}/seat.png`,
      className:
        "rounded-[1.3rem] border border-emerald-100/10 bg-[linear-gradient(180deg,rgba(112,135,118,0.84),rgba(63,86,74,0.74))] shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_22px_34px_rgba(0,0,0,0.22)] before:absolute before:inset-x-[8%] before:top-[8%] before:h-[34%] before:rounded-[1rem] before:bg-white/10 before:content-[''] " +
        (isLayerHighlighted("seat")
          ? "ring-2 ring-emerald-200/18 shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_26px_38px_rgba(52,211,153,0.14)] "
          : "opacity-78 ") +
        furnitureMaterial,
    }),
    createVisualLayer({
      id: "table",
      type: "table",
      label: "Masa",
      x: 45,
      y: 45,
      w: 10,
      h: 10,
      z: 35,
      visible: isLayerVisible("table"),
      materialTarget: "furniture",
      assetUrl: `${assetBasePath}/table.png`,
      className:
        "rounded-[0.95rem] border border-stone-100/12 bg-[linear-gradient(180deg,rgba(149,126,103,0.88),rgba(97,76,61,0.76))] shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_18px_28px_rgba(0,0,0,0.22)] before:absolute before:left-[18%] before:right-[18%] before:bottom-[-22%] before:h-[30%] before:rounded-full before:bg-black/16 before:content-[''] " +
        (isLayerHighlighted("table")
          ? "ring-2 ring-stone-200/18 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_24px_34px_rgba(245,158,11,0.12)] "
          : "opacity-78 ") +
        furnitureMaterial,
    }),
  ].sort((left, right) => left.z - right.z);
}

export default function ConfiguratorClient({
  dbProducts,
  dbModels,
  workshopAssetReadinessByModel,
  workshopAssetsByModel,
}: {
  dbProducts: WorkshopProduct[];
  dbModels: WorkshopModel[];
  workshopAssetReadinessByModel?: Record<string, WorkshopAssetReadinessSummary>;
  workshopAssetsByModel?: Record<string, WorkshopAssetLayerMetadata[]>;
}) {
  const [activeVehicle, setActiveVehicle] = useState<WorkshopModel | null>(null);
  const [selectedLayout, setSelectedLayout] = useState<ProjectLayoutTemplate | null>(null);
  const [cart, setCart] = useState<WorkshopCartItem[]>([]);
  const [isApproved, setIsApproved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedAiDecisionAggregate, setSavedAiDecisionAggregate] =
    useState<WorkshopAiDecisionAggregate | null>(null);
  const [savedAiDecisionProducts, setSavedAiDecisionProducts] = useState<
    WorkshopAiDecisionProduct[]
  >([]);
  const [hasAiDecisionBundleError, setHasAiDecisionBundleError] = useState(false);
  const [activeVehicleGroupId, setActiveVehicleGroupId] = useState<string | null>(null);
  const [selectedCameraView] = useState("");
  const [activeVisualLayers, setActiveVisualLayers] = useState<Record<string, boolean>>({});
  const [activeMaterials, setActiveMaterials] = useState<{
    furniture: string | null;
    floor: string | null;
    wall: string | null;
  }>({
    furniture: null,
    floor: null,
    wall: null,
  });
  const [activeFocusTargetId, setActiveFocusTargetId] =
    useState<WorkshopTargetLayer | null>(null);
  const [failedSceneAssets, setFailedSceneAssets] = useState<Record<string, boolean>>({});
  const [is3dFallbackActive, setIs3dFallbackActive] = useState(false);
  const availableModels = useMemo(() => dbModels ?? [], [dbModels]);
  const manualProducts = useMemo(
    () => (dbProducts ?? []).filter(isManuallySelectableProduct),
    [dbProducts],
  );
  const savedAiDecisionProductsById = useMemo(
    () =>
      new Map(
        savedAiDecisionProducts.map((productDecision) => [
          productDecision.productId,
          productDecision,
        ]),
      ),
    [savedAiDecisionProducts],
  );
  const vehicleGroups = useMemo<VehicleGroup[]>(() => {
    return vehicleGroupDefinitions
      .map((group) => {
        const models = availableModels
          .filter((model) => {
            const searchText = getModelSearchText(model);
            return group.matchers.some((matcher) => searchText.includes(matcher));
          })
          .sort((left, right) => {
            const leftVariant = getModelVariantLabel(left);
            const rightVariant = getModelVariantLabel(right);
            const leftIndex =
              leftVariant === null
                ? Number.MAX_SAFE_INTEGER
                : group.variantOrder.indexOf(leftVariant);
            const rightIndex =
              rightVariant === null
                ? Number.MAX_SAFE_INTEGER
                : group.variantOrder.indexOf(rightVariant);

            if (leftIndex !== rightIndex) {
              return leftIndex - rightIndex;
            }

            return getModelDisplayName(left).localeCompare(getModelDisplayName(right), "tr");
          });

        return {
          ...group,
          models,
        };
      })
      .filter((group) => group.models.length > 0);
  }, [availableModels]);

  const groupedProducts = useMemo(() => {
    const categoryMap = new Map<
      string,
      {
        id: string;
        name: string;
        products: WorkshopProduct[];
      }
    >();

    manualProducts.forEach((product) => {
      const categoryId = product.categoryId?.trim() || "default-category";
      const categoryName = product.categoryName?.trim() || "Donanım Kalemleri";
      const existingCategory = categoryMap.get(categoryId);

      if (existingCategory) {
        existingCategory.products.push(product);
        return;
      }

      categoryMap.set(categoryId, {
        id: categoryId,
        name: categoryName,
        products: [product],
      });
    });

    return Array.from(categoryMap.values());
  }, [manualProducts]);
  const [openCategoryId, setOpenCategoryId] = useState<string | null>(null);

  const stats = useMemo(() => {
    let weight = activeVehicle ? Number(activeVehicle.baseWeightKg || 2100) : 0;
    let solarW = 0;
    let dcdcA = 0;
    let batteryAh = 0;
    let inverterW = 0;
    let mpptA = 0;
    const acdcA = 0;
    const genW = 0;

    cart.forEach((item) => {
      const product = item.product;
      const quantity = item.quantity;
      const text = (product.title || product.name || product.sku || "").toLowerCase();

      weight += Number(product.weightKg || 0) * quantity;

      if (/solar|panel|monokristal|polikristal|güneş|pv|-bs-/i.test(text)) {
        solarW += (Number(text.match(/(\d+)\s*w/i)?.[1]) || 0) * quantity;
      }
      if (/dcdc|orion|dc to dc|alternatör/i.test(text)) {
        dcdcA += (Number(text.match(/(\d+)\s*a/i)?.[1]) || 0) * quantity;
      }
      if (/mppt|şarj kontrol/i.test(text)) {
        mpptA += (Number(text.match(/(\d+)\s*a/i)?.[1]) || 0) * quantity;
      }
      if (/akü|lifepo4|lithium|jel|battery/i.test(text)) {
        batteryAh += (Number(text.match(/(\d+)\s*ah/i)?.[1]) || 0) * quantity;
      }
      if (/inverter|multiplus|phoenix/i.test(text)) {
        inverterW +=
          (Number(text.match(/(\d{3,4})\s*w/i)?.[1]) ||
            Number(text.match(/(\d{3,4})\s*va/i)?.[1]) ||
            0) * quantity;
      }
    });

    return { weight, solarW, dcdcA, acdcA, genW, batteryAh, inverterW, mpptA };
  }, [cart, activeVehicle]);

  const aiInsights = useMemo(() => {
    const insights: AiInsight[] = [];

    if (!activeVehicle) {
      return insights;
    }

    const systemVoltage = 12;

    if (stats.inverterW > 0) {
      const maxDrawAmps = Math.ceil(stats.inverterW / systemVoltage);
      const cableRecommendation =
        maxDrawAmps > 200 ? "2x 50mm²" : maxDrawAmps > 100 ? "50mm²" : "35mm²";

      insights.push({
        type: "info",
        title: "Kablolama Reçetesi",
        message: `${stats.inverterW}W yük için minimum ${cableRecommendation} DC kablo kullanılmalıdır.`,
      });
    }

    if (stats.solarW > 0 && stats.mpptA === 0) {
      insights.push({
        type: "critical",
        title: "Eksik Bileşen: MPPT",
        message: `${stats.solarW}W güneş paneli tespit edildi ancak sistemi yönetecek MPPT seçilmedi.`,
      });
    }

    return insights;
  }, [stats, activeVehicle]);

  const maxAllowedWeight = activeVehicle
    ? Number(activeVehicle.baseWeightKg) + Number(activeVehicle.maxPayloadKg || 1400)
    : 3500;
  const hasCriticalError =
    stats.weight > maxAllowedWeight || aiInsights.some((insight) => insight.type === "critical");

  const applyVisualStateFromCart = (nextCart: WorkshopCartItem[]) => {
    const rebuiltState = rebuildVisualStateFromSelectedProducts(nextCart);
    setActiveVisualLayers(rebuiltState.activeVisualLayers);
    setActiveMaterials(rebuiltState.activeMaterials);
  };

  const handleAddItem = (product: WorkshopProduct) => {
    setSavedAiDecisionAggregate(null);
    setSavedAiDecisionProducts([]);
    setHasAiDecisionBundleError(false);
    const meta = getProductVisualMeta(product);
    const layer = meta?.visual && meta.effectType === "layer" ? meta.targetLayer : null;

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      const nextCart = existing
        ? prev.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          )
        : [...prev, { product, quantity: 1 }];

      applyVisualStateFromCart(nextCart);

      if (layer) {
        setActiveVisualLayers((current) => ({
          ...current,
          [layer]: true,
        }));
        setActiveFocusTargetId(layer);
      }

      return nextCart;
    });
  };

  const handleRemoveItem = (productId: string) => {
    setSavedAiDecisionAggregate(null);
    setSavedAiDecisionProducts([]);
    setHasAiDecisionBundleError(false);

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === productId);
      const nextCart =
        existing && existing.quantity > 1
          ? prev.map((item) =>
              item.product.id === productId
                ? { ...item, quantity: item.quantity - 1 }
                : item,
            )
          : prev.filter((item) => item.product.id !== productId);

      applyVisualStateFromCart(nextCart);

      return nextCart;
    });
  };

  const handle3DModelLoadError = useCallback(() => {
    setIs3dFallbackActive(true);
  }, []);

  const normalizedAggregateAi = useMemo(() => {
    if (!savedAiDecisionAggregate) {
      return null;
    }

    const severity =
      savedAiDecisionAggregate.blockerCount > 0
        ? "blocker"
        : savedAiDecisionAggregate.warningCount > 0
          ? "warning"
          : "ready";

    const tone =
      severity === "blocker"
        ? {
            badge: "border-red-500/30 bg-red-500/10 text-red-300",
            panel: "border-red-900/60 bg-red-950/20",
          }
        : severity === "warning"
          ? {
              badge: "border-amber-500/30 bg-amber-500/10 text-amber-300",
              panel: "border-amber-900/60 bg-amber-950/20",
            }
          : {
              badge: "border-green-500/30 bg-green-500/10 text-green-300",
              panel: "border-green-900/60 bg-green-950/20",
            };

    const label =
      severity === "blocker"
        ? `BLOCKED (${savedAiDecisionAggregate.blockerCount})`
        : severity === "warning"
          ? `WARNING (${savedAiDecisionAggregate.warningCount})`
          : "READY";

    const actionHint =
      severity === "blocker"
        ? {
            text: "Engineering conflict detected. Resolve incompatible components before proceeding.",
            className: "text-red-300",
          }
        : severity === "warning"
          ? {
              text: "Configuration is functional but not optimal. Review suggested improvements.",
              className: "text-amber-300",
            }
          : {
              text: "Configuration is technically valid and ready for production.",
              className: "text-green-300",
            };

    return {
      severity,
      label,
      tone,
      actionHint,
    };
  }, [savedAiDecisionAggregate]);

  const shouldRenderSavedProductAiSignals =
    isApproved &&
    !hasAiDecisionBundleError &&
    savedAiDecisionAggregate !== null &&
    savedAiDecisionProducts.length > 0;

  const saveSuccessHint = isApproved
    ? hasAiDecisionBundleError
      ? "Proje kaydedildi. Teklif ekranı açılıyor."
      : "Proje kaydedildi. AI değerlendirmesi tamamlandı. Teklif ekranı açılıyor."
    : null;

  const payloadReserveKg = Math.max(maxAllowedWeight - stats.weight, 0);
  const visiblePowerW = stats.solarW > 0 ? stats.solarW : stats.inverterW;
  const threeDModelUrl = "/models/skyvan/default-van.glb";
  const cartSummary = useMemo(() => {
    let totalQuantity = 0;
    let visualQuantity = 0;
    let technicalQuantity = 0;
    let packageOnlyQuantity = 0;
    let totalPowerSupplyWatts = 0;
    let totalPowerDrawWatts = 0;
    const visualEffectPairs = new Map<string, string>();

    cart.forEach((item) => {
      const { product, quantity } = item;
      totalQuantity += quantity;
      totalPowerSupplyWatts += Number(product.powerSupplyWatts || 0) * quantity;
      totalPowerDrawWatts += Number(product.powerDrawWatts || 0) * quantity;

      if (product.workshopVisibility === "selectable_visual") {
        visualQuantity += quantity;

        if (product.workshopEffect && product.workshopEffect !== "none") {
          const targetLayer = normalizeWorkshopTargetLayer(product.targetLayer);

          if (targetLayer) {
            const pairLabel = `${workshopTargetLayerLabels[targetLayer]} / ${product.workshopEffect}`;
            visualEffectPairs.set(`${targetLayer}:${product.workshopEffect}`, pairLabel);
          }
        }
      }

      if (product.workshopVisibility === "selectable_hidden") {
        technicalQuantity += quantity;
      }

      if (product.workshopVisibility === "ai_package_only") {
        packageOnlyQuantity += quantity;
      }
    });

    return {
      totalQuantity,
      visualQuantity,
      technicalQuantity,
      packageOnlyQuantity,
      totalPowerSupplyWatts,
      totalPowerDrawWatts,
      netPowerWatts: totalPowerSupplyWatts - totalPowerDrawWatts,
      visualEffectSummary: Array.from(visualEffectPairs.values()).join(", ") || "Yok",
    };
  }, [cart]);
  const activeWorkshopAssetReadiness = useMemo(() => {
    if (!activeVehicle) {
      return null;
    }

    const readiness = workshopAssetReadinessByModel?.[activeVehicle.id] ?? null;

    if (!readiness) {
      return null;
    }

    const selectedProductIds = new Set(cart.map((item) => item.product.id));
    const selectedProductAssetCount = Object.entries(readiness.productAssetCounts).reduce(
      (count, [productId, assetCount]) =>
        selectedProductIds.has(productId) ? count + assetCount : count,
      0,
    );

    return {
      ...readiness,
      selectedProductAssetCount,
    };
  }, [activeVehicle, cart, workshopAssetReadinessByModel]);
  const selectedProductIds = useMemo(
    () => cart.map((item) => item.product.id),
    [cart],
  );
  const activeWorkshopAssets = useMemo(() => {
    if (!activeVehicle) {
      return [];
    }

    return workshopAssetsByModel?.[activeVehicle.id] ?? [];
  }, [activeVehicle, workshopAssetsByModel]);
  const defaultWorkshopCameraView = useMemo(
    () => getDefaultWorkshopCameraView(activeWorkshopAssets),
    [activeWorkshopAssets],
  );
  const effectiveWorkshopCameraView = useMemo(() => {
    if (!selectedCameraView) {
      return defaultWorkshopCameraView;
    }

    return activeWorkshopAssets.some((asset) => asset.cameraView === selectedCameraView)
      ? selectedCameraView
      : defaultWorkshopCameraView;
  }, [activeWorkshopAssets, defaultWorkshopCameraView, selectedCameraView]);

  const activeWorkshopLayerSelection = useMemo(
    () =>
      buildWorkshopLayerSelection({
        assets: activeWorkshopAssets,
        selectedProductIds,
        cameraView: effectiveWorkshopCameraView,
      }),
    [activeWorkshopAssets, effectiveWorkshopCameraView, selectedProductIds],
  );
  const activeWorkshopRenderPlan = useMemo(
    () =>
      buildWorkshopRenderPlan({
        modelId: activeVehicle?.id ?? null,
        cameraView: activeWorkshopLayerSelection.cameraView,
        selectedProductIds: activeWorkshopLayerSelection.selectedProductIds,
        orderedLayers: activeWorkshopLayerSelection.orderedLayers,
        missingProductIds: activeWorkshopLayerSelection.missingProductIds,
      }),
    [activeVehicle?.id, activeWorkshopLayerSelection],
  );
  const activeWorkshopRenderDiagnostics = useMemo(
    () => buildWorkshopRenderDiagnostics(activeWorkshopRenderPlan),
    [activeWorkshopRenderPlan],
  );
  const workshopAssetCameraSummary = useMemo(() => {
    const cameraViews = activeWorkshopLayerSelection.availableCameraViews;

    if (cameraViews.length === 0) {
      return "Görünüm bekleniyor";
    }

    const visibleViews = cameraViews.slice(0, 2).join(", ");
    const remainingCount = cameraViews.length - 2;

    return remainingCount > 0 ? `${visibleViews} +${remainingCount}` : visibleViews;
  }, [activeWorkshopLayerSelection.availableCameraViews]);
  const totalBudget = cart.reduce(
    (sum, item) => sum + Number(item.product.basePrice || 0) * item.quantity,
    0,
  );
  const resolvedOpenCategoryId =
    groupedProducts.some((category) => category.id === openCategoryId)
      ? openCategoryId
      : groupedProducts[0]?.id ?? null;
  const activeVehicleGroup =
    vehicleGroups.find((group) => group.id === activeVehicleGroupId) ?? vehicleGroups[0] ?? null;
  const activeVehicleVariant = activeVehicle ? getModelVariantLabel(activeVehicle) : null;
  const recommendedLayouts = useMemo(() => {
    if (!activeVehicleVariant) {
      return projectLayoutTemplates;
    }

    return [...projectLayoutTemplates].sort((left, right) => {
      const leftSuitable = left.suitableFor.includes(activeVehicleVariant);
      const rightSuitable = right.suitableFor.includes(activeVehicleVariant);

      if (leftSuitable === rightSuitable) {
        return 0;
      }

      return leftSuitable ? -1 : 1;
    });
  }, [activeVehicleVariant]);
  const sceneLayers = useMemo(() => {
    if (!selectedLayout) {
      return [];
    }

    return getIsometricSceneLayers({
      layout: selectedLayout,
      modelSlug: activeVehicle?.slug ?? null,
      activeVisualLayers,
      activeMaterials,
    });
  }, [selectedLayout, activeVehicle?.slug, activeVisualLayers, activeMaterials]);
  const visibleSceneLayers = useMemo(
    () =>
      sceneLayers.filter(
        (layer) =>
          layer.visible &&
          ["bed", "kitchen", "storage", "bathroom", "seat", "table"].includes(layer.type),
      ),
    [sceneLayers],
  );

  const riskSummary = hasCriticalError
    ? {
        label: "BLOKE",
        className: "border-red-500/30 bg-red-500/10 text-red-300",
      }
    : normalizedAggregateAi?.severity === "warning"
      ? {
          label: "UYARI",
          className: "border-amber-500/30 bg-amber-500/10 text-amber-300",
        }
      : normalizedAggregateAi?.severity === "ready"
        ? {
            label: "HAZIR",
            className: "border-green-500/30 bg-green-500/10 text-green-300",
          }
        : {
            label: "BEKLEMEDE",
            className: "border-zinc-700 bg-zinc-900 text-zinc-300",
          };

  const handleSaveProject = async () => {
    if (!activeVehicle) {
      return;
    }

    setIsSaving(true);
    setSavedAiDecisionAggregate(null);
    setSavedAiDecisionProducts([]);
    setHasAiDecisionBundleError(false);

    const totalPrice = cart.reduce(
      (sum, item) => sum + Number(item.product.basePrice || 0) * item.quantity,
      0,
    );

    const result = await saveEngineeringBuild({
      vehicleId: activeVehicle.id,
      cart,
      stats,
      totalPrice,
    });

    if (result.success) {
      setSavedAiDecisionAggregate(result.aiDecisionBundle?.aggregate ?? null);
      setSavedAiDecisionProducts(result.aiDecisionBundle?.products ?? []);
      setHasAiDecisionBundleError(!result.aiDecisionBundle);
      setIsApproved(true);
      setIsSaving(false);

      setTimeout(() => {
        window.location.href = `/offer/${result.shortCode}`;
      }, 1800);

      return;
    }

    alert("Kayıt Hatası: " + result.error);
    setSavedAiDecisionAggregate(null);
    setSavedAiDecisionProducts([]);
    setHasAiDecisionBundleError(false);
    setIsSaving(false);
  };

  const resetBuildState = () => {
    setCart([]);
    setIsApproved(false);
    setIsSaving(false);
    setSavedAiDecisionAggregate(null);
    setSavedAiDecisionProducts([]);
    setHasAiDecisionBundleError(false);
    setActiveVisualLayers({});
    setActiveMaterials({
      furniture: null,
      floor: null,
      wall: null,
    });
    setActiveFocusTargetId(null);
    setFailedSceneAssets({});
    setIs3dFallbackActive(false);
  };

  return (
    <>
      <style jsx global>{`
        ::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        ::-webkit-scrollbar-track {
          background: #000;
        }
        ::-webkit-scrollbar-thumb {
          background: #27272a;
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #3f3f46;
        }
      `}</style>

      {!activeVehicle ? (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.07),transparent_28%),linear-gradient(180deg,#060606,#020202)] text-white px-5 py-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-6 flex items-end justify-between gap-6 border-b border-white/5 pb-4">
              <div className="max-w-3xl">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-[1rem] border border-white/8 bg-white/[0.03]">
                  <Hammer className="h-5.5 w-5.5 text-blue-400" />
                </div>
                <p className="text-[10px] font-medium tracking-[0.2em] text-zinc-500">
                  SKYVAN ATÖLYE
                </p>
                <h1 className="mt-2 text-[2rem] font-semibold tracking-[-0.04em] text-zinc-50 lg:text-[2.35rem]">
                  Araç Platformunu Seç
                </h1>
                <p className="mt-2 max-w-2xl text-[13px] leading-6 text-zinc-400">
                  Her model aynı premium atölye yüzeyine açılır. Grubu seçin, varyantı belirleyin
                  ve yapılandırma
                  hattını doğrudan başlatın.
                </p>
              </div>
              <div className="hidden shrink-0 items-end gap-4 lg:flex">
                <div className="text-right">
                  <p className="text-[10px] tracking-[0.18em] text-zinc-600">Hazır</p>
                  <p className="mt-1 text-lg font-medium tracking-tight text-zinc-200">
                    {availableModels.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              {vehicleGroups.map((group) => {
                const isActive = group.id === activeVehicleGroup?.id;

                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => setActiveVehicleGroupId(group.id)}
                    className={`rounded-full border px-3 py-2 text-left transition-all duration-200 ${
                      isActive
                        ? "border-blue-400/40 bg-blue-500/[0.12] text-zinc-50 shadow-[0_0_0_1px_rgba(96,165,250,0.18)]"
                        : "border-white/6 bg-white/[0.03] text-zinc-400 hover:border-white/12 hover:bg-white/[0.05] hover:text-zinc-200"
                    }`}
                  >
                    <span className="block text-[11px] font-medium tracking-[0.01em]">
                      {group.label}
                    </span>
                    <span className="mt-0.5 block text-[10px] text-zinc-500">
                      {group.models.length} varyant
                    </span>
                  </button>
                );
              })}
            </div>

            {activeVehicleGroup ? (
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] font-medium tracking-[0.18em] text-zinc-500">
                    {activeVehicleGroup.label}
                  </p>
                  <h2 className="mt-1 text-[1.45rem] font-semibold tracking-[-0.03em] text-zinc-100">
                    {activeVehicleGroup.detail}
                  </h2>
                </div>
                <p className="hidden text-[11px] text-zinc-500 lg:block">
                  Seçili grupta {activeVehicleGroup.models.length} uygun varyant var
                </p>
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {activeVehicleGroup?.models.map((model) => {
                const variantLabel = getModelVariantLabel(model);
                const seriesLabel = getModelSeriesLabel(model);

                return (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => {
                      resetBuildState();
                      setSelectedLayout(null);
                      setActiveVehicle(model);
                    }}
                    className="group relative overflow-hidden rounded-[1.2rem] border border-white/6 bg-[linear-gradient(180deg,rgba(24,24,27,0.78),rgba(10,10,10,0.96))] p-4 text-left transition-all duration-300 ease-out hover:-translate-y-[2px] hover:border-blue-400/40 hover:bg-[linear-gradient(180deg,rgba(28,28,32,0.88),rgba(10,10,10,0.98))] hover:shadow-[0_18px_45px_rgba(0,0,0,0.32)]"
                  >
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent opacity-60" />
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[9px] font-medium tracking-[0.12em] text-zinc-500">
                        {seriesLabel}
                      </p>
                      <h2 className="mt-1.5 truncate text-[1.35rem] font-semibold tracking-[-0.04em] text-zinc-50">
                        {variantLabel ?? getModelDisplayName(model)}
                      </h2>
                    </div>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/8 bg-white/[0.03] text-zinc-500 transition-all duration-300 group-hover:border-blue-400/40 group-hover:bg-blue-500/[0.08] group-hover:text-blue-300">
                      <ArrowLeft className="h-3.5 w-3.5 rotate-180 transition-transform duration-300 group-hover:translate-x-0.5" />
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-4 border-t border-white/6 pt-2.5">
                    <p className="min-w-0 truncate text-[12px] text-zinc-400">
                      <span className="font-medium text-zinc-100">
                        {Number(model.baseWeightKg || 0).toLocaleString("tr-TR")} KG
                      </span>
                      <span className="mx-2 text-zinc-700">•</span>
                      <span>
                        {(
                          Number(model.baseWeightKg || 0) +
                          Number(model.maxPayloadKg || 1400)
                        ).toLocaleString("tr-TR")}{" "}
                        KG limiti
                      </span>
                    </p>
                    <div className="flex shrink-0 items-center gap-1.5 text-[10px] font-medium tracking-[0.14em] text-zinc-500 transition-colors group-hover:text-zinc-200">
                      <span>Seç</span>
                      <ArrowLeft className="h-3.5 w-3.5 rotate-180 transition-transform duration-300 group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : !selectedLayout ? (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.06),transparent_28%),linear-gradient(180deg,#050505,#020202)] text-white px-5 py-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-6 flex items-start justify-between gap-4 border-b border-white/5 pb-4">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => {
                    resetBuildState();
                    setSelectedLayout(null);
                    setActiveVehicle(null);
                  }}
                  className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-[0.85rem] border border-white/6 bg-white/[0.03] transition-colors hover:border-white/10 hover:bg-white/[0.05]"
                >
                  <ArrowLeft className="h-3 w-3 text-zinc-300" />
                </button>

                <div>
                  <p className="text-[10px] font-medium tracking-[0.18em] text-zinc-500">
                    Proje Krokisi
                  </p>
                  <h1 className="mt-1 text-[1.9rem] font-semibold tracking-[-0.04em] text-zinc-50">
                    Yerleşim Planını Seç
                  </h1>
                  <p className="mt-2 max-w-2xl text-[13px] leading-6 text-zinc-400">
                    Seçili araç için başlangıç düzenini belirleyin. Krokiden sonra atölye
                    ekranına geçilecek.
                  </p>
                </div>
              </div>

              <div className="hidden min-w-[16rem] rounded-[1.15rem] border border-white/6 bg-white/[0.03] px-4 py-3 lg:block">
                  <p className="text-[9px] font-medium tracking-[0.18em] text-zinc-500">
                    Seçili Araç
                  </p>
                <p className="mt-1 text-[1rem] font-medium tracking-[-0.03em] text-zinc-100">
                  {getModelDisplayName(activeVehicle)}
                </p>
                <p className="mt-1 text-[11px] text-zinc-500">
                  {getModelPlatformLabel(activeVehicle)}
                </p>
              </div>
            </div>

            <div className="mb-4 rounded-[1.15rem] border border-white/6 bg-[linear-gradient(180deg,rgba(18,18,20,0.96),rgba(8,8,9,0.99))] px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[9px] font-medium tracking-[0.16em] text-zinc-500">
                    Araç Varyantı
                  </p>
                  <p className="mt-1 text-[1.1rem] font-medium tracking-[-0.03em] text-zinc-100">
                    {activeVehicleVariant ?? getModelDisplayName(activeVehicle)}
                  </p>
                </div>
                <p className="text-[11px] text-zinc-500">
                  Uygun planlar önce listelenir, diğer planlar yine seçilebilir.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {recommendedLayouts.map((layout) => {
                const isRecommended = activeVehicleVariant
                  ? layout.suitableFor.includes(activeVehicleVariant)
                  : false;

                return (
                  <button
                    key={layout.id}
                    type="button"
                    onClick={() => {
                      resetBuildState();
                      setSelectedLayout(layout);
                    }}
                    className={`group rounded-[1.3rem] border p-4 text-left transition-all duration-300 ${
                      isRecommended
                        ? "border-blue-400/25 bg-[linear-gradient(180deg,rgba(22,24,30,0.96),rgba(8,8,10,0.99))] shadow-[0_0_0_1px_rgba(96,165,250,0.08)] hover:border-blue-400/40"
                        : "border-white/6 bg-[linear-gradient(180deg,rgba(18,18,20,0.96),rgba(8,8,9,0.99))] hover:border-white/12"
                    }`}
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-[1.2rem] font-semibold tracking-[-0.03em] text-zinc-50">
                            {layout.name}
                          </h2>
                          {isRecommended ? (
                            <span className="rounded-full border border-blue-400/25 bg-blue-500/[0.08] px-2 py-0.5 text-[8px] font-medium tracking-[0.14em] text-blue-300">
                              Uygun
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-[12px] text-zinc-400">{layout.short}</p>
                      </div>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/8 bg-white/[0.03] text-zinc-500 transition-all duration-300 group-hover:border-blue-400/35 group-hover:bg-blue-500/[0.08] group-hover:text-blue-300">
                        <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
                      </div>
                    </div>

                    {renderLayoutSchematic(layout)}

                    <div className="mt-4">
                      <p className="text-[9px] font-medium tracking-[0.14em] text-zinc-500">
                        Uygun Araç Ölçüleri
                      </p>
                      <p className="mt-1 text-[12px] text-zinc-300">
                        {layout.suitableFor.join(" / ")}
                      </p>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {layout.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-white/6 bg-white/[0.03] px-2.5 py-1 text-[9px] font-medium tracking-[0.12em] text-zinc-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-white/6 pt-3">
                      <span className="text-[10px] font-medium tracking-[0.14em] text-zinc-500">
                        Bu krokiyle devam et
                      </span>
                      <span className="text-[10px] font-medium tracking-[0.14em] text-zinc-200">
                        Seç
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="h-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.04),transparent_24%),linear-gradient(180deg,#050505,#020202)] text-white font-sans">
          <div className="grid h-full grid-rows-[auto_1fr]">
            <header className="border-b border-white/5 bg-black/65 px-2 py-0.5 backdrop-blur-sm lg:px-2.5">
              <div className="flex h-7 items-center gap-1.5">
                <button
                  onClick={() => {
                    setSavedAiDecisionAggregate(null);
                    setSavedAiDecisionProducts([]);
                    setHasAiDecisionBundleError(false);
                    setSelectedLayout(null);
                  }}
                  className="flex h-6.5 w-6.5 items-center justify-center rounded-[0.7rem] border border-white/6 bg-white/[0.03] transition-colors hover:border-white/10 hover:bg-white/[0.05]"
                >
                  <ArrowLeft className="h-2.5 w-2.5 text-zinc-400" />
                </button>

                <div className="h-3 w-px bg-white/6" />

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Truck className="h-2.5 w-2.5 text-zinc-500" />
                    <span className="shrink-0 text-[7px] font-medium tracking-[0.12em] text-zinc-600">
                      Seçili Model
                    </span>
                    <div className="min-w-0 flex items-center gap-1.5">
                      <p className="truncate text-[10px] font-medium leading-tight tracking-[-0.02em] text-zinc-100">
                        {getModelDisplayName(activeVehicle)}
                      </p>
                      <span className="text-[9px] text-zinc-700">→</span>
                      <p className="truncate text-[9px] font-medium tracking-[-0.01em] text-zinc-300">
                        {selectedLayout.name}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </header>

            <main className="min-h-0 overflow-hidden p-2 pt-1 lg:p-2 lg:pt-1.5">
              <div className="grid h-full grid-cols-[340px_minmax(0,1fr)] gap-2">
                <aside className="min-h-0 overflow-hidden rounded-[1.1rem] border border-white/6 bg-[linear-gradient(180deg,rgba(20,20,23,0.97),rgba(8,8,9,0.995))]">
                  <div className="border-b border-white/6 px-3 py-2">
                    <h2 className="text-[10px] font-medium tracking-[0.18em] text-zinc-500">
                      Malzemeler
                    </h2>
                    <p className="mt-1 text-[11px] text-zinc-500">
                      Kategori bazlı ürün seçimi ve adet kontrolü.
                    </p>
                  </div>

                  <div className="h-[calc(100%-57px)] overflow-y-auto px-1.5 py-1.5 custom-scrollbar">
                    <div className="space-y-2 pb-1">
                      {groupedProducts.map((category) => (
                        <section
                          key={category.id}
                          className={`overflow-hidden rounded-[0.95rem] border transition-all ${
                            resolvedOpenCategoryId === category.id
                              ? "border-white/10 bg-white/[0.03]"
                              : "border-white/5 bg-black/30"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => setOpenCategoryId(category.id)}
                            className="flex w-full items-center justify-between gap-3 px-2.5 py-2 text-left transition-colors hover:bg-white/[0.03]"
                            aria-expanded={resolvedOpenCategoryId === category.id}
                          >
                            <span className="min-w-0 text-[10px] font-medium tracking-[0.14em] text-zinc-500">
                              {category.name}
                            </span>
                            <div className="flex items-center gap-2.5">
                              <span className="text-[10px] font-mono text-zinc-600">
                                {category.products.length}
                              </span>
                              <ChevronDown
                                className={`h-3.5 w-3.5 text-zinc-500 transition-transform ${
                                  resolvedOpenCategoryId === category.id ? "rotate-180" : ""
                                }`}
                              />
                            </div>
                          </button>

                          <div
                            className={`overflow-hidden border-t border-white/5 transition-all duration-200 ${
                              resolvedOpenCategoryId === category.id
                                ? "max-h-[1600px] opacity-100"
                                : "max-h-0 opacity-0"
                            }`}
                          >
                            <div className="space-y-1.5 p-1.5">
                              {category.products.map((product) => {
                                const quantity =
                                  cart.find((item) => item.product.id === product.id)?.quantity ||
                                  0;
                                const title =
                                  product.title || product.name || product.sku || "Donanım Kalemi";
                                const productAiDecision = shouldRenderSavedProductAiSignals
                                  ? savedAiDecisionProductsById.get(product.id)
                                  : undefined;
                                const productCardClass =
                                  productAiDecision?.status === "blocker"
                                    ? "border-red-500/35 bg-red-500/[0.05]"
                                    : productAiDecision?.status === "warning"
                                      ? "border-amber-400/25 bg-amber-500/[0.04]"
                                      : quantity > 0
                                        ? "border-blue-400/35 bg-blue-500/[0.07] shadow-[0_0_0_1px_rgba(96,165,250,0.08)]"
                                        : "border-white/5 bg-white/[0.018] hover:border-white/10 hover:bg-white/[0.035]";
                                const productAiSignalClass =
                                  productAiDecision?.status === "blocker"
                                    ? "bg-red-500"
                                    : productAiDecision?.status === "warning"
                                      ? "bg-amber-400"
                                      : productAiDecision?.status === "ready"
                                        ? "bg-green-400"
                                        : null;

                                return (
                                  <div
                                    key={product.id}
                                    className={`rounded-[0.95rem] border px-2.5 py-2 transition-all duration-200 ${productCardClass}`}
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="min-w-0 flex-1">
                                        <div className="text-[8px] font-medium tracking-[0.1em] text-zinc-600">
                                          {product.sku}
                                        </div>
                                        <div className="mt-1 flex items-center gap-1.5">
                                          <h3 className="truncate text-[12px] font-medium text-zinc-100">
                                            {title}
                                          </h3>
                                          {quantity > 0 ? (
                                            <span className="rounded-full border border-blue-400/25 bg-blue-500/[0.06] px-2 py-0.5 text-[8px] font-medium tracking-[0.14em] text-blue-300">
                                              Seçili
                                            </span>
                                          ) : null}
                                          {productAiDecision && productAiSignalClass ? (
                                            <span
                                              className={`inline-block h-2 w-2 shrink-0 rounded-full ${productAiSignalClass}`}
                                              title={productAiDecision.reason}
                                              aria-label={`${title} AI durumu: ${productAiDecision.status}`}
                                            />
                                          ) : null}
                                        </div>
                                      </div>

                                      {quantity > 0 ? (
                                        <div className="flex items-center gap-1 rounded-[0.8rem] border border-white/6 bg-black/38 p-1">
                                          <button
                                            onClick={() => handleRemoveItem(product.id)}
                                            className="flex h-7 w-7 items-center justify-center rounded-md border border-white/6 bg-white/[0.03] text-zinc-300 transition-colors hover:bg-white/[0.08] hover:text-white"
                                          >
                                            <Minus className="h-3.5 w-3.5" />
                                          </button>
                                          <span className="w-7 text-center text-[12px] font-mono font-bold text-zinc-100">
                                            {quantity}
                                          </span>
                                          <button
                                            onClick={() => handleAddItem(product)}
                                            className="flex h-7 w-7 items-center justify-center rounded-md border border-white/6 bg-white/[0.03] text-zinc-300 transition-colors hover:bg-white/[0.08] hover:text-white"
                                          >
                                            <Plus className="h-3.5 w-3.5" />
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() => handleAddItem(product)}
                                          className="rounded-[0.8rem] border border-white/6 bg-white/[0.03] px-3 py-1.5 text-[9px] font-medium tracking-[0.14em] text-zinc-200 transition-colors hover:bg-white/[0.08]"
                                        >
                                          Ekle
                                        </button>
                                      )}
                                    </div>

                                    <div className="mt-1.5 flex items-center gap-2 text-[8px] text-zinc-500">
                                      <span className="inline-flex items-center gap-1">
                                        <Box className="h-3 w-3 text-zinc-600" />
                                        {product.weightKg || 0} KG
                                      </span>
                                      <span className="inline-flex items-center gap-1">
                                        <Zap className="h-3 w-3 text-amber-500" />
                                        {Number(product.basePrice || 0).toLocaleString("tr-TR")} ₺
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </section>
                      ))}
                    </div>
                  </div>
                </aside>

                <section className="grid min-h-0 grid-rows-[1fr_176px] gap-2">
                  <section className="min-h-0 overflow-hidden rounded-[1.1rem] border border-white/6 bg-[linear-gradient(180deg,rgba(18,18,20,0.96),rgba(8,8,9,0.99))]">
                    <div className="flex h-full flex-col">
                      <div className="border-b border-white/6 px-4 py-1.5">
                        <h2 className="text-[10px] font-medium tracking-[0.18em] text-zinc-500">
                          Önizleme
                        </h2>
                      </div>

                      <div className="relative flex flex-1 overflow-hidden bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.14),transparent_28%),linear-gradient(180deg,#0c0c0e,#030303)]">
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:44px_44px]" />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_40%)]" />
                        <div className="absolute left-5 top-5 z-10 max-w-md rounded-[1.1rem] border border-white/8 bg-black/30 px-4 py-3 backdrop-blur-sm">
                          <p className="text-[9px] font-medium tracking-[0.18em] text-zinc-500">
                            Proje Krokisi
                          </p>
                          <p className="mt-1 text-[1.15rem] font-medium tracking-[-0.03em] text-zinc-100">
                            {selectedLayout.name}
                          </p>
                          <p className="mt-1 text-[11px] text-zinc-400">
                            {selectedLayout.short}
                          </p>
                        </div>
                        <div
                          className={`absolute right-5 top-5 z-10 rounded-full border px-3 py-1.5 text-[9px] font-medium tracking-[0.14em] backdrop-blur-sm ${
                            is3dFallbackActive
                              ? "border-amber-400/25 bg-amber-500/[0.08] text-amber-200"
                              : "border-blue-400/20 bg-blue-500/[0.08] text-blue-200"
                          }`}
                        >
                          {is3dFallbackActive ? "2.5D Fallback" : "3D Preview"}
                        </div>
                        <div className="absolute right-5 top-14 z-10 max-w-[24rem] rounded-[0.75rem] border border-white/8 bg-black/35 px-2.5 py-1.5 backdrop-blur-sm">
                          <div className="flex items-center gap-1.5 overflow-hidden">
                            <span className="shrink-0 text-[8px] font-medium tracking-[0.14em] text-blue-200">
                              Renderer sözleşmesi
                            </span>
                            <span className="min-w-0 truncate text-[8px] text-zinc-400">
                              {activeWorkshopRenderPlan.statusLabel}
                            </span>
                          </div>
                          <div className="mt-1 flex flex-wrap gap-1">
                            <span className="rounded-full border border-white/6 bg-white/[0.04] px-1.5 py-0.5 text-[7px] text-zinc-400">
                              Render katmanı: {activeWorkshopRenderPlan.imageLayerCount}
                            </span>
                            <span className="rounded-full border border-white/6 bg-white/[0.04] px-1.5 py-0.5 text-[7px] text-zinc-400">
                              Referans: {activeWorkshopRenderPlan.nonRenderableReferenceCount}
                            </span>
                            <span className="rounded-full border border-white/6 bg-white/[0.04] px-1.5 py-0.5 text-[7px] text-zinc-400">
                              Eksik ürün: {activeWorkshopRenderPlan.missingProductIds.length}
                            </span>
                            <span className="rounded-full border border-white/6 bg-white/[0.04] px-1.5 py-0.5 text-[7px] text-zinc-500">
                              Gerçek 2.5D çizim sonraki sprintte.
                            </span>
                          </div>
                          <details className="group mt-1">
                            <summary className="inline-flex cursor-pointer list-none items-center rounded-full border border-white/6 bg-white/[0.04] px-1.5 py-0.5 text-[7px] text-zinc-300 transition hover:text-white [&::-webkit-details-marker]:hidden">
                              Plan detayı
                            </summary>
                            <div className="mt-1.5 max-w-[24rem] rounded-[0.65rem] border border-white/8 bg-black/45 p-2 text-[7px] text-zinc-400 shadow-[0_14px_38px_rgba(0,0,0,0.28)]">
                              <div className="grid grid-cols-2 gap-1">
                                <span>Durum: {activeWorkshopRenderDiagnostics.statusLabel}</span>
                                <span>Model: {activeWorkshopRenderPlan.modelId ? "Seçili" : "Bekliyor"}</span>
                                <span>Kamera: {activeWorkshopRenderDiagnostics.cameraView}</span>
                                <span>
                                  Önizleme:{" "}
                                  {activeWorkshopRenderDiagnostics.canRenderPreviewLabel}
                                </span>
                                <span>
                                  Image katman:{" "}
                                  {activeWorkshopRenderDiagnostics.modeCounts["image-layer"]}
                                </span>
                                <span>
                                  GLB referans:{" "}
                                  {
                                    activeWorkshopRenderDiagnostics.modeCounts[
                                      "model3d-reference"
                                    ]
                                  }
                                </span>
                                <span>
                                  Video referans:{" "}
                                  {
                                    activeWorkshopRenderDiagnostics.modeCounts[
                                      "video-reference"
                                    ]
                                  }
                                </span>
                                <span>
                                  Link referans:{" "}
                                  {activeWorkshopRenderDiagnostics.modeCounts["link-reference"]}
                                </span>
                                <span>Katman: {activeWorkshopRenderDiagnostics.layerCount}</span>
                                <span>
                                  Eksik ürün:{" "}
                                  {activeWorkshopRenderDiagnostics.missingProductCount}
                                </span>
                              </div>
                              <p className="mt-1 truncate text-zinc-500">
                                {activeWorkshopRenderDiagnostics.note}
                              </p>
                              {activeWorkshopRenderDiagnostics.layerSummaries.length > 0 ? (
                                <div className="mt-1 space-y-0.5 border-t border-white/6 pt-1">
                                  {activeWorkshopRenderDiagnostics.layerSummaries.map(
                                    (layer) => (
                                      <div
                                        key={`${layer.zIndexLayer}:${layer.renderMode}:${layer.cameraView}`}
                                        className="flex items-center justify-between gap-2"
                                      >
                                        <span>Katman {layer.zIndexLayer}</span>
                                        <span className="truncate">{layer.renderModeLabel}</span>
                                        <span className="truncate">{layer.cameraView}</span>
                                      </div>
                                    ),
                                  )}
                                  {activeWorkshopRenderDiagnostics.extraLayerCount > 0 ? (
                                    <p className="text-zinc-500">
                                      +{activeWorkshopRenderDiagnostics.extraLayerCount} katman
                                      daha
                                    </p>
                                  ) : null}
                                </div>
                              ) : null}
                            </div>
                          </details>
                        </div>
                        <div className="absolute inset-x-5 bottom-5 z-10 flex flex-wrap gap-2">
                          {selectedLayout.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full border border-white/8 bg-black/30 px-2.5 py-1 text-[9px] font-medium tracking-[0.12em] text-zinc-300 backdrop-blur-sm"
                            >
                              {tag}
                            </span>
                          ))}
                          {visibleSceneLayers.map((layer) => (
                            <span
                              key={layer.id}
                              className="rounded-full border border-blue-400/20 bg-blue-500/[0.08] px-2.5 py-1 text-[9px] font-medium tracking-[0.12em] text-blue-200 backdrop-blur-sm"
                            >
                              {layer.label}
                            </span>
                          ))}
                        </div>
                        <div className="relative flex h-full w-full items-center justify-center px-4 py-5 lg:px-8">
                          {!is3dFallbackActive ? (
                            <ThreeDConfiguratorViewer
                              modelUrl={threeDModelUrl}
                              activeVisualLayers={activeVisualLayers}
                              activeMaterials={activeMaterials}
                              onModelLoadError={handle3DModelLoadError}
                              activeFocusTargetId={activeFocusTargetId}
                            />
                          ) : (
                            <div className="relative h-full w-full max-w-[62rem] [perspective:1800px]">
                              <div className="absolute inset-0 rounded-[2.2rem] border border-white/6 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))]" />

                              <div className="absolute inset-[4%_4%_11%_4%] [transform:rotateX(56deg)_rotateZ(-41deg)]">
                                {sceneLayers.map((layer) => {
                                  const shouldRenderAsset =
                                    layer.assetUrl && !failedSceneAssets[layer.id];

                                  return layer.visible ? (
                                    <div
                                      key={layer.id}
                                      className={`absolute ${layer.className}`}
                                      style={{
                                        left: `${layer.x}%`,
                                        top: `${layer.y}%`,
                                        width: `${layer.w}%`,
                                        height: `${layer.h}%`,
                                        zIndex: layer.z,
                                      }}
                                    >
                                      {shouldRenderAsset ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                          src={layer.assetUrl}
                                          alt=""
                                          className="pointer-events-none absolute inset-0 h-full w-full object-contain"
                                          onError={() =>
                                            setFailedSceneAssets((prev) => ({
                                              ...prev,
                                              [layer.id]: true,
                                            }))
                                          }
                                        />
                                      ) : null}

                                      {[
                                        "bed",
                                        "kitchen",
                                        "storage",
                                        "bathroom",
                                        "seat",
                                        "table",
                                      ].includes(layer.type) && (
                                        <span className="absolute left-[10%] top-[12%] text-[9px] text-white/80">
                                          {layer.label}
                                        </span>
                                      )}
                                    </div>
                                  ) : null;
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="overflow-hidden rounded-[1.1rem] border border-white/6 bg-[linear-gradient(180deg,rgba(18,18,20,0.96),rgba(8,8,9,0.99))]">
                    <div className="flex h-full flex-col">
                      {activeWorkshopAssetReadiness ? (
                        <div className="flex h-7 shrink-0 items-center gap-2 border-b border-blue-400/10 bg-blue-500/[0.035] px-4">
                          <span className="shrink-0 text-[8px] font-medium tracking-[0.16em] text-blue-200">
                            Görsel durum
                          </span>
                          <span className="min-w-0 flex-1 truncate text-[8px] text-zinc-400">
                            {activeWorkshopLayerSelection.readinessLabel}
                          </span>
                          <div className="flex shrink-0 items-center gap-1 overflow-hidden">
                            <span className="rounded-full border border-blue-300/15 bg-black/18 px-1.5 py-0.5 text-[7px] text-blue-100">
                              {activeWorkshopAssetReadiness.totalAssets} varlık
                            </span>
                            <span className="rounded-full border border-white/6 bg-black/18 px-1.5 py-0.5 text-[7px] text-zinc-400">
                              Katman: {activeWorkshopLayerSelection.selectedLayerCount}
                            </span>
                            <span className="rounded-full border border-white/6 bg-black/18 px-1.5 py-0.5 text-[7px] text-zinc-400">
                              Eksik: {activeWorkshopLayerSelection.missingProductIds.length}
                            </span>
                            <span className="max-w-[9rem] truncate rounded-full border border-white/6 bg-black/18 px-1.5 py-0.5 text-[7px] text-zinc-400">
                              Kamera:{" "}
                              {activeWorkshopLayerSelection.cameraView ||
                                workshopAssetCameraSummary}
                            </span>
                            <span className="rounded-full border border-white/6 bg-black/18 px-1.5 py-0.5 text-[7px] text-zinc-500">
                              2.5D sonraki sprint
                            </span>
                          </div>
                        </div>
                      ) : null}

                      <div className="flex min-h-0 flex-1 items-center justify-between gap-4 px-4">
                        <div className="min-w-0 flex-1">
                        <div className="mb-2 flex items-center gap-2">
                          <span className="text-[9px] font-medium tracking-[0.24em] text-zinc-500">
                            Özet
                          </span>
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[8px] font-medium tracking-[0.16em] ${
                              normalizedAggregateAi
                                ? normalizedAggregateAi.tone.badge
                                : "border-white/6 bg-white/[0.03] text-zinc-500"
                            }`}
                          >
                            YZ
                          </span>
                        </div>

                        <div className="flex h-[84px] items-center gap-4 overflow-hidden">
                          <div className="min-w-0">
                            <p className="text-[9px] font-medium tracking-[0.16em] text-zinc-500">
                              Kütle
                            </p>
                            <p className="mt-1 text-[1.28rem] font-medium tracking-[-0.035em] text-zinc-50">
                              {stats.weight.toLocaleString("tr-TR")}
                              <span className="ml-1 text-[10px] tracking-[0.16em] text-zinc-600">
                                KG
                              </span>
                            </p>
                          </div>

                          <div className="h-8 w-px bg-white/6" />

                          <div className="min-w-0">
                            <p className="text-[9px] font-medium tracking-[0.16em] text-zinc-500">
                              Güç
                            </p>
                            <p className="mt-1 text-[1.28rem] font-medium tracking-[-0.035em] text-zinc-50">
                              {visiblePowerW.toLocaleString("tr-TR")}
                              <span className="ml-1 text-[10px] tracking-[0.16em] text-zinc-600">
                                W
                              </span>
                            </p>
                          </div>

                          <div className="h-8 w-px bg-white/6" />

                          <div className="min-w-0">
                            <p className="text-[9px] font-medium tracking-[0.16em] text-zinc-500">
                              Kalan Yük
                            </p>
                            <p className="mt-1 text-[1.28rem] font-medium tracking-[-0.035em] text-zinc-50">
                              {payloadReserveKg.toLocaleString("tr-TR")}
                              <span className="ml-1 text-[10px] tracking-[0.16em] text-zinc-600">
                                KG
                              </span>
                            </p>
                          </div>

                          <div className="h-8 w-px bg-white/6" />

                          <div className="min-w-0">
                            <p className="text-[9px] font-medium tracking-[0.16em] text-zinc-500">
                              Risk
                            </p>
                            <p className="mt-1 text-[1.22rem] font-medium tracking-[-0.03em] text-zinc-50">
                              {riskSummary.label}
                            </p>
                          </div>
                        </div>
                      </div>

                        <div className="flex h-full w-[336px] shrink-0 flex-col items-end justify-between gap-2 border-l border-white/6 py-2 pl-4">
                          <div className="w-full">
                          <p className="text-[9px] font-medium tracking-[0.24em] text-zinc-500">
                            Bütçe
                          </p>
                          <div className="mt-1 flex items-end justify-between gap-3">
                            <p className="text-[1.62rem] font-medium tracking-[-0.04em] text-zinc-50">
                              {totalBudget.toLocaleString("tr-TR")}
                              <span className="ml-1 text-[11px] tracking-[0.16em] text-zinc-600">
                                ₺
                              </span>
                            </p>
                            <span className="rounded-full border border-white/6 bg-white/[0.03] px-2 py-1 text-[8px] font-medium tracking-[0.14em] text-zinc-500">
                              {cartSummary.totalQuantity} kalem
                            </span>
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-1">
                            <span className="rounded-[0.5rem] border border-white/6 bg-white/[0.03] px-2 py-0.5 text-[8px] font-medium text-zinc-400">
                              Görsel:{" "}
                              <strong className="font-medium text-zinc-100">
                                {cartSummary.visualQuantity}
                              </strong>
                            </span>
                            <span className="rounded-[0.5rem] border border-white/6 bg-white/[0.03] px-2 py-0.5 text-[8px] font-medium text-zinc-400">
                              Teknik:{" "}
                              <strong className="font-medium text-zinc-100">
                                {cartSummary.technicalQuantity}
                              </strong>
                            </span>
                            <span className="rounded-[0.5rem] border border-white/6 bg-white/[0.03] px-2 py-0.5 text-[8px] font-medium text-zinc-400">
                              Net Güç:{" "}
                              <strong className="font-medium text-zinc-100">
                                {cartSummary.netPowerWatts.toLocaleString("tr-TR")} W
                              </strong>
                            </span>
                            <span className="truncate rounded-[0.5rem] border border-white/6 bg-white/[0.03] px-2 py-0.5 text-[8px] font-medium text-zinc-400">
                              3D Etki:{" "}
                              <strong className="font-medium text-zinc-100">
                                {cartSummary.visualEffectSummary}
                              </strong>
                            </span>
                          </div>
                          {saveSuccessHint ? (
                            <p className="mt-1 text-[8px] leading-snug text-zinc-500">
                              {saveSuccessHint}
                            </p>
                          ) : null}
                        </div>

                        <div className="flex w-full justify-end">
                          <button
                            disabled={hasCriticalError || isSaving}
                            onClick={handleSaveProject}
                            className={`min-w-[164px] rounded-[0.82rem] border px-5 py-2.5 text-[11px] font-semibold transition-all duration-200 ${
                              hasCriticalError
                                ? "cursor-not-allowed border-red-900 bg-red-950/35 text-red-500"
                                : isApproved
                                  ? "border-green-400 bg-green-500 text-white shadow-[0_10px_28px_rgba(34,197,94,0.22)] hover:bg-green-400"
                                  : "border-blue-300/50 bg-zinc-50 text-black shadow-[0_12px_30px_rgba(255,255,255,0.16)] hover:bg-white hover:shadow-[0_14px_34px_rgba(255,255,255,0.22)]"
                            }`}
                          >
                            {hasCriticalError ? (
                              "Bloke"
                            ) : isSaving ? (
                              "İşleniyor"
                            ) : (
                              "Devam Et"
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                    </div>
                  </section>
                </section>
              </div>
            </main>
          </div>
        </div>
      )}
    </>
  );
}
