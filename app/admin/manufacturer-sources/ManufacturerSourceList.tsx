"use client";

import { useState } from "react";

import {
  archiveManufacturerSourceRegistryEntry,
  restoreManufacturerSourceRegistryEntry,
  updateManufacturerSourceRegistrySettings,
} from "./actions";
import { ManufacturerSourceDryRunPreview } from "./ManufacturerSourceDryRunPreview";
import { ManufacturerSourceFetchPreview } from "./ManufacturerSourceFetchPreview";
import { ManufacturerSourceParsePreview } from "./ManufacturerSourceParsePreview";
import {
  manufacturerSourceContentTypeLabels,
  manufacturerSourceFetchModeLabels,
  manufacturerSourceFetchModeOptions,
  type ManufacturerSourceRegistryListItem,
} from "./types";

type ManufacturerSourceListProps = {
  items: ManufacturerSourceRegistryListItem[];
  canMutate: boolean;
};

type RegistryTabKey = "policy" | "dry_run" | "fetch_preview" | "parse_preview";

function PolicyBadge({
  label,
  active,
}: {
  label: string;
  active: boolean;
}) {
  return (
    <div
      className={[
        "inline-flex rounded-2xl border px-3 py-1 text-xs",
        active
          ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
          : "border-white/10 bg-white/[0.03] text-white/60",
      ].join(" ")}
    >
      {label}: {active ? "Açık" : "Kapalı"}
    </div>
  );
}

function RegistryTabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex h-9 items-center rounded-2xl border px-4 text-sm transition",
        active
          ? "border-white/20 bg-white text-black"
          : "border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.06] hover:text-white",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function RegistryCard({
  item,
  canMutate,
}: {
  item: ManufacturerSourceRegistryListItem;
  canMutate: boolean;
}) {
  const [activeTab, setActiveTab] = useState<RegistryTabKey>("policy");
  const isArchived = item.status === "archived";

  return (
    <div
      className={[
        "rounded-[24px] border p-4",
        isArchived
          ? "border-white/5 bg-black/10 opacity-85"
          : "border-white/10 bg-black/20",
      ].join(" ")}
    >
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-white">{item.manufacturerName}</h3>

            <span
              className={[
                "inline-flex rounded-2xl border px-2.5 py-1 text-[11px] font-medium",
                item.status === "active"
                  ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                  : "border-white/10 bg-white/10 text-white/65",
              ].join(" ")}
            >
              {item.status === "active" ? "Aktif" : "Arşiv"}
            </span>
          </div>

          <div className="mt-2 text-sm text-white/85">{item.domain}</div>
          <div className="mt-1 text-xs text-white/40">
            Normalize: {item.normalizedDomain}
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 xl:min-w-[360px]">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <div className="text-[11px] uppercase tracking-wide text-white/35">
              Oluşturma
            </div>
            <div className="mt-1 text-sm text-white/80">{item.createdAtLabel}</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <div className="text-[11px] uppercase tracking-wide text-white/35">
              Güncelleme
            </div>
            <div className="mt-1 text-sm text-white/80">{item.updatedAtLabel}</div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {item.allowedContentTypes.map((contentType) => (
          <span
            key={contentType}
            className="inline-flex rounded-2xl border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/85"
          >
            {manufacturerSourceContentTypeLabels[contentType]}
          </span>
        ))}
      </div>

      {item.notes ? (
        <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-sm text-white/75">
          {item.notes}
        </div>
      ) : null}

      <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
        <div className="mb-2 text-xs font-medium uppercase tracking-wide text-white/40">
          Kayıt özeti
        </div>

        <div className="flex flex-wrap gap-2">
          <PolicyBadge label="İçe alma" active={item.ingestionEnabled} />
          <PolicyBadge label="Subdomain" active={item.allowSubdomains} />
          <PolicyBadge label="Robots.txt" active={item.respectRobotsTxt} />
          <div className="inline-flex rounded-2xl border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs text-sky-200">
            Erişim modu: {manufacturerSourceFetchModeLabels[item.defaultFetchMode]}
          </div>
        </div>

        <div className="mt-3 grid gap-3 xl:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
            <div className="text-xs text-white/40">İzin verilen path'ler</div>
            <div className="mt-2 space-y-1">
              {item.pathAllowlist.length === 0 ? (
                <div className="text-xs text-white/45">Boş</div>
              ) : (
                item.pathAllowlist.map((path) => (
                  <div key={path} className="text-xs text-white/80">
                    {path}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
            <div className="text-xs text-white/40">Engellenen path'ler</div>
            <div className="mt-2 space-y-1">
              {item.pathBlocklist.length === 0 ? (
                <div className="text-xs text-white/45">Boş</div>
              ) : (
                item.pathBlocklist.map((path) => (
                  <div key={path} className="text-xs text-white/80">
                    {path}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
        <div className="flex flex-wrap gap-2">
          <RegistryTabButton
            active={activeTab === "policy"}
            onClick={() => setActiveTab("policy")}
            label="Ayarları Düzenle"
          />
          <RegistryTabButton
            active={activeTab === "dry_run"}
            onClick={() => setActiveTab("dry_run")}
            label="Dry-Run"
          />
          <RegistryTabButton
            active={activeTab === "fetch_preview"}
            onClick={() => setActiveTab("fetch_preview")}
            label="Fetch Önizleme"
          />
          <RegistryTabButton
            active={activeTab === "parse_preview"}
            onClick={() => setActiveTab("parse_preview")}
            label="Parse Önizleme"
          />
        </div>

        <div className="mt-4">
          {activeTab === "policy" ? (
            <form action={updateManufacturerSourceRegistrySettings} className="space-y-4">
              <input type="hidden" name="id" value={item.id} />

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/85">
                  <input
                    type="checkbox"
                    name="ingestionEnabled"
                    defaultChecked={item.ingestionEnabled}
                    disabled={!canMutate}
                    className="h-4 w-4 rounded border-white/20 bg-transparent"
                  />
                  <span>İçe alma aktif</span>
                </label>

                <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/85">
                  <input
                    type="checkbox"
                    name="allowSubdomains"
                    defaultChecked={item.allowSubdomains}
                    disabled={!canMutate}
                    className="h-4 w-4 rounded border-white/20 bg-transparent"
                  />
                  <span>Subdomain izinli</span>
                </label>

                <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/85 sm:col-span-2">
                  <input
                    type="checkbox"
                    name="respectRobotsTxt"
                    defaultChecked={item.respectRobotsTxt}
                    disabled={!canMutate}
                    className="h-4 w-4 rounded border-white/20 bg-transparent"
                  />
                  <span>Robots.txt dikkate al</span>
                </label>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Erişim modu</label>
                <select
                  name="defaultFetchMode"
                  defaultValue={item.defaultFetchMode}
                  disabled={!canMutate}
                  className="h-11 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none"
                >
                  {manufacturerSourceFetchModeOptions.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                      className="bg-zinc-950 text-white"
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">İzin verilen path'ler</label>
                  <textarea
                    name="pathAllowlist"
                    rows={3}
                    defaultValue={item.pathAllowlist.join("\n")}
                    disabled={!canMutate}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">Engellenen path'ler</label>
                  <textarea
                    name="pathBlocklist"
                    rows={3}
                    defaultValue={item.pathBlocklist.join("\n")}
                    disabled={!canMutate}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={!canMutate}
                  className="inline-flex h-10 items-center rounded-2xl border border-white/10 bg-white px-4 text-sm font-medium text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Kaydet
                </button>

                {item.status === "active" ? (
                  <button
                    type="submit"
                    formAction={archiveManufacturerSourceRegistryEntry}
                    disabled={!canMutate}
                    className="inline-flex h-10 items-center rounded-2xl border border-white/10 bg-white/10 px-4 text-sm text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Arşive al
                  </button>
                ) : (
                  <button
                    type="submit"
                    formAction={restoreManufacturerSourceRegistryEntry}
                    disabled={!canMutate}
                    className="inline-flex h-10 items-center rounded-2xl border border-white/10 bg-white px-4 text-sm font-medium text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Geri yükle
                  </button>
                )}
              </div>
            </form>
          ) : null}

          {activeTab === "dry_run" ? (
            <ManufacturerSourceDryRunPreview item={item} canMutate={canMutate} />
          ) : null}

          {activeTab === "fetch_preview" ? (
            <ManufacturerSourceFetchPreview item={item} canMutate={canMutate} />
          ) : null}

          {activeTab === "parse_preview" ? (
            <ManufacturerSourceParsePreview item={item} canMutate={canMutate} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function ManufacturerSourceList({
  items,
  canMutate,
}: ManufacturerSourceListProps) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-white">Kayıtlar</h2>
          <p className="mt-1 text-sm leading-6 text-white/60">
            Kayıtlar, ayarlar ve önizleme araçları bu alanda yönetilir.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/65">
          {items.length} kayıt
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-white/10 bg-black/20 p-6 text-sm text-white/55">
          Filtreye uyan kayıt bulunamadı.
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <RegistryCard key={item.id} item={item} canMutate={canMutate} />
          ))}
        </div>
      )}
    </div>
  );
}