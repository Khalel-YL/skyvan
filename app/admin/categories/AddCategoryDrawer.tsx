"use client";

import { useActionState, useMemo, useState } from "react";
import { saveCategory } from "./actions";
import {
  initialCategoryFormState,
  type CategoryFormState,
  type CategoryListItem,
  type CategoryStatus,
} from "./types";

type AddCategoryDrawerProps = {
  initialData?: CategoryListItem | null;
  disabled?: boolean;
};

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

function Field({
  label,
  hint,
  children,
  error,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <div>
        <label className="text-sm font-medium text-zinc-200">{label}</label>
        {hint ? <p className="mt-1 text-xs text-zinc-500">{hint}</p> : null}
      </div>
      {children}
      {error ? <p className="text-xs text-rose-400">{error}</p> : null}
    </div>
  );
}

const inputClassName =
  "w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-zinc-700";

function CategoryDrawerForm({
  defaults,
  isEdit,
  onCancel,
}: {
  defaults: ReturnType<typeof toFormValues>;
  isEdit: boolean;
  onCancel: () => void;
}) {
  const [state, formAction, isPending] = useActionState<
    CategoryFormState,
    FormData
  >(saveCategory, initialCategoryFormState);
  const [status, setStatus] = useState<CategoryStatus>(defaults.status);

  return (
    <form action={formAction} className="space-y-6 p-6">
      {isEdit ? <input type="hidden" name="id" value={defaults.id} /> : null}

      {state.message ? (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {state.message}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Kategori adı"
          hint="Admin, workshop ve kural akışlarında görünen sektör adı."
          error={state.fieldErrors.name}
        >
          <input
            name="name"
            defaultValue={defaults.name}
            className={inputClassName}
            placeholder="Mutfak Donanımı"
            aria-invalid={Boolean(state.fieldErrors.name)}
            disabled={isPending}
          />
        </Field>

        <Field
          label="Slug"
          hint="Boş bırakırsan isimden otomatik türetilir."
          error={state.fieldErrors.slug}
        >
          <input
            name="slug"
            defaultValue={defaults.slug}
            className={inputClassName}
            placeholder="mutfak-donanimi"
            aria-invalid={Boolean(state.fieldErrors.slug)}
            disabled={isPending}
          />
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="İkon etiketi"
          hint="Örnek: bolt, droplet, chef-hat, bed"
          error={state.fieldErrors.icon}
        >
          <input
            name="icon"
            defaultValue={defaults.icon}
            className={inputClassName}
            placeholder="chef-hat"
            aria-invalid={Boolean(state.fieldErrors.icon)}
            disabled={isPending}
          />
        </Field>

        <Field
          label="Sıra"
          hint="Listeleme ve admin sıralaması için."
          error={state.fieldErrors.sortOrder}
        >
          <input
            name="sortOrder"
            type="number"
            min={0}
            step={1}
            defaultValue={defaults.sortOrder}
            className={inputClassName}
            placeholder="0"
            aria-invalid={Boolean(state.fieldErrors.sortOrder)}
            disabled={isPending}
          />
        </Field>
      </div>

      <Field
        label="Durum"
        hint="Kategori yaşam döngüsünü kontrollü şekilde yönet."
        error={state.fieldErrors.status}
      >
        <input type="hidden" name="status" value={status} />

        <div className="inline-flex rounded-full border border-zinc-800 bg-zinc-900 p-1">
          <button
            type="button"
            onClick={() => setStatus("draft")}
            disabled={isPending}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              status === "draft"
                ? "border-zinc-600 bg-zinc-100 text-zinc-900"
                : "bg-transparent text-zinc-300 hover:text-zinc-100"
            }`}
          >
            Taslak
          </button>

          <button
            type="button"
            onClick={() => setStatus("active")}
            disabled={isPending}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              status === "active"
                ? "border-zinc-600 bg-zinc-100 text-zinc-900"
                : "bg-transparent text-zinc-300 hover:text-zinc-100"
            }`}
          >
            Aktif
          </button>

          <button
            type="button"
            onClick={() => setStatus("archived")}
            disabled={isPending}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              status === "archived"
                ? "border-zinc-600 bg-zinc-100 text-zinc-900"
                : "bg-transparent text-zinc-300 hover:text-zinc-100"
            }`}
          >
            Arşiv
          </button>
        </div>
      </Field>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm text-zinc-400">
        Üst kategori ve alt kategori yapısını bu fazda bilerek genişletmiyoruz.
        Önce ürün, workshop ve kural motoru için tek seviyeli omurgayı net tutuyoruz.
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-zinc-800 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="rounded-full border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Vazgeç
        </button>

        <button
          type="submit"
          disabled={isPending}
          className="rounded-full border border-zinc-200 bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending
            ? "Kaydediliyor..."
            : isEdit
              ? "Kategoriyi Güncelle"
              : "Kategoriyi Kaydet"}
        </button>
      </div>
    </form>
  );
}

export default function AddCategoryDrawer({
  initialData,
  disabled = false,
}: AddCategoryDrawerProps) {
  const isEdit = Boolean(initialData);
  const defaults = useMemo(() => toFormValues(initialData), [initialData]);
  const [isOpen, setIsOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  if (disabled) {
    return (
      <button
        type="button"
        disabled
        className="rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-500"
      >
        Veritabanı hazır değil
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setFormKey((current) => current + 1);
          setIsOpen(true);
        }}
        className="rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-100"
      >
        {isEdit ? "Düzenle" : "Kategori Ekle"}
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 bg-black/70 p-4">
          <div className="ml-auto h-full w-full max-w-xl overflow-y-auto rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-zinc-800 bg-zinc-950/95 px-6 py-5 backdrop-blur">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                  Kategoriler
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-zinc-100">
                  {isEdit ? "Kategori Düzenle" : "Yeni Kategori"}
                </h2>
                <p className="mt-1 text-sm text-zinc-400">
                  {isEdit
                    ? "Kategori bilgisini sade ve kontrollü şekilde güncelle."
                    : "Ürün omurgasına yeni bir kategori ekle."}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-100"
              >
                Kapat
              </button>
            </div>

            <CategoryDrawerForm
              key={`${defaults.id || "new"}-${formKey}`}
              defaults={defaults}
              isEdit={isEdit}
              onCancel={() => setIsOpen(false)}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
