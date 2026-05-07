import "server-only";

export type AiProviderName = "disabled" | "openai" | "gemini";

export type AiProviderStatus = {
  enabled: boolean;
  provider: AiProviderName;
  modelId: string | null;
  reason: string;
};

export type AiEvidenceItem = {
  documentId: string;
  chunkId?: string;
  title: string;
  docType: string;
  pageNumber?: number | null;
  chunkIndex?: number;
  tokenCount?: number;
  excerpt?: string;
};

export type AiExplanationInput = {
  purpose: string;
  locale: "tr";
  evidence: AiEvidenceItem[];
  maxOutputCharacters: number;
};

export type AiProviderResult = {
  ok: boolean;
  message: string;
  output: string | null;
  provider: AiProviderName;
  modelId: string | null;
};

const SUPPORTED_PROVIDERS = new Set<AiProviderName>(["openai", "gemini"]);

function readOptionalEnv(name: string) {
  return String(process.env[name] ?? "").trim();
}

function normalizeProviderName(value: string): AiProviderName {
  const normalized = value.trim().toLowerCase();

  if (normalized === "openai" || normalized === "gemini") {
    return normalized;
  }

  return "disabled";
}

function hasProviderKey(provider: AiProviderName) {
  if (provider === "openai") {
    return Boolean(readOptionalEnv("OPENAI_API_KEY"));
  }

  if (provider === "gemini") {
    return Boolean(readOptionalEnv("GEMINI_API_KEY"));
  }

  return false;
}

export function getAiProviderStatus(): AiProviderStatus {
  if (readOptionalEnv("AI_PROVIDER_ENABLED") !== "1") {
    return {
      enabled: false,
      provider: "disabled",
      modelId: null,
      reason: "AI sağlayıcı devre dışı.",
    };
  }

  const provider = normalizeProviderName(readOptionalEnv("AI_PROVIDER"));
  const modelId = readOptionalEnv("AI_MODEL_ID") || null;

  if (!SUPPORTED_PROVIDERS.has(provider)) {
    return {
      enabled: false,
      provider: "disabled",
      modelId,
      reason: "AI sağlayıcı devre dışı.",
    };
  }

  if (!hasProviderKey(provider)) {
    return {
      enabled: false,
      provider,
      modelId,
      reason: "AI sağlayıcı devre dışı.",
    };
  }

  return {
    enabled: true,
    provider,
    modelId,
    reason: "AI sağlayıcı adaptörü henüz gerçek çağrıya açılmadı.",
  };
}

export async function generateAiExplanation(
  input: AiExplanationInput,
): Promise<AiProviderResult> {
  const status = getAiProviderStatus();

  if (!input.evidence.length) {
    return {
      ok: false,
      message: "Onaylı kaynak yetersiz.",
      output: null,
      provider: status.provider,
      modelId: status.modelId,
    };
  }

  if (!status.enabled) {
    return {
      ok: false,
      message: status.reason,
      output: null,
      provider: status.provider,
      modelId: status.modelId,
    };
  }

  return {
    ok: false,
    message: "AI sağlayıcı adaptörü henüz gerçek çağrıya açılmadı.",
    output: null,
    provider: status.provider,
    modelId: status.modelId,
  };
}

