import type { Metadata } from "next";

import { MediaLabPage } from "../../_media-lab/MediaLabPage";

export const metadata: Metadata = {
  title: "Skyvan Media Lab · Skyvan OS",
  description: "Explore Skyvan decision layers through an Apple-style experimental media system.",
};

export default function EnglishMediaLabPage() {
  return <MediaLabPage locale="en" />;
}
