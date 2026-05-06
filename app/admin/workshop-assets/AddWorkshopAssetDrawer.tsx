"use client";

import { Layers3, Plus, X } from "lucide-react";
import { useActionState, useState } from "react";

import { saveWorkshopAsset } from "./actions";
import {
  initialWorkshopAssetFormState,
  type WorkshopAssetListItem,
  type WorkshopAssetOption,
} from "./types";

type WorkshopAssetFormProps = {
  initialData?: WorkshopAssetListItem | null;
  productOptions: WorkshopAssetOption[];
  modelOptions: WorkshopAssetOption[];
  disabled?: boolean;
  buttonLabel?: string;
  compact?: boolean;
};

const inputClassName =
  "w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-zinc-600";

const cameraViewSuggestions = [
  "isometric",
  "side",
  "front",
  "rear",
  "texture-preview",
  "interior",
  "exterior",
];

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div>
        <label className="text-sm font-medium text-zinc-200">{label}</label>
        {hint ? <p className="mt-0.5 text-xs leading-5 text-zinc-500">{hint}</p> : null}
      </div>
      {children}
      {error ? <p className="text-xs text-rose-400">{error}</p> : null}
    </div>
  );
}

function WorkshopAssetForm({
  initialData,
  productOptions,
  modelOptions,
  onCancel,
}: WorkshopAssetFormProps & { onCancel: () => void }) {
  const [state, formAction, isPending] = useActionState(
    saveWorkshopAsset,
    initialWorkshopAssetFormState,
  );
  const isEdit = Boolean(initialData?.id);
  const [cameraView, setCameraView] = useState(initialData?.cameraView ?? "");

  return (
    <form action={formAction} className="space-y-4 p-4">
      {isEdit ? <input type="hidden" name="id" value={initialData?.id} /> : null}

      {state.message ? (
        <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
          {state.message}
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Ürün" error={state.fieldErrors.productId}>
          <select
            name="productId"
            defaultValue={initialData?.productId ?? ""}
            className={inputClassName}
            aria-invalid={Boolean(state.fieldErrors.productId)}
            required
          >
            <option value="">Ürün seç</option>
            {productOptions.map((product) => (
              <option key={product.id} value={product.id}>
                {product.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Araç modeli" error={state.fieldErrors.modelId}>
          <select
            name="modelId"
            defaultValue={initialData?.modelId ?? ""}
            className={inputClassName}
            aria-invalid={Boolean(state.fieldErrors.modelId)}
            required
          >
            <option value="">Model seç</option>
            {modelOptions.map((model) => (
              <option key={model.id} value={model.id}>
                {model.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_160px]">
        <Field
          label="Kamera görünümü"
          hint="Örn: isometric, side, front, rear, texture-preview"
          error={state.fieldErrors.cameraView}
        >
          <div className="space-y-2">
            <input
              name="cameraView"
              value={cameraView}
              onChange={(event) => setCameraView(event.target.value)}
              className={inputClassName}
              placeholder="isometric"
              aria-invalid={Boolean(state.fieldErrors.cameraView)}
              required
            />
            <div className="flex flex-wrap gap-1.5">
              {cameraViewSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setCameraView(suggestion)}
                  className="rounded-full border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[11px] text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-100"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </Field>

        <Field
          label="Katman sırası"
          hint="Küçük sayı önce çizilir; büyük sayı üstte kalır."
          error={state.fieldErrors.zIndexLayer}
        >
          <input
            name="zIndexLayer"
            type="number"
            step="1"
            defaultValue={initialData?.zIndexLayer ?? 10}
            className={inputClassName}
            aria-invalid={Boolean(state.fieldErrors.zIndexLayer)}
            required
          />
        </Field>
      </div>

      <Field
        label="Varlık URL"
        hint="Örn: /workshop-assets/models/ducato-class-l2h2/products/mas-001/isometric/layer-010-table.webp. Dosya yükleme bu sprintte yok."
        error={state.fieldErrors.assetUrl}
      >
        <input
          name="assetUrl"
          defaultValue={initialData?.assetUrl ?? ""}
          className={inputClassName}
          placeholder="/workshop-assets/models/.../layer-010-table.webp"
          aria-invalid={Boolean(state.fieldErrors.assetUrl)}
          required
        />
      </Field>

      <Field
        label="Yedek URL"
        hint="Opsiyonel. Ana varlık yüklenemezse kullanılacak güvenli yedek yol. Örn: /workshop-assets/models/ducato-class-l2h2/fallback/missing-layer.webp"
        error={state.fieldErrors.fallbackUrl}
      >
        <input
          name="fallbackUrl"
          defaultValue={initialData?.fallbackUrl ?? ""}
          className={inputClassName}
          placeholder="/workshop-assets/models/.../fallback/missing-layer.webp"
          aria-invalid={Boolean(state.fieldErrors.fallbackUrl)}
        />
      </Field>

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-zinc-800 pt-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-zinc-800 px-3 py-2 text-sm text-zinc-300 transition hover:border-zinc-700 hover:text-white"
        >
          Vazgeç
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl border border-sky-500/25 bg-sky-500/15 px-3 py-2 text-sm font-medium text-sky-100 transition hover:bg-sky-500/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Kaydediliyor..." : isEdit ? "Güncelle" : "Kaydet"}
        </button>
      </div>
    </form>
  );
}

export default function AddWorkshopAssetDrawer({
  initialData = null,
  productOptions,
  modelOptions,
  disabled = false,
  buttonLabel,
  compact = false,
}: WorkshopAssetFormProps) {
  const [open, setOpen] = useState(false);
  const isEdit = Boolean(initialData?.id);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        className={
          compact
            ? "inline-flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-zinc-200 transition hover:border-zinc-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            : "inline-flex items-center gap-2 rounded-xl border border-sky-500/25 bg-sky-500/15 px-3 py-2 text-sm font-medium text-sky-100 transition hover:bg-sky-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        }
      >
        {isEdit ? <Layers3 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        {buttonLabel ?? (isEdit ? "Düzenle" : "Yeni varlık")}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Kapat"
            className="absolute inset-0 cursor-default"
            onClick={() => setOpen(false)}
          />
          <aside className="relative h-full w-full max-w-2xl overflow-y-auto border-l border-zinc-800 bg-zinc-950 shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-zinc-800 bg-zinc-950/95 p-4 backdrop-blur">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                  Workshop Varlığı
                </div>
                <h2 className="mt-1 text-lg font-semibold text-white">
                  {isEdit ? "Varlığı düzenle" : "Yeni varlık"}
                </h2>
                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  Ürün, model ve 2.5D katman bağını yönet.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-zinc-800 p-2 text-zinc-400 transition hover:border-zinc-700 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <WorkshopAssetForm
              initialData={initialData}
              productOptions={productOptions}
              modelOptions={modelOptions}
              onCancel={() => setOpen(false)}
            />
          </aside>
        </div>
      ) : null}
    </>
  );
}
