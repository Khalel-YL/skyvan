import { and, eq, ne, sql } from "drizzle-orm";

import {
  type StrictAuditActor,
  writeStrictAuditLogInTransaction,
} from "@/app/lib/admin/audit";
import { runDatabaseTransaction, type TransactionClient } from "@/db/db";
import { hotspotMappings, models, products, visualAssets2d } from "@/db/schema";

import type { WorkshopAssetFieldName } from "./types";
import type { ParsedWorkshopAssetInput } from "./validation";

type WorkshopAssetAuditState = {
  id: string;
  productId: string;
  modelId: string;
  cameraView: string;
  zIndexLayer: number;
  assetUrl: string;
  fallbackUrl: string | null;
};

type WorkshopAssetMutationMode = "created" | "updated";

export class WorkshopAssetMutationError extends Error {
  constructor(
    message: string,
    public readonly code = "workshop-asset-failed",
    public readonly fieldErrors: Partial<Record<WorkshopAssetFieldName, string>> = {},
  ) {
    super(message);
    this.name = "WorkshopAssetMutationError";
  }
}

export class WorkshopAssetNoopMutation extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorkshopAssetNoopMutation";
  }
}

const workshopAssetReturningFields = {
  id: visualAssets2d.id,
  productId: visualAssets2d.productId,
  modelId: visualAssets2d.modelId,
  cameraView: visualAssets2d.cameraView,
  zIndexLayer: visualAssets2d.zIndexLayer,
  assetUrl: visualAssets2d.assetUrl,
  fallbackUrl: visualAssets2d.fallbackUrl,
};

function toWorkshopAssetAuditState(
  row: WorkshopAssetAuditState,
): WorkshopAssetAuditState {
  return {
    id: row.id,
    productId: row.productId,
    modelId: row.modelId,
    cameraView: row.cameraView,
    zIndexLayer: row.zIndexLayer,
    assetUrl: row.assetUrl,
    fallbackUrl: row.fallbackUrl,
  };
}

function hasWorkshopAssetChanged(
  previous: WorkshopAssetAuditState,
  next: WorkshopAssetAuditState,
) {
  return (
    previous.productId !== next.productId ||
    previous.modelId !== next.modelId ||
    previous.cameraView !== next.cameraView ||
    previous.zIndexLayer !== next.zIndexLayer ||
    previous.assetUrl !== next.assetUrl ||
    previous.fallbackUrl !== next.fallbackUrl
  );
}

