import { count, eq, sql } from "drizzle-orm";

import { runDatabaseTransaction, type TransactionClient } from "@/db/db";
import { buildVersions, leads, offers } from "@/db/schema";
import {
  type StrictAuditActor,
  writeStrictAuditLogInTransaction,
} from "@/app/lib/admin/audit";

import type { LeadStatus } from "./types";
import { normalizeOptionalLeadText } from "./validation";

type LeadMutationInput = {
  id: string;
  buildVersionId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  whatsappOptIn: boolean;
  status: LeadStatus;
};

type LeadStatusMutationInput = {
  id: string;
  status: LeadStatus;
};

type LeadAuditState = {
  id: string;
  buildVersionId: string;
  fullName: string;
  email: string | null;
  phoneNumber: string | null;
  whatsappOptIn: boolean;
  status: LeadStatus;
  createdAt: Date;
};

export class LeadMutationError extends Error {
  fieldErrors?: {
    buildVersionId?: string;
    form?: string;
  };

  constructor(
    message: string,
    fieldErrors?: {
      buildVersionId?: string;
      form?: string;
    },
  ) {
    super(message);
    this.fieldErrors = fieldErrors;
  }
}

export class LeadNoopMutation extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LeadNoopMutation";
  }
}

async function acquireMutationLock(tx: TransactionClient, lockKey: string) {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${lockKey}))`);
}

function toLeadAuditState(row: LeadAuditState): LeadAuditState {
  return {
    id: row.id,
    buildVersionId: row.buildVersionId,
    fullName: row.fullName,
    email: row.email,
    phoneNumber: row.phoneNumber,
    whatsappOptIn: row.whatsappOptIn,
    status: row.status,
    createdAt: row.createdAt,
  };
}

const leadReturningFields = {
  id: leads.id,
  buildVersionId: leads.buildVersionId,
  fullName: leads.fullName,
  email: leads.email,
  phoneNumber: leads.phoneNumber,
  whatsappOptIn: leads.whatsappOptIn,
  status: leads.status,
  createdAt: leads.createdAt,
};

function hasLeadChanged(previous: LeadAuditState, next: LeadAuditState) {
  return (
    previous.buildVersionId !== next.buildVersionId ||
    previous.fullName !== next.fullName ||
    previous.email !== next.email ||
    previous.phoneNumber !== next.phoneNumber ||
    previous.whatsappOptIn !== next.whatsappOptIn ||
    previous.status !== next.status
  );
}

async function assertBuildVersionExists(
  tx: TransactionClient,
  buildVersionId: string,
) {
  const buildVersionRows = await tx
    .select({ id: buildVersions.id })
    .from(buildVersions)
    .where(eq(buildVersions.id, buildVersionId))
    .limit(1);

  if (!buildVersionRows[0]) {
    throw new LeadMutationError("Seçilen build versiyonu bulunamadı.", {
      buildVersionId: "Geçerli bir build versiyonu seç.",
    });
  }
}

export async function saveLeadInTransaction(
  input: LeadMutationInput,
  actor: StrictAuditActor,
) {
  return runDatabaseTransaction(async (tx) => {
    await assertBuildVersionExists(tx, input.buildVersionId);

    if (input.id) {
      await acquireMutationLock(tx, `lead:${input.id}`);

      const existingRows = await tx
        .select(leadReturningFields)
        .from(leads)
        .where(eq(leads.id, input.id))
        .limit(1);

      const existingLead = existingRows[0] ?? null;

      if (!existingLead) {
        throw new LeadMutationError("Düzenlenmek istenen lead kaydı bulunamadı.", {
          form: "Lead kaydı artık mevcut değil. Listeyi yenileyip tekrar dene.",
        });
      }

      const nextAuditState: LeadAuditState = {
        id: existingLead.id,
        buildVersionId: input.buildVersionId,
        fullName: input.fullName,
        email: normalizeOptionalLeadText(input.email),
        phoneNumber: normalizeOptionalLeadText(input.phoneNumber),
        whatsappOptIn: input.whatsappOptIn,
        status: input.status,
        createdAt: existingLead.createdAt,
      };

      if (!hasLeadChanged(existingLead, nextAuditState)) {
        throw new LeadNoopMutation("Lead üzerinde kaydedilecek değişiklik yok.");
      }

      const updatedRows = await tx
        .update(leads)
        .set({
          buildVersionId: input.buildVersionId,
          fullName: input.fullName,
          email: normalizeOptionalLeadText(input.email),
          phoneNumber: normalizeOptionalLeadText(input.phoneNumber),
          whatsappOptIn: input.whatsappOptIn,
          status: input.status,
        })
        .where(eq(leads.id, input.id))
        .returning(leadReturningFields);

      const updatedLead = updatedRows[0] ?? null;

      if (!updatedLead) {
        throw new LeadMutationError("Lead güncellenemedi.", {
          form: "Lead kaydı işlem sırasında bulunamadı. Listeyi yenileyip tekrar dene.",
        });
      }

      await writeStrictAuditLogInTransaction(tx, {
        entityType: "lead",
        entityId: updatedLead.id,
        action: "update",
        previousState: toLeadAuditState(existingLead),
        newState: toLeadAuditState(updatedLead),
        actor,
      });

      return updatedLead.id;
    }

    const insertedRows = await tx
      .insert(leads)
      .values({
        buildVersionId: input.buildVersionId,
        fullName: input.fullName,
        email: normalizeOptionalLeadText(input.email),
        phoneNumber: normalizeOptionalLeadText(input.phoneNumber),
        whatsappOptIn: input.whatsappOptIn,
        status: input.status,
      })
      .returning(leadReturningFields);

    const insertedLead = insertedRows[0] ?? null;

    if (!insertedLead) {
      throw new LeadMutationError("Lead oluşturulamadı.", {
        form: "Lead kaydı oluşturulurken beklenmeyen bir hata oluştu.",
      });
    }

    await writeStrictAuditLogInTransaction(tx, {
      entityType: "lead",
      entityId: insertedLead.id,
      action: "create",
      newState: toLeadAuditState(insertedLead),
      actor,
    });

    return insertedLead.id;
  });
}

export async function updateLeadStatusInTransaction(
  input: LeadStatusMutationInput,
  actor: StrictAuditActor,
) {
  return runDatabaseTransaction(async (tx) => {
    await acquireMutationLock(tx, `lead:${input.id}`);

    const existingRows = await tx
      .select(leadReturningFields)
      .from(leads)
      .where(eq(leads.id, input.id))
      .limit(1);

    const existingLead = existingRows[0] ?? null;

    if (!existingLead) {
      throw new LeadMutationError("Güncellenecek lead kaydı bulunamadı.", {
        form: "Lead kaydı artık mevcut değil. Listeyi yenileyip tekrar dene.",
      });
    }

    await assertBuildVersionExists(tx, existingLead.buildVersionId);

    if (existingLead.status === input.status) {
      throw new LeadNoopMutation("Lead durumu zaten seçilen değerde.");
    }

    const updatedRows = await tx
      .update(leads)
      .set({
        status: input.status,
      })
      .where(eq(leads.id, input.id))
      .returning(leadReturningFields);

    const updatedLead = updatedRows[0] ?? null;

    if (!updatedLead) {
      throw new LeadMutationError("Lead durumu güncellenemedi.", {
        form: "Lead kaydı işlem sırasında bulunamadı. Listeyi yenileyip tekrar dene.",
      });
    }

    await writeStrictAuditLogInTransaction(tx, {
      entityType: "lead",
      entityId: updatedLead.id,
      action: "update",
      previousState: toLeadAuditState(existingLead),
      newState: toLeadAuditState(updatedLead),
      actor,
    });

    return updatedLead.id;
  });
}

export async function deleteLeadInTransaction(
  id: string,
  actor: StrictAuditActor,
) {
  return runDatabaseTransaction(async (tx) => {
    await acquireMutationLock(tx, `lead:${id}`);

    const existingRows = await tx
      .select(leadReturningFields)
      .from(leads)
      .where(eq(leads.id, id))
      .limit(1);

    const existingLead = existingRows[0] ?? null;

    if (!existingLead) {
      throw new LeadMutationError("Silinecek lead kaydı bulunamadı.", {
        form: "Lead kaydı artık mevcut değil. Listeyi yenileyip tekrar dene.",
      });
    }

    const offerCountRows = await tx
      .select({ count: count(offers.id) })
      .from(offers)
      .where(eq(offers.leadId, id));

    const relatedOfferCount = Number(offerCountRows[0]?.count ?? 0);

    if (relatedOfferCount > 0) {
      throw new LeadMutationError("Lead silinemedi.", {
        form: "Bu lead bağlı teklif içerdiği için silinemez. Önce teklif bağı operasyonel olarak kapatılmalı.",
      });
    }

    const deletedRows = await tx
      .delete(leads)
      .where(eq(leads.id, id))
      .returning({ id: leads.id });

    if (deletedRows.length === 0) {
      throw new LeadMutationError("Lead silinemedi.", {
        form: "Lead kaydı işlem sırasında bulunamadı. Listeyi yenileyip tekrar dene.",
      });
    }

    await writeStrictAuditLogInTransaction(tx, {
      entityType: "lead",
      entityId: existingLead.id,
      action: "delete",
      previousState: toLeadAuditState(existingLead),
      actor,
    });
  });
}
