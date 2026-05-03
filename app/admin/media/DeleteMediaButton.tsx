"use client";

import { Trash2 } from "lucide-react";

import { deleteMedia } from "./actions";

export default function DeleteMediaButton({ mediaId }: { mediaId: string }) {
  return (
    <form
      action={deleteMedia.bind(null, mediaId)}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          "Bu medya kaydı silinecek. Bu işlem geri alınamaz. Devam edilsin mi?",
        );

        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="rounded-xl border border-zinc-800 bg-zinc-950 p-2.5 text-zinc-300 transition hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-200"
        title="Medya kaydını sil"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </form>
  );
}
