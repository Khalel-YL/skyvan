"use client";

import {
  Component,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import {
  Box3,
  Color,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Vector3,
  type Material,
} from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

import { focusTargets, type FocusTargetId } from "./focusTargets";
import { getMeshLayerFromName } from "./meshMap";
import { activeModelPreset } from "./modelPreset";

type ThreeDConfiguratorViewerProps = {
  modelUrl: string;
  activeVisualLayers: Record<string, boolean>;
  activeMaterials: {
    furniture: string | null;
    floor: string | null;
    wall: string | null;
  };
  onModelLoadError?: () => void;
  activeFocusTargetId?: FocusTargetId | null;
};

type ModelErrorBoundaryProps = {
  children: ReactNode;
  onModelLoadError?: () => void;
};

class ModelErrorBoundary extends Component<ModelErrorBoundaryProps, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    this.props.onModelLoadError?.();
  }

  render() {
    if (this.state.hasError) {
      return null;
    }

    return this.props.children;
  }
}

function cloneMaterial(material: Material | Material[]) {
  if (Array.isArray(material)) {
    return material.map((item) => item.clone());
  }

  return material.clone();
}

function applyMaterialTone(mesh: Mesh, activeMaterials: ThreeDConfiguratorViewerProps["activeMaterials"]) {
  const meshLayer = getMeshLayerFromName(mesh.name);

  const materialList = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

  materialList.forEach((material) => {
    if (!(material instanceof MeshStandardMaterial)) {
      return;
    }

    if (
      activeMaterials.furniture === "wood_oak" &&
      (meshLayer === "bed" ||
        meshLayer === "kitchen" ||
        meshLayer === "storage" ||
        meshLayer === "seat" ||
        meshLayer === "table")
    ) {
      material.color = new Color("#9a6b43");
      material.roughness = 0.72;
      material.metalness = 0.05;
    }

    if (activeMaterials.floor === "graphite_floor" && meshLayer === null) {
      const name = mesh.name.toLowerCase();
      if (name.includes("floor") || name.includes("zemin")) {
        material.color = new Color("#4a4038");
        material.roughness = 0.82;
        material.metalness = 0.02;
      }
    }

    if (activeMaterials.wall === "soft_wall") {
      const name = mesh.name.toLowerCase();
      if (name.includes("wall") || name.includes("duvar")) {
        material.color = new Color("#c8c4bc");
        material.roughness = 0.76;
        material.metalness = 0.02;
      }
    }
  });
}

function shouldMeshBeVisible(meshName: string, activeVisualLayers: Record<string, boolean>) {
  const meshLayer = getMeshLayerFromName(meshName);

  if (!meshLayer) {
    return true;
  }

  return Boolean(activeVisualLayers[meshLayer]);
}

function applyActiveLayerHighlight(mesh: Mesh, activeVisualLayers: Record<string, boolean>) {
  const meshLayer = getMeshLayerFromName(mesh.name);

  if (!meshLayer || !activeVisualLayers[meshLayer]) {
    return;
  }

  mesh.material = cloneMaterial(mesh.material);

  const materialList = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

  materialList.forEach((material) => {
    if (material instanceof MeshStandardMaterial) {
      material.color.set("#4ade80");
    }
  });
}

