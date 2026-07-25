import { validate as validateUuid } from "uuid";

export type ProductionStatus =
  | "pending"
  | "chassis"
  | "insulation"
  | "furniture"
  | "systems"
  | "testing"
  | "completed";

export type OrderFormValues = {
  id?: string;
  offerId?: string;
  productionStatus?: ProductionStatus | string;
  estimatedDeliveryDate?: string;
  vinNumber?: string;
};

export type OrderFormErrors = {
  offerId?: string;
  productionStatus?: string;
  estimatedDeliveryDate?: string;
  vinNumber?: string;
  form?: string;
};

export type ProductionUpdateFormValues = {
  orderId?: string;
  stage?: string;
  description?: string;
  imageUrl?: string;
};

export type ProductionUpdateFormErrors = {
  orderId?: string;
  stage?: string;
  description?: string;
  imageUrl?: string;
  form?: string;
};

export type ParsedOrderInput = {
  id: string;
  offerId: string;
  productionStatus: ProductionStatus;
  estimatedDeliveryDateInput: string;
  estimatedDeliveryDate: string | null;
  vinNumber: string | null;
  values: OrderFormValues;
};

export type ParsedProductionUpdateInput = {
  orderId: string;
  stage: ProductionStatus;
  description: string;
  imageUrl: string | null;
  values: ProductionUpdateFormValues;
};

const PRODUCTION_STATUSES: ProductionStatus[] = [
  "pending",
  "chassis",
  "insulation",
  "furniture",
  "systems",
  "testing",
  "completed",
];

function getTrimmed(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export function parseProductionStatus(value: string): ProductionStatus | null {
  return PRODUCTION_STATUSES.includes(value as ProductionStatus)
    ? (value as ProductionStatus)
    : null;
}

export function parseDateInput(value: string): string | null {
  if (!value) {
    return null;
  }

  const parts = value.split("-");

  if (parts.length !== 3) {
    return null;
  }

  const [yearRaw, monthRaw, dayRaw] = parts;
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);

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

  const parsed = new Date(Date.UTC(year, month - 1, day));

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function isPastDay(value: string) {
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(today.getDate()).padStart(2, "0")}`;

  return value < todayKey;
}

function normalizeVin(value: string) {
  return value.replace(/\s+/g, "").toUpperCase();
}

function isValidVin(value: string) {
  if (!value) {
    return true;
  }

  return /^[A-HJ-NPR-Z0-9]{11,17}$/.test(value);
}

function isValidHttpUrl(value: string) {
  if (!value) {
    return true;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function parseOrderFormData(formData: FormData) {
  const id = getTrimmed(formData, "id");
  const offerId = getTrimmed(formData, "offerId");
  const statusInput = getTrimmed(formData, "productionStatus");
  const productionStatus = parseProductionStatus(statusInput);
  const estimatedDeliveryDateInput = getTrimmed(formData, "estimatedDeliveryDate");
  const estimatedDeliveryDate = estimatedDeliveryDateInput
    ? parseDateInput(estimatedDeliveryDateInput)
    : null;
  const vinNumberInput = normalizeVin(getTrimmed(formData, "vinNumber"));

  const values: OrderFormValues = {
    id,
    offerId,
    productionStatus: productionStatus ?? statusInput,
    estimatedDeliveryDate: estimatedDeliveryDateInput,
    vinNumber: vinNumberInput,
  };

  const errors: OrderFormErrors = {};

  if (id && !validateUuid(id)) {
    errors.form = "Sipariş kimliği geçersiz.";
  }

  if (!offerId) {
    errors.offerId = "Sipariş bir teklif kaydına bağlı olmalıdır.";
  } else if (!validateUuid(offerId)) {
    errors.offerId = "Teklif kimliği geçersiz.";
  }

  if (!productionStatus) {
    errors.productionStatus = "Sipariş durumu geçersiz.";
  }

  if (estimatedDeliveryDateInput && !estimatedDeliveryDate) {
    errors.estimatedDeliveryDate = "Geçerli bir teslim tarihi gir.";
  }

  if (estimatedDeliveryDate && isPastDay(estimatedDeliveryDate)) {
    errors.estimatedDeliveryDate = "Tahmini teslim tarihi geçmişte olamaz.";
  }

  if (vinNumberInput && !isValidVin(vinNumberInput)) {
    errors.vinNumber = "VIN 11-17 karakter olmalı ve geçersiz karakter içermemeli.";
  }

  if (
    productionStatus &&
    (productionStatus === "testing" || productionStatus === "completed") &&
    !vinNumberInput
  ) {
    errors.vinNumber = "Test ve tamamlandı aşamalarında VIN zorunludur.";
  }

  if (Object.keys(errors).length > 0 || !productionStatus) {
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
      offerId,
      productionStatus,
      estimatedDeliveryDateInput,
      estimatedDeliveryDate,
      vinNumber: vinNumberInput || null,
      values,
    } satisfies ParsedOrderInput,
  };
}

export function parseProductionUpdateFormData(formData: FormData) {
  const orderId = getTrimmed(formData, "orderId");
  const stageInput = getTrimmed(formData, "stage");
  const stage = parseProductionStatus(stageInput);
  const description = getTrimmed(formData, "description");
  const imageUrlInput = getTrimmed(formData, "imageUrl");

  const values: ProductionUpdateFormValues = {
    orderId,
    stage: stage ?? stageInput,
    description,
    imageUrl: imageUrlInput,
  };

  const errors: ProductionUpdateFormErrors = {};

  if (!orderId) {
    errors.orderId = "Güncelleme bir sipariş kaydına bağlı olmalıdır.";
  } else if (!validateUuid(orderId)) {
    errors.orderId = "Sipariş kimliği geçersiz.";
  }

  if (!stage) {
    errors.stage = "Aşama bilgisi geçersiz.";
  }

  if (!description) {
    errors.description = "Açıklama zorunludur.";
  }

  if (description.length > 1200) {
    errors.description = "Açıklama en fazla 1200 karakter olabilir.";
  }

  if (imageUrlInput && !isValidHttpUrl(imageUrlInput)) {
    errors.imageUrl = "Görsel bağlantısı geçerli bir http/https adresi olmalıdır.";
  }

  if (Object.keys(errors).length > 0 || !stage) {
    return {
      ok: false as const,
      message: "Üretim güncellemesi eksik veya hatalı.",
      values,
      errors,
    };
  }

  return {
    ok: true as const,
    input: {
      orderId,
      stage,
      description,
      imageUrl: imageUrlInput || null,
      values,
    } satisfies ParsedProductionUpdateInput,
  };
}
