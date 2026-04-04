"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Phone, User2, Waypoints, X } from "lucide-react";

import { saveLead } from "./action";
import {
  initialLeadFormState,
  type LeadFormState,
  type LeadFormValues,
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

function getMergedValues(
  state: LeadFormState,
  initialData: LeadInitialData,
): LeadFormValues {
  if (initialData) {
    return {
      ...initialData,
      ...state.values,
    };
  }

  return state.values;
}

const inputClassName =
  "w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-zinc-700";

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

  const values = getMergedValues(state, initialData);

  const selectedBuildVersionId = values.buildVersionId;
  const selectedStatus = values.status;
  const selectedWhatsappOptIn = values.whatsappOptIn;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <div className="h-full w-full max-w-2xl overflow-y-auto border-l border-zinc-800 bg-zinc-950 shadow-2xl">
        <div className="flex items-center gap-3 border-b border-zinc-800 px-6 py-4">
          <button
            type="button"
            onClick={() => router.replace("/admin/leads")}
            className="hidden flex-1 cursor-default md:block"
            aria-hidden="true"
          />

          <div className="flex-1 text-center">
            <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-500">
              Admin · Leads
            </p>
            <h2 className="mt-1 text-lg font-semibold text-white">
              {initialData ? "Lead düzenle" : "Yeni lead oluştur"}
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              Lead kaydını doğrudan build version ile bağla ve CRM giriş hattını
              native tablo üstünde tut.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.replace("/admin/leads")}
            className="rounded-2xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 transition hover:border-zinc-700 hover:text-white"
            aria-label="Kapat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form action={formAction} className="space-y-6 px-6 py-6">
          <input type="hidden" name="id" value={values.id} />

          <div className="space-y-2">
            <label
              htmlFor="buildVersionId"
              className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500"
            >
              Build versiyonu
            </label>

            <div className="relative">
              <Waypoints className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <select
                id="buildVersionId"
                name="buildVersionId"
                defaultValue={selectedBuildVersionId}
                className={`${inputClassName} appearance-none pl-11`}
              >
                <option value="">Build versiyonu seç</option>
                {buildVersionOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {state.errors.buildVersionId ? (
              <p className="text-xs text-rose-300">
                {state.errors.buildVersionId}
              </p>
            ) : null}

            {selectedBuildVersionId ? (
              <p className="text-xs text-zinc-500">
                {
                  buildVersionOptions.find(
                    (item) => item.id === selectedBuildVersionId,
                  )?.meta
                }
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="fullName"
              className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500"
            >
              Ad soyad
            </label>

            <div className="relative">
              <User2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                id="fullName"
                name="fullName"
                defaultValue={values.fullName}
                placeholder="Örn. Ahmet Yılmaz"
                className={`${inputClassName} pl-11`}
              />
            </div>

            {state.errors.fullName ? (
              <p className="text-xs text-rose-300">{state.errors.fullName}</p>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="status"
                className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500"
              >
                Durum
              </label>

              <select
                id="status"
                name="status"
                defaultValue={selectedStatus}
                className={inputClassName}
              >
                <option value="new">Yeni</option>
                <option value="contacted">Temas kuruldu</option>
                <option value="qualified">Nitelikli</option>
                <option value="converted">Dönüştü</option>
                <option value="lost">Kaybedildi</option>
              </select>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500"
              >
                E-posta
              </label>

              <input
                id="email"
                name="email"
                type="email"
                defaultValue={values.email}
                placeholder="mail@ornek.com"
                className={inputClassName}
              />

              {state.errors.email ? (
                <p className="text-xs text-rose-300">{state.errors.email}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="phoneNumber"
              className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500"
            >
              Telefon
            </label>

            <div className="relative">
              <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                id="phoneNumber"
                name="phoneNumber"
                defaultValue={values.phoneNumber}
                placeholder="+90 5xx xxx xx xx"
                className={`${inputClassName} pl-11`}
              />
            </div>
          </div>

          <label className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-300">
            <input
              type="checkbox"
              name="whatsappOptIn"
              defaultChecked={selectedWhatsappOptIn}
              className="h-4 w-4 rounded border-zinc-700 bg-zinc-950 text-white"
            />
            WhatsApp iletişim onayı var
          </label>

          {state.message ? (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm ${
                state.ok
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                  : "border-rose-500/20 bg-rose-500/10 text-rose-200"
              }`}
            >
              {state.message}
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-3 border-t border-zinc-800 pt-4">
            <button
              type="button"
              onClick={() => router.replace("/admin/leads")}
              className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-300 transition hover:border-zinc-700 hover:text-white"
            >
              Vazgeç
            </button>

            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CheckCircle2 className="h-4 w-4" />
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
  );
}