const SESSION_SECRET_ENV = "SKYVAN_SESSION_SECRET";
const SESSION_SECRET_MIN_LENGTH = 32;
const DEFAULT_SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;
const SESSION_CLOCK_SKEW_SECONDS = 60;
const MAX_TOKEN_LENGTH = 4096;

export const SKYVAN_SESSION_COOKIE_NAME = "skyvan_session";

export type SkyvanSessionPayload = {
  v: 1;
  openId: string;
  iat: number;
  exp: number;
};

export type SkyvanSessionRuntime = {
  configured: boolean;
  cookieName: string;
  maxAgeSeconds: number;
  reason: string;
};

export type SkyvanSessionValidationResult =
  | {
      valid: true;
      status: "valid";
      payload: SkyvanSessionPayload;
      expiresAt: Date;
      reason: string;
    }
  | {
      valid: false;
      status:
        | "missing_secret"
        | "missing_token"
        | "malformed"
        | "signature_invalid"
        | "expired";
      payload: null;
      expiresAt: null;
      reason: string;
    };

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function getSessionSecret() {
  return String(process.env[SESSION_SECRET_ENV] ?? "").trim();
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function toBase64Url(bytes: Uint8Array) {
  return bytesToBase64(bytes)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const paddingLength = (4 - (normalized.length % 4)) % 4;
    const padded = `${normalized}${"=".repeat(paddingLength)}`;

    return base64ToBytes(padded);
  } catch {
    return null;
  }
}

function encodePayload(payload: SkyvanSessionPayload) {
  return toBase64Url(textEncoder.encode(JSON.stringify(payload)));
}

function decodePayload(value: string) {
  const bytes = fromBase64Url(value);

  if (!bytes) {
    return null;
  }

  try {
    return JSON.parse(textDecoder.decode(bytes)) as Partial<SkyvanSessionPayload>;
  } catch {
    return null;
  }
}

async function importSigningKey(secret: string, usage: KeyUsage[]) {
  return crypto.subtle.importKey(
    "raw",
    textEncoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    usage,
  );
}

async function createSignature(payloadSegment: string, secret: string) {
  const key = await importSigningKey(secret, ["sign"]);
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    textEncoder.encode(payloadSegment),
  );

  return toBase64Url(new Uint8Array(signature));
}

async function hasValidSignature(
  payloadSegment: string,
  signatureSegment: string,
  secret: string,
) {
  const signatureBytes = fromBase64Url(signatureSegment);

  if (!signatureBytes) {
    return false;
  }

  const key = await importSigningKey(secret, ["verify"]);

  return crypto.subtle.verify(
    "HMAC",
    key,
    signatureBytes,
    textEncoder.encode(payloadSegment),
  );
}

function isValidPayload(value: Partial<SkyvanSessionPayload> | null): value is SkyvanSessionPayload {
  return Boolean(
    value &&
      value.v === 1 &&
      typeof value.openId === "string" &&
      value.openId.trim().length > 0 &&
      typeof value.iat === "number" &&
      Number.isInteger(value.iat) &&
      typeof value.exp === "number" &&
      Number.isInteger(value.exp),
  );
}

function getInvalidPayloadReason(payload: SkyvanSessionPayload, nowSeconds: number) {
  if (payload.openId !== payload.openId.trim()) {
    return "Admin session payload içindeki openId normalize değil.";
  }

  if (payload.exp <= payload.iat) {
    return "Admin session payload süre aralığı geçersiz.";
  }

  if (payload.exp - payload.iat > DEFAULT_SESSION_MAX_AGE_SECONDS) {
    return "Admin session payload izin verilen azami süreyi aşıyor.";
  }

  if (payload.iat > nowSeconds + SESSION_CLOCK_SKEW_SECONDS) {
    return "Admin session payload henüz geçerli olmayan bir issued-at değeri taşıyor.";
  }

  return null;
}

export function getSkyvanSessionRuntime(): SkyvanSessionRuntime {
  const secret = getSessionSecret();

  if (!secret) {
    return {
      configured: false,
      cookieName: SKYVAN_SESSION_COOKIE_NAME,
      maxAgeSeconds: DEFAULT_SESSION_MAX_AGE_SECONDS,
      reason:
        "SKYVAN_SESSION_SECRET tanımlı değil. Signed session doğrulaması kapalı olduğu için admin erişimi fail-closed çalışır.",
    };
  }

  if (secret.length < SESSION_SECRET_MIN_LENGTH) {
    return {
      configured: false,
      cookieName: SKYVAN_SESSION_COOKIE_NAME,
      maxAgeSeconds: DEFAULT_SESSION_MAX_AGE_SECONDS,
      reason:
        "SKYVAN_SESSION_SECRET en az 32 karakter olmalıdır. Zayıf secret ile admin session kabul edilmez.",
    };
  }

  return {
    configured: true,
    cookieName: SKYVAN_SESSION_COOKIE_NAME,
    maxAgeSeconds: DEFAULT_SESSION_MAX_AGE_SECONDS,
    reason: "Signed session doğrulaması aktif.",
  };
}

