"use client";

import { useActionState, useMemo } from "react";

import type { OrderFormState, ProductionStatus } from "./actions";
import { saveOrder } from "./actions";

type Props = {
  id: string;
  offerId: string;
  productionStatus: ProductionStatus;
  estimatedDeliveryDate: string;
  vinNumber: string;
  updatesCount: number;
};

export function EditOrderForm({
  id,
  offerId,
  productionStatus,
  estimatedDeliveryDate,
  vinNumber,
  updatesCount,
}: Props) {
  const initialState = useMemo<OrderFormState>(
    () => ({
      ok: false,
      message: "",
      values: {
        id,
        offerId,
        productionStatus,
        estimatedDeliveryDate,
        vinNumber,
      },
      errors: {},
    }),
    [estimatedDeliveryDate, id, offerId, productionStatus, vinNumber],
  );

  const [state, action, isPending] = useActionState(saveOrder, initialState);
  const values = state.values ?? initialState.values!;

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white">Order Düzenle</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Durum, teslim tarihi ve VIN bu karttan yönetilir.
        </p>
      </div>

      <form action={action} className="space-y-4">
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="offerId" value={offerId} />

        <div className="rounded-2xl border border-zinc-900 bg-black/30 px-3 py-2 text-xs text-zinc-500">
          Offer bağı korunur. Timeline kaydı sayısı: {updatesCount}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
          <div className="space-y-1">
            <label htmlFor="productionStatus" className="text-xs text-zinc-400">
              Durum
            </label>
            <select
              id="productionStatus"
              name="productionStatus"
              defaultValue={values.productionStatus ?? "pending"}
              className="w-full rounded-2xl border border-zinc-800 bg-black px-3 py-2 text-sm text-white outline-none focus:border-zinc-700"
            >
              <option value="pending">Bekliyor</option>
              <option value="chassis">Şasi</option>
              <option value="insulation">İzolasyon</option>
              <option value="furniture">Mobilya</option>
              <option value="systems">Sistemler</option>
              <option value="testing">Test</option>
              <option value="completed">Tamamlandı</option>
            </select>
            {state.errors?.productionStatus ? (
              <div className="text-xs text-red-400">{state.errors.productionStatus}</div>
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
              defaultValue={values.estimatedDeliveryDate ?? ""}
              className="w-full rounded-2xl border border-zinc-800 bg-black px-3 py-2 text-sm text-white outline-none focus:border-zinc-700"
            />
            {state.errors?.estimatedDeliveryDate ? (
              <div className="text-xs text-red-400">{state.errors.estimatedDeliveryDate}</div>
            ) : null}
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="vinNumber" className="text-xs text-zinc-400">
            VIN
          </label>
          <input
            id="vinNumber"
            type="text"
            name="vinNumber"
            defaultValue={values.vinNumber ?? ""}
            placeholder="11-17 karakter"
            className="w-full rounded-2xl border border-zinc-800 bg-black px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-zinc-700"
          />
          {state.errors?.vinNumber ? (
            <div className="text-xs text-red-400">{state.errors.vinNumber}</div>
          ) : null}
        </div>

        <div className="rounded-2xl border border-zinc-900 bg-black/30 px-3 py-2 text-xs text-zinc-500">
          Not: Testing ve Completed aşamalarında VIN zorunludur. Completed geçişinde ayrıca
          en az bir üretim güncellemesi aranır.
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
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm text-zinc-300">
            {state.message}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-2xl border border-zinc-800 bg-zinc-100 px-4 py-2 text-sm font-medium text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Kaydediliyor..." : "Order güncelle"}
        </button>
      </form>
    </div>
  );
}