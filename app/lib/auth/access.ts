import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { and, eq, sql } from "drizzle-orm";

import { db, getDbOrThrow } from "@/db/db";
import { users } from "@/db/schema";

const ACCESS_KEY_ENV = "SKYVAN_ACCESS_KEY";
const IDENTITY_SECRET_ENV = "SKYVAN_IDENTITY_SECRET";
const ACCESS_ALLOWLIST_ENV = "SKYVAN_ACCESS_ALLOWLIST";
const ACCESS_SECRET_MIN_LENGTH = 32;
const ACCESS_LOGIN_METHOD = "controlled_access_v1";
const DEFAULT_ACCESS_RETURN_PATH = "/admin";

export type AccessRuntime = {
  configured: boolean;
  allowlistEnabled: boolean;
  allowlistedEmails: string[];
  reason: string;
};

export type AccessUserRecord = {
  id: string;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
};

export class AccessLoginError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

function getEnv(name: string) {
  return String(process.env[name] ?? "").trim();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function normalizeName(value: string) {
  const normalized = value.trim();

  if (!normalized) {
    return null;
  }

  if (normalized.length < 2 || normalized.length > 80) {
    throw new AccessLoginError(
      "invalid-name",
      "Ad alanı boş bırakılabilir veya 2 ile 80 karakter arasında olmalıdır.",
    );
  }

  return normalized;
}

function parseAllowlist(rawValue: string) {
  if (!rawValue) {
    return {
      ok: true as const,
      emails: [] as string[],
    };
  }

  const rawItems = rawValue
    .split(/[,\n;]/)
    .map((item) => normalizeEmail(item))
    .filter(Boolean);

  if (rawItems.some((item) => !isValidEmail(item))) {
    return {
      ok: false as const,
      emails: [] as string[],
    };
  }

  return {
    ok: true as const,
    emails: Array.from(new Set(rawItems)).sort((left, right) =>
      left.localeCompare(right, "en"),
    ),
  };
}

function safeSecretEquals(input: string, expected: string) {
  const normalizedInput = input.trim();
  const normalizedExpected = expected.trim();
  const inputBuffer = Buffer.from(normalizedInput);
  const expectedBuffer = Buffer.from(normalizedExpected);

  if (inputBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(inputBuffer, expectedBuffer);
}

function deriveOpenId(email: string, identitySecret: string) {
  const digest = createHmac("sha256", identitySecret).update(email).digest("hex");
  return `email_v1_${digest}`;
}

function mapUserRow(row: {
  id: string;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
}): AccessUserRecord {
  return {
    id: row.id,
    openId: row.openId,
    name: row.name,
    email: row.email,
    loginMethod: row.loginMethod,
    role: row.role,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    lastSignedIn: row.lastSignedIn,
  };
}

async function findUsersByNormalizedEmail(email: string) {
  if (!db) {
    return [] as AccessUserRecord[];
  }

  const rows = await db
    .select({
      id: users.id,
      openId: users.openId,
      name: users.name,
      email: users.email,
      loginMethod: users.loginMethod,
      role: users.role,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      lastSignedIn: users.lastSignedIn,
    })
    .from(users)
    .where(sql`lower(${users.email}) = ${email}`)
    .limit(2);

  return rows.map(mapUserRow);
}

async function findUserByOpenId(openId: string) {
  if (!db) {
    return null;
  }

  const rows = await db
    .select({
      id: users.id,
      openId: users.openId,
      name: users.name,
      email: users.email,
      loginMethod: users.loginMethod,
      role: users.role,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      lastSignedIn: users.lastSignedIn,
    })
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return rows[0] ? mapUserRow(rows[0]) : null;
}

export function getAccessRuntime(): AccessRuntime {
  const accessKey = getEnv(ACCESS_KEY_ENV);
  const identitySecret = getEnv(IDENTITY_SECRET_ENV);
  const allowlist = parseAllowlist(getEnv(ACCESS_ALLOWLIST_ENV));

  if (!accessKey) {
    return {
      configured: false,
      allowlistEnabled: false,
      allowlistedEmails: [],
      reason:
        "SKYVAN_ACCESS_KEY tanımlı değil. Controlled access entry fail-closed kalır ve yeni session üretilemez.",
    };
  }

  if (accessKey.length < ACCESS_SECRET_MIN_LENGTH) {
    return {
      configured: false,
      allowlistEnabled: false,
      allowlistedEmails: [],
      reason:
        "SKYVAN_ACCESS_KEY en az 32 karakter olmalıdır. Zayıf access key ile controlled access entry kabul edilmez.",
    };
  }

  if (!identitySecret) {
    return {
      configured: false,
      allowlistEnabled: false,
      allowlistedEmails: [],
      reason:
        "SKYVAN_IDENTITY_SECRET tanımlı değil. Deterministic identity üretimi kapalı olduğu için controlled access entry fail-closed çalışır.",
    };
  }

  if (identitySecret.length < ACCESS_SECRET_MIN_LENGTH) {
    return {
      configured: false,
      allowlistEnabled: false,
      allowlistedEmails: [],
      reason:
        "SKYVAN_IDENTITY_SECRET en az 32 karakter olmalıdır. Zayıf identity secret ile controlled access entry kabul edilmez.",
    };
  }

  if (!allowlist.ok) {
    return {
      configured: false,
      allowlistEnabled: false,
      allowlistedEmails: [],
      reason:
        "SKYVAN_ACCESS_ALLOWLIST içinde geçersiz e-posta değeri var. Controlled access entry fail-closed çalışır.",
    };
  }

  if (!db) {
    return {
      configured: false,
      allowlistEnabled: allowlist.emails.length > 0,
      allowlistedEmails: allowlist.emails,
      reason:
        "DATABASE_URL tanımlı olmadığı için users tablosu çözümü kapalı. Controlled access entry fail-closed çalışır.",
    };
  }

  return {
    configured: true,
    allowlistEnabled: allowlist.emails.length > 0,
    allowlistedEmails: allowlist.emails,
    reason:
      allowlist.emails.length > 0
        ? "Interim controlled access flow aktif. Existing user çözümü ve allowlist tabanlı kontrollü provisioning açık."
        : "Interim controlled access flow aktif. Existing user çözümü açık, kontrollü provisioning kapalı.",
  };
}

export function normalizeAccessReturnPath(value: string | null | undefined) {
  const normalized = String(value ?? "").trim();

  if (!normalized || !normalized.startsWith("/") || normalized.startsWith("//")) {
    return DEFAULT_ACCESS_RETURN_PATH;
  }

  if (normalized.startsWith("/access")) {
    return DEFAULT_ACCESS_RETURN_PATH;
  }

  return normalized;
}

export function buildAccessRedirectUrl(params: Record<string, string | null | undefined>) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      searchParams.set(key, value);
    }
  }

  const query = searchParams.toString();

  return query ? `/access?${query}` : "/access";
}

