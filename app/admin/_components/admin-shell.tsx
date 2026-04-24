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
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px]">
        <AdminSidebar />

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <AdminTopbar
            databaseStatus={databaseStatus}
            databaseNote={databaseNote}
          />

          <main className="flex-1 p-4 md:p-6">
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}