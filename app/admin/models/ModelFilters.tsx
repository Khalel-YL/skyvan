"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import type { ModelStatus } from "./types";

function segmentedClass(
  current: "all" | ModelStatus,
  value: "all" | ModelStatus
) {
  return current === value
    ? "border-zinc-600 bg-zinc-100 text-zinc-900"
    : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700 hover:text-zinc-100";
}

export function ModelFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialQ = searchParams.get("q") ?? "";
  const initialStatus = searchParams.get("status") ?? "all";

  const [q, setQ] = useState(initialQ);
  const [status, setStatus] = useState<"all" | ModelStatus>(
    initialStatus === "active" ||
      initialStatus === "draft" ||
      initialStatus === "archived"
      ? initialStatus
      : "all"
  );

  const hasActiveFilters = useMemo(() => {
    return Boolean(q.trim() || status !== "all");
  }, [q, status]);

  function buildUrl(next?: {
    q?: string;
    status?: "all" | ModelStatus;
  }) {
    const params = new URLSearchParams();

    const nextQ = next?.q ?? q;
    const nextStatus = next?.status ?? status;

    if (nextQ.trim()) params.set("q", nextQ.trim());
    if (nextStatus !== "all") params.set("status", nextStatus);

    const qs = params.toString();
    return qs ? `/admin/models?${qs}` : "/admin/models";
  }

  function applyFilters() {
    router.push(buildUrl());
  }

  function resetFilters() {
    setQ("");
    setStatus("all");
    router.push("/admin/models");
  }

  function applyStatus(nextStatus: "all" | ModelStatus) {
    setStatus(nextStatus);
    router.push(buildUrl({ status: nextStatus }));
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 md:p-5">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="text-sm font-medium text-zinc-100">Filtreler</div>
            <div className="text-xs text-zinc-500">
              Şasi kayıtlarını kod ve durum bilgisine göre daralt.
            </div>
          </div>

          <div className="inline-flex rounded-full border border-zinc-800 bg-zinc-900 p-1">
            <button
              type="button"
              onClick={() => applyStatus("all")}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${segmentedClass(
                status,
                "all"
              )}`}
            >
              Tümü
            </button>

            <button
              type="button"
              onClick={() => applyStatus("draft")}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${segmentedClass(
                status,
                "draft"
              )}`}
            >
              Taslak
            </button>

            <button
              type="button"
              onClick={() => applyStatus("active")}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${segmentedClass(
                status,
                "active"
              )}`}
            >
              Aktif
            </button>

            <button
              type="button"
              onClick={() => applyStatus("archived")}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${segmentedClass(
                status,
                "archived"
              )}`}
            >
              Arşiv
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-200">
              Model ara
            </label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Şasi kodu veya aile..."
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 transition focus:border-zinc-700"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={applyFilters}
              className="rounded-full bg-zinc-100 px-5 py-2.5 text-sm font-medium text-zinc-900 transition hover:bg-white"
            >
              Uygula
            </button>

            <button
              type="button"
              onClick={resetFilters}
              className="rounded-full border border-zinc-800 bg-zinc-900 px-5 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-zinc-700 hover:text-zinc-100"
            >
              Sıfırla
            </button>

            {hasActiveFilters ? (
              <span className="inline-flex rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-400">
                Filtre aktif
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}