function VanModel({
  modelUrl,
  activeVisualLayers,
  activeMaterials,
  activeFocusTargetId,
}: ThreeDConfiguratorViewerProps) {
  const gltf = useGLTF(modelUrl);
  const effectiveActiveVisualLayers = useMemo(
    () => ({
      ...activeVisualLayers,
      ...(activeFocusTargetId ? { [focusTargets[activeFocusTargetId].layer]: true } : {}),
    }),
    [activeVisualLayers, activeFocusTargetId],
  );

  const clonedScene = useMemo(() => {
    const scene = gltf.scene.clone(true);

    scene.traverse((child: Object3D) => {
      if (child instanceof Mesh) {
        child.material = cloneMaterial(child.material);
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    const box = new Box3().setFromObject(scene);
    const center = new Vector3();
    const size = new Vector3();

    box.getCenter(center);
    box.getSize(size);
    scene.position.sub(center);

    return scene;
  }, [gltf.scene]);

  useEffect(() => {
    clonedScene.traverse((child: Object3D) => {
      if (!(child instanceof Mesh)) {
        return;
      }

      child.visible = shouldMeshBeVisible(child.name, effectiveActiveVisualLayers);
      applyMaterialTone(child, activeMaterials);
      applyActiveLayerHighlight(child, effectiveActiveVisualLayers);
    });
  }, [clonedScene, effectiveActiveVisualLayers, activeMaterials]);

  return (
    <group
      position={activeModelPreset.position}
      rotation={activeModelPreset.rotation}
      scale={activeModelPreset.scale}
    >
      {/* Future production rule:
          GLB mesh names should include semantic names like bed, kitchen, storage, bathroom, seat, table.
          Current keyword matching is a safe foundation and does not crash on unknown mesh names. */}
      <primitive object={clonedScene} />
    </group>
  );
}

export default function ThreeDConfiguratorViewer({
  modelUrl,
  activeVisualLayers,
  activeMaterials,
  onModelLoadError,
  activeFocusTargetId,
}: ThreeDConfiguratorViewerProps) {
  const [modelStatus, setModelStatus] = useState<"checking" | "ready" | "failed">("checking");
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  const resetView = () => {
    const controls = controlsRef.current;
    const camera = controls?.object as
      | (OrbitControlsImpl["object"] & { updateProjectionMatrix?: () => void })
      | undefined;

    camera?.position.set(...activeModelPreset.camera.position);
    camera?.lookAt(...activeModelPreset.controls.target);
    camera?.updateProjectionMatrix?.();
    controls?.target.set(...activeModelPreset.controls.target);
    controls?.update();
  };

  useEffect(() => {
    let isMounted = true;

    queueMicrotask(() => {
      if (isMounted) {
        setModelStatus("checking");
      }
    });

    fetch(modelUrl, { method: "HEAD" })
      .then((response) => {
        if (!isMounted) {
          return;
        }

        if (response.ok) {
          setModelStatus("ready");
          return;
        }

        setModelStatus("failed");
        onModelLoadError?.();
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setModelStatus("failed");
        onModelLoadError?.();
      });

    return () => {
      isMounted = false;
    };
  }, [modelUrl, onModelLoadError]);

  if (modelStatus === "failed") {
    return null;
  }

  return (
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.13),transparent_34%),linear-gradient(180deg,#0b0b0d,#020203)]">
      {modelStatus === "ready" ? (
        <Canvas
          shadows
          camera={{
            position: activeModelPreset.camera.position,
            fov: activeModelPreset.camera.fov,
          }}
          dpr={[1, 1.75]}
          gl={{
            antialias: true,
            alpha: true,
          }}
        >
          <color attach="background" args={["#050507"]} />
          <ambientLight intensity={0.7} />
          <hemisphereLight args={["#dbeafe", "#111113", 1.25]} />
          <directionalLight position={[5, 6, 4]} intensity={2.15} castShadow />
          <directionalLight position={[-4, 2, -3]} intensity={0.7} />

          <Suspense fallback={null}>
            <ModelErrorBoundary onModelLoadError={onModelLoadError}>
              <VanModel
                modelUrl={modelUrl}
                activeVisualLayers={activeVisualLayers}
                activeMaterials={activeMaterials}
                activeFocusTargetId={activeFocusTargetId}
              />
            </ModelErrorBoundary>
          </Suspense>

          <OrbitControls
            ref={controlsRef}
            enableDamping
            dampingFactor={0.08}
            enableRotate
            enablePan
            enableZoom
            screenSpacePanning={false}
            rotateSpeed={0.65}
            zoomSpeed={0.8}
            panSpeed={0.65}
            minDistance={activeModelPreset.controls.minDistance}
            maxDistance={activeModelPreset.controls.maxDistance}
            maxPolarAngle={activeModelPreset.controls.maxPolarAngle}
            target={activeModelPreset.controls.target}
          />
        </Canvas>
      ) : null}

      {modelStatus === "ready" ? (
        <div className="absolute bottom-5 right-5 z-20 rounded-2xl border border-white/10 bg-black/45 p-1.5 text-[11px] font-medium text-zinc-100 shadow-[0_16px_50px_rgba(0,0,0,0.32)] backdrop-blur-md">
          <button
            type="button"
            onClick={resetView}
            className="h-8 rounded-full border border-white/10 bg-white/[0.06] px-3 text-zinc-300 transition-colors hover:bg-white/[0.12] hover:text-white"
          >
            Reset View
          </button>
        </div>
      ) : null}
    </div>
  );
}
