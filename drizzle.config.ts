import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./db/schema.ts", // Şemamızın olduğu yer
  out: "./db/migrations",   // Çıktıların kaydedileceği yer
  dialect: "postgresql",    // Motor tipimiz
  dbCredentials: {
    url: process.env.DATABASE_URL!, // Gizli bağlantı şifremiz
  },
});