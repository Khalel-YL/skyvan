"use server";

import { and, asc, desc, eq, inArray, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  type AuditInsertDatabase,
  AuditActorBindingError,
  type StrictAuditActor,
  requireStrictAuditActor,
  writeStrictAuditLogInTransaction,
} from "@/app/lib/admin/audit";
import { getDbOrThrow } from "@/db/db";
import {
  aiDocumentChunks,
  aiEmbeddings,
  aiKnowledgeDocuments,
  categories,
  productDocuments,
  products,
} from "@/db/schema";
import {
  createProductDocumentSchema,
  productDocumentFiltersSchema,
  restoreProductDocumentSchema,
  updateProductDocumentSchema,
} from "./schema";
import { alignLegacyActiveProducts } from "../../actions";
import {
  buildDocumentDuplicateKey,
  emptyToNull,
  normalizeDocumentUrl,
  stringIntegerToNumber,
} from "./lib";
import type {
  ProductDocumentActionState,
  ProductDocumentFilters,
  ProductDocumentListItem,
  ProductDocumentType,
  ProductDocumentsPageProduct,
} from "./types";

type KnowledgeDocType = "datasheet" | "manual" | "rulebook";
type KnowledgeParsingStatus = "pending" | "processing" | "completed" | "failed";

type LockableDatabase = Pick<ReturnType<typeof getDbOrThrow>, "execute">;
type TransactionDatabase = Parameters<
  Parameters<ReturnType<typeof getDbOrThrow>["transaction"]>[0]
>[0];

type ProductDocumentIngestionRecord = {
  id: string;
  productId: string;
  type: ProductDocumentType;
  title: string;
  url: string;
  note: string | null;
  status: "draft" | "active" | "archived";
  productName: string;
  productSlug: string;
  productSku: string;
  productStatus: "draft" | "active" | "archived";
  categoryName: string;
};

type ProductDocumentRecord = {
  id: string;
  productId: string;
  type: ProductDocumentType;
  title: string;
  url: string;
  note: string | null;
  sortOrder: number;
  status: "draft" | "active" | "archived";
  createdAt: Date;
  updatedAt: Date;
};

type KnowledgeDocumentRecord = {
  id: string;
  productId: string | null;
  title: string;
  docType: KnowledgeDocType;
  s3Key: string;
  parsingStatus: KnowledgeParsingStatus;
  lastError: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type GeneratedChunk = {
  chunkIndex: number;
  contentText: string;
  pageNumber: number | null;
  tokenCount: number;
};

const uuidSchema = z.string().uuid();
const DOCUMENT_FETCH_TIMEOUT_MS = 10_000;
const MAX_CHUNK_LENGTH = 680;

function db() {
  return getDbOrThrow();
}

function isValidUuid(value: string) {
  return uuidSchema.safeParse(value).success;
}

function buildErrorState(
  message: string,
  errors?: Record<string, string[]>,
): ProductDocumentActionState {
  return {
    ok: false,
    message,
    errors,
  };
}

function isPgUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23505"
  );
}

function mapProductDocumentTypeToKnowledgeDocType(
  value: ProductDocumentType,
): KnowledgeDocType {
  switch (value) {
    case "datasheet":
      return "datasheet";
    case "install_manual":
    case "user_manual":
      return "manual";
    case "warranty":
    case "certificate":
    case "technical_note":
    default:
      return "rulebook";
  }
}

function getCanonicalKnowledgeKey(value: string) {
  return normalizeDocumentUrl(value);
}

function estimateTokenCount(value: string) {
  const tokens = value
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  return Math.max(tokens, 1);
}

function normalizeExtractedText(value: string) {
  return value
    .replace(/\r/g, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]+/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function stripHtmlTags(value: string) {
  return normalizeExtractedText(
    value
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<\/div>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">"),
  );
}

function extractAsciiTextFromBytes(bytes: Uint8Array) {
  const segments: string[] = [];
  let current = "";

  for (const byte of bytes) {
    const isPrintable =
      byte === 9 || byte === 10 || byte === 13 || (byte >= 32 && byte <= 126);

    if (isPrintable) {
      current += String.fromCharCode(byte);
      continue;
    }

    if (current.trim().length >= 4) {
      segments.push(current);
    }

    current = "";
  }

  if (current.trim().length >= 4) {
    segments.push(current);
  }

  return normalizeExtractedText(segments.join("\n"));
}

function decodeBinaryDocument(buffer: ArrayBuffer) {
  const utf8Text = normalizeExtractedText(new TextDecoder().decode(buffer));

  if (utf8Text.length >= 80) {
    return utf8Text;
  }

  return extractAsciiTextFromBytes(new Uint8Array(buffer));
}

function isHtmlLikeContent(contentType: string, value: string) {
  return (
    contentType.includes("html") ||
    /<html|<body|<main|<article|<section|<div|<p\b/i.test(value)
  );
}

function splitIntoChunks(value: string) {
  const normalizedValue = normalizeExtractedText(value);

  if (!normalizedValue) {
    return [] as GeneratedChunk[];
  }

  const paragraphs = normalizedValue
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) {
    return [] as GeneratedChunk[];
  }

  const chunks: GeneratedChunk[] = [];
  let currentBuffer: string[] = [];
  let currentLength = 0;

  for (const paragraph of paragraphs) {
    const nextLength =
      currentLength + paragraph.length + (currentBuffer.length > 0 ? 2 : 0);

    if (currentBuffer.length > 0 && nextLength > MAX_CHUNK_LENGTH) {
      const contentText = currentBuffer.join("\n\n");
      chunks.push({
        chunkIndex: chunks.length,
        contentText,
        pageNumber: chunks.length + 1,
        tokenCount: estimateTokenCount(contentText),
      });

      currentBuffer = [paragraph];
      currentLength = paragraph.length;
      continue;
    }

    currentBuffer.push(paragraph);
    currentLength = nextLength;
  }

  if (currentBuffer.length > 0) {
    const contentText = currentBuffer.join("\n\n");
    chunks.push({
      chunkIndex: chunks.length,
      contentText,
      pageNumber: chunks.length + 1,
      tokenCount: estimateTokenCount(contentText),
    });
  }

  return chunks;
}

