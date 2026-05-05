"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import {
  FileDigit,
  Link as LinkIcon,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";

import { saveDatasheet } from "./actions";
import { simulateDatasheetInput } from "./validation";

type ProductOption = {
  id: string;
  sku: string;
  name: string;
  status: string;
};

type InitialData = {
  id: string;
  productId: string | null;
  title: string;
  docType: "datasheet" | "manual" | "rulebook";
  parsingStatus: "pending" | "processing" | "completed" | "failed";
  s3Key: string;
};

type FieldName = "title" | "docType" | "parsingStatus" | "s3Key";

type DatasheetActionState = {
  status: "idle" | "error";
  message: string | null;
  fieldErrors: Partial<Record<FieldName, string>>;
};

type AddDatasheetDrawerProps = {
  initialData?: InitialData | null;
  availableProducts: ProductOption[];
  disabled?: boolean;
};

const initialDatasheetActionState: DatasheetActionState = {
  status: "idle",
  message: null,
  fieldErrors: {},
};

const docTypeOptions = [
  { value: "datasheet", label: "Teknik datasheet" },
  { value: "manual", label: "Kullanım kılavuzu" },
  { value: "rulebook", label: "Kural kitabı" },
] as const;

const parsingStatusOptions = [
  { value: "pending", label: "Bekliyor" },
  { value: "processing", label: "İşleniyor" },
  { value: "completed", label: "Tamamlandı" },
  { value: "failed", label: "Hatalı" },
] as const;

function toVisibleCopy(value: string) {
  return value
    .replaceAll("storage anahtarı", "depo anahtarı")
    .replaceAll("Storage anahtarı", "Depo anahtarı")
    .replaceAll("s3Key", "belge anahtarı")
    .replaceAll("AI parsing, chunking ve embedding pipeline", "AI analiz hattı");
}

