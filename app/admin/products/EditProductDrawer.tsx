"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";

import { updateProduct } from "./actions";
import { productToFormValues } from "./mappers";
import type {
  CategoryOption,
  ProductActionState,
  ProductListItem,
} from "./types";

const initialState: ProductActionState = {
  ok: false,
  message: "",
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:opacity-50"
    >
      {pending ? "Kaydediliyor..." : "Kaydet"}
    </button>
  );
}

export function EditProductDrawer({
  product,
  categories,
}: {
  product: ProductListItem;
  categories: CategoryOption[];
}) {
  const [state, formAction] = useActionState(updateProduct, initialState);
  const form = productToFormValues(product);
  const dialogId = `edit-product-dialog-${product.id}`;

  useEffect(() => {
    if (state.ok) {
      const dialog = document.getElementById(dialogId) as HTMLDialogElement | null;
      dialog?.close();
    }
  }, [state.ok, dialogId]);

  return (
    <>
      <button
        type="button"
        onClick={() =>
          (document.getElementById(dialogId) as HTMLDialogElement | null)?.showModal()
        }
        className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs font-medium text-zinc-100 transition hover:bg-zinc-900"
      >
        Düzenle
      </button>

      <dialog
        id={dialogId}
        className="w-full max-w-4xl rounded-2xl border border-zinc-800 bg-zinc-950 p-0 text-zinc-100 backdrop:bg-black/70"
      >
        <form action={formAction} className="rounded-2xl bg-zinc-950 p-6">
          <input type="hidden" name="id" value={product.id} />

          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Ürünü Düzenle</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Ürün ana kaydını güncelle.
              </p>
            </div>

            <button
              type="button"
              className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-200 transition hover:bg-zinc-800"
              onClick={() =>
                (document.getElementById(dialogId) as HTMLDialogElement | null)?.close()
              }
            >
              Kapat
            </button>
          </div>

          <ProductFormFields
            categories={categories}
            errors={state.errors}
            defaults={form}
          />

          <div className="mt-5 flex items-center justify-between gap-4">
            <p className={`text-sm ${state.ok ? "text-green-400" : "text-red-400"}`}>
              {state.message}
            </p>
            <SubmitButton />
          </div>
        </form>
      </dialog>
    </>
  );
}

function FieldError({
  errors,
  name,
}: {
  errors?: Record<string, string[]>;
  name: string;
}) {
  const fieldErrors = errors?.[name];
  if (!fieldErrors?.length) return null;
  return <p className="mt-1 text-xs text-red-400">{fieldErrors[0]}</p>;
}

function ProductFormFields({
  categories,
  errors,
  defaults,
}: {
  categories: CategoryOption[];
  errors?: Record<string, string[]>;
  defaults: {
    name: string;
    slug: string;
    sku: string;
    categoryId: string;
    shortDescription: string;
    description: string;
    imageUrl: string;
    datasheetUrl: string;
    basePrice: string;
    weightKg: string;
    powerDrawWatts: string;
    powerSupplyWatts: string;
    status: "draft" | "active" | "archived";
  };
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-300">
          Ürün Adı
        </label>
        <input
          name="name"
          defaultValue={defaults.name}
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-700"
        />
        <FieldError errors={errors} name="name" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-300">
          Slug
        </label>
        <input
          name="slug"
          defaultValue={defaults.slug}
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-700"
        />
        <FieldError errors={errors} name="slug" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-300">
          SKU
        </label>
        <input
          name="sku"
          defaultValue={defaults.sku}
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-700"
        />
        <FieldError errors={errors} name="sku" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-300">
          Kategori
        </label>
        <select
          name="categoryId"
          defaultValue={defaults.categoryId}
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-700"
        >
          {categories
            .filter(
              (item) =>
                item.status === "active" ||
                item.id === defaults.categoryId ||
                item.status == null
            )
            .map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
        </select>
        <FieldError errors={errors} name="categoryId" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-300">
          Baz Fiyat
        </label>
        <input
          name="basePrice"
          type="number"
          step="0.01"
          min="0"
          defaultValue={defaults.basePrice}
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-700"
        />
        <FieldError errors={errors} name="basePrice" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-300">
          Ağırlık (kg)
        </label>
        <input
          name="weightKg"
          type="number"
          step="0.001"
          min="0"
          defaultValue={defaults.weightKg}
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-700"
        />
        <FieldError errors={errors} name="weightKg" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-300">
          Güç Tüketimi (W)
        </label>
        <input
          name="powerDrawWatts"
          type="number"
          step="1"
          min="0"
          defaultValue={defaults.powerDrawWatts}
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-700"
        />
        <FieldError errors={errors} name="powerDrawWatts" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-300">
          Besleme Gücü (W)
        </label>
        <input
          name="powerSupplyWatts"
          type="number"
          step="1"
          min="0"
          defaultValue={defaults.powerSupplyWatts}
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-700"
        />
        <FieldError errors={errors} name="powerSupplyWatts" />
      </div>

      <div className="md:col-span-2">
        <label className="mb-1 block text-sm font-medium text-zinc-300">
          Kısa Açıklama
        </label>
        <textarea
          name="shortDescription"
          rows={2}
          defaultValue={defaults.shortDescription}
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-700"
        />
        <FieldError errors={errors} name="shortDescription" />
      </div>

      <div className="md:col-span-2">
        <label className="mb-1 block text-sm font-medium text-zinc-300">
          Açıklama
        </label>
        <textarea
          name="description"
          rows={4}
          defaultValue={defaults.description}
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-700"
        />
        <FieldError errors={errors} name="description" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-300">
          Görsel URL
        </label>
        <input
          name="imageUrl"
          defaultValue={defaults.imageUrl}
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-700"
        />
        <FieldError errors={errors} name="imageUrl" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-300">
          Datasheet URL
        </label>
        <input
          name="datasheetUrl"
          defaultValue={defaults.datasheetUrl}
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-700"
        />
        <FieldError errors={errors} name="datasheetUrl" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-300">
          Durum
        </label>
        <select
          name="status"
          defaultValue={defaults.status}
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-700"
        >
          <option value="draft">Taslak</option>
          <option value="active">Aktif</option>
          <option value="archived">Arşiv</option>
        </select>
        <FieldError errors={errors} name="status" />
      </div>
    </div>
  );
}