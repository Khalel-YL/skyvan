"use client";

import { useActionState } from "react";

import { createManufacturerSourceRegistryEntry } from "./actions";
import {
  initialManufacturerSourceRegistryActionState,
  manufacturerSourceContentTypeLabels,
  manufacturerSourceFetchModeLabels,
  manufacturerSourceFetchModeOptions,
} from "./types";

const orderedContentTypes = [
  "manuals",
  "datasheets",
  "technical_pages",
  "support_pages",
] as const;

type AddManufacturerSourceDrawerProps = {
  canWrite: boolean;
  disabledReason?: string | null;
};

export function AddManufacturerSourceDrawer({
  canWrite,
  disabledReason,
}: AddManufacturerSourceDrawerProps) {
  const [state, formAction, pending] = useActionState(
    createManufacturerSourceRegistryEntry,
    initialManufacturerSourceRegistryActionState,
  );

  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-white">
            Yeni üretici kaynağı ekle
          </h2>
          <p className="mt-1 text-sm leading-6 text-white/60">
            Domain, içerik türleri ve temel policy ayarlarını tek formda tanımla.
          </p>
        </div>

        <div
          className={[
            "rounded-2xl px-3 py-1 text-xs font-medium",
            canWrite
              ? "border border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
              : "border border-amber-400/20 bg-amber-400/10 text-amber-200",
          ].join(" ")}
        >
          {canWrite ? "DB yazımı açık" : "DB yazımı kapalı"}
        </div>
      </div>

      {!canWrite && disabledReason ? (
        <div className="mb-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          {disabledReason}
        </div>
      ) : null}

      <form action={formAction} className="space-y-4">
        <div className="grid gap-4 xl:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">Üretici adı</label>
            <input
              type="text"
              name="manufacturerName"
              placeholder="Örnek: Victron Energy"
              disabled={!canWrite || pending}
              className="h-11 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none placeholder:text-white/35 disabled:cursor-not-allowed disabled:opacity-50"
            />
            {state.fieldErrors.manufacturerName ? (
              <p className="text-xs text-rose-300">{state.fieldErrors.manufacturerName}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">Ana domain</label>
            <input
              type="text"
              name="domain"
              placeholder="Örnek: victronenergy.com"
              disabled={!canWrite || pending}
              className="h-11 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none placeholder:text-white/35 disabled:cursor-not-allowed disabled:opacity-50"
            />
            {state.fieldErrors.domain ? (
              <p className="text-xs text-rose-300">{state.fieldErrors.domain}</p>
            ) : (
              <p className="text-xs text-white/40">
                Sadece ana domain gir. Protokol veya path yazma.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium text-white/80">İzin verilen içerik türleri</div>

          <div className="grid gap-2 sm:grid-cols-2">
            {orderedContentTypes.map((contentType) => (
              <label
                key={contentType}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/85"
              >
                <input
                  type="checkbox"
                  name="allowedContentTypes"
                  value={contentType}
                  disabled={!canWrite || pending}
                  className="h-4 w-4 rounded border-white/20 bg-transparent disabled:cursor-not-allowed"
                />
                <span>{manufacturerSourceContentTypeLabels[contentType]}</span>
              </label>
            ))}
          </div>

          {state.fieldErrors.allowedContentTypes ? (
            <p className="text-xs text-rose-300">{state.fieldErrors.allowedContentTypes}</p>
          ) : null}
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="mb-3 text-sm font-medium text-white/85">
            Ingestion ayarları
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/85">
              <input
                type="checkbox"
                name="ingestionEnabled"
                disabled={!canWrite || pending}
                className="h-4 w-4 rounded border-white/20 bg-transparent"
              />
              <span>Ingestion aktif</span>
            </label>

            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/85">
              <input
                type="checkbox"
                name="allowSubdomains"
                disabled={!canWrite || pending}
                className="h-4 w-4 rounded border-white/20 bg-transparent"
              />
              <span>Subdomain izinli</span>
            </label>

            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/85 sm:col-span-2">
              <input
                type="checkbox"
                name="respectRobotsTxt"
                defaultChecked
                disabled={!canWrite || pending}
                className="h-4 w-4 rounded border-white/20 bg-transparent"
              />
              <span>Robots.txt dikkate al</span>
            </label>
          </div>

          <div className="mt-4 space-y-2">
            <label className="text-sm font-medium text-white/80">Varsayılan fetch modu</label>
            <select
              name="defaultFetchMode"
              defaultValue="manual_review"
              disabled={!canWrite || pending}
              className="h-11 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              {manufacturerSourceFetchModeOptions.map((option) => (
                <option key={option.value} value={option.value} className="bg-zinc-950 text-white">
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Path allowlist</label>
              <textarea
                name="pathAllowlist"
                rows={5}
                placeholder={"/downloads\n/manuals\n/product-support"}
                disabled={!canWrite || pending}
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <p className="text-xs text-white/40">Her satıra bir path gir.</p>
              {state.fieldErrors.pathAllowlist ? (
                <p className="text-xs text-rose-300">{state.fieldErrors.pathAllowlist}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Path blocklist</label>
              <textarea
                name="pathBlocklist"
                rows={5}
                placeholder={"/cart\n/checkout\n/login"}
                disabled={!canWrite || pending}
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <p className="text-xs text-white/40">Hariç tutulacak path'leri satır satır gir.</p>
              {state.fieldErrors.pathBlocklist ? (
                <p className="text-xs text-rose-300">{state.fieldErrors.pathBlocklist}</p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-white/80">Operasyon notu</label>
          <textarea
            name="notes"
            rows={4}
            placeholder="Bu domain için hangi içerikler alınmalı, hangileri dışarıda tutulmalı?"
            disabled={!canWrite || pending}
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 disabled:cursor-not-allowed disabled:opacity-50"
          />
          {state.fieldErrors.notes ? (
            <p className="text-xs text-rose-300">{state.fieldErrors.notes}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={!canWrite || pending}
            className="inline-flex h-11 items-center rounded-2xl border border-white/10 bg-white px-4 text-sm font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? "Kaydediliyor..." : "Registry kaydını oluştur"}
          </button>

          <p className="text-xs text-white/45">
            İlk kayıt varsayılan olarak aktif açılır.
          </p>
        </div>
      </form>

      {state.message ? (
        <div
          className={[
            "mt-4 rounded-2xl border px-4 py-3 text-sm",
            state.ok
              ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
              : "border-rose-400/20 bg-rose-400/10 text-rose-100",
          ].join(" ")}
        >
          {state.message}
        </div>
      ) : null}

      {state.createdItem ? (
        <div className="mt-4 rounded-[24px] border border-white/10 bg-black/20 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-white">Oluşturulan kayıt özeti</h3>
              <p className="mt-1 text-xs text-white/45">Liste otomatik güncellenir.</p>
            </div>

            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
              Kaydedildi
            </div>
          </div>

          <div className="grid gap-3 xl:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-xs text-white/40">Üretici</div>
              <div className="mt-1 text-sm font-medium text-white">
                {state.createdItem.manufacturerName}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-xs text-white/40">Normalize domain</div>
              <div className="mt-1 text-sm font-medium text-white">
                {state.createdItem.normalizedDomain}
              </div>
            </div>
          </div>

          <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <div className="text-xs text-white/40">İçerik türleri</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {state.createdItem.allowedContentTypes.map((contentType) => (
                <span
                  key={contentType}
                  className="inline-flex rounded-2xl border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/85"
                >
                  {manufacturerSourceContentTypeLabels[contentType]}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <div className="text-xs text-white/40">Fetch modu</div>
            <div className="mt-1 text-sm text-white">
              {manufacturerSourceFetchModeLabels[state.createdItem.defaultFetchMode]}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}