"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  archiveProductDocument,
  restoreProductDocument,
} from "./actions";
import type {
  ProductDocumentActionState,
  ProductDocumentListItem,
} from "./types";

const initialState: ProductDocumentActionState = {
  ok: false,
  message: "",
};

export function ArchiveProductDocumentDialog({
  document,
}: {
  document: ProductDocumentListItem;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<ProductDocumentActionState>(initialState);

  const isArchived = document.status === "archived";

  function handleConfirm() {
    startTransition(async () => {
      const result = isArchived
        ? await restoreProductDocument(document.id, document.productId)
        : await archiveProductDocument(document.id, document.productId);

      setState(result);

      if (result.ok) {
        setIsOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setState(initialState);
          setIsOpen(true);
        }}
        className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium transition ${
          isArchived
            ? "border-green-800 bg-green-950 text-green-300 hover:border-green-700"
            : "border-amber-800 bg-amber-950 text-amber-300 hover:border-amber-700"
        }`}
      >
        {isArchived ? "Aktifleştir" : "Arşivle"}
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
            <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
              Product Documents
            </p>

            <h3 className="mt-3 text-xl font-semibold text-zinc-100">
              {isArchived ? "Belgeyi aktifleştir" : "Belgeyi arşivle"}
            </h3>

            <p className="mt-2 text-sm text-zinc-400">
              <span className="font-medium text-zinc-200">{document.title}</span>{" "}
              için bu işlem uygulanacak.
            </p>

            <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm text-zinc-400">
              {isArchived
                ? "Bu belge tekrar aktif duruma alınacak ve aktif filtrede görünür olacak."
                : "Bu belge silinmez. Sadece arşiv durumuna alınır ve aktif filtrede görünmez."}
            </div>

            {state.message ? (
              <div
                className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
                  state.ok
                    ? "border-green-800 bg-green-950 text-green-300"
                    : "border-red-900 bg-red-950 text-red-300"
                }`}
              >
                {state.message}
              </div>
            ) : null}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-100"
              >
                Vazgeç
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                disabled={isPending}
                className={`rounded-full px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  isArchived
                    ? "border border-green-200 bg-green-100 text-green-900 hover:bg-white"
                    : "border border-amber-200 bg-amber-100 text-amber-900 hover:bg-white"
                }`}
              >
                {isPending
                  ? isArchived
                    ? "Aktifleştiriliyor..."
                    : "Arşivleniyor..."
                  : isArchived
                  ? "Aktifleştir"
                  : "Arşivle"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
