import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { publicLaunchContent } from "../lib/public-launch-copy";
import { getLocalizedPath, type PublicLocale } from "../lib/public-routing";

export function PublicProjectAction({ locale, secondary = false }: { locale: PublicLocale; secondary?: boolean }): React.JSX.Element {
  const copy = publicLaunchContent[locale];
  return <span className="sv-project-action"><Link className={`sv-button ${secondary ? "sv-button-outline" : ""}`} href={getLocalizedPath(locale, "proje-baslat")} aria-label={`${copy.project}, ${copy.upcoming}`}>{copy.project}<ArrowUpRight size={15} aria-hidden="true" /></Link><span className="sv-status">{copy.upcoming}</span></span>;
}
