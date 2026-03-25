"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import type { CategoryOption } from "./types";

type Props = {
  categories: CategoryOption[];
};

export function ProductFilters({ categories }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialQ = searchParams.get("q") ?? "";
  const initialStatus = searchParams.get("status") ?? "all";
  const initialCategoryId = searchParams.get("categoryId") ?? "all";

  const [q, setQ] = useState(initialQ);
  const [status, setStatus] = useState(initialStatus);
  const [categoryId, setCategoryId] = useState(initialCategoryId);

  const hasActiveFilters = useMemo(() => {
    return Boolean(q || status !== "all" || categoryId !== "all");
  }, [q, status, categoryId]);

  function applyFilters() {
    const params = new URLSearchParams();

    if (q.trim()) params.set("q", q.trim());
    if (status !== "all") params.set("status", status);
    if (categoryId !== "all") params.set("categoryId", categoryId);

    const qs = params.toString();
    router.push(qs ? `/admin/products?${qs}` : "/admin/products");
  }

  function resetFilters() {
    setQ("");
    setStatus("all");
    setCategoryId("all");
    router.push("/admin/products");
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 shadow-sm">
      <div className="grid gap-3 md:grid-cols-4">
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium text-zinc-300">
            Arama
          </label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ürün adı, slug, SKU..."
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-700"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-300">
            Durum
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-700"
          >
            <option value="all">Tümü</option>
            <option value="draft">Taslak</option>
            <option value="active">Aktif</option>
            <option value="archived">Arşiv</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-300">
            Kategori
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-700"
          >
            <option value="all">Tümü</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={applyFilters}
          className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200"
        >
          Uygula
        </button>

        <button
          type="button"
          onClick={resetFilters}
          className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800"
        >
          Sıfırla
        </button>

        {hasActiveFilters ? (
          <span className="text-xs text-zinc-500">Filtre aktif</span>
        ) : null}
      </div>
    </div>
  );
}