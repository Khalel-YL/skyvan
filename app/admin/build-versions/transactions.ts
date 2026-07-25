import { desc, eq, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

import {
  type StrictAuditActor,
  writeStrictAuditLogInTransaction,
} from "@/app/lib/admin/audit";
import { runDatabaseTransaction, type TransactionClient } from "@/db/db";
import { builds, buildVersions, models, packages } from "@/db/schema";

import type { BuildVersionErrors } from "./validation";
import type { BuildVersionFormMode } from "./types";

export class BuildVersionMutationError extends Error {
  constructor(
    message: string,
    public readonly errors?: BuildVersionErrors,
  ) {
    super(message);
    this.name = "BuildVersionMutationError";
  }
}

export class BuildCurrentVersionMutationError extends Error {
  constructor(
    message: string,
    public readonly errors?: { buildId?: string; versionId?: string; form?: string },
  ) {
    super(message);
    this.name = "BuildCurrentVersionMutationError";
  }
}

type PersistBuildVersionInput = {
  mode: BuildVersionFormMode;
  buildId: string;
  shortCode: string;
  modelId: string;
  packageId: string | null;
  stateSnapshot: unknown | null;
  actor: StrictAuditActor;
};

type BuildState = {
  id: string;
  shortCode: string;
  modelId: string;
  sessionId: string;
  currentVersionId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function mapBuildAuditState(row: BuildState): BuildState {
  return {
    id: row.id,
    shortCode: row.shortCode,
    modelId: row.modelId,
    sessionId: row.sessionId,
    currentVersionId: row.currentVersionId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function getDbErrorCode(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error
    ? String((error as { code?: unknown }).code)
    : null;
}

export function isUniqueViolation(error: unknown) {
  return getDbErrorCode(error) === "23505";
}

async function acquireMutationLock(tx: TransactionClient, lockKey: string) {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${lockKey}))`);
}

async function assertPackageCompatibility(
  tx: TransactionClient,
  input: {
    packageId: string | null;
    modelId: string;
  },
) {
  if (!input.packageId) {
    return;
  }

  const packageRows = await tx
    .select({
      id: packages.id,
      modelId: packages.modelId,
    })
    .from(packages)
    .where(eq(packages.id, input.packageId))
    .limit(1);

  const packageRow = packageRows[0] ?? null;

  if (!packageRow) {
    throw new BuildVersionMutationError("Seçilen paket bulunamadı.", {
      packageId: "Geçerli bir paket seçmelisin.",
    });
  }

  if (packageRow.modelId !== null && packageRow.modelId !== input.modelId) {
    throw new BuildVersionMutationError("Seçilen paket build modeline uymuyor.", {
      packageId: "Bu paket seçilen build modeliyle uyumlu değil.",
    });
  }
}

async function getNextVersionNumber(tx: TransactionClient, buildId: string) {
  const latestVersion = await tx
    .select({
      versionNumber: buildVersions.versionNumber,
    })
    .from(buildVersions)
    .where(eq(buildVersions.buildId, buildId))
    .orderBy(desc(buildVersions.versionNumber))
    .limit(1);

  return latestVersion.length > 0 ? latestVersion[0].versionNumber + 1 : 1;
}

export async function persistBuildVersionMutation(input: PersistBuildVersionInput) {
  return runDatabaseTransaction(async (tx) => {
    const now = new Date();
    let resolvedBuildId = input.buildId;
    let resolvedShortCode = input.shortCode;
    let resolvedModelId = input.modelId;
    let previousBuildState: BuildState | null = null;

    if (input.mode === "new_build") {
      await acquireMutationLock(tx, `build-short-code:${input.shortCode}`);

      const modelRows = await tx
        .select({ id: models.id })
        .from(models)
        .where(eq(models.id, input.modelId))
        .limit(1);

      if (modelRows.length === 0) {
        throw new BuildVersionMutationError("Seçilen model bulunamadı.", {
          modelId: "Geçerli bir model seçmelisin.",
        });
      }

      const duplicateBuildRows = await tx
        .select({ id: builds.id })
        .from(builds)
        .where(eq(builds.shortCode, input.shortCode))
        .limit(1);

      if (duplicateBuildRows.length > 0) {
        throw new BuildVersionMutationError("Bu build kısa kodu zaten kullanılıyor.", {
          shortCode: "Bu build kısa kodu zaten kullanılıyor.",
        });
      }

      await assertPackageCompatibility(tx, {
        packageId: input.packageId,
        modelId: input.modelId,
      });

      resolvedBuildId = uuidv4();

      await acquireMutationLock(tx, `build-version:${resolvedBuildId}`);

      const insertedBuildRows = await tx
        .insert(builds)
        .values({
          id: resolvedBuildId,
          shortCode: input.shortCode,
          sessionId: uuidv4(),
          modelId: input.modelId,
          currentVersionId: null,
          updatedAt: now,
        })
        .returning({
          id: builds.id,
          shortCode: builds.shortCode,
          modelId: builds.modelId,
          sessionId: builds.sessionId,
          currentVersionId: builds.currentVersionId,
          createdAt: builds.createdAt,
          updatedAt: builds.updatedAt,
        });

      const insertedBuild = insertedBuildRows[0] ?? null;

      if (!insertedBuild) {
        throw new BuildVersionMutationError("Build kaydı oluşturulamadı.", {
          form: "Build ana kaydı oluşturulamadı.",
        });
      }

      resolvedShortCode = insertedBuild.shortCode;
      resolvedModelId = insertedBuild.modelId;
      previousBuildState = mapBuildAuditState(insertedBuild);

      await writeStrictAuditLogInTransaction(tx, {
        entityType: "build",
        entityId: insertedBuild.id,
        action: "create",
        newState: previousBuildState,
        actor: input.actor,
      });
    } else {
      await acquireMutationLock(tx, `build-version:${input.buildId}`);

      const buildRows = await tx
        .select({
          id: builds.id,
          shortCode: builds.shortCode,
          modelId: builds.modelId,
          sessionId: builds.sessionId,
          currentVersionId: builds.currentVersionId,
          createdAt: builds.createdAt,
          updatedAt: builds.updatedAt,
        })
        .from(builds)
        .where(eq(builds.id, input.buildId))
        .limit(1);

      const buildRow = buildRows[0] ?? null;

      if (!buildRow) {
        throw new BuildVersionMutationError("Seçilen build bulunamadı.", {
          buildId: "Geçerli bir build seçmelisin.",
        });
      }

      resolvedBuildId = buildRow.id;
      resolvedShortCode = buildRow.shortCode;
      resolvedModelId = buildRow.modelId;
      previousBuildState = mapBuildAuditState(buildRow);

      await assertPackageCompatibility(tx, {
        packageId: input.packageId,
        modelId: buildRow.modelId,
      });
    }

    const nextVersionNumber = await getNextVersionNumber(tx, resolvedBuildId);
    const insertedVersionRows = await tx
      .insert(buildVersions)
      .values({
        id: uuidv4(),
        buildId: resolvedBuildId,
        packageId: input.packageId,
        versionNumber: nextVersionNumber,
        totalWeightKg: null,
        totalPrice: null,
        stateSnapshot: input.stateSnapshot,
      })
      .returning({
        id: buildVersions.id,
        buildId: buildVersions.buildId,
        packageId: buildVersions.packageId,
        versionNumber: buildVersions.versionNumber,
        totalWeightKg: buildVersions.totalWeightKg,
        totalPrice: buildVersions.totalPrice,
        stateSnapshot: buildVersions.stateSnapshot,
        createdAt: buildVersions.createdAt,
      });

    const insertedVersion = insertedVersionRows[0] ?? null;

    if (!insertedVersion) {
      throw new BuildVersionMutationError("Build version kaydı oluşturulamadı.", {
        form: "Build version kaydı oluşturulamadı.",
      });
    }

    await writeStrictAuditLogInTransaction(tx, {
      entityType: "build_version",
      entityId: insertedVersion.id,
      action: "create",
      newState: insertedVersion,
      actor: input.actor,
    });

    const updatedBuildRows = await tx
      .update(builds)
      .set({
        currentVersionId: insertedVersion.id,
        updatedAt: now,
      })
      .where(eq(builds.id, resolvedBuildId))
        .returning({
          id: builds.id,
          shortCode: builds.shortCode,
          modelId: builds.modelId,
          sessionId: builds.sessionId,
          currentVersionId: builds.currentVersionId,
          createdAt: builds.createdAt,
          updatedAt: builds.updatedAt,
        });

    const updatedBuild = updatedBuildRows[0] ?? null;

    if (!updatedBuild || !previousBuildState) {
      throw new BuildVersionMutationError("Current version bağı güncellenemedi.", {
        form: "Current version bağı kaydedilemedi.",
      });
    }

    await writeStrictAuditLogInTransaction(tx, {
      entityType: "build",
        entityId: updatedBuild.id,
        action: "update",
        previousState: previousBuildState,
        newState: mapBuildAuditState(updatedBuild),
        actor: input.actor,
      });

    return {
      buildId: resolvedBuildId,
      shortCode: resolvedShortCode,
      modelId: resolvedModelId,
      versionId: insertedVersion.id,
      versionNumber: insertedVersion.versionNumber,
    };
  });
}

export async function persistCurrentVersionMutation(input: {
  buildId: string;
  versionId: string;
  actor: StrictAuditActor;
}) {
  return runDatabaseTransaction(async (tx) => {
    const now = new Date();

    await acquireMutationLock(tx, `build-version:${input.buildId}`);

    const buildRows = await tx
      .select({
        id: builds.id,
        shortCode: builds.shortCode,
        modelId: builds.modelId,
        sessionId: builds.sessionId,
        currentVersionId: builds.currentVersionId,
        createdAt: builds.createdAt,
        updatedAt: builds.updatedAt,
      })
      .from(builds)
      .where(eq(builds.id, input.buildId))
      .limit(1);

    const buildRow = buildRows[0] ?? null;

    if (!buildRow) {
      throw new BuildCurrentVersionMutationError("Build kaydı bulunamadı.", {
        buildId: "Geçerli bir build seçilmelidir.",
      });
    }

    const versionRows = await tx
      .select({
        id: buildVersions.id,
        buildId: buildVersions.buildId,
        versionNumber: buildVersions.versionNumber,
      })
      .from(buildVersions)
      .where(eq(buildVersions.id, input.versionId))
      .limit(1);

    const versionRow = versionRows[0] ?? null;

    if (!versionRow) {
      throw new BuildCurrentVersionMutationError("Versiyon kaydı bulunamadı.", {
        versionId: "Geçerli bir versiyon seçilmelidir.",
      });
    }

    if (versionRow.buildId !== input.buildId) {
      throw new BuildCurrentVersionMutationError("Seçilen version bu build’e ait değil.", {
        form: "Build ve version bağı uyuşmuyor.",
      });
    }

    const updatedBuildRows = await tx
      .update(builds)
      .set({
        currentVersionId: input.versionId,
        updatedAt: now,
      })
      .where(eq(builds.id, input.buildId))
      .returning({
        id: builds.id,
        shortCode: builds.shortCode,
        modelId: builds.modelId,
        sessionId: builds.sessionId,
        currentVersionId: builds.currentVersionId,
        createdAt: builds.createdAt,
        updatedAt: builds.updatedAt,
      });

    const updatedBuild = updatedBuildRows[0] ?? null;

    if (!updatedBuild) {
      throw new BuildCurrentVersionMutationError("Current version güncellenemedi.", {
        form: "Current version bağı kaydedilemedi.",
      });
    }

    await writeStrictAuditLogInTransaction(tx, {
      entityType: "build",
      entityId: input.buildId,
      action: "update",
      previousState: mapBuildAuditState(buildRow),
      newState: mapBuildAuditState(updatedBuild),
      actor: input.actor,
    });

    return {
      versionNumber: versionRow.versionNumber,
    };
  });
}
