"use server";

import { revalidatePath } from "next/cache";
import { desc, eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

import { getDbOrThrow } from "@/db/db";
import { builds, buildVersions, models, packages } from "@/db/schema";

import type {
  BuildCurrentVersionFormState,
  BuildVersionFormMode,
  BuildVersionFormState,
} from "./types";

function getTrimmed(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function normalizeMode(value: string): BuildVersionFormMode {
  return value === "existing_build" ? "existing_build" : "new_build";
}

function normalizeShortCode(value: string) {
  return value
    .toUpperCase()
    .trim()
    .replace(/[^A-Z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeOptionalId(value: string) {
  return value.length > 0 ? value : null;
}

function createAdminSessionId() {
  return `admin-${Date.now()}-${uuidv4().slice(0, 8)}`;
}

function parseOptionalSnapshot(
  value: string,
): { ok: true; parsed: unknown | null } | { ok: false; message: string } {
  if (!value) {
    return { ok: true, parsed: null };
  }

  try {
    return {
      ok: true,
      parsed: JSON.parse(value),
    };
  } catch {
    return {
      ok: true,
      parsed: {
        note: value,
        source: "admin_manual_note",
      },
    };
  }
}

export async function saveBuildVersion(
  _prevState: BuildVersionFormState,
  formData: FormData,
): Promise<BuildVersionFormState> {
  const db = getDbOrThrow();

  const mode = normalizeMode(getTrimmed(formData, "mode"));
  const buildId = getTrimmed(formData, "buildId");
  const shortCodeInput = getTrimmed(formData, "shortCode");
  const shortCode = normalizeShortCode(shortCodeInput);
  const modelId = getTrimmed(formData, "modelId");
  const packageId = getTrimmed(formData, "packageId");
  const stateSnapshotInput = getTrimmed(formData, "stateSnapshot");

  const values: BuildVersionFormState["values"] = {
    mode,
    buildId,
    shortCode,
    modelId,
    packageId,
    stateSnapshot: stateSnapshotInput,
  };

  const errors: NonNullable<BuildVersionFormState["errors"]> = {};

  const parsedSnapshot = parseOptionalSnapshot(stateSnapshotInput);

  let resolvedBuildId = "";
  let resolvedShortCode = "";
  let resolvedModelId = "";

  if (mode === "new_build") {
    if (!shortCode) {
      errors.shortCode = "Build kısa kodu zorunludur.";
    } else if (shortCode.length < 3 || shortCode.length > 40) {
      errors.shortCode = "Build kısa kodu 3 ile 40 karakter arasında olmalıdır.";
    }

    if (!modelId) {
      errors.modelId = "Model seçmelisin.";
    }

    if (Object.keys(errors).length > 0) {
      return {
        ok: false,
        message: "Form eksik veya hatalı.",
        values,
        errors,
      };
    }

    const existingBuild = await db
      .select({
        id: builds.id,
      })
      .from(builds)
      .where(eq(builds.shortCode, shortCode))
      .limit(1);

    if (existingBuild.length > 0) {
      return {
        ok: false,
        message: "Bu build kısa kodu zaten kullanılıyor.",
        values,
        errors: {
          shortCode: "Bu build kısa kodu zaten kullanılıyor.",
        },
      };
    }

    const existingModel = await db
      .select({
        id: models.id,
      })
      .from(models)
      .where(eq(models.id, modelId))
      .limit(1);

    if (existingModel.length === 0) {
      return {
        ok: false,
        message: "Seçilen model bulunamadı.",
        values,
        errors: {
          modelId: "Geçerli bir model seçmelisin.",
        },
      };
    }

    resolvedBuildId = uuidv4();
    resolvedShortCode = shortCode;
    resolvedModelId = modelId;

    await db.insert(builds).values({
      id: resolvedBuildId,
      shortCode: resolvedShortCode,
      sessionId: createAdminSessionId(),
      modelId: resolvedModelId,
      currentVersionId: null,
    });
  } else {
    if (!buildId) {
      errors.buildId = "Mevcut build seçmelisin.";
    }

    if (Object.keys(errors).length > 0) {
      return {
        ok: false,
        message: "Form eksik veya hatalı.",
        values,
        errors,
      };
    }

    const existingBuild = await db
      .select({
        id: builds.id,
        shortCode: builds.shortCode,
        modelId: builds.modelId,
      })
      .from(builds)
      .where(eq(builds.id, buildId))
      .limit(1);

    if (existingBuild.length === 0) {
      return {
        ok: false,
        message: "Seçilen build bulunamadı.",
        values,
        errors: {
          buildId: "Geçerli bir build seçmelisin.",
        },
      };
    }

    const buildRow = existingBuild[0];

    resolvedBuildId = buildRow.id;
    resolvedShortCode = buildRow.shortCode;
    resolvedModelId = buildRow.modelId;
  }

  const normalizedPackageId = normalizeOptionalId(packageId);

  if (normalizedPackageId) {
    const packageRow = await db
      .select({
        id: packages.id,
        modelId: packages.modelId,
      })
      .from(packages)
      .where(eq(packages.id, normalizedPackageId))
      .limit(1);

    if (packageRow.length === 0) {
      return {
        ok: false,
        message: "Seçilen paket bulunamadı.",
        values,
        errors: {
          packageId: "Geçerli bir paket seçmelisin.",
        },
      };
    }

    const selectedPackage = packageRow[0];

    if (
      selectedPackage.modelId !== null &&
      selectedPackage.modelId !== resolvedModelId
    ) {
      return {
        ok: false,
        message: "Seçilen paket build modeline uymuyor.",
        values,
        errors: {
          packageId: "Bu paket seçilen build modeliyle uyumlu değil.",
        },
      };
    }
  }

  const latestVersion = await db
    .select({
      versionNumber: buildVersions.versionNumber,
    })
    .from(buildVersions)
    .where(eq(buildVersions.buildId, resolvedBuildId))
    .orderBy(desc(buildVersions.versionNumber))
    .limit(1);

  const nextVersionNumber =
    latestVersion.length > 0 ? latestVersion[0].versionNumber + 1 : 1;

  const newBuildVersionId = uuidv4();

  try {
    await db.insert(buildVersions).values({
      id: newBuildVersionId,
      buildId: resolvedBuildId,
      packageId: normalizedPackageId,
      versionNumber: nextVersionNumber,
      totalWeightKg: null,
      totalPrice: null,
      stateSnapshot: parsedSnapshot.ok ? parsedSnapshot.parsed : null,
    });

    await db
      .update(builds)
      .set({
        currentVersionId: newBuildVersionId,
        updatedAt: new Date(),
      })
      .where(eq(builds.id, resolvedBuildId));

    revalidatePath("/admin");
    revalidatePath("/admin/build-versions");
    revalidatePath("/admin/leads");
    revalidatePath("/admin/offers");

    return {
      ok: true,
      message: `${resolvedShortCode} · v${nextVersionNumber} oluşturuldu ve current version bağı güncellendi.`,
      values: {
        mode: "new_build",
        buildId: "",
        shortCode: "",
        modelId: "",
        packageId: "",
        stateSnapshot: "",
      },
    };
  } catch (error) {
    console.error("saveBuildVersion error:", error);

    return {
      ok: false,
      message: "Build version kaydı sırasında beklenmeyen bir hata oluştu.",
      values,
      errors: {
        form: "Build ve version bağı kaydedilemedi.",
      },
    };
  }
}

export async function setBuildCurrentVersion(
  _prevState: BuildCurrentVersionFormState,
  formData: FormData,
): Promise<BuildCurrentVersionFormState> {
  const db = getDbOrThrow();

  const buildId = getTrimmed(formData, "buildId");
  const versionId = getTrimmed(formData, "versionId");

  if (!buildId || !versionId) {
    return {
      ok: false,
      message: "Build veya version bilgisi eksik.",
      errors: {
        form: "Geçerli build ve version seçilmelidir.",
      },
    };
  }

  const buildRow = await db
    .select({
      id: builds.id,
    })
    .from(builds)
    .where(eq(builds.id, buildId))
    .limit(1);

  if (buildRow.length === 0) {
    return {
      ok: false,
      message: "Build kaydı bulunamadı.",
      errors: {
        buildId: "Geçerli bir build seçilmelidir.",
      },
    };
  }

  const versionRow = await db
    .select({
      id: buildVersions.id,
      buildId: buildVersions.buildId,
      versionNumber: buildVersions.versionNumber,
    })
    .from(buildVersions)
    .where(eq(buildVersions.id, versionId))
    .limit(1);

  if (versionRow.length === 0) {
    return {
      ok: false,
      message: "Version kaydı bulunamadı.",
      errors: {
        versionId: "Geçerli bir version seçilmelidir.",
      },
    };
  }

  const selectedVersion = versionRow[0];

  if (selectedVersion.buildId !== buildId) {
    return {
      ok: false,
      message: "Seçilen version bu build’e ait değil.",
      errors: {
        form: "Build ve version bağı uyuşmuyor.",
      },
    };
  }

  try {
    await db
      .update(builds)
      .set({
        currentVersionId: versionId,
        updatedAt: new Date(),
      })
      .where(eq(builds.id, buildId));

    revalidatePath("/admin");
    revalidatePath("/admin/build-versions");
    revalidatePath("/admin/leads");
    revalidatePath("/admin/offers");

    return {
      ok: true,
      message: `Current version v${selectedVersion.versionNumber} olarak güncellendi.`,
    };
  } catch (error) {
    console.error("setBuildCurrentVersion error:", error);

    return {
      ok: false,
      message: "Current version güncellenemedi.",
      errors: {
        form: "Current version bağı kaydedilemedi.",
      },
    };
  }
}