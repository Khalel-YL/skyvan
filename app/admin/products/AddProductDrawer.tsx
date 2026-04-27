"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";

import { createProduct } from "./actions";
import {
  categoryTypeOptions,
  generateProductSku,
  generateProductSlug,
  targetLayerOptions,
  workshopEffectOptions,
} from "./mappers";
import type { CategoryOption, ProductActionState } from "./types";

const initialState: ProductActionState = {
  ok: false,
  message: "",
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200"
    >
      {pending ? "Kaydediliyor..." : "Ürün Ekle"}
    </button>
  );
}

type Props = {
  categories: CategoryOption[];
};

export function AddProductDrawer({ categories }: Props) {
  const [state, formAction] = useActionState(createProduct, initialState);

  useEffect(() => {
    if (state.ok) {
      const dialog = document.getElementById(
        "add-product-dialog"
      ) as HTMLDialogElement | null;
      dialog?.close();
    }
  }, [state.ok]);

  return (
    <>
      <button
        type="button"
        onClick={() =>
          (
            document.getElementById(
              "add-product-dialog"
            ) as HTMLDialogElement | null
          )?.showModal()
        }
        className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200"
      >
        Ürün Ekle
      </button>

      <dialog
        id="add-product-dialog"
        className="w-full max-w-4xl rounded-2xl border border-zinc-800 bg-zinc-950 p-0 text-zinc-100 backdrop:bg-black/70"
      >
        <form action={formAction} className="rounded-2xl bg-zinc-950 p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Ürün Ekle</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Ürün ana kaydını oluştur.
              </p>
            </div>

            <button
              type="button"
              className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-200 transition hover:bg-zinc-800"
              onClick={() =>
                (
                  document.getElementById(
                    "add-product-dialog"
                  ) as HTMLDialogElement | null
                )?.close()
              }
            >
              Kapat
            </button>
          </div>

          <ProductFormFields categories={categories} errors={state.errors} />

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
}: {
  categories: CategoryOption[];
  errors?: Record<string, string[]>;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [sku, setSku] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [skuEdited, setSkuEdited] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === selectedCategoryId) ?? null,
    [categories, selectedCategoryId],
  );
  const handleNameChange = (nextName: string) => {
    setName(nextName);

    if (!slugEdited) {
      setSlug(generateProductSlug(nextName));
    }

    if (!skuEdited) {
      setSku(generateProductSku(nextName));
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-300">
          Ürün Adı
        </label>
        <input
          name="name"
          value={name}
          onChange={(event) => handleNameChange(event.target.value)}
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-700"
        />
        <FieldError errors={errors} name="name" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-300">
          Slug
        </label>
        <input
          name="slug"
          value={slug}
          onChange={(event) => {
            setSlugEdited(true);
            setSlug(event.target.value);
          }}
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-700"
        />
        <FieldError errors={errors} name="slug" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-300">
          SKU
        </label>
        <input
          name="sku"
          value={sku}
          onChange={(event) => {
            setSkuEdited(true);
            setSku(event.target.value);
          }}
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-700"
        />
        <FieldError errors={errors} name="sku" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-300">
          Kategori
        </label>
        <select
          name="categoryId"
          value={selectedCategoryId}
          onChange={(event) => setSelectedCategoryId(event.target.value)}
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-700"
        >
          <option value="">Kategori seç</option>
          {categories
            .filter((item) => item.status === "active" || item.status == null)
            .map((category) => (
              <option key={category.id} value={category.id}>
                {category.categoryLabel}
              </option>
            ))}
        </select>
        <CategoryDerivedInfo category={selectedCategory} />
        <FieldError errors={errors} name="categoryId" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-300">
          Ürün Tipi
        </label>
        <select
          name="productType"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-700"
        >
          <option value="">Tip seç</option>
          {categoryTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-300">
          Alt Tip
        </label>
        <input
          name="productSubType"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-700"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-300">
          Workshop Etkisi
        </label>
        <select
          name="workshopEffect"
          defaultValue="none"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-700"
        >
          {workshopEffectOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-300">
          Hedef Katman
        </label>
        <select
          name="targetLayer"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-700"
        >
          <option value="">Katman yok</option>
          {targetLayerOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-300">
          Mesh Key
        </label>
        <input
          name="meshKey"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-700"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-300">
          Material Key
        </label>
        <input
          name="materialKey"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-700"
        />
      </div>

      <div className="md:col-span-2">
        <label className="mb-1 block text-sm font-medium text-zinc-300">
          Teknik Özellikler JSON
        </label>
        <textarea
          name="technicalSpecs"
          rows={3}
          placeholder='{"voltage":"12V"}'
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-700"
        />
        <FieldError errors={errors} name="technicalSpecs" />
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
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-700"
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
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-700"
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
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-700"
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
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-700"
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
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-700"
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
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-700"
        />
        <FieldError errors={errors} name="description" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-300">
          Görsel URL
        </label>
        <input
          name="imageUrl"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-700"
        />
        <FieldError errors={errors} name="imageUrl" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-300">
          Datasheet URL
        </label>
        <input
          name="datasheetUrl"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-700"
        />
        <FieldError errors={errors} name="datasheetUrl" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-300">
          Durum
        </label>
        <select
          name="status"
          defaultValue="draft"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-700"
        >
          <option value="draft">Taslak</option>
          <option value="archived">Arşiv</option>
        </select>
        <p className="mt-1 text-xs text-zinc-500">
          Yeni ürünler önce taslak akışta açılır. Aktif statü, AI-ready knowledge
          kaydı oluştuğunda kullanılmalıdır.
        </p>
        <FieldError errors={errors} name="status" />
      </div>
    </div>
  );
}

function CategoryDerivedInfo({ category }: { category: CategoryOption | null }) {
  return (
    <div className="mt-2 flex flex-wrap gap-2 text-xs">
      <span className="rounded-full border border-zinc-800 bg-zinc-950 px-2.5 py-1 text-zinc-400">
        Görsel kategori: {category?.isVisual ? "Evet" : "Hayır"}
      </span>
      <span className="rounded-full border border-zinc-800 bg-zinc-950 px-2.5 py-1 text-zinc-400">
        3D hedef katman: {category?.targetLayer ?? "null"}
      </span>
    </div>
  );
}
