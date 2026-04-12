"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { claimInitialAdminOwnership, AdminBootstrapError } from "@/app/lib/auth/bootstrap";
import {
  clearCurrentUserSession,
  getCurrentUser,
  setCurrentUserSession,
} from "@/app/lib/auth/server";
import {
  AccessLoginError,
  buildAccessRedirectUrl,
  normalizeAccessReturnPath,
  resolveAccessIdentity,
} from "@/app/lib/auth/access";

function getTrimmed(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function signInWithAccess(formData: FormData) {
  const email = getTrimmed(formData, "email");
  const name = getTrimmed(formData, "name");
  const accessKey = getTrimmed(formData, "accessKey");
  const next = normalizeAccessReturnPath(getTrimmed(formData, "next"));

  try {
    const result = await resolveAccessIdentity({
      email,
      name,
      accessKey,
    });

    await setCurrentUserSession({
      openId: result.user.openId,
    });

    if (result.user.role === "admin") {
      redirect(next);
    }

    redirect(
      buildAccessRedirectUrl({
        code: result.created ? "signed-in-created" : "signed-in-user",
      }),
    );
  } catch (error) {
    const code =
      error instanceof AccessLoginError ? error.code : "sign-in-failed";

    redirect(
      buildAccessRedirectUrl({
        code,
        email: email || undefined,
        name: name || undefined,
        next,
      }),
    );
  }
}

export async function signOutFromAccess() {
  await clearCurrentUserSession();
  redirect(
    buildAccessRedirectUrl({
      code: "signed-out",
    }),
  );
}

export async function claimInitialAdmin(formData: FormData) {
  const bootstrapSecret = getTrimmed(formData, "bootstrapSecret");
  const next = normalizeAccessReturnPath(getTrimmed(formData, "next"));
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect(
      buildAccessRedirectUrl({
        code: "bootstrap-auth-required",
        next,
      }),
    );
  }

  if (currentUser.role === "admin") {
    redirect(next);
  }

  try {
    await claimInitialAdminOwnership({
      currentUserId: currentUser.id,
      bootstrapSecret,
    });

    revalidatePath("/access");
    revalidatePath("/admin");
    revalidatePath("/admin/users");
    revalidatePath("/admin/audit");

    redirect(next);
  } catch (error) {
    const code =
      error instanceof AdminBootstrapError
        ? error.code
        : "bootstrap-claim-failed";

    redirect(
      buildAccessRedirectUrl({
        code,
        next,
      }),
    );
  }
}
