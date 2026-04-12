import "server-only";

import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { db } from "@/db/db";
import { users } from "@/db/schema";
import {
  SKYVAN_SESSION_COOKIE_NAME,
  createSkyvanSessionToken,
  getSkyvanSessionCookieOptions,
  getSkyvanSessionRuntime,
  verifySkyvanSessionToken,
} from "./session";

export type SkyvanCurrentUser = {
  id: string;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  role: "user" | "admin";
  lastSignedIn: Date;
};

type SkyvanAuthStateStatus =
  | "secret_missing"
  | "session_missing"
  | "session_invalid"
  | "session_expired"
  | "db_unavailable"
  | "user_missing"
  | "authenticated";

export type SkyvanAuthState = {
  status: SkyvanAuthStateStatus;
  isAuthenticated: boolean;
  user: SkyvanCurrentUser | null;
  openId: string | null;
  openIdPreview: string | null;
  sessionExpiresAt: Date | null;
  reason: string;
};

export type SkyvanAdminAccessState = SkyvanAuthState & {
  allowed: boolean;
  isAdmin: boolean;
};

function getOpenIdPreview(openId: string | null) {
  const normalized = String(openId ?? "").trim();

  if (!normalized) {
    return null;
  }

  if (normalized.length <= 18) {
    return normalized;
  }

  return `${normalized.slice(0, 10)}…${normalized.slice(-6)}`;
}

async function findUserByOpenId(openId: string): Promise<SkyvanCurrentUser | null> {
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
      lastSignedIn: users.lastSignedIn,
    })
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return (rows[0] as SkyvanCurrentUser | undefined) ?? null;
}

export async function getCurrentAuthState(): Promise<SkyvanAuthState> {
  const runtime = getSkyvanSessionRuntime();

  if (!runtime.configured) {
    return {
      status: "secret_missing",
      isAuthenticated: false,
      user: null,
      openId: null,
      openIdPreview: null,
      sessionExpiresAt: null,
      reason: runtime.reason,
    };
  }

  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SKYVAN_SESSION_COOKIE_NAME)?.value ?? "";
  const session = await verifySkyvanSessionToken(rawToken);

  if (!session.valid) {
    return {
      status:
        session.status === "expired"
          ? "session_expired"
          : session.status === "missing_token"
            ? "session_missing"
            : session.status === "missing_secret"
              ? "secret_missing"
              : "session_invalid",
      isAuthenticated: false,
      user: null,
      openId: null,
      openIdPreview: null,
      sessionExpiresAt: null,
      reason: session.reason,
    };
  }

  if (!db) {
    return {
      status: "db_unavailable",
      isAuthenticated: false,
      user: null,
      openId: session.payload.openId,
      openIdPreview: getOpenIdPreview(session.payload.openId),
      sessionExpiresAt: session.expiresAt,
      reason:
        "DATABASE_URL tanımlı olmadığı için signed session users tablosuna bağlanamadı. Admin erişimi fail-closed kalır.",
    };
  }

  try {
    const user = await findUserByOpenId(session.payload.openId);

    if (!user) {
      return {
        status: "user_missing",
        isAuthenticated: false,
        user: null,
        openId: session.payload.openId,
        openIdPreview: getOpenIdPreview(session.payload.openId),
        sessionExpiresAt: session.expiresAt,
        reason:
          "Session içindeki openId users tablosunda bulunamadı. Request → user mapping kurulamadığı için admin erişimi reddedildi.",
      };
    }

    return {
      status: "authenticated",
      isAuthenticated: true,
      user,
      openId: user.openId,
      openIdPreview: getOpenIdPreview(user.openId),
      sessionExpiresAt: session.expiresAt,
      reason: "Signed session doğrulandı ve users tablosuna bağlandı.",
    };
  } catch (error) {
    console.error("getCurrentAuthState error:", error);

    return {
      status: "db_unavailable",
      isAuthenticated: false,
      user: null,
      openId: session.payload.openId,
      openIdPreview: getOpenIdPreview(session.payload.openId),
      sessionExpiresAt: session.expiresAt,
      reason:
        "Users tablosu doğrulaması tamamlanamadı. Admin erişimi fail-closed çalışır.",
    };
  }
}

export async function getCurrentUser() {
  const auth = await getCurrentAuthState();
  return auth.user;
}

export async function getAdminAccessState(): Promise<SkyvanAdminAccessState> {
  const auth = await getCurrentAuthState();

  if (!auth.isAuthenticated || !auth.user) {
    return {
      ...auth,
      allowed: false,
      isAdmin: false,
    };
  }

  if (auth.user.role !== "admin") {
    return {
      ...auth,
      allowed: false,
      isAdmin: false,
      reason:
        "Signed session doğrulandı ancak kullanıcı rolü admin değil. Admin route erişimi reddedildi.",
    };
  }

  return {
    ...auth,
    allowed: true,
    isAdmin: true,
    reason: "Admin oturumu doğrulandı.",
  };
}

export async function requireAuth() {
  const auth = await getCurrentAuthState();

  if (!auth.isAuthenticated || !auth.user) {
    redirect("/");
  }

  return auth.user;
}

export async function requireAdmin() {
  const access = await getAdminAccessState();

  if (!access.allowed || !access.user) {
    redirect("/");
  }

  return access.user;
}

export async function setCurrentUserSession(input: {
  openId: string;
  maxAgeSeconds?: number;
}) {
  if (!db) {
    throw new Error(
      "DATABASE_URL tanımlı olmadığı için session kurulamadı. Users tablosu doğrulanmadan signed session üretilemez.",
    );
  }

  const openId = input.openId.trim();

  if (!openId) {
    throw new Error("Session kurulumu için geçerli openId gerekir.");
  }

  const existingUser = await findUserByOpenId(openId);

  if (!existingUser) {
    throw new Error(
      "Users tablosunda bulunmayan openId için signed session üretilemez.",
    );
  }

  const cookieStore = await cookies();
  const session = await createSkyvanSessionToken({
    ...input,
    openId,
  });

  cookieStore.set(
    SKYVAN_SESSION_COOKIE_NAME,
    session.token,
    getSkyvanSessionCookieOptions(session.expiresAt),
  );

  return session;
}

export async function clearCurrentUserSession() {
  const cookieStore = await cookies();

  cookieStore.set(SKYVAN_SESSION_COOKIE_NAME, "", {
    ...getSkyvanSessionCookieOptions(new Date(0)),
    expires: new Date(0),
  });
}
