import { validate as validateUuid } from "uuid";

import {
  initialLeadFormErrors,
  type LeadFormErrors,
  type LeadFormValues,
  type LeadStatus,
} from "./types";

const LEAD_STATUSES: LeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "converted",
  "lost",
];

function getTrimmed(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function isValidEmail(value: string) {
  if (!value) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function parseLeadStatus(value: string): LeadStatus | null {
  return LEAD_STATUSES.includes(value as LeadStatus)
    ? (value as LeadStatus)
    : null;
}

export function normalizeOptionalLeadText(value: string) {
  return value.length > 0 ? value : null;
}

export function validateLeadForm(formData: FormData) {
  const id = getTrimmed(formData, "id");
  const buildVersionId = getTrimmed(formData, "buildVersionId");
  const fullName = getTrimmed(formData, "fullName");
  const email = getTrimmed(formData, "email");
  const phoneNumber = getTrimmed(formData, "phoneNumber");
  const whatsappOptIn = String(formData.get("whatsappOptIn") ?? "") === "on";
  const statusInput = getTrimmed(formData, "status");
  const status = parseLeadStatus(statusInput);

  const values: LeadFormValues = {
    id,
    buildVersionId,
    fullName,
    email,
    phoneNumber,
    whatsappOptIn,
    status: status ?? "new",
  };

  const errors: LeadFormErrors = {
    ...initialLeadFormErrors,
  };

  if (id && !validateUuid(id)) {
    errors.form = "Lead kimliği geçersiz.";
  }

  if (!buildVersionId) {
    errors.buildVersionId = "Build versiyonu seçmelisin.";
  } else if (!validateUuid(buildVersionId)) {
    errors.buildVersionId = "Build versiyonu kimliği geçersiz.";
  }

  if (!fullName) {
    errors.fullName = "Ad soyad zorunludur.";
  } else if (fullName.length < 2) {
    errors.fullName = "Ad soyad en az 2 karakter olmalıdır.";
  }

  if (email && !isValidEmail(email)) {
    errors.email = "Geçerli bir e-posta gir.";
  }

  if (!status) {
    errors.status = "Lead durumu geçersiz.";
  }

  return {
    ok: !Object.values(errors).some(Boolean),
    values,
    errors,
    status,
  };
}
