"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  FolderTree,
  GitBranch,
  Info,
  Layers3,
  Palette,
  X,
} from "lucide-react";

import { saveCategory } from "./actions";

type CategoryStatus = "draft" | "active" | "archived";

type CategoryListItem = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  status: CategoryStatus;
  sortOrder: number;
};

type AddCategoryDrawerProps = {
  initialData?: CategoryListItem | null;
  disabled?: boolean;
};

const categoryIdeas = [
  "Electrical",
  "Water",
  "Furniture",
  "Kitchen",
  "Bathroom",
  "Windows",
  "Seating",
  "Sleeping",
];

function toFormValues(initialData?: CategoryListItem | null) {
  return {
    id: initialData?.id ?? "",
    name: initialData?.name ?? "",
    slug: initialData?.slug ?? "",
    icon: initialData?.icon ?? "",
    status: (initialData?.status ?? "draft") as CategoryStatus,
    sortOrder: String(initialData?.sortOrder ?? 0),
  };
}

function FieldShell({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-2">
      <div>
        <span className="text-sm font-medium text-neutral-200">{label}</span>
        {hint ? (
          <p className="mt-1 text-xs leading-5 text-neutral-500">{hint}</p>
        ) : null}
      </div>
      {children}
    </label>
  );
}

const inputClassName =
  "w-full rounded-2xl border border-white/10 bg-neutral-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-white/20 focus:bg-neutral-900";

export default function AddCategoryDrawer({
  initialData,
  disabled = false,
}: AddCategoryDrawerProps) {
  const isEdit = Boolean(initialData);
  const defaults = useMemo(() => toFormValues(initialData), [initialData]);
  const [loading, setLoading] = useState(false);

  if (disabled) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
        <button
          type="button"
          disabled
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-neutral-500"
        >
          Database yapılandırılmadan kayıt açılamaz
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03]">
      <div className="grid min-h-[680px] xl:grid-cols-[0.9fr_1.15fr]">
        <div className="border-b border-white/10 bg-black xl:border-b-0 xl:border-r">
          <div className="h-full px-8 py-10 xl:px-10">
            <div className="inline-flex items-center gap-3 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-cyan-300">
              <FolderTree className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-[0.22em]">
                Categories Core
              </span>
            </div>

            <h2 className="mt-8 text-4xl font-semibold tracking-tight text-white">
              {isEdit ? "Kategori Düzenleme" : "Yeni Kategori"}
            </h2>

            <p className="mt-4 max-w-md text-sm leading-7 text-neutral-400">
              Kategori katmanı, products ve packages modüllerinin omurgasıdır.
              Bu yüzden isim, sıra ve durum standardı burada kritik.
            </p>

            <div className="mt-8 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="flex items-center gap-2">
                  <Layers3 className="h-4 w-4 text-cyan-300" />
                  <p className="text-sm font-semibold text-white">
                    Önerilen kategori aileleri
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {categoryIdeas.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-neutral-300"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="flex items-start gap-3">
                  <GitBranch className="mt-0.5 h-4 w-4 text-neutral-400" />
                  <div>
                    <p className="text-sm font-semibold text-white">
                      Parent-ready mimari
                    </p>
                    <p className="mt-2 text-sm leading-6 text-neutral-400">
                      Hiyerarşik kategori mantığı bir sonraki schema batch’te
                      kalıcı alana taşınacak. Bu batch’te önce omurgayı bozmadan
                      stabilize ediyoruz.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="flex items-start gap-3">
                  <Info className="mt-0.5 h-4 w-4 text-neutral-400" />
                  <div>
                    <p className="text-sm font-semibold text-white">
                      Soft delete yaklaşımı
                    </p>
                    <p className="mt-2 text-sm leading-6 text-neutral-400">
                      Bağlı veri varsa sistem hard delete yerine kaydı arşive
                      çekerek admin akışını kırmaz.
                    </p>
                  </div>
                </div>
              </div>

              {isEdit ? (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
                    Düzenlenen kayıt
                  </p>
                  <p className="mt-3 text-lg font-semibold text-white">
                    {defaults.name}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="bg-neutral-950">
          <div className="px-8 py-8 xl:px-10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">
                  {isEdit ? "Edit Mode" : "Create Mode"}
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-white">
                  {isEdit ? "Kategori Bilgisini Güncelle" : "Yeni Kategori Ekle"}
                </h3>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-400">
                  Kategori yapısını temiz ve uzun ömürlü kuruyoruz. Parent-child
                  veri alanını bilerek bir sonraki migration batch’ine bırakıyoruz.
                </p>
              </div>

              <Link
                href="/admin/categories"
                className="rounded-2xl border border-white/10 bg-white/5 p-2 text-neutral-300 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Link>
            </div>

            <form
              action={saveCategory}
              onSubmit={() => setLoading(true)}
              className="mt-8 space-y-8"
            >
              {isEdit ? (
                <input type="hidden" name="id" defaultValue={defaults.id} />
              ) : null}

              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <FolderTree className="h-4 w-4 text-neutral-400" />
                  <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-300">
                    Temel Kimlik
                  </h4>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FieldShell
                    label="Kategori Adı"
                    hint="Admin ve seçim ekranlarında görünen başlık"
                  >
                    <input
                      name="name"
                      defaultValue={defaults.name}
                      placeholder="Electrical"
                      required
                      className={inputClassName}
                    />
                  </FieldShell>

                  <FieldShell
                    label="Slug"
                    hint="Boş bırakırsan ad üzerinden türetilir"
                  >
                    <input
                      name="slug"
                      defaultValue={defaults.slug}
                      placeholder="electrical"
                      className={inputClassName}
                    />
                  </FieldShell>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-neutral-400" />
                  <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-300">
                    Görsel ve Sıralama
                  </h4>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FieldShell
                    label="Icon Etiketi"
                    hint="Örnek: bolt, droplet, bed"
                  >
                    <input
                      name="icon"
                      defaultValue={defaults.icon}
                      placeholder="bolt"
                      className={inputClassName}
                    />
                  </FieldShell>

                  <FieldShell
                    label="Sıra Numarası"
                    hint="Configurator ve admin sıralaması için"
                  >
                    <input
                      name="sortOrder"
                      type="number"
                      min="0"
                      defaultValue={defaults.sortOrder}
                      className={inputClassName}
                    />
                  </FieldShell>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <Layers3 className="h-4 w-4 text-neutral-400" />
                  <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-300">
                    Durum
                  </h4>
                </div>

                <FieldShell
                  label="Kayıt Durumu"
                  hint="Aktif, taslak veya arşiv"
                >
                  <div className="relative max-w-sm">
                    <select
                      name="status"
                      defaultValue={defaults.status}
                      className={`${inputClassName} skyvan-select`}
                    >
                      <option value="active">Aktif</option>
                      <option value="draft">Taslak</option>
                      <option value="archived">Arşiv</option>
                    </select>

                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  </div>
                </FieldShell>
              </section>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-2xl border border-white/10 bg-white px-5 py-3 text-sm font-semibold text-neutral-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? "Kaydediliyor..."
                    : isEdit
                      ? "Kategoriyi Güncelle"
                      : "Kategoriyi Kaydet"}
                </button>

                <Link
                  href="/admin/categories"
                  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  İptal
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}