export type DatasheetKeyKind = "blocked" | "web" | "storage";

export type DatasheetSimulationInput = {
  title: string;
  s3Key: string;
};

export type DatasheetSimulationResult = {
  accepted: boolean;
  keyKind: DatasheetKeyKind;
  titleOk: boolean;
  label: string;
  reason: string;
};

export type DatasheetSimulationCase = {
  id: string;
  title: string;
  s3Key: string;
  expected: "accept" | "reject";
  note: string;
};

export function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function hasBlockedScheme(value: string) {
  const lowered = value.trim().toLowerCase();

  return (
    lowered.startsWith("javascript:") ||
    lowered.startsWith("data:") ||
    lowered.startsWith("vbscript:")
  );
}

export function isOpenableHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function classifyDatasheetKey(value: string): DatasheetKeyKind {
  if (hasBlockedScheme(value)) {
    return "blocked";
  }

  if (isOpenableHttpUrl(value)) {
    return "web";
  }

  return "storage";
}

export function getDatasheetKeyLabel(kind: DatasheetKeyKind) {
  switch (kind) {
    case "blocked":
      return "Güvenli değil";
    case "web":
      return "Web bağlantısı";
    case "storage":
    default:
      return "Storage anahtarı";
  }
}

export function simulateDatasheetInput(
  input: DatasheetSimulationInput,
): DatasheetSimulationResult {
  const title = normalizeWhitespace(input.title);
  const s3Key = input.s3Key.trim();
  const keyKind = classifyDatasheetKey(s3Key);

  if (!title) {
    return {
      accepted: false,
      keyKind,
      titleOk: false,
      label: getDatasheetKeyLabel(keyKind),
      reason: "Doküman başlığı zorunlu.",
    };
  }

  if (title.length < 3) {
    return {
      accepted: false,
      keyKind,
      titleOk: false,
      label: getDatasheetKeyLabel(keyKind),
      reason: "Doküman başlığı en az 3 karakter olmalı.",
    };
  }

  if (!s3Key) {
    return {
      accepted: false,
      keyKind,
      titleOk: true,
      label: getDatasheetKeyLabel(keyKind),
      reason: "Belge bağlantısı / storage anahtarı zorunlu.",
    };
  }

  if (s3Key.length < 3) {
    return {
      accepted: false,
      keyKind,
      titleOk: true,
      label: getDatasheetKeyLabel(keyKind),
      reason: "Belge bağlantısı / storage anahtarı çok kısa.",
    };
  }

  if (keyKind === "blocked") {
    return {
      accepted: false,
      keyKind,
      titleOk: true,
      label: getDatasheetKeyLabel(keyKind),
      reason: "Bu bağlantı şeması güvenlik nedeniyle kabul edilmiyor.",
    };
  }

  if (keyKind === "web") {
    return {
      accepted: true,
      keyKind,
      titleOk: true,
      label: getDatasheetKeyLabel(keyKind),
      reason: "Geçerli web bağlantısı olarak açılabilir.",
    };
  }

  return {
    accepted: true,
    keyKind,
    titleOk: true,
    label: getDatasheetKeyLabel(keyKind),
    reason: "Kayıt storage anahtarı olarak tutulabilir.",
  };
}

export const datasheetSimulationCases: DatasheetSimulationCase[] = [
  {
    id: "web-url",
    title: "Victron MultiPlus-II Teknik Datasheet",
    s3Key: "https://example.com/documents/victron-multiplus-ii.pdf",
    expected: "accept",
    note: "Geçerli http/https bağlantısı kabul edilmeli.",
  },
  {
    id: "storage-key",
    title: "Renogy 200W Kullanım Kılavuzu",
    s3Key: "storage/manuals/renogy-200w-user-guide.pdf",
    expected: "accept",
    note: "Web URL değilse storage anahtarı gibi tutulmalı.",
  },
  {
    id: "blocked-scheme",
    title: "Riskli Script Girdisi",
    s3Key: "javascript:alert('xss')",
    expected: "reject",
    note: "Riskli şema güvenlik nedeniyle reddedilmeli.",
  },
  {
    id: "short-title",
    title: "AB",
    s3Key: "storage/specs/ab.pdf",
    expected: "reject",
    note: "Çok kısa başlık reddedilmeli.",
  },
  {
    id: "empty-key",
    title: "Boş Bağlantı Testi",
    s3Key: "",
    expected: "reject",
    note: "Boş belge anahtarı reddedilmeli.",
  },
];