"use client";

import { useActionState } from "react";

import { evaluateManufacturerSourceDryRun } from "./actions";
import {
  initialManufacturerSourceDryRunState,
  manufacturerSourceDryRunDecisionLabels,
  manufacturerSourceFetchModeLabels,
  type ManufacturerSourceRegistryListItem,
} from "./types";

type ManufacturerSourceDryRunPreviewProps = {
  item: ManufacturerSourceRegistryListItem;
  canMutate: boolean;
};

export function ManufacturerSourceDryRunPreview({
  item,
  canMutate,
}: ManufacturerSourceDryRunPreviewProps) {
  const [state, formAction, pending] = useActionState(
    evaluateManufacturerSourceDryRun,
    initialManufacturerSourceDryRunState,
  );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-sm font-medium text-white">Dry-run URL kontrolü</div>
        <p className="mt-1 text-xs text-white/50">
          URLnin kurallara uyup uymadığını test eder.
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
            <label className="text-sm font-medium text-white/80">Test URL</label>
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
              {pending ? "Kontrol ediliyor..." : "Çalıştır"}
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
                state.result.decision === "allowed"
                  ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                  : state.result.decision === "blocked"
                    ? "border-rose-400/20 bg-rose-400/10 text-rose-200"
                    : "border-amber-400/20 bg-amber-400/10 text-amber-200",
              ].join(" ")}
            >
              Karar: {manufacturerSourceDryRunDecisionLabels[state.result.decision]}
            </span>

            <span className="inline-flex rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-white/65">
              Host: {state.result.host}
            </span>

            <span className="inline-flex rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-white/65">
              Path: {state.result.pathname}
            </span>
          </div>

          <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <div className="text-xs text-white/40">Normalize URL</div>
            <div className="mt-1 break-all text-sm text-white/80">{state.result.normalizedUrl}</div>
          </div>

          <div className="mt-3 grid gap-3 xl:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-xs text-white/40">Eşleşen izinli pathler</div>
              <div className="mt-2 space-y-1">
                {state.result.matchedAllowlist.length === 0 ? (
                  <div className="text-xs text-white/45">Yok</div>
                ) : (
                  state.result.matchedAllowlist.map((path) => (
                    <div key={path} className="text-xs text-white/80">
                      {path}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-xs text-white/40">Eşleşen engelli pathler</div>
              <div className="mt-2 space-y-1">
                {state.result.matchedBlocklist.length === 0 ? (
                  <div className="text-xs text-white/45">Yok</div>
                ) : (
                  state.result.matchedBlocklist.map((path) => (
                    <div key={path} className="text-xs text-white/80">
                      {path}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <div className="text-xs text-white/40">Karar nedenleri</div>
            <ul className="mt-2 space-y-1 text-sm text-white/80">
              {state.result.reasons.map((reason, index) => (
                <li key={`${reason}-${index}`}>- {reason}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}
