import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Skyvan — yaşam alanı ve mühendislik yaklaşımı";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function assetDataUrl(path: string) {
  const file = await readFile(join(process.cwd(), path));
  return `data:image/png;base64,${file.toString("base64")}`;
}

export default async function OpenGraphImage() {
  const emblem = await assetDataUrl("public/brand/web/header-emblem-dark.png");
  const wordmark = await assetDataUrl("public/brand/web/wordmark-dark.png");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "linear-gradient(135deg, #090b0c 0%, #171b1d 62%, #252a2c 100%)",
          color: "#f3f3f1",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <img src={emblem} alt="" width="96" height="70" style={{ objectFit: "contain" }} />
          <img src={wordmark} alt="Skyvan" width="340" height="28" style={{ objectFit: "contain" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 850 }}>
          <div style={{ color: "#c6a873", fontSize: 22, letterSpacing: "0.22em" }}>MOTORHOME / ENGINEERING / LIVING</div>
          <div style={{ fontSize: 64, lineHeight: 1.08, letterSpacing: "-0.045em", fontWeight: 600 }}>Özgürlük, mühendislikle.</div>
          <div style={{ color: "#b1b3b5", fontSize: 26, lineHeight: 1.35 }}>Bir araçtan fazlası: hayatınıza göre düşünülmüş bir yaşam sistemi.</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", color: "#8d9495", fontSize: 18, letterSpacing: "0.16em" }}>
          <span>SKYVAN</span>
          <span>SKYVAN.COM.TR</span>
        </div>
      </div>
    ),
    size,
  );
}
