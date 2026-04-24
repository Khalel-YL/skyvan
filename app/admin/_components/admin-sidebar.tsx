import Link from "next/link";

import { adminNavItems } from "@/app/lib/admin/admin-nav";

export function AdminSidebar() {
  const stableItems = adminNavItems.filter((item) => item.section === "stable");
  const pipelineItems = adminNavItems.filter((item) => item.section === "pipeline");

  return (
    <aside className="hidden w-80 shrink-0 border-r border-zinc-900 bg-black/30 xl:block">
      <div className="sticky top-0 flex h-screen flex-col">
        <div className="border-b border-zinc-900 px-6 py-6">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">
              Skyvan
            </p>
            <h1 className="mt-3 text-2xl font-semibold text-white">Admin Core</h1>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Veri, kural ve operasyon omurgası
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5">
          {stableItems.length > 0 ? (
            <div>
              <p className="px-3 text-xs uppercase tracking-[0.24em] text-zinc-600">
                Genel
              </p>

              <div className="mt-3 space-y-2">
                {stableItems.map((item) => {
                  const Icon = item.icon;

                  if (!item.enabled) {
                    return (
                      <div
                        key={item.href}
                        className="rounded-3xl border border-zinc-900 bg-zinc-950/50 px-4 py-4 opacity-60"
                      >
                        <div className="flex items-start gap-3">
                          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-2.5 text-zinc-500">
                            <Icon className="h-4 w-4" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-zinc-200">
                                {item.title}
                              </p>
                              <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                                Yakında
                              </span>
                            </div>

                            <p className="mt-1 text-xs leading-5 text-zinc-500">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block rounded-3xl border border-zinc-800 bg-zinc-950/60 px-4 py-4 transition hover:border-zinc-700 hover:bg-zinc-950"
                    >
                      <div className="flex items-start gap-3">
                        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-2.5 text-zinc-300">
                          <Icon className="h-4 w-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-white">
                              {item.title}
                            </p>

                            {item.badge ? (
                              <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-zinc-400">
                                {item.badge}
                              </span>
                            ) : null}
                          </div>

                          <p className="mt-1 text-xs leading-5 text-zinc-500">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : null}

          {pipelineItems.length > 0 ? (
            <div className="mt-8">
              <p className="px-3 text-xs uppercase tracking-[0.24em] text-zinc-600">
                Sonraki Fazlar
              </p>

              <div className="mt-3 space-y-2">
                {pipelineItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.href}
                      className="rounded-3xl border border-zinc-900 bg-zinc-950/40 px-4 py-4 opacity-75"
                    >
                      <div className="flex items-start gap-3">
                        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-2.5 text-zinc-500">
                          <Icon className="h-4 w-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-zinc-300">
                              {item.title}
                            </p>
                            <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                              Kilitli
                            </span>
                          </div>

                          <p className="mt-1 text-xs leading-5 text-zinc-500">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
