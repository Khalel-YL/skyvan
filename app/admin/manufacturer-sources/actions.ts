"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { getDbOrThrow } from "@/db/db";
import { manufacturerSourceRegistries } from "@/db/schema";

import {
  initialManufacturerSourceDryRunState,
  initialManufacturerSourceFetchPreviewState,
  initialManufacturerSourceParsePreviewState,
  initialManufacturerSourceRegistryActionState,
  type ManufacturerSourceContentType,
  type ManufacturerSourceDryRunDecision,
  type ManufacturerSourceDryRunState,
  type ManufacturerSourceFetchMode,
  type ManufacturerSourceFetchPreviewState,
  type ManufacturerSourceParsePreviewState,
  type ManufacturerSourceRegistryActionState,
} from "./types";

function getTrimmed(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getMultiValues(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .map((value) => String(value ?? "").trim())
    .filter(Boolean);
}

function getBoolean(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value === "on" || value === "true" || value === "1";
}

function normalizeDomain(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .split("?")[0]
    .split("#")[0]
    .trim();
}

function isValidDomain(domain: string) {
  return /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i.test(domain);
}

function uniqueAllowedTypes(values: string[]): ManufacturerSourceContentType[] {
  const allowed = new Set<ManufacturerSourceContentType>([
    "manuals",
    "datasheets",
    "technical_pages",
    "support_pages",
  ]);

  return Array.from(new Set(values)).filter((value): value is ManufacturerSourceContentType =>
    allowed.has(value as ManufacturerSourceContentType),
  );
}

function normalizePathList(input: string) {
  return Array.from(
    new Set(
      input
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => (line.startsWith("/") ? line : `/${line}`)),
    ),
  );
}

function normalizeFetchMode(value: string): ManufacturerSourceFetchMode {
  if (
    value === "manual_review" ||
    value === "allowed_paths_only" ||
    value === "full_domain_review"
  ) {
    return value;
  }

  return "manual_review";
}

function pathMatches(pathname: string, rulePath: string) {
  if (rulePath === "/") {
    return true;
  }

  return pathname === rulePath || pathname.startsWith(`${rulePath}/`);
}

function normalizeCandidateUrl(input: string) {
  const value = input.trim();

  if (!value) {
    return null;
  }

  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;

  try {
    return new URL(withProtocol);
  } catch {
    return null;
  }
}

function isHostAllowed(host: string, normalizedDomain: string, allowSubdomains: boolean) {
  if (host === normalizedDomain) {
    return true;
  }

  if (allowSubdomains && host.endsWith(`.${normalizedDomain}`)) {
    return true;
  }

  return false;
}

function stripHtmlTags(input: string) {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTitleFromHtml(html: string) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? stripHtmlTags(match[1]).slice(0, 180) : null;
}