async function fetchDocumentText(document: ProductDocumentIngestionRecord) {
  console.log("AI ingestion fetch start", {
    productDocumentId: document.id,
    url: document.url,
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DOCUMENT_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(document.url, {
      signal: controller.signal,
      cache: "no-store",
      redirect: "follow",
    });

    if (!response.ok) {
      throw new Error(`Belge fetch başarısız: HTTP ${response.status}`);
    }

    const contentType = String(
      response.headers.get("content-type") ?? "",
    ).toLowerCase();

    console.log("AI ingestion fetch success", {
      productDocumentId: document.id,
      url: document.url,
      contentType: contentType || "unknown",
      status: response.status,
    });

    console.log("AI ingestion parse start", {
      productDocumentId: document.id,
      url: document.url,
      contentType: contentType || "unknown",
    });

    if (
      contentType.includes("text/") ||
      contentType.includes("json") ||
      contentType.includes("xml") ||
      contentType.includes("html")
    ) {
      const responseText = await response.text();

      return isHtmlLikeContent(contentType, responseText)
        ? stripHtmlTags(responseText)
        : normalizeExtractedText(responseText);
    }

    const responseBuffer = await response.arrayBuffer();
    return decodeBinaryDocument(responseBuffer);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Belge fetch zaman aşımına uğradı (10s).");
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Belge fetch sırasında beklenmeyen bir hata oluştu.");
  } finally {
    clearTimeout(timeout);
  }
}

function buildGeneratedChunks(extractedText: string) {
  const chunks = splitIntoChunks(extractedText);

  if (chunks.length === 0) {
    throw new Error("Belgeden işlenebilir metin çıkarılamadı.");
  }

  return chunks;
}

function buildReadableErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message.trim() || "Beklenmeyen ingestion hatası oluştu.";
  }

  return "Beklenmeyen ingestion hatası oluştu.";
}

function buildKnowledgeAuditState(
  document: KnowledgeDocumentRecord,
  meta: {
    productDocumentId: string;
    sourceType: ProductDocumentType;
    chunkCount?: number;
  },
) {
  return {
    id: document.id,
    productId: document.productId,
    title: document.title,
    docType: document.docType,
    s3Key: document.s3Key,
    parsingStatus: document.parsingStatus,
    lastError: document.lastError,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
    __meta: {
      productDocumentId: meta.productDocumentId,
      sourceType: meta.sourceType,
      chunkCount: meta.chunkCount ?? null,
    },
  };
}

