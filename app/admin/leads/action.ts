"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { validate as validateUuid } from "uuid";

import {
  AuditActorBindingError,
  requireStrictAuditActor,
} from "@/app/lib/admin/audit";

import {
  initialLeadFormErrors,
  initialLeadFormState,
  type LeadFormState,
} from "./types";
import {
  deleteLeadInTransaction,
  LeadMutationError,
  LeadNoopMutation,
  saveLeadInTransaction,
} from "./transactions";
import { validateLeadForm } from "./validation";

function getTrimmed(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function buildLeadsRedirectUrl(params: {
  notice: string;
  noticeTone: "success" | "warning" | "error";
}) {
  const searchParams = new URLSearchParams({
    notice: params.notice,
    noticeTone: params.noticeTone,
  });

  return `/admin/leads?${searchParams.toString()}`;
}

function getLeadActionDatabaseErrorMessage(error: unknown) {
  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  if (message.includes("database_url") || message.includes("fetch failed")) {
    return "Veritabanı bağlantısı nedeniyle lead işlemi tamamlanamadı.";
  }

  if (message.includes("foreign key")) {
    return "Build versiyonu bağı işlem sırasında değiştiği için lead işlemi tamamlanamadı.";
  }

  return "Lead kaydı sırasında beklenmeyen bir hata oluştu.";
}

export async function saveLead(
  _prevState: LeadFormState,
  formData: FormData,
): Promise<LeadFormState> {
  const parsed = validateLeadForm(formData);

  if (!parsed.ok || !parsed.status) {
    return {
      ok: false,
      message: "Form eksik veya hatalı.",
      values: parsed.values,
      errors: parsed.errors,
    };
  }

  try {
    const auditActor = await requireStrictAuditActor();

    await saveLeadInTransaction(
      {
        ...parsed.values,
        status: parsed.status,
      },
      auditActor,
    );

    revalidatePath("/admin/leads");
    revalidatePath("/admin/offers");

    return {
      ...initialLeadFormState,
      ok: true,
      message: parsed.values.id ? "Lead güncellendi." : "Lead oluşturuldu.",
    };
  } catch (error) {
    if (error instanceof AuditActorBindingError) {
      return {
        ok: false,
        message: "Lead kaydı güvenli şekilde tamamlanamadı.",
        values: parsed.values,
        errors: {
          ...initialLeadFormErrors,
          form: "Admin audit oturumu doğrulanamadığı için lead işlemi durduruldu.",
        },
      };
    }

    if (error instanceof LeadNoopMutation) {
      return {
        ok: false,
        message: error.message,
        values: parsed.values,
        errors: {
          ...initialLeadFormErrors,
          form: "Değişiklik yapılmadığı için audit kaydı üretilmedi.",
        },
      };
    }

    if (error instanceof LeadMutationError) {
      return {
        ok: false,
        message: error.message,
        values: parsed.values,
        errors: {
          ...initialLeadFormErrors,
          ...error.fieldErrors,
        },
      };
    }

    console.error("saveLead error", error);

    return {
      ok: false,
      message: getLeadActionDatabaseErrorMessage(error),
      values: parsed.values,
      errors: {
        ...initialLeadFormErrors,
        form: "Kayıt tamamlanamadı. Build versiyonu bağı ve audit yazımı tekrar kontrol edilmeli.",
      },
    };
  }
}

export async function deleteLead(formData: FormData): Promise<void> {
  const id = getTrimmed(formData, "id");
  let redirectUrl = buildLeadsRedirectUrl({
    notice: "Lead silindi.",
    noticeTone: "success",
  });

  if (!id || !validateUuid(id)) {
    redirect(
      buildLeadsRedirectUrl({
        notice: "Lead kimliği geçersiz olduğu için silme işlemi durduruldu.",
        noticeTone: "error",
      }),
    );
  }

  try {
    const auditActor = await requireStrictAuditActor();

    await deleteLeadInTransaction(id, auditActor);

    revalidatePath("/admin/leads");
    revalidatePath("/admin/offers");
  } catch (error) {
    if (error instanceof AuditActorBindingError) {
      redirectUrl = buildLeadsRedirectUrl({
        notice: "Admin audit oturumu doğrulanamadığı için lead silinemedi.",
        noticeTone: "error",
      });
    } else if (error instanceof LeadMutationError) {
      redirectUrl = buildLeadsRedirectUrl({
        notice: error.fieldErrors?.form ?? error.message,
        noticeTone: "error",
      });
    } else {
      console.error("deleteLead error", error);
      redirectUrl = buildLeadsRedirectUrl({
        notice: "Lead silme işlemi tamamlanamadı.",
        noticeTone: "error",
      });
    }
  }

  redirect(redirectUrl);
}
