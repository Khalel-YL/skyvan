import type { ReactNode } from "react";

import { getAdminHealth } from "@/app/lib/admin/admin-health";
import { AdminShell } from "./_components/admin-shell";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const health = getAdminHealth();

  return (
    <AdminShell
      databaseStatus={health.status}
      databaseNote={health.note}
    >
      {children}
    </AdminShell>
  );
}