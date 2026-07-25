import "server-only";

import { randomInt, randomUUID } from "node:crypto";

import { and, eq, inArray, sql } from "drizzle-orm";

import { runDatabaseTransaction, type TransactionClient } from "@/db/db";
import {
  builds,
  buildSelectedProducts,
  buildVersions,
  models,
  packages,
  products,
} from "@/db/schema";

import type { ParsedWorkshopBuildInput } from "./validation";

type WorkshopBuildProductRow = {
  id: string;
  status: "draft" | "active" | "archived";
  workshopVisibility: string;
  basePrice: string;
  weightKg: string;
};

type WorkshopBuildModelRow = {
  id: string;
  status: "draft" | "active" | "archived";
  baseWeightKg: string;
};

type PersistedWorkshopBuild = {
  buildId: string;
  versionId: string;
  shortCode: string;
  selectedProductIds: string[];
};

type WorkshopBuildStateSnapshot = {
  weight: number;
  baseWeightKg: number;
  selectedProductsWeightKg: number;
  selectedProductCount: number;
  totalQuantity: number;
};

export class PublicWorkshopBuildMutationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PublicWorkshopBuildMutationError";
  }
}

const CUSTOM_ENGINEERING_PACKAGE_SLUG = "custom-engineering";
const SHORT_CODE_ATTEMPTS = 8;

