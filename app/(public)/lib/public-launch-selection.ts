import type { PublicBlock, PublicPageContent } from "./launch-content";

const legacyAi = /(?:^|[^\p{L}\p{N}_])(?:skyvan\s+ai|ai|chatbot|yapay\s+zek[âa])(?=$|[^\p{L}\p{N}_])/iu;
const internalHero = /(?:^|[^\p{L}\p{N}_])(?:admin|public\s+(?:site|surface|render\s+layer|yayın\s+(?:katmanı|yüzeyi))|live\s+demo|working\s+demo|canlı\s+demo|configurator|configüratör|konfigüratör)(?=$|[^\p{L}\p{N}_])/iu;
type Hero = Extract<PublicBlock, { type: "hero" }>;

export function hasLegacyAiTerms(text: string): boolean {
  return legacyAi.test(text);
}

export function hasInternalLaunchTerms(text: string): boolean {
  return internalHero.test(text);
}

export function getDefinitionBlock(page: PublicPageContent): Extract<PublicBlock, { type: "text" }> | undefined {
  return page.blocks.find((block): block is Extract<PublicBlock, { type: "text" }> =>
    block.type === "text" && !hasLegacyAiTerms(`${block.heading ?? ""} ${block.body ?? ""} ${block.content ?? ""}`),
  );
}

export function getLaunchHero(page: PublicPageContent): { media: Hero["media"]; copy: Hero | undefined } {
  const hero = page.blocks.find((block): block is Hero => block.type === "hero");
  const text = `${hero?.heading ?? ""} ${hero?.subtext ?? ""} ${hero?.body ?? ""}`;
  return { media: hero?.media, copy: hero && !hasInternalLaunchTerms(text) ? hero : undefined };
}
