import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Cpu,
  Box,
  ExternalLink,
  Film,
  LockKeyhole,
  Sparkles,
  Orbit,
} from "lucide-react";

import { HomeDecisionSystemPreview } from "./HomeDecisionSystemPreview";
import { PublicHeroVideoPlayer } from "./PublicHeroVideoPlayer";
import { SkyvanSignatureIntro } from "./SkyvanSignatureIntro";
import type { PublicBlock, PublicBlockMedia, PublicPageContent } from "../lib/launch-content";
import { getLocalizedPath } from "../lib/public-routing";

function safeHref(href: string | undefined, locale: PublicPageContent["locale"]) {
  const value = String(href ?? "").trim();

  if (!value) {
    return getLocalizedPath(locale);
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  if (
    value.startsWith("/admin") ||
    value.startsWith("/workshop") ||
    value.startsWith("/offers") ||
    value.startsWith("/offer") ||
    value.startsWith("/proposal")
  ) {
    return getLocalizedPath(locale);
  }

  if (value === "/") {
    return getLocalizedPath(locale);
  }

  if (value.startsWith("/tr") || value.startsWith("/en")) {
    return value;
  }

  return value.startsWith("/") ? `/${locale}${value}` : getLocalizedPath(locale, value);
}

function ctaLabel(label: string, href: string | undefined, locale: PublicPageContent["locale"]) {
  const normalizedHref = String(href ?? "").trim().replace(/\/+$/g, "");

  if (normalizedHref.endsWith("/proje-baslat")) {
    return locale === "tr" ? "Proje Başlat" : "Start Project";
  }

  return label;
}

function SectionShell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`public-reveal px-5 py-14 md:px-8 md:py-20 ${className}`}>
      <div className="mx-auto w-full max-w-7xl">{children}</div>
    </section>
  );
}

function isAiBlock(block: PublicBlock) {
  const text =
    block.type === "text"
      ? `${block.heading ?? ""} ${block.body ?? block.content ?? ""}`
      : block.type === "feature-list"
        ? `${block.heading ?? ""} ${block.subtext ?? ""}`
        : "";

  return text.toLowerCase().includes("ai") || text.toLowerCase().includes("chatbot");
}

function isWorkshopBlock(block: PublicBlock) {
  const text =
    block.type === "feature-list"
      ? `${block.heading ?? ""} ${block.subtext ?? ""}`
      : "";

  return (
    text.toLowerCase().includes("workshop") ||
    text.toLowerCase().includes("karavanını tasarla") ||
    text.toLowerCase().includes("design your own caravan")
  );
}

function isDecisionFlowBlock(block: PublicBlock) {
  if (block.type !== "feature-list") {
    return false;
  }

  const heading = String(block.heading ?? "").toLowerCase();
  const items = block.items.join(" ").toLowerCase();

  return (
    heading.includes("skyvan nasıl düşünür") ||
    heading.includes("skyvan karar mimarisi") ||
    heading.includes("how skyvan thinks") ||
    heading.includes("skyvan decision architecture") ||
    (items.includes("veri") && items.includes("üretim hazırlığı")) ||
    (items.includes("rota") && items.includes("üretim güveni")) ||
    (items.includes("data") && items.includes("production readiness"))
  );
}

function isRedundantHomeBlock(block: PublicBlock, page: PublicPageContent) {
  if (page.slug !== "") {
    return false;
  }

  const heading = String(
    block.type === "text" || block.type === "feature-list" ? block.heading ?? "" : "",
  ).toLowerCase();

  return (
    heading.includes("yolculuk öncesi kontrol kulesi") ||
    heading.includes("özgürlük hissi") ||
    heading.includes("the control tower before the journey") ||
    heading.includes("freedom starts with decisions") ||
    heading.includes("üretim ve müşteri yolculuğu") ||
    heading.includes("production and customer journey")
  );
}

