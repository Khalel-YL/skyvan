"use server";

import {
  getProductSelectionAiDecisionBundle,
  type ProductSelectionAiDecisionBundle,
} from "@/app/lib/admin/governance";

import {
  persistPublicWorkshopBuild,
  PublicWorkshopBuildMutationError,
} from "./transactions";
import {
  preparePublicWorkshopIdentity,
  PublicWorkshopIdentityError,
  setPublicWorkshopSessionCookie,
  type PreparedPublicWorkshopIdentity,
} from "./identity";
import {
  parseSaveEngineeringBuildInput,
  type SaveEngineeringBuildInput,
} from "./validation";

type SaveEngineeringBuildResult =
  | {
      success: true;
      shortCode: string;
      aiDecisionBundle: ProductSelectionAiDecisionBundle | null;
    }
  | {
      success: false;
      error: string;
    };

const PUBLIC_WORKSHOP_WRITES_ENABLED =
  process.env.SKYVAN_PUBLIC_WORKSHOP_WRITES_ENABLED === "true";

function getSafeErrorName(error: unknown) {
  return error instanceof Error ? error.name : "Error";
}

function getSafeErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function getSafeLogErrorMessage(error: unknown) {
  if (
    error instanceof PublicWorkshopBuildMutationError ||
    error instanceof PublicWorkshopIdentityError
  ) {
    return error.message;
  }

  return "internal-error";
}

function logWorkshopActionError(
  action: string,
  error: unknown,
  meta: {
    productCount?: number;
    hasShortCode?: boolean;
    hadExistingCookie?: boolean;
    reusedPublicSession?: boolean;
    createdPublicSession?: boolean;
  },
) {
  console.error(`workshop/${action} write error`, {
    action,
    productCount: meta.productCount,
    hasShortCode: meta.hasShortCode,
    hadExistingCookie: meta.hadExistingCookie,
    reusedPublicSession: meta.reusedPublicSession,
    createdPublicSession: meta.createdPublicSession,
    errorName: getSafeErrorName(error),
    errorMessage: getSafeLogErrorMessage(error),
  });
}

function logWorkshopAiBundleError(error: unknown, productCount: number) {
  console.error("WORKSHOP_AI_DECISION_BUNDLE_HATASI:", {
    productCount,
    errorName: getSafeErrorName(error),
    errorMessage: getSafeErrorMessage(error),
  });
}

function getPublicWorkshopFailureMessage(error: unknown) {
  const message = getSafeErrorMessage(error).toLowerCase();

  if (message.includes("database_url") || message.includes("fetch failed")) {
    return "Veritabanı yazım hatası nedeniyle Workshop proje kaydı tamamlanamadı.";
  }

  if (
    message.includes("duplicate key") ||
    message.includes("23505") ||
    message.includes("violates foreign key constraint")
  ) {
    return "Workshop proje bağı doğrulanamadığı için kayıt tamamlanamadı.";
  }

  return "Workshop proje kaydı sırasında beklenmeyen bir hata oluştu.";
}

export async function saveEngineeringBuild(
  data: SaveEngineeringBuildInput,
): Promise<SaveEngineeringBuildResult> {
  if (!PUBLIC_WORKSHOP_WRITES_ENABLED) {
    return {
      success: false,
      error: "Workshop proje kaydı şu anda güvenli hazırlık modunda kapalı.",
    };
  }

  let publicIdentity: PreparedPublicWorkshopIdentity;

  try {
    publicIdentity = await preparePublicWorkshopIdentity();
  } catch (error) {
    if (error instanceof PublicWorkshopIdentityError) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Workshop oturum güvenliği henüz yapılandırılmadı.",
    };
  }

  const parsed = parseSaveEngineeringBuildInput(data);

  if (!parsed.ok) {
    return {
      success: false,
      error: parsed.error,
    };
  }

  try {
    const result = await persistPublicWorkshopBuild({
      ...parsed.input,
      publicIdentity: {
        existingTokenHash: publicIdentity.existingTokenHash,
        candidateTokenHash: publicIdentity.candidateTokenHash,
      },
    });
    const rawToken = result.publicSession.reusedExistingSession
      ? publicIdentity.existingRawToken
      : publicIdentity.candidateRawToken;

    if (!rawToken) {
      return {
        success: false,
        error: "Workshop oturumu doğrulanamadı.",
      };
    }

    await setPublicWorkshopSessionCookie({
      rawToken,
      expiresAt: result.publicSession.expiresAt,
    });

    let aiDecisionBundle: ProductSelectionAiDecisionBundle | null = null;

    try {
      aiDecisionBundle = await getProductSelectionAiDecisionBundle({
        productIds: result.selectedProductIds,
      });
    } catch (bundleError) {
      logWorkshopAiBundleError(bundleError, result.selectedProductIds.length);
    }

    return {
      success: true,
      shortCode: result.shortCode,
      aiDecisionBundle,
    };
  } catch (error) {
    logWorkshopActionError("saveEngineeringBuild", error, {
      productCount: parsed.input.productIds.length,
      hasShortCode: false,
      hadExistingCookie: publicIdentity.hadExistingCookie,
    });

    if (error instanceof PublicWorkshopBuildMutationError) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: getPublicWorkshopFailureMessage(error),
    };
  }
}
