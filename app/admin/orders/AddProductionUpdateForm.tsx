"use client";

import { useActionState } from "react";

import type { ProductionStatus, ProductionUpdateFormState } from "./actions";
import { saveProductionUpdate } from "./actions";

type Props = {
  orderId: string;
  currentStatus: ProductionStatus;
  hasVin: boolean;
};

const STAGE_OPTIONS = [
  { value: "pending", label: "Bekliyor" },
  { value: "chassis", label: "Şasi" },
  { value: "insulation", label: "İzolasyon" },
  { value: "furniture", label: "Mobilya" },
  { value: "systems", label: "Sistemler" },
  { value: "testing", label: "Test" },
  { value: "completed", label: "Tamamlandı" },
] as const;

const initialState: ProductionUpdateFormState = {
  ok: false,
  message: "",
  values: {
    orderId: "",
    stage: "pending",
    description: "",
    imageUrl: "",
  },
  errors: {},
};

export function AddProductionUpdateForm({ orderId, currentStatus, hasVin }: Props) {
  const [state, action, isPending] = useActionState(saveProductionUpdate, initialState);
  const selectedStage =
    state.values?.orderId === orderId ? (state.values?.stage ?? currentStatus) : currentStatus;

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white">Üretim Güncellemesi Ekle</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Yeni kayıt eklenince sipariş durumu da aynı aşamaya güncellenir.
        </p>
      </div>

      {!hasVin ? (
        <div className="mb-4 rounded-2xl border border-amber-900/70 bg-amber-950/20 px-3 py-2 text-sm text-amber-200">
          VIN henüz girilmemiş. Test ve Tamamlandı güncellemeleri öncesinde VIN eklenmelidir.
        </div>
      ) : null}

      <form action={action} className="space-y-4">
        <input type="hidden" name="orderId" value={orderId} />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
          <div className="space-y-1">
            <label htmlFor={`stage-${orderId}`} className="text-xs text-zinc-400">
              Aşama
            </label>
            <select
              id={`stage-${orderId}`}
              name="stage"
              defaultValue={selectedStage}
              className="w-full rounded-2xl border border-zinc-800 bg-black px-3 py-2 text-sm text-white outline-none focus:border-zinc-700"
            >
              {STAGE_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            {state.errors?.stage ? (
              <div className="text-xs text-red-400">{state.errors.stage}</div>
            ) : null}
          </div>

          <div className="space-y-1">
            <label htmlFor={`imageUrl-${orderId}`} className="text-xs text-zinc-400">
              Görsel bağlantısı
            </label>
            <input
              id={`imageUrl-${orderId}`}
              type="text"
              name="imageUrl"
              placeholder="https://..."
              defaultValue={state.values?.orderId === orderId ? (state.values?.imageUrl ?? "") : ""}
              className="w-full rounded-2xl border border-zinc-800 bg-black px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-zinc-700"
            />
            {state.errors?.imageUrl ? (
              <div className="text-xs text-red-400">{state.errors.imageUrl}</div>
            ) : null}
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor={`description-${orderId}`} className="text-xs text-zinc-400">
            Açıklama
          </label>
          <textarea
            id={`description-${orderId}`}
            name="description"
            rows={4}
            placeholder="Bugün yapılan işlem, bir sonraki adım ve varsa kritik not..."
            defaultValue={state.values?.orderId === orderId ? (state.values?.description ?? "") : ""}
            className="w-full rounded-2xl border border-zinc-800 bg-black px-3 py-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-zinc-700"
          />
          {state.errors?.description ? (
            <div className="text-xs text-red-400">{state.errors.description}</div>
          ) : null}
        </div>

        <div className="rounded-2xl border border-zinc-900 bg-black/30 px-3 py-2 text-xs text-zinc-500">
          İpucu: Form mevcut order durumunu varsayılan aşama olarak başlatır. Böylece küçük ilerleme
          kayıtlarında tekrar seçim yükü azalır.
        </div>

        {state.errors?.form ? (
          <div className="rounded-2xl border border-red-950 bg-red-950/20 px-3 py-2 text-sm text-red-300">
            {state.errors.form}
          </div>
        ) : null}

        {state.ok && state.values?.orderId === orderId ? (
          <div className="rounded-2xl border border-emerald-950 bg-emerald-950/20 px-3 py-2 text-sm text-emerald-300">
            {state.message}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-2xl border border-zinc-800 bg-zinc-100 px-4 py-2 text-sm font-medium text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Ekleniyor..." : "Güncelleme ekle"}
        </button>
      </form>
    </div>
  );
}
