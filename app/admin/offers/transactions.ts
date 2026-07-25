import { count, eq, like, sql } from "drizzle-orm";

import {
  getOfferMutationBlocker,
  type OfferStatus,
} from "@/app/lib/admin/governance";
import {
  type StrictAuditActor,
  writeStrictAuditLogInTransaction,
} from "@/app/lib/admin/audit";
import { runDatabaseTransaction, type TransactionClient } from "@/db/db";
import { buildVersions, leads, offers, orders } from "@/db/schema";

import {
  isNewFormatOfferReference,
  type OfferFormErrors,
  type ParsedOfferInput,
} from "./validation";

type OfferAuditState = {
  id: string;
  leadId: string;
  offerReference: string;
  validUntil: Date;
  totalAmount: string;
  status: OfferStatus;
  createdAt: Date;
};

export class OfferMutationError extends Error {
  constructor(
    message: string,
    public readonly errors?: OfferFormErrors,
  ) {
    super(message);
    this.name = "OfferMutationError";
  }
}

export class OfferNoopMutation extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OfferNoopMutation";
  }
}

async function acquireMutationLock(tx: TransactionClient, lockKey: string) {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${lockKey}))`);
}

const offerReturningFields = {
  id: offers.id,
  leadId: offers.leadId,
  offerReference: offers.offerReference,
  validUntil: offers.validUntil,
  totalAmount: offers.totalAmount,
  status: offers.status,
  createdAt: offers.createdAt,
};

function toOfferAuditState(row: OfferAuditState): OfferAuditState {
  return {
    id: row.id,
    leadId: row.leadId,
    offerReference: row.offerReference,
    validUntil: row.validUntil,
    totalAmount: String(row.totalAmount),
    status: row.status,
    createdAt: row.createdAt,
  };
}

function sameDateTime(left: Date, right: Date) {
  return new Date(left).getTime() === new Date(right).getTime();
}

function hasOfferChanged(previous: OfferAuditState, next: OfferAuditState) {
  return (
    previous.leadId !== next.leadId ||
    previous.offerReference !== next.offerReference ||
    !sameDateTime(previous.validUntil, next.validUntil) ||
    String(previous.totalAmount) !== String(next.totalAmount) ||
    previous.status !== next.status
  );
}

function getOfferStatusTransitionBlocker(input: {
  previousStatus: OfferStatus | null;
  nextStatus: OfferStatus;
}) {
  return getOfferMutationBlocker({
    previousStatus: input.previousStatus,
    nextStatus: input.nextStatus,
  });
}

async function assertLeadAndBuildVersionExist(
  tx: TransactionClient,
  leadId: string,
) {
  const leadRows = await tx
    .select({
      id: leads.id,
      buildVersionId: leads.buildVersionId,
    })
    .from(leads)
    .where(eq(leads.id, leadId))
    .limit(1);

  const lead = leadRows[0] ?? null;

  if (!lead) {
    throw new OfferMutationError("Seçilen lead bulunamadı.", {
      form: "Teklif yalnızca mevcut bir lead kaydına bağlanabilir.",
    });
  }

  const buildVersionRows = await tx
    .select({ id: buildVersions.id })
    .from(buildVersions)
    .where(eq(buildVersions.id, lead.buildVersionId))
    .limit(1);

  if (!buildVersionRows[0]) {
    throw new OfferMutationError("Lead proje sürümü bulunamadı.", {
      form: "Seçilen lead geçerli bir build version kaydına bağlı olmadığı için teklif oluşturulamaz.",
    });
  }

  return lead;
}

async function generateOfferReference(tx: TransactionClient) {
  const year = new Date().getFullYear();

  await acquireMutationLock(tx, `offer-reference:${year}`);

  const referenceRows = await tx
    .select({
      offerReference: offers.offerReference,
    })
    .from(offers)
    .where(like(offers.offerReference, `OFF-${year}-%`));

  let maxSequence = 0;

  for (const row of referenceRows) {
    const match = row.offerReference.match(/^OFF-(\d{4})-(\d{4,})$/);

    if (!match) continue;
    if (Number(match[1]) !== year) continue;

    const sequence = Number(match[2]);

    if (!Number.isNaN(sequence) && sequence > maxSequence) {
      maxSequence = sequence;
    }
  }

  return `OFF-${year}-${String(maxSequence + 1).padStart(4, "0")}`;
}

async function resolveOfferReference(tx: TransactionClient, input: {
  rawOfferReference: string;
  existingOffer: OfferAuditState | null;
}) {
  if (!input.rawOfferReference) {
    return input.existingOffer?.offerReference ?? (await generateOfferReference(tx));
  }

  if (input.existingOffer && input.rawOfferReference === input.existingOffer.offerReference) {
    return input.existingOffer.offerReference;
  }

  return input.rawOfferReference.toUpperCase();
}

async function assertOfferReferenceAvailable(
  tx: TransactionClient,
  input: {
    offerReference: string;
    currentOfferId: string;
  },
) {
  const conflictingRows = await tx
    .select({ id: offers.id })
    .from(offers)
    .where(eq(offers.offerReference, input.offerReference))
    .limit(1);

  if (
    conflictingRows.length > 0 &&
    conflictingRows[0].id !== input.currentOfferId
  ) {
    throw new OfferMutationError("Teklif referansı zaten kullanımda.", {
      offerReference: "Bu teklif referansı zaten kayıtlı.",
    });
  }
}

export async function saveOfferInTransaction(
  input: ParsedOfferInput,
  actor: StrictAuditActor,
) {
  return runDatabaseTransaction(async (tx) => {
    await assertLeadAndBuildVersionExist(tx, input.leadId);

    if (input.id) {
      await acquireMutationLock(tx, `offer:${input.id}`);
    }

    const existingRows = input.id
      ? await tx
          .select(offerReturningFields)
          .from(offers)
          .where(eq(offers.id, input.id))
          .limit(1)
      : [];

    const existingOffer = existingRows[0] ?? null;

    if (input.id && !existingOffer) {
      throw new OfferMutationError("Güncellenecek teklif kaydı bulunamadı.", {
        form: "Teklif kaydı artık mevcut değil. Listeyi yenileyip tekrar dene.",
      });
    }

    const offerReference = await resolveOfferReference(tx, {
      rawOfferReference: input.rawOfferReference,
      existingOffer,
    });

    const isExistingLegacyReference =
      existingOffer !== null && offerReference === existingOffer.offerReference;

    if (!isNewFormatOfferReference(offerReference) && !isExistingLegacyReference) {
      throw new OfferMutationError("Teklif referans formatı geçersiz.", {
        offerReference: "Referans formatı OFF-YYYY-0001 şeklinde olmalıdır.",
      });
    }

    await assertOfferReferenceAvailable(tx, {
      offerReference,
      currentOfferId: input.id,
    });

    const statusBlocker = getOfferStatusTransitionBlocker({
      previousStatus: existingOffer?.status ?? null,
      nextStatus: input.status,
    });

    if (statusBlocker) {
      throw new OfferMutationError("Teklif durumu güncellenemedi.", {
        form: statusBlocker,
      });
    }

    if (existingOffer) {
      const nextAuditState: OfferAuditState = {
        id: existingOffer.id,
        leadId: input.leadId,
        offerReference,
        validUntil: input.parsedValidUntil,
        totalAmount: input.totalAmount,
        status: input.status,
        createdAt: existingOffer.createdAt,
      };

      if (!hasOfferChanged(existingOffer, nextAuditState)) {
        throw new OfferNoopMutation("Teklif üzerinde kaydedilecek değişiklik yok.");
      }

      const updatedRows = await tx
        .update(offers)
        .set({
          leadId: input.leadId,
          offerReference,
          validUntil: input.parsedValidUntil,
          totalAmount: input.totalAmount,
          status: input.status,
        })
        .where(eq(offers.id, existingOffer.id))
        .returning(offerReturningFields);

      const updatedOffer = updatedRows[0] ?? null;

      if (!updatedOffer) {
        throw new OfferMutationError("Teklif güncellenemedi.", {
          form: "Teklif kaydı işlem sırasında bulunamadı. Listeyi yenileyip tekrar dene.",
        });
      }

      await writeStrictAuditLogInTransaction(tx, {
        entityType: "offer",
        entityId: updatedOffer.id,
        action: "update",
        previousState: toOfferAuditState(existingOffer),
        newState: toOfferAuditState(updatedOffer),
        actor,
      });

      return {
        id: updatedOffer.id,
        offerReference: updatedOffer.offerReference,
      };
    }

    const insertedRows = await tx
      .insert(offers)
      .values({
        leadId: input.leadId,
        offerReference,
        validUntil: input.parsedValidUntil,
        totalAmount: input.totalAmount,
        status: input.status,
      })
      .returning(offerReturningFields);

    const insertedOffer = insertedRows[0] ?? null;

    if (!insertedOffer) {
      throw new OfferMutationError("Teklif oluşturulamadı.", {
        form: "Teklif kaydı oluşturulurken beklenmeyen bir hata oluştu.",
      });
    }

    await writeStrictAuditLogInTransaction(tx, {
      entityType: "offer",
      entityId: insertedOffer.id,
      action: "create",
      newState: toOfferAuditState(insertedOffer),
      actor,
    });

    return {
      id: insertedOffer.id,
      offerReference: insertedOffer.offerReference,
    };
  });
}

export async function deleteOfferInTransaction(
  id: string,
  actor: StrictAuditActor,
) {
  return runDatabaseTransaction(async (tx) => {
    await acquireMutationLock(tx, `offer:${id}`);

    const existingRows = await tx
      .select(offerReturningFields)
      .from(offers)
      .where(eq(offers.id, id))
      .limit(1);

    const existingOffer = existingRows[0] ?? null;

    if (!existingOffer) {
      throw new OfferMutationError("Silinecek teklif kaydı bulunamadı.", {
        form: "Teklif kaydı artık mevcut değil. Listeyi yenileyip tekrar dene.",
      });
    }

    await assertLeadAndBuildVersionExist(tx, existingOffer.leadId);

    const deleteBlocker = getOfferStatusTransitionBlocker({
      previousStatus: existingOffer.status,
      nextStatus: "draft",
    });

    if (deleteBlocker) {
      throw new OfferMutationError("Teklif silinemedi.", {
        form: deleteBlocker,
      });
    }

    const orderCountRows = await tx
      .select({ count: count(orders.id) })
      .from(orders)
      .where(eq(orders.offerId, id));

    const dependentOrderCount = Number(orderCountRows[0]?.count ?? 0);

    if (dependentOrderCount > 0) {
      throw new OfferMutationError("Teklif silinemedi.", {
        form: "Bu teklif bağlı sipariş içerdiği için silinemez. Sipariş kaydı korunmalıdır.",
      });
    }

    const deletedRows = await tx
      .delete(offers)
      .where(eq(offers.id, id))
      .returning({ id: offers.id });

    if (deletedRows.length === 0) {
      throw new OfferMutationError("Teklif silinemedi.", {
        form: "Teklif kaydı işlem sırasında bulunamadı. Listeyi yenileyip tekrar dene.",
      });
    }

    await writeStrictAuditLogInTransaction(tx, {
      entityType: "offer",
      entityId: existingOffer.id,
      action: "delete",
      previousState: toOfferAuditState(existingOffer),
      actor,
    });
  });
}