function isSafeHttpUrl(value: string | undefined) {
  try {
    const url = new URL(String(value ?? ""));
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function getHeroMedia(media: PublicBlockMedia | undefined) {
  if (!media || !isSafeHttpUrl(media.url)) {
    return null;
  }

  if (!["image", "video", "model3d"].includes(media.mediaType)) {
    return null;
  }

  if (
    media.provider &&
    !["direct", "youtube", "vimeo", "external"].includes(media.provider)
  ) {
    return null;
  }

  return {
    ...media,
    previewUrl: isSafeHttpUrl(media.previewUrl) ? media.previewUrl : undefined,
    embedUrl: isSafeHttpUrl(media.embedUrl) ? media.embedUrl : undefined,
  };
}

function HeroMediaShell({
  children,
  label,
  title,
  showCaption = true,
}: {
  children: React.ReactNode;
  label: string;
  title: string;
  showCaption?: boolean;
}) {
  return (
    <div className="relative h-full min-h-[25rem] overflow-hidden rounded-[2rem] border border-[var(--public-border)] bg-[var(--public-surface-strong)] shadow-[0_30px_90px_rgba(0,0,0,0.24)] md:min-h-[29rem] md:rounded-[2.4rem] xl:min-h-[30rem]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_0%,rgba(255,255,255,0.16),transparent_18rem),linear-gradient(145deg,rgba(255,255,255,0.065),transparent_42%)]" />
      <div className="relative h-full min-h-[25rem] overflow-hidden md:min-h-[29rem] xl:min-h-[30rem]">
        {children}
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.14),transparent_34%,rgba(0,0,0,0.46))]" />
      <div className="absolute left-5 top-5 rounded-full border border-white/12 bg-black/22 px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-white/72 backdrop-blur md:left-6 md:top-6">
        {label}
      </div>
      {showCaption ? (
        <div className="absolute bottom-5 left-5 right-5 md:bottom-6 md:left-6 md:right-6">
          <p className="max-w-[32rem] truncate text-sm font-medium text-white/88 drop-shadow">
            {title}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function HeroVideoLinkCard({
  media,
  buttonLabel = "Video bağlantısını aç",
}: {
  media: PublicBlockMedia;
  buttonLabel?: string;
}) {
  const linkUrl = isSafeHttpUrl(media.url) ? media.url : media.embedUrl;

  return (
    <div className="relative flex h-full min-h-[25rem] items-center justify-center overflow-hidden p-6 text-center md:min-h-[29rem] xl:min-h-[30rem]">
      {media.previewUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- Public video poster renders admin-managed external media URLs. */}
          <img
            src={media.previewUrl}
            alt={media.altText || media.title}
            className="absolute inset-0 h-full w-full object-cover opacity-25 blur-[2px]"
          />
          <div className="absolute inset-0 bg-[var(--public-bg)]/74" />
        </>
      ) : null}
      <div className="relative max-w-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/12 bg-white/12 text-white backdrop-blur">
          <Film className="h-7 w-7" />
        </div>
        <p className="mt-5 text-lg font-semibold text-white">{media.title}</p>
        <p className="mt-3 text-sm leading-6 text-white/68">
          Video güvenli bağlantı olarak açılır.
        </p>
        {linkUrl ? (
          <a
            href={linkUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/14 bg-white px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-white/90"
          >
            {buttonLabel}
            <ExternalLink className="h-4 w-4" />
          </a>
        ) : null}
      </div>
    </div>
  );
}

function HeroMediaVisual({ media }: { media: PublicBlockMedia }) {
  const imageUrl = media.previewUrl || media.url;

  if (media.mediaType === "image" && isSafeHttpUrl(imageUrl)) {
    return (
      <HeroMediaShell
        label="Medya varlığı"
        title={media.title}
      >
        <div className="relative h-full min-h-[25rem] md:min-h-[29rem] xl:min-h-[30rem]">
          {/* eslint-disable-next-line @next/next/no-img-element -- Public hero media renders admin-managed external media URLs. */}
          <img
            src={imageUrl}
            alt={media.altText || media.title}
            className="h-full min-h-[25rem] w-full object-cover md:min-h-[29rem] xl:min-h-[30rem]"
          />
          <div className="absolute inset-x-10 bottom-8 h-20 rounded-full bg-black/30 blur-3xl" />
        </div>
      </HeroMediaShell>
    );
  }

  if (media.mediaType === "video") {
    if (media.provider === "youtube" && media.embedUrl) {
      return (
        <HeroMediaShell
          label="Video"
          title={media.title}
          showCaption={false}
        >
          <HeroVideoLinkCard media={media} buttonLabel="Videoyu aç" />
        </HeroMediaShell>
      );
    }

    if (media.provider === "vimeo" && media.embedUrl) {
      return (
        <HeroMediaShell
          label="Video"
          title={media.title}
          showCaption={false}
        >
          <HeroVideoLinkCard media={media} buttonLabel="Videoyu aç" />
        </HeroMediaShell>
      );
    }

    if (media.provider === "direct") {
      return (
        <HeroMediaShell
          label="Video"
          title={media.title}
          showCaption={false}
        >
          <PublicHeroVideoPlayer src={media.url} poster={media.previewUrl} title={media.title} />
        </HeroMediaShell>
      );
    }

    return (
      <HeroMediaShell
        label="Video"
        title={media.title}
        showCaption={false}
      >
        <HeroVideoLinkCard media={media} />
      </HeroMediaShell>
    );
  }

  if (media.mediaType === "model3d") {
    return (
      <HeroMediaShell
        label="3D önizleme"
        title={media.title}
      >
        <div className="relative flex h-full min-h-[25rem] items-center justify-center overflow-hidden p-6 text-center md:min-h-[29rem] xl:min-h-[30rem]">
          {media.previewUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element -- Public model preview renders admin-managed external media URLs. */}
              <img
                src={media.previewUrl}
                alt={media.altText || media.title}
                className="absolute inset-0 h-full w-full object-cover opacity-34"
              />
              <div className="absolute inset-0 bg-black/64" />
            </>
          ) : null}
          <div className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[2.5rem] border border-white/12 bg-white/[0.055] shadow-[0_0_80px_rgba(255,255,255,0.08)]" />
          <div className="relative max-w-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/12 bg-white/12 text-white backdrop-blur">
              <Box className="h-7 w-7" />
            </div>
            <p className="mt-5 text-lg font-semibold text-white">{media.title}</p>
            <p className="mt-3 text-sm leading-6 text-white/68">
              3D önizleme yakında bu alanda gösterilecek.
            </p>
            <p className="mt-3 text-xs font-medium text-white/55">
              Model varlığı URL olarak hazır.
            </p>
          </div>
        </div>
      </HeroMediaShell>
    );
  }

  return null;
}

