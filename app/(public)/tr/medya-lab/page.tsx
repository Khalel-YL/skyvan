import type { Metadata } from "next";

import { MediaLabPage } from "../../_media-lab/MediaLabPage";

export const metadata: Metadata = {
  title: "Skyvan Media Lab · Skyvan OS",
  description: "Skyvan karar katmanlarını Apple tarzı deneysel bir medya sistemiyle keşfedin.",
};

export default function TurkishMediaLabPage() {
  return <MediaLabPage locale="tr" />;
}