export default function AddDatasheetDrawer({
  initialData,
  availableProducts,
  disabled = false,
}: AddDatasheetDrawerProps) {
  const isEdit = Boolean(initialData?.id);

  const [draftTitle, setDraftTitle] = useState(initialData?.title ?? "");
  const [draftS3Key, setDraftS3Key] = useState(initialData?.s3Key ?? "");

  const [state, formAction, isPending] = useActionState(
    saveDatasheet,
    initialDatasheetActionState,
  );

  const simulation = useMemo(
    () =>
      simulateDatasheetInput({
        title: draftTitle,
        s3Key: draftS3Key,
      }),
    [draftTitle, draftS3Key],
  );

  const simulationTone = simulation.accepted
    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
    : "border-rose-500/20 bg-rose-500/10 text-rose-200";

  const keyTone =
    simulation.keyKind === "blocked"
      ? "border-rose-500/20 bg-rose-500/10 text-rose-200"
      : simulation.keyKind === "web"
        ? "border-sky-500/20 bg-sky-500/10 text-sky-200"
        : "border-amber-500/20 bg-amber-500/10 text-amber-200";

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-200">
            <FileDigit className="h-3.5 w-3.5" />
            {isEdit ? "Düzenleme" : "Yeni kayıt"}
          </div>

          <h2 className="mt-2 text-base font-semibold text-white">
            {isEdit ? "Datasheet kaydını güncelle" : "Yeni teknik doküman kaydı"}
          </h2>

          <p className="mt-1 text-xs leading-5 text-neutral-400">
            Belge envanteri, güvenli bağlantı ve ürün bağı.
          </p>
        </div>

        {isEdit ? (
          <Link
            href="/admin/datasheets"
            className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-neutral-300 transition hover:bg-white/[0.06] hover:text-white"
          >
            <X className="h-4 w-4" />
          </Link>
        ) : null}
      </div>

      {disabled ? (
        <div className="mt-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          Veritabanı çevrimdışı olduğu için kayıt işlemi pasif.
        </div>
      ) : null}

      {state.status === "error" && state.message ? (
        <div className="mt-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {state.message}
        </div>
      ) : null}

      <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs leading-5 text-emerald-200">
        <div className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            Aynı belge bağlantısı ikinci kez kaydedilmez. Riskli bağlantı
            şemaları da güvenlik için engellenir.
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3">
        <div className="flex items-start gap-2">
          <Sparkles className="mt-0.5 h-4 w-4 text-sky-300" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-white">
              Canlı ön kontrol
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <span
            className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${simulationTone}`}
          >
            {simulation.accepted ? "Kayda uygun" : "Kayıt reddedilir"}
          </span>

          <span
            className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${keyTone}`}
          >
            {toVisibleCopy(simulation.label)}
          </span>
        </div>

        <p className="mt-2 text-xs leading-5 text-neutral-300">
          {toVisibleCopy(simulation.reason)}
        </p>

      </div>

      <form action={formAction} className="mt-4 space-y-3">
        {isEdit ? (
          <input type="hidden" name="id" value={initialData?.id ?? ""} />
        ) : null}

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Bağlantılı ürün
          </label>

          <select
            name="productId"
            defaultValue={initialData?.productId ?? ""}
            disabled={disabled || isPending}
            className="w-full rounded-xl border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-white outline-none transition focus:border-sky-500/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="">Genel doküman</option>

            {availableProducts.map((product) => (
              <option key={product.id} value={product.id}>
                {product.sku} · {product.name}
                {product.status === "archived" ? " (Arşiv)" : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Doküman başlığı
          </label>

          <input
            name="title"
            value={draftTitle}
            onChange={(event) => setDraftTitle(event.target.value)}
            disabled={disabled || isPending}
            placeholder="Örn: MultiPlus-II 3000VA Teknik Datasheet"
            className="w-full rounded-xl border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-white outline-none transition placeholder:text-neutral-500 focus:border-sky-500/40 disabled:cursor-not-allowed disabled:opacity-60"
          />

          {state.fieldErrors.title ? (
            <p className="text-xs text-rose-300">{state.fieldErrors.title}</p>
          ) : null}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
              Doküman tipi
            </label>

            <select
              name="docType"
              defaultValue={initialData?.docType ?? "datasheet"}
              disabled={disabled || isPending}
              className="w-full rounded-xl border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-white outline-none transition focus:border-sky-500/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {docTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {state.fieldErrors.docType ? (
              <p className="text-xs text-rose-300">{state.fieldErrors.docType}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
              Analiz durumu
            </label>

            <select
              name="parsingStatus"
              defaultValue={initialData?.parsingStatus ?? "pending"}
              disabled={disabled || isPending}
              className="w-full rounded-xl border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-white outline-none transition focus:border-sky-500/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {parsingStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {state.fieldErrors.parsingStatus ? (
              <p className="text-xs text-rose-300">
                {state.fieldErrors.parsingStatus}
              </p>
            ) : null}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Belge bağlantısı / depo anahtarı
          </label>

          <div className="relative">
            <LinkIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            <input
              name="s3Key"
              value={draftS3Key}
              onChange={(event) => setDraftS3Key(event.target.value)}
              disabled={disabled || isPending}
              placeholder="https://... veya depo/yol/belge.pdf"
              className="w-full rounded-xl border border-white/10 bg-neutral-950 py-2 pl-11 pr-3 text-sm text-white outline-none transition placeholder:text-neutral-500 focus:border-sky-500/40 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          <p className="text-xs leading-5 text-neutral-500">
            Web bağlantısı veya sistem içi depo anahtarı.
          </p>

          {state.fieldErrors.s3Key ? (
            <p className="text-xs text-rose-300">{state.fieldErrors.s3Key}</p>
          ) : null}
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs leading-5 text-neutral-400">
          AI analiz hattı için kayıt ve ön kontrol görünürlüğü sağlar.
        </div>

        <button
          type="submit"
          disabled={disabled || isPending}
          className="inline-flex w-full items-center justify-center rounded-xl border border-sky-500/20 bg-sky-500/10 px-3 py-2.5 text-sm font-medium text-sky-100 transition hover:border-sky-500/30 hover:bg-sky-500/15 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending
            ? "Kaydediliyor..."
            : isEdit
              ? "Doküman kaydını güncelle"
              : "Doküman kaydını oluştur"}
        </button>
      </form>
    </section>
  );
}
