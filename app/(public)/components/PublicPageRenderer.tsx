import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Cpu,
  Factory,
  LockKeyhole,
  Mountain,
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
    <section className={`px-5 py-14 md:px-8 md:py-20 ${className}`}>
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
  return (
    <section className="relative overflow-hidden px-5 pb-16 pt-16 md:px-8 md:pb-24 md:pt-24">
      <div className="absolute inset-x-0 top-0 h-px bg-[var(--public-border)]" />
      <div className="absolute left-1/2 top-0 h-[34rem] w-[54rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.26),transparent_62%)] opacity-60" />
      <div className="mx-auto grid w-full max-w-7xl gap-12 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
        <div className="relative">
          <p className="inline-flex rounded-full border border-[var(--public-border)] bg-[var(--public-surface)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--public-muted)]">
            {page.slug === ""
              ? "Freedom, Engineered."
              : page.locale === "tr"
                ? "Premium karavan üretim sistemi"
                : "Premium caravan production system"}
          </p>
          <h1 className="mt-7 max-w-5xl text-5xl font-semibold leading-[0.96] tracking-tight text-[var(--public-text)] md:text-7xl">
            {block.heading}
          </h1>
          {block.subtext ? (
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--public-muted)] md:text-xl">
              {block.subtext}
            </p>
          ) : null}
          {block.body ? (
            <p className="mt-5 max-w-2xl text-sm leading-7 text-[var(--public-muted)] md:text-base">
              {block.body}
            </p>
          ) : null}
          {block.ctaLabel ? (
            <Link
              href={safeHref(block.ctaHref, page.locale)}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-[var(--public-accent)] px-6 py-3 text-sm font-semibold text-[var(--public-accent-text)] transition hover:opacity-90"
            >
              {block.ctaLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : null}
          <div className="mt-8 grid max-w-2xl grid-cols-3 gap-2 text-xs text-[var(--public-muted)]">
            {(page.locale === "tr"
              ? ["Rota", "Yaşam", "Üretim"]
              : ["Route", "Living", "Production"]
            ).map((item) => (
              <span
                key={item}
                className="rounded-full border border-[var(--public-border)] bg-[var(--public-surface)] px-3 py-2 text-center"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="relative min-h-[30rem] overflow-hidden rounded-[2.2rem] border border-[var(--public-border)] bg-[var(--public-surface)] p-5 shadow-2xl shadow-black/10 backdrop-blur">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_32%_12%,rgba(255,255,255,0.28),transparent_17rem),linear-gradient(145deg,rgba(255,255,255,0.08),transparent_42%)]" />
          <div className="absolute inset-x-12 bottom-16 h-20 rounded-[100%] bg-black/20 blur-3xl" />
          <div className="relative flex h-full min-h-[27rem] flex-col justify-between rounded-[1.6rem] border border-[var(--public-border)] bg-[var(--public-surface-strong)] p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--public-muted)]">
                {page.locale === "tr" ? "Yolculuk mimarisi" : "Journey architecture"}
              </p>
              <div className="mt-8 overflow-hidden rounded-[1.3rem] border border-[var(--public-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.02))] p-4">
                <div className="relative h-44 rounded-[1rem] border border-[var(--public-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.04))]">
                  <div className="absolute left-[12%] top-[22%] h-20 w-56 rounded-[2rem] border border-[var(--public-border-strong)] bg-[var(--public-surface-strong)] shadow-xl" />
                  <div className="absolute left-[20%] top-[30%] h-8 w-20 rounded-xl border border-[var(--public-border)] bg-[var(--public-surface)]" />
                  <div className="absolute left-[47%] top-[30%] h-8 w-16 rounded-xl border border-[var(--public-border)] bg-[var(--public-surface)]" />
                  <div className="absolute bottom-[24%] left-[18%] h-8 w-8 rounded-full border border-[var(--public-border-strong)] bg-[var(--public-bg)]" />
                  <div className="absolute bottom-[24%] left-[62%] h-8 w-8 rounded-full border border-[var(--public-border-strong)] bg-[var(--public-bg)]" />
                  <div className="absolute bottom-6 left-6 right-6 h-px bg-[var(--public-border)]" />
                  <Mountain className="absolute right-8 top-7 h-16 w-16 text-[var(--public-muted)] opacity-50" />
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
                      className="rounded-2xl border border-[var(--public-border)] bg-[var(--public-surface)] p-3"
                    >
                      <Icon className="h-4 w-4 text-[var(--public-text)]" />
                      <p className="mt-2 text-xs font-medium text-[var(--public-muted)]">{item.label}</p>
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
  page,
}: {
  block: Extract<PublicBlock, { type: "text" }>;
  page: PublicPageContent;
}) {
  if (isAiBlock(block)) {
    return (
      <SectionShell className="bg-[var(--public-bg-soft)]">
        <div className="grid gap-8 rounded-[2rem] border border-[var(--public-border)] bg-[var(--public-surface)] p-6 md:grid-cols-[0.42fr_0.58fr] md:p-10">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--public-accent)] text-[var(--public-accent-text)]">
              <Cpu className="h-5 w-5" />
            </div>
            <h2 className="mt-6 text-2xl font-semibold tracking-tight text-[var(--public-text)] md:text-4xl">
              {block.heading}
            </h2>
          </div>
          <div>
            <p className="whitespace-pre-line text-base leading-8 text-[var(--public-muted)]">
              {block.body ?? block.content}
            </p>
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              {(page.locale === "tr"
                ? ["Açıklar", "Uyarır", "Yönlendirir", "Hazırlar"]
                : ["Explains", "Warns", "Guides", "Prepares"]
              ).map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-[var(--public-border)] bg-[var(--public-surface-strong)] px-4 py-2 text-sm text-[var(--public-muted)]"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </SectionShell>
    );
  }

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

          <div className="rounded-[2rem] border border-[var(--public-border)] bg-[var(--public-surface)] p-4 shadow-2xl shadow-black/5 md:p-6">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {block.items.map((item, index) => (
                <div
                  key={item}
                  className="rounded-[1.35rem] border border-[var(--public-border)] bg-[var(--public-surface-strong)] p-4 sm:min-h-44 sm:p-5"
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
      <div className="rounded-[2rem] border border-[var(--public-border-strong)] bg-[var(--public-accent)] p-8 text-[var(--public-accent-text)] md:p-12">
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
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--public-accent-text)] px-6 py-3 text-sm font-semibold text-[var(--public-accent)] transition hover:opacity-90"
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
  return (
    <div>
      {page.blocks.map((block, index) => renderBlock(block, page, index))}
    </div>
  );
}
