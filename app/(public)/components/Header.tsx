"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { getLocaleFromPathname, getLocalizedPath } from "../lib/public-routing";
import { publicLaunchContent } from "../lib/public-launch-copy";
import { BrandLogo } from "./BrandLogo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";
import { PublicProjectAction } from "./PublicProjectAction";

export function Header(): React.JSX.Element {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const copy = publicLaunchContent[locale];
  const [menuOpen, setMenuOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const home = getLocalizedPath(locale);
  const items = [
    { label: copy.nav.discover, href: `${home}#discover-skyvan` },
    { label: copy.nav.workshop, href: `${home}#workshop` },
    { label: copy.nav.engineering, href: getLocalizedPath(locale, "muhendislik") },
    { label: copy.nav.about, href: getLocalizedPath(locale, "hakkimizda") },
  ];
  return (
    <header className="sv-header" onKeyDown={(event) => { if (event.key === "Escape" && menuOpen) { setMenuOpen(false); toggle.current?.focus(); } }}>
      <a href="#public-main" className="sv-skip">{locale === "tr" ? "İçeriğe geç" : "Skip to content"}</a>
      <div className="sv-container sv-header-row">
        <Link href={home} className="sv-brand" aria-label="Skyvan" onClick={() => setMenuOpen(false)}><BrandLogo variant="emblem" tone="auto" size="headerEmblem" priority /><span>SKYVAN</span></Link>
        <nav className="sv-desktop-nav" aria-label={locale === "tr" ? "Ana menü" : "Main navigation"}>{items.map((item) => <Link key={item.href} href={item.href} aria-current={pathname === item.href ? "page" : undefined}>{item.label}</Link>)}</nav>
        <div className="sv-header-tools">
          <div className="sv-desktop-tool"><ThemeToggle locale={locale} /></div>
          <span onClick={() => setMenuOpen(false)}><LanguageSwitcher /></span>
          <div className="sv-desktop-tool"><PublicProjectAction locale={locale} /></div>
          <button ref={toggle} type="button" className="sv-menu-toggle" aria-label={menuOpen ? (locale === "tr" ? "Menüyü kapat" : "Close menu") : (locale === "tr" ? "Menüyü aç" : "Open menu")} aria-expanded={menuOpen} aria-controls="public-mobile-menu" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={21} /> : <Menu size={21} />}</button>
        </div>
      </div>
      <div hidden={!menuOpen} className="sv-mobile-menu" id="public-mobile-menu"><div className="sv-container"><nav aria-label={locale === "tr" ? "Mobil menü" : "Mobile navigation"}>{items.map((item) => <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>{item.label}</Link>)}</nav><div className="sv-mobile-tools"><ThemeToggle locale={locale} /><span onClick={() => setMenuOpen(false)}><PublicProjectAction locale={locale} /></span></div></div></div>
    </header>
  );
}
