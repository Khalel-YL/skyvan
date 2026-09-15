"use client";

import { Images, Sparkles } from "lucide-react";
import { useFormStatus } from "react-dom";

import { syncCuratedSkyvanMedia } from "./curated-actions";

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-100 transition hover:border-amber-400/50 hover:bg-amber-500/15 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? <Sparkles className="h-4 w-4 animate-pulse" /> : <Images className="h-4 w-4" />}
      {pending ? "İçe aktarılıyor…" : "Skyvan görsellerini bağla"}
    </button>
  );
}

export default function SyncCuratedMediaButton({ disabled = false }: { disabled?: boolean }) {
  return (
    <form action={syncCuratedSkyvanMedia}>
      <SubmitButton disabled={disabled} />
    </form>
  );
}
