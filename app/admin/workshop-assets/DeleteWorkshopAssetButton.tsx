"use client";

import { Trash2 } from "lucide-react";

import { deleteWorkshopAsset } from "./actions";

export default function DeleteWorkshopAssetButton({ id }: { id: string }) {
  return (
    <form action={deleteWorkshopAsset}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-xs font-medium text-rose-100 transition hover:bg-rose-500/15"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Sil
      </button>
    </form>
  );
}
