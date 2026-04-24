"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { archiveProduct, restoreProduct } from "./actions";
import type { ProductStatus } from "./types";

export function DeleteProductDialog({
  productId,
  productName,
  productStatus,
}: {
  productId: string;
  productName: string;
  productStatus: ProductStatus;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const dialogId = `archive-product-dialog-${productId}`;
  const isArchived = productStatus === "archived";

  async function onConfirm() {
    startTransition(async () => {
      await (isArchived ? restoreProduct(productId) : archiveProduct(productId));
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
        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition hover:bg-zinc-900 ${
          isArchived
            ? "border-emerald-900 bg-zinc-950 text-emerald-400"
            : "border-red-900 bg-zinc-950 text-red-400"
        }`}
      >
        {isArchived ? "Geri Al" : "Arşivle"}
      </button>

      <dialog
        id={dialogId}
        className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-0 text-zinc-100 backdrop:bg-black/70"
      >
        <div className="rounded-2xl bg-zinc-950 p-6">
          <h3 className="text-lg font-semibold text-white">
            {isArchived ? "Ürünü Geri Al" : "Ürünü Arşivle"}
          </h3>

          <p className="mt-2 text-sm text-zinc-400">
            <strong className="text-zinc-100">{productName}</strong>{" "}
            {isArchived
              ? "taslak duruma geri alınacak. Bu işlem ürünün belge ve knowledge bağlarını bozmaz."
              : "arşive alınacak. Bu işlem hard delete yapmaz, sadece ürünü aktif akıştan çıkarır."}
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
              onClick={onConfirm}
              className={`rounded-xl px-4 py-2 text-sm font-medium text-white transition disabled:opacity-50 ${
                isArchived
                  ? "bg-emerald-600 hover:bg-emerald-500"
                  : "bg-red-600 hover:bg-red-500"
              }`}
            >
              {pending
                ? isArchived
                  ? "Geri alınıyor..."
                  : "Arşivleniyor..."
                : isArchived
                  ? "Taslağa Geri Al"
                  : "Arşivle"}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
