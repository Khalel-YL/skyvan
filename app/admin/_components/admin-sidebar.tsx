import Link from "next/link";
import { adminNavItems } from "@/app/lib/admin/admin-nav";

const stableRoutes = [
  "/admin",
  "/admin/models",
  "/admin/packages",
  "/admin/build-versions",
  "/admin/products",
  "/admin/rules",
];

const pipelineRoutes = ["/admin/ai", "/admin/workshop", "/admin/categories"];

export function AdminSidebar() {
  return (
    <aside className="hidden w-full max-w-[280px] shrink-0 xl:block">
      <div className="sticky top-6 space-y-4">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-5">
          <div className="text-xs uppercase tracking-[0.22em] text-zinc-500">
            Skyvan
          </div>
          <h1 className="mt-2 text-2xl font-semibold text-white">Admin Core</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Veri, kural ve operasyon omurgası
          </p>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-3">
          <div className="px-2 pb-2 pt-1 text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
            Genel
          </div>

          <div className="space-y-2">
            {adminNavItems
              .filter((item) => stableRoutes.includes(item.href))
              .map((item) => {
                const Icon = item.icon;

                if (!item.enabled) {
                  return (
                    <div
                      key={item.href}
                      className="rounded-2xl border border-zinc-800 bg-zinc-900/70 px-3 py-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-500">
                          <Icon className="h-4 w-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium text-zinc-200">
                              {item.title}
                            </div>
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
                    className="block rounded-2xl border border-zinc-800 bg-zinc-900/70 px-3 py-3 transition hover:border-zinc-700 hover:bg-zinc-900"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-xl border border-zinc-800 bg-zinc-950 p-2 text-zinc-300">
                        <Icon className="h-4 w-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium text-white">
                            {item.title}
                          </div>

                          {item.badge ? (
                            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-emerald-300">
                              {item.badge}
                            </span>
                          ) : null}
                        </div>

                        <p className="mt-1 text-xs leading-5 text-zinc-400">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-3">
          <div className="px-2 pb-2 pt-1 text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
            Sonraki Fazlar
          </div>

          <div className="space-y-2">
            {adminNavItems
              .filter((item) => pipelineRoutes.includes(item.href))
              .map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.href}
                    className="rounded-2xl border border-zinc-800 bg-zinc-900/70 px-3 py-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-500">
                        <Icon className="h-4 w-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium text-zinc-200">
                            {item.title}
                          </div>
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
      </div>
    </aside>
  );
}