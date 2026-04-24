import Link from "next/link";
import type { ReactNode } from "react";

import {
  archiveProductSourceBinding,
  restoreProductSourceBinding,
} from "./actions";
import { EditProductSourceBindingDrawer } from "./EditProductSourceBindingDrawer";
import type {
  ManufacturerSourceBindingOption,
  ProductSourceBindingListItem,
  ProductSourceBindingStatus,
} from "./types";

type Props = {
  bindings: ProductSourceBindingListItem[];
  sourceOptions: ManufacturerSourceBindingOption[];
};

type BindingQualityMeta = {
  label: string;
  tone: string;
  detail: string;
  priority: number;
  actionLabel: string;
  actionTone: string;
  needsAttention: boolean;
};

function getBindingQualityMeta(pathHint: string): BindingQualityMeta {
  const normalized = pathHint.trim();

  if (!normalized) {
    return {
      label: "Geniş",
      tone: "border-amber-900/60 bg-amber-950/30 text-amber-300",
      detail: "Path hint tanımlı değil. Kaynak kapsamı geniş ve AI için daha zayıf.",
      priority: 0,
      actionLabel: "Önce düzenle: path hint ekle",
      actionTone: "border-amber-900/60 bg-amber-950/30 text-amber-300",
      needsAttention: true,
    };
  }

  return {
    label: "Hedefli",
    tone: "border-emerald-900/60 bg-emerald-950/30 text-emerald-300",
    detail: "Path hint tanımlı. Kaynak hedefli ve AI için daha güvenli.",
    priority: 1,
    actionLabel: "Hazır: mevcut bağ kullanılabilir",
    actionTone: "border-emerald-900/60 bg-emerald-950/30 text-emerald-300",
    needsAttention: false,
  };
}

function getStatusPriority(status: ProductSourceBindingStatus) {
  if (status === "active") return 0;
  if (status === "draft") return 1;
  return 2;
}

function getCardTone(
  status: ProductSourceBindingStatus,
  quality: BindingQualityMeta,
) {
  if (status === "active" && quality.needsAttention) {
    return "border-amber-900/40 bg-zinc-950/80";
  }

  if (status === "active") {
    return "border-zinc-800 bg-zinc-950/70";
  }

  if (status === "draft") {
    return "border-amber-950/30 bg-zinc-950/60";
  }

  return "border-zinc-900 bg-zinc-950/50";
}

