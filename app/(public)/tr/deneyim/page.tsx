import type { Metadata } from "next";

import { ExperienceStoryPage } from "../../_experience/ExperienceStoryPage";

export const metadata: Metadata = {
  title: "Skyvan Deneyim Prototipi · Skyvan OS",
  description: "Bir karavan kararının üretime hazır bağlama nasıl dönüştüğünü anlatan deneysel Skyvan scroll hikayesi.",
};

export default function TurkishExperiencePage() {
  return <ExperienceStoryPage locale="tr" />;
}
