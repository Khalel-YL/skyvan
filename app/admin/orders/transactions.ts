import { and, eq, ne, sql } from "drizzle-orm";

import {
  type StrictAuditActor,
  writeStrictAuditLogInTransaction,
} from "@/app/lib/admin/audit";
import { runDatabaseTransaction, type TransactionClient } from "@/db/db";
import { offers, orders, productionUpdates } from "@/db/schema";

import type {
  OrderFormErrors,
  OrderFormValues,
  ParsedOrderInput,
  ParsedProductionUpdateInput,
  ProductionStatus,
} from "./validation";

type OrderAuditState = {
  id: string;
  offerId: string;
  productionStatus: ProductionStatus;
  estimatedDeliveryDate: string | null;
  vinNumber: string | null;
};

type ProductionUpdateAuditState = {
  id: string;
  orderId: string;
  stage: string;
  description: string;
  imageUrl: string | null;
};

export class OrderMutationError extends Error {
  constructor(
    message: string,
    public readonly errors?: OrderFormErrors,
  ) {
    super(message);
    this.name = "OrderMutationError";
  }
}

export class OrderNoopMutation extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrderNoopMutation";
  }
}

const orderReturningFields = {
  id: orders.id,
  offerId: orders.offerId,
  productionStatus: orders.productionStatus,
  estimatedDeliveryDate: orders.estimatedDeliveryDate,
  vinNumber: orders.vinNumber,
  createdAt: orders.createdAt,
  updatedAt: orders.updatedAt,
};

const productionUpdateReturningFields = {
  id: productionUpdates.id,
  orderId: productionUpdates.orderId,
  stage: productionUpdates.stage,
  description: productionUpdates.description,
  imageUrl: productionUpdates.imageUrl,
  createdAt: productionUpdates.createdAt,
};

