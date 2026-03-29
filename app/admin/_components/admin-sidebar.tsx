import Link from "next/link";

import { adminNavItems, type AdminNavItem } from "@/app/lib/admin/admin-nav";

function SidebarItem({ item }: { item: AdminNavItem }) {
  const Icon = item.icon;

  if (!item.enabled) {
    return (
      <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 opacity-70">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-white/5 p-2">
            <Icon className="h-4 w-4 text-neutral-300" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-white">{item.title}</p>
              <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300">
                Hazırlık
              </span>
            </div>

            <p className="mt-1 text-xs leading-5 text-neutral-500">
              {item.description}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className="block rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 transition hover:border-white/15 hover:bg-white/[0.05]"
    >
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-white/5 p-2">
          <Icon className="h-4 w-4 text-neutral-200" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-white">{item.title}</p>

            {item.badge ? (
              <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-300">
                {item.badge}
              </span>
            ) : null}
          </div>

          <p className="mt-1 text-xs leading-5 text-neutral-400">
            {item.description}
          </p>
        </div>
      </div>
    </Link>
  );
}

export function AdminSidebar() {
  const stableItems = adminNavItems.filter((item) => item.section === "stable");
  const pipelineItems = adminNavItems.filter(
    (item) => item.section === "pipeline",
  );

  return (
    <aside className="hidden w-80 shrink-0 border-r border-white/10 bg-neutral-950 xl:block">
      <div className="sticky top-0 flex h-screen flex-col">
        <div className="border-b border-white/10 px-6 py-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">
            Skyvan
          </p>

          <h1 className="mt-2 text-2xl font-semibold text-white">
            Admin Core
          </h1>

          <p className="mt-2 text-sm text-neutral-400">
            Veri, kural ve operasyon omurgası
          </p>
        </div>

        <nav className="custom-scrollbar flex-1 space-y-6 overflow-y-auto px-4 py-6">
          <div>
            <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-neutral-600">
              Stabil Admin
            </p>

            <div className="mt-3 space-y-2">
              {stableItems.map((item) => (
                <SidebarItem key={item.href} item={item} />
              ))}
            </div>
          </div>

          <div>
            <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-neutral-600">
              Sıradaki Admin Alanları
            </p>

            <div className="mt-3 space-y-2">
              {pipelineItems.map((item) => (
                <SidebarItem key={item.href} item={item} />
              ))}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
}