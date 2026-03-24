import type { ReactNode } from "react";

import { AdminShell } from "./_components/admin-shell";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminShell
      databaseStatus="degraded"
      databaseNote="Admin core static mode aktif."
    >
      {children}
    </AdminShell>
  );
}