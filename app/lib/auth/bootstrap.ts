import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";

import { and, count, eq, sql } from "drizzle-orm";

import { insertAuditLogWithActor } from "@/app/lib/admin/audit";
import { getDbOrThrow, hasDatabaseUrl } from "@/db/db";
import { users } from "@/db/schema";

const ADMIN_BOOTSTRAP_SECRET_ENV = "SKYVAN_ADMIN_BOOTSTRAP_SECRET";
const ADMIN_BOOTSTRAP_SECRET_MIN_LENGTH = 32;
const ADMIN_BOOTSTRAP_LOCK_KEY = 842319551;

type BootstrapUser = {
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

export type AdminBootstrapRuntime = {
  configured: boolean;
  secretConfigured: boolean;
  reason: string;
};

export type AdminBootstrapState = {
  configured: boolean;
  secretConfigured: boolean;
  adminCount: number;
  isOpen: boolean;
  canClaim: boolean;
  reason: string;
};

export class AdminBootstrapError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

function getBootstrapSecret() {
  return String(process.env[ADMIN_BOOTSTRAP_SECRET_ENV] ?? "").trim();
}

function hashBootstrapSecret(secret: string) {
  return createHash("sha256").update(secret).digest();
}

function safeBootstrapSecretEquals(input: string, expected: string) {
  const inputHash = hashBootstrapSecret(input.trim());
  const expectedHash = hashBootstrapSecret(expected.trim());

  return timingSafeEqual(inputHash, expectedHash);
}

function mapBootstrapUser(row: BootstrapUser) {
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

async function getAdminCount() {
  if (!hasDatabaseUrl) {
    return 0;
  }

  const database = getDbOrThrow();
  const rows = await database
    .select({ value: count() })
    .from(users)
    .where(eq(users.role, "admin"));

  return Number(rows[0]?.value ?? 0);
}

export function getAdminBootstrapRuntime(): AdminBootstrapRuntime {
  const secret = getBootstrapSecret();

  if (!secret) {
    return {
      configured: false,
      secretConfigured: false,
      reason:
        "SKYVAN_ADMIN_BOOTSTRAP_SECRET tanımlı değil. İlk admin ownership claim fail-closed kapalı kalır.",
    };
  }

  if (secret.length < ADMIN_BOOTSTRAP_SECRET_MIN_LENGTH) {
    return {
      configured: false,
      secretConfigured: false,
      reason:
        "SKYVAN_ADMIN_BOOTSTRAP_SECRET en az 32 karakter olmalıdır. Zayıf bootstrap secret kabul edilmez.",
    };
  }

  if (!hasDatabaseUrl) {
    return {
      configured: false,
      secretConfigured: true,
      reason:
        "DATABASE_URL tanımlı olmadığı için bootstrap ownership doğrulanamaz. Sistem fail-closed kalır.",
    };
  }

  return {
    configured: true,
    secretConfigured: true,
    reason:
      "Bootstrap ownership gate aktif. İlk admin claim yalnızca explicit secret ve authenticated user ile açılır.",
  };
}

export async function getAdminBootstrapState(input?: {
  currentUserId?: string | null;
  currentUserRole?: "user" | "admin" | null;
}) {
  const runtime = getAdminBootstrapRuntime();

  if (!runtime.configured) {
    return {
      configured: false,
      secretConfigured: runtime.secretConfigured,
      adminCount: 0,
      isOpen: false,
      canClaim: false,
      reason: runtime.reason,
    } satisfies AdminBootstrapState;
  }

  try {
    const adminCount = await getAdminCount();
    const isOpen = adminCount === 0;
    const currentUserRole = input?.currentUserRole ?? null;

    if (!isOpen) {
      return {
        configured: true,
        secretConfigured: runtime.secretConfigured,
        adminCount,
        isOpen: false,
        canClaim: false,
        reason:
          "Sistemde en az bir admin bulunduğu için bootstrap ownership gate kapanmıştır.",
      } satisfies AdminBootstrapState;
    }

    if (!input?.currentUserId) {
      return {
        configured: true,
        secretConfigured: runtime.secretConfigured,
        adminCount,
        isOpen: true,
        canClaim: false,
        reason:
          "İlk admin claim açık. Ancak claim yalnızca authenticated kullanıcı oturumu ile yapılabilir.",
      } satisfies AdminBootstrapState;
    }

    if (currentUserRole === "admin") {
      return {
        configured: true,
        secretConfigured: runtime.secretConfigured,
        adminCount,
        isOpen: false,
        canClaim: false,
        reason:
          "Bu kullanıcı zaten admin. Bootstrap ownership claim tekrar kullanılamaz.",
      } satisfies AdminBootstrapState;
    }

    return {
      configured: true,
      secretConfigured: runtime.secretConfigured,
      adminCount,
      isOpen: true,
      canClaim: true,
      reason:
        "İlk admin claim açık. Authenticated kullanıcı explicit bootstrap secret ile ownership claim yapabilir.",
    } satisfies AdminBootstrapState;
  } catch (error) {
    console.error("getAdminBootstrapState error:", error);

    return {
      configured: false,
      secretConfigured: runtime.secretConfigured,
      adminCount: 0,
      isOpen: false,
      canClaim: false,
      reason:
        "Bootstrap ownership durumu okunamadı. Sistem fail-closed çalışır.",
    } satisfies AdminBootstrapState;
  }
}

export async function claimInitialAdminOwnership(input: {
  currentUserId: string;
  bootstrapSecret: string;
}) {
  const runtime = getAdminBootstrapRuntime();

  if (!runtime.configured) {
    throw new AdminBootstrapError("bootstrap-runtime-blocked", runtime.reason);
  }

  const bootstrapSecret = input.bootstrapSecret.trim();

  if (!bootstrapSecret) {
    throw new AdminBootstrapError(
      "bootstrap-secret-required",
      "Bootstrap secret zorunludur.",
    );
  }

  if (!safeBootstrapSecretEquals(bootstrapSecret, getBootstrapSecret())) {
    throw new AdminBootstrapError(
      "bootstrap-secret-invalid",
      "Bootstrap secret doğrulanamadı. Ownership claim reddedildi.",
    );
  }

  const database = getDbOrThrow();
  const now = new Date();
  let claimedUser: ReturnType<typeof mapBootstrapUser> | null = null;
  let previousUser: ReturnType<typeof mapBootstrapUser> | null = null;
  let claimed = false;
  let mutationError: AdminBootstrapError | null = null;

  await database.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(${ADMIN_BOOTSTRAP_LOCK_KEY})`);

    const adminCountRows = await tx
      .select({ value: count() })
      .from(users)
      .where(eq(users.role, "admin"));

    const adminCount = Number(adminCountRows[0]?.value ?? 0);

    if (adminCount > 0) {
      mutationError = new AdminBootstrapError(
        "bootstrap-closed",
        "Sistemde zaten admin bulunduğu için bootstrap ownership claim kapanmıştır.",
      );
      return;
    }

    const currentRows = await tx
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
      .where(eq(users.id, input.currentUserId))
      .limit(1);

    const currentUser = (currentRows[0] as BootstrapUser | undefined) ?? null;

    if (!currentUser) {
      mutationError = new AdminBootstrapError(
        "bootstrap-user-missing",
        "Ownership claim yapan session users tablosunda bulunamadı.",
      );
      return;
    }

    previousUser = mapBootstrapUser(currentUser);

    if (currentUser.role === "admin") {
      claimedUser = mapBootstrapUser(currentUser);
      claimed = false;
      return;
    }

    const promotedRows = await tx
      .update(users)
      .set({
        role: "admin",
        updatedAt: now,
      })
      .where(and(eq(users.id, currentUser.id), eq(users.role, "user")))
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

    const promotedUser = (promotedRows[0] as BootstrapUser | undefined) ?? null;

    if (!promotedUser) {
      mutationError = new AdminBootstrapError(
        "bootstrap-claim-failed",
        "İlk admin claim işlemi tamamlanamadı.",
      );
      return;
    }

    claimedUser = mapBootstrapUser(promotedUser);
    claimed = true;

    await insertAuditLogWithActor(tx, {
      entityType: "user",
      entityId: promotedUser.id,
      action: "update",
      previousState: previousUser,
      newState: claimedUser,
      adminUserId: currentUser.id,
    });
  });

  if (mutationError) {
    throw mutationError;
  }

  if (!claimedUser || !previousUser) {
    throw new AdminBootstrapError(
      "bootstrap-claim-failed",
      "İlk admin claim işlemi işlem sonrası doğrulanamadı.",
    );
  }

  return {
    user: claimedUser,
    previousUser,
    claimed,
  };
}
