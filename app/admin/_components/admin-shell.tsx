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
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.09),transparent_28%),radial-gradient(circle_at_bottom,rgba(255,255,255,0.04),transparent_24%)]" />
      <div className="relative flex min-h-screen">
        <AdminSidebar />

        <div className="min-w-0 flex-1">
          <AdminTopbar
            databaseStatus={databaseStatus}
            databaseNote={databaseNote}
          />
          <main className="px-5 py-6 md:px-8 md:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}