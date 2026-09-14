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
    <div className="space-y-2">
      <form action={formAction}>
        <input type="hidden" name="buildId" value={buildId} />
        <input type="hidden" name="versionId" value={versionId} />

        <button
          type="submit"
          disabled={isPending}
          className="rounded-2xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-300 transition hover:border-zinc-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Güncelleniyor..." : "Güncel yap"}
        </button>
      </form>

      {state.message ? (
        <p
          role={state.ok ? "status" : "alert"}
          className={`max-w-56 text-xs leading-5 ${
            state.ok ? "text-emerald-300" : "text-rose-300"
          }`}
        >
          {state.message}
        </p>
      ) : null}

      {state.errors?.form || state.errors?.buildId || state.errors?.versionId ? (
        <p role="alert" className="max-w-56 text-xs leading-5 text-rose-300">
          {state.errors.form ?? state.errors.buildId ?? state.errors.versionId}
        </p>
      ) : null}
    </div>
  );
}