function extractMetaDescription(html: string) {
  const match = html.match(
    /<meta[^>]+name=["']description["'][^>]+content=["']([\s\S]*?)["'][^>]*>/i,
  );
  return match ? stripHtmlTags(match[1]).slice(0, 240) : null;
}

function extractSnippetFromHtml(html: string) {
  const text = stripHtmlTags(html);
  return text ? text.slice(0, 320) : null;
}

function countMatches(input: string, pattern: RegExp) {
  const matches = input.match(pattern);
  return matches ? matches.length : 0;
}

function evaluateUrlAgainstPolicy(params: {
  candidateUrlRaw: string;
  normalizedDomain: string;
  allowSubdomains: boolean;
  ingestionEnabled: boolean;
  defaultFetchMode: ManufacturerSourceFetchMode;
  pathAllowlist: string[];
  pathBlocklist: string[];
}) {
  const parsedUrl = normalizeCandidateUrl(params.candidateUrlRaw);

  if (!parsedUrl) {
    return {
      ok: false as const,
      fieldError: "Geçerli bir URL gir. Örnek: https://victronenergy.com/downloads",
    };
  }

  const host = parsedUrl.hostname.toLowerCase();
  const pathname = parsedUrl.pathname || "/";
  const normalizedUrl = parsedUrl.toString();

  const reasons: string[] = [];
  const matchedAllowlist = params.pathAllowlist.filter((path) => pathMatches(pathname, path));
  const matchedBlocklist = params.pathBlocklist.filter((path) => pathMatches(pathname, path));

  let decision: ManufacturerSourceDryRunDecision = "manual_review";

  if (!params.ingestionEnabled) {
    reasons.push("Bu kayıt için içe alma şu an kapalı.");
    decision = "blocked";
  }

  if (!isHostAllowed(host, params.normalizedDomain, params.allowSubdomains)) {
    reasons.push(
      params.allowSubdomains
        ? "Host, ana domain veya izinli subdomain kapsamına girmiyor."
        : "Host, kayıtlı ana domain ile eşleşmiyor ve subdomain izni kapalı.",
    );
    decision = "blocked";
  }

  if (matchedBlocklist.length > 0) {
    reasons.push("URL path'i engelli path listesiyle eşleşiyor.");
    decision = "blocked";
  }

  if (decision !== "blocked") {
    if (params.defaultFetchMode === "allowed_paths_only") {
      if (matchedAllowlist.length === 0) {
        reasons.push("Erişim modu yalnız izinli path'ler olduğu için URL izinli liste dışında kaldı.");
        decision = "blocked";
      } else {
        reasons.push("URL izinli path listesiyle eşleşti.");
        decision = "allowed";
      }
    } else if (params.defaultFetchMode === "manual_review") {
      reasons.push("Erişim modu manuel inceleme olduğu için operatör onayı gerekir.");
      decision = "manual_review";
    } else {
      reasons.push("Erişim modu tüm domain inceleme olduğu için kontrollü önizleme yapılabilir.");
      decision = "manual_review";
    }
  }

  if (matchedAllowlist.length > 0 && params.defaultFetchMode !== "allowed_paths_only") {
    reasons.push("URL ayrıca izinli path listesiyle de eşleşiyor.");
  }

  return {
    ok: true as const,
    parsedUrl,
    host,
    pathname,
    normalizedUrl,
    matchedAllowlist,
    matchedBlocklist,
    reasons,
    decision,
  };
}

export async function createManufacturerSourceRegistryEntry(
  _prevState: ManufacturerSourceRegistryActionState,
  formData: FormData,
): Promise<ManufacturerSourceRegistryActionState> {
  const manufacturerName = getTrimmed(formData, "manufacturerName");
  const rawDomain = getTrimmed(formData, "domain");
  const notes = getTrimmed(formData, "notes");
  const allowedContentTypes = uniqueAllowedTypes(
    getMultiValues(formData, "allowedContentTypes"),
  );

  const ingestionEnabled = getBoolean(formData, "ingestionEnabled");
  const allowSubdomains = getBoolean(formData, "allowSubdomains");
  const respectRobotsTxt = getBoolean(formData, "respectRobotsTxt");
  const defaultFetchMode = normalizeFetchMode(getTrimmed(formData, "defaultFetchMode"));
  const pathAllowlist = normalizePathList(getTrimmed(formData, "pathAllowlist"));
  const pathBlocklist = normalizePathList(getTrimmed(formData, "pathBlocklist"));

  const normalizedDomain = normalizeDomain(rawDomain);

  const fieldErrors: ManufacturerSourceRegistryActionState["fieldErrors"] = {};

  if (manufacturerName.length < 2) {
    fieldErrors.manufacturerName = "Üretici adı en az 2 karakter olmalı.";
  }

  if (!normalizedDomain) {
    fieldErrors.domain = "Domain zorunludur.";
  } else if (!isValidDomain(normalizedDomain)) {
    fieldErrors.domain = "Geçerli bir ana domain gir. Örnek: victronenergy.com";
  }

  if (allowedContentTypes.length === 0) {
    fieldErrors.allowedContentTypes = "En az bir içerik tipi seçmelisin.";
  }

  if (notes.length > 600) {
    fieldErrors.notes = "Not alanı en fazla 600 karakter olabilir.";
  }

  if (pathAllowlist.some((path) => path.length > 300)) {
    fieldErrors.pathAllowlist = "İzinli path satırları çok uzun. Her satır 300 karakteri geçmemeli.";
  }

  if (pathBlocklist.some((path) => path.length > 300)) {
    fieldErrors.pathBlocklist = "Engelli path satırları çok uzun. Her satır 300 karakteri geçmemeli.";
  }

  if (defaultFetchMode === "allowed_paths_only" && pathAllowlist.length === 0) {
    fieldErrors.pathAllowlist =
      "Yalnız izinli path'ler modunda en az bir izinli path girmelisin.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      message: "Kayıt oluşturulamadı. Alan hatalarını kontrol et.",
      fieldErrors,
      createdItem: null,
    };
  }

  try {
    const database = getDbOrThrow();

    const duplicateRows = await database
      .select({ id: manufacturerSourceRegistries.id })
      .from(manufacturerSourceRegistries)
      .where(eq(manufacturerSourceRegistries.normalizedDomain, normalizedDomain))
      .limit(1);

    if (duplicateRows.length > 0) {
      return {
        ok: false,
        message: "Bu normalize domain zaten kayıtlı.",
        fieldErrors: {
          domain: "Aynı domain için ikinci kayıt açılamaz.",
        },
        createdItem: null,
      };
    }

    await database.insert(manufacturerSourceRegistries).values({
      manufacturerName,
      domain: normalizedDomain,
      normalizedDomain,
      allowedContentTypes,
      notes: notes || null,
      ingestionEnabled,
      allowSubdomains,
      respectRobotsTxt,
      defaultFetchMode,
      pathAllowlist,
      pathBlocklist,
      status: "active",
      updatedAt: new Date(),
    });

    revalidatePath("/admin/manufacturer-sources");

    return {
      ok: true,
      message: "Registry kaydı oluşturuldu.",
      fieldErrors: {},
      createdItem: {
        manufacturerName,
        normalizedDomain,
        allowedContentTypes,
        defaultFetchMode,
      },
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? `Registry kaydı oluşturulamadı: ${error.message}`
          : "Registry kaydı oluşturulamadı.",
      fieldErrors: {},
      createdItem: null,
    };
  }
}

