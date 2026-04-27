export type ModelPreset = {
  rotation: [number, number, number];
  scale: number;
  position: [number, number, number];
  camera: {
    position: [number, number, number];
    fov: number;
  };
  controls: {
    target: [number, number, number];
    minDistance: number;
    maxDistance: number;
    maxPolarAngle: number;
  };
};

export const defaultModelPreset: ModelPreset = {
  rotation: [0, 0, 0],
  scale: 1.45,
  position: [0, 0, 0],
  camera: {
    position: [4.5, 2.6, 5.5],
    fov: 32,
  },
  controls: {
    target: [0, 0, 0],
    minDistance: 1.2,
    maxDistance: 20,
    maxPolarAngle: Math.PI / 2.1,
  },
};

export const sprinterCrafterPre2017LwbPreset: ModelPreset = {
  // Tunable preset for DESIGN 4 SPRINTER / CRAFTER PRE 2017 LWB VAN.
  // Adjust only these values when correcting this model orientation.
  rotation: [-0.29, 0.26, 0.01],
  scale: 1.35,
  position: [0, 0, 0],
  camera: {
    position: [4.5, 2.6, 5.5],
    fov: 32,
  },
  controls: {
    target: [0, 0, 0],
    minDistance: 0.8,
    maxDistance: 22,
    maxPolarAngle: Math.PI / 2.05,
  },
};

export const activeModelPreset = sprinterCrafterPre2017LwbPreset;
