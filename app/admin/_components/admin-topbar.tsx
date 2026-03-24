import Link from "next/link";
import { ExternalLink, ShieldCheck } from "lucide-react";

type AdminTopbarProps = {
  databaseStatus: "online" | "degraded";
  databaseNote: string;
};

export function AdminTopbar({
  databaseStatus,
  databaseNote,
}: AdminTopbarProps) {
  const isOnline = databaseStatus === "online";

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-black/45 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4 px-5 py-4 md:px-8">
        <div>
          <div className="text-xs uppercase tracking-[0.24em] text-white/35">
            Skyvan OS
          </div>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-white">
            Admin Stabilization
          </h1>
          <p className="mt-1 text-sm text-white/50">{databaseNote}</p>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={[
              "rounded-full border px-3 py-1.5 text-xs font-medium",
              isOnline
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : "border-amber-500/30 bg-amber-500/10 text-amber-300",
            ].join(" ")}
          >
            {isOnline ? "DB Online" : "DB Degraded"}
          </div>

          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/65 md:flex">
            <ShieldCheck className="h-3.5 w-3.5" />
            Production-safe shell
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/75 transition hover:bg-white/10 hover:text-white"
          >
            Public
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}