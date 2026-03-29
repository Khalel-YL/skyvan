import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Lightbulb,
  ShieldAlert,
} from "lucide-react";

import type {
  RuleSuggestionEvidence,
  RuleSuggestionItem,
  SuggestionConfidence,
  SuggestionTone,
} from "./types";

type RuleSuggestionLabProps = {
  score: number;
  statusLabel: string;
  suggestions: RuleSuggestionItem[];
};

function toneCardClass(tone: SuggestionTone) {
  switch (tone) {
    case "success":
      return "border-emerald-500/20 bg-emerald-500/10";
    case "warning":
      return "border-amber-500/20 bg-amber-500/10";
    case "danger":
      return "border-rose-500/20 bg-rose-500/10";
    case "info":
    default:
      return "border-sky-500/20 bg-sky-500/10";
  }
}

function toneTextClass(tone: SuggestionTone) {
  switch (tone) {
    case "success":
      return "text-emerald-200";
    case "warning":
      return "text-amber-200";
    case "danger":
      return "text-rose-200";
    case "info":
    default:
      return "text-sky-200";
  }
}

function confidenceLabel(confidence: SuggestionConfidence) {
  switch (confidence) {
    case "high":
      return "Yüksek güven";
    case "medium":
      return "Orta güven";
    case "low":
    default:
      return "Düşük güven";
  }
}

function confidenceBadgeClass(confidence: SuggestionConfidence) {
  switch (confidence) {
    case "high":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
    case "medium":
      return "border-amber-500/20 bg-amber-500/10 text-amber-200";
    case "low":
    default:
      return "border-rose-500/20 bg-rose-500/10 text-rose-200";
  }
}

function evidenceChipClass(tone: RuleSuggestionEvidence["tone"]) {
  switch (tone) {
    case "success":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
    case "warning":
      return "border-amber-500/20 bg-amber-500/10 text-amber-200";
    case "danger":
      return "border-rose-500/20 bg-rose-500/10 text-rose-200";
    case "info":
    default:
      return "border-zinc-700 bg-zinc-900/80 text-zinc-300";
  }
}

function ruleTypeLabel(value?: RuleSuggestionItem["recommendedRuleType"]) {
  switch (value) {
    case "requires":
      return "Zorunlu";
    case "excludes":
      return "Engeller";
    case "recommends":
      return "Önerir";
    default:
      return null;
  }
}

function severityLabel(value?: RuleSuggestionItem["recommendedSeverity"]) {
  switch (value) {
    case "hard_block":
      return "Sert blok";
    case "soft_warning":
      return "Yumuşak uyarı";
    default:
      return null;
  }
}

export default function RuleSuggestionLab({
  score,
  statusLabel,
  suggestions,
}: RuleSuggestionLabProps) {
  const healthy = score >= 80;

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
      <div className="flex items-start gap-3">
        <div
          className={`rounded-2xl p-2 ${
            healthy
              ? "bg-emerald-500/10 text-emerald-300"
              : "bg-sky-500/10 text-sky-300"
          }`}
        >
          <Bot className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
            Suggestion Lab
          </p>
          <h2 className="mt-2 text-lg font-semibold text-zinc-100">
            Güven skoru ve öneri laboratuvarı
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Kural omurgası, belge kalitesi ve referans sağlığı üzerinden
            kontrollü öneriler üretir. Otomatik kayıt yapmaz; yalnızca görünür
            öneri katmanı sağlar.
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-zinc-100">Genel güven skoru</p>
            <p className="mt-1 text-xs text-zinc-400">
              Kanıt kalitesi, queue, referans sağlığı ve kural kapsamı birlikte
              değerlendirilir.
            </p>
          </div>

          <div className="text-right">
            <p className="text-2xl font-semibold text-zinc-100">{score}/100</p>
            <p className="text-xs text-zinc-400">{statusLabel}</p>
          </div>
        </div>
      </div>

      {suggestions.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-200">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4" />
            <div>
              <p className="text-sm font-semibold">
                Şu an ek öneri gerektiren kritik sinyal görünmüyor
              </p>
              <p className="mt-1 text-xs leading-5 opacity-90">
                Bu iyi bir seviye. Yeni ürünler ve yeni datasheet kayıtları
                geldikçe öneri laboratuvarı yeniden sinyal üretecek.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-5 grid gap-3 xl:grid-cols-2">
          {suggestions.map((suggestion) => {
            const recommendedRuleTypeLabel = ruleTypeLabel(
              suggestion.recommendedRuleType,
            );
            const recommendedSeverityLabel = severityLabel(
              suggestion.recommendedSeverity,
            );

            return (
              <article
                key={suggestion.id}
                className={`rounded-2xl border p-4 ${toneCardClass(
                  suggestion.tone,
                )}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3
                        className={`text-sm font-semibold ${toneTextClass(
                          suggestion.tone,
                        )}`}
                      >
                        {suggestion.title}
                      </h3>

                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${confidenceBadgeClass(
                          suggestion.confidence,
                        )}`}
                      >
                        {confidenceLabel(suggestion.confidence)}
                      </span>
                    </div>

                    <p
                      className={`mt-2 text-xs leading-5 ${toneTextClass(
                        suggestion.tone,
                      )} opacity-90`}
                    >
                      {suggestion.description}
                    </p>
                  </div>

                  <div className="rounded-xl bg-black/20 p-2">
                    <Lightbulb className={`h-4 w-4 ${toneTextClass(suggestion.tone)}`} />
                  </div>
                </div>

                {(recommendedRuleTypeLabel || recommendedSeverityLabel) ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {recommendedRuleTypeLabel ? (
                      <span className="inline-flex rounded-full border border-zinc-700 bg-black/20 px-2.5 py-1 text-[11px] text-zinc-200">
                        Tip: {recommendedRuleTypeLabel}
                      </span>
                    ) : null}

                    {recommendedSeverityLabel ? (
                      <span className="inline-flex rounded-full border border-zinc-700 bg-black/20 px-2.5 py-1 text-[11px] text-zinc-200">
                        Şiddet: {recommendedSeverityLabel}
                      </span>
                    ) : null}
                  </div>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-2">
                  {suggestion.evidence.map((item) => (
                    <span
                      key={`${suggestion.id}-${item.label}`}
                      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] ${evidenceChipClass(
                        item.tone,
                      )}`}
                    >
                      {item.label}: {item.value}
                    </span>
                  ))}
                </div>

                <div className="mt-4 rounded-2xl border border-zinc-800 bg-black/20 p-3">
                  <div className="flex items-start gap-2">
                    <ShieldAlert className="mt-0.5 h-4 w-4 text-zinc-300" />
                    <div className="space-y-1">
                      {suggestion.notes.map((note, index) => (
                        <p key={`${suggestion.id}-note-${index}`} className="text-xs leading-5 text-zinc-300">
                          {note}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <Link
                    href={suggestion.actionHref}
                    className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-950/80 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:border-zinc-600"
                  >
                    {suggestion.actionLabel}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}