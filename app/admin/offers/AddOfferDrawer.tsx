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
  values: {
    id: "",
    leadId: "",
    offerReference: "",
    validUntil: "",
    totalAmount: "",
    status: "draft",
  },
  errors: {},
};

function getTodayInput() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getValue(
  state: OfferFormState,
  initialData: InitialData,
  key: "leadId" | "offerReference" | "validUntil" | "totalAmount" | "status",
) {
  const stateValue = state.values?.[key];

  if (typeof stateValue !== "undefined" && stateValue !== "") {
    return stateValue;
  }

  if (initialData) {
    return initialData[key];
  }

  if (key === "status") return "draft";
  if (key === "validUntil") return getTodayInput();

  return "";
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;

  return <p className="mt-2 text-xs text-rose-400">{message}</p>;
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
      <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm">
        <button
          type="button"
          aria-label="Kapat"
          onClick={() => router.replace("/admin/offers")}
          className="hidden flex-1 cursor-default md:block"
        />

        <aside className="flex h-full w-full max-w-xl flex-col border-l border-zinc-800 bg-zinc-950 shadow-2xl">
          <div className="flex items-start justify-between border-b border-zinc-800 px-6 py-5">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Admin · Offers</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Yeni teklif oluştur</h2>
            </div>

            <button
              type="button"
              onClick={() => router.replace("/admin/offers")}
              className="rounded-2xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 transition hover:border-zinc-700 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="px-6 py-6">
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5">
              <h3 className="text-base font-medium text-white">Lead bulunamadı</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Teklif oluşturmak için önce uygun bir lead kaydı bulunmalı. Offers modülü bağımsız
                çalışmaz; mevcut lead kaydına bağlanır.
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
        </aside>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Kapat"
        onClick={() => router.replace("/admin/offers")}
        className="hidden flex-1 cursor-default md:block"
      />

      <aside className="flex h-full w-full max-w-xl flex-col border-l border-zinc-800 bg-zinc-950 shadow-2xl">
        <div className="flex items-start justify-between border-b border-zinc-800 px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Admin · Offers</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              {initialData ? "Teklif düzenle" : "Yeni teklif oluştur"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Offer çekirdeği lead kaydına bağlı çalışır. Bu katman daha sonra imza, mühür ve
              order geçişi için temel olacak.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.replace("/admin/offers")}
            className="rounded-2xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 transition hover:border-zinc-700 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form action={formAction} className="flex flex-1 flex-col overflow-y-auto">
          {initialData?.id ? <input type="hidden" name="id" value={initialData.id} /> : null}

          <div className="space-y-5 px-6 py-6">
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5">
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
                  <User2 className="h-4 w-4 text-zinc-400" />
                  Lead
                </span>

                <select
                  name="leadId"
                  defaultValue={String(getValue(state, initialData, "leadId"))}
                  className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-zinc-600"
                >
                  <option value="">Lead seç</option>
                  {leadOptions.map((lead) => (
                    <option key={lead.id} value={lead.id}>
                      {lead.label}
                    </option>
                  ))}
                </select>
              </label>

              <FieldError message={state.errors?.leadId} />

              <p className="mt-2 text-xs text-zinc-500">
                Seçilen lead, mevcut build version bağını zaten taşıyor.
              </p>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5">
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
                  <FileText className="h-4 w-4 text-zinc-400" />
                  Teklif referansı
                </span>

                <input
                  name="offerReference"
                  type="text"
                  placeholder="BOŞ BIRAKILIRSA OTOMATİK ÜRETİLİR"
                  defaultValue={String(getValue(state, initialData, "offerReference"))}
                  className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm uppercase text-white outline-none transition focus:border-zinc-600"
                />
              </label>

              <FieldError message={state.errors?.offerReference} />

              <p className="mt-2 text-xs text-zinc-500">Örnek format: OFF-2026-0001</p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5">
                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
                    <Calendar className="h-4 w-4 text-zinc-400" />
                    Geçerlilik tarihi
                  </span>

                  <input
                    name="validUntil"
                    type="date"
                    defaultValue={String(getValue(state, initialData, "validUntil"))}
                    className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-zinc-600"
                  />
                </label>

                <FieldError message={state.errors?.validUntil} />
              </div>

              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5">
                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
                    <Receipt className="h-4 w-4 text-zinc-400" />
                    Toplam tutar
                  </span>

                  <input
                    name="totalAmount"
                    type="text"
                    inputMode="decimal"
                    placeholder="0,00"
                    defaultValue={String(getValue(state, initialData, "totalAmount"))}
                    className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-zinc-600"
                  />
                </label>

                <FieldError message={state.errors?.totalAmount} />
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5">
              <label className="block">
                <span className="mb-3 block text-sm font-medium text-white">Durum</span>

                <select
                  name="status"
                  defaultValue={String(getValue(state, initialData, "status"))}
                  className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-zinc-600"
                >
                  <option value="draft">Taslak</option>
                  <option value="sent">Gönderildi</option>
                  <option value="accepted">Kabul edildi</option>
                  <option value="rejected">Reddedildi</option>
                  <option value="expired">Süresi geçti</option>
                </select>
              </label>
            </div>

            {state.errors?.form ? (
              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                {state.errors.form}
              </div>
            ) : null}

            {state.message ? (
              <div
                className={`rounded-2xl px-4 py-3 text-sm ${
                  state.ok
                    ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                    : "border border-zinc-800 bg-zinc-900 text-zinc-300"
                }`}
              >
                {state.message}
              </div>
            ) : null}
          </div>

          <div className="mt-auto flex items-center justify-end gap-3 border-t border-zinc-800 px-6 py-5">
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
              className="rounded-2xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isPending
                ? "Kaydediliyor..."
                : initialData
                  ? "Teklifi güncelle"
                  : "Teklifi oluştur"}
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}