async function acquireMutationLock(tx: TransactionClient, lockKey: string) {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${lockKey}))`);
}

function createPublicShortCode() {
  return `SV-${randomInt(100000, 1000000)}`;
}

function parseDecimalToScaledInteger(value: string | number | null, scale: number) {
  const normalized = String(value ?? "0").trim();

  if (!normalized) {
    return null;
  }

  const sign = normalized.startsWith("-") ? -1 : 1;
  const unsigned = normalized.startsWith("-") || normalized.startsWith("+")
    ? normalized.slice(1)
    : normalized;
  const [integerPart, fractionalPart = "", ...rest] = unsigned.split(".");

  if (rest.length > 0 || !integerPart || fractionalPart.length > scale) {
    return null;
  }

  const isDigits = (part: string) => {
    for (const character of part) {
      const code = character.charCodeAt(0);

      if (code < 48 || code > 57) {
        return false;
      }
    }

    return true;
  };

  if (!isDigits(integerPart) || (fractionalPart && !isDigits(fractionalPart))) {
    return null;
  }

  const paddedFraction = fractionalPart.padEnd(scale, "0");
  const scaled = Number(`${integerPart}${paddedFraction}`);

  if (!Number.isSafeInteger(scaled)) {
    return null;
  }

  return scaled * sign;
}

function formatScaledInteger(value: number, scale: number) {
  const sign = value < 0 ? "-" : "";
  const absolute = Math.abs(value);
  const integerPart = Math.floor(absolute / 10 ** scale);
  const fractionalPart = String(absolute % 10 ** scale).padStart(scale, "0");

  return `${sign}${integerPart}.${fractionalPart}`;
}

async function assertActiveModel(tx: TransactionClient, modelId: string) {
  const modelRows = await tx
    .select({
      id: models.id,
      status: models.status,
      baseWeightKg: models.baseWeightKg,
    })
    .from(models)
    .where(eq(models.id, modelId))
    .limit(1);

  const model = (modelRows[0] as WorkshopBuildModelRow | undefined) ?? null;

  if (!model || model.status !== "active") {
    throw new PublicWorkshopBuildMutationError(
      "Seçilen araç modeli şu anda Workshop kaydı için uygun değil.",
    );
  }

  return model;
}

async function assertCustomEngineeringPackage(
  tx: TransactionClient,
  modelId: string,
) {
  const packageRows = await tx
    .select({ id: packages.id })
    .from(packages)
    .where(
      and(
        eq(packages.modelId, modelId),
        eq(packages.slug, CUSTOM_ENGINEERING_PACKAGE_SLUG),
      ),
    )
    .limit(2);

  if (packageRows.length === 0) {
    throw new PublicWorkshopBuildMutationError(
      "Bu araç modeli için özel tasarım paketi henüz hazırlanmadı.",
    );
  }

  if (packageRows.length > 1) {
    throw new PublicWorkshopBuildMutationError(
      "Workshop paket yapılandırması doğrulanamadı.",
    );
  }

  return packageRows[0];
}

async function assertEligibleProducts(
  tx: TransactionClient,
  input: ParsedWorkshopBuildInput,
) {
  if (input.productIds.length === 0) {
    return [] satisfies WorkshopBuildProductRow[];
  }

  const productRows = (await tx
    .select({
      id: products.id,
      status: products.status,
      workshopVisibility: products.workshopVisibility,
      basePrice: products.basePrice,
      weightKg: products.weightKg,
    })
    .from(products)
    .where(inArray(products.id, input.productIds))) as WorkshopBuildProductRow[];

  if (productRows.length !== input.productIds.length) {
    throw new PublicWorkshopBuildMutationError(
      "Seçili ürünlerden biri Workshop kaydı için uygun değil.",
    );
  }

  const hasIneligibleProduct = productRows.some(
    (product) =>
      product.status !== "active" || product.workshopVisibility === "ai_package_only",
  );

  if (hasIneligibleProduct) {
    throw new PublicWorkshopBuildMutationError(
      "Seçili ürünlerden biri Workshop kaydı için uygun değil.",
    );
  }

  return productRows;
}

function computeTotals(input: {
  model: WorkshopBuildModelRow;
  products: WorkshopBuildProductRow[];
  cart: ParsedWorkshopBuildInput["cart"];
}) {
  const baseWeightGrams = parseDecimalToScaledInteger(input.model.baseWeightKg, 3);

  if (baseWeightGrams === null) {
    throw new PublicWorkshopBuildMutationError(
      "Araç modeli ağırlık bilgisi doğrulanamadı.",
    );
  }

  const productsById = new Map(input.products.map((product) => [product.id, product]));
  let selectedProductsWeightGrams = 0;
  let totalPriceCents = 0;
  let totalQuantity = 0;

  for (const item of input.cart) {
    const product = productsById.get(item.productId);

    if (!product) {
      throw new PublicWorkshopBuildMutationError(
        "Seçili ürünlerden biri Workshop kaydı için uygun değil.",
      );
    }

    const productWeightGrams = parseDecimalToScaledInteger(product.weightKg, 3);
    const productPriceCents = parseDecimalToScaledInteger(product.basePrice, 2);

    if (productWeightGrams === null || productPriceCents === null) {
      throw new PublicWorkshopBuildMutationError(
        "Seçili ürünlerden biri fiyat veya ağırlık açısından doğrulanamadı.",
      );
    }

    selectedProductsWeightGrams += productWeightGrams * item.quantity;
    totalPriceCents += productPriceCents * item.quantity;
    totalQuantity += item.quantity;
  }

  const totalWeightGrams = baseWeightGrams + selectedProductsWeightGrams;
  const totalWeightKg = formatScaledInteger(totalWeightGrams, 3);
  const totalPrice = formatScaledInteger(totalPriceCents, 2);

  return {
    totalWeightKg,
    totalPrice,
    stateSnapshot: {
      weight: Number(totalWeightKg),
      baseWeightKg: Number(formatScaledInteger(baseWeightGrams, 3)),
      selectedProductsWeightKg: Number(
        formatScaledInteger(selectedProductsWeightGrams, 3),
      ),
      selectedProductCount: input.cart.length,
      totalQuantity,
    } satisfies WorkshopBuildStateSnapshot,
  };
}

async function createBuildWithShortCode(
  tx: TransactionClient,
  modelId: string,
) {
  for (let attempt = 0; attempt < SHORT_CODE_ATTEMPTS; attempt += 1) {
    const shortCode = createPublicShortCode();

    await acquireMutationLock(tx, `build-short-code:${shortCode}`);

    const existingBuildRows = await tx
      .select({ id: builds.id })
      .from(builds)
      .where(eq(builds.shortCode, shortCode))
      .limit(1);

    if (existingBuildRows[0]) {
      continue;
    }

    const insertedBuildRows = await tx
      .insert(builds)
      .values({
        shortCode,
        userId: null,
        sessionId: randomUUID(),
        modelId,
        currentVersionId: null,
        updatedAt: new Date(),
      })
      .returning({
        id: builds.id,
        shortCode: builds.shortCode,
      });

    const insertedBuild = insertedBuildRows[0] ?? null;

    if (insertedBuild) {
      return insertedBuild;
    }
  }

  throw new PublicWorkshopBuildMutationError(
    "Workshop proje referansı üretilemedi. Lütfen tekrar deneyin.",
  );
}

export async function persistPublicWorkshopBuild(
  input: ParsedWorkshopBuildInput,
): Promise<PersistedWorkshopBuild> {
  return runDatabaseTransaction(async (tx) => {
    const model = await assertActiveModel(tx, input.vehicleId);
    const customPackage = await assertCustomEngineeringPackage(tx, input.vehicleId);
    const productRows = await assertEligibleProducts(tx, input);
    const computed = computeTotals({
      model,
      products: productRows,
      cart: input.cart,
    });
    const newBuild = await createBuildWithShortCode(tx, input.vehicleId);

    await acquireMutationLock(tx, `build-version:${newBuild.id}`);

    const insertedVersionRows = await tx
      .insert(buildVersions)
      .values({
        buildId: newBuild.id,
        packageId: customPackage.id,
        versionNumber: 1,
        totalWeightKg: computed.totalWeightKg,
        totalPrice: computed.totalPrice,
        stateSnapshot: computed.stateSnapshot,
      })
      .returning({
        id: buildVersions.id,
      });

    const insertedVersion = insertedVersionRows[0] ?? null;

    if (!insertedVersion) {
      throw new PublicWorkshopBuildMutationError(
        "Workshop proje sürümü oluşturulamadı.",
      );
    }

    const updatedBuildRows = await tx
      .update(builds)
      .set({
        currentVersionId: insertedVersion.id,
        updatedAt: new Date(),
      })
      .where(eq(builds.id, newBuild.id))
      .returning({ id: builds.id });

    if (!updatedBuildRows[0]) {
      throw new PublicWorkshopBuildMutationError(
        "Workshop proje sürümü bağlanamadı.",
      );
    }

    if (input.cart.length > 0) {
      await tx.insert(buildSelectedProducts).values(
        input.cart.map((item) => ({
          buildVersionId: insertedVersion.id,
          productId: item.productId,
          quantity: item.quantity,
        })),
      );
    }

    return {
      buildId: newBuild.id,
      versionId: insertedVersion.id,
      shortCode: newBuild.shortCode,
      selectedProductIds: input.productIds,
    };
  });
}
