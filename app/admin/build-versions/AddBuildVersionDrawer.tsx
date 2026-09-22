"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Boxes, CheckCircle2, Layers3, Waypoints, X } from "lucide-react";

import { saveBuildVersion } from "./actions";
import {
  initialBuildVersionFormState,
  type BuildVersionFormMode,
} from "./types";

type BuildOption = {
  id: string;
  label: string;
  meta: string;
  modelId: string;
};

type ModelOption = {
  id: string;
  label: string;
};

type PackageOption = {
  id: string;
  label: string;
  meta: string;
  modelId: string | null;
};

type AddBuildVersionDrawerProps = {
  buildOptions: BuildOption[];
  modelOptions: ModelOption[];
  packageOptions: PackageOption[];
  initialBuildId?: string;
};

export function AddBuildVersionDrawer({
  buildOptions,
  modelOptions,
  packageOptions,
  initialBuildId = "",
}: AddBuildVersionDrawerProps) {
  const router = useRouter();
  const initialMode: BuildVersionFormMode =
    initialBuildId && buildOptions.some((option) => option.id === initialBuildId)
      ? "existing_build"
      : "new_build";

  const [state, formAction, isPending] = useActionState(
    saveBuildVersion,
    {
      ...initialBuildVersionFormState,
      values: {
        ...initialBuildVersionFormState.values,
        mode: initialMode,
        buildId: initialMode === "existing_build" ? initialBuildId : "",
      },
    },
  );

  const [selectedMode, setSelectedMode] = useState<BuildVersionFormMode>(initialMode);
  const [selectedBuildId, setSelectedBuildId] = useState(
    initialMode === "existing_build" ? initialBuildId : "",
  );
  const [selectedShortCode, setSelectedShortCode] = useState("");
  const [selectedModelId, setSelectedModelId] = useState("");
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [selectedSnapshot, setSelectedSnapshot] = useState("");

  useEffect(() => {
    if (state.ok) {
      router.replace("/admin/build-versions");
      router.refresh();
    }
  }, [router, state.ok]);

  const selectedBuild = buildOptions.find((item) => item.id === selectedBuildId) ?? null;

  const resolvedModelId =
    selectedMode === "new_build" ? selectedModelId : selectedBuild?.modelId ?? "";

  const filteredPackages = useMemo(() => {
    if (!resolvedModelId) {
      return packageOptions.filter((item) => item.modelId === null);
    }

    return packageOptions.filter(
      (item) => item.modelId === null || item.modelId === resolvedModelId,
    );
  }, [packageOptions, resolvedModelId]);

  function selectMode(nextMode: BuildVersionFormMode) {
    setSelectedMode(nextMode);
    setSelectedPackageId("");

    if (nextMode === "new_build") {
      setSelectedBuildId("");
      return;
    }

    setSelectedShortCode("");
    setSelectedModelId("");
  }

  function selectModel(nextModelId: string) {
    setSelectedModelId(nextModelId);

    if (
      selectedPackageId &&
      !packageOptions.some(
        (option) =>
          option.id === selectedPackageId &&
          (option.modelId === null || option.modelId === nextModelId),
      )
    ) {
      setSelectedPackageId("");
    }
  }

  function selectBuild(nextBuildId: string) {
    setSelectedBuildId(nextBuildId);
    const nextBuild = buildOptions.find((option) => option.id === nextBuildId);

    if (
      selectedPackageId &&
      !packageOptions.some(
        (option) =>
          option.id === selectedPackageId &&
          (option.modelId === null || option.modelId === nextBuild?.modelId),
      )
    ) {
      setSelectedPackageId("");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <button
        type="button"
        aria-label="Kapat"
        onClick={() => router.replace("/admin/build-versions")}
        className="hidden flex-1 cursor-default bg-black/60 md:block"
      />

      <div className="ml-auto flex h-full w-full max-w-2xl flex-col border-l border-zinc-800 bg-zinc-950 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-800 px-5 py-4">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">
              Admin · Build Versiyonları
            </div>
            <h2 className="mt-2 text-xl font-semibold text-white">
              Yeni build versiyonu oluştur
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Build ve versiyon bağı gerçek şemaya sadık şekilde burada yönetilir.
              Her yeni versiyon, güncel versiyon bağını da doğal olarak günceller.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.replace("/admin/build-versions")}
            className="rounded-2xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 transition hover:border-zinc-700 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form action={formAction} className="flex-1 overflow-y-auto px-5 py-5">
          <div className="space-y-5">
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white">
                <Waypoints className="h-4 w-4 text-zinc-400" />
                Kayıt modu
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
                  <input
                    type="radio"
                    name="mode"
                    value="new_build"
                    checked={selectedMode === "new_build"}
                    onChange={() => selectMode("new_build")}
                    className="sr-only"
                  />
                  <div className="text-sm font-medium text-white">Yeni build</div>
                  <p className="mt-1 text-xs leading-5 text-zinc-400">
                    Yeni build aç ve ilk version kaydını oluştur.
                  </p>
                </label>

                <label
                  className={`rounded-2xl border p-4 ${
                    buildOptions.length > 0
                      ? "border-zinc-800 bg-zinc-950/70"
                      : "border-zinc-900 bg-zinc-950/40 opacity-60"
                  }`}
                >
                  <input
                    type="radio"
                    name="mode"
                    value="existing_build"
                    checked={selectedMode === "existing_build"}
                    onChange={() => selectMode("existing_build")}
                    disabled={buildOptions.length === 0}
                    className="sr-only"
                  />
                  <div className="text-sm font-medium text-white">
                    Mevcut build’e yeni version
                  </div>
                  <p className="mt-1 text-xs leading-5 text-zinc-400">
                    Var olan build üstüne yeni version numarası ekle.
                  </p>
                </label>
              </div>

              {state.errors?.mode ? (
                <p className="mt-3 text-xs text-rose-300">{state.errors.mode}</p>
              ) : null}
            </div>

            {selectedMode === "new_build" ? (
              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4">
                <div className="mb-4 flex items-center gap-2 text-sm font-medium text-white">
                  <Layers3 className="h-4 w-4 text-zinc-400" />
                  Build bilgisi
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">
                      Build kısa kodu
                    </label>
                    <input
                      name="shortCode"
                      value={selectedShortCode}
                      onChange={(event) => setSelectedShortCode(event.target.value)}
                      placeholder="PSA-L2-1"
                      className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-zinc-700"
                    />
                    {state.errors?.shortCode ? (
                      <p className="mt-2 text-xs text-rose-300">
                        {state.errors.shortCode}
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">
                      Model
                    </label>
                    <select
                      name="modelId"
                      value={selectedModelId}
                      onChange={(event) => selectModel(event.target.value)}
                      className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-zinc-700"
                    >
                      <option value="">Model seç</option>
                      {modelOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {state.errors?.modelId ? (
                      <p className="mt-2 text-xs text-rose-300">
                        {state.errors.modelId}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4">
                <div className="mb-4 flex items-center gap-2 text-sm font-medium text-white">
                  <Waypoints className="h-4 w-4 text-zinc-400" />
                  Mevcut build seçimi
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">
                    Build
                  </label>
                  <select
                    name="buildId"
                    value={selectedBuildId}
                    onChange={(event) => selectBuild(event.target.value)}
                    className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-zinc-700"
                  >
                    <option value="">Build seç</option>
                    {buildOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  {state.errors?.buildId ? (
                    <p className="mt-2 text-xs text-rose-300">
                      {state.errors.buildId}
                    </p>
                  ) : null}

                  {selectedBuild ? (
                    <p className="mt-3 text-xs leading-5 text-zinc-400">
                      {selectedBuild.meta}
                    </p>
                  ) : null}
                </div>
              </div>
            )}

            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4">
              <div className="mb-4 flex items-center gap-2 text-sm font-medium text-white">
                <Boxes className="h-4 w-4 text-zinc-400" />
                Versiyon bilgisi
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">
                    Paket
                  </label>
                  <select
                    name="packageId"
                    value={selectedPackageId}
                    onChange={(event) => setSelectedPackageId(event.target.value)}
                    className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-zinc-700"
                  >
                    <option value="">Paket yok</option>
                    {filteredPackages.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  {state.errors?.packageId ? (
                    <p className="mt-2 text-xs text-rose-300">
                      {state.errors.packageId}
                    </p>
                  ) : null}

                  {selectedPackageId ? (
                    <p className="mt-3 text-xs leading-5 text-zinc-400">
                      {
                        filteredPackages.find((item) => item.id === selectedPackageId)
                          ?.meta
                      }
                    </p>
                  ) : (
                    <p className="mt-3 text-xs leading-5 text-zinc-500">
                      Paket alanı opsiyoneldir. Global paketler veya seçilen modele
                      bağlı paketler gösterilir.
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">
                    State snapshot / not (opsiyonel)
                  </label>
                  <textarea
                    name="stateSnapshot"
                    value={selectedSnapshot}
                    onChange={(event) => setSelectedSnapshot(event.target.value)}
                    rows={8}
                    placeholder={'{"note":"ikinci versiyon denemesi"} veya kısa düz not'}
                    className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-zinc-700"
                  />
                  <p className="mt-2 text-xs leading-5 text-zinc-500">
                    JSON yazabilirsin. Düz metin yazarsan sistem bunu otomatik olarak
                    not formatına çevirir.
                  </p>
                  {state.errors?.stateSnapshot ? (
                    <p className="mt-2 text-xs text-rose-300">
                      {state.errors.stateSnapshot}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            {state.errors?.form ? (
              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {state.errors.form}
              </div>
            ) : null}

            {state.message ? (
              <div
                className={`rounded-2xl border px-4 py-3 text-sm ${
                  state.ok
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                    : "border-zinc-800 bg-zinc-900 text-zinc-300"
                }`}
              >
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{state.message}</span>
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 border-t border-zinc-800 pt-5">
            <button
              type="button"
              onClick={() => router.replace("/admin/build-versions")}
              className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-300 transition hover:border-zinc-700 hover:text-white"
            >
              Vazgeç
            </button>

            <button
              type="submit"
              disabled={isPending}
              className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? "Kaydediliyor..." : "Build version oluştur"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
