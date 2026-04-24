import "server-only";

import { db, getDbOrThrow } from "@/db/db";

export function isDatabaseConfigured() {
  return Boolean(db);
}

export function requireDatabase() {
  return getDbOrThrow();
}