"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";

import { deleteModel } from "./actions";

type DeleteModelButtonProps = {
  id: string;
  slug: string;
};

export default function DeleteModelButton({
  id,
  slug,
}: DeleteModelButtonProps) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        const confirmed = window.confirm(
          `"${slug}" modelini silmek istediğine emin misin?\n\nBu işlem geri alınamaz.`,
        );

        if (!confirmed) {
          return;
        }

        startTransition(async () => {
          await deleteModel(id);
        });
      }}
      className="inline-flex items-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-200 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Trash2 className="h-3.5 w-3.5" />
      {pending ? "Siliniyor..." : "Sil"}
    </button>
  );
}