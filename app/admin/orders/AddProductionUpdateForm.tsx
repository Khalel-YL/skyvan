"use client";

import { useActionState, useState } from "react";

import { saveProductionUpdate } from "./actions";

type Props = {
  orderId: string;
};

const STAGE_OPTIONS = [
  { value: "pending", label: "Bekliyor" },
  { value: "chassis", label: "Şasi" },
  { value: "insulation", label: "İzolasyon" },
  { value: "furniture", label: "Mobilya" },
  { value: "systems", label: "Sistemler" },
  { value: "testing", label: "Test" },
  { value: "completed", label: "Tamamlandı" },
];

const initialState = {
  ok: false,
  message: "",
  values: {
    orderId: "",
    stage: "",
    description: "",
    imageUrl: "",
  },
  errors: {},
};

export function AddProductionUpdateForm({ orderId }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, action, isPending] = useActionState(saveProductionUpdate, initialState);

  return (
    <div className="rounded-3xl border border-zinc-900 bg-zinc-950/40">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div>
          <div className="text-xs uppercase tracking-[0.22em] text-zinc-500">
            Üretim Güncellemesi Ekle
          </div>
          <div className="mt-1 text-sm text-zinc-400">
            Aşama, açıklama ve opsiyonel görsel bağlantısı
          </div>
        </div>

        <span className="text-xs text-zinc-500">{isOpen ? "Kapat" : "Aç"}</span>
      </button>

      {isOpen ? (
        <div className="border-t border-zinc-900 px-4 pb-4 pt-3">
          <form action={action} className="space-y-3">
            <input type="hidden" name="orderId" value={orderId} />

            <div className="space-y-1">
              <label htmlFor={`stage-${orderId}`} className="text-xs text-zinc-400">
                Aşama
              </label>
              <select
                id={`stage-${orderId}`}
                name="stage"
                defaultValue={state.values?.orderId === orderId ? state.values?.stage ?? "" : ""}
                className="w-full rounded-2xl border border-zinc-800 bg-black px-3 py-2 text-sm text-white outline-none focus:border-zinc-700"
              >
                <option value="">Aşama seç</option>
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
              <label htmlFor={`description-${orderId}`} className="text-xs text-zinc-400">
                Açıklama
              </label>
              <textarea
                id={`description-${orderId}`}
                name="description"
                rows={4}
                defaultValue={
                  state.values?.orderId === orderId ? state.values?.description ?? "" : ""
                }
                placeholder="Yapılan iş, ilerleme, blokaj veya kalite notu"
                className="w-full resize-none rounded-2xl border border-zinc-800 bg-black px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-zinc-700"
              />
              {state.errors?.description ? (
                <div className="text-xs text-red-400">{state.errors.description}</div>
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
                defaultValue={state.values?.orderId === orderId ? state.values?.imageUrl ?? "" : ""}
                className="w-full rounded-2xl border border-zinc-800 bg-black px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-zinc-700"
              />
              {state.errors?.imageUrl ? (
                <div className="text-xs text-red-400">{state.errors.imageUrl}</div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-zinc-900 bg-black/30 px-3 py-2 text-xs text-zinc-500">
              İpucu: Aşama alanı order durumunu da ilerletebilir. “Completed” için en az bir üretim kaydı
              olması zaten korunur.
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

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isPending}
                className="rounded-2xl border border-zinc-800 bg-zinc-100 px-4 py-2 text-sm font-medium text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? "Ekleniyor..." : "Güncelleme ekle"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}