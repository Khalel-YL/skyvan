"use client";

import { Trash2 } from "lucide-react";

import { deleteDatasheet } from "./actions";

type DeleteDatasheetButtonProps = {
  datasheetId: string;
  disabled?: boolean;
};

export default function DeleteDatasheetButton({
  datasheetId,
  disabled = false,
}: DeleteDatasheetButtonProps) {
  return (
    <form
      action={deleteDatasheet.bind(null, datasheetId)}
      onSubmit={(event) => {
        if (disabled) {
          return;
        }

        const confirmed = window.confirm(
          "Bu datasheet kaydını kaldırmak istediğine emin misin?",
        );

        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        disabled={disabled}
        className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-neutral-300 transition hover:border-rose-500/20 hover:bg-rose-500/10 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </form>
  );
}