export async function updateManufacturerSourceRegistrySettings(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    return;
  }

  const ingestionEnabled = getBoolean(formData, "ingestionEnabled");
  const allowSubdomains = getBoolean(formData, "allowSubdomains");
  const respectRobotsTxt = getBoolean(formData, "respectRobotsTxt");
  const defaultFetchMode = normalizeFetchMode(getTrimmed(formData, "defaultFetchMode"));
  const pathAllowlist = normalizePathList(getTrimmed(formData, "pathAllowlist"));
  const pathBlocklist = normalizePathList(getTrimmed(formData, "pathBlocklist"));

  if (defaultFetchMode === "allowed_paths_only" && pathAllowlist.length === 0) {
    return;
  }

  const database = getDbOrThrow();

  await database
    .update(manufacturerSourceRegistries)
    .set({
      ingestionEnabled,
      allowSubdomains,
      respectRobotsTxt,
      defaultFetchMode,
      pathAllowlist,
      pathBlocklist,
      updatedAt: new Date(),
    })
    .where(eq(manufacturerSourceRegistries.id, id));

  revalidatePath("/admin/manufacturer-sources");
}

export async function evaluateManufacturerSourceDryRun(
  _prevState: ManufacturerSourceDryRunState,
  formData: FormData,
): Promise<ManufacturerSourceDryRunState> {
  const candidateUrlRaw = getTrimmed(formData, "candidateUrl");
  const normalizedDomain = getTrimmed(formData, "normalizedDomain");
  const allowSubdomains = getBoolean(formData, "allowSubdomains");
  const ingestionEnabled = getBoolean(formData, "ingestionEnabled");
  const defaultFetchMode = normalizeFetchMode(getTrimmed(formData, "defaultFetchMode"));
  const pathAllowlist = normalizePathList(getTrimmed(formData, "pathAllowlist"));
  const pathBlocklist = normalizePathList(getTrimmed(formData, "pathBlocklist"));

  if (!candidateUrlRaw) {
    return {
      ok: false,
      message: "Dry-run yapılamadı.",
      fieldErrors: {
        candidateUrl: "Test edilecek URL zorunludur.",
      },
      result: null,
    };
  }

  const evaluation = evaluateUrlAgainstPolicy({
    candidateUrlRaw,
    normalizedDomain,
    allowSubdomains,
    ingestionEnabled,
    defaultFetchMode,
    pathAllowlist,
    pathBlocklist,
  });

  if (!evaluation.ok) {
    return {
      ok: false,
      message: "Dry-run yapılamadı.",
      fieldErrors: {
        candidateUrl: evaluation.fieldError,
      },
      result: null,
    };
  }

  return {
    ok: true,
    message: "Dry-run değerlendirmesi hazır.",
    fieldErrors: {},
    result: {
      candidateUrl: candidateUrlRaw,
      normalizedUrl: evaluation.normalizedUrl,
      host: evaluation.host,
      pathname: evaluation.pathname,
      decision: evaluation.decision,
      matchedAllowlist: evaluation.matchedAllowlist,
      matchedBlocklist: evaluation.matchedBlocklist,
      reasons: evaluation.reasons,
    },
  };
}

