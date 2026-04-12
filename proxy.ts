import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";

import {
  SKYVAN_SESSION_COOKIE_NAME,
  verifySkyvanSessionToken,
} from "@/app/lib/auth/session";
import { db } from "@/db/db";
import { users } from "@/db/schema";

const READ_ONLY_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function buildDeniedResponse(status: number, code: string, message: string) {
  return NextResponse.json(
    {
      ok: false,
      code,
      message,
    },
    { status },
  );
}

export async function proxy(request: NextRequest) {
  if (READ_ONLY_METHODS.has(request.method)) {
    return NextResponse.next();
  }

  const session = await verifySkyvanSessionToken(
    request.cookies.get(SKYVAN_SESSION_COOKIE_NAME)?.value ?? "",
  );

  if (!session.valid) {
    return buildDeniedResponse(
      session.status === "missing_secret" ? 503 : 401,
      "admin-auth-blocked",
      session.reason,
    );
  }

  if (!db) {
    return buildDeniedResponse(
      503,
      "admin-db-unavailable",
      "DATABASE_URL tanımlı olmadığı için admin mutation doğrulanamadı.",
    );
  }

  try {
    const rows = await db
      .select({
        id: users.id,
        role: users.role,
      })
      .from(users)
      .where(eq(users.openId, session.payload.openId))
      .limit(1);

    const user = rows[0] ?? null;

    if (!user) {
      return buildDeniedResponse(
        401,
        "admin-user-missing",
        "Session içindeki openId users tablosunda bulunamadı.",
      );
    }

    if (user.role !== "admin") {
      return buildDeniedResponse(
        403,
        "admin-role-blocked",
        "Admin mutation için admin rolü gerekir.",
      );
    }
  } catch (error) {
    console.error("admin proxy auth error:", error);

    return buildDeniedResponse(
      503,
      "admin-auth-validation-failed",
      "Admin mutation doğrulaması tamamlanamadı.",
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
