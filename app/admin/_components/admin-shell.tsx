import type { ReactNode } from "react";

import { AdminSidebar } from "./admin-sidebar";
import { AdminTopbar } from "./admin-topbar";

type AdminShellProps = {
  children: ReactNode;
  databaseStatus: "online" | "degraded";
  databaseNote: string;
};

export function AdminShell({
  children,
  databaseStatus,
  databaseNote,
}: AdminShellProps) {
  return (
    <div className="admin-shell min-h-screen overflow-x-clip bg-[var(--admin-bg)] text-[var(--admin-text)]">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_50%_-10%,rgba(255,255,255,0.13),transparent_36rem)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-[1920px]">
        <AdminSidebar />

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <AdminTopbar
            databaseStatus={databaseStatus}
            databaseNote={databaseNote}
          />

          <main className="flex-1 px-4 py-5 md:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-[1760px]">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
