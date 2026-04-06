"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { getDbOrThrow } from "@/db/db";
import { orders, offers, productionUpdates } from "@/db/schema";

export type ProductionStatus =
  | "pending"
  | "chassis"
  | "insulation"
  | "furniture"
  | "systems"
  | "testing"
  | "completed";

export type OrderFormState = {
  ok: boolean;
  message: string;
  values?: {
    id?: string;
    offerId?: string;
    productionStatus?: ProductionStatus;
    estimatedDeliveryDate?: string;
    vinNumber?: string;
  };
  errors?: {
    offerId?: string;
    productionStatus?: string;
    estimatedDeliveryDate?: string;
    vinNumber?: string;
    form?: string;
  };
};

export type ProductionUpdateFormState = {
  ok: boolean;
  message: string;
  values?: {
    orderId?: string;
    stage?: string;
    description?: string;
    imageUrl?: string;
  };
  errors?: {
    orderId?: string;
    stage?: string;
    description?: string;
    imageUrl?: string;
    form?: string;
  };
};

function getTrimmed(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function normalizeProductionStatus(value: string): ProductionStatus {
  if (
    value === "pending" ||
    value === "chassis" ||
    value === "insulation" ||
    value === "furniture" ||
    value === "systems" ||
    value === "testing" ||
    value === "completed"
  ) {
    return value;
  }

  return "pending";
}

function normalizeDateInput(value: string): string | null {
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

  const probe = new Date(Date.UTC(year, month - 1, day));
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) {
    return null;
  }

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function isPastDay(value: string) {
  const normalized = normalizeDateInput(value);
  if (!normalized) {
    return false;
  }

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(today.getDate()).padStart(2, "0")}`;

  return normalized < todayKey;
}

function normalizeVin(value: string) {
  return value.replace(/\s+/g, "").toUpperCase();
}

function isValidVin(value: string) {
  if (!value) return true;
  return /^[A-HJ-NPR-Z0-9]{11,17}$/.test(value);
}

function isValidHttpUrl(value: string) {
  if (!value) return true;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function saveOrder(
  _prevState: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  const db = getDbOrThrow();

  const id = getTrimmed(formData, "id");
  const offerId = getTrimmed(formData, "offerId");
  const productionStatus = normalizeProductionStatus(getTrimmed(formData, "productionStatus"));
  const estimatedDeliveryDateInput = getTrimmed(formData, "estimatedDeliveryDate");
  const vinNumberInput = normalizeVin(getTrimmed(formData, "vinNumber"));

  const values: NonNullable<OrderFormState["values"]> = {
    id,
    offerId,
    productionStatus,
    estimatedDeliveryDate: estimatedDeliveryDateInput,
    vinNumber: vinNumberInput,
  };

  const errors: NonNullable<OrderFormState["errors"]> = {};

  if (!offerId) {
    errors.offerId = "Order bir teklif kaydına bağlı olmalıdır.";
  }

  const normalizedEstimatedDeliveryDate = estimatedDeliveryDateInput
    ? normalizeDateInput(estimatedDeliveryDateInput)
    : null;

  if (estimatedDeliveryDateInput && !normalizedEstimatedDeliveryDate) {
    errors.estimatedDeliveryDate = "Geçerli bir teslim tarihi gir.";
  }

  if (
    estimatedDeliveryDateInput &&
    normalizedEstimatedDeliveryDate &&
    isPastDay(normalizedEstimatedDeliveryDate)
  ) {
    errors.estimatedDeliveryDate = "Tahmini teslim tarihi geçmişte olamaz.";
  }

  if (vinNumberInput && !isValidVin(vinNumberInput)) {
    errors.vinNumber = "VIN 11-17 karakter olmalı ve geçersiz karakter içermemeli.";
  }

  if (
    (productionStatus === "testing" || productionStatus === "completed") &&
    !vinNumberInput
  ) {
    errors.vinNumber = "Testing ve Completed aşamalarında VIN zorunludur.";
  }

  if (Object.keys(errors).length > 0) {
    return {
      ok: false,
      message: "Form eksik veya hatalı.",
      values,
      errors,
    };
  }

  const offerRows = await db
    .select({
      id: offers.id,
      status: offers.status,
    })
    .from(offers)
    .where(eq(offers.id, offerId))
    .limit(1);

  const offer = offerRows[0] ?? null;

  if (!offer) {
    return {
      ok: false,
      message: "Teklif bulunamadı.",
      values,
      errors: {
        form: "Order yalnızca mevcut bir teklif kaydına bağlanabilir.",
      },
    };
  }

  if (offer.status !== "accepted") {
    return {
      ok: false,
      message: "Bu teklif henüz order aşamasına uygun değil.",
      values,
      errors: {
        form: "Order yalnızca kabul edilmiş tekliflerden açılabilir.",
      },
    };
  }

  const duplicateRows = await db
    .select({
      id: orders.id,
    })
    .from(orders)
    .where(eq(orders.offerId, offerId))
    .limit(2);

  if (duplicateRows.length > 0) {
    const existing = duplicateRows[0];

    if (!id || existing.id !== id) {
      return {
        ok: false,
        message: "Bu teklif için zaten bir order mevcut.",
        values,
        errors: {
          offerId: "Seçilen teklif zaten bir order kaydına bağlı.",
        },
      };
    }
  }

  if (vinNumberInput) {
    const vinRows = await db
      .select({
        id: orders.id,
      })
      .from(orders)
      .where(eq(orders.vinNumber, vinNumberInput))
      .limit(1);

    if (vinRows.length > 0 && vinRows[0].id !== id) {
      return {
        ok: false,
        message: "VIN zaten kullanımda.",
        values,
        errors: {
          vinNumber: "Bu VIN başka bir order kaydında mevcut.",
        },
      };
    }
  }

  try {
    if (id) {
      if (productionStatus === "completed") {
        const relatedUpdateRows = await db
          .select({ id: productionUpdates.id })
          .from(productionUpdates)
          .where(eq(productionUpdates.orderId, id))
          .limit(1);

        if (relatedUpdateRows.length === 0) {
          return {
            ok: false,
            message: "Order tamamlanamadı.",
            values,
            errors: {
              form: "Completed durumuna geçmeden önce en az bir üretim güncellemesi eklenmeli.",
            },
          };
        }
      }

      await db
        .update(orders)
        .set({
          offerId,
          productionStatus,
          estimatedDeliveryDate: normalizedEstimatedDeliveryDate,
          vinNumber: vinNumberInput || null,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, id));
    } else {
      await db.insert(orders).values({
        offerId,
        productionStatus,
        estimatedDeliveryDate: normalizedEstimatedDeliveryDate,
        vinNumber: vinNumberInput || null,
      });
    }

    revalidatePath("/admin/orders");

    if (id) {
      revalidatePath(`/admin/orders/${id}`);
    }

    revalidatePath("/admin/offers");

    return {
      ok: true,
      message: id ? "Order güncellendi." : "Order oluşturuldu.",
      values: {
        id: "",
        offerId: "",
        productionStatus: "pending",
        estimatedDeliveryDate: "",
        vinNumber: "",
      },
      errors: {},
    };
  } catch (error) {
    console.error("saveOrder error:", error);

    return {
      ok: false,
      message: "Order kaydı sırasında beklenmeyen bir hata oluştu.",
      values,
      errors: {
        form: "Kayıt tamamlanamadı. Offer bağı, VIN benzersizliği ve tarih alanı tekrar kontrol edilmeli.",
      },
    };
  }
}

export async function saveProductionUpdate(
  _prevState: ProductionUpdateFormState,
  formData: FormData,
): Promise<ProductionUpdateFormState> {
  const db = getDbOrThrow();

  const orderId = getTrimmed(formData, "orderId");
  const stage = normalizeProductionStatus(getTrimmed(formData, "stage"));
  const description = getTrimmed(formData, "description");
  const imageUrl = getTrimmed(formData, "imageUrl");

  const values: NonNullable<ProductionUpdateFormState["values"]> = {
    orderId,
    stage,
    description,
    imageUrl,
  };

  const errors: NonNullable<ProductionUpdateFormState["errors"]> = {};

  if (!orderId) {
    errors.orderId = "Güncelleme bir order kaydına bağlı olmalıdır.";
  }

  if (!stage) {
    errors.stage = "Aşama bilgisi zorunludur.";
  }

  if (!description) {
    errors.description = "Açıklama zorunludur.";
  }

  if (description.length > 1200) {
    errors.description = "Açıklama en fazla 1200 karakter olabilir.";
  }

  if (imageUrl && !isValidHttpUrl(imageUrl)) {
    errors.imageUrl = "Görsel bağlantısı geçerli bir http/https adresi olmalıdır.";
  }

  if (Object.keys(errors).length > 0) {
    return {
      ok: false,
      message: "Üretim güncellemesi eksik veya hatalı.",
      values,
      errors,
    };
  }

  const orderRows = await db
    .select({
      id: orders.id,
      productionStatus: orders.productionStatus,
      vinNumber: orders.vinNumber,
    })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  const order = orderRows[0] ?? null;

  if (!order) {
    return {
      ok: false,
      message: "Order bulunamadı.",
      values,
      errors: {
        form: "Güncelleme yalnızca mevcut bir order kaydına eklenebilir.",
      },
    };
  }

  if ((stage === "testing" || stage === "completed") && !order.vinNumber) {
    return {
      ok: false,
      message: "VIN eksik.",
      values,
      errors: {
        form: "Testing veya Completed güncellemesi eklenmeden önce order kaydına VIN girilmelidir.",
      },
    };
  }

  try {
    await db.insert(productionUpdates).values({
      orderId,
      stage,
      description,
      imageUrl: imageUrl || null,
    });

    await db
      .update(orders)
      .set({
        productionStatus: stage,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);

    return {
      ok: true,
      message: "Üretim güncellemesi eklendi.",
      values: {
        orderId,
        stage,
        description: "",
        imageUrl: "",
      },
      errors: {},
    };
  } catch (error) {
    console.error("saveProductionUpdate error:", error);

    return {
      ok: false,
      message: "Üretim güncellemesi kaydedilemedi.",
      values,
      errors: {
        form: "Kayıt sırasında beklenmeyen bir hata oluştu.",
      },
    };
  }
}