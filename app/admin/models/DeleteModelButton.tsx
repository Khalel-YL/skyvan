import { archiveModel, restoreModel } from "./actions";
import type { ModelStatus } from "./types";

type DeleteModelButtonProps = {
  id: string;
  status: ModelStatus;
};

export default function DeleteModelButton({
  id,
  status,
}: DeleteModelButtonProps) {
  const isArchived = status === "archived";
  const action = isArchived ? restoreModel : archiveModel;

  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />

      <button
        type="submit"
        className={
          isArchived
            ? "rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-100 transition hover:border-emerald-400/40 hover:bg-emerald-500/15"
            : "rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-100 transition hover:border-amber-400/40 hover:bg-amber-500/15"
        }
      >
        {isArchived ? "Geri Al" : "Arşivle"}
      </button>
    </form>
  );
}