export async function fetchManufacturerSourcePreview(
  _prevState: ManufacturerSourceFetchPreviewState,
  formData: FormData,
): Promise<ManufacturerSourceFetchPreviewState> {
  const candidateUrlRaw = getTrimmed(formData, "candidateUrl");
  const normalizedDomain = getTrimmed(formData, "normalizedDomain");
  const allowSubdomains = getBoolean(formData, "allowSubdomains");
  const ingestionEnabled = getBoolean(formData, "ingestionEnabled");
  const defaultFetchMode = normalizeFetchMode(getTrimmed(formData, "defaultFetchMode"));
  const pathAllowlist = normalizePathList(getTrimmed(formData, "pathAllowlist"));
  const pathBlocklist = normalizePathList(getTrimmed(formData, "pathBlocklist"));

  if (!candidateUrlRaw) {
    return {
      ok: false,
      message: "Fetch önizleme yapılamadı.",
      fieldErrors: {
        candidateUrl: "Test edilecek URL zorunludur.",
      },
      result: null,
    };
  }

  const evaluation = evaluateUrlAgainstPolicy({
    candidateUrlRaw,
    normalizedDomain,
    allowSubdomains,
    ingestionEnabled,
    defaultFetchMode,
    pathAllowlist,
    pathBlocklist,
  });

  if (!evaluation.ok) {
    return {
      ok: false,
      message: "Fetch önizleme yapılamadı.",
      fieldErrors: {
        candidateUrl: evaluation.fieldError,
      },
      result: null,
    };
  }

  if (evaluation.decision === "blocked") {
    return {
      ok: false,
      message: "URL kurallar tarafından bloklandı. Gerçek fetch yapılmadı.",
      fieldErrors: {},
      result: {
        candidateUrl: candidateUrlRaw,
        normalizedUrl: evaluation.normalizedUrl,
        finalUrl: evaluation.normalizedUrl,
        host: evaluation.host,
        pathname: evaluation.pathname,
        policyDecision: evaluation.decision,
        policyReasons: evaluation.reasons,
        httpStatus: null,
        contentType: null,
        contentLength: null,
        title: null,
        snippet: null,
        fetchAllowed: false,
      },
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(evaluation.normalizedUrl, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "SkyvanAdminSourcePreview/1.0",
        Accept: "text/html,application/pdf,text/plain,*/*",
      },
      cache: "no-store",
    });

    clearTimeout(timeout);

    const contentType = response.headers.get("content-type");
    const contentLength = response.headers.get("content-length");
    const finalUrl = response.url || evaluation.normalizedUrl;

    let title: string | null = null;
    let snippet: string | null = null;

    const isHtml = (contentType ?? "").toLowerCase().includes("text/html");
    const isText =
      isHtml ||
      (contentType ?? "").toLowerCase().includes("text/plain") ||
      (contentType ?? "").toLowerCase().includes("application/json");

    if (isText) {
      const bodyText = await response.text();

      if (isHtml) {
        title = extractTitleFromHtml(bodyText);
        snippet = extractSnippetFromHtml(bodyText);
      } else {
        snippet = bodyText.replace(/\s+/g, " ").trim().slice(0, 320) || null;
      }
    }

    return {
      ok: true,
      message: "Fetch önizleme hazır.",
      fieldErrors: {},
      result: {
        candidateUrl: candidateUrlRaw,
        normalizedUrl: evaluation.normalizedUrl,
        finalUrl,
        host: evaluation.host,
        pathname: evaluation.pathname,
        policyDecision: evaluation.decision,
        policyReasons: evaluation.reasons,
        httpStatus: response.status,
        contentType,
        contentLength,
        title,
        snippet,
        fetchAllowed: true,
      },
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? `Fetch önizleme başarısız oldu: ${error.message}`
          : "Fetch önizleme başarısız oldu.",
      fieldErrors: {},
      result: {
        candidateUrl: candidateUrlRaw,
        normalizedUrl: evaluation.normalizedUrl,
        finalUrl: evaluation.normalizedUrl,
        host: evaluation.host,
        pathname: evaluation.pathname,
        policyDecision: evaluation.decision,
        policyReasons: evaluation.reasons,
        httpStatus: null,
        contentType: null,
        contentLength: null,
        title: null,
        snippet: null,
        fetchAllowed: true,
      },
    };
  }
}

