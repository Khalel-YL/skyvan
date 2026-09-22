"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock3, Facebook, Instagram, Linkedin, Mail, MessageCircle, Phone, Youtube } from "lucide-react";

import { publicEditorialContent, type CuratedPublicSlug } from "../lib/public-editorial-content";
import { publicContact, publicSocialLinks } from "../lib/public-contact";
import { publicLaunchContent } from "../lib/public-launch-copy";
import { getLocaleFromPathname, getLocalizedPath } from "../lib/public-routing";
import { BrandLogo } from "./BrandLogo";

const groups: Array<{ key: "explore" | "approach" | "help"; slugs: CuratedPublicSlug[] }> = [
  { key: "explore", slugs: ["karavan-deneyimi", "nasil-calisir", "workshop"] },
  { key: "approach", slugs: ["hakkimizda", "muhendislik", "uretim-sureci"] },
  { key: "help", slugs: ["sss", "iletisim", "proje-baslat"] },
];

const socialIconByKey = {
  instagram: Instagram,
  youtube: Youtube,
  facebook: Facebook,
  linkedin: Linkedin,
} as const;

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
          <Link href={home} className="sv-brand" aria-label="Skyvan"><BrandLogo variant="emblem" tone="auto" size="headerEmblem" /><BrandLogo variant="wordmark" tone="auto" size="headerEmblem" className="sv-brand-wordmark" /></Link>
          <p>{copy.footer}</p>
          <div className="sv-footer-contact" aria-label={locale === "tr" ? "İletişim bilgileri" : "Contact details"}>
            <a href={publicContact.phone.href}><Phone size={14} aria-hidden="true" />{publicContact.phone.display}</a>
            <a href={publicContact.whatsapp.href} target="_blank" rel="noreferrer"><MessageCircle size={14} aria-hidden="true" />WhatsApp</a>
            <a href={publicContact.email.href}><Mail size={14} aria-hidden="true" />{publicContact.email.display}</a>
            <span><Clock3 size={14} aria-hidden="true" />{publicContact.workingHours}</span>
          </div>
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
      <div className="sv-footer-bottom">
        <span>© {new Date().getFullYear()} Skyvan</span>
        <div className="sv-footer-socials" aria-label={locale === "tr" ? "Sosyal medya" : "Social media"}>
          <span className="sv-footer-social-label">{locale === "tr" ? "Sosyal" : "Social"}</span>
          <div className="sv-footer-social-links">
            {publicSocialLinks.map((social) => {
              const Icon = socialIconByKey[social.key];
              const label = social.label[locale];
              return social.href
                ? <a key={social.key} className="sv-footer-social-link" href={social.href} target="_blank" rel="noreferrer" aria-label={label}><Icon size={16} aria-hidden="true" /></a>
                : <span key={social.key} className="sv-footer-social-link is-placeholder" role="img" aria-label={locale === "tr" ? `${label} bağlantısı yakında` : `${label} link coming soon`} title={locale === "tr" ? `${label} bağlantısı yakında` : `${label} link coming soon`}><Icon size={16} aria-hidden="true" /></span>;
            })}
          </div>
        </div>
      </div>
    </div>
  </footer>;
}
