"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Calendar, FileText, Receipt, User2, X } from "lucide-react";

import { saveOffer, type OfferFormState } from "./actions";

type OfferStatus = "draft" | "sent" | "accepted" | "rejected" | "expired";

type LeadOption = {
  id: string;
  label: string;
  meta: string;
};

type InitialData = {
  id: string;
  leadId: string;
  offerReference: string;
  validUntil: string;
  totalAmount: string;
  status: OfferStatus;
} | null;

type Props = {
  leadOptions: LeadOption[];
  initialData: InitialData;
};

const initialState: OfferFormState = {
  ok: false,
  message: "",
};

function getValue(
  state: OfferFormState,
  initialData: InitialData,
  key: "leadId" | "offerReference" | "validUntil" | "totalAmount" | "status",
) {
  if (state.values && key in state.values) {
    return state.values[key];
  }

  if (!initialData) {
    if (key === "status") return "draft";
    return "";
  }

  return initialData[key];
}

export function AddOfferDrawer({ leadOptions, initialData }: Props) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(saveOffer, initialState);

  useEffect(() => {
    if (state.ok) {
      router.replace("/admin/offers");
      router.refresh();
    }
  }, [router, state.ok]);

  if (leadOptions.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/60 backdrop-blur-sm">
        <button
          type="button"
          aria-label="Kapat"
          onClick={() => router.replace("/admin/offers")}
          className="hidden flex-1 cursor-default md:block"
        />

        <div className="flex h-full w-full max-w-2xl flex-col overflow-hidden border-l border-zinc-800 bg-zinc-950 shadow-2xl">
          <div className="flex items-start justify-between border-b border-zinc-900 px-5 py-4">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
                Admin · Offers
              </p>
              <h2 className="text-xl font-semibold text-white">Yeni teklif oluştur</h2>
            </div>

            <button
              type="button"
              onClick={() => router.replace("/admin/offers")}
              className="rounded-2xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 transition hover:border-zinc-700 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex flex-1 items-center justify-center p-8">
            <div className="w-full max-w-md rounded-3xl border border-amber-500/20 bg-amber-500/10 p-6 text-center">
              <p className="text-lg font-medium text-amber-100">Lead bulunamadı</p>
              <p className="mt-2 text-sm text-amber-200/80">
                Teklif oluşturmak için önce uygun bir lead kaydı bulunmalı.
              </p>
              <button
                type="button"
                onClick={() => router.replace("/admin/offers")}
                className="mt-5 rounded-2xl bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-zinc-200"
              >
                Geri dön
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/60 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Kapat"
        onClick={() => router.replace("/admin/offers")}
        className="hidden flex-1 cursor-default md:block"
      />

      <div className="flex h-full w-full max-w-2xl flex-col overflow-hidden border-l border-zinc-800 bg-zinc-950 shadow-2xl">
        <div className="flex items-start justify-between border-b border-zinc-900 px-5 py-4">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
              Admin · Offers
            </p>
            <h2 className="text-xl font-semibold text-white">
              {initialData ? "Teklif düzenle" : "Yeni teklif oluştur"}
            </h2>
            <p className="max-w-xl text-sm text-zinc-400">
              Offer çekirdeği lead kaydına bağlı çalışır. Bu katman daha sonra imza,
              mühür ve order geçişi için temel olacak.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.replace("/admin/offers")}
            className="rounded-2xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 transition hover:border-zinc-700 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <form action={formAction} className="space-y-5">
            <input type="hidden" name="id" value={initialData?.id ?? ""} />

            <div className="grid gap-4">
              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4">
                <label className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                  Lead
                </label>
                <div className="relative">
                  <User2
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
                    size={16}
                  />
                  <select
                    name="leadId"
                    defaultValue={String(getValue(state, initialData, "leadId") ?? "")}
                    className="w-full appearance-none rounded-2xl border border-zinc-800 bg-zinc-950 py-3 pl-11 pr-4 text-sm text-zinc-100 outline-none transition focus:border-zinc-600"
                    required
                  >
                    <option value="">Lead seç</option>
                    {leadOptions.map((lead) => (
                      <option key={lead.id} value={lead.id}>
                        {lead.label}
                      </option>
                    ))}
                  </select>
                </div>
                {state.errors?.leadId ? (
                  <p className="mt-2 text-xs text-rose-400">{state.errors.leadId}</p>
                ) : null}
              </div>

              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4">
                <label className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                  Teklif referansı
                </label>
                <div className="relative">
                  <FileText
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
                    size={16}
                  />
                  <input
                    name="offerReference"
                    defaultValue={String(
                      getValue(state, initialData, "offerReference") ?? "",
                    )}
                    placeholder="Örn. OFF-001"
                    required
                    className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 py-3 pl-11 pr-4 text-sm text-zinc-100 outline-none transition focus:border-zinc-600"
                  />
                </div>
                {state.errors?.offerReference ? (
                  <p className="mt-2 text-xs text-rose-400">
                    {state.errors.offerReference}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4">
                  <label className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                    Geçerlilik tarihi
                  </label>
                  <div className="relative">
                    <Calendar
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
                      size={16}
                    />
                    <input
                      type="date"
                      name="validUntil"
                      defaultValue={String(getValue(state, initialData, "validUntil") ?? "")}
                      className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 py-3 pl-11 pr-4 text-sm text-zinc-100 outline-none transition focus:border-zinc-600"
                      required
                    />
                  </div>
                  {state.errors?.validUntil ? (
                    <p className="mt-2 text-xs text-rose-400">{state.errors.validUntil}</p>
                  ) : null}
                </div>

                <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4">
                  <label className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                    Toplam tutar
                  </label>
                  <div className="relative">
                    <Receipt
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
                      size={16}
                    />
                    <input
                      name="totalAmount"
                      inputMode="decimal"
                      defaultValue={String(getValue(state, initialData, "totalAmount") ?? "")}
                      placeholder="Örn. 3500000"
                      className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 py-3 pl-11 pr-4 text-sm text-zinc-100 outline-none transition focus:border-zinc-600"
                      required
                    />
                  </div>
                  {state.errors?.totalAmount ? (
                    <p className="mt-2 text-xs text-rose-400">{state.errors.totalAmount}</p>
                  ) : null}
                </div>
              </div>

              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4">
                <label className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                  Durum
                </label>
                <select
                  name="status"
                  defaultValue={String(getValue(state, initialData, "status") ?? "draft")}
                  className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-zinc-600"
                >
                  <option value="draft">Taslak</option>
                  <option value="sent">Gönderildi</option>
                  <option value="accepted">Kabul edildi</option>
                  <option value="rejected">Reddedildi</option>
                  <option value="expired">Süresi geçti</option>
                </select>
              </div>
            </div>

            {state.errors?.form ? (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {state.errors.form}
              </div>
            ) : null}

            {state.message ? (
              <div
                className={`rounded-2xl border px-4 py-3 text-sm ${
                  state.ok
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                    : "border-rose-500/30 bg-rose-500/10 text-rose-200"
                }`}
              >
                {state.message}
              </div>
            ) : null}

            <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-zinc-900 bg-zinc-950/90 px-1 pt-4 backdrop-blur">
              <button
                type="button"
                onClick={() => router.replace("/admin/offers")}
                className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-300 transition hover:border-zinc-700 hover:text-white"
              >
                Vazgeç
              </button>

              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending
                  ? "Kaydediliyor..."
                  : initialData
                    ? "Teklifi güncelle"
                    : "Teklifi oluştur"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}