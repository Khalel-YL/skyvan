"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteModel } from "./actions";

export function DeleteModelButton({
  id,
  slug,
}: {
  id: string;
  slug: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    const confirmed = window.confirm(
      `${slug} kaydını kaldırmak istediğine emin misin?`
    );

    if (!confirmed) return;

    startTransition(async () => {
      try {
        await deleteModel(id);
        router.refresh();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Model silinemedi. Kayıt başka veriyle bağlı olabilir.";

        window.alert(message);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="rounded-full border border-red-900/70 bg-red-950/40 px-4 py-2 text-sm font-medium text-red-300 transition hover:border-red-800 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isPending ? "Kaldırılıyor..." : "Kaldır"}
    </button>
  );
}