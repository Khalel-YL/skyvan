"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { publicEditorialContent, type CuratedPublicSlug } from "../lib/public-editorial-content";
import { publicLaunchContent } from "../lib/public-launch-copy";
import { getLocaleFromPathname, getLocalizedPath } from "../lib/public-routing";
import { BrandLogo } from "./BrandLogo";

const groups: Array<{ key: "explore" | "approach" | "help"; slugs: CuratedPublicSlug[] }> = [
  { key: "explore", slugs: ["karavan-deneyimi", "nasil-calisir", "workshop"] },
  { key: "approach", slugs: ["hakkimizda", "muhendislik", "uretim-sureci"] },
  { key: "help", slugs: ["sss", "iletisim", "proje-baslat"] },
];

export function Footer(): React.JSX.Element {
  const locale = getLocaleFromPathname(usePathname());
  const copy = publicLaunchContent[locale];
  const editorial = publicEditorialContent[locale];
  const home = getLocalizedPath(locale);
  const headings = locale === "tr"
    ? { explore: "Keşfet", approach: "Skyvan", help: "Bilgi" }
    : { explore: "Explore", approach: "Skyvan", help: "Information" };

  return <footer className="sv-footer">
    <div className="sv-container">
      <div className="sv-footer-top">
        <div className="sv-footer-brand">
          <Link href={home} className="sv-brand" aria-label="Skyvan"><BrandLogo variant="emblem" tone="auto" size="headerEmblem" /><span>SKYVAN</span></Link>
          <p>{copy.footer}</p>
        </div>
        <nav aria-label={locale === "tr" ? "Alt menü" : "Footer navigation"}>
          {groups.map((group) => <div className="sv-footer-group" key={group.key}>
            <h2>{headings[group.key]}</h2>
            {group.slugs.map((slug) => <span className="sv-footer-link" key={slug}>
              <Link href={getLocalizedPath(locale, slug)}>{editorial[slug].title}</Link>
              {slug === "proje-baslat" ? <span className="sv-status">{copy.upcoming}</span> : null}
            </span>)}
          </div>)}
        </nav>
      </div>
      <div className="sv-footer-bottom"><span>© {new Date().getFullYear()} Skyvan</span></div>
    </div>
  </footer>;
}
