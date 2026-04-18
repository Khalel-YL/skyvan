"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { ingestProductDocumentToAi } from "./actions";
import type {
  ProductDocumentActionState,
  ProductDocumentListItem,
} from "./types";

const initialState: ProductDocumentActionState = {
  ok: false,
  message: "",
};

function getButtonLabel(document: ProductDocumentListItem) {
  if (document.aiParsingStatus === "completed") {
    return "Yeniden İşle";
  }

  if (document.aiParsingStatus === "failed") {
    return "Tekrar Dene";
  }

  if (document.aiParsingStatus === "processing") {
    return "Zorla Yeniden İşle";
  }

  return "AI İşle";
}

function getButtonClassName(document: ProductDocumentListItem) {
  if (document.status !== "active") {
    return "border-zinc-800 bg-zinc-900 text-zinc-500";
  }

  if (document.aiParsingStatus === "completed") {
    return "border-sky-500/20 bg-sky-500/10 text-sky-200 hover:bg-sky-500/15";
  }

  if (document.aiParsingStatus === "failed") {
    return "border-rose-500/20 bg-rose-500/10 text-rose-200 hover:bg-rose-500/15";
  }

  if (document.aiParsingStatus === "processing") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-200 hover:bg-amber-500/15";
  }

  return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/15";
}

export function AiIngestProductDocumentButton({
  document,
}: {
  document: ProductDocumentListItem;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<ProductDocumentActionState>(initialState);
  const canIngest = document.status === "active";

  function handleClick() {
    if (!canIngest) {
      return;
    }

    startTransition(async () => {
      const result = await ingestProductDocumentToAi(document.id);
      setState(result);

      if (result.ok) {
        router.refresh();
      }
    });
  }

  const message =
    !canIngest
      ? "Belge aktif değil, AI işleme alınamaz."
      : !state.ok && state.message
        ? state.message
        : document.aiLastError;

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending || !canIngest}
        className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${getButtonClassName(
          document,
        )}`}
      >
        {isPending ? "İşleniyor..." : getButtonLabel(document)}
      </button>

      {message ? (
        <div className="max-w-[240px] text-[11px] leading-5 text-zinc-500">
          {message}
        </div>
      ) : null}
    </div>
  );
}
