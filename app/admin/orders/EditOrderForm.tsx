"use client";

import { useActionState, useState } from "react";

import { saveOrder } from "./actions";

type ProductionStatus =
  | "pending"
  | "chassis"
  | "insulation"
  | "furniture"
  | "systems"
  | "testing"
  | "completed";

type Props = {
  id: string;
  offerId: string;
  productionStatus: ProductionStatus;
  estimatedDeliveryDate: string;
  vinNumber: string;
};

type OrderState = {
  ok: boolean;
  message: string;
  values?: {
    id?: string;
    offerId?: string;
    productionStatus?: ProductionStatus;
    estimatedDeliveryDate?: string;
    vinNumber?: string;
  };
  errors?: {
    offerId?: string;
    productionStatus?: string;
    estimatedDeliveryDate?: string;
    vinNumber?: string;
    form?: string;
  };
};

function normalizeDateValue(value: string) {
  if (!value) return "";

  const text = String(value);

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  const date = new Date(text);

  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 10);
}

export function EditOrderForm({
  id,
  offerId,
  productionStatus,
  estimatedDeliveryDate,
  vinNumber,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const initialState: OrderState = {
    ok: false,
    message: "",
    values: {
      id,
      offerId,
      productionStatus,
      estimatedDeliveryDate: normalizeDateValue(estimatedDeliveryDate),
      vinNumber,
    },
    errors: {},
  };

  const [state, action, isPending] = useActionState(saveOrder, initialState);

  const values = state.values ?? initialState.values!;

  return (
    <div className="rounded-3xl border border-zinc-900 bg-zinc-950/40">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div>
          <div className="text-xs uppercase tracking-[0.22em] text-zinc-500">Order Düzenle</div>
          <div className="mt-1 text-sm text-zinc-400">
            Durum, teslim tarihi ve VIN yönetimi
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full border border-zinc-800 bg-black px-3 py-1 text-xs text-zinc-400">
            Offer bağlı
          </span>
          <span className="text-xs text-zinc-500">{isOpen ? "Kapat" : "Aç"}</span>
        </div>
      </button>

      {isOpen ? (
        <div className="border-t border-zinc-900 px-4 pb-4 pt-3">
          <form action={action} className="space-y-3">
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="offerId" value={offerId} />

            <div className="space-y-1">
              <label htmlFor={`productionStatus-${id}`} className="text-xs text-zinc-400">
                Durum
              </label>
              <select
                id={`productionStatus-${id}`}
                name="productionStatus"
                defaultValue={values.productionStatus ?? productionStatus}
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
              <label htmlFor={`estimatedDeliveryDate-${id}`} className="text-xs text-zinc-400">
                Tahmini teslim tarihi
              </label>
              <input
                id={`estimatedDeliveryDate-${id}`}
                type="date"
                name="estimatedDeliveryDate"
                defaultValue={normalizeDateValue(values.estimatedDeliveryDate ?? estimatedDeliveryDate)}
                className="w-full rounded-2xl border border-zinc-800 bg-black px-3 py-2 text-sm text-white outline-none focus:border-zinc-700"
              />
              {state.errors?.estimatedDeliveryDate ? (
                <div className="text-xs text-red-400">{state.errors.estimatedDeliveryDate}</div>
              ) : null}
            </div>

            <div className="space-y-1">
              <label htmlFor={`vinNumber-${id}`} className="text-xs text-zinc-400">
                VIN
              </label>
              <input
                id={`vinNumber-${id}`}
                type="text"
                name="vinNumber"
                placeholder="Opsiyonel"
                defaultValue={values.vinNumber ?? vinNumber}
                className="w-full rounded-2xl border border-zinc-800 bg-black px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-zinc-700"
              />
              {state.errors?.vinNumber ? (
                <div className="text-xs text-red-400">{state.errors.vinNumber}</div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-zinc-900 bg-black/30 px-3 py-2 text-xs text-zinc-500">
              Not: “Completed” durumuna geçişte sistem üretim kaydı varlığını yine kontrol eder.
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
                disabled={isPending}
                className="rounded-2xl border border-zinc-800 bg-zinc-100 px-4 py-2 text-sm font-medium text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? "Kaydediliyor..." : "Order güncelle"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}