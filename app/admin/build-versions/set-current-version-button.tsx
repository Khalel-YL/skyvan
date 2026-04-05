"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { setBuildCurrentVersion } from "./actions";
import { initialBuildCurrentVersionFormState } from "./types";

type BuildCurrentVersionButtonProps = {
  buildId: string;
  versionId: string;
  isCurrent: boolean;
};

export function BuildCurrentVersionButton({
  buildId,
  versionId,
  isCurrent,
}: BuildCurrentVersionButtonProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    setBuildCurrentVersion,
    initialBuildCurrentVersionFormState,
  );

  useEffect(() => {
    if (state.ok) {
      router.refresh();
    }
  }, [router, state.ok]);

  if (isCurrent) {
    return (
      <span className="inline-flex rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-200">
        Aktif
      </span>
    );
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="buildId" value={buildId} />
      <input type="hidden" name="versionId" value={versionId} />

      <button
        type="submit"
        disabled={isPending}
        className="rounded-2xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-300 transition hover:border-zinc-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Güncelleniyor..." : "Current yap"}
      </button>
    </form>
  );
}