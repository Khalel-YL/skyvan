"use client";

import { useActionState } from "react";

import { parseManufacturerSourcePreview } from "./actions";
import {
  initialManufacturerSourceParsePreviewState,
  manufacturerSourceDryRunDecisionLabels,
  manufacturerSourceFetchModeLabels,
  type ManufacturerSourceRegistryListItem,
} from "./types";

type ManufacturerSourceParsePreviewProps = {
  item: ManufacturerSourceRegistryListItem;
  canMutate: boolean;
};

export function ManufacturerSourceParsePreview({
  item,
  canMutate,
}: ManufacturerSourceParsePreviewProps) {
  const [state, formAction, pending] = useActionState(
    parseManufacturerSourcePreview,
    initialManufacturerSourceParsePreviewState,
  );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-sm font-medium text-white">İçerik parse önizleme</div>
        <p className="mt-1 text-xs text-white/50">
          HTML veya düz metin içerikte temel parse sinyallerini gösterir.
        </p>
      </div>

      <form action={formAction} className="space-y-3">
        <input type="hidden" name="normalizedDomain" value={item.normalizedDomain} />
        <input type="hidden" name="defaultFetchMode" value={item.defaultFetchMode} />
        <input type="hidden" name="pathAllowlist" value={item.pathAllowlist.join("\n")} />
        <input type="hidden" name="pathBlocklist" value={item.pathBlocklist.join("\n")} />
        <input
          type="hidden"
          name="allowSubdomains"
          value={item.allowSubdomains ? "true" : "false"}
        />
        <input
          type="hidden"
          name="ingestionEnabled"
          value={item.ingestionEnabled ? "true" : "false"}
        />

        <div className="grid gap-3 xl:grid-cols-[1fr_auto]">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">Parse URL</label>
            <input
              type="text"
              name="candidateUrl"
              placeholder={`Örnek: https://${item.normalizedDomain}/downloads/manual.pdf`}
              disabled={!canMutate || pending}
              className="h-11 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none placeholder:text-white/35 disabled:cursor-not-allowed disabled:opacity-50"
            />
            {state.fieldErrors.candidateUrl ? (
              <p className="text-xs text-rose-300">{state.fieldErrors.candidateUrl}</p>
            ) : null}
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={!canMutate || pending}
              className="inline-flex h-11 items-center rounded-2xl border border-white/10 bg-white px-4 text-sm font-medium text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? "Ayrıştırılıyor..." : "Parse et"}
            </button>
          </div>
        </div>
      </form>

      <div className="flex flex-wrap gap-2">
        <span className="inline-flex rounded-2xl border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/65">
          Erişim modu: {manufacturerSourceFetchModeLabels[item.defaultFetchMode]}
        </span>
        <span className="inline-flex rounded-2xl border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/65">
          Domain: {item.normalizedDomain}
        </span>
      </div>

      {state.message ? (
        <div
          className={[
            "rounded-2xl border px-4 py-3 text-sm",
            state.ok
              ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
              : "border-rose-400/20 bg-rose-400/10 text-rose-100",
          ].join(" ")}
        >
          {state.message}
        </div>
      ) : null}

      {state.result ? (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={[
                "inline-flex rounded-2xl border px-3 py-1 text-xs font-medium",
                state.result.policyDecision === "allowed"
                  ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                  : state.result.policyDecision === "blocked"
                    ? "border-rose-400/20 bg-rose-400/10 text-rose-200"
                    : "border-amber-400/20 bg-amber-400/10 text-amber-200",
              ].join(" ")}
            >
              Policy kararı: {manufacturerSourceDryRunDecisionLabels[state.result.policyDecision]}
            </span>

            <span className="inline-flex rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-white/65">
              HTTP: {state.result.httpStatus ?? "—"}
            </span>

            <span className="inline-flex rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-white/65">
              Parse: {state.result.parseSupported ? "Destekleniyor" : "Sınırlı"}
            </span>
          </div>

          <div className="mt-3 grid gap-3 xl:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-xs text-white/40">Normalize URL</div>
              <div className="mt-1 break-all text-sm text-white/80">
                {state.result.normalizedUrl}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-xs text-white/40">Final URL</div>
              <div className="mt-1 break-all text-sm text-white/80">
                {state.result.finalUrl}
              </div>
            </div>
          </div>

          <div className="mt-3 grid gap-3 xl:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-xs text-white/40">İçerik tipi</div>
              <div className="mt-1 break-all text-sm text-white/80">
                {state.result.contentType ?? "—"}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-xs text-white/40">Başlık sayısı</div>
              <div className="mt-1 text-sm text-white/80">
                {state.result.headingCount ?? "—"}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-xs text-white/40">Bağlantı sayısı</div>
              <div className="mt-1 text-sm text-white/80">
                {state.result.linkCount ?? "—"}
              </div>
            </div>
          </div>

          <div className="mt-3 grid gap-3 xl:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-xs text-white/40">Paragraf sayısı</div>
              <div className="mt-1 text-sm text-white/80">
                {state.result.paragraphCount ?? "—"}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-xs text-white/40">Metin uzunluğu</div>
              <div className="mt-1 text-sm text-white/80">
                {state.result.textLength ?? "—"}
              </div>
            </div>
          </div>

          {state.result.detectedTitle ? (
            <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-xs text-white/40">Tespit edilen başlık</div>
              <div className="mt-1 text-sm text-white/80">{state.result.detectedTitle}</div>
            </div>
          ) : null}

          {state.result.metaDescription ? (
            <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-xs text-white/40">Meta açıklama</div>
              <div className="mt-1 text-sm leading-6 text-white/80">
                {state.result.metaDescription}
              </div>
            </div>
          ) : null}

          {state.result.textPreview ? (
            <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-xs text-white/40">Metin önizlemesi</div>
              <div className="mt-1 text-sm leading-6 text-white/80">
                {state.result.textPreview}
              </div>
            </div>
          ) : null}

          <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <div className="text-xs text-white/40">Policy nedenleri</div>
            <ul className="mt-2 space-y-1 text-sm text-white/80">
              {state.result.policyReasons.map((reason, index) => (
                <li key={`${reason}-${index}`}>- {reason}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}