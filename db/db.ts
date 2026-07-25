import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";

export const hasDatabaseUrl = databaseUrl.length > 0;

const sql = hasDatabaseUrl ? neon(databaseUrl) : null;

export const db = sql ? drizzle(sql) : null;

type TransactionSqlClient = ReturnType<typeof postgres>;

const globalForTransactionDb = globalThis as typeof globalThis & {
  skyvanTransactionSql?: TransactionSqlClient;
};

const transactionSql =
  hasDatabaseUrl
    ? globalForTransactionDb.skyvanTransactionSql ??
      postgres(databaseUrl, {
        max: 3,
        idle_timeout: 20,
        connect_timeout: 10,
        prepare: false,
      })
    : null;

if (transactionSql && process.env.NODE_ENV !== "production") {
  globalForTransactionDb.skyvanTransactionSql = transactionSql;
}

export const transactionDb = transactionSql
  ? drizzlePostgres(transactionSql, { schema })
  : null;

export type TransactionDatabase = NonNullable<typeof transactionDb>;
export type TransactionClient = Parameters<
  Parameters<TransactionDatabase["transaction"]>[0]
>[0];

export function getDbOrThrow() {
  if (!db) {
    throw new Error("DATABASE_URL is missing");
  }

  return db;
}

export function getTransactionDbOrThrow() {
  if (!transactionDb) {
    throw new Error("DATABASE_URL is missing");
  }

  return transactionDb;
}

export async function runDatabaseTransaction<T>(
  callback: (tx: TransactionClient) => Promise<T>,
) {
  const database = getTransactionDbOrThrow();

  return database.transaction(callback);
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
