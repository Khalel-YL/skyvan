import { Info } from "lucide-react";

type Binding = {
  id: string;
  manufacturerName: string;
  domain: string;
  pathHint: string | null;
  status: string;
  priority: number;
};

function getQualityMeta(pathHint: string | null) {
  if (!pathHint || pathHint.trim() === "") {
    return {
      label: "Zayıf",
      tone: "border-amber-900/60 bg-amber-950/30 text-amber-300",
      description: "Path hint yok. Kaynak geniş ve kontrolsüz.",
    };
  }

  return {
    label: "OK",
    tone: "border-emerald-900/60 bg-emerald-950/30 text-emerald-300",
    description: "Path hint var. Kaynak hedefli.",
  };
}

export function ProductSourceBindingsTable({
  bindings,
}: {
  bindings: Binding[];
}) {
  if (!bindings.length) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6 text-center text-zinc-400">
        Henüz kaynak bağı yok.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {bindings.map((b) => {
        const quality = getQualityMeta(b.pathHint);

        return (
          <div
            key={b.id}
            className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">
                  {b.manufacturerName}
                </p>
                <p className="text-xs text-zinc-500">{b.domain}</p>
              </div>

              <span
                className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${quality.tone}`}
              >
                {quality.label}
              </span>
            </div>

            {b.pathHint ? (
              <p className="text-xs text-zinc-400">
                Path: <span className="text-zinc-300">{b.pathHint}</span>
              </p>
            ) : null}

            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span>Priority: {b.priority}</span>
              <span>{b.status}</span>
            </div>

            <div className="flex items-start gap-2 text-xs text-zinc-500">
              <Info size={14} />
              <p>{quality.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}