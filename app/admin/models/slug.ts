const trailingCounterPattern = /^(.*?)-(\d+)$/;

export function normalizeModelSlug(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/ı/g, "i")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function splitModelSlugCounter(slug: string) {
  const normalized = normalizeModelSlug(slug);
  const match = normalized.match(trailingCounterPattern);

  if (!match || !match[1]) {
    return {
      baseSlug: normalized,
      counter: null as number | null,
    };
  }

  return {
    baseSlug: match[1],
    counter: Number.parseInt(match[2], 10),
  };
}