export async function parseManufacturerSourcePreview(
  _prevState: ManufacturerSourceParsePreviewState,
  formData: FormData,
): Promise<ManufacturerSourceParsePreviewState> {
  const candidateUrlRaw = getTrimmed(formData, "candidateUrl");
  const normalizedDomain = getTrimmed(formData, "normalizedDomain");
  const allowSubdomains = getBoolean(formData, "allowSubdomains");
  const ingestionEnabled = getBoolean(formData, "ingestionEnabled");
  const defaultFetchMode = normalizeFetchMode(getTrimmed(formData, "defaultFetchMode"));
  const pathAllowlist = normalizePathList(getTrimmed(formData, "pathAllowlist"));
  const pathBlocklist = normalizePathList(getTrimmed(formData, "pathBlocklist"));

  if (!candidateUrlRaw) {
    return {
      ok: false,
      message: "Parse önizleme yapılamadı.",
      fieldErrors: {
        candidateUrl: "Test edilecek URL zorunludur.",
      },
      result: null,
    };
  }

  const evaluation = evaluateUrlAgainstPolicy({
    candidateUrlRaw,
    normalizedDomain,
    allowSubdomains,
    ingestionEnabled,
    defaultFetchMode,
    pathAllowlist,
    pathBlocklist,
  });

  if (!evaluation.ok) {
    return {
      ok: false,
      message: "Parse önizleme yapılamadı.",
      fieldErrors: {
        candidateUrl: evaluation.fieldError,
      },
      result: null,
    };
  }

  if (evaluation.decision === "blocked") {
    return {
      ok: false,
      message: "URL kurallar tarafından bloklandı. Parse yapılmadı.",
      fieldErrors: {},
      result: {
        candidateUrl: candidateUrlRaw,
        normalizedUrl: evaluation.normalizedUrl,
        finalUrl: evaluation.normalizedUrl,
        host: evaluation.host,
        pathname: evaluation.pathname,
        policyDecision: evaluation.decision,
        policyReasons: evaluation.reasons,
        httpStatus: null,
        contentType: null,
        parseSupported: false,
        detectedTitle: null,
        metaDescription: null,
        headingCount: null,
        paragraphCount: null,
        linkCount: null,
        textLength: null,
        textPreview: null,
      },
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(evaluation.normalizedUrl, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "SkyvanAdminParsePreview/1.0",
        Accept: "text/html,text/plain,application/pdf,*/*",
      },
      cache: "no-store",
    });

    clearTimeout(timeout);

    const contentType = response.headers.get("content-type");
    const finalUrl = response.url || evaluation.normalizedUrl;
    const lowerType = (contentType ?? "").toLowerCase();

    const parseSupported =
      lowerType.includes("text/html") || lowerType.includes("text/plain");

    if (!parseSupported) {
      return {
        ok: true,
        message: "İçerik alındı, ancak bu içerik tipi için parse önizleme sınırlı.",
        fieldErrors: {},
        result: {
          candidateUrl: candidateUrlRaw,
          normalizedUrl: evaluation.normalizedUrl,
          finalUrl,
          host: evaluation.host,
          pathname: evaluation.pathname,
          policyDecision: evaluation.decision,
          policyReasons: evaluation.reasons,
          httpStatus: response.status,
          contentType,
          parseSupported: false,
          detectedTitle: null,
          metaDescription: null,
          headingCount: null,
          paragraphCount: null,
          linkCount: null,
          textLength: null,
          textPreview: null,
        },
      };
    }

    const bodyText = await response.text();

    if (lowerType.includes("text/plain")) {
      const normalizedText = bodyText.replace(/\s+/g, " ").trim();

      return {
        ok: true,
        message: "Parse önizleme hazır.",
        fieldErrors: {},
        result: {
          candidateUrl: candidateUrlRaw,
          normalizedUrl: evaluation.normalizedUrl,
          finalUrl,
          host: evaluation.host,
          pathname: evaluation.pathname,
          policyDecision: evaluation.decision,
          policyReasons: evaluation.reasons,
          httpStatus: response.status,
          contentType,
          parseSupported: true,
          detectedTitle: null,
          metaDescription: null,
          headingCount: 0,
          paragraphCount: 0,
          linkCount: 0,
          textLength: normalizedText.length,
          textPreview: normalizedText.slice(0, 420) || null,
        },
      };
    }

    const cleanText = stripHtmlTags(bodyText);
    const detectedTitle = extractTitleFromHtml(bodyText);
    const metaDescription = extractMetaDescription(bodyText);
    const headingCount = countMatches(bodyText, /<h[1-6][^>]*>/gi);
    const paragraphCount = countMatches(bodyText, /<p[^>]*>/gi);
    const linkCount = countMatches(bodyText, /<a\s+[^>]*href=/gi);

    return {
      ok: true,
      message: "Parse önizleme hazır.",
      fieldErrors: {},
      result: {
        candidateUrl: candidateUrlRaw,
        normalizedUrl: evaluation.normalizedUrl,
        finalUrl,
        host: evaluation.host,
        pathname: evaluation.pathname,
        policyDecision: evaluation.decision,
        policyReasons: evaluation.reasons,
        httpStatus: response.status,
        contentType,
        parseSupported: true,
        detectedTitle,
        metaDescription,
        headingCount,
        paragraphCount,
        linkCount,
        textLength: cleanText.length,
        textPreview: cleanText.slice(0, 420) || null,
      },
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? `Parse önizleme başarısız oldu: ${error.message}`
          : "Parse önizleme başarısız oldu.",
      fieldErrors: {},
      result: null,
    };
  }
}

