"use server";

import { revalidatePath } from "next/cache";

import {
  AuditActorBindingError,
  requireStrictAuditActor,
  type StrictAuditActor,
} from "@/app/lib/admin/audit";

import {
  BuildCurrentVersionMutationError,
  BuildVersionMutationError,
  isUniqueViolation,
  persistBuildVersionMutation,
  persistCurrentVersionMutation,
} from "./transactions";
import type {
  BuildCurrentVersionFormState,
  BuildVersionFormState,
} from "./types";
import {
  parseBuildVersionFormData,
  parseCurrentVersionFormData,
} from "./validation";

function getActionErrorMessage(error: unknown) {
  if (error instanceof AuditActorBindingError) {
    return "Admin oturumu audit actor olarak doğrulanamadı. Lütfen tekrar giriş yapıp deneyin.";
  }

  if (isUniqueViolation(error)) {
    return "Eş zamanlı kayıt çakışması nedeniyle işlem tamamlanamadı. Listeyi yenileyip tekrar deneyin.";
  }

  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  if (message.includes("foreign key")) {
    return "Bağlı model, paket veya build kaydı işlem sırasında değiştiği için kayıt tamamlanamadı.";
  }

  if (message.includes("database_url") || message.includes("fetch failed")) {
    return "Veritabanı bağlantısı nedeniyle işlem tamamlanamadı.";
  }

  return "Build version kaydı sırasında beklenmeyen bir hata oluştu.";
}

function revalidateBuildVersionSurfaces() {
  revalidatePath("/admin");
  revalidatePath("/admin/build-versions");
  revalidatePath("/admin/leads");
  revalidatePath("/admin/offers");
}

export async function saveBuildVersion(
  _prevState: BuildVersionFormState,
  formData: FormData,
): Promise<BuildVersionFormState> {
  const parsed = parseBuildVersionFormData(formData);

  if (!parsed.ok) {
    return parsed;
  }

  let auditActor: StrictAuditActor;

  try {
    auditActor = await requireStrictAuditActor();
  } catch (error) {
    return {
      ok: false,
      message: getActionErrorMessage(error),
      values: parsed.input.values,
      errors: {
        form: "Build version yazımı için geçerli admin audit oturumu gerekir.",
      },
    };
  }

  try {
    const result = await persistBuildVersionMutation({
      mode: parsed.input.mode,
      buildId: parsed.input.buildId,
      shortCode: parsed.input.shortCode,
      modelId: parsed.input.modelId,
      packageId: parsed.input.packageId,
      stateSnapshot: parsed.input.stateSnapshot,
      actor: auditActor,
    });

    revalidateBuildVersionSurfaces();

    return {
      ok: true,
      message: `${result.shortCode} · v${result.versionNumber} oluşturuldu ve current version bağı güncellendi.`,
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

    if (error instanceof BuildVersionMutationError) {
      return {
        ok: false,
        message: error.message,
        values: parsed.input.values,
        errors: error.errors,
      };
    }

    return {
      ok: false,
      message: getActionErrorMessage(error),
      values: parsed.input.values,
      errors: {
        form: "Build, version, current bağ ve audit kaydı tek işlemde tamamlanamadı.",
      },
    };
  }
}

export async function setBuildCurrentVersion(
  _prevState: BuildCurrentVersionFormState,
  formData: FormData,
): Promise<BuildCurrentVersionFormState> {
  const parsed = parseCurrentVersionFormData(formData);

  if (!parsed.ok) {
    return {
      ok: false,
      message: parsed.message,
      errors: parsed.errors,
    };
  }

  let auditActor: StrictAuditActor;

  try {
    auditActor = await requireStrictAuditActor();
  } catch (error) {
    return {
      ok: false,
      message: getActionErrorMessage(error),
      errors: {
        form: "Current version yazımı için geçerli admin audit oturumu gerekir.",
      },
    };
  }

  try {
    const result = await persistCurrentVersionMutation({
      buildId: parsed.buildId,
      versionId: parsed.versionId,
      actor: auditActor,
    });

    revalidateBuildVersionSurfaces();

    return {
      ok: true,
      message: `Current version v${result.versionNumber} olarak güncellendi.`,
    };
  } catch (error) {
    console.error("setBuildCurrentVersion error:", error);

    if (error instanceof BuildCurrentVersionMutationError) {
      return {
        ok: false,
        message: error.message,
        errors: error.errors,
      };
    }

    return {
      ok: false,
      message: "Current version güncellenemedi.",
      errors: {
        form: "Current version ve audit kaydı tek işlemde tamamlanamadı.",
      },
    };
  }
}
