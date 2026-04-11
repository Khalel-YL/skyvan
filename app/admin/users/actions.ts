"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getDbOrThrow } from "@/db/db";
import { users } from "@/db/schema";
import { writeAdminAudit } from "@/app/lib/admin/audit";

type UserRole = "user" | "admin";

type UserRecord = {
  id: string;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
};

function getTrimmed(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function parseRole(value: string): UserRole | null {
  if (value === "user" || value === "admin") {
    return value;
  }

  return null;
}

function normalizeRoleFilter(value: string) {
  if (value === "user" || value === "admin") {
    return value;
  }

  return "all";
}

function isNextRedirectError(error: unknown) {
  if (typeof error !== "object" || error === null || !("digest" in error)) {
    return false;
  }

  const digest = (error as { digest?: unknown }).digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}

function buildUsersRedirectUrl(
  params: Record<string, string | number | undefined | null>,
) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  }

  const query = searchParams.toString();
  return query ? `/admin/users?${query}` : "/admin/users";
}

async function findUserById(id: string): Promise<UserRecord | null> {
  const db = getDbOrThrow();

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
    .where(eq(users.id, id))
    .limit(1);

  return (rows[0] as UserRecord | undefined) ?? null;
}

export async function updateUserRole(formData: FormData) {
  const db = getDbOrThrow();

  const id = getTrimmed(formData, "id");
  const nextRole = parseRole(getTrimmed(formData, "role"));
  const q = getTrimmed(formData, "returnQ");
  const roleFilter = normalizeRoleFilter(getTrimmed(formData, "returnRole"));
  const returnParams = {
    q: q || undefined,
    role: roleFilter !== "all" ? roleFilter : undefined,
  };

  if (!id) {
    redirect(
      buildUsersRedirectUrl({
        ...returnParams,
        userAction: "error",
        userCode: "invalid-id",
      }),
    );
  }

  if (!nextRole) {
    redirect(
      buildUsersRedirectUrl({
        ...returnParams,
        userAction: "error",
        userCode: "invalid-role",
      }),
    );
  }

  const existingUser = await findUserById(id);

  if (!existingUser) {
    redirect(
      buildUsersRedirectUrl({
        ...returnParams,
        userAction: "error",
        userCode: "missing-user",
      }),
    );
  }

  if (existingUser.role === nextRole) {
    redirect(
      buildUsersRedirectUrl({
        ...returnParams,
        userAction: "noop",
      }),
    );
  }

  try {
    const updatedRows = await db
      .update(users)
      .set({
        role: nextRole,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
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

    const updatedUser = (updatedRows[0] as UserRecord | undefined) ?? null;

    if (!updatedUser) {
      redirect(
        buildUsersRedirectUrl({
          ...returnParams,
          userAction: "error",
          userCode: "update-failed",
        }),
      );
    }

    await writeAdminAudit({
      entityType: "user",
      logLabel: "user",
      entityId: updatedUser.id,
      action: "update",
      previousState: existingUser,
      newState: updatedUser,
    });
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    console.error("updateUserRole error:", error);

    redirect(
      buildUsersRedirectUrl({
        ...returnParams,
        userAction: "error",
        userCode: "update-failed",
      }),
    );
  }

  revalidatePath("/admin");
  revalidatePath("/admin/users");

  redirect(
    buildUsersRedirectUrl({
      ...returnParams,
      userAction: "updated",
    }),
  );
}