function DecisionCockpitVisual({ locale }: { locale: PublicPageContent["locale"] }) {
  const checkpoints =
    locale === "tr"
      ? [
          { label: "Rota", detail: "Bağlam" },
          { label: "Yaşam", detail: "Senaryo" },
          { label: "Risk", detail: "Sınır" },
          { label: "Enerji", detail: "Denge" },
          { label: "Üretim", detail: "Hazırlık" },
        ]
      : [
          { label: "Route", detail: "Context" },
          { label: "Living", detail: "Scenario" },
          { label: "Risk", detail: "Boundary" },
          { label: "Energy", detail: "Balance" },
          { label: "Production", detail: "Readiness" },
        ];

  const orbitLabels =
    locale === "tr"
      ? ["Rota", "Yaşam", "Risk", "Enerji", "Üretim"]
      : ["Route", "Living", "Risk", "Energy", "Production"];

  return (
    <div className="public-cockpit-entrance public-skyvan-orbit relative flex h-full min-h-[25rem] flex-col justify-between overflow-hidden rounded-[1.35rem] border border-[var(--public-border)] bg-[linear-gradient(145deg,var(--public-surface-strong),var(--public-surface))] p-4 md:min-h-[28rem] md:rounded-[1.6rem] md:p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_12%,color-mix(in_srgb,var(--public-text)_20%,transparent),transparent_18rem),radial-gradient(circle_at_18%_82%,color-mix(in_srgb,var(--public-text)_9%,transparent),transparent_14rem)]" />
      <div className="absolute left-1/2 top-[45%] h-[24rem] w-[24rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--public-border)] opacity-55" />
      <div className="absolute left-1/2 top-[45%] h-[18rem] w-[18rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--public-border-strong)] opacity-60" />
      <div className="absolute left-1/2 top-[45%] h-[10rem] w-[10rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--public-border)] bg-[var(--public-bg)]/28 backdrop-blur" />

      <div className="relative flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--public-muted)] md:tracking-[0.26em]">
          {locale === "tr" ? "Skyvan yörüngesi" : "Skyvan Orbit"}
        </p>
        <span className="rounded-full border border-[var(--public-border)] bg-[var(--public-surface)] px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[var(--public-muted)]">
          {locale === "tr" ? "Yolculuk sistemi" : "Journey OS"}
        </span>
      </div>

      <div className="relative my-8 flex min-h-[15rem] items-center justify-center md:my-10">
        <div className="absolute left-[11%] top-[18%] h-px w-[34%] rotate-[-18deg] bg-[var(--public-border-strong)]" />
        <div className="absolute right-[12%] top-[22%] h-px w-[31%] rotate-[18deg] bg-[var(--public-border-strong)]" />
        <div className="absolute bottom-[20%] left-[13%] h-px w-[30%] rotate-[18deg] bg-[var(--public-border-strong)]" />
        <div className="absolute bottom-[20%] right-[13%] h-px w-[30%] rotate-[-18deg] bg-[var(--public-border-strong)]" />

        <div className="relative h-36 w-64 sm:h-40 sm:w-72">
          <div className="absolute left-[7%] right-[7%] top-[30%] h-[46%] rounded-[4rem] border border-[var(--public-border-strong)] bg-[linear-gradient(135deg,var(--public-surface-strong),var(--public-surface)_58%,transparent)] shadow-[0_26px_70px_rgba(0,0,0,0.14),inset_0_1px_0_rgba(255,255,255,0.2)]" />
          <div className="absolute right-[8%] top-[34%] h-[38%] w-[20%] rounded-r-[4rem] border border-l-0 border-[var(--public-border)] bg-[linear-gradient(120deg,color-mix(in_srgb,var(--public-text)_8%,transparent),transparent)]" />
          <div className="absolute left-[20%] right-[26%] top-[43%] h-[15%] rounded-full border border-[var(--public-border)] bg-[var(--public-bg)]/34" />
          <div className="absolute bottom-[23%] left-[28%] h-4 w-8 rounded-full border border-[var(--public-border-strong)] bg-[var(--public-surface-strong)]" />
          <div className="absolute bottom-[23%] right-[28%] h-4 w-8 rounded-full border border-[var(--public-border-strong)] bg-[var(--public-surface-strong)]" />
          <div className="absolute left-[11%] top-[30%] h-2 w-2 rounded-full bg-[var(--public-text)] opacity-75 shadow-[0_0_26px_color-mix(in_srgb,var(--public-text)_60%,transparent)]" />
          <div className="absolute right-[15%] top-[28%] h-2 w-2 rounded-full bg-[var(--public-text)] opacity-55" />
          <div className="absolute left-1/2 top-[52%] flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--public-border-strong)] bg-[var(--public-surface)] text-[var(--public-text)] shadow-[0_18px_48px_rgba(0,0,0,0.12)]">
            <Orbit className="h-5 w-5" />
          </div>
        </div>

        {orbitLabels.map((item, index) => (
          <span
            key={item}
            className={`absolute rounded-full border border-[var(--public-border)] bg-[var(--public-surface)] px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--public-muted)] shadow-[0_14px_38px_rgba(0,0,0,0.08)] ${
              index === 0
                ? "left-0 top-[9%]"
                : index === 1
                  ? "right-0 top-[16%]"
                  : index === 2
                    ? "bottom-[8%] left-0"
                    : index === 3
                      ? "bottom-[8%] right-0"
                      : "bottom-[-2%] left-1/2 -translate-x-1/2"
            }`}
          >
            {item}
          </span>
        ))}
      </div>

      <div className="relative grid gap-2 sm:grid-cols-5">
        {checkpoints.map((item, index) => (
          <div
            key={item.label}
            className="public-hero-module min-w-0 rounded-2xl border border-[var(--public-border)] bg-[var(--public-surface)] p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[var(--public-muted)]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--public-text)] opacity-45" />
            </div>
            <p className="mt-3 truncate text-sm font-semibold text-[var(--public-text)]">{item.label}</p>
            <p className="mt-1 truncate text-xs text-[var(--public-muted)]">{item.detail}</p>
          </div>
        ))}
      </div>

      <p className="relative mt-6 text-sm leading-6 text-[var(--public-muted)]">
        {locale === "tr"
          ? "Özgürlük fikri; rota çizgisi, yaşam senaryosu, risk sınırları ve üretime hazırlık aynı ekranda sakinleştiğinde güvene yaklaşır."
          : "The idea of freedom becomes more trustworthy when route, living scenario, risk boundaries, and production readiness are visible together."}
      </p>
    </div>
  );
}

