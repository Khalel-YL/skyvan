import type {
  WorkshopAssetFieldName,
  WorkshopAssetFormValues,
  WorkshopAssetFormState,
} from "./types";
import { validate as validateUuid } from "uuid";

const BLOCKED_SCHEMES = ["javascript:", "data:", "file:", "vbscript:"];
const MIN_LAYER_ORDER = -1000;
const MAX_LAYER_ORDER = 1000;

export type ParsedWorkshopAssetInput = {
  id: string | null;
  productId: string;
  modelId: string;
  cameraView: string;
  zIndexLayer: number;
  assetUrl: string;
  fallbackUrl: string | null;
  values: WorkshopAssetFormValues;
};

export type WorkshopAssetFormErrors = Partial<
  Record<WorkshopAssetFieldName, string>
> & {
  form?: string;
};

type WorkshopAssetValidationResult =
  | { ok: true; input: ParsedWorkshopAssetInput }
  | {
      ok: false;
      state: WorkshopAssetFormState;
      values: WorkshopAssetFormValues;
    };

export function isUuid(value: string) {
  return validateUuid(value);
}

export function getTrimmed(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export function createFieldError(
  field: WorkshopAssetFieldName,
  message: string,
  values?: WorkshopAssetFormValues,
): WorkshopAssetFormState {
  return {
    status: "error",
    message,
    fieldErrors: {
      [field]: message,
    },
    values,
  };
}

export function createGenericError(
  message: string,
  values?: WorkshopAssetFormValues,
  fieldErrors: Partial<Record<WorkshopAssetFieldName, string>> = {},
): WorkshopAssetFormState {
  return {
    status: "error",
    message,
    fieldErrors,
    values,
  };
}

export function parseLayerOrder(value: string) {
  const normalized = value.trim();

  if (!normalized) {
    return null;
  }

  let digitStartIndex = 0;

  if (normalized[0] === "-" || normalized[0] === "+") {
    digitStartIndex = 1;
  }

  if (digitStartIndex === normalized.length) {
    return null;
  }

  for (let index = digitStartIndex; index < normalized.length; index += 1) {
    const code = normalized.charCodeAt(index);

    if (code < 48 || code > 57) {
      return null;
    }
  }

  const parsed = Number(normalized);

  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
    return null;
  }

  return parsed;
}

function getWorkshopAssetFormValues(formData: FormData): WorkshopAssetFormValues {
  return {
    id: getTrimmed(formData, "id"),
    productId: getTrimmed(formData, "productId"),
    modelId: getTrimmed(formData, "modelId"),
    cameraView: getTrimmed(formData, "cameraView"),
    zIndexLayer: getTrimmed(formData, "zIndexLayer"),
    assetUrl: getTrimmed(formData, "assetUrl"),
    fallbackUrl: getTrimmed(formData, "fallbackUrl"),
  };
}

function getFirstError(errors: WorkshopAssetFormErrors) {
  return (
    errors.id ??
    errors.productId ??
    errors.modelId ??
    errors.cameraView ??
    errors.zIndexLayer ??
    errors.assetUrl ??
    errors.fallbackUrl ??
    errors.form ??
    "Workshop varlığı formu doğrulanamadı."
  );
}

function getFieldErrors(
  errors: WorkshopAssetFormErrors,
): Partial<Record<WorkshopAssetFieldName, string>> {
  return {
    id: errors.id,
    productId: errors.productId,
    modelId: errors.modelId,
    cameraView: errors.cameraView,
    zIndexLayer: errors.zIndexLayer,
    assetUrl: errors.assetUrl,
    fallbackUrl: errors.fallbackUrl,
  };
}

