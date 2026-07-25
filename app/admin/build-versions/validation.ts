import { validate as validateUuid } from "uuid";

import type {
  BuildCurrentVersionFormState,
  BuildVersionFormMode,
  BuildVersionFormState,
} from "./types";

export type BuildVersionValues = NonNullable<BuildVersionFormState["values"]>;
export type BuildVersionErrors = NonNullable<BuildVersionFormState["errors"]>;

export type ParsedBuildVersionInput = {
  mode: BuildVersionFormMode;
  buildId: string;
  shortCode: string;
  modelId: string;
  packageId: string | null;
  stateSnapshotInput: string;
  stateSnapshot: unknown | null;
  values: BuildVersionValues;
};

export type BuildVersionValidationResult =
  | {
      ok: true;
      input: ParsedBuildVersionInput;
    }
  | {
      ok: false;
      message: string;
      values: BuildVersionValues;
      errors: BuildVersionErrors;
    };

function getTrimmed(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function parseMode(value: string): BuildVersionFormMode | null {
  if (value === "new_build" || value === "existing_build") {
    return value;
  }

  return null;
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

function parseOptionalSnapshot(value: string) {
  if (!value) {
    return {
      ok: true as const,
      parsed: null,
    };
  }

  try {
    return {
      ok: true as const,
      parsed: JSON.parse(value) as unknown,
    };
  } catch {
    return {
      ok: true as const,
      parsed: {
        note: value,
        source: "admin_manual_note",
      },
    };
  }
}

export function parseBuildVersionFormData(
  formData: FormData,
): BuildVersionValidationResult {
  const rawMode = getTrimmed(formData, "mode");
  const mode = parseMode(rawMode);
  const buildId = getTrimmed(formData, "buildId");
  const shortCode = normalizeShortCode(getTrimmed(formData, "shortCode"));
  const modelId = getTrimmed(formData, "modelId");
  const packageId = normalizeOptionalId(getTrimmed(formData, "packageId"));
  const stateSnapshotInput = getTrimmed(formData, "stateSnapshot");

  const values: BuildVersionValues = {
    mode: mode ?? undefined,
    buildId,
    shortCode,
    modelId,
    packageId: packageId ?? "",
    stateSnapshot: stateSnapshotInput,
  };

  const errors: BuildVersionErrors = {};
  const parsedSnapshot = parseOptionalSnapshot(stateSnapshotInput);

  if (!mode) {
    errors.mode = "Geçerli bir kayıt modu seçmelisin.";
  } else if (mode === "new_build") {
    if (!shortCode) {
      errors.shortCode = "Build kısa kodu zorunludur.";
    } else if (shortCode.length < 3 || shortCode.length > 40) {
      errors.shortCode = "Build kısa kodu 3 ile 40 karakter arasında olmalıdır.";
    }

    if (!modelId) {
      errors.modelId = "Model seçmelisin.";
    } else if (!validateUuid(modelId)) {
      errors.modelId = "Geçerli bir model seçmelisin.";
    }
  } else if (!buildId) {
    errors.buildId = "Mevcut build seçmelisin.";
  } else if (!validateUuid(buildId)) {
    errors.buildId = "Geçerli bir build seçmelisin.";
  }

  if (packageId && !validateUuid(packageId)) {
    errors.packageId = "Geçerli bir paket seçmelisin.";
  }

  if (Object.keys(errors).length > 0) {
    return {
      ok: false,
      message: "Form eksik veya hatalı.",
      values,
      errors,
    };
  }

  if (!mode) {
    return {
      ok: false,
      message: "Form eksik veya hatalı.",
      values,
      errors: {
        mode: "Geçerli bir kayıt modu seçmelisin.",
      },
    };
  }

  return {
    ok: true,
    input: {
      mode,
      buildId,
      shortCode,
      modelId,
      packageId,
      stateSnapshotInput,
      stateSnapshot: parsedSnapshot.parsed,
      values,
    },
  };
}

export function parseCurrentVersionFormData(formData: FormData) {
  const buildId = getTrimmed(formData, "buildId");
  const versionId = getTrimmed(formData, "versionId");
  const errors: NonNullable<BuildCurrentVersionFormState["errors"]> = {};

  if (!buildId) {
    errors.buildId = "Geçerli build ve version seçilmelidir.";
  } else if (!validateUuid(buildId)) {
    errors.buildId = "Geçerli bir build seçilmelidir.";
  }

  if (!versionId) {
    errors.versionId = "Geçerli build ve version seçilmelidir.";
  } else if (!validateUuid(versionId)) {
    errors.versionId = "Geçerli bir versiyon seçilmelidir.";
  }

  if (Object.keys(errors).length > 0) {
    return {
      ok: false as const,
      message: "Build veya version bilgisi eksik.",
      errors,
    };
  }

  return {
    ok: true as const,
    buildId,
    versionId,
  };
}
