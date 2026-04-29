import type { Metadata } from "next";

import { ExperienceStoryPage } from "../../_experience/ExperienceStoryPage";

export const metadata: Metadata = {
  title: "Skyvan Experience Prototype · Skyvan OS",
  description: "An experimental Skyvan scroll story showing how a caravan decision becomes production-ready context.",
};

export default function EnglishExperiencePage() {
  return <ExperienceStoryPage locale="en" />;
}
