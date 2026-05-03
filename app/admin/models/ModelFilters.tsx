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
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-3">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
        <div className="min-w-0 flex-1 space-y-1.5">
          <label className="text-xs font-medium text-zinc-400">Model ara</label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Şasi kodu veya aile..."
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 transition focus:border-zinc-700"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-full border border-zinc-800 bg-zinc-900 p-0.5">
            <button
              type="button"
              onClick={() => applyStatus("all")}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${segmentedClass(
                status,
                "all"
              )}`}
            >
              Tümü
            </button>

            <button
              type="button"
              onClick={() => applyStatus("draft")}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${segmentedClass(
                status,
                "draft"
              )}`}
            >
              Taslak
            </button>

            <button
              type="button"
              onClick={() => applyStatus("active")}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${segmentedClass(
                status,
                "active"
              )}`}
            >
              Aktif
            </button>

            <button
              type="button"
              onClick={() => applyStatus("archived")}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${segmentedClass(
                status,
                "archived"
              )}`}
            >
              Arşiv
            </button>
          </div>

          <button
            type="button"
            onClick={applyFilters}
            className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-900 transition hover:bg-white"
          >
            Uygula
          </button>

          <button
            type="button"
            onClick={resetFilters}
            className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-zinc-700 hover:text-zinc-100"
          >
            Sıfırla
          </button>

          {hasActiveFilters ? (
            <span className="inline-flex rounded-full border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-xs text-zinc-400">
              Aktif
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
