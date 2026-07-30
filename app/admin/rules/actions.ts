"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  AuditActorBindingError,
  requireStrictAuditActor,
} from "@/app/lib/admin/audit";

import {
  createRuleInTransaction,
  deleteRuleInTransaction,
  RuleMutationError,
  RuleNoopMutation,
  updateRuleInTransaction,
} from "./transactions";
import { initialRuleFormState, type RuleFormState } from "./types";
import {
  createGenericError,
  getTrimmed,
  isUuid,
  parseRuleFormData,
} from "./validation";

function getSafeErrorName(error: unknown) {
  return error instanceof Error ? error.name : "Error";
}

function getSafeErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function getSafeErrorCode(error: unknown) {
  if (
    error instanceof RuleMutationError ||
    error instanceof AuditActorBindingError
  ) {
    return error.code;
  }

  return null;
}

function logRuleActionError(action: string, id: string | null, error: unknown) {
  console.error(`rules/${action} error`, {
    action,
    entityId: id,
    errorName: getSafeErrorName(error),
    errorCode: getSafeErrorCode(error),
  });
}

function getRuleFailureMessage(error: unknown) {
  const message = getSafeErrorMessage(error).toLowerCase();

  if (message.includes("duplicate key") || message.includes("23505")) {
    return "Bu kaynak ürün, hedef ürün ve kural tipi için kayıt zaten mevcut.";
  }

  if (message.includes("violates foreign key constraint")) {
    return "İlişkili kayıt doğrulanamadığı için kural işlemi tamamlanamadı.";
  }

  if (message.includes("invalid input syntax for type uuid")) {
    return "Geçersiz kayıt kimliği nedeniyle kural işlemi durduruldu.";
  }

  if (message.includes("database_url") || message.includes("fetch failed")) {
    return "Veritabanı yazım hatası nedeniyle kural işlemi tamamlanamadı.";
  }

  return "Kural kaydı işlenirken beklenmeyen bir hata oluştu.";
}

function buildRulesRedirectUrl(
  params: Record<string, string | number | undefined | null>,
) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  }

  const query = searchParams.toString();
  return query ? `/admin/rules?${query}` : "/admin/rules";
}

function createMutationErrorState(error: RuleMutationError): RuleFormState {
  return {
    ...initialRuleFormState,
    status: "error",
    message: error.message,
    fieldErrors: error.fieldErrors,
  };
}

function getActorFailureState() {
  return createGenericError(
    "Admin audit oturumu doğrulanamadı. Lütfen tekrar giriş yapıp işlemi yeniden deneyin.",
  );
}

function getDeleteCode(error: unknown) {
  if (error instanceof RuleMutationError) {
    return error.code;
  }

  const message = getSafeErrorMessage(error).toLowerCase();

  if (message.includes("invalid input syntax for type uuid")) {
    return "invalid-id";
  }

  if (message.includes("database_url") || message.includes("fetch failed")) {
    return "db-write-failed";
  }

  return "delete-failed";
}

export async function saveRule(
  _previousState: RuleFormState,
  formData: FormData,
): Promise<RuleFormState> {
  const parsed = parseRuleFormData(formData);
  let redirectUrl: string | null = null;

  if (!parsed.ok) {
    return parsed.state;
  }

  try {
    const auditActor = await requireStrictAuditActor();

    if (parsed.input.id) {
      await updateRuleInTransaction(
        {
          ...parsed.input,
          id: parsed.input.id,
        },
        auditActor,
      );

      revalidatePath("/admin");
      revalidatePath("/admin/rules");

      redirectUrl = buildRulesRedirectUrl({
        saved: 1,
        updated: 1,
      });
    } else {
      await createRuleInTransaction(parsed.input, auditActor);

      revalidatePath("/admin");
      revalidatePath("/admin/rules");

      redirectUrl = buildRulesRedirectUrl({
        saved: 1,
        created: 1,
      });
    }
  } catch (error) {
    if (error instanceof AuditActorBindingError) {
      return getActorFailureState();
    }

    if (error instanceof RuleNoopMutation) {
      redirectUrl = buildRulesRedirectUrl({
        ruleAction: "unchanged",
      });
    } else if (error instanceof RuleMutationError) {
      return createMutationErrorState(error);
    } else {
      logRuleActionError("saveRule", parsed.input.id, error);
      return createGenericError(getRuleFailureMessage(error));
    }
  }

  redirect(redirectUrl ?? "/admin/rules");
}

export async function deleteRule(formData: FormData) {
  const id = getTrimmed(formData, "id");

  if (!id || !isUuid(id)) {
    redirect(
      buildRulesRedirectUrl({
        ruleAction: "error",
        ruleCode: "invalid-id",
      }),
    );
  }

  try {
    const auditActor = await requireStrictAuditActor();

    await deleteRuleInTransaction(id.toLowerCase(), auditActor);

    revalidatePath("/admin");
    revalidatePath("/admin/rules");
  } catch (error) {
    if (error instanceof AuditActorBindingError) {
      redirect(
        buildRulesRedirectUrl({
          ruleAction: "error",
          ruleCode: "audit-actor-required",
        }),
      );
    }

    logRuleActionError("deleteRule", id, error);

    redirect(
      buildRulesRedirectUrl({
        ruleAction: "error",
        ruleCode: getDeleteCode(error),
      }),
    );
  }

  redirect(
    buildRulesRedirectUrl({
      ruleAction: "deleted",
    }),
  );
}