async function acquireMutationLock(tx: TransactionClient, lockKey: string) {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${lockKey}))`);
}

function toOrderAuditState(row: OrderAuditState): OrderAuditState {
  return {
    id: row.id,
    offerId: row.offerId,
    productionStatus: row.productionStatus,
    estimatedDeliveryDate: row.estimatedDeliveryDate,
    vinNumber: row.vinNumber,
  };
}

function toProductionUpdateAuditState(
  row: ProductionUpdateAuditState,
): ProductionUpdateAuditState {
  return {
    id: row.id,
    orderId: row.orderId,
    stage: row.stage,
    description: row.description,
    imageUrl: row.imageUrl,
  };
}

function hasOrderChanged(previous: OrderAuditState, next: OrderAuditState) {
  return (
    previous.offerId !== next.offerId ||
    previous.productionStatus !== next.productionStatus ||
    previous.estimatedDeliveryDate !== next.estimatedDeliveryDate ||
    previous.vinNumber !== next.vinNumber
  );
}

function buildOrderFormValues(row: OrderAuditState): OrderFormValues {
  return {
    id: row.id,
    offerId: row.offerId,
    productionStatus: row.productionStatus,
    estimatedDeliveryDate: row.estimatedDeliveryDate ?? "",
    vinNumber: row.vinNumber ?? "",
  };
}

async function assertOfferExists(
  tx: TransactionClient,
  offerId: string,
) {
  const offerRows = await tx
    .select({
      id: offers.id,
      status: offers.status,
    })
    .from(offers)
    .where(eq(offers.id, offerId))
    .limit(1);

  const offer = offerRows[0] ?? null;

  if (!offer) {
    throw new OrderMutationError("Teklif bulunamadı.", {
      form: "Sipariş yalnızca mevcut bir teklif kaydına bağlanabilir.",
    });
  }

  return offer;
}

async function assertOfferIsEligibleForOrderCreation(
  tx: TransactionClient,
  offerId: string,
) {
  const offer = await assertOfferExists(tx, offerId);

  if (offer.status !== "accepted") {
    throw new OrderMutationError("Bu teklif henüz sipariş aşamasına uygun değil.", {
      form: "Sipariş yalnızca kabul edilmiş tekliflerden açılabilir.",
    });
  }

  return offer;
}

async function assertOfferHasNoOtherOrder(
  tx: TransactionClient,
  offerId: string,
  currentOrderId: string,
) {
  const duplicateRows = await tx
    .select({ id: orders.id })
    .from(orders)
    .where(
      currentOrderId
        ? and(eq(orders.offerId, offerId), ne(orders.id, currentOrderId))
        : eq(orders.offerId, offerId),
    )
    .limit(1);

  if (duplicateRows.length > 0) {
    throw new OrderMutationError("Bu teklif için zaten bir sipariş mevcut.", {
      offerId: "Seçilen teklif zaten bir sipariş kaydına bağlı.",
    });
  }
}

async function assertVinAvailable(
  tx: TransactionClient,
  vinNumber: string | null,
  currentOrderId: string,
) {
  if (!vinNumber) {
    return;
  }

  const vinRows = await tx
    .select({ id: orders.id })
    .from(orders)
    .where(eq(orders.vinNumber, vinNumber))
    .limit(1);

  if (vinRows.length > 0 && vinRows[0].id !== currentOrderId) {
    throw new OrderMutationError("VIN zaten kullanımda.", {
      vinNumber: "Bu VIN başka bir sipariş kaydında mevcut.",
    });
  }
}

async function assertOrderCanBeCompleted(
  tx: TransactionClient,
  orderId: string,
) {
  const relatedUpdateRows = await tx
    .select({ id: productionUpdates.id })
    .from(productionUpdates)
    .where(eq(productionUpdates.orderId, orderId))
    .limit(1);

  if (relatedUpdateRows.length === 0) {
    throw new OrderMutationError("Sipariş tamamlanamadı.", {
      form: "Tamamlandı durumuna geçmeden önce en az bir üretim güncellemesi eklenmeli.",
    });
  }
}

export async function saveOrderInTransaction(
  input: ParsedOrderInput,
  actor: StrictAuditActor,
) {
  return runDatabaseTransaction(async (tx) => {
    if (input.id) {
      await acquireMutationLock(tx, `order:${input.id}`);

      const existingRows = await tx
        .select(orderReturningFields)
        .from(orders)
        .where(eq(orders.id, input.id))
        .limit(1);

      const existingOrder = existingRows[0] ?? null;

      if (!existingOrder) {
        throw new OrderMutationError("Düzenlenecek sipariş kaydı bulunamadı.", {
          form: "Sipariş kaydı artık mevcut değil. Listeyi yenileyip tekrar dene.",
        });
      }

      if (input.offerId !== existingOrder.offerId) {
        throw new OrderMutationError("Teklif bağı değiştirilemez.", {
          offerId: "Siparişin bağlı olduğu teklif korunur.",
        });
      }

      await assertOfferExists(tx, existingOrder.offerId);
      await assertOfferHasNoOtherOrder(tx, existingOrder.offerId, existingOrder.id);
      await assertVinAvailable(tx, input.vinNumber, existingOrder.id);

      if (input.productionStatus === "completed") {
        await assertOrderCanBeCompleted(tx, existingOrder.id);
      }

      const nextAuditState: OrderAuditState = {
        id: existingOrder.id,
        offerId: existingOrder.offerId,
        productionStatus: input.productionStatus,
        estimatedDeliveryDate: input.estimatedDeliveryDate,
        vinNumber: input.vinNumber,
      };

      if (!hasOrderChanged(existingOrder, nextAuditState)) {
        throw new OrderNoopMutation("Sipariş üzerinde kaydedilecek değişiklik yok.");
      }

      const updatedRows = await tx
        .update(orders)
        .set({
          productionStatus: input.productionStatus,
          estimatedDeliveryDate: input.estimatedDeliveryDate,
          vinNumber: input.vinNumber,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, existingOrder.id))
        .returning(orderReturningFields);

      const updatedOrder = updatedRows[0] ?? null;

      if (!updatedOrder) {
        throw new OrderMutationError("Sipariş güncellenemedi.", {
          form: "Sipariş kaydı işlem sırasında bulunamadı. Listeyi yenileyip tekrar dene.",
        });
      }

      await writeStrictAuditLogInTransaction(tx, {
        entityType: "order",
        entityId: updatedOrder.id,
        action: "update",
        previousState: toOrderAuditState(existingOrder),
        newState: toOrderAuditState(updatedOrder),
        actor,
      });

      return {
        id: updatedOrder.id,
        values: buildOrderFormValues(updatedOrder),
      };
    }

    await acquireMutationLock(tx, `offer:${input.offerId}`);
    await acquireMutationLock(tx, `order-offer:${input.offerId}`);
    await assertOfferIsEligibleForOrderCreation(tx, input.offerId);
    await assertOfferHasNoOtherOrder(tx, input.offerId, "");
    await assertVinAvailable(tx, input.vinNumber, "");

    if (input.productionStatus === "completed") {
      throw new OrderMutationError("Sipariş tamamlandı durumunda oluşturulamaz.", {
        productionStatus:
          "Tamamlandı durumu için önce sipariş açılmalı ve üretim güncellemesi eklenmelidir.",
      });
    }

    const insertedRows = await tx
      .insert(orders)
      .values({
        offerId: input.offerId,
        productionStatus: input.productionStatus,
        estimatedDeliveryDate: input.estimatedDeliveryDate,
        vinNumber: input.vinNumber,
      })
      .returning(orderReturningFields);

    const insertedOrder = insertedRows[0] ?? null;

    if (!insertedOrder) {
      throw new OrderMutationError("Sipariş oluşturulamadı.", {
        form: "Sipariş kaydı oluşturulurken beklenmeyen bir hata oluştu.",
      });
    }

    await writeStrictAuditLogInTransaction(tx, {
      entityType: "order",
      entityId: insertedOrder.id,
      action: "create",
      newState: toOrderAuditState(insertedOrder),
      actor,
    });

    return {
      id: insertedOrder.id,
      values: buildOrderFormValues(insertedOrder),
    };
  });
}

export async function saveProductionUpdateInTransaction(
  input: ParsedProductionUpdateInput,
  actor: StrictAuditActor,
) {
  return runDatabaseTransaction(async (tx) => {
    await acquireMutationLock(tx, `order:${input.orderId}`);

    const existingRows = await tx
      .select(orderReturningFields)
      .from(orders)
      .where(eq(orders.id, input.orderId))
      .limit(1);

    const existingOrder = existingRows[0] ?? null;

    if (!existingOrder) {
      throw new OrderMutationError("Sipariş bulunamadı.", {
        form: "Güncelleme yalnızca mevcut bir sipariş kaydına eklenebilir.",
      });
    }

    if ((input.stage === "testing" || input.stage === "completed") && !existingOrder.vinNumber) {
      throw new OrderMutationError("VIN eksik.", {
        form: "Test veya tamamlandı güncellemesi eklenmeden önce sipariş kaydına VIN girilmelidir.",
      });
    }

    await assertOfferExists(tx, existingOrder.offerId);

    const insertedUpdateRows = await tx
      .insert(productionUpdates)
      .values({
        orderId: input.orderId,
        stage: input.stage,
        description: input.description,
        imageUrl: input.imageUrl,
      })
      .returning(productionUpdateReturningFields);

    const insertedUpdate = insertedUpdateRows[0] ?? null;

    if (!insertedUpdate) {
      throw new OrderMutationError("Üretim güncellemesi oluşturulamadı.", {
        form: "Üretim güncellemesi kaydedilirken beklenmeyen bir hata oluştu.",
      });
    }

    await writeStrictAuditLogInTransaction(tx, {
      entityType: "production_update",
      entityId: insertedUpdate.id,
      action: "create",
      newState: toProductionUpdateAuditState(insertedUpdate),
      actor,
    });

    if (input.stage !== existingOrder.productionStatus) {
      const updatedRows = await tx
        .update(orders)
        .set({
          productionStatus: input.stage,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, input.orderId))
        .returning(orderReturningFields);

      const updatedOrder = updatedRows[0] ?? null;

      if (!updatedOrder) {
        throw new OrderMutationError("Sipariş durumu güncellenemedi.", {
          form: "Sipariş kaydı işlem sırasında bulunamadı. Listeyi yenileyip tekrar dene.",
        });
      }

      await writeStrictAuditLogInTransaction(tx, {
        entityType: "order",
        entityId: updatedOrder.id,
        action: "update",
        previousState: toOrderAuditState(existingOrder),
        newState: toOrderAuditState(updatedOrder),
        actor,
      });

      return updatedOrder.id;
    }

    return existingOrder.id;
  });
}
