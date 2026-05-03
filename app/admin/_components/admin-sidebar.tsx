import { AdminSidebarClient } from "./admin-sidebar-client";

export function AdminSidebar() {
  return (
    <aside className="hidden w-[21rem] shrink-0 border-r border-[var(--admin-border)] bg-[var(--admin-rail)] xl:block">
      <div className="sticky top-0 flex h-screen flex-col">
        <div className="border-b border-[var(--admin-border)] px-5 py-5">
          <div className="relative overflow-hidden rounded-[1.6rem] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            <div className="pointer-events-none absolute inset-x-8 top-0 h-20 rounded-full bg-white/10 blur-3xl" />
            <div className="relative">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--admin-muted)]">
                Skyvan
              </p>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--admin-text)]">
                Admin Core
              </h1>
              <p className="mt-3 text-sm leading-6 text-[var(--admin-muted)]">
                Veri, kural ve operasyon omurgası
              </p>
            </div>
          </div>
        </div>

        <div className="custom-scrollbar flex-1 overflow-y-auto px-3 py-4">
          <AdminSidebarClient />
        </div>
      </div>
    </aside>
  );
}
