import type {
  WorkshopAssetFieldName,
  WorkshopAssetFormState,
} from "./types";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const BLOCKED_SCHEMES = ["javascript:", "data:", "file:", "vbscript:"];

export function isUuid(value: string) {
  return UUID_PATTERN.test(value);
}

export function getTrimmed(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export function createFieldError(
  field: WorkshopAssetFieldName,
  message: string,
): WorkshopAssetFormState {
  return {
    status: "error",
    message,
    fieldErrors: {
      [field]: message,
    },
  };
}

export function createGenericError(message: string): WorkshopAssetFormState {
  return {
    status: "error",
    message,
    fieldErrors: {},
  };
}

export function parseLayerOrder(value: string) {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed)) {
    return null;
  }

  return parsed;
}

function hasBlockedScheme(value: string) {
  const lowered = value.trim().toLowerCase();

  return BLOCKED_SCHEMES.some((scheme) => lowered.startsWith(scheme));
}

function isSafeHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function hasAnyScheme(value: string) {
  return /^[a-z][a-z0-9+.-]*:/i.test(value.trim());
}

function isSafeStoragePath(value: string) {
  const normalized = value.trim();

  if (!normalized || normalized.startsWith("/") || normalized.includes("../")) {
    return false;
  }

  if (normalized.includes("\\") || normalized.includes("\0")) {
    return false;
  }

  if (hasAnyScheme(normalized)) {
    return false;
  }

  return /^[a-zA-Z0-9._~!$&'()*+,;=:@/-]+$/.test(normalized);
}

export function isSafeAssetReference(value: string) {
  const normalized = value.trim();

  if (!normalized || hasBlockedScheme(normalized)) {
    return false;
  }

  return isSafeHttpUrl(normalized) || isSafeStoragePath(normalized);
}

export function isImageLikeAsset(value: string) {
  const pathname = (() => {
    try {
      return new URL(value).pathname;
    } catch {
      return value;
    }
  })().toLowerCase();

  return /\.(png|jpe?g|webp|svg)$/i.test(pathname);
}

export function shortenMiddle(value: string, maxLength = 54) {
  if (value.length <= maxLength) {
    return value;
  }

  const head = Math.max(12, Math.floor(maxLength * 0.58));
  const tail = Math.max(8, maxLength - head - 3);

  return `${value.slice(0, head)}...${value.slice(-tail)}`;
}
