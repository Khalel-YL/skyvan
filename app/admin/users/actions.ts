"use server";

import { count, eq } from "drizzle-orm";
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

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getTrimmed(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function parseRole(value: string): UserRole | null {
  if (value === "user" || value === "admin") {
    return value;
  }

  return null;
}

function isUuid(value: string) {
  return UUID_PATTERN.test(value);
}

function getSafeErrorName(error: unknown) {
  return error instanceof Error ? error.name : "Error";
}

function getSafeErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function getUserMutationFailureCode(error: unknown) {
  const message = getSafeErrorMessage(error).toLowerCase();

  if (message.includes("duplicate key") || message.includes("23505")) {
    return "duplicate-key";
  }

  if (message.includes("violates foreign key constraint")) {
    return "relation-blocked";
  }

  if (message.includes("invalid input syntax for type uuid")) {
    return "invalid-id";
  }

  if (message.includes("database_url") || message.includes("fetch failed")) {
    return "db-write-failed";
  }

  return "update-failed";
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

  if (!id || !isUuid(id)) {
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

    const currentRows = await db
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
    } else if (currentUser.role === nextRole) {
      mutationCode = "noop";
    } else {
      previousUserForAudit = currentUser;

      if (currentUser.role === "admin" && nextRole === "user") {
        const adminCountRows = await db
          .select({
            value: count(),
          })
          .from(users)
          .where(eq(users.role, "admin"));

        const adminCount = Number(adminCountRows[0]?.value ?? 0);

        if (adminCount <= 1) {
          mutationCode = "last-admin-blocked";
        }
      }

      if (!mutationCode) {
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

        updatedUser = (updatedRows[0] as UserRecord | undefined) ?? null;

        if (!updatedUser || !previousUserForAudit) {
          mutationCode = "update-failed";
        } else {
          try {
            await writeStrictAuditLogInTransaction(db, {
              entityType: "user",
              entityId: updatedUser.id,
              action: "update",
              previousState: previousUserForAudit,
              newState: updatedUser,
              actor: auditActor,
            });
          } catch (error) {
            console.error("updateUserRole audit write error", {
              action: "updateUserRole",
              hasId: Boolean(id),
              errorName: getSafeErrorName(error),
              errorMessage: getSafeErrorMessage(error),
            });

            redirect(
              buildUsersRedirectUrl({
                ...returnParams,
                userAction: "error",
                userCode: "audit-write-failed",
              }),
            );
          }
        }
      }
    }

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

    console.error("updateUserRole error", {
      action: "updateUserRole",
      hasId: Boolean(id),
      errorName: getSafeErrorName(error),
      errorMessage: getSafeErrorMessage(error),
    });

    redirect(
      buildUsersRedirectUrl({
        ...returnParams,
        userAction: "error",
        userCode: getUserMutationFailureCode(error),
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
