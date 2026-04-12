"use server";

import { count, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getDbOrThrow } from "@/db/db";
import { users } from "@/db/schema";
import {
  AuditActorBindingError,
  requireStrictAuditActor,
  writeStrictAuditLogInTransaction,
} from "@/app/lib/admin/audit";

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

const ADMIN_ROLE_GUARD_LOCK_KEY = 842319552;

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
    const auditActor = await requireStrictAuditActor();
    let previousUserForAudit: UserRecord | null = null;
    let updatedUser: UserRecord | null = null;
    let mutationCode: "missing-user" | "noop" | "last-admin-blocked" | "update-failed" | null =
      null;

    await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(${ADMIN_ROLE_GUARD_LOCK_KEY})`);

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
        .where(eq(users.id, id))
        .limit(1);

      const currentUser = (currentRows[0] as UserRecord | undefined) ?? null;

      if (!currentUser) {
        mutationCode = "missing-user";
        return;
      }

      previousUserForAudit = currentUser;

      if (currentUser.role === nextRole) {
        mutationCode = "noop";
        return;
      }

      if (currentUser.role === "admin" && nextRole === "user") {
        const adminCountRows = await tx
          .select({
            value: count(),
          })
          .from(users)
          .where(eq(users.role, "admin"));

        const adminCount = Number(adminCountRows[0]?.value ?? 0);

        if (adminCount <= 1) {
          mutationCode = "last-admin-blocked";
          return;
        }
      }

      const updatedRows = await tx
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

      updatedUser = (updatedRows[0] as UserRecord | undefined) ?? null;

      if (!updatedUser) {
        mutationCode = "update-failed";
        return;
      }

      if (!updatedUser || !previousUserForAudit) {
        mutationCode = "update-failed";
        return;
      }

      await writeStrictAuditLogInTransaction(tx, {
        entityType: "user",
        entityId: updatedUser.id,
        action: "update",
        previousState: previousUserForAudit,
        newState: updatedUser,
        actor: auditActor,
      });
    });

    if (mutationCode === "missing-user") {
      redirect(
        buildUsersRedirectUrl({
          ...returnParams,
          userAction: "error",
          userCode: "missing-user",
        }),
      );
    }

    if (mutationCode === "noop") {
      redirect(
        buildUsersRedirectUrl({
          ...returnParams,
          userAction: "noop",
        }),
      );
    }

    if (mutationCode === "last-admin-blocked") {
      redirect(
        buildUsersRedirectUrl({
          ...returnParams,
          userAction: "error",
          userCode: "last-admin-blocked",
        }),
      );
    }

    if (mutationCode === "update-failed") {
      redirect(
        buildUsersRedirectUrl({
          ...returnParams,
          userAction: "error",
          userCode: "update-failed",
        }),
      );
    }
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    if (error instanceof AuditActorBindingError) {
      redirect(
        buildUsersRedirectUrl({
          ...returnParams,
          userAction: "error",
          userCode: "audit-actor-required",
        }),
      );
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
