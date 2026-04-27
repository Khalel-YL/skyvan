#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const modelPath = path.resolve(process.cwd(), "public/models/skyvan/default-van.glb");

const matchGroups = [
  ["bed/yatak/mattress", ["bed", "yatak", "mattress"]],
  ["kitchen/mutfak/sink/counter", ["kitchen", "mutfak", "sink", "counter"]],
  ["storage/dolap/cabinet", ["storage", "dolap", "cabinet"]],
  ["bathroom/wc/shower", ["bathroom", "wc", "shower"]],
  ["seat/bench/chair", ["seat", "bench", "chair"]],
  ["table/desk", ["table", "desk"]],
];

function materialNames(material) {
  if (!material) {
    return "(none)";
  }

  const materials = Array.isArray(material) ? material : [material];
  return materials.map((item) => item.name || "(unnamed material)").join(", ");
}

function normalizeName(name) {
  return (name || "").toLowerCase();
}

function printReport(records, loaderName) {
  const meshes = records.filter((record) => record.isMesh);

  console.log(`Model: ${path.relative(process.cwd(), modelPath)}`);
  console.log(`Loader: ${loaderName}`);
  console.log(`Total mesh count: ${meshes.length}`);
  console.log("");
  console.log("Objects:");

  records.forEach((record, index) => {
    const meshLabel = record.isMesh ? "mesh" : "object";
    console.log(
      `${String(index + 1).padStart(3, " ")}. [${meshLabel}] name="${record.name}" type="${record.type}" material="${record.material}"`,
    );
  });

  console.log("");
  console.log("Possible matches:");

  matchGroups.forEach(([label, keywords]) => {
    const matches = meshes.filter((record) => {
      const searchable = normalizeName(`${record.name} ${record.material}`);
      return keywords.some((keyword) => searchable.includes(keyword));
    });

    console.log(`${label}: ${matches.length ? matches.map((record) => record.name).join(", ") : "(none)"}`);
  });
}

async function inspectWithThree() {
  if (typeof globalThis.self === "undefined") {
    globalThis.self = globalThis;
  }

  const [{ GLTFLoader }, buffer] = await Promise.all([
    import("three/examples/jsm/loaders/GLTFLoader.js"),
    readFile(modelPath),
  ]);

  if (typeof globalThis.ProgressEvent === "undefined") {
    globalThis.ProgressEvent = class ProgressEvent extends Event {};
  }

  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  const loader = new GLTFLoader();
  const gltf = await new Promise((resolve, reject) => {
    loader.parse(arrayBuffer, `${path.dirname(modelPath)}${path.sep}`, resolve, reject);
  });

  const records = [];

  gltf.scene.traverse((object) => {
    records.push({
      name: object.name || "(unnamed)",
      type: object.type || "(unknown)",
      isMesh: Boolean(object.isMesh),
      material: object.isMesh ? materialNames(object.material) : "(none)",
    });
  });

  return records;
}

async function inspectWithGltfTransform() {
  const { NodeIO } = await import("@gltf-transform/core");
  const io = new NodeIO();
  const document = await io.read(modelPath);
  const root = document.getRoot();

  return root.listNodes().map((node) => {
    const mesh = node.getMesh();
    const materials = mesh
      ? mesh
          .listPrimitives()
          .map((primitive) => primitive.getMaterial()?.getName() || "(unnamed material)")
          .join(", ")
      : "(none)";

    return {
      name: node.getName() || "(unnamed)",
      type: mesh ? "Mesh" : "Node",
      isMesh: Boolean(mesh),
      material: materials || "(none)",
    };
  });
}

try {
  const records = await inspectWithThree();
  printReport(records, "three GLTFLoader");
} catch (threeError) {
  try {
    const records = await inspectWithGltfTransform();
    printReport(records, "@gltf-transform/core");
  } catch (gltfTransformError) {
    console.error(`Could not inspect ${path.relative(process.cwd(), modelPath)}.`);
    console.error("");
    console.error("three GLTFLoader error:");
    console.error(threeError instanceof Error ? threeError.message : threeError);
    console.error("");
    console.error("@gltf-transform/core fallback error:");
    console.error(gltfTransformError instanceof Error ? gltfTransformError.message : gltfTransformError);
    console.error("");
    console.error("No packages were installed. Install or approve a GLB parser package to inspect this model.");
    process.exitCode = 1;
  }
}
