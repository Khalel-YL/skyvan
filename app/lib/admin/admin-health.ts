import "server-only";

import { getDatabaseHealth } from "@/db/db";

export function getAdminHealth() {
  return getDatabaseHealth();
}