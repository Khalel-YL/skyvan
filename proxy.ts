import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";

import {
  SKYVAN_SESSION_COOKIE_NAME,
  verifySkyvanSessionToken,
} from "@/app/lib/auth/session";
import { db } from "@/db/db";
import { users } from "@/db/schema";

const READ_ONLY_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function getPublicLocale(pathname: string) {
  const firstSegment = pathname.split("/").filter(Boolean)[0];

  return firstSegment === "tr" || firstSegment === "en" ? firstSegment : null;
}

function continueRequest(request: NextRequest, locale: "tr" | "en" | null) {
  if (!locale) {
    return NextResponse.next();
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-skyvan-locale", locale);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

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
  const locale = getPublicLocale(request.nextUrl.pathname);
  const nextResponse = continueRequest(request, locale);

  if (!request.nextUrl.pathname.startsWith("/admin")) {
    return nextResponse;
  }

  if (READ_ONLY_METHODS.has(request.method)) {
    return nextResponse;
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
  matcher: ["/admin/:path*", "/tr", "/tr/:path*", "/en", "/en/:path*"],
};