export async function resolveAccessIdentity(input: {
  email: string;
  name?: string;
  accessKey: string;
}) {
  const runtime = getAccessRuntime();

  if (!runtime.configured) {
    throw new AccessLoginError("runtime-blocked", runtime.reason);
  }

  const accessKey = input.accessKey.trim();

  if (!accessKey) {
    throw new AccessLoginError("missing-key", "Access key zorunludur.");
  }

  if (!safeSecretEquals(accessKey, getEnv(ACCESS_KEY_ENV))) {
    throw new AccessLoginError(
      "invalid-key",
      "Access key doğrulanamadı. Signed session üretilmedi.",
    );
  }

  const normalizedEmail = normalizeEmail(input.email);

  if (!isValidEmail(normalizedEmail)) {
    throw new AccessLoginError(
      "invalid-email",
      "Geçerli bir e-posta adresi girilmelidir.",
    );
  }

  const normalizedName = normalizeName(String(input.name ?? ""));
  const existingUsersByEmail = await findUsersByNormalizedEmail(normalizedEmail);

  if (existingUsersByEmail.length > 1) {
    throw new AccessLoginError(
      "identity-ambiguous",
      "Bu e-posta birden fazla users kaydıyla eşleşiyor. Controlled access entry fail-closed çalıştı.",
    );
  }

  const database = getDbOrThrow();
  const now = new Date();

  if (existingUsersByEmail.length === 1) {
    const existingUser = existingUsersByEmail[0];
    const updatedRows = await database
      .update(users)
      .set({
        name: normalizedName ?? existingUser.name,
        email: normalizedEmail,
        loginMethod: ACCESS_LOGIN_METHOD,
        updatedAt: now,
        lastSignedIn: now,
      })
      .where(eq(users.id, existingUser.id))
      .returning({
        id: users.id,
        openId: users.openId,
        name: users.name,
        email: users.email,
        loginMethod: users.loginMethod,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        lastSignedIn: users.lastSignedIn,
      });

    const resolvedUser = updatedRows[0] ? mapUserRow(updatedRows[0]) : null;

    if (!resolvedUser) {
      throw new AccessLoginError(
        "user-update-failed",
        "Mevcut kullanıcı kaydı güncellenemedi. Session oluşturulmadı.",
      );
    }

    return {
      user: resolvedUser,
      created: false,
    };
  }

  if (!runtime.allowlistEnabled) {
    throw new AccessLoginError(
      "creation-disabled",
      "Kontrollü provisioning kapalı. Bu e-posta için önce users kaydı açılmalıdır.",
    );
  }

  if (!runtime.allowlistedEmails.includes(normalizedEmail)) {
    throw new AccessLoginError(
      "not-allowlisted",
      "Bu e-posta kontrollü provisioning allowlist içinde olmadığı için kullanıcı oluşturulmadı.",
    );
  }

  const derivedOpenId = deriveOpenId(normalizedEmail, getEnv(IDENTITY_SECRET_ENV));
  const conflictingOpenIdUser = await findUserByOpenId(derivedOpenId);

  if (conflictingOpenIdUser) {
    throw new AccessLoginError(
      "identity-conflict",
      "Derived openId zaten başka bir kullanıcıyla bağlı. Controlled access entry fail-closed çalıştı.",
    );
  }

  try {
    const insertedRows = await database
      .insert(users)
      .values({
        openId: derivedOpenId,
        name: normalizedName,
        email: normalizedEmail,
        loginMethod: ACCESS_LOGIN_METHOD,
        role: "user",
        createdAt: now,
        updatedAt: now,
        lastSignedIn: now,
      })
      .returning({
        id: users.id,
        openId: users.openId,
        name: users.name,
        email: users.email,
        loginMethod: users.loginMethod,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        lastSignedIn: users.lastSignedIn,
      });

    const createdUser = insertedRows[0] ? mapUserRow(insertedRows[0]) : null;

    if (!createdUser) {
      throw new AccessLoginError(
        "user-create-failed",
        "Yeni kullanıcı kaydı oluşturulamadı. Session kurulmadı.",
      );
    }

    return {
      user: createdUser,
      created: true,
    };
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code?: unknown }).code ?? "")
        : "";

    if (error instanceof AccessLoginError) {
      throw error;
    }

    if (code === "23505") {
      const concurrentUser = await findUserByOpenId(derivedOpenId);

      if (concurrentUser && normalizeEmail(concurrentUser.email ?? "") === normalizedEmail) {
        const refreshedRows = await database
          .update(users)
          .set({
            name: normalizedName ?? concurrentUser.name,
            email: normalizedEmail,
            loginMethod: ACCESS_LOGIN_METHOD,
            updatedAt: now,
            lastSignedIn: now,
          })
          .where(and(eq(users.id, concurrentUser.id), eq(users.openId, derivedOpenId)))
          .returning({
            id: users.id,
            openId: users.openId,
            name: users.name,
            email: users.email,
            loginMethod: users.loginMethod,
            role: users.role,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt,
            lastSignedIn: users.lastSignedIn,
          });

        const resolvedUser = refreshedRows[0] ? mapUserRow(refreshedRows[0]) : concurrentUser;

        return {
          user: resolvedUser,
          created: false,
        };
      }
    }

    throw new AccessLoginError(
      "user-create-failed",
      "Yeni kullanıcı oluşturulurken beklenmeyen bir hata oluştu. Session kurulmadı.",
    );
  }
}