function buildProductDocumentAuditState(document: ProductDocumentRecord) {
  return {
    id: document.id,
    productId: document.productId,
    type: document.type,
    title: document.title,
    url: document.url,
    note: document.note,
    sortOrder: document.sortOrder,
    status: document.status,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
}

async function lockKnowledgeIngestion(
  database: LockableDatabase,
  canonicalKey: string,
) {
  await database.execute(
    sql`select pg_advisory_xact_lock(hashtext(${canonicalKey}))`,
  );
}

async function writeKnowledgeAudit(input: {
  database: AuditInsertDatabase;
  actor: StrictAuditActor;
  entityId: string;
  action: "create" | "update";
  previousState?: unknown;
  newState?: unknown;
}) {
  await writeStrictAuditLogInTransaction(input.database, {
    entityType: "ai_knowledge_document",
    entityId: input.entityId,
    action: input.action,
    previousState: input.previousState,
    newState: input.newState,
    actor: input.actor,
  });
}

async function deleteKnowledgeChunksInTransaction(
  database: TransactionDatabase,
  documentId: string,
) {
  const existingChunkRows = await database
    .select({
      id: aiDocumentChunks.id,
    })
    .from(aiDocumentChunks)
    .where(eq(aiDocumentChunks.documentId, documentId));

  const existingChunkIds = existingChunkRows.map((row) => row.id);

  if (existingChunkIds.length > 0) {
    await database
      .delete(aiEmbeddings)
      .where(inArray(aiEmbeddings.chunkId, existingChunkIds));
  }

  await database
    .delete(aiDocumentChunks)
    .where(eq(aiDocumentChunks.documentId, documentId));
}

async function syncKnowledgeFromProductDocumentInTransaction(input: {
  database: TransactionDatabase;
  actor: StrictAuditActor;
  document: ProductDocumentRecord;
  previousDocument?: ProductDocumentRecord | null;
}) {
  const currentCanonicalKey = getCanonicalKnowledgeKey(input.document.url);

  if (!currentCanonicalKey) {
    return null;
  }

  const previousCanonicalKey = input.previousDocument
    ? getCanonicalKnowledgeKey(input.previousDocument.url)
    : null;

  const candidateKeys = Array.from(
    new Set(
      [currentCanonicalKey, previousCanonicalKey].filter(
        (value): value is string => Boolean(value),
      ),
    ),
  );

  for (const candidateKey of candidateKeys) {
    await lockKnowledgeIngestion(input.database, candidateKey);
  }

  const candidateRows =
    candidateKeys.length > 0
      ? await input.database
          .select({
            id: aiKnowledgeDocuments.id,
            productId: aiKnowledgeDocuments.productId,
            title: aiKnowledgeDocuments.title,
            docType: aiKnowledgeDocuments.docType,
            s3Key: aiKnowledgeDocuments.s3Key,
            parsingStatus: aiKnowledgeDocuments.parsingStatus,
            lastError: aiKnowledgeDocuments.lastError,
            createdAt: aiKnowledgeDocuments.createdAt,
            updatedAt: aiKnowledgeDocuments.updatedAt,
          })
          .from(aiKnowledgeDocuments)
          .where(inArray(aiKnowledgeDocuments.s3Key, candidateKeys))
          .orderBy(
            desc(aiKnowledgeDocuments.updatedAt),
            desc(aiKnowledgeDocuments.createdAt),
          )
      : [];

  const currentKnowledgeDocument =
    candidateRows.find((row) => row.s3Key === currentCanonicalKey) ?? null;
  const previousKnowledgeDocument =
    previousCanonicalKey && previousCanonicalKey !== currentCanonicalKey
      ? (candidateRows.find((row) => row.s3Key === previousCanonicalKey) ?? null)
      : null;
  const existingKnowledgeDocument =
    currentKnowledgeDocument ?? previousKnowledgeDocument;

  if (!existingKnowledgeDocument && input.document.status !== "active") {
    return null;
  }

  const nextDocType = mapProductDocumentTypeToKnowledgeDocType(input.document.type);
  const previousDocType = input.previousDocument
    ? mapProductDocumentTypeToKnowledgeDocType(input.previousDocument.type)
    : null;
  const sourceIdentityChanged =
    Boolean(input.previousDocument) &&
    (currentCanonicalKey !== previousCanonicalKey || nextDocType !== previousDocType);
  const sourceReactivated =
    input.document.status === "active" &&
    input.previousDocument?.status !== "active";
  const shouldResetLifecycle =
    Boolean(existingKnowledgeDocument) &&
    (sourceIdentityChanged || sourceReactivated || input.document.status !== "active");

  if (shouldResetLifecycle && existingKnowledgeDocument) {
    await deleteKnowledgeChunksInTransaction(
      input.database,
      existingKnowledgeDocument.id,
    );
  }

  if (existingKnowledgeDocument) {
    const nextParsingStatus: KnowledgeParsingStatus =
      input.document.status !== "active"
        ? "failed"
        : sourceIdentityChanged || sourceReactivated
          ? "pending"
          : existingKnowledgeDocument.parsingStatus;

    const nextLastError =
      input.document.status !== "active"
        ? "Kaynak belge aktif değil, AI işleme alınamaz."
        : sourceIdentityChanged || sourceReactivated
          ? null
          : existingKnowledgeDocument.lastError;

    const needsUpdate =
      existingKnowledgeDocument.productId !== input.document.productId ||
      existingKnowledgeDocument.title !== input.document.title ||
      existingKnowledgeDocument.docType !== nextDocType ||
      existingKnowledgeDocument.s3Key !== currentCanonicalKey ||
      existingKnowledgeDocument.parsingStatus !== nextParsingStatus ||
      (existingKnowledgeDocument.lastError ?? null) !== (nextLastError ?? null);

    if (!needsUpdate) {
      return existingKnowledgeDocument;
    }

    const updatedRows = await input.database
      .update(aiKnowledgeDocuments)
      .set({
        productId: input.document.productId,
        title: input.document.title,
        docType: nextDocType,
        s3Key: currentCanonicalKey,
        parsingStatus: nextParsingStatus,
        lastError: nextLastError,
        updatedAt: new Date(),
      })
      .where(eq(aiKnowledgeDocuments.id, existingKnowledgeDocument.id))
      .returning({
        id: aiKnowledgeDocuments.id,
        productId: aiKnowledgeDocuments.productId,
        title: aiKnowledgeDocuments.title,
        docType: aiKnowledgeDocuments.docType,
        s3Key: aiKnowledgeDocuments.s3Key,
        parsingStatus: aiKnowledgeDocuments.parsingStatus,
        lastError: aiKnowledgeDocuments.lastError,
        createdAt: aiKnowledgeDocuments.createdAt,
        updatedAt: aiKnowledgeDocuments.updatedAt,
      });

    const updatedKnowledgeDocument =
      (updatedRows[0] as KnowledgeDocumentRecord | undefined) ?? null;

    if (!updatedKnowledgeDocument) {
      throw new Error("AI knowledge kaydı kaynak belge ile senkronize edilemedi.");
    }

    await writeKnowledgeAudit({
      database: input.database,
      actor: input.actor,
      entityId: updatedKnowledgeDocument.id,
      action: "update",
      previousState: buildKnowledgeAuditState(existingKnowledgeDocument, {
        productDocumentId: input.document.id,
        sourceType: input.document.type,
      }),
      newState: buildKnowledgeAuditState(updatedKnowledgeDocument, {
        productDocumentId: input.document.id,
        sourceType: input.document.type,
      }),
    });

    return updatedKnowledgeDocument;
  }

  const insertedRows = await input.database
    .insert(aiKnowledgeDocuments)
    .values({
      productId: input.document.productId,
      title: input.document.title,
      docType: nextDocType,
      s3Key: currentCanonicalKey,
      parsingStatus: "pending",
      lastError: null,
      updatedAt: new Date(),
    })
    .returning({
      id: aiKnowledgeDocuments.id,
      productId: aiKnowledgeDocuments.productId,
      title: aiKnowledgeDocuments.title,
      docType: aiKnowledgeDocuments.docType,
      s3Key: aiKnowledgeDocuments.s3Key,
      parsingStatus: aiKnowledgeDocuments.parsingStatus,
      lastError: aiKnowledgeDocuments.lastError,
      createdAt: aiKnowledgeDocuments.createdAt,
      updatedAt: aiKnowledgeDocuments.updatedAt,
    });

  const insertedKnowledgeDocument =
    (insertedRows[0] as KnowledgeDocumentRecord | undefined) ?? null;

  if (!insertedKnowledgeDocument) {
    throw new Error("AI knowledge kaydı oluşturulamadı.");
  }

  await writeKnowledgeAudit({
    database: input.database,
    actor: input.actor,
    entityId: insertedKnowledgeDocument.id,
    action: "create",
    newState: buildKnowledgeAuditState(insertedKnowledgeDocument, {
      productDocumentId: input.document.id,
      sourceType: input.document.type,
    }),
  });

  return insertedKnowledgeDocument;
}

async function writeProductDocumentAudit(input: {
  database: AuditInsertDatabase;
  actor: StrictAuditActor;
  entityId: string;
  action: "create" | "update";
  previousState?: unknown;
  newState?: unknown;
}) {
  await writeStrictAuditLogInTransaction(input.database, {
    entityType: "product_document",
    entityId: input.entityId,
    action: input.action,
    previousState: input.previousState,
    newState: input.newState,
    actor: input.actor,
  });
}

async function getProductBase(productId: string) {
  if (!isValidUuid(productId)) {
    return null;
  }

  const [row] = await db()
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      sku: products.sku,
      status: products.status,
      categoryName: categories.name,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.id, productId))
    .limit(1);

  return row ?? null;
}

async function getProductDocumentForIngestion(
  documentId: string,
): Promise<ProductDocumentIngestionRecord | null> {
  if (!isValidUuid(documentId)) {
    return null;
  }

  const [row] = await db()
    .select({
      id: productDocuments.id,
      productId: productDocuments.productId,
      type: productDocuments.type,
      title: productDocuments.title,
      url: productDocuments.url,
      note: productDocuments.note,
      status: productDocuments.status,
      productName: products.name,
      productSlug: products.slug,
      productSku: products.sku,
      productStatus: products.status,
      categoryName: categories.name,
    })
    .from(productDocuments)
    .innerJoin(products, eq(productDocuments.productId, products.id))
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(productDocuments.id, documentId))
    .limit(1);

  return (row as ProductDocumentIngestionRecord | undefined) ?? null;
}

function revalidateProductDocumentAiPaths(productId: string) {
  revalidateProductDocumentPaths(productId);
}

