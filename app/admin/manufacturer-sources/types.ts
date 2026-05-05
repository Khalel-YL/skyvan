export type ManufacturerSourceStatus = "active" | "archived";

export type ManufacturerSourceContentType =
  | "manuals"
  | "datasheets"
  | "technical_pages"
  | "support_pages";

export type ManufacturerSourceFetchMode =
  | "manual_review"
  | "allowed_paths_only"
  | "full_domain_review";

export type ManufacturerSourceRegistryListItem = {
  id: string;
  manufacturerName: string;
  domain: string;
  normalizedDomain: string;
  allowedContentTypes: ManufacturerSourceContentType[];
  notes: string | null;

  ingestionEnabled: boolean;
  allowSubdomains: boolean;
  respectRobotsTxt: boolean;
  defaultFetchMode: ManufacturerSourceFetchMode;
  pathAllowlist: string[];
  pathBlocklist: string[];

  status: ManufacturerSourceStatus;
  createdAtLabel: string;
  updatedAtLabel: string;
};

export type ManufacturerSourceRegistryFilterStatus = "all" | ManufacturerSourceStatus;
export type ManufacturerSourceRegistryFilterType = "all" | ManufacturerSourceContentType;

export type ManufacturerSourceRegistryActionState = {
  ok: boolean;
  message: string;
  fieldErrors: {
    manufacturerName?: string;
    domain?: string;
    allowedContentTypes?: string;
    notes?: string;
    pathAllowlist?: string;
    pathBlocklist?: string;
  };
  createdItem: {
    manufacturerName: string;
    normalizedDomain: string;
    allowedContentTypes: ManufacturerSourceContentType[];
    defaultFetchMode: ManufacturerSourceFetchMode;
  } | null;
};

export type ManufacturerSourceDryRunDecision =
  | "allowed"
  | "blocked"
  | "manual_review";

export type ManufacturerSourceDryRunState = {
  ok: boolean;
  message: string;
  fieldErrors: {
    candidateUrl?: string;
  };
  result: {
    candidateUrl: string;
    normalizedUrl: string;
    host: string;
    pathname: string;
    decision: ManufacturerSourceDryRunDecision;
    matchedAllowlist: string[];
    matchedBlocklist: string[];
    reasons: string[];
  } | null;
};

export type ManufacturerSourceFetchPreviewState = {
  ok: boolean;
  message: string;
  fieldErrors: {
    candidateUrl?: string;
  };
  result: {
    candidateUrl: string;
    normalizedUrl: string;
    finalUrl: string;
    host: string;
    pathname: string;
    policyDecision: ManufacturerSourceDryRunDecision;
    policyReasons: string[];
    httpStatus: number | null;
    contentType: string | null;
    contentLength: string | null;
    title: string | null;
    snippet: string | null;
    fetchAllowed: boolean;
  } | null;
};

export type ManufacturerSourceParsePreviewState = {
  ok: boolean;
  message: string;
  fieldErrors: {
    candidateUrl?: string;
  };
  result: {
    candidateUrl: string;
    normalizedUrl: string;
    finalUrl: string;
    host: string;
    pathname: string;
    policyDecision: ManufacturerSourceDryRunDecision;
    policyReasons: string[];
    httpStatus: number | null;
    contentType: string | null;
    parseSupported: boolean;
    detectedTitle: string | null;
    metaDescription: string | null;
    headingCount: number | null;
    paragraphCount: number | null;
    linkCount: number | null;
    textLength: number | null;
    textPreview: string | null;
  } | null;
};

export const initialManufacturerSourceRegistryActionState: ManufacturerSourceRegistryActionState =
  {
    ok: false,
    message: "",
    fieldErrors: {},
    createdItem: null,
  };

export const initialManufacturerSourceDryRunState: ManufacturerSourceDryRunState = {
  ok: false,
  message: "",
  fieldErrors: {},
  result: null,
};

export const initialManufacturerSourceFetchPreviewState: ManufacturerSourceFetchPreviewState = {
  ok: false,
  message: "",
  fieldErrors: {},
  result: null,
};

export const initialManufacturerSourceParsePreviewState: ManufacturerSourceParsePreviewState = {
  ok: false,
  message: "",
  fieldErrors: {},
  result: null,
};

export const manufacturerSourceStatusOptions: Array<{
  value: ManufacturerSourceRegistryFilterStatus;
  label: string;
}> = [
  { value: "all", label: "Tümü" },
  { value: "active", label: "Aktif" },
  { value: "archived", label: "Arşiv" },
];

export const manufacturerSourceTypeOptions: Array<{
  value: ManufacturerSourceRegistryFilterType;
  label: string;
}> = [
  { value: "all", label: "Tüm içerikler" },
  { value: "manuals", label: "Kılavuzlar" },
  { value: "datasheets", label: "Datasheetler" },
  { value: "technical_pages", label: "Teknik sayfalar" },
  { value: "support_pages", label: "Destek sayfaları" },
];

export const manufacturerSourceContentTypeLabels: Record<
  ManufacturerSourceContentType,
  string
> = {
  manuals: "Kılavuzlar",
  datasheets: "Datasheetler",
  technical_pages: "Teknik sayfalar",
  support_pages: "Destek sayfaları",
};

export const manufacturerSourceFetchModeOptions: Array<{
  value: ManufacturerSourceFetchMode;
  label: string;
  description: string;
}> = [
  {
    value: "manual_review",
    label: "Manuel inceleme",
    description: "Kaynak yalnızca admin incelemesi sonrası kontrollü değerlendirilir.",
  },
  {
    value: "allowed_paths_only",
    label: "Yalnız izinli path'ler",
    description: "Sadece allowlist içinde kalan path'ler uygun kabul edilir.",
  },
  {
    value: "full_domain_review",
    label: "Tüm domain inceleme",
    description: "Domain genelinde kontrollü değerlendirme yapılabilir.",
  },
];

export const manufacturerSourceFetchModeLabels: Record<
  ManufacturerSourceFetchMode,
  string
> = {
  manual_review: "Manuel inceleme",
  allowed_paths_only: "Yalnız izinli path'ler",
  full_domain_review: "Tüm domain inceleme",
};

export const manufacturerSourceDryRunDecisionLabels: Record<
  ManufacturerSourceDryRunDecision,
  string
> = {
  allowed: "İzinli",
  blocked: "Bloklu",
  manual_review: "Manuel inceleme",
};
