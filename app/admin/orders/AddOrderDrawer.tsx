"use client";

import { useActionState } from "react";

import { saveOrder } from "./actions";

type AcceptedOfferOption = {
  offerId: string;
  offerReference: string;
  leadName: string;
  leadEmail: string | null;
  buildVersionNumber: number;
};

type Props = {
  offers: AcceptedOfferOption[];
};

const initialState = {
  ok: false,
  message: "",
  values: {
    offerId: "",
    productionStatus: "pending" as const,
    estimatedDeliveryDate: "",
    vinNumber: "",
  },
  errors: {},
};

export function AddOrderDrawer({ offers }: Props) {
  const [state, action] = useActionState(saveOrder, initialState);

  return (
    <div className="rounded-3xl border border-zinc-900 bg-zinc-950/40 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.22em] text-zinc-500">Yeni Order</div>
          <div className="mt-1 text-sm text-zinc-400">
            Yalnızca accepted ve henüz order’a bağlanmamış offer kayıtları listelenir.
          </div>
        </div>

        <div className="rounded-full border border-zinc-800 bg-black px-3 py-1 text-xs text-zinc-400">
          Uygun offer: {offers.length}
        </div>
      </div>

      {offers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 bg-black/30 p-4 text-sm text-zinc-500">
          Uygun offer bulunamadı. Önce accepted duruma geçmiş ve boşta olan bir teklif oluşmalı.
        </div>
      ) : (
        <form action={action} className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="offerId" className="text-xs text-zinc-400">
                Offer
              </label>
              <select
                id="offerId"
                name="offerId"
                defaultValue={state.values?.offerId ?? ""}
                className="w-full rounded-2xl border border-zinc-800 bg-black px-3 py-2 text-sm text-white outline-none focus:border-zinc-700"
              >
                <option value="">Offer seç</option>
                {offers.map((item) => (
                  <option key={item.offerId} value={item.offerId}>
                    {item.offerReference} · {item.leadName} · V{item.buildVersionNumber}
                  </option>
                ))}
              </select>
              {state.errors?.offerId ? (
                <div className="text-xs text-red-400">{state.errors.offerId}</div>
              ) : null}
            </div>

            <div className="space-y-1">
              <label htmlFor="estimatedDeliveryDate" className="text-xs text-zinc-400">
                Tahmini teslim tarihi
              </label>
              <input
                id="estimatedDeliveryDate"
                type="date"
                name="estimatedDeliveryDate"
                defaultValue={state.values?.estimatedDeliveryDate ?? ""}
                className="w-full rounded-2xl border border-zinc-800 bg-black px-3 py-2 text-sm text-white outline-none focus:border-zinc-700"
              />
              {state.errors?.estimatedDeliveryDate ? (
                <div className="text-xs text-red-400">{state.errors.estimatedDeliveryDate}</div>
              ) : null}
            </div>

            <div className="space-y-1">
              <label htmlFor="productionStatus" className="text-xs text-zinc-400">
                Başlangıç durumu
              </label>
              <select
                id="productionStatus"
                name="productionStatus"
                defaultValue={state.values?.productionStatus ?? "pending"}
                className="w-full rounded-2xl border border-zinc-800 bg-black px-3 py-2 text-sm text-white outline-none focus:border-zinc-700"
              >
                <option value="pending">Bekliyor</option>
                <option value="chassis">Şasi</option>
                <option value="insulation">İzolasyon</option>
                <option value="furniture">Mobilya</option>
                <option value="systems">Sistemler</option>
                <option value="testing">Test</option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="vinNumber" className="text-xs text-zinc-400">
                VIN
              </label>
              <input
                id="vinNumber"
                type="text"
                name="vinNumber"
                placeholder="Opsiyonel"
                defaultValue={state.values?.vinNumber ?? ""}
                className="w-full rounded-2xl border border-zinc-800 bg-black px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-zinc-700"
              />
              {state.errors?.vinNumber ? (
                <div className="text-xs text-red-400">{state.errors.vinNumber}</div>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-900 bg-black/30 px-3 py-2 text-xs text-zinc-500">
            Not: Aynı offer için ikinci order açılamaz. Offer bağı order tarafında korunur.
          </div>

          {state.errors?.form ? (
            <div className="rounded-2xl border border-red-950 bg-red-950/20 px-3 py-2 text-sm text-red-300">
              {state.errors.form}
            </div>
          ) : null}

          {state.ok ? (
            <div className="rounded-2xl border border-emerald-950 bg-emerald-950/20 px-3 py-2 text-sm text-emerald-300">
              {state.message}
            </div>
          ) : state.message ? (
            <div className="rounded-2xl border border-zinc-800 bg-black/30 px-3 py-2 text-sm text-zinc-300">
              {state.message}
            </div>
          ) : null}

          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-2xl border border-zinc-800 bg-zinc-100 px-4 py-2 text-sm font-medium text-black transition hover:bg-white"
            >
              Order oluştur
            </button>
          </div>
        </form>
      )}
    </div>
  );
}