function HomeJourneyOsSections({ locale }: { locale: PublicPageContent["locale"] }) {
  const transformation =
    locale === "tr"
      ? [
          {
            title: "Hayal",
            body: "Özgürlük, rota, doğa, konfor ve yaşam isteği henüz dağınık bir sezgidir.",
          },
          {
            title: "Karar",
            body: "Skyvan bu isteği rota, yaşam, risk ve teknik sınırlarla okunabilir hale getirir.",
          },
          {
            title: "Üretim",
            body: "Netleşen karar, üretime hazırlanabilir kontrollü bir projeye dönüşür.",
          },
        ]
      : [
          {
            title: "Dream",
            body: "Freedom, route, nature, comfort, and living needs begin as an open intention.",
          },
          {
            title: "Decision",
            body: "Skyvan clarifies that intention through route, living, risk, and technical boundaries.",
          },
          {
            title: "Production",
            body: "A clarified decision becomes a controlled project that can be prepared for production.",
          },
        ];
  const livingQuestions =
    locale === "tr"
      ? ["Nerede duracaksın?", "Nasıl yaşayacaksın?", "Hangi konfor gerçekten gerekli?"]
      : ["Where will you stop?", "How will you live?", "Which comfort truly matters?"];

  return (
    <>
      <SectionShell className="public-journey-os-section border-y border-[var(--public-border)] bg-[var(--public-bg-soft)]">
        <div className="grid gap-8 lg:grid-cols-[0.38fr_0.62fr] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--public-muted)]">
              {locale === "tr" ? "Yolculuk sistemi" : "Journey OS"}
            </p>
            <h2 className="mt-4 max-w-xl text-3xl font-semibold tracking-tight text-[var(--public-text)] md:text-5xl">
              {locale === "tr"
                ? "Skyvan, yolculuğu üretilebilir bir karara dönüştürür."
                : "Skyvan turns the journey into a buildable decision."}
            </h2>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {transformation.map((item, index) => (
              <div
                key={item.title}
                className="public-journey-step relative overflow-hidden rounded-[1.6rem] border border-[var(--public-border)] bg-[var(--public-surface)] p-5 md:min-h-60"
              >
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--public-muted)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-8 text-2xl font-semibold tracking-tight text-[var(--public-text)]">
                  {item.title}
                </h3>
                <p className="mt-4 text-sm leading-7 text-[var(--public-muted)]">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </SectionShell>

      <SectionShell>
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="public-principle-panel relative overflow-hidden rounded-[2rem] border border-[var(--public-border)] bg-[var(--public-surface)] p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--public-muted)]">
              {locale === "tr" ? "Yaşam senaryosu" : "Living scenario"}
            </p>
            <h2 className="mt-4 max-w-xl text-3xl font-semibold tracking-tight text-[var(--public-text)] md:text-5xl">
              {locale === "tr"
                ? "Yaşam senaryosu olmadan doğru karavan olmaz."
                : "The right caravan starts with a living scenario."}
            </h2>
            <div className="mt-8 grid gap-3">
              {livingQuestions.map((question) => (
                <div
                  key={question}
                  className="rounded-2xl border border-[var(--public-border)] bg-[var(--public-surface-strong)] px-4 py-3 text-sm font-medium text-[var(--public-text)]"
                >
                  {question}
                </div>
              ))}
            </div>
          </div>

          <div className="public-principle-panel relative overflow-hidden rounded-[2rem] border border-[var(--public-border)] bg-[var(--public-surface)] p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--public-muted)]">
              {locale === "tr" ? "Görsel güven" : "Visual trust"}
            </p>
            <h2 className="mt-4 max-w-xl text-3xl font-semibold tracking-tight text-[var(--public-text)] md:text-5xl">
              {locale === "tr"
                ? "Görünen şey, üretilebilir olmalı."
                : "What is shown must remain buildable."}
            </h2>
            <p className="mt-8 text-base leading-8 text-[var(--public-muted)]">
              {locale === "tr"
                ? "Skyvan görselleştirir; ama kandırmaz. Her görsel, karar hazırlığını güçlendirmek için kullanılır. Gerçeklik; teknik sınır, ürün bağı ve insan onayıyla korunur."
                : "Skyvan visualizes, but does not pretend. Every visual is used to strengthen decision preparation. Reality is protected by technical boundaries, product relationships, and human approval."}
            </p>
          </div>
        </div>
      </SectionShell>
    </>
  );
}

function HeroBlock({ block, page }: { block: Extract<PublicBlock, { type: "hero" }>; page: PublicPageContent }) {
  const media = getHeroMedia(block.media);
  const homeHeroCopy =
    page.slug === ""
      ? page.locale === "tr"
        ? {
            heading: "Yolculuk başlamadan önce, güven hazırlanır.",
            subtext:
              "Skyvan; rota, yaşam düzeni, teknik risk ve üretim hazırlığını kontrollü bir karavan karar yolculuğuna dönüştürür.",
            body:
              "Workshop yalnızca bir modüldür. Skyvan, karar başlamadan önce bağlamı, sınırları ve üretime hazırlığı görünür kılan sakin bir platformdur.",
          }
        : {
            heading: "Confidence is engineered before the journey begins.",
            subtext:
              "Skyvan turns route, lifestyle, technical risk, and production readiness into a controlled caravan decision journey.",
            body:
              "Workshop is one module, not the whole product. Skyvan is a calm platform for making context, boundaries, and production readiness visible before decisions begin.",
          }
      : null;
  const heroHeading = homeHeroCopy?.heading ?? block.heading;
  const heroSubtext = homeHeroCopy?.subtext ?? block.subtext;
  const heroBody = homeHeroCopy?.body ?? block.body;
  const heroTrustLine =
    page.locale === "tr"
      ? "Karar sizde kalır; Skyvan hazırlığı netleştirir."
      : "You decide; Skyvan makes preparation clear.";

  return (
    <section className="public-reveal relative overflow-hidden px-5 pb-16 pt-16 md:px-8 md:pb-24 md:pt-24">
      <div className="absolute inset-x-0 top-0 h-px bg-[var(--public-border)]" />
      <div className="public-hero-glow absolute inset-x-0 top-[-7rem] mx-auto h-[42rem] w-full max-w-[62rem] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.2),rgba(255,255,255,0.055)_38%,transparent_68%)] opacity-45" />
      <div className="absolute left-1/2 top-28 h-[28rem] w-[86vw] max-w-5xl -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.075),transparent_68%)] opacity-60" />
      <div
        className={`mx-auto grid w-full max-w-7xl gap-12 lg:grid-cols-[1.08fr_0.92fr] ${
          media ? "lg:items-start" : "lg:items-center"
        }`}
      >
        <div className="relative min-w-0">
          <p className="public-hero-stage inline-flex max-w-full rounded-full border border-[var(--public-border)] bg-[var(--public-surface)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--public-muted)] md:tracking-[0.22em]">
            {page.slug === ""
              ? page.locale === "tr"
                ? "Özgürlük, mühendislikle."
                : "Freedom, Engineered."
              : page.locale === "tr"
                ? "Premium karavan üretim sistemi"
                : "Premium caravan production system"}
          </p>
          <h1 className="public-hero-stage mt-7 max-w-5xl break-words text-[2.2rem] font-semibold leading-[0.98] tracking-tight text-[var(--public-text)] min-[390px]:text-[2.55rem] md:text-7xl md:leading-[0.94]">
            {heroHeading}
          </h1>
          {heroSubtext ? (
            <p className="public-hero-stage mt-6 max-w-2xl text-base leading-8 text-[var(--public-muted)] md:text-xl md:leading-9">
              {heroSubtext}
            </p>
          ) : null}
          {heroBody ? (
            <p className="public-hero-stage mt-5 max-w-2xl text-sm leading-7 text-[var(--public-muted)] md:text-base md:leading-8">
              {heroBody}
            </p>
          ) : null}
          {block.ctaLabel ? (
            <div className="public-hero-stage mt-8">
              <Link
                href={safeHref(block.ctaHref, page.locale)}
                className="public-premium-cta inline-flex items-center gap-2 rounded-full bg-[var(--public-accent)] px-6 py-3 text-sm font-semibold text-[var(--public-accent-text)] transition hover:opacity-95"
              >
                {ctaLabel(block.ctaLabel, block.ctaHref, page.locale)}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="mt-3 max-w-md text-[0.72rem] font-medium leading-5 text-[var(--public-muted)]">
                {heroTrustLine}
              </p>
            </div>
          ) : null}
          <div className="public-hero-stage mt-8 flex w-full max-w-2xl flex-wrap gap-2 text-xs text-[var(--public-muted)]">
            {(page.locale === "tr"
              ? ["Rota", "Yaşam", "Üretim"]
              : ["Route", "Living", "Production"]
            ).map((item) => (
              <span
                key={item}
                className="public-hero-chip min-w-0 flex-1 basis-24 rounded-full border border-[var(--public-border)] bg-[var(--public-surface)] px-3 py-2 text-center sm:flex-none sm:basis-40"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div
          className={`public-hero-visual relative w-full max-w-full min-w-0 overflow-hidden ${
            media
              ? "min-h-[25rem] rounded-[2rem] md:min-h-[29rem] md:rounded-[2.4rem] xl:min-h-[30rem]"
              : "min-h-[27rem] rounded-[1.75rem] border border-[var(--public-border)] bg-[var(--public-surface)] p-3 backdrop-blur sm:p-5 md:min-h-[31rem] md:rounded-[2.2rem]"
          }`}
        >
          {media ? (
            <HeroMediaVisual media={media} />
          ) : (
            <>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_8%,rgba(255,255,255,0.2),transparent_18rem),radial-gradient(circle_at_82%_76%,rgba(255,255,255,0.08),transparent_15rem),linear-gradient(145deg,rgba(255,255,255,0.075),transparent_44%)]" />
              <div className="absolute inset-x-6 bottom-10 h-24 rounded-[100%] bg-black/20 blur-3xl md:inset-x-12" />
              <DecisionCockpitVisual locale={page.locale} />
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function TextBlock({
  block,
}: {
  block: Extract<PublicBlock, { type: "text" }>;
  page: PublicPageContent;
}) {
  return (
    <SectionShell>
      <div className="grid gap-6 md:grid-cols-[0.42fr_0.58fr] md:items-start">
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--public-text)] md:text-4xl">
          {block.heading}
        </h2>
        <p className="whitespace-pre-line text-base leading-8 text-[var(--public-muted)]">
          {block.body ?? block.content}
        </p>
      </div>
    </SectionShell>
  );
}

function FeatureListBlock({
  block,
  page,
}: {
  block: Extract<PublicBlock, { type: "feature-list" }>;
  page: PublicPageContent;
}) {
  if (isDecisionFlowBlock(block)) {
    const decisionItems = page.slug === ""
      ? page.locale === "tr"
        ? ["Rota", "Yaşam", "Teknik sınır", "Risk görünürlüğü", "Üretim hazırlığı"]
        : ["Route", "Living", "Technical boundary", "Risk visibility", "Production readiness"]
      : block.items;
    const decisionHeading =
      page.slug === ""
        ? page.locale === "tr"
          ? "Skyvan karar mimarisi"
          : "Skyvan decision architecture"
        : block.heading;
    const decisionSubtext =
      page.slug === ""
        ? page.locale === "tr"
          ? "Skyvan, karavan kararını tekrar kartlara bölmez; birbirine bağlı katmanları kısa ve okunabilir bir mühendislik çerçevesine indirir."
          : "Skyvan does not split the caravan decision into another grid; it compresses connected layers into a readable engineering frame."
        : block.subtext;
    const aiContext =
      page.locale === "tr"
        ? {
            label: "Bağlam görünürlüğü",
            items: [
              "Rota ve kullanım senaryosu netleştirilir.",
              "Eksik bilgiler erken görünür hale gelir.",
              "Teknik riskler karar öncesi işaretlenir.",
              "Final karar insan onayıyla kalır.",
            ],
            disclaimer: "Bu panel karar vermez; yalnızca hazırlık bağlamını görünür kılar.",
          }
        : {
            label: "Context visibility",
            items: [
              "Route and usage scenario are clarified.",
              "Missing inputs become visible early.",
              "Technical risks are surfaced before decisions.",
              "Final approval stays human-led.",
            ],
            disclaimer: "This panel does not decide; it only makes preparation context visible.",
          };

    return (
      <SectionShell className="bg-[var(--public-bg-soft)] py-12 md:py-16">
        <div className="grid gap-6 rounded-[2rem] border border-[var(--public-border)] bg-[var(--public-surface)] p-5 md:p-7 lg:grid-cols-[0.42fr_0.58fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--public-muted)]">
              {page.locale === "tr" ? "Sistem zekası" : "System intelligence"}
            </p>
            <h2 className="mt-4 max-w-xl text-2xl font-semibold tracking-tight text-[var(--public-text)] md:text-4xl">
              {decisionHeading}
            </h2>
            {decisionSubtext ? (
              <p className="mt-5 max-w-xl text-base leading-8 text-[var(--public-muted)]">
                {decisionSubtext}
              </p>
            ) : null}
          </div>

          <div className="public-system-panel rounded-[1.5rem] border border-[var(--public-border)] bg-[var(--public-surface-strong)] p-4 md:p-5">
            <div className="flex flex-wrap gap-2">
              {decisionItems.map((item, index) => (
                <div
                  key={item}
                  className="rounded-full border border-[var(--public-border)] bg-[var(--public-surface)] px-3 py-2 text-sm font-medium text-[var(--public-text)]"
                >
                  <span className="mr-2 text-xs text-[var(--public-muted)]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {item}
                </div>
              ))}
            </div>
            <div className="public-ai-context-panel mt-4 grid gap-4 rounded-[1.25rem] border border-[var(--public-border)] bg-[var(--public-surface)] p-4 md:grid-cols-[0.34fr_0.66fr]">
              <div className="min-w-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[var(--public-accent)] text-[var(--public-accent-text)]">
                  <Cpu className="h-4 w-4" />
                </div>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--public-muted)]">
                  {aiContext.label}
                </p>
                <h3 className="mt-2 text-xl font-semibold tracking-tight text-[var(--public-text)]">
                  Skyvan AI
                </h3>
              </div>
              <div className="min-w-0">
                <div className="grid gap-2">
                  {aiContext.items.map((item) => (
                    <div
                      key={item}
                      className="public-ai-context-item flex gap-2 rounded-2xl border border-[var(--public-border)] bg-[var(--public-surface-strong)] px-3 py-2"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--public-text)]" />
                      <p className="text-sm leading-6 text-[var(--public-muted)]">{item}</p>
                    </div>
                  ))}
                </div>
                <p className="public-ai-context-disclaimer mt-3 rounded-2xl border border-[var(--public-border)] bg-[var(--public-bg)]/30 px-4 py-3 text-xs leading-6 text-[var(--public-muted)]">
                  {aiContext.disclaimer}
                </p>
              </div>
            </div>
          </div>
        </div>
      </SectionShell>
    );
  }

  if (isWorkshopBlock(block)) {
    return (
      <SectionShell>
        <div className="grid gap-8 rounded-[2.2rem] border border-[var(--public-border-strong)] bg-[var(--public-surface)] p-6 md:p-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-[var(--public-border)] bg-[var(--public-surface-strong)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--public-muted)]">
              <Sparkles className="h-3.5 w-3.5" />
              {block.heading}
            </p>
            {block.subtext ? (
              <p className="mt-5 max-w-xl text-lg leading-8 text-[var(--public-muted)]">
                {block.subtext}
              </p>
            ) : null}
            <div className="mt-7 grid gap-3">
              {block.items.map((item) => (
                <div key={item} className="flex gap-3 rounded-2xl border border-[var(--public-border)] bg-[var(--public-surface-strong)] p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--public-text)]" />
                  <p className="text-sm leading-6 text-[var(--public-muted)]">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.8rem] border border-[var(--public-border)] bg-[var(--public-surface-strong)] p-5 md:p-8">
            <div className="flex flex-col justify-between rounded-[1.35rem] border border-[var(--public-border)] bg-[var(--public-bg)]/35 p-5 md:min-h-[20rem] md:p-6">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--public-accent)] text-[var(--public-accent-text)]">
                  <LockKeyhole className="h-5 w-5" />
                </div>
                <p className="mt-7 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--public-muted)]">
                  {page.locale === "tr" ? "Henüz aktif değil" : "Not active yet"}
                </p>
                <h3 className="mt-3 max-w-md text-2xl font-semibold tracking-tight text-[var(--public-text)] md:text-3xl">
                  {block.heading}
                </h3>
              </div>
              <p className="mt-8 max-w-md text-sm leading-7 text-[var(--public-muted)]">
                {page.locale === "tr"
                  ? "Bu alan seçim ekranı, fiyat aracı veya çalışan configurator değildir. Skyvan, açılmadan önce bile neyin hazır olduğunu ve neyin kapalı kaldığını net söyler."
                  : "This is not a selection screen, pricing tool, or working configurator. Skyvan is clear about what is ready and what remains closed before launch."}
              </p>
            </div>
          </div>
        </div>
      </SectionShell>
    );
  }

  return (
    <SectionShell className="border-y border-[var(--public-border)] bg-[var(--public-surface)]">
      <div className="grid gap-8 lg:grid-cols-[0.38fr_0.62fr]">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--public-text)] md:text-4xl">
            {block.heading}
          </h2>
          {block.subtext ? (
            <p className="mt-4 text-sm leading-7 text-[var(--public-muted)]">{block.subtext}</p>
          ) : null}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {block.items.map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-[var(--public-border)] bg-[var(--public-surface-strong)] p-5"
            >
              <CheckCircle2 className="h-5 w-5 text-[var(--public-text)]" />
              <p className="mt-4 text-sm leading-7 text-[var(--public-muted)]">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}

function StatsBlock({ block }: { block: Extract<PublicBlock, { type: "stats" }> }) {
  return (
    <SectionShell>
      {block.heading ? (
        <h2 className="mb-8 text-2xl font-semibold tracking-tight text-[var(--public-text)] md:text-4xl">
          {block.heading}
        </h2>
      ) : null}
      <div className="grid gap-3 md:grid-cols-3">
        {block.stats.map((stat) => (
          <div
            key={`${stat.label}:${stat.value}`}
            className="rounded-2xl border border-[var(--public-border)] bg-[var(--public-surface)] p-6"
          >
            <p className="text-sm text-[var(--public-muted)]">{stat.label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-[var(--public-text)]">
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

function CtaBlock({ block, page }: { block: Extract<PublicBlock, { type: "cta" }>; page: PublicPageContent }) {
  return (
    <SectionShell>
      <div className="public-final-cta rounded-[2rem] border border-[var(--public-border-strong)] bg-[var(--public-accent)] p-8 text-[var(--public-accent-text)] md:p-12">
        <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <h2 className="max-w-3xl text-3xl font-semibold tracking-tight md:text-5xl">
              {block.heading}
            </h2>
            {block.body ? (
              <p className="mt-5 max-w-2xl text-sm leading-7 opacity-75 md:text-base">{block.body}</p>
            ) : null}
          </div>
          {block.ctaLabel ? (
            <Link
              href={safeHref(block.ctaHref, page.locale)}
              className="public-premium-cta inline-flex items-center justify-center gap-2 rounded-full bg-[var(--public-accent-text)] px-6 py-3 text-sm font-semibold text-[var(--public-accent)] transition hover:opacity-90"
            >
              {ctaLabel(block.ctaLabel, block.ctaHref, page.locale)}
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : null}
        </div>
      </div>
    </SectionShell>
  );
}

function renderBlock(block: PublicBlock, page: PublicPageContent, index: number) {
  if (block.type === "hero") {
    return <HeroBlock key={index} block={block} page={page} />;
  }

  if (block.type === "text") {
    return <TextBlock key={index} block={block} page={page} />;
  }

  if (block.type === "feature-list") {
    return <FeatureListBlock key={index} block={block} page={page} />;
  }

  if (block.type === "stats") {
    return <StatsBlock key={index} block={block} />;
  }

  if (block.type === "decision-system-preview") {
    return <HomeDecisionSystemPreview key={index} locale={page.locale} />;
  }

  return <CtaBlock key={index} block={block} page={page} />;
}

export function PublicPageRenderer({ page }: { page: PublicPageContent }) {
  const visibleBlocks = page.blocks.filter(
    (block) => !(block.type === "text" && isAiBlock(block)) && !isRedundantHomeBlock(block, page),
  );
  const showSignatureIntro = page.slug === "";

  return (
    <div>
      {showSignatureIntro ? <SkyvanSignatureIntro /> : null}
      {visibleBlocks.map((block, index) => (
        <div key={`${block.type}:${index}`}>
          {renderBlock(block, page, index)}
          {showSignatureIntro && index === 0 ? <HomeJourneyOsSections locale={page.locale} /> : null}
        </div>
      ))}
    </div>
  );
}
