import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Cpu,
  Factory,
  LockKeyhole,
  Route,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import type { PublicBlock, PublicPageContent } from "../lib/launch-content";
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
    heading.includes("how skyvan thinks") ||
    (items.includes("veri") && items.includes("üretim hazırlığı")) ||
    (items.includes("data") && items.includes("production readiness"))
  );
}

function HeroBlock({ block, page }: { block: Extract<PublicBlock, { type: "hero" }>; page: PublicPageContent }) {
  const heroTrustLine =
    page.locale === "tr"
      ? "Admin kontrollü yayın. Simülasyon yok. Karar sizin, sistem sadece hazırlar."
      : "Admin-controlled publishing. No simulation. You decide; the system prepares.";

  return (
    <section className="public-reveal relative overflow-hidden px-5 pb-16 pt-16 md:px-8 md:pb-24 md:pt-24">
      <div className="absolute inset-x-0 top-0 h-px bg-[var(--public-border)]" />
      <div className="public-hero-glow absolute inset-x-0 top-[-7rem] mx-auto h-[42rem] w-full max-w-[62rem] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.2),rgba(255,255,255,0.055)_38%,transparent_68%)] opacity-45" />
      <div className="absolute left-1/2 top-28 h-[28rem] w-[86vw] max-w-5xl -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.075),transparent_68%)] opacity-60" />
      <div className="mx-auto grid w-full max-w-7xl gap-12 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
        <div className="relative min-w-0">
          <p className="public-hero-stage inline-flex max-w-full rounded-full border border-[var(--public-border)] bg-[var(--public-surface)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--public-muted)] md:tracking-[0.22em]">
            {page.slug === ""
              ? "Freedom, Engineered."
              : page.locale === "tr"
                ? "Premium karavan üretim sistemi"
                : "Premium caravan production system"}
          </p>
          <h1 className="public-hero-stage mt-7 max-w-5xl break-words text-[2.2rem] font-semibold leading-[0.98] tracking-tight text-[var(--public-text)] min-[390px]:text-[2.55rem] md:text-7xl md:leading-[0.94]">
            {block.heading}
          </h1>
          {block.subtext ? (
            <p className="public-hero-stage mt-6 max-w-2xl text-base leading-8 text-[var(--public-muted)] md:text-xl md:leading-9">
              {block.subtext}
            </p>
          ) : null}
          {block.body ? (
            <p className="public-hero-stage mt-5 max-w-2xl text-sm leading-7 text-[var(--public-muted)] md:text-base md:leading-8">
              {block.body}
            </p>
          ) : null}
          {block.ctaLabel ? (
            <div className="public-hero-stage mt-8">
              <Link
                href={safeHref(block.ctaHref, page.locale)}
                className="public-premium-cta inline-flex items-center gap-2 rounded-full bg-[var(--public-accent)] px-6 py-3 text-sm font-semibold text-[var(--public-accent-text)] transition hover:opacity-95"
              >
                {block.ctaLabel}
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

        <div className="public-hero-visual relative min-h-[27rem] w-full max-w-full min-w-0 overflow-hidden rounded-[1.75rem] border border-[var(--public-border)] bg-[var(--public-surface)] p-3 backdrop-blur sm:p-5 md:min-h-[31rem] md:rounded-[2.2rem]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_8%,rgba(255,255,255,0.2),transparent_18rem),radial-gradient(circle_at_82%_76%,rgba(255,255,255,0.08),transparent_15rem),linear-gradient(145deg,rgba(255,255,255,0.075),transparent_44%)]" />
          <div className="absolute inset-x-6 bottom-10 h-24 rounded-[100%] bg-black/20 blur-3xl md:inset-x-12" />
          <div className="public-hero-panel relative flex h-full min-h-[25rem] min-w-0 flex-col justify-between overflow-hidden rounded-[1.35rem] border border-[var(--public-border)] bg-[var(--public-surface-strong)] p-4 md:min-h-[28rem] md:rounded-[1.6rem] md:p-6">
            <div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--public-muted)] md:tracking-[0.26em]">
                  {page.locale === "tr" ? "Yolculuk mimarisi" : "Journey architecture"}
                </p>
                <span className="h-2 w-2 rounded-full bg-[var(--public-text)] opacity-45" />
              </div>
              <div className="public-hero-diagram mt-6 overflow-hidden rounded-[1.15rem] border border-[var(--public-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.025))] p-3 md:mt-8 md:rounded-[1.3rem] md:p-4">
                <div className="relative h-44 rounded-[1rem] border border-[var(--public-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.035))]">
                  <div className="absolute left-[8%] right-[8%] top-[24%] h-px bg-[var(--public-border)] opacity-70" />
                  <div className="absolute bottom-[28%] left-[8%] right-[8%] h-px bg-[var(--public-border)] opacity-70" />
                  <div className="absolute left-[13%] top-[25%] h-20 w-[64%] max-w-64 rounded-[2.15rem] border border-[var(--public-border-strong)] bg-[linear-gradient(135deg,var(--public-surface-strong),var(--public-surface))] shadow-xl" />
                  <div className="absolute left-[20%] top-[34%] h-7 w-[22%] max-w-20 rounded-xl border border-[var(--public-border)] bg-[var(--public-surface)]" />
                  <div className="absolute left-[48%] top-[34%] h-7 w-[18%] max-w-16 rounded-xl border border-[var(--public-border)] bg-[var(--public-surface)]" />
                  <div className="absolute bottom-[25%] left-[22%] h-8 w-8 rounded-full border border-[var(--public-border-strong)] bg-[var(--public-bg)] shadow-[0_0_0_7px_rgba(255,255,255,0.04)]" />
                  <div className="absolute bottom-[25%] left-[62%] h-8 w-8 rounded-full border border-[var(--public-border-strong)] bg-[var(--public-bg)] shadow-[0_0_0_7px_rgba(255,255,255,0.04)]" />
                  <div className="absolute right-[11%] top-[27%] h-20 w-20 rounded-2xl border border-[var(--public-border)] bg-[var(--public-surface)] p-3">
                    <div className="h-full w-full rounded-xl border border-[var(--public-border-strong)] bg-[linear-gradient(135deg,rgba(255,255,255,0.13),transparent)]" />
                  </div>
                  <div className="absolute bottom-5 left-6 right-6 grid grid-cols-4 gap-2">
                    {[0, 1, 2, 3].map((item) => (
                      <span
                        key={item}
                        className="h-1 rounded-full bg-[var(--public-border-strong)] opacity-70"
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  { icon: Route, label: page.locale === "tr" ? "Rota" : "Route" },
                  { icon: ShieldCheck, label: page.locale === "tr" ? "Güven" : "Trust" },
                  { icon: Factory, label: page.locale === "tr" ? "Üretim" : "Build" },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.label}
                      className="public-hero-module min-w-0 rounded-2xl border border-[var(--public-border)] bg-[var(--public-surface)] p-3"
                    >
                      <Icon className="h-4 w-4 text-[var(--public-text)]" />
                      <p className="mt-2 truncate text-xs font-medium text-[var(--public-muted)]">{item.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>
            <p className="mt-8 text-sm leading-6 text-[var(--public-muted)]">
              {page.locale === "tr"
                ? "Hayal edilen yolculuk, üretime hazırlanabilecek net bir sisteme dönüşür."
                : "The imagined journey becomes a clear system ready for production preparation."}
            </p>
          </div>
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
    const descriptions =
      page.locale === "tr"
        ? [
            "Rota, kullanım alışkanlığı ve teknik bağlam birlikte okunur.",
            "Günlük ritim anlaşılır bir yaşam senaryosuna dönüşür.",
            "Belirsizlikler erken görülebilen karar başlıklarına ayrılır.",
            "Seçenekler karar öncesi daha net bir yön kazanır.",
            "İnsan onayı ve teknik disiplin merkezde kalır.",
            "Netleşen bağlam kontrollü bir başlangıca taşınır.",
          ]
        : [
            "Route, usage habits, and technical context are read together.",
            "Daily rhythm becomes an understandable living scenario.",
            "Uncertainty becomes early decision context.",
            "Options gain clearer direction before decisions are made.",
            "Human approval and technical discipline stay central.",
            "Clarified context moves toward a controlled beginning.",
          ];
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
      <SectionShell className="bg-[var(--public-bg-soft)]">
        <div className="grid gap-10 lg:grid-cols-[0.36fr_0.64fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--public-muted)]">
              {page.locale === "tr" ? "Sistem zekası" : "System intelligence"}
            </p>
            <h2 className="mt-4 max-w-xl text-3xl font-semibold tracking-tight text-[var(--public-text)] md:text-5xl">
              {block.heading}
            </h2>
            {block.subtext ? (
              <p className="mt-5 max-w-xl text-base leading-8 text-[var(--public-muted)]">
                {block.subtext}
              </p>
            ) : null}
          </div>

          <div className="public-system-panel rounded-[2rem] border border-[var(--public-border)] bg-[var(--public-surface)] p-4 md:p-6">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {block.items.map((item, index) => (
                <div
                  key={item}
                  className="public-flow-card rounded-[1.35rem] border border-[var(--public-border)] bg-[var(--public-surface-strong)] p-4 sm:min-h-44 sm:p-5"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--public-muted)]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="h-px flex-1 bg-[var(--public-border)]" />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold tracking-tight text-[var(--public-text)]">
                    {item}
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-[var(--public-muted)]">
                    {descriptions[index] ?? descriptions[descriptions.length - 1]}
                  </p>
                </div>
              ))}
            </div>
            <div className="public-ai-context-panel mt-4 grid gap-5 rounded-[1.5rem] border border-[var(--public-border)] bg-[var(--public-surface-strong)] p-4 md:grid-cols-[0.34fr_0.66fr] md:p-5">
              <div className="min-w-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--public-accent)] text-[var(--public-accent-text)]">
                  <Cpu className="h-4 w-4" />
                </div>
                <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--public-muted)]">
                  {aiContext.label}
                </p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--public-text)]">
                  Skyvan AI
                </h3>
              </div>
              <div className="min-w-0">
                <div className="grid gap-2 sm:grid-cols-2">
                  {aiContext.items.map((item) => (
                    <div
                      key={item}
                      className="public-ai-context-item flex gap-2 rounded-2xl border border-[var(--public-border)] bg-[var(--public-surface)] p-3"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--public-text)]" />
                      <p className="text-sm leading-6 text-[var(--public-muted)]">{item}</p>
                    </div>
                  ))}
                </div>
                <p className="public-ai-context-disclaimer mt-4 rounded-2xl border border-[var(--public-border)] bg-[var(--public-bg)]/30 px-4 py-3 text-xs leading-6 text-[var(--public-muted)]">
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
              {block.ctaLabel}
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

  return <CtaBlock key={index} block={block} page={page} />;
}

export function PublicPageRenderer({ page }: { page: PublicPageContent }) {
  const visibleBlocks = page.blocks.filter((block) => !(block.type === "text" && isAiBlock(block)));

  return (
    <div>
      {visibleBlocks.map((block, index) => renderBlock(block, page, index))}
    </div>
  );
}
