import "server-only";

import { createHmac, randomBytes } from "node:crypto";

import { cookies } from "next/headers";

const PUBLIC_SESSION_SECRET_ENV = "SKYVAN_PUBLIC_SESSION_SECRET";
const PUBLIC_SESSION_SECRET_MIN_LENGTH = 32;
const PUBLIC_SESSION_TOKEN_BYTES = 32;
const PUBLIC_SESSION_TOKEN_LENGTH = 43;
const PUBLIC_SESSION_MAX_TOKEN_LENGTH = 128;

export const PUBLIC_WORKSHOP_SESSION_COOKIE_NAME = "skyvan_public_session";
export const PUBLIC_WORKSHOP_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 90;

export type PreparedPublicWorkshopIdentity = {
  hadExistingCookie: boolean;
  existingRawToken: string | null;
  existingTokenHash: string | null;
  candidateRawToken: string;
  candidateTokenHash: string;
};

export class PublicWorkshopIdentityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PublicWorkshopIdentityError";
  }
}

function getPublicSessionSecret() {
  return String(process.env[PUBLIC_SESSION_SECRET_ENV] ?? "").trim();
}

function assertPublicSessionSecret() {
  const secret = getPublicSessionSecret();

  if (secret.length < PUBLIC_SESSION_SECRET_MIN_LENGTH) {
    throw new PublicWorkshopIdentityError(
      "Workshop oturum güvenliği henüz yapılandırılmadı.",
    );
  }

  return secret;
}

function isSafeBase64UrlToken(value: string) {
  if (value.length !== PUBLIC_SESSION_TOKEN_LENGTH) {
    return false;
  }

  if (value.length > PUBLIC_SESSION_MAX_TOKEN_LENGTH) {
    return false;
  }

  for (const character of value) {
    const code = character.charCodeAt(0);
    const isUppercaseLetter = code >= 65 && code <= 90;
    const isLowercaseLetter = code >= 97 && code <= 122;
    const isDigit = code >= 48 && code <= 57;

    if (!isUppercaseLetter && !isLowercaseLetter && !isDigit && character !== "-" && character !== "_") {
      return false;
    }
  }

  return true;
}

function createPublicSessionToken() {
  return randomBytes(PUBLIC_SESSION_TOKEN_BYTES).toString("base64url");
}

function hashPublicSessionToken(rawToken: string, secret: string) {
  return createHmac("sha256", secret).update(rawToken).digest("hex").toLowerCase();
}

export function getPublicWorkshopSessionExpiresAt(now = new Date()) {
  return new Date(now.getTime() + PUBLIC_WORKSHOP_SESSION_MAX_AGE_SECONDS * 1000);
}

export async function preparePublicWorkshopIdentity(): Promise<PreparedPublicWorkshopIdentity> {
  const secret = assertPublicSessionSecret();
  const cookieStore = await cookies();
  const existingRawToken = String(
    cookieStore.get(PUBLIC_WORKSHOP_SESSION_COOKIE_NAME)?.value ?? "",
  ).trim();
  const hasSafeExistingToken = isSafeBase64UrlToken(existingRawToken);
  const candidateRawToken = createPublicSessionToken();

  return {
    hadExistingCookie: existingRawToken.length > 0,
    existingRawToken: hasSafeExistingToken ? existingRawToken : null,
    existingTokenHash: hasSafeExistingToken
      ? hashPublicSessionToken(existingRawToken, secret)
      : null,
    candidateRawToken,
    candidateTokenHash: hashPublicSessionToken(candidateRawToken, secret),
  };
}

export async function setPublicWorkshopSessionCookie(input: {
  rawToken: string;
  expiresAt: Date;
}) {
  const cookieStore = await cookies();

  cookieStore.set(PUBLIC_WORKSHOP_SESSION_COOKIE_NAME, input.rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: input.expiresAt,
    maxAge: PUBLIC_WORKSHOP_SESSION_MAX_AGE_SECONDS,
  });
}
