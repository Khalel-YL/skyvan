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

type AccessSignInResult = {
  code: string;
  redirectTo?: string;
};

function getTrimmed(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function signInWithAccess(formData: FormData) {
  const email = getTrimmed(formData, "email");
  const name = getTrimmed(formData, "name");
  const accessKey = getTrimmed(formData, "accessKey");
  const next = normalizeAccessReturnPath(getTrimmed(formData, "next"));
  let signInResult: AccessSignInResult;

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
      signInResult = {
        code: "signed-in-admin",
        redirectTo: next,
      };
    } else {
      signInResult = {
        code: result.created ? "signed-in-created" : "signed-in-user",
      };
    }
  } catch (error) {
    let code = "sign-in-failed";

    if (error instanceof AccessLoginError) {
      code = error.code;
    } else if (error instanceof Error) {
      const message = error.message.toLowerCase();

      if (message.includes("session secret") || message.includes("signed session")) {
        code = "session-runtime-blocked";
      } else if (message.includes("database_url") || message.includes("users tablosu")) {
        code = "db-unavailable";
      }

      console.error("signInWithAccess failed:", {
        code,
        message: error.message,
      });
    } else {
      console.error("signInWithAccess failed with unknown error");
    }

    redirect(
      buildAccessRedirectUrl({
        code,
        email: email || undefined,
        name: name || undefined,
        next,
      }),
    );
  }

  if (signInResult.redirectTo) {
    redirect(signInResult.redirectTo);
  }

  redirect(
    buildAccessRedirectUrl({
      code: signInResult.code,
      next,
    }),
  );
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

  redirect(next);
}
