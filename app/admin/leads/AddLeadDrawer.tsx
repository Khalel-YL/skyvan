"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Phone, User2, Waypoints, X } from "lucide-react";

import { saveLead } from "./action";
import {
  initialLeadFormState,
  type LeadFormState,
  type LeadStatus,
} from "./types";

type BuildVersionOption = {
  id: string;
  label: string;
  meta: string;
};

type LeadInitialData = {
  id: string;
  buildVersionId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  whatsappOptIn: boolean;
  status: LeadStatus;
} | null;

type AddLeadDrawerProps = {
  buildVersionOptions: BuildVersionOption[];
  initialData: LeadInitialData;
};

function getFieldValue(
  state: LeadFormState,
  initialData: LeadInitialData,
  key:
    | "buildVersionId"
    | "fullName"
    | "email"
    | "phoneNumber"
    | "status"
    | "whatsappOptIn",
) {
  if (state.values && key in state.values) {
    return state.values[key];
  }

  if (!initialData) {
    if (key === "status") return "new";
    if (key === "whatsappOptIn") return false;
    return "";
  }

  return initialData[key];
}

export function AddLeadDrawer({
  buildVersionOptions,
  initialData,
}: AddLeadDrawerProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    saveLead,
    initialLeadFormState,
  );

  useEffect(() => {
    if (state.ok) {
      router.replace("/admin/leads");
      router.refresh();
    }
  }, [router, state.ok]);

  const selectedBuildVersionId = String(
    getFieldValue(state, initialData, "buildVersionId") ?? "",
  );
  const selectedStatus = String(getFieldValue(state, initialData, "status") ?? "new");
  const selectedWhatsappOptIn = Boolean(
    getFieldValue(state, initialData, "whatsappOptIn"),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/60 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Kapat"
        onClick={() => router.replace("/admin/leads")}
        className="hidden flex-1 cursor-default md:block"
      />

      <div className="flex h-full w-full max-w-2xl flex-col overflow-hidden border-l border-zinc-800 bg-zinc-950 shadow-2xl">
        <div className="flex items-start justify-between border-b border-zinc-900 px-5 py-4">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
              Admin · Leads
            </p>
            <h2 className="text-xl font-semibold text-white">
              {initialData ? "Lead düzenle" : "Yeni lead oluştur"}
            </h2>
            <p className="max-w-xl text-sm text-zinc-400">
              Lead kaydını doğrudan build version ile bağla ve CRM giriş hattını native
              tablo üstünde tut.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.replace("/admin/leads")}
            className="rounded-2xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 transition hover:border-zinc-700 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <form action={formAction} className="space-y-5">
            <input type="hidden" name="id" value={initialData?.id ?? ""} />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4 md:col-span-2">
                <label className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                  Build versiyonu
                </label>
                <div className="relative">
                  <Waypoints
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
                    size={16}
                  />
                  <select
                    name="buildVersionId"
                    defaultValue={selectedBuildVersionId}
                    className="w-full appearance-none rounded-2xl border border-zinc-800 bg-zinc-950 py-3 pl-11 pr-4 text-sm text-zinc-100 outline-none transition focus:border-zinc-600"
                    required
                  >
                    <option value="">Build versiyonu seç</option>
                    {buildVersionOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                {state.errors?.buildVersionId ? (
                  <p className="mt-2 text-xs text-rose-400">
                    {state.errors.buildVersionId}
                  </p>
                ) : null}
                {selectedBuildVersionId ? (
                  <p className="mt-2 text-xs text-zinc-500">
                    {
                      buildVersionOptions.find((item) => item.id === selectedBuildVersionId)
                        ?.meta
                    }
                  </p>
                ) : null}
              </div>

              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4">
                <label className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                  Ad soyad
                </label>
                <div className="relative">
                  <User2
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
                    size={16}
                  />
                  <input
                    name="fullName"
                    defaultValue={String(getFieldValue(state, initialData, "fullName") ?? "")}
                    placeholder="Örn. Ahmet Yılmaz"
                    className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 py-3 pl-11 pr-4 text-sm text-zinc-100 outline-none transition focus:border-zinc-600"
                    required
                  />
                </div>
                {state.errors?.fullName ? (
                  <p className="mt-2 text-xs text-rose-400">{state.errors.fullName}</p>
                ) : null}
              </div>

              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4">
                <label className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                  Durum
                </label>
                <select
                  name="status"
                  defaultValue={selectedStatus}
                  className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-zinc-600"
                >
                  <option value="new">Yeni</option>
                  <option value="contacted">Temas kuruldu</option>
                  <option value="qualified">Nitelikli</option>
                  <option value="converted">Dönüştü</option>
                  <option value="lost">Kaybedildi</option>
                </select>
              </div>

              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4">
                <label className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                  E-posta
                </label>
                <input
                  name="email"
                  type="email"
                  defaultValue={String(getFieldValue(state, initialData, "email") ?? "")}
                  placeholder="ornek@mail.com"
                  className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-zinc-600"
                />
                {state.errors?.email ? (
                  <p className="mt-2 text-xs text-rose-400">{state.errors.email}</p>
                ) : null}
              </div>

              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4">
                <label className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                  Telefon
                </label>
                <div className="relative">
                  <Phone
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
                    size={16}
                  />
                  <input
                    name="phoneNumber"
                    defaultValue={String(
                      getFieldValue(state, initialData, "phoneNumber") ?? "",
                    )}
                    placeholder="+90 5xx xxx xx xx"
                    className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 py-3 pl-11 pr-4 text-sm text-zinc-100 outline-none transition focus:border-zinc-600"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4 text-sm text-zinc-200">
                <input
                  name="whatsappOptIn"
                  type="checkbox"
                  defaultChecked={selectedWhatsappOptIn}
                  className="h-4 w-4 rounded border-zinc-700 bg-zinc-950 text-white"
                />
                WhatsApp iletişim onayı var
              </label>
            </div>

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
                onClick={() => router.replace("/admin/leads")}
                className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-300 transition hover:border-zinc-700 hover:text-white"
              >
                Vazgeç
              </button>

              <button
                type="submit"
                disabled={isPending || buildVersionOptions.length === 0}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <CheckCircle2 size={16} />
                {isPending
                  ? "Kaydediliyor..."
                  : initialData
                    ? "Kaydı güncelle"
                    : "Lead oluştur"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}