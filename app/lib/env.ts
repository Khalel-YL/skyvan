import "server-only";

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const env = {
  DATABASE_URL: getRequiredEnv("DATABASE_URL"),
  NODE_ENV: process.env.NODE_ENV ?? "development",
};