async function acquireMutationLock(tx: TransactionClient, lockKey: string) {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${lockKey}))`);
}

function getSlotLockKey(input: {
  productId: string;
  modelId: string;
  cameraView: string;
  zIndexLayer: number;
}) {
  return [
    "workshop-asset-slot",
    input.productId,
    input.modelId,
    input.cameraView,
    input.zIndexLayer,
  ].join(":");
}

async function acquireSlotLocks(tx: TransactionClient, lockKeys: string[]) {
  const uniqueSortedKeys = Array.from(new Set(lockKeys)).sort((left, right) =>
    left.localeCompare(right),
  );

  for (const lockKey of uniqueSortedKeys) {
    await acquireMutationLock(tx, lockKey);
  }
}

async function findWorkshopAssetById(
  tx: TransactionClient,
  id: string,
): Promise<WorkshopAssetAuditState | null> {
  const rows = await tx
    .select(workshopAssetReturningFields)
    .from(visualAssets2d)
    .where(eq(visualAssets2d.id, id))
    .limit(1);

  return rows[0] ? toWorkshopAssetAuditState(rows[0]) : null;
}

async function assertProductExists(tx: TransactionClient, productId: string) {
  const rows = await tx
    .select({ id: products.id })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  if (!rows[0]) {
    throw new WorkshopAssetMutationError(
      "Seçilen ürün kaydı bulunamadı.",
      "product-not-found",
      { productId: "Seçilen ürün kaydı bulunamadı." },
    );
  }
}

async function assertModelExists(tx: TransactionClient, modelId: string) {
  const rows = await tx
    .select({ id: models.id })
    .from(models)
    .where(eq(models.id, modelId))
    .limit(1);

  if (!rows[0]) {
    throw new WorkshopAssetMutationError(
      "Seçilen model kaydı bulunamadı.",
      "model-not-found",
      { modelId: "Seçilen model kaydı bulunamadı." },
    );
  }
}

async function findDuplicateSlot(
  tx: TransactionClient,
  input: {
    id?: string;
    productId: string;
    modelId: string;
    cameraView: string;
    zIndexLayer: number;
  },
) {
  const conditions = [
    eq(visualAssets2d.productId, input.productId),
    eq(visualAssets2d.modelId, input.modelId),
    eq(visualAssets2d.cameraView, input.cameraView),
    eq(visualAssets2d.zIndexLayer, input.zIndexLayer),
  ];

  if (input.id) {
    conditions.push(ne(visualAssets2d.id, input.id));
  }

  const rows = await tx
    .select({ id: visualAssets2d.id })
    .from(visualAssets2d)
    .where(and(...conditions))
    .limit(1);

  return rows[0] ?? null;
}

async function assertSlotAvailable(
  tx: TransactionClient,
  input: {
    id?: string;
    productId: string;
    modelId: string;
    cameraView: string;
    zIndexLayer: number;
  },
) {
  const duplicate = await findDuplicateSlot(tx, input);

  if (duplicate) {
    throw new WorkshopAssetMutationError(
      "Aynı ürün, model, kamera görünümü ve katman sırası için bir Workshop varlığı zaten mevcut.",
      "duplicate-slot",
    );
  }
}

async function assertNoHotspotDependency(tx: TransactionClient, id: string) {
  const rows = await tx
    .select({ id: hotspotMappings.id })
    .from(hotspotMappings)
    .where(eq(hotspotMappings.assetId, id))
    .limit(1);

  if (rows[0]) {
    throw new WorkshopAssetMutationError(
      "Bu Workshop varlığı bağlı hotspot kayıtları içerdiği için silinemez.",
      "hotspot-in-use",
    );
  }
}

function buildNextState(
  id: string,
  input: ParsedWorkshopAssetInput,
): WorkshopAssetAuditState {
  return {
    id,
    productId: input.productId,
    modelId: input.modelId,
    cameraView: input.cameraView,
    zIndexLayer: input.zIndexLayer,
    assetUrl: input.assetUrl,
    fallbackUrl: input.fallbackUrl,
  };
}

export async function saveWorkshopAssetInTransaction(
  input: ParsedWorkshopAssetInput,
  actor: StrictAuditActor,
) {
  return runDatabaseTransaction(async (tx) => {
    if (input.id) {
      await acquireMutationLock(tx, `workshop-asset:${input.id}`);

      const existingAsset = await findWorkshopAssetById(tx, input.id);

      if (!existingAsset) {
        throw new WorkshopAssetMutationError(
          "Güncellenecek Workshop varlığı bulunamadı.",
          "not-found",
        );
      }

      await assertProductExists(tx, input.productId);
      await assertModelExists(tx, input.modelId);

      const previousState = toWorkshopAssetAuditState(existingAsset);
      const nextState = buildNextState(input.id, input);

      await acquireSlotLocks(tx, [
        getSlotLockKey(previousState),
        getSlotLockKey(nextState),
      ]);

      await assertSlotAvailable(tx, {
        id: input.id,
        productId: input.productId,
        modelId: input.modelId,
        cameraView: input.cameraView,
        zIndexLayer: input.zIndexLayer,
      });

      if (!hasWorkshopAssetChanged(previousState, nextState)) {
        throw new WorkshopAssetNoopMutation(
          "Workshop varlığı üzerinde kaydedilecek değişiklik yok.",
        );
      }

      const updatedRows = await tx
        .update(visualAssets2d)
        .set({
          productId: input.productId,
          modelId: input.modelId,
          cameraView: input.cameraView,
          zIndexLayer: input.zIndexLayer,
          assetUrl: input.assetUrl,
          fallbackUrl: input.fallbackUrl,
        })
        .where(eq(visualAssets2d.id, input.id))
        .returning(workshopAssetReturningFields);

      const updatedAsset = updatedRows[0]
        ? toWorkshopAssetAuditState(updatedRows[0])
        : null;

      if (!updatedAsset) {
        throw new WorkshopAssetMutationError(
          "Workshop varlığı güncellenemedi.",
          "update-failed",
        );
      }

      await writeStrictAuditLogInTransaction(tx, {
        entityType: "workshop_asset",
        entityId: updatedAsset.id,
        action: "update",
        previousState,
        newState: updatedAsset,
        actor,
      });

      return { mode: "updated" as WorkshopAssetMutationMode, asset: updatedAsset };
    }

    await assertProductExists(tx, input.productId);
    await assertModelExists(tx, input.modelId);

    const slotLockKey = getSlotLockKey(input);

    await acquireMutationLock(tx, slotLockKey);
    await assertSlotAvailable(tx, {
      productId: input.productId,
      modelId: input.modelId,
      cameraView: input.cameraView,
      zIndexLayer: input.zIndexLayer,
    });

    const insertedRows = await tx
      .insert(visualAssets2d)
      .values({
        productId: input.productId,
        modelId: input.modelId,
        cameraView: input.cameraView,
        zIndexLayer: input.zIndexLayer,
        assetUrl: input.assetUrl,
        fallbackUrl: input.fallbackUrl,
      })
      .returning(workshopAssetReturningFields);

    const insertedAsset = insertedRows[0]
      ? toWorkshopAssetAuditState(insertedRows[0])
      : null;

    if (!insertedAsset) {
      throw new WorkshopAssetMutationError(
        "Workshop varlığı oluşturulamadı.",
        "create-failed",
      );
    }

    await writeStrictAuditLogInTransaction(tx, {
      entityType: "workshop_asset",
      entityId: insertedAsset.id,
      action: "create",
      newState: insertedAsset,
      actor,
    });

    return { mode: "created" as WorkshopAssetMutationMode, asset: insertedAsset };
  });
}

export async function deleteWorkshopAssetInTransaction(
  id: string,
  actor: StrictAuditActor,
) {
  return runDatabaseTransaction(async (tx) => {
    await acquireMutationLock(tx, `workshop-asset:${id}`);

    const existingAsset = await findWorkshopAssetById(tx, id);

    if (!existingAsset) {
      throw new WorkshopAssetMutationError(
        "Workshop varlığı bulunamadı.",
        "not-found",
      );
    }

    const previousState = toWorkshopAssetAuditState(existingAsset);

    await assertNoHotspotDependency(tx, id);

    const deletedRows = await tx
      .delete(visualAssets2d)
      .where(eq(visualAssets2d.id, id))
      .returning({ id: visualAssets2d.id });

    if (deletedRows.length === 0) {
      throw new WorkshopAssetMutationError(
        "Workshop varlığı bulunamadı.",
        "not-found",
      );
    }

    await writeStrictAuditLogInTransaction(tx, {
      entityType: "workshop_asset",
      entityId: previousState.id,
      action: "delete",
      previousState,
      actor,
    });

    return { asset: previousState };
  });
}
