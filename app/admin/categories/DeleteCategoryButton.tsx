"use client";

import { useTransition } from "react";
import { Archive, Trash2 } from "lucide-react";

import { deleteCategory } from "./actions";

type DeleteCategoryButtonProps = {
  id: string;
  name: string;
};

export default function DeleteCategoryButton({
  id,
  name,
}: DeleteCategoryButtonProps) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        const confirmed = window.confirm(
          `"${name}" kategorisini kaldırmak istediğine emin misin?\n\nBağlı veri varsa sistem hard delete yerine kaydı arşive alır.`,
        );

        if (!confirmed) {
          return;
        }

        startTransition(async () => {
          await deleteCategory(id);
        });
      }}
      className="inline-flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-1.5 text-xs font-medium text-red-200 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <>
          <Archive className="h-3.5 w-3.5" />
          İşleniyor...
        </>
      ) : (
        <>
          <Trash2 className="h-3.5 w-3.5" />
          Kaldır
        </>
      )}
    </button>
  );
}