export async function createSkyvanSessionToken(input: {
  openId: string;
  maxAgeSeconds?: number;
  now?: Date;
}) {
  const runtime = getSkyvanSessionRuntime();

  if (!runtime.configured) {
    throw new Error(runtime.reason);
  }

  const openId = input.openId.trim();

  if (!openId) {
    throw new Error("Session oluşturmak için geçerli openId gerekir.");
  }

  const issuedAt = Math.floor((input.now ?? new Date()).getTime() / 1000);
  const maxAgeSeconds = input.maxAgeSeconds ?? runtime.maxAgeSeconds;
  const expiresAt = new Date((issuedAt + maxAgeSeconds) * 1000);
  const payload: SkyvanSessionPayload = {
    v: 1,
    openId,
    iat: issuedAt,
    exp: issuedAt + maxAgeSeconds,
  };
  const payloadSegment = encodePayload(payload);
  const signatureSegment = await createSignature(payloadSegment, getSessionSecret());

  return {
    token: `${payloadSegment}.${signatureSegment}`,
    payload,
    expiresAt,
  };
}

export async function verifySkyvanSessionToken(
  token: string | null | undefined,
): Promise<SkyvanSessionValidationResult> {
  const runtime = getSkyvanSessionRuntime();

  if (!runtime.configured) {
    return {
      valid: false,
      status: "missing_secret",
      payload: null,
      expiresAt: null,
      reason: runtime.reason,
    };
  }

  const normalizedToken = String(token ?? "").trim();

  if (!normalizedToken) {
    return {
      valid: false,
      status: "missing_token",
      payload: null,
      expiresAt: null,
      reason:
        "Admin session cookie bulunamadı. Signed session olmadan admin erişimi açılmaz.",
    };
  }

  if (normalizedToken.length > MAX_TOKEN_LENGTH) {
    return {
      valid: false,
      status: "malformed",
      payload: null,
      expiresAt: null,
      reason: "Admin session token beklenen sınırı aşıyor.",
    };
  }

  const [payloadSegment, signatureSegment, ...rest] = normalizedToken.split(".");

  if (!payloadSegment || !signatureSegment || rest.length > 0) {
    return {
      valid: false,
      status: "malformed",
      payload: null,
      expiresAt: null,
      reason: "Admin session token biçimi geçersiz.",
    };
  }

  const payload = decodePayload(payloadSegment);

  if (!isValidPayload(payload)) {
    return {
      valid: false,
      status: "malformed",
      payload: null,
      expiresAt: null,
      reason: "Admin session payload çözümlenemedi.",
    };
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const invalidPayloadReason = getInvalidPayloadReason(payload, nowSeconds);

  if (invalidPayloadReason) {
    return {
      valid: false,
      status: "malformed",
      payload: null,
      expiresAt: null,
      reason: invalidPayloadReason,
    };
  }

  const signatureValid = await hasValidSignature(
    payloadSegment,
    signatureSegment,
    getSessionSecret(),
  );

  if (!signatureValid) {
    return {
      valid: false,
      status: "signature_invalid",
      payload: null,
      expiresAt: null,
      reason:
        "Admin session imzası doğrulanamadı. Client tarafındaki cookie güvenilir kabul edilmez.",
    };
  }

  const expiresAt = new Date(payload.exp * 1000);

  if (payload.exp <= nowSeconds) {
    return {
      valid: false,
      status: "expired",
      payload: null,
      expiresAt: null,
      reason: "Admin session süresi dolmuş. Yeni signed session gerekir.",
    };
  }

  return {
    valid: true,
    status: "valid",
    payload,
    expiresAt,
    reason: "Admin session imzası doğrulandı.",
  };
}

export function getSkyvanSessionCookieOptions(expiresAt: Date) {
  const maxAgeSeconds = Math.max(
    0,
    Math.floor((expiresAt.getTime() - Date.now()) / 1000),
  );

  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires: expiresAt,
    maxAge: maxAgeSeconds,
  };
}
