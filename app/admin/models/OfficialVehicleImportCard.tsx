import { importOfficialVehicleSeeds } from "./import-actions";
import {
  getOfficialVehicleFamilyCards,
  officialVehicleSeeds,
  type OfficialVehicleImportBatchKey,
} from "./official-vehicle-catalog";

type ImportFeedback = {
  type: "success" | "error";
  message: string;
} | null;

type OfficialVehicleImportCardProps = {
  disabled?: boolean;
  feedback?: ImportFeedback;
};

function compactStatusChip(label: string) {
  return (
    <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-xs text-zinc-400">
      {label}
    </span>
  );
}

function FamilyRow({
  title,
  description,
  count,
  batchKey,
  disabled,
}: {
  title: string;
  description: string;
  count: number;
  batchKey: OfficialVehicleImportBatchKey;
  disabled: boolean;
}) {
  return (
    <form
      action={importOfficialVehicleSeeds}
      className="flex flex-col gap-2 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-3 lg:flex-row lg:items-center lg:justify-between"
    >
      <input type="hidden" name="batchKey" value={batchKey} />

      <div className="min-w-0 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-zinc-100">{title}</p>
          {compactStatusChip(`${count} kayıt`)}
        </div>
        <p className="text-xs leading-5 text-zinc-400">{description}</p>
      </div>

      <button
        type="submit"
        disabled={disabled}
        className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-200 transition hover:border-zinc-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        Bu Aileyi İçeri Al
      </button>
    </form>
  );
}

export function OfficialVehicleImportCard({
  disabled = false,
  feedback = null,
}: OfficialVehicleImportCardProps) {
  const familyCards = getOfficialVehicleFamilyCards();
  const totalSeedCount = officialVehicleSeeds.length;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-3">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="text-xs uppercase tracking-[0.24em] text-zinc-500">
            Model Kataloğu · Resmi Araç Aileleri
          </div>

          <h2 className="text-base font-semibold text-zinc-100">
            Resmi araç ailelerini içeri al
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {compactStatusChip(`${totalSeedCount} kayıt`)}
          {compactStatusChip("Tekrarlı kodları atlar")}
        </div>
      </div>

      {feedback ? (
        <div
          className={`mt-3 rounded-2xl px-3 py-2 text-sm ${
            feedback.type === "success"
              ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-100"
              : "border border-rose-500/20 bg-rose-500/10 text-rose-100"
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      <form
        action={importOfficialVehicleSeeds}
        className="mt-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-3"
      >
        <input type="hidden" name="batchKey" value="large-van-core" />

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-zinc-100">
              Önerilen ilk import
            </p>
            <p className="text-xs text-zinc-400">
              Çekirdek large-van kayıtlarını tek adımda hazırlar.
            </p>
          </div>

          <button
            type="submit"
            disabled={disabled}
            className="rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Çekirdek Aileleri İçeri Al
          </button>
        </div>
      </form>

      <div className="mt-3 grid gap-2">
        {familyCards.map((item) => (
          <FamilyRow
            key={item.key}
            title={item.title}
            description={item.description}
            count={item.seedKeys.length}
            batchKey={item.key}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}
