"use client";

import { deleteRule } from "./actions";

type DeleteRuleButtonProps = {
  id: string;
};

export default function DeleteRuleButton({ id }: DeleteRuleButtonProps) {
  return (
    <form
      action={deleteRule}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          "Bu kural kaydını kaldırmak istediğine emin misin?",
        );

        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="rounded-full border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-rose-500/40 hover:text-rose-200"
      >
        Kaldır
      </button>
    </form>
  );
}