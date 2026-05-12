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

const GEMINI_GENERATE_CONTENT_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models";
const PROVIDER_TIMEOUT_MS = 15_000;
const MAX_OUTPUT_TOKENS = 700;

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

function getProviderKey(provider: AiProviderName) {
  if (provider === "gemini") {
    return readOptionalEnv("GEMINI_API_KEY");
  }

  if (provider === "openai") {
    return readOptionalEnv("OPENAI_API_KEY");
  }

  return "";
}

function getGeminiSystemInstruction() {
  return [
    "Yalnızca Türkçe yanıt ver.",
    "Yalnızca sağlanan insan onaylı ve okunabilir kaynak alıntılarını kullan.",
    "Kaynaklarda bulunmayan teknik veriyi, sınırı, sertifikayı veya ürün özelliğini uydurma.",
    "Kısa, yapılandırılmış ve danışma amaçlı bir teknik özet üret.",
    "Bu üç başlığı aynen kullan: Teknik değerlendirme, Kaynak dayanağı, Sınır.",
    "Bu başlıklardan hiçbirini atlama.",
    "Teknik değerlendirme bölümünde doğrudan kaynakta geçen güvenlik, kurulum, batarya, PV, AC, çalışma, yapılandırma, koruma veya arıza bilgilerine öncelik ver.",
    "Kaynak dayanağı bölümünde yalnızca kısa kaynak başlıklarını listele; ham alıntıları tekrar etme.",
    "Kaynak alıntıları yeterli değilse aynen şunu söyle: Onaylı kaynaklarda bu konuda yeterli teknik bilgi bulunamadı.",
    "Nihai mühendislik, güvenlik, hukuk, ticari ya da üretim kararı verme.",
    "Herhangi bir şeyi onayladığını iddia etme.",
    "Gizli ya da ham kanıt içeriğini ifşa etme.",
    "Elektrik kurulumu için adım adım tehlikeli uygulama talimatı verme; resmi kılavuza ve yetkili uzmana yönlendir.",
    "Genel admin tavsiyesi veya dolgu cümleleri yazma.",
  ].join(" ");
}

function buildEvidencePrompt(input: AiExplanationInput) {
  const sourceTitles = Array.from(
    new Set(input.evidence.map((item) => item.title.trim()).filter(Boolean)),
  );
  const evidenceLines = input.evidence.map((item, index) => {
    const metadata = [
      `Belge ${index + 1}`,
      `Başlık: ${item.title}`,
      `Tür: ${item.docType}`,
      item.pageNumber === null || item.pageNumber === undefined
        ? null
        : `Sayfa: ${item.pageNumber}`,
      item.chunkIndex === undefined ? null : `Parça: ${item.chunkIndex}`,
      item.tokenCount === undefined ? null : `Token: ${item.tokenCount}`,
    ]
      .filter(Boolean)
      .join(" | ");

    return item.excerpt
      ? `${metadata}\nSınırlı alıntı: ${item.excerpt}`
      : metadata;
  });

  return [
    `Amaç: ${input.purpose}`,
    `Maksimum çıktı karakteri: ${input.maxOutputCharacters}`,
    "Görev: Aşağıdaki onaylı ve okunabilir kaynak parçalarına dayanarak Admin operatörü için kısa, teknik ve kanıta bağlı bir danışma metni üret.",
    "Bu üç başlığı aynen kullan ve hiçbirini atlama: Teknik değerlendirme, Kaynak dayanağı, Sınır.",
    "Zorunlu çıktı şablonu:",
    "Teknik değerlendirme:\n- Kaynaklarda açıkça geçen teknik bulguları yaz.\n- Belirsiz veya kaynakta yer almayan bilgiyi yorumlama.",
    "Kaynak dayanağı:\n- Kaynak başlıklarını kısa listele.",
    "Sınır:\n- Onaylı kaynaklarda yer almayan bilgiler yorumlanmadı.",
    "Yetersiz kanıt durumunda yalnızca şu anlamı koru: Onaylı kaynaklarda bu konuda yeterli teknik bilgi bulunamadı.",
    sourceTitles.length
      ? `Kaynak başlıkları: ${sourceTitles.join(" | ")}`
      : "Kaynak başlıkları: belirtilmedi",
    "Kanıtlar:",
    ...evidenceLines,
  ].join("\n\n");
}

