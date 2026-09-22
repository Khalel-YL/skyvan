import { AdminSidebarClient } from "./admin-sidebar-client";

export function AdminSidebar() {
  return (
    <aside className="hidden w-[17rem] shrink-0 border-r border-[var(--admin-border)] bg-[var(--admin-rail)] xl:block">
      <div className="sticky top-0 flex h-screen flex-col">
        <div className="border-b border-[var(--admin-border)] px-4 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--admin-muted)]">
            Skyvan
          </p>
          <h1 className="mt-1 text-lg font-semibold tracking-tight text-[var(--admin-text)]">
            Admin
          </h1>
        </div>

        <div className="custom-scrollbar flex-1 overflow-y-auto px-2.5 py-3">
          <AdminSidebarClient />
        </div>
      </div>
    </aside>
  );
}
