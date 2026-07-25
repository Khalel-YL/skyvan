import { validate as validateUuid } from "uuid";

import type { OfferStatus } from "@/app/lib/admin/governance";

export type OfferFormValues = {
  id?: string;
  leadId?: string;
  offerReference?: string;
  validUntil?: string;
  totalAmount?: string;
  status?: OfferStatus;
};

export type OfferFormErrors = {
  leadId?: string;
  offerReference?: string;
  validUntil?: string;
  totalAmount?: string;
  status?: string;
  form?: string;
};

export type ParsedOfferInput = {
  id: string;
  leadId: string;
  rawOfferReference: string;
  validUntilInput: string;
  totalAmountInput: string;
  parsedValidUntil: Date;
  totalAmount: string;
  status: OfferStatus;
  values: OfferFormValues;
};

const OFFER_STATUSES: OfferStatus[] = [
  "draft",
  "sent",
  "accepted",
  "rejected",
  "expired",
];

function getTrimmed(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export function getTodayInput() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function normalizeStatus(value: string): OfferStatus | null {
  return OFFER_STATUSES.includes(value as OfferStatus)
    ? (value as OfferStatus)
    : null;
}

export function parseDateInput(value: string): Date | null {
  if (!value) return null;

  const parts = value.split("-");

  if (parts.length !== 3) {
    return null;
  }

  const [year, month, day] = parts.map(Number);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    year < 1900 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }

  const parsed = new Date(year, month - 1, day, 12, 0, 0, 0);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
}

function normalizeAmount(value: string): string | null {
  if (!value) return null;

  const normalized = value.replace(/\s/g, "").replace(",", ".");
  const parsed = Number(normalized);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed.toFixed(2);
}

export function isNewFormatOfferReference(value: string) {
  return /^OFF-\d{4}-\d{4,}$/.test(value);
}

export function parseOfferFormData(formData: FormData) {
  const id = getTrimmed(formData, "id");
  const leadId = getTrimmed(formData, "leadId");
  const rawOfferReference = getTrimmed(formData, "offerReference");
  const validUntilInput = getTrimmed(formData, "validUntil") || getTodayInput();
  const totalAmountInput = getTrimmed(formData, "totalAmount");
  const statusInput = getTrimmed(formData, "status");
  const status = normalizeStatus(statusInput);
  const parsedValidUntil = parseDateInput(validUntilInput);
  const totalAmount = normalizeAmount(totalAmountInput);

  const values: OfferFormValues = {
    id,
    leadId,
    offerReference: rawOfferReference,
    validUntil: validUntilInput,
    totalAmount: totalAmountInput,
    status: status ?? "draft",
  };

  const errors: OfferFormErrors = {};

  if (id && !validateUuid(id)) {
    errors.form = "Teklif kimliği UUID formatında olmadığı için işlem durduruldu.";
  }

  if (!leadId) {
    errors.leadId = "Lead seçmelisin.";
  } else if (!validateUuid(leadId)) {
    errors.leadId = "Lead kimliği geçersiz.";
  }

  if (!parsedValidUntil) {
    errors.validUntil = "Geçerli bir tarih gir.";
  }

  if (!totalAmount) {
    errors.totalAmount = "Geçerli bir tutar gir.";
  }

  if (!status) {
    errors.status = "Teklif durumu geçersiz.";
  }

  if (Object.keys(errors).length > 0 || !parsedValidUntil || !totalAmount || !status) {
    return {
      ok: false as const,
      message: "Form eksik veya hatalı.",
      values,
      errors,
    };
  }

  return {
    ok: true as const,
    input: {
      id,
      leadId,
      rawOfferReference,
      validUntilInput,
      totalAmountInput,
      parsedValidUntil,
      totalAmount,
      status,
      values,
    } satisfies ParsedOfferInput,
  };
}
