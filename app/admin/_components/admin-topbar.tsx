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
    <header className="sticky top-0 z-20 border-b border-white/10 bg-neutral-950/85 backdrop-blur">
      <div className="flex flex-col gap-3 px-4 py-4 md:px-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">
              Stabilizasyon Aşaması
            </p>

            <h2 className="mt-1 text-lg font-semibold text-white">
              Admin çekirdeği güvenli modda
            </h2>
          </div>

          <div
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${
              isOnline
                ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
                : "border-amber-500/25 bg-amber-500/10 text-amber-300"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isOnline ? "bg-emerald-400" : "bg-amber-400"
              }`}
            />

            {isOnline ? "Veritabanı Hazır" : "Güvenli Mod"}
          </div>
        </div>

        <p className="text-sm text-neutral-400">{databaseNote}</p>
      </div>
    </header>
  );
}