export function parseWorkshopAssetFormData(
  formData: FormData,
): WorkshopAssetValidationResult {
  const values = getWorkshopAssetFormValues(formData);
  const errors: WorkshopAssetFormErrors = {};
  const zIndexLayer = parseLayerOrder(values.zIndexLayer);

  if (values.id && !isUuid(values.id)) {
    errors.id = "Geçersiz kayıt kimliği nedeniyle işlem durduruldu.";
  }

  if (!values.productId || !isUuid(values.productId)) {
    errors.productId = "Geçerli bir ürün seçilmelidir.";
  }

  if (!values.modelId || !isUuid(values.modelId)) {
    errors.modelId = "Geçerli bir araç modeli seçilmelidir.";
  }

  if (!values.cameraView) {
    errors.cameraView = "Kamera görünümü zorunludur.";
  } else if (values.cameraView.length > 80) {
    errors.cameraView = "Kamera görünümü en fazla 80 karakter olabilir.";
  }

  if (zIndexLayer === null) {
    errors.zIndexLayer = "Katman sırası tam sayı olmalıdır.";
  } else if (zIndexLayer < MIN_LAYER_ORDER || zIndexLayer > MAX_LAYER_ORDER) {
    errors.zIndexLayer = "Katman sırası -1000 ile 1000 arasında olmalıdır.";
  }

  if (!values.assetUrl) {
    errors.assetUrl = "Varlık URL zorunludur.";
  } else if (!isSafeAssetReference(values.assetUrl)) {
    errors.assetUrl =
      "Varlık URL güvenli http/https adresi veya güvenli depo yolu olmalıdır.";
  }

  if (values.fallbackUrl && !isSafeAssetReference(values.fallbackUrl)) {
    errors.fallbackUrl =
      "Yedek URL güvenli http/https adresi veya güvenli depo yolu olmalıdır.";
  }

  if (Object.keys(errors).length > 0 || zIndexLayer === null) {
    return {
      ok: false,
      state: createGenericError(getFirstError(errors), values, getFieldErrors(errors)),
      values,
    };
  }

  return {
    ok: true,
    input: {
      id: values.id || null,
      productId: values.productId,
      modelId: values.modelId,
      cameraView: values.cameraView,
      zIndexLayer,
      assetUrl: values.assetUrl,
      fallbackUrl: values.fallbackUrl || null,
      values,
    },
  };
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

function isSafeWorkshopPublicPath(value: string) {
  const normalized = value.trim();

  if (!normalized.startsWith("/workshop-assets/")) {
    return false;
  }

  if (
    normalized.startsWith("//") ||
    normalized.includes("../") ||
    normalized.toLowerCase().includes("%2e%2e")
  ) {
    return false;
  }

  if (normalized.includes("\\") || normalized.includes("\0")) {
    return false;
  }

  return /^\/workshop-assets\/[a-zA-Z0-9._~!$&'()*+,;=:@/-]+$/.test(normalized);
}

export function isSafeAssetReference(value: string) {
  const normalized = value.trim();

  if (!normalized || hasBlockedScheme(normalized)) {
    return false;
  }

  return (
    isSafeHttpUrl(normalized) ||
    isSafeWorkshopPublicPath(normalized) ||
    isSafeStoragePath(normalized)
  );
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

export function getAssetReferenceKind(value: string) {
  const pathname = (() => {
    try {
      return new URL(value).pathname;
    } catch {
      return value;
    }
  })().toLowerCase();

  if (/\.(png|jpe?g|webp|svg)$/i.test(pathname)) {
    return "image" as const;
  }

  if (/\.(glb|gltf)$/i.test(pathname)) {
    return "model3d" as const;
  }

  if (/\.(mp4|webm|mov|m4v)$/i.test(pathname)) {
    return "video" as const;
  }

  return "link" as const;
}

export function shortenMiddle(value: string, maxLength = 54) {
  if (value.length <= maxLength) {
    return value;
  }

  const head = Math.max(12, Math.floor(maxLength * 0.58));
  const tail = Math.max(8, maxLength - head - 3);

  return `${value.slice(0, head)}...${value.slice(-tail)}`;
}
