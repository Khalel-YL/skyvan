export type VisualMeshLayer = "bed" | "kitchen" | "storage" | "bathroom" | "seat" | "table";

export const meshMap: Record<VisualMeshLayer, string[]> = {
  bed: ["bed", "yatak", "mattress", "bed_base", "foam", "cushion", "sleep", "bunk", "rear_bed", "bench_bed"],
  kitchen: ["kitchen", "mutfak", "hob", "oven", "sink", "tap", "faucet", "worktop", "counter", "countertop", "stove", "cooker"],
  storage: ["storage", "depolama", "dolap", "drawer", "locker", "cabinet", "cupboard", "shelf", "shelves", "wardrobe", "overhead", "unit"],
  bathroom: ["bathroom", "banyo", "shower", "shower tray", "wc", "toilet", "dus", "duş"],
  seat: ["seat", "koltuk", "seat_base", "seat_bench", "bench", "chair"],
  table: ["table", "masa", "desk", "dinette", "top", "folding_table"],
};

export function getMeshLayerFromName(meshName: string): VisualMeshLayer | null {
  const normalizedName = meshName.toLowerCase();

  for (const [layer, keywords] of Object.entries(meshMap) as [VisualMeshLayer, string[]][]) {
    if (keywords.some((keyword) => normalizedName.includes(keyword))) {
      return layer;
    }
  }

  return null;
}
