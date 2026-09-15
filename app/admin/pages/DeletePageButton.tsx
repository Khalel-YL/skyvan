"use client";

import { Trash2 } from "lucide-react";

import { deletePage } from "./actions";

export default function DeletePageButton({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  return (
    <form
      action={deletePage.bind(null, id)}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          `"${title}" sayfa kaydı silinecek. Yayındaki kayıtlar silinemez; bu işlem geri alınamaz. Devam edilsin mi?`,
        );

        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="inline-flex items-center gap-1.5 rounded-full border border-rose-900/60 bg-rose-950/30 px-2.5 py-1.5 text-xs text-rose-200 transition hover:border-rose-800 hover:bg-rose-950/60"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Sil
      </button>
    </form>
  );
}
