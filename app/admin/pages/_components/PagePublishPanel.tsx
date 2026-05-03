"use client";

type PagePublishPanelProps = {
  isPublished: boolean;
  blockers: string[];
  warnings: string[];
  pending: boolean;
  isEdit: boolean;
  onIntentChange: (
    intent: "draft" | "publish" | "keep-published" | "unpublish",
  ) => void;
};

export function PagePublishPanel({
  isPublished,
  blockers,
  warnings,
  pending,
  isEdit,
  onIntentChange,
}: PagePublishPanelProps) {
  function intentHandlers(
    intent: "draft" | "publish" | "keep-published" | "unpublish",
  ) {
    return {
      onMouseDown: () => onIntentChange(intent),
      onClick: () => onIntentChange(intent),
    };
  }

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Yayın kontrolü</h3>
          <p className="mt-1 text-xs text-zinc-500">
            Taslak kaydetme ve yayınlama ayrı aksiyonlardır. Publish blocker varsa yayın kapalı kalır.
          </p>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-[11px] font-medium ${
            isPublished
              ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
              : "border-amber-500/25 bg-amber-500/10 text-amber-200"
          }`}
        >
          {isPublished ? "Current state: Published" : "Current state: Draft"}
        </span>
      </div>

      <div className="mt-4 grid gap-2 text-sm">
        {blockers.length > 0 ? (
          <div className="rounded-2xl border border-rose-900/60 bg-rose-950/30 p-3 text-rose-200">
            <div className="font-medium">Publish blocker</div>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-5">
              {blockers.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="rounded-2xl border border-emerald-900/60 bg-emerald-950/30 p-3 text-sm text-emerald-200">
            Publish için temel kontroller temiz.
          </div>
        )}

        {warnings.length > 0 ? (
          <div className="rounded-2xl border border-amber-900/60 bg-amber-950/30 p-3 text-amber-200">
            <div className="font-medium">Taslak uyarıları</div>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-5">
              {warnings.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <div className="mt-5 grid gap-2">
        {isEdit && isPublished ? (
          <>
            <button
              type="submit"
              name="submitIntent"
              value="keep-published"
              {...intentHandlers("keep-published")}
              disabled={pending || blockers.length > 0}
              className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {pending ? "Kaydediliyor..." : "Yayındaki sayfayı güncelle"}
            </button>
            <button
              type="submit"
              name="submitIntent"
              value="unpublish"
              {...intentHandlers("unpublish")}
              disabled={pending}
              className="rounded-2xl border border-amber-900/70 bg-amber-950/30 px-4 py-3 text-sm font-medium text-amber-200 transition hover:border-amber-700 hover:bg-amber-950/50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? "Taslağa alınıyor..." : "Yayından kaldır / Taslağa al"}
            </button>
          </>
        ) : (
          <>
            <button
              type="submit"
              name="submitIntent"
              value="draft"
              {...intentHandlers("draft")}
              disabled={pending}
              className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm font-medium text-zinc-200 transition hover:border-zinc-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? "Kaydediliyor..." : "Save Draft"}
            </button>
            <button
              type="submit"
              name="submitIntent"
              value="publish"
              {...intentHandlers("publish")}
              disabled={pending || blockers.length > 0}
              className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {pending ? "Yayınlanıyor..." : isEdit ? "Publish changes" : "Publish page"}
            </button>
          </>
        )}
      </div>
    </section>
  );
}