export function ProductSourceBindingsTable({ bindings, sourceOptions }: Props) {
  if (!bindings.length) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-8 text-center">
        <h3 className="text-lg font-semibold text-zinc-100">
          Kaynak bağı bulunamadı
        </h3>
        <p className="mt-2 text-sm text-zinc-500">
          Filtreleri temizleyin ya da yeni bir binding ekleyin.
        </p>
      </div>
    );
  }

  const sortedBindings = [...bindings].sort((a, b) => {
    const qualityA = getBindingQualityMeta(a.pathHint);
    const qualityB = getBindingQualityMeta(b.pathHint);

    const statusPriorityDiff =
      getStatusPriority(a.status) - getStatusPriority(b.status);

    if (statusPriorityDiff !== 0) {
      return statusPriorityDiff;
    }

    if (qualityA.priority !== qualityB.priority) {
      return qualityA.priority - qualityB.priority;
    }

    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }

    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return (
    <div className="grid gap-4">
      {sortedBindings.map((binding) => {
        const quality = getBindingQualityMeta(binding.pathHint);
        const showPriorityFix =
          binding.status === "active" && quality.needsAttention;

        return (
          <div
            key={binding.id}
            className={`rounded-2xl border p-4 md:p-5 ${getCardTone(
              binding.status,
              quality,
            )}`}
          >
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-white">
                      {binding.manufacturerName}
                    </h3>
                    <BindingStatusBadge status={binding.status} />
                    <InfoChip>Öncelik {binding.priority}</InfoChip>
                    <InfoChip className={quality.tone}>{quality.label}</InfoChip>

                    {showPriorityFix ? (
                      <InfoChip className="border-amber-900/60 bg-amber-950/30 text-amber-300">
                        Öncelikli Düzeltme
                      </InfoChip>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <InfoChip className="break-all">{binding.domain}</InfoChip>
                    <InfoChip>{binding.defaultFetchMode}</InfoChip>
                    {binding.pathHint ? (
                      <InfoChip className="max-w-full break-all">
                        {binding.pathHint}
                      </InfoChip>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 xl:justify-end">
                  <Link
                    href="/admin/manufacturer-sources"
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-200 transition hover:bg-zinc-800"
                  >
                    Registry
                  </Link>

                  <EditProductSourceBindingDrawer
                    binding={binding}
                    sourceOptions={sourceOptions}
                  />

                  <form>
                    <input type="hidden" name="id" value={binding.id} />
                    <input type="hidden" name="productId" value={binding.productId} />

                    {binding.status === "archived" ? (
                      <button
                        type="submit"
                        formAction={restoreProductSourceBinding}
                        className="inline-flex h-10 items-center justify-center rounded-xl border border-emerald-900/60 bg-emerald-950/40 px-3 text-sm text-emerald-300 transition hover:bg-emerald-950/60"
                      >
                        Geri Al
                      </button>
                    ) : (
                      <button
                        type="submit"
                        formAction={archiveProductSourceBinding}
                        className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-800 bg-white/10 px-3 text-sm text-white transition hover:bg-white/15"
                      >
                        Arşive Al
                      </button>
                    )}
                  </form>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  label="Path Hint"
                  value={binding.pathHint || "Tanımsız"}
                  breakText
                  muted={!binding.pathHint}
                />

                <MetricCard
                  label="Bağ Notu"
                  value={binding.bindingNotes?.trim() || "Not girilmemiş"}
                  breakText
                  muted={!binding.bindingNotes?.trim()}
                />

                <MetricCard
                  label="İçerik Tipleri"
                  value={
                    binding.allowedContentTypes.length
                      ? binding.allowedContentTypes.join(", ")
                      : "Tanımsız"
                  }
                  breakText
                  muted={!binding.allowedContentTypes.length}
                />

                <MetricCard
                  label="Normalized Domain"
                  value={binding.normalizedDomain || "Tanımsız"}
                  breakText
                  muted={!binding.normalizedDomain}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  label="Oluşturma"
                  value={formatDate(binding.createdAt)}
                  subValue={formatTime(binding.createdAt)}
                />

                <MetricCard
                  label="Güncelleme"
                  value={formatDate(binding.updatedAt)}
                  subValue={formatTime(binding.updatedAt)}
                />

                <MetricCard
                  label="Binding Kalitesi"
                  value={quality.label}
                  subValue={quality.detail}
                />

                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">
                    Önerilen Aksiyon
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${quality.actionTone}`}
                    >
                      {quality.actionLabel}
                    </span>

                    {binding.status === "draft" ? (
                      <span className="inline-flex rounded-full border border-amber-900/60 bg-amber-950/30 px-2.5 py-1 text-xs font-medium text-amber-300">
                        Gözden geçir ve aktive et
                      </span>
                    ) : null}

                    {showPriorityFix ? (
                      <span className="inline-flex rounded-full border border-amber-900/60 bg-amber-950/30 px-2.5 py-1 text-xs font-medium text-amber-300">
                        Products skorunu düşürüyor
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
                <p className="text-xs uppercase tracking-wide text-zinc-500">
                  İçerik Rozetleri
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {binding.allowedContentTypes.length ? (
                    binding.allowedContentTypes.map((type) => (
                      <span
                        key={type}
                        className="inline-flex rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300"
                      >
                        {type}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-zinc-500">Rozet yok</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MetricCard({
  label,
  value,
  subValue,
  breakText = false,
  muted = false,
}: {
  label: string;
  value: string;
  subValue?: string | null;
  breakText?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
      <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
      <p
        className={`mt-2 text-sm font-medium ${
          muted ? "text-zinc-500" : "text-zinc-100"
        } ${breakText ? "break-words" : ""}`}
      >
        {value}
      </p>
      {subValue ? <p className="mt-1 text-xs text-zinc-500">{subValue}</p> : null}
    </div>
  );
}

function InfoChip({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300 ${className}`}
    >
      {children}
    </span>
  );
}

function BindingStatusBadge({ status }: { status: ProductSourceBindingStatus }) {
  const styles: Record<ProductSourceBindingStatus, string> = {
    active: "border-emerald-900/60 bg-emerald-950/40 text-emerald-300",
    draft: "border-amber-900/60 bg-amber-950/40 text-amber-300",
    archived: "border-zinc-800 bg-zinc-900 text-zinc-300",
  };

  const labels: Record<ProductSourceBindingStatus, string> = {
    active: "Aktif",
    draft: "Taslak",
    archived: "Arşiv",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function formatDate(value: Date | string) {
  return new Date(value).toLocaleDateString("tr-TR");
}

function formatTime(value: Date | string) {
  return new Date(value).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}