function revalidateProductDocumentPaths(productId: string) {
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}/documents`);
  revalidatePath("/admin/datasheets");
  revalidatePath("/admin/ai-core");
}

export async function getProductDocumentsPageProduct(
  productId: string,
): Promise<ProductDocumentsPageProduct | null> {
  if (!isValidUuid(productId)) {
    return null;
  }

  await alignLegacyActiveProducts([productId]);

  const row = await getProductBase(productId);

  if (!row) {
    return null;
  }

  return row satisfies ProductDocumentsPageProduct;
}

export async function getProductDocuments(
  productId: string,
  filtersInput?: Partial<ProductDocumentFilters>,
): Promise<ProductDocumentListItem[]> {
  if (!isValidUuid(productId)) {
    return [];
  }

  const filters = productDocumentFiltersSchema.parse({
    status: filtersInput?.status ?? "active",
  });

  const whereClauses = [eq(productDocuments.productId, productId)];

  if (filters.status !== "all") {
    whereClauses.push(eq(productDocuments.status, filters.status));
  }

  const rows = await db()
    .select({
      id: productDocuments.id,
      productId: productDocuments.productId,
      type: productDocuments.type,
      title: productDocuments.title,
      url: productDocuments.url,
      note: productDocuments.note,
      sortOrder: productDocuments.sortOrder,
      status: productDocuments.status,
      createdAt: productDocuments.createdAt,
      updatedAt: productDocuments.updatedAt,
    })
    .from(productDocuments)
    .where(and(...whereClauses))
    .orderBy(
      asc(productDocuments.sortOrder),
      desc(productDocuments.updatedAt),
      asc(productDocuments.title),
    );

  const canonicalKeys = Array.from(
    new Set(
      rows
        .map((row) => getCanonicalKnowledgeKey(row.url))
        .filter((value): value is string => Boolean(value)),
    ),
  );

  const knowledgeRows =
    canonicalKeys.length > 0
      ? await db()
          .select({
            id: aiKnowledgeDocuments.id,
            s3Key: aiKnowledgeDocuments.s3Key,
            parsingStatus: aiKnowledgeDocuments.parsingStatus,
            lastError: aiKnowledgeDocuments.lastError,
            updatedAt: aiKnowledgeDocuments.updatedAt,
            createdAt: aiKnowledgeDocuments.createdAt,
          })
          .from(aiKnowledgeDocuments)
          .where(inArray(aiKnowledgeDocuments.s3Key, canonicalKeys))
          .orderBy(
            desc(aiKnowledgeDocuments.updatedAt),
            desc(aiKnowledgeDocuments.createdAt),
          )
      : [];

  const knowledgeByCanonicalKey = new Map<
    string,
    {
      id: string;
      parsingStatus: KnowledgeParsingStatus;
      lastError: string | null;
      updatedAt: Date;
    }
  >();

  for (const row of knowledgeRows) {
    if (!knowledgeByCanonicalKey.has(row.s3Key)) {
      knowledgeByCanonicalKey.set(row.s3Key, {
        id: row.id,
        parsingStatus: row.parsingStatus as KnowledgeParsingStatus,
        lastError: row.lastError,
        updatedAt: row.updatedAt,
      });
    }
  }

  return rows.map((row) => {
    const canonicalKey = getCanonicalKnowledgeKey(row.url);
    const knowledge = canonicalKey
      ? (knowledgeByCanonicalKey.get(canonicalKey) ?? null)
      : null;

    return {
      ...(row as ProductDocumentListItem),
      aiKnowledgeDocumentId: knowledge?.id ?? null,
      aiParsingStatus: knowledge?.parsingStatus ?? null,
      aiLastError: knowledge?.lastError ?? null,
      aiUpdatedAt: knowledge?.updatedAt ?? null,
    };
  });
}

export async function createProductDocument(
  _prevState: ProductDocumentActionState,
  formData: FormData,
): Promise<ProductDocumentActionState> {
  const parsed = createProductDocumentSchema.safeParse({
    productId: formData.get("productId"),
    type: formData.get("type"),
    title: formData.get("title"),
    url: formData.get("url"),
    note: formData.get("note"),
    sortOrder: formData.get("sortOrder"),
  });

  if (!parsed.success) {
    return buildErrorState(
      "Belge oluşturulamadı. Form alanlarını kontrol edin.",
      parsed.error.flatten().fieldErrors,
    );
  }

  const data = parsed.data;
  const normalizedUrl = normalizeDocumentUrl(data.url);

  if (!normalizedUrl) {
    return buildErrorState("Belge linki geçersiz.", {
      url: ["Geçerli bir belge linki girin."],
    });
  }

  const product = await getProductBase(data.productId);

  if (!product) {
    return buildErrorState("Belge eklenecek ürün bulunamadı.");
  }

  const [duplicate] = await db()
    .select({
      id: productDocuments.id,
    })
    .from(productDocuments)
    .where(
      and(
        eq(productDocuments.productId, data.productId),
        eq(productDocuments.type, data.type),
        eq(productDocuments.url, normalizedUrl),
      ),
    )
    .limit(1);

  if (duplicate) {
    return buildErrorState("Aynı tipte ve aynı linkte belge zaten mevcut.", {
      url: ["Bu ürün için aynı tipte aynı belge zaten kayıtlı."],
    });
  }

  try {
    const auditActor = await requireStrictAuditActor();
    let createdDocument: ProductDocumentRecord | null = null;

    await db().transaction(async (tx) => {
      const insertedRows = await tx
        .insert(productDocuments)
        .values({
          productId: data.productId,
          type: data.type,
          title: data.title.trim(),
          url: normalizedUrl,
          note: emptyToNull(data.note),
          sortOrder: stringIntegerToNumber(data.sortOrder) ?? 0,
          status: "draft",
          updatedAt: new Date(),
        })
        .returning({
          id: productDocuments.id,
          productId: productDocuments.productId,
          type: productDocuments.type,
          title: productDocuments.title,
          url: productDocuments.url,
          note: productDocuments.note,
          sortOrder: productDocuments.sortOrder,
          status: productDocuments.status,
          createdAt: productDocuments.createdAt,
          updatedAt: productDocuments.updatedAt,
        });

      createdDocument = (insertedRows[0] as ProductDocumentRecord | undefined) ?? null;

      if (!createdDocument) {
        return;
      }

      await writeProductDocumentAudit({
        database: tx,
        actor: auditActor,
        entityId: createdDocument.id,
        action: "create",
        newState: buildProductDocumentAuditState(createdDocument),
      });

      await syncKnowledgeFromProductDocumentInTransaction({
        database: tx,
        actor: auditActor,
        document: createdDocument,
      });
    });

    if (!createdDocument) {
      return buildErrorState("Belge kaydı sırasında beklenmeyen bir hata oluştu.");
    }
  } catch (error) {
    if (error instanceof AuditActorBindingError) {
      return buildErrorState(
        "Session-bound audit actor çözülemediği için belge güvenli şekilde kaydedilemedi.",
      );
    }

    if (isPgUniqueViolation(error)) {
      return buildErrorState("Aynı tipte ve aynı linkte belge zaten mevcut.", {
        url: ["Bu ürün için aynı tipte aynı belge zaten kayıtlı."],
      });
    }

    return buildErrorState("Belge kaydı sırasında beklenmeyen bir hata oluştu.");
  }

  revalidateProductDocumentPaths(data.productId);

  return {
    ok: true,
    message: "Belge başarıyla eklendi.",
  };
}

export async function updateProductDocument(
  _prevState: ProductDocumentActionState,
  formData: FormData,
): Promise<ProductDocumentActionState> {
  const parsed = updateProductDocumentSchema.safeParse({
    id: formData.get("id"),
    productId: formData.get("productId"),
    type: formData.get("type"),
    title: formData.get("title"),
    url: formData.get("url"),
    note: formData.get("note"),
    sortOrder: formData.get("sortOrder"),
  });

  if (!parsed.success) {
    return buildErrorState(
      "Belge güncellenemedi. Form alanlarını kontrol edin.",
      parsed.error.flatten().fieldErrors,
    );
  }

  const data = parsed.data;
  const normalizedUrl = normalizeDocumentUrl(data.url);

  if (!normalizedUrl) {
    return buildErrorState("Belge linki geçersiz.", {
      url: ["Geçerli bir belge linki girin."],
    });
  }

  const [current] = await db()
    .select({
      id: productDocuments.id,
      productId: productDocuments.productId,
    })
    .from(productDocuments)
    .where(eq(productDocuments.id, data.id))
    .limit(1);

  if (!current || current.productId !== data.productId) {
    return buildErrorState("Güncellenecek belge bulunamadı.");
  }

  const currentDuplicateKey = buildDocumentDuplicateKey(data.type, normalizedUrl);

  const duplicateRows = await db()
    .select({
      id: productDocuments.id,
      type: productDocuments.type,
      url: productDocuments.url,
    })
    .from(productDocuments)
    .where(
      and(
        eq(productDocuments.productId, data.productId),
        ne(productDocuments.id, data.id),
      ),
    );

  const hasDuplicate = duplicateRows.some((row) => {
    const duplicateKey = buildDocumentDuplicateKey(
      row.type as typeof data.type,
      row.url,
    );

    return duplicateKey === currentDuplicateKey;
  });

  if (hasDuplicate) {
    return buildErrorState("Aynı tipte ve aynı linkte belge zaten mevcut.", {
      url: ["Bu ürün için aynı tipte aynı belge zaten kayıtlı."],
    });
  }

  try {
    const auditActor = await requireStrictAuditActor();
    let updatedDocument: ProductDocumentRecord | null = null;

    await db().transaction(async (tx) => {
      const currentRows = await tx
        .select({
          id: productDocuments.id,
          productId: productDocuments.productId,
          type: productDocuments.type,
          title: productDocuments.title,
          url: productDocuments.url,
          note: productDocuments.note,
          sortOrder: productDocuments.sortOrder,
          status: productDocuments.status,
          createdAt: productDocuments.createdAt,
          updatedAt: productDocuments.updatedAt,
        })
        .from(productDocuments)
        .where(eq(productDocuments.id, data.id))
        .limit(1);

      const currentDocument =
        (currentRows[0] as ProductDocumentRecord | undefined) ?? null;

      if (!currentDocument || currentDocument.productId !== data.productId) {
        return;
      }

      const updatedRows = await tx
        .update(productDocuments)
        .set({
          type: data.type,
          title: data.title.trim(),
          url: normalizedUrl,
          note: emptyToNull(data.note),
          sortOrder: stringIntegerToNumber(data.sortOrder) ?? 0,
          updatedAt: new Date(),
        })
        .where(eq(productDocuments.id, data.id))
        .returning({
          id: productDocuments.id,
          productId: productDocuments.productId,
          type: productDocuments.type,
          title: productDocuments.title,
          url: productDocuments.url,
          note: productDocuments.note,
          sortOrder: productDocuments.sortOrder,
          status: productDocuments.status,
          createdAt: productDocuments.createdAt,
          updatedAt: productDocuments.updatedAt,
        });

      updatedDocument = (updatedRows[0] as ProductDocumentRecord | undefined) ?? null;

      if (!updatedDocument) {
        return;
      }

      await writeProductDocumentAudit({
        database: tx,
        actor: auditActor,
        entityId: updatedDocument.id,
        action: "update",
        previousState: buildProductDocumentAuditState(currentDocument),
        newState: buildProductDocumentAuditState(updatedDocument),
      });

      await syncKnowledgeFromProductDocumentInTransaction({
        database: tx,
        actor: auditActor,
        document: updatedDocument,
        previousDocument: currentDocument,
      });
    });

    if (!updatedDocument) {
      return buildErrorState("Belge güncellenirken beklenmeyen bir hata oluştu.");
    }
  } catch (error) {
    if (error instanceof AuditActorBindingError) {
      return buildErrorState(
        "Session-bound audit actor çözülemediği için belge güvenli şekilde güncellenemedi.",
      );
    }

    if (isPgUniqueViolation(error)) {
      return buildErrorState("Aynı tipte ve aynı linkte belge zaten mevcut.", {
        url: ["Bu ürün için aynı tipte aynı belge zaten kayıtlı."],
      });
    }

    return buildErrorState(
      "Belge güncellenirken beklenmeyen bir hata oluştu.",
    );
  }

  revalidateProductDocumentPaths(data.productId);

  return {
    ok: true,
    message: "Belge başarıyla güncellendi.",
  };
}

async function updateProductDocumentStatus(input: {
  documentId: string;
  productId: string;
  nextStatus: ProductDocumentRecord["status"];
  invalidMessage: string;
  missingMessage: string;
  unchangedMessage: string;
  successMessage: string;
}) {
  const parsed = restoreProductDocumentSchema.safeParse({
    id: input.documentId,
    productId: input.productId,
  });

  if (!parsed.success) {
    return buildErrorState(input.invalidMessage);
  }

  try {
    const auditActor = await requireStrictAuditActor();
    let updatedDocument: ProductDocumentRecord | null = null;
    let resultState: ProductDocumentActionState | null = null;

    await db().transaction(async (tx) => {
      const currentRows = await tx
        .select({
          id: productDocuments.id,
          productId: productDocuments.productId,
          type: productDocuments.type,
          title: productDocuments.title,
          url: productDocuments.url,
          note: productDocuments.note,
          sortOrder: productDocuments.sortOrder,
          status: productDocuments.status,
          createdAt: productDocuments.createdAt,
          updatedAt: productDocuments.updatedAt,
        })
        .from(productDocuments)
        .where(eq(productDocuments.id, input.documentId))
        .limit(1);

      const currentDocument =
        (currentRows[0] as ProductDocumentRecord | undefined) ?? null;

      if (!currentDocument || currentDocument.productId !== input.productId) {
        resultState = buildErrorState(input.missingMessage);
        return;
      }

      if (currentDocument.status === input.nextStatus) {
        resultState = {
          ok: true,
          message: input.unchangedMessage,
        };
        return;
      }

      const updatedRows = await tx
        .update(productDocuments)
        .set({
          status: input.nextStatus,
          updatedAt: new Date(),
        })
        .where(eq(productDocuments.id, input.documentId))
        .returning({
          id: productDocuments.id,
          productId: productDocuments.productId,
          type: productDocuments.type,
          title: productDocuments.title,
          url: productDocuments.url,
          note: productDocuments.note,
          sortOrder: productDocuments.sortOrder,
          status: productDocuments.status,
          createdAt: productDocuments.createdAt,
          updatedAt: productDocuments.updatedAt,
        });

      updatedDocument = (updatedRows[0] as ProductDocumentRecord | undefined) ?? null;

      if (!updatedDocument) {
        resultState = buildErrorState("Belge durumu güvenli şekilde güncellenemedi.");
        return;
      }

      await writeProductDocumentAudit({
        database: tx,
        actor: auditActor,
        entityId: updatedDocument.id,
        action: "update",
        previousState: buildProductDocumentAuditState(currentDocument),
        newState: buildProductDocumentAuditState(updatedDocument),
      });

      await syncKnowledgeFromProductDocumentInTransaction({
        database: tx,
        actor: auditActor,
        document: updatedDocument,
        previousDocument: currentDocument,
      });
    });

    if (resultState) {
      return resultState;
    }

    if (!updatedDocument) {
      return buildErrorState("Belge durumu güvenli şekilde güncellenemedi.");
    }
  } catch (error) {
    if (error instanceof AuditActorBindingError) {
      return buildErrorState(
        "Session-bound audit actor çözülemediği için belge durumu güvenli şekilde değiştirilemedi.",
      );
    }

    console.error("updateProductDocumentStatus error:", error);
    return buildErrorState("Belge durumu değiştirilirken beklenmeyen bir hata oluştu.");
  }

  revalidateProductDocumentPaths(input.productId);

  return {
    ok: true,
    message: input.successMessage,
  };
}

export async function archiveProductDocument(
  documentId: string,
  productId: string,
): Promise<ProductDocumentActionState> {
  return updateProductDocumentStatus({
    documentId,
    productId,
    nextStatus: "archived",
    invalidMessage: "Belge arşivleme isteği geçersiz.",
    missingMessage: "Arşivlenecek belge bulunamadı.",
    unchangedMessage: "Belge zaten arşivde.",
    successMessage: "Belge arşive alındı.",
  });
}

export async function restoreProductDocument(
  documentId: string,
  productId: string,
): Promise<ProductDocumentActionState> {
  return updateProductDocumentStatus({
    documentId,
    productId,
    nextStatus: "active",
    invalidMessage: "Belge geri alma isteği geçersiz.",
    missingMessage: "Geri alınacak belge bulunamadı.",
    unchangedMessage: "Belge zaten aktif.",
    successMessage: "Belge yeniden aktifleştirildi.",
  });
}

export async function setDraftProductDocument(
  documentId: string,
  productId: string,
): Promise<ProductDocumentActionState> {
  return updateProductDocumentStatus({
    documentId,
    productId,
    nextStatus: "draft",
    invalidMessage: "Belge taslak isteği geçersiz.",
    missingMessage: "Taslağa alınacak belge bulunamadı.",
    unchangedMessage: "Belge zaten taslak durumda.",
    successMessage: "Belge taslak duruma alındı.",
  });
}

export async function activateProductDocument(
  documentId: string,
  productId: string,
): Promise<ProductDocumentActionState> {
  return updateProductDocumentStatus({
    documentId,
    productId,
    nextStatus: "active",
    invalidMessage: "Belge aktifleştirme isteği geçersiz.",
    missingMessage: "Aktifleştirilecek belge bulunamadı.",
    unchangedMessage: "Belge zaten aktif.",
    successMessage: "Belge aktifleştirildi.",
  });
}

export async function ingestProductDocumentToAi(
  productDocumentId: string,
): Promise<ProductDocumentActionState> {
  const normalizedDocumentId = String(productDocumentId ?? "").trim();

  if (!isValidUuid(normalizedDocumentId)) {
    return buildErrorState("AI ingestion isteği geçersiz.");
  }

  const sourceDocument = await getProductDocumentForIngestion(normalizedDocumentId);

  if (!sourceDocument) {
    return buildErrorState("AI işlenecek belge bulunamadı.");
  }

  if (sourceDocument.status !== "active") {
    return buildErrorState("Belge aktif değil, AI işleme alınamaz.");
  }

  const canonicalKey = getCanonicalKnowledgeKey(sourceDocument.url);

  if (!canonicalKey) {
    return buildErrorState("Belge linki canonical key üretimi için uygun değil.");
  }

  const knowledgeDocType = mapProductDocumentTypeToKnowledgeDocType(
    sourceDocument.type,
  );

  const database = db();
  let strictAuditActor: StrictAuditActor | null = null;

  try {
    strictAuditActor = await requireStrictAuditActor();
    const activeAuditActor = strictAuditActor;

    const extractedText = await fetchDocumentText(sourceDocument);
    const generatedChunks = buildGeneratedChunks(extractedText);

    console.log("AI ingestion chunk count", {
      productDocumentId: sourceDocument.id,
      canonicalKey,
      chunkCount: generatedChunks.length,
    });

    let completedKnowledgeDocument: KnowledgeDocumentRecord | null = null;
    let createdKnowledgeDocument = false;

    await database.transaction(async (tx) => {
      await lockKnowledgeIngestion(tx, canonicalKey);

      const existingRows = await tx
        .select({
          id: aiKnowledgeDocuments.id,
          productId: aiKnowledgeDocuments.productId,
          title: aiKnowledgeDocuments.title,
          docType: aiKnowledgeDocuments.docType,
          s3Key: aiKnowledgeDocuments.s3Key,
          parsingStatus: aiKnowledgeDocuments.parsingStatus,
          lastError: aiKnowledgeDocuments.lastError,
          createdAt: aiKnowledgeDocuments.createdAt,
          updatedAt: aiKnowledgeDocuments.updatedAt,
        })
        .from(aiKnowledgeDocuments)
        .where(eq(aiKnowledgeDocuments.s3Key, canonicalKey))
        .orderBy(
          desc(aiKnowledgeDocuments.updatedAt),
          desc(aiKnowledgeDocuments.createdAt),
        )
        .limit(1);

      const existingKnowledgeDocument =
        (existingRows[0] as KnowledgeDocumentRecord | undefined) ?? null;

      let processingKnowledgeDocument: KnowledgeDocumentRecord;

      if (existingKnowledgeDocument) {
        const updatedRows = await tx
          .update(aiKnowledgeDocuments)
          .set({
            productId: sourceDocument.productId,
            title: sourceDocument.title.trim(),
            docType: knowledgeDocType,
            s3Key: canonicalKey,
            parsingStatus: "processing",
            lastError: null,
            updatedAt: new Date(),
          })
          .where(eq(aiKnowledgeDocuments.id, existingKnowledgeDocument.id))
          .returning({
            id: aiKnowledgeDocuments.id,
            productId: aiKnowledgeDocuments.productId,
            title: aiKnowledgeDocuments.title,
            docType: aiKnowledgeDocuments.docType,
            s3Key: aiKnowledgeDocuments.s3Key,
            parsingStatus: aiKnowledgeDocuments.parsingStatus,
            lastError: aiKnowledgeDocuments.lastError,
            createdAt: aiKnowledgeDocuments.createdAt,
            updatedAt: aiKnowledgeDocuments.updatedAt,
          });

        const nextKnowledgeDocument =
          (updatedRows[0] as KnowledgeDocumentRecord | undefined) ?? null;

        if (!nextKnowledgeDocument) {
          throw new Error("AI knowledge kaydı processing durumuna alınamadı.");
        }

        await writeKnowledgeAudit({
          database: tx,
          actor: activeAuditActor,
          entityId: nextKnowledgeDocument.id,
          action: "update",
          previousState: buildKnowledgeAuditState(existingKnowledgeDocument, {
            productDocumentId: sourceDocument.id,
            sourceType: sourceDocument.type,
          }),
          newState: buildKnowledgeAuditState(nextKnowledgeDocument, {
            productDocumentId: sourceDocument.id,
            sourceType: sourceDocument.type,
          }),
        });

        processingKnowledgeDocument = nextKnowledgeDocument;
      } else {
        const insertedRows = await tx
          .insert(aiKnowledgeDocuments)
          .values({
            productId: sourceDocument.productId,
            title: sourceDocument.title.trim(),
            docType: knowledgeDocType,
            s3Key: canonicalKey,
            parsingStatus: "processing",
            lastError: null,
            updatedAt: new Date(),
          })
          .returning({
            id: aiKnowledgeDocuments.id,
            productId: aiKnowledgeDocuments.productId,
            title: aiKnowledgeDocuments.title,
            docType: aiKnowledgeDocuments.docType,
            s3Key: aiKnowledgeDocuments.s3Key,
            parsingStatus: aiKnowledgeDocuments.parsingStatus,
            lastError: aiKnowledgeDocuments.lastError,
            createdAt: aiKnowledgeDocuments.createdAt,
            updatedAt: aiKnowledgeDocuments.updatedAt,
          });

        const nextKnowledgeDocument =
          (insertedRows[0] as KnowledgeDocumentRecord | undefined) ?? null;

        if (!nextKnowledgeDocument) {
          throw new Error("AI knowledge kaydı oluşturulamadı.");
        }

        await writeKnowledgeAudit({
          database: tx,
          actor: activeAuditActor,
          entityId: nextKnowledgeDocument.id,
          action: "create",
          newState: buildKnowledgeAuditState(nextKnowledgeDocument, {
            productDocumentId: sourceDocument.id,
            sourceType: sourceDocument.type,
          }),
        });

        processingKnowledgeDocument = nextKnowledgeDocument;
        createdKnowledgeDocument = true;
      }

      await deleteKnowledgeChunksInTransaction(tx, processingKnowledgeDocument.id);

      const insertedChunks = await tx
        .insert(aiDocumentChunks)
        .values(
          generatedChunks.map((chunk) => ({
            documentId: processingKnowledgeDocument.id,
            chunkIndex: chunk.chunkIndex,
            contentText: chunk.contentText,
            pageNumber: chunk.pageNumber,
            tokenCount: chunk.tokenCount,
          })),
        )
        .returning({
          id: aiDocumentChunks.id,
        });

      if (insertedChunks.length === 0) {
        throw new Error("AI chunk üretimi boş döndü.");
      }

      if (insertedChunks.length !== generatedChunks.length) {
        throw new Error("Tüm AI chunk kayıtları oluşturulamadı.");
      }

      const updatedRows = await tx
        .update(aiKnowledgeDocuments)
        .set({
          productId: sourceDocument.productId,
          title: sourceDocument.title.trim(),
          docType: knowledgeDocType,
          s3Key: canonicalKey,
          parsingStatus: "completed",
          lastError: null,
          updatedAt: new Date(),
        })
        .where(eq(aiKnowledgeDocuments.id, processingKnowledgeDocument.id))
        .returning({
          id: aiKnowledgeDocuments.id,
          productId: aiKnowledgeDocuments.productId,
          title: aiKnowledgeDocuments.title,
          docType: aiKnowledgeDocuments.docType,
          s3Key: aiKnowledgeDocuments.s3Key,
          parsingStatus: aiKnowledgeDocuments.parsingStatus,
          lastError: aiKnowledgeDocuments.lastError,
          createdAt: aiKnowledgeDocuments.createdAt,
          updatedAt: aiKnowledgeDocuments.updatedAt,
        });

      const nextCompletedKnowledgeDocument =
        (updatedRows[0] as KnowledgeDocumentRecord | undefined) ?? null;

      if (!nextCompletedKnowledgeDocument) {
        throw new Error("AI knowledge kaydı completed durumuna alınamadı.");
      }

      await writeKnowledgeAudit({
        database: tx,
        actor: activeAuditActor,
        entityId: nextCompletedKnowledgeDocument.id,
        action: "update",
        previousState: buildKnowledgeAuditState(processingKnowledgeDocument, {
          productDocumentId: sourceDocument.id,
          sourceType: sourceDocument.type,
        }),
        newState: buildKnowledgeAuditState(nextCompletedKnowledgeDocument, {
          productDocumentId: sourceDocument.id,
          sourceType: sourceDocument.type,
          chunkCount: generatedChunks.length,
        }),
      });

      console.log("AI ingestion db insert done", {
        productDocumentId: sourceDocument.id,
        knowledgeDocumentId: nextCompletedKnowledgeDocument.id,
        chunkCount: insertedChunks.length,
      });

      completedKnowledgeDocument = nextCompletedKnowledgeDocument;
    });

    if (!completedKnowledgeDocument) {
      throw new Error("AI ingestion completed kaydı doğrulanamadı.");
    }

    revalidateProductDocumentAiPaths(sourceDocument.productId);

    return {
      ok: true,
      message: createdKnowledgeDocument
        ? "Belge AI knowledge katmanına işlendi."
        : "Belge AI knowledge katmanında yeniden işlendi.",
    };
  } catch (error) {
    if (error instanceof AuditActorBindingError) {
      return buildErrorState(
        "Session-bound audit actor çözülemediği için AI ingestion güvenli şekilde başlatılamadı.",
      );
    }

    const failureMessage = buildReadableErrorMessage(error);

    console.error("ingestProductDocumentToAi error:", error);

    try {
      const failureAuditActor =
        strictAuditActor ?? (await requireStrictAuditActor());

      await database.transaction(async (tx) => {
        await lockKnowledgeIngestion(tx, canonicalKey);

        const rows = await tx
          .select({
            id: aiKnowledgeDocuments.id,
            productId: aiKnowledgeDocuments.productId,
            title: aiKnowledgeDocuments.title,
            docType: aiKnowledgeDocuments.docType,
            s3Key: aiKnowledgeDocuments.s3Key,
            parsingStatus: aiKnowledgeDocuments.parsingStatus,
            lastError: aiKnowledgeDocuments.lastError,
            createdAt: aiKnowledgeDocuments.createdAt,
            updatedAt: aiKnowledgeDocuments.updatedAt,
          })
          .from(aiKnowledgeDocuments)
          .where(eq(aiKnowledgeDocuments.s3Key, canonicalKey))
          .orderBy(
            desc(aiKnowledgeDocuments.updatedAt),
            desc(aiKnowledgeDocuments.createdAt),
          )
          .limit(1);

        const currentKnowledgeDocument =
          (rows[0] as KnowledgeDocumentRecord | undefined) ?? null;

        if (currentKnowledgeDocument) {
          const failedRows = await tx
            .update(aiKnowledgeDocuments)
            .set({
              productId: sourceDocument.productId,
              title: sourceDocument.title.trim(),
              docType: knowledgeDocType,
              s3Key: canonicalKey,
              parsingStatus: "failed",
              lastError: failureMessage,
              updatedAt: new Date(),
            })
            .where(eq(aiKnowledgeDocuments.id, currentKnowledgeDocument.id))
            .returning({
              id: aiKnowledgeDocuments.id,
              productId: aiKnowledgeDocuments.productId,
              title: aiKnowledgeDocuments.title,
              docType: aiKnowledgeDocuments.docType,
              s3Key: aiKnowledgeDocuments.s3Key,
              parsingStatus: aiKnowledgeDocuments.parsingStatus,
              lastError: aiKnowledgeDocuments.lastError,
              createdAt: aiKnowledgeDocuments.createdAt,
              updatedAt: aiKnowledgeDocuments.updatedAt,
            });

          const failedKnowledgeDocument =
            (failedRows[0] as KnowledgeDocumentRecord | undefined) ?? null;

          if (!failedKnowledgeDocument) {
            throw new Error("AI knowledge failed durumu yazılamadı.");
          }

          await writeKnowledgeAudit({
            database: tx,
            actor: failureAuditActor,
            entityId: failedKnowledgeDocument.id,
            action: "update",
            previousState: buildKnowledgeAuditState(currentKnowledgeDocument, {
              productDocumentId: sourceDocument.id,
              sourceType: sourceDocument.type,
            }),
            newState: buildKnowledgeAuditState(failedKnowledgeDocument, {
              productDocumentId: sourceDocument.id,
              sourceType: sourceDocument.type,
            }),
          });

          return;
        }

        const insertedRows = await tx
          .insert(aiKnowledgeDocuments)
          .values({
            productId: sourceDocument.productId,
            title: sourceDocument.title.trim(),
            docType: knowledgeDocType,
            s3Key: canonicalKey,
            parsingStatus: "failed",
            lastError: failureMessage,
            updatedAt: new Date(),
          })
          .returning({
            id: aiKnowledgeDocuments.id,
            productId: aiKnowledgeDocuments.productId,
            title: aiKnowledgeDocuments.title,
            docType: aiKnowledgeDocuments.docType,
            s3Key: aiKnowledgeDocuments.s3Key,
            parsingStatus: aiKnowledgeDocuments.parsingStatus,
            lastError: aiKnowledgeDocuments.lastError,
            createdAt: aiKnowledgeDocuments.createdAt,
            updatedAt: aiKnowledgeDocuments.updatedAt,
          });

        const failedKnowledgeDocument =
          (insertedRows[0] as KnowledgeDocumentRecord | undefined) ?? null;

        if (!failedKnowledgeDocument) {
          throw new Error("AI knowledge failed kaydı oluşturulamadı.");
        }

        await writeKnowledgeAudit({
          database: tx,
          actor: failureAuditActor,
          entityId: failedKnowledgeDocument.id,
          action: "create",
          newState: buildKnowledgeAuditState(failedKnowledgeDocument, {
            productDocumentId: sourceDocument.id,
            sourceType: sourceDocument.type,
          }),
        });
      });
    } catch (failureUpdateError) {
      console.error(
        "ingestProductDocumentToAi failed-status update error:",
        failureUpdateError,
      );
    }

    revalidateProductDocumentAiPaths(sourceDocument.productId);

    return buildErrorState(`AI ingestion başarısız oldu: ${failureMessage}`);
  }
}
