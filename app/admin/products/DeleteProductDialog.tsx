"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { archiveProduct } from "./actions";

export function DeleteProductDialog({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const dialogId = `archive-product-dialog-${productId}`;

  async function onArchive() {
    startTransition(async () => {
      await archiveProduct(productId);
      (document.getElementById(dialogId) as HTMLDialogElement | null)?.close();
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() =>
          (document.getElementById(dialogId) as HTMLDialogElement | null)?.showModal()
        }
        className="rounded-lg border border-red-900 bg-zinc-950 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-zinc-900"
      >
        Arşivle
      </button>

      <dialog
        id={dialogId}
        className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-0 text-zinc-100 backdrop:bg-black/70"
      >
        <div className="rounded-2xl bg-zinc-950 p-6">
          <h3 className="text-lg font-semibold text-white">Ürünü Arşivle</h3>

          <p className="mt-2 text-sm text-zinc-400">
            <strong className="text-zinc-100">{productName}</strong> arşive alınacak.
            Bu işlem hard delete yapmaz, sadece ürünü aktif akıştan çıkarır.
          </p>

          <div className="mt-5 flex items-center justify-end gap-2">
            <button
              type="button"
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-200 transition hover:bg-zinc-800"
              onClick={() =>
                (document.getElementById(dialogId) as HTMLDialogElement | null)?.close()
              }
            >
              Vazgeç
            </button>

            <button
              type="button"
              disabled={pending}
              onClick={onArchive}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-50"
            >
              {pending ? "Arşivleniyor..." : "Arşivle"}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}