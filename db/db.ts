import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";

export const hasDatabaseUrl = databaseUrl.length > 0;

const sql = hasDatabaseUrl ? neon(databaseUrl) : null;

export const db = sql ? drizzle(sql) : null;

export function getDbOrThrow() {
  if (!db) {
    throw new Error("DATABASE_URL is missing");
  }

  return db;
}

export function getDatabaseHealth() {
  if (!hasDatabaseUrl) {
    return {
      status: "degraded" as const,
      note: "DATABASE_URL tanımlı değil. Admin güvenli statik modda çalışıyor.",
    };
  }

  return {
    status: "online" as const,
    note: "Veritabanı bağlantısı yapılandırılmış görünüyor.",
  };
}

export function getDatabaseDebugInfo() {
  return {
    hasDatabaseUrl,
    databaseUrlPreview: databaseUrl.slice(0, 80),
  };
}