export async function archiveManufacturerSourceRegistryEntry(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    return;
  }

  const database = getDbOrThrow();

  await database
    .update(manufacturerSourceRegistries)
    .set({
      status: "archived",
      updatedAt: new Date(),
    })
    .where(eq(manufacturerSourceRegistries.id, id));

  revalidatePath("/admin/manufacturer-sources");
}

export async function restoreManufacturerSourceRegistryEntry(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    return;
  }

  const database = getDbOrThrow();

  await database
    .update(manufacturerSourceRegistries)
    .set({
      status: "active",
      updatedAt: new Date(),
    })
    .where(eq(manufacturerSourceRegistries.id, id));

  revalidatePath("/admin/manufacturer-sources");
}

export async function resetManufacturerSourceRegistryActionState(): Promise<ManufacturerSourceRegistryActionState> {
  return initialManufacturerSourceRegistryActionState;
}

export async function resetManufacturerSourceDryRunState(): Promise<ManufacturerSourceDryRunState> {
  return initialManufacturerSourceDryRunState;
}

export async function resetManufacturerSourceFetchPreviewState(): Promise<ManufacturerSourceFetchPreviewState> {
  return initialManufacturerSourceFetchPreviewState;
}

export async function resetManufacturerSourceParsePreviewState(): Promise<ManufacturerSourceParsePreviewState> {
  return initialManufacturerSourceParsePreviewState;
}