function getTextFromGeminiResponse(payload: unknown) {
  if (typeof payload !== "object" || payload === null) {
    return "";
  }

  const candidates = (payload as { candidates?: unknown }).candidates;

  if (!Array.isArray(candidates)) {
    return "";
  }

  const parts = candidates.flatMap((candidate) => {
    if (typeof candidate !== "object" || candidate === null) {
      return [];
    }

    const content = (candidate as { content?: unknown }).content;

    if (typeof content !== "object" || content === null) {
      return [];
    }

    const candidateParts = (content as { parts?: unknown }).parts;

    if (!Array.isArray(candidateParts)) {
      return [];
    }

    return candidateParts;
  });

  return parts
    .map((part) => {
      if (typeof part !== "object" || part === null) {
        return "";
      }

      const text = (part as { text?: unknown }).text;
      return typeof text === "string" ? text : "";
    })
    .filter(Boolean)
    .join("")
    .trim();
}

async function generateGeminiExplanation(
  input: AiExplanationInput,
  status: AiProviderStatus,
): Promise<AiProviderResult> {
  const apiKey = getProviderKey("gemini");

  if (!status.modelId || !apiKey) {
    return {
      ok: false,
      message: "AI sağlayıcı yapılandırması eksik.",
      output: null,
      provider: status.provider,
      modelId: status.modelId,
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);

  try {
    const response = await fetch(
      `${GEMINI_GENERATE_CONTENT_BASE_URL}/${encodeURIComponent(
        status.modelId,
      )}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [
              {
                text: getGeminiSystemInstruction(),
              },
            ],
          },
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: buildEvidencePrompt(input),
                },
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: Math.min(
              Math.max(input.maxOutputCharacters, 1),
              MAX_OUTPUT_TOKENS,
            ),
            temperature: 0.2,
            responseMimeType: "text/plain",
          },
        }),
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      return {
        ok: false,
        message: "AI açıklaması şu anda üretilemedi.",
        output: null,
        provider: status.provider,
        modelId: status.modelId,
      };
    }

    const payload: unknown = await response.json();
    const output = getTextFromGeminiResponse(payload);

    if (!output) {
      return {
        ok: false,
        message:
          "AI açıklaması üretilemedi; onaylı kaynaklar mevcut ancak sağlayıcı anlamlı çıktı döndürmedi.",
        output: null,
        provider: status.provider,
        modelId: status.modelId,
      };
    }

    return {
      ok: true,
      message: "AI açıklaması üretildi.",
      output: output.slice(0, input.maxOutputCharacters).trim(),
      provider: status.provider,
      modelId: status.modelId,
    };
  } catch {
    return {
      ok: false,
      message: "AI açıklaması şu anda üretilemedi.",
      output: null,
      provider: status.provider,
      modelId: status.modelId,
    };
  } finally {
    clearTimeout(timeout);
  }
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

  if (!modelId) {
    return {
      enabled: false,
      provider,
      modelId: null,
      reason: "AI sağlayıcı yapılandırması eksik.",
    };
  }

  if (!hasProviderKey(provider)) {
    return {
      enabled: false,
      provider,
      modelId,
      reason: "AI sağlayıcı yapılandırması eksik.",
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

  if (status.provider === "gemini") {
    return generateGeminiExplanation(input, status);
  }

  return {
    ok: false,
    message: "AI sağlayıcı adaptörü henüz gerçek çağrıya açılmadı.",
    output: null,
    provider: status.provider,
    modelId: status.modelId,
  };
}
