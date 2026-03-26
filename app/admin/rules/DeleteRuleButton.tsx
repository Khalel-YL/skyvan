import { deleteRule } from "./actions";

type DeleteRuleButtonProps = {
  id: string;
};

export default function DeleteRuleButton({ id }: DeleteRuleButtonProps) {
  return (
    <form action={deleteRule}>
      <input type="hidden" name="id" value={id} />

      <button
        type="submit"
        className="rounded-full border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-100 transition hover:border-rose-400/40 hover:bg-rose-500/15"
      >
        Kaldır
      </button